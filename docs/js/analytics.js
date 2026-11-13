/* Read-only analytics. Order metrics use a creation-date cohort; workload is live. */
'use strict';
const DentaFlowAnalytics=(()=>{
 const DAY=86400000;
 const statuses=['RECEIVED','IN_PROGRESS','DONE','IN_DELIVERY','DELIVERED','CANCELLED'];
 const positive=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)):0;
 const localDay=value=>{
  if(!value)return '';
  const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 };
 const validDay=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&localDay(s+'T12:00:00')===s;
 const shift=(s,n)=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return localDay(d);};
 const dayNumber=s=>Date.parse(s+'T00:00:00Z')/DAY;
 const current=o=>(o.cycles||[]).slice(-1)[0]||{};
 const producing=o=>['RECEIVED','IN_PROGRESS'].includes(o.status);
 const amount=o=>(o.items||[]).reduce((sum,i)=>sum+positive(i.qty)*positive(i.price),0);
 function range(filter,orders,at){
  const today=localDay(at);let from,to=today;
  if(filter.preset==='custom'){from=filter.from;to=filter.to;}
  else if(filter.preset==='all'){
   const dates=orders.map(o=>localDay(o.createdAt)).filter(Boolean).sort();
   from=dates[0]||today;to=dates.length&&dates[dates.length-1]>today?dates[dates.length-1]:today;
  }else from=shift(today,1-({'7':7,'30':30,'90':90}[filter.preset]||30));
  return {from,to,valid:validDay(from)&&validDay(to)&&from<=to};
 }
 function timeline(orders,from,to){
  const days=dayNumber(to)-dayNumber(from)+1;
  const unit=days<=31?'day':days<=180?'week':days<=1096?'month':'year';
  const buckets=[];let start=from;
  while(start<=to){
   let next;
   if(unit==='day'||unit==='week')next=shift(start,unit==='day'?1:7);
   else{const d=new Date(start+'T12:00:00');d.setDate(1);if(unit==='month')d.setMonth(d.getMonth()+1);else d.setFullYear(d.getFullYear()+1,0);next=localDay(d);}
   if(!next||next<=start)break;
   buckets.push({from:start,to:next>to?to:shift(next,-1),count:0});start=next;
  }
  for(const o of orders){const day=localDay(o.createdAt);const bucket=buckets.find(b=>day>=b.from&&day<=b.to);if(bucket)bucket.count++;}
  return {unit,buckets};
 }
 function completion(o){
  if(!['DONE','IN_DELIVERY','DELIVERED'].includes(o.status))return null;
  const c=current(o),opened=Date.parse(c.openedAt||o.createdAt);
  const history=(o.history||[]).filter(h=>h.type==='status'&&h.to==='DONE'&&Date.parse(h.at)>=opened).map(h=>Date.parse(h.at)).filter(Number.isFinite);
  if(history.length)return Math.max(...history);
  const assignments=(c.assignments||[]).filter(a=>!a.removedAt);
  if(assignments.length&&assignments.every(a=>a.doneAt&&Number.isFinite(Date.parse(a.doneAt))))return Math.max(...assignments.map(a=>Date.parse(a.doneAt)));
  return null;
 }
 function calculate(state,labId,filter,at){
  const all=(state.orders||[]).filter(o=>o.labId===labId),r=range(filter,all,at);
  if(!r.valid)return {range:r};
  const today=localDay(at),orders=all.filter(o=>{const day=localDay(o.createdAt);return day&&day>=r.from&&day<=r.to;});
  const live=orders.filter(o=>o.status!=='CANCELLED');
  const delivered=live.filter(o=>o.status==='DELIVERED');
  const active=live.filter(producing),remade=live.filter(o=>(o.cycles||[]).length>1);
  const overdue=o=>producing(o)&&validDay(o.due)&&o.due<today;
  const statusCounts=statuses.map(id=>({id,count:orders.filter(o=>o.status===id).length}));
  const clinics=new Map(),services=new Map(),reasons=new Map();
  for(const o of delivered){
   if(!clinics.has(o.clinicId))clinics.set(o.clinicId,{id:o.clinicId,name:(state.clinics.find(c=>c.id===o.clinicId)||{}).name||'—',count:0,total:0});
   const row=clinics.get(o.clinicId);row.count++;row.total+=amount(o);
  }
  for(const o of live){
   for(const item of o.items||[]){
    const key=item.serviceId||item.name;
    if(!services.has(key))services.set(key,{name:item.name||'—',qty:0,total:0});
    const row=services.get(key);row.qty+=positive(item.qty);row.total+=positive(item.qty)*positive(item.price);
   }
   for(const cycle of (o.cycles||[]).slice(1)){const reason=cycle.reason||'Не указана';reasons.set(reason,(reasons.get(reason)||0)+1);}
  }
  const completed=live.map(o=>({o,end:completion(o)})).filter(x=>x.end!==null&&Number.isFinite(Date.parse(x.o.createdAt))&&x.end>=Date.parse(x.o.createdAt));
  const timed=completed.filter(x=>validDay(x.o.due));
  const currentWork=all.filter(producing);
  const workload=(state.techs||[]).filter(t=>t.labId===labId).map(t=>{
   const assigned=currentWork.filter(o=>(current(o).assignments||[]).some(a=>a.techId===t.id&&!a.removedAt&&!a.doneAt));
   return {id:t.id,name:t.name,count:assigned.length,overdue:assigned.filter(overdue).length,reworks:assigned.filter(o=>(o.cycles||[]).length>1).length};
  }).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name));
  return {
   range:r,total:orders.length,amount:live.reduce((sum,o)=>sum+amount(o),0),cancelled:orders.length-live.length,
   active:active.length,overdue:active.filter(overdue).length,
   remade:remade.length,reworkBase:live.length,reworkRate:live.length?remade.length/live.length*100:null,
   statuses:statusCounts,timeline:timeline(orders,r.from,r.to),
   revenue:delivered.reduce((sum,o)=>sum+amount(o),0),delivered:delivered.length,
   clinics:[...clinics.values()].sort((a,b)=>b.total-a.total),services:[...services.values()].sort((a,b)=>b.qty-a.qty),
   reasons:[...reasons].map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count),
   cycles:[...reasons.values()].reduce((sum,n)=>sum+n,0),
   completed:completed.length,averageDays:completed.length?completed.reduce((sum,x)=>sum+(x.end-Date.parse(x.o.createdAt))/DAY,0)/completed.length:null,
   onTime:timed.filter(x=>localDay(x.end)<=x.o.due).length,timed:timed.length,
   workload,unassigned:currentWork.filter(o=>!(current(o).assignments||[]).some(a=>!a.removedAt&&!a.doneAt)).length
  };
 }
 return {range,calculate};
})();

