/* DentaFlow · Демонстрационные данные: 2 лаборатории, клиники, техники, ставки и заказы во всех статусах. */
'use strict';

/* ============ Seed ============ */
function seed(){
 const pw='demo123';
 S={v:2,nextId:1037,feedback:[],session:null,orders:[],
  labs:[{id:'alfa',name:'Альфа',full:'Лаборатория «Альфа»',phone:'+7 700 100 20 30'},{id:'beta',name:'Бета',full:'Лаборатория «Бета»',phone:'+7 700 400 50 60'}],
  services:[
   {id:'a1',labId:'alfa',name:'Циркониевая коронка',base:12000,active:true},
   {id:'a2',labId:'alfa',name:'Временная коронка ПММА',base:6000,active:true},
   {id:'a3',labId:'alfa',name:'Металлокерамическая коронка',base:9000,active:true},
   {id:'a4',labId:'alfa',name:'Винир E.max',base:20000,active:true},
   {id:'a5',labId:'alfa',name:'Аппарат Хайрекс',base:25000,active:true},
   {id:'a6',labId:'alfa',name:'Гипсовая модель',base:2000,active:true},
   {id:'b1',labId:'beta',name:'Циркониевая коронка',base:13500,active:true},
   {id:'b2',labId:'beta',name:'Временная коронка ПММА',base:5500,active:true},
   {id:'b3',labId:'beta',name:'Металлокерамическая коронка',base:8500,active:true},
   {id:'b4',labId:'beta',name:'Культевая вкладка',base:7000,active:true},
   {id:'b5',labId:'beta',name:'Хирургический шаблон',base:18000,active:true}],
  clinics:[
   {id:'c1',name:'Мой Дент',oneOff:false,labIds:['alfa','beta']},
   {id:'c2',name:'Баз Дент',oneOff:false,labIds:['alfa']},
   {id:'c3',name:'Улыбка Плюс',oneOff:false,labIds:['beta']},
   {id:'c4',name:'Стоматология «Ақ Тіс»',oneOff:true,labIds:['alfa']}],
  clinicPrices:{'c1|a1':11000,'c1|a2':5500,'c1|b1':12500,'c3|b1':13000,'c3|b4':6500},
  techs:[
   {id:'t1',labId:'alfa',name:'Ерасыл Нурланов',short:'Ерасыл',spec:'Керамика'},
   {id:'t2',labId:'alfa',name:'Омар Сейтов',short:'Омар',spec:'CAD/CAM'},
   {id:'t3',labId:'alfa',name:'Айгерим Жунусова',short:'Айгерим',spec:'Ортодонтия'},
   {id:'t4',labId:'beta',name:'Дана Ахметова',short:'Дана',spec:'Керамика'},
   {id:'t5',labId:'beta',name:'Тимур Касымов',short:'Тимур',spec:'Хирургические шаблоны'}],
  techRates:{'t1|a1':3500,'t1|a2':1500,'t1|a3':2800,'t1|a4':6000,'t1|a6':500,
   't2|a1':3200,'t2|a2':1400,'t2|a3':2500,'t2|a6':500,
   't3|a5':8000,'t3|a6':600,'t3|a2':1500,
   't4|b1':4000,'t4|b2':1500,'t4|b3':2700,'t4|b4':2000,
   't5|b5':5500,'t5|b4':2200,'t5|b2':1400},
  users:[
   {id:'u1',login:'moydent',password:pw,role:'CLINIC',clinicId:'c1',name:'Мой Дент'},
   {id:'u2',login:'bazdent',password:pw,role:'CLINIC',clinicId:'c2',name:'Баз Дент'},
   {id:'u3',login:'ulybka',password:pw,role:'CLINIC',clinicId:'c3',name:'Улыбка Плюс'},
   {id:'u4',login:'alfa.admin',password:pw,role:'ADMIN',labId:'alfa',name:'Асель Беркинова'},
   {id:'u5',login:'beta.admin',password:pw,role:'ADMIN',labId:'beta',name:'Руслан Ермеков'},
   {id:'u6',login:'erasyl',password:pw,role:'TECHNICIAN',techId:'t1',labId:'alfa',name:'Ерасыл Нурланов'},
   {id:'u7',login:'omar',password:pw,role:'TECHNICIAN',techId:'t2',labId:'alfa',name:'Омар Сейтов'},
   {id:'u8',login:'aigerim',password:pw,role:'TECHNICIAN',techId:'t3',labId:'alfa',name:'Айгерим Жунусова'},
   {id:'u9',login:'dana',password:pw,role:'TECHNICIAN',techId:'t4',labId:'beta',name:'Дана Ахметова'},
   {id:'u10',login:'timur',password:pw,role:'TECHNICIAN',techId:'t5',labId:'beta',name:'Тимур Касымов'}]
 };
 const U=id=>actorOf(S.users.find(u=>u.id===id));
 const moy=U('u1'),baz=U('u2'),uly=U('u3'),alfa=U('u4'),beta=U('u5'),era=U('u6'),oma=U('u7'),aig=U('u8'),dan=U('u9'),tim=U('u10');
 const at=(dAgo,h,m)=>{const d=new Date();d.setDate(d.getDate()-dAgo);d.setHours(h,m||0,0,0);CLOCK=d.toISOString();};
 const it=(cid,sid,q)=>({serviceId:sid,name:svcById(sid).name,qty:q,price:priceFor(cid,sid)});
 const wk=(tid,pairs)=>pairs.map(([sid,q])=>({serviceId:sid,name:svcById(sid).name,qty:q,rate:rateFor(tid,sid)}));
 const f=(name,mb)=>({name,size:Math.round(mb*1048576)});
 let o;
 at(25,11,20);o=createOrder({labId:'alfa',clinicId:'c1',patient:'Иманбаев Тимур Серикович',items:[it('c1','a4',2)],source:'scan',files:[f('imanbaev_upper.stl',18.4),f('imanbaev_bite.ply',6.2)],comment:'Виниры на 11 и 21, цвет BL3.'},moy);
 at(24,9,40);assignTechs(o,['t1'],alfa); at(19,17,5);finishWork(o,'t1',wk('t1',[['a4',2]]),era);
 at(18,10,0);sendToDelivery(o,alfa); at(17,12,30);confirmDelivery(o,moy);
 at(7,15,10);openRework(o,'Ошибка техника','Не совпал оттенок, нет контакта с соседним зубом',alfa);
 at(6,9,15);assignTechs(o,['t1'],alfa); at(3,16,45);finishWork(o,'t1',wk('t1',[['a4',2]]),era);

 at(21,10,5);o=createOrder({labId:'beta',clinicId:'c1',patient:'Жумабаева Алия Ериковна',items:[it('c1','b1',1),it('c1','b4',1)],source:'scan',files:[f('zhumabaeva_scan.stl',22.1)]},moy);
 at(20,11,0);assignTechs(o,['t4'],beta); at(15,16,20);finishWork(o,'t4',wk('t4',[['b1',1],['b4',1]]),dan);
 at(14,10,30);sendToDelivery(o,beta); at(13,13,10);confirmDelivery(o,moy);

 at(18,14,50);o=createOrder({labId:'alfa',clinicId:'c2',patient:'Смагулова Дина Аскаровна',items:[it('c2','a1',2)],source:'scan',files:[f('smagulova_lower.stl',15.7)]},baz);
 at(17,9,30);assignTechs(o,['t2'],alfa); at(12,18,0);finishWork(o,'t2',wk('t2',[['a1',2]]),oma);
 at(11,10,15);sendToDelivery(o,alfa); at(10,12,0);confirmDelivery(o,baz);

 at(9,11,30);o=createOrder({labId:'alfa',clinicId:'c2',patient:'Абдрахманов Ербол Кайратович',items:[it('c2','a3',3)],source:'impression',files:[]},baz);
 at(8,10,10);cancelOrder(o,alfa,'Клиника попросила отменить: пациент перенёс лечение на следующий месяц',{name:'perepiska_baz_dent.png',size:184320,data:null});

 at(8,9,10);o=createOrder({labId:'alfa',clinicId:'c1',patient:'Сарсенова Мадина Бауыржановна',items:[it('c1','a2',3)],source:'impression',files:[],comment:'Слепок передан курьером утром.'},moy);
 at(7,10,0);assignTechs(o,['t2'],alfa); at(4,15,30);finishWork(o,'t2',wk('t2',[['a2',3]]),oma); at(1,10,20);sendToDelivery(o,alfa);

 at(7,16,20);o=createOrder({labId:'beta',clinicId:'c1',patient:'Оспанов Арман Даулетович',items:[it('c1','b3',2)],source:'scan',files:[f('ospanov_scan.ply',11.3)]},moy);
 at(6,10,0);assignTechs(o,['t4'],beta); at(3,17,0);finishWork(o,'t4',wk('t4',[['b3',2]]),dan); at(1,11,40);sendToDelivery(o,beta);

 at(6,10,0);o=createOrder({labId:'beta',clinicId:'c3',patient:'Касенов Нурлан Маратович',items:[it('c3','b5',1)],source:'scan',files:[f('kasenov_cbct.dcm',42.0),f('kasenov_upper.stl',17.2)],comment:'Шаблон под имплантацию 36, 37.'},uly);
 at(5,9,0);assignTechs(o,['t5'],beta);

 at(6,12,40);o=createOrder({labId:'alfa',clinicId:'c2',patient:'Нургалиева Айжан Тимуровна',items:[it('c2','a5',1),it('c2','a6',2)],source:'impression',files:[]},baz);
 at(5,11,0);assignTechs(o,['t3'],alfa); at(1,16,10);finishWork(o,'t3',wk('t3',[['a5',1],['a6',2]]),aig);

 at(5,15,30);o=createOrder({labId:'alfa',clinicId:'c2',patient:'Сидоров Арман Викторович',items:[it('c2','a3',2),it('c2','a6',1)],source:'scan',files:[f('sidorov_full.stl',24.8)]},baz);
 at(4,10,0);assignTechs(o,['t1','t2'],alfa); at(1,13,0);finishWork(o,'t1',wk('t1',[['a3',2]]),era);

 at(4,13,15);o=createOrder({labId:'alfa',clinicId:'c1',patient:'Ахметов Данияр Ерланович',items:[it('c1','a1',2),it('c1','a2',2)],source:'scan',files:[f('akhmetov_upper.stl',19.0),f('akhmetov_lower.stl',18.6)]},moy);
 at(3,9,20);assignTechs(o,['t1','t2'],alfa);

 at(2,17,0);o=createOrder({labId:'beta',clinicId:'c1',patient:'Петрова Анна Сергеевна',items:[it('c1','b2',1)],source:'scan',files:[f('petrova_scan.stl',9.4)]},moy);
 at(1,14,30);o=createOrder({labId:'alfa',clinicId:'c1',patient:'Иванов Иван Иванович',items:[it('c1','a1',2),it('c1','a2',1)],source:'scan',files:[f('ivanov_upper.stl',20.3),f('ivanov_bite.ply',5.1)],comment:'Цвет A2. Учесть глубокий прикус.'},moy);
 at(1,18,40);o=createOrder({labId:'alfa',clinicId:'c4',patient:'Тлеубаева Сауле Нурлановна',items:[{serviceId:'a3',name:svcById('a3').name,qty:1,price:svcById('a3').base}],source:'impression',files:[]},alfa);
 CLOCK=null;
 return S;
}
