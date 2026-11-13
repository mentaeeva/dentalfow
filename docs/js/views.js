/* DentaFlow · Отрисовка интерфейса: экран входа, кабинеты ролей, карточки, форма заказа, детальная панель, модальные окна, справочники, отчёты. */
'use strict';

/* ============ UI state ============ */
const freshUI=()=>({route:'login',menuOpen:false,profileOpen:false,modal:null,modalEnter:false,panel:null,panelEnter:false,detailTab:'info',openCycles:{},payDraft:{},
 loading:false,highlight:null,focusTarget:null,demoId:'',
 login:{login:'',pw:'',show:false,error:'',busy:false,more:false},
 clinic:{q:'',lab:'all',status:'all',from:'',to:'',sort:'new',selectMode:false,sel:[]},
 admin:{tab:'RECEIVED',q:'',from:'',to:'',selectMode:false,sel:[]},
 tech:{tab:'progress',q:'',from:'',to:''},
 analytics:{preset:'30',from:'',to:''},
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
 el.innerHTML=`<span class="ti">${ic(kind==='ok'?'check':'alert',14)}</span><span class="tx">${esc(msg)}</span><button type="button" aria-label="${tr("Закрыть уведомление")}">${ic('x',16)}</button>`;
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
 return `<div class="page-head"><div><div class="skel" style="width:220px;height:30px"></div><div class="skel" style="width:280px;height:14px;margin-top:10px"></div></div></div><div class="skel" style="height:48px;border-radius:12px;margin-bottom:16px"></div><div class="grid" aria-busy="true" aria-label="${tr("Загрузка заказов")}">${card.repeat(4)}</div>`;}

function routePath(){const u=me();if(!u)return '/login';let p='';
 switch(UI.route){case 'clinic-orders':p='/clinic/orders';break;case 'order-form':p=UI.form&&UI.form.editId?'/clinic/orders/'+UI.form.editId+'/edit':(u.role==='ADMIN'?'/admin/orders/new':'/clinic/orders/new');break;
  case 'admin-orders':p='/admin/orders';break;case 'admin-prices':p='/admin/prices/clinics';break;case 'admin-rates':p='/admin/prices/technicians';break;
  case 'report':p=UI.report.kind==='payroll'?'/admin/payroll':UI.report.kind==='receivables'?'/admin/receivables':'/technician/reports';break;
  case 'admin-analytics':p='/admin/analytics';break;case 'admin-accounts':p='/admin/accounts';break;case 'tech-orders':p='/technician/orders';break;}
 if(UI.panel){const base=u.role==='CLINIC'?'/clinic/orders/':u.role==='ADMIN'?'/admin/orders/':'/technician/orders/';p=base+(UI.panel.denied!=null?UI.panel.denied:UI.panel.id);}
 return p;}
function vDemoBar(){return `<footer class="demobar" aria-label="${tr("Демо-режим")}"><div class="demo-l"><span class="demo-tag">${tr("Демо")}</span><code>${esc(routePath())}</code></div>
 <form class="demo-open" data-form="openById"><label for="demo-id">${tr("Открыть заказ по ID")}</label><input id="demo-id" class="input" inputmode="numeric" placeholder="1040" value="${esc(UI.demoId)}" data-model="demoId" autocomplete="off"><button class="btn sm outline" type="submit">${tr("Открыть")}</button></form>
 <button type="button" class="btn sm ghost push" data-act="askReset">${ic('refresh',16)}${tr("Сбросить демо-данные")}</button></footer>`;}

/* ============ Login ============ */
const DEMO_MAIN=['moydent','alfa.admin','erasyl'];
const ROLE_RU={CLINIC:'Клиника',ADMIN:'Админ',TECHNICIAN:'Техник'};
function accName(u){if(u.role==='CLINIC')return tr('Клиника «')+clinicById(u.clinicId).name+'»';if(u.role==='ADMIN')return u.name+' · '+labById(u.labId).name;return u.name+' · '+labById(u.labId).name;}
function vLogin(){const L=UI.login;
 const accRow=u=>`<button type="button" class="acc" data-act="fillLogin" data-login="${esc(u.login)}"><span class="role ${u.role}">${tr(ROLE_RU[u.role])}</span><span class="grow"><span class="nm" style="display:block">${esc(accName(u))}</span><code>${esc(u.login)}</code></span>${ic('chev',16)}</button>`;
 const main=S.users.filter(u=>DEMO_MAIN.includes(u.login)).sort((a,b)=>DEMO_MAIN.indexOf(a.login)-DEMO_MAIN.indexOf(b.login));
 const rest=S.users.filter(u=>!DEMO_MAIN.includes(u.login));
 return `<div class="auth">
 <section class="auth-brand">
  <div class="logo" style="cursor:default">${logoMark()}<span>DentaFlow</span></div>
  <div class="auth-copy"><h1 class="auth-h">${tr("Управление заказами зуботехнических лабораторий")}</h1>
   <p>${tr("Клиника оформляет заказ-наряд, лаборатория распределяет работу между техниками, и все участники видят один и тот же статус без переписки в мессенджерах.")}</p></div>
  <div class="ill" aria-hidden="true">
   <div class="ill-card a"><div class="t"><span>${tr("Сегодня · 14:30")}</span><span class="badge s-received">${tr("Получено")}</span></div><div class="n">${tr("Иванов Иван Иванович")}</div><div>${tr("Циркониевая коронка × 2")}</div><div class="f"><span>${tr("Клиника: Мой Дент")}</span><b>#1048</b></div></div>
   <div class="ill-card b"><div class="t"><span>${tr("Вчера · 16:10")}</span><span class="badge s-progress">${tr("В работе")}</span></div><div class="n">${tr("Сидоров Арман")}</div><div style="display:flex;gap:6px;margin-top:2px"><span class="tchip done"><span class="mini-av">${tr("ЕН")}</span>${tr("Ерасыл")}</span><span class="tchip"><span class="mini-av">${tr("ОС")}</span>${tr("Омар")}</span></div><div class="f"><span>${tr("Клиника: Баз Дент")}</span><b>#1045</b></div></div>
   <div class="ill-card c"><div class="t"><span>${tr("13 окт. · 11:20")}</span><span class="badge s-delivery">${tr("На доставке")}</span></div><div class="n">${tr("Петрова Анна Сергеевна")}</div><div>${tr("Временная коронка ПММА × 1")}</div><div class="f"><span>${tr("Лаборатория: Бета")}</span><b>#1047</b></div></div>
  </div>
  <p class="auth-foot">${tr("Заказы · назначения · переделки · расчёты — в одном кабинете")}</p>
 </section>
 <main class="auth-main"><form class="auth-form" data-form="login" novalidate>
  <div class="logo logo-compact" style="cursor:default">${logoMark()}<span>DentaFlow</span></div>
  ${languagePicker()}<div><h2>${tr("Добро пожаловать")}</h2><p class="muted" style="margin-top:6px">${tr("Войдите под учётной записью клиники, администратора лаборатории или техника. Нужный кабинет откроется автоматически.")}</p></div>
  <div class="field"><label for="lg-login">${tr("Логин")}</label><input id="lg-login" class="input${L.error?' err':''}" autocomplete="username" value="${esc(L.login)}" data-model="login.login" autocapitalize="none" spellcheck="false"></div>
  <div class="field"><label for="lg-pw">${tr("Пароль")}</label><div class="pw"><input id="lg-pw" class="input${L.error?' err':''}" type="${L.show?'text':'password'}" autocomplete="current-password" value="${esc(L.pw)}" data-model="login.pw"><button type="button" class="pw-t" data-act="togglePw" aria-label="${L.show?tr('Скрыть пароль'):tr('Показать пароль')}">${ic(L.show?'eyeoff':'eye',19)}</button></div></div>
  ${L.error?`<div class="auth-err" role="alert">${ic('alert',17)}<span>${esc(tr(L.error))}</span></div>`:''}
  <button class="btn primary full" type="submit" ${L.busy?'disabled':''}>${L.busy?tr('<span class="spin"></span>Входим…'):tr('Войти')}</button>
  <p class="demo-note">${tr("Демонстрационная версия. Все данные вымышленные и хранятся только в этом браузере.")}</p>
  <div class="demo-acc"><div class="demo-acc-h"><span>${tr("Тестовые аккаунты")}</span><span>${tr("пароль: demo123")}</span></div>
   ${main.map(accRow).join('')}
   ${L.more?rest.map(accRow).join(''):''}
   <button type="button" class="acc-more" data-act="moreAcc">${L.more?tr('Скрыть дополнительные'):tr('Ещё ')+rest.length+' '+plural(rest.length,tr('аккаунт'),tr('аккаунта'),tr('аккаунтов'))+tr(': вторая лаборатория, клиники, техники')}</button>
  </div>
 </form></main></div>`;}

/* ============ Top bar & sidebar ============ */
function vTop(){const u=me();let crumb='',pn='',pr='';
 if(u.role==='CLINIC'){pn=tr('Клиника «')+clinicById(u.clinicId).name+'»';pr=tr('Кабинет клиники');}
 if(u.role==='ADMIN'){const l=labById(u.labId);crumb=`<span class="crumb">/ ${esc(laboratoryName(l))}</span>`;pn=u.name;pr=tr('Администратор · ')+l.name;}
 if(u.role==='TECHNICIAN'){const t=techById(u.techId);pn=t.name;pr=tr('Техник · ')+laboratoryName(labById(t.labId));}
 return `<header class="topbar"><div class="topbar-in">
 ${u.role==='ADMIN'?`<button type="button" class="iconbtn" data-act="menu" aria-label="${tr("Открыть меню")}" aria-expanded="${UI.menuOpen}">${ic('menu')}</button>`:''}
 <button type="button" class="logo" data-act="home" aria-label="${tr("DentaFlow — на главную")}">${logoMark()}<span class="logo-t">DentaFlow</span></button>${crumb}
 <div class="top-right">${languagePicker()}<button type="button" class="profile-btn" data-act="profile" aria-haspopup="menu" aria-expanded="${UI.profileOpen}" aria-label="${tr("Меню профиля")}"><span class="pt"><span class="pn">${esc(pn)}</span><span class="pr">${esc(pr)}</span></span><span class="avatar">${esc(initials(pn))}</span></button>
 ${UI.profileOpen?`<div class="menu" role="menu"><button type="button" role="menuitem" data-act="account">${ic('user')}${tr("Аккаунт")}</button>${u.role==='TECHNICIAN'?`<button type="button" role="menuitem" data-act="techReport">${ic('receipt')}${tr("Отчёт о проделанной работе")}</button>`:''}<button type="button" role="menuitem" data-act="feedback">${ic('star')}${tr("Оценить удобство")}</button><hr><button type="button" role="menuitem" data-act="logout">${ic('logout')}${tr("Выйти")}</button></div>`:''}
 </div></div></header>`;}
function vSidebar(){const l=labById(me().labId);const r=UI.route,k=UI.report.kind;
 const it=(route,icn,label,kind)=>{const on=route===r&&(!kind||kind===k);return `<button type="button" class="side-item ${on?'on':''}" data-act="nav" data-route="${route}"${kind?` data-kind="${kind}"`:''} ${on?'aria-current="page"':''}>${ic(icn,19)}<span>${label}</span></button>`;};
 return `<div class="drawer-wrap"><div class="scrim" data-act="closeMenu"></div><nav class="drawer" aria-label="${tr("Меню лаборатории")}">
 <div class="drawer-head"><div style="flex:1;min-width:0"><div class="dh-k">${tr("Текущая лаборатория")}</div><div class="dh-n">${esc(laboratoryName(l))}</div></div><button type="button" class="iconbtn plain" data-act="closeMenu" aria-label="${tr("Закрыть меню")}">${ic('x')}</button></div>
 <div class="side-sec">${tr("Работа")}</div>${it('admin-orders','orders',tr('Заказы'))}${it('admin-analytics','chart',tr('Аналитика'))}
 <div class="side-sec">${tr("Финансы")}</div>${it('report','wallet',tr('Зарплаты техникам'),'payroll')}${it('report','receipt',tr('Расчёты с клиниками'),'receivables')}
 <div class="side-sec">${tr("Справочники")}</div>${it('admin-prices','tag',tr('Цены клиник'))}${it('admin-rates','user',tr('Ставки техников'))}${it('admin-accounts','users',tr('Аккаунты'))}
 <div class="side-sec">${tr("Система")}</div><button type="button" class="side-item" data-act="feedback">${ic('star',19)}<span>${tr("Оценить удобство")}</span></button><button type="button" class="side-item" data-act="logout">${ic('logout',19)}<span>${tr("Выйти")}</span></button>
 </nav></div>`;}

/* ============ Cards ============ */
function svcSummary(items){if(!items.length)return '—';const f=items[0];if(items.length===1)return serviceName(f.name)+' × '+f.qty;const n=items.length-1;return serviceName(f.name)+' × '+f.qty+' + '+n+' '+plural(n,tr('услуга'),tr('услуги'),tr('услуг'));}
function vCard(o,role,opts){opts=opts||{};const lab=labById(o.labId),cl=clinicById(o.clinicId);
 let badge;if(role==='TECHNICIAN'){badge=myTechState(o)==='done'?tr('<span class="badge s-done">Сделано</span>'):tr('<span class="badge s-progress">В работе</span>');}else badge=statusBadge(o,role);
 const rework=o.cycles.length>1?`<span class="mark-rework">${ic('refresh',12)}${tr("Переделка №")}${o.cycles.length-1}</span>`:'';
 let techRow='';
 if(role==='ADMIN'&&o.status==='IN_PROGRESS'){techRow=`<div class="card-techs"><span class="lbl">${tr("Техники:")}</span>${activeA(o).map(a=>{const t=techById(a.techId);return `<span class="tchip ${a.doneAt?'done':''}" title="${esc(t.name)}${a.doneAt?tr(' — часть завершена'):''}"><span class="mini-av">${esc(initials(t.name))}</span>${esc(t.short)}${a.doneAt?ic('check',12):''}</span>`;}).join('')}</div>`;}
 let left;
 if(role==='CLINIC')left=`<span>${tr("Лаборатория: ")}<b>${esc(lab.name)}</b></span>`;
 else if(role==='ADMIN')left=`<span>${tr("Клиника: ")}<b>${esc(cl.name)}</b></span>${cl.oneOff?tr('<span class="mark-oneoff">Разовая клиника</span>'):''}`;
 else left=`<span>${tr("Клиника: ")}<b>${esc(cl.name)}</b></span><span class="due">${tr("До: ")}<b>${fmtDay(o.due)}</b></span>`;
 const sel=opts.selectable,chk=opts.checked;
 return `<article id="card-${o.id}" class="card${o.status==='CANCELLED'?' muted':''}${chk?' checked':''}${UI.highlight===o.id?' hl':''}" data-act="${sel?'toggleSel':'open'}" data-id="${o.id}" tabindex="0" role="button" aria-label="${tr("Заказ #")}${o.id}, ${esc(o.patient)}${sel?(chk?tr(', выбран'):tr(', не выбран')):''}">
 <div class="card-top">${sel?`<input type="checkbox" class="cbx" ${chk?'checked':''} aria-label="${tr("Выбрать заказ #")}${o.id}" data-act="toggleSel" data-id="${o.id}" tabindex="-1">`:''}<span class="meta">${fmtDT(o.createdAt)}</span>${badge}</div>
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
function vSearch(scope,id,ph){const v=UI[scope].q;return `<div class="search"><span class="search-ic">${ic('search',19)}</span><input id="${id}" class="input" type="search" placeholder="${ph}" value="${esc(v)}" data-model="${scope}.q" aria-label="${ph}" autocomplete="off">${v?`<button type="button" class="search-x" data-act="clearQ" data-scope="${scope}" aria-label="${tr("Очистить поиск")}">${ic('x',17)}</button>`:''}</div>`;}
function vPeriod(scope,prefix){const s=UI[scope];return `<div class="fsel ${s.from||s.to?'active':''}"><span>${tr("Период")}</span><input type="date" id="${prefix}-from" value="${esc(s.from)}" data-model="${scope}.from" aria-label="${tr("Период с")}"${s.to?` max="${s.to}"`:''}><span class="dash">—</span><input type="date" id="${prefix}-to" value="${esc(s.to)}" data-model="${scope}.to" aria-label="${tr("Период по")}"${s.from?` min="${s.from}"`:''}></div>`;}

/* ============ CLINIC ============ */
const CL_STATUS=[['all','Все'],['RECEIVED','Отправлено'],['IN_PROGRESS','В работе'],['DONE','Сделано'],['IN_DELIVERY','На доставке'],['DELIVERED','Получено']];
function clinicFilterControls(px){const f=UI.clinic,c=clinicById(me().clinicId);
 return `<label class="fsel ${f.lab!=='all'?'active':''}"><span>${tr("Лаборатория:")}</span><select id="${px}-lab" data-model="clinic.lab"><option value="all">${tr("Все")}</option>${c.labIds.map(id=>`<option value="${id}" ${f.lab===id?'selected':''}>${esc(labById(id).name)}</option>`).join('')}</select></label>
 <label class="fsel ${f.status!=='all'?'active':''}"><span>${tr("Статус:")}</span><select id="${px}-st" data-model="clinic.status">${CL_STATUS.map(([v,l])=>`<option value="${v}" ${f.status===v?'selected':''}>${tr(l)}</option>`).join('')}</select></label>
 ${vPeriod('clinic',px)}
 <label class="fsel"><span>${tr("Сортировка:")}</span><select id="${px}-sort" data-model="clinic.sort"><option value="new" ${f.sort==='new'?'selected':''}>${tr("Сначала новые")}</option><option value="old" ${f.sort==='old'?'selected':''}>${tr("Сначала старые")}</option><option value="labAZ" ${f.sort==='labAZ'?'selected':''}>${tr("Лаборатории А–Я")}</option><option value="labZA" ${f.sort==='labZA'?'selected':''}>${tr("Лаборатории Я–А")}</option></select></label>`;}
function clinicList(){const u=me(),f=UI.clinic;let l=S.orders.filter(o=>o.clinicId===u.clinicId&&o.status!=='CANCELLED');
 if(f.lab!=='all')l=l.filter(o=>o.labId===f.lab);if(f.status!=='all')l=l.filter(o=>o.status===f.status);
 if(f.from||f.to)l=l.filter(o=>inRange(o.createdAt,f.from,f.to));if(f.q.trim())l=l.filter(o=>matchQ(o,f.q));return sortOrders(l,f.sort);}
const clinicFiltersActive=()=>{const f=UI.clinic;return (f.lab!=='all')+(f.status!=='all')+(f.from||f.to?1:0)+(f.sort!=='new');};
function vClinicOrders(){const u=me(),c=clinicById(u.clinicId),f=UI.clinic;
 const all=S.orders.filter(o=>o.clinicId===c.id&&o.status!=='CANCELLED');const inDel=all.filter(o=>o.status==='IN_DELIVERY');
 const list=clinicList();const nAct=clinicFiltersActive();
 let h=`<div class="page-head"><div><h1>${tr("История заказов")}</h1><p class="lead">${tr("Клиника «")}${esc(c.name)}${tr("» · лаборатории-партнёры: ")}${c.labIds.map(id=>esc(labById(id).name)).join(', ')}</p></div></div>`;
 if(inDel.length&&f.status!=='IN_DELIVERY')h+=`<div class="notice"><span class="notice-ic">${ic('truck')}</span><div><b>${inDel.length} ${plural(inDel.length,tr('заказ'),tr('заказа'),tr('заказов'))}${tr(" на доставке.")}</b>${tr(" Отметьте полученные работы, чтобы лаборатория увидела подтверждение.")}</div><button type="button" class="btn sm outline" data-act="goDelivery">${tr("Перейти к приёмке")}</button></div>`;
 h+=vSearch('clinic','cl-q',tr('Поиск по ФИО пациента или ID'));
 h+=`<div class="filters">${clinicFilterControls('clf')}${nAct?`<button type="button" class="btn sm ghost filter-reset" data-act="resetClinicFilters">${tr("Сбросить фильтры")}</button>`:''}</div>`;
 h+=`<div class="filters-m"><button type="button" class="btn sm outline" data-act="openFilters">${ic('filter',16)}${tr("Фильтры")}${nAct?' · '+nAct:''}</button>${nAct?`<button type="button" class="btn sm ghost" data-act="resetClinicFilters">${tr("Сбросить")}</button>`:''}</div>`;
 h+=`<div class="chips" role="group" aria-label="${tr("Статус заказа")}">${CL_STATUS.map(([v,l])=>{const n=v==='all'?all.length:all.filter(o=>o.status===v).length;return `<button type="button" class="chip ${f.status===v?'on':''}" data-act="chip" data-v="${v}" aria-pressed="${f.status===v}">${tr(l)}<span class="cnt">${n}</span></button>`;}).join('')}</div>`;
 if(f.status==='IN_DELIVERY'&&list.length)h+=`<div class="toolbar"><span class="grow muted">${tr("Отметьте заказы, которые клиника фактически получила, и подтвердите приёмку.")}</span><button type="button" class="btn sm ${f.selectMode?'primary':'outline'}" data-act="toggleSelect" data-scope="clinic">${f.selectMode?tr('Готово'):tr('Выбрать')}</button></div>`;
 if(!all.length)h+=vEmpty('inbox',tr('Заказов пока нет'),tr('Оформите первый заказ-наряд: выберите лабораторию, услуги и приложите скан или отметьте слепок.'),`<button type="button" class="btn primary" data-act="newOrder">${ic('plus')}${tr("Создать первый заказ")}</button>`);
 else if(!list.length)h+=vEmpty('search',tr('Заказы не найдены'),tr('По выбранным условиям ничего нет. Измените запрос или сбросьте фильтры.'),`<button type="button" class="btn outline" data-act="resetClinicFilters">${tr("Сбросить фильтры")}</button>`);
 else{h+=`<div class="result-line">${tr("Показано ")}${list.length}${tr(" из ")}${all.length}</div>`;
  const opt=o=>({selectable:f.selectMode&&o.status==='IN_DELIVERY',checked:f.sel.includes(o.id)});
  if(f.sort==='labAZ'||f.sort==='labZA'){const groups=[];list.forEach(o=>{let g=groups.find(x=>x.lab===o.labId);if(!g)groups.push(g={lab:o.labId,items:[]});g.items.push(o);});
   h+=groups.map(g=>`<h2 class="group-h">${esc(laboratoryName(labById(g.lab)))}<span class="cnt">${g.items.length}</span></h2><div class="grid">${g.items.map(o=>vCard(o,'CLINIC',opt(o))).join('')}</div>`).join('');}
  else h+=`<div class="grid">${list.map(o=>vCard(o,'CLINIC',opt(o))).join('')}</div>`;}
 if(f.selectMode)h+=`<div class="selbar" role="region" aria-label="${tr("Выбранные заказы")}"><span class="grow">${tr("Выбрано ")}${f.sel.length}${tr(" из ")}${list.filter(o=>o.status==='IN_DELIVERY').length}</span><button type="button" class="btn sm outline" data-act="toggleSelect" data-scope="clinic">${tr("Отмена")}</button><button type="button" class="btn sm primary" data-act="acceptSelected" ${f.sel.length?'':'disabled'}>${ic('check',16)}${tr("Принято")}</button></div>`;
 else h+=`<button type="button" class="fab" data-act="newOrder" aria-label="${tr("Новый заказ-наряд")}" title="${tr("Новый заказ-наряд")}">${ic('plus',26)}</button>`;
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
 if(F.mode==='admin'&&!F.clinicName.trim())e.clinicName=tr('Укажите название клиники или заказчика');
 if(!F.labId)e.lab=tr('Выберите лабораторию, которой адресован заказ');
 if(F.patient.trim().length<3)e.patient=tr('Укажите ФИО пациента');
 if(F.labId){const svcs=S.services.filter(s=>s.labId===F.labId&&s.active);
  if(!svcs.length)e.rows=tr('У лаборатории пока нет доступных услуг');
  else if(!F.rows.some(r=>r.serviceId))e.rows=tr('Добавьте хотя бы одну услугу');
  F.rows.forEach(r=>{if(!r.serviceId&&F.rows.length>1)e['svc-'+r.key]=tr('Выберите услугу или удалите строку');if(r.serviceId&&!(Number.isInteger(Number(r.qty))&&Number(r.qty)>=1&&Number(r.qty)<=999))e['qty-'+r.key]=tr('Количество: целое число от 1 до 999');});}
 if(!F.source)e.source=tr('Выберите тип исходных данных');
 if(F.source==='scan'&&!F.files.length)e.files=tr('Для скана прикрепите хотя бы один файл');
 if(F.due&&F.due<=ymd(new Date()))e.due=tr('Дата сдачи должна быть позже сегодняшней');
 return e;}
function firstErrSel(F,e){if(e.clinicName)return '#f-clinic';if(e.lab)return '#f-lab';if(e.patient)return '#f-patient';
 const r=F.rows.find(r=>e['svc-'+r.key]||e['qty-'+r.key]);if(r)return e['svc-'+r.key]?'#f-svc-'+r.key:'#f-qty-'+r.key;
 if(e.rows)return F.rows[0]?'#f-svc-'+F.rows[0].key:'#f-lab';if(e.source)return '#f-src-scan';if(e.files)return '#f-files';if(e.due)return '#f-due';return null;}
const errT=m=>m?`<div class="err-text" role="alert">${ic('alert',15)}<span>${esc(m)}</span></div>`:'';
function missingSummary(e){const m=[];if(e.clinicName)m.push(tr('клиника'));if(e.lab)m.push(tr('лаборатория'));if(e.patient)m.push(tr('ФИО пациента'));if(e.rows||Object.keys(e).some(k=>k.startsWith('svc-')||k.startsWith('qty-')))m.push(tr('услуги'));if(e.source)m.push(tr('скан или слепок'));if(e.files)m.push(tr('файлы скана'));if(e.due)m.push(tr('дата сдачи'));return m;}
function vOrderForm(){const F=UI.form;if(!F)return '';const u=me();const E=F.showErrors?F.errors:{};const isAdmin=F.mode==='admin',isEdit=!!F.editId;
 const lab=F.labId?labById(F.labId):null;const svcs=lab?S.services.filter(s=>s.labId===lab.id&&s.active):[];
 const title=isEdit?tr('Изменить заказ #')+F.editId:(isAdmin?tr('Заказ для разовой клиники'):tr('Новый заказ-наряд'));
 let h=`<div class="form-page"><div class="form-top"><button type="button" class="btn ghost sm" data-act="formBack">${ic('back',18)}${tr("Назад")}</button><h1>${title}</h1><span class="hint">${tr("Обязательные поля отмечены ")}<span class="req">*</span></span></div>`;
 // A. Recipient
 h+=`<section class="fsec" aria-labelledby="sa"><div class="fsec-h"><span class="k">A</span><h2 id="sa">${tr("Получатель")}</h2></div>`;
 if(isAdmin){const oneoffs=S.clinics.filter(c=>c.oneOff&&c.labIds.includes(u.labId));
  h+=`<div class="lab-locked">${ic('lock',18)}<div><b>${esc(laboratoryName(lab))}</b><div class="hint">${tr("Заказ поступит в вашу лабораторию. Применяется базовый прайс.")}</div></div></div>
  <div class="field"><label for="f-clinic">${tr("Название клиники / заказчика ")}<span class="req">*</span></label><input id="f-clinic" class="input${E.clinicName?' err':''}" list="oneoff-list" value="${esc(F.clinicName)}" data-model="form.clinicName" placeholder="${tr("Например: Стоматология «Ақ Тіс»")}" autocomplete="off"><datalist id="oneoff-list">${oneoffs.map(c=>`<option value="${esc(c.name)}">`).join('')}</datalist><span class="hint">${tr("Аккаунт не создаётся. Запись видна только вашей лаборатории и получит отметку «Разовая клиника».")}</span>${errT(E.clinicName)}</div>`;}
 else if(isEdit){h+=`<div class="lab-locked">${ic('lock',18)}<div><b>${esc(laboratoryName(lab))}</b><div class="hint">${tr("Лабораторию нельзя сменить после отправки. Для другой лаборатории создайте новый заказ.")}</div></div></div>`;}
 else{const c=clinicById(u.clinicId);
  h+=`<div class="field"><label for="f-lab">${tr("Лаборатория ")}<span class="req">*</span></label><select id="f-lab" class="select${E.lab?' err':''}" data-change="labPick"><option value="">${tr("Выберите лабораторию")}</option>${c.labIds.map(id=>`<option value="${id}" ${F.labId===id?'selected':''}>${esc(laboratoryName(labById(id)))}</option>`).join('')}</select><span class="hint">${tr("Выберите лабораторию, которой адресован заказ. От выбора зависят список услуг и цены.")}</span>${errT(E.lab)}</div>`;}
 h+=`</section>`;
 // B. Patient & services
 h+=`<section class="fsec" aria-labelledby="sb"><div class="fsec-h"><span class="k">B</span><h2 id="sb">${tr("Пациент и услуги")}</h2></div>
 <div class="field"><label for="f-patient">${tr("ФИО пациента ")}<span class="req">*</span></label><input id="f-patient" class="input${E.patient?' err':''}" value="${esc(F.patient)}" data-model="form.patient" autocomplete="off" placeholder="${tr("Фамилия Имя Отчество")}">${errT(E.patient)}</div>
 <div class="field"><span class="flabel">${tr("Услуги ")}<span class="req">*</span></span>`;
 if(!lab)h+=`<div class="disabled-area">${ic('info',18)}${tr("Сначала выберите лабораторию: список услуг и цены зависят от неё.")}</div>`;
 else if(!svcs.length)h+=`<div class="disabled-area">${ic('alert',18)}${tr("Услуги пока недоступны. Лаборатория ещё не заполнила справочник — отправить заказ нельзя.")}</div>`;
 else{h+=`<div class="svc-head"><span>${tr("Услуга")}</span><span>${tr("Количество")}</span><span style="text-align:right">${tr("Цена/шт.")}</span><span style="text-align:right">${tr("Итого")}</span><span></span></div><div class="svc-rows">`;
  h+=F.rows.map(r=>{const se=E['svc-'+r.key],qe=E['qty-'+r.key];const sum=r.serviceId?(Number(r.qty)||0)*r.price:0;
   return `<div class="svc-row"><div class="c-svc"><select id="f-svc-${r.key}" class="select${se||(E.rows&&!r.serviceId)?' err':''}" data-rowsvc="${r.key}" aria-label="${tr("Услуга")}"><option value="">${tr("Выберите услугу")}</option>${svcs.map(s=>`<option value="${s.id}" ${r.serviceId===s.id?'selected':''}>${esc(serviceName(s.name))}</option>`).join('')}</select>${errT(se)}</div>
   <div class="c-qty"><span class="mlabel">${tr("Количество")}</span><div class="stepper${qe?' err':''}"><button type="button" class="st-b" data-act="qty" data-d="-1" data-key="${r.key}" aria-label="${tr("Уменьшить количество")}" ${(Number(r.qty)||0)<=1?'disabled':''}>−</button><input id="f-qty-${r.key}" class="st-i" inputmode="numeric" value="${esc(r.qty)}" data-rowqty="${r.key}" aria-label="${tr("Количество")}"><button type="button" class="st-b" data-act="qty" data-d="1" data-key="${r.key}" aria-label="${tr("Увеличить количество")}">+</button></div>${errT(qe)}</div>
   <div class="c-p"><span class="mlabel">${tr("Цена/шт.")}</span><div class="p">${r.serviceId?money(r.price):'—'}</div></div>
   <div class="c-s"><span class="mlabel">${tr("Итого")}</span><div class="s">${r.serviceId?money(sum):'—'}</div></div>
   <div class="c-del"><button type="button" class="iconbtn plain" data-act="delRow" data-key="${r.key}" aria-label="${tr("Удалить строку")}" ${F.rows.length<=1?'disabled':''}>${ic('trash',18)}</button></div></div>`;}).join('');
  h+=`</div>${errT(E.rows)}<div class="svc-foot"><button type="button" class="btn outline sm" data-act="addRow">${ic('plus',16)}${tr("Добавить услугу")}</button><div class="svc-total"><span class="l">${tr("Итого")}</span><span class="v">${money(formTotal(F))}</span></div></div>`;
  if(!isAdmin)h+=`<span class="hint">${tr("Цены указаны по договорному прайсу вашей клиники с лабораторией «")}${esc(lab.name)}».</span>`;}
 h+=`</div></section>`;
 // C. Source
 h+=`<section class="fsec" aria-labelledby="sc"><div class="fsec-h"><span class="k">C</span><h2 id="sc">${tr("Исходные данные ")}<span class="req">*</span></h2></div>
 <div class="radio-cards" role="radiogroup" aria-label="${tr("Тип исходных данных")}">
  <button type="button" role="radio" id="f-src-scan" aria-checked="${F.source==='scan'}" class="rcard ${F.source==='scan'?'on':''}${E.source?' err':''}" data-act="setSource" data-v="scan"><span class="rdot"></span><span><b>${tr("Скан")}</b><span class="hint">${tr("Цифровой оттиск. Файлы обязательны")}</span></span></button>
  <button type="button" role="radio" id="f-src-imp" aria-checked="${F.source==='impression'}" class="rcard ${F.source==='impression'?'on':''}${E.source?' err':''}" data-act="setSource" data-v="impression"><span class="rdot"></span><span><b>${tr("Слепок")}</b><span class="hint">${tr("Физический оттиск передаётся курьером")}</span></span></button>
 </div>${errT(E.source)}
 <div class="dropzone${E.files?' err':''}" data-drop="form"><span class="dz-ic">${ic('clip',22)}</span><div class="grow"><b>${tr("Файлы")}</b> ${F.source==='scan'?'<span class="req">*</span>':F.source==='impression'?tr('<span class="muted">· необязательно</span>'):''}<div class="hint">${tr("Перетащите сюда или выберите. STL, PLY, OBJ, DCM, ZIP, JPG, PNG, PDF · до 50 МБ каждый")}</div></div><label for="f-files" class="btn outline sm">${tr("Выбрать файлы")}</label><input type="file" id="f-files" class="sr" multiple data-change="files" accept=".stl,.ply,.obj,.dcm,.zip,.jpg,.jpeg,.png,.pdf"></div>
 ${errT(E.files)}
 ${F.files.length?`<div class="files">${F.files.map((x,i)=>`<div class="file">${ic('file',17)}${x.path&&window.DentaFlowCloud?`<a class="fn" href="${esc(window.DentaFlowCloud.publicUrl(x.path))}" target="_blank" rel="noopener">${esc(x.name)}</a>`:`<span class="fn">${esc(x.name)}</span>`}<span class="fs">${fsize(x.size)}</span><button type="button" class="iconbtn plain" style="width:36px;height:36px" data-act="delFile" data-i="${i}" aria-label="${tr("Удалить файл ")}${esc(x.name)}">${ic('x',16)}</button></div>`).join('')}</div><span class="hint">${window.DentaFlowCloud.ready?tr("Файлы хранятся в Supabase Storage."):tr("Демо сохраняет только имена файлов. Настройте Supabase, чтобы загружать содержимое.")}</span>`:''}
 </section>`;
 // D. Extra
 const tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);
 h+=`<section class="fsec" aria-labelledby="sd"><div class="fsec-h"><span class="k">D</span><h2 id="sd">${tr("Дополнительно")}</h2></div>
 <div class="field"><label for="f-comment">${tr("Комментарий")}</label><textarea id="f-comment" class="textarea" data-model="form.comment" placeholder="${tr("Цвет, особенности прикуса, пожелания к работе")}">${esc(F.comment)}</textarea></div>
 <div class="field" style="max-width:320px"><label for="f-due">${tr("Желаемая дата сдачи")}</label><input id="f-due" type="date" class="input${E.due?' err':''}" min="${ymd(tomorrow)}" value="${esc(F.due)}" data-model="form.due"><span class="hint">${tr("Если не указана — 10 рабочих дней, кроме воскресенья (до ")}${fmtDay(addWorkDays(new Date().toISOString(),10))}).</span>${errT(E.due)}</div>
 </section>`;
 // E. Actions
 const liveErr=validateForm(F);const miss=missingSummary(liveErr);
 h+=`<div class="form-actions"><div class="sum"><span class="l">${tr("Сумма заказа")}</span><span class="v">${money(formTotal(F))}</span></div><button type="button" class="btn outline" data-act="formBack">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="submitForm" aria-disabled="${miss.length?'true':'false'}">${isEdit?tr('Сохранить изменения'):tr('Отправить заказ')}</button>${miss.length?`<span class="missing">${tr("Чтобы отправить, заполните: ")}${miss.join(', ')}.</span>`:''}</div></div>`;
 return h;}

/* ============ ADMIN ============ */
const AD_TABS=[['RECEIVED','Получено'],['IN_PROGRESS','В работе'],['DONE','Сделано'],['IN_DELIVERY','На доставке'],['DELIVERED','Доставлено'],['CANCELLED','Архив']];
function vAdminOrders(){const u=me(),lab=labById(u.labId),f=UI.admin;const mine=S.orders.filter(o=>o.labId===lab.id);
 let list=mine.filter(o=>o.status===f.tab);if(f.q.trim())list=list.filter(o=>matchQ(o,f.q,true));if(f.from||f.to)list=list.filter(o=>inRange(o.createdAt,f.from,f.to));
 list=sortOrders(list,'new');
 let h=`<div class="page-head"><div><h1>${tr("Заказы")}</h1><p class="lead">${esc(laboratoryName(lab))}${tr(" · заказы других лабораторий здесь не отображаются")}</p></div></div>`;
 h+=`<div class="tabs" role="tablist" aria-label="${tr("Разделы заказов")}">${AD_TABS.map(([v,l])=>`<button type="button" role="tab" aria-selected="${f.tab===v}" class="tab ${f.tab===v?'on':''}" data-act="adminTab" data-v="${v}">${tr(l)}<span class="cnt">${mine.filter(o=>o.status===v).length}</span></button>`).join('')}</div>`;
 h+=`<div class="toolbar">${vSearch('admin','ad-q',tr('Поиск по пациенту, клинике или ID'))}${vPeriod('admin','adf')}${f.tab==='DONE'&&list.length?`<button type="button" class="btn sm ${f.selectMode?'primary':'outline'}" data-act="toggleSelect" data-scope="admin">${f.selectMode?tr('Готово'):tr('Выбрать')}</button>`:''}</div>`;
 if(f.tab==='CANCELLED')h+=`<p class="result-line">${tr("Отменённые заказы хранятся в архиве. Причина и подтверждающий файл доступны в карточке.")}</p>`;
 if(!list.length){const msgs={RECEIVED:[tr('Новых заказов нет'),tr('Новые заказы клиник появятся здесь автоматически.')],IN_PROGRESS:[tr('Нет заказов в работе'),tr('Назначьте техников на заказ из раздела «Получено».')],DONE:[tr('Нет готовых работ'),tr('Заказы попадут сюда, когда все исполнители завершат свою часть.')],IN_DELIVERY:[tr('Нет заказов на доставке'),''],DELIVERED:[tr('Нет доставленных заказов'),''],CANCELLED:[tr('Архив пуст'),'']};
  const m=(f.q||f.from||f.to)?[tr('Заказы не найдены'),tr('Измените запрос или период.')]:msgs[f.tab];
  h+=vEmpty(f.q?'search':'inbox',m[0],m[1],(f.q||f.from||f.to)?`<button type="button" class="btn outline" data-act="resetAdminFilters">${tr("Сбросить фильтры")}</button>`:'');}
 else h+=`<div class="grid">${list.map(o=>vCard(o,'ADMIN',{selectable:f.selectMode&&f.tab==='DONE',checked:f.sel.includes(o.id)})).join('')}</div>`;
 if(f.selectMode)h+=`<div class="selbar" role="region" aria-label="${tr("Выбранные заказы")}"><span class="grow">${tr("Выбрано ")}${f.sel.length}</span><button type="button" class="btn sm outline" data-act="toggleSelect" data-scope="admin">${tr("Отмена")}</button><button type="button" class="btn sm primary" data-act="sendSelected" ${f.sel.length?'':'disabled'}>${ic('truck',16)}${tr("Передать на доставку")}</button></div>`;
 else h+=`<button type="button" class="fab" data-act="newOneOff" aria-label="${tr("Заказ для разовой клиники")}" title="${tr("Заказ для разовой клиники")}">${ic('plus',26)}</button>`;
 return h;}

/* ============ TECHNICIAN ============ */
function techLists(){const u=me(),f=UI.tech;let mine=S.orders.filter(o=>canSee(o,u));
 if(f.from||f.to)mine=mine.filter(o=>inRange(o.createdAt,f.from,f.to));if(f.q.trim())mine=mine.filter(o=>matchQ(o,f.q,true));
 return{progress:sortOrders(mine.filter(o=>myTechState(o)==='progress'),'new'),done:sortOrders(mine.filter(o=>myTechState(o)==='done'),'new')};}
function vTechOrders(){const u=me(),t=techById(u.techId),f=UI.tech;const L=techLists();const list=L[f.tab];
 let h=`<div class="page-head"><div><h1>${tr("Мои заказы")}</h1><p class="lead">${esc(t.name)} · ${esc(tr(t.spec))} · ${esc(laboratoryName(labById(t.labId)))}</p></div></div>`;
 h+=`<div class="toolbar">${vPeriod('tech','tf')}<button type="button" class="btn sm outline" data-act="techReport">${ic('receipt',16)}${tr("Отчёт о проделанной работе")}</button></div>`;
 h+=`<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="${f.tab==='progress'}" class="tab ${f.tab==='progress'?'on':''}" data-act="techTab" data-v="progress">${tr("В работе")}<span class="cnt">${L.progress.length}</span></button><button type="button" role="tab" aria-selected="${f.tab==='done'}" class="tab ${f.tab==='done'?'on':''}" data-act="techTab" data-v="done">${tr("Сделано")}<span class="cnt">${L.done.length}</span></button></div>`;
 h+=vSearch('tech','te-q',tr('Поиск по пациенту, клинике или ID'));
 if(!list.length)h+=vEmpty('inbox',f.tab==='progress'?tr('Нет заказов в работе'):tr('Пока нет завершённых работ'),f.tab==='progress'?tr('Когда администратор назначит вас исполнителем, заказ появится здесь.'):tr('Завершённые вами части заказов появятся здесь.'));
 else h+=`<div class="grid">${list.map(o=>vCard(o,'TECHNICIAN')).join('')}</div>`;
 return h;}

/* ============ Detail panel ============ */
function panelShell(title,badge,body,actions,tabs){return `<div class="panel-wrap"><div class="scrim" data-act="closePanel"></div><aside class="panel${UI.panelEnter?' enter':''}" role="dialog" aria-modal="true" aria-labelledby="panel-title">
 <header class="panel-head"><button type="button" class="iconbtn plain back-m" data-act="closePanel" aria-label="${tr("Назад")}">${ic('back')}</button><div class="ph-t"><h2 id="panel-title" tabindex="-1">${title}</h2>${badge}</div><button type="button" class="iconbtn plain close-d" data-act="closePanel" aria-label="${tr("Закрыть")}">${ic('x')}</button></header>
 ${tabs||''}<div class="panel-body" data-scroll="panel">${body}</div>${actions?`<footer class="panel-actions">${actions}</footer>`:''}</aside></div>`;}
function vPanel(){if(!UI.panel)return '';const u=me();
 const denied=id=>panelShell(tr('Заказ #')+esc(id),'',`<div class="denied"><span class="lk">${ic('lock',30)}</span><h3>${tr("Нет доступа")}</h3><p>${tr("Этот заказ не относится к вашему кабинету или не существует. Его содержимое не показывается.")}</p><p class="small">${tr("В полной версии проверку laboratory_id и прав выполняет сервер при каждом запросе.")}</p></div>`,`<div class="act-btns"><button type="button" class="btn outline" data-act="closePanel">${tr("Закрыть")}</button></div>`);
 if(UI.panel.denied!=null)return denied(UI.panel.denied);
 const o=orderById(UI.panel.id);if(!o||!canSee(o,u))return denied(UI.panel.id);
 const role=u.role;
 let badge=role==='TECHNICIAN'?(myTechState(o)==='done'?tr('<span class="badge s-done">Сделано</span>'):tr('<span class="badge s-progress">В работе</span>')):statusBadge(o,role);
 if(o.cycles.length>1&&o.status!=='CANCELLED')badge+=`<span class="mark-rework">${ic('refresh',12)}${tr("Переделка №")}${o.cycles.length-1}</span>`;
 const tabs=role==='ADMIN'?`<div class="ptabs" role="tablist"><button type="button" role="tab" aria-selected="${UI.detailTab==='info'}" class="ptab ${UI.detailTab==='info'?'on':''}" data-act="dtab" data-v="info">${tr("Детали")}</button><button type="button" role="tab" aria-selected="${UI.detailTab==='history'}" class="ptab ${UI.detailTab==='history'?'on':''}" data-act="dtab" data-v="history">${ic('history',16)}${tr("История")}${o.cycles.length>1?`<span class="cnt">${o.cycles.length}${tr(" цикла")}</span>`:''}</button></div>`:'';
 const body=(role==='ADMIN'&&UI.detailTab==='history')?vHistory(o):vInfo(o,role);
 return panelShell(tr('Заказ #')+o.id,badge,body,vActions(o,role),tabs);}
const dsec=(t,inner)=>`<section class="dsec"><h3 class="dsec-h">${t}</h3>${inner}</section>`;
function itemsTable(items,withPrice){if(!withPrice)return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tr("Услуга")}</th><th class="num">${tr("Кол-во")}</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(serviceName(i.name))}</td><td class="num">${i.qty}</td></tr>`).join('')}</tbody></table></div>`;
 const tot=items.reduce((s,i)=>s+i.qty*i.price,0);
 return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tr("Услуга")}</th><th class="num">${tr("Кол-во")}</th><th class="num">${tr("Цена/шт.")}</th><th class="num">${tr("Сумма")}</th></tr></thead><tbody>${items.map(i=>`<tr><td>${esc(serviceName(i.name))}</td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.qty*i.price)}</td></tr>`).join('')}<tr class="tot"><td colspan="3">${tr("Итого")}</td><td class="num">${money(tot)}</td></tr></tbody></table></div>`;}
function vInfo(o,role){const lab=labById(o.labId),cl=clinicById(o.clinicId),c=cur(o);let h='';
 if(o.status==='CANCELLED'&&o.cancel){const ev=o.cancel.evidence;
  h+=`<div class="box danger"><b>${ic('alert',16)}${tr(" Заказ отменён ")}${fmtFull(o.cancel.at)}</b><div><span class="muted">${tr("Причина:")}</span> ${esc(o.cancel.reason)}</div><div class="muted small">${tr("Отменил(а): ")}${esc(actorName(o.cancel.by))}</div>
  ${ev?`<div class="evidence">${ev.data?`<img src="${ev.data}" alt="${tr("Подтверждение отмены: ")}${esc(ev.name)}">`:`<span class="ev-ph">${ic('file',28)}</span>`}<div><b style="font-weight:600">${esc(ev.name)}</b><div class="muted small">${ev.size?fsize(ev.size):''}${tr(" · подтверждение запроса клиники")}</div></div></div>`:tr('<div class="muted small">Клиника отменила заказ сама до назначения техников.</div>')}</div>`;}
 const kv=[[tr('Дата отправки'),fmtFull(o.createdAt)]];
 if(role!=='CLINIC')kv.push([tr('Клиника'),esc(cl.name)+(cl.oneOff?tr(' <span class="mark-oneoff">Разовая клиника</span>'):'')]);
 kv.push([tr('Лаборатория'),esc(laboratoryName(lab))]);
 if(role==='CLINIC')kv.push([tr('Клиника'),esc(cl.name)]);
 kv.push([tr('Пациент'),'<b>'+esc(o.patient)+'</b>'],[tr('Плановая дата сдачи'),fmtDay(o.due)+(o.dueDefault?tr(' <span class="muted small">· по умолчанию</span>'):'')],[tr('Статус изменён'),fmtFull(o.statusChangedAt)]);
 h+=`<dl class="kv">${kv.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
 if(role==='TECHNICIAN'){const st=myTechState(o);const myW=c.work.find(w=>w.techId===me().techId&&!w.superseded);
  h+=dsec(tr('Ваша часть'),`<div class="box ${st==='done'?'':'info'}">${st==='done'?`<b>${tr("Завершено")}${myW?' '+fmtFull(myW.at):''}</b>`+(myW?itemsRates(myW):''):`<b>${tr("В работе")}</b><div class="small">${tr("Когда закончите, нажмите «Закончить работу» и отметьте выполненные услуги.")}</div>`}</div>`);}
 h+=dsec(role==='TECHNICIAN'?tr('Услуги заказа'):tr('Услуги и стоимость'),itemsTable(o.items,role!=='TECHNICIAN')+(role==='CLINIC'?tr('<span class="hint">Цены зафиксированы на момент оформления и не меняются при обновлении прайса.</span>'):''));
 h+=dsec(tr('Исходные данные и файлы'),`<div class="srcpill">${ic(o.source==='scan'?'scan':'box',18)}${o.source==='scan'?tr('Скан'):tr('Слепок')}</div>${o.files.length?`<div class="files">${o.files.map(f=>`<div class="file">${ic('file',17)}${f.path&&window.DentaFlowCloud?`<a class="fn" href="${esc(window.DentaFlowCloud.publicUrl(f.path))}" target="_blank" rel="noopener">${esc(f.name)}</a>`:`<span class="fn">${esc(f.name)}</span>`}<span class="fs">${fsize(f.size)}</span></div>`).join('')}</div>`:tr('<span class="muted small">Файлы не прикреплены</span>')}`);
 if(o.comment)h+=dsec(tr('Комментарий'),`<p style="white-space:pre-wrap">${esc(o.comment)}</p>`);
 if(role==='ADMIN'&&o.status!=='CANCELLED'){const as=c.assignments;
  h+=dsec(tr('Исполнители')+(o.cycles.length>1?tr(' · текущий цикл'):''),as.length?as.map(a=>{const t=techById(a.techId);return `<div class="exec ${a.removedAt?'removed':''}"><span class="avatar">${esc(initials(t.name))}</span><div class="grow"><div class="nm">${esc(t.name)}</div><div class="muted small">${esc(tr(t.spec))}${tr(" · назначен(а) ")}${fmtFull(a.assignedAt)}</div></div>${a.removedAt?tr('<span class="badge s-received">Снят(а)</span>'):a.doneAt?tr('<span class="badge s-done">Завершено</span>'):tr('<span class="badge s-progress">В работе</span>')}</div>`;}).join(''):tr('<span class="muted small">Техники ещё не назначены.</span>'));
  const rw=o.cycles.filter(x=>x.n>1);if(rw.length)h+=dsec(tr('Оплата переделок'),rw.map(x=>vPayCycle(o,x)).join(''));}
 const dl=c.delivery;
 if(dl&&dl.confirmedAt&&role!=='TECHNICIAN')h+=dsec(tr('Получение'),`<div class="box">${ic('check',16)}<div>${tr("Получено ")}${fmtFull(dl.confirmedAt)} · ${esc(actorName(dl.confirmedBy))}${dl.manual?`<div class="muted small">${tr("Подтверждено вручную: ")}${esc(dl.reason)}</div>`:''}</div></div>`);
 return h;}
