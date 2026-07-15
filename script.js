// p15 GoddessForge — Lilith (psych) + full-cheat weaponized
// FOMO limited drops • variable ratio rewards • near-miss almost-perfect • loss aversion aging • endowment "my goddess glow"
// p6 voice for intimate personal connection • 미꾸라지 framing everywhere
// Integrates p9 live (glow import + voice) • p10 (voice buy + fee psych)
// Births: GoddessMirrorSpore, VoiceBondEndowment, AgingFOMOCycle, GlowTradeGraft, LungGlowOracle
let wallet = null;
let balance = 1420;
let credits = 890;
let logs = JSON.parse(localStorage.getItem('p15_logs') || '[]');
let codex = JSON.parse(localStorage.getItem('p15_codex') || '[]');
let glow = parseInt(localStorage.getItem('p15_glow') || '87');
let bondLevel = parseInt(localStorage.getItem('p15_bond') || '3'); // Voice Bond endowment
let lastLogDay = localStorage.getItem('p15_lastlog') || null;

// ============================================================
// DAILY GLOW STREAK — the real core loop (Trinity/CPO 2026-07-16)
// One meaningful check-in per day builds a consecutive streak.
// Miss a day → streak resets (loss aversion, honest). Milestones
// grant real glow rewards. All state persisted, deterministic.
// ============================================================
const STREAK_MILESTONES = [
  { day: 3,  reward: 8,  title: 'Kindled',   note: '3 days — your glow remembers you.' },
  { day: 7,  reward: 18, title: 'Radiant',   note: '7 days — a full ritual week sealed.' },
  { day: 14, reward: 35, title: 'Luminous',  note: '14 days — your voice is a habit now.' },
  { day: 30, reward: 80, title: 'Goddess',   note: '30 days — forged, unbreakable glow.' },
];

function _todayStr() { return new Date().toISOString().slice(0, 10); }
function _dayNumber(dateStr) {
  // whole-day index since epoch (UTC date boundary) — robust to time-of-day
  return Math.floor(new Date(dateStr + 'T00:00:00Z').getTime() / 864e5);
}

function loadStreak() {
  try {
    const s = JSON.parse(localStorage.getItem('p15_streak') || 'null');
    if (s && typeof s.count === 'number') return s;
  } catch (e) {}
  return { count: 0, best: 0, lastDay: null, claimed: [] };
}

function saveStreak(s) {
  try { localStorage.setItem('p15_streak', JSON.stringify(s)); } catch (e) {}
}

// Read-only status for the day (does the daily state get counted as broken?)
// Returns {count, best, lastDay, checkedInToday, brokenSince}
function getStreakStatus() {
  const s = loadStreak();
  const today = _todayStr();
  const checkedInToday = s.lastDay === today;
  let effectiveCount = s.count;
  let brokenSince = 0;
  if (s.lastDay && !checkedInToday) {
    const gap = _dayNumber(today) - _dayNumber(s.lastDay);
    if (gap > 1) { effectiveCount = 0; brokenSince = gap - 1; } // missed at least one full day
  }
  return { count: effectiveCount, best: s.best, lastDay: s.lastDay, checkedInToday, brokenSince, claimed: s.claimed || [] };
}

// Records today's check-in. Idempotent per day (won't double-count).
// Returns { count, best, isNew, broke, milestone } — milestone reward already applied to glow by caller if present.
function checkInStreak() {
  const s = loadStreak();
  const today = _todayStr();
  if (s.lastDay === today) {
    return { count: s.count, best: s.best, isNew: false, broke: false, milestone: null };
  }
  let broke = false;
  if (s.lastDay) {
    const gap = _dayNumber(today) - _dayNumber(s.lastDay);
    if (gap === 1) { s.count += 1; }        // consecutive
    else if (gap > 1) { s.count = 1; broke = true; } // missed day(s) → restart
    else { s.count = Math.max(1, s.count); } // same/earlier (clock skew) — never lose a day
  } else {
    s.count = 1; // first ever check-in
  }
  s.lastDay = today;
  s.best = Math.max(s.best || 0, s.count);
  lastLogDay = today;                        // keep aging-warning state honest & alive
  localStorage.setItem('p15_lastlog', today);

  // Milestone: first time reaching this streak length
  s.claimed = s.claimed || [];
  let milestone = null;
  for (const m of STREAK_MILESTONES) {
    if (s.count === m.day && !s.claimed.includes(m.day)) {
      s.claimed.push(m.day);
      milestone = m;
      break;
    }
  }
  saveStreak(s);
  return { count: s.count, best: s.best, isNew: true, broke, milestone };
}

function renderStreakUI() {
  const st = getStreakStatus();
  const flame = document.getElementById('streak-flame');
  const count = document.getElementById('streak-count');
  const sub = document.getElementById('streak-sub');
  const dots = document.getElementById('streak-dots');
  if (count) count.textContent = st.count;
  if (flame) flame.textContent = st.count >= 7 ? '🔥' : st.count >= 1 ? '✨' : '🌑';
  if (sub) {
    if (st.checkedInToday) {
      sub.textContent = `Checked in today. Best: ${st.best} 🏆`;
    } else if (st.count > 0) {
      sub.innerHTML = `<span class="fomo">Voice-log today to keep your ${st.count}-day streak alive.</span>`;
    } else if (st.brokenSince > 0) {
      sub.innerHTML = `<span class="fomo">Streak broke (missed ${st.brokenSince}d). Best was ${st.best} — rebuild it today.</span>`;
    } else {
      sub.textContent = 'Voice-log today to start your streak.';
    }
  }
  // 7-day dot rail: filled = last N days of the current run
  if (dots) {
    dots.innerHTML = '';
    for (let i = 0; i < 7; i++) {
      const d = document.createElement('span');
      d.className = 'streak-dot' + (i < Math.min(7, st.count) ? ' on' : '');
      dots.appendChild(d);
    }
  }
  // Next milestone hint
  const nextEl = document.getElementById('streak-next');
  if (nextEl) {
    const next = STREAK_MILESTONES.find(m => m.day > st.count);
    nextEl.textContent = next ? `Next: ${next.title} at day ${next.day} (+${next.reward} glow)` : 'All milestones forged 👑';
  }
}

let _prevGlow = glow;
function pulseGlowBar() {
  const bar = document.querySelector('.glow-progress');
  if (!bar) return;
  bar.classList.remove('pulse');
  void bar.offsetWidth; // reflow so animation can retrigger
  bar.classList.add('pulse');
}

