/* Public metadata only: never forward a dossier, photo, owner or buyer.
 * Wikidata CC0; Getty ULAN/AAT ODC-By 1.0. No authenticity/legal inference. */
const UA='Artvelchiv/1.0 (https://www.artvelchiv.com; artwork metadata)';
const cache=new Map(), cooldown=new Map();
const clip=(v,n=500)=>typeof v==='string'?v.slice(0,n):'';
const label=x=>x?.fr?.value||x?.en?.value||'';
export function claims(e,p){const a=(e?.claims?.[p]||[]).filter(x=>x.rank!=='deprecated'&&x.mainsnak?.snaktype==='value');const preferred=a.filter(x=>x.rank==='preferred');return (preferred.length?preferred:a).map(x=>x.mainsnak.datavalue?.value).filter(x=>x!==undefined);}
function years(e,p){return [...new Set(claims(e,p).filter(x=>x.precision>=9).map(x=>{const m=/^([+-])(\d+)-/.exec(x.time||'');return m?(m[1]==='-'?'-':'')+Number(m[2]):null;}).filter(Boolean))].slice(0,4);}
async function getJSON(url){
 const host=new URL(url).hostname,now=Date.now();
 if((cooldown.get(host)||0)>now)throw Error('busy');
 const hit=cache.get(url);if(hit&&hit.expires>now)return hit.data;
 const abort=new AbortController(),timer=setTimeout(()=>abort.abort(),9000);
 try{const response=await fetch(url,{signal:abort.signal,headers:{Accept:'application/json','User-Agent':UA}});
  if(response.status===429||response.status===503){const retry=Number(response.headers.get('retry-after'));cooldown.set(host,now+(Number.isFinite(retry)&&retry>0?Math.min(retry,3600):60)*1000);}
  if(!response.ok)throw Error('upstream');const data=await response.json();if(data.error)throw Error('upstream');
  if(cache.size>=300)cache.delete(cache.keys().next().value);cache.set(url,{data,expires:now+86400000});return data;
 }finally{clearTimeout(timer);}
}
// MediaWiki permits omitting maxlag for interactive requests; background prefetch retains it.
// https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
async function search(query,interactive=false,kind='artist'){
 const u=new URL('https://www.wikidata.org/w/api.php');u.search=new URLSearchParams({action:'wbsearchentities',search:query,language:'fr',uselang:'fr',format:'json',type:'item',limit:'5',...(interactive?{}:{maxlag:'5'})});
 const data=await getJSON(u.href),items=(data.search||[]).filter(x=>/^Q[1-9]\d*$/.test(x.id||'')).slice(0,5);
 if(!items.length)return [];
 // Exclude songs, metro stops, exhibitions and namesakes before presenting candidates.
 const facts=new URL('https://www.wikidata.org/w/api.php');facts.search=new URLSearchParams({action:'wbgetentities',ids:items.map(x=>x.id).join('|'),props:'claims',format:'json',...(interactive?{}:{maxlag:'5'})});
 const entities=(await getJSON(facts.href)).entities||{};
 return items.filter(x=>kind==='artist'?claims(entities[x.id],'P31').some(v=>v.id==='Q5'):claims(entities[x.id],'P1014').some(v=>typeof v==='string'&&/^\d{9}$/.test(v))).map(x=>({id:x.id,label:clip(x.label),description:clip(x.description),url:'https://www.wikidata.org/wiki/'+x.id}));
}
export function gettyRecord(data,id,vocabulary){
 const wanted=`http://vocab.getty.edu/${vocabulary}/${id}`;
 if(data?.id!==wanted&&data?.id!==wanted.replace('http:','https:'))throw Error('identity');
 const birth=data.born?.timespan,death=data.died?.timespan;
 const span=x=>{const a=x?.begin_of_the_begin?.slice(0,4),b=x?.end_of_the_end?.slice(0,4);return a&&a===b?a:null;};
 return {id,label:clip(data._label),birth:span(birth),death:span(death),url:`https://vocab.getty.edu/page/${vocabulary}/${id}`,vocabulary};
}
async function entity(id,kind){
 const data=await getJSON(`https://www.wikidata.org/wiki/Special:EntityData/${id}.json`),e=data.entities?.[id];
 if(!e||e.missing!==undefined)throw Error('missing');
 const human=claims(e,'P31').some(x=>x.id==='Q5');
 if(kind==='artist'&&!human)return {notPerson:true,candidates:[],message:'Cette notice ne désigne pas une personne. Précisez le nom de l’artiste.'};
 const vocabulary=kind==='artist'?'ulan':'aat',prop=kind==='artist'?'P245':'P1014';
 const ids=[...new Set(claims(e,prop).filter(x=>typeof x==='string'&&/^\d{9}$/.test(x)))].slice(0,2);
 const settled=await Promise.allSettled(ids.map(async gid=>gettyRecord(await getJSON(`https://vocab.getty.edu/${vocabulary}/${gid}.json`),gid,vocabulary)));
 const getty=settled.filter(x=>x.status==='fulfilled').map(x=>x.value);
 const name=vocabulary==='ulan'?'Union List of Artist Names':'Art & Architecture Thesaurus';
 const credit=`Contains information from the J. Paul Getty Trust, Getty Research Institute, ${name}, which is made available under the ODC Attribution License`;
 return {id,kind,label:clip(label(e.labels)),description:clip(label(e.descriptions)),aliases:(e.aliases?.fr||e.aliases?.en||[]).slice(0,6).map(x=>clip(x.value,160)),birth:kind==='artist'?years(e,'P569'):[],death:kind==='artist'?years(e,'P570'):[],getty,gettyStatus:!ids.length?'no-link':getty.length===ids.length?'available':'unavailable',sources:[{name:'Wikidata',url:`https://www.wikidata.org/wiki/${id}`,license:'CC0',revision:e.lastrevid||null},...getty.map(g=>({name:'Getty '+vocabulary.toUpperCase(),url:g.url,license:'ODC-By 1.0',credit,licenseUrl:'https://opendatacommons.org/licenses/by/1-0/'}))],retrievedAt:new Date().toISOString()};
}
async function body(req){if(req.body!==undefined){const raw=typeof req.body==='string'?req.body:JSON.stringify(req.body);if(Buffer.byteLength(raw)>2000)throw Error('size');return JSON.parse(raw);}let raw='';for await(const c of req){raw+=c;if(Buffer.byteLength(raw)>2000)throw Error('size');}return JSON.parse(raw||'{}');}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 const allowed=(process.env.ALLOWED_ORIGINS||'https://www.artvelchiv.com,https://artvelchiv.com').split(',').map(x=>x.trim()),origin=req.headers.origin;
 if(origin&&!allowed.includes(origin)&&origin!==`https://${req.headers.host}`)return res.status(403).json({error:'Accès non autorisé.'});
 if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
 res.setHeader('Access-Control-Allow-Headers','Content-Type, X-Artvelchiv-Key');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');
 if(req.method==='OPTIONS')return res.status(204).end();
 if(req.method!=='POST')return res.status(405).json({error:'Méthode non autorisée.'});
 const token=process.env.APP_ACCESS_TOKEN===undefined?'arttest':process.env.APP_ACCESS_TOKEN;
 if(!token||String(req.headers['x-artvelchiv-key']||'').trim()!==token)return res.status(401).json({error:'Confirmez votre accès.'});
 let b;try{b=await body(req);}catch{return res.status(400).json({error:'Recherche illisible.'});}
 if(!b||Array.isArray(b)||!['artist','term'].includes(b.kind)||Object.keys(b).some(k=>!['kind','query','id','interactive'].includes(k)))return res.status(400).json({error:'Recherche invalide.'});
 if(b.id!==undefined&&!/^Q[1-9]\d{0,10}$/.test(b.id))return res.status(400).json({error:'Référence invalide.'});
 const query=typeof b.query==='string'?b.query.trim():'';
 if(!b.id&&(query.length<2||query.length>120))return res.status(400).json({error:'Précisez un nom ou un terme (2 à 120 caractères).'});
 try{return res.status(200).json(b.id?{record:await entity(b.id,b.kind)}:{candidates:await search(query,b.interactive===true,b.kind)});}
 catch{return res.status(503).json({error:'Les références ne sont pas accessibles pour le moment. Vous pouvez poursuivre votre dossier.'});}
}
