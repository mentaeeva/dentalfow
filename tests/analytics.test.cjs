const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
function context(){
 const c=vm.createContext({console,Date,Intl,URL,localStorage:{getItem:()=>null,setItem:()=>{}},document:{documentElement:{},getElementById:()=>({}),addEventListener:()=>{}},window:{addEventListener:()=>{}},setTimeout:()=>{}});
 for(const name of ['i18n','utils','store','seed','analytics','views','app']){
  vm.runInContext(fs.readFileSync(path.join(root,'docs/js',name+'.js'),'utf8').replace(/boot\(\);\s*$/,''),c,{filename:name+'.js'});
 }
 vm.runInContext('render=()=>{}',c);
 return c;
}
const c=context(),api=vm.runInContext('DentaFlowAnalytics',c);
const at='2026-11-13T12:00:00',all={preset:'all'},period={preset:'custom',from:'2026-11-01',to:'2026-11-13'};
function cycle(extra={}){return {n:1,openedAt:'2026-11-01T09:00:00',assignments:[],work:[],...extra};}
function order(extra={}){return {id:1,labId:'a',clinicId:'c',createdAt:'2026-11-01T09:00:00',due:'2026-11-10',status:'RECEIVED',items:[{serviceId:'s',name:'Crown',qty:2,price:11000}],cycles:[cycle()],history:[],...extra};}
function state(orders){return {orders,clinics:[{id:'c',name:'Clinic'}],techs:[{id:'t',labId:'a',name:'Tech'},{id:'t2',labId:'a',name:'Tech 2'},{id:'other',labId:'b',name:'Other'}],services:[{id:'s',base:99999}]};}
const calc=(orders,filter=period)=>api.calculate(state(orders),'a',filter,at);