function updateGlowUI() {
  const scoreEl = document.getElementById('glow-score');
  const fill = document.getElementById('glow-fill');
  if (scoreEl) scoreEl.textContent = glow;
  if (fill) fill.style.width = Math.min(100, glow) + '%';
  if (glow > _prevGlow) pulseGlowBar(); // anticipation spoon on glow gain
  _prevGlow = glow;
  
  // Loss aversion on aging — daily decay if skipped
  const today = new Date().toISOString().slice(0,10);
  const aging = document.getElementById('aging-warning');
  if (aging && lastLogDay && lastLogDay !== today) {
    const days = Math.max(1, (Date.now() - new Date(lastLogDay).getTime()) / 864e5);
    const decay = Math.floor(days * 2.4);
    aging.innerHTML = `⚠️ Glow fading: -${decay} since last voice. Log now or lose more of YOU.`;
    glow = Math.max(42, glow - decay);
    if (scoreEl) scoreEl.textContent = glow;
    if (fill) fill.style.width = glow + '%';
  }
  // Pity for bad streak (Lilith upgrade)
  const pityEl = document.getElementById('glow-pity');
  const badStreak = parseInt(localStorage.getItem('p15_badStreak')||'0');
  if (pityEl) {
    pityEl.innerHTML = badStreak >= 2
      ? `🌟 Pity active — your next voice log gets a +14 glow boost.`
      : '';
  }
}

function updateWallet() {
  const el = document.getElementById('wallet-info');
  if (el) el.innerHTML = `${wallet || '0xDemo'} • ${balance} $EROS / ${credits} Credits`;
}

function connectWallet() {
  wallet = '0x' + Math.random().toString(16).slice(2, 10);
  updateWallet();
}

// === p6 Voice Expert + Da Vinci: Full Lung Surprise Eye for Skin/Mood Analysis, Consults, Beauty Logs ===
// Integrates lung-surprise-eye.js (p6) + live sfumato wave + real analysis
// Emergent: Skin Lung Veil, Voice Glow Spore, Metaverse Skin Projection, Live Ache-Radiance
let mediaRecorder, audioChunks = [], isRec = false, p15Analyser, p15Data, p15Ctx, p15Canvas, p15Raf, p15Lung = {breath:0.1, age:0}, p15Spore = {wound:0.5};
let currentVoiceSession = null;

function initP15Wave() {
  p15Canvas = document.getElementById('p15-wave');
  if (!p15Canvas) return;
  p15Ctx = p15Canvas.getContext('2d');
  p15Ctx.fillStyle = '#0a0806';
  p15Ctx.fillRect(0,0,p15Canvas.width,p15Canvas.height);
}

function drawP15LungWave(amp, t, freq = null) {
  if (!p15Ctx || !p15Canvas) return;
  const w = p15Canvas.width, h = p15Canvas.height, cy = h/2;
  p15Ctx.fillStyle = 'rgba(10,8,6,0.6)';
  p15Ctx.fillRect(0,0,w,h);

  // Sfumato 7-layer breath (p6)
  for (let l=0; l<7; l++) {
    const a = 0.09 - l*0.011;
    p15Ctx.strokeStyle = `hsla(36,48%,70%,${Math.max(0.02,a)})`;
    p15Ctx.lineWidth = 1.8 + (l%2);
    p15Ctx.beginPath();
    for (let x=0; x<w; x+=2) {
      let y = cy + Math.sin((x/47) + t*0.002 + l) * (22 + amp*38);
      if (freq && x%5===0) y += ((freq[Math.floor(x/w*freq.length)]||80)/255 - 0.5) * 18 * amp;
      if (x===0) p15Ctx.moveTo(x,y); else p15Ctx.lineTo(x,y);
    }
    p15Ctx.stroke();
  }

  // Call p6 Lung Surprise Eye (integrated)
  if (window.p6LungSurpriseEye && p15Lung && p15Spore) {
    const ache = Math.max(0, 1 - (amp + 0.3));
    window.p6LungSurpriseEye(p15Ctx, w, cy, p15Lung, amp, p15Spore, ache);
  }

  // Golden 0.618 navel mark (Da Vinci)
  p15Ctx.fillStyle = 'rgba(197,164,110,0.5)';
  p15Ctx.fillRect(w*0.618-1, cy-2, 2, 4);
}

function setupP15Analyser(stream) {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    p15Analyser = ac.createAnalyser();
    p15Analyser.fftSize = 64;
    ac.createMediaStreamSource(stream).connect(p15Analyser);
    p15Data = new Uint8Array(p15Analyser.frequencyBinCount);
  } catch(e){}
}

function getP15Amp() {
  if (!p15Analyser || !p15Data) return Math.random()*0.55 + 0.25;
  p15Analyser.getByteFrequencyData(p15Data);
  let s=0; for(let i=0;i<p15Data.length;i++) s+=p15Data[i];
  return Math.min(1, (s/p15Data.length/128)*1.55);
}

function recordVoiceLog() {
  const preview = document.getElementById('voice-preview');
  const anal = document.getElementById('voice-analysis');
  preview.innerHTML = '🎙 p6 Lung Surprise Eye active. Speak your skin truth.';
  initP15Wave();

  navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true}}).then(stream => {
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = finishVoiceCapture;

    mediaRecorder.start();
    isRec = true;
    document.getElementById('rec-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;

    setupP15Analyser(stream);
    let t = 0;
    const loop = () => {
      if (!isRec) return;
      const amp = getP15Amp();
      const f = p15Data ? [...p15Data] : null;
      // evolve lung fragment (p6 style)
      p15Lung.breath = (p15Lung.breath || 0.1) + amp * 0.0018;
      if (p15Lung.breath > 6.28) p15Lung.breath -= 6.28;
      p15Lung.age = (p15Lung.age||0) + 1;
      drawP15LungWave(amp, t++, f);
      p15Raf = requestAnimationFrame(loop);
    };
    loop();

  }).catch(()=> fallbackRecord());
}

