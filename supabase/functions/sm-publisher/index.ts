
// XRMG Social Media OS Publisher v3
// Multi-brand/multi-credential Buffer worker. Secrets live in Supabase Vault.
// Auth: x-sm-secret for cron, or authenticated XRMG member JWT for manual/admin actions.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const BUFFER_URL = "https://api.buffer.com";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-sm-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const sb = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

type Kind = "auth" | "rate" | "mutation" | "network" | "server";
class BufferError extends Error {
  constructor(public kind: Kind, message: string, public retryIn?: number) {
    super(message);
  }
}

type CreativeAsset = { type?: string; url?: string; thumbnailOffset?: number };

interface Row {
  queue_id: string;
  action: "enviar" | "reconciliar" | "confirmar" | "cancelar";
  post_text: string;
  due_at: string;
  channel_id: string;
  platform: string;
  format: string;
  asset_url: string | null;
  creative_assets: CreativeAsset[] | null;
  external_post_id: string | null;
  attempts: number;
  max_attempts: number;
  idempotency_key: string;
  provider: string;
  provider_connection_id: string | null;
  organization_id: string | null;
}

interface Connection {
  id: string;
  brand_id: string;
  organization_id: string | null;
  status: string;
  label: string;
  meta: Record<string, unknown>;
}

interface Api {
  create(row: Row): Promise<{ id: string }>;
  find(row: Row): Promise<{ id: string } | null>;
  status(id: string): Promise<{ status: string; url?: string; error?: string }>;
  remove(id: string): Promise<void>;
}

type GraphQLError = {
  message?: string;
  extensions?: { code?: string };
};

type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};

type BufferOrganization = {
  id: string;
  name: string;
};

type BufferAccountData = {
  id?: string;
  email?: string;
  name?: string;
  organizations?: BufferOrganization[];
};

type BufferChannelData = {
  id: string;
  name: string;
  displayName?: string | null;
  service: string;
  type?: string | null;
  isDisconnected?: boolean;
  isLocked?: boolean;
  isQueuePaused?: boolean;
  externalLink?: string | null;
  avatar?: string | null;
};

type BufferPostEdge = {
  node: {
    id: string;
    text?: string | null;
    dueAt?: string | null;
    status?: string | null;
  };
};

type BufferMetricData = {
  type: string;
  name?: string | null;
  value: number;
  unit?: string | null;
};

type BufferAssetInput =
  | { image: { url: string } }
  | { video: { url: string; metadata?: { thumbnailOffset: number } } };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

