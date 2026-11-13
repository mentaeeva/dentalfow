/* Supabase adapter for the static GitHub Pages build. */
'use strict';
window.DentaFlowCloud=(()=>{
 const cfg=window.DENTAFLOW_CONFIG||{};const configured=!!(cfg.supabaseUrl&&cfg.supabaseAnonKey);let client=null,ready=false,failed=false,queue=Promise.resolve(),lastPayload='';
 const bucket='dentaflow-files';
 const snapshot=()=>{const p=JSON.parse(JSON.stringify(S));p.session=null;return p;};
 function saveLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(S));}catch(e){}}
 function mergeRemote(p){if(!p||p.v!==2||!Array.isArray(p.orders))return false;const session=S&&S.session;S=p;S.session=session||null;saveLocal();return true;}
 function reportError(){if(failed)return;failed=true;ready=false;toast(tr('Supabase не отвечает. Пока используются данные этого браузера; проверьте настройки и подключение.'),'warn');}
 async function start(){if(!configured)return;if(!window.supabase||!window.supabase.createClient){reportError();return;}
  try{client=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);const {data,error}=await client.from('dentaflow_state').select('payload').eq('id','shared').maybeSingle();if(error)throw error;
   if(data&&mergeRemote(data.payload)){lastPayload=JSON.stringify(snapshot());}
   else{ready=true;await persist();}
   ready=true;
   client.channel('dentaflow-state-changes').on('postgres_changes',{event:'UPDATE',schema:'public',table:'dentaflow_state',filter:'id=eq.shared'},event=>{const p=event.new&&event.new.payload;if(p&&JSON.stringify(p)!==lastPayload&&mergeRemote(p)){lastPayload=JSON.stringify(snapshot());render();}}).subscribe();
  }catch(e){reportError();}}
 async function persist(){if(!client||!ready||failed)return;const p=snapshot(),encoded=JSON.stringify(p);lastPayload=encoded;const task=queue.catch(()=>{}).then(async()=>{const {error}=await client.from('dentaflow_state').upsert({id:'shared',payload:p,updated_at:new Date().toISOString()});if(error)throw error;});queue=task;task.catch(reportError);}
 async function upload(file){if(!configured)return null;if(!ready||!client)throw new Error('Supabase is not ready');const safe=file.name.normalize('NFKC').replace(/[^\p{L}\p{N}._-]+/gu,'_').slice(-100)||'file';const path=`${crypto.randomUUID()}-${safe}`;const {error}=await client.storage.from(bucket).upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(error)throw error;return{name:file.name,size:file.size,path};}
 async function remove(path){if(!client||!ready)return;const {error}=await client.storage.from(bucket).remove([path]);if(error)throw error;}
 function publicUrl(path){return client?client.storage.from(bucket).getPublicUrl(path).data.publicUrl:'#';}
 return{configured,get ready(){return ready;},start,save:()=>persist(),upload,remove,publicUrl};
})();
