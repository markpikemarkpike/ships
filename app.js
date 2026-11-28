let D=null, byId={};
const $=q=>document.querySelector(q);
// Ship names come off the radio: escape everything before it touches the page
const esc=x=>String(x==null?'':x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const flag=cc=>/^[A-Z]{2}$/.test(cc||'')?String.fromCodePoint(...[...cc].map(c=>0x1F1E6+c.charCodeAt(0)-65))+' ':'';
const dt=s=>new Date(s.length==10?s+'T12:00':s);
const fmt=(s,o)=>dt(s).toLocaleDateString('en-US',o);
const longDay=s=>fmt(s,{weekday:'long',month:'long',day:'numeric',year:'numeric'});
const shortDay=s=>fmt(s,{month:'short',day:'numeric'});
const clock=s=>dt(s).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'});
const iso=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
function facts(p){ return [flag(p.country)+p.label, p.length_m?p.length_m+' m':'', p.nmi!=null?Math.round(p.nmi)+' nmi off':''].filter(Boolean).map(esc).join(' · '); }
function pic(p,big){ return `<button class="pic${big?'':' s'}" type="button" data-id="${esc(p.id)}"><img ${big?'':'loading="lazy"'} width="800" height="480" src="${esc(big?p.img:p.thumb)}" alt="Watercolor of ${esc(p.name)}, ${esc(p.label.toLowerCase())}"></button>`; }

function home(){
  const now=byId[D.now], days=Object.keys(D.picks).sort().slice(-7).reverse();
  const kinds={}; for(const s of D.ships)(kinds[s.label]=kinds[s.label]||[]).push(s);
  const order=Object.keys(kinds).sort((a,b)=>kinds[a].length-kinds[b].length||a.localeCompare(b));   // rarest first
  return `
  <section aria-labelledby="h-wall">
    <h2 id="h-wall">On the wall now</h2>
    <p class="note">The same picture that is hanging in the cabin.</p>
    <div class="wall">
      ${pic(now,true)}
      <div>
        <h3>${esc(now.name)}</h3>
        <div class="caps"><b>${facts(now)}</b><br>${esc(now.wx)}<br>Painted ${esc(shortDay(now.day))}, ${esc(clock(now.at))}</div>
        <div class="heard"><b>${D.heard_24h}</b> ships heard in the last 24 hours.${D.heard?' <a href="#/log">See the list</a>':''}</div>
      </div>
    </div>
  </section>
  <section aria-labelledby="h-day">
    <h2 id="h-day">Ship of the day</h2>
    <p class="note">One pick a day. New faces and rare kinds come first, then the closest pass.</p>
    <div class="week">${days.map(d=>{const p=byId[D.picks[d]];return `<div>${pic(p)}
      <h3>${esc(p.name)}</h3><div class="caps"><b>${esc(fmt(d,{weekday:'short',month:'short',day:'numeric'}))}</b><br>${esc([p.label].concat(p.why.slice(0,1)).join(' · '))}</div></div>`}).join('')}</div>
    <a class="more" href="#/calendar">Every day on the calendar</a>
  </section>
  <section aria-labelledby="h-life">
    <h2 id="h-life">Life list</h2>
    <p class="note">${D.ships.length} different ships painted since ${esc(fmt(D.since,{month:'long',year:'numeric'}))}. Each appears once, however often she passes. Rarest kinds first.</p>
    ${order.map(k=>`<h3 class="kind caps"><b>${esc(k)}</b><span>${kinds[k].length}</span></h3>
      <div class="grid">${kinds[k].map(s=>`<div>${pic(byId[s.id])}<h3>${esc(s.name)}</h3>
        <div class="caps">${s.times>1?'Painted '+s.times+' times since ':'Painted '}${esc(shortDay(s.first))}</div></div>`).join('')}</div>`).join('')}
  </section>`;
}

function calendar(){
  const days=Object.keys(D.picks).sort(), a=dt(days[0]), z=dt(days[days.length-1]); let out='';
  for(let y=z.getFullYear(),m=z.getMonth(); y>a.getFullYear()||(y==a.getFullYear()&&m>=a.getMonth()); m?m--:(m=11,y--)){
    const n=new Date(y,m+1,0).getDate(), lead=new Date(y,m,1).getDay(); let c='';
    for(const w of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']) c+=`<div class="dow">${w}</div>`;
    for(let i=0;i<lead;i++) c+='<div class="d pad"></div>';
    for(let d=1;d<=n;d++){ const k=iso(new Date(y,m,d)), p=byId[D.picks[k]];
      c+=p?`<a class="d" href="#/day/${k}" title="${esc(p.name)}"><i>${d}</i><img loading="lazy" src="${esc(p.thumb)}" alt="${esc(shortDay(k))}: ${esc(p.name)}"></a>`:`<div class="d none${k>=D.generated.slice(0,10)?' later':''}"><i>${d}</i></div>`; }
    out+=`<div class="month"><h2>${esc(new Date(y,m,1).toLocaleDateString('en-US',{month:'long',year:'numeric'}))}</h2><div class="cal">${c}</div></div>`;
  }
  return `<section aria-labelledby="h-cal">${out}</section>`;
}

// Beside the masthead while the calendar shows: the words, and the newest pick hung large
function above(){
  const k=Object.keys(D.picks).sort().reverse().find(d=>byId[D.picks[d]]), p=byId[D.picks[k]];
  return [`<h2 id="h-cal">Ship of the day</h2>
    <p class="note">One ship for every day, chosen from the paintings the frame made that day. Open a square to see her. Empty squares are days the frame or its radio was offline.</p>`,
    p&&!D.everything?`${pic(p,true)}<figcaption><h3><a href="#/day/${esc(k)}">${esc(p.name)}</a></h3>
    <div class="caps"><b>${esc(fmt(k,{weekday:'long',month:'long',day:'numeric'}))}</b></div></figcaption>`:''];
}

function day(k){
  const days=Object.keys(D.picks).sort(), i=days.indexOf(k);
  const all=D.paintings.filter(p=>p.day==k), top=byId[D.picks[k]], rest=all.filter(p=>p!==top);
  return `<section><div class="dayhead"><h2>${esc(longDay(k))}</h2>
      ${i>0?`<a href="#/day/${days[i-1]}">← ${esc(shortDay(days[i-1]))}</a>`:''}${i<days.length-1?`<a href="#/day/${days[i+1]}">${esc(shortDay(days[i+1]))} →</a>`:''}<a href="${D.everything?'#/calendar':'#/'}">Calendar</a></div>
    <div class="wall">${pic(top,true)}<div><div class="caps" style="margin-bottom:6px"><b>Ship of the day</b></div><h3>${esc(top.name)}</h3>
      <div class="caps"><b>${facts(top)}</b><br>${esc(top.wx)}${top.why.length?'<br>'+esc(top.why.join(' · ')):''}<br>Picked from ${D.painted[k]} painting${D.painted[k]==1?'':'s'} that day</div></div></div>
    ${rest.length?`<h3 class="kind caps"><b>Also painted that day</b><span>${rest.length}</span></h3><div class="grid">${rest.map(p=>`<div>${pic(p)}<h3>${esc(p.name)}</h3><div class="caps">${esc(clock(p.at))} · ${esc(p.label)}</div></div>`).join('')}</div>`:''}
  </section>`;
}

function log(){
  return `<section aria-labelledby="h-log"><h2 id="h-log">Heard lately</h2>
    <p class="note">Named vessels the receiver has heard within 100 nautical miles over the last three days. Most are never painted: the frame makes one picture an hour.</p>
    <div class="scroll"><table><thead><tr><th>Vessel</th><th>Type</th><th>Flag</th><th>Closest</th><th>Last heard</th></tr></thead><tbody>
    ${D.heard.map(h=>`<tr><td class="n">${esc(h.name)}</td><td>${esc(h.label)}</td><td>${flag(h.country)}${esc(h.country)}</td><td>${h.nmi!=null?Math.round(h.nmi)+' nmi':''}</td><td>${h.last?esc(shortDay(h.last.slice(0,10)))+', '+esc(clock(h.last)):''}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}

function route(){
  if(!D) return;
  const h=location.hash.replace(/^#\/?/,''), m=h.match(/^day\/(\d{4}-\d\d-\d\d)$/), k=m&&byId[D.picks[m[1]]]?m[1]:'';
  const r=m?'calendar':(h=='calendar'||h=='log')?h:'home', cal=!k&&(m||!D.everything||h=='calendar');   // a day with no ship: the calendar
  const html = k?day(k) : cal?calendar() : h=='log'?log() : home(); let up=['',''];   // all built first, so a throw leaves the old page whole
  if(cal) try{ up=above(); }catch(e){ console.error(e); }   // the calendar never goes down with the picture above it
  $('#stage').innerHTML=($('#lede')?'':up[0])+html;          // a cached older index.html has neither place: keep the words at least
  ['#lede','#latest'].forEach((q,i)=>{ const e=$(q); if(e) e.innerHTML=up[i]; });
  $('#nav').hidden=!D.everything;
  document.querySelectorAll('nav a').forEach(a=>a.dataset.r==r?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current'));
  window.scrollTo(0,0);
}
let back=null;
function shut(){ $('#lb').classList.remove('on'); if(back){back.focus();back=null;} }
document.addEventListener('click',e=>{
  if(e.target.closest('#lb')) return shut();
  const b=e.target.closest('.pic'); if(!b) return;
  const p=byId[b.dataset.id]; if(!p) return; back=b;
  $('#lb img').src=p.img; $('#lb img').alt='Watercolor of '+p.name;
  $('#lb div').innerHTML=`<b>${esc(p.name)}</b>${facts(p)}<br>${esc(longDay(p.day))}`;
  $('#lb').classList.add('on');
});
document.addEventListener('keydown',e=>{ if(e.key=='Escape') shut(); });
addEventListener('hashchange',route);
fetch('data.json',{cache:'no-cache'}).then(r=>r.json()).then(d=>{ D=d; for(const p of d.paintings) byId[p.id]=p;
  $('#gen').textContent='Updated '+shortDay(d.generated.slice(0,10))+', '+clock(d.generated)+' by the frame itself.'; route(); })
 .catch(e=>{ console.error(e); $('#stage').innerHTML='<p class="note" style="margin-top:40px">The logbook could not be loaded. Try again in a minute.</p>'; });
