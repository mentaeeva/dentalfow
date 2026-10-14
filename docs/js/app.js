/* DentaFlow · Обработчики действий пользователя, навигация и запуск приложения. */
'use strict';

/* ============ Navigation ============ */
function goHome(){const u=me();UI.panel=null;UI.modal=null;UI.menuOpen=false;UI.profileOpen=false;
 if(!u){UI.route='login';return;}
 UI.route=u.role==='CLINIC'?'clinic-orders':u.role==='ADMIN'?'admin-orders':'tech-orders';}
function openOrder(id){const o=orderById(id);UI.detailTab='info';UI.panelEnter=true;UI.focusTarget='#panel-title';
 UI.panel=(o&&canSee(o))?{id:o.id}:{denied:String(id)};render();}
function closePanel(){const id=UI.panel&&UI.panel.id;UI.panel=null;if(id&&document.getElementById('card-'+id))UI.focusTarget='#card-'+id;render();}

/* ============ Click actions ============ */
const A={
 noop(){},
 fillLogin(el){UI.login.login=el.dataset.login;UI.login.pw='demo123';UI.login.error='';UI.focusTarget='.auth-form button[type=submit]';render();},
 togglePw(){UI.login.show=!UI.login.show;UI.focusTarget='#lg-pw';render();},
 moreAcc(){UI.login.more=!UI.login.more;render();},
 home(){UI.loading=false;goHome();render();},
 menu(){UI.menuOpen=true;UI.profileOpen=false;UI.focusTarget='.drawer .side-item.on, .drawer .side-item';render();},
 closeMenu(){UI.menuOpen=false;render();},
 profile(){UI.profileOpen=!UI.profileOpen;render();},
 nav(el){const r=el.dataset.route;UI.menuOpen=false;UI.panel=null;
  if(r==='report'){const k=el.dataset.kind||'tech';if(UI.route!=='report'||UI.report.kind!==k)UI.report={kind:k,target:'',from:'',to:'',params:null};}
  UI.route=r;render();},
 logout(){S.session=null;save();const keep=UI.login.more;UI=freshUI();UI.login.more=keep;lastRoute=null;render();toast('Вы вышли из аккаунта');},
 account(){UI.profileOpen=false;openModal({type:'account'},'.modal-foot .btn');},
 feedback(){UI.profileOpen=false;UI.menuOpen=false;openModal({type:'feedback',rating:0,comment:'',err:false},'.rating button');},
 rate(el){UI.modal.rating=+el.dataset.v;render();},
 feedbackSend(){const M=UI.modal;if(!M.rating){M.err=true;UI.focusTarget='.rating button';render();return;}S.feedback.push({userId:me().id,rating:M.rating,comment:M.comment.trim(),at:now()});save();UI.modal=null;render();toast('Спасибо! Оценка сохранена.');},
 techReport(){UI.profileOpen=false;UI.panel=null;UI.report={kind:'tech',target:me().techId,from:UI.tech.from,to:UI.tech.to,params:null};UI.report.params={kind:'tech',target:me().techId,from:UI.tech.from,to:UI.tech.to,at:now()};UI.route='report';render();},
 open(el){openOrder(el.dataset.id);},
 closePanel(){closePanel();},
 closeModal(){closeModal();},
 dtab(el){UI.detailTab=el.dataset.v;render();},
 toggleCycle(el){UI.openCycles[el.dataset.key]=el.dataset.open!=='true';render();},
 clearQ(el){UI[el.dataset.scope].q='';UI.focusTarget='#'+({clinic:'cl-q',admin:'ad-q',tech:'te-q'}[el.dataset.scope]);render();},
 chip(el){const v=el.dataset.v;UI.clinic.status=v;if(v!=='IN_DELIVERY'){UI.clinic.selectMode=false;UI.clinic.sel=[];}render();},
 goDelivery(){Object.assign(UI.clinic,{status:'IN_DELIVERY',selectMode:true,sel:[],q:'',lab:'all',from:'',to:''});render();},
 resetClinicFilters(){Object.assign(UI.clinic,{q:'',lab:'all',status:'all',from:'',to:'',sort:'new',selectMode:false,sel:[]});if(UI.modal&&UI.modal.type==='filters')UI.modal=null;render();},
 resetAdminFilters(){Object.assign(UI.admin,{q:'',from:'',to:''});render();},
 openFilters(){openModal({type:'filters'},'.modal select');},
 toggleSelect(el){const s=UI[el.dataset.scope];s.selectMode=!s.selectMode;s.sel=[];render();},
 toggleSel(el){const id=+el.dataset.id;const s=me().role==='CLINIC'?UI.clinic:UI.admin;const i=s.sel.indexOf(id);if(i>=0)s.sel.splice(i,1);else s.sel.push(id);render();},
 acceptSelected(){const ids=UI.clinic.sel.slice();if(!ids.length)return;openModal({type:'deliveryConfirm',ids,checks:{}},'.modal input[type=checkbox]');},
 acceptOne(el){openModal({type:'deliveryConfirm',ids:[+el.dataset.id],checks:{}},'.modal input[type=checkbox]');},
 delCheck(el){UI.modal.checks[el.dataset.id]=!UI.modal.checks[el.dataset.id];render();},
 deliveryConfirmOk(){const M=UI.modal;const a=actor();let n=0;M.ids.forEach(id=>{const o=orderById(id);if(o&&o.status==='IN_DELIVERY'&&canSee(o)){confirmDelivery(o,a);n++;}});save();
  UI.modal=null;UI.panel=null;Object.assign(UI.clinic,{selectMode:false,sel:[]});if(!S.orders.some(o=>o.clinicId===me().clinicId&&o.status==='IN_DELIVERY'))UI.clinic.status='DELIVERED';render();
  toast(n===1?'Получение подтверждено. Заказ перешёл в «Получено».':'Получение подтверждено: '+n+' '+plural(n,'заказ','заказа','заказов')+' в «Получено».');},
 // order form
 newOrder(){UI.form=newForm('clinic');UI.panel=null;UI.route='order-form';UI.focusTarget=UI.form.labId?'#f-patient':'#f-lab';render();},
 newOneOff(){UI.form=newForm('admin');UI.panel=null;UI.route='order-form';UI.focusTarget='#f-clinic';render();},
 formBack(){UI.form=null;goHome();render();},
 addRow(){const k=rk();UI.form.rows.push({key:k,serviceId:'',qty:1,price:0});UI.focusTarget='#f-svc-'+k;revalidate();render();},
 delRow(el){const F=UI.form;if(F.rows.length<=1)return;F.rows=F.rows.filter(r=>r.key!==el.dataset.key);revalidate();render();},
 qty(el){const r=UI.form.rows.find(x=>x.key===el.dataset.key);r.qty=Math.max(1,(Number(r.qty)||0)+Number(el.dataset.d));revalidate();render();},
 setSource(el){UI.form.source=el.dataset.v;revalidate();UI.focusTarget='#'+el.id;render();},
 delFile(el){UI.form.files.splice(+el.dataset.i,1);revalidate();render();},
 submitForm(){const F=UI.form;F.showErrors=true;F.errors=validateForm(F);
  if(Object.keys(F.errors).length){UI.focusTarget=firstErrSel(F,F.errors);render();toast('Форма заполнена не полностью. Исправьте отмеченные поля.','err');return;}
  if(!F.due){openModal({type:'dueDefault',date:addWorkDays(new Date().toISOString(),10)});return;}
  doSubmit(false);},
 confirmDefaultDue(){if(UI.modal.busy)return;UI.modal.busy=true;doSubmit(true);},
 confirmLabSwitch(){const F=UI.form;const to=UI.modal.to;let dropped=0;
  F.rows=F.rows.map(r=>{if(!r.serviceId)return r;const old=svcById(r.serviceId);const m=S.services.find(s=>s.labId===to&&s.active&&s.name===old.name);if(!m){dropped++;return null;}return{key:r.key,serviceId:m.id,qty:r.qty,price:priceFor(formClinicId(F),m.id)};}).filter(Boolean);
  if(!F.rows.length)F.rows=[{key:rk(),serviceId:'',qty:1,price:0}];F.labId=to;UI.modal=null;revalidate();render();
  toast(dropped?'Лаборатория изменена. Удалено позиций без аналога: '+dropped+'.':'Лаборатория изменена, цены обновлены.',dropped?'warn':'ok');},
 // clinic detail
 clinicEdit(el){const o=orderById(el.dataset.id);if(!o||o.status!=='RECEIVED')return;UI.form=formFromOrder(o);UI.panel=null;UI.route='order-form';UI.focusTarget='#f-patient';render();},
 clinicCancel(el){openModal({type:'cancelClinic',orderId:+el.dataset.id});},
 clinicCancelConfirm(){const o=orderById(UI.modal.orderId);if(o.status!=='RECEIVED'){UI.modal=null;render();toast('Заказ уже взят в работу. Отменить его может только администратор лаборатории.','err');return;}
  cancelOrder(o,actor(),'Отменён клиникой до назначения техников',null);save();UI.modal=null;UI.panel=null;render();toast('Заказ #'+o.id+' отменён.');},
 // admin
 adminTab(el){Object.assign(UI.admin,{tab:el.dataset.v,selectMode:false,sel:[]});render();},
 assignOpen(el){const o=orderById(el.dataset.id);const re=o.status==='IN_PROGRESS';openModal({type:'assign',orderId:o.id,sel:re?activeA(o).map(a=>a.techId):[],q:'',limit:false,reassign:re},'#as-q');},
 assignToggle(el){const M=UI.modal;const t=el.dataset.tech;const i=M.sel.indexOf(t);M.limit=false;if(i>=0)M.sel.splice(i,1);else if(M.sel.length>=2)M.limit=true;else M.sel.push(t);render();},
 assignConfirm(){const M=UI.modal;const o=orderById(M.orderId);if(!M.sel.length)return;const first=o.status==='RECEIVED';assignTechs(o,M.sel.slice(),actor());save();UI.modal=null;
  const names=M.sel.map(id=>techById(id).short).join(' и ');
  if(first){UI.panel=null;UI.admin.tab='RECEIVED';render();toast('Заказ #'+o.id+' передан в работу: '+names+'.');}
  else{render();toast(o.status==='DONE'?'Состав изменён. Все исполнители завершили работу — заказ в «Сделано».':'Исполнители обновлены: '+names+'.');}},
 sendOne(el){openModal({type:'deliverySend',ids:[+el.dataset.id]});},
 sendSelected(){if(!UI.admin.sel.length)return;openModal({type:'deliverySend',ids:UI.admin.sel.slice()});},
 deliverySendConfirm(){const ids=UI.modal.ids;const a=actor();ids.forEach(id=>{const o=orderById(id);if(o.status==='DONE')sendToDelivery(o,a);});save();UI.modal=null;UI.panel=null;Object.assign(UI.admin,{selectMode:false,sel:[]});render();
  toast(ids.length===1?'Заказ #'+ids[0]+' передан на доставку.':'Передано на доставку: '+ids.length+' '+plural(ids.length,'заказ','заказа','заказов')+'.');},
 manualDeliveryOpen(el){openModal({type:'manualDelivery',orderId:+el.dataset.id,reason:'',err:false});},
 manualDeliveryOk(){const M=UI.modal;if(!M.reason.trim()){M.err=true;UI.focusTarget='#md-r';render();return;}const o=orderById(M.orderId);confirmDelivery(o,actor(),M.reason.trim());save();UI.modal=null;render();toast('Получение заказа #'+o.id+' подтверждено вручную.');},
 reworkOpen(el){openModal({type:'rework',orderId:+el.dataset.id,reason:'',comment:'',err:false});},
 reworkConfirm(){const M=UI.modal;if(!M.reason||(M.reason==='Другое'&&!M.comment.trim())){M.err=true;UI.focusTarget=M.reason?'#rw-c':'#rw-r';render();return;}
  const o=orderById(M.orderId);openRework(o,M.reason,M.comment.trim(),actor());save();UI.modal=null;UI.panel=null;UI.admin.tab='RECEIVED';render();toast('Переделка №'+(o.cycles.length-1)+' оформлена. Заказ #'+o.id+' снова в «Получено».');},
 cancelOpen(el){openModal({type:'cancelAdmin',orderId:+el.dataset.id,reason:'',file:null,conf:false,err:false},'#cn-r');},
 cancelConf(){UI.modal.conf=!UI.modal.conf;render();},
 cancelConfirm(){const M=UI.modal;if(!M.reason.trim()||!M.file||!M.conf){M.err=true;UI.focusTarget=!M.reason.trim()?'#cn-r':!M.file?'#cn-f':'.modal .chk-row input';render();return;}
  const o=orderById(M.orderId);cancelOrder(o,actor(),M.reason.trim(),M.file);save();UI.modal=null;UI.panel=null;render();toast('Заказ #'+o.id+' отменён и перемещён в архив.');},
 moveOpen(el){const o=orderById(el.dataset.id);const opts=MOVES[o.status]||[];openModal({type:'move',orderId:o.id,to:opts.length===1?opts[0].to:'',reason:'',err:false},'#mv-r');},
 moveTo(el){UI.modal.to=el.dataset.v;render();},
 moveConfirm(){const M=UI.modal;if(!M.to||!M.reason.trim()){M.err=true;UI.focusTarget=M.to?'#mv-r':'.radio-row';render();return;}const o=orderById(M.orderId);const from=o.status;
  if(from==='IN_PROGRESS'&&!canMoveBack(o)){UI.modal=null;render();toast('Один из техников уже завершил свою часть — вернуть заказ в «Получено» нельзя.','err');return;}
  moveStatus(o,M.to,M.reason.trim(),actor());save();UI.modal=null;UI.panel=null;UI.admin.tab=M.to;render();toast('Заказ #'+o.id+' перенесён: '+ST[from].admin+' → '+ST[M.to].admin+'.');},
 payPreset(el){const k=el.dataset.key;UI.payDraft[k]=Object.assign({amount:'',comment:''},UI.payDraft[k]||{},{amount:el.dataset.v});render();},
 payApprove(el){const o=orderById(el.dataset.id);const n=+el.dataset.n,tid=el.dataset.tech,max=+el.dataset.max;const key=o.id+'-'+n+'-'+tid;const d=UI.payDraft[key]||{amount:String(max),comment:''};const v=parseMoney(d.amount);
  if(!(v>=0)||String(d.amount).trim()===''||v>max){toast('Сумма должна быть от 0 до '+money(max)+' (полная оплата).','err');UI.focusTarget='#pay-a-'+key;render();return;}
  approvePayment(o,n,tid,Math.round(v),d.comment.trim(),actor());delete UI.payDraft[key];save();render();toast('Оплата переделки утверждена: '+money(v)+'. Сумма войдёт в расчёт зарплаты.');},
 // technician
 techTab(el){UI.tech.tab=el.dataset.v;render();},
 finishOpen(el){const o=orderById(el.dataset.id);const rows={};S.services.filter(s=>s.labId===o.labId&&s.active).forEach(s=>{const it=o.items.find(i=>i.serviceId===s.id);rows[s.id]={on:false,qty:it?it.qty:1};});openModal({type:'finish',orderId:o.id,rows},'.modal .fin-row input[type=checkbox]:not([disabled])');},
 finToggle(el){const r=UI.modal.rows[el.dataset.sid];r.on=!r.on;render();},
 finQty(el){const r=UI.modal.rows[el.dataset.sid];r.qty=Math.max(1,(Number(r.qty)||0)+Number(el.dataset.d));r.on=true;render();},
 finishConfirm(){const M=UI.modal;const o=orderById(M.orderId);const tid=me().techId;
  const items=Object.entries(M.rows).filter(([sid,r])=>r.on&&rateFor(tid,sid)!=null&&Number(r.qty)>=1).map(([sid,r])=>({serviceId:sid,name:svcById(sid).name,qty:Number(r.qty),rate:rateFor(tid,sid)}));
  if(!items.length){toast('Отметьте хотя бы одну выполненную услугу.','err');return;}
  if(!finishWork(o,tid,items,actor())){UI.modal=null;render();toast('Назначение изменилось — обновите карточку заказа.','err');return;}
  save();UI.modal=null;UI.panel=null;render();
  toast(o.status==='DONE'?'Работа завершена. Заказ #'+o.id+' перешёл в «Сделано».':'Ваша часть завершена. Заказ остаётся «В работе», пока коллега не закончит.');},
 // prices & rates
 toggleSvc(el){const k='act|'+el.dataset.sid;const s=svcById(el.dataset.sid);const D=UI.prices.draft;const nv=!((k in D)?D[k]:s.active);if(nv===s.active)delete D[k];else D[k]=nv;render();},
 resetOverride(el){const k='ov|'+el.dataset.sid;const orig=S.clinicPrices[UI.prices.target+'|'+el.dataset.sid];if(orig==null)delete UI.prices.draft[k];else UI.prices.draft[k]='';render();},
 clearRate(el){const k='rate|'+el.dataset.sid;const orig=rateFor(UI.rates.techId,el.dataset.sid);if(orig==null)delete UI.rates.draft[k];else UI.rates.draft[k]='';render();},
 discardDraft(el){UI[el.dataset.scope].draft={};UI[el.dataset.scope].errs=[];render();},
 savePrices(){const P=UI.prices;const errs=[];Object.entries(P.draft).forEach(([k,v])=>{const kind=k.split('|')[0];if(kind==='base'&&!(parseMoney(v)>0))errs.push(k);if(kind==='ov'&&String(v).trim()!==''&&!(parseMoney(v)>0))errs.push(k);if(kind==='name'&&!String(v).trim())errs.push(k);});
  if(errs.length){P.errs=errs;UI.focusTarget='#pr-'+errs[0].replace('|','-');render();toast('Проверьте отмеченные поля: цена — положительное число, название не пустое.','err');return;}
  Object.entries(P.draft).forEach(([k,v])=>{const [kind,sid]=k.split('|');const s=svcById(sid);if(kind==='base')s.base=Math.round(parseMoney(v));if(kind==='name')s.name=String(v).trim();if(kind==='act')s.active=!!v;
   if(kind==='ov'){const key=P.target+'|'+sid;if(String(v).trim()==='')delete S.clinicPrices[key];else S.clinicPrices[key]=Math.round(parseMoney(v));}});
  P.draft={};P.errs=[];save();render();toast('Цены сохранены. Оформленные заказы не пересчитаны.');},
 saveRates(){const R=UI.rates;const errs=Object.entries(R.draft).filter(([k,v])=>String(v).trim()!==''&&!(parseMoney(v)>=0)).map(([k])=>k);
  if(errs.length){R.errs=errs;UI.focusTarget='#rt-'+errs[0].replace('|','-');render();toast('Ставка должна быть числом. Оставьте поле пустым, если техник не выполняет услугу.','err');return;}
  Object.entries(R.draft).forEach(([k,v])=>{const sid=k.split('|')[1];const key=R.techId+'|'+sid;if(String(v).trim()==='')delete S.techRates[key];else S.techRates[key]=Math.round(parseMoney(v));});
  R.draft={};R.errs=[];save();render();toast('Ставки сохранены. Прошлые начисления не изменились.');},
 addService(){const P=UI.prices;const name=P.newName.trim();const price=parseMoney(P.newPrice);const lab=me().labId;
  if(!name){UI.focusTarget='#pr-new-name';render();toast('Введите название услуги.','err');return;}
  if(!(price>0)){UI.focusTarget='#pr-new-price';render();toast('Укажите базовую цену больше нуля.','err');return;}
  if(S.services.some(s=>s.labId===lab&&s.name.toLowerCase()===name.toLowerCase())){toast('Такая услуга уже есть в справочнике.','err');return;}
  S.services.push({id:'s'+Date.now().toString(36),labId:lab,name,base:Math.round(price),active:true});P.newName='';P.newPrice='';save();render();toast('Услуга «'+name+'» добавлена.');},
 // reports
 genReport(){const R=UI.report;R.params={kind:R.kind,target:R.target,from:R.from,to:R.to,at:now()};if(R.from&&R.to&&R.from>R.to){toast('Дата начала позже даты окончания.','err');R.params=null;}render();},
 copyReport(){const t=document.getElementById('rep-table');if(!t){toast('В отчёте нет строк для копирования.','warn');return;}
  const tsv=[...t.rows].map(r=>[...r.cells].map(c=>c.innerText.replace(/\s+/g,' ').trim()).join('\t')).join('\n');
  try{navigator.clipboard.writeText(tsv).then(()=>toast('Таблица скопирована. Её можно вставить в Excel или Google Таблицы.'),()=>selectTable(t));}catch(e){selectTable(t);}},
 // demo
 askReset(){openModal({type:'reset'});},
 resetConfirm(){seed();S.session=null;save();UI=freshUI();lastRoute=null;render();toast('Демо-данные восстановлены.');}
};
function selectTable(t){try{const r=document.createRange();r.selectNodeContents(t);const s=window.getSelection();s.removeAllRanges();s.addRange(r);toast('Таблица выделена — нажмите Ctrl+C, чтобы скопировать.','warn');}catch(e){toast('Не удалось скопировать таблицу.','err');}}
function revalidate(){const F=UI.form;if(F&&F.showErrors)F.errors=validateForm(F);}
function doSubmit(useDefault){const F=UI.form;const a=actor();
 const merged=[];F.rows.filter(r=>r.serviceId).forEach(r=>{const ex=merged.find(m=>m.serviceId===r.serviceId&&m.price===r.price);if(ex)ex.qty+=Number(r.qty);else merged.push({serviceId:r.serviceId,name:svcById(r.serviceId).name,qty:Number(r.qty),price:r.price});});
 const due=useDefault?UI.modal.date:F.due;let o;
 if(F.editId){o=orderById(F.editId);
  if(!o||o.status!=='RECEIVED'){UI.modal=null;render();toast('Пока вы редактировали, лаборатория взяла заказ в работу. Изменения не сохранены — свяжитесь с администратором.','err');return;}
  const ch=editOrder(o,{patient:F.patient.trim(),items:merged,source:F.source,files:F.files,comment:F.comment.trim(),due,dueDefault:useDefault},a);
  toast(ch.length?'Изменения в заказе #'+o.id+' сохранены.':'Изменений нет.');}
 else{let clinicId;
  if(F.mode==='admin'){const nm=F.clinicName.trim();let c=S.clinics.find(x=>x.oneOff&&x.labIds.includes(F.labId)&&x.name.toLowerCase()===nm.toLowerCase());
   if(!c){c={id:'c'+Date.now().toString(36),name:nm,oneOff:true,labIds:[F.labId]};S.clinics.push(c);}clinicId=c.id;}
  else clinicId=me().clinicId;
  o=createOrder({labId:F.labId,clinicId,patient:F.patient.trim(),items:merged,source:F.source,files:F.files,comment:F.comment.trim(),due,dueDefault:useDefault},a);
  toast('Заказ #'+o.id+' отправлен в лабораторию «'+labById(o.labId).name+'».');}
 save();UI.modal=null;UI.form=null;goHome();
 if(me().role==='CLINIC')Object.assign(UI.clinic,{q:'',lab:'all',status:'all',from:'',to:'',sort:'new',selectMode:false,sel:[]});else Object.assign(UI.admin,{tab:'RECEIVED',q:'',from:'',to:''});
 UI.highlight=o.id;render();setTimeout(()=>{if(UI.highlight===o.id){UI.highlight=null;const c=document.getElementById('card-'+o.id);if(c)c.classList.remove('hl');}},2800);}