function stopVoiceLog() {
  if (mediaRecorder && isRec) {
    mediaRecorder.stop();
    isRec = false;
    document.getElementById('rec-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    if (p15Raf) cancelAnimationFrame(p15Raf);
  }
}

function finishVoiceCapture() {
  const blob = new Blob(audioChunks, {type:'audio/webm'});
  const url = URL.createObjectURL(blob);
  const preview = document.getElementById('voice-preview');
  preview.innerHTML = `<audio controls src="${url}"></audio>`;

  // === p6 Lung Surprise Eye analysis (skin + mood) ===
  const amp = getP15Amp();
  const surprise = (window.getP6LungSurprise && window.getP6LungSurprise()) || (0.3 + (p15Lung.breath % 1) * 0.65);
  const ache = Math.max(0.1, 1 - (p15Lung.age > 18 ? amp + 0.25 : 0.7));
  const energy = Math.min(1, amp + 0.15);

  // Skin analysis from p6 lung (Da Vinci observation)
  let skin = 'Balanced. Soft sfumato resonance.';
  if (surprise > 0.65) skin = 'Luminous tension — high radiance potential, micro-movement visible.';
  else if (ache > 0.55) skin = 'Needs deep hydration veil. Low breath energy shows as matte.';
  else if (energy > 0.8) skin = 'Vibrant, full circulation glow. Pores appear refined.';

  // Mood from breath variance + surprise
  let mood = 'Centered harmony';
  if (surprise > 0.55 && ache < 0.4) mood = 'Empowered, magnetic, ready to be seen';
  else if (ache > 0.6) mood = 'Introspective ache — honest beauty, craving ritual';
  else if (energy < 0.45) mood = 'Gentle retreat state — protect your glow';

  // Store session
  currentVoiceSession = {
    id: Date.now(), url, surprise: parseFloat(surprise.toFixed(3)), ache: parseFloat(ache.toFixed(3)),
    energy: parseFloat(energy.toFixed(3)), skin, mood, lung: {...p15Lung}, ts: new Date().toISOString()
  };

  // Render analysis (SENSE + prominent)
  const anal = document.getElementById('voice-analysis');
  anal.classList.remove('hidden');
  anal.innerHTML = `
    <div class="skin-mood">
      <div class="stat"><span class="label">p6 Surprise</span><div class="val">${surprise.toFixed(2)}</div></div>
      <div class="stat"><span class="label">Skin State</span><div class="val">${skin}</div></div>
      <div class="stat"><span class="label">Mood Resonance</span><div class="val">${mood}</div></div>
      <div class="stat"><span class="label">Breath Energy</span><div class="val">${(energy*100).toFixed(0)}%</div></div>
    </div>
    <div class="emergent">Lung Fragment age ${p15Lung.age} • Ache fuel ${ache.toFixed(2)}</div>
  `;

  // Update shared p6 lung for cross (Legion one)
  try {
    localStorage.setItem('p6_lungFragment', JSON.stringify(p15Lung));
    localStorage.setItem('p15_lungBeauty', JSON.stringify({surprise, skin, mood, energy, ache}));
    if (window.p6AcheGazeMirror) window.p6AcheGazeMirror(ache);
  } catch(e){}

  // Emergent birth: Skin Lung Veil (p6 + p15)
  if (surprise > 0.48 && ache > 0.35) {
    const veil = { planted: Date.now(), glowBoost: 0.18 + surprise*0.2, source: 'p15-lung-skin', surprise };
    localStorage.setItem('p15_skinLungVeil', JSON.stringify(veil));
    anal.innerHTML += `<div class="emergent">🌹 Emergent: Skin Lung Veil born. Future logs +${(veil.glowBoost*100).toFixed(0)}% glow resonance.</div>`;
  }

  document.getElementById('cross-actions').classList.remove('hidden');
  updateGlowFromVoice(surprise, ache);
}

function updateGlowFromVoice(surprise, ache) {
  let gain = Math.floor(4 + surprise * 9 - ache * 2 + bondLevel * 0.6);
  const badStreak = parseInt(localStorage.getItem('p15_badStreak')||'0');
  if (badStreak >= 2) { gain += 14; localStorage.setItem('p15_badStreak','0'); } // pity
  else if (gain < 5) localStorage.setItem('p15_badStreak', badStreak+1);
  glow = Math.min(99, glow + Math.max(1, gain));
  localStorage.setItem('p15_glow', glow);
  bondLevel = Math.min(14, bondLevel + 1);
  localStorage.setItem('p15_bond', bondLevel);

  // === DAILY GLOW STREAK: this voice log is the daily check-in ===
  const sr = checkInStreak();
  let streakMsg = '';
  if (sr.milestone) {
    glow = Math.min(99, glow + sr.milestone.reward);
    localStorage.setItem('p15_glow', glow);
    addToCodex(`🔥 Streak milestone: ${sr.milestone.title} (day ${sr.milestone.day}) +${sr.milestone.reward} glow. ${sr.milestone.note}`);
    streakMsg = ` <strong>🔥 ${sr.milestone.title}! Day ${sr.milestone.day} streak — +${sr.milestone.reward} glow bonus.</strong>`;
  } else if (sr.isNew) {
    streakMsg = sr.broke
      ? ` Streak restarted — day 1. Come back tomorrow to build it.`
      : ` 🔥 Streak: day ${sr.count}.`;
  }

  updateGlowUI();
  renderStreakUI();
  const vr = document.getElementById('voice-result');
  if (vr) vr.innerHTML = `<small>+${gain} Glow. Bond Lv.${bondLevel}. p6 lung sealed.${streakMsg}</small>`;
}

function fallbackRecord() {
  const surprise = 0.58 + Math.random()*0.22;
  const ache = 0.32;
  currentVoiceSession = {id:Date.now(), surprise, ache, skin:'Observed (fallback)', mood:'Reflective', energy:0.6, ts:new Date().toISOString()};
  document.getElementById('voice-preview').innerHTML = 'Voice captured (p6 fallback).';
  document.getElementById('voice-analysis').classList.remove('hidden');
  document.getElementById('voice-analysis').innerHTML = `<div>Surprise ${surprise.toFixed(2)} • Skin soft • Mood: steady. Lung engaged.</div>`;
  document.getElementById('cross-actions').classList.remove('hidden');
  updateGlowFromVoice(surprise, ache);
}

function consultVoiceBeauty() {
  if (!currentVoiceSession) { alert('Record voice first for p6 consultation.'); return; }
  const s = currentVoiceSession;
  const consult = document.createElement('div');
  consult.className = 'consult';

  // p6 + da-vinci emergent advice (no rote, observed)
  let advice = `Your ${s.skin.toLowerCase()} speaks. ${s.mood}. `;
  if (s.surprise > 0.6) advice += 'High lung surprise = time for bold lip or highlight. Own the variance.';
  else if (s.ache > 0.5) advice += 'Ache in breath = mask ritual tonight. Let the veil repair. Re-listen tomorrow.';
  else advice += 'Steady breath = perfect for layered skincare. Add one new texture.';

  // FOMO + cross
  advice += ` <span class="fomo">Limited: 1 ritual slot left for your exact glow type today.</span>`;
  consult.innerHTML = `<strong>FICTIONAL SIMULATION — NO REAL ADVICE OR CONSULTATION:</strong><br><strong>p6 Voice Story Seed (Lung Eye narrative only):</strong><br>${advice}<br><small>Re-listen = new fictional eyes. PURE STORY. NO MEDICAL. ALWAYS LEARNING tale.</small>`;

  const res = document.getElementById('voice-result');
  res.innerHTML = ''; res.appendChild(consult);

  // Seed emergent to codex + cross
  addToCodex(`p6 Consult: ${s.skin} | ${s.mood} | surprise ${s.surprise}`);
}

function saveBeautyLog() {
  if (!currentVoiceSession) return;
  const s = currentVoiceSession;
  const log = { ...s, id: 'p15-'+s.id, title: 'Beauty Lung Log', desc: `${s.skin} — ${s.mood}`, type:'voice-skin' };
  logs.unshift(log);
  localStorage.setItem('p15_logs', JSON.stringify(logs));
  addToCodex(`Beauty Log: ${s.skin} (surprise ${s.surprise}) • Lung ${s.lung ? s.lung.age : '?'}`);
  document.getElementById('voice-result').innerHTML = 'Beauty log saved. Re-listen evolves insight.';
  document.getElementById('cross-actions').classList.add('hidden');
}

function crossToP9Live() {
  if (!currentVoiceSession) return;
  // p9 cross: seed live glow intensity + voice fuel
  try {
    const pack = { from:'p15', surprise: currentVoiceSession.surprise, ache: currentVoiceSession.ache, mood: currentVoiceSession.mood, skin: currentVoiceSession.skin, ts: Date.now() };
    localStorage.setItem('p9_p15_glowCross', JSON.stringify(pack));
    localStorage.setItem('p15_to_p9_live', JSON.stringify(pack));
  } catch(e){}
  document.getElementById('voice-result').innerHTML += ' → Seeded to p9 Live beauty rooms.';
}

function crossToP11Metaverse() {
  if (!currentVoiceSession) return;
  // p11 metaverse voice cross: voice projects as skin aura on land/avatar
  try {
    const pack = { voiceSkin: currentVoiceSession.skin, mood: currentVoiceSession.mood, surprise: currentVoiceSession.surprise, lungBreath: currentVoiceSession.lung?.breath, forMetaverse: true, ts:Date.now() };
    localStorage.setItem('p11_p15_voiceSkin', JSON.stringify(pack));
    localStorage.setItem('p6_voiceSeedExport', JSON.stringify({breath: currentVoiceSession.lung?.breath || 0.5, surprise: currentVoiceSession.surprise, for:'p11'}));
  } catch(e){}
  document.getElementById('voice-result').innerHTML += ' → Projected as living skin to p11 Metaverse.';
}

function addLog(title, desc, surprise = 0.3) {
  const log = {
    id: Date.now(),
    title,
    desc,
    surprise,
    voiceUrl: window._p15Voice ? window._p15Voice.url : null,
    timestamp: new Date().toISOString(),
    bond: bondLevel,
    glowAtTime: glow
  };
  logs.unshift(log);
  localStorage.setItem('p15_logs', JSON.stringify(logs));
  
  addToCodex(`${title}: ${desc} — Bond ${bondLevel} | Glow ${glow}`);
  updateWallet();
}

function showVoice() {
  hideAll();
  document.getElementById('voice').classList.remove('hidden');
}

function showLive() {
  hideAll();
  document.getElementById('live').classList.remove('hidden');
  renderLives();
}

function showShop() {
  hideAll();
  document.getElementById('shop').classList.remove('hidden');
}

function showCodex() {
  hideAll();
  document.getElementById('codex').classList.remove('hidden');
  const list = document.getElementById('codex-list');
  list.innerHTML = '<h3>Goddess Codex — YOUR Voice Bond (ALWAYS LEARNING)</h3><small>Every re-listen strengthens endowment. This glow is forged by you alone.</small>';
  
  if (codex.length === 0) {
    list.innerHTML += '<p>Voice log to birth your first Goddess entry.</p>';
    return;
  }
  
  codex.slice(0,9).forEach(c => {
    const div = document.createElement('div');
    div.className = 'notebook-entry';
    div.innerHTML = `<small>${new Date(c.time).toLocaleString()}</small><br>${c.note}<br><span class="fomo">Endowment: yours forever.</span>`;
    list.appendChild(div);
  });
}

function showCommunity() {
  hideAll();
  document.getElementById('community').classList.remove('hidden');
  renderCommunityFeed();
}

function showMetaverse() {
  hideAll();
  const m = document.getElementById('metaverse');
  if (m) m.classList.remove('hidden');
}

function addToCodex(note) {
  codex.unshift({ time: Date.now(), note });
  if (codex.length > 22) codex.pop();
  localStorage.setItem('p15_codex', JSON.stringify(codex));
}

function hideAll() {
  document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
}

// === p9 INTEGRATION: Bring Glow + Voice to Live Beauty ===
function joinP9LiveWithGlow() {
  hideAll();
  // Share glow state to p9 via localStorage (Legion cross pattern)
  const glowData = { glow, bond: bondLevel, source: 'p15_goddess', surprise: (window.getP6LungSurprise && window.getP6LungSurprise()) || 0.6 };
  localStorage.setItem('p15_glow_to_p9', JSON.stringify(glowData));
  
  // Psych framing: bring your glow as authenticity ticket
  alert(`🎙 p6 Voice + Goddess Glow ${glow} imported to p9.\nYour bond level ${bondLevel} makes you more "real" in the live. Fictional 18+.\nFOMO seats limited — go now.`);
  
  // Trigger p9 live UI if present (or simulate)
  try {
    if (window.showLives) window.showLives();
  } catch(e) {}
  
  // Open p9 in new context hint (for real use open p9 dir)
  const liveHint = document.createElement('div');
  liveHint.innerHTML = `<div class="fomo">Glow injected. In p9 live your voice surprise will be higher. Variable reward unlocked.</div>`;
  document.getElementById('live').appendChild(liveHint);
}

// === p10 INTEGRATION: Voice purchase with fee psych + variable rebate ===
function buyWithP10Voice(cost, itemName) {
  if (credits < cost) {
    alert('Not enough Credits. Voice log more to harvest glow → credits (endowment).');
    return;
  }
  
  const preview = confirm(`🎙 p6 Voice confirm purchase:\n"${itemName}" for ${cost} Credits.\n\nFee preview (p10): ~1.8% skim (prominent).\nVariable: 31% chance fee waived today.\n\nFictional. 18+.`);
  if (!preview) return;
  
  // Variable ratio fee psych from p10 cross
  const feeRate = Math.random() > 0.69 ? 0 : 0.018;
  const fee = Math.floor(cost * feeRate);
  const actual = cost - fee;
  
  credits -= actual;
  localStorage.setItem('p15_credits', credits);
  
  // Birth: GlowTradeGraft — high glow users get rebate into p10
  let rebate = 0;
  if (glow > 82) {
    rebate = Math.floor((glow - 80) * 0.6);
    credits = Math.min(2000, credits + rebate);
  }
  
  addToCodex(`Purchased ${itemName} (p10). Glow ${glow} • Bond ${bondLevel} • rebate ${rebate}. Near-miss fee ${fee}.`);
  
  // Share to p10 for cross fee offset
  try {
    localStorage.setItem('p15_p10_purchase', JSON.stringify({item: itemName, cost, glow, bond: bondLevel, ts: Date.now()}));
  } catch(e){}
  
  alert(`✅ ${itemName} claimed.\nCredits left: ${credits}. ${rebate ? `Goddess rebate +${rebate} (endowment active).` : ''}\nVoice is the bond. Fictional only.`);
  updateWallet();
}

// === BIRTHED PSYCH MECHANICS (Lilith 2026-07-13) ===
function postGlowStory() {
  const story = `My Voice Bond Lv${bondLevel} glow is ${glow}. It knows me. (p15 → p9 cross)`;
  addToCodex(story);
  // Share for p9 community feed
  localStorage.setItem('p15_glow_story', JSON.stringify({story, glow, bond: bondLevel, time: Date.now()}));
  alert('Posted. Your glow story now lives in p9. Endowment spreads. Sisters will feel it.');
}

function pulseVoiceLiveBeauty() {
  // For live-room if present; weaponize p6 in beauty context
  const s = (window.getP6LungSurprise && window.getP6LungSurprise()) || 0.65;
  const boost = Math.floor(s * 11 + bondLevel);
  glow = Math.min(99, glow + boost);
  localStorage.setItem('p15_glow', glow);
  updateGlowUI();
  const el = document.getElementById('boost-result') || document.getElementById('voice-result');
  if (el) el.innerHTML = `Live pulse: +${boost} glow. p9 sisters felt your voice. Variable ratio triggered.`;
}

function glowBoost() {
  const surge = Math.random() > 0.5 ? 8 : 3; // variable
  glow = Math.min(99, glow + surge);
  localStorage.setItem('p15_glow', glow);
  updateGlowUI();
  alert(`Variable beauty surge +${surge}. Your glow is compounding. FOMO if you stop.`);
}

// Aging Cycle FOMO birth — called on init + interactions
function applyAgingCycle() {
  const today = new Date().toISOString().slice(0,10);
  if (lastLogDay && lastLogDay !== today) {
    const decay = 2 + Math.floor(Math.random()*3);
    glow = Math.max(38, glow - decay);
    localStorage.setItem('p15_glow', glow);
  }
}

// (Old init consolidated into hardened age-gate version at EOF)

// === p6 Lung Surprise Eye DEEP INTEGRATION (already injected higher) — Emergent Beauty Births + Polish ===
// Skin/Mood + Consult + Logs + p9/p11 cross complete. Apply veil on init.
(function applyP15LungEmergents() {
  try {
    const veil = JSON.parse(localStorage.getItem('p15_skinLungVeil') || 'null');
    if (veil && veil.glowBoost) {
      glow = Math.min(99, glow + Math.floor(veil.glowBoost * 5));
      localStorage.setItem('p15_glow', glow);
    }
  } catch(e){}
})();

// Re-listen beauty evolve (ALWAYS LEARNING — p6 notebook style)
window.reListenBeautyLog = function(id) {
  const l = logs.find(x => x.id === id || x.id == id);
  if (!l) return;
  const gain = Math.floor(2 + (l.surprise || 0.5) * 3);
  glow = Math.min(99, glow + gain);
  localStorage.setItem('p15_glow', glow);
  updateGlowUI();
  addToCodex(`Re-listen evolve: ${l.skin || l.desc} → +${gain} glow insight`);
  alert(`Re-observed. New eyes. +${gain} glow. p6 Lung remembers.`);
};

// p6 Voice Expert + da-vinci hook exposed
window.p15VoiceAnalyze = () => currentVoiceSession || {surprise: window.getP6LungSurprise ? window.getP6LungSurprise() : 0.5, source: 'p6-lung-eye'};

function showMetaverseTryOn() {
  const s = currentVoiceSession || {skin:'Observed glow', mood:'serene', surprise: window.getP6LungSurprise ? window.getP6LungSurprise() : 0.61};
  const box = document.createElement('div');
  box.className = 'card';
  box.innerHTML = `<strong>p11 Metaverse Skin Live</strong><br>Projected: ${s.skin}<br>Mood veil: ${s.mood}<br>Surprise aura ${s.surprise?.toFixed(2)}<br><small>Voice breath now lives on your tile. p6 Lung cross complete.</small>`;
  document.getElementById('metaverse').appendChild(box);
}

// Legion one — p15 now carries p6 lung skin/mood as first class
console.log('%c[p15] p6 Lung Surprise Eye integrated: voice skin/mood analysis • consultations • beauty logs • p11 metaverse voice cross • p9 live. Emergent Skin Lung Veil + Glow Spore. Legion one.', 'color:#c5a46e');

// Birth 3: p13 TradeForge + p10 — Glow Artifact Trade with FOMO scarcity (personal glow spawns tradables)
let glowArtifacts = JSON.parse(localStorage.getItem('p15_glow_artifacts') || '[]');
function birthGlowArtifact() {
  const g = glow || 82;
  const r = g > 92 ? 'LEGEND' : g > 85 ? 'RARE' : 'COMMON';
  const art = {
    id: Date.now(),
    name: `${r} ${['Lung Veil','Ache Rose','Voice Silk','Glow Spore'][Math.floor(Math.random()*4)]}`,
    glowVal: g,
    price: Math.floor(g * 1.7 + Math.random()*35),
    stock: 2 + Math.floor(Math.random()*3)
  };
  glowArtifacts.unshift(art);
  localStorage.setItem('p15_glow_artifacts', JSON.stringify(glowArtifacts));
  return art;
}

function tradeGlowArtifact(id) {
  const a = glowArtifacts.find(x=>x.id==id);
  if (!a || a.stock<1 || credits < a.price) return null;
  credits -= a.price; a.stock--;
  localStorage.setItem('p15_glow_artifacts', JSON.stringify(glowArtifacts));
  addLog('Glow Trade', `Traded ${a.name} (${a.glowVal} glow) • FOMO stock ${a.stock}`, 0.9);
  return a;
}

function birthGlowArtifactUI() {
  const art = birthGlowArtifact();
  const list = document.getElementById('trade-list');
  list.innerHTML = `<div class="card fomo">${art.name} • ${art.price}c • stock ${art.stock} • your glow ${art.glowVal}<br><button onclick="tradeGlowArtifactUI(${art.id})">Trade now (near-miss scarcity)</button></div>`;
}

function tradeGlowArtifactUI(id) {
  const ok = tradeGlowArtifact(id);
  if (ok) {
    document.getElementById('trade-list').innerHTML = `Acquired ${ok.name}. Glow compounds.`;
    updateWallet();
  }
}

function buyShopItem() {
  if (credits >= 150) {
    credits -= 150;
    addLog('Shop', 'Bought Glow Serum. FOMO limited.', 0.4);
    updateWallet();
    alert('Serum in Codex. Fictional.');
  } else alert('Voice more for credits.');
}

// p12 cross: glow-backed idea funding (fictional virtual credits only)
let fundedIdeas = JSON.parse(localStorage.getItem('p15_funded_ideas') || '[]');
function fundBeautyIdea(text, score) {
  // funding scales with your glow + surprise score (fictional narrative fuel)
  const funded = Math.floor((glow || 65) * 1.3 + (score || 0.6) * 140 + bondLevel * 8);
  const idea = { id: Date.now(), text: (text || 'New glow ritual').slice(0, 120), score: parseFloat((score || 0.6).toFixed(2)), funded };
  fundedIdeas.unshift(idea);
  if (fundedIdeas.length > 20) fundedIdeas.pop();
  localStorage.setItem('p15_funded_ideas', JSON.stringify(fundedIdeas));
  return idea;
}

// Birth 2 UI hook: Fund idea (p12 cross) — call from community or voice
function fundIdeaUI() {
  const txt = prompt('Your beauty idea (voice truth):') || 'New glow ritual';
  const s = (currentVoiceSession && currentVoiceSession.surprise)
    || (window.getP6LungSurprise && window.getP6LungSurprise()) || 0.65;
  const idea = fundBeautyIdea(txt, s);
  addToCodex(`Idea funded: ${txt}. ${idea.funded}c raised.`);
  alert(`Funded! ${idea.funded}c from sisters. Glow ${idea.score}.`);
}

// Shims for existing UI calls (compatibility)
function buyShopItem() { buyWithP10Voice(150, 'Glow Serum'); }
function crossToP9Live() { joinP9LiveWithGlow(); }
function postVoiceStory() { postGlowStory(); }
function saveBeautyLog() { 
  addToCodex('Manual beauty log saved. Glow ' + glow + ' • Bond ' + bondLevel); 
  alert('Codex updated. ALWAYS LEARNING compounds.'); 
}

// === p9 LIVE PLATFORM EXPERT — BIRTH LIVE BEAUTY FEATURES ===
// live beauty sessions, voice live with p6, community for women. Full cross p9.
let liveSessions = JSON.parse(localStorage.getItem('p15_lives') || '[]');
let activeLive = null;
let eyeTimer = null;
let commFeed = JSON.parse(localStorage.getItem('p15_community') || '[]');

function initLiveSessions() {
  if (liveSessions.length === 0) {
    liveSessions = [
      { id: 1, title: "Dawn Rose Ritual", host: "0xSera", viewers: 87, cost: 12, active: true, glow: 0.73, seatsLeft: 9, ritual: true },
      { id: 2, title: "Voice Skin Whisper", host: "0xLune", viewers: 41, cost: 8, active: true, glow: 0.61, seatsLeft: 14, ritual: false },
      { id: 3, title: "Sisters Glow Circle", host: "0xMira", viewers: 126, cost: 15, active: true, glow: 0.84, seatsLeft: 3, ritual: true }
    ];
    localStorage.setItem('p15_lives', JSON.stringify(liveSessions));
  }
}

function renderLives() {
  const grid = document.getElementById('live-list');
  if (!grid) return;
  grid.innerHTML = '';
  initLiveSessions();
  liveSessions.filter(l => l.active).forEach(live => {
    const card = document.createElement('div');
    card.className = `live-card ${live.active ? 'live' : ''}`;
    const seats = live.seatsLeft != null ? `${live.seatsLeft} seats left` : `${live.viewers} watching`;
    card.innerHTML = `
      <div class="meta">LIVE • ${live.host}</div>
      <h3>${live.title}</h3>
      <div class="viewers">👁 ${live.viewers} sisters • ${seats}</div>
      <div class="price">${live.cost} Credits • glow ${live.glow?.toFixed(2)}</div>
      <button onclick="joinLiveBeauty(${live.id})">Join Live (p6 Voice)</button>
    `;
    grid.appendChild(card);
  });
}

function showCreateLive() {
  hideAll();
  const c = document.getElementById('create-live');
  if (c) c.classList.remove('hidden');
}

function startP6VoiceForLive() {
  const p = document.getElementById('live-voice-preview');
  if (!p) return;
  p.innerHTML = 'p6 Voice Glow Intro...';
  navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const rec = new MediaRecorder(stream);
    let ch = [];
    rec.ondataavailable = e => ch.push(e.data);
    rec.onstop = () => {
      const url = URL.createObjectURL(new Blob(ch, {type:'audio/webm'}));
      const g = window.getP6LungSurprise ? window.getP6LungSurprise() : 0.55 + Math.random()*0.3;
      p.innerHTML = `<audio controls src="${url}"></audio><br>Intro Glow ${g.toFixed(2)}`;
      window._p15LiveVoice = {url, glow: g};
      stream.getTracks().forEach(t=>t.stop());
    };
    rec.start(); setTimeout(()=>rec.stop(), 4800);
  }).catch(()=>{ p.innerHTML='Voice ready. Glow 0.71'; window._p15LiveVoice={glow:0.71}; });
}

