'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync('public/app.js','utf8');
function code(start,end){return src.slice(src.indexOf(start),src.indexOf(end,src.indexOf(start)));}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {resolve,promise};}
function syncContext(){const wait=deferred();const ctx={accountEpoch:0,sb:{from:()=>({select:()=>({eq:()=>wait.promise})})},user:{id:'A'},library:{stories:{}},cloudSaveStory:async()=>{},saveLibrary(){},renderLibrary(){},console};vm.createContext(ctx);vm.runInContext(code('async function syncWithCloud()','function persistStory('),ctx);return {ctx,wait};}
test('late cloud read cannot enter another account library',async()=>{
 const {ctx,wait}=syncContext();const pending=ctx.syncWithCloud();ctx.accountEpoch++;ctx.user={id:'B'};ctx.library={stories:{}};wait.resolve({data:[{id:'a',data:{id:'a'},updated_at:new Date().toISOString()}]});await pending;assert.deepEqual(Object.keys(ctx.library.stories),[]);
});
test('current account cloud read is retained',async()=>{
 const {ctx,wait}=syncContext();const pending=ctx.syncWithCloud();wait.resolve({data:[{id:'a',data:{id:'a'},updated_at:new Date().toISOString()}]});await pending;assert.ok(ctx.library.stories.a);
});
test('queued cloud save is discarded after account switching',async()=>{
 const gate=deferred(),writes=[];const st={id:'a',localRevision:1,scenario:{title:'A'}};
 const ctx={accountEpoch:0,user:{id:'A'},cloudSaveChains:new Map([['A:a',gate.promise]]),sb:{from:()=>({upsert:x=>{writes.push(x);return {select:()=>({single:async()=>({data:{updated_at:new Date().toISOString()}})})};}})},saveLibrary(){},console};
 vm.createContext(ctx);vm.runInContext(code('function cloudSaveStory(st)','async function cloudDeleteStory('),ctx);
 const p=ctx.cloudSaveStory(st);ctx.user={id:'B'};ctx.accountEpoch++;gate.resolve();await p;assert.equal(writes.length,0);
});
async function chapter(done){
 const el=()=>({classList:{add(){},remove(){}},appendChild(){},remove(){}});
 const st={scenario:{id:'test',title:'Test',premise:'Test',tone:'Test'},character:{},history:[{role:'user',content:'Begin'}],chapters:[],serverId:'test',startToken:'token'};
 let read=0,error;const ctx={accountEpoch:0,AbortController,story:st,pendingAction:null,appConfig:{},generating:false,$:el,document:{createElement:el},anchorToChapter(){},authHeader:async()=>({}),productSessionId:()=>'',TextDecoder,console,fetch:async()=>({status:200,ok:true,body:{getReader:()=>({read:async()=>read++?{done:true}:{done:false,value:new TextEncoder().encode('data: {"type":"text","text":"Chapter text"}\n\n'+(done?'data: {"type":"done"}\n\n':''))}})}}),renderProse(){},visiblePart:x=>x,noteTextGrew(){},releaseReserve(){},hideJump(){},showError:msg=>{error=msg;},parseLedger:()=>null,persistStory(){},updateChapterCount(){},showChoices(){},parseChoices:()=>null};
 vm.createContext(ctx);vm.runInContext(code('async function requestChapter()','// ----- parsing -----'),ctx);await ctx.requestChapter();return {st,error};
}
test('stream ending without done never commits partial text',async()=>{const {st,error}=await chapter(false);assert.equal(st.history.length,1);assert.match(error,/Retry to recover/);});
test('completed stream commits one chapter',async()=>{const {st,error}=await chapter(true);assert.equal(error,undefined);assert.equal(st.history.length,2);assert.equal(st.chapters.length,1);});
