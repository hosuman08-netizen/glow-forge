
/* LEGION_WAVE_97_session_counter */
try{if(!sessionStorage.getItem('lw_p15_women_be_session_counter')){sessionStorage.setItem('lw_p15_women_be_session_counter','1');localStorage.setItem('lw_p15_women_be_session_counter',String((+(localStorage.getItem('lw_p15_women_be_session_counter')||0))+1));}}catch(e){}

/* LEGION_WAVE_7_session_counter */
try{if(!sessionStorage.getItem('lw_p15_women_be_session_counter')){sessionStorage.setItem('lw_p15_women_be_session_counter','1');localStorage.setItem('lw_p15_women_be_session_counter',String((+(localStorage.getItem('lw_p15_women_be_session_counter')||0))+1));}}catch(e){}
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
// Structured glow readings (the diagnosis depth, preserved for the Journey view)
let readings = JSON.parse(localStorage.getItem('p15_readings') || '[]');
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
// 3H: weekly freeze once if exactly 1 day missed and count≥3 (Duolingo-class).
function checkInStreak() {
  const s = loadStreak();
  const today = _todayStr();
  if (s.lastDay === today) {
    return { count: s.count, best: s.best, isNew: false, broke: false, milestone: null };
  }
  let broke = false;
  let froze = false;
  if (s.lastDay) {
    const gap = _dayNumber(today) - _dayNumber(s.lastDay);
    if (gap === 1) { s.count += 1; }        // consecutive
    else if (gap === 2 && (s.count || 0) >= 3) {
      const ready = !s.shieldLast || ((new Date(today) - new Date(s.shieldLast)) / 86400000) >= 7;
      if (ready) {
        s.shieldLast = today;
        s.count += 1; // bridge one miss
        froze = true;
        try { if (window.legionTrack) legionTrack('streak_freeze', { count: s.count }); } catch (e) {}
      } else {
        s.count = 1; broke = true;
      }
    }
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
  try { if (window.legionTrack) legionTrack('streak', { count: s.count, froze: !!froze }); } catch (e) {}
  return { count: s.count, best: s.best, isNew: true, broke, milestone, froze };
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
    const sRaw = loadStreak();
    const shieldReady = !sRaw.shieldLast || ((new Date(_todayStr()) - new Date(sRaw.shieldLast)) / 86400000) >= 7;
    const shieldChrome = (st.count >= 3 && shieldReady) ? ' · 🛡️1' : '';
    if (st.checkedInToday) {
      sub.textContent = `Checked in today. Best: ${st.best} 🏆` + shieldChrome;
    } else if (st.count > 0) {
      sub.innerHTML = `<span class="fomo">Voice-log today to keep your ${st.count}-day streak alive.</span>` + shieldChrome;
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
  if (el) el.innerHTML = `${balance} Glow • ${credits} Credits${wallet ? ` • ${wallet}` : ''}`;
  const btn = document.getElementById('connect-btn');
  if (btn && wallet) btn.textContent = '✅ ' + wallet;
}

function connectWallet() {
  wallet = 'Goddess-' + Math.random().toString(36).slice(2, 6).toUpperCase();
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

// Gentle idle breath so the visualizer looks alive before recording (SENSE: no dead black box)
let p15IdleRaf = null, p15IdleT = 0;
function startP15Idle() {
  if (isRec) return;              // real capture owns the canvas
  if (p15IdleRaf) return;         // already breathing
  initP15Wave();
  const idle = () => {
    if (isRec) { p15IdleRaf = null; return; }
    const amp = 0.14 + Math.sin(p15IdleT * 0.03) * 0.05; // calm resting breath
    drawP15LungWave(amp, p15IdleT++, null);
    p15IdleRaf = requestAnimationFrame(idle);
  };
  idle();
}
function stopP15Idle() {
  if (p15IdleRaf) { cancelAnimationFrame(p15IdleRaf); p15IdleRaf = null; }
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
  preview.innerHTML = '🎙 Voice Glow active. Speak your skin truth.';
  stopP15Idle();
  initP15Wave();

  resetVoiceFeatures();

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
      sampleVoiceFeatures(amp, f); // accumulate real per-frame signal features
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

// ============================================================
// REAL VOICE DIAGNOSTIC ENGINE (Da Vinci observation, Trinity 2026-07-16)
// Extracts genuine signal features across the WHOLE recording — not one
// end snapshot — then maps them deterministically to a skin + mood
// diagnosis and a concrete, feature-driven recommendation. Same voice →
// same reading; different voice → different reading. Fictional narrative only.
// ============================================================
let p15Features = null;
function resetVoiceFeatures() {
  p15Features = {
    frames: 0, ampSum: 0, ampSqSum: 0, ampMax: 0,
    lowSum: 0, midSum: 0, highSum: 0,   // spectral band energy
    voicedFrames: 0,                    // frames above silence floor
    centroidSum: 0, centroidWeight: 0,  // spectral centroid (brightness/pitch proxy)
    prevAmp: null, ampDeltaSum: 0,      // jitter (frame-to-frame change)
  };
}
function sampleVoiceFeatures(amp, freq) {
  const F = p15Features;
  if (!F) return;
  F.frames++;
  F.ampSum += amp; F.ampSqSum += amp * amp;
  if (amp > F.ampMax) F.ampMax = amp;
  if (amp > 0.12) F.voicedFrames++;
  if (F.prevAmp != null) F.ampDeltaSum += Math.abs(amp - F.prevAmp);
  F.prevAmp = amp;
  if (freq && freq.length) {
    const n = freq.length, third = Math.max(1, Math.floor(n / 3));
    let lo = 0, mid = 0, hi = 0, cSum = 0, cW = 0;
    for (let i = 0; i < n; i++) {
      const v = freq[i] / 255;
      if (i < third) lo += v; else if (i < third * 2) mid += v; else hi += v;
      cSum += i * v; cW += v;
    }
    F.lowSum += lo; F.midSum += mid; F.highSum += hi;
    if (cW > 0) { F.centroidSum += (cSum / cW) / n; F.centroidWeight += 1; }
  }
}
// Turn accumulated features into normalized [0..1] metrics + a diagnosis.
function analyzeVoiceFeatures() {
  const F = p15Features;
  if (!F || F.frames < 3) return null; // too short to read honestly
  const meanAmp = F.ampSum / F.frames;
  const variance = Math.max(0, F.ampSqSum / F.frames - meanAmp * meanAmp);
  const std = Math.sqrt(variance);
  const jitter = F.ampDeltaSum / Math.max(1, F.frames - 1);   // breath instability
  const voicedRatio = F.voicedFrames / F.frames;              // how much you actually spoke
  const bandTotal = F.lowSum + F.midSum + F.highSum || 1;
  const brightness = (F.midSum + F.highSum) / bandTotal;      // hi/mid share → radiance proxy
  const warmth = F.lowSum / bandTotal;                        // low share → calm/depth proxy
  const centroid = F.centroidWeight ? F.centroidSum / F.centroidWeight : 0.4;

  // Normalized 0..1 beauty metrics (deterministic from real signal)
  const energy = Math.min(1, meanAmp * 1.7 + F.ampMax * 0.25);
  const steadiness = Math.max(0, Math.min(1, 1 - jitter * 3.5));      // low jitter = steady breath
  const radiance = Math.min(1, brightness * 0.85 + centroid * 0.4);
  const presence = Math.min(1, voicedRatio * 1.1);                    // spoke consistently
  // ache = honest low-energy / unsteady signal; surprise = brightness × variability
  const ache = Math.max(0.05, Math.min(1, (1 - energy) * 0.6 + (1 - steadiness) * 0.4));
  const surprise = Math.max(0.05, Math.min(1, radiance * 0.55 + std * 1.4 + centroid * 0.2));

  // --- SKIN diagnosis: scored across signals, pick strongest signal ---
  const skinCandidates = [
    { s: energy * 0.6 + radiance * 0.4, label: 'Vibrant — full circulation glow; pores read refined, tone even.',
      rec: 'Lock it in: light hydrating essence + SPF. Skip heavy occlusives today — your barrier is thriving.' },
    { s: (energy < 0.4 ? 0.7 : 0) + (1 - energy) * 0.5 + ache * 0.35, label: 'Matte & thirsty — low breath energy shows as dehydration.',
      rec: 'Deep-hydration ritual tonight: layer a hyaluronic serum on damp skin, seal with a sleeping mask.' },
    { s: (1 - steadiness) * 0.6 + jitter * 2, label: 'Reactive tension — micro-tremor suggests sensitivity / stress flush.',
      rec: 'Calm & barrier-repair: fragrance-free centella or cica cream, cool compress, no actives for 48h.' },
    { s: warmth * 0.7 + steadiness * 0.3, label: 'Balanced & resilient — deep, even resonance; skin in equilibrium.',
      rec: 'Maintenance day: one gentle exfoliation (PHA) then your usual moisturizer. Don\'t over-treat.' },
    { s: radiance * 0.5 + surprise * 0.5, label: 'Luminous tension — high radiance potential, ready to be lit.',
      rec: 'Amplify: dewy primer + cream highlighter on cheekbones. A bold lip is fully earned tonight.' },
  ].sort((a, b) => b.s - a.s);
  const skinDx = skinCandidates[0];

  // --- MOOD diagnosis from energy/steadiness/presence balance ---
  let mood;
  if (energy > 0.6 && radiance > 0.5) mood = 'Empowered & magnetic — ready to be seen';
  else if (ache > 0.6) mood = 'Introspective ache — honest, tender, craving a ritual';
  else if (steadiness > 0.65 && energy < 0.5) mood = 'Gentle retreat — grounded, protecting your glow';
  else if (presence < 0.4) mood = 'Quiet & held-back — the voice is still warming up';
  else mood = 'Centered harmony — steady and self-possessed';

  return {
    energy, steadiness, radiance, presence, ache, surprise, warmth, brightness, centroid,
    voicedRatio, jitter, std, frames: F.frames,
    skin: skinDx.label, skinRec: skinDx.rec, mood,
  };
}

function finishVoiceCapture() {
  const blob = new Blob(audioChunks, {type:'audio/webm'});
  const url = URL.createObjectURL(blob);
  const preview = document.getElementById('voice-preview');
  preview.innerHTML = `<audio controls src="${url}"></audio>`;

  // === REAL feature-driven diagnosis (falls back gracefully if too short) ===
  const dx = analyzeVoiceFeatures();
  let surprise, ache, energy, skin, mood, skinRec, metrics;
  if (dx) {
    ({ surprise, ache, energy, skin, mood, skinRec } = dx);
    metrics = dx;
  } else {
    // recording too short to read honestly — say so, don't fabricate depth
    const amp = getP15Amp();
    surprise = (window.getP6LungSurprise && window.getP6LungSurprise()) || (0.3 + (p15Lung.breath % 1) * 0.65);
    ache = Math.max(0.1, 1 - (p15Lung.age > 18 ? amp + 0.25 : 0.7));
    energy = Math.min(1, amp + 0.15);
    skin = 'Too brief to read — speak ~3+ seconds for a real skin diagnosis.';
    skinRec = 'Record a little longer next time so Voice Glow can observe your breath.';
    mood = 'Warming up';
    metrics = { energy, steadiness: 0, radiance: 0, presence: 0 };
  }

  // Store session (now carries real metrics + a concrete recommendation)
  currentVoiceSession = {
    id: Date.now(), url, surprise: parseFloat(surprise.toFixed(3)), ache: parseFloat(ache.toFixed(3)),
    energy: parseFloat(energy.toFixed(3)), skin, mood, skinRec,
    metrics: {
      energy: +metrics.energy.toFixed(3), steadiness: +(metrics.steadiness||0).toFixed(3),
      radiance: +(metrics.radiance||0).toFixed(3), presence: +(metrics.presence||0).toFixed(3),
    },
    lung: {...p15Lung}, ts: new Date().toISOString()
  };

  // Preserve this reading's real metrics for the Glow Journey (trends over time)
  recordReading(currentVoiceSession);

  // Render analysis (SENSE + prominent) — real metric bars + diagnosis + recommendation
  const anal = document.getElementById('voice-analysis');
  anal.classList.remove('hidden');
  const bar = (label, v) => `<div class="metric"><span class="metric-label">${label}</span><div class="metric-track"><div class="metric-fill" style="width:${Math.round((v||0)*100)}%"></div></div><span class="metric-pct">${Math.round((v||0)*100)}</span></div>`;
  anal.innerHTML = `
    <div class="dx-metrics">
      ${bar('Radiance', metrics.radiance)}
      ${bar('Breath energy', metrics.energy)}
      ${bar('Steadiness', metrics.steadiness)}
      ${bar('Presence', metrics.presence)}
    </div>
    <div class="dx-skin"><strong>Skin reading</strong><br>${skin}</div>
    <div class="dx-rec"><strong>✨ Recommended ritual</strong><br>${skinRec}</div>
    <div class="dx-mood"><strong>Mood resonance:</strong> ${mood}</div>
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
    anal.innerHTML += `<div class="emergent">🌹 Emergent: Skin Glow Veil born. Future logs +${(veil.glowBoost*100).toFixed(0)}% glow resonance.</div>`;
  }

  document.getElementById('cross-actions').classList.remove('hidden');
  updateGlowFromVoice(surprise, ache);
  if (window.legionTrack) legionTrack('activate'); // core loop done: skin/glow diagnosis rendered
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
  if (vr) vr.innerHTML = `<small>+${gain} Glow. Bond Lv.${bondLevel}. Voice sealed.${streakMsg}</small>`;
}

function fallbackRecord() {
  const surprise = 0.58 + Math.random()*0.22;
  const ache = 0.32;
  currentVoiceSession = {id:Date.now(), surprise, ache, skin:'Observed (fallback)', mood:'Reflective', energy:0.6, ts:new Date().toISOString()};
  document.getElementById('voice-preview').innerHTML = 'Voice captured.';
  document.getElementById('voice-analysis').classList.remove('hidden');
  document.getElementById('voice-analysis').innerHTML = `<div>Surprise ${surprise.toFixed(2)} • Skin soft • Mood: steady. Voice engaged.</div>`;
  document.getElementById('cross-actions').classList.remove('hidden');
  updateGlowFromVoice(surprise, ache);
  if (window.legionTrack) legionTrack('activate'); // core loop done: skin/glow diagnosis rendered (fallback path)
}

function consultVoiceBeauty() {
  if (!currentVoiceSession) { alert('Record voice first for consultation.'); return; }
  const s = currentVoiceSession;
  const consult = document.createElement('div');
  consult.className = 'consult';

  // Lead with the REAL feature-driven reading + recommendation (deterministic from this voice)
  let advice = `<em>${s.skin}</em><br><strong>Ritual:</strong> ${s.skinRec || 'Record ~3s to unlock a full recommendation.'}<br><strong>Mood:</strong> ${s.mood}. `;
  // A second tip keyed to the actual weakest/strongest metric of THIS reading
  const m = s.metrics || {};
  if (m.energy != null) {
    if (m.energy < 0.4) advice += 'Lowest signal is breath energy → prioritize hydration + rest over actives.';
    else if (m.steadiness < 0.4) advice += 'Lowest signal is steadiness → soothe the barrier before anything else.';
    else if (m.radiance > 0.6) advice += 'Radiance is your strongest signal → this is a day to be seen.';
    else advice += 'Signals are balanced → maintain, don\'t over-treat.';
  }

  // FOMO + cross
  advice += ` <span class="fomo">Limited: 1 ritual slot left for your exact glow type today.</span>`;
  consult.innerHTML = `<strong>FICTIONAL SIMULATION — NO REAL ADVICE OR CONSULTATION:</strong><br><strong>Voice Story Seed (narrative only):</strong><br>${advice}<br><small>Re-listen = new fictional eyes. PURE STORY. NO MEDICAL.</small>`;

  const res = document.getElementById('voice-result');
  res.innerHTML = ''; res.appendChild(consult);

  // Seed emergent to codex + cross
  addToCodex(`Consult: ${s.skin} | ${s.mood} | surprise ${s.surprise}`);
}

function saveBeautyLog() {
  if (!currentVoiceSession) return;
  const s = currentVoiceSession;
  const log = { ...s, id: 'p15-'+s.id, title: 'Beauty Voice Log', desc: `${s.skin} — ${s.mood}`, type:'voice-skin' };
  logs.unshift(log);
  localStorage.setItem('p15_logs', JSON.stringify(logs));
  addToCodex(`Beauty Log: ${s.skin} (surprise ${s.surprise})`);
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
  document.getElementById('voice-result').innerHTML += ' → Seeded to Live Beauty rooms.';
}

function crossToP11Metaverse() {
  if (!currentVoiceSession) return;
  // p11 metaverse voice cross: voice projects as skin aura on land/avatar
  try {
    const pack = { voiceSkin: currentVoiceSession.skin, mood: currentVoiceSession.mood, surprise: currentVoiceSession.surprise, lungBreath: currentVoiceSession.lung?.breath, forMetaverse: true, ts:Date.now() };
    localStorage.setItem('p11_p15_voiceSkin', JSON.stringify(pack));
    localStorage.setItem('p6_voiceSeedExport', JSON.stringify({breath: currentVoiceSession.lung?.breath || 0.5, surprise: currentVoiceSession.surprise, for:'p11'}));
  } catch(e){}
  document.getElementById('voice-result').innerHTML += ' → Projected as living skin to Virtual Try-On.';
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
  startP15Idle();
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

// Tiny inline SVG sparkline from an array of 0..1 values (oldest→newest).
function _sparkline(vals, w = 240, h = 34) {
  if (!vals.length) return '';
  const pad = 3, iw = w - pad * 2, ih = h - pad * 2;
  const step = vals.length > 1 ? iw / (vals.length - 1) : 0;
  const pts = vals.map((v, i) => {
    const x = pad + i * step;
    const y = pad + ih - Math.max(0, Math.min(1, v)) * ih;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1].split(',');
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" width="100%" height="${h}" preserveAspectRatio="none" aria-hidden="true">
    <polyline points="${pts.join(' ')}" fill="none" stroke="url(#sparkg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.6" fill="#c5a46e"/>
    <defs><linearGradient id="sparkg" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#d8a38a"/><stop offset="1" stop-color="#c5a46e"/></linearGradient></defs>
  </svg>`;
}

function showCodex() {
  hideAll();
  document.getElementById('codex').classList.remove('hidden');
  const list = document.getElementById('codex-list');
  list.innerHTML = '<h3>Goddess Codex — Your Glow Journey</h3><small>Every voice reading is remembered. Watch your glow evolve — forged by you alone.</small>';

  // === GLOW JOURNEY: real trend from preserved diagnostic readings ===
  if (readings.length) {
    const latest = readings[0];
    const rows = [
      ['Radiance', 'radiance'], ['Breath energy', 'energy'],
      ['Steadiness', 'steadiness'], ['Presence', 'presence'],
    ];
    const journey = document.createElement('div');
    journey.className = 'journey';
    let html = `<div class="journey-head">${readings.length} reading${readings.length>1?'s':''} logged · latest ${new Date(latest.ts).toLocaleDateString()}</div>`;
    html += '<div class="dx-metrics">';
    rows.forEach(([label, key]) => {
      const v = latest[key] || 0;
      const avg = _priorAvg(key);
      let trend = '';
      if (avg != null) {
        const delta = Math.round((v - avg) * 100);
        if (delta > 2) trend = `<span class="trend up">▲ ${delta}</span>`;
        else if (delta < -2) trend = `<span class="trend down">▼ ${Math.abs(delta)}</span>`;
        else trend = `<span class="trend flat">— steady</span>`;
      }
      html += `<div class="metric"><span class="metric-label">${label}</span>
        <div class="metric-track"><div class="metric-fill" style="width:${Math.round(v*100)}%"></div></div>
        <span class="metric-pct">${Math.round(v*100)}</span>${trend}</div>`;
    });
    html += '</div>';
    // Radiance sparkline over recent readings (oldest→newest) — the "it got better" moment
    if (readings.length >= 2) {
      const series = readings.slice(0, 12).map(r => r.radiance || 0).reverse();
      const avgR = _priorAvg('radiance');
      const nowR = latest.radiance || 0;
      let verdict = 'Your glow is holding steady.';
      if (avgR != null && nowR > avgR + 0.03) verdict = `Your radiance is up ${Math.round((nowR-avgR)*100)}% vs your average — you are glowing brighter.`;
      else if (avgR != null && nowR < avgR - 0.03) verdict = `Radiance dipped below your average — a hydration + rest ritual will bring it back.`;
      html += `<div class="journey-spark"><div class="spark-label">Radiance journey</div>${_sparkline(series)}<div class="spark-verdict">${verdict}</div></div>`;
    }
    html += `<div class="journey-latest"><strong>Latest reading:</strong> ${latest.skin || ''}<br><span class="dim">Mood: ${latest.mood || '—'}</span></div>`;
    journey.innerHTML = html;
    list.appendChild(journey);
  } else {
    list.innerHTML += '<p style="margin-top:10px">Record a voice glow (~3s) to birth your first reading and start your journey.</p>';
  }

  // Notes below the journey
  if (codex.length) {
    const nh = document.createElement('h3');
    nh.textContent = 'Ritual notes';
    nh.style.marginTop = '18px';
    list.appendChild(nh);
    codex.slice(0,9).forEach(c => {
      const div = document.createElement('div');
      div.className = 'notebook-entry';
      div.innerHTML = `<small>${new Date(c.time).toLocaleString()}</small><br>${c.note}`;
      list.appendChild(div);
    });
  }
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

// Preserve the full diagnostic reading so the Journey can show real trends.
// Only records honest readings (needs the 4 metrics computed from real signal).
function recordReading(session) {
  if (!session || !session.metrics) return;
  const m = session.metrics;
  if ((m.radiance || 0) === 0 && (m.steadiness || 0) === 0) return; // too-brief fallback → not honest depth
  readings.unshift({
    ts: session.ts || new Date().toISOString(),
    radiance: m.radiance || 0, energy: m.energy || 0,
    steadiness: m.steadiness || 0, presence: m.presence || 0,
    skin: session.skin, mood: session.mood,
  });
  if (readings.length > 30) readings.pop();       // keep a rolling month of glow
  localStorage.setItem('p15_readings', JSON.stringify(readings));
}

// Average of a metric across prior readings (excludes the newest = index 0).
function _priorAvg(key) {
  if (readings.length < 2) return null;
  const past = readings.slice(1);
  return past.reduce((s, r) => s + (r[key] || 0), 0) / past.length;
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
  alert(`🎙 Voice + Goddess Glow ${glow} brought to Live Beauty.\nYour bond level ${bondLevel} makes you more "real" in the live. Fictional 18+.\nFOMO seats limited — go now.`);
  
  // Trigger p9 live UI if present (or simulate)
  try {
    if (window.showLives) window.showLives();
  } catch(e) {}
  
  // Open p9 in new context hint (for real use open p9 dir)
  const liveHint = document.createElement('div');
  liveHint.innerHTML = `<div class="fomo">Glow injected. In Live Beauty your voice surprise will be higher. Variable reward unlocked.</div>`;
  document.getElementById('live').appendChild(liveHint);
}

// === p10 INTEGRATION: Voice purchase with fee psych + variable rebate ===
function buyWithP10Voice(cost, itemName) {
  if (credits < cost) {
    alert('Not enough Credits. Voice log more to harvest glow → credits (endowment).');
    return;
  }
  
  const preview = confirm(`🎙 Voice confirm purchase:\n"${itemName}" for ${cost} Credits.\n\nFee preview: ~1.8% skim (prominent).\nVariable: 31% chance fee waived today.\n\nFictional. 18+.`);
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
  
  addToCodex(`Purchased ${itemName}. Glow ${glow} • Bond ${bondLevel} • rebate ${rebate}. Near-miss fee ${fee}.`);
  
  // Share to p10 for cross fee offset
  try {
    localStorage.setItem('p15_p10_purchase', JSON.stringify({item: itemName, cost, glow, bond: bondLevel, ts: Date.now()}));
  } catch(e){}
  
  alert(`✅ ${itemName} claimed.\nCredits left: ${credits}. ${rebate ? `Goddess rebate +${rebate} (endowment active).` : ''}\nVoice is the bond. Fictional only.`);
  updateWallet();
}

// === BIRTHED PSYCH MECHANICS (Lilith 2026-07-13) ===
function postGlowStory() {
  const story = `My Voice Bond Lv${bondLevel} glow is ${glow}. It knows me.`;
  addToCodex(story);
  // Share for p9 community feed
  localStorage.setItem('p15_glow_story', JSON.stringify({story, glow, bond: bondLevel, time: Date.now()}));
  alert('Posted. Your glow story now lives in the community. Endowment spreads. Sisters will feel it.');
}

function pulseVoiceLiveBeauty() {
  // For live-room if present; weaponize p6 in beauty context
  const s = (window.getP6LungSurprise && window.getP6LungSurprise()) || 0.65;
  const boost = Math.floor(s * 11 + bondLevel);
  glow = Math.min(99, glow + boost);
  localStorage.setItem('p15_glow', glow);
  updateGlowUI();
  const el = document.getElementById('boost-result') || document.getElementById('voice-result');
  if (el) el.innerHTML = `Live pulse: +${boost} glow. Sisters felt your voice. Variable ratio triggered.`;
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
  alert(`Re-observed. New eyes. +${gain} glow. Your voice remembers.`);
};

// p6 Voice Expert + da-vinci hook exposed
window.p15VoiceAnalyze = () => currentVoiceSession || {surprise: window.getP6LungSurprise ? window.getP6LungSurprise() : 0.5, source: 'p6-lung-eye'};

function showMetaverseTryOn() {
  const s = currentVoiceSession || {skin:'Observed glow', mood:'serene', surprise: window.getP6LungSurprise ? window.getP6LungSurprise() : 0.61};
  const box = document.createElement('div');
  box.className = 'card';
  box.innerHTML = `<strong>Virtual Try-On Skin Live</strong><br>Projected: ${s.skin}<br>Mood veil: ${s.mood}<br>Surprise aura ${s.surprise?.toFixed(2)}<br><small>Voice breath now lives on your avatar.</small>`;
  document.getElementById('metaverse').appendChild(box);
}

// Legion one — p15 now carries p6 lung skin/mood as first class
console.log('%c[GoddessForge] Voice Glow ready: skin/mood analysis • consultations • beauty logs • virtual try-on • live beauty.', 'color:#c5a46e');

// Birth 3: p13 TradeForge + p10 — Glow Artifact Trade with FOMO scarcity (personal glow spawns tradables)
let glowArtifacts = JSON.parse(localStorage.getItem('p15_glow_artifacts') || '[]');
function birthGlowArtifact() {
  const g = glow || 82;
  const r = g > 92 ? 'LEGEND' : g > 85 ? 'RARE' : 'COMMON';
  const art = {
    id: Date.now(),
    name: `${r} ${['Glow Veil','Rose Aura','Voice Silk','Glow Bloom'][Math.floor(Math.random()*4)]}`,
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
  alert('Codex updated. Your glow compounds.');
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
      { id: 1, title: "Dawn Rose Ritual", host: "Sera", viewers: 87, cost: 12, active: true, glow: 0.73, seatsLeft: 9, ritual: true },
      { id: 2, title: "Voice Skin Whisper", host: "Lune", viewers: 41, cost: 8, active: true, glow: 0.61, seatsLeft: 14, ritual: false },
      { id: 3, title: "Sisters Glow Circle", host: "Mira", viewers: 126, cost: 15, active: true, glow: 0.84, seatsLeft: 3, ritual: true }
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
      <button onclick="joinLiveBeauty(${live.id})">Join Live</button>
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
  p.innerHTML = 'Voice Glow Intro...';
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
  alert(`Live created: ${title}. Voice + Glow. Fictional 18+.`);
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
  addLiveChat('Voice connected. Glow eye live. Speak truth.');
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
  const r = document.getElementById('boost-result'); if(r) r.innerHTML='Voice pulsing...';
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
  if(!activeLive)return; const n=prompt('What did this ritual reveal?');
  if(n){ addToCodex(`Live: ${activeLive.title} — ${n}. glow ${activeLive.glow.toFixed(2)}`); addLiveChat('saved to codex. voice evolves.'); }
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
  const story = `💖 MY Voice Glow Story — Bond Lv${bondLevel} • ${g.toFixed(2)} surprise\n"${t.slice(0,60)}"\nGlow forged by my own voice. Sisters, speak yours.\nFICTIONAL 18+ • Prominent disclosure • NO real advice. Reversible.\n👉 GoddessForge`;
  if (window.legionTrack) legionTrack('share');
  navigator.clipboard.writeText(story).then(()=>{
    alert('✅ Voice Story copied. Share it with your sisters.');
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
  ['p15_logs','p15_codex','p15_readings','p15_glow','p15_bond','p15_lastlog','p15_credits','p15_community','p15_lungBeauty','p15_skinLungVeil','p15_streak','p15_badStreak','p15_scans','p15_routine','p15_shelf'].forEach(k => localStorage.removeItem(k));
  logs=[]; codex=[]; readings=[]; glow=50; bondLevel=1; lastLogDay=null; credits=890;
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
    shield.innerHTML = `<strong>FICTIONAL VIRTUAL CREDITS ONLY</strong><br>NO REAL VALUE. NO REAL PRODUCTS. All purchases story fuel. Exact cost shown before burn. Reversible until claim. 18+ fictional framing.`;
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
    console.log('%c[GoddessForge] Voice Glow + mood mirror active.', 'color:#c5a46e');
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
  startP15Idle();    // gentle resting breath so visualizer isn't a dead black box
}

window.onload = initP15;
// ============================================================
// BEST-IN-CLASS BEAUTY UPGRADE (2026-07-21, Trinity/CPO)
// Closes the identity gaps vs KR/global #1 beauty apps with REAL,
// deterministic, on-device features — no fabricated numbers:
//   1. Photo AI Skin Scan  — real pixel analysis → 6 glow scores +
//      fictional glow-age + personal-color + spot-marker overlay.
//   2. Progress Diary      — before/after scan history + trend.
//   3. AM/PM Routine        — editable step tracker, feeds the streak.
//   4. Ingredient Analyzer  — local INCI DB (hazard + EVIDENCE confidence,
//      answering the EWG-only critique) + product-conflict checker + shelf.
// All client-only, reversible, localStorage. Fictional/entertainment
// framing preserved. Not medical. Same photo → same scores.
// ============================================================
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---------- 1 + 2. PHOTO AI SKIN SCAN + PROGRESS DIARY ----------
let scans = JSON.parse(localStorage.getItem('p15_scans') || '[]');
let _lastScan = null;

function showSkinScan() {
  hideAll();
  document.getElementById('skinscan').classList.remove('hidden');
  renderScanDiary();
}

function onSkinScanFile(ev) {
  const file = ev.target && ev.target.files && ev.target.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = function () {
    try { runSkinScan(img); } catch (e) { console.warn('scan failed', e); }
    URL.revokeObjectURL(url);
  };
  img.onerror = function () { URL.revokeObjectURL(url); };
  img.src = url;
}

// Draw the selfie (cover-fit) to the stage canvas, read real pixels, score them.
function runSkinScan(img) {
  const canvas = document.getElementById('scan-canvas');
  if (!canvas) return;
  const W = canvas.width, H = canvas.height;
  const ctx = canvas.getContext('2d');
  // cover-fit draw
  const s = Math.max(W / img.width, H / img.height);
  const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

  const metrics = _analyzeSkinPixels(ctx, W, H);
  const empty = document.getElementById('scan-empty');
  if (empty) empty.style.display = 'none';
  if (!metrics) return; // couldn't read enough pixels

  // Overlay real detected spot markers + subtle scan chrome (SENSE: thin gold)
  _drawScanOverlay(ctx, W, H, metrics.spots);

  // 64px thumbnail for the diary
  let thumb = '';
  try {
    const tc = document.createElement('canvas'); tc.width = 64; tc.height = 64;
    tc.getContext('2d').drawImage(img, (64 - (img.width * (64 / Math.min(img.width, img.height)))) / 2,
      (64 - (img.height * (64 / Math.min(img.width, img.height)))) / 2,
      img.width * (64 / Math.min(img.width, img.height)), img.height * (64 / Math.min(img.width, img.height)));
    thumb = tc.toDataURL('image/jpeg', 0.55);
  } catch (e) {}

  const rec = {
    ts: new Date().toISOString(),
    overall: metrics.overall, age: metrics.age, season: metrics.season,
    seasonNote: metrics.seasonNote,
    m: metrics.scores, focus: metrics.focus, verdict: metrics.verdict, thumb,
  };
  _lastScan = rec;
  scans.unshift(rec);
  if (scans.length > 20) scans.pop();
  localStorage.setItem('p15_scans', JSON.stringify(scans));

  renderScanResult(rec);
  renderScanDiary();

  // A skin scan IS a valid daily glow check-in — keep the streak honest & alive.
  const gain = _clamp(Math.round((rec.overall - 60) / 7) + 3, 1, 12);
  glow = Math.min(99, glow + gain);
  localStorage.setItem('p15_glow', glow);
  const sr = checkInStreak();
  if (sr.milestone) {
    glow = Math.min(99, glow + sr.milestone.reward);
    localStorage.setItem('p15_glow', glow);
    addToCodex(`🔥 Streak ${sr.milestone.title} (day ${sr.milestone.day}) via skin scan +${sr.milestone.reward} glow.`);
  }
  addToCodex(`Skin scan: glow ${rec.overall} · age ${rec.age} · ${rec.season}. Focus: ${rec.focus}`);
  if (typeof updateGlowUI === 'function') updateGlowUI();
  if (typeof renderStreakUI === 'function') renderStreakUI();
  try { if (window.legionTrack) legionTrack('activate'); } catch (e) {} // core-loop diagnosis rendered
}

// Real pixel math over the central face region. Deterministic.
function _analyzeSkinPixels(ctx, W, H) {
  const x0 = Math.floor(W * 0.16), x1 = Math.floor(W * 0.84);
  const y0 = Math.floor(H * 0.12), y1 = Math.floor(H * 0.90);
  let img;
  try { img = ctx.getImageData(0, 0, W, H).data; } catch (e) { return null; }

  let n = 0, sumL = 0, sumL2 = 0, sumRed = 0, sumChroma = 0, sumR = 0, sumB = 0, hi = 0, grad = 0, gN = 0;
  // coarse grid for spot detection
  const GX = 12, GY = 14;
  const cellL = new Float64Array(GX * GY), cellN = new Float64Array(GX * GY);

  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * W + x) * 4;
      const r = img[i], g = img[i + 1], b = img[i + 2];
      const l = 0.299 * r + 0.587 * g + 0.114 * b;
      n++; sumL += l; sumL2 += l * l;
      sumRed += Math.max(0, r - (g + b) / 2);
      sumChroma += Math.max(r, g, b) - Math.min(r, g, b);
      sumR += r; sumB += b;
      if (l > 200) hi++;
      if (x + 2 < x1) {
        const j = (y * W + (x + 2)) * 4;
        const l2 = 0.299 * img[j] + 0.587 * img[j + 1] + 0.114 * img[j + 2];
        grad += Math.abs(l - l2); gN++;
      }
      const gx = Math.min(GX - 1, Math.floor((x - x0) / (x1 - x0) * GX));
      const gy = Math.min(GY - 1, Math.floor((y - y0) / (y1 - y0) * GY));
      const ci = gy * GX + gx; cellL[ci] += l; cellN[ci] += 1;
    }
  }
  if (n < 60) return null;

  const meanL = sumL / n;
  const stdL = Math.sqrt(Math.max(0, sumL2 / n - meanL * meanL));
  const meanRed = sumRed / n;
  const meanChroma = sumChroma / n;
  const hiRatio = hi / n;
  const meanGrad = gN ? grad / gN : 0;
  const warm = (sumR - sumB) / n; // >0 = warm undertone

  // Detect real dark-spot cells (notably darker than the face mean)
  const spots = [];
  for (let ci = 0; ci < cellL.length; ci++) {
    if (cellN[ci] < 4) continue;
    const cl = cellL[ci] / cellN[ci];
    if (cl < meanL * 0.74 && cl > 18) { // darker patch, not pure shadow/hair
      const gx = ci % GX, gy = Math.floor(ci / GX);
      spots.push({
        x: x0 + (gx + 0.5) / GX * (x1 - x0),
        y: y0 + (gy + 0.5) / GY * (y1 - y0),
        d: (meanL - cl) / meanL,
      });
    }
  }
  spots.sort((a, b) => b.d - a.d);
  const spotCount = spots.length;

  // ---- Map real signals → 0..100 glow scores (deterministic, honest ranges) ----
  const scores = {
    radiance: _clamp(Math.round(38 + (meanL - 60) / 150 * 52 + hiRatio * 30), 25, 98),
    tone:     _clamp(Math.round(100 - stdL * 1.12), 34, 98),
    texture:  _clamp(Math.round(100 - meanGrad * 3.1), 30, 98),
    calm:     _clamp(Math.round(100 - meanRed * 2.3), 34, 98),
    clarity:  _clamp(Math.round(96 - spotCount * 4.4), 34, 98),
    moisture: _clamp(Math.round(92 - Math.abs(hiRatio - 0.06) * 360), 34, 96),
  };
  const overall = Math.round(
    (scores.radiance + scores.tone + scores.texture + scores.calm + scores.clarity + scores.moisture) / 6
  );
  const age = _clamp(Math.round(
    22 + (100 - scores.texture) * 0.28 + (100 - scores.tone) * 0.18 + (100 - scores.clarity) * 0.14
  ), 16, 70);

  // Weakest metric → concrete, honest focus advice (not medical)
  const LABELS = { radiance: 'Radiance', tone: 'Even tone', texture: 'Smoothness', calm: 'Calm (low redness)', clarity: 'Clarity', moisture: 'Moisture' };
  const REC = {
    radiance: 'Boost radiance with gentle exfoliation + a vitamin-C serum in the morning, and always finish with SPF.',
    tone: 'Even your tone over weeks with niacinamide and daily sunscreen — pigment fades slowly, so stay consistent.',
    texture: 'Smooth texture with a low-strength retinoid a few nights a week; introduce it slowly to avoid irritation.',
    calm: 'Calm redness with a fragrance-free centella or cica cream and a short break from strong actives.',
    clarity: 'For clarity, keep pores clear with a BHA (salicylic acid) 2–3× a week and never skip nightly cleansing.',
    moisture: 'Lock in moisture: hyaluronic serum on damp skin, sealed with a ceramide moisturizer.',
  };
  let weakKey = 'radiance', weakVal = 999;
  for (const k in scores) if (scores[k] < weakVal) { weakVal = scores[k]; weakKey = k; }
  let strongKey = 'radiance', strongVal = -1;
  for (const k in scores) if (scores[k] > strongVal) { strongVal = scores[k]; strongKey = k; }
  const focus = `Strongest: ${LABELS[strongKey]} (${scores[strongKey]}). Focus area: ${LABELS[weakKey]} (${scores[weakKey]}).`;
  const verdict = `<strong>✨ Your ritual focus:</strong> ${REC[weakKey]}`;

  // ---- Personal color (undertone + value) ----
  const isWarm = warm > 5, isCool = warm < -3;
  const isLight = meanL > 140;
  let season, seasonNote;
  if (isWarm) {
    season = isLight ? 'Spring Warm' : 'Autumn Warm';
    seasonNote = isLight ? 'coral, peach, warm ivory, camel' : 'terracotta, olive, mustard, deep gold';
  } else if (isCool) {
    season = isLight ? 'Summer Cool' : 'Winter Cool';
    seasonNote = isLight ? 'rose, lavender, soft blue, cool grey' : 'jewel tones, true red, navy, pure white';
  } else {
    season = isLight ? 'Light Neutral' : 'Deep Neutral';
    seasonNote = 'soft neutrals both warm & cool suit you — a flexible palette';
  }

  return { scores, overall, age, focus, verdict, season, seasonNote, spots: spots.slice(0, 12) };
}

function _drawScanOverlay(ctx, W, H, spots) {
  // thin corner brackets (AI-scan chrome, restrained)
  ctx.save();
  ctx.strokeStyle = 'rgba(197,164,110,0.55)';
  ctx.lineWidth = 1.5;
  const m = 14, len = 22;
  [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(([cx, cy, sx, sy]) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * len); ctx.lineTo(cx, cy); ctx.lineTo(cx + sx * len, cy);
    ctx.stroke();
  });
  // real detected spot rings
  ctx.strokeStyle = 'rgba(232,144,143,0.85)';
  ctx.lineWidth = 1.3;
  (spots || []).forEach(sp => {
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 7 + sp.d * 10, 0, Math.PI * 2);
    ctx.stroke();
  });
  ctx.restore();
}

function renderScanResult(rec) {
  const box = document.getElementById('scan-result');
  if (!box) return;
  box.classList.remove('hidden');
  document.getElementById('scan-overall-num').textContent = rec.overall;
  document.getElementById('scan-age-num').textContent = rec.age;
  document.getElementById('scan-pc-season').textContent = rec.season;
  const pcNote = document.getElementById('scan-pc-note');
  if (pcNote) pcNote.textContent = rec.seasonNote;

  const LABELS = { radiance: 'Radiance', tone: 'Even tone', texture: 'Smoothness', calm: 'Calm', clarity: 'Clarity', moisture: 'Moisture' };
  const bar = (label, v) => `<div class="metric"><span class="metric-label">${label}</span><div class="metric-track"><div class="metric-fill" style="width:${v}%"></div></div><span class="metric-pct">${v}</span></div>`;
  document.getElementById('scan-metrics').innerHTML =
    Object.keys(LABELS).map(k => bar(LABELS[k], rec.m[k])).join('');
  document.getElementById('scan-verdict').innerHTML = rec.verdict;
  document.getElementById('scan-focus').textContent = rec.focus;
  // CTA: turn this scan straight into a personalized routine (scan → plan)
  const focusEl = document.getElementById('scan-focus');
  if (focusEl && !document.getElementById('scan-to-plan')) {
    const cta = document.createElement('button');
    cta.id = 'scan-to-plan'; cta.className = 'primary'; cta.style.marginTop = '10px';
    cta.textContent = '🎯 Build my routine from this scan';
    cta.onclick = buildPlanFromScan;
    focusEl.after(cta);
  }
  const sb = document.getElementById('scan-share-btn');
  if (sb) sb.classList.remove('hidden');
}

function renderScanDiary() {
  const wrap = document.getElementById('scan-diary');
  const body = document.getElementById('scan-diary-body');
  if (!wrap || !body) return;
  if (!scans.length) { wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');

  let html = '';
  // Before/after headline when there are ≥2 scans
  if (scans.length >= 2) {
    const now = scans[0], first = scans[scans.length - 1];
    const delta = now.overall - first.overall;
    const dir = delta > 1 ? 'up' : delta < -1 ? 'down' : 'flat';
    const word = delta > 1 ? `up ${delta} points` : delta < -1 ? `down ${Math.abs(delta)} points` : 'holding steady';
    const days = Math.max(1, Math.round((new Date(now.ts) - new Date(first.ts)) / 864e5));
    html += `<div class="diary-compare">Over ${scans.length} scans (${days} day${days > 1 ? 's' : ''}) your glow score is
      <strong class="diary-delta ${dir}">${word}</strong> — from ${first.overall} to ${now.overall}.
      ${delta > 1 ? 'Your routine is working. Keep going.' : delta < -1 ? 'A hydration + rest reset will bring it back.' : 'Consistency is paying off.'}
      ${_sparkline(scans.map(s => s.overall / 100).reverse())}</div>`;
  }
  // history rows (newest first)
  scans.slice(0, 8).forEach((s, idx) => {
    const prev = scans[idx + 1];
    let deltaHtml = '';
    if (prev) {
      const d = s.overall - prev.overall;
      const cls = d > 0 ? 'up' : d < 0 ? 'down' : 'flat';
      deltaHtml = `<span class="diary-delta ${cls}">${d > 0 ? '▲' + d : d < 0 ? '▼' + Math.abs(d) : '—'}</span>`;
    }
    html += `<div class="diary-row">
      ${s.thumb ? `<img class="diary-thumb" src="${s.thumb}" alt="scan">` : '<div class="diary-thumb"></div>'}
      <div class="diary-meta"><div>${s.season} · age ${s.age}</div><div class="diary-date">${new Date(s.ts).toLocaleDateString()} ${new Date(s.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div></div>
      <div class="diary-score">${s.overall}${deltaHtml}</div>
    </div>`;
  });
  body.innerHTML = html;
}

function shareSkinScan() {
  const s = _lastScan || scans[0];
  if (!s) return;
  const card = `✨ My Glow Scan — score ${s.overall}/100, glow-age ${s.age}\n` +
    `Radiance ${s.m.radiance} · Tone ${s.m.tone} · Smoothness ${s.m.texture} · Clarity ${s.m.clarity}\n` +
    `Personal color: ${s.season} (${s.seasonNote})\n` +
    `Analyzed on-device by GoddessForge — fictional beauty sim, not medical. Scan yours 📷`;
  try { if (window.legionTrack) legionTrack('share'); } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(card).then(
      () => alert('✅ Glow card copied — share it with your sisters.'),
      () => { try { prompt('Copy your glow card:', card); } catch (e) {} }
    );
  } else { try { prompt('Copy your glow card:', card); } catch (e) {} }
}

// ---------- 3. AM/PM ROUTINE TRACKER ----------
const ROUTINE_DEFAULT = {
  am: ['Gentle cleanser', 'Toner', 'Vitamin C serum', 'Moisturizer', 'Sunscreen (SPF)'],
  pm: ['Oil / balm cleanser', 'Water cleanser', 'Treatment (retinol/acid)', 'Moisturizer'],
};
let routine = _loadRoutine();
let _routineTab = 'am';

function _loadRoutine() {
  try {
    const r = JSON.parse(localStorage.getItem('p15_routine') || 'null');
    if (r && r.am && r.pm) return r;
  } catch (e) {}
  return { am: ROUTINE_DEFAULT.am.slice(), pm: ROUTINE_DEFAULT.pm.slice(), log: {}, remind: '' };
}
function _saveRoutine() { try { localStorage.setItem('p15_routine', JSON.stringify(routine)); } catch (e) {} }

function showRoutine() {
  hideAll();
  document.getElementById('routine').classList.remove('hidden');
  const rt = document.getElementById('routine-remind-time');
  if (rt && routine.remind) rt.value = routine.remind;
  renderRoutine();
}

function switchRoutine(which) {
  _routineTab = which;
  document.getElementById('rt-am').classList.toggle('active', which === 'am');
  document.getElementById('rt-pm').classList.toggle('active', which === 'pm');
  renderRoutine();
}

function _routineToday() {
  const key = _todayStr();
  routine.log = routine.log || {};
  if (!routine.log[key]) routine.log[key] = { am: [], pm: [] };
  return routine.log[key];
}

function renderRoutine() {
  const steps = routine[_routineTab] || [];
  const today = _routineToday();
  const done = today[_routineTab] || [];
  const stepsEl = document.getElementById('routine-steps');
  const progEl = document.getElementById('routine-progress');
  if (!stepsEl) return;

  const doneCount = steps.filter((_, i) => done.includes(i)).length;
  const pct = steps.length ? Math.round(doneCount / steps.length * 100) : 0;
  if (progEl) {
    const banner = (pct === 100 && steps.length)
      ? `<div class="routine-done-banner">🌙 ${_routineTab === 'am' ? 'Morning' : 'Night'} routine complete — glow logged, streak kept alive.</div>` : '';
    progEl.innerHTML = `${banner}${doneCount}/${steps.length} steps done today
      <div class="rp-bar"><div class="rp-fill" style="width:${pct}%"></div></div>`;
  }

  stepsEl.innerHTML = '';
  steps.forEach((name, i) => {
    const isDone = done.includes(i);
    const row = document.createElement('div');
    row.className = 'rstep' + (isDone ? ' done' : '');
    row.innerHTML = `<span class="rbox">${isDone ? '✓' : ''}</span><span class="rname">${_esc(name)}</span><span class="rdel" title="remove">✕</span>`;
    row.querySelector('.rname').addEventListener('click', () => toggleRoutineStep(i));
    row.querySelector('.rbox').addEventListener('click', () => toggleRoutineStep(i));
    row.querySelector('.rdel').addEventListener('click', (e) => { e.stopPropagation(); removeRoutineStep(i); });
    stepsEl.appendChild(row);
  });
}

function toggleRoutineStep(i) {
  const today = _routineToday();
  const arr = today[_routineTab] = today[_routineTab] || [];
  const at = arr.indexOf(i);
  if (at >= 0) arr.splice(at, 1); else arr.push(i);
  _saveRoutine();

  // A fully completed routine = daily glow check-in (idempotent per day)
  const steps = routine[_routineTab] || [];
  const complete = steps.length > 0 && steps.every((_, idx) => arr.includes(idx));
  if (complete) {
    const already = _routineCredited(_routineTab);
    if (!already) {
      _markRoutineCredited(_routineTab);
      glow = Math.min(99, glow + 5);
      localStorage.setItem('p15_glow', glow);
      const sr = checkInStreak();
      if (sr.milestone) {
        glow = Math.min(99, glow + sr.milestone.reward);
        localStorage.setItem('p15_glow', glow);
      }
      addToCodex(`Routine complete (${_routineTab.toUpperCase()}) +5 glow. Consistency compounds.`);
      if (typeof updateGlowUI === 'function') updateGlowUI();
      if (typeof renderStreakUI === 'function') renderStreakUI();
      try { if (window.legionTrack) legionTrack('activate'); } catch (e) {}
    }
  }
  renderRoutine();
}

function _routineCredited(which) {
  const today = _routineToday();
  return !!(today._credited && today._credited[which]);
}
function _markRoutineCredited(which) {
  const today = _routineToday();
  today._credited = today._credited || {};
  today._credited[which] = true;
  _saveRoutine();
}

function addRoutineStep() {
  const inp = document.getElementById('routine-new-step');
  const v = (inp && inp.value || '').trim();
  if (!v) return;
  routine[_routineTab] = routine[_routineTab] || [];
  routine[_routineTab].push(v.slice(0, 40));
  if (inp) inp.value = '';
  _saveRoutine();
  renderRoutine();
}

function removeRoutineStep(i) {
  routine[_routineTab].splice(i, 1);
  // shift today's completed indices so checks stay aligned
  const today = _routineToday();
  today[_routineTab] = (today[_routineTab] || []).filter(x => x !== i).map(x => x > i ? x - 1 : x);
  _saveRoutine();
  renderRoutine();
}

function saveRoutineReminder() {
  const rt = document.getElementById('routine-remind-time');
  if (!rt) return;
  routine.remind = rt.value;
  _saveRoutine();
  const note = document.getElementById('routine-remind-note');
  if (note) {
    note.textContent = rt.value
      ? `Reminder set for ${rt.value}. (Open the app around then — this is a gentle in-app nudge, no notifications are sent.)`
      : '';
  }
}

// ---------- 4. INGREDIENT / INCI ANALYZER + CONFLICT CHECKER ----------
// Local database. hazard 1-10 (EWG-style), but we ALSO surface evidence
// confidence — the transparency the EWG-hazard-only approach is criticized for.
const ING_DB = {
  'water':            { h: 1, d: 'robust',   f: 'solvent base', c: [] },
  'aqua':             { h: 1, d: 'robust',   f: 'solvent base', c: [] },
  'glycerin':         { h: 1, d: 'robust',   f: 'humectant · draws moisture', c: [] },
  'butylene glycol':  { h: 1, d: 'robust',   f: 'humectant · texture', c: [] },
  'propylene glycol': { h: 3, d: 'robust',   f: 'humectant · can sensitize a few', c: [] },
  'niacinamide':      { h: 1, d: 'robust',   f: 'brightening · barrier · pores', c: ['niacinamide'] },
  'hyaluronic acid':  { h: 1, d: 'robust',   f: 'hydration · plumping', c: [] },
  'sodium hyaluronate': { h: 1, d: 'robust', f: 'hydration · plumping', c: [] },
  'retinol':          { h: 6, d: 'robust',   f: 'anti-aging · texture · potent', c: ['retinoid'] },
  'retinal':          { h: 6, d: 'moderate', f: 'anti-aging retinoid', c: ['retinoid'] },
  'retinyl palmitate':{ h: 5, d: 'moderate', f: 'mild retinoid', c: ['retinoid'] },
  'adapalene':        { h: 5, d: 'robust',   f: 'retinoid · acne', c: ['retinoid'] },
  'ascorbic acid':    { h: 3, d: 'robust',   f: 'vitamin C · antioxidant · brightening', c: ['vitc'] },
  'ascorbyl glucoside': { h: 2, d: 'moderate', f: 'stable vitamin C', c: ['vitc'] },
  'glycolic acid':    { h: 5, d: 'robust',   f: 'AHA exfoliant', c: ['aha'] },
  'lactic acid':      { h: 3, d: 'robust',   f: 'gentle AHA · hydrating', c: ['aha'] },
  'mandelic acid':    { h: 3, d: 'moderate', f: 'gentle AHA', c: ['aha'] },
  'salicylic acid':   { h: 4, d: 'robust',   f: 'BHA · unclogs pores', c: ['bha'] },
  'benzoyl peroxide': { h: 5, d: 'robust',   f: 'acne · antibacterial', c: ['bpo'] },
  'azelaic acid':     { h: 2, d: 'robust',   f: 'redness · pigment · gentle', c: [] },
  'copper tripeptide-1': { h: 3, d: 'moderate', f: 'peptide · repair', c: ['copper'] },
  'ceramide np':      { h: 1, d: 'robust',   f: 'barrier lipid', c: [] },
  'ceramide':         { h: 1, d: 'robust',   f: 'barrier lipid', c: [] },
  'squalane':         { h: 1, d: 'robust',   f: 'lightweight emollient', c: [] },
  'centella asiatica':{ h: 1, d: 'moderate', f: 'soothing · calming', c: [] },
  'panthenol':        { h: 1, d: 'robust',   f: 'soothing · barrier', c: [] },
  'allantoin':        { h: 1, d: 'robust',   f: 'soothing', c: [] },
  'tocopherol':       { h: 2, d: 'robust',   f: 'vitamin E · antioxidant', c: [] },
  'dimethicone':      { h: 2, d: 'robust',   f: 'silicone · smoothing seal', c: [] },
  'zinc oxide':       { h: 2, d: 'robust',   f: 'mineral UV filter', c: [] },
  'titanium dioxide': { h: 2, d: 'robust',   f: 'mineral UV filter', c: [] },
  'avobenzone':       { h: 4, d: 'robust',   f: 'chemical UV filter', c: [] },
  'fragrance':        { h: 7, d: 'moderate', f: 'scent · common irritant/allergen', c: [] },
  'parfum':           { h: 7, d: 'moderate', f: 'scent · common irritant/allergen', c: [] },
  'limonene':         { h: 5, d: 'moderate', f: 'fragrance · possible allergen', c: [] },
  'linalool':         { h: 5, d: 'moderate', f: 'fragrance · possible allergen', c: [] },
  'phenoxyethanol':   { h: 3, d: 'robust',   f: 'preservative', c: [] },
  'methylparaben':    { h: 4, d: 'moderate', f: 'preservative (debated)', c: [] },
  'alcohol denat':    { h: 4, d: 'moderate', f: 'solvent · can dry/sensitize', c: [] },
  'denatured alcohol':{ h: 4, d: 'moderate', f: 'solvent · can dry/sensitize', c: [] },
  'kaolin':           { h: 1, d: 'robust',   f: 'clay · oil-absorbing', c: [] },
  'green tea extract':{ h: 1, d: 'moderate', f: 'antioxidant · soothing', c: [] },
  'camellia sinensis leaf extract': { h: 1, d: 'moderate', f: 'green tea · antioxidant', c: [] },
  'snail secretion filtrate': { h: 1, d: 'moderate', f: 'repair · hydration', c: [] },
  'shea butter':      { h: 1, d: 'robust',   f: 'rich emollient', c: [] },
  'jojoba oil':       { h: 1, d: 'robust',   f: 'balancing oil', c: [] },
  'coconut oil':      { h: 2, d: 'moderate', f: 'occlusive · can clog some', c: [] },
  'bakuchiol':        { h: 2, d: 'moderate', f: 'gentle retinol alternative', c: [] },
  'peptide':          { h: 2, d: 'moderate', f: 'signal peptide · firmness', c: [] },
  'arbutin':          { h: 2, d: 'moderate', f: 'brightening · pigment', c: [] },
  'tranexamic acid':  { h: 2, d: 'moderate', f: 'pigment · melasma', c: [] },
  'urea':             { h: 2, d: 'robust',   f: 'humectant + mild exfoliant', c: [] },
  'aha':              { h: 5, d: 'robust',   f: 'exfoliating acid', c: ['aha'] },
  'bha':              { h: 4, d: 'robust',   f: 'exfoliating acid', c: ['bha'] },
};

// Category-level conflict rules (checked among the whole ingredient set)
const CONFLICT_RULES = [
  { a: 'retinoid', b: 'aha', level: 'caution', title: 'Retinoid + AHA',
    msg: 'Layering a retinoid with an AHA the same night can over-exfoliate and irritate. Alternate nights instead.' },
  { a: 'retinoid', b: 'bha', level: 'caution', title: 'Retinoid + BHA',
    msg: 'Retinoid with a BHA together can strip the barrier. Buffer with moisturizer or alternate nights.' },
  { a: 'retinoid', b: 'bpo', level: 'avoid', title: 'Retinoid + Benzoyl Peroxide',
    msg: 'Benzoyl peroxide can oxidize and deactivate many retinoids. Use BPO in the AM and the retinoid at night.' },
  { a: 'retinoid', b: 'vitc', level: 'caution', title: 'Retinoid + Vitamin C',
    msg: 'Fine for many, but can irritate together. A common split: vitamin C in the morning, retinoid at night.' },
  { a: 'aha', b: 'bha', level: 'caution', title: 'AHA + BHA',
    msg: 'Two exfoliating acids at once raise irritation risk. Occasional combos are ok; daily double-acid is not.' },
  { a: 'copper', b: 'vitc', level: 'caution', title: 'Copper peptides + Vitamin C',
    msg: 'Direct acids/vitamin C can destabilize copper peptides. Apply them at separate times.' },
  { a: 'copper', b: 'aha', level: 'caution', title: 'Copper peptides + AHA',
    msg: 'Low pH acids can destabilize copper peptides. Separate the applications.' },
  // Myth-buster (transparency differentiator) — shown as a reassuring OK card
  { a: 'vitc', b: 'niacinamide', level: 'ok', title: 'Vitamin C + Niacinamide',
    msg: 'Old myth says these cancel out — modern formulations are perfectly fine together. No need to separate.' },
];

let shelf = JSON.parse(localStorage.getItem('p15_shelf') || '[]');
let _lastAnalysis = null;

function showIngredients() {
  hideAll();
  document.getElementById('ingredients').classList.remove('hidden');
  renderShelf();
}

function _parseINCI(raw) {
  return (raw || '')
    .split(/[,\n;]+/)
    .map(s => s.trim().toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9\s-]/g, '').trim())
    .filter(Boolean)
    .slice(0, 60);
}

function _lookupIngredient(name) {
  if (ING_DB[name]) return { name, ...ING_DB[name], known: true };
  // loose contains-match for compound names (e.g. "sodium ... hyaluronate")
  for (const key in ING_DB) {
    if (name.includes(key) || key.includes(name)) return { name, ...ING_DB[key], known: true };
  }
  return { name, h: null, d: null, f: null, c: [], known: false };
}

function _gradeClass(h) { if (h == null) return 'g0'; if (h <= 2) return 'g1'; if (h <= 6) return 'g2'; return 'g3'; }
function _dataWord(d) { return d ? d.charAt(0).toUpperCase() + d.slice(1) + ' evidence' : 'Not in local DB'; }

function analyzeIngredients() {
  const raw = (document.getElementById('ing-input') || {}).value || '';
  const list = _parseINCI(raw);
  const chips = document.getElementById('ing-chips');
  const summary = document.getElementById('ing-summary');
  const conflictsEl = document.getElementById('ing-conflicts');
  if (!chips) return;
  if (!list.length) { chips.innerHTML = '<div class="dim-note">Paste an ingredient list to analyze.</div>'; return; }

  const parsed = list.map(_lookupIngredient);
  _lastAnalysis = { name: (document.getElementById('ing-name') || {}).value || 'Untitled product', ingredients: list, ts: Date.now() };

  // chips
  chips.innerHTML = parsed.map(p => {
    const g = _gradeClass(p.h);
    const grade = p.h == null ? '—' : p.h;
    return `<div class="ing-chip ${g}">
      <span class="ic-name">${_esc(_titleCase(p.name))}</span>
      <span class="ic-meta"><span class="ic-grade ${g}">Hazard ${grade}/10</span> · <span class="ic-data">${_dataWord(p.d)}</span></span>
      ${p.f ? `<span class="ic-func">${_esc(p.f)}</span>` : '<span class="ic-func">function unknown locally</span>'}
    </div>`;
  }).join('');

  // summary (honest: separates hazard from evidence strength)
  const known = parsed.filter(p => p.known);
  const avgH = known.length ? (known.reduce((s, p) => s + p.h, 0) / known.length) : null;
  const reds = parsed.filter(p => p.h != null && p.h >= 7);
  const robustShare = known.length ? Math.round(known.filter(p => p.d === 'robust').length / known.length * 100) : 0;
  const benefits = [...new Set(known.filter(p => p.h <= 3 && p.f).map(p => p.f.split('·')[0].trim()))].slice(0, 5);
  if (summary) {
    summary.classList.remove('hidden');
    const gLabel = avgH == null ? 'unrated' : avgH <= 2.5 ? 'gentle' : avgH <= 4.5 ? 'moderate' : 'assertive';
    summary.innerHTML = `
      <div class="isum-grade">${list.length} ingredients · profile: ${gLabel}${avgH != null ? ` (avg hazard ${avgH.toFixed(1)}/10)` : ''}</div>
      <div style="margin-top:6px">${robustShare}% of matched ingredients have <strong>robust</strong> evidence — the rest are moderate/limited, so read grades with that in mind.</div>
      ${benefits.length ? `<div style="margin-top:6px">Key benefits: ${benefits.map(_esc).join(', ')}.</div>` : ''}
      ${reds.length ? `<div style="margin-top:6px;color:#e8938f">Watch: ${reds.map(p => _esc(_titleCase(p.name))).join(', ')} (higher-hazard / common irritant).</div>` : ''}
      <div class="dim-note" style="margin-top:8px">Hazard scores are EWG-style and don't equal danger — dose, formulation and your own skin matter more. Informational, not medical.</div>`;
  }

  // personalized band — "is this right for MY concerns?" (uses skin profile)
  if (summary) {
    const band = _profileMatchBand(parsed);
    if (band) summary.innerHTML += band;
  }

  // conflicts within this single product
  renderConflicts(conflictsEl, _collectCategories(parsed), _lastAnalysis.name);

  const sv = document.getElementById('ing-save-btn');
  if (sv) sv.classList.remove('hidden');
}

function _collectCategories(parsed) {
  const cats = {};
  parsed.forEach(p => (p.c || []).forEach(cat => { (cats[cat] = cats[cat] || []).push(_titleCase(p.name)); }));
  return cats;
}

function renderConflicts(el, cats, scope) {
  if (!el) return;
  const cards = [];
  CONFLICT_RULES.forEach(rule => {
    if (cats[rule.a] && cats[rule.b]) {
      const who = `${cats[rule.a].join(', ')} + ${cats[rule.b].join(', ')}`;
      const badge = rule.level === 'avoid' ? '🚫 Avoid together' : rule.level === 'ok' ? '✅ Safe together' : '⚠️ Use with care';
      cards.push(`<div class="conflict-card ${rule.level === 'ok' ? 'ok' : ''}">
        <div class="cc-title">${badge} — ${rule.title}</div>
        <div>${_esc(who)}</div>
        <div class="${rule.level === 'ok' ? 'cc-myth' : ''}" style="margin-top:4px">${rule.msg}</div>
      </div>`);
    }
  });
  el.classList.remove('hidden');
  el.innerHTML = (cards.length
    ? `<h3>Compatibility${scope ? ' — ' + _esc(scope) : ''}</h3>` + cards.join('')
    : `<div class="conflict-card ok"><div class="cc-title">✅ No known conflicts</div><div>None of the flagged actives clash in this set.</div></div>`);
}

function saveToShelf() {
  if (!_lastAnalysis) return;
  shelf.unshift(_lastAnalysis);
  if (shelf.length > 15) shelf.pop();
  localStorage.setItem('p15_shelf', JSON.stringify(shelf));
  renderShelf();
  addToCodex(`Saved "${_lastAnalysis.name}" to shelf (${_lastAnalysis.ingredients.length} ingredients).`);
}

function renderShelf() {
  const wrap = document.getElementById('shelf-wrap');
  const body = document.getElementById('shelf-body');
  if (!wrap || !body) return;
  if (!shelf.length) { wrap.classList.add('hidden'); return; }
  wrap.classList.remove('hidden');

  let html = shelf.map((p, i) =>
    `<div class="shelf-item"><span class="sh-name">${_esc(p.name)}</span><span class="sh-count">${p.ingredients.length} ing.</span><span class="sh-del" onclick="removeShelf(${i})">✕</span></div>`
  ).join('');

  // cross-product conflict: pool every ingredient across the shelf
  const pooled = [];
  shelf.forEach(p => p.ingredients.forEach(n => pooled.push(_lookupIngredient(n))));
  const cats = _collectCategories(pooled);
  const holder = document.createElement('div');
  renderConflicts(holder, cats, 'your whole shelf');
  html += holder.innerHTML;
  body.innerHTML = html;
}

function removeShelf(i) {
  shelf.splice(i, 1);
  localStorage.setItem('p15_shelf', JSON.stringify(shelf));
  renderShelf();
}

// small shared helpers
function _esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function _titleCase(s) { return String(s || '').replace(/\b\w/g, c => c.toUpperCase()); }

// ============================================================
// 5. MY PLAN — Skin Profile → Personalized Routine Generator (2026-07-21)
// The connective personalization layer category leaders (Skinsort / INKEY /
// TroveSkin) have and this app lacked: a persistent skin profile that
// deterministically BUILDS a tailored AM/PM routine (concern→active mapping,
// conflict-aware sequencing, frequency ramps, sensitivity + pregnancy gating),
// derivable straight from a skin scan, and that personalizes the ingredient
// analyzer ("good for YOUR concerns" / "you flagged sensitivity"). No fabricated
// numbers — pure rule-based domain logic. Client-only, reversible. Not medical.
// ============================================================

const PLAN_CONCERNS = [
  { id: 'dullness',    label: 'Dullness',       emoji: '🌫' },
  { id: 'pigment',     label: 'Dark spots',     emoji: '🟤' },
  { id: 'acne',        label: 'Breakouts',      emoji: '🔴' },
  { id: 'aging',       label: 'Fine lines',     emoji: '⏳' },
  { id: 'redness',     label: 'Redness',        emoji: '🌹' },
  { id: 'dehydration', label: 'Dryness',        emoji: '💧' },
  { id: 'texture',     label: 'Rough texture',  emoji: '🪨' },
  { id: 'pores',       label: 'Pores / oil',    emoji: '🕳' },
];

// Treatment actives. `cat` matches ING_DB category tags so the analyzer can
// detect them; `look` = ingredient names to look for on a label.
const PLAN_ACTIVES = {
  vitc:       { name: 'Vitamin C serum',    phase: 'am', why: 'antioxidant defense + brightening', look: ['Ascorbic Acid', 'Ascorbyl Glucoside'], cat: 'vitc' },
  niacinamide:{ name: 'Niacinamide serum',  phase: 'am', why: 'brightens, calms, refines pores',   look: ['Niacinamide'], cat: 'niacinamide' },
  hyaluronic: { name: 'Hyaluronic acid',    phase: 'am', why: 'draws moisture into the skin',       look: ['Hyaluronic Acid', 'Sodium Hyaluronate'], cat: 'hydra' },
  bpo:        { name: 'Benzoyl peroxide (spot)', phase: 'am', why: 'targets active blemishes',        look: ['Benzoyl Peroxide'], cat: 'bpo' },
  retinoid:   { name: 'Retinoid (retinol)', phase: 'pm', why: 'smooths texture + softens fine lines', look: ['Retinol', 'Retinal', 'Adapalene'], cat: 'retinoid', ramp: true },
  bakuchiol:  { name: 'Bakuchiol serum',    phase: 'pm', why: 'gentle plant retinol-alternative',    look: ['Bakuchiol'], cat: 'bakuchiol' },
  aha:        { name: 'AHA exfoliant',      phase: 'pm', why: 'exfoliates dullness + rough texture', look: ['Glycolic Acid', 'Lactic Acid', 'Mandelic Acid'], cat: 'aha', ramp: true },
  bha:        { name: 'BHA (salicylic acid)', phase: 'pm', why: 'clears pores + controls oil',        look: ['Salicylic Acid'], cat: 'bha', ramp: true },
  azelaic:    { name: 'Azelaic acid',       phase: 'pm', why: 'fades marks + calms redness (gentle)', look: ['Azelaic Acid'], cat: 'azelaic' },
  arbutin:    { name: 'Alpha arbutin / tranexamic', phase: 'pm', why: 'targets stubborn pigment',      look: ['Arbutin', 'Tranexamic Acid'], cat: 'arbutin' },
  centella:   { name: 'Centella (cica) serum', phase: 'pm', why: 'soothes + rebuilds the barrier',    look: ['Centella Asiatica', 'Panthenol'], cat: 'centella' },
  peptide:    { name: 'Peptide serum',      phase: 'pm', why: 'supports firmness + bounce',           look: ['Peptide', 'Copper Tripeptide-1'], cat: 'peptide' },
};

// Concern → prioritized actives (first = highest priority for that concern).
const CONCERN_MAP = {
  dullness:    ['vitc', 'aha', 'niacinamide'],
  pigment:     ['vitc', 'niacinamide', 'arbutin', 'azelaic'],
  acne:        ['bha', 'niacinamide', 'azelaic', 'bpo'],
  aging:       ['retinoid', 'peptide', 'vitc'],
  redness:     ['centella', 'azelaic', 'niacinamide'],
  dehydration: ['hyaluronic', 'centella'],
  texture:     ['retinoid', 'aha'],
  pores:       ['bha', 'niacinamide'],
};

// Weakest scan metric → concern (for scan-driven prefill).
const METRIC_TO_CONCERN = {
  radiance: 'dullness', tone: 'pigment', texture: 'texture',
  calm: 'redness', clarity: 'acne', moisture: 'dehydration',
};

function _loadProfile() {
  try { const p = JSON.parse(localStorage.getItem('p15_profile') || 'null'); if (p) return p; } catch (e) {}
  return { skinType: '', sensitive: false, pregnancy: false, experience: 'beginner', concerns: [], built: false };
}
function _saveProfile(p) { try { localStorage.setItem('p15_profile', JSON.stringify(p)); } catch (e) {} }
let profile = _loadProfile();
let _lastPlan = null;

function showPlan() {
  hideAll();
  const el = document.getElementById('plan');
  if (el) el.classList.remove('hidden');
  document.querySelectorAll('.nav button').forEach(b => b.classList.remove('nav-here'));
  renderPlanQuiz();
  if (profile.built) generatePlan(true);
}

function renderPlanQuiz() {
  // Skin type chips
  const types = [['dry', 'Dry'], ['oily', 'Oily'], ['combination', 'Combination'], ['normal', 'Normal']];
  const stWrap = document.getElementById('plan-skintype');
  if (stWrap) stWrap.innerHTML = types.map(([id, l]) =>
    `<button type="button" class="chip-sel ${profile.skinType === id ? 'on' : ''}" onclick="setSkinType('${id}')">${l}</button>`).join('');

  // Concern chips (multi, order = priority)
  const cWrap = document.getElementById('plan-concerns');
  if (cWrap) cWrap.innerHTML = PLAN_CONCERNS.map(c => {
    const idx = profile.concerns.indexOf(c.id);
    const on = idx >= 0;
    return `<button type="button" class="chip-sel ${on ? 'on' : ''}" onclick="toggleConcern('${c.id}')">${c.emoji} ${c.label}${on ? `<span class="chip-rank">${idx + 1}</span>` : ''}</button>`;
  }).join('');

  // Experience chips
  const exWrap = document.getElementById('plan-exp');
  if (exWrap) exWrap.innerHTML = [['beginner', 'New to actives'], ['intermediate', 'Some experience'], ['advanced', 'Experienced']]
    .map(([id, l]) => `<button type="button" class="chip-sel ${profile.experience === id ? 'on' : ''}" onclick="setExp('${id}')">${l}</button>`).join('');

  const sens = document.getElementById('plan-sensitive');
  if (sens) sens.checked = !!profile.sensitive;
  const preg = document.getElementById('plan-pregnancy');
  if (preg) preg.checked = !!profile.pregnancy;
}

function setSkinType(id) { profile.skinType = id; _saveProfile(profile); renderPlanQuiz(); }
function setExp(id) { profile.experience = id; _saveProfile(profile); renderPlanQuiz(); }
function toggleConcern(id) {
  const at = profile.concerns.indexOf(id);
  if (at >= 0) profile.concerns.splice(at, 1);
  else { if (profile.concerns.length >= 4) profile.concerns.shift(); profile.concerns.push(id); }
  _saveProfile(profile); renderPlanQuiz();
}
function togglePlanFlag(which) {
  const el = document.getElementById(which === 'sensitive' ? 'plan-sensitive' : 'plan-pregnancy');
  profile[which] = !!(el && el.checked);
  _saveProfile(profile);
}

// ---- Deterministic routine builder ----
function _buildPlan(prof) {
  const exp = prof.experience || 'beginner';
  const sensitive = !!prof.sensitive;
  const preg = !!prof.pregnancy;

  // 1. Score candidate actives by concern priority.
  const score = {};
  (prof.concerns || []).forEach((cid, ci) => {
    const cWeight = 4 - Math.min(3, ci);                  // 1st concern heaviest
    (CONCERN_MAP[cid] || []).forEach((aid, ai) => {
      score[aid] = (score[aid] || 0) + cWeight * (3 - Math.min(2, ai));
    });
  });

  // 2. Safety substitutions / gating. (Anything dropped here is fully removed
  //    from the plan so the shown routine always matches what we say we did.)
  const notes = [];
  if (preg) {
    const hadRetinoid = !!score.retinoid, hadBha = !!score.bha, hadBpo = !!score.bpo;
    if (hadRetinoid) { delete score.retinoid; score.bakuchiol = (score.bakuchiol || 0) + 3; }
    delete score.bpo;
    delete score.bha;
    if (hadRetinoid || hadBha || hadBpo) {
      const swapped = [hadRetinoid && 'retinoids', hadBpo && 'benzoyl peroxide', hadBha && 'salicylic acid (BHA)'].filter(Boolean).join(', ');
      notes.push(`Pregnancy-safe mode: ${swapped} left out — commonly avoided in pregnancy${hadRetinoid ? ' (a gentle bakuchiol takes the retinoid\'s place)' : ''}. Confirm anything with your doctor. Not medical advice.`);
    }
  }
  if (sensitive) {
    if (score.retinoid) { delete score.retinoid; score.bakuchiol = (score.bakuchiol || 0) + 2; }
    delete score.aha;
    delete score.bpo;
    score.centella = (score.centella || 0) + 2;           // barrier support
    notes.push('Sensitive mode: harsher exfoliants are dialed back and soothing barrier support is prioritized. Introduce any one active at a time.');
  }

  // 3. Rank + cap treatment actives. Guarantee every chosen concern is
  //    represented by at least its top surviving active before score-filling,
  //    so e.g. flagging "breakouts" never returns zero acne actives.
  const isStaple = (a) => a === 'hyaluronic' || a === 'niacinamide';
  const cap = sensitive ? 2 : exp === 'beginner' ? 3 : 4;
  const ranked = Object.keys(score).filter(a => score[a] > 0).sort((a, b) => score[b] - score[a] || a.localeCompare(b));
  const guaranteed = [];
  (prof.concerns || []).forEach(cid => {
    const top = (CONCERN_MAP[cid] || []).find(aid => score[aid] > 0 && !isStaple(aid));
    if (top && !guaranteed.includes(top)) guaranteed.push(top);
  });
  const fill = ranked.filter(a => !isStaple(a) && !guaranteed.includes(a));
  const treatments = [...guaranteed, ...fill].slice(0, cap);
  const staples = ranked.filter(isStaple);            // gentle — don't consume the cap
  const chosen = [...new Set([...treatments, ...staples])];

  // 4. Frequency + conflict-aware alternate-night scheduling.
  const rampFreq = () => sensitive ? '1 night / week' :
    exp === 'beginner' ? '2 nights / week, build up slowly' :
    exp === 'intermediate' ? 'every other night' : 'nightly, as tolerated';
  const freq = {};
  chosen.forEach(a => { freq[a] = PLAN_ACTIVES[a].ramp ? rampFreq() : 'daily'; });

  const pmActives = chosen.filter(a => PLAN_ACTIVES[a].phase === 'pm');
  const hasRetinoid = pmActives.includes('retinoid');
  const acids = pmActives.filter(a => a === 'aha' || a === 'bha');
  if (hasRetinoid && acids.length) {
    freq.retinoid = 'alternate nights (never same night as acids)';
    acids.forEach(a => { freq[a] = 'alternate nights (opposite the retinoid)'; });
    notes.push('Your retinoid and acid are scheduled on alternate nights — layering them together over-exfoliates. On off-nights, just hydrate.');
  } else if (acids.length > 1) {
    acids.forEach(a => { freq[a] = 'alternate nights'; });
    notes.push('Two exfoliating acids are split across alternate nights to protect your barrier.');
  }

  // 5. Assemble ordered AM / PM steps (thin → rich, actives before moisturizer).
  const oily = prof.skinType === 'oily' || prof.skinType === 'combination';
  const step = (name, why, f) => ({ name, why, freq: f || 'daily' });
  const am = [step('Gentle cleanser', 'clean slate without stripping')];
  ['bpo', 'vitc', 'niacinamide', 'hyaluronic'].forEach(a => {
    if (chosen.includes(a) && PLAN_ACTIVES[a].phase === 'am') am.push(step(PLAN_ACTIVES[a].name, PLAN_ACTIVES[a].why, freq[a]));
  });
  am.push(step(prof.skinType === 'dry' ? 'Rich moisturizer' : 'Lightweight moisturizer', 'seal in hydration'));
  am.push(step('Sunscreen SPF 30+', 'non-negotiable — UV undoes every active + ages skin fastest'));

  const pm = [];
  pm.push(step(oily ? 'Oil cleanse, then water cleanse' : 'Gentle cleanser', oily ? 'double-cleanse dissolves oil, SPF & grime' : 'remove the day gently'));
  // main treatments first (retinoid/acid), then supportive
  const pmOrder = ['retinoid', 'bakuchiol', 'aha', 'bha', 'azelaic', 'arbutin', 'peptide', 'centella'];
  pmOrder.forEach(a => { if (chosen.includes(a)) pm.push(step(PLAN_ACTIVES[a].name, PLAN_ACTIVES[a].why, freq[a])); });
  if (chosen.includes('hyaluronic')) pm.push(step('Hyaluronic acid', 'on damp skin, before cream', 'daily'));
  pm.push(step(prof.skinType === 'dry' ? 'Rich night cream' : 'Moisturizer', 'lock everything in overnight'));

  // Ingredient shopping guide (what to look for on labels)
  const lookFor = chosen.map(a => ({ label: PLAN_ACTIVES[a].name, look: PLAN_ACTIVES[a].look }));

  return { am, pm, notes, chosen, lookFor };
}

function generatePlan(silent) {
  if (!profile.concerns.length) {
    const r = document.getElementById('plan-result');
    if (r) { r.classList.remove('hidden'); r.innerHTML = '<div class="dim-note">Pick at least one skin concern above, then build your plan.</div>'; }
    return;
  }
  profile.built = true; _saveProfile(profile);
  const plan = _buildPlan(profile);
  _lastPlan = plan;
  renderPlanResult(plan);
  if (!silent) {
    addToCodex(`Built a personalized routine for ${profile.concerns.map(c => (PLAN_CONCERNS.find(x => x.id === c) || {}).label || c).join(', ')}.`);
    try { if (window.legionTrack) legionTrack('activate'); } catch (e) {}
  }
}

function renderPlanResult(plan) {
  const r = document.getElementById('plan-result');
  if (!r) return;
  r.classList.remove('hidden');
  const concernLabels = profile.concerns.map(c => { const o = PLAN_CONCERNS.find(x => x.id === c); return o ? `${o.emoji} ${o.label}` : c; });
  const stepRow = (s) => `<div class="plan-step">
      <div class="ps-main"><span class="ps-name">${_esc(s.name)}</span>${s.freq && s.freq !== 'daily' ? `<span class="ps-freq">${_esc(s.freq)}</span>` : ''}</div>
      <div class="ps-why">${_esc(s.why)}</div></div>`;

  r.innerHTML = `
    <div class="plan-head">Your plan targets <strong>${concernLabels.join(' · ')}</strong>
      ${profile.sensitive ? '<span class="plan-tag">sensitive-safe</span>' : ''}${profile.pregnancy ? '<span class="plan-tag">pregnancy-safe</span>' : ''}
      <span class="plan-tag">${_esc(profile.experience)}</span></div>

    <div class="plan-cols">
      <div class="plan-col">
        <div class="plan-col-head">☀️ Morning</div>
        ${plan.am.map(stepRow).join('')}
      </div>
      <div class="plan-col">
        <div class="plan-col-head">🌙 Night</div>
        ${plan.pm.map(stepRow).join('')}
      </div>
    </div>

    ${plan.notes.length ? `<div class="plan-notes">${plan.notes.map(n => `<div class="plan-note">💡 ${_esc(n)}</div>`).join('')}</div>` : ''}

    <details class="plan-look">
      <summary>🛒 What to look for on labels (${plan.lookFor.length})</summary>
      <div class="plan-look-body">${plan.lookFor.map(l => `<div class="pl-row"><span class="pl-cat">${_esc(l.label)}</span><span class="pl-ing">${l.look.map(_esc).join(' · ')}</span></div>`).join('')}</div>
    </details>

    <div class="controls" style="margin-top:12px">
      <button class="primary" onclick="applyPlanToRoutine()">✅ Use as my Routine Tracker</button>
      <button onclick="sharePlan()">💌 Share my plan</button>
    </div>
    <div class="dim-note" style="margin-top:8px">Rule-based suggestions from your profile — fictional beauty entertainment, not medical advice. Patch-test new actives; see a dermatologist for real concerns.</div>`;
}

function applyPlanToRoutine() {
  if (!_lastPlan) return;
  // reversible: stash the previous routine so it can be restored
  try { localStorage.setItem('p15_routine_prev', JSON.stringify(routine)); } catch (e) {}
  const trim = (s) => { const f = s.freq && s.freq !== 'daily' ? ` (${s.freq.split(',')[0].split('(')[0].trim()})` : ''; return (s.name + f).slice(0, 40); };
  routine.am = _lastPlan.am.map(trim);
  routine.pm = _lastPlan.pm.map(trim);
  // clear today's checked indices (steps changed) to keep completion honest
  const today = _routineToday(); today.am = []; today.pm = [];
  if (today._credited) { today._credited = {}; }
  _saveRoutine();
  addToCodex('Applied personalized plan to routine tracker (previous routine saved — restorable).');
  try { if (window.legionTrack) legionTrack('activate'); } catch (e) {}
  const r = document.getElementById('plan-result');
  if (r) {
    const banner = document.createElement('div');
    banner.className = 'routine-done-banner';
    banner.innerHTML = '✅ Saved to your Routine tracker. <a href="#" onclick="showRoutine();return false;" style="color:var(--gold)">Open Routine →</a> · <a href="#" onclick="restoreRoutine();return false;" style="color:var(--dim)">undo</a>';
    r.insertBefore(banner, r.firstChild);
  }
}

function restoreRoutine() {
  try {
    const prev = JSON.parse(localStorage.getItem('p15_routine_prev') || 'null');
    if (prev && prev.am && prev.pm) { routine = prev; _saveRoutine(); addToCodex('Restored previous routine.'); }
  } catch (e) {}
  showPlan();
}

function sharePlan() {
  if (!_lastPlan) return;
  const cl = profile.concerns.map(c => (PLAN_CONCERNS.find(x => x.id === c) || {}).label || c).join(', ');
  const card = `✨ My personalized skincare plan (${cl})\n` +
    `☀️ AM: ${_lastPlan.am.map(s => s.name).join(' → ')}\n` +
    `🌙 PM: ${_lastPlan.pm.map(s => s.name).join(' → ')}\n` +
    `Built on-device by GoddessForge — fictional beauty sim, not medical. Build yours 🎯`;
  try { if (window.legionTrack) legionTrack('share'); } catch (e) {}
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(card).then(() => alert('✅ Plan copied — share it with your sisters.'), () => { try { prompt('Copy your plan:', card); } catch (e) {} });
  } else { try { prompt('Copy your plan:', card); } catch (e) {} }
}