test('laboratories are isolated, including shared clinics and technician lists',()=>{
 const d=calc([order(),order({id:2,labId:'b',status:'DELIVERED',cycles:[cycle(),cycle({n:2,reason:'Other lab'})]})]);
 assert.equal(d.total,1);assert.equal(d.amount,22000);assert.equal(d.revenue,0);assert.equal(d.cycles,0);
 assert.equal(d.workload.length,2);assert.equal(d.workload.some(t=>t.id==='other'),false);
});
test('saved item prices, cancelled orders and remakes do not inflate value or units',()=>{
 const d=calc([order({status:'DELIVERED',cycles:[cycle(),cycle({n:2,reason:'Shade'}),cycle({n:3,reason:'Shade'})]}),order({id:2,status:'CANCELLED'})]);
 assert.equal(d.total,2);assert.equal(d.cancelled,1);assert.equal(d.amount,22000);assert.equal(d.revenue,22000);
 assert.equal(d.services[0].qty,2);assert.equal(d.services[0].total,22000);assert.equal(d.clinics[0].count,1);
 assert.equal(d.remade,1);assert.equal(d.reworkBase,1);assert.equal(d.reworkRate,100);assert.equal(d.cycles,2);assert.equal(d.reasons[0].count,2);
});
test('dates are inclusive, local, and based on order creation rather than delivery',()=>{
 const d=calc([order({createdAt:'2026-10-31T23:59:59',status:'DELIVERED'}),order({id:2,createdAt:'2026-11-01T00:00:00'}),order({id:3,createdAt:'2026-11-13T23:59:59'}),order({id:4,createdAt:'2026-11-14T00:00:00'})]);
 assert.equal(d.total,2);assert.equal(d.revenue,0);assert.equal(d.timeline.buckets.reduce((n,b)=>n+b.count,0),2);
});
test('date presets include today and cross month/year/leap-day boundaries',()=>{
 let r=api.range({preset:'7'},[],'2027-01-03T12:00:00');assert.equal(r.from,'2026-12-28');assert.equal(r.to,'2027-01-03');
 r=api.range({preset:'30'},[],'2024-03-01T12:00:00');assert.equal(r.from,'2024-02-01');
 r=api.range(all,[] ,at);assert.equal(r.from,'2026-11-13');assert.equal(r.valid,true);
});
test('empty, invalid and reversed ranges do not display misleading figures',()=>{
 for(const filter of [{preset:'custom',from:'',to:'2026-11-13'},{preset:'custom',from:'2026-02-30',to:'2026-03-03'},{preset:'custom',from:'2026-11-14',to:'2026-11-13'}]){
  const d=calc([order()],filter);assert.equal(d.range.valid,false);assert.equal(d.total,undefined);
 }
 const d=calc([]);assert.equal(d.total,0);assert.equal(d.reworkRate,null);assert.equal(d.averageDays,null);assert.equal(d.timed,0);
});
test('timeline aggregates every selected order exactly once and includes zero days',()=>{
 const orders=[order(),order({id:2,createdAt:'2026-11-13T23:00:00'})];
 for(const to of ['2026-11-13','2027-02-01','2028-01-01','2032-01-01']){
  const d=calc(orders,{preset:'custom',from:'2026-11-01',to});
  assert.equal(d.timeline.buckets.reduce((s,b)=>s+b.count,0),2);
  assert.equal(d.timeline.buckets[0].from,'2026-11-01');assert.equal(d.timeline.buckets.at(-1).to,to);
 }
 assert.equal(calc(orders).timeline.buckets[1].count,0);
});
test('workload includes older active orders and excludes completed/removed assignments and old cycles',()=>{
 const assignments=[{techId:'t',doneAt:null},{techId:'t2',doneAt:null}];
 const d=calc([
  order({id:1,status:'IN_PROGRESS',createdAt:'2026-10-01T12:00:00',cycles:[cycle({assignments})]}),
  order({id:2,status:'IN_PROGRESS',cycles:[cycle({assignments:[{techId:'t'}]}),cycle({n:2,assignments:[{techId:'t',removedAt:at},{techId:'t2',doneAt:at}]})]}),
  order({id:3,status:'DONE',cycles:[cycle({assignments})]}),order({id:4,status:'CANCELLED',cycles:[cycle({assignments})]})
 ]);
 assert.equal(d.workload.find(t=>t.id==='t').count,1);assert.equal(d.workload.find(t=>t.id==='t2').count,1);
 assert.equal(d.workload.find(t=>t.id==='t').overdue,1);assert.equal(d.workload.find(t=>t.id==='t').reworks,0);assert.equal(d.unassigned,1);
});
test('due today is not overdue, and finished production is not overdue while awaiting delivery',()=>{
 const d=calc([order({due:'2026-11-13'}),order({id:2,due:'2026-11-12'}),order({id:3,status:'DONE'}),order({id:4,status:'IN_DELIVERY'}),order({id:5,status:'CANCELLED'}),order({id:6,due:''})]);
 assert.equal(d.active,3);assert.equal(d.overdue,1);
});
test('turnaround uses the latest current-cycle DONE event, not delivery or a reversed completion',()=>{
 const d=calc([
  order({status:'DELIVERED',createdAt:'2026-11-01T12:00:00',due:'2026-11-05',history:[{type:'status',to:'DONE',at:'2026-11-03T12:00:00'},{type:'status',to:'DONE',at:'2026-11-05T12:00:00'},{type:'status',to:'DELIVERED',at:'2026-11-10T12:00:00'}]}),
  order({id:2,status:'IN_PROGRESS',history:[{type:'status',to:'DONE',at:'2026-11-03T12:00:00'}]})
 ]);
 assert.equal(d.completed,1);assert.equal(d.averageDays,4);assert.equal(d.onTime,1);assert.equal(d.timed,1);
});
test('reopened cycles exclude prior completion and use valid current assignments as a fallback',()=>{
 const o=order({status:'DONE',createdAt:'2026-11-01T12:00:00',due:'2026-11-05',history:[{type:'status',to:'DONE',at:'2026-11-03T12:00:00'}],cycles:[cycle(),cycle({n:2,openedAt:'2026-11-04T12:00:00',assignments:[{techId:'t',doneAt:'2026-11-07T12:00:00'}]})]});
 const d=calc([o]);assert.equal(d.averageDays,6);assert.equal(d.onTime,0);assert.equal(d.timed,1);
 o.cycles[1].assignments=[];assert.equal(calc([o]).completed,0);
});
test('analytics never modifies orders, file attachments, prices or sessions',()=>{
 const s=state([order({files:[{name:'scan.stl',path:'uploads/scan.stl'}]})]),before=JSON.stringify(s);
 api.calculate(s,'a',period,at);assert.equal(JSON.stringify(s),before);
});
test('actual seeded app renders dashboards and keeps filters when switching languages',()=>{
 vm.runInContext("seed(); S.session={userId:'u4'}; UI=freshUI(); UI.route='admin-analytics';",c);
 for(const lang of ['ru','kk','en']){
  const html=vm.runInContext(`LANG='${lang}';vAnalytics()`,c);
  assert.ok(html.includes('an-orders-title'));assert.ok(html.includes('an-clinics-title'));assert.ok(html.includes('an-reworks-title'));
  assert.doesNotMatch(html,/NaN|undefined|Раздел в разработке/);
 }
 vm.runInContext("C.analyticsPeriod({value:'custom'});",c);
 assert.equal(vm.runInContext('UI.analytics.from.length',c),10);
 vm.runInContext("C.analyticsDate({value:'2026-02-01',dataset:{bound:'from'}});",c);
 assert.equal(vm.runInContext('UI.analytics.preset',c),'custom');assert.equal(vm.runInContext('UI.analytics.from',c),'2026-02-01');
});
test('rendering escapes names, handles empty periods and denies non-admin dashboards',()=>{
 vm.runInContext("seed(); S.session={userId:'u4'}; LANG='ru'; UI=freshUI(); UI.analytics.preset='all'; S.techs[0].name='<img src=x onerror=alert(1)>';",c);
 assert.ok(vm.runInContext('vAnalytics()',c).includes('&lt;img'));assert.ok(!vm.runInContext('vAnalytics()',c).includes('<img src=x'));
 vm.runInContext("UI.analytics={preset:'custom',from:'2000-01-01',to:'2000-01-02'}",c);
 const empty=vm.runInContext('vAnalytics()',c);assert.ok(empty.includes('За этот период заказов нет.'));assert.doesNotMatch(empty,/NaN|undefined/);
 vm.runInContext("S.session={userId:'u1'}",c);assert.equal(vm.runInContext('vAnalytics()',c),'');
});
test('new static labels have both Kazakh and English translations',()=>{
 const source=fs.readFileSync(path.join(root,'docs/js/analytics.js'),'utf8');
 const labels=[...source.matchAll(/tr\('([^']+)'\)/g)].map(m=>m[1]);
 for(const text of labels){if(!/[А-Яа-яЁё]/.test(text))continue;
  c.label=text;assert.equal(vm.runInContext('Object.hasOwn(KK,label)&&Object.hasOwn(EN,label)',c),true,text);
 }
});
