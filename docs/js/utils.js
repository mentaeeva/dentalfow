/* DentaFlow · Иконки и вспомогательные функции: форматирование дат и денег, расчёт срока (10 рабочих дней без воскресений). */
'use strict';

/* ============ Icons (Lucide-style strokes) ============ */
const IC={
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 x:'<path d="M18 6 6 18M6 6l12 12"/>',
 menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
 back:'<path d="m15 18-6-6 6-6"/>',
 chev:'<path d="m9 18 6-6-6-6"/>',
 calendar:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
 clip:'<path d="m21.4 11-9.2 9.2a6 6 0 0 1-8.5-8.5l9.2-9.2a4 4 0 0 1 5.7 5.7l-9.2 9.2a2 2 0 0 1-2.8-2.8l8.5-8.5"/>',
 file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
 orders:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',
 chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',
 wallet:'<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><circle cx="16" cy="14" r="1.2"/>',
 receipt:'<path d="M5 2v20l3-2 3 2 3-2 3 2 2-1.3V2l-2 1.3L14 2l-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
 tag:'<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/>',
 user:'<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5"/><path d="M16 4a3.5 3.5 0 0 1 0 7M22 20c0-3-2-4.8-5-5.3"/>',
 logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5M21 12H9"/>',
 star:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
 check:'<path d="M20 6 9 17l-5-5"/>',
 alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
 lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
 history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
 refresh:'<path d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"/>',
 trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
 truck:'<path d="M1 3h15v13H1zM16 8h4l3 3v5h-7"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
 eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 eyeoff:'<path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7a9.6 9.6 0 0 0 5.4-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
 filter:'<path d="M3 4h18l-7 8.5V19l-4 2v-8.5z"/>',
 inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
 copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
 move:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/>',
 box:'<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
 download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
 tooth:'<path d="M7 3c-2.5 0-4 2-4 4.5 0 2 .8 3.5 1.4 5.2.6 1.8.8 4 1.4 6.3.4 1.6 1 2 1.7 2 1.2 0 1.4-2 1.9-4 .4-1.6 1-2.8 2.6-2.8s2.2 1.2 2.6 2.8c.5 2 .7 4 1.9 4 .7 0 1.3-.4 1.7-2 .6-2.3.8-4.5 1.4-6.3.6-1.7 1.4-3.2 1.4-5.2C21 5 19.5 3 17 3c-2 0-3 1-5 1S9 3 7 3z"/>'
};
const ic=(n,s=18)=>`<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n]||''}</svg>`;
const logoMark=()=>`<span class="logo-mark">${ic('tooth',19)}</span>`;

/* ============ Utilities ============ */
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>Math.round(Number(n)||0).toLocaleString('ru-RU').replace(/\s/g,' ')+' ₸';
const pad=n=>String(n).padStart(2,'0');
const MS=['янв.','февр.','мар.','апр.','мая','июн.','июл.','авг.','сент.','окт.','нояб.','дек.'];
const MF=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const sameDay=(a,b)=>a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
function fmtDT(iso){const d=new Date(iso),t=pad(d.getHours())+':'+pad(d.getMinutes()),td=new Date(),y=new Date();y.setDate(td.getDate()-1);
 if(sameDay(d,td))return 'Сегодня · '+t; if(sameDay(d,y))return 'Вчера · '+t;
 return d.getDate()+' '+MS[d.getMonth()]+(d.getFullYear()!==td.getFullYear()?' '+d.getFullYear():'')+' · '+t;}
function fmtDay(s){if(!s)return '—';const [Y,M,D]=s.split('-').map(Number);return D+' '+MF[M-1]+(Y!==new Date().getFullYear()?' '+Y:'');}
function fmtFull(iso){const d=new Date(iso);return d.getDate()+' '+MF[d.getMonth()]+' '+d.getFullYear()+', '+pad(d.getHours())+':'+pad(d.getMinutes());}
function fmtShort(iso){const d=new Date(iso);return pad(d.getDate())+'.'+pad(d.getMonth()+1)+'.'+d.getFullYear();}
const dayOf=iso=>ymd(new Date(iso));
const inRange=(iso,f,t)=>{const d=dayOf(iso);return(!f||d>=f)&&(!t||d<=t);};
const fmtRange=(f,t)=>(!f&&!t)?'весь период':((f?'с '+fmtDay(f):'')+(t?(f?' ':'')+'по '+fmtDay(t):''));
function plural(n,a,b,c){const m=Math.abs(n)%100,m1=m%10;if(m>10&&m<20)return c;if(m1>1&&m1<5)return b;if(m1===1)return a;return c;}
const initials=s=>String(s||'').replace(/[«»"]/g,'').split(/\s+/).filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const clone=o=>JSON.parse(JSON.stringify(o));
const parseMoney=v=>Number(String(v).replace(/[\s ₸]/g,'').replace(',','.'));
const fsize=b=>b>=1048576?(b/1048576).toFixed(1).replace('.',',')+' МБ':Math.max(1,Math.round(b/1024))+' КБ';
/* 10 working days, Sunday excluded, Saturday counts; counting starts from the next calendar day (ТЗ §4.7) */
function addWorkDays(fromIso,n){const d=new Date(fromIso);d.setHours(12,0,0,0);let c=0;while(c<n){d.setDate(d.getDate()+1);if(d.getDay()!==0)c++;}return ymd(d);}
