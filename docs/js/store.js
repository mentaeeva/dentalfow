/* DentaFlow · Хранилище данных (localStorage), справочники и доменные действия: создание заказа, назначение, завершение, доставка, переделка, отмена. */
'use strict';

/* ============ State ============ */
const LS_KEY='dentaflow-demo-v2';
let CLOCK=null; const now=()=>CLOCK||new Date().toISOString();
let S=null;
let saveWarned=false;
function save(){try{localStorage.setItem(LS_KEY,JSON.stringify(S));return true;}catch(e){if(!saveWarned){saveWarned=true;toast('Браузер не дал сохранить данные. Изменения останутся до закрытия вкладки.','warn');}return false;}}
function load(){try{const r=localStorage.getItem(LS_KEY);if(r){const p=JSON.parse(r);if(p&&p.v===2&&Array.isArray(p.orders))return p;}}catch(e){}return null;}

const labById=id=>S.labs.find(l=>l.id===id);
const clinicById=id=>S.clinics.find(c=>c.id===id);
const techById=id=>S.techs.find(t=>t.id===id);
const svcById=id=>S.services.find(s=>s.id===id);
const orderById=id=>S.orders.find(o=>String(o.id)===String(id));
const tn=id=>(techById(id)||{}).name||'—';
const cur=o=>o.cycles[o.cycles.length-1];
const activeA=o=>cur(o).assignments.filter(a=>!a.removedAt);
const priceFor=(clinicId,sid)=>{const c=clinicId&&clinicById(clinicId);const s=svcById(sid);if(!s)return 0;if(c&&!c.oneOff){const ov=S.clinicPrices[clinicId+'|'+sid];if(ov!=null)return ov;}return s.base;};
const rateFor=(tid,sid)=>S.techRates[tid+'|'+sid];
const me=()=>S&&S.session?S.users.find(u=>u.id===S.session.userId):null;
function actorOf(u){if(u.role==='CLINIC')return{id:u.id,role:u.role,name:'Клиника «'+clinicById(u.clinicId).name+'»'};if(u.role==='TECHNICIAN')return{id:u.id,role:u.role,name:techById(u.techId).name};return{id:u.id,role:u.role,name:u.name+' (администратор)'};}
const actor=()=>actorOf(me());

const ST={
 RECEIVED:{clinic:'Отправлено',admin:'Получено',cls:'s-received'},
 IN_PROGRESS:{clinic:'В работе',admin:'В работе',cls:'s-progress'},
 DONE:{clinic:'Сделано',admin:'Сделано',cls:'s-done'},
 IN_DELIVERY:{clinic:'На доставке',admin:'На доставке',cls:'s-delivery'},
 DELIVERED:{clinic:'Получено',admin:'Доставлено',cls:'s-delivered'},
 CANCELLED:{clinic:'Отменён',admin:'Удалено',cls:'s-cancelled'}
};
const statusBadge=(o,role)=>`<span class="badge ${ST[o.status].cls}">${role==='CLINIC'?ST[o.status].clinic:ST[o.status].admin}</span>`;

/* ============ Domain actions (shared by UI and seed) ============ */
function hist(o,type,a,text,extra){o.history.push(Object.assign({at:now(),type,by:a?a.name:'Система',text:text||''},extra||{}));o.updatedAt=now();}
function setStatus(o,st,a,reason,manual){const from=o.status;o.status=st;o.statusChangedAt=now();hist(o,'status',a,reason||'',{from,to:st,manual:!!manual});}
function newCycle(n,reason,comment,a,items){return{n,reason:reason||null,comment:comment||'',openedAt:now(),openedBy:a?a.name:null,items:clone(items),assignments:[],work:[],payments:{},delivery:null};}
function createOrder(d,a){
 const due=d.due||addWorkDays(now(),10);
 const o={id:S.nextId++,labId:d.labId,clinicId:d.clinicId,patient:d.patient,items:d.items,source:d.source,files:d.files||[],comment:d.comment||'',due,dueDefault:!d.due||!!d.dueDefault,createdAt:now(),createdBy:a.name,status:'RECEIVED',statusChangedAt:now(),updatedAt:now(),cycles:[],history:[]};
 o.cycles.push(newCycle(1,null,'',a,o.items));
 hist(o,'create',a,'Заказ оформлен и отправлен в лабораторию «'+labById(o.labId).name+'»');
 S.orders.push(o);return o;}
function checkDone(o,a){const act=activeA(o);if(o.status==='IN_PROGRESS'&&act.length&&act.every(x=>x.doneAt))setStatus(o,'DONE',null,'Все назначенные техники завершили свою часть');}
function assignTechs(o,ids,a){const c=cur(o);const act=c.assignments.filter(x=>!x.removedAt);
 act.forEach(x=>{if(!ids.includes(x.techId)&&!x.doneAt){x.removedAt=now();hist(o,'assign',a,'Снят с заказа: '+tn(x.techId));}});
 ids.forEach(t=>{if(!act.some(x=>x.techId===t)){c.assignments.push({techId:t,assignedAt:now(),removedAt:null,doneAt:null});hist(o,'assign',a,'Назначен техник: '+tn(t));}});
 if(o.status==='RECEIVED')setStatus(o,'IN_PROGRESS',a,'Назначены исполнители');else checkDone(o,a);}
