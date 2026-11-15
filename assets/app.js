'use strict';
const SHEET_ID='1lWiSGthuzZ2jRFTdDj10Aza_JU8KaK1XrOKApAGjBoQ';
const TABS=[{id:'home',label:'خانه',icon:'⌂'},{id:'faculty',label:'اساتید',icon:'♙'},{id:'labs',label:'آزمایشگاه‌ها',icon:'⚗'},{id:'forms',label:'فرم‌ها',icon:'▤'},{id:'contact',label:'ارتباط',icon:'◎'}];
const SOURCES={faculty:0,staff:101,labs:102,forms:103,research:104,news:105,home:106,events:107,labels:108};
let DATA={faculty:[],staff:[],labs:[],forms:[],news:[],home:[],events:[],labels:[]},current='home',live=false,filter='همه';
function readEmbeddedData(){
 const node=document.getElementById('qr-initial-data');
 if(!node)return false;
 try{
  const parsed=JSON.parse(node.textContent);
  if(!parsed||typeof parsed!=='object')return false;
  for(const key of Object.keys(DATA))if(Array.isArray(parsed[key]))DATA[key]=parsed[key];
  return true;
 }catch(error){console.error('Embedded content error:',error);return false}
}

const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const attr=esc;
const normalize=x=>String(x||'').replace(/[ي]/g,'ی').replace(/[ك]/g,'ک').trim();
function safeUrl(url){try{const u=new URL(String(url).trim());return ['http:','https:','mailto:'].includes(u.protocol)?u.href:''}catch{return ''}}
function csvParse(text){let rows=[],row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c}else if(c==='"')quoted=true;else if(c===','){row.push(cell);cell=''}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}return rows}
function parseRows(text){const rows=csvParse(text);if(!rows.length||!rows[0].length)throw Error('CSV empty');const headers=rows[0].map(s=>s.replace(/^\uFEFF/,''));return rows.slice(1).filter(r=>r.some(Boolean)).map(r=>Object.fromEntries(headers.map((h,i)=>[h,r[i]||''])))}
async function loadData(){const entries=Object.entries(SOURCES).filter(([key])=>key!=='research');const out=await Promise.allSettled(entries.map(async ([key,gid])=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),3500);try{const url=`https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}&t=${Date.now()}`;const response=await fetch(url,{signal:controller.signal,cache:'no-store'});if(!response.ok)throw Error('Google Sheet not public');const text=await response.text();if(text.slice(0,100).toLowerCase().includes('<!doctype html'))throw Error('Sheet returned HTML');const rows=parseRows(text);return {key,rows}}finally{clearTimeout(timer)}}));let updated=0;out.forEach(r=>{if(r.status==='fulfilled'){if(r.value.rows.length||r.value.key==='news'){DATA[r.value.key]=r.value.rows;updated++}}});live=updated===entries.length;applyVisibility();return updated}
function label(key,defaultText=''){const row=(DATA.labels||[]).find(r=>r['کلید متن']===key);return row&&enabled(row['فعال (TRUE/FALSE)'])&&row['متن نمایشی']?row['متن نمایشی']:defaultText}
function applyBrand(){
 const title=label('brand-title','مهندسی بهداشت حرفه‌ای و ایمنی کار'),sub=label('brand-subtitle','دانشگاه علوم پزشکی شیراز');
 const brand=document.querySelector('.brand-label');if(brand)brand.innerHTML=`<strong>${esc(title)}</strong><small>${esc(sub)}</small>`;
 const cap=document.querySelector('.header-caption');if(cap)cap.textContent=label('brand-caption','پرتال گروه');
 const foot=document.querySelector('.footer');if(foot){foot.hidden=current!=='contact';foot.innerHTML=`<div class="footer-credit"><div>برنامه نویسی شده توسط مهندس <a href="https://www.linkedin.com/in/a-amiri/" target="_blank" rel="noopener noreferrer">امیری</a></div><div>دانشجوی دکتری تخصصی بهداشت حرفه ای و ایمنی کار</div><div>علوم پزشکی شیراز</div><div>پاییز ۱۴۰۵</div></div>`;}
 const icon=(DATA.home||[]).find(r=>r['شناسه بخش']==='app-icon');const raw=icon?.['تصویر']||icon?.['لینک']||'';const id=driveId(raw);const url=id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w256`:safeUrl(raw);
 const mark=document.querySelector('.brand-mark');if(mark&&url)mark.innerHTML=`<img class="brand-image" src="${attr(url)}" alt="${esc(icon?.['عنوان']||'آیکون گروه')}" onerror="this.parentElement.textContent='OHS'">`;
 let favicon=document.querySelector('link[rel="icon"]');if(!favicon){favicon=document.createElement('link');favicon.rel='icon';document.head.appendChild(favicon)}if(url)favicon.href=url;
 document.title=`QR-OHS | ${title}`;
}
function p(name){return `images/${encodeURIComponent(name)}.jpg`}
function enabled(v){return v===true||v===1||['true','1','yes','بله'].includes(String(v??'').trim().toLowerCase())}
function applyVisibility(){
 for(const k of ['faculty','staff','labs','forms','news']){
  const rows=DATA[k]||[];
  DATA[k]=rows.filter(r=>!Object.keys(r).some(x=>x.startsWith('نمایش در سایت'))||enabled(r['نمایش در سایت (TRUE/FALSE)']));
 }
 DATA.events=(DATA.events||[]).filter(r=>r['عنوان رویداد']);
}
function driveId(url){const s=String(url||'');return s.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)?.[1]||s.match(/[?&]id=([^&#]+)/)?.[1]||''}
function imageUrl(person){const preferred=person['لینک تصویر قابل نمایش']||person['تصویر ذخیره‌شده']||person['تصویر']||'';const id=driveId(preferred);return id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w800`:safeUrl(preferred)}
function personImage(person){const name=person['نام و نام خانوادگی']||'',letters=name.replace(/^(دکتر|مهندس)\s*/,'').split(/\s+/).slice(0,2).map(w=>w[0]).join('');const fallback=`<div class="portrait-placeholder" aria-label="تصویر جایگزین ${attr(name)}">${esc(letters)}</div>`;const primary=imageUrl(person);if(!primary)return fallback;const candidates=[primary];const id=driveId(person['تصویر ذخیره‌شده']||person['لینک تصویر قابل نمایش']);if(id)candidates.push(`https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w800`);const university=safeUrl(person['تصویر']);if(university&&!candidates.includes(university))candidates.push(university);const encoded=encodeURIComponent(JSON.stringify(candidates));return `<img class="portrait" src="${attr(candidates[0])}" alt="تصویر ${attr(name)}" loading="lazy" referrerpolicy="no-referrer" data-urls="${attr(encoded)}" data-attempt="0" onerror="window.qrPhotoError(this)">`}
window.qrPhotoError=function(img){let urls=[];try{urls=JSON.parse(decodeURIComponent(img.dataset.urls))}catch{}const next=Number(img.dataset.attempt||0)+1;if(next<urls.length){img.dataset.attempt=next;img.src=urls[next]}else{const fallback=document.createElement('div');fallback.className='portrait-placeholder';fallback.textContent=(img.alt||'استاد').replace('تصویر ','').split(' ').slice(-2).map(w=>w[0]).join('');img.replaceWith(fallback)}};
function homeSection(id){return (DATA.home||[]).find(r=>r['شناسه بخش']===id&&(!('فعال'in r)||enabled(r['فعال'])))}
function dateDays(iso){if(!/^\d{4}-\d{2}-\d{2}$/.test(iso||''))return null;const [y,m,d]=iso.split('-').map(Number);const target=Date.UTC(y,m-1,d),now=new Date(),today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());return Math.round((target-today)/86400000)}
function eventCard(){if(!homeSection('events'))return '';const items=(DATA.events||[]).filter(e=>enabled(e['نمایش در سایت (TRUE/FALSE)'])&&e['وضعیت انتشار']==='منتشرشده').map(e=>({...e,days:dateDays(e['تاریخ شروع (میلادی YYYY-MM-DD)'])})).filter(e=>e.days!==null&&e.days>=0).sort((a,b)=>a.days-b.days);const e=items[0];if(!e)return '';const days=e.days===0?'امروز':`${e.days.toLocaleString('fa-IR')} روز مانده`;const url=safeUrl(e['لینک ثبت‌نام یا اطلاعات']);const date=new Date(`${e['تاریخ شروع (میلادی YYYY-MM-DD)']}T12:00:00`).toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'});return `<section class="event-feature"><div class="event-count">${days}</div><div class="event-copy"><span class="event-kicker">رویداد پیش‌رو · ${esc(date)}</span><h3>${esc(e['عنوان رویداد'])}</h3><p>${esc(e['توضیحات']||'')}</p>${url?`<a href="${attr(url)}" target="_blank" rel="noopener noreferrer">اطلاعات بیشتر</a>`:''}</div></section>`}
function sectionTitle(title,desc='',action=''){return `<div class="section-heading"><div><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>${action}</div>`}
function pageTitle(eyebrow,title,desc){return `<div class="page-heading"><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${desc}</p></div>`}
function facultyCard(f){const name=f['نام و نام خانوادگی']||'',isHead=String(f['مدیر گروه']).toLowerCase()==='true';const email=String(f['ایمیل سازمانی']||'').trim();const profile=safeUrl(f['صفحه شخصی']);return `<article class="card faculty-card"><div class="faculty-head">${personImage(f)}<div><div class="faculty-name">${esc(name)}</div><div class="subline">${esc(f['مرتبه علمی'])}</div>${isHead?'<span class="tag">مدیر گروه</span>':''}</div></div><div class="faculty-desc">${esc(f['حوزه تخصصی و معرفی'])}</div><div class="card-actions">${email?`<a href="mailto:${attr(email)}">ارسال ایمیل</a>`:''}${profile?`<a href="${attr(profile)}" target="_blank" rel="noopener noreferrer">صفحه دانشگاهی</a>`:''}</div></article>`}
function labCard(l,i){
 const icons=['⚙','◉','♧','⚗','⌁','◈','⚗','☀','♫'];
 const equipment=String(l['تجهیزات']||'').trim(),place=String(l['مکان']||'').trim(),manager=String(l['مسئول آزمایشگاه']||'').trim();
 const equipmentKnown=equipment&&!/نیازمند تکمیل|مشخص نشده|جزئیات تجهیزات/i.test(equipment);
 const placeKnown=place&&!/هنوز ثبت نشده|نیازمند تکمیل/.test(place);
 const managerText=manager&&!/هنوز معرفی نشده|نیازمند تکمیل/.test(manager)?manager:'نامشخص';
 const raw=String(l['تصویر']||'').trim(),id=driveId(raw);
 const photo=id?`https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w1200`:safeUrl(raw);
 const urls=id?[photo,`https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w1200`]:photo?[photo]:[];
 const fallback='https://drive.google.com/thumbnail?id=1EmgoRaTPuBxgCOc5_p09ttPWaBQ51fyO&sz=w800';
 if(!urls.includes(fallback))urls.push(fallback);
 const encoded=encodeURIComponent(JSON.stringify(urls));
 return `<article class="card lab-card"><img class="lab-photo" src="${attr(urls[0])}" alt="تصویر ${attr(l['نام آزمایشگاه'])}" loading="lazy" referrerpolicy="no-referrer" data-urls="${attr(encoded)}" data-attempt="0" onerror="window.qrLabPhotoError(this)"><span class="lab-number">آزمایشگاه ${String(i+1).padStart(2,'0')}</span><h3>${esc(l['نام آزمایشگاه'])}</h3><p>${esc(l['معرفی'])}</p>${equipmentKnown?`<div class="lab-detail"><b>تجهیزات:</b> ${esc(equipment)}</div>`:''}${placeKnown?`<div class="lab-detail"><b>مکان:</b> ${esc(place)}</div>`:''}<div class="lab-detail"><b>مسئول:</b> ${esc(managerText)}</div></article>`;
}
window.qrLabPhotoError=function(img){
 let urls=[];try{urls=JSON.parse(decodeURIComponent(img.dataset.urls||''))}catch(e){}
 const next=Number(img.dataset.attempt||0)+1;
 if(next<urls.length){img.dataset.attempt=String(next);img.src=urls[next]}
 else{img.onerror=null;img.style.visibility='hidden';img.alt='تصویر در دسترس نیست'}
};

function formCard(f){const u=safeUrl(f['لینک مستقیم دانلود']||f['لینک']);return `<article class="card resource-card"><div><div class="resource-title">${esc(f['عنوان فرم'])}</div><div class="resource-category">${esc(f['دسته‌بندی'])}</div></div>${u?`<a class="resource-link" href="${attr(u)}" target="_blank" rel="noopener noreferrer">${/\.(pdf|docx?|xlsx?)(\?|$)/i.test(u)?'دریافت فایل':'مشاهده منبع'}</a>`:''}</article>`}
function formatDate(raw){const t=String(raw||'').trim();if(!t)return 'تاریخ ثبت نشده';const iso=t.match(/^(\d{4})-(\d{2})-(\d{2})/);if(iso){const d=new Date(`${iso[0]}T12:00:00`);if(!Number.isNaN(d.getTime()))return d.toLocaleDateString('fa-IR-u-ca-persian',{year:'numeric',month:'long',day:'numeric'})}return t}
function newsItems(){return (DATA.news||[]).filter(n=>{if(!n['عنوان'])return false;const expiry=n['تاریخ انقضا (YYYY-MM-DD)'];return !expiry||(dateDays(expiry)??0)>=0}).sort((a,b)=>{const pinned=Number(enabled(b['سنجاق در بالای فهرست (TRUE/FALSE)']))-Number(enabled(a['سنجاق در بالای فهرست (TRUE/FALSE)']));if(pinned)return pinned;const d=String(b['تاریخ']||'').localeCompare(String(a['تاریخ']||''));return d||Number(a['اولویت نمایش (عدد)']||999)-Number(b['اولویت نمایش (عدد)']||999)})}
function newsCard(n){const u=safeUrl(n['لینک تکمیلی']),image=safeUrl(n['تصویر اطلاعیه (لینک)']);return `<article class="card notice"><div class="notice-top"><span class="notice-date">◷ ${esc(formatDate(n['تاریخ']))}</span>${enabled(n['سنجاق در بالای فهرست (TRUE/FALSE)'])?'<span class="notice-pin">اطلاعیه مهم</span>':''}</div>${image?`<img class="notice-image" src="${attr(image)}" alt="" loading="lazy" onerror="this.remove()">`:''}<h3>${esc(n['عنوان'])}</h3><p>${esc(n['خلاصه کوتاه']||n['متن اطلاعیه'])}</p>${n['خلاصه کوتاه']&&n['متن اطلاعیه']?`<details class="notice-detail"><summary>متن کامل اطلاعیه</summary><p>${esc(n['متن اطلاعیه'])}</p></details>`:''}${u?`<a class="link-more" href="${attr(u)}" target="_blank" rel="noopener noreferrer">اطلاعات بیشتر</a>`:''}</article>`}
function news(){const items=newsItems();return `${pageTitle('اطلاع‌رسانی گروه','آخرین اطلاعیه‌ها','تازه‌ترین خبرها و اطلاعیه‌های گروه در یک نگاه')}${items.length?`<div class="notice-list">${items.slice(0,5).map(newsCard).join('')}</div>${items.length>5?`<div class="more-wrap"><a class="btn btn-green" href="#news-all">مشاهده همه اطلاعیه‌ها (${items.length.toLocaleString('fa-IR')})</a></div>`:''}`:'<div class="info-box">در حال حاضر اطلاعیه‌ای برای نمایش وجود ندارد.</div>'}<div class="news-forms-link"><div><strong>به فرم یا راهنمای دانشجویی نیاز دارید؟</strong><p>فرم‌های آموزشی، آزمایشگاهی و تحصیلات تکمیلی در صفحه‌ای مستقل در دسترس‌اند.</p></div><a class="btn btn-green" href="#forms">فرم‌ها و راهنماها</a></div>`}
function allNews(){const items=newsItems();return `${pageTitle('',esc(label('news-all-title','همه اطلاعیه‌ها')),'') }<a class="back-link" href="#home">${esc(label('news-back','بازگشت به صفحه اصلی'))}</a><div class="notice-list">${items.length?items.map(newsCard).join(''):'<div class="info-box">اطلاعیه‌ای برای نمایش وجود ندارد.</div>'}</div>`}
function home(){
 const intro=homeSection('intro'),weekly=homeSection('weekly');const hero=homeSection('hero-title'),eyebrow=homeSection('hero-eyebrow');
 const quick=[{id:'faculty',icon:'♙',title:'quick-faculty',sub:'quick-faculty-desc'},{id:'labs',icon:'⚗',title:'quick-labs',sub:'quick-labs-desc'},{id:'forms',icon:'▤',title:'quick-forms',sub:'quick-forms-desc'},{id:'news-all',icon:'◷',title:'quick-news',sub:'quick-news-desc'},{id:'contact',icon:'◎',title:'quick-contact',sub:'quick-contact-desc'}];
 const newsList=newsItems();const newsTitle=homeSection('home-news-title')?.['متن']||label('news-title','آخرین اطلاعیه‌ها');const more=homeSection('home-news-more')?.['متن']||label('news-more','مشاهده همه اطلاعیه‌ها');
 return `<section class="hero"><div><div class="eyebrow">${esc(eyebrow?.['متن']||label('brand-subtitle','دانشگاه علوم پزشکی شیراز'))}</div><h1>${esc(hero?.['متن']||'دانش، ایمنی و سلامت در محیط کار')}</h1><p>${esc(intro?.['متن']||'')}</p>${weekly?`<div class="weekly-note"><span>${esc(label('home-weekly-label','پیام هفته'))}</span><strong>${esc(weekly['متن'])}</strong></div>`:''}</div><div class="hero-graphic"><div class="hero-symbol"><span>OHS</span></div></div></section>
 <div class="quick-grid">${quick.map(x=>`<a class="quick" href="#${x.id}"><span class="quick-icon">${x.icon}</span><strong>${esc(label(x.title))}</strong><small>${esc(label(x.sub))}</small></a>`).join('')}</div>
 ${eventCard()}
 <section class="home-news">${sectionTitle(esc(newsTitle),esc(label('home-news-subtitle','')),newsList.length>5?`<a class="link-more" href="#news-all">${esc(more)}</a>`:'')}${newsList.length?`<div class="notice-list">${newsList.slice(0,5).map(newsCard).join('')}</div>${newsList.length>5?`<div class="more-wrap"><a class="btn btn-green" href="#news-all">${esc(more)}</a></div>`:''}`:`<div class="info-box">${esc(label('news-empty','در حال حاضر اطلاعیه‌ای برای نمایش وجود ندارد.'))}</div>`}</section>`;
}
function faculty(){return `${pageTitle('',esc(label('faculty-title','اعضای هیئت علمی')),esc(label('faculty-desc','')))}<div class="toolbar"><input class="search" id="faculty-search" type="search" placeholder="جست‌وجوی نام یا تخصص استاد..." aria-label="جست‌وجوی استاد"><span class="count">${DATA.faculty.length.toLocaleString('fa-IR')} عضو هیئت علمی</span></div><div class="grid" id="faculty-list">${DATA.faculty.map(facultyCard).join('')}</div>`}
function labs(){return `${pageTitle('',esc(label('labs-title','آزمایشگاه‌ها و کارگاه‌ها')),esc(label('labs-desc','')))}<div class="grid">${DATA.labs.map(labCard).join('')}</div>`}
function forms(){const categories=['همه',...new Set(DATA.forms.map(f=>f['دسته‌بندی']).filter(Boolean))];return `${pageTitle('',esc(label('forms-title','فرم‌ها و راهنماها')),esc(label('forms-desc',''))) }<a class="back-link" href="#home">${esc(label('news-back','بازگشت به صفحه اصلی'))}</a><input class="search" id="form-search" type="search" placeholder="نام فرم یا راهنما را جست‌وجو کنید..." aria-label="جست‌وجوی فرم"><div class="chips" id="category-chips">${categories.map(c=>`<button class="chip ${c===filter?'active':''}" data-category="${attr(c)}">${esc(c)}</button>`).join('')}</div><div class="resource-grid" id="forms-list">${DATA.forms.map(formCard).join('')}</div>`}
const PLACES=[{name:'دانشکده بهداشت',desc:'موقعیت اصلی دانشکده',lat:29.591683546668705,lng:52.560396522817086,icon:'🏫'},{name:'ساختمان کلاس‌ها',desc:'فضاهای آموزشی',lat:29.59230743819698,lng:52.56074090190025,icon:'📚'},{name:'ساختمان گروه',desc:'گروه مهندسی بهداشت حرفه‌ای و ایمنی کار، طبقه دوم',lat:29.592637885668516,lng:52.56094908907289,icon:'🏢'}];
function contact(){return `${pageTitle('',esc(label('contact-title','ارتباط با ما')),esc(label('contact-desc',''))) }<div class="contact-grid"><section><div class="info-box">${sectionTitle('موقعیت ساختمان‌ها','روی «مسیریابی» بزنید تا موقعیت در نقشه باز شود.') }<div class="location-list">${PLACES.map(l=>`<div class="location"><div class="location-icon">${l.icon}</div><div class="location-details"><strong>${l.name}</strong><small>${l.desc}</small></div><a href="https://www.google.com/maps/dir/?api=1&destination=${l.lat}%2C${l.lng}" target="_blank" rel="noopener noreferrer">مسیریابی</a></div>`).join('')}</div><iframe class="map-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="نقشه موقعیت دانشکده و ساختمان گروه" src="https://www.openstreetmap.org/export/embed.html?bbox=52.5579%2C29.5899%2C52.5633%2C29.5942&layer=mapnik&marker=29.592637885668516%2C52.56094908907289"></iframe></div></section><section><div class="info-box">${sectionTitle('کارکنان گروه','اطلاعات تماس داخلی و حوزه مسئولیت') }<div class="staff-grid">${DATA.staff.map(s=>`<div class="card staff-card"><strong>${esc(s['نام و نام خانوادگی'])}</strong><p>${esc(s['سمت'])}</p>${s['شماره داخلی']?`<small>داخلی ${esc(s['شماره داخلی'])}</small>`:''}</div>`).join('')}</div></div></section></div>`}
function render(){try{applyBrand()}catch(error){console.warn('Brand update skipped:',error)}const page=({home,faculty,labs,news,forms,'news-all':allNews,contact})[current]||home;try{$('#app').innerHTML=page()}catch(error){
 console.error('Page component error:',current,error);
 $('#app').innerHTML='<section class="info-box"><h2>نمایش بخش انتخاب‌شده ممکن نشد</h2><p>از منوی پایین بخش دیگری را انتخاب کنید.</p></section>';
 return;
}document.querySelectorAll('[data-category]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.category;render()}));const fs=$('#faculty-search');if(fs)fs.addEventListener('input',()=>{$('#faculty-list').innerHTML=DATA.faculty.filter(f=>normalize(JSON.stringify(f)).includes(normalize(fs.value))).map(facultyCard).join('')||'<div class="empty">استادی با این عبارت پیدا نشد.</div>'});const formSearch=$('#form-search');if(formSearch){const update=()=>{$('#forms-list').innerHTML=DATA.forms.filter(f=>(filter==='همه'||f['دسته‌بندی']===filter)&&normalize(JSON.stringify(f)).includes(normalize(formSearch.value))).map(formCard).join('')||'<div class="empty">فرمی با این مشخصات پیدا نشد.</div>'};formSearch.addEventListener('input',update);update()}}
function navigate(){let id=location.hash.replace('#','')||'home';if(![...TABS.map(t=>t.id),'news-all'].includes(id))id='home';current=id;for(const nav of ['#desktop-nav','#bottom-nav']){document.querySelectorAll(`${nav} button`).forEach(b=>{const active=b.dataset.page===id;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false')})}render();try{window.scrollTo(0,0)}catch(error){}}
function initNavLabels(){
 for(const t of TABS){
  for(const el of document.querySelectorAll(`[data-page="${t.id}"]`)){
   const icon=el.querySelector('span');
   if(!icon)continue;
   const labelText=label('nav-'+t.id,t.label);
   while(icon.nextSibling)el.removeChild(icon.nextSibling);
   el.appendChild(document.createTextNode(labelText));
  }
 }
}
function initNav(){for(const [sel,mobile] of [['#desktop-nav',false],['#bottom-nav',true]]){$(sel).innerHTML=TABS.map(t=>`<button type="button" data-page="${t.id}"><span class="${mobile?'nav-icon':''}">${mobile?t.icon:''}</span>${esc(label('nav-'+t.id,t.label))}</button>`).join('');$(sel).addEventListener('click',e=>{const b=e.target.closest('[data-page]');if(b)location.hash=b.dataset.page})}}
readEmbeddedData();
applyVisibility();
try{initNav()}catch(error){console.error('Navigation setup:',error)}
window.addEventListener('hashchange',()=>{try{navigate()}catch(error){console.error('Navigation error:',error)}});
try{navigate()}catch(error){console.error('Initial navigation error:',error)}
try{initNavLabels()}catch(error){console.warn('Navigation labels:',error)}
loadData().then(()=>{
 try{initNavLabels()}catch(error){console.warn('Navigation labels refresh:',error)}
 try{navigate()}catch(error){console.error('Data refresh render:',error)}
}).catch(error=>console.warn('Optional content refresh:',error));