/* ============ Change handlers (selects with side effects, files) ============ */
const ALLOWED=['stl','ply','obj','dcm','zip','jpg','jpeg','png','pdf'];
function addFiles(list){const F=UI.form;const bad=[];[...list].forEach(f=>{const ext=(f.name.split('.').pop()||'').toLowerCase();
  if(!ALLOWED.includes(ext)){bad.push(f.name+': неподдерживаемый формат');return;}if(f.size>50*1048576){bad.push(f.name+': больше 50 МБ');return;}
  if(F.files.some(x=>x.name===f.name&&x.size===f.size))return;F.files.push({name:f.name,size:f.size});});
 revalidate();render();if(bad.length)toast('Не добавлено: '+bad.join('; ')+'.','err');}
function setEvidence(f){if(!f)return;const ext=(f.name.split('.').pop()||'').toLowerCase();
 if(!['jpg','jpeg','png','pdf','webp','heic'].includes(ext)){toast('Нужен скриншот или фото (JPG, PNG) либо PDF.','err');return;}
 if(f.size>10*1048576){toast('Файл больше 10 МБ. Сожмите скриншот и попробуйте снова.','err');return;}
 const M=UI.modal;if(f.type.startsWith('image/')&&f.size<1.5*1048576){const r=new FileReader();r.onload=()=>{M.file={name:f.name,size:f.size,data:r.result};render();};r.onerror=()=>{M.file={name:f.name,size:f.size,data:null};render();};r.readAsDataURL(f);}
 else{M.file={name:f.name,size:f.size,data:null};render();}}
