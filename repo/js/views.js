/* DentaFlow · Отрисовка интерфейса: экран входа, кабинеты ролей, карточки, форма заказа, детальная панель, модальные окна, справочники, отчёты. */
'use strict';

/* ============ UI state ============ */
const freshUI=()=>({route:'login',menuOpen:false,profileOpen:false,modal:null,modalEnter:false,panel:null,panelEnter:false,detailTab:'info',openCycles:{},payDraft:{},
 loading:false,highlight:null,focusTarget:null,demoId:'',
 login:{login:'',pw:'',show:false,error:'',busy:false,more:false},
 clinic:{q:'',lab:'all',status:'all',from:'',to:'',sort:'new',selectMode:false,sel:[]},
 admin:{tab:'RECEIVED',q:'',from:'',to:'',selectMode:false,sel:[]},
 tech:{tab:'progress',q:'',from:'',to:''},
 form:null,
 prices:{target:'base',draft:{},errs:[],newName:'',newPrice:''},
 rates:{techId:null,draft:{},errs:[]},
 report:{kind:'payroll',target:'',from:'',to:'',params:null}});
let UI=freshUI();
let lastRoute=null;

function setPath(obj,path,v){const p=path.split('.');let o=obj;for(let i=0;i<p.length-1;i++)o=o[p[i]];o[p[p.length-1]]=v;}

/* ============ Access ============ */
function canSee(o,u){u=u||me();if(!o||!u)return false;
 if(u.role==='CLINIC')return o.clinicId===u.clinicId&&o.status!=='CANCELLED';
 if(u.role==='ADMIN')return o.labId===u.labId;
 if(u.role==='TECHNICIAN')return o.labId===u.labId&&o.status!=='CANCELLED'&&o.cycles.some(c=>c.assignments.some(a=>a.techId===u.techId&&!a.removedAt));
 return false;}
function myTechState(o){const u=me();const a=cur(o).assignments.find(x=>x.techId===u.techId&&!x.removedAt);
 if(a&&!a.doneAt&&o.status==='IN_PROGRESS')return 'progress';
 if(o.cycles.some(c=>c.assignments.some(x=>x.techId===u.techId&&!x.removedAt&&x.doneAt)))return 'done';
 if(a&&!a.doneAt)return 'progress';return null;}

/* ============ Toasts ============ */
function toast(msg,kind){kind=kind||'ok';const box=document.getElementById('toasts');const el=document.createElement('div');el.className='toast '+kind;
 el.innerHTML=`<span class="ti">${ic(kind==='ok'?'check':'alert',14)}</span><span class="tx">${esc(msg)}</span><button type="button" aria-label="Закрыть уведомление">${ic('x',16)}</button>`;
 el.querySelector('button').onclick=()=>el.remove();box.appendChild(el);setTimeout(()=>el.remove(),kind==='ok'?4000:5500);}

/* ============ Render core ============ */
const app=document.getElementById('app');
function render(){
 const a=document.activeElement;const fid=a&&a.id;let ss=null,se=null;try{ss=a.selectionStart;se=a.selectionEnd;}catch(e){}
 const scrolls={};document.querySelectorAll('[data-scroll]').forEach(el=>scrolls[el.dataset.scroll]=el.scrollTop);
 const wy=window.scrollY;const routeKey=UI.route+'|'+(UI.route==='report'?UI.report.kind:'');
 app.innerHTML=view();
 document.querySelectorAll('[data-scroll]').forEach(el=>{if(scrolls[el.dataset.scroll]!=null)el.scrollTop=scrolls[el.dataset.scroll];});
 if(routeKey!==lastRoute){window.scrollTo(0,0);lastRoute=routeKey;}else window.scrollTo(0,wy);
 if(UI.focusTarget){const t=document.querySelector(UI.focusTarget);UI.focusTarget=null;if(t){t.focus({preventScroll:false});}}
 else if(fid){const n=document.getElementById(fid);if(n&&n!==document.activeElement){n.focus({preventScroll:true});try{if(ss!=null)n.setSelectionRange(ss,se);}catch(e){}}}
 UI.panelEnter=false;UI.modalEnter=false;
 document.body.classList.toggle('lock',!!(UI.panel||UI.modal||UI.menuOpen));
}
function openModal(m,focusSel){UI.modal=m;UI.modalEnter=true;UI.focusTarget=focusSel||'.modal [data-autofocus], .modal input:not([disabled]):not([type=hidden]), .modal select, .modal textarea, .modal-foot .btn';render();}
function closeModal(){UI.modal=null;render();}

function view(){
 if(UI.route==='login'||!me())return vLogin();
 const u=me();let body='';
 if(UI.loading)body=vSkeleton();
 else switch(UI.route){
  case 'clinic-orders':body=vClinicOrders();break;
  case 'order-form':body=vOrderForm();break;
  case 'admin-orders':body=vAdminOrders();break;
  case 'admin-prices':body=vPrices();break;
  case 'admin-rates':body=vRates();break;
  case 'report':body=vReport();break;
  case 'admin-analytics':body=vAnalytics();break;
  case 'admin-accounts':body=vAccounts();break;
  case 'tech-orders':body=vTechOrders();break;
  default:body='';}
 return vTop()+`<main class="page" id="main">${body}${vDemoBar()}</main>`+(u.role==='ADMIN'&&UI.menuOpen?vSidebar():'')+vPanel()+vModal();
}
function vSkeleton(){const card=`<div class="skel-card"><div style="display:flex;justify-content:space-between"><div class="skel" style="width:110px;height:14px"></div><div class="skel" style="width:84px;height:22px;border-radius:999px"></div></div><div class="skel" style="width:60%;height:18px"></div><div class="skel" style="width:44%;height:14px"></div><div class="skel" style="width:70%;height:14px;margin-top:auto"></div></div>`;
 return `<div class="page-head"><div><div class="skel" style="width:220px;height:30px"></div><div class="skel" style="width:280px;height:14px;margin-top:10px"></div></div></div><div class="skel" style="height:48px;border-radius:12px;margin-bottom:16px"></div><div class="grid" aria-busy="true" aria-label="Загрузка заказов">${card.repeat(4)}</div>`;}

function routePath(){const u=me();if(!u)return '/login';let p='';
 switch(UI.route){case 'clinic-orders':p='/clinic/orders';break;case 'order-form':p=UI.form&&UI.form.editId?'/clinic/orders/'+UI.form.editId+'/edit':(u.role==='ADMIN'?'/admin/orders/new':'/clinic/orders/new');break;
  case 'admin-orders':p='/admin/orders';break;case 'admin-prices':p='/admin/prices/clinics';break;case 'admin-rates':p='/admin/prices/technicians';break;
  case 'report':p=UI.report.kind==='payroll'?'/admin/payroll':UI.report.kind==='receivables'?'/admin/receivables':'/technician/reports';break;
  case 'admin-analytics':p='/admin/analytics';break;case 'admin-accounts':p='/admin/accounts';break;case 'tech-orders':p='/technician/orders';break;}
 if(UI.panel){const base=u.role==='CLINIC'?'/clinic/orders/':u.role==='ADMIN'?'/admin/orders/':'/technician/orders/';p=base+(UI.panel.denied!=null?UI.panel.denied:UI.panel.id);}
 return p;}
function vDemoBar(){return `<footer class="demobar" aria-label="Демо-режим"><div class="demo-l"><span class="demo-tag">Демо</span><code>${esc(routePath())}</code></div>
 <form class="demo-open" data-form="openById"><label for="demo-id">Открыть заказ по ID</label><input id="demo-id" class="input" inputmode="numeric" placeholder="1040" value="${esc(UI.demoId)}" data-model="demoId" autocomplete="off"><button class="btn sm outline" type="submit">Открыть</button></form>
 <button type="button" class="btn sm ghost push" data-act="askReset">${ic('refresh',16)}Сбросить демо-данные</button></footer>`;}

/* ============ Login ============ */
const DEMO_MAIN=['moydent','alfa.admin','erasyl'];
const ROLE_RU={CLINIC:'Клиника',ADMIN:'Админ',TECHNICIAN:'Техник'};
function accName(u){if(u.role==='CLINIC')return 'Клиника «'+clinicById(u.clinicId).name+'»';if(u.role==='ADMIN')return u.name+' · '+labById(u.labId).name;return u.name+' · '+labById(u.labId).name;}
function vLogin(){const L=UI.login;
 const accRow=u=>`<button type="button" class="acc" data-act="fillLogin" data-login="${esc(u.login)}"><span class="role ${u.role}">${ROLE_RU[u.role]}</span><span class="grow"><span class="nm" style="display:block">${esc(accName(u))}</span><code>${esc(u.login)}</code></span>${ic('chev',16)}</button>`;
 const main=S.users.filter(u=>DEMO_MAIN.includes(u.login)).sort((a,b)=>DEMO_MAIN.indexOf(a.login)-DEMO_MAIN.indexOf(b.login));
 const rest=S.users.filter(u=>!DEMO_MAIN.includes(u.login));
 return `<div class="auth">
 <section class="auth-brand">
  <div class="logo" style="cursor:default">${logoMark()}<span>DentaFlow</span></div>
  <div class="auth-copy"><h1 class="auth-h">Управление заказами зуботехнических лабораторий</h1>
   <p>Клиника оформляет заказ-наряд, лаборатория распределяет работу между техниками, и все участники видят один и тот же статус без переписки в мессенджерах.</p></div>
  <div class="ill" aria-hidden="true">
   <div class="ill-card a"><div class="t"><span>Сегодня · 14:30</span><span class="badge s-received">Получено</span></div><div class="n">Иванов Иван Иванович</div><div>Циркониевая коронка × 2</div><div class="f"><span>Клиника: Мой Дент</span><b>#1048</b></div></div>
   <div class="ill-card b"><div class="t"><span>Вчера · 16:10</span><span class="badge s-progress">В работе</span></div><div class="n">Сидоров Арман</div><div style="display:flex;gap:6px;margin-top:2px"><span class="tchip done"><span class="mini-av">ЕН</span>Ерасыл</span><span class="tchip"><span class="mini-av">ОС</span>Омар</span></div><div class="f"><span>Клиника: Баз Дент</span><b>#1045</b></div></div>
   <div class="ill-card c"><div class="t"><span>13 окт. · 11:20</span><span class="badge s-delivery">На доставке</span></div><div class="n">Петрова Анна Сергеевна</div><div>Временная коронка ПММА × 1</div><div class="f"><span>Лаборатория: Бета</span><b>#1047</b></div></div>
  </div>
  <p class="auth-foot">Заказы · назначения · переделки · расчёты — в одном кабинете</p>
 </section>
 <main class="auth-main"><form class="auth-form" data-form="login" novalidate>
  <div class="logo logo-compact" style="cursor:default">${logoMark()}<span>DentaFlow</span></div>
  <div><h2>Добро пожаловать</h2><p class="muted" style="margin-top:6px">Войдите под учётной записью клиники, администратора лаборатории или техника. Нужный кабинет откроется автоматически.</p></div>
  <div class="field"><label for="lg-login">Логин</label><input id="lg-login" class="input${L.error?' err':''}" autocomplete="username" value="${esc(L.login)}" data-model="login.login" autocapitalize="none" spellcheck="false"></div>
  <div class="field"><label for="lg-pw">Пароль</label><div class="pw"><input id="lg-pw" class="input${L.error?' err':''}" type="${L.show?'text':'password'}" autocomplete="current-password" value="${esc(L.pw)}" data-model="login.pw"><button type="button" class="pw-t" data-act="togglePw" aria-label="${L.show?'Скрыть пароль':'Показать пароль'}">${ic(L.show?'eyeoff':'eye',19)}</button></div></div>
  ${L.error?`<div class="auth-err" role="alert">${ic('alert',17)}<span>${esc(L.error)}</span></div>`:''}
  <button class="btn primary full" type="submit" ${L.busy?'disabled':''}>${L.busy?'<span class="spin"></span>Входим…':'Войти'}</button>
  <p class="demo-note">Демонстрационная версия. Все данные вымышленные и хранятся только в этом браузере.</p>
  <div class="demo-acc"><div class="demo-acc-h"><span>Тестовые аккаунты</span><span>пароль: demo123</span></div>
   ${main.map(accRow).join('')}
   ${L.more?rest.map(accRow).join(''):''}
   <button type="button" class="acc-more" data-act="moreAcc">${L.more?'Скрыть дополнительные':'Ещё '+rest.length+' '+plural(rest.length,'аккаунт','аккаунта','аккаунтов')+': вторая лаборатория, клиники, техники'}</button>
  </div>
 </form></main></div>`;}