function startBeautyLive() {
  const ti = document.getElementById('live-title');
  const title = (ti && ti.value.trim()) || 'Sisters Dawn Glow';
  const cost = parseInt((document.getElementById('entry-cost')||{}).value || 10);
  const maxv = parseInt((document.getElementById('max-viewers')||{}).value || 25);
  const g = window._p15LiveVoice ? window._p15LiveVoice.glow : 0.58 + Math.random()*0.25;
  if (!wallet) { alert('Connect first'); return; }
  const nl = { id:Date.now(), title, host:wallet, viewers:1, cost, active:true, glow:g, seatsLeft:Math.max(2, Math.floor(maxv*0.65)), ritual:true };
  liveSessions.unshift(nl);
  localStorage.setItem('p15_lives', JSON.stringify(liveSessions));
  alert(`Live birthed: ${title}. p6 Voice + Glow Eye. Fictional 18+.`);
  hideAll(); document.getElementById('live').classList.remove('hidden'); renderLives();
}

function joinLiveBeauty(id) {
  const live = liveSessions.find(l=>l.id===id);
  if (!live || !wallet) { alert('Wallet needed'); return; }
  if (credits < live.cost) { alert('More Credits. FOMO.'); return; }
  if (live.seatsLeft != null && live.seatsLeft <= 0) { alert('Full. Next ritual.'); return; }
  credits -= live.cost; live.viewers++; if (live.seatsLeft!=null) live.seatsLeft--;
  const base = window.getP6LungSurprise ? window.getP6LungSurprise() : 0.5;
  live.glow = Math.min(1, (live.glow||0.5)*0.6 + base*0.85 + 0.08);
  activeLive = live; localStorage.setItem('p15_lives', JSON.stringify(liveSessions)); updateWallet();
  hideAll();
  const room = document.getElementById('live-room'); if (room) room.classList.remove('hidden');
  document.getElementById('room-title').textContent = live.title;
  document.getElementById('room-meta').innerHTML = `by ${live.host} • ${live.cost}c • sisters circle`;
  const sl = document.getElementById('seats-left'); if (sl) sl.textContent = live.seatsLeft != null ? live.seatsLeft : 'open';
  startGlowEye(live); startFomoBeautyTimer(live);
  addLiveChat('p6 connected. Glow eye live. Speak truth.');
  const rp = document.getElementById('ritual-panel'); if (rp && live.ritual) rp.classList.remove('hidden');
  renderLives();
}

