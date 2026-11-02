const words=[
{ar:"استيعاب",tr:"kavrama, idrak",root:"و ع ب",syn:"فهم — إدراك",ant:"جهل",example:"يساعد الاستيعاب الجيد على التعلم."},
{ar:"علم",tr:"bilgi, ilim",root:"ع ل م",syn:"معرفة — إدراك",ant:"جهل",example:"العلم نور يضيء طريق الإنسان."},
{ar:"نجاح",tr:"başarı",root:"ن ج ح",syn:"فوز — تفوق",ant:"فشل",example:"يحتاج النجاح إلى الصبر والمثابرة."},
{ar:"تطور",tr:"gelişim, ilerleme",root:"ط و ر",syn:"تقدم — نمو",ant:"تراجع",example:"أدى تطور التكنولوجيا إلى تغييرات كثيرة."},
{ar:"معلومات",tr:"bilgiler",root:"ع ل م",syn:"بيانات — معطيات",ant:"—",example:"أبحث عن معلومات موثوقة."},
{ar:"سياق",tr:"bağlam",root:"س و ق",syn:"إطار — مضمون",ant:"—",example:"يتغير معنى الكلمة بحسب السياق."},
{ar:"مثابرة",tr:"azim, sebat",root:"ث ب ر",syn:"مواظبة — اجتهاد",ant:"تكاسل",example:"تؤدي المثابرة إلى تحقيق الأهداف."},
{ar:"مسؤولية",tr:"sorumluluk",root:"س أ ل",syn:"واجب — التزام",ant:"—",example:"تقع مسؤولية التعلم على الطالب."}
];
const $=s=>document.querySelector(s), saved=()=>JSON.parse(localStorage.getItem('mucemSaved')||'[]');
function updateStats(){let s=saved();$('#savedCount').textContent=s.length;$('#statSaved').textContent=s.length;$('#progressSaved').textContent=s.length;$('#statQuiz').textContent=localStorage.getItem('mucemQuiz')||0;$('#progressTotal').textContent=localStorage.getItem('mucemQuiz')||0;$('#progressCorrect').textContent=localStorage.getItem('mucemCorrect')||0;$('#statToday').textContent=(localStorage.getItem('mucemMinutes')||0)+' dk'}
function wordCard(w){return `<article class="word-card"><div class="arabic" dir="rtl">${w.ar}</div><b>${w.tr}</b><p>${w.example}</p><button class="icon-btn" onclick="saveWord('${w.ar}')">☆ Kaydet</button></article>`}
function row(w){return `<article class="word-row"><div class="details"><div class="arabic" dir="rtl">${w.ar}</div><b>${w.tr}</b><p>Kök: ${w.root} · Eş: ${w.syn} · Zıt: ${w.ant}</p><p><i>${w.example}</i></p></div><div class="word-actions"><button class="icon-btn" onclick="speak('${w.ar}')">🔊</button><button class="icon-btn" onclick="saveWord('${w.ar}')">☆</button></div></article>`}
window.saveWord=ar=>{let s=saved();if(!s.includes(ar)){s.push(ar);localStorage.setItem('mucemSaved',JSON.stringify(s))}updateStats();renderSaved();};
window.speak=ar=>{if('speechSynthesis'in window){let u=new SpeechSynthesisUtterance(ar);u.lang='ar-SA';speechSynthesis.speak(u)}else alert('Tarayıcınız seslendirmeyi desteklemiyor.')};
function renderSaved(){let s=saved();$('#savedWords').innerHTML=s.length?words.filter(w=>s.includes(w.ar)).map(row).join(''):'<p class="muted">Henüz kelime kaydetmedin. Sözlükten yıldız simgesine dokunabilirsin.</p>'}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function search(){
 const q=$('#searchInput').value.trim();
 if(!q){$('#searchResults').innerHTML='';return}
 const local=words.filter(w=>[w.ar,w.tr,w.root,w.syn,w.ant].join(' ').toLowerCase().includes(q.toLowerCase()));
 $('#searchResults').innerHTML='<p class="muted">Sözlük kaynakları aranıyor…</p>';
 try{
  const lang=/[\u0600-\u06FF]/.test(q)?'ar':'tr';
  const url='https://freedictionaryapi.com/api/v1/entries/'+lang+'/'+encodeURIComponent(q)+'?translations=true';
  const response=await fetch(url,{headers:{'Accept':'application/json'}});
  if(!response.ok) throw new Error('API response '+response.status);
  const data=await response.json();
  const entries=Array.isArray(data.entries)?data.entries:[];
  const cards=[];
  entries.forEach(entry=>{
   const senses=Array.isArray(entry.senses)?entry.senses:[];
   const defs=senses.map(s=>s.definition).filter(Boolean);
   const translations=senses.flatMap(s=>s.translations||[]).concat(entry.translations||[]);
   const trWords=[...new Set(translations.filter(t=>t.language?.code==='tr').map(t=>t.word).filter(Boolean))];
   const arWords=[...new Set(translations.filter(t=>t.language?.code==='ar').map(t=>t.word).filter(Boolean))];
   const isArabic=entry.language?.code==='ar';
   const head=q;
   const translation=isArabic?(trWords.join(', ')||'Türkçe karşılık bulunamadı'):(arWords.join('، ')||'Arapça karşılık bulunamadı');
   const examples=senses.flatMap(s=>s.examples||[]).slice(0,2);
   const pos=entry.partOfSpeech||'';
   cards.push('<article class="word-row api-word"><div class="details"><div class="arabic" dir="'+(isArabic?'rtl':'auto')+'">'+esc(head)+'</div><b>'+esc(translation)+'</b><p>'+esc(pos)+'</p>'+defs.slice(0,4).map(d=>'<p>'+esc(d)+'</p>').join('')+examples.map(e=>'<p><i>'+esc(e)+'</i></p>').join('')+'</div><div class="word-actions"><button class="icon-btn" onclick="speak(\''+esc(head).replace(/\\'/g,"\\\\'")+'\')">🔊</button></div></article>');
   if(isArabic&&!words.some(w=>w.ar===head)){
    words.push({ar:head,tr:translation,root:'—',syn:(entry.synonyms||[]).join('، ')||'—',ant:(entry.antonyms||[]).join('، ')||'—',example:examples[0]||defs[0]||''});
   }
  });
  const localHtml=local.map(row).join('');
  $('#searchResults').innerHTML=(cards.length?'<div class="api-results"><span class="eyebrow">ÇEVRİM İÇİ SÖZLÜK · WIKTIONARY VERİSİ</span>'+cards.join('')+'<small class="muted">Kaynak: <a href="'+esc(data.source?.url||'https://www.wiktionary.org/')+'" target="_blank" rel="noopener">Wiktionary</a> · CC BY-SA 4.0</small></div>':'<p class="muted">Çevrim içi kaynakta bu kelime için kayıt bulunamadı.</p>')+(localHtml?'<div class="section-heading"><h3>MU’CEM yerel kelimeleri</h3></div>'+localHtml:'');
  if(!cards.length&&!local.length) $('#searchResults').innerHTML='<p class="muted">Bu kelime için sonuç bulunamadı. Yazımı kontrol ederek tekrar dene.</p>';
 }catch(err){
  $('#searchResults').innerHTML=(local.length?'<div class="section-heading"><h3>MU’CEM kelimeleri</h3></div>'+local.map(row).join(''):'<p class="muted">Çevrim içi sözlük şu anda yanıt vermiyor. İnternet bağlantını kontrol edip tekrar dene.</p>');
 }
}

document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.page)));
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>showPage(b.dataset.go)));
function showPage(id){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.id===id));document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));let titles={overview:'Merhaba, hoş geldin.',dictionary:'Arapça sözlük',saved:'Kişisel kelime arşivin',practice:'Bilgini pekiştir',progress:'Öğrenme yolculuğun',translation:'Çeviri atölyesi'};$('#pageTitle').textContent=titles[id];if(id==='saved')renderSaved();if(id==='progress')updateStats()}
$('#searchBtn').onclick=search;$('#searchInput').addEventListener('keydown',e=>{if(e.key==='Enter')search()});
$('#dailyWords').innerHTML=words.slice(0,3).map(wordCard).join('');$('#allWords').innerHTML=words.map(row).join('');
let quizIndex=0,answered=false;function loadQuiz(){answered=false;let w=words[quizIndex%words.length];$('#quizWord').textContent=w.ar;let others=words.filter(x=>x!==w).sort(()=>Math.random()-.5).slice(0,3);let opts=[w,...others].sort(()=>Math.random()-.5);$('#quizOptions').innerHTML=opts.map(x=>`<button class="option" data-answer="${x.ar}">${x.tr}</button>`).join('');$('#quizFeedback').textContent='';$('#quizOptions').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(answered)return;answered=true;let total=+(localStorage.getItem('mucemQuiz')||0)+1;localStorage.setItem('mucemQuiz',total);if(b.dataset.answer===w.ar){b.style.borderColor='#5b8d67';$('#quizFeedback').textContent='✓ Doğru cevap!';localStorage.setItem('mucemCorrect',+(localStorage.getItem('mucemCorrect')||0)+1)}else{$('#quizFeedback').textContent='Doğru cevap: '+w.tr}updateStats()})}
$('#nextQuiz').onclick=()=>{quizIndex++;loadQuiz()};loadQuiz();
const translations=[{q:'Bilgi, insanın gelişmesine katkı sağlar.',a:'العلم يساهم في تطور الإنسان.',keys:['العلم','تطور','الإنسان']},{q:'Başarı sabır ve azim gerektirir.',a:'النجاح يحتاج إلى الصبر والمثابرة.',keys:['النجاح','الصبر','المثابرة']}];let ti=0;$('#checkTranslation').onclick=()=>{let v=$('#translationAnswer').value.trim();let t=translations[ti];let hits=t.keys.filter(k=>v.includes(k)).length;$('#translationFeedback').textContent=v?(hits>=2?'Güzel! Anahtar kelimelerin çoğunu kullandın. Örnek: '+t.a:'Örnek çeviri: '+t.a):'Önce çevirini yaz.';ti=(ti+1)%translations.length;$('#translationPrompt').textContent=translations[ti].q;$('#translationAnswer').value=''};
$('#today').textContent=new Intl.DateTimeFormat('tr-TR',{dateStyle:'long'}).format(new Date());updateStats();