/* ============ Top bar & sidebar ============ */
function vTop(){const u=me();let crumb='',pn='',pr='';
 if(u.role==='CLINIC'){pn='Клиника «'+clinicById(u.clinicId).name+'»';pr='Кабинет клиники';}
 if(u.role==='ADMIN'){const l=labById(u.labId);crumb=`<span class="crumb">/ ${esc(l.full)}</span>`;pn=u.name;pr='Администратор · '+l.name;}
 if(u.role==='TECHNICIAN'){const t=techById(u.techId);pn=t.name;pr='Техник · '+labById(t.labId).full;}
 return `<header class="topbar"><div class="topbar-in">
 ${u.role==='ADMIN'?`<button type="button" class="iconbtn" data-act="menu" aria-label="Открыть меню" aria-expanded="${UI.menuOpen}">${ic('menu')}</button>`:''}
 <button type="button" class="logo" data-act="home" aria-label="DentaFlow — на главную">${logoMark()}<span class="logo-t">DentaFlow</span></button>${crumb}
 <div class="top-right"><button type="button" class="profile-btn" data-act="profile" aria-haspopup="menu" aria-expanded="${UI.profileOpen}" aria-label="Меню профиля"><span class="pt"><span class="pn">${esc(pn)}</span><span class="pr">${esc(pr)}</span></span><span class="avatar">${esc(initials(pn))}</span></button>
 ${UI.profileOpen?`<div class="menu" role="menu"><button type="button" role="menuitem" data-act="account">${ic('user')}Аккаунт</button>${u.role==='TECHNICIAN'?`<button type="button" role="menuitem" data-act="techReport">${ic('receipt')}Отчёт о проделанной работе</button>`:''}<button type="button" role="menuitem" data-act="feedback">${ic('star')}Оценить удобство</button><hr><button type="button" role="menuitem" data-act="logout">${ic('logout')}Выйти</button></div>`:''}
 </div></div></header>`;}
function vSidebar(){const l=labById(me().labId);const r=UI.route,k=UI.report.kind;
 const it=(route,icn,label,kind)=>{const on=route===r&&(!kind||kind===k);return `<button type="button" class="side-item ${on?'on':''}" data-act="nav" data-route="${route}"${kind?` data-kind="${kind}"`:''} ${on?'aria-current="page"':''}>${ic(icn,19)}<span>${label}</span></button>`;};
 return `<div class="drawer-wrap"><div class="scrim" data-act="closeMenu"></div><nav class="drawer" aria-label="Меню лаборатории">
 <div class="drawer-head"><div style="flex:1;min-width:0"><div class="dh-k">Текущая лаборатория</div><div class="dh-n">${esc(l.full)}</div></div><button type="button" class="iconbtn plain" data-act="closeMenu" aria-label="Закрыть меню">${ic('x')}</button></div>
 <div class="side-sec">Работа</div>${it('admin-orders','orders','Заказы')}${it('admin-analytics','chart','Аналитика')}
 <div class="side-sec">Финансы</div>${it('report','wallet','Зарплаты техникам','payroll')}${it('report','receipt','Расчёты с клиниками','receivables')}
 <div class="side-sec">Справочники</div>${it('admin-prices','tag','Цены клиник')}${it('admin-rates','user','Ставки техников')}${it('admin-accounts','users','Аккаунты')}
 <div class="side-sec">Система</div><button type="button" class="side-item" data-act="feedback">${ic('star',19)}<span>Оценить удобство</span></button><button type="button" class="side-item" data-act="logout">${ic('logout',19)}<span>Выйти</span></button>
 </nav></div>`;}

/* ============ Cards ============ */
function svcSummary(items){if(!items.length)return '—';const f=items[0];if(items.length===1)return f.name+' × '+f.qty;const n=items.length-1;return f.name+' × '+f.qty+' + '+n+' '+plural(n,'услуга','услуги','услуг');}
function vCard(o,role,opts){opts=opts||{};const lab=labById(o.labId),cl=clinicById(o.clinicId);
 let badge;if(role==='TECHNICIAN'){badge=myTechState(o)==='done'?'<span class="badge s-done">Сделано</span>':'<span class="badge s-progress">В работе</span>';}else badge=statusBadge(o,role);
 const rework=o.cycles.length>1?`<span class="mark-rework">${ic('refresh',12)}Переделка №${o.cycles.length-1}</span>`:'';
 let techRow='';
 if(role==='ADMIN'&&o.status==='IN_PROGRESS'){techRow=`<div class="card-techs"><span class="lbl">Техники:</span>${activeA(o).map(a=>{const t=techById(a.techId);return `<span class="tchip ${a.doneAt?'done':''}" title="${esc(t.name)}${a.doneAt?' — часть завершена':''}"><span class="mini-av">${esc(initials(t.name))}</span>${esc(t.short)}${a.doneAt?ic('check',12):''}</span>`;}).join('')}</div>`;}
 let left;
 if(role==='CLINIC')left=`<span>Лаборатория: <b>${esc(lab.name)}</b></span>`;
 else if(role==='ADMIN')left=`<span>Клиника: <b>${esc(cl.name)}</b></span>${cl.oneOff?'<span class="mark-oneoff">Разовая клиника</span>':''}`;
 else left=`<span>Клиника: <b>${esc(cl.name)}</b></span><span class="due">До: <b>${fmtDay(o.due)}</b></span>`;
 const sel=opts.selectable,chk=opts.checked;
 return `<article id="card-${o.id}" class="card${o.status==='CANCELLED'?' muted':''}${chk?' checked':''}${UI.highlight===o.id?' hl':''}" data-act="${sel?'toggleSel':'open'}" data-id="${o.id}" tabindex="0" role="button" aria-label="Заказ #${o.id}, ${esc(o.patient)}${sel?(chk?', выбран':', не выбран'):''}">
 <div class="card-top">${sel?`<input type="checkbox" class="cbx" ${chk?'checked':''} aria-label="Выбрать заказ #${o.id}" data-act="toggleSel" data-id="${o.id}" tabindex="-1">`:''}<span class="meta">${fmtDT(o.createdAt)}</span>${badge}</div>
 <div class="card-name">${esc(o.patient)}</div>
 <div class="card-svc"><span>${esc(svcSummary(o.items))}</span>${rework}</div>
 ${techRow}
 <div class="card-foot"><span class="cf-l">${left}</span><span class="cid">#${o.id}</span></div></article>`;}
function vEmpty(icn,title,text,btn){return `<div class="empty"><span class="empty-ic">${ic(icn,26)}</span><h3>${title}</h3>${text?`<p>${text}</p>`:''}${btn||''}</div>`;}
function sortOrders(list,sort){const by=(a,b)=>new Date(b.createdAt)-new Date(a.createdAt);const l=list.slice();
 if(sort==='old')return l.sort((a,b)=>-by(a,b));
 if(sort==='labAZ'||sort==='labZA'){const dir=sort==='labAZ'?1:-1;return l.sort((a,b)=>{const c=labById(a.labId).name.localeCompare(labById(b.labId).name,'ru')*dir;return c||by(a,b);});}
 return l.sort(by);}