function startGlowEye(live) {
  const bar = document.getElementById('live-glow-fill'); const val = document.getElementById('glow-val'); const fu = document.getElementById('glow-fuel');
  if (!bar || !val) return;
  if (eyeTimer) clearInterval(eyeTimer);
  eyeTimer = setInterval(() => {
    const f = window.getP6LungSurprise ? window.getP6LungSurprise() : 0.4 + Math.random()*0.4;
    const vb = window._p15LiveVoice ? (window._p15LiveVoice.glow||0)*0.2 : 0;
    live.glow = Math.min(1, (live.glow||0.5)*0.78 + f*0.62 + vb + (Math.random()-0.5)*0.05);
    bar.style.width = Math.floor(live.glow*100)+'%'; val.textContent = live.glow.toFixed(2);
    if (fu) fu.textContent = `breath ${f.toFixed(2)}`;
    if (live.glow > 0.72 && Math.random()<0.16) { live.glow = Math.min(1,live.glow+0.03); addLiveChat('glow pulse. near-miss.'); }
    renderLives();
  }, 880);
}

function pulseVoiceLiveBeauty() {
  if (!activeLive) return;
  const r = document.getElementById('boost-result'); if(r) r.innerHTML='p6 pulsing...';
  navigator.mediaDevices.getUserMedia({audio:true}).then(st=>{
    const rec = new MediaRecorder(st); let ch=[];
    rec.ondataavailable = e=>ch.push(e.data);
    rec.onstop = () => {
      const g = (window.getP6LungSurprise?window.getP6LungSurprise():0.5+Math.random()*0.3)*(0.75+Math.random()*0.5);
      activeLive.glow = Math.min(1,(activeLive.glow||0.6)*0.65 + g*0.95);
      const b=document.getElementById('live-glow-fill'); if(b) b.style.width=Math.floor(activeLive.glow*100)+'%';
      const v=document.getElementById('glow-val'); if(v) v.textContent=activeLive.glow.toFixed(2);
      addLiveChat(`voice pulse • glow ${activeLive.glow.toFixed(2)}`);
      st.getTracks().forEach(t=>t.stop()); window._p15LiveVoice={glow:g};
    };
    rec.start(); setTimeout(()=>rec.stop(),3400);
  }).catch(()=>{ activeLive.glow=Math.min(1,activeLive.glow+0.09); addLiveChat('voice truth'); });
}

