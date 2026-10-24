import test from 'node:test';
import assert from 'node:assert/strict';
import { decide, editionAt, tick } from './worker.mjs';

const now = new Date('2026-10-24T00:10:00Z');
const run = (extra = {}) => decide({ now, state: null, runs: [], ...extra });
test('Beijing date rolls over at UTC 16:00', () => {
  assert.equal(editionAt(new Date('2026-10-23T16:00:00Z')), '2026-10-24');
});
test('starts missing edition after six, never before', () => {
  assert.equal(run().action, 'dispatch');
  assert.equal(run({now:new Date('2026-10-23T21:59:00Z')}).action, 'wait');
});
test('stale sent record does not suppress today', () => {
  assert.equal(run({state:{edition:'2026-10-23',phase:'sent'}}).action, 'dispatch');
});
test('today sent and uncertain sending never dispatch', () => {
  for (const phase of ['sent','sending']) {
    assert.notEqual(run({state:{edition:'2026-10-24',phase}}).action, 'dispatch');
  }
});
test('active queued and running work suppresses duplicates', () => {
  for (const status of ['queued','in_progress','waiting','pending','requested']) {
    assert.equal(run({runs:[{status}]}).action, 'wait');
  }
});
test('caps preparation attempts and blocks malformed current state', () => {
  assert.equal(run({state:{edition:'2026-10-24',phase:'failed',attempts:3}}).action,'alert');
  assert.equal(run({state:{edition:'2026-10-24',phase:'banana'}}).action,'alert');
});
test('ready waits until eight then dispatches delivery', () => {
  const state={edition:'2026-10-24',phase:'ready',attempts:1};
  assert.equal(run({state,now:new Date('2026-10-23T23:59:00Z')}).action,'wait');
  assert.equal(run({state}).action,'dispatch');
});
test('ignores completed failures for another edition, caps today failures even if state absent', () => {
  const runs = Array.from({length:3},()=>({status:'completed',created_at:'2026-10-23T22:00:00Z'}));
  assert.equal(run({runs}).action,'alert');
  assert.equal(run({runs:runs.map(r=>({...r,created_at:'2026-10-22T22:00:00Z'}))}).action,'dispatch');
});

function fakeAPI({disabled=false, badState=false, denied=false}={}) {
  const calls=[];
  return { calls, fetcher:async (url, options={}) => {
    calls.push({url,method:options.method || 'GET',body:options.body});
    if (denied) return new Response('',{status:401});
    if (url.includes('raw.githubusercontent')) return badState ? Response.json({oops:true}) : new Response('',{status:404});
    if (url.endsWith('/dispatches')) return new Response(null,{status:204});
    if (url.includes('/runs?')) return Response.json({workflow_runs:[]});
    return Response.json({state:disabled?'disabled_manually':'active'});
  }};
}
test('default deployment is inert and never calls an API',async()=>{
  const api=fakeAPI();
  assert.equal((await tick({},api.fetcher,now)).reason,'not_enabled');
  assert.equal(api.calls.length,0);
});
test('dispatches only fixed workflow and today, never a monitoring success',async()=>{
  const api=fakeAPI();
  await tick({ENABLED:'true',GITHUB_TOKEN:'test-placeholder'},api.fetcher,now);
  const posts=api.calls.filter(c=>c.method==='POST');
  assert.equal(posts.length,1);
  assert.equal(posts[0].url,'https://api.github.com/repos/2953261168-dot/horizon-runner/actions/workflows/daily.yml/dispatches');
  assert.deepEqual(JSON.parse(posts[0].body),{ref:'main',inputs:{edition:'2026-10-24',mode:'live'}});
});
test('does not enable disabled workflow or dispatch on credential/state failure',async()=>{
  for(const options of [{disabled:true},{badState:true},{denied:true}]) {
    const api=fakeAPI(options);
    try {await tick({ENABLED:'true',GITHUB_TOKEN:'test-placeholder'},api.fetcher,now);} catch {}
    assert.equal(api.calls.filter(c=>c.method==='POST').length,0);
  }
});
test('ready delivery retries are bounded independently of preparation',()=>{
  const state={edition:'2026-10-24',phase:'ready',attempts:1};
  const runs=Array.from({length:3},()=>({status:'completed',created_at:'2026-10-24T00:01:00Z'}));
  assert.equal(run({state,runs}).action,'alert');
});
test('early ready checks never consume morning delivery budget',()=>{
  const state={edition:'2026-10-24',phase:'ready',attempts:1};
  const runs=['22:07','22:37','23:07','23:37'].map(t=>({status:'completed',created_at:`2026-10-23T${t}:00Z`}));
  assert.equal(run({state,runs}).action,'dispatch');
});
test('durable sent receipt permits finalization recovery without a new SMTP attempt',async()=>{
  const api=fakeAPI();
  const fetcher=async(url,options)=>{
    if(url.includes('/horizon-cloud-state/')) return Response.json({edition:'2026-10-24',phase:'sending',attempts:1});
    if(url.includes('/horizon-mail-state/')) return Response.json({edition:'2026-10-24',status:'sent'});
    return api.fetcher(url,options);
  };
  assert.equal((await tick({ENABLED:'true',GITHUB_TOKEN:'test-placeholder'},fetcher,now)).action,'dispatch');
});