function itemsRates(w){return `<div class="tbl-wrap" style="background:#fff"><table class="tbl"><thead><tr><th>${tr("Услуга")}</th><th class="num">${tr("Кол-во")}</th><th class="num">${tr("Ставка")}</th><th class="num">${tr("Сумма")}</th></tr></thead><tbody>${w.items.map(i=>`<tr><td>${esc(serviceName(i.name))}</td><td class="num">${i.qty}</td><td class="num">${money(i.rate)}</td><td class="num">${money(i.qty*i.rate)}</td></tr>`).join('')}<tr class="tot"><td colspan="3">${tr("Расчётная сумма")}</td><td class="num">${money(w.calc)}</td></tr></tbody></table></div>`;}
function vPayCycle(o,c){const works=c.work.filter(w=>!w.superseded);const head=`<b>${tr("Переделка №")}${c.n-1}</b> <span class="muted small">· ${esc(tr(c.reason||''))}</span>`;
 if(!works.length)return `<div class="box rework">${head}<div class="muted small">${tr("Оплата определяется после того, как техник завершит повторную работу.")}</div></div>`;
 return `<div class="box rework">${head}${works.map(w=>{const p=c.payments[w.techId];const key=o.id+'-'+c.n+'-'+w.techId;const t=techById(w.techId);
  if(p)return `<div class="exec" style="background:#fff"><span class="avatar">${esc(initials(t.name))}</span><div class="grow"><div class="nm">${esc(t.name)}</div><div class="muted small">${tr("Расчётно ")}${money(w.calc)}${tr(" · утверждено ")}${fmtFull(p.at)}${p.comment?' · '+esc(p.comment):''}</div></div><span class="appr">${money(p.approved)}</span></div>`;
  const d=UI.payDraft[key]||{amount:String(w.calc),comment:''};
  return `<div class="exec" style="background:#fff;flex-direction:column;align-items:stretch"><div style="display:flex;gap:12px;align-items:center"><span class="avatar">${esc(initials(t.name))}</span><div class="grow"><div class="nm">${esc(t.name)}</div><div class="muted small">${tr("Расчётная стоимость по ставкам: ")}<b>${money(w.calc)}</b></div></div><span class="pend">${tr("Требует решения")}</span></div>
  <div class="pay"><div class="field"><label for="pay-c-${key}">${tr("Комментарий")}</label><input id="pay-c-${key}" class="input" value="${esc(d.comment)}" data-pay="${key}" data-f="comment" placeholder="${tr("Например: 50% — ошибка в моделировании")}"></div><div class="field"><label for="pay-a-${key}">${tr("Утверждённая сумма, ₸")}</label><input id="pay-a-${key}" class="input num" inputmode="numeric" value="${esc(d.amount)}" data-pay="${key}" data-f="amount"></div>
  <div class="wide" style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm outline" data-act="payPreset" data-key="${key}" data-v="${w.calc}">${tr("Полная")}</button><button type="button" class="btn sm outline" data-act="payPreset" data-key="${key}" data-v="${Math.round(w.calc/2)}">50%</button><button type="button" class="btn sm outline" data-act="payPreset" data-key="${key}" data-v="0">${tr("Без оплаты")}</button><button type="button" class="btn sm primary" style="margin-left:auto" data-act="payApprove" data-id="${o.id}" data-n="${c.n}" data-tech="${w.techId}" data-max="${w.calc}">${tr("Утвердить")}</button></div></div></div>`;}).join('')}</div>`;}
function vActions(o,role){const B=(act,label,cls,extra)=>`<button type="button" class="btn ${cls}" data-act="${act}" data-id="${o.id}" ${extra||''}>${label}</button>`;
 if(role==='CLINIC'){const can=o.status==='RECEIVED';
  let x=`<div class="act-note">${can?'':ic('info',16)+tr('<span>Для изменения или отмены заказа свяжитесь с администратором лаборатории.</span>')}</div><div class="act-btns">`;
  if(o.status==='IN_DELIVERY')x+=B('acceptOne',tr('Подтвердить получение'),'primary');
  x+=B('clinicCancel',tr('Отменить'),'danger-outline',can?'':'disabled')+B('clinicEdit',tr('Изменить'),o.status==='IN_DELIVERY'?'outline':'primary',can?'':'disabled');return x+'</div>';}
 if(role==='TECHNICIAN'){const a=cur(o).assignments.find(x=>x.techId===me().techId&&!x.removedAt);
  if(a&&!a.doneAt&&o.status==='IN_PROGRESS')return `<div class="act-note">${tr("Отметьте выполненные услуги — по ним рассчитается начисление.")}</div><div class="act-btns">${B('finishOpen',ic('check',17)+tr('Закончить работу'),'primary')}</div>`;
  return `<div class="act-note">${ic('check',16)}<span>${tr("Ваша часть по этому заказу завершена.")}</span></div>`;}
 const s=o.status,oneOff=clinicById(o.clinicId).oneOff;let btn=[];
 if(canMoveBack(o))btn.push(B('moveOpen',ic('move',16)+tr('Перенести в раздел'),'ghost'));
 if(['RECEIVED','IN_PROGRESS','DONE'].includes(s))btn.push(B('cancelOpen',tr('Отменить'),'danger-outline'));
 if(['DONE','IN_DELIVERY','DELIVERED'].includes(s))btn.push(B('reworkOpen',ic('refresh',16)+tr('Оформить переделку'),s==='DELIVERED'?'primary':'outline'));
 if(s==='RECEIVED')btn.push(B('assignOpen',tr('Назначить техников'),'primary'));
 if(s==='IN_PROGRESS')btn.push(B('assignOpen',tr('Переназначить техников'),'primary'));
 if(s==='DONE')btn.push(B('sendOne',ic('truck',16)+tr('Передать на доставку'),'primary'));
 if(s==='IN_DELIVERY'&&oneOff)btn.push(B('manualDeliveryOpen',tr('Подтвердить получение'),'primary'));
 if(s==='CANCELLED')return `<div class="act-note">${tr("Отменённый заказ доступен только для просмотра.")}</div><div class="act-btns"><button type="button" class="btn outline" data-act="closePanel">${tr("Закрыть")}</button></div>`;
 let note='';if(s==='IN_DELIVERY'&&!oneOff)note=tr('Ожидаем подтверждение получения от клиники.');if(s==='IN_DELIVERY'&&oneOff)note=tr('У разовой клиники нет кабинета — подтвердите получение вручную.');
 return `<div class="act-note">${note}</div><div class="act-btns">${btn.join('')}</div>`;}
const HTYPE={create:'Создание',status:'Статус',assign:'Назначение',work:'Работа техника',delivery:'Доставка',rework:'Переделка',payment:'Оплата',cancel:'Отмена',edit:'Изменение'};
function vHistory(o){
 const tl=`<ol class="tl">${o.history.map(e=>{let text=esc(historyText(e));if(e.type==='status'){text=`<b style="font-weight:600">${ST[e.from]?tr(ST[e.from].admin):'—'} → ${tr(ST[e.to].admin)}</b>${e.manual?tr(' <span class="mark-oneoff">вручную</span>'):''}${e.text?' · '+esc(historyText(e)):''}`;}
  return `<li class="t-${e.type}"><span class="tl-dot"></span><div><div class="tl-h"><b>${tr(HTYPE[e.type]||e.type)}</b><span class="muted small">${fmtFull(e.at)}</span></div><div>${text}</div><div class="muted small">${esc(actorName(e.by))}</div></div></li>`;}).join('')}</ol>`;
 const cyc=o.cycles.map(c=>{const key=o.id+'-'+c.n;const isCur=c.n===o.cycles.length;const open=UI.openCycles[key]!=null?UI.openCycles[key]:isCur;
  const title=c.n===1?tr('Первоначальный заказ'):tr('Переделка №')+(c.n-1);
  let b='';if(open){
   if(c.n>1)b+=`<div class="box rework"><div><span class="muted">${tr("Причина:")}</span> ${esc(tr(c.reason))}${c.comment?' — '+esc(c.comment):''}</div><div class="muted small">${tr("Открыл(а): ")}${esc(actorName(c.openedBy||'—'))} · ${fmtFull(c.openedAt)}</div></div>`;
   b+=`<div><div class="dsec-h" style="margin-bottom:6px">${tr("Исходные услуги")}</div>${itemsTable(c.items,true)}</div>`;
   b+=`<div><div class="dsec-h" style="margin-bottom:6px">${tr("Исполнители")}</div>${c.assignments.length?c.assignments.map(a=>`<div class="small">${esc(tn(a.techId))}${tr(" — назначен(а) ")}${fmtShort(a.assignedAt)}${a.removedAt?tr(', снят(а) ')+fmtShort(a.removedAt):''}${a.doneAt?tr(', завершил(а) ')+fmtShort(a.doneAt):''}</div>`).join(''):tr('<span class="muted small">Не назначены</span>')}</div>`;
   b+=`<div><div class="dsec-h" style="margin-bottom:6px">${tr("Выполненные услуги")}</div>${c.work.length?c.work.map(w=>{const p=c.payments[w.techId];return `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px"><div class="small"><b>${esc(tn(w.techId))}</b> · ${fmtFull(w.at)}${w.superseded?tr(' · <span class="pend">аннулировано при ручном возврате</span>'):''}${c.n>1&&!w.superseded?(p?` · <span class="appr">${tr("утверждено ")}${money(p.approved)}</span>`:tr(' · <span class="pend">оплата не утверждена</span>')):''}</div>${itemsRates(w)}</div>`;}).join(''):tr('<span class="muted small">Пока нет</span>')}</div>`;
   if(c.delivery&&c.delivery.confirmedAt)b+=`<div class="small muted">${tr("Получено ")}${fmtFull(c.delivery.confirmedAt)} · ${esc(actorName(c.delivery.confirmedBy))}</div>`;}
  return `<div class="cycle"><button type="button" class="cycle-h" data-act="toggleCycle" data-key="${key}" data-open="${open}" aria-expanded="${open}"><span class="chev">${ic('chev',16)}</span><span class="grow"><b>${title}</b><div class="muted small">${tr("открыт ")}${fmtFull(c.openedAt)}</div></span>${isCur&&o.status!=='CANCELLED'?tr('<span class="badge s-progress">Текущий</span>'):`<span class="ro">${ic('lock',13)}${tr("только просмотр")}</span>`}</button>${open?`<div class="cycle-b">${b}</div>`:''}</div>`;}).join('');
 return dsec(tr('Циклы выполнения'),cyc)+dsec(tr('Журнал событий'),tl);}

/* ============ Modals ============ */
function modalShell(title,body,foot,opts){opts=opts||{};return `<div class="modal-wrap"><div class="scrim" data-act="${opts.critical?'noop':'closeModal'}"></div><div class="modal ${opts.size||''}${UI.modalEnter?' enter':''}" role="dialog" aria-modal="true" aria-labelledby="modal-title">
 <div class="modal-head">${opts.icon?`<span class="mh-ic${opts.danger?' d':''}">${ic(opts.icon,20)}</span>`:''}<h3 id="modal-title">${title}</h3><button type="button" class="iconbtn plain" data-act="closeModal" aria-label="${tr("Закрыть окно")}">${ic('x')}</button></div>
 <div class="modal-body" data-scroll="modal">${body}</div>${foot?`<div class="modal-foot">${foot}</div>`:''}</div></div>`;}
function vModal(){const M=UI.modal;if(!M)return '';const fn=MV[M.type];return fn?fn(M):'';}
const MV={
 dueDefault(M){return modalShell(tr('Дата сдачи не указана'),`<p>${tr("По умолчанию срок сдачи составит ")}<b>${tr("10 рабочих дней")}</b>${tr(" (воскресенье не учитывается, суббота — рабочий день).")}</p><div class="box info"><span>${tr("Расчётная дата: ")}<b>${fmtDay(M.date)}</b></span></div>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="confirmDefaultDue" data-autofocus ${M.busy?'disabled':''}>${tr("ОК, отправить")}</button>`,{size:'sm',icon:'calendar'});},
 labSwitch(M){const to=labById(M.to);return modalShell(tr('Сменить лабораторию?'),`<p>${tr("Услуги и цены будут обновлены для лаборатории «")}${esc(to.name)}${tr("». Позиции, которых нет в её справочнике, удалятся из формы.")}</p><p class="muted small">${tr("ФИО пациента, комментарий, дата и файлы сохранятся.")}</p>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="confirmLabSwitch" data-autofocus>${tr("Продолжить")}</button>`,{size:'sm',icon:'alert'});},
 assign(M){const o=orderById(M.orderId);const c=cur(o);const done=c.assignments.filter(a=>!a.removedAt&&a.doneAt).map(a=>a.techId);
  const q=M.q.trim().toLowerCase();const techs=S.techs.filter(t=>t.labId===o.labId&&(!q||t.name.toLowerCase().includes(q)||(t.spec.toLowerCase().includes(q)||tr(t.spec).toLowerCase().includes(q))));
  const body=`<div class="search" style="margin:0"><span class="search-ic">${ic('search',18)}</span><input id="as-q" class="input" type="search" placeholder="${tr("Поиск по имени или специальности")}" value="${esc(M.q)}" data-model="modal.q" aria-label="${tr("Поиск техника")}" autocomplete="off"></div>
  <div style="display:flex;flex-direction:column;gap:8px">${techs.map(t=>{const on=M.sel.includes(t.id),lk=done.includes(t.id);return `<label class="chk-row ${on?'on':''} ${lk?'locked':''}"><input type="checkbox" ${on?'checked':''} ${lk?'disabled':''} data-act="assignToggle" data-tech="${t.id}"><span class="avatar">${esc(initials(t.name))}</span><span class="grow"><span class="nm" style="display:block">${esc(t.name)}</span><span class="muted small">${esc(tr(t.spec))}${lk?tr(' · работа завершена, снять нельзя'):''}</span></span>${lk?ic('lock',16):''}</label>`;}).join('')||tr('<p class="muted">Никого не найдено.</p>')}</div>
  ${M.limit?`<div class="lim" role="alert">${tr("Можно назначить не более двух техников. Снимите отметку с одного, чтобы выбрать другого.")}</div>`:''}`;
  return modalShell(M.reassign?tr('Переназначить техников'):tr('Назначить техников'),body,`<span class="grow">${tr("Выбрано ")}<span class="counter">${M.sel.length}${tr(" из 2")}</span></span><button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="assignConfirm" ${M.sel.length?'':'disabled'}>${M.reassign?tr('Сохранить'):tr('Назначить')}</button>`,{size:'md',icon:'users'});},
 finish(M){const o=orderById(M.orderId);const tid=me().techId;const svcs=S.services.filter(s=>s.labId===o.labId&&s.active);
  const ordered=svcs.slice().sort((a,b)=>(o.items.some(i=>i.serviceId===b.id)?1:0)-(o.items.some(i=>i.serviceId===a.id)?1:0));
  let total=0,n=0;
  const rows=ordered.map(s=>{const r=M.rows[s.id];const rate=rateFor(tid,s.id);const has=rate!=null;const on=has&&r.on;const sum=on?(Number(r.qty)||0)*rate:0;if(on){total+=sum;n++;}
   return `<div class="fin-row ${has?'':'off'}"><input type="checkbox" id="fin-${s.id}" ${on?'checked':''} ${has?'':'disabled'} data-act="finToggle" data-sid="${s.id}" aria-label="${esc(serviceName(s.name))}"><label for="fin-${s.id}" class="nm" style="cursor:${has?'pointer':'not-allowed'}">${esc(serviceName(s.name))}${o.items.some(i=>i.serviceId===s.id)?tr(' <span class="muted small">· в заказе</span>'):''}${has?'':tr('<div class="muted small" style="font-weight:400">Ставка не настроена — обратитесь к администратору</div>')}</label>
   ${has?`<div class="stepper sm"><button type="button" class="st-b" data-act="finQty" data-sid="${s.id}" data-d="-1" aria-label="${tr("Меньше")}" ${(Number(r.qty)||0)<=1?'disabled':''}>−</button><input class="st-i" id="fq-${s.id}" inputmode="numeric" value="${esc(r.qty)}" data-finqty="${s.id}" aria-label="${tr("Количество ")}${esc(serviceName(s.name))}"><button type="button" class="st-b" data-act="finQty" data-sid="${s.id}" data-d="1" aria-label="${tr("Больше")}">+</button></div><span class="num muted rt">${money(rate)}${tr("/шт.")}</span><span class="num sm-s" style="font-weight:700">${on?money(sum):'—'}</span>`:'<span></span><span class="num muted">—</span><span></span>'}</div>`;}).join('');
  return modalShell(tr('Закончить работу · #')+o.id,`<p class="muted">${tr("Отметьте услуги, которые вы выполнили, и количество. Сумма считается по вашим ставкам.")}</p><div style="display:flex;flex-direction:column;gap:8px">${rows}</div>`,`<span class="grow">${n?tr('Отмечено ')+n+tr(' · итого <b style="color:var(--ink);font-size:16px">')+money(total)+'</b>':tr('Отметьте хотя бы одну услугу')}</span><button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="finishConfirm" ${n?'':'disabled'}>${tr("Закончить")}</button>`,{size:'lg',icon:'check'});},
 rework(M){const o=orderById(M.orderId);const R=['Ошибка техника','Ошибка лаборатории','Не сошёлся прикус','Не совпал цвет','Скол или трещина','Другое'];
  return modalShell(tr('Оформить переделку заказа #')+o.id,`<div class="field"><label for="rw-r">${tr("Причина ")}<span class="req">*</span></label><select id="rw-r" class="select${M.err&&!M.reason?' err':''}" data-model="modal.reason"><option value="">${tr("Выберите причину")}</option>${R.map(r=>`<option value="${esc(r)}" ${M.reason===r?'selected':''}>${tr(r)}</option>`).join('')}</select>${M.err&&!M.reason?errT(tr('Укажите причину переделки')):''}</div>
  <div class="field"><label for="rw-c">${tr("Описание")}${M.reason==='Другое'?' <span class="req">*</span>':''}</label><textarea id="rw-c" class="textarea${M.err&&M.reason==='Другое'&&!M.comment.trim()?' err':''}" data-model="modal.comment" placeholder="${tr("Что именно нужно исправить")}">${esc(M.comment)}</textarea>${M.err&&M.reason==='Другое'&&!M.comment.trim()?errT(tr('Опишите причину')):''}</div>
  <div class="box info">${ic('info',16)}<div>ID <b>#${o.id}</b>${tr(" сохраняется. Будет создан новый цикл «Переделка №")}${o.cycles.length}${tr("», заказ вернётся в «Получено», клиника увидит его как «Отправлено». Данные прошлых циклов останутся в истории.")}</div></div>
  <p class="muted small">${tr("Если лаборатория не виновата, переделку оформляют новым заказом по обычному прайсу.")}</p>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="reworkConfirm">${tr("Оформить переделку")}</button>`,{size:'md',icon:'refresh'});},
 cancelAdmin(M){const o=orderById(M.orderId);const E=M.err?{reason:!M.reason.trim(),file:!M.file,conf:!M.conf}:{};
  return modalShell(tr('Отменить заказ #')+o.id,`<div class="box danger">${ic('alert',16)}<div>${tr("Заказ исчезнет из рабочих списков и из кабинета клиники. В архиве останется запись с причиной и подтверждением.")}</div></div>
  <div class="field"><label for="cn-r">${tr("Причина отмены ")}<span class="req">*</span></label><textarea id="cn-r" class="textarea${E.reason?' err':''}" data-model="modal.reason" placeholder="${tr("Например: клиника отозвала заказ по просьбе пациента")}">${esc(M.reason)}</textarea>${E.reason?errT(tr('Укажите причину')):''}</div>
  <div class="field"><span class="flabel">${tr("Скриншот переписки с запросом на отмену ")}<span class="req">*</span></span>
  <div class="dropzone${E.file?' err':''}" data-drop="evidence">${M.file?(M.file.data?`<img src="${M.file.data}" alt="" style="width:72px;height:56px;object-fit:cover;border-radius:8px">`:`<span class="dz-ic">${ic('file',20)}</span>`):`<span class="dz-ic">${ic('clip',20)}</span>`}<div class="grow">${M.file?`<b style="font-weight:600">${esc(M.file.name)}</b><div class="hint">${fsize(M.file.size)}</div>`:tr('<b>Прикрепите подтверждение</b><div class="hint">JPG, PNG или PDF до 10 МБ</div>')}</div><label for="cn-f" class="btn outline sm">${M.file?tr('Заменить'):tr('Выбрать файл')}</label><input type="file" id="cn-f" class="sr" accept=".jpg,.jpeg,.png,.pdf,image/*" data-change="evidence"></div>${E.file?errT(tr('Без подтверждения отменить заказ нельзя')):''}</div>
  <label class="chk-row ${M.conf?'on':''}" style="min-height:48px"><input type="checkbox" ${M.conf?'checked':''} data-act="cancelConf"><span class="grow">${tr("Подтверждаю отмену заказа #")}${o.id}</span></label>${E.conf?errT(tr('Отметьте подтверждение')):''}`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Не отменять")}</button><button type="button" class="btn danger" data-act="cancelConfirm">${tr("Отменить заказ")}</button>`,{size:'md',icon:'alert',danger:true,critical:true});},
 cancelClinic(M){const o=orderById(M.orderId);return modalShell(tr('Отменить заказ #')+o.id+'?',`<p>${tr("Заказ для пациента ")}<b>${esc(o.patient)}</b>${tr(" исчезнет из вашей истории, а лаборатория «")}${esc(labById(o.labId).name)}${tr("» не возьмёт его в работу. Действие нельзя отменить.")}</p>`,`<button type="button" class="btn outline" data-act="closeModal" data-autofocus>${tr("Не отменять")}</button><button type="button" class="btn danger" data-act="clinicCancelConfirm">${tr("Отменить заказ")}</button>`,{size:'sm',icon:'alert',danger:true});},
 move(M){const o=orderById(M.orderId);const opts=MOVES[o.status]||[];
  return modalShell(tr('Перенести заказ #')+o.id,`<p class="muted">${tr("Сейчас: ")}<b style="color:var(--ink)">${tr(ST[o.status].admin)}</b>${tr(". Перенос фиксируется в истории вместе с причиной.")}</p><div class="radio-list" role="radiogroup">${opts.map(x=>`<button type="button" role="radio" aria-checked="${M.to===x.to}" class="radio-row ${M.to===x.to?'on':''}" data-act="moveTo" data-v="${x.to}"><span class="rdot"></span><span><b style="display:block">${tr(x.label)}</b><span class="muted small">${tr(x.desc)}</span></span></button>`).join('')}</div>${M.err&&!M.to?errT(tr('Выберите раздел')):''}
  <div class="field"><label for="mv-r">${tr("Причина изменения ")}<span class="req">*</span></label><textarea id="mv-r" class="textarea${M.err&&!M.reason.trim()?' err':''}" data-model="modal.reason" placeholder="${tr("Что пошло не так")}">${esc(M.reason)}</textarea>${M.err&&!M.reason.trim()?errT(tr('Укажите причину')):''}</div>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="moveConfirm">${tr("Перенести")}</button>`,{size:'md',icon:'move'});},
 deliverySend(M){const os=M.ids.map(orderById);return modalShell(tr('Передать на доставку'),`<p>${os.length} ${plural(os.length,tr('заказ'),tr('заказа'),tr('заказов'))}${tr(" перейдут в «На доставке», клиники увидят их у себя для подтверждения.")}</p><div class="files">${os.map(o=>`<div class="file"><b>#${o.id}</b><span class="fn">${esc(o.patient)}</span><span class="fs">${esc(clinicById(o.clinicId).name)}</span></div>`).join('')}</div>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="deliverySendConfirm" data-autofocus>${ic('truck',16)}${tr("Передать")}</button>`,{size:'md',icon:'truck'});},
 deliveryConfirm(M){const os=M.ids.map(orderById);const n=os.filter(o=>M.checks[o.id]).length;
  return modalShell(tr('Подтвердить получение'),`<p class="muted">${tr("Отметьте каждый заказ, который фактически получен. Подтверждение увидит лаборатория.")}</p><div style="display:flex;flex-direction:column;gap:8px">${os.map(o=>`<label class="chk-row ${M.checks[o.id]?'on':''}"><input type="checkbox" ${M.checks[o.id]?'checked':''} data-act="delCheck" data-id="${o.id}"><span class="grow"><span class="nm" style="display:block">${tr("Подтверждаю получение заказа #")}${o.id}</span><span class="muted small">${esc(o.patient)} · ${esc(laboratoryName(labById(o.labId)))}</span></span></label>`).join('')}</div>`,`<span class="grow">${tr("Отмечено ")}<span class="counter">${n}${tr(" из ")}${os.length}</span></span><button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="deliveryConfirmOk" ${n===os.length?'':'disabled'}>${tr("Подтвердить")}</button>`,{size:'md',icon:'check',critical:true});},
 manualDelivery(M){const o=orderById(M.orderId);return modalShell(tr('Подтвердить получение вручную'),`<p>${tr("У разовой клиники «")}${esc(clinicById(o.clinicId).name)}${tr("» нет кабинета. Укажите основание — оно сохранится в истории заказа #")}${o.id}.</p><div class="field"><label for="md-r">${tr("Основание ")}<span class="req">*</span></label><textarea id="md-r" class="textarea${M.err&&!M.reason.trim()?' err':''}" data-model="modal.reason" placeholder="${tr("Например: курьер передал работу, получил администратор клиники")}">${esc(M.reason)}</textarea>${M.err&&!M.reason.trim()?errT(tr('Укажите основание')):''}</div>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="manualDeliveryOk">${tr("Подтвердить")}</button>`,{size:'sm',icon:'check'});},
 feedback(M){return modalShell(tr('Оцените удобство'),`<div class="field"><span class="flabel">${tr("Насколько удобно работать с DentaFlow? ")}<span class="req">*</span></span><div class="rating" role="radiogroup" aria-label="${tr("Оценка от 1 до 5")}">${[1,2,3,4,5].map(n=>`<button type="button" role="radio" aria-checked="${M.rating===n}" class="${M.rating===n?'on':''}" data-act="rate" data-v="${n}">${n}</button>`).join('')}</div><span class="hint">${tr("1 — неудобно, 5 — очень удобно")}</span>${M.err&&!M.rating?errT(tr('Выберите оценку')):''}</div><div class="field"><label for="fb-c">${tr("Комментарий")}</label><textarea id="fb-c" class="textarea" data-model="modal.comment" placeholder="${tr("Что было непонятно или неудобно?")}">${esc(M.comment)}</textarea></div>${S.feedback.length?`<p class="muted small">${tr("Отзывов в этом демо: ")}${S.feedback.length}${tr(", средняя оценка ")}${(S.feedback.reduce((s,f)=>s+f.rating,0)/S.feedback.length).toFixed(1).replace('.',',')}</p>`:''}`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn primary" data-act="feedbackSend">${tr("Отправить")}</button>`,{size:'sm',icon:'star'});},
 account(){const u=me();const rows=[[tr('Логин'),`<code>${esc(u.login)}</code>`],[tr('Роль'),{CLINIC:tr('Клиника'),ADMIN:tr('Администратор лаборатории'),TECHNICIAN:tr('Зубной техник')}[u.role]]];
  if(u.role==='CLINIC'){const c=clinicById(u.clinicId);rows.push([tr('Клиника'),esc(c.name)],[tr('Лаборатории-партнёры'),c.labIds.map(id=>esc(labById(id).name)).join(', ')]);}
  else{rows.push([tr('Имя'),esc(u.name)],[tr('Лаборатория'),esc(laboratoryName(labById(u.labId)))]);}
  return modalShell(tr('Аккаунт'),`<dl class="kv">${rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><p class="muted small">${tr("Сессия сохраняется до выхода. В коммерческой версии для клиник возможна одна активная сессия.")}</p>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Закрыть")}</button><button type="button" class="btn danger-outline" data-act="logout">${tr("Выйти")}</button>`,{size:'sm',icon:'user'});},
 filters(){const n=clinicList().length;return modalShell(tr('Фильтры'),`<div style="display:flex;flex-direction:column;gap:10px">${clinicFilterControls('mf').replace(/class="fsel/g,'style="width:100%" class="fsel')}</div>`,`<button type="button" class="btn outline" data-act="resetClinicFilters">${tr("Сбросить")}</button><button type="button" class="btn primary" data-act="closeModal">${tr("Показать ")}${n} ${plural(n,tr('заказ'),tr('заказа'),tr('заказов'))}</button>`,{size:'sm',icon:'filter'});},
 reset(){return modalShell(tr('Сбросить демо-данные?'),`<p>${tr("Все созданные заказы, изменения цен и статусов в этом браузере будут заменены исходным набором тестовых данных. Вы выйдете из аккаунта.")}</p>`,`<button type="button" class="btn outline" data-act="closeModal">${tr("Отмена")}</button><button type="button" class="btn danger" data-act="resetConfirm">${tr("Сбросить")}</button>`,{size:'sm',icon:'refresh',danger:true});}
};

/* ============ Prices & rates ============ */
function vPrices(){const u=me(),lab=labById(u.labId),P=UI.prices;const partners=S.clinics.filter(c=>!c.oneOff&&c.labIds.includes(lab.id));const svcs=S.services.filter(s=>s.labId===lab.id);
 if(P.target!=='base'&&!partners.some(c=>c.id===P.target))P.target='base';
 const D=P.draft,dv=(k,o)=>(k in D)?D[k]:o,er=k=>P.errs.includes(k),dirty=Object.keys(D).length>0;
 let h=`<div class="page-head"><div><h1>${tr("Цены клиник")}</h1><p class="lead">${tr("Базовый прайс действует для клиник без индивидуальной цены. Изменения применяются к новым заказам и не пересчитывают оформленные.")}</p></div></div>
 <div class="ctl-row"><div class="field"><label for="pr-target">${tr("Прайс")}</label><select id="pr-target" class="select" data-change="priceTarget"><option value="base" ${P.target==='base'?'selected':''}>${tr("Базовый прайс лаборатории")}</option><optgroup label="${tr("Клиники-партнёры")}">${partners.map(c=>`<option value="${c.id}" ${P.target===c.id?'selected':''}>${esc(c.name)}</option>`).join('')}</optgroup></select></div><p class="hint" style="padding-bottom:12px">${tr("Разовые клиники всегда используют базовый прайс.")}</p></div>`;
 if(P.target==='base'){
  h+=`<div class="tbl-wrap" style="background:var(--surface)"><table class="tbl"><thead><tr><th>${tr("Услуга")}</th><th class="num">${tr("Базовая цена")}</th><th>${tr("Статус")}</th><th></th></tr></thead><tbody>${svcs.map(s=>{const nk='name|'+s.id,bk='base|'+s.id,ak='act|'+s.id;const act=dv(ak,s.active);
   return `<tr${act?'':' class="muted-row"'}><td><input id="pr-name-${s.id}" class="input${nk in D?' dirty':''}${er(nk)?' err':''}" value="${esc(dv(nk,s.name))}" data-draft="prices" data-key="${nk}" aria-label="${tr("Название услуги")}"></td><td><input id="pr-base-${s.id}" class="input num${bk in D?' dirty':''}${er(bk)?' err':''}" inputmode="numeric" value="${esc(dv(bk,s.base))}" data-draft="prices" data-key="${bk}" aria-label="${tr("Базовая цена ")}${esc(serviceName(s.name))}"></td><td>${act?tr('<span class="src-tag src-ind">Активна</span>'):tr('<span class="src-tag src-base">Отключена</span>')}${ak in D?tr('<span class="dirty-dot" title="Не сохранено"></span>'):''}</td><td class="act"><button type="button" class="btn sm ghost" data-act="toggleSvc" data-sid="${s.id}">${act?tr('Отключить'):tr('Включить')}</button></td></tr>`;}).join('')}</tbody></table></div>
  <div class="panel-card" style="margin-top:16px"><b>${tr("Новая услуга")}</b><div class="add-row"><div class="field"><label for="pr-new-name">${tr("Название")}</label><input id="pr-new-name" class="input" value="${esc(P.newName)}" data-model="prices.newName" placeholder="${tr("Например: Вкладка E.max")}"></div><div class="field pr"><label for="pr-new-price">${tr("Базовая цена, ₸")}</label><input id="pr-new-price" class="input num" inputmode="numeric" value="${esc(P.newPrice)}" data-model="prices.newPrice"></div><button type="button" class="btn outline" data-act="addService">${ic('plus',16)}${tr("Добавить услугу")}</button></div></div>`;}
 else{const c=clinicById(P.target);
  h+=`<div class="tbl-wrap" style="background:var(--surface)"><table class="tbl"><thead><tr><th>${tr("Услуга")}</th><th class="num">${tr("Базовая цена")}</th><th class="num">${tr("Индивидуальная цена")}</th><th>${tr("Источник цены")}</th><th></th></tr></thead><tbody>${svcs.filter(s=>s.active).map(s=>{const k='ov|'+s.id;const orig=S.clinicPrices[c.id+'|'+s.id];const v=dv(k,orig==null?'':orig);const isInd=String(v).trim()!=='';
   return `<tr><td>${esc(serviceName(s.name))}</td><td class="num">${money(s.base)}</td><td><input id="pr-ov-${s.id}" class="input num${k in D?' dirty':''}${er(k)?' err':''}" inputmode="numeric" value="${esc(v)}" placeholder="${tr("как базовая")}" data-draft="prices" data-key="${k}" aria-label="${tr("Индивидуальная цена ")}${esc(serviceName(s.name))}"></td><td><span class="src-tag ${isInd?'src-ind':'src-base'}">${isInd?tr('Индивидуальная'):tr('Базовая')}</span></td><td class="act">${isInd?`<button type="button" class="btn sm ghost" data-act="resetOverride" data-sid="${s.id}">${tr("Вернуть к базовой")}</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>
  <p class="hint" style="margin-top:10px">${tr("Цены клиники «")}${esc(c.name)}${tr("» действуют только в вашей лаборатории. Пустое поле — используется базовая цена.")}</p>`;}
 if(dirty)h+=`<div class="savebar" role="region" aria-label="${tr("Несохранённые изменения")}"><span class="grow">${tr("Есть несохранённые изменения: ")}${Object.keys(D).length}</span><button type="button" class="btn sm outline" data-act="discardDraft" data-scope="prices">${tr("Отменить")}</button><button type="button" class="btn sm primary" data-act="savePrices">${tr("Сохранить изменения")}</button></div>`;
 return h;}
function vRates(){const u=me(),lab=labById(u.labId),R=UI.rates;const techs=S.techs.filter(t=>t.labId===lab.id);if(!R.techId||!techs.some(t=>t.id===R.techId))R.techId=techs[0]&&techs[0].id;
 const D=R.draft,dirty=Object.keys(D).length>0;const svcs=S.services.filter(s=>s.labId===lab.id);
 let h=`<div class="page-head"><div><h1>${tr("Ставки техников")}</h1><p class="lead">${tr("Ставка за единицу услуги. Изменения применяются к будущим завершениям и не меняют прошлые начисления.")}</p></div></div>
 <div class="ctl-row"><div class="field"><label for="rt-tech">${tr("Техник")}</label><select id="rt-tech" class="select" data-change="rateTech">${techs.map(t=>`<option value="${t.id}" ${R.techId===t.id?'selected':''}>${esc(t.name)} · ${esc(tr(t.spec))}</option>`).join('')}</select></div></div>`;
 if(!R.techId)return h+vEmpty('users',tr('В лаборатории нет техников'),'');
 h+=`<div class="tbl-wrap" style="background:var(--surface)"><table class="tbl"><thead><tr><th>${tr("Услуга")}</th><th class="num">${tr("Ставка техника")}</th><th>${tr("Статус")}</th><th></th></tr></thead><tbody>${svcs.map(s=>{const k='rate|'+s.id;const orig=rateFor(R.techId,s.id);const v=(k in D)?D[k]:(orig==null?'':orig);const has=String(v).trim()!=='';
  return `<tr${s.active?'':' class="muted-row"'}><td>${esc(serviceName(s.name))}${s.active?'':tr(' <span class="muted small">· услуга отключена</span>')}</td><td><input id="rt-rate-${s.id}" class="input num${k in D?' dirty':''}${R.errs.includes(k)?' err':''}" inputmode="numeric" value="${esc(v)}" placeholder="—" data-draft="rates" data-key="${k}" aria-label="${tr("Ставка ")}${esc(serviceName(s.name))}"></td><td>${has?tr('<span class="src-tag src-ind">Выполняет</span>'):tr('<span class="src-tag src-base">— нет ставки</span>')}</td><td class="act">${has?`<button type="button" class="btn sm ghost" data-act="clearRate" data-sid="${s.id}">${tr("Убрать ставку")}</button>`:''}</td></tr>`;}).join('')}</tbody></table></div>
 <p class="hint" style="margin-top:10px">${tr("«—» означает, что техник не выполняет услугу: в форме завершения она будет недоступна. Это не то же самое, что ставка 0 ₸.")}</p>`;
 if(dirty)h+=`<div class="savebar"><span class="grow">${tr("Есть несохранённые изменения: ")}${Object.keys(D).length}</span><button type="button" class="btn sm outline" data-act="discardDraft" data-scope="rates">${tr("Отменить")}</button><button type="button" class="btn sm primary" data-act="saveRates">${tr("Сохранить изменения")}</button></div>`;
 return h;}

/* ============ Reports ============ */
function payrollData(tid,from,to){const t=techById(tid);const rows=[];let total=0,pending=0,pendingSum=0;
 S.orders.filter(o=>o.labId===t.labId).forEach(o=>o.cycles.forEach(c=>c.work.forEach(w=>{if(w.techId!==tid||w.superseded||!inRange(w.at,from,to))return;
  const p=c.n>1?c.payments[tid]:null;rows.push({o,c,w,p});if(c.n===1)total+=w.calc;else if(p)total+=p.approved;else{pending++;pendingSum+=w.calc;}})));
 rows.sort((a,b)=>new Date(a.w.at)-new Date(b.w.at));return{rows,total,pending,pendingSum};}
function receivablesData(cid,labId,from,to){const rows=S.orders.filter(o=>o.labId===labId&&o.clinicId===cid&&o.status!=='CANCELLED'&&inRange(o.createdAt,from,to)).sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
 return{rows,total:rows.reduce((s,o)=>s+o.items.reduce((x,i)=>x+i.qty*i.price,0),0)};}
function vReport(){const u=me(),R=UI.report,kind=R.kind;const labId=u.labId;let title,selector='';
 if(kind==='payroll'){title=tr('Зарплаты техникам');const techs=S.techs.filter(t=>t.labId===labId);if(!R.target)R.target=techs[0].id;
  selector=`<div class="field"><label for="rp-t">${tr("Техник")}</label><select id="rp-t" class="select" data-model="report.target">${techs.map(t=>`<option value="${t.id}" ${R.target===t.id?'selected':''}>${esc(t.name)}</option>`).join('')}</select></div>`;}
 else if(kind==='receivables'){title=tr('Расчёты с клиниками');const cls=S.clinics.filter(c=>c.labIds.includes(labId));if(!R.target)R.target=cls[0].id;
  selector=`<div class="field"><label for="rp-c">${tr("Клиника")}</label><select id="rp-c" class="select" data-model="report.target">${cls.map(c=>`<option value="${c.id}" ${R.target===c.id?'selected':''}>${esc(c.name)}${c.oneOff?tr(' (разовая)'):''}</option>`).join('')}</select></div>`;}
 else{title=tr('Отчёт о проделанной работе');R.target=u.techId;}
 let h=`<div class="page-head"><div>${kind==='tech'?`<button type="button" class="btn ghost sm" data-act="nav" data-route="tech-orders" style="margin-bottom:8px">${ic('back',18)}${tr("Мои заказы")}</button>`:''}<h1>${title}</h1><p class="lead">${kind==='receivables'?tr('Суммы считаются по ценам, зафиксированным в каждом заказе.'):kind==='payroll'?tr('Начисления по выполненным услугам. Для переделок учитывается утверждённая сумма.'):tr('Ваши выполненные услуги и начисления. Отчёты других техников недоступны.')}</p></div></div>
 <div class="ctl-row">${selector}<div class="field" style="flex:0 1 auto;min-width:0"><span class="flabel">${tr("Период")}</span><div class="fsel" style="height:46px">${`<input type="date" id="rp-from" value="${esc(R.from)}" data-model="report.from" aria-label="${tr("С")}"><span class="dash">—</span><input type="date" id="rp-to" value="${esc(R.to)}" data-model="report.to" aria-label="${tr("По")}">`}</div></div>
 <button type="button" class="btn primary" data-act="genReport">${tr("Сформировать")}</button><button type="button" class="btn outline" data-act="copyReport" ${R.params?'':'disabled'}>${ic('copy',16)}${tr("Скопировать таблицу")}</button><button type="button" class="btn outline" disabled title="${tr("Доступно в полной версии")}">${ic('download',16)}${tr("Скачать PDF")}</button></div>
 <p class="hint" style="margin:-6px 0 16px">${tr("Без периода отчёт охватывает всю историю. «Скачать PDF» появится в полной версии — в демо есть предпросмотр A4 и копирование таблицы для Excel.")}</p>`;
 if(!R.params)return h+vEmpty('receipt',tr('Отчёт ещё не сформирован'),tr('Выберите параметры и нажмите «Сформировать».'));
 return h+`<div class="paper-scroll"><div class="paper" id="paper">${paperHTML(R.params)}</div></div>`;}
function paperHTML(p){const u=me();const lab=labById(u.labId);const gen=fmtFull(p.at);
 if(p.kind==='receivables'){const c=clinicById(p.target);const d=receivablesData(p.target,lab.id,p.from,p.to);
  const rows=d.rows.flatMap(o=>o.items.map((i,k)=>`<tr><td>${k===0?fmtShort(o.createdAt):''}</td><td>${k===0?'#'+o.id+(o.cycles.length>1?tr(' <span class="mark-rework" style="height:18px">П')+(o.cycles.length-1)+'</span>':''):''}</td><td>${k===0?esc(o.patient):''}</td><td>${esc(serviceName(i.name))}</td><td class="num">${i.qty}</td><td class="num">${money(i.price)}</td><td class="num">${money(i.qty*i.price)}</td></tr>`)).join('');
  return `<div class="paper-head"><div><div class="paper-lab">${esc(laboratoryName(lab))}</div><div class="paper-type">${tr("Расчёт с клиникой")}</div></div><div class="paper-meta">${tr("Клиника: ")}<b style="color:var(--ink)">${esc(c.name)}</b>${c.oneOff?tr(' (разовая)'):''}<br>${tr("Период: ")}${fmtRange(p.from,p.to)}<br>${tr("Сформирован: ")}${gen}</div></div>
  ${d.rows.length?`<table class="tbl" id="rep-table"><thead><tr><th>${tr("Дата")}</th><th>${tr("Заказ")}</th><th>${tr("Пациент")}</th><th>${tr("Услуга")}</th><th class="num">${tr("Кол-во")}</th><th class="num">${tr("Цена")}</th><th class="num">${tr("Сумма")}</th></tr></thead><tbody>${rows}</tbody></table>`:tr('<p class="muted">За период заказов нет.</p>')}
  <div class="paper-total"><span>${tr("Итого по клинике (")}${d.rows.length} ${plural(d.rows.length,tr('заказ'),tr('заказа'),tr('заказов'))})</span><b>${money(d.total)}</b></div><p class="paper-note">${tr("Переделки по вине лаборатории повторно не выставляются: заказ учитывается один раз по исходной цене.")}</p>`;}
 const t=techById(p.target);const d=payrollData(p.target,p.from,p.to);
 const rows=d.rows.map(r=>{const cl=clinicById(r.o.clinicId);const isRw=r.c.n>1;
  const lines=r.w.items.map((i,k)=>`<tr${isRw?' class="muted-row"':''}><td>${k===0?fmtShort(r.w.at):''}</td><td>${k===0?'#'+r.o.id:''}</td><td>${k===0?esc(r.o.patient):''}</td><td>${k===0?esc(cl.name):''}</td><td>${esc(serviceName(i.name))}</td><td class="num">${i.qty}</td><td class="num">${money(i.rate)}</td><td class="num">${money(i.qty*i.rate)}</td></tr>`).join('');
  const sub=isRw?`<tr class="sub"><td colspan="5"><b>${tr("Переделка №")}${r.c.n-1}</b> · ${esc(tr(r.c.reason))}${tr(" · расчётно ")}${money(r.w.calc)}${r.p&&r.p.comment?' · '+esc(r.p.comment):''}</td><td colspan="2" class="num">${r.p?tr('<span class="appr">утверждено</span>'):tr('<span class="pend">требует решения</span>')}</td><td class="num"><b>${r.p?money(r.p.approved):'—'}</b></td></tr>`:'';
  return lines+sub;}).join('');
 return `<div class="paper-head"><div><div class="paper-lab">${esc(laboratoryName(lab))}</div><div class="paper-type">${p.kind==='tech'?tr('Отчёт о проделанной работе'):tr('Расчёт заработной платы')}</div></div><div class="paper-meta">${tr("Техник: ")}<b style="color:var(--ink)">${esc(t.name)}</b><br>${tr("Период: ")}${fmtRange(p.from,p.to)}<br>${tr("Сформирован: ")}${gen}</div></div>
 ${d.rows.length?`<table class="tbl" id="rep-table"><thead><tr><th>${tr("Дата")}</th><th>${tr("Заказ")}</th><th>${tr("Пациент")}</th><th>${tr("Клиника")}</th><th>${tr("Услуга")}</th><th class="num">${tr("Кол-во")}</th><th class="num">${tr("Ставка")}</th><th class="num">${tr("Сумма")}</th></tr></thead><tbody>${rows}</tbody></table>`:tr('<p class="muted">За период выполненных работ нет.</p>')}
 <div class="paper-total"><span>${tr("Итого к выплате")}</span><b>${money(d.total)}</b></div>
 ${d.pending?`<p class="paper-note"><span class="pend">${tr("Внимание")}</span> ${d.pending} ${plural(d.pending,tr('переделка ожидает'),tr('переделки ожидают'),tr('переделок ожидают'))}${tr(" решения администратора (расчётно ")}${money(d.pendingSum)}${tr(") и не включены в итог.")}</p>`:''}
 <p class="paper-note">${tr("Суммы рассчитаны по ставкам, зафиксированным в момент завершения работы.")}</p>`;}

/* ============ Analytics & accounts ============ */
function vAnalytics(){return analyticsDashboard();}
function vAccounts(){const lab=labById(me().labId);const partners=S.clinics.filter(c=>!c.oneOff&&c.labIds.includes(lab.id));const oneoffs=S.clinics.filter(c=>c.oneOff&&c.labIds.includes(lab.id));const techs=S.techs.filter(t=>t.labId===lab.id);
 const login=f=>{const u=S.users.find(f);return u?`<code>${esc(u.login)}</code>`:'<span class="muted">—</span>';};
 return `<div class="page-head"><div><h1>${tr("Аккаунты")}</h1><p class="lead">${tr("Партнёры и сотрудники лаборатории «")}${esc(lab.name)}${tr("». Другие лаборатории здесь не видны.")}</p></div></div>
 <div class="stack"><div class="panel-card"><h3 style="font-size:17px;margin-bottom:12px">${tr("Клиники-партнёры")}</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tr("Клиника")}</th><th>${tr("Логин")}</th><th>${tr("Заказов")}</th><th>${tr("Статус")}</th></tr></thead><tbody>${partners.map(c=>`<tr><td><b style="font-weight:600">${esc(c.name)}</b></td><td>${login(u=>u.clinicId===c.id)}</td><td class="num" style="text-align:left">${S.orders.filter(o=>o.clinicId===c.id&&o.labId===lab.id).length}</td><td><span class="src-tag src-ind">${tr("Активна")}</span></td></tr>`).join('')}</tbody></table></div></div>
 <div class="panel-card"><h3 style="font-size:17px;margin-bottom:12px">${tr("Разовые клиники")}</h3>${oneoffs.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tr("Клиника / заказчик")}</th><th>${tr("Заказов")}</th></tr></thead><tbody>${oneoffs.map(c=>`<tr><td>${esc(c.name)} <span class="mark-oneoff">${tr("Разовая")}</span></td><td>${S.orders.filter(o=>o.clinicId===c.id).length}</td></tr>`).join('')}</tbody></table></div>`:tr('<p class="muted">Пока нет.</p>')}</div>
 <div class="panel-card"><h3 style="font-size:17px;margin-bottom:12px">${tr("Техники")}</h3><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${tr("Техник")}</th><th>${tr("Специальность")}</th><th>${tr("Логин")}</th><th>${tr("Ставок")}</th></tr></thead><tbody>${techs.map(t=>`<tr><td><b style="font-weight:600">${esc(t.name)}</b></td><td>${esc(tr(t.spec))}</td><td>${login(u=>u.techId===t.id)}</td><td>${Object.keys(S.techRates).filter(k=>k.startsWith(t.id+'|')).length}</td></tr>`).join('')}</tbody></table></div></div>
 <p class="hint">${tr("Создание и деактивация аккаунтов, приглашение новых клиник-партнёров — в полной версии.")}</p></div>`;}
