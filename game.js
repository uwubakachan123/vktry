const layer = id => document.querySelector(`[data-pencil-id="${id}"]`);
const board = layer('NVsXY');
board.innerHTML = `<div class="rush-hud"><strong>FOCUS RUSH</strong><div>SCORE <b id="score">000</b></div><div>TIME <b id="time">30s</b></div><div>BEST <b id="best">000</b></div><button id="sound" aria-label="Toggle sound" aria-pressed="false">SOUND OFF</button></div><div id="arena" role="region" aria-label="Focus Rush reaction game"><div id="overlay"><h3>Ready. Set. Lock in.</h3><p>Tap blue bolts +10. Avoid grey bells −15.<br>You’ve got 30 seconds. Make them count.</p><button id="start">▶ &nbsp; Let’s play</button><small>NO SIGNUP. JUST GOOD REFLEXES.</small></div></div><div class="rush-hint"><span>⚡ BLUE BOLTS = ENERGY &nbsp; / &nbsp; GREY BELLS = DISTRACTIONS</span><span>CLICK, TAP OR TAB + ENTER</span></div><p id="status" class="sr-only" role="status" aria-live="polite"></p>`;
const $ = id => document.getElementById(id);
let score = 0, running = false, end = 0, spawnTimer, tickTimer, sound = false, audio;
let best = 0;
try { best = Number(localStorage.getItem('vktry-best')) || 0; } catch {}
$('best').textContent = String(best).padStart(3,'0');
function beep(good) {
  if (!sound) return;
  try { audio ||= new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); const osc=audio.createOscillator(), gain=audio.createGain(); osc.connect(gain);gain.connect(audio.destination);osc.frequency.value=good?740:180;gain.gain.setValueAtTime(.08,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.12);osc.start();osc.stop(audio.currentTime+.13); } catch {}
}
$('sound').onclick = () => { sound=!sound; $('sound').textContent=sound?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-pressed',String(sound));beep(true); };
function spawn() {
  if (!running) return;
  const arena=$('arena'), good=Math.random()>.25, target=document.createElement('button');
  target.className='rush-target '+(good?'energy':'noise');
  target.setAttribute('aria-label',good?'Energy bolt: plus 10 points':'Distraction: minus 15 points');
  target.innerHTML=good?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 10-13h-8z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4M3 3l18 18"/></svg>';
  const size=64, width=arena.clientWidth, height=arena.clientHeight;
  let x,y,tries=0;
  do {x=12+Math.random()*Math.max(0,width-size-24);y=12+Math.random()*Math.max(0,height-size-24);tries++;} while(tries<20&&[...arena.querySelectorAll('.rush-target')].some(t=>Math.abs(parseFloat(t.style.left)-x)<74&&Math.abs(parseFloat(t.style.top)-y)<74));
  if(tries>=20)return;
  target.style.left=x+'px';target.style.top=y+'px';
  let used=false;
  const expiry=setTimeout(()=>target.remove(),Math.max(850,1700-(30-(end-performance.now())/1000)*18));
  target.onclick=()=>{if(!running||used)return;used=true;clearTimeout(expiry);score=Math.max(0,score+(good?10:-15));$('score').textContent=String(score).padStart(3,'0');beep(good);const flash=document.createElement('span');flash.className='rush-points '+(good?'':'negative');flash.textContent=good?'+10':'−15';flash.style.left=x+'px';flash.style.top=y+'px';arena.append(flash);setTimeout(()=>flash.remove(),550);target.remove();};
  arena.append(target);
}
function finish() {
  running=false;clearInterval(spawnTimer);clearInterval(tickTimer);
  document.querySelectorAll('.rush-target,.rush-points').forEach(t=>t.remove());
  const record=score>best;
  best=Math.max(best,score);try{localStorage.setItem('vktry-best',String(best));}catch{}
  $('best').textContent=String(best).padStart(3,'0');$('time').textContent='0s';
  const overlay=$('overlay');overlay.hidden=false;
  overlay.querySelector('h3').textContent=record?'New personal best!':score>=200?'Seriously locked in.':'That’s your warm-up.';
  overlay.querySelector('p').textContent=`You scored ${score} points. ${record?'You just raised the bar.':'Ready to beat your best of '+best+'?'}`;
  $('start').textContent='↻  Play again';$('status').textContent=`Game over. Score ${score}. Best ${best}.`;$('start').focus({preventScroll:true});
}
$('start').onclick=()=>{if(running)return;score=0;running=true;end=performance.now()+30000;$('score').textContent='000';$('time').textContent='30s';$('overlay').hidden=true;$('status').textContent='Game started. Catch blue bolts and avoid grey bells.';spawn();spawnTimer=setInterval(spawn,430);tickTimer=setInterval(()=>{const left=Math.max(0,Math.ceil((end-performance.now())/1000));$('time').textContent=left+'s';if(!left)finish();},100);};
function link(id,target){const el=layer(id);if(!el||!layer(target))return;el.style.cursor='pointer';el.tabIndex=0;el.setAttribute('role','link');const go=()=>layer(target).scrollIntoView({behavior:'smooth',block:'start'});el.onclick=go;el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go();}};}
for(const id of ['E0y7Sl','sjRWd','nWBbp','xYVo9'])link(id,'TXgBE');link('vyYj3','rPyHj');link('pB9Jt','lN172');
const answers=['Each can has 80mg of caffeine — about one cup of coffee.','L-theanine is paired with caffeine to support smoother focus and fewer jitters.','VKTRY is for adults looking for focused energy. Not recommended for children under 16, pregnant or breastfeeding women, or people sensitive to caffeine.'];
['r7NLu0','GGcLY','RdlMe'].forEach((id,i)=>{const row=layer(id);if(!row)return;const wrap=document.createElement('div'),answer=document.createElement('p');wrap.className='faq-wrap';row.before(wrap);wrap.append(row,answer);answer.textContent=answers[i];answer.hidden=true;row.tabIndex=0;row.setAttribute('role','button');row.setAttribute('aria-expanded','false');const toggle=()=>{answer.hidden=!answer.hidden;row.setAttribute('aria-expanded',String(!answer.hidden));};row.onclick=toggle;row.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}};});
document.title='VKTRY — Focus Rush';