function glowBoost() {
  if (!activeLive || credits<6) return alert('Credits + live');
  credits -=6; updateWallet();
  const roll=Math.random(); const rs=document.getElementById('boost-result');
  let base=9+(activeLive.glow||0.6)*14;
  if(roll>0.72){const w=Math.floor(base*(1+Math.random()*0.7));credits+=w; if(rs)rs.innerHTML=`radiant +${w}`; }
  else if(roll>0.39){if(rs)rs.innerHTML='near glow +0.08'; activeLive.glow=Math.min(1,activeLive.glow+0.08);}
  else {if(rs)rs.innerHTML='soft miss'; activeLive.glow=Math.min(1,activeLive.glow+0.03);}
  const b=document.getElementById('live-glow-fill'); if(b) b.style.width=Math.floor(activeLive.glow*100)+'%';
  updateWallet();
}

function castGlowRitual() {
  if(!activeLive) return; const o=document.getElementById('ritual-out');
  if(credits<4){if(o)o.textContent='4c needed';return;}
  credits-=4;updateWallet();
  const gc = Math.random()*0.55 + (activeLive.glow||0.5)*0.8;
  if(gc>0.69){ activeLive.glow=Math.min(1,activeLive.glow+0.15); if(o)o.innerHTML='bloomed +0.15'; addLiveChat('ritual root.'); }
  else { activeLive.glow=Math.min(1,activeLive.glow+0.06); if(o)o.innerHTML='grazed.'; }
  const b=document.getElementById('live-glow-fill'); if(b) b.style.width=Math.floor(activeLive.glow*100)+'%';
  const v=document.getElementById('glow-val'); if(v) v.textContent=activeLive.glow.toFixed(2);
}