/* Meaning lookup, reversible bookmarks, simple local profile and study companion */
const meaningExtras=[
{ar:"مغامرات",tr:"mac eralar",root:"غ م ر",syn:"رحلات — تجارب",ant:"—",example:"تبدأ المغامرات أحياناً بخطوة صغيرة."},
{ar:"حماس",tr:"heyecan, coşku",root:"ح م س",syn:"نشاط — اندفاع",ant:"فتور",example:"يدفع الحماس الإنسان إلى العمل."},
{ar:"تبنّى",tr:"benimsemek, üstlenmek",root:"ب ن ي",syn:"اعتمد — اعتنق",ant:"رفض",example:"تبنّت الجامعة مشروعاً جديداً."},
{ar:"واكب",tr:"ayak uydurmak, eşlik etmek",root:"و ك ب",syn:"ساير — تابع",ant:"تخلّف",example:"ينبغي أن نواكب التطورات العلمية."},
{ar:"مستعصٍ",tr:"çözülmesi güç, çetin",root:"ع ص ي",syn:"صعب — معقّد",ant:"يسير",example:"هذه مشكلة مستعصية."},
{ar:"مسؤولية",tr:"sorumluluk",root:"س أ ل",syn:"واجب — التزام",ant:"—",example:"تقع مسؤولية التعلم على الطالب."},
{ar:"ترسيخ",tr:"pekiştirme, sağlamlaştırma",root:"ر س خ",syn:"تثبيت — تعزيز",ant:"إضعاف",example:"تساعد القراءة على ترسيخ المفردات."},
{ar:"إنجاز",tr:"başarı, tamamlanan iş",root:"ن ج ز",syn:"نجاح — تحقيق",ant:"إخفاق",example:"حقق الطالب إنجازاً مهماً."},
{ar:"نضج",tr:"olgunluk",root:"ن ض ج",syn:"اكتمال — رشد",ant:"طفولة",example:"تساهم التجارب في نضج الشخصية."},
{ar:"سياق",tr:"bağlam",root:"س و ق",syn:"إطار — مضمون",ant:"—",example:"يتغير معنى الكلمة بحسب السياق."}
];
for(const x of meaningExtras){if(!words.some(w=>w.ar===x.ar))words.push(x)}
$('#allWords').innerHTML=words.map(row).join('');
window.saveWord=ar=>{let s=saved();s=s.includes(ar)?s.filter(x=>x!==ar):[...s,ar];localStorage.setItem('mucemSaved',JSON.stringify(s));updateStats();renderSaved();document.querySelectorAll('[data-save="'+ar+'"]').forEach(b=>{b.classList.toggle('is-saved',s.includes(ar));b.textContent=s.includes(ar)?'★':'☆'});};
function row(w){const yes=saved().includes(w.ar);return `<article class="word-row"><div class="details"><div class="arabic" dir="rtl">${w.ar}</div><b>${w.tr}</b><p>Kök: ${w.root} · Eş: ${w.syn} · Zıt: ${w.ant}</p><p><i>${w.example}</i></p></div><div class="word-actions"><button class="icon-btn" onclick="speak('${w.ar}')">🔊</button><button data-save="${w.ar}" class="icon-btn ${yes?'is-saved':''}" onclick="saveWord('${w.ar}')">${yes?'★':'☆'}</button></div></article>`}
function wordCard(w){const yes=saved().includes(w.ar);return `<article class="word-card"><div class="arabic" dir="rtl">${w.ar}</div><b>${w.tr}</b><p>${w.example}</p><button data-save="${w.ar}" class="icon-btn ${yes?'is-saved':''}" onclick="saveWord('${w.ar}')">${yes?'★ Kaydedildi':'☆ Kaydet'}</button></article>`}
const coachText=$('#companionText');
const coachLines=['Harika gidiyorsun! Bir kelime daha öğrenmeye ne dersin?','Az ama düzenli çalışma, büyük ilerleme sağlar.','أحسنت! أنت تتقدم كل يوم.','Bir kelimeyi kaydet, sonra tekrar etmeyi unutma.','Devam et! Her gün biraz daha gelişiyorsun.'];let coachIndex=0;
const oldShowPage=showPage;showPage=function(id){oldShowPage(id);if(coachText)coachText.textContent=coachLines[(coachIndex++)%coachLines.length]};
if(coachText){setInterval(()=>{coachText.textContent=coachLines[(coachIndex++)%coachLines.length]},6500)}
const intro=$('#bookIntro');const leaveIntro=()=>intro.classList.add('hidden');const openIntro=()=>intro.classList.add('is-opening');setTimeout(openIntro,950);$('#enterBook').onclick=()=>{if(!intro.classList.contains('is-opening')){openIntro();setTimeout(leaveIntro,2100)}else leaveIntro()};setTimeout(leaveIntro,6500);
let authMode='login';const modal=$('#authModal');$('#closeAuth').onclick=()=>modal.classList.remove('open');
function setAuthMode(m){authMode=m;$('#authName').style.display=m==='register'?'block':'none';$('#authSubmit').textContent=m==='register'?'Hesap oluştur':'Giriş yap';$('#authMessage').textContent=''}
$('#showLogin').onclick=()=>setAuthMode('login');$('#showRegister').onclick=()=>setAuthMode('register');setAuthMode('login');
$('#authSubmit').onclick=()=>{const email=$('#authEmail').value.trim().toLowerCase(),pass=$('#authPassword').value,name=$('#authName').value.trim();if(!email||!pass||(authMode==='register'&&!name)){ $('#authMessage').textContent='Lütfen gerekli alanları doldur.';return;}let users=JSON.parse(localStorage.getItem('mucemUsers')||'{}');if(authMode==='register'){if(users[email]){$('#authMessage').textContent='Bu e-posta zaten kayıtlı.';return;}users[email]={pass,name};localStorage.setItem('mucemUsers',JSON.stringify(users));}else if(!users[email]||users[email].pass!==pass){$('#authMessage').textContent='E-posta veya şifre hatalı.';return;}localStorage.setItem('mucemSession',email);$('#welcomeUser').textContent='Merhaba, '+(users[email].name||name);$('#accountButton').textContent='Çıkış yap';modal.classList.remove('open');};
$('#accountButton').onclick=()=>{if(localStorage.getItem('mucemSession')){localStorage.removeItem('mucemSession');$('#welcomeUser').textContent='Misafir';$('#accountButton').textContent='Giriş / Kaydol'}else{modal.classList.add('open')}};
const current=localStorage.getItem('mucemSession');if(current){const us=JSON.parse(localStorage.getItem('mucemUsers')||'{}');if(us[current]){$('#welcomeUser').textContent='Merhaba, '+us[current].name;$('#accountButton').textContent='Çıkış yap'}}