const C={
 labPick(el){const F=UI.form;const to=el.value;if(!to||to===F.labId){if(!to&&!F.rows.some(r=>r.serviceId)){F.labId=null;revalidate();}render();return;}
  if(F.labId&&F.rows.some(r=>r.serviceId)){el.value=F.labId;openModal({type:'labSwitch',to});return;}
  F.labId=to;F.rows=F.rows.map(r=>({key:r.key,serviceId:'',qty:r.qty,price:0}));revalidate();UI.focusTarget='#f-patient';render();},
 files(el){addFiles(el.files);el.value='';},
 evidence(el){setEvidence(el.files[0]);el.value='';},
 priceTarget(el){if(Object.keys(UI.prices.draft).length){el.value=UI.prices.target;toast('Сначала сохраните или отмените изменения в текущем прайсе.','warn');return;}UI.prices.target=el.value;UI.prices.errs=[];render();},
 rateTech(el){if(Object.keys(UI.rates.draft).length){el.value=UI.rates.techId;toast('Сначала сохраните или отмените изменения ставок.','warn');return;}UI.rates.techId=el.value;UI.rates.errs=[];render();}
};

/* ============ Event wiring ============ */
document.addEventListener('click',e=>{
 const t=e.target.closest('[data-act]');
 if(UI.profileOpen&&!e.target.closest('.menu')&&!e.target.closest('.profile-btn')){UI.profileOpen=false;if(!t||!A[t.dataset.act]){render();return;}}
 if(!t)return;const fn=A[t.dataset.act];if(!fn)return;
 if(t.disabled||t.getAttribute('aria-disabled')==='true'&&t.dataset.act!=='submitForm')return;
 fn(t,e);});