function finishWork(o,tid,items,a){const c=cur(o);const as=c.assignments.find(x=>x.techId===tid&&!x.removedAt&&!x.doneAt);if(!as)return false;
 as.doneAt=now();const calc=items.reduce((s,i)=>s+i.qty*i.rate,0);
 c.work.push({techId:tid,at:now(),items,calc,superseded:false});
 hist(o,'work',a,tn(tid)+' завершил(а) свою часть: '+items.map(i=>i.name+' × '+i.qty).join(', '));
 checkDone(o,a);return true;}
function sendToDelivery(o,a){cur(o).delivery={sentAt:now(),sentBy:a.name,confirmedAt:null,confirmedBy:null,manual:false,reason:''};setStatus(o,'IN_DELIVERY',a,'Передан на доставку');}
function confirmDelivery(o,a,manualReason){const d=cur(o).delivery||(cur(o).delivery={sentAt:now(),sentBy:a.name});d.confirmedAt=now();d.confirmedBy=a.name;d.manual=!!manualReason;d.reason=manualReason||'';
 setStatus(o,'DELIVERED',a,manualReason?'Получение подтверждено администратором вручную: '+manualReason:'Клиника подтвердила получение');}
function openRework(o,reason,comment,a){const n=o.cycles.length+1;o.cycles.push(newCycle(n,reason,comment,a,o.items));
 hist(o,'rework',a,'Оформлена переделка №'+(n-1)+': '+reason+(comment?' — '+comment:''));
 setStatus(o,'RECEIVED',a,'Новый цикл выполнения: переделка №'+(n-1));}
function approvePayment(o,n,tid,amount,comment,a){const c=o.cycles[n-1];c.payments[tid]={approved:amount,comment:comment||'',at:now(),by:a.name};
 hist(o,'payment',a,'Оплата переделки №'+(n-1)+' для '+tn(tid)+': '+money(amount)+(comment?' — '+comment:''));}
function cancelOrder(o,a,reason,evidence){o.cancel={by:a.name,role:a.role,at:now(),reason,evidence:evidence||null};hist(o,'cancel',a,'Заказ отменён: '+reason);setStatus(o,'CANCELLED',a,reason);}
const MOVES={
 IN_PROGRESS:[{to:'RECEIVED',label:'Вернуть в «Получено»',desc:'Снимает исполнителей, которые ещё не завершили работу. Выполненные операции сохраняются.'}],
 DONE:[{to:'IN_PROGRESS',label:'Вернуть в «В работе»',desc:'Исправляет ошибочное завершение. Прежние записи о работе останутся в истории, но не войдут в начисления.'}],
 IN_DELIVERY:[{to:'DONE',label:'Вернуть в «Сделано»',desc:'Отменяет ошибочную передачу на доставку.'}],
 DELIVERED:[{to:'IN_DELIVERY',label:'Вернуть в «На доставке»',desc:'Снимает ошибочное подтверждение получения.'}]
};
function canMoveBack(o){if(o.status==='IN_PROGRESS')return activeA(o).every(x=>!x.doneAt);return !!MOVES[o.status];}
function moveStatus(o,to,reason,a){const c=cur(o);
 if(o.status==='IN_PROGRESS'&&to==='RECEIVED'){c.assignments.forEach(x=>{if(!x.removedAt&&!x.doneAt){x.removedAt=now();}});}
 if(o.status==='DONE'&&to==='IN_PROGRESS'){c.work.forEach(w=>w.superseded=true);c.assignments.forEach(x=>{if(!x.removedAt)x.doneAt=null;});}
 if(o.status==='IN_DELIVERY'&&to==='DONE'){c.delivery=null;}
 if(o.status==='DELIVERED'&&to==='IN_DELIVERY'&&c.delivery){c.delivery.confirmedAt=null;c.delivery.confirmedBy=null;}
 setStatus(o,to,a,reason,true);}
function editOrder(o,d,a){const ch=[];
 if(o.patient!==d.patient)ch.push('ФИО пациента');
 if(JSON.stringify(o.items)!==JSON.stringify(d.items))ch.push('услуги');
 if(o.source!==d.source)ch.push('тип исходных данных');
 if(JSON.stringify(o.files)!==JSON.stringify(d.files))ch.push('файлы');
 if(o.comment!==d.comment)ch.push('комментарий');
 if(o.due!==d.due)ch.push('дата сдачи');
 Object.assign(o,{patient:d.patient,items:d.items,source:d.source,files:d.files,comment:d.comment,due:d.due,dueDefault:d.dueDefault});
 cur(o).items=clone(d.items);
 if(ch.length)hist(o,'edit',a,'Изменены поля: '+ch.join(', '));return ch;}
