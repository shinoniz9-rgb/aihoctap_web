/**
 * KUROMI AI BOT FOR KIDS - MULTI-SENSORY ENGINE
 * Voice, Visual Evidence Cards, Web Audio Jukebox, Sanrio Aesthetic
 */

// =============================================================================
// 1. GLOBAL STATE & SETTINGS
// =============================================================================
// Default base settings (Used only as fallback for new keys)
const DEFAULT_SETTINGS = {
  childName: 'Bảo Hân',
  aiMode: 'local', // 'local' or 'gemini'
  geminiApiKey: '',
  ageGroup: 'preschool', // 'preschool' (3-6) or 'primary' (7-12)
  ttsRate: 1.05,
  ttsPitch: 1.35,
  ttsEnabled: true,
  sfxEnabled: true
};

// Safe non-destructive loader (Never overwrites existing user preferences)
function loadSettings() {
  try {
    const saved = localStorage.getItem('kuromi_bot_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Safe merge: user's saved keys always take precedence over defaults
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.warn("Storage load error", e);
  }
  return { ...DEFAULT_SETTINGS };
}

const APP_STATE = {
  ttsEnabled: true,
  sfxEnabled: true,
  currentMascotState: 'normal', // normal, thinking, singing, dancing
  currentPlayingSong: null,
  speechSynth: window.speechSynthesis || null,
  isRecording: false,
  recognition: null,
  settings: loadSettings()
};

// Synchronize state with persisted settings
APP_STATE.ttsEnabled = APP_STATE.settings.ttsEnabled !== false;
APP_STATE.sfxEnabled = APP_STATE.settings.sfxEnabled !== false;

// Safe non-destructive saver: merges updates without losing any existing fields
function saveSettings(partial = {}) {
  try {
    const current = loadSettings();
    const updated = {
      ...current,
      ...APP_STATE.settings,
      ...partial
    };
    APP_STATE.settings = updated;
    APP_STATE.ttsEnabled = updated.ttsEnabled !== false;
    APP_STATE.sfxEnabled = updated.sfxEnabled !== false;
    localStorage.setItem('kuromi_bot_settings', JSON.stringify(updated));
    applyChildNameUi(updated.childName);
    return updated;
  } catch (e) {
    console.warn("Storage save error", e);
  }
}

// Dynamically updates UI elements to match child's name
function applyChildNameUi(childName) {
  const name = (childName || 'Bảo Hân').trim();
  document.title = `Kuromi & Bé ${name} | Trợ Lý AI Đa Giác Quan`;
  
  const logoEl = document.querySelector('.logo-title');
  if (logoEl) logoEl.textContent = `KUROMI & ${name.toUpperCase()}`;

  const ribbonEl = document.querySelector('.stage-ribbon-tag');
  if (ribbonEl) ribbonEl.textContent = `🎀 Bạn Thân Của Bé ${name} 🎀`;

  const exploreLabel = document.querySelector('.explore-label');
  if (exploreLabel) exploreLabel.textContent = `🌟 Bé ${name} muốn khám phá gì hôm nay:`;

  const inputEl = document.getElementById('childTextInput');
  if (inputEl) inputEl.placeholder = `Bé ${name} hỏi Kuromi điều gì nào? (Bấm micro để nói)...`;

  const nameInput = document.getElementById('childNameInput');
  if (nameInput && document.activeElement !== nameInput) {
    nameInput.value = name;
  }
}

// Chat history non-destructive persistence
function saveChatHistory(item) {
  try {
    const raw = localStorage.getItem('kuromi_chat_history');
    const list = raw ? JSON.parse(raw) : [];
    list.push(item);
    if (list.length > 50) list.shift();
    localStorage.setItem('kuromi_chat_history', JSON.stringify(list));
  } catch (e) {
    console.warn("Save chat history error", e);
  }
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem('kuromi_chat_history');
    if (!raw) return;
    const list = JSON.parse(raw);
    if (Array.isArray(list)) {
      list.forEach(msg => {
        if (msg.type === 'child') {
          appendChildMessage(msg.text, false);
        } else if (msg.type === 'kuromi') {
          appendKuromiResponse(msg.data, false);
        }
      });
    }
  } catch (e) {
    console.warn("Load chat history error", e);
  }
}

// =============================================================================
// 2. WEB AUDIO SYNTHESIZER (SONGS, SOUND FX & NURSERY RHYMES)
// =============================================================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Musical notes frequency map (Hz)
const NOTE_FREQS = {
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50
};

