import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

function authed(req: NextRequest) {
  const t = (req.headers.get('authorization') || '').replace('Bearer ', '');
  return t ? verifyToken(t) : null;
}

export async function POST(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body: any = await req.json().catch(() => ({}));
  const tool: string = (body && body.tool) || '';
  const args: any = (body && body.args) || {};
  try {
    if (tool.includes('getRecords')) return NextResponse.json(await zohoLeads(args));
    if (tool.includes('list_deployments')) return NextResponse.json(await vercelDeploys(args));
    if (tool.includes('get_advisors')) return NextResponse.json(await supaAdvisors(args));
    if (tool.includes('search_threads')) return NextResponse.json({ threads: [] });
    if (tool.includes('list_recent_files') || tool.includes('search_files')) return NextResponse.json({ files: [] });
    return NextResponse.json({});
  } catch (e) {
    return NextResponse.json({ error: String(e) });
  }
}

async function zohoToken(): Promise<string | null> {
  const id = process.env.ZOHO_CLIENT_ID, sec = process.env.ZOHO_CLIENT_SECRET, rt = process.env.ZOHO_REFRESH_TOKEN;
  if (!id || !sec || !rt) return null;
  const base = process.env.ZOHO_ACCOUNTS || 'https://accounts.zoho.com';
  const url = base + '/oauth/v2/token?grant_type=refresh_token&client_id=' + encodeURIComponent(id) + '&client_secret=' + encodeURIComponent(sec) + '&refresh_token=' + encodeURIComponent(rt);
  const r = await fetch(url, { method: 'POST' });
  const data: any = await r.json();
  return data.access_token || null;
}
async function zohoLeads(args: any) {
  const tok = await zohoToken();
  if (!tok) return { data: { data: [], info: { count: 0, more_records: false } }, status: 'unconfigured' };
  const qp = (args && args.query_params) || {};
  const per = qp.per_page || 200;
  const fields = qp.fields || 'Last_Name';
  const api = process.env.ZOHO_API || 'https://www.zohoapis.com';
  const r = await fetch(api + '/crm/v2/Leads?fields=' + encodeURIComponent(fields) + '&per_page=' + per, { headers: { Authorization: 'Zoho-oauthtoken ' + tok } });
  const data: any = await r.json();
  return { data: { data: data.data || [], info: data.info || { count: (data.data || []).length, more_records: false } }, status: 'success' };
}
async function vercelDeploys(args: any) {
  const tok = process.env.VERCEL_TOKEN;
  if (!tok) return { deployments: { deployments: [] } };
  const team = (args && args.teamId) || process.env.VERCEL_TEAM || '';
  const pid = (args && args.projectId) || '';
  const url = 'https://api.vercel.com/v6/deployments?limit=3' + (pid ? '&projectId=' + pid : '') + (team ? '&teamId=' + team : '');
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + tok } });
  const data: any = await r.json();
  const deps = (data.deployments || []).map((d: any) => ({ state: d.state || d.readyState || '-', inspectorUrl: d.inspectorUrl, url: d.url, meta: d.meta || {} }));
  return { deployments: { deployments: deps } };
}
async function supaAdvisors(args: any) {
  const tok = process.env.SUPABASE_TOKEN;
  const ref = (args && args.project_id) || '';
  if (!tok || !ref) return { result: { lints: [] } };
  try {
    const r = await fetch('https://api.supabase.com/v1/projects/' + ref + '/advisors/security', { headers: { Authorization: 'Bearer ' + tok } });
    const data: any = await r.json();
    const lints = (data && data.lints) || (Array.isArray(data) ? data : []);
    return { result: { lints } };
  } catch (e) {
    return { result: { lints: [] } };
  }
}