/* Two-way dictionary and contextual exercise companion */
let dictionaryDirection='ar-tr';
const normalizeDictionary=s=>String(s||'').toLocaleLowerCase('tr-TR').normalize('NFKD').replace(/[\u064b-\u065f\u0670]/g,'').trim();
document.querySelectorAll('[data-direction]').forEach(btn=>btn.addEventListener('click',()=>{
 dictionaryDirection=btn.dataset.direction;
 document.querySelectorAll('[data-direction]').forEach(b=>b.classList.toggle('active',b===btn));
 document.querySelector('.book-top span:first-child').textContent=dictionaryDirection==='tr-ar'?'المعجم التركي العربي':'المعجم العربي التركي';
 document.querySelector('.book-top span:last-child').textContent=dictionaryDirection==='tr-ar'?'TÜRKÇE — ARAPÇA':'ARAPÇA — TÜRKÇE';
 document.querySelector('#searchInput').placeholder=dictionaryDirection==='tr-ar'?'Türkçe kelime yaz...':'Arapça kelime yaz...';
 document.querySelector('#searchResults').innerHTML='';
}));
/* Search local entries first, then independent online translation providers. */
const baseSearch=search;
const expandedEntries=[
['eğitim','تَعْلِيم','ع ل م','التعليم أساس تقدم المجتمعات.'],['öğretmen','مُعَلِّم','ع ل م','المعلم يساعد الطلاب.'],['öğrenci','طَالِب','ط ل ب','الطالب يقرأ الكتاب.'],['okul','مَدْرَسَة','د ر س','ذهبت إلى المدرسة.'],
['kitap','كِتَاب','ك ت ب','قرأت كتاباً مفيداً.'],['kalem','قَلَم','ق ل م','أكتب بالقلم.'],['ev','بَيْت','ب ي ت','هذا بيتي.'],['aile','عَائِلَة','ع و ل','أحب عائلتي.'],
['sevgi','حُبّ','ح ب ب','الحب يجمع الناس.'],['arkadaş','صَدِيق','ص د ق','صديقي يساعدني.'],['su','مَاء','م و ه','أشرب الماء.'],['yemek','طَعَام','ط ع م','الطعام لذيذ.'],
['sağlık','صِحَّة','ص ح ح','الصحة نعمة.'],['seyahat','سَفَر','س ف ر','السفر يوسع الآفاق.'],['adalet','عَدَالَة','ع د ل','العدل أساس الحكم.'],['kültür','ثَقَافَة','ث ق ف','أتعلم عن ثقافات مختلفة.'],
['dil','لُغَة','ل غ و','اللغة العربية جميلة.'],['kelime','كَلِمَة','ك ل م','تعلمت كلمة جديدة.'],['zaman','وَقْت','و ق ت','الوقت ثمين.'],['hayat','حَيَاة','ح ي ي','الحياة مليئة بالفرص.'],
['çalışmak','دَرَسَ','د ر س','درس الطالب بجد.'],['öğrenmek','تَعَلَّمَ','ع ل م','تعلمت اللغة العربية.'],['anlamak','فَهِمَ','ف ه م','فهمت الدرس.'],['yazmak','كَتَبَ','ك ت ب','كتب رسالة.'],
['okumak','قَرَأَ','ق ر أ','قرأ الطالب النص.'],['konuşmak','تَكَلَّمَ','ك ل م','تكلم بالعربية.'],['güzel','جَمِيل','ج م ل','هذا منظر جميل.'],['büyük','كَبِير','ك ب ر','هذا بيت كبير.']
];
for(const [tr,ar,root,example] of expandedEntries)if(!words.some(w=>normalizeDictionary(w.ar)===normalizeDictionary(ar)))words.push({ar,tr,root,syn:'—',ant:'—',example});
document.querySelector('#allWords').innerHTML=words.map(row).join('');
const lookupCache=new Map();
const withTimeout=async(url)=>{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),6500);try{const r=await fetch(url,{signal:controller.signal});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}finally{clearTimeout(timer)}};
const arabicChars=/[\u0600-\u06ff]/;
const renderLookup=(w,source)=>'<article class="word-row"><div class="details"><div class="arabic" dir="rtl">'+esc(w.ar)+'</div><b>'+esc(w.tr)+'</b><p>'+esc(w.root&&w.root!=='—'?'Kök: '+w.root:'')+'</p>'+(w.example?'<p dir="rtl"><i>'+esc(w.example)+'</i></p>':'')+'<small class="muted">Kaynak: '+esc(source)+'</small></div><div class="word-actions"><button class="icon-btn" data-speak-ar="'+esc(w.ar)+'" aria-label="Arapça telaffuz">🔊</button><button class="icon-btn" data-bookmark-ar="'+esc(w.ar)+'" aria-label="Kaydet">☆</button></div></article>';
const bindLookupButtons=()=>{document.querySelectorAll('#searchResults [data-speak-ar]').forEach(b=>b.onclick=()=>speak(b.dataset.speakAr));document.querySelectorAll('#searchResults [data-bookmark-ar]').forEach(b=>b.onclick=()=>saveWord(b.dataset.bookmarkAr))};
search=async function(){
 const q=document.querySelector('#searchInput').value.trim();
 const results=document.querySelector('#searchResults');
 if(!q){results.innerHTML='';return}
 const direction=dictionaryDirection, arabic=direction==='ar-tr';
 const local=words.filter(w=>normalizeDictionary(arabic?w.ar:w.tr).includes(normalizeDictionary(q)));
 const localMarkup=local.length?'<h3>MU’CEM kelimeleri</h3>'+local.slice(0,24).map(w=>renderLookup(w,'MU’CEM kelime havuzu')).join(''):'';
 results.innerHTML=localMarkup+'<p class="muted" id="onlineStatus">Çevrim içi sözlükte aranıyor…</p>';
 bindLookupButtons();
 const key=direction+'|'+normalizeDictionary(q);
 try{
   let translated=lookupCache.get(key);
   if(!translated){
     const from=arabic?'ar':'tr',to=arabic?'tr':'ar';
     const data=await withTimeout('https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair='+from+'|'+to);
     translated=[data.responseData?.translatedText,...(data.matches||[]).filter(m=>Number(m.quality)>50).map(m=>m.translation)].filter(Boolean).filter(s=>!/<[^>]+>|MYMEMORY WARNING|INVALID LANGUAGE/i.test(s));
     translated=[...new Set(translated)].slice(0,5);
     if(translated.length)lookupCache.set(key,translated);
   }
   const online=translated.map(t=>({ar:arabic?q:t,tr:arabic?t:q,root:'—',example:''})).filter(w=>w.ar&&w.tr);
   const unique=online.filter(w=>!local.some(l=>normalizeDictionary(l.ar)===normalizeDictionary(w.ar)));
   results.innerHTML=localMarkup+(unique.length?'<h3>Çevrim içi çeviri önerileri</h3>'+unique.map(w=>renderLookup(w,'MyMemory çeviri servisi')).join(''):'<p class="muted">Çevrim içi kaynakta ek karşılık bulunamadı.</p>');
   unique.forEach(w=>{if(!words.some(x=>x.ar===w.ar))words.push(w)});
   bindLookupButtons();
 }catch(e){results.innerHTML=localMarkup+'<p class="muted">Çevrim içi kaynak şu anda yanıt vermiyor. '+(local.length?'Yukarıdaki yerel sonuçları kullanabilirsin.':'Başka bir kelime deneyebilir veya biraz sonra yeniden arayabilirsin.')+'</p>';bindLookupButtons()}
};
const practiceNote=document.querySelector('#practiceCompanionText');
const practiceGirl=document.querySelector('.practice-companion');
const quizOptions=document.querySelector('#quizOptions');
quizOptions.addEventListener('click',event=>{
 const button=event.target.closest('button[data-answer]');
 if(!button||!answered||!practiceNote)return;
 const correct=button.dataset.answer===words[quizIndex%words.length].ar;
 practiceNote.textContent=correct?'أحسنتِ! Harika, doğru bildin! Seninle gurur duyuyorum.':'لا بأس! Üzülme, birlikte öğreniyoruz. Bir sonraki soruda tekrar dene!';
 practiceGirl.classList.toggle('celebrate',correct);
 practiceGirl.classList.toggle('encourage',!correct);
});
document.querySelector('#nextQuiz').addEventListener('click',()=>{
 if(practiceNote)practiceNote.textContent='هيا بنا! Yeni kelimeye hazır mısın?';
 practiceGirl.classList.remove('celebrate','encourage');
});