function retryFromHeaders(res: Response): number {
  const h = res.headers.get("ratelimit") ?? "";
  let wait = 0;
  for (const part of h.split(/,\s*(?=")/)) {
    const r = /;\s*r=(\d+)/.exec(part);
    const t = /;\s*t=(\d+)/.exec(part);
    if (r && t && Number(r[1]) === 0) wait = Math.max(wait, Number(t[1]));
  }
  return wait || 900;
}

async function gql<T>(
  key: string,
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(BUFFER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (e) {
    throw new BufferError("network", `Sem resposta do Buffer: ${(e as Error).message}`);
  }

  if (res.status === 429) throw new BufferError("rate", "Limite de requisições do Buffer atingido", retryFromHeaders(res));
  if (res.status === 401 || res.status === 403) throw new BufferError("auth", "Chave do Buffer recusada");
  if (res.status >= 500) throw new BufferError("server", `Buffer respondeu ${res.status}`);

  let body: GraphQLResponse<T>;
  try {
    body = (await res.json()) as GraphQLResponse<T>;
  } catch {
    throw new BufferError("network", "Resposta ilegível do Buffer");
  }

  if (body.errors?.length) {
    const msg = body.errors.map((error) => error.message ?? "Buffer GraphQL error").join("; ");
    const code = String(body.errors[0]?.extensions?.code ?? "");
    if (/unauth|forbidden|invalid.*(token|key)|api key/i.test(msg + " " + code)) {
      throw new BufferError("auth", msg);
    }
    if (/rate.?limit|too many/i.test(msg + " " + code)) {
      throw new BufferError("rate", msg, retryFromHeaders(res));
    }
    throw new BufferError("server", msg);
  }
  if (body.data === undefined) {
    throw new BufferError("server", "Resposta do Buffer sem campo data");
  }
  return body.data;
}

async function getConnection(connectionId: string): Promise<{ connection: Connection; key: string }> {
  const { data: connection, error } = await sb
    .from("sm_provider_connections")
    .select("id,brand_id,organization_id,status,label,meta")
    .eq("id", connectionId)
    .single();

  if (error || !connection) throw new BufferError("mutation", "Conexão Buffer não encontrada");
  if (connection.status === "disabled") throw new BufferError("mutation", "Conexão Buffer desativada");

  const { data: key, error: keyError } = await sb.rpc("sm_get_connection_secret", {
    p_connection: connectionId,
  });
  if (keyError || !key) throw new BufferError("auth", "Chave Buffer ainda não configurada para esta conexão");

  return { connection: connection as Connection, key: key as string };
}

async function verifyConnection(connectionId: string) {
  const { connection, key } = await getConnection(connectionId);
  const data = await gql<{ account?: BufferAccountData }>(
    key,
    "query { account { id email name organizations { id name } } }",
    {},
  );
  const account = data?.account;
  const orgs = account?.organizations ?? [];

  let org = connection.organization_id
    ? orgs.find((item) => item.id === connection.organization_id)
    : null;

  if (!org && orgs.length === 1) org = orgs[0];
  if (!org) {
    await sb.rpc("sm_connection_mark_verified", {
      p_connection: connectionId,
      p_ok: false,
      p_external_account_id: account?.id ?? null,
      p_organization_id: null,
      p_error: "Organização Buffer não encontrada ou ambígua",
      p_meta: {
        account_email: account?.email ?? null,
        organizations: orgs.map((organization) => ({ id: organization.id, name: organization.name })),
      },
    });
    throw new BufferError("mutation", "A organização configurada não pertence a esta chave Buffer");
  }

  await sb.rpc("sm_connection_mark_verified", {
    p_connection: connectionId,
    p_ok: true,
    p_external_account_id: account?.id ?? null,
    p_organization_id: org.id,
    p_error: null,
    p_meta: { account_email: account?.email ?? null, account_name: account?.name ?? null, organization_name: org.name },
  });

  const channelsData = await gql<{ channels?: BufferChannelData[] }>(
    key,
    `query($input: ChannelsInput!) {
      channels(input: $input) {
        id name displayName service type isDisconnected isLocked isQueuePaused externalLink avatar
      }
    }`,
    { input: { organizationId: org.id } },
  );

  const channels = channelsData?.channels ?? [];
  const serviceMap: Record<string, string> = {
    twitter: "x",
    x: "x",
    instagram: "instagram",
    facebook: "facebook",
    linkedin: "linkedin",
    tiktok: "tiktok",
    threads: "threads",
    youtube: "youtube",
    pinterest: "pinterest",
    bluesky: "bluesky",
    googlebusiness: "googlebusiness",
    mastodon: "mastodon",
  };

  for (const channel of channels) {
    const platform = serviceMap[String(channel.service ?? "").toLowerCase()];
    if (!platform) continue;
    const handle = channel.name || channel.displayName || channel.id;
    await sb.from("sm_accounts").upsert(
      {
        brand_id: connection.brand_id,
        platform,
        handle,
        url: channel.externalLink ?? null,
        buffer_channel_id: channel.id,
        provider: "buffer",
        provider_channel_id: channel.id,
        provider_connection_id: connectionId,
        provider_meta: {
          organization_id: org.id,
          organization_name: org.name,
          service: channel.service,
          channel_type: channel.type,
          display_name: channel.displayName,
          avatar: channel.avatar,
        },
        status: channel.isDisconnected || channel.isLocked ? "desconectada" : "conectada",
        paused: Boolean(channel.isQueuePaused),
      },
      { onConflict: "brand_id,platform,handle" },
    );
  }

  return {
    account: { id: account?.id, email: account?.email, name: account?.name },
    organization: org,
    channels,
  };
}

function buildAssets(row: Row) {
  const assets: BufferAssetInput[] = [];
  for (const item of row.creative_assets ?? []) {
    if (!item?.url || !/^https:\/\//i.test(item.url)) continue;
    if (item.type === "video") {
      assets.push({
        video: {
          url: item.url,
          ...(typeof item.thumbnailOffset === "number"
            ? { metadata: { thumbnailOffset: Math.max(0, Math.floor(item.thumbnailOffset)) } }
            : {}),
        },
      });
    } else if (item.type === "image") {
      assets.push({ image: { url: item.url } });
    }
  }
  if (!assets.length && row.asset_url) {
    assets.push(
      row.format === "video_curto"
        ? { video: { url: row.asset_url } }
        : { image: { url: row.asset_url } },
    );
  }
  return assets;
}

function realApi(key: string, organizationId: string | null): Api {
  return {
    async create(row) {
      const assets = buildAssets(row);

      if (["instagram", "tiktok"].includes(row.platform) && assets.length === 0) {
        throw new BufferError("mutation", "Esta rede exige mídia final pública");
      }
      if (
        row.platform === "instagram" &&
        row.format === "video_curto" &&
        !assets.some((a) => a.video)
      ) {
        throw new BufferError("mutation", "Reel do Instagram exige vídeo");
      }
      if (["pinterest", "youtube"].includes(row.platform)) {
        throw new BufferError("mutation", "Metadados específicos desta rede ainda não estão configurados");
      }

      const input: Record<string, unknown> = {
        text: row.post_text,
        channelId: row.channel_id,
        schedulingType: "automatic",
        mode: "customScheduled",
        dueAt: new Date(row.due_at).toISOString(),
        assets,
      };

      if (row.platform === "instagram") {
        input.metadata = {
          instagram: {
            type: row.format === "story" ? "story" : row.format === "video_curto" ? "reel" : "post",
            shouldShareToFeed: true,
          },
        };
      } else if (row.platform === "tiktok") {
        input.metadata = { tiktok: {} };
      }

      const data = await gql<{
        createPost?: { post?: { id: string; dueAt?: string | null; status?: string | null }; message?: string };
      }>(
        key,
        `mutation($input: CreatePostInput!) {
          createPost(input: $input) {
            __typename
            ... on PostActionSuccess { post { id dueAt status } }
            ... on MutationError { message }
          }
        }`,
        { input },
      );
      const result = data?.createPost;
      if (result?.post?.id) return { id: result.post.id };
      throw new BufferError("mutation", result?.message ?? "O Buffer recusou o post");
    },

    async find(row) {
      if (!organizationId) throw new BufferError("mutation", "Organização Buffer não configurada");
      const due = new Date(row.due_at).getTime();
      const data = await gql<{ posts?: { edges?: BufferPostEdge[] } }>(
        key,
        `query($input: PostsInput!) {
          posts(first: 50, input: $input) {
            edges { node { id text dueAt status } }
          }
        }`,
        {
          input: {
            organizationId,
            filter: {
              channelIds: [row.channel_id],
              dueAt: {
                start: new Date(due - 120000).toISOString(),
                end: new Date(due + 120000).toISOString(),
              },
              status: ["scheduled", "sending", "sent", "error"],
            },
          },
        },
      );
      const hit = (data.posts?.edges ?? []).find(
        (edge) => (edge.node.text ?? "").trim() === row.post_text.trim(),
      );
      return hit ? { id: hit.node.id } : null;
    },

    async status(id) {
      const data = await gql<{
        post?: {
          id: string;
          status?: string | null;
          externalLink?: string | null;
          error?: { message?: string | null } | null;
        };
      }>(
        key,
        `query($input: PostInput!) {
          post(input: $input) { id status externalLink error { message } }
        }`,
        { input: { id } },
      );
      const p = data?.post;
      return {
        status: p?.status ?? "unknown",
        url: p?.externalLink ?? undefined,
        error: p?.error?.message ?? undefined,
      };
    },

    async remove(id) {
      const data = await gql<{ deletePost?: { __typename?: string } }>(
        key,
        `mutation($input: DeletePostInput!) {
          deletePost(input: $input) { __typename }
        }`,
        { input: { id } },
      );
      if (data?.deletePost?.__typename !== "DeletePostSuccess") {
        throw new BufferError("mutation", "O Buffer não confirmou a exclusão");
      }
    },
  };
}

function simApi(s: string): Api {
  return {
    create(row) {
      if (s === "timeout") return Promise.reject(new BufferError("network", "Tempo esgotado (simulado)"));
      if (s === "server_error") return Promise.reject(new BufferError("server", "Buffer respondeu 503 (simulado)"));
      if (s === "mutation_error") return Promise.reject(new BufferError("mutation", "Conteúdo inválido (simulado)"));
      if (s === "rate_limit") return Promise.reject(new BufferError("rate", "Limite de requisições (simulado)", 900));
      if (s === "auth_error") return Promise.reject(new BufferError("auth", "Chave recusada (simulado)"));
      return Promise.resolve({ id: `sim_${row.queue_id.slice(0, 8)}` });
    },
    find(row) {
      if (s === "find_error") return Promise.reject(new BufferError("network", "Tempo esgotado (simulado)"));
      return Promise.resolve(s === "found" ? { id: `sim_found_${row.queue_id.slice(0, 8)}` } : null);
    },
    status(id) {
      if (s === "sent") return Promise.resolve({ status: "sent", url: `https://example.test/post/${id}` });
      if (s === "error") return Promise.resolve({ status: "error", error: "Canal desconectado (simulado)" });
      return Promise.resolve({ status: "scheduled" });
    },
    remove() {
      return s === "delete_error"
        ? Promise.reject(new BufferError("server", "Falha ao excluir (simulado)"))
        : Promise.resolve();
    },
  };
}

const backoff = (attempts: number) => Math.min(60 * 2 ** attempts, 3600);
const move = (id: string, status: string, detail: Record<string, unknown> = {}) =>
  sb.rpc("sm_queue_transition", { p_id: id, p_status: status, p_detail: detail });

async function runQueue(test: boolean, scenario?: string) {
  const { data, error } = await sb.rpc("sm_claim_due_v3", { p_limit: 20, p_test: test });
  if (error) return { ok: false, error: error.message };

  const rows = (data ?? []) as Row[];
  const results: Record<string, unknown>[] = [];
  const halted = new Map<string, BufferError>();
  const apiCache = new Map<string, { api: Api; connection: Connection }>();

  for (const row of rows) {
    const out = async (status: string, detail: Record<string, unknown> = {}) => {
      const { data: t } = await move(row.queue_id, status, { action: row.action, ...detail });
      results.push({
        key: row.idempotency_key,
        action: row.action,
        connection: row.provider_connection_id,
        status: t?.status ?? status,
      });
    };

    if (test && scenario) {
      const api = simApi(scenario);
      try {
        if (row.action === "confirmar") {
          const s = await api.status(row.external_post_id!);
          if (s.status === "sent") await out("publicado", { external_url: s.url ?? null });
          else if (s.status === "error") await out("falhou", { error: s.error ?? "Erro simulado" });
          else await out("enviado_api", { retry_in_seconds: 300 });
        } else {
          const created = await api.create(row);
          await out("enviado_api", { external_post_id: created.id });
        }
      } catch (e) {
        await out("incerto", { error: (e as Error).message, retry_in_seconds: 300, count_attempt: true });
      }
      continue;
    }

    if (!row.provider_connection_id) {
      await out("pendente", { error: "Conta sem conexão Buffer configurada", retry_in_seconds: 1800 });
      continue;
    }

    const stop = halted.get(row.provider_connection_id);
    if (stop) {
      await out(
        row.action === "enviar" ? "pendente" : row.action === "reconciliar" ? "incerto" : row.action === "confirmar" ? "enviado_api" : "cancelando",
        { retry_in_seconds: stop.retryIn ?? 900, error: `Conexão pausada neste lote: ${stop.message}` },
      );
      continue;
    }

    let cached = apiCache.get(row.provider_connection_id);
    if (!cached) {
      try {
        const { connection, key } = await getConnection(row.provider_connection_id);
        cached = { connection, api: realApi(key, connection.organization_id) };
        apiCache.set(row.provider_connection_id, cached);
      } catch (e) {
        const be = e instanceof BufferError ? e : new BufferError("auth", (e as Error).message);
        halted.set(row.provider_connection_id, be);
        await out("pendente", { retry_in_seconds: 1800, error: be.message });
        await sb.rpc("sm_raise_alert", {
          p_key: `buffer_connection_${row.provider_connection_id}`,
          p_severity: "erro",
          p_title: "Conexão Buffer precisa de atenção",
          p_action: "Abra o Social Media OS e configure ou substitua a chave desta conexão.",
        });
        continue;
      }
    }

    const api = cached.api;

    try {
      if (row.action === "cancelar") {
        let externalId = row.external_post_id;
        if (!externalId) {
          const found = await api.find(row);
          if (!found) {
            await out("cancelando", {
              error: "Resultado remoto desconhecido. Reconciliação manual necessária.",
              count_attempt: true,
              retry_in_seconds: 3600,
            });
            continue;
          }
          externalId = found.id;
        }
        await api.remove(externalId);
        await out("cancelado");
        continue;
      }

      if (row.action === "confirmar") {
        const s = await api.status(row.external_post_id!);
        if (s.status === "sent") await out("publicado", { external_url: s.url ?? null });
        else if (s.status === "error") await out("falhou", { error: s.error ?? "O Buffer informou erro ao publicar" });
        else await out("enviado_api", { retry_in_seconds: 300, buffer_status: s.status });
        continue;
      }

      if (row.action === "reconciliar") {
        try {
          const found = await api.find(row);
          if (found) {
            await out("enviado_api", { external_post_id: found.id, reconciled: true });
          } else {
            await out("incerto", {
              retry_in_seconds: 3600,
              count_attempt: true,
              error: "Sem confirmação remota; não reenviado para evitar duplicação.",
            });
          }
        } catch (e) {
          const be = e as BufferError;
          await out("incerto", {
            retry_in_seconds: backoff(row.attempts + 1),
            count_attempt: true,
            error: `Reconciliação falhou: ${be.message}`,
          });
          if (be.kind === "rate" || be.kind === "auth") halted.set(row.provider_connection_id, be);
        }
        continue;
      }

      const created = await api.create(row);
      await out("enviado_api", { external_post_id: created.id });
    } catch (e) {
      const be = e instanceof BufferError ? e : new BufferError("network", (e as Error).message);

      if (row.action === "cancelar") {
        await out("cancelando", { error: be.message });
      } else if (row.action === "confirmar") {
        await out("enviado_api", { retry_in_seconds: 300, error: be.message });
      } else if (be.kind === "mutation") {
        await out("falhou", { error: be.message, count_attempt: true });
      } else if (be.kind === "rate") {
        await out("pendente", { retry_in_seconds: be.retryIn ?? 900, error: be.message });
        halted.set(row.provider_connection_id, be);
      } else if (be.kind === "auth") {
        await out("pendente", { retry_in_seconds: 1800, error: be.message });
        halted.set(row.provider_connection_id, be);
        await sb.rpc("sm_connection_mark_verified", {
          p_connection: row.provider_connection_id,
          p_ok: false,
          p_external_account_id: null,
          p_organization_id: null,
          p_error: be.message,
          p_meta: {},
        });
      } else {
        await out("incerto", {
          retry_in_seconds: backoff(row.attempts + 1),
          count_attempt: true,
          error: be.message,
        });
      }
    }
  }

  return { ok: true, claimed: rows.length, halted_connections: halted.size, results };
}

async function runMetrics() {
  const { data } = await sb.rpc("sm_published_for_metrics_v2", { p_days: 90 });
  const rows = ((data ?? []) as {
    queue_id: string;
    external_post_id: string;
    provider_connection_id: string | null;
  }[]).slice(0, 40);

  let observed = 0;
  let pending = 0;
  let noData = 0;
  let errors = 0;
  const keyCache = new Map<string, string>();

  for (const row of rows) {
    if (!row.provider_connection_id) {
      errors++;
      continue;
    }

    try {
      let key = keyCache.get(row.provider_connection_id);
      if (!key) {
        key = (await getConnection(row.provider_connection_id)).key;
        keyCache.set(row.provider_connection_id, key);
      }

      const d = await gql<{
        post?: {
          externalLink?: string | null;
          metrics?: BufferMetricData[] | null;
          metricsUpdatedAt?: string | null;
        };
      }>(
        key,
        `query($input: PostInput!) {
          post(input: $input) {
            externalLink
            metrics { type name value unit }
            metricsUpdatedAt
          }
        }`,
        { input: { id: row.external_post_id } },
      );

      const post = d?.post;
      const syncedAt = new Date().toISOString();

      const { data: q } = await sb
        .from("sm_queue")
        .select("content_id,brand_id")
        .eq("id", row.queue_id)
        .single();

      if (!q) {
        errors++;
        continue;
      }

      if (post?.externalLink) {
        await sb.from("sm_queue").update({ external_url: post.externalLink, updated_at: syncedAt }).eq("id", row.queue_id);
      }

      if (!post?.metricsUpdatedAt || post?.metrics == null) {
        pending++;
        await sb.from("sm_metric_syncs").upsert(
          {
            queue_id: row.queue_id,
            content_id: q.content_id,
            brand_id: q.brand_id,
            provider: "buffer",
            status: "pending",
            metrics_updated_at: post?.metricsUpdatedAt ?? null,
            last_synced_at: syncedAt,
            last_error: null,
            detail: { reason: "buffer_metrics_not_ingested_yet" },
          },
          { onConflict: "queue_id" },
        );
        continue;
      }

      if (!post.metrics.length) {
        noData++;
        await sb.from("sm_metric_syncs").upsert(
          {
            queue_id: row.queue_id,
            content_id: q.content_id,
            brand_id: q.brand_id,
            provider: "buffer",
            status: "no_data",
            metrics_updated_at: post.metricsUpdatedAt,
            last_synced_at: syncedAt,
            last_error: null,
            detail: { reason: "provider_returned_empty_metric_set" },
          },
          { onConflict: "queue_id" },
        );
        continue;
      }

      const collectedOn = String(post.metricsUpdatedAt).slice(0, 10);
      const metricRows = post.metrics
        .filter((metric) => Number.isFinite(Number(metric.value)))
        .map((metric) => ({
          queue_id: row.queue_id,
          content_id: q.content_id,
          brand_id: q.brand_id,
          metric_type: metric.type,
          metric_name: metric.name ?? null,
          value: Number(metric.value),
          unit: metric.unit ?? null,
          collected_on: collectedOn,
          source: "buffer",
          metrics_updated_at: post.metricsUpdatedAt,
          collected_at: syncedAt,
        }));

      if (metricRows.length) {
        await sb.from("sm_metrics").upsert(metricRows, {
          onConflict: "queue_id,metric_type,collected_on",
        });
      }

      observed++;
      await sb.from("sm_metric_syncs").upsert(
        {
          queue_id: row.queue_id,
          content_id: q.content_id,
          brand_id: q.brand_id,
          provider: "buffer",
          status: metricRows.length ? "observed" : "no_data",
          metrics_updated_at: post.metricsUpdatedAt,
          last_synced_at: syncedAt,
          last_error: null,
          detail: { metric_count: metricRows.length, external_link: post.externalLink ?? null },
        },
        { onConflict: "queue_id" },
      );
    } catch (e) {
      errors++;
      const message = (e as Error).message;
      const { data: q } = await sb
        .from("sm_queue")
        .select("content_id,brand_id")
        .eq("id", row.queue_id)
        .single();
      if (q) {
        await sb.from("sm_metric_syncs").upsert(
          {
            queue_id: row.queue_id,
            content_id: q.content_id,
            brand_id: q.brand_id,
            provider: "buffer",
            status: "error",
            last_synced_at: new Date().toISOString(),
            last_error: message,
            detail: {},
          },
          { onConflict: "queue_id" },
        );
      }
    }
  }

  return { ok: errors === 0, posts: rows.length, observed, pending, no_data: noData, errors };
}

async function authorize(req: Request): Promise<{ via: "cron" | "user"; role?: string } | null> {
  const secret = req.headers.get("x-sm-secret");
  if (secret) {
    const { data } = await sb.rpc("sm_check_cron_secret", { p_secret: secret });
    return data === true ? { via: "cron" } : null;
  }

  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data } = await sb.auth.getUser(token);
  const email = data?.user?.email;
  if (!email) return null;
  const { data: role } = await sb.rpc("sm_member_role", { p_email: email });
  return role ? { via: "user", role: role as string } : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405);

  const who = await authorize(req);
  if (!who) return json({ error: "Não autorizado" }, 401);

  let body: {
    mode?: string;
    simulate?: string;
    connectionId?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    // empty body
  }

  const mode = body.mode ?? "run";

  if (body.simulate) {
    if (who.via !== "cron") return json({ error: "Simulação restrita" }, 403);
    return json({
      mode: "simulate",
      scenario: body.simulate,
      ...(await runQueue(true, body.simulate)),
    });
  }

  try {
    if (mode === "channels" || mode === "verify_connection") {
      if (who.via === "user" && who.role !== "admin") {
        return json({ error: "Apenas administradores" }, 403);
      }
      if (!body.connectionId) return json({ error: "connectionId obrigatório" }, 400);
      return json({ mode, ...(await verifyConnection(body.connectionId)) });
    }

    if (mode === "metrics") {
      if (who.via === "user" && !["admin", "aprovador"].includes(who.role ?? "")) {
        return json({ error: "Sem permissão" }, 403);
      }
      return json({ mode, ...(await runMetrics()) });
    }

    if (who.via === "user" && !["admin", "aprovador"].includes(who.role ?? "")) {
      return json({ error: "Sem permissão" }, 403);
    }

    return json({ mode: "run", ...(await runQueue(false)) });
  } catch (e) {
    const be = e instanceof BufferError ? e : new BufferError("server", (e as Error).message);
    return json(
      { mode, ok: false, kind: be.kind, error: be.message },
      be.kind === "auth" ? 401 : be.kind === "mutation" ? 400 : 502,
    );
  }
});
