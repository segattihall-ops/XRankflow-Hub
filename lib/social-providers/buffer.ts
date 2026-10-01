type BufferOrganization = { id: string; name: string }

export type BufferChannel = {
  id: string
  name: string
  displayName?: string | null
  service: string
  avatar?: string | null
  isQueuePaused?: boolean
  isDisconnected?: boolean
  isLocked?: boolean
  externalLink?: string | null
  organizationId?: string
}

type GraphQLResponse<T> = {
  data?: T
  errors?: Array<{ message?: string }>
}

const endpoint = 'https://api.buffer.com'

export function bufferConfigured() {
  return Boolean(process.env.BUFFER_API_KEY?.trim())
}

function apiKey() {
  const key = process.env.BUFFER_API_KEY?.trim()
  if (!key) throw new Error('buffer_not_configured')
  return key
}

function q(value: string) {
  return JSON.stringify(value)
}

async function bufferGraphQL<T>(query: string): Promise<T> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ query }),
    cache: 'no-store',
  })

  const json = (await response.json()) as GraphQLResponse<T>
  if (!response.ok) {
    throw new Error(`buffer_http_${response.status}`)
  }
  if (json.errors?.length) {
    throw new Error(json.errors.map((error) => error.message || 'buffer_graphql_error').join('; '))
  }
  if (!json.data) throw new Error('buffer_empty_response')
  return json.data
}

export async function getBufferOrganizations(): Promise<BufferOrganization[]> {
  const data = await bufferGraphQL<{
    account?: { organizations?: BufferOrganization[] }
  }>(`
    query BufferOrganizations {
      account {
        organizations {
          id
          name
        }
      }
    }
  `)
  return data.account?.organizations ?? []
}

export async function getBufferChannels(organizationId: string): Promise<BufferChannel[]> {
  const data = await bufferGraphQL<{ channels?: BufferChannel[] }>(`
    query BufferChannels {
      channels(input: { organizationId: ${q(organizationId)} }) {
        id
        name
        displayName
        service
        avatar
        isQueuePaused
        isDisconnected
        isLocked
        externalLink
        organizationId
      }
    }
  `)
  return data.channels ?? []
}

export async function listAllBufferChannels() {
  const organizations = await getBufferOrganizations()
  const results = await Promise.all(
    organizations.map(async (organization) => ({
      organization,
      channels: await getBufferChannels(organization.id),
    })),
  )
  return results
}

export type BufferCreativeAsset = {
  type: 'image' | 'video'
  url: string
  thumbnailOffset?: number
}

function assetLiteral(asset: BufferCreativeAsset) {
  if (asset.type === 'video') {
    const metadata = typeof asset.thumbnailOffset === 'number'
      ? ` metadata: { thumbnailOffset: ${Math.max(0, Math.floor(asset.thumbnailOffset))} }`
      : ''
    return `{ video: { url: ${q(asset.url)}${metadata} } }`
  }
  return `{ image: { url: ${q(asset.url)} } }`
}

function metadataLiteral(platform?: string, format?: string) {
  if (platform !== 'instagram') return ''
  const type = format === 'video_curto' ? 'reel' : format === 'story' ? 'story' : 'post'
  return ` metadata: { instagram: { type: ${type} shouldShareToFeed: true } }`
}

export async function createBufferScheduledPost(input: {
  channelId: string
  text: string
  dueAt: string
  platform?: string
  format?: string
  assets?: BufferCreativeAsset[]
}) {
  const assets = input.assets ?? []
  const assetsClause = assets.length
    ? ` assets: [${assets.map(assetLiteral).join(' ')}]`
    : ''
  const metadataClause = metadataLiteral(input.platform, input.format)

  const data = await bufferGraphQL<{
    createPost?: {
      post?: {
        id: string
        dueAt?: string | null
        status?: string | null
        text?: string | null
      }
      message?: string
    }
  }>(`
    mutation CreateScheduledPost {
      createPost(input: {
        text: ${q(input.text)}
        channelId: ${q(input.channelId)}
        schedulingType: automatic
        mode: customScheduled
        dueAt: ${q(input.dueAt)}
        ${assetsClause}
        ${metadataClause}
      }) {
        ... on PostActionSuccess {
          post {
            id
            dueAt
            status
            text
          }
        }
        ... on MutationError {
          message
        }
      }
    }
  `)

  const result = data.createPost
  if (!result?.post?.id) {
    throw new Error(result?.message || 'buffer_create_post_failed')
  }
  return result.post
}

export async function findBufferPost(input: {
  organizationId: string
  channelId: string
  postId: string
}) {
  const data = await bufferGraphQL<{
    posts?: {
      edges?: Array<{
        node?: {
          id: string
          status?: string | null
          dueAt?: string | null
          sentAt?: string | null
          text?: string | null
          channelId?: string | null
          error?: { message?: string | null } | null
        }
      }>
    }
  }>(`
    query ReconcilePost {
      posts(
        first: 100
        input: {
          organizationId: ${q(input.organizationId)}
          filter: {
            channelIds: [${q(input.channelId)}]
            status: [draft, needs_approval, scheduled, sending, sent, error]
          }
          sort: [{ field: createdAt, direction: desc }]
        }
      ) {
        edges {
          node {
            id
            status
            dueAt
            sentAt
            text
            channelId
          }
        }
      }
    }
  `)

  return data.posts?.edges?.map((edge) => edge.node).find((post) => post?.id === input.postId) ?? null
}
