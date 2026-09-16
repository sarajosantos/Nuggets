'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{PGlite}=require('@electric-sql/pglite'),{randomUUID}=require('node:crypto');
let db; const owner=randomUUID(),other=randomUUID();
test.before(async()=>{
 db=new PGlite();
 await db.exec(`create role anon; create role authenticated; create role service_role bypassrls; create schema auth; create table auth.users(id uuid primary key,email text); create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;`);
 await db.exec(fs.readFileSync('supabase/schema.sql','utf8'));
 await db.query('insert into auth.users(id) values ($1),($2)',[owner,other]);
});
test.after(async()=>{await db?.close();});
async function prepare({user=owner,id=null,token=randomUUID(),prior='prior',hash='request',first=true,charge=true,scenario='scenario',character='character'}={}){
 const req=randomUUID();const r=await db.query('select * from prepare_story_chapter($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[user,id,token,scenario,character,prior,hash,req,charge,first]);return {...r.rows[0],req,token};
}
async function complete(p,hash='completed',count=1,output='Saved chapter'){return (await db.query('select * from complete_story_chapter_v2($1,$2,$3,$4,$5,$6)',[owner,p.story_id,p.req,hash,count,output])).rows[0];}
test('durable chapter delivery, retry, concurrent exclusion and ownership',async()=>{
 const token=randomUUID();const p=await prepare({token});assert.equal(p.ok,true);assert.equal(p.credits,0);
 const concurrent=await prepare({token});assert.equal(concurrent.conflict,true);
 assert.equal((await complete(p)).ok,true);
 const replay=await prepare({token});assert.equal(replay.replay,'Saved chapter');assert.equal(replay.credits,0);assert.equal(replay.story_id,p.story_id);
 assert.equal((await prepare({token,scenario:'forged'})).ok,false);
 assert.equal((await prepare({user:other,id:p.story_id,first:false,prior:'completed',hash:'next'})).ok,false);
 assert.equal((await prepare({id:p.story_id,first:false,prior:'forged',hash:'next'})).ok,false);
 const next=await prepare({id:p.story_id,first:false,prior:'completed',hash:'next'});assert.equal(next.ok,true);
 const raced=await prepare({id:p.story_id,first:false,prior:'completed',hash:'next'});assert.equal(raced.conflict,true);
 assert.equal((await complete(next,'completed-2',2,'Chapter two')).ok,true);
 assert.equal((await prepare({id:p.story_id,first:false,prior:'completed',hash:'next'})).replay,'Chapter two');
 const balance=(await db.query('select * from credit_ledger_reconciliation()')).rows[0];assert.equal(Number(balance.mismatches),0);
});
test('stale first generation recovers without charging twice; failed first chapter can restart',async()=>{
 const p=await prepare({charge:false});
 await db.query("update story_sessions set updated_at=now()-interval '6 minutes' where id=$1",[p.story_id]);
 const retry=await prepare({token:p.token,id:p.story_id,charge:false});assert.equal(retry.ok,true);assert.equal(retry.story_id,p.story_id);
 assert.equal((await complete(p)).ok,false,'old worker cannot complete after lease changed');
 await db.query('select * from fail_story_chapter($1,$2,$3)',[owner,retry.story_id,retry.req]);
 const restarted=await prepare({token:p.token,id:p.story_id,charge:false});assert.equal(restarted.ok,true);assert.notEqual(restarted.story_id,p.story_id);
});
test('old workers advancing during rollout invalidate earlier replay output',async()=>{
 const p=await prepare({charge:false,hash:'rollout-first'});
 assert.equal((await complete(p,'rollout-completed')).ok,true);
 const next=await prepare({id:p.story_id,first:false,prior:'rollout-completed',hash:'rollout-next'});
 const done=await db.query('select * from complete_story_chapter($1,$2,$3,$4,$5)',[owner,p.story_id,next.req,'legacy-completed',2]);
 assert.equal(done.rows[0].ok,true);
 const stale=await prepare({token:p.token,hash:'rollout-first'});
 assert.equal(stale.ok,false);assert.equal(stale.replay,null);
});

test('retiring legacy grants preserves named payment fulfillment and event deduplication',async()=>{
 await db.exec("create function grant_stripe_credits(text,uuid,integer,text,text,integer,text) returns integer language sql as 'select 0';");
 const migration=fs.readFileSync('supabase/migrations/20260915140000_drop_legacy_seven_arg_stripe_grant.sql','utf8');
 await db.exec(migration);await db.exec(migration);
 const args=[randomUUID(),other,5,'cs_beta_test','reader','pi_beta_test',1500,'usd'];
 const query='select grant_stripe_credits(p_event_id=>$1,p_user_id=>$2,p_credits=>$3,p_session_id=>$4,p_pack_id=>$5,p_payment_intent=>$6,p_amount_total=>$7,p_currency=>$8) as credits';
 assert.equal((await db.query(query,args)).rows[0].credits,6);
 assert.equal((await db.query(query,args)).rows[0].credits,6);
 assert.equal(Number((await db.query('select * from credit_ledger_reconciliation()')).rows[0].mismatches),0);
});

test('migrations are repeatable and chapter RPCs reject browser roles',async()=>{
 for(const p of ['20260914000000_lock_down_shares_and_stripe_overloads.sql','20260914140000_story_delivery_recovery.sql'])await db.exec(fs.readFileSync('supabase/migrations/'+p,'utf8'));
 const policies=await db.query("select count(*) from pg_policies where schemaname='public' and tablename='shared_stories'");assert.equal(Number(policies.rows[0].count),0);
 await db.exec('set role anon');await assert.rejects(prepare(),/permission denied/);await db.exec('reset role');
});