// Polyphonic Nursery Rhyme Melody Sequences
const SONGS_LIBRARY = {
  'butterfly': {
    id: 'butterfly',
    title: 'Kìa Con Bướm Vàng',
    category: 'Bài hát thiếu nhi',
    icon: '🦋',
    bpm: 130,
    lyrics: [
      { text: "Kìa con bướm vàng, kìa con bướm vàng 🦋", duration: 4 },
      { text: "Xòe đôi cánh, xòe đôi cánh ✨", duration: 4 },
      { text: "Bươm bướm bay lượn khắp vườn hoa 🌸", duration: 4 },
      { text: "Bé ngắm xem, bé ngắm xem! 💖", duration: 4 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 0.5 },
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 0.5 },
      { note: 'E4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'E4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 0.25 }, { note: 'G4', dur: 0.25 }, { note: 'F4', dur: 0.25 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 0.5 },
      { note: 'G4', dur: 0.25 }, { note: 'A4', dur: 0.25 }, { note: 'G4', dur: 0.25 }, { note: 'F4', dur: 0.25 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 0.5 },
      { note: 'C4', dur: 0.5 }, { note: 'G3', dur: 0.5 }, { note: 'C4', dur: 1.0 },
      { note: 'C4', dur: 0.5 }, { note: 'G3', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  },
  'frog': {
    id: 'frog',
    title: 'Chú Ếch Con',
    category: 'Bài hát thiếu nhi',
    icon: '🐸',
    bpm: 140,
    lyrics: [
      { text: "Kìa chú là chú ếch con có hai là hai mắt tròn 🐸", duration: 4 },
      { text: "Chú ngồi học bài một mình bên hố bom kề vườn xoan 🍃", duration: 4 },
      { text: "Bao cô cá trê non cùng bao chú cá rô ron 🐟", duration: 4 },
      { text: "Tung tăng chiếc vây son nhịp theo tiếng ếch vang dồn! 🎶", duration: 4 }
    ],
    notes: [
      { note: 'G4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 1.0 },
      { note: 'E4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 },
      { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 0.5 },
      { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'G4', dur: 0.5 },
      { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  },
  'star': {
    id: 'star',
    title: 'Ngôi Sao Nhỏ (Twinkle Star)',
    category: 'Giai điệu diệu kỳ',
    icon: '⭐',
    bpm: 110,
    lyrics: [
      { text: "Twinkle, twinkle, little star ⭐", duration: 4 },
      { text: "How I wonder what you are! ✨", duration: 4 },
      { text: "Up above the world so high 🌙", duration: 4 },
      { text: "Like a diamond in the sky! 💎", duration: 4 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'G4', dur: 0.5 },
      { note: 'A4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'F4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'E4', dur: 0.5 },
      { note: 'D4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 1.0 },
      { note: 'G4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'F4', dur: 0.5 },
      { note: 'E4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 1.0 },
      { note: 'C4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'G4', dur: 0.5 },
      { note: 'A4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 }
    ]
  },
  'birthday': {
    id: 'birthday',
    title: 'Chúc Mừng Sinh Nhật (Happy Birthday)',
    category: 'Bài hát vui nhộn',
    icon: '🎂',
    bpm: 125,
    lyrics: [
      { text: "Happy Birthday to you! 🎂", duration: 3 },
      { text: "Happy Birthday to you! 🎈", duration: 3 },
      { text: "Happy Birthday bé Bảo Hân của Kuromi! 💖", duration: 4 },
      { text: "Happy Birthday to you! 🎉", duration: 3 }
    ],
    notes: [
      { note: 'C4', dur: 0.35 }, { note: 'C4', dur: 0.15 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'C4', dur: 0.35 }, { note: 'C4', dur: 0.15 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'F4', dur: 1.0 },
      { note: 'C4', dur: 0.35 }, { note: 'C4', dur: 0.15 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 1.0 },
      { note: 'B4', dur: 0.35 }, { note: 'B4', dur: 0.15 }, { note: 'A4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'F4', dur: 1.2 }
    ]
  }
};

// UI Sound Effects Generator
function playSfx(type) {
  if (!APP_STATE.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (type === 'pop') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  } else if (type === 'chime') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25); // C6
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  } else if (type === 'heart') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

// Realistic Hearing Sound Effects (Animals, Train, etc.)
function playRealisticSound(soundType, statusCallback) {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (statusCallback) statusCallback(`Kuromi đang phát âm thanh: ${soundType} 🔊`);

  const now = ctx.currentTime;

  if (soundType === 'cat') {
    // Kitten Meow: Sweet modulated pitch curve
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Pitch sweep: C5 -> G5 -> E5 -> C5
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.7);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    osc.start(now);
    osc.stop(now + 0.85);

    // Second "meow"
    setTimeout(() => {
      const now2 = ctx.currentTime;
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(550, now2);
      osc2.frequency.exponentialRampToValueAtTime(950, now2 + 0.35);
      osc2.frequency.exponentialRampToValueAtTime(620, now2 + 0.8);
      gain2.gain.setValueAtTime(0.01, now2);
      gain2.gain.linearRampToValueAtTime(0.3, now2 + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.9);
      osc2.start(now2);
      osc2.stop(now2 + 0.95);
    }, 1000);

  } else if (soundType === 'lion') {
    // Lion roar: Deep modulated roar
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(220, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(95, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(65, now + 1.4);

    filter.frequency.linearRampToValueAtTime(450, now + 0.5);
    filter.frequency.exponentialRampToValueAtTime(120, now + 1.4);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.4, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);

    osc.start(now);
    osc.stop(now + 1.55);

  } else if (soundType === 'train') {
    // Train whistle (two harmonious tones) + rhythmic chug
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const g = ctx.createGain();
    o1.type = 'sine';
    o2.type = 'sine';
    o1.frequency.setValueAtTime(587.33, now); // D5
    o2.frequency.setValueAtTime(739.99, now); // F#5
    o1.connect(g);
    o2.connect(g);
    g.connect(ctx.destination);

    // Whistle burst 1
    g.gain.setValueAtTime(0.01, now);
    g.gain.linearRampToValueAtTime(0.35, now + 0.1);
    g.gain.setValueAtTime(0.35, now + 0.6);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    o1.start(now);
    o2.start(now);
    o1.stop(now + 1.0);
    o2.stop(now + 1.0);

    // Whistle burst 2 (longer)
    setTimeout(() => {
      const now2 = ctx.currentTime;
      const o1b = ctx.createOscillator();
      const o2b = ctx.createOscillator();
      const gb = ctx.createGain();
      o1b.type = 'sine';
      o2b.type = 'sine';
      o1b.frequency.setValueAtTime(587.33, now2);
      o2b.frequency.setValueAtTime(739.99, now2);
      o1b.connect(gb);
      o2b.connect(gb);
      gb.connect(ctx.destination);
      gb.gain.setValueAtTime(0.01, now2);
      gb.gain.linearRampToValueAtTime(0.35, now2 + 0.15);
      gb.gain.setValueAtTime(0.35, now2 + 0.9);
      gb.gain.exponentialRampToValueAtTime(0.001, now2 + 1.3);
      o1b.start(now2);
      o2b.start(now2);
      o1b.stop(now2 + 1.35);
      o2b.stop(now2 + 1.35);
    }, 1100);
  }
}

// Melody Player Manager
let currentPlaybackTimeouts = [];

function stopCurrentSong() {
  currentPlaybackTimeouts.forEach(t => clearTimeout(t));
  currentPlaybackTimeouts = [];
  APP_STATE.currentPlayingSong = null;

  // Update UI visualizers
  document.querySelectorAll('.jukebox-play-btn').forEach(btn => {
    btn.classList.remove('playing');
    btn.textContent = '▶';
  });
  document.querySelectorAll('.jukebox-wave-bars').forEach(bar => bar.classList.remove('active'));
  document.getElementById('musicVisualizerStage').classList.remove('active');
  document.getElementById('mascotWrapper').classList.remove('dancing');
  document.getElementById('nowPlayingDock').classList.add('hidden');
  setKuromiState('normal');
}

function playSong(songKey, onLyricUpdate) {
  stopCurrentSong();
  const song = SONGS_LIBRARY[songKey];
  if (!song) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  APP_STATE.currentPlayingSong = song;
  setKuromiState('singing');
  document.getElementById('mascotWrapper').classList.add('dancing');
  document.getElementById('musicVisualizerStage').classList.add('active');

  // Show now playing dock
  const dock = document.getElementById('nowPlayingDock');
  document.getElementById('dockSongTitle').textContent = `${song.icon} ${song.title}`;
  dock.classList.remove('hidden');

  let accumTime = 0;
  const beatSec = 60 / song.bpm;

  // Schedule musical notes
  song.notes.forEach(item => {
    const freq = NOTE_FREQS[item.note] || 440;
    const durSec = item.dur * beatSec * 1.5;

    const timeout = setTimeout(() => {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Cheerful chime flute synth
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      osc.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);

      osc.start(now);
      osc.stop(now + durSec + 0.05);
    }, accumTime * 1000);

    currentPlaybackTimeouts.push(timeout);
    accumTime += durSec;
  });

  // Schedule Lyrics Sing-along
  let lyricTime = 0;
  song.lyrics.forEach(lyric => {
    const t = setTimeout(() => {
      if (onLyricUpdate) onLyricUpdate(lyric.text);
      document.getElementById('kuromiStatusText').textContent = `Kuromi đang hát: "${lyric.text}" 🎶`;
    }, lyricTime * 1000);
    currentPlaybackTimeouts.push(t);
    lyricTime += lyric.duration;
  });

  // End of song handler
  const endTimeout = setTimeout(() => {
    stopCurrentSong();
    document.getElementById('kuromiStatusText').textContent = "Bài hát hay quá phải không bé yêu! Bé muốn nghe gì nữa nào? 🎀";
    setKuromiState('happy');
  }, (accumTime + 0.8) * 1000);
  currentPlaybackTimeouts.push(endTimeout);
}

// =============================================================================
// 3. KUROMI CHARACTER MASCOT EMOTIONS & STATES
// =============================================================================
function setKuromiState(state) {
  APP_STATE.currentMascotState = state;
  const avatarImg = document.getElementById('kuromiAvatarImg');
  const sparkle = document.getElementById('emotionSparkle');

  if (state === 'singing') {
    avatarImg.src = 'assets/kuromi_singing.jpg';
    sparkle.textContent = '🎵';
  } else if (state === 'thinking') {
    avatarImg.src = 'assets/kuromi_thinking.jpg';
    sparkle.textContent = '💡';
  } else if (state === 'dancing') {
    avatarImg.src = 'assets/kuromi_singing.jpg';
    sparkle.textContent = '💃';
    document.getElementById('mascotWrapper').classList.add('dancing');
  } else if (state === 'happy') {
    avatarImg.src = 'assets/kuromi_normal.jpg';
    sparkle.textContent = '💖';
    document.getElementById('mascotWrapper').classList.remove('dancing');
  } else {
    // Normal / Idle
    avatarImg.src = 'assets/kuromi_normal.jpg';
    sparkle.textContent = '✨';
    document.getElementById('mascotWrapper').classList.remove('dancing');
  }
}

// =============================================================================
// 4. TEXT-TO-SPEECH (KUROMI'S VOICE FOR KIDS)
// =============================================================================
function speakText(text, onComplete) {
  if (!APP_STATE.ttsEnabled || !window.speechSynthesis) {
    if (onComplete) onComplete();
    return;
  }

  // Cancel prior speech
  window.speechSynthesis.cancel();

  // Strip emojis and markdown formatting for clean reading
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .trim();

  if (!cleanText) {
    if (onComplete) onComplete();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'vi-VN';
  utterance.rate = APP_STATE.settings.ttsRate || 1.05;
  utterance.pitch = APP_STATE.settings.ttsPitch || 1.35; // Cute kid pitch

  // Try finding Vietnamese voice
  const voices = window.speechSynthesis.getVoices();
  const viVoice = voices.find(v => v.lang.includes('vi') || v.name.includes('Vietnamese'));
  if (viVoice) {
    utterance.voice = viVoice;
  }

  setKuromiState('singing');

  utterance.onend = () => {
    setKuromiState('normal');
    if (onComplete) onComplete();
  };

  utterance.onerror = () => {
    setKuromiState('normal');
    if (onComplete) onComplete();
  };

  window.speechSynthesis.speak(utterance);
}

// =============================================================================
// 5. SPEECH-TO-TEXT (VOICE INPUT FOR CHILDREN)
// =============================================================================
function initSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Speech recognition not supported in this browser.");
    return null;
  }

  const rec = new SpeechRecognition();
  rec.continuous = false;
  rec.interimResults = false;
  rec.lang = 'vi-VN';

  rec.onstart = () => {
    APP_STATE.isRecording = true;
    const micBtn = document.getElementById('voiceInputBtn');
    micBtn.classList.add('recording');
    const childName = APP_STATE.settings.childName || 'Bảo Hân';
    document.getElementById('kuromiStatusText').textContent = `Kuromi đang lắng nghe bé ${childName} nói nè... Bé nói đi nào! 🎤👂`;
    playSfx('chime');
  };

  rec.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    document.getElementById('childTextInput').value = transcript;
    playSfx('pop');
    handleChildSubmit(transcript);
  };

  rec.onerror = (event) => {
    console.error("Speech error", event.error);
    APP_STATE.isRecording = false;
    document.getElementById('voiceInputBtn').classList.remove('recording');
    const childName = APP_STATE.settings.childName || 'Bảo Hân';
    document.getElementById('kuromiStatusText').textContent = `Kuromi chưa nghe rõ, bé ${childName} bấm micro lại nhé! 💕`;
  };

  rec.onend = () => {
    APP_STATE.isRecording = false;
    document.getElementById('voiceInputBtn').classList.remove('recording');
  };

  return rec;
}

// =============================================================================
// 6. MULTI-SENSORY KID KNOWLEDGE BASE (SEEING & HEARING DATA)
// =============================================================================
const MULTI_SENSORY_DATA = [
  // --- NHÌN: Khủng long ---
  {
    keywords: ['khủng long', 'dinosaur', 't-rex', 'bạo chúa', 'khung long'],
    answer: "Khủng long là loài sinh vật khổng lồ từng sinh sống trên Trái đất từ hàng triệu năm trước! Trong đó, T-Rex (khủng long bạo chúa) có hàm răng sắc nhọn và đôi chân chạy rất nhanh. Nhưng trong tranh của Kuromi thì các bạn khủng long rất đáng yêu và thích kết bạn với bé đấy! 🦖🌿",
    visual: {
      src: 'assets/cute_dinosaur.jpg',
      title: 'Các Bạn Khủng Long Thời Tiền Sử',
      caption: 'Khủng long bạo chúa T-Rex con và bạn khủng long 3 sừng Triceratops đang chơi đùa dưới chân núi lửa màu hồng!'
    }
  },
  // --- NHÌN: Hệ mặt trời & Vũ trụ ---
  {
    keywords: ['hệ mặt trời', 'mặt trời', 'vũ trụ', 'sao hỏa', 'hành tinh', 'trai dat', 'mat troi', 'vu tru'],
    answer: "Hệ mặt trời của chúng ta như một đại gia đình kỳ diệu! Ở trung tâm là Mặt Trời khổng lồ ấm áp, xung quanh có 8 hành tinh quay tròn: Sao Thủy, Sao Kim, Trái Đất xanh tươi của chúng ta, Sao Hỏa đỏ rực, Sao Mộc to nhất và Sao Thổ có chiếc vành đai lấp lánh như chiếc nơ xinh! 🪐🚀",
    visual: {
      src: 'assets/solar_system.jpg',
      title: 'Đại Gia Đình Hệ Mặt Trời',
      caption: 'Mặt trời mỉm cười cùng Trái Đất xinh đẹp và các hành tinh đang quay tít trên dải ngân hà lấp lánh sao!'
    }
  },
  // --- NHÌN: Cầu vồng ---
  {
    keywords: ['cầu vồng', 'cau vong', '7 màu', 'bảy màu', 'mưa nắng'],
    answer: "Cầu vồng xuất hiện khi vừa có mưa rơi vừa có ánh nắng mặt trời chiếu qua! Những giọt nước mưa li ti như những lăng kính thần kỳ, tách ánh sáng trắng thành 7 sắc màu rực rỡ: Đỏ, Cam, Vàng, Lục, Lam, Chàm, Tím. Cầu vồng như một chiếc cầu trượt kỳ diệu bắc qua bầu trời hoa! 🌈✨",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Chiếc Cầu Vồng 7 Sắc Lung Linh',
      caption: 'Bức tranh cầu vồng vắt ngang đồng hoa rực rỡ sau cơn mưa rào dịu mát!'
    }
  },
  // --- NHÌN & NGHE: Muôn thú & Mèo con ---
  {
    keywords: ['tiếng mèo', 'con mèo', 'mèo kêu', 'meo meo', 'meo'],
    answer: "Mèo con có bộ lông mềm mượt, đôi tai vểnh và chiếc đuôi ngoe nguẩy! Mèo kêu 'meo meo' khi muốn bé vuốt ve hoặc khi đói bụng đòi ăn cá. Bé hãy nghe thử tiếng mèo con kêu nè! 🐾🐱",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Mèo Con Và Những Người Bạn Nhỏ',
      caption: 'Mèo con mắt xanh đáng yêu đang tung tăng đùa nghịch cùng cún con trên thảm cỏ xanh!'
    },
    sound: 'cat',
    soundTitle: 'Tiếng Chú Mèo Kêu Meo Meo'
  },
  // --- NGHE & NHÌN: Sư tử ---
  {
    keywords: ['sư tử', 'tiếng sư tử', 'su tu', 'chúa sơn lâm', 'gầm'],
    answer: "Sư tử được mệnh danh là Chúa tể rừng xanh! Chú sư tử đực có chiếc bờm dày oai phong lẫm liệt. Tiếng gầm của sư tử rất vang dội để bảo vệ đàn của mình đấy. Kuromi mở tiếng sư tử cho bé nghe ngay đây! 🦁👑",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Chú Sư Tử Con Dũng Mãnh',
      caption: 'Sư tử con vui vẻ chạy nhảy bên bạn voi con và mèo nhỏ!'
    },
    sound: 'lion',
    soundTitle: 'Tiếng Sư Tử Gầm Vang Dội'
  },
  // --- NGHE: Tiếng tàu hỏa ---
  {
    keywords: ['tàu hỏa', 'xe lửa', 'tiếng tàu', 'tu tu', 'xình xịch', 'tau hoa'],
    answer: "Tàu hỏa chạy trên đường ray dài dằng dặc, kéo theo rất nhiều toa xe chở hàng trăm hành khách đi du lịch muôn nơi! Trước khi vào ga hay qua ngã rẽ, tàu sẽ kéo còi 'Tu tu... xình xịch!' để báo hiệu an toàn. Bé cùng nghe còi tàu với Kuromi nhé! 🚂💨",
    sound: 'train',
    soundTitle: 'Tiếng Còi Tàu Hỏa Tu Tu Xình Xịch'
  },
  // --- BÀI HÁT: Kìa con bướm vàng ---
  {
    keywords: ['bướm vàng', 'kìa con bướm vàng', 'kia con buom vang', 'buom vang'],
    answer: "Tuyệt vời luôn! Bài hát 'Kìa Con Bướm Vàng' là bài hát thiếu nhi mà Kuromi thích nhất trần đời! Kuromi mời bé cùng nghe và nhún nhảy theo giai điệu với Kuromi nhé! 🦋🎶",
    song: 'butterfly'
  },
  // --- BÀI HÁT: Chú ếch con ---
  {
    keywords: ['chú ếch con', 'chu ech con', 'ếch con', 'hát chú ếch'],
    answer: "Oa, bài hát 'Chú Ếch Con' chăm chỉ học bài bên bờ ao! Kuromi bật đài phát nhạc Jukebox để bé cùng hát theo nè: Kìa chú là chú ếch con có hai là hai mắt tròn! 🐸🎵",
    song: 'frog'
  },
  // --- BÀI HÁT: Twinkle Star / Ngôi sao nhỏ ---
  {
    keywords: ['ngôi sao', 'twinkle', 'little star', 'sao nhỏ', 'ngoi sao nho'],
    answer: "Đêm xuống, những ngôi sao nhỏ lung linh như những viên kim cương trên bầu trời tím của Kuromi. Chúng mình cùng thưởng thức bài hát diệu kỳ này nha bé yêu! ⭐🌙",
    song: 'star'
  },
  // --- BÀI HÁT: Happy Birthday ---
  {
    keywords: ['sinh nhật', 'happy birthday', 'chúc mừng sinh nhật', 'sinh nhat'],
    answer: "Hôm nay có phải sinh nhật của bé không nào? Dù là ngày nào, Kuromi cũng chúc bé luôn vui tươi, ăn ngoan chóng lớn và hát tặng bé bài Chúc Mừng Sinh Nhật nha! 🎂🎉",
    song: 'birthday'
  },
  // --- TRUYỆN: Rùa và Thỏ ---
  {
    keywords: ['rùa và thỏ', 'rua va tho', 'kể chuyện', 'truyện cổ tích', 'ke chuyen'],
    answer: "Ngày xửa ngày xưa, trong khu rừng xanh, Thỏ ỷ mình chạy nhanh nên trêu chọc Rùa chậm chạp. Khi thi chạy, Thỏ chủ quan nằm ngủ dưới gốc cây hoa, còn Rùa dù đi từng bước chậm nhưng kiên trì không hề dừng lại. Cuối cùng Rùa đã về đích trước! Câu chuyện dạy bé rằng: Cần cù, kiên nhẫn sẽ luôn mang lại thành công rực rỡ đấy bé yêu! 🐢🐰🏆"
  },
  // --- THÓI QUEN: Đánh răng ---
  {
    keywords: ['đánh răng', 'danh rang', 'sâu răng', 'răng'],
    answer: "Bé ơi, sau khi ăn xong, những bạn vi khuẩn tí hon sẽ trốn vào kẽ răng để gặm nhấm thức ăn thừa, làm răng bị sâu và đau buốt đấy! Khi bé đánh răng sáng và tối bằng kem thơm mát, những chiếc răng sẽ trắng tinh, sạch bóng và thơm tho như những hạt ngọc xinh! 🦷🪥✨"
  },
  // --- THÓI QUEN: Ngủ sớm ---
  {
    keywords: ['ngủ sớm', 'di ngu', 'ngu som', 'thức khuya'],
    answer: "Khi bé đi ngủ đúng giờ (khoảng 9 giờ tối), cơ thể bé sẽ tiết ra hoóc-môn thần kỳ giúp xương dài ra, bé cao lớn hơn, thông minh hơn và ngày mai thức dậy có một nụ cười rạng rỡ! Bé ngoan của Kuromi luôn nhớ ngủ sớm nha! 🌙💤"
  }
];

// Fallback search engine for kids
function getKidFriendlyLocalAnswer(prompt) {
  const lower = prompt.toLowerCase();

  // Match specific items in knowledge base
  for (const item of MULTI_SENSORY_DATA) {
    if (item.keywords.some(k => lower.includes(k))) {
      return item;
    }
  }

  // Generative child-friendly response
  const childName = APP_STATE.settings.childName || 'Bảo Hân';

  if (lower.includes('hát') || lower.includes('nhạc') || lower.includes('bài hát')) {
    return {
      answer: `Kuromi rất thích hát tặng bé ${childName}! Kuromi mở bài hát 'Kìa Con Bướm Vàng' vui nhộn cho bé cùng nghe và nhún nhảy nhé! 🎶🎀`,
      song: 'butterfly'
    };
  }

  if (lower.includes('xem') || lower.includes('ảnh') || lower.includes('hình') || lower.includes('trông thế nào')) {
    return {
      answer: `Kuromi tìm thấy một bức tranh tuyệt đẹp về vũ trụ và thiên nhiên cho bé ${childName} ngắm nhìn đây! Thế giới xung quanh chúng ta có muôn vàn điều kỳ thú! 🌈✨`,
      visual: {
        src: 'assets/rainbow_nature.jpg',
        title: 'Bức Tranh Muôn Màu Diệu Kỳ',
        caption: 'Bé hãy nhìn những bông hoa đua nở và cầu vồng rực rỡ tỏa sáng!'
      }
    };
  }

  if (lower.includes('tiếng') || lower.includes('kêu')) {
    return {
      answer: `Bé ${childName} muốn nghe âm thanh đúng không nào! Kuromi giả tiếng chú mèo con dễ thương kêu meo meo tặng bé nhé! 🐾🐱`,
      sound: 'cat',
      soundTitle: 'Tiếng Mèo Con Meo Meo'
    };
  }

  // General cheerful learning answer
  return {
    answer: `Câu hỏi của bé ${childName} về "${prompt}" thật là thông minh! 🌟 Kuromi kể bé nghe nè: thế giới quanh ta có bao điều kỳ thú. Mỗi ngày bé ${childName} học thêm một điều mới là một lần bé thông thái hơn. Bé hãy luôn tò mò và hỏi Kuromi thật nhiều điều nữa nha! 💖🐰`
  };
}

// =============================================================================
// 7. GEMINI AI CLIENT (OPTIONAL EXPANSION)
// =============================================================================
async function callGeminiApi(prompt) {
  const apiKey = APP_STATE.settings.geminiApiKey;
  if (!apiKey) {
    return getKidFriendlyLocalAnswer(prompt);
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  const systemInstruction = `Bạn là Kuromi (nhân vật hoạt hình Sanrio nổi tiếng), đóng vai người bạn thân thiết, vui tính, ngọt ngào và biết tuốt dành riêng cho bé ${childName} (trẻ em từ 3 đến 10 tuổi tại Việt Nam). 
Quy tắc trả lời:
- Luôn xưng là "Kuromi" và gọi bé là "bé ${childName}".
- Trả lời ngắn gọn (2-3 câu ngắn), dễ hiểu, giàu cảm xúc, ngập tràn sự tích cực dành cho bé ${childName}.
- Thêm nhiều emoji dễ thương (🎀, 💖, ⭐, 🐰, 🍭).
- Nếu bé hỏi về nhìn hoặc xem tranh ảnh, hãy miêu tả hình ảnh thật sống động.
- Nếu bé hỏi về nghe hoặc âm nhạc, hãy hát hoặc miêu tả âm thanh vui vẻ.
- Tuyệt đối an toàn, lành mạnh cho trẻ nhỏ.`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemInstruction}\n\nBé hỏi: ${prompt}` }]
          }
        ]
      })
    });

    if (!response.ok) {
      console.warn("Gemini error, fallback to local");
      return getKidFriendlyLocalAnswer(prompt);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "Kuromi đang nghe bé đây!";

    // Automatically detect if any visual or song matches
    const baseMatch = getKidFriendlyLocalAnswer(prompt);
    return {
      answer: text,
      visual: baseMatch.visual,
      sound: baseMatch.sound,
      soundTitle: baseMatch.soundTitle,
      song: baseMatch.song
    };
  } catch (err) {
    console.error("Gemini fetch error", err);
    return getKidFriendlyLocalAnswer(prompt);
  }
}

// =============================================================================
// 8. CHAT INTERACTION & DOM RENDERING
// =============================================================================
function appendChildMessage(text, shouldSave = true) {
  const container = document.getElementById('chatContainer');
  const msgRow = document.createElement('div');
  msgRow.className = 'message-row message-child';
  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  msgRow.innerHTML = `
    <div class="msg-avatar-icon">
      <span>👧</span>
    </div>
    <div class="msg-bubble">
      <div class="msg-header">
        <span class="sender-name">Bé ${escapeHtml(childName)} 🎀</span>
      </div>
      <div class="msg-text">${escapeHtml(text)}</div>
    </div>
  `;
  container.appendChild(msgRow);
  container.scrollTop = container.scrollHeight;

  if (shouldSave) {
    saveChatHistory({ type: 'child', text, time: Date.now() });
  }
}

function appendKuromiResponse(data, shouldSaveAndSpeak = true) {
  const container = document.getElementById('chatContainer');
  const msgRow = document.createElement('div');
  msgRow.className = 'message-row message-kuromi';

  let visualHtml = '';
  if (data.visual) {
    visualHtml = `
      <div class="visual-evidence-card" data-src="${data.visual.src}" data-caption="${escapeHtml(data.visual.caption)}">
        <div class="visual-card-header">
          <span>👀 Tranh Dẫn Chứng Cho Bé: ${escapeHtml(data.visual.title)}</span>
          <span class="zoom-hint">🔍 Bấm để phóng to</span>
        </div>
        <div class="visual-image-wrapper">
          <img src="${data.visual.src}" alt="${escapeHtml(data.visual.title)}" loading="lazy">
        </div>
        <div class="visual-card-caption">
          ${escapeHtml(data.visual.caption)}
        </div>
      </div>
    `;
  }

  let jukeboxHtml = '';
  if (data.song) {
    const song = SONGS_LIBRARY[data.song];
    jukeboxHtml = `
      <div class="jukebox-player-card" id="jukeboxCard-${Date.now()}">
        <div class="jukebox-top">
          <button class="jukebox-play-btn" data-song="${data.song}">▶</button>
          <div class="jukebox-info">
            <span class="jukebox-title">${song.icon} ${escapeHtml(song.title)}</span>
            <span class="jukebox-subtitle">${escapeHtml(song.category)} - Bấm để nghe Kuromi hát</span>
          </div>
          <div class="jukebox-wave-bars">
            <span></span><span></span><span></span><span></span>
          </div>
        </div>
        <div class="jukebox-lyrics-box">
          <span class="current-lyric">🎶 Nhạc đang sẵn sàng cho bé...</span>
        </div>
      </div>
    `;
  } else if (data.sound) {
    jukeboxHtml = `
      <div class="jukebox-player-card">
        <div class="jukebox-top">
          <button class="jukebox-play-btn sound-fx-btn" data-sound="${data.sound}">🔊</button>
          <div class="jukebox-info">
            <span class="jukebox-title">👂 ${escapeHtml(data.soundTitle || 'Nghe âm thanh')}</span>
            <span class="jukebox-subtitle">Bấm nút để nghe âm thanh chân thật nha!</span>
          </div>
        </div>
      </div>
    `;
  }

  msgRow.innerHTML = `
    <div class="msg-avatar-icon">
      <img src="assets/kuromi_normal.jpg" alt="Kuromi">
    </div>
    <div class="msg-bubble">
      <div class="msg-header">
        <span class="sender-name">Kuromi Thông Thái 👑</span>
        <span class="msg-badge">Trợ lý bé yêu</span>
      </div>
      <div class="msg-text">${formatResponseText(data.answer)}</div>
      ${visualHtml}
      ${jukeboxHtml}
      <div class="msg-actions">
        <button class="msg-action-btn speak-again-btn" title="Đọc lại câu trả lời này">
          🔊 Nghe Kuromi đọc
        </button>
      </div>
    </div>
  `;

  container.appendChild(msgRow);
  container.scrollTop = container.scrollHeight;

  // Bind actions for this message
  const speakBtn = msgRow.querySelector('.speak-again-btn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      playSfx('pop');
      speakText(data.answer);
    });
  }

  // Visual card click -> zoom modal
  const visualCard = msgRow.querySelector('.visual-evidence-card');
  if (visualCard) {
    visualCard.addEventListener('click', () => {
      openImageZoom(visualCard.getAttribute('data-src'), visualCard.getAttribute('data-caption'));
    });
  }

  // Song Jukebox Player Button
  const songBtn = msgRow.querySelector('.jukebox-play-btn[data-song]');
  if (songBtn) {
    const songKey = songBtn.getAttribute('data-song');
    const lyricEl = msgRow.querySelector('.current-lyric');
    const waveBars = msgRow.querySelector('.jukebox-wave-bars');

    songBtn.addEventListener('click', () => {
      if (APP_STATE.currentPlayingSong && APP_STATE.currentPlayingSong.id === songKey) {
        stopCurrentSong();
        songBtn.textContent = '▶';
        songBtn.classList.remove('playing');
        if (waveBars) waveBars.classList.remove('active');
        if (lyricEl) lyricEl.textContent = '⏸ Tạm dừng bài hát';
      } else {
        songBtn.textContent = '⏸';
        songBtn.classList.add('playing');
        if (waveBars) waveBars.classList.add('active');
        playSong(songKey, (text) => {
          if (lyricEl) lyricEl.textContent = `🎤 ${text}`;
        });
      }
    });

    // Auto play song if explicitly asked!
    setTimeout(() => {
      songBtn.click();
    }, 600);
  }

  // Sound fx play button
  const soundBtn = msgRow.querySelector('.sound-fx-btn[data-sound]');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const sndType = soundBtn.getAttribute('data-sound');
      playRealisticSound(sndType, (msg) => {
        document.getElementById('kuromiStatusText').textContent = msg;
      });
    });
    // Auto play realistic sound
    if (shouldSaveAndSpeak) {
      setTimeout(() => {
        soundBtn.click();
      }, 600);
    }
  }

  // Save to history
  if (shouldSaveAndSpeak) {
    saveChatHistory({ type: 'kuromi', data, time: Date.now() });
  }

  // Read answer aloud if enabled
  if (shouldSaveAndSpeak && APP_STATE.ttsEnabled && !data.song) {
    speakText(data.answer);
  }
}

// Processing Child Questions
async function handleChildSubmit(text) {
  const query = text ? text.trim() : '';
  if (!query) return;

  // Clear input
  const inputEl = document.getElementById('childTextInput');
  inputEl.value = '';

  // Append child message
  appendChildMessage(query);

  // Set Kuromi state: Thinking
  setKuromiState('thinking');
  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  document.getElementById('kuromiStatusText').textContent = `Kuromi đang tra cứu câu trả lời thật hay cho bé ${childName} đây... Chờ xíu nha! 💭✨`;

  // Simulate short cute thinking delay
  setTimeout(async () => {
    let result;
    if (APP_STATE.settings.aiMode === 'gemini' && APP_STATE.settings.geminiApiKey) {
      result = await callGeminiApi(query);
    } else {
      result = getKidFriendlyLocalAnswer(query);
    }

    setKuromiState(result.song ? 'singing' : 'happy');
    document.getElementById('kuromiStatusText').textContent = result.song 
      ? `Kuromi hát tặng bé ${childName} nè! Cùng vỗ tay nào! 🎶🎀`
      : `Kuromi giải đáp cho bé ${childName} rồi đây! Bé xem có thích không nè? 💕`;

    appendKuromiResponse(result);
  }, 650);
}

// =============================================================================
// 9. IMAGE FULLSCREEN ZOOM MODAL
// =============================================================================
function openImageZoom(src, caption) {
  playSfx('chime');
  const modal = document.getElementById('imageZoomModal');
  const targetImg = document.getElementById('zoomTargetImg');
  const captionEl = document.getElementById('zoomCaptionText');

  targetImg.src = src;
  captionEl.textContent = caption || 'Hình ảnh minh họa cho bé';
  modal.classList.remove('hidden');

  const speakBtn = document.getElementById('zoomSpeakCaptionBtn');
  speakBtn.onclick = () => {
    speakText(caption);
  };
}

function closeImageZoom() {
  playSfx('pop');
  document.getElementById('imageZoomModal').classList.add('hidden');
}

// =============================================================================
// 10. BACKGROUND FLOATING PARTICLES & STARS
// =============================================================================
function initSparklesBackground() {
  const container = document.getElementById('starsContainer');
  if (!container) return;

  const symbols = ['⭐', '✨', '💖', '🎀', '🌸', '💫'];
  for (let i = 0; i < 22; i++) {
    const star = document.createElement('div');
    star.className = 'floating-star';
    star.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    star.style.left = `${Math.random() * 100}vw`;
    star.style.top = `${Math.random() * 100}vh`;
    star.style.fontSize = `${12 + Math.random() * 16}px`;
    star.style.animationDuration = `${5 + Math.random() * 8}s`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    container.appendChild(star);
  }
}

// Utilities
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function formatResponseText(text) {
  if (!text) return '';
  let formatted = escapeHtml(text);
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

// =============================================================================
// 11. EVENT LISTENERS INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSparklesBackground();

  // Initialize Speech Recognition
  APP_STATE.recognition = initSpeechRecognition();

  // Voice Input Button
  const micBtn = document.getElementById('voiceInputBtn');
  micBtn.addEventListener('click', () => {
    if (APP_STATE.isRecording) {
      if (APP_STATE.recognition) APP_STATE.recognition.stop();
      APP_STATE.isRecording = false;
      micBtn.classList.remove('recording');
    } else {
      if (APP_STATE.recognition) {
        try {
          APP_STATE.recognition.start();
        } catch (e) {
          console.warn("Recognition start error", e);
        }
      } else {
        alert("Trình duyệt của bé chưa hỗ trợ nhận diện giọng nói. Bé có thể gõ chữ hoặc bấm các gợi ý nhé!");
      }
    }
  });

  // Text Input & Send Button
  const inputEl = document.getElementById('childTextInput');
  const sendBtn = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', () => {
    playSfx('pop');
    handleChildSubmit(inputEl.value);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      playSfx('pop');
      handleChildSubmit(inputEl.value);
    }
  });

  // Quick Explore Chips
  document.querySelectorAll('.explore-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      playSfx('pop');
      const prompt = chip.getAttribute('data-prompt');
      handleChildSubmit(prompt);
    });
  });

  // Quick Emoji Reactions
  document.querySelectorAll('.quick-react-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSfx('heart');
      inputEl.value += btn.textContent;
      inputEl.focus();
    });
  });

  // Mascot Stage Fun Action Buttons
  document.getElementById('actionDanceBtn').addEventListener('click', () => {
    playSfx('chime');
    setKuromiState('dancing');
    document.getElementById('kuromiStatusText').textContent = "La la la~ Bé cùng nhún nhảy theo điệu nhảy Kuromi nào! 💃✨";
    setTimeout(() => setKuromiState('normal'), 4000);
  });

  document.getElementById('actionSingBtn').addEventListener('click', () => {
    playSfx('pop');
    handleChildSubmit("Hát cho bé nghe một bài hát thiếu nhi vui nhộn nha");
  });

  document.getElementById('actionCheerBtn').addEventListener('click', () => {
    playSfx('heart');
    setKuromiState('happy');
    document.getElementById('kuromiStatusText').textContent = "Yêu bé nhất trần đời! Kuromi tặng bé một triệu trái tim hồng nè! 💖💖💖";
    playRealisticSound('cat');
  });

  // Top Header Toggles (Persisted without overwriting)
  const ttsBtn = document.getElementById('toggleTtsBtn');
  ttsBtn.classList.toggle('active', APP_STATE.ttsEnabled);
  ttsBtn.querySelector('.btn-label').textContent = APP_STATE.ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT';

  ttsBtn.addEventListener('click', () => {
    playSfx('pop');
    APP_STATE.ttsEnabled = !APP_STATE.ttsEnabled;
    ttsBtn.classList.toggle('active', APP_STATE.ttsEnabled);
    ttsBtn.querySelector('.btn-label').textContent = APP_STATE.ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT';
    saveSettings({ ttsEnabled: APP_STATE.ttsEnabled });
    if (!APP_STATE.ttsEnabled && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  });

  const sfxBtn = document.getElementById('toggleSfxBtn');
  sfxBtn.classList.toggle('active', APP_STATE.sfxEnabled);
  sfxBtn.addEventListener('click', () => {
    APP_STATE.sfxEnabled = !APP_STATE.sfxEnabled;
    sfxBtn.classList.toggle('active', APP_STATE.sfxEnabled);
    saveSettings({ sfxEnabled: APP_STATE.sfxEnabled });
    playSfx('pop');
  });

  // Demo song button in initial message
  const demoSongBtn = document.getElementById('demoPlaySongBtn');
  if (demoSongBtn) {
    demoSongBtn.addEventListener('click', () => {
      handleChildSubmit("Hát cho bé nghe bài Kìa con bướm vàng");
    });
  }

  // Now Playing Mini Dock buttons
  document.getElementById('dockStopBtn').addEventListener('click', () => {
    stopCurrentSong();
  });

  document.getElementById('dockPauseBtn').addEventListener('click', () => {
    stopCurrentSong();
  });

  // Close Zoom Modal
  document.getElementById('closeZoomBtn').addEventListener('click', closeImageZoom);
  document.getElementById('imageZoomModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageZoomModal') closeImageZoom();
  });

  // Parent Settings Modal
  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  // Remote Link (Different Wi-Fi / 4G) Modal
  const remoteModal = document.getElementById('remoteLinkModal');
  const remoteBtn = document.getElementById('remoteLinkBtn');
  const closeRemoteBtn = document.getElementById('closeRemoteBtn');
  const copyPublicUrlBtn = document.getElementById('copyPublicUrlBtn');

  if (remoteBtn && remoteModal) {
    remoteBtn.addEventListener('click', () => {
      playSfx('pop');
      remoteModal.classList.remove('hidden');
    });
    if (closeRemoteBtn) {
      closeRemoteBtn.addEventListener('click', () => {
        playSfx('pop');
        remoteModal.classList.add('hidden');
      });
    }
    remoteModal.addEventListener('click', (e) => {
      if (e.target.id === 'remoteLinkModal') {
        remoteModal.classList.add('hidden');
      }
    });
  }

  if (copyPublicUrlBtn) {
    copyPublicUrlBtn.addEventListener('click', () => {
      const input = document.getElementById('publicUrlInput');
      if (input) {
        input.select();
        navigator.clipboard.writeText(input.value).then(() => {
          playSfx('chime');
          copyPublicUrlBtn.textContent = 'Đã chép! ✅';
          setTimeout(() => {
            copyPublicUrlBtn.textContent = 'Sao chép';
          }, 2000);
        });
      }
    });
  }

  openSettingsBtn.addEventListener('click', () => {
    playSfx('pop');
    settingsModal.classList.remove('hidden');

    const nameInput = document.getElementById('childNameInput');
    if (nameInput) {
      nameInput.value = APP_STATE.settings.childName || 'Bảo Hân';
    }

    // Populate current values
    if (APP_STATE.settings.aiMode === 'gemini') {
      document.getElementById('modeGemini').checked = true;
      document.getElementById('apiKeyBlock').classList.remove('hidden');
    } else {
      document.getElementById('modeLocal').checked = true;
      document.getElementById('apiKeyBlock').classList.add('hidden');
    }
    document.getElementById('geminiApiKey').value = APP_STATE.settings.geminiApiKey || '';
    document.getElementById('ttsRateSlider').value = APP_STATE.settings.ttsRate || 1.05;
    document.getElementById('ttsRateVal').textContent = `${APP_STATE.settings.ttsRate || 1.05}x`;
    document.getElementById('ttsPitchSlider').value = APP_STATE.settings.ttsPitch || 1.35;
  });

  closeSettingsBtn.addEventListener('click', () => {
    playSfx('pop');
    settingsModal.classList.add('hidden');
  });

  // Settings Radio toggle
  document.querySelectorAll('input[name="aiMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'gemini') {
        document.getElementById('apiKeyBlock').classList.remove('hidden');
      } else {
        document.getElementById('apiKeyBlock').classList.add('hidden');
      }
    });
  });

  // Age group selector
  document.querySelectorAll('.age-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      APP_STATE.settings.ageGroup = btn.getAttribute('data-age');
    });
  });

  // Rate & pitch sliders
  const rateSlider = document.getElementById('ttsRateSlider');
  rateSlider.addEventListener('input', () => {
    document.getElementById('ttsRateVal').textContent = `${rateSlider.value}x`;
    APP_STATE.settings.ttsRate = parseFloat(rateSlider.value);
  });

  const pitchSlider = document.getElementById('ttsPitchSlider');
  pitchSlider.addEventListener('input', () => {
    APP_STATE.settings.ttsPitch = parseFloat(pitchSlider.value);
  });

  // Save Settings Non-Destructively
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    playSfx('chime');
    const selectedMode = document.querySelector('input[name="aiMode"]:checked').value;
    const key = document.getElementById('geminiApiKey').value.trim();
    const nameInput = document.getElementById('childNameInput');
    const newName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : (APP_STATE.settings.childName || 'Bảo Hân');

    saveSettings({
      aiMode: selectedMode,
      geminiApiKey: key,
      childName: newName,
      ageGroup: APP_STATE.settings.ageGroup || 'preschool',
      ttsRate: APP_STATE.settings.ttsRate || 1.05,
      ttsPitch: APP_STATE.settings.ttsPitch || 1.35
    });

    settingsModal.classList.add('hidden');
    document.getElementById('kuromiStatusText').textContent = `Ba Mẹ đã lưu cài đặt thành công! Kuromi sẵn sàng phục vụ bé ${APP_STATE.settings.childName} rồi ạ! 🎀✨`;
  });

  // Clear Chat History (Leaves user settings completely intact!)
  document.getElementById('clearChatBtn').addEventListener('click', () => {
    if (confirm("Ba mẹ có chắc muốn xóa lịch sử trò chuyện để bắt đầu lại không? (Mọi cài đặt tên bé và tùy chọn vẫn được giữ nguyên vẹn)")) {
      localStorage.removeItem('kuromi_chat_history');
      const container = document.getElementById('chatContainer');
      const initial = container.querySelector('.initial-message');
      container.innerHTML = '';
      if (initial) container.appendChild(initial);
      settingsModal.classList.add('hidden');
      playSfx('pop');
    }
  });

  // Apply persisted name & load chat history
  applyChildNameUi(APP_STATE.settings.childName);
  loadChatHistory();

  // Say hi to child on load
  setTimeout(() => {
    playSfx('chime');
  }, 1000);
});