function matchQ(o,q,withClinic){q=q.trim().toLowerCase().replace(/^#/,'');if(!q)return true;if(String(o.id).includes(q))return true;const p=o.patient.toLowerCase();if(q.split(/\s+/).every(w=>p.includes(w)))return true;
 if(withClinic){const c=clinicById(o.clinicId);if(c&&c.name.toLowerCase().includes(q))return true;}return false;}
function vSearch(scope,id,ph){const v=UI[scope].q;return `<div class="search"><span class="search-ic">${ic('search',19)}</span><input id="${id}" class="input" type="search" placeholder="${ph}" value="${esc(v)}" data-model="${scope}.q" aria-label="${ph}" autocomplete="off">${v?`<button type="button" class="search-x" data-act="clearQ" data-scope="${scope}" aria-label="Очистить поиск">${ic('x',17)}</button>`:''}</div>`;}
function vPeriod(scope,prefix){const s=UI[scope];return `<div class="fsel ${s.from||s.to?'active':''}"><span>Период</span><input type="date" id="${prefix}-from" value="${esc(s.from)}" data-model="${scope}.from" aria-label="Период с"${s.to?` max="${s.to}"`:''}><span class="dash">—</span><input type="date" id="${prefix}-to" value="${esc(s.to)}" data-model="${scope}.to" aria-label="Период по"${s.from?` min="${s.from}"`:''}></div>`;}

/* ============ CLINIC ============ */
const CL_STATUS=[['all','Все'],['RECEIVED','Отправлено'],['IN_PROGRESS','В работе'],['DONE','Сделано'],['IN_DELIVERY','На доставке'],['DELIVERED','Получено']];
function clinicFilterControls(px){const f=UI.clinic,c=clinicById(me().clinicId);
 return `<label class="fsel ${f.lab!=='all'?'active':''}"><span>Лаборатория:</span><select id="${px}-lab" data-model="clinic.lab"><option value="all">Все</option>${c.labIds.map(id=>`<option value="${id}" ${f.lab===id?'selected':''}>${esc(labById(id).name)}</option>`).join('')}</select></label>
 <label class="fsel ${f.status!=='all'?'active':''}"><span>Статус:</span><select id="${px}-st" data-model="clinic.status">${CL_STATUS.map(([v,l])=>`<option value="${v}" ${f.status===v?'selected':''}>${l}</option>`).join('')}</select></label>
 ${vPeriod('clinic',px)}
 <label class="fsel"><span>Сортировка:</span><select id="${px}-sort" data-model="clinic.sort"><option value="new" ${f.sort==='new'?'selected':''}>Сначала новые</option><option value="old" ${f.sort==='old'?'selected':''}>Сначала старые</option><option value="labAZ" ${f.sort==='labAZ'?'selected':''}>Лаборатории А–Я</option><option value="labZA" ${f.sort==='labZA'?'selected':''}>Лаборатории Я–А</option></select></label>`;}
function clinicList(){const u=me(),f=UI.clinic;let l=S.orders.filter(o=>o.clinicId===u.clinicId&&o.status!=='CANCELLED');
 if(f.lab!=='all')l=l.filter(o=>o.labId===f.lab);if(f.status!=='all')l=l.filter(o=>o.status===f.status);
 if(f.from||f.to)l=l.filter(o=>inRange(o.createdAt,f.from,f.to));if(f.q.trim())l=l.filter(o=>matchQ(o,f.q));return sortOrders(l,f.sort);}
const clinicFiltersActive=()=>{const f=UI.clinic;return (f.lab!=='all')+(f.status!=='all')+(f.from||f.to?1:0)+(f.sort!=='new');};
function vClinicOrders(){const u=me(),c=clinicById(u.clinicId),f=UI.clinic;
 const all=S.orders.filter(o=>o.clinicId===c.id&&o.status!=='CANCELLED');const inDel=all.filter(o=>o.status==='IN_DELIVERY');
 const list=clinicList();const nAct=clinicFiltersActive();
 let h=`<div class="page-head"><div><h1>История заказов</h1><p class="lead">Клиника «${esc(c.name)}» · лаборатории-партнёры: ${c.labIds.map(id=>esc(labById(id).name)).join(', ')}</p></div></div>`;
 if(inDel.length&&f.status!=='IN_DELIVERY')h+=`<div class="notice"><span class="notice-ic">${ic('truck')}</span><div><b>${inDel.length} ${plural(inDel.length,'заказ','заказа','заказов')} на доставке.</b> Отметьте полученные работы, чтобы лаборатория увидела подтверждение.</div><button type="button" class="btn sm outline" data-act="goDelivery">Перейти к приёмке</button></div>`;
 h+=vSearch('clinic','cl-q','Поиск по ФИО пациента или ID');
 h+=`<div class="filters">${clinicFilterControls('clf')}${nAct?`<button type="button" class="btn sm ghost filter-reset" data-act="resetClinicFilters">Сбросить фильтры</button>`:''}</div>`;
 h+=`<div class="filters-m"><button type="button" class="btn sm outline" data-act="openFilters">${ic('filter',16)}Фильтры${nAct?' · '+nAct:''}</button>${nAct?`<button type="button" class="btn sm ghost" data-act="resetClinicFilters">Сбросить</button>`:''}</div>`;
 h+=`<div class="chips" role="group" aria-label="Статус заказа">${CL_STATUS.map(([v,l])=>{const n=v==='all'?all.length:all.filter(o=>o.status===v).length;return `<button type="button" class="chip ${f.status===v?'on':''}" data-act="chip" data-v="${v}" aria-pressed="${f.status===v}">${l}<span class="cnt">${n}</span></button>`;}).join('')}</div>`;
 if(f.status==='IN_DELIVERY'&&list.length)h+=`<div class="toolbar"><span class="grow muted">Отметьте заказы, которые клиника фактически получила, и подтвердите приёмку.</span><button type="button" class="btn sm ${f.selectMode?'primary':'outline'}" data-act="toggleSelect" data-scope="clinic">${f.selectMode?'Готово':'Выбрать'}</button></div>`;
 if(!all.length)h+=vEmpty('inbox','Заказов пока нет','Оформите первый заказ-наряд: выберите лабораторию, услуги и приложите скан или отметьте слепок.',`<button type="button" class="btn primary" data-act="newOrder">${ic('plus')}Создать первый заказ</button>`);
 else if(!list.length)h+=vEmpty('search','Заказы не найдены','По выбранным условиям ничего нет. Измените запрос или сбросьте фильтры.',`<button type="button" class="btn outline" data-act="resetClinicFilters">Сбросить фильтры</button>`);
 else{h+=`<div class="result-line">Показано ${list.length} из ${all.length}</div>`;
  const opt=o=>({selectable:f.selectMode&&o.status==='IN_DELIVERY',checked:f.sel.includes(o.id)});
  if(f.sort==='labAZ'||f.sort==='labZA'){const groups=[];list.forEach(o=>{let g=groups.find(x=>x.lab===o.labId);if(!g)groups.push(g={lab:o.labId,items:[]});g.items.push(o);});
   h+=groups.map(g=>`<h2 class="group-h">${esc(labById(g.lab).full)}<span class="cnt">${g.items.length}</span></h2><div class="grid">${g.items.map(o=>vCard(o,'CLINIC',opt(o))).join('')}</div>`).join('');}
  else h+=`<div class="grid">${list.map(o=>vCard(o,'CLINIC',opt(o))).join('')}</div>`;}
 if(f.selectMode)h+=`<div class="selbar" role="region" aria-label="Выбранные заказы"><span class="grow">Выбрано ${f.sel.length} из ${list.filter(o=>o.status==='IN_DELIVERY').length}</span><button type="button" class="btn sm outline" data-act="toggleSelect" data-scope="clinic">Отмена</button><button type="button" class="btn sm primary" data-act="acceptSelected" ${f.sel.length?'':'disabled'}>${ic('check',16)}Принято</button></div>`;
 else h+=`<button type="button" class="fab" data-act="newOrder" aria-label="Новый заказ-наряд" title="Новый заказ-наряд">${ic('plus',26)}</button>`;
 return h;}

/* ============ Order form (CL-02 / AD-03) ============ */
let rkN=0;const rk=()=>'r'+(++rkN);
function newForm(mode){const u=me();const F={mode,editId:null,labId:null,clinicName:'',patient:'',rows:[{key:rk(),serviceId:'',qty:1,price:0}],source:null,files:[],comment:'',due:'',errors:{},showErrors:false,dueDefault:false};
 if(mode==='admin')F.labId=u.labId;
 if(mode==='clinic'){const c=clinicById(u.clinicId);if(c.labIds.length===1)F.labId=c.labIds[0];}
 return F;}
function formFromOrder(o){return{mode:'clinic',editId:o.id,labId:o.labId,clinicName:'',patient:o.patient,rows:o.items.map(i=>({key:rk(),serviceId:i.serviceId,qty:i.qty,price:i.price})),source:o.source,files:clone(o.files),comment:o.comment,due:o.due,dueDefault:o.dueDefault,errors:{},showErrors:false};}
function formClinicId(F){if(F.mode==='admin')return null;if(F.editId)return orderById(F.editId).clinicId;return me().clinicId;}
function rowPrice(F,sid){return F.mode==='admin'?svcById(sid).base:priceFor(formClinicId(F),sid);}
function formTotal(F){return F.rows.reduce((s,r)=>s+(r.serviceId?(Number(r.qty)||0)*r.price:0),0);}
function validateForm(F){const e={};
 if(F.mode==='admin'&&!F.clinicName.trim())e.clinicName='Укажите название клиники или заказчика';
 if(!F.labId)e.lab='Выберите лабораторию, которой адресован заказ';
 if(F.patient.trim().length<3)e.patient='Укажите ФИО пациента';
 if(F.labId){const svcs=S.services.filter(s=>s.labId===F.labId&&s.active);
  if(!svcs.length)e.rows='У лаборатории пока нет доступных услуг';
  else if(!F.rows.some(r=>r.serviceId))e.rows='Добавьте хотя бы одну услугу';
  F.rows.forEach(r=>{if(!r.serviceId&&F.rows.length>1)e['svc-'+r.key]='Выберите услугу или удалите строку';if(r.serviceId&&!(Number(r.qty)>=1))e['qty-'+r.key]='Минимум 1';});}
 if(!F.source)e.source='Выберите тип исходных данных';
 if(F.source==='scan'&&!F.files.length)e.files='Для скана прикрепите хотя бы один файл';
 if(F.due&&F.due<=ymd(new Date()))e.due='Дата сдачи должна быть позже сегодняшней';
 return e;}
function firstErrSel(F,e){if(e.clinicName)return '#f-clinic';if(e.lab)return '#f-lab';if(e.patient)return '#f-patient';
 const r=F.rows.find(r=>e['svc-'+r.key]||e['qty-'+r.key]);if(r)return e['svc-'+r.key]?'#f-svc-'+r.key:'#f-qty-'+r.key;
 if(e.rows)return F.rows[0]?'#f-svc-'+F.rows[0].key:'#f-lab';if(e.source)return '#f-src-scan';if(e.files)return '#f-files';if(e.due)return '#f-due';return null;}
const errT=m=>m?`<div class="err-text" role="alert">${ic('alert',15)}<span>${esc(m)}</span></div>`:'';
function missingSummary(e){const m=[];if(e.clinicName)m.push('клиника');if(e.lab)m.push('лаборатория');if(e.patient)m.push('ФИО пациента');if(e.rows||Object.keys(e).some(k=>k.startsWith('svc-')||k.startsWith('qty-')))m.push('услуги');if(e.source)m.push('скан или слепок');if(e.files)m.push('файлы скана');if(e.due)m.push('дата сдачи');return m;}
function vOrderForm(){const F=UI.form;if(!F)return '';const u=me();const E=F.showErrors?F.errors:{};const isAdmin=F.mode==='admin',isEdit=!!F.editId;
 const lab=F.labId?labById(F.labId):null;const svcs=lab?S.services.filter(s=>s.labId===lab.id&&s.active):[];
 const title=isEdit?'Изменить заказ #'+F.editId:(isAdmin?'Заказ для разовой клиники':'Новый заказ-наряд');
 let h=`<div class="form-page"><div class="form-top"><button type="button" class="btn ghost sm" data-act="formBack">${ic('back',18)}Назад</button><h1>${title}</h1><span class="hint">Обязательные поля отмечены <span class="req">*</span></span></div>`;
 // A. Recipient
 h+=`<section class="fsec" aria-labelledby="sa"><div class="fsec-h"><span class="k">A</span><h2 id="sa">Получатель</h2></div>`;
 if(isAdmin){const oneoffs=S.clinics.filter(c=>c.oneOff&&c.labIds.includes(u.labId));
  h+=`<div class="lab-locked">${ic('lock',18)}<div><b>${esc(lab.full)}</b><div class="hint">Заказ поступит в вашу лабораторию. Применяется базовый прайс.</div></div></div>
  <div class="field"><label for="f-clinic">Название клиники / заказчика <span class="req">*</span></label><input id="f-clinic" class="input${E.clinicName?' err':''}" list="oneoff-list" value="${esc(F.clinicName)}" data-model="form.clinicName" placeholder="Например: Стоматология «Ақ Тіс»" autocomplete="off"><datalist id="oneoff-list">${oneoffs.map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist><span class="hint">Аккаунт не создаётся. Запись видна только вашей лаборатории и получит отметку «Разовая клиника».</span>${errT(E.clinicName)}</div>`;}
 else if(isEdit){h+=`<div class="lab-locked">${ic('lock',18)}<div><b>${esc(lab.full)}</b><div class="hint">Лабораторию нельзя сменить после отправки. Для другой лаборатории создайте новый заказ.</div></div></div>`;}
 else{const c=clinicById(u.clinicId);
  h+=`<div class="field"><label for="f-lab">Лаборатория <span class="req">*</span></label><select id="f-lab" class="select${E.lab?' err':''}" data-change="labPick"><option value="">Выберите лабораторию</option>${c.labIds.map(id=>`<option value="${id}" ${F.labId===id?'selected':''}>${esc(labById(id).full)}</option>`).join('')}</select><span class="hint">Выберите лабораторию, которой адресован заказ. От выбора зависят список услуг и цены.</span>${errT(E.lab)}</div>`;}
 h+=`</section>`;
 // B. Patient & services
 h+=`<section class="fsec" aria-labelledby="sb"><div class="fsec-h"><span class="k">B</span><h2 id="sb">Пациент и услуги</h2></div>
 <div class="field"><label for="f-patient">ФИО пациента <span class="req">*</span></label><input id="f-patient" class="input${E.patient?' err':''}" value="${esc(F.patient)}" data-model="form.patient" autocomplete="off" placeholder="Фамилия Имя Отчество">${errT(E.patient)}</div>
 <div class="field"><span class="flabel">Услуги <span class="req">*</span></span>`;
 if(!lab)h+=`<div class="disabled-area">${ic('info',18)}Сначала выберите лабораторию: список услуг и цены зависят от неё.</div>`;
 else if(!svcs.length)h+=`<div class="disabled-area">${ic('alert',18)}Услуги пока недоступны. Лаборатория ещё не заполнила справочник — отправить заказ нельзя.</div>`;
 else{h+=`<div class="svc-head"><span>Услуга</span><span>Количество</span><span style="text-align:right">Цена/шт.</span><span style="text-align:right">Итого</span><span></span></div><div class="svc-rows">`;
  h+=F.rows.map(r=>{const se=E['svc-'+r.key],qe=E['qty-'+r.key];const sum=r.serviceId?(Number(r.qty)||0)*r.price:0;
   return `<div class="svc-row"><div class="c-svc"><select id="f-svc-${r.key}" class="select${se||(E.rows&&!r.serviceId)?' err':''}" data-rowsvc="${r.key}" aria-label="Услуга"><option value="">Выберите услугу</option>${svcs.map(s=>`<option value="${s.id}" ${r.serviceId===s.id?'selected':''}>${esc(s.name)}</option>`).join('')}</select>${errT(se)}</div>
   <div class="c-qty"><span class="mlabel">Количество</span><div class="stepper${qe?' err':''}"><button type="button" class="st-b" data-act="qty" data-d="-1" data-key="${r.key}" aria-label="Уменьшить количество" ${(Number(r.qty)||0)<=1?'disabled':''}>−</button><input id="f-qty-${r.key}" class="st-i" inputmode="numeric" value="${esc(r.qty)}" data-rowqty="${r.key}" aria-label="Количество"><button type="button" class="st-b" data-act="qty" data-d="1" data-key="${r.key}" aria-label="Увеличить количество">+</button></div>${errT(qe)}</div>
   <div class="c-p"><span class="mlabel">Цена/шт.</span><div class="p">${r.serviceId?money(r.price):'—'}</div></div>
   <div class="c-s"><span class="mlabel">Итого</span><div class="s">${r.serviceId?money(sum):'—'}</div></div>
   <div class="c-del"><button type="button" class="iconbtn plain" data-act="delRow" data-key="${r.key}" aria-label="Удалить строку" ${F.rows.length<=1?'disabled':''}>${ic('trash',18)}</button></div></div>`;}).join('');
  h+=`</div>${errT(E.rows)}<div class="svc-foot"><button type="button" class="btn outline sm" data-act="addRow">${ic('plus',16)}Добавить услугу</button><div class="svc-total"><span class="l">Итого</span><span class="v">${money(formTotal(F))}</span></div></div>`;
  if(!isAdmin)h+=`<span class="hint">Цены указаны по договорному прайсу вашей клиники с лабораторией «${esc(lab.name)}».</span>`;}
 h+=`</div></section>`;
 // C. Source
 h+=`<section class="fsec" aria-labelledby="sc"><div class="fsec-h"><span class="k">C</span><h2 id="sc">Исходные данные <span class="req">*</span></h2></div>
 <div class="radio-cards" role="radiogroup" aria-label="Тип исходных данных">
  <button type="button" role="radio" id="f-src-scan" aria-checked="${F.source==='scan'}" class="rcard ${F.source==='scan'?'on':''}${E.source?' err':''}" data-act="setSource" data-v="scan"><span class="rdot"></span><span><b>Скан</b><span class="hint">Цифровой оттиск. Файлы обязательны</span></span></button>
  <button type="button" role="radio" id="f-src-imp" aria-checked="${F.source==='impression'}" class="rcard ${F.source==='impression'?'on':''}${E.source?' err':''}" data-act="setSource" data-v="impression"><span class="rdot"></span><span><b>Слепок</b><span class="hint">Физический оттиск передаётся курьером</span></span></button>
 </div>${errT(E.source)}
 <div class="dropzone${E.files?' err':''}" data-drop="form"><span class="dz-ic">${ic('clip',22)}</span><div class="grow"><b>Файлы</b> ${F.source==='scan'?'<span class="req">*</span>':F.source==='impression'?'<span class="muted">· необязательно</span>':''}<div class="hint">Перетащите сюда или выберите. STL, PLY, OBJ, DCM, ZIP, JPG, PNG, PDF · до 50 МБ каждый</div></div><label for="f-files" class="btn outline sm">Выбрать файлы</label><input type="file" id="f-files" class="sr" multiple data-change="files" accept=".stl,.ply,.obj,.dcm,.zip,.jpg,.jpeg,.png,.pdf"></div>
 ${errT(E.files)}
 ${F.files.length?`<div class="files">${F.files.map((x,i)=>`<div class="file">${ic('file',17)}<span class="fn">${esc(x.name)}</span><span class="fs">${fsize(x.size)}</span><button type="button" class="iconbtn plain" style="width:36px;height:36px" data-act="delFile" data-i="${i}" aria-label="Удалить файл ${esc(x.name)}">${ic('x',16)}</button></div>`).join('')}</div><span class="hint">В демо сохраняются только имена файлов, содержимое никуда не загружается.</span>`:''}
 </section>`;
 // D. Extra
 const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
 h+=`<section class="fsec" aria-labelledby="sd"><div class="fsec-h"><span class="k">D</span><h2 id="sd">Дополнительно</h2></div>
 <div class="field"><label for="f-comment">Комментарий</label><textarea id="f-comment" class="textarea" data-model="form.comment" placeholder="Цвет, особенности прикуса, пожелания к работе">${esc(F.comment)}</textarea></div>
 <div class="field" style="max-width:320px"><label for="f-due">Желаемая дата сдачи</label><input id="f-due" type="date" class="input${E.due?' err':''}" min="${ymd(tomorrow)}" value="${esc(F.due)}" data-model="form.due"><span class="hint">Если не указана — 10 рабочих дней, кроме воскресенья (до ${fmtDay(addWorkDays(new Date().toISOString(),10))}).</span>${errT(E.due)}</div>
 </section>`;
 // E. Actions
 const liveErr=validateForm(F);const miss=missingSummary(liveErr);
 h+=`<div class="form-actions"><div class="sum"><span class="l">Сумма заказа</span><span class="v">${money(formTotal(F))}</span></div><button type="button" class="btn outline" data-act="formBack">Отмена</button><button type="button" class="btn primary" data-act="submitForm" aria-disabled="${miss.length?'true':'false'}">${isEdit?'Сохранить изменения':'Отправить заказ'}</button>${miss.length?`<span class="missing">Чтобы отправить, заполните: ${miss.join(', ')}.</span>`:''}</div></div>`;
 return h;}

/* ============ ADMIN ============ */
const AD_TABS=[['RECEIVED','Получено'],['IN_PROGRESS','В работе'],['DONE','Сделано'],['IN_DELIVERY','На доставке'],['DELIVERED','Доставлено'],['CANCELLED','Архив']];
function vAdminOrders(){const u=me(),lab=labById(u.labId),f=UI.admin;const mine=S.orders.filter(o=>o.labId===lab.id);
 let list=mine.filter(o=>o.status===f.tab);if(f.q.trim())list=list.filter(o=>matchQ(o,f.q,true));if(f.from||f.to)list=list.filter(o=>inRange(o.createdAt,f.from,f.to));
 list=sortOrders(list,'new');
 let h=`<div class="page-head"><div><h1>Заказы</h1><p class="lead">${esc(lab.full)} · заказы других лабораторий здесь не отображаются</p></div></div>`;
 h+=`<div class="tabs" role="tablist" aria-label="Разделы заказов">${AD_TABS.map(([v,l])=>`<button type="button" role="tab" aria-selected="${f.tab===v}" class="tab ${f.tab===v?'on':''}" data-act="adminTab" data-v="${v}">${l}<span class="cnt">${mine.filter(o=>o.status===v).length}</span></button>`).join('')}</div>`;
 h+=`<div class="toolbar">${vSearch('admin','ad-q','Поиск по пациенту, клинике или ID')}${vPeriod('admin','adf')}${f.tab==='DONE'&&list.length?`<button type="button" class="btn sm ${f.selectMode?'primary':'outline'}" data-act="toggleSelect" data-scope="admin">${f.selectMode?'Готово':'Выбрать'}</button>`:''}</div>`;
 if(f.tab==='CANCELLED')h+=`<p class="result-line">Отменённые заказы хранятся в архиве. Причина и подтверждающий файл доступны в карточке.</p>`;
 if(!list.length){const msgs={RECEIVED:['Новых заказов нет','Новые заказы клиник появятся здесь автоматически.'],IN_PROGRESS:['Нет заказов в работе','Назначьте техников на заказ из раздела «Получено».'],DONE:['Нет готовых работ','Заказы попадут сюда, когда все исполнители завершат свою часть.'],IN_DELIVERY:['Нет заказов на доставке',''],DELIVERED:['Нет доставленных заказов',''],CANCELLED:['Архив пуст','']};
  const m=(f.q||f.from||f.to)?['Заказы не найдены','Измените запрос или период.']:msgs[f.tab];
  h+=vEmpty(f.q?'search':'inbox',m[0],m[1],(f.q||f.from||f.to)?`<button type="button" class="btn outline" data-act="resetAdminFilters">Сбросить фильтры</button>`:'');}
 else h+=`<div class="grid">${list.map(o=>vCard(o,'ADMIN',{selectable:f.selectMode&&f.tab==='DONE',checked:f.sel.includes(o.id)})).join('')}</div>`;
 if(f.selectMode)h+=`<div class="selbar" role="region" aria-label="Выбранные заказы"><span class="grow">Выбрано ${f.sel.length}</span><button type="button" class="btn sm outline" data-act="toggleSelect" data-scope="admin">Отмена</button><button type="button" class="btn sm primary" data-act="sendSelected" ${f.sel.length?'':'disabled'}>${ic('truck',16)}Передать на доставку</button></div>`;
 else h+=`<button type="button" class="fab" data-act="newOneOff" aria-label="Заказ для разовой клиники" title="Заказ для разовой клиники">${ic('plus',26)}</button>`;
 return h;}

/* ============ TECHNICIAN ============ */
function techLists(){const u=me(),f=UI.tech;let mine=S.orders.filter(o=>canSee(o,u));
 if(f.from||f.to)mine=mine.filter(o=>inRange(o.createdAt,f.from,f.to));if(f.q.trim())mine=mine.filter(o=>matchQ(o,f.q,true));
 return{progress:sortOrders(mine.filter(o=>myTechState(o)==='progress'),'new'),done:sortOrders(mine.filter(o=>myTechState(o)==='done'),'new')};}
function vTechOrders(){const u=me(),t=techById(u.techId),f=UI.tech;const L=techLists();const list=L[f.tab];
 let h=`<div class="page-head"><div><h1>Мои заказы</h1><p class="lead">${esc(t.name)} · ${esc(t.spec)} · ${esc(labById(t.labId).full)}</p></div></div>`;
 h+=`<div class="toolbar">${vPeriod('tech','tf')}<button type="button" class="btn sm outline" data-act="techReport">${ic('receipt',16)}Отчёт о проделанной работе</button></div>`;
 h+=`<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="${f.tab==='progress'}" class="tab ${f.tab==='progress'?'on':''}" data-act="techTab" data-v="progress">В работе<span class="cnt">${L.progress.length}</span></button><button type="button" role="tab" aria-selected="${f.tab==='done'}" class="tab ${f.tab==='done'?'on':''}" data-act="techTab" data-v="done">Сделано<span class="cnt">${L.done.length}</span></button></div>`;
 h+=vSearch('tech','te-q','Поиск по пациенту, клинике или ID');
 if(!list.length)h+=vEmpty('inbox',f.tab==='progress'?'Нет заказов в работе':'Пока нет завершённых работ',f.tab==='progress'?'Когда администратор назначит вас исполнителем, заказ появится здесь.':'Завершённые вами части заказов появятся здесь.');
 else h+=`<div class="grid">${list.map(o=>vCard(o,'TECHNICIAN')).join('')}</div>`;
 return h;}

/* ============ Detail panel ============ */
function panelShell(title,badge,body,actions,tabs){return `<div class="panel-wrap"><div class="scrim" data-act="closePanel"></div><aside class="panel${UI.panelEnter?' enter':''}" role="dialog" aria-modal="true" aria-labelledby="panel-title">
 <header class="panel-head"><button type="button" class="iconbtn plain back-m" data-act="closePanel" aria-label="Назад">${ic('back')}</button><div class="ph-t"><h2 id="panel-title" tabindex="-1">${title}</h2>${badge}</div><button type="button" class="iconbtn plain close-d" data-act="closePanel" aria-label="Закрыть">${ic('x')}</button></header>
 ${tabs||''}<div class="panel-body" data-scroll="panel">${body}</div>${actions?`<footer class="panel-actions">${actions}</footer>`:''}</aside></div>`;}
function vPanel(){if(!UI.panel)return '';const u=me();
 const denied=id=>panelShell('Заказ #'+esc(id),'',`<div class="denied"><span class="lk">${ic('lock',30)}</span><h3>Нет доступа</h3><p>Этот заказ не относится к вашему кабинету или не существует. Его содержимое не показывается.</p><p class="small">В полной версии проверку laboratory_id и прав выполняет сервер при каждом запросе.</p></div>`,`<div class="act-btns"><button type="button" class="btn outline" data-act="closePanel">Закрыть</button></div>`);
 if(UI.panel.denied!=null)return denied(UI.panel.denied);
 const o=orderById(UI.panel.id);if(!o||!canSee(o,u))return denied(UI.panel.id);
 const role=u.role;
 let badge=role==='TECHNICIAN'?(myTechState(o)==='done'?'<span class="badge s-done">Сделано</span>':'<span class="badge s-progress">В работе</span>'):statusBadge(o,role);
 if(o.cycles.length>1&&o.status!=='CANCELLED')badge+=`<span class="mark-rework">${ic('refresh',12)}Переделка №${o.cycles.length-1}</span>`;
 const tabs=role==='ADMIN'?`<div class="ptabs" role="tablist"><button type="button" role="tab" aria-selected="${UI.detailTab==='info'}" class="ptab ${UI.detailTab==='info'?'on':''}" data-act="dtab" data-v="info">Детали</button><button type="button" role="tab" aria-selected="${UI.detailTab==='history'}" class="ptab ${UI.detailTab==='history'?'on':''}" data-act="dtab" data-v="history">${ic('history',16)}История${o.cycles.length>1?`<span class="cnt">${o.cycles.length} цикла</span>`:''}</button></div>`:'';
 const body=(role==='ADMIN'&&UI.detailTab==='history')?vHistory(o):vInfo(o,role);
 return panelShell('Заказ #'+o.id,badge,body,vActions(o,role),tabs);}
const dsec=(t,inner)=>`<section class="dsec"><h3 class="dsec-h">${t}</h3>${inner}</section>`;
function itemsTable(items,withPrice){if(!withPrice)return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Услуга</th><th class="num">Кол-во</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(i.name)}</td><td class="num">${i.qty}</td></tr>`).join('')}</tbody></table></div>`;
 const tot=items.reduce((s,i)=>s+i.qty*i.price,0);
 return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Услуга</th><th class="num">Кол-во</th><th class="num">Цена/шт.</th><th class="num">Сумма</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(i.name)}</td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.qty*i.price)}</td></tr>`).join('')}<tr class="tot"><td colspan="3">Итого</td><td class="num">${money(tot)}</td></tr></tbody></table></div>`;}