/* Dashboard rendering uses the existing theme, translations and event delegation. */
const ANALYTICS_COLORS=['#64748b','#2478b9','#27835b','#b17b1f','#147d89','#c65c41'];
function analyticsNumber(n,digits=0){return n==null?'—':Number(n).toLocaleString(LANG==='en'?'en-US':LANG==='kk'?'kk-KZ':'ru-RU',{maximumFractionDigits:digits});}
function analyticsPercent(n){return n==null?'—':analyticsNumber(n,1)+'%';}
function analyticsEmpty(message){return `<p class="an-empty">${esc(tr(message||'Нет данных за выбранный период.'))}</p>`;}
function analyticsCard(id,title,note,body,cls=''){return `<section class="panel-card an-card ${cls}" aria-labelledby="${id}"><header class="an-card-head"><h2 id="${id}">${esc(tr(title))}</h2><p>${esc(tr(note))}</p></header>${body}</section>`;}
function analyticsBars(rows,key,format){
 const max=Math.max(1,...rows.map(row=>row[key]));
 return `<ul class="an-bars">${rows.map(row=>`<li><div class="an-bar-label"><span>${esc(row.label)}</span><strong>${esc(format(row[key]))}</strong></div><div class="an-track" aria-hidden="true"><span style="width:${row[key]/max*100}%"></span></div>${row.note?`<p class="hint">${esc(row.note)}</p>`:''}</li>`).join('')}</ul>`;
}
function analyticsTimeline(data){
 if(!data.total)return analyticsEmpty();
 const rows=data.timeline.buckets,max=Math.max(1,...rows.map(b=>b.count));
 const width=720,height=216,left=32,top=16,bottom=174,step=(width-left-12)/rows.length;
 const tick=Math.max(1,Math.ceil(max/4)),axisMax=Math.ceil(max/tick)*tick;
 const date=s=>new Date(s+'T12:00:00').toLocaleDateString(LANG==='en'?'en-GB':LANG==='kk'?'kk-KZ':'ru-RU',{day:'numeric',month:'short'});
 const label=b=>data.timeline.unit==='year'?b.from.slice(0,4):data.timeline.unit==='month'?b.from.slice(0,7):date(b.from);
 const marks=Array.from({length:axisMax/tick+1},(_,i)=>{const n=i*tick,y=bottom-n/axisMax*(bottom-top);return `<line x1="${left}" y1="${y}" x2="${width-12}" y2="${y}" class="an-gridline"/><text x="${left-8}" y="${y+4}" text-anchor="end">${n}</text>`;}).join('');
 const bars=rows.map((b,i)=>{const x=left+i*step+step*.15,h=b.count/axisMax*(bottom-top),w=step*.7;return `<g><title>${esc(fmtShort(b.from+'T12:00:00')+(b.from!==b.to?' – '+fmtShort(b.to+'T12:00:00'):'')+': '+b.count)}</title><rect x="${x}" y="${bottom-h}" width="${w}" height="${h}" rx="3" class="an-column"/>${b.count?`<text x="${x+w/2}" y="${bottom-h-5}" text-anchor="middle" class="an-chart-count">${b.count}</text>`:''}${i%Math.max(1,Math.ceil(rows.length/7))===0?`<text x="${x+w/2}" y="198" text-anchor="middle">${esc(label(b))}</text>`:''}</g>`;}).join('');
 return `<div class="an-chart"><svg viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="an-chart-title"><title id="an-chart-title">${tr('Количество заказов по периодам')}</title>${marks}${bars}</svg></div><details class="an-details"><summary>${tr('Показать значения')}</summary><div class="tbl-wrap"><table class="tbl"><thead><tr><th scope="col">${tr('Период')}</th><th scope="col" class="num">${tr('Заказов')}</th></tr></thead><tbody>${rows.map(b=>`<tr><td>${fmtShort(b.from+'T12:00:00')}${b.to!==b.from?' – '+fmtShort(b.to+'T12:00:00'):''}</td><td class="num">${b.count}</td></tr>`).join('')}</tbody></table></div></details>`;
}
function analyticsStatus(data){
 if(!data.total)return analyticsEmpty();
 let start=0;const gradient=data.statuses.map((s,i)=>{const end=start+s.count/data.total*100,segment=ANALYTICS_COLORS[i]+' '+start+'% '+end+'%';start=end;return segment;}).join(',');
 return `<div class="an-status"><div class="an-donut" style="background:conic-gradient(${gradient})" aria-hidden="true"><div><strong>${analyticsNumber(data.total)}</strong><span>${tr('Заказов')}</span></div></div><ul class="an-legend">${data.statuses.map((s,i)=>`<li><i style="background:${ANALYTICS_COLORS[i]}" aria-hidden="true"></i><span>${esc(tr(ST[s.id].admin))}</span><b>${analyticsNumber(s.count)}</b></li>`).join('')}</ul></div>`;
}
function analyticsDashboard(){
 const user=me();if(!user||user.role!=='ADMIN')return '';
 const lab=labById(user.labId),filter=UI.analytics,data=DentaFlowAnalytics.calculate(S,lab.id,filter,now()),range=data.range;
 const heading=`<div class="page-head"><div><h1>${tr('Аналитика')}</h1><p class="lead">${esc(laboratoryName(lab))}</p></div><span class="an-live">${ic('chart',16)}${tr('По данным заказов')}</span></div>`;
 const filters=`<div class="panel-card an-filters"><div class="field"><label for="an-period">${tr('Период')}</label><select id="an-period" class="select" data-change="analyticsPeriod">${[['7','Последние 7 дней'],['30','Последние 30 дней'],['90','Последние 90 дней'],['all','Всё время'],['custom','Свой период']].map(([v,t])=>`<option value="${v}" ${filter.preset===v?'selected':''}>${tr(t)}</option>`).join('')}</select></div><div class="field"><label for="an-from">${tr('С')}</label><input class="input" id="an-from" type="date" value="${esc(range.from)}" data-change="analyticsDate" data-bound="from" ${range.valid?'':'aria-invalid="true" aria-describedby="an-error"'}></div><div class="field"><label for="an-to">${tr('По')}</label><input class="input" id="an-to" type="date" value="${esc(range.to)}" data-change="analyticsDate" data-bound="to" ${range.valid?'':'aria-invalid="true" aria-describedby="an-error"'}></div><p class="hint">${tr('Период — по дате создания заказа. Показатели отражают его текущее состояние.')}</p></div>`;
 if(!range.valid)return heading+filters+`<p class="err-text" id="an-error" role="alert">${tr('Укажите обе даты: начало периода не должно быть позже окончания.')}</p>`;
 const kpi=(label,value,note,cls='')=>`<article class="panel-card an-kpi ${cls}"><h2>${tr(label)}</h2><strong>${value}</strong><p>${note}</p></article>`;
 const kpis=`<div class="an-kpis">${kpi('Всего заказов',analyticsNumber(data.total),tr('Отменено')+': '+data.cancelled)}${kpi('Стоимость заказов',money(data.amount),tr('Без отменённых и повторного начисления за переделки'))}${kpi('В производстве',analyticsNumber(data.active),tr('Из них просрочено')+': '+data.overdue,data.overdue?'an-warning':'')}${kpi('Доля переделок',analyticsPercent(data.reworkRate),tr('Заказов с переделкой')+': '+data.remade+' / '+data.reworkBase)}</div>`;
 const periodNote={day:'По дням · включая отменённые',week:'По неделям · включая отменённые',month:'По месяцам · включая отменённые',year:'По годам · включая отменённые'}[data.timeline.unit];
 const revenueBody=`<p class="an-total">${money(data.revenue)}<span>${tr('Доставлено заказов')}: ${data.delivered}</span></p>`+(data.clinics.length?analyticsBars(data.clinics.map(c=>({...c,label:c.name,note:tr('Заказов')+': '+c.count})),'total',money):analyticsEmpty('Нет доставленных заказов за выбранный период.'));
 const servicesBody=data.services.length?analyticsBars(data.services.map(s=>({...s,label:serviceName(s.name),note:money(s.total)})),'qty',n=>analyticsNumber(n)+' '+tr('шт.')):analyticsEmpty();
 const deadlines=`<div class="an-deadlines"><div><strong>${analyticsNumber(data.averageDays,1)} <small>${tr('дн.')}</small></strong><span>${tr('Среднее время изготовления')}</span></div><div><strong>${analyticsPercent(data.timed?data.onTime/data.timed*100:null)}</strong><span>${tr('Готово в срок')} · ${data.onTime} / ${data.timed}</span></div><div class="${data.overdue?'an-danger':''}"><strong>${data.overdue}</strong><span>${tr('Просрочено в производстве')}</span></div></div><p class="hint">${tr('От создания до последнего завершения производства, включая переделки. Календарные дни.')} ${tr('Завершено заказов')}: ${data.completed}.</p><p class="hint">${tr('Срок сравнивается с датой готовности; день сдачи не считается просрочкой.')}</p>`;
 const reasons=data.reasons.length?analyticsBars(data.reasons.map(r=>({...r,label:tr(r.name)})),'count',analyticsNumber):analyticsEmpty('Переделок за выбранный период нет.');
 const reworks=`<div class="an-rework-summary"><strong>${analyticsPercent(data.reworkRate)}</strong><p>${tr('Заказов с переделкой')}: <b>${data.remade} / ${data.reworkBase}</b><br>${tr('Циклов переделки')}: <b>${data.cycles}</b></p></div>${reasons}`;
 const maxLoad=Math.max(1,...data.workload.map(t=>t.count));
 const workload=data.workload.length?`<div class="tbl-wrap"><table class="tbl an-workload"><thead><tr><th scope="col">${tr('Техник')}</th><th scope="col">${tr('В работе сейчас')}</th><th scope="col" class="num">${tr('Переделки')}</th><th scope="col" class="num">${tr('Просрочено')}</th></tr></thead><tbody>${data.workload.map(t=>`<tr><th scope="row">${esc(t.name)}</th><td><div class="an-load"><div class="an-track" aria-hidden="true"><span style="width:${t.count/maxLoad*100}%"></span></div><b>${t.count}</b></div></td><td class="num">${t.reworks}</td><td class="num ${t.overdue?'an-danger':''}">${t.overdue}</td></tr>`).join('')}</tbody></table></div><p class="hint an-workload-note">${tr('Без назначенного исполнителя')}: <b>${data.unassigned}</b>. ${tr('Заказ с двумя исполнителями учитывается у каждого. Завершённые и снятые назначения исключены.')}</p>`:analyticsEmpty('В лаборатории пока нет техников.');
 return heading+filters+(!data.total?`<div class="an-notice" role="status">${tr('За этот период заказов нет. Выберите другой период. Загрузка техников показана на текущий момент.')}</div>`:'')+kpis+`<div class="an-grid">${analyticsCard('an-orders-title','Количество заказов по периодам',periodNote,analyticsTimeline(data),'an-wide')}${analyticsCard('an-status-title','Статусы заказов','Текущее состояние заказов выбранного периода',analyticsStatus(data))}${analyticsCard('an-clinics-title','Выручка по клиникам','Стоимость доставленных заказов выбранного периода; поступление оплаты не учитывается.',revenueBody)}${analyticsCard('an-services-title','Статистика по услугам','Количество единиц в заказах, без отменённых и повторов при переделках.',servicesBody,'an-wide')}${analyticsCard('an-load-title','Загрузка техников','Сейчас · все заказы лаборатории, независимо от выбранного периода',workload,'an-full')}${analyticsCard('an-deadlines-title','Сроки выполнения','Заказы выбранного периода',deadlines,'an-wide')}${analyticsCard('an-reworks-title','Причины переделок','Без отменённых заказов. Причины считаются по всем циклам переделки.',reworks)}</div>`;
}
