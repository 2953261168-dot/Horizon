// Pure scheduling policy. The runner still owns the authoritative atomic lease.
export function editionAt(date) {
  return new Date(date.getTime() + 8 * 3600000).toISOString().slice(0, 10);
}

export function decide({ now, state, runs }) {
  const edition = editionAt(now);
  const hour = new Date(now.getTime() + 8 * 3600000).getUTCHours();
  const result = (action, reason) => ({ action, reason, edition });
  if (hour < 6 || hour >= 14) return result('wait', 'outside_window');
  if (state?.edition === edition) {
    if (state.phase === 'sent') return result('wait', 'delivered');
    if (state.phase === 'sending') return result('alert', 'smtp_uncertain');
    if (!['preparing', 'publishing', 'ready', 'failed'].includes(state.phase) ||
        !Number.isInteger(state.attempts) || state.attempts < 0) {
      return result('alert', 'invalid_state');
    }
  }
  if (runs.some(r => r.status !== 'completed')) return result('wait', 'active_run');
  const attempts = runs.filter(r => r.created_at && editionAt(new Date(r.created_at)) === edition).length;
  if (state?.edition === edition && state.phase === 'ready') {
    const deliveryRuns = runs.filter(r => r.created_at && editionAt(new Date(r.created_at)) === edition &&
      new Date(new Date(r.created_at).getTime()+8*3600000).getUTCHours() >= 8).length;
    if (deliveryRuns >= 3) return result('alert', 'delivery_attempt_limit');
    return result(hour >= 8 ? 'dispatch' : 'wait', 'ready');
  }
  if (Math.max(attempts, state?.edition === edition ? state.attempts : 0) >= 3) {
    return result('alert', 'attempt_limit');
  }
  return result('dispatch', 'prepare_or_recover');
}

// Deliberately fixed repository/workflow: token cannot redirect this scheduler.
const repo = '2953261168-dot/horizon-runner';
const workflow = 'daily.yml';
const stateBase = 'https://raw.githubusercontent.com/2953261168-dot/Horizon/horizon-cloud-state/';

export async function tick(env, fetcher = fetch, now = new Date()) {
  if (env.ENABLED !== 'true') return {action:'wait',reason:'not_enabled'};
  if (!env.GITHUB_TOKEN) throw new Error('missing_dispatch_credential');
  const headers = { Authorization:`Bearer ${env.GITHUB_TOKEN}`, Accept:'application/vnd.github+json',
    'User-Agent':'horizon-scheduler', 'X-GitHub-Api-Version':'2022-11-28' };
  const base = `https://api.github.com/repos/${repo}/actions/workflows/${workflow}`;
  const request = async (url, options={}) => {
    const response = await fetcher(url, {...options, signal:AbortSignal.timeout(10000)});
    if (!response.ok) throw new Error(`remote_http_${response.status}`);
    return response;
  };
  const workflowInfo = await (await request(base,{headers})).json();
  if (workflowInfo.state !== 'active') return {action:'alert',reason:'workflow_disabled'};
  const response = await fetcher(`${stateBase}${editionAt(now)}.json`,{signal:AbortSignal.timeout(10000),cache:'no-store'});
  let state = null;
  if (response.status !== 404) {
    if (!response.ok) throw new Error(`state_http_${response.status}`);
    state = await response.json();
    if (!state || !/^\d{4}-\d{2}-\d{2}$/.test(state.edition)) throw new Error('invalid_state');
  }
  const payload = await (await request(`${base}/runs?per_page=100`,{headers})).json();
  if (!Array.isArray(payload.workflow_runs)) throw new Error('invalid_runs');
  if (state?.edition === editionAt(now) && state.phase === 'sending') {
    const receiptResponse = await fetcher(`https://raw.githubusercontent.com/2953261168-dot/Horizon/horizon-mail-state/${editionAt(now)}.json`,
      {signal:AbortSignal.timeout(10000),cache:'no-store'});
    if (receiptResponse.ok) {
      const receipt = await receiptResponse.json();
      if (receipt.edition === editionAt(now) && receipt.status === 'sent') state = {...state,phase:'ready'};
    }
  }
  const decision = decide({now,state,runs:payload.workflow_runs});
  if (decision.action === 'dispatch') {
    await request(`${base}/dispatches`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},
      body:JSON.stringify({ref:'main',inputs:{edition:decision.edition,mode:'live'}})});
  }
  // No ping on dispatch: only the runner may report actual delivered success.
  return decision;
}

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(tick(env).then(r => console.log(JSON.stringify(r))));
  },
  async fetch() {
    return new Response('Horizon scheduler; cron only', {headers:{'Content-Type':'text/plain'}});
  }
};