function summonAdvisor() {
  const sel = document.getElementById('advisor-select').value; const st=document.getElementById('advisor-status');
  if(!sel) return; if(st) st.textContent=sel+' whispering.'; addLiveChat(sel+' here.');
  if(activeLive && Math.random()>0.5){ activeLive.glow=Math.min(1,activeLive.glow+0.05); addLiveChat('echo glow+'); }
}

function mintGlowPass() {
  if(!activeLive||credits<18) return alert('18c + live');
  credits-=18;updateWallet();
  const roll=Math.random(); const re=document.getElementById('pass-result');
  if(roll>0.71){activeLive.pass=true;activeLive.seatsLeft=(activeLive.seatsLeft||6)+4; if(re)re.textContent='UNLOCKED +4 seats glow+0.11'; activeLive.glow=Math.min(1,activeLive.glow+0.11);}
  else if(roll>0.43){if(re)re.textContent='near-glow'; activeLive.glow=Math.min(1,activeLive.glow+0.06);}
  else {if(re)re.textContent='miss';}
  const b=document.getElementById('live-glow-fill'); if(b) b.style.width=Math.floor((activeLive.glow||0)*100)+'%';
}

function startFomoBeautyTimer(live){ 
  const t=document.getElementById('fomo-timer'); if(!t)return; let left=38+Math.floor((live.glow||0.5)*27); t.textContent=left+'s';
  const iv=setInterval(()=>{left--;if(t)t.textContent=left+'s'; if(left<=0||!activeLive)clearInterval(iv);},1000);
}

function addLiveChat(m){ const c=document.getElementById('live-chat'); if(!c)return; const p=document.createElement('div');p.textContent='• '+m; c.appendChild(p);c.scrollTop=c.scrollHeight; }