document.addEventListener('input',e=>{const el=e.target;
 if(el.dataset.model){setPath(UI,el.dataset.model,el.value);const p=el.dataset.model;
  if(p==='clinic.status'&&el.value!=='IN_DELIVERY'){UI.clinic.selectMode=false;UI.clinic.sel=[];}
  if(p.startsWith('login.'))UI.login.error='';
  if(p.startsWith('form.'))revalidate();
  render();return;}
 if(el.dataset.rowsvc){const F=UI.form;const r=F.rows.find(x=>x.key===el.dataset.rowsvc);r.serviceId=el.value;r.price=el.value?rowPrice(F,el.value):0;revalidate();render();return;}
 if(el.dataset.rowqty){const r=UI.form.rows.find(x=>x.key===el.dataset.rowqty);const v=el.value.replace(/\D/g,'').slice(0,3);r.qty=v===''?'':Number(v);revalidate();render();return;}
 if(el.dataset.finqty){const r=UI.modal.rows[el.dataset.finqty];const v=el.value.replace(/\D/g,'').slice(0,3);r.qty=v===''?'':Number(v);if(v)r.on=true;render();return;}
 if(el.dataset.draft){const sc=UI[el.dataset.draft];const k=el.dataset.key;const kind=k.split('|')[0];let orig;const sid=k.split('|')[1];
  if(el.dataset.draft==='prices'){const s=svcById(sid);orig=kind==='name'?s.name:kind==='base'?s.base:(S.clinicPrices[UI.prices.target+'|'+sid]==null?'':S.clinicPrices[UI.prices.target+'|'+sid]);}
  else{const r=rateFor(UI.rates.techId,sid);orig=r==null?'':r;}
  if(String(el.value)===String(orig))delete sc.draft[k];else sc.draft[k]=el.value;sc.errs=sc.errs.filter(x=>x!==k);render();return;}
 if(el.dataset.pay){const k=el.dataset.pay;UI.payDraft[k]=Object.assign({amount:'',comment:''},UI.payDraft[k]||{});if(!UI.payDraft[k].amount&&el.dataset.f!=='amount'){const [oid,n,tid]=k.split('-');const o=orderById(oid);const w=o.cycles[n-1].work.find(x=>x.techId===tid&&!x.superseded);UI.payDraft[k].amount=String(w?w.calc:'');}
  UI.payDraft[k][el.dataset.f]=el.value;return;}
});
document.addEventListener('change',e=>{const el=e.target;if(el.dataset.change&&C[el.dataset.change])C[el.dataset.change](el,e);});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target.dataset.form;
 if(f==='login'){const L=UI.login;if(L.busy)return;if(!L.login.trim()||!L.pw){L.error='Введите логин и пароль.';UI.focusTarget=L.login.trim()?'#lg-pw':'#lg-login';render();return;}
  const u=S.users.find(x=>x.login===L.login.trim().toLowerCase()&&x.password===L.pw);
  if(!u){L.error='Неверный логин или пароль. Проверьте раскладку клавиатуры и попробуйте снова.';UI.focusTarget='#lg-pw';render();return;}
  L.busy=true;L.error='';render();
  setTimeout(()=>{S.session={userId:u.id,at:now()};save();const more=UI.login.more;UI=freshUI();UI.login.more=more;goHome();UI.loading=true;render();setTimeout(()=>{UI.loading=false;render();},380);},420);}
 if(f==='openById'){const id=UI.demoId.trim().replace(/^#/,'');if(!id){UI.focusTarget='#demo-id';render();toast('Введите номер заказа.','warn');return;}openOrder(id);}
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){if(UI.modal){const crit=['cancelAdmin','deliveryConfirm'].includes(UI.modal.type);if(!crit){closeModal();e.preventDefault();}return;}
  if(UI.profileOpen){UI.profileOpen=false;render();return;}if(UI.menuOpen){UI.menuOpen=false;UI.focusTarget='[data-act=menu]';render();return;}if(UI.panel){closePanel();return;}}
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('article[role=button]')){e.preventDefault();e.target.click();}
});
document.addEventListener('dragover',e=>{const z=e.target.closest('[data-drop]');if(z){e.preventDefault();z.classList.add('drag');}});
document.addEventListener('dragleave',e=>{const z=e.target.closest('[data-drop]');if(z&&!z.contains(e.relatedTarget))z.classList.remove('drag');});
document.addEventListener('drop',e=>{const z=e.target.closest('[data-drop]');if(!z)return;e.preventDefault();z.classList.remove('drag');const fl=e.dataTransfer&&e.dataTransfer.files;if(!fl||!fl.length)return;
 if(z.dataset.drop==='form')addFiles(fl);else setEvidence(fl[0]);});
window.addEventListener('offline',()=>toast('Нет подключения к сети. Демо продолжит работать: данные хранятся в этом браузере.','warn'));
window.addEventListener('storage',e=>{if(e.key===LS_KEY&&e.newValue){const p=load();if(p){S=p;if(!me()){UI=freshUI();}render();}}});

/* ============ Boot ============ */
S=load();if(!S){seed();save();}
if(me())goHome();
render();