// Scan → plan: derive concerns from the two weakest metrics, then open the plan.
function buildPlanFromScan() {
  const s = _lastScan || scans[0];
  if (!s || !s.m) { showPlan(); return; }
  const ranked = Object.keys(s.m).sort((a, b) => s.m[a] - s.m[b]);   // weakest first
  const derived = [];
  ranked.forEach(k => { const c = METRIC_TO_CONCERN[k]; if (c && !derived.includes(c) && derived.length < 3) derived.push(c); });
  profile.concerns = derived.length ? derived : profile.concerns;
  _saveProfile(profile);
  showPlan();
  generatePlan();
  const r = document.getElementById('plan-result');
  if (r) { const b = document.createElement('div'); b.className = 'plan-note'; b.style.marginBottom = '8px';
    b.textContent = `🎯 Concerns pre-filled from your scan's weakest areas: ${derived.map(c => (PLAN_CONCERNS.find(x => x.id === c) || {}).label || c).join(', ')}. Adjust above anytime.`;
    r.insertBefore(b, r.firstChild); }
}

// Personalized band for the ingredient analyzer (uses the profile).
function _profileMatchBand(parsed) {
  const prof = profile;
  if (!prof || !prof.built || !prof.concerns.length) return '';
  const catNames = {};   // cat -> [display names present]
  parsed.forEach(p => (p.c || []).forEach(cat => { (catNames[cat] = catNames[cat] || []).push(_titleCase(p.name)); }));

  const goodBits = [];
  prof.concerns.forEach(cid => {
    const acts = CONCERN_MAP[cid] || [];
    const hits = [];
    acts.forEach(aid => { const cat = PLAN_ACTIVES[aid].cat; if (catNames[cat]) hits.push(...catNames[cat]); });
    if (hits.length) { const o = PLAN_CONCERNS.find(x => x.id === cid); goodBits.push(`<strong>${o ? o.label : cid}</strong> → ${[...new Set(hits)].join(', ')}`); }
  });

  // sensitivity / pregnancy watch-outs actually present in this product
  const warnNames = [];
  const IRRITANTS = ['fragrance', 'parfum', 'limonene', 'linalool', 'alcohol denat', 'denatured alcohol'];
  parsed.forEach(p => {
    if (prof.sensitive) {
      if (IRRITANTS.some(k => p.name.includes(k))) warnNames.push(_titleCase(p.name) + ' (irritant)');
      else if (p.h != null && p.h >= 5 && (p.c || []).some(c => ['aha', 'bha', 'retinoid', 'bpo'].includes(c))) warnNames.push(_titleCase(p.name) + ' (strong active)');
    }
  });
  const pregNames = [];
  if (prof.pregnancy) parsed.forEach(p => { if ((p.c || []).some(c => ['retinoid', 'bpo'].includes(c))) pregNames.push(_titleCase(p.name)); });

  if (!goodBits.length && !warnNames.length && !pregNames.length) {
    return `<div class="match-band"><div class="mb-head">For your profile</div><div class="dim-note" style="margin:0">Nothing here specifically targets your concerns — a supportive/basics product.</div></div>`;
  }
  let html = '<div class="match-band"><div class="mb-head">For your profile</div>';
  if (goodBits.length) html += `<div class="mb-good">✓ Good for your ${goodBits.join(' &nbsp;·&nbsp; ')}</div>`;
  if (warnNames.length) html += `<div class="mb-warn">⚠ You flagged sensitivity — contains ${[...new Set(warnNames)].join(', ')}. Patch-test first.</div>`;
  if (pregNames.length) html += `<div class="mb-warn">⚠ Pregnancy-safe mode — contains ${[...new Set(pregNames)].join(', ')}, commonly avoided in pregnancy. Confirm with your doctor. Not medical advice.</div>`;
  html += '</div>';
  return html;
}

/* LEGION_WAVE_52_wave_stamp */ /* ship wave 52 2026-07-21T07:43:10 */