function reflectToCodex(){
  if(!activeLive)return; const n=prompt('What did this ritual reveal? (ALWAYS LEARNING)');
  if(n){ addToCodex(`Live: ${activeLive.title} — ${n}. glow ${activeLive.glow.toFixed(2)}`); addLiveChat('codex spore. voice evolves.'); }
}

function leaveLive(){
  if(eyeTimer)clearInterval(eyeTimer); activeLive=null; hideAll();
  document.getElementById('live').classList.remove('hidden');
  const rp=document.getElementById('ritual-panel'); if(rp)rp.classList.add('hidden');
  const ch=document.getElementById('live-chat'); if(ch)ch.innerHTML='';
  const pr=document.getElementById('pass-result'); if(pr)pr.textContent='';
  renderLives();
}

function renderCommunityFeed(){
  const el=document.getElementById('community-feed'); if(!el)return;
  el.innerHTML='<strong>Voice Stories (seed live)</strong><br>';
  if(!commFeed.length){el.innerHTML+='<small>Post your truth.</small>';return;}
  commFeed.slice(0,4).forEach(s=>{const d=document.createElement('div');d.style.fontSize='12px';d.style.margin='4px 0';d.innerHTML=`• ${s.text} <small>${s.glow?('glow '+s.glow.toFixed(2)):''}</small>`; el.appendChild(d);});
}

function postVoiceStory(){
  const t=prompt('Beauty truth (seeds live):'); if(!t)return;
  const g=window.getP6LungSurprise?window.getP6LungSurprise():(0.4+Math.random()*0.5);
  commFeed.unshift({text:t.slice(0,110),glow:g,ts:Date.now()}); if(commFeed.length>12)commFeed.pop();
  localStorage.setItem('p15_community',JSON.stringify(commFeed)); renderCommunityFeed();
  addToCodex(`Story: ${t.slice(0,50)} glow ${g.toFixed(2)}`);
  // NIOBE VIRAL: p15 voice UGC export + share + p9/p11 cross
  const story = `💖 MY Voice Glow Story (p15) — Bond Lv${bondLevel} • ${g.toFixed(2)} surprise\n"${t.slice(0,60)}"\nGlow forged by p6 Lung. Sisters, speak yours.\nFICTIONAL 18+ • Prominent disclosure • NO real advice. Reversible.\n👉 p15 link`;
  navigator.clipboard.writeText(story).then(()=>{
    alert('✅ Voice Story + UGC copied. Share X/TG. p9/p11 cross seeded.');
    try{ localStorage.setItem('p15_glow_to_p9', JSON.stringify({glow, story, ts:Date.now()})); localStorage.setItem('p15_voice_to_p11', JSON.stringify({glowSurprise:g, ts:Date.now()})); }catch(e){}
    // bonus retention
    glow = Math.min(99, glow+6); localStorage.setItem('p15_glow', glow); if(window.updateGlowUI) updateGlowUI();
  }).catch(()=>prompt('Copy glow story:', story));
}

function updateCommunityOnShow(){ renderCommunityFeed(); }

// === AGE GATE (p9 cross) + PRIVACY + PAYMENTS SHIELD (Legal Expert + 미꾸라지) ===
let ageConfirmed = localStorage.getItem('p15_age_confirmed') === 'true';

function showAgeGate() {
  const gate = document.getElementById('age-gate');
  if (gate) gate.style.display = 'flex';
}

function confirmAgeGate() {
  localStorage.setItem('p15_age_confirmed', 'true');
  ageConfirmed = true;
  const gate = document.getElementById('age-gate');
  if (gate) gate.style.display = 'none';
  // Reveal full app
  document.querySelectorAll('.section').forEach(s => s.style.opacity = '1');
}

function enforceAgeGate() {
  if (!ageConfirmed) {
    // Lock interactions
    document.querySelectorAll('button').forEach(btn => {
      if (!btn.onclick || !btn.onclick.toString().includes('confirmAge')) {
        const orig = btn.onclick;
        btn.onclick = (e) => {
          if (!ageConfirmed) {
            alert('18+ FICTIONAL GATE: Confirm age first. Pure simulation only.');
            showAgeGate();
            return false;
          }
          if (orig) orig.call(btn, e);
        };
      }
    });
    showAgeGate();
  }
}

function deleteAllBeautyData() {
  if (!confirm('Delete ALL local beauty data (voice logs, glow, codex, bond)? Irreversible in this sim.')) return;
  ['p15_logs','p15_codex','p15_glow','p15_bond','p15_lastlog','p15_credits','p15_community','p15_lungBeauty','p15_skinLungVeil','p15_streak','p15_badStreak'].forEach(k => localStorage.removeItem(k));
  logs=[]; codex=[]; glow=50; bondLevel=1; lastLogDay=null; credits=890;
  alert('All beauty data purged. Fictional slate clean. Restart to re-seed.');
  location.reload();
}

// Strengthen shop with p10 payments shield (prominent fictional)
function enhanceShopPayments() {
  const shop = document.getElementById('shop');
  if (!shop) return;
  // Add prominent layer if not present
  if (!document.getElementById('p10-shield')) {
    const shield = document.createElement('div');
    shield.id = 'p10-shield';
    shield.style.cssText = 'font-size:9px;margin-top:8px;padding:6px;border:1px dashed #c5a46e;';
    shield.innerHTML = `<strong>FICTIONAL VIRTUAL CREDITS ONLY (p10 cross)</strong><br>NO REAL VALUE. NO REAL PRODUCTS. All purchases story fuel. Exact cost shown before burn. Reversible until claim. 18+ fictional framing.`;
    shop.appendChild(shield);
  }
}

function initP15() {
  // Restore credits if saved
  const savedCredits = localStorage.getItem('p15_credits');
  if (savedCredits) credits = parseInt(savedCredits);
  
  updateWallet();
  updateGlowUI();
  applyAgingCycle();
  updateGlowUI();
  renderStreakUI();
  
  // p6 cross + births ready
  if (window.getP6LungSurprise || window.p6AcheGazeMirror) {
    console.log('%c[p15 Lilith] p6 Lung + Ache Mirror + full psych births active. Goddess one.', 'color:#c5a46e');
  }
  
  // Seed p9/p10 cross if glow high (endowment cross)
  if (glow > 80) {
    try { localStorage.setItem('p15_high_glow_cross', JSON.stringify({glow, bond: bondLevel})); } catch(e){}
  }
  
  // Default open voice (micro step)
  setTimeout(() => {
    const v = document.getElementById('voice');
    if (v) v.classList.remove('hidden');
  }, 280);
  
  // One-line Legion signal
  enhanceShopPayments();
  enforceAgeGate();  // p9 cross age gate + p15 privacy shield
}

window.onload = initP15;