function vInfo(o,role){const lab=labById(o.labId),cl=clinicById(o.clinicId),c=cur(o);let h='';
 if(o.status==='CANCELLED'&&o.cancel){const ev=o.cancel.evidence;
  h+=`<div class="box danger"><b>${ic('alert',16)} Заказ отменён ${fmtFull(o.cancel.at)}</b><div><span class="muted">Причина:</span> ${esc(o.cancel.reason)}</div><div class="muted small">Отменил(а): ${esc(o.cancel.by)}</div>
  ${ev?`<div class="evidence">${ev.data?`<img src="${ev.data}" alt="Подтверждение отмены: ${esc(ev.name)}">`:`<span class="ev-ph">${ic('file',28)}</span>`}<div><b style="font-weight:600">${esc(ev.name)}</b><div class="muted small">${ev.size?fsize(ev.size):''} · подтверждение запроса клиники</div></div></div>`:'<div class="muted small">Клиника отменила заказ сама до назначения техников.</div>'}</div>`;}
 const kv=[['Дата отправки',fmtFull(o.createdAt)]];
 if(role!=='CLINIC')kv.push(['Клиника',esc(cl.name)+(cl.oneOff?' <span class="mark-oneoff">Разовая клиника</span>':'')]);
 kv.push(['Лаборатория',esc(lab.full)]);
 if(role==='CLINIC')kv.push(['Клиника',esc(cl.name)]);
 kv.push(['Пациент','<b>'+esc(o.patient)+'</b>'],['Плановая дата сдачи',fmtDay(o.due)+(o.dueDefault?' <span class="muted small">· по умолчанию</span>':'')],['Статус изменён',fmtFull(o.statusChangedAt)]);
 h+=`<dl class="kv">${kv.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
 if(role==='TECHNICIAN'){const st=myTechState(o);const myW=c.work.find(w=>w.techId===me().techId&&!w.superseded);
  h+=dsec('Ваша часть',`<div class="box ${st==='done'?'':'info'}">${st==='done'?`<b>Завершено${myW?' '+fmtFull(myW.at):''}</b>`+(myW?itemsRates(myW):''):`<b>В работе</b><div class="small">Когда закончите, нажмите «Закончить работу» и отметьте выполненные услуги.</div>`}</div>`);}
 h+=dsec(role==='TECHNICIAN'?'Услуги заказа':'Услуги и стоимость',itemsTable(o.items,role!=='TECHNICIAN')+(role==='CLINIC'?'<span class="hint">Цены зафиксированы на момент оформления и не меняются при обновлении прайса.</span>':''));
 h+=dsec('Исходные данные и файлы',`<div class="srcpill">${ic(o.source==='scan'?'scan':'box',18)}${o.source==='scan'?'Скан':'Слепок'}</div>${o.files.length?`<div class="files">${o.files.map(f=>`<div class="file">${ic('file',17)}<span class="fn">${esc(f.name)}</span><span class="fs">${fsize(f.size)}</span></div>`).join('')}</div>`:'<span class="muted small">Файлы не прикреплены</span>'}`);
 if(o.comment)h+=dsec('Комментарий',`<p style="white-space:pre-wrap">${esc(o.comment)}</p>`);
 if(role==='ADMIN'&&o.status!=='CANCELLED'){const as=c.assignments;
  h+=dsec('Исполнители'+(o.cycles.length>1?' · текущий цикл':''),as.length?as.map(a=>{const t=techById(a.techId);return `<div class="exec ${a.removedAt?'removed':''}"><span class="avatar">${esc(initials(t.name))}</span><div class="grow"><div class="nm">${esc(t.name)}</div><div class="muted small">${esc(t.spec)} · назначен(а) ${fmtFull(a.assignedAt)}</div></div>${a.removedAt?'<span class="badge s-received">Снят(а)</span>':a.doneAt?'<span class="badge s-done">Завершено</span>':'<span class="badge s-progress">В работе</span>'}</div>`;}).join(''):'<span class="muted small">Техники ещё не назначены.</span>');
  const rw=o.cycles.filter(x=>x.n>1);if(rw.length)h+=dsec('Оплата переделок',rw.map(x=>vPayCycle(o,x)).join(''));}
 const dl=c.delivery;
 if(dl&&dl.confirmedAt&&role!=='TECHNICIAN')h+=dsec('Получение',`<div class="box">${ic('check',16)}<div>Получено ${fmtFull(dl.confirmedAt)} · ${esc(dl.confirmedBy)}${dl.manual?`<div class="muted small">Подтверждено вручную: ${esc(dl.reason)}</div>`:''}</div></div>`);
 return h;}
function itemsRates(w){return `<div class="tbl-wrap" style="background:#fff"><table class="tbl"><thead><tr><th>Услуга</th><th class="num">Кол-во</th><th class="num">Ставка</th><th class="num">Сумма</th></tr></thead><tbody>${w.items.map(i=>`<tr><td>${esc(i.name)}</td><td class="num">${i.qty}</td><td class="num">${money(i.rate)}</td><td class="num">${money(i.qty*i.rate)}</td></tr>`).join('')}<tr class="tot"><td colspan="3">Расчётная сумма</td><td class="num">${money(w.calc)}</td></tr></tbody></table></div>`;}
function vPayCycle(o,c){const works=c.work.filter(w=>!w.superseded);const head=`<b>Переделка №${c.n-1}</b> <span class="muted small">· ${esc(c.reason||'')}</span>`;
 if(!works.length)return `<div class="box rework">${head}<div class="muted small">Оплата определяется после того, как техник завершит повторную работу.</div></div>`;
 return `<div class="box rework">${head}${works.map(w=>{const p=c.payments[w.techId];const key=o.id+'-'+c.n+'-'+w.techId;const t=techById(w.techId);
  if(p)return `<div class="exec" style="background:#fff"><span class="avatar">${esc(initials(t.name))}</span><div class="grow"><div class="nm">${esc(t.name)}</div><div class="muted small">Расчётно ${money(w.calc)} · утверждено ${fmtFull(p.at)}${p.comment?' · '+esc(p.comment):''}</div></div><span class="appr">${money(p.approved)}</span></div>`;
  const d=UI.payDraft[key]||{amount:String(w.calc),comment:''};
  return `<div class="exec" style="background:#fff;flex-direction:column;align-items:stretch"><div style="display:flex;gap:12px;align-items:center"><span class="avatar">${esc(initials(t.name))}</span><div class="grow"><div class="nm">${esc(t.name)}</div><div class="muted small">Расчётная стоимость по ставкам: <b>${money(w.calc)}</b></div></div><span class="pend">Требует решения</span></div>
  <div class="pay"><div class="field"><label for="pay-c-${key}">Комментарий</label><input id="pay-c-${key}" class="input" value="${esc(d.comment)}" data-pay="${key}" data-f="comment" placeholder="Например: 50% — ошибка в моделировании"></div><div class="field"><label for="pay-a-${key}">Утверждённая сумма, ₸</label><input id="pay-a-${key}" class="input num" inputmode="numeric" value="${esc(d.amount)}" data-pay="${key}" data-f="amount"></div>
  <div class="wide" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm outline" data-act="payPreset" data-key="${key}" data-v="${w.calc}">Полная</button><button type="button" class="btn sm outline" data-act="payPreset" data-key="${key}" data-v="${Math.round(w.calc/2)}">50%</button><button type="button" class="btn sm outline" data-act="payPreset" data-key="${key}" data-v="0">Без оплаты</button><button type="button" class="btn sm primary" style="margin-left:auto" data-act="payApprove" data-id="${o.id}" data-n="${c.n}" data-tech="${w.techId}" data-max="${w.calc}">Утвердить</button></div></div></div>`;}).join('')}</div>`;}
function vActions(o,role){const B=(act,label,cls,extra)=>`<button type="button" class="btn ${cls}" data-act="${act}" data-id="${o.id}" ${extra||''}>${label}</button>`;
 if(role==='CLINIC'){const can=o.status==='RECEIVED';
  let x=`<div class="act-note">${can?'':ic('info',16)+'<span>Для изменения или отмены заказа свяжитесь с администратором лаборатории.</span>'}</div><div class="act-btns">`;
  if(o.status==='IN_DELIVERY')x+=B('acceptOne','Подтвердить получение','primary');
  x+=B('clinicCancel','Отменить','danger-outline',can?'':'disabled')+B('clinicEdit','Изменить',o.status==='IN_DELIVERY'?'outline':'primary',can?'':'disabled');return x+'</div>';}
 if(role==='TECHNICIAN'){const a=cur(o).assignments.find(x=>x.techId===me().techId&&!x.removedAt);
  if(a&&!a.doneAt&&o.status==='IN_PROGRESS')return `<div class="act-note">Отметьте выполненные услуги — по ним рассчитается начисление.</div><div class="act-btns">${B('finishOpen',ic('check',17)+'Закончить работу','primary')}</div>`;
  return `<div class="act-note">${ic('check',16)}<span>Ваша часть по этому заказу завершена.</span></div>`;}
 const s=o.status,oneOff=clinicById(o.clinicId).oneOff;let btn=[];
 if(canMoveBack(o))btn.push(B('moveOpen',ic('move',16)+'Перенести в раздел','ghost'));
 if(['RECEIVED','IN_PROGRESS','DONE'].includes(s))btn.push(B('cancelOpen','Отменить','danger-outline'));
 if(['DONE','IN_DELIVERY','DELIVERED'].includes(s))btn.push(B('reworkOpen',ic('refresh',16)+'Оформить переделку',s==='DELIVERED'?'primary':'outline'));
 if(s==='RECEIVED')btn.push(B('assignOpen','Назначить техников','primary'));
 if(s==='IN_PROGRESS')btn.push(B('assignOpen','Переназначить техников','primary'));
 if(s==='DONE')btn.push(B('sendOne',ic('truck',16)+'Передать на доставку','primary'));
 if(s==='IN_DELIVERY'&&oneOff)btn.push(B('manualDeliveryOpen','Подтвердить получение','primary'));
 if(s==='CANCELLED')return `<div class="act-note">Отменённый заказ доступен только для просмотра.</div><div class="act-btns"><button type="button" class="btn outline" data-act="closePanel">Закрыть</button></div>`;
 let note='';if(s==='IN_DELIVERY'&&!oneOff)note='Ожидаем подтверждение получения от клиники.';if(s==='IN_DELIVERY'&&oneOff)note='У разовой клиники нет кабинета — подтвердите получение вручную.';
 return `<div class="act-note">${note}</div><div class="act-btns">${btn.join('')}</div>`;}
const HTYPE={create:'Создание',status:'Статус',assign:'Назначение',work:'Работа техника',delivery:'Доставка',rework:'Переделка',payment:'Оплата',cancel:'Отмена',edit:'Изменение'};
function vHistory(o){
 const tl=`<ol class="tl">${o.history.map(e=>{let text=esc(e.text);if(e.type==='status'){text=`<b style="font-weight:600">${ST[e.from]?ST[e.from].admin:'—'} → ${ST[e.to].admin}</b>${e.manual?' <span class="mark-oneoff">вручную</span>':''}${e.text?' · '+esc(e.text):''}`;}
  return `<li class="t-${e.type}"><span class="tl-dot"></span><div><div class="tl-h"><b>${HTYPE[e.type]||e.type}</b><span class="muted small">${fmtFull(e.at)}</span></div><div>${text}</div><div class="muted small">${esc(e.by)}</div></div></li>`;}).join('')}</ol>`;
 const cyc=o.cycles.map(c=>{const key=o.id+'-'+c.n;const isCur=c.n===o.cycles.length;const open=UI.openCycles[key]!=null?UI.openCycles[key]:isCur;
  const title=c.n===1?'Первоначальный заказ':'Переделка №'+(c.n-1);
  let b='';if(open){
   if(c.n>1)b+=`<div class="box rework"><div><span class="muted">Причина:</span> ${esc(c.reason)}${c.comment?' — '+esc(c.comment):''}</div><div class="muted small">Открыл(а): ${esc(c.openedBy||'—')} · ${fmtFull(c.openedAt)}</div></div>`;
   b+=`<div><div class="dsec-h" style="margin-bottom:6px">Исходные услуги</div>${itemsTable(c.items,true)}</div>`;
   b+=`<div><div class="dsec-h" style="margin-bottom:6px">Исполнители</div>${c.assignments.length?c.assignments.map(a=>`<div class="small">${esc(tn(a.techId))} — назначен(а) ${fmtShort(a.assignedAt)}${a.removedAt?', снят(а) '+fmtShort(a.removedAt):''}${a.doneAt?', завершил(а) '+fmtShort(a.doneAt):''}</div>`).join(''):'<span class="muted small">Не назначены</span>'}</div>`;
   b+=`<div><div class="dsec-h" style="margin-bottom:6px">Выполненные услуги</div>${c.work.length?c.work.map(w=>{const p=c.payments[w.techId];return `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"><div class="small"><b>${esc(tn(w.techId))}</b> · ${fmtFull(w.at)}${w.superseded?' · <span class="pend">аннулировано при ручном возврате</span>':''}${c.n>1&&!w.superseded?(p?` · <span class="appr">утверждено ${money(p.approved)}</span>`:' · <span class="pend">оплата не утверждена</span>'):''}</div>${itemsRates(w)}</div>`;}).join(''):'<span class="muted small">Пока нет</span>'}</div>`;
   if(c.delivery&&c.delivery.confirmedAt)b+=`<div class="small muted">Получено ${fmtFull(c.delivery.confirmedAt)} · ${esc(c.delivery.confirmedBy)}</div>`;}
  return `<div class="cycle"><button type="button" class="cycle-h" data-act="toggleCycle" data-key="${key}" data-open="${open}" aria-expanded="${open}"><span class="chev">${ic('chev',16)}</span><span class="grow"><b>${title}</b><div class="muted small">открыт ${fmtFull(c.openedAt)}</div></span>${isCur&&o.status!=='CANCELLED'?'<span class="badge s-progress">Текущий</span>':`<span class="ro">${ic('lock',13)}только просмотр</span>`}</button>${open?`<div class="cycle-b">${b}</div>`:''}</div>`;}).join('');
 return dsec('Циклы выполнения',cyc)+dsec('Журнал событий',tl);}

/* ============ Modals ============ */
function modalShell(title,body,foot,opts){opts=opts||{};return `<div class="modal-wrap"><div class="scrim" data-act="${opts.critical?'noop':'closeModal'}"></div><div class="modal ${opts.size||''}${UI.modalEnter?' enter':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
 <div class="modal-head">${opts.icon?`<span class="mh-ic${opts.danger?' d':''}">${ic(opts.icon,20)}</span>`:''}<h3 id="modal-title">${title}</h3><button type="button" class="iconbtn plain" data-act="closeModal" aria-label="Закрыть окно">${ic('x')}</button></div>
 <div class="modal-body" data-scroll="modal">${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:''}</div></div>`;}
function vModal(){const M=UI.modal;if(!M)return '';const fn=MV[M.type];return fn?fn(M):'';}
const MV={
 dueDefault(M){return modalShell('Дата сдачи не указана',`<p>По умолчанию срок сдачи составит <b>10 рабочих дней</b> (воскресенье не учитывается, суббота — рабочий день).</p><div class="box info"><span>Расчётная дата: <b>${fmtDay(M.date)}</b></span></div>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="confirmDefaultDue" data-autofocus ${M.busy?'disabled':''}>ОК, отправить</button>`,{size:'sm',icon:'calendar'});},
 labSwitch(M){const to=labById(M.to);return modalShell('Сменить лабораторию?',`<p>Услуги и цены будут обновлены для лаборатории «${esc(to.name)}». Позиции, которых нет в её справочнике, удалятся из формы.</p><p class="muted small">ФИО пациента, комментарий, дата и файлы сохранятся.</p>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="confirmLabSwitch" data-autofocus>Продолжить</button>`,{size:'sm',icon:'alert'});},
 assign(M){const o=orderById(M.orderId);const c=cur(o);const done=c.assignments.filter(a=>!a.removedAt&&a.doneAt).map(a=>a.techId);
  const q=M.q.trim().toLowerCase();const techs=S.techs.filter(t=>t.labId===o.labId&&(!q||t.name.toLowerCase().includes(q)||t.spec.toLowerCase().includes(q)));
  const body=`<div class="search" style="margin:0"><span class="search-ic">${ic('search',18)}</span><input id="as-q" class="input" type="search" placeholder="Поиск по имени или специальности" value="${esc(M.q)}" data-model="modal.q" aria-label="Поиск техника" autocomplete="off"></div>
  <div style="display:flex;flex-direction:column;gap:8px">${techs.map(t=>{const on=M.sel.includes(t.id),lk=done.includes(t.id);return `<label class="chk-row ${on?'on':''} ${lk?'locked':''}"><input type="checkbox" ${on?'checked':''} ${lk?'disabled':''} data-act="assignToggle" data-tech="${t.id}"><span class="avatar">${esc(initials(t.name))}</span><span class="grow"><span class="nm" style="display:block">${esc(t.name)}</span><span class="muted small">${esc(t.spec)}${lk?' · работа завершена, снять нельзя':''}</span></span>${lk?ic('lock',16):''}</label>`;}).join('')||'<p class="muted">Никого не найдено.</p>'}</div>
  ${M.limit?`<div class="lim" role="alert">Можно назначить не более двух техников. Снимите отметку с одного, чтобы выбрать другого.</div>`:''}`;
  return modalShell(M.reassign?'Переназначить техников':'Назначить техников',body,`<span class="grow">Выбрано <span class="counter">${M.sel.length} из 2</span></span><button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="assignConfirm" ${M.sel.length?'':'disabled'}>${M.reassign?'Сохранить':'Назначить'}</button>`,{size:'md',icon:'users'});},
 finish(M){const o=orderById(M.orderId);const tid=me().techId;const svcs=S.services.filter(s=>s.labId===o.labId&&s.active);
  const ordered=svcs.slice().sort((a,b)=>(o.items.some(i=>i.serviceId===b.id)?1:0)-(o.items.some(i=>i.serviceId===a.id)?1:0));
  let total=0,n=0;
  const rows=ordered.map(s=>{const r=M.rows[s.id];const rate=rateFor(tid,s.id);const has=rate!=null;const on=has&&r.on;const sum=on?(Number(r.qty)||0)*rate:0;if(on){total+=sum;n++;}
   return `<div class="fin-row ${has?'':'off'}"><input type="checkbox" id="fin-${s.id}" ${on?'checked':''} ${has?'':'disabled'} data-act="finToggle" data-sid="${s.id}" aria-label="${esc(s.name)}"><label for="fin-${s.id}" class="nm" style="cursor:${has?'pointer':'not-allowed'}">${esc(s.name)}${o.items.some(i=>i.serviceId===s.id)?' <span class="muted small">· в заказе</span>':''}${has?'':'<div class="muted small" style="font-weight:400">Ставка не настроена — обратитесь к администратору</div>'}</label>
   ${has?`<div class="stepper sm"><button type="button" class="st-b" data-act="finQty" data-sid="${s.id}" data-d="-1" aria-label="Меньше" ${(Number(r.qty)||0)<=1?'disabled':''}>−</button><input class="st-i" id="fq-${s.id}" inputmode="numeric" value="${esc(r.qty)}" data-finqty="${s.id}" aria-label="Количество ${esc(s.name)}"><button type="button" class="st-b" data-act="finQty" data-sid="${s.id}" data-d="1" aria-label="Больше">+</button></div><span class="num muted rt">${money(rate)}/шт.</span><span class="num sm-s" style="font-weight:700">${on?money(sum):'—'}</span>`:'<span></span><span class="num muted">—</span><span></span>'}</div>`;}).join('');
  return modalShell('Закончить работу · #'+o.id,`<p class="muted">Отметьте услуги, которые вы выполнили, и количество. Сумма считается по вашим ставкам.</p><div style="display:flex;flex-direction:column;gap:8px">${rows}</div>`,`<span class="grow">${n?'Отмечено '+n+' · итого <b style="color:var(--ink);font-size:16px">'+money(total)+'</b>':'Отметьте хотя бы одну услугу'}</span><button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="finishConfirm" ${n?'':'disabled'}>Закончить</button>`,{size:'lg',icon:'check'});},
 rework(M){const o=orderById(M.orderId);const R=['Ошибка техника','Ошибка лаборатории','Не сошёлся прикус','Не совпал цвет','Скол или трещина','Другое'];
  return modalShell('Оформить переделку заказа #'+o.id,`<div class="field"><label for="rw-r">Причина <span class="req">*</span></label><select id="rw-r" class="select${M.err&&!M.reason?' err':''}" data-model="modal.reason"><option value="">Выберите причину</option>${R.map(r=>`<option ${M.reason===r?'selected':''}>${r}</option>`).join('')}</select>${M.err&&!M.reason?errT('Укажите причину переделки'):''}</div>
  <div class="field"><label for="rw-c">Описание${M.reason==='Другое'?' <span class="req">*</span>':''}</label><textarea id="rw-c" class="textarea${M.err&&M.reason==='Другое'&&!M.comment.trim()?' err':''}" data-model="modal.comment" placeholder="Что именно нужно исправить">${esc(M.comment)}</textarea>${M.err&&M.reason==='Другое'&&!M.comment.trim()?errT('Опишите причину'):''}</div>
  <div class="box info">${ic('info',16)}<div>ID <b>#${o.id}</b> сохраняется. Будет создан новый цикл «Переделка №${o.cycles.length}», заказ вернётся в «Получено», клиника увидит его как «Отправлено». Данные прошлых циклов останутся в истории.</div></div>
  <p class="muted small">Если лаборатория не виновата, переделку оформляют новым заказом по обычному прайсу.</p>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="reworkConfirm">Оформить переделку</button>`,{size:'md',icon:'refresh'});},
 cancelAdmin(M){const o=orderById(M.orderId);const E=M.err?{reason:!M.reason.trim(),file:!M.file,conf:!M.conf}:{};
  return modalShell('Отменить заказ #'+o.id,`<div class="box danger">${ic('alert',16)}<div>Заказ исчезнет из рабочих списков и из кабинета клиники. В архиве останется запись с причиной и подтверждением.</div></div>
  <div class="field"><label for="cn-r">Причина отмены <span class="req">*</span></label><textarea id="cn-r" class="textarea${E.reason?' err':''}" data-model="modal.reason" placeholder="Например: клиника отозвала заказ по просьбе пациента">${esc(M.reason)}</textarea>${E.reason?errT('Укажите причину'):''}</div>
  <div class="field"><span class="flabel">Скриншот переписки с запросом на отмену <span class="req">*</span></span>
  <div class="dropzone${E.file?' err':''}" data-drop="evidence">${M.file?(M.file.data?`<img src="${M.file.data}" alt="" style="width:72px;height:56px;object-fit:cover;border-radius:8px">`:`<span class="dz-ic">${ic('file',20)}</span>`):`<span class="dz-ic">${ic('clip',20)}</span>`}<div class="grow">${M.file?`<b style="font-weight:600">${esc(M.file.name)}</b><div class="hint">${fsize(M.file.size)}</div>`:'<b>Прикрепите подтверждение</b><div class="hint">JPG, PNG или PDF до 10 МБ</div>'}</div><label for="cn-f" class="btn outline sm">${M.file?'Заменить':'Выбрать файл'}</label><input type="file" id="cn-f" class="sr" accept=".jpg,.jpeg,.png,.pdf,image/*" data-change="evidence"></div>${E.file?errT('Без подтверждения отменить заказ нельзя'):''}</div>
  <label class="chk-row ${M.conf?'on':''}" style="min-height:48px"><input type="checkbox" ${M.conf?'checked':''} data-act="cancelConf"><span class="grow">Подтверждаю отмену заказа #${o.id}</span></label>${E.conf?errT('Отметьте подтверждение'):''}`,`<button type="button" class="btn outline" data-act="closeModal">Не отменять</button><button type="button" class="btn danger" data-act="cancelConfirm">Отменить заказ</button>`,{size:'md',icon:'alert',danger:true,critical:true});},
 cancelClinic(M){const o=orderById(M.orderId);return modalShell('Отменить заказ #'+o.id+'?',`<p>Заказ для пациента <b>${esc(o.patient)}</b> исчезнет из вашей истории, а лаборатория «${esc(labById(o.labId).name)}» не возьмёт его в работу. Действие нельзя отменить.</p>`,`<button type="button" class="btn outline" data-act="closeModal" data-autofocus>Не отменять</button><button type="button" class="btn danger" data-act="clinicCancelConfirm">Отменить заказ</button>`,{size:'sm',icon:'alert',danger:true});},
 move(M){const o=orderById(M.orderId);const opts=MOVES[o.status]||[];
  return modalShell('Перенести заказ #'+o.id,`<p class="muted">Сейчас: <b style="color:var(--ink)">${ST[o.status].admin}</b>. Перенос фиксируется в истории вместе с причиной.</p><div class="radio-list" role="radiogroup">${opts.map(x=>`<button type="button" role="radio" aria-checked="${M.to===x.to}" class="radio-row ${M.to===x.to?'on':''}" data-act="moveTo" data-v="${x.to}"><span class="rdot"></span><span><b style="display:block">${x.label}</b><span class="muted small">${x.desc}</span></span></button>`).join('')}</div>${M.err&&!M.to?errT('Выберите раздел'):''}
  <div class="field"><label for="mv-r">Причина изменения <span class="req">*</span></label><textarea id="mv-r" class="textarea${M.err&&!M.reason.trim()?' err':''}" data-model="modal.reason" placeholder="Что пошло не так">${esc(M.reason)}</textarea>${M.err&&!M.reason.trim()?errT('Укажите причину'):''}</div>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="moveConfirm">Перенести</button>`,{size:'md',icon:'move'});},
 deliverySend(M){const os=M.ids.map(orderById);return modalShell('Передать на доставку',`<p>${os.length} ${plural(os.length,'заказ','заказа','заказов')} перейдут в «На доставке», клиники увидят их у себя для подтверждения.</p><div class="files">${os.map(o=>`<div class="file"><b>#${o.id}</b><span class="fn">${esc(o.patient)}</span><span class="fs">${esc(clinicById(o.clinicId).name)}</span></div>`).join('')}</div>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="deliverySendConfirm" data-autofocus>${ic('truck',16)}Передать</button>`,{size:'md',icon:'truck'});},
 deliveryConfirm(M){const os=M.ids.map(orderById);const n=os.filter(o=>M.checks[o.id]).length;
  return modalShell('Подтвердить получение',`<p class="muted">Отметьте каждый заказ, который фактически получен. Подтверждение увидит лаборатория.</p><div style="display:flex;flex-direction:column;gap:8px">${os.map(o=>`<label class="chk-row ${M.checks[o.id]?'on':''}"><input type="checkbox" ${M.checks[o.id]?'checked':''} data-act="delCheck" data-id="${o.id}"><span class="grow"><span class="nm" style="display:block">Подтверждаю получение заказа #${o.id}</span><span class="muted small">${esc(o.patient)} · ${esc(labById(o.labId).full)}</span></span></label>`).join('')}</div>`,`<span class="grow">Отмечено <span class="counter">${n} из ${os.length}</span></span><button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="deliveryConfirmOk" ${n===os.length?'':'disabled'}>Подтвердить</button>`,{size:'md',icon:'check',critical:true});},
 manualDelivery(M){const o=orderById(M.orderId);return modalShell('Подтвердить получение вручную',`<p>У разовой клиники «${esc(clinicById(o.clinicId).name)}» нет кабинета. Укажите основание — оно сохранится в истории заказа #${o.id}.</p><div class="field"><label for="md-r">Основание <span class="req">*</span></label><textarea id="md-r" class="textarea${M.err&&!M.reason.trim()?' err':''}" data-model="modal.reason" placeholder="Например: курьер передал работу, получил администратор клиники">${esc(M.reason)}</textarea>${M.err&&!M.reason.trim()?errT('Укажите основание'):''}</div>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="manualDeliveryOk">Подтвердить</button>`,{size:'sm',icon:'check'});},
 feedback(M){return modalShell('Оцените удобство',`<div class="field"><span class="flabel">Насколько удобно работать с DentaFlow? <span class="req">*</span></span><div class="rating" role="radiogroup" aria-label="Оценка от 1 до 5">${[1,2,3,4,5].map(n=>`<button type="button" role="radio" aria-checked="${M.rating===n}" class="${M.rating===n?'on':''}" data-act="rate" data-v="${n}">${n}</button>`).join('')}</div><span class="hint">1 — неудобно, 5 — очень удобно</span>${M.err&&!M.rating?errT('Выберите оценку'):''}</div><div class="field"><label for="fb-c">Комментарий</label><textarea id="fb-c" class="textarea" data-model="modal.comment" placeholder="Что было непонятно или неудобно?">${esc(M.comment)}</textarea></div>${S.feedback.length?`<p class="muted small">Отзывов в этом демо: ${S.feedback.length}, средняя оценка ${(S.feedback.reduce((s,f)=>s+f.rating,0)/S.feedback.length).toFixed(1).replace('.',',')}</p>`:''}`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn primary" data-act="feedbackSend">Отправить</button>`,{size:'sm',icon:'star'});},
 account(){const u=me();const rows=[['Логин',`<code>${esc(u.login)}</code>`],['Роль',{CLINIC:'Клиника',ADMIN:'Администратор лаборатории',TECHNICIAN:'Зубной техник'}[u.role]]];
  if(u.role==='CLINIC'){const c=clinicById(u.clinicId);rows.push(['Клиника',esc(c.name)],['Лаборатории-партнёры',c.labIds.map(id=>esc(labById(id).name)).join(', ')]);}
  else{rows.push(['Имя',esc(u.name)],['Лаборатория',esc(labById(u.labId).full)]);}
  return modalShell('Аккаунт',`<dl class="kv">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="muted small">Сессия сохраняется до выхода. В коммерческой версии для клиник возможна одна активная сессия.</p>`,`<button type="button" class="btn outline" data-act="closeModal">Закрыть</button><button type="button" class="btn danger-outline" data-act="logout">Выйти</button>`,{size:'sm',icon:'user'});},
 filters(){const n=clinicList().length;return modalShell('Фильтры',`<div style="display:flex;flex-direction:column;gap:10px">${clinicFilterControls('mf').replace(/class="fsel/g,'style="width:100%" class="fsel')}</div>`,`<button type="button" class="btn outline" data-act="resetClinicFilters">Сбросить</button><button type="button" class="btn primary" data-act="closeModal">Показать ${n} ${plural(n,'заказ','заказа','заказов')}</button>`,{size:'sm',icon:'filter'});},
 reset(){return modalShell('Сбросить демо-данные?',`<p>Все созданные заказы, изменения цен и статусов в этом браузере будут заменены исходным набором тестовых данных. Вы выйдете из аккаунта.</p>`,`<button type="button" class="btn outline" data-act="closeModal">Отмена</button><button type="button" class="btn danger" data-act="resetConfirm">Сбросить</button>`,{size:'sm',icon:'refresh',danger:true});}
};

/* ============ Prices & rates ============ */
function vPrices(){const u=me(),lab=labById(u.labId),P=UI.prices;const partners=S.clinics.filter(c=>!c.oneOff&&c.labIds.includes(lab.id));const svcs=S.services.filter(s=>s.labId===lab.id);
 if(P.target!=='base'&&!partners.some(c=>c.id===P.target))P.target='base';
 const D=P.draft,dv=(k,o)=>(k in D)?D[k]:o,er=k=>P.errs.includes(k),dirty=Object.keys(D).length>0;
 let h=`<div class="page-head"><div><h1>Цены клиник</h1><p class="lead">Базовый прайс действует для клиник без индивидуальной цены. Изменения применяются к новым заказам и не пересчитывают оформленные.</p></div></div>
 <div class="ctl-row"><div class="field"><label for="pr-target">Прайс</label><select id="pr-target" class="select" data-change="priceTarget"><option value="base" ${P.target==='base'?'selected':''}>Базовый прайс лаборатории</option><optgroup label="Клиники-партнёры">${partners.map(c=>`<option value="${c.id}" ${P.target===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</optgroup></select></div><p class="hint" style="padding-bottom:12px">Разовые клиники всегда используют базовый прайс.</p></div>`;
 if(P.target==='base'){
  h+=`<div class="tbl-wrap" style="background:var(--surface)"><table class="tbl"><thead><tr><th>Услуга</th><th class="num">Базовая цена</th><th>Статус</th><th></th></tr></thead><tbody>${svcs.map(s=>{const nk='name|'+s.id,bk='base|'+s.id,ak='act|'+s.id;const act=dv(ak,s.active);
   return `<tr${act?'':' class="muted-row"'}><td><input id="pr-name-${s.id}" class="input${nk in D?' dirty':''}${er(nk)?' err':''}" value="${esc(dv(nk,s.name))}" data-draft="prices" data-key="${nk}" aria-label="Название услуги"></td><td><input id="pr-base-${s.id}" class="input num${bk in D?' dirty':''}${er(bk)?' err':''}" inputmode="numeric" value="${esc(dv(bk,s.base))}" data-draft="prices" data-key="${bk}" aria-label="Базовая цена ${esc(s.name)}"></td><td>${act?'<span class="src-tag src-ind">Активна</span>':'<span class="src-tag src-base">Отключена</span>'}${ak in D?'<span class="dirty-dot" title="Не сохранено"></span>':''}</td><td class="act"><button type="button" class="btn sm ghost" data-act="toggleSvc" data-sid="${s.id}">${act?'Отключить':'Включить'}</button></td></tr>`;}).join('')}</tbody></table></div>
  <div class="panel-card" style="margin-top:16px"><b>Новая услуга</b><div class="add-row"><div class="field"><label for="pr-new-name">Название</label><input id="pr-new-name" class="input" value="${esc(P.newName)}" data-model="prices.newName" placeholder="Например: Вкладка E.max"></div><div class="field pr"><label for="pr-new-price">Базовая цена, ₸</label><input id="pr-new-price" class="input num" inputmode="numeric" value="${esc(P.newPrice)}" data-model="prices.newPrice"></div><button type="button" class="btn outline" data-act="addService">${ic('plus',16)}Добавить услугу</button></div></div>`;}
 else{const c=clinicById(P.target);
  h+=`<div class="tbl-wrap" style="background:var(--surface)"><table class="tbl"><thead><tr><th>Услуга</th><th class="num">Базовая цена</th><th class="num">Индивидуальная цена</th><th>Источник цены</th><th></th></tr></thead><tbody>${svcs.filter(s=>s.active).map(s=>{const k='ov|'+s.id;const orig=S.clinicPrices[c.id+'|'+s.id];const v=dv(k,orig==null?'':orig);const isInd=String(v).trim()!=='';
   return `<tr><td>${esc(s.name)}</td><td class="num">${money(s.base)}</td><td><input id="pr-ov-${s.id}" class="input num${k in D?' dirty':''}${er(k)?' err':''}" inputmode="numeric" value="${esc(v)}" placeholder="как базовая" data-draft="prices" data-key="${k}" aria-label="Индивидуальная цена ${esc(s.name)}"></td><td><span class="src-tag ${isInd?'src-ind':'src-base'}">${isInd?'Индивидуальная':'Базовая'}</span></td><td class="act">${isInd?`<button type="button" class="btn sm ghost" data-act="resetOverride" data-sid="${s.id}">Вернуть к базовой</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>
  <p class="hint" style="margin-top:10px">Цены клиники «${esc(c.name)}» действуют только в вашей лаборатории. Пустое поле — используется базовая цена.</p>`;}
 if(dirty)h+=`<div class="savebar" role="region" aria-label="Несохранённые изменения"><span class="grow">Есть несохранённые изменения: ${Object.keys(D).length}</span><button type="button" class="btn sm outline" data-act="discardDraft" data-scope="prices">Отменить</button><button type="button" class="btn sm primary" data-act="savePrices">Сохранить изменения</button></div>`;
 return h;}
function vRates(){const u=me(),lab=labById(u.labId),R=UI.rates;const techs=S.techs.filter(t=>t.labId===lab.id);if(!R.techId||!techs.some(t=>t.id===R.techId))R.techId=techs[0]&&techs[0].id;
 const D=R.draft,dirty=Object.keys(D).length>0;const svcs=S.services.filter(s=>s.labId===lab.id);
 let h=`<div class="page-head"><div><h1>Ставки техников</h1><p class="lead">Ставка за единицу услуги. Изменения применяются к будущим завершениям и не меняют прошлые начисления.</p></div></div>
 <div class="ctl-row"><div class="field"><label for="rt-tech">Техник</label><select id="rt-tech" class="select" data-change="rateTech">${techs.map(t=>`<option value="${t.id}" ${R.techId===t.id?'selected':''}>${esc(t.name)} · ${esc(t.spec)}</option>`).join('')}</select></div></div>`;
 if(!R.techId)return h+vEmpty('users','В лаборатории нет техников','');
 h+=`<div class="tbl-wrap" style="background:var(--surface)"><table class="tbl"><thead><tr><th>Услуга</th><th class="num">Ставка техника</th><th>Статус</th><th></th></tr></thead><tbody>${svcs.map(s=>{const k='rate|'+s.id;const orig=rateFor(R.techId,s.id);const v=(k in D)?D[k]:(orig==null?'':orig);const has=String(v).trim()!=='';
  return `<tr${s.active?'':' class="muted-row"'}><td>${esc(s.name)}${s.active?'':' <span class="muted small">· услуга отключена</span>'}</td><td><input id="rt-rate-${s.id}" class="input num${k in D?' dirty':''}${R.errs.includes(k)?' err':''}" inputmode="numeric" value="${esc(v)}" placeholder="—" data-draft="rates" data-key="${k}" aria-label="Ставка ${esc(s.name)}"></td><td>${has?'<span class="src-tag src-ind">Выполняет</span>':'<span class="src-tag src-base">— нет ставки</span>'}</td><td class="act">${has?`<button type="button" class="btn sm ghost" data-act="clearRate" data-sid="${s.id}">Убрать ставку</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>
 <p class="hint" style="margin-top:10px">«—» означает, что техник не выполняет услугу: в форме завершения она будет недоступна. Это не то же самое, что ставка 0 ₸.</p>`;
 if(dirty)h+=`<div class="savebar"><span class="grow">Есть несохранённые изменения: ${Object.keys(D).length}</span><button type="button" class="btn sm outline" data-act="discardDraft" data-scope="rates">Отменить</button><button type="button" class="btn sm primary" data-act="saveRates">Сохранить изменения</button></div>`;
 return h;}

/* ============ Reports ============ */
function payrollData(tid,from,to){const t=techById(tid);const rows=[];let total=0,pending=0,pendingSum=0;
 S.orders.filter(o=>o.labId===t.labId).forEach(o=>o.cycles.forEach(c=>c.work.forEach(w=>{if(w.techId!==tid||w.superseded||!inRange(w.at,from,to))return;
  const p=c.n>1?c.payments[tid]:null;rows.push({o,c,w,p});if(c.n===1)total+=w.calc;else if(p)total+=p.approved;else{pending++;pendingSum+=w.calc;}})));
 rows.sort((a,b)=>new Date(a.w.at)-new Date(b.w.at));return{rows,total,pending,pendingSum};}
function receivablesData(cid,labId,from,to){const rows=S.orders.filter(o=>o.labId===labId&&o.clinicId===cid&&o.status!=='CANCELLED'&&inRange(o.createdAt,from,to)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 return{rows,total:rows.reduce((s,o)=>s+o.items.reduce((x,i)=>x+i.qty*i.price,0),0)};}
function vReport(){const u=me(),R=UI.report,kind=R.kind;const labId=u.labId;let title,selector='';
 if(kind==='payroll'){title='Зарплаты техникам';const techs=S.techs.filter(t=>t.labId===labId);if(!R.target)R.target=techs[0].id;
  selector=`<div class="field"><label for="rp-t">Техник</label><select id="rp-t" class="select" data-model="report.target">${techs.map(t=>`<option value="${t.id}" ${R.target===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>`;}
 else if(kind==='receivables'){title='Расчёты с клиниками';const cls=S.clinics.filter(c=>c.labIds.includes(labId));if(!R.target)R.target=cls[0].id;
  selector=`<div class="field"><label for="rp-c">Клиника</label><select id="rp-c" class="select" data-model="report.target">${cls.map(c=>`<option value="${c.id}" ${R.target===c.id?'selected':''}>${esc(c.name)}${c.oneOff?' (разовая)':''}</option>`).join('')}</select></div>`;}
 else{title='Отчёт о проделанной работе';R.target=u.techId;}
 let h=`<div class="page-head"><div>${kind==='tech'?`<button type="button" class="btn ghost sm" data-act="nav" data-route="tech-orders" style="margin-bottom:8px">${ic('back',18)}Мои заказы</button>`:''}<h1>${title}</h1><p class="lead">${kind==='receivables'?'Суммы считаются по ценам, зафиксированным в каждом заказе.':kind==='payroll'?'Начисления по выполненным услугам. Для переделок учитывается утверждённая сумма.':'Ваши выполненные услуги и начисления. Отчёты других техников недоступны.'}</p></div></div>
 <div class="ctl-row">${selector}<div class="field" style="flex:0 1 auto;min-width:0"><span class="flabel">Период</span><div class="fsel" style="height:46px">${`<input type="date" id="rp-from" value="${esc(R.from)}" data-model="report.from" aria-label="С"><span class="dash">—</span><input type="date" id="rp-to" value="${esc(R.to)}" data-model="report.to" aria-label="По">`}</div></div>
 <button type="button" class="btn primary" data-act="genReport">Сформировать</button><button type="button" class="btn outline" data-act="copyReport" ${R.params?'':'disabled'}>${ic('copy',16)}Скопировать таблицу</button><button type="button" class="btn outline" disabled title="Доступно в полной версии">${ic('download',16)}Скачать PDF</button></div>
 <p class="hint" style="margin:-6px 0 16px">Без периода отчёт охватывает всю историю. «Скачать PDF» появится в полной версии — в демо есть предпросмотр A4 и копирование таблицы для Excel.</p>`;
 if(!R.params)return h+vEmpty('receipt','Отчёт ещё не сформирован','Выберите параметры и нажмите «Сформировать».');
 return h+`<div class="paper-scroll"><div class="paper" id="paper">${paperHTML(R.params)}</div></div>`;}
function paperHTML(p){const u=me();const lab=labById(u.labId);const gen=fmtFull(p.at);
 if(p.kind==='receivables'){const c=clinicById(p.target);const d=receivablesData(p.target,lab.id,p.from,p.to);
  const rows=d.rows.flatMap(o=>o.items.map((i,k)=>`<tr><td>${k===0?fmtShort(o.createdAt):''}</td><td>${k===0?'#'+o.id+(o.cycles.length>1?' <span class="mark-rework" style="height:18px">П'+(o.cycles.length-1)+'</span>':''):''}</td><td>${k===0?esc(o.patient):''}</td><td>${esc(i.name)}</td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.qty*i.price)}</td></tr>`)).join('');
  return `<div class="paper-head"><div><div class="paper-lab">${esc(lab.full)}</div><div class="paper-type">Расчёт с клиникой</div></div><div class="paper-meta">Клиника: <b style="color:var(--ink)">${esc(c.name)}</b>${c.oneOff?' (разовая)':''}<br>Период: ${fmtRange(p.from,p.to)}<br>Сформирован: ${gen}</div></div>
  ${d.rows.length?`<table class="tbl" id="rep-table"><thead><tr><th>Дата</th><th>Заказ</th><th>Пациент</th><th>Услуга</th><th class="num">Кол-во</th><th class="num">Цена</th><th class="num">Сумма</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="muted">За период заказов нет.</p>'}
  <div class="paper-total"><span>Итого по клинике (${d.rows.length} ${plural(d.rows.length,'заказ','заказа','заказов')})</span><b>${money(d.total)}</b></div><p class="paper-note">Переделки по вине лаборатории повторно не выставляются: заказ учитывается один раз по исходной цене.</p>`;}
 const t=techById(p.target);const d=payrollData(p.target,p.from,p.to);
 const rows=d.rows.map(r=>{const cl=clinicById(r.o.clinicId);const isRw=r.c.n>1;
  const lines=r.w.items.map((i,k)=>`<tr${isRw?' class="muted-row"':''}><td>${k===0?fmtShort(r.w.at):''}</td><td>${k===0?'#'+r.o.id:''}</td><td>${k===0?esc(r.o.patient):''}</td><td>${k===0?esc(cl.name):''}</td><td>${esc(i.name)}</td><td class="num">${i.qty}</td><td class="num">${money(i.rate)}</td><td class="num">${money(i.qty*i.rate)}</td></tr>`).join('');
  const sub=isRw?`<tr class="sub"><td colspan="5"><b>Переделка №${r.c.n-1}</b> · ${esc(r.c.reason)} · расчётно ${money(r.w.calc)}${r.p&&r.p.comment?' · '+esc(r.p.comment):''}</td><td colspan="2" class="num">${r.p?'<span class="appr">утверждено</span>':'<span class="pend">требует решения</span>'}</td><td class="num"><b>${r.p?money(r.p.approved):'—'}</b></td></tr>`:'';
  return lines+sub;}).join('');
 return `<div class="paper-head"><div><div class="paper-lab">${esc(lab.full)}</div><div class="paper-type">${p.kind==='tech'?'Отчёт о проделанной работе':'Расчёт заработной платы'}</div></div><div class="paper-meta">Техник: <b style="color:var(--ink)">${esc(t.name)}</b><br>Период: ${fmtRange(p.from,p.to)}<br>Сформирован: ${gen}</div></div>
 ${d.rows.length?`<table class="tbl" id="rep-table"><thead><tr><th>Дата</th><th>Заказ</th><th>Пациент</th><th>Клиника</th><th>Услуга</th><th class="num">Кол-во</th><th class="num">Ставка</th><th class="num">Сумма</th></tr></thead><tbody>${rows}</tbody></table>`:'<p class="muted">За период выполненных работ нет.</p>'}
 <div class="paper-total"><span>Итого к выплате</span><b>${money(d.total)}</b></div>
 ${d.pending?`<p class="paper-note"><span class="pend">Внимание</span> ${d.pending} ${plural(d.pending,'переделка ожидает','переделки ожидают','переделок ожидают')} решения администратора (расчётно ${money(d.pendingSum)}) и не включены в итог.</p>`:''}
 <p class="paper-note">Суммы рассчитаны по ставкам, зафиксированным в момент завершения работы.</p>`;}

/* ============ Analytics & accounts ============ */
function vAnalytics(){const lab=labById(me().labId);const os=S.orders.filter(o=>o.labId===lab.id);
 return `<div class="page-head"><div><h1>Аналитика</h1><p class="lead">${esc(lab.full)}</p></div></div><div class="panel-card placeholder"><span class="empty-ic">${ic('chart',26)}</span><h3 style="font-size:18px">Раздел в разработке</h3><p class="muted">Сейчас в лаборатории ${os.length} ${plural(os.length,'заказ','заказа','заказов')}, из них переделок: ${os.filter(o=>o.cycles.length>1).length}. В следующих версиях здесь появятся:</p><ul><li>Количество заказов по периодам</li><li>Выручка по клиникам</li><li>Загрузка техников</li><li>Сроки выполнения</li><li>Доля переделок</li><li>Причины переделок</li><li>Статистика по услугам</li></ul></div>`;}
function vAccounts(){const lab=labById(me().labId);const partners=S.clinics.filter(c=>!c.oneOff&&c.labIds.includes(lab.id));const oneoffs=S.clinics.filter(c=>c.oneOff&&c.labIds.includes(lab.id));const techs=S.techs.filter(t=>t.labId===lab.id);
 const login=f=>{const u=S.users.find(f);return u?`<code>${esc(u.login)}</code>`:'<span class="muted">—</span>';};
 return `<div class="page-head"><div><h1>Аккаунты</h1><p class="lead">Партнёры и сотрудники лаборатории «${esc(lab.name)}». Другие лаборатории здесь не видны.</p></div></div>
 <div class="stack"><div class="panel-card"><h3 style="font-size:17px;margin-bottom:12px">Клиники-партнёры</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Клиника</th><th>Логин</th><th>Заказов</th><th>Статус</th></tr></thead><tbody>${partners.map(c=>`<tr><td><b style="font-weight:600">${esc(c.name)}</b></td><td>${login(u=>u.clinicId===c.id)}</td><td class="num" style="text-align:left">${S.orders.filter(o=>o.clinicId===c.id&&o.labId===lab.id).length}</td><td><span class="src-tag src-ind">Активна</span></td></tr>`).join('')}</tbody></table></div></div>
 <div class="panel-card"><h3 style="font-size:17px;margin-bottom:12px">Разовые клиники</h3>${oneoffs.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Клиника / заказчик</th><th>Заказов</th></tr></thead><tbody>${oneoffs.map(c=>`<tr><td>${esc(c.name)} <span class="mark-oneoff">Разовая</span></td><td>${S.orders.filter(o=>o.clinicId===c.id).length}</td></tr>`).join('')}</tbody></table></div>`:'<p class="muted">Пока нет.</p>'}</div>
 <div class="panel-card"><h3 style="font-size:17px;margin-bottom:12px">Техники</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Техник</th><th>Специальность</th><th>Логин</th><th>Ставок</th></tr></thead><tbody>${techs.map(t=>`<tr><td><b style="font-weight:600">${esc(t.name)}</b></td><td>${esc(t.spec)}</td><td>${login(u=>u.techId===t.id)}</td><td>${Object.keys(S.techRates).filter(k=>k.startsWith(t.id+'|')).length}</td></tr>`).join('')}</tbody></table></div></div>
 <p class="hint">Создание и деактивация аккаунтов, приглашение новых клиник-партнёров — в полной версии.</p></div>`;}
