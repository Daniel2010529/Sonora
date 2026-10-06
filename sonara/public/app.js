const seed=[
 {id:'1',title:'Midnight Drive',artist:'Nova Grey',genre:'Electronic',cover:'NG',coverClass:'cover-violet',plays:128400,duration:'3:42',description:'Synths nocturnos y carretera vacía.',liked:false},
 {id:'2',title:'Afterglow',artist:'Luna Vale',genre:'Pop',cover:'LV',coverClass:'cover-pink',plays:94700,duration:'3:18',description:'Pop brillante para las últimas horas.',liked:true},
 {id:'3',title:'Slow Motion',artist:'Kairo',genre:'R&B',cover:'KA',coverClass:'cover-teal',plays:81700,duration:'3:55',description:'R&B suave con una producción cálida.',liked:false},
 {id:'4',title:'Golden Hour',artist:'Milo West',genre:'Indie',cover:'MW',coverClass:'cover-gold',plays:76500,duration:'4:02',description:'Guitarras, sol y nostalgia.',liked:true},
 {id:'5',title:'Digital Bloom',artist:'Aster',genre:'Electronic',cover:'AS',coverClass:'cover-blue',plays:64300,duration:'2:58',liked:false},
 {id:'6',title:'Velvet Room',artist:'Nia Sol',genre:'R&B',cover:'NS',coverClass:'cover-pink',plays:52100,duration:'3:27',liked:false},
 {id:'7',title:'No Signal',artist:'Keen',genre:'Hip-Hop',cover:'KN',coverClass:'cover-violet',plays:49300,duration:'2:49',liked:false},
 {id:'8',title:'Sunday Club',artist:'Milo West',genre:'Indie',cover:'MW',coverClass:'cover-gold',plays:43800,duration:'3:36',liked:false}
];
let tracks=JSON.parse(localStorage.getItem('sonaraTracks')||'null')||seed;
let playlists=JSON.parse(localStorage.getItem('sonaraPlaylists')||'null')||['Favoritos','Descubrimientos','Para entrenar'];
let current=0, playing=false, repeat=false, shuffle=false, playHistory=[], audioUrl=null;
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const audio=$('#audio'), toastEl=$('#toast');
const esc=x=>String(x??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt=s=>Number.isFinite(s)?`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`:'0:00';
function toast(m){toastEl.textContent=m;toastEl.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>toastEl.classList.remove('show'),2200)}
function save(){localStorage.setItem('sonaraTracks',JSON.stringify(tracks.map(({url,...t})=>t)));localStorage.setItem('sonaraPlaylists',JSON.stringify(playlists))}
function card(t,i){return `<article class="track-card"><div class="cover ${t.coverClass||'cover-violet'}">${esc(t.cover)}</div><button class="track-play" data-play="${i}">▶</button><h3>${esc(t.title)}</h3><p>${esc(t.artist)} · ${esc(t.genre)}</p></article>`}
function renderHome(){
 $('#recentGrid').innerHTML=tracks.slice(0,4).map((t,i)=>card(t,i)).join('');
 const f=tracks.slice().sort(()=>Math.random()-.5).slice(0,3);
 $('#featureGrid').innerHTML=f.map((t,i)=>`<article class="feature ${i===0?'large':''}"><span class="eyebrow">${i===0?'MIX EDITORIAL':'DESCUBRIMIENTO'}</span><h3>${esc(t.title)}<br>${esc(t.artist)}</h3><p>${esc(t.description||'Un nuevo sonido esperando a ser descubierto.')}</p><span class="feature-tag">${esc(t.genre)} · ${t.duration||'—'}</span><div class="big-art"></div></article>`).join('');
 $('#trendChart').innerHTML=tracks.slice(0,5).sort((a,b)=>b.plays-a.plays).map((t,i)=>`<div class="chart-row"><span class="rank">0${i+1}</span><div class="chart-cover ${t.coverClass}">${esc(t.cover)}</div><div><b>${esc(t.title)}</b><small>${esc(t.artist)}</small><div class="bar"><i style="width:${Math.max(25,Math.round(t.plays/tracks[0].plays*100))}%"></i></div></div><span class="plays">${Math.round(t.plays/1000)}k</span></div>`).join('');
 const artists=[...new Map(tracks.map(t=>[t.artist,t])).values()].slice(0,4);
 $('#artistList').innerHTML=artists.map(t=>`<div class="artist-item"><div class="artist-avatar">${esc(t.cover)}</div><div><b>${esc(t.artist)}</b><small>${esc(t.genre)} · ${Math.round(t.plays/1000)}k plays</small></div><button class="follow-btn" data-follow="${esc(t.artist)}">Seguir</button></div>`).join('');
}
function renderSide(){ $('#sidePlaylists').innerHTML=playlists.map(p=>`<button class="side-play">${esc(p)}</button>`).join('') }
function renderLibrary(tab='songs'){
 $('#songCount').textContent=tracks.length; $$('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
 if(tab==='songs') $('#libraryContent').innerHTML=`<div class="library-table">${tracks.map((t,i)=>`<div class="library-row"><div class="library-cover ${t.coverClass}">${esc(t.cover)}</div><div><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><span>${esc(t.genre)}</span><span>${esc(t.duration||'—')}</span><button class="row-play" data-play="${i}">▶</button></div>`).join('')}</div>`;
 if(tab==='playlists') $('#libraryContent').innerHTML=`<div class="playlist-grid">${playlists.map((p,i)=>`<article class="playlist-card"><div class="playlist-art">${i===0?'♥':i===1?'✦':'↗'}</div><h3>${esc(p)}</h3><p>${tracks.length} canciones · Tu playlist</p></article>`).join('')}</div>`;
 if(tab==='liked'){const liked=tracks.filter(t=>t.liked);$('#libraryContent').innerHTML=liked.length?`<div class="library-table">${liked.map(t=>{const i=tracks.indexOf(t);return `<div class="library-row"><div class="library-cover ${t.coverClass}">${esc(t.cover)}</div><div><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><span>${esc(t.genre)}</span><span>${esc(t.duration||'—')}</span><button class="row-play" data-play="${i}">▶</button></div>`}).join('')}</div>`:'<div class="empty">Aún no tienes canciones con me gusta.</div>'}
}
function renderFollowing(){const artists=[...new Map(tracks.map(t=>[t.artist,t])).values()];$('#followingGrid').innerHTML=artists.map(t=>`<article class="artist-big"><div class="artist-avatar">${esc(t.cover)}</div><h3>${esc(t.artist)}</h3><p>${esc(t.genre)} · ${Math.round(t.plays/1000)}k oyentes</p><button class="follow-btn">Siguiendo</button></article>`).join('')}
function renderSearch(q=''){q=q.trim().toLowerCase();const found=q?tracks.filter(t=>`${t.title} ${t.artist} ${t.genre}`.toLowerCase().includes(q)):tracks.slice(0,6);$('#searchResults').innerHTML=found.length?found.map(t=>{const i=tracks.indexOf(t);return `<div class="result"><div class="result-cover ${t.coverClass}">${esc(t.cover)}</div><div class="result-info"><b>${esc(t.title)}</b><span>${esc(t.artist)}</span></div><span class="result-genre">${esc(t.genre)}</span><button class="small-play" data-play="${i}">▶</button></div>`}).join(''):`<div class="empty">No encontramos “${esc(q)}”. Prueba otro término.</div>`}
function showView(name){$$('.view').forEach(v=>v.classList.remove('active'));$(`#${name}View`)?.classList.add('active');$$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.view===name));if(name==='search')renderSearch($('#globalSearch').value)}
function load(i,autoplay=true){if(!tracks[i])return;current=i;const t=tracks[i];$('#playerTitle').textContent=t.title;$('#playerArtist').textContent=`${t.artist} · ${t.genre}`;$('#playerCover').textContent=t.cover;$('#playerCover').className=`player-cover ${t.coverClass}`;if(t.url){if(audioUrl)URL.revokeObjectURL(audioUrl);audioUrl=t.url;audio.src=t.url;if(autoplay)audio.play().catch(()=>{});playing=autoplay}else{playing=autoplay;toast('Esta demo no tiene audio. Sube una canción para reproducirla aquí.')}$('#playBtn').textContent=playing?'Ⅱ':'▶';renderQueue()}
function next(){let i;if(shuffle)i=Math.floor(Math.random()*tracks.length);else i=(current+1)%tracks.length;playHistory.push(current);load(i,true)}
function prev(){if(audio.currentTime>4){audio.currentTime=0;return}load(playHistory.pop()??(current-1+tracks.length)%tracks.length,true)}
function renderQueue(){const order=tracks.map((t,i)=>({t,i}));$('#queueList').innerHTML=order.map(({t,i})=>`<div class="queue-item ${i===current?'current':''}"><div class="qcover ${t.coverClass}">${esc(t.cover)}</div><div><b>${esc(t.title)}</b><small>${esc(t.artist)}</small></div><button data-play="${i}">▶</button></div>`).join('')}
function openPlaylistModal(){
 $('#modalContent').innerHTML=`<span class="eyebrow">TU BIBLIOTECA</span><h2>Nueva playlist</h2><p>Crea una colección para guardar tus próximos descubrimientos.</p><input class="modal-input" id="playlistName" placeholder="Nombre de la playlist" maxlength="40"><button class="btn primary full" id="savePlaylist">Crear playlist</button>`;$('#modal').classList.add('open');setTimeout(()=>$('#playlistName').focus(),50)
}
function openNotification(){toast('No tienes notificaciones nuevas ✦')}
// navegación
addEventListener('click',e=>{
 const play=e.target.closest('[data-play]');if(play){load(Number(play.dataset.play),true);return}
 const view=e.target.closest('[data-view]');if(view){showView(view.dataset.view);return}
 const follow=e.target.closest('[data-follow]');if(follow){follow.textContent='Siguiendo';follow.style.color='var(--lime)';toast(`Siguiendo a ${follow.dataset.follow}`);return}
 const query=e.target.closest('[data-query]');if(query){$('#globalSearch').value=query.dataset.query;showView('search');renderSearch(query.dataset.query);return}
 if(e.target.closest('#heroPlay')){load(0,true);return}
 if(e.target.closest('#shuffleBtn')){tracks.sort(()=>Math.random()-.5);renderHome();toast('Tu portada ha cambiado ✦');return}
 if(e.target.closest('#playBtn')){if(!audio.src){load(current,true);return}if(audio.paused){audio.play();playing=true}else{audio.pause();playing=false}$('#playBtn').textContent=playing?'Ⅱ':'▶';return}
 if(e.target.closest('#nextBtn')){next();return} if(e.target.closest('#prevBtn')){prev();return}
 if(e.target.closest('#repeatBtn')){repeat=!repeat;toast(repeat?'Repetición activada':'Repetición desactivada');return}
 if(e.target.closest('#shuffleBtnPlayer')){shuffle=!shuffle;toast(shuffle?'Aleatorio activado':'Aleatorio desactivado');return}
 if(e.target.closest('#likeBtn')){tracks[current].liked=!tracks[current].liked;$('#likeBtn').classList.toggle('liked',tracks[current].liked);$('#likeBtn').textContent=tracks[current].liked?'♥':'♡';save();return}
 if(e.target.closest('#queueBtn')){$('#queuePanel').classList.toggle('open');renderQueue();return}
 if(e.target.closest('#closeQueue')){$('#queuePanel').classList.remove('open');return}
 if(e.target.closest('#notificationBtn')){openNotification();return}
 if(e.target.closest('[data-action="createPlaylist"]')){openPlaylistModal();return}
 if(e.target.closest('#modalClose')){$('#modal').classList.remove('open');return}
 if(e.target.closest('#savePlaylist')){const n=$('#playlistName').value.trim();if(!n){toast('Ponle un nombre a la playlist');return}playlists.unshift(n);save();renderSide();$('#modal').classList.remove('open');toast('Playlist creada ✓');return}
 const tab=e.target.closest('[data-tab]');if(tab){renderLibrary(tab.dataset.tab);return}
});
$('#globalSearch').addEventListener('input',e=>{showView('search');renderSearch(e.target.value)});
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#globalSearch').focus()}if(e.code==='Space'&&document.activeElement.tagName!=='INPUT'&&document.activeElement.tagName!=='TEXTAREA'){e.preventDefault();$('#playBtn').click()}});
$('#backBtn').onclick=()=>window.history.back();$('#nextBtn').onclick=()=>window.history.forward();
$('#volume').oninput=e=>audio.volume=e.target.value;audio.volume=.8;
$('#progressBar').oninput=e=>{if(audio.duration)audio.currentTime=e.target.value/100*audio.duration};
audio.addEventListener('timeupdate',()=>{$('#currentTime').textContent=fmt(audio.currentTime);$('#progressBar').value=audio.duration?audio.currentTime/audio.duration*100:0});
audio.addEventListener('loadedmetadata',()=>$('#totalTime').textContent=fmt(audio.duration));
audio.addEventListener('play',()=>{playing=true;$('#playBtn').textContent='Ⅱ'});audio.addEventListener('pause',()=>{playing=false;$('#playBtn').textContent='▶'});audio.addEventListener('ended',()=>{if(repeat){audio.currentTime=0;audio.play()}else next()});
const input=$('#audioFile'),drop=$('#dropzone');$('#chooseAudio').onclick=()=>input.click();
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('drag')}));['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('drag')}));drop.addEventListener('drop',e=>{if(e.dataTransfer.files[0]){input.files=e.dataTransfer.files;showFile(e.dataTransfer.files[0])}});input.addEventListener('change',()=>input.files[0]&&showFile(input.files[0]));
function showFile(f){drop.querySelector('h2').textContent=f.name;toast('Audio seleccionado ✓');if(!$('#songTitle').value)$('#songTitle').value=f.name.replace(/\.[^.]+$/,'')}
$('#uploadForm').addEventListener('submit',async e=>{e.preventDefault();const f=input.files[0];if(!f){toast('Selecciona un archivo de audio');return}if(f.size>100*1024*1024){toast('El archivo supera 100 MB');return}const id=crypto.randomUUID();const t={id,title:$('#songTitle').value.trim(),artist:$('#songArtist').value.trim(),genre:$('#songGenre').value,cover:$('#songArtist').value.trim().slice(0,2).toUpperCase()||'ME',coverClass:['cover-violet','cover-pink','cover-teal','cover-gold','cover-blue'][tracks.length%5],plays:0,duration:'—',description:$('#songDescription').value.trim()||'Publicado desde Creator Studio',liked:false,url:URL.createObjectURL(f),fileName:f.name};tracks.unshift(t);save();renderAll();load(0,false);showView('home');e.target.reset();drop.querySelector('h2').textContent='Arrastra tu audio aquí';toast('¡Canción publicada en tu biblioteca! ✦')});
function renderAll(){renderHome();renderSide();renderLibrary();renderFollowing();renderQueue();$('#studioPlays').textContent=tracks.reduce((a,t)=>a+(t.plays||0),0).toLocaleString('es-ES')}
renderAll();load(0,false);

/* SONARA CLOUD LAYER — Supabase Auth + Storage + Render API */
let sb=null, cloudUser=null, authMode='login';
async function cloudInit(){
  try{
    const cfg=await fetch('/api/config').then(r=>r.json());
    if(!cfg.supabaseUrl||!cfg.supabaseAnonKey) return;
    sb=window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    const {data}=await sb.auth.getSession(); cloudUser=data.session?.user||null; updateAuthUI();
    sb.auth.onAuthStateChange((_event,session)=>{cloudUser=session?.user||null; updateAuthUI();});
  }catch(e){console.warn('Cloud disabled',e)}
}
function updateAuthUI(){
  const btn=$('#authBtn'), chip=$('#userChip'); if(!btn||!chip)return;
  if(cloudUser){btn.hidden=true;chip.hidden=false;const name=cloudUser.user_metadata?.display_name||cloudUser.email?.split('@')[0]||'Usuario';$('#userLabel').textContent=name;$('#userAvatar').textContent=name.slice(0,2).toUpperCase();}
  else{btn.hidden=false;chip.hidden=true;}
}
function openAuth(){ $('#authModal').classList.add('open'); $('#authStatus').textContent=''; $('#authName').style.display=authMode==='signup'?'block':'none'; $('#authTitle').textContent=authMode==='signup'?'Crea tu cuenta':'Entra en SONARA'; $('#authSubmit').textContent=authMode==='signup'?'Crear cuenta':'Entrar'; $('#authToggle').textContent=authMode==='signup'?'¿Ya tienes cuenta? Entrar':'¿No tienes cuenta? Crear cuenta'; }
$('#authBtn')?.addEventListener('click',openAuth);
$('#authClose')?.addEventListener('click',()=>$('#authModal').classList.remove('open'));
$('#authToggle')?.addEventListener('click',()=>{authMode=authMode==='login'?'signup':'login';openAuth()});
$('#authForm')?.addEventListener('submit',async e=>{e.preventDefault(); if(!sb){$('#authStatus').textContent='Configura Supabase para activar las cuentas.';return} const email=$('#authEmail').value.trim(),password=$('#authPassword').value,name=$('#authName').value.trim();let r;if(authMode==='signup')r=await sb.auth.signUp({email,password,options:{data:{display_name:name||email.split('@')[0]}}});else r=await sb.auth.signInWithPassword({email,password}); if(r.error){$('#authStatus').textContent=r.error.message;return} $('#authStatus').textContent=authMode==='signup'?'Revisa tu email para confirmar la cuenta.':'¡Bienvenido a SONARA!'; if(authMode==='login')setTimeout(()=>$('#authModal').classList.remove('open'),500)});
$('#userChip')?.addEventListener('click',async()=>{if(cloudUser&&sb){await sb.auth.signOut();toast('Sesión cerrada');}});

const originalSubmit=document.querySelector('#uploadForm');
if(originalSubmit){ originalSubmit.addEventListener('submit', async e=>{
  if(!sb||!cloudUser) return; // existing local handler remains for demo; cloud upload continues in parallel
  e.preventDefault(); e.stopImmediatePropagation();
  const f=$('#audioFile').files[0]; if(!f)return;
  if(f.size>100*1024*1024){toast('El archivo supera 100 MB');return}
  const path=`${cloudUser.id}/${crypto.randomUUID()}-${f.name.replace(/[^a-zA-Z0-9._-]/g,'_')}`;
  const {error:up}=await sb.storage.from('tracks').upload(path,f,{contentType:f.type||'audio/mpeg',upsert:false});
  if(up){toast('No se pudo subir el audio: '+up.message);return}
  const {data:pub}=sb.storage.from('tracks').getPublicUrl(path);
  const payload={owner_id:cloudUser.id,title:$('#songTitle').value.trim(),artist_name:$('#songArtist').value.trim(),genre:$('#songGenre').value,description:$('#songDescription').value.trim(),visibility:$('#songVisibility').value==='Público'?'public':'private',audio_path:path};
  const {error:dbErr}=await sb.from('tracks').insert(payload);
  if(dbErr){await sb.storage.from('tracks').remove([path]);toast('Audio subido, pero no se guardó la canción: '+dbErr.message);return}
  const t={id:crypto.randomUUID(),title:payload.title,artist:payload.artist_name,genre:payload.genre,cover:payload.artist_name.slice(0,2).toUpperCase()||'ME',coverClass:'cover-violet',plays:0,duration:'—',description:payload.description||'Publicado desde Creator Studio',liked:false,url:pub.publicUrl,fileName:f.name};tracks.unshift(t);save();renderAll();load(0,false);showView('home');e.target.reset();$('#dropzone').querySelector('h2').textContent='Arrastra tu audio aquí';toast('Publicado en SONARA Cloud ✓');
 },true); }

async function loadCloudTracks(){ if(!sb)return; try{const rows=await fetch('/api/tracks').then(r=>r.json()); if(!Array.isArray(rows))return; const cloud=rows.map(t=>({id:t.id,title:t.title,artist:t.artist_name,genre:t.genre||'Music',cover:(t.artist_name||'SO').slice(0,2).toUpperCase(),coverClass:'cover-violet',plays:t.plays||0,duration:'—',description:t.description||'',liked:false,url:t.audio_url})); if(cloud.length){tracks=cloud.concat(tracks.filter(x=>x.url?.startsWith('blob:')||x.url?.startsWith('data:'))); renderAll();}}catch(e){console.warn(e)} }
cloudInit().then(loadCloudTracks);