/* Remove the checkerboard pixels baked into the uploaded companion PNG.
   Only light neutral pixels connected to the outer image boundary are erased,
   protecting the girl's white flowers, socks and eyes inside her silhouette. */
(function makeCompanionBackgroundTransparent(){
  function clean(img){
    if(img.dataset.bgCleaned)return;
    img.dataset.bgCleaned='true';
    const run=()=>{
      if(!img.naturalWidth||!img.naturalHeight)return;
      try{
        const canvas=document.createElement('canvas');
        canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});
        ctx.drawImage(img,0,0);
        const frame=ctx.getImageData(0,0,canvas.width,canvas.height);
        const p=frame.data,w=canvas.width,h=canvas.height,n=w*h;
        const seen=new Uint8Array(n),queue=new Int32Array(n);
        let head=0,tail=0;
        const isBackground=i=>{
          const k=i*4,r=p[k],g=p[k+1],b=p[k+2];
          return p[k+3]<24||(Math.min(r,g,b)>207&&Math.max(r,g,b)-Math.min(r,g,b)<23);
        };
        const add=i=>{
          if(i<0||i>=n||seen[i]||!isBackground(i))return;
          seen[i]=1;queue[tail++]=i;
        };
        for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}
        for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
        while(head<tail){
          const i=queue[head++],x=i%w;
          if(x>0)add(i-1);
          if(x<w-1)add(i+1);
          if(i>=w)add(i-w);
          if(i<n-w)add(i+w);
        }
        // Feather one pixel at the boundary to avoid bright checker outlines.
        for(let i=0;i<n;i++){
          if(seen[i]){p[i*4+3]=0;continue}
          const x=i%w,k=i*4;
          if(Math.min(p[k],p[k+1],p[k+2])>170&&
             ((x>0&&seen[i-1])||(x<w-1&&seen[i+1])||(i>=w&&seen[i-w])||(i<n-w&&seen[i+w]))){
            p[k+3]=Math.min(p[k+3],110);
          }
        }
        ctx.putImageData(frame,0,0);
        img.src=canvas.toDataURL('image/png');
      }catch(e){console.warn('Companion transparency processing unavailable',e)}
    };
    if(img.complete&&img.naturalWidth)run();
    else img.addEventListener('load',run,{once:true});
  }
  document.querySelectorAll('img[src*="mucem-girl-transparent.png"]').forEach(clean);
})();
