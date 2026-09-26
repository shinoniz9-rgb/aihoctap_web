/**
 * KUROMI AI BOT FOR KIDS - MULTI-SENSORY ENGINE 2.0
 * Comprehensive Kids Encyclopedia, Intelligent Multi-Level NLP,
 * Web Audio Polyphonic Jukebox, Animal & Nature SFX Synthesizer,
 * Real-time Gemini 2.5 / 2.0 API with Diagnostics & Online Wikipedia Fallback.
 */

// =============================================================================
// 1. GLOBAL STATE & SETTINGS (NON-DESTRUCTIVE SAFE MERGE)
// =============================================================================
const DEFAULT_SETTINGS = {
  childName: 'Bảo Hân',
  aiMode: 'local', // 'local' or 'gemini'
  geminiApiKey: '',
  ageGroup: 'preschool', // 'preschool' (3-6) or 'primary' (7-12)
  ttsRate: 1.05,
  ttsPitch: 1.25,
  ttsEnabled: true,
  sfxEnabled: true,
  voiceStyle: 'kuromi_anime', // 'kuromi_anime', 'google_online', 'fairy', 'device'
  familySyncCode: 'baohan0311',
  updatedAt: 0
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('kuromi_bot_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
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
  currentMascotState: 'normal',
  currentPlayingSong: null,
  speechSynth: window.speechSynthesis || null,
  isRecording: false,
  recognition: null,
  settings: loadSettings(),
  activeCategory: 'all'
};

APP_STATE.ttsEnabled = APP_STATE.settings.ttsEnabled !== false;
APP_STATE.sfxEnabled = APP_STATE.settings.sfxEnabled !== false;

function saveSettings(partial = {}) {
  try {
    const current = loadSettings();
    const updated = {
      ...current,
      ...APP_STATE.settings,
      ...partial,
      updatedAt: Date.now()
    };
    APP_STATE.settings = updated;
    APP_STATE.ttsEnabled = updated.ttsEnabled !== false;
    APP_STATE.sfxEnabled = updated.sfxEnabled !== false;
    localStorage.setItem('kuromi_bot_settings', JSON.stringify(updated));
    applyChildNameUi(updated.childName);
    if (window.KuromiSync) {
      window.KuromiSync.queuePush('settings', updated);
    }
    return updated;
  } catch (e) {
    console.warn("Storage save error", e);
  }
}

function applyChildNameUi(childName) {
  const name = (childName || 'Bảo Hân').trim();
  document.title = `Kuromi & Bé ${name} | Trợ Lý AI & Học Tập`;
  
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

  // Update learning classroom child name elements
  document.querySelectorAll('.child-name-val').forEach(el => {
    el.textContent = name;
  });

  const learnStatus = document.getElementById('learningStatusText');
  if (learnStatus) {
    learnStatus.innerHTML = `Hoan hô bé <span class="child-name-val">${name}</span> đã vào lớp học! Hôm nay chúng mình cùng khám phá trạm nào nào? ⭐`;
  }
}

function saveChatHistory(item) {
  try {
    const raw = localStorage.getItem('kuromi_chat_history');
    const list = raw ? JSON.parse(raw) : [];
    list.push(item);
    if (list.length > 60) list.shift();
    localStorage.setItem('kuromi_chat_history', JSON.stringify(list));
    if (window.KuromiSync) {
      window.KuromiSync.queuePush('chat_history', list);
    }
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
// LEARNING HUB & CLASSROOM ENGINE (NON-DESTRUCTIVE SAFE MERGE)
// =============================================================================
const DEFAULT_LEARNING_DATA = {
  stars: 0,
  rank: 'Bé Chăm Chỉ Khởi Đầu ⭐',
  completedActivities: [],
  activeFilter: 'all',
  currentMode: 'chat',
  updatedAt: 0
};

function loadLearningData() {
  try {
    const saved = localStorage.getItem('kuromi_learning_data');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_LEARNING_DATA, ...parsed };
    }
  } catch (e) {
    console.warn("Learning load error", e);
  }
  return { ...DEFAULT_LEARNING_DATA };
}

let LEARNING_STATE = loadLearningData();

function saveLearningData(partial = {}) {
  try {
    const current = loadLearningData();
    const updated = { ...current, ...LEARNING_STATE, ...partial, updatedAt: Date.now() };
    LEARNING_STATE = updated;
    localStorage.setItem('kuromi_learning_data', JSON.stringify(updated));
    updateLearningUi();
    if (window.KuromiSync) {
      window.KuromiSync.queuePush('learning', updated);
    }
    return updated;
  } catch (e) {
    console.warn("Learning save error", e);
  }
}

function updateLearningUi() {
  const currentStars = typeof LEARNING_STATE.stars === 'number' ? LEARNING_STATE.stars : 0;

  const starCountEl = document.getElementById('learningStarCount');
  if (starCountEl) starCountEl.textContent = currentStars;

  const modalStarEl = document.getElementById('modalStarCounter');
  if (modalStarEl) modalStarEl.textContent = currentStars;

  const rankEl = document.getElementById('learningRankTitle');
  if (rankEl) {
    let rank = 'Bé Chăm Chỉ Khởi Đầu ⭐';
    if (currentStars >= 30) rank = 'Trạng Nguyên Tí Hon 👑';
    else if (currentStars >= 20) rank = 'Thám Tử Nhí Xuất Sắc 🌟';
    else if (currentStars >= 15) rank = 'Nhà Thông Thái Nhí 🌸';
    else if (currentStars >= 5) rank = 'Bé Chăm Chỉ Thông Thái 💖';
    else if (currentStars > 0) rank = 'Bé Ngoan Chăm Học 🌱';
    else rank = 'Bé Chăm Chỉ Khởi Đầu ⭐';
    rankEl.textContent = rank;
  }

  const progressBar = document.getElementById('learningProgressBar');
  if (progressBar) {
    const pct = Math.min(100, Math.max(5, Math.round((currentStars / 30) * 100)));
    progressBar.style.width = `${pct}%`;
  }

  const progressHint = document.getElementById('learningProgressHint');
  if (progressHint) {
    if (currentStars >= 30) {
      progressHint.innerHTML = `Hoan hô bé đã xuất sắc nhận danh hiệu <strong>Trạng Nguyên Tí Hon 👑</strong>`;
    } else if (currentStars === 0) {
      progressHint.innerHTML = `Bé hoàn thành bài tập để nhận danh hiệu <strong>Trạng Nguyên Tí Hon 👑</strong>`;
    } else {
      progressHint.innerHTML = `Còn <strong>${30 - currentStars}</strong> sao nữa để nhận danh hiệu <strong>Trạng Nguyên Tí Hon 👑</strong>`;
    }
  }
}

// =============================================================================
// FIREBASE REALTIME CLOUD SYNC ENGINE (SINGAPORE MULTI-DEVICE INSTANT SYNC)
// =============================================================================
const FIREBASE_DB_URL = 'https://aihoctap-4722c-default-rtdb.asia-southeast1.firebasedatabase.app';

const KuromiSync = {
  activeSse: null,
  isSyncing: false,
  debounceTimers: {},
  suppressOutbound: false,

  getFamilyCode() {
    const raw = (APP_STATE.settings && APP_STATE.settings.familySyncCode) ? APP_STATE.settings.familySyncCode : 'baohan0311';
    return raw.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || 'baohan0311';
  },

  updateStatusUi(status, detail) {
    const badge = document.getElementById('syncStatusBadge');
    const statusText = document.getElementById('syncStatusText');
    const headerBtn = document.getElementById('cloudSyncHeaderBtn');
    const headerLabel = document.getElementById('cloudSyncHeaderLabel');
    const lastTimeEl = document.getElementById('syncLastTime');

    if (badge && statusText) {
      badge.classList.remove('syncing', 'error');
      if (status === 'synced') {
        statusText.textContent = 'Đã kết nối Firebase Cloud';
      } else if (status === 'syncing') {
        badge.classList.add('syncing');
        statusText.textContent = detail || 'Đang đồng bộ dữ liệu...';
      } else if (status === 'error') {
        badge.classList.add('error');
        statusText.textContent = detail || 'Chưa thể kết nối Firebase';
      }
    }

    if (headerBtn && headerLabel) {
      headerLabel.textContent = 'Đồng bộ: BẬT';
      if (status === 'synced') {
        headerBtn.classList.add('active');
        headerBtn.classList.remove('syncing');
      } else if (status === 'syncing') {
        headerBtn.classList.add('active', 'syncing');
      } else if (status === 'error') {
        headerBtn.classList.remove('active', 'syncing');
        headerLabel.textContent = 'Đồng bộ: TẮT';
      }
    }

    if (lastTimeEl && status === 'synced') {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      lastTimeEl.textContent = `Vừa xong (${timeStr})`;
    }
  },

  async pushData(branch, data) {
    if (this.suppressOutbound) return;
    const code = this.getFamilyCode();
    try {
      this.updateStatusUi('syncing');
      const url = `${FIREBASE_DB_URL}/families/${code}/${branch}.json`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        this.updateStatusUi('synced');
      } else {
        console.warn('Firebase sync HTTP error', res.status);
        this.updateStatusUi('error', 'Lỗi kết nối Firebase');
      }
    } catch (e) {
      console.warn('Firebase sync push error', branch, e);
      this.updateStatusUi('error', 'Mất kết nối mạng');
    }
  },

  queuePush(branch, data) {
    if (this.suppressOutbound) return;
    if (this.debounceTimers[branch]) clearTimeout(this.debounceTimers[branch]);
    this.debounceTimers[branch] = setTimeout(() => {
      this.pushData(branch, data);
    }, 600);
  },

  async initialPull() {
    const code = this.getFamilyCode();
    try {
      this.updateStatusUi('syncing', 'Đang tải dữ liệu đám mây...');
      const res = await fetch(`${FIREBASE_DB_URL}/families/${code}.json`);
      if (!res.ok) {
        this.updateStatusUi('error');
        return;
      }
      const cloudData = await res.json();
      
      if (!cloudData) {
        console.log("Khởi tạo node đám mây cho mã:", code);
        await this.pushData('settings', APP_STATE.settings);
        await this.pushData('learning', LEARNING_STATE);
        const rawChat = localStorage.getItem('kuromi_chat_history');
        if (rawChat) {
          try { await this.pushData('chat_history', JSON.parse(rawChat)); } catch (e) {}
        }
        this.updateStatusUi('synced');
        this.initRealtimeListener();
        return;
      }

      this.suppressOutbound = true;

      // 1. Settings Safe Merge (Smart timestamped comparison)
      if (cloudData.settings) {
        const localTime = APP_STATE.settings.updatedAt || 0;
        const cloudTime = cloudData.settings.updatedAt || 0;
        const localKey = (APP_STATE.settings && APP_STATE.settings.geminiApiKey) || '';
        const cloudKey = cloudData.settings.geminiApiKey || '';
        const effectiveKey = localKey || cloudKey;

        let merged;
        if (cloudTime > localTime) {
          merged = {
            ...DEFAULT_SETTINGS,
            ...APP_STATE.settings,
            ...cloudData.settings,
            geminiApiKey: effectiveKey
          };
        } else {
          merged = {
            ...DEFAULT_SETTINGS,
            ...cloudData.settings,
            ...APP_STATE.settings,
            geminiApiKey: effectiveKey
          };
          this.queuePush('settings', merged);
        }

        // Preserve gemini mode if user configured key or chose gemini
        if (effectiveKey && (APP_STATE.settings.aiMode === 'gemini' || cloudData.settings.aiMode === 'gemini')) {
          merged.aiMode = 'gemini';
        }

        APP_STATE.settings = merged;
        localStorage.setItem('kuromi_bot_settings', JSON.stringify(merged));
        applyChildNameUi(merged.childName);
        
        const syncInput = document.getElementById('familySyncCodeInput');
        if (syncInput) syncInput.value = merged.familySyncCode || code;

        const currentAge = merged.ageGroup || 'preschool';
        document.querySelectorAll('.age-btn').forEach(card => {
          card.classList.toggle('active', card.getAttribute('data-age') === currentAge);
        });

        // Sync AI Mode radios & API Key
        const modeGeminiRadio = document.getElementById('modeGemini');
        const modeLocalRadio = document.getElementById('modeLocal');
        const apiKeyBlock = document.getElementById('apiKeyBlock');
        const apiKeyField = document.getElementById('geminiApiKey');
        if (apiKeyField && effectiveKey) apiKeyField.value = effectiveKey;
        if (merged.aiMode === 'gemini') {
          if (modeGeminiRadio) modeGeminiRadio.checked = true;
          if (apiKeyBlock) apiKeyBlock.classList.remove('hidden');
        } else {
          if (modeLocalRadio) modeLocalRadio.checked = true;
        }
      }

      // 2. Learning Stars Safe Merge (Timestamped Synchronization)
      if (cloudData.learning) {
        const localTime = LEARNING_STATE.updatedAt || 0;
        const cloudTime = cloudData.learning.updatedAt || 0;

        if (cloudTime > localTime) {
          const finalStars = typeof cloudData.learning.stars === 'number' ? cloudData.learning.stars : 0;
          const currentCompleted = Array.isArray(LEARNING_STATE.completedActivities) ? LEARNING_STATE.completedActivities : [];
          const cloudCompleted = Array.isArray(cloudData.learning.completedActivities) ? cloudData.learning.completedActivities : [];
          const mergedCompleted = Array.from(new Set([...currentCompleted, ...cloudCompleted]));

          LEARNING_STATE = {
            ...DEFAULT_LEARNING_DATA,
            ...LEARNING_STATE,
            ...cloudData.learning,
            stars: finalStars,
            completedActivities: mergedCompleted,
            updatedAt: cloudTime
          };
          localStorage.setItem('kuromi_learning_data', JSON.stringify(LEARNING_STATE));
          updateLearningUi();
        } else {
          this.queuePush('learning', LEARNING_STATE);
        }
      }

      // 3. Chat History Merge
      if (Array.isArray(cloudData.chat_history) && cloudData.chat_history.length > 0) {
        const localRaw = localStorage.getItem('kuromi_chat_history');
        const localList = localRaw ? JSON.parse(localRaw) : [];
        if (localList.length === 0) {
          localStorage.setItem('kuromi_chat_history', JSON.stringify(cloudData.chat_history));
          const chatContainer = document.getElementById('chatContainer');
          if (chatContainer) {
            cloudData.chat_history.forEach(msg => {
              if (msg.type === 'child') appendChildMessage(msg.text, false);
              else if (msg.type === 'kuromi') appendKuromiResponse(msg.data, false);
            });
          }
        }
      }

      this.suppressOutbound = false;
      this.updateStatusUi('synced');
      this.initRealtimeListener();
    } catch (e) {
      this.suppressOutbound = false;
      console.warn("Initial sync pull error", e);
      this.updateStatusUi('error');
    }
  },

  initRealtimeListener() {
    if (this.activeSse) {
      try { this.activeSse.close(); } catch (e) {}
      this.activeSse = null;
    }
    const code = this.getFamilyCode();
    try {
      this.activeSse = new EventSource(`${FIREBASE_DB_URL}/families/${code}.json`);

      this.activeSse.addEventListener('put', (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (!payload) return;
          const path = payload.path || '/';
          const data = payload.data;

          this.suppressOutbound = true;

          // Remote Learning update (e.g. Star earned on iPad)
          if (path === '/' && data && data.learning) {
            if (typeof data.learning.stars === 'number' && data.learning.stars !== LEARNING_STATE.stars) {
              LEARNING_STATE.stars = data.learning.stars;
              LEARNING_STATE.rank = data.learning.rank || LEARNING_STATE.rank;
              localStorage.setItem('kuromi_learning_data', JSON.stringify(LEARNING_STATE));
              updateLearningUi();
              triggerStarExplosion();
            }
          } else if (path === '/learning' && data && typeof data.stars === 'number') {
            if (data.stars !== LEARNING_STATE.stars) {
              LEARNING_STATE.stars = data.stars;
              LEARNING_STATE.rank = data.rank || LEARNING_STATE.rank;
              localStorage.setItem('kuromi_learning_data', JSON.stringify(LEARNING_STATE));
              updateLearningUi();
              triggerStarExplosion();
            }
          } else if (path === '/learning/stars' && typeof data === 'number') {
            if (data !== LEARNING_STATE.stars) {
              LEARNING_STATE.stars = data;
              localStorage.setItem('kuromi_learning_data', JSON.stringify(LEARNING_STATE));
              updateLearningUi();
              triggerStarExplosion();
            }
          }

          // Remote Settings update (e.g. Name change on iPad)
          if (path === '/settings/childName' && typeof data === 'string') {
            APP_STATE.settings.childName = data;
            localStorage.setItem('kuromi_bot_settings', JSON.stringify(APP_STATE.settings));
            applyChildNameUi(data);
          } else if (path === '/settings' && data && data.childName) {
            APP_STATE.settings = { ...DEFAULT_SETTINGS, ...APP_STATE.settings, ...data };
            localStorage.setItem('kuromi_bot_settings', JSON.stringify(APP_STATE.settings));
            applyChildNameUi(data.childName);
          }

          this.suppressOutbound = false;
          this.updateStatusUi('synced');
        } catch (err) {
          this.suppressOutbound = false;
          console.warn("Realtime SSE parse error", err);
        }
      });

      this.activeSse.onerror = () => {
        // EventSource handles reconnection automatically
      };
    } catch (e) {
      console.warn("Realtime listener init error", e);
    }
  }
};

window.KuromiSync = KuromiSync;

function switchAppMode(mode, playSoundAndSpeech = true) {
  if (playSoundAndSpeech) playSfx('pop');
  const chatView = document.getElementById('chatMainView');
  const learnView = document.getElementById('learningMainView');
  const navChat = document.getElementById('navModeChat');
  const navLearn = document.getElementById('navModeLearning');

  if (mode === 'learning') {
    if (chatView) {
      chatView.classList.add('hidden');
      chatView.style.setProperty('display', 'none', 'important');
    }
    if (learnView) {
      learnView.classList.remove('hidden');
      learnView.style.setProperty('display', 'grid', 'important');
    }
    if (navChat) navChat.classList.remove('active');
    if (navLearn) navLearn.classList.add('active');

    LEARNING_STATE.currentMode = 'learning';
    saveLearningData({ currentMode: 'learning' });

    const childName = APP_STATE.settings.childName || 'Bảo Hân';
    const learnStatus = document.getElementById('learningStatusText');
    if (learnStatus) {
      learnStatus.innerHTML = `Hoan hô bé <span class="child-name-val">${childName}</span> đã vào lớp học! Hôm nay chúng mình cùng khám phá trạm nào nào? ⭐`;
    }

    if (playSoundAndSpeech && APP_STATE.ttsEnabled) {
      speakText(`Chào mừng bé ${childName} đến với Lớp Học Kuromi! Hôm nay bé muốn cùng Kuromi khám phá trạm học tập nào nào?`);
    }
  } else {
    if (learnView) {
      learnView.classList.add('hidden');
      learnView.style.setProperty('display', 'none', 'important');
    }
    if (chatView) {
      chatView.classList.remove('hidden');
      chatView.style.setProperty('display', 'grid', 'important');
    }
    if (navLearn) navLearn.classList.remove('active');
    if (navChat) navChat.classList.add('active');

    LEARNING_STATE.currentMode = 'chat';
    saveLearningData({ currentMode: 'chat' });
  }
}

function awardLearningStar(amount = 1, customMsg = '') {
  playSfx('star');
  const current = typeof LEARNING_STATE.stars === 'number' ? LEARNING_STATE.stars : 12;
  LEARNING_STATE.stars = current + amount;
  saveLearningData({ stars: LEARNING_STATE.stars });

  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  const msg = customMsg || `Kuromi tặng bé ${childName} ${amount} ngôi sao sáng! Bé giỏi quá! ⭐`;
  if (APP_STATE.ttsEnabled) {
    speakText(msg);
  }

  triggerStarExplosion();
}

function triggerStarExplosion() {
  const container = document.body;
  for (let i = 0; i < 15; i++) {
    const star = document.createElement('div');
    star.textContent = ['⭐', '✨', '🌟', '💖', '🍭'][Math.floor(Math.random() * 5)];
    star.style.position = 'fixed';
    star.style.left = `${50 + (Math.random() * 40 - 20)}vw`;
    star.style.top = `${50 + (Math.random() * 30 - 15)}vh`;
    star.style.fontSize = `${20 + Math.random() * 24}px`;
    star.style.zIndex = '99999';
    star.style.pointerEvents = 'none';
    star.style.transition = 'all 1.2s cubic-bezier(0.25, 1, 0.5, 1)';
    star.style.opacity = '1';
    container.appendChild(star);

    setTimeout(() => {
      star.style.transform = `translate(${(Math.random() - 0.5) * 350}px, ${-100 - Math.random() * 250}px) scale(1.6) rotate(${Math.random() * 360}deg)`;
      star.style.opacity = '0';
    }, 20);

    setTimeout(() => {
      star.remove();
    }, 1300);
  }
}

// Interactive Station Activities Content & Logic
const LEARNING_ACTIVITIES = {
  math: {
    title: 'Toán Học Kẹo Ngọt & Đếm Số',
    subtitle: 'Đếm kẹo & phép cộng trừ siêu dễ hiểu cùng Kuromi',
    icon: '🍓🧮',
    render: (container) => {
      const questions = [
        {
          type: 'add',
          leftIcons: '🍓 🍓',
          leftCount: 2,
          rightIcons: '🍓 🍓 🍓',
          rightCount: 3,
          op: '+',
          total: 5,
          options: [4, 5, 6],
          fruit: 'quả dâu tây',
          story: 'Kuromi có 2 quả dâu, mẹ cho thêm 3 quả dâu nữa. Hỏi có tất cả mấy quả dâu tây?'
        },
        {
          type: 'add',
          leftIcons: '🍭 🍭 🍭 🍭',
          leftCount: 4,
          rightIcons: '🍭 🍭',
          rightCount: 2,
          op: '+',
          total: 6,
          options: [5, 6, 7],
          fruit: 'cây kẹo mút',
          story: 'Kuromi có 4 cây kẹo mút, bé mang đến thêm 2 cây kẹo mút. Tổng cộng có bao nhiêu cây kẹo?'
        },
        {
          type: 'sub',
          leftIcons: '🍇 🍇 🍇 🍇 🍇',
          leftCount: 5,
          rightIcons: '🍇 🍇',
          rightCount: 2,
          op: '-',
          total: 3,
          options: [2, 3, 4],
          fruit: 'quả nho tím',
          story: 'Trên đĩa có 5 quả nho, Kuromi ăn mất 2 quả rồi. Trên đĩa còn lại mấy quả nho nào?'
        },
        {
          type: 'add',
          leftIcons: '🍎 🍎 🍎',
          leftCount: 3,
          rightIcons: '🍎 🍎 🍎 🍎',
          rightCount: 4,
          op: '+',
          total: 7,
          options: [6, 7, 8],
          fruit: 'quả táo đỏ',
          story: 'Có 3 quả táo trên bàn, cô giáo tặng thêm 4 quả táo nữa. Hỏi có tất cả mấy quả táo?'
        },
        {
          type: 'sub',
          leftIcons: '🧁 🧁 🧁 🧁 🧁 🧁',
          leftCount: 6,
          rightIcons: '🧁 🧁 🧁',
          rightCount: 3,
          op: '-',
          total: 3,
          options: [2, 3, 4],
          fruit: 'chiếc bánh kem',
          story: 'Có 6 chiếc bánh kem ngon lành, cả nhà cùng ăn 3 chiếc. Hỏi còn lại bao nhiêu chiếc bánh?'
        },
        {
          type: 'add',
          leftIcons: '⭐ ⭐ ⭐ ⭐',
          leftCount: 4,
          rightIcons: '⭐ ⭐ ⭐ ⭐',
          rightCount: 4,
          op: '+',
          total: 8,
          options: [7, 8, 9],
          fruit: 'ngôi sao sáng',
          story: 'Bé nhận được 4 ngôi sao, cô giáo thưởng thêm 4 ngôi sao nữa. Bé có tất cả mấy ngôi sao?'
        }
      ];

      let currentQIndex = 0;
      let scoreCorrect = 0;
      const solvedSet = new Set();

      function renderQuestion() {
        const q = questions[currentQIndex];
        const childName = APP_STATE.settings.childName || 'Bảo Hân';
        const isSub = q.op === '-';
        const promptLabel = isSub 
          ? `Bé ${childName} chọn số quả còn lại sau khi bớt nhé:` 
          : `Bé ${childName} bấm chọn tổng số quả bên dưới nhé:`;

        container.innerHTML = `
          <div class="math-game-box">
            <!-- Top Toolbar with Reset & Question Switcher -->
            <div class="math-top-toolbar">
              <div class="math-progress-badge">
                <span class="math-q-counter">📝 Bài: ${currentQIndex + 1}/${questions.length}</span>
                <span class="math-score-pill">⭐ Đúng: ${scoreCorrect}</span>
              </div>
              <div class="math-toolbar-actions">
                <button type="button" class="math-tool-btn" id="mathResetBtn" title="Làm lại từ đầu">
                  <span>🔄</span> Làm lại
                </button>
                <button type="button" class="math-tool-btn" id="mathNextQBtn" title="Chuyển bài khác">
                  <span>🎲</span> Đổi bài
                </button>
              </div>
            </div>

            <!-- Question Banner -->
            <div class="math-question-banner">
              <p class="math-story-text">🍬 ${q.story}</p>
              <div class="math-visual-row">
                <span class="math-group-box">${q.leftIcons} <small>(${q.leftCount})</small></span>
                <span class="math-operator">${q.op}</span>
                <span class="math-group-box">${q.rightIcons} <small>(${q.rightCount})</small></span>
                <span class="math-operator">=</span>
                <span class="math-question-mark">?</span>
              </div>
              <p class="math-prompt-text">${promptLabel}</p>
            </div>

            <!-- Choice Options -->
            <div class="math-options-grid">
              ${q.options.map(opt => `<button class="math-option-btn" data-val="${opt}">${opt}</button>`).join('')}
            </div>

            <div id="mathFeedback" class="math-feedback-text"></div>
          </div>
        `;

        if (APP_STATE.ttsEnabled) {
          const speechText = isSub
            ? `Bé ${childName} tính cùng Kuromi nhé: ${q.leftCount} trừ ${q.rightCount} bằng mấy nào?`
            : `Bé ${childName} tính cùng Kuromi nhé: ${q.leftCount} cộng ${q.rightCount} bằng mấy nào?`;
          speakText(speechText);
        }

        // Attach Reset Handler
        const resetBtn = container.querySelector('#mathResetBtn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            playSfx('chime');
            currentQIndex = 0;
            scoreCorrect = 0;
            solvedSet.clear();
            if (APP_STATE.ttsEnabled) {
              speakText(`Kuromi đã làm mới bài toán rồi! Bé ${childName} làm lại từ đầu cùng tớ nhé!`);
            }
            renderQuestion();
          });
        }

        // Attach Next Question Handler
        const nextBtn = container.querySelector('#mathNextQBtn');
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            playSfx('pop');
            currentQIndex = (currentQIndex + 1) % questions.length;
            renderQuestion();
          });
        }

        // Attach Choice Handlers
        container.querySelectorAll('.math-option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const chosen = parseInt(btn.getAttribute('data-val'));
            const feedback = container.querySelector('#mathFeedback');

            if (chosen === q.total) {
              btn.classList.add('correct');
              if (!solvedSet.has(currentQIndex)) {
                solvedSet.add(currentQIndex);
                scoreCorrect++;
                const scorePill = container.querySelector('.math-score-pill');
                if (scorePill) scorePill.textContent = `⭐ Đúng: ${scoreCorrect}`;
              }

              feedback.innerHTML = `🎉 Chính xác rồi! ${q.leftCount} ${q.op} ${q.rightCount} = ${q.total}. Bé ${childName} giỏi quá! ⭐`;
              feedback.style.color = '#76ff03';
              playSfx('fanfare');
              awardLearningStar(1, `Hoan hô bé ${childName} đã tính đúng! ${q.leftCount} ${q.op === '-' ? 'trừ' : 'cộng'} ${q.rightCount} bằng ${q.total}!`);

              setTimeout(() => {
                currentQIndex = (currentQIndex + 1) % questions.length;
                renderQuestion();
              }, 2200);
            } else {
              btn.classList.add('wrong');
              feedback.innerHTML = `😅 Bé ${childName} đếm lại que tính hoa quả cùng Kuromi một lần nữa nhé!`;
              feedback.style.color = '#ff80ab';
              playSfx('pop');
              if (APP_STATE.ttsEnabled) {
                speakText(`Chưa đúng rồi bé ơi, bé đếm lại ngón tay cùng Kuromi nhé!`);
              }
              setTimeout(() => btn.classList.remove('wrong'), 600);
            }
          });
        });
      }

      renderQuestion();
    }
  },

  vietnamese: {
    title: 'Bảng Chữ Cái Tiếng Việt & Đánh Vần',
    subtitle: 'Bé bấm vào từng chữ để Kuromi phát âm tròn vành rõ chữ',
    icon: '📖🎀',
    render: (container) => {
      const alphabet = [
        { letter: 'A', emoji: '🐟', word: 'Con Cá' },
        { letter: 'Ă', emoji: '🌕', word: 'Mặt Trăng' },
        { letter: 'Â', emoji: '🍄', word: 'Cây Nấm' },
        { letter: 'B', emoji: '⚽', word: 'Quả Bóng' },
        { letter: 'C', emoji: '🐕', word: 'Con Cún' },
        { letter: 'D', emoji: '🍉', word: 'Quả Dưa' },
        { letter: 'Đ', emoji: '💡', word: 'Bóng Đèn' },
        { letter: 'E', emoji: '👶', word: 'Em Bé' },
        { letter: 'Ê', emoji: '🐸', word: 'Con Ếch' },
        { letter: 'G', emoji: '🐓', word: 'Con Gà' },
        { letter: 'H', emoji: '🌸', word: 'Bông Hoa' },
        { letter: 'I', emoji: '🦆', word: 'Con Vịt' },
        { letter: 'K', emoji: '🍬', word: 'Viên Kẹo' },
        { letter: 'L', emoji: '🍃', word: 'Chiếc Lá' },
        { letter: 'M', emoji: '🐱', word: 'Con Mèo' },
        { letter: 'N', emoji: '☀️', word: 'Nắng Ấm' },
        { letter: 'O', emoji: '🐔', word: 'Con Gà Mái' },
        { letter: 'Ô', emoji: '🚗', word: 'Ô Tô' },
        { letter: 'Ơ', emoji: '🚩', word: 'Lá Cờ' },
        { letter: 'P', emoji: '🎈', word: 'Bong Bóng' },
        { letter: 'Q', emoji: '🎁', word: 'Hộp Quà' },
        { letter: 'R', emoji: '🐢', word: 'Con Rùa' },
        { letter: 'S', emoji: '🦁', word: 'Sư Tử' },
        { letter: 'T', emojiIcon: '🚂', word: 'Tàu Hỏa' },
        { letter: 'U', emoji: '🦉', word: 'Con Cú' },
        { letter: 'Ư', emoji: '🦋', word: 'Bướm Xinh' },
        { letter: 'V', emoji: '🐘', word: 'Con Voi' },
        { letter: 'X', emoji: '🚲', word: 'Xe Đạp' },
        { letter: 'Y', emoji: '🩺', word: 'Y Tế' }
      ];

      container.innerHTML = `
        <div style="text-align: center; margin-bottom: 12px;">
          <p style="font-size: 0.9rem; color: var(--kuromi-lavender);">
            Bé chạm vào bất kỳ chữ cái nào để nghe Kuromi đọc chuẩn tiếng Việt nhé:
          </p>
        </div>
        <div class="abc-board-grid">
          ${alphabet.map(item => `
            <button class="abc-card-btn" data-letter="${item.letter}" data-word="${item.word}">
              <span class="abc-letter">${item.letter}</span>
              <span class="abc-emoji">${item.emojiIcon || item.emoji}</span>
              <span class="abc-word">${item.word}</span>
            </button>
          `).join('')}
        </div>
      `;

      container.querySelectorAll('.abc-card-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          playSfx('pop');
          container.querySelectorAll('.abc-card-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const letter = btn.getAttribute('data-letter');
          const word = btn.getAttribute('data-word');

          if (APP_STATE.ttsEnabled) {
            speakText(`Chữ ${letter}! ${letter} trong ${word}!`);
          }
        });
      });
    }
  },

  english: {
    title: 'Tiếng Anh Nhí Flashcards (40+ Từ Vựng)',
    subtitle: 'Học từ vựng con vật, hoa quả, màu sắc & số đếm có phát âm chuẩn bản ngữ',
    icon: '🦁🌈',
    render: (container) => {
      const allCards = [
        // Animals
        { cat: 'animals', en: 'Lion', vi: 'Con Sư Tử', emoji: '🦁', ipa: '/ˈlaɪ.ən/' },
        { cat: 'animals', en: 'Elephant', vi: 'Con Voi', emoji: '🐘', ipa: '/ˈel.ɪ.fənt/' },
        { cat: 'animals', en: 'Monkey', vi: 'Con Khỉ', emoji: '🐵', ipa: '/ˈmʌŋ.ki/' },
        { cat: 'animals', en: 'Tiger', vi: 'Con Hổ', emoji: '🐯', ipa: '/ˈtaɪ.ɡər/' },
        { cat: 'animals', en: 'Dolphin', vi: 'Cá Heo', emoji: '🐬', ipa: '/ˈdɒl.fɪn/' },
        { cat: 'animals', en: 'Rabbit', vi: 'Con Thỏ', emoji: '🐰', ipa: '/ˈræb.ɪt/' },
        { cat: 'animals', en: 'Cat', vi: 'Con Mèo', emoji: '🐱', ipa: '/kæt/' },
        { cat: 'animals', en: 'Dog', vi: 'Con Chó', emoji: '🐶', ipa: '/dɒɡ/' },
        { cat: 'animals', en: 'Duck', vi: 'Con Vịt', emoji: '🦆', ipa: '/dʌk/' },
        { cat: 'animals', en: 'Butterfly', vi: 'Con Bướm', emoji: '🦋', ipa: '/ˈbʌt.ə.flaɪ/' },
        
        // Colors
        { cat: 'colors', en: 'Pink', vi: 'Màu Hồng', emoji: '🌸', ipa: '/pɪŋk/' },
        { cat: 'colors', en: 'Red', vi: 'Màu Đỏ', emoji: '❤️', ipa: '/red/' },
        { cat: 'colors', en: 'Blue', vi: 'Màu Xanh Dương', emoji: '💙', ipa: '/bluː/' },
        { cat: 'colors', en: 'Yellow', vi: 'Màu Vàng', emoji: '💛', ipa: '/ˈjel.əʊ/' },
        { cat: 'colors', en: 'Green', vi: 'Màu Xanh Lá', emoji: '💚', ipa: '/ɡriːn/' },
        { cat: 'colors', en: 'Purple', vi: 'Màu Tím', emoji: '💜', ipa: '/ˈpɜː.pəl/' },
        { cat: 'colors', en: 'Orange', vi: 'Màu Cam', emoji: '🧡', ipa: '/ˈɒr.ɪndʒ/' },
        { cat: 'colors', en: 'White', vi: 'Màu Trắng', emoji: '🤍', ipa: '/waɪt/' },

        // Fruits
        { cat: 'fruits', en: 'Apple', vi: 'Quả Táo', emoji: '🍎', ipa: '/ˈæp.əl/' },
        { cat: 'fruits', en: 'Banana', vi: 'Quả Chuối', emoji: '🍌', ipa: '/bəˈnɑː.nə/' },
        { cat: 'fruits', en: 'Strawberry', vi: 'Quả Dâu Tây', emoji: '🍓', ipa: '/ˈstrɔː.bər.i/' },
        { cat: 'fruits', en: 'Watermelon', vi: 'Quả Dưa Hấu', emoji: '🍉', ipa: '/ˈwɔː.təˌmel.ən/' },
        { cat: 'fruits', en: 'Orange', vi: 'Quả Cam', emoji: '🍊', ipa: '/ˈɒr.ɪndʒ/' },
        { cat: 'fruits', en: 'Grape', vi: 'Quả Nho', emoji: '🍇', ipa: '/ɡreɪp/' },
        { cat: 'fruits', en: 'Mango', vi: 'Quả Xoài', emoji: '🥭', ipa: '/ˈmæŋ.ɡəʊ/' },
        { cat: 'fruits', en: 'Peach', vi: 'Quả Đào', emoji: '🍑', ipa: '/piːtʃ/' },

        // Vehicles & Objects
        { cat: 'vehicles', en: 'Car', vi: 'Xe Ô Tô', emoji: '🚗', ipa: '/kɑːr/' },
        { cat: 'vehicles', en: 'Bus', vi: 'Xe Buýt', emoji: '🚌', ipa: '/bʌs/' },
        { cat: 'vehicles', en: 'Airplane', vi: 'Máy Bay', emoji: '✈️', ipa: '/ˈeə.pleɪn/' },
        { cat: 'vehicles', en: 'Train', vi: 'Tàu Hỏa', emoji: '🚂', ipa: '/treɪn/' },
        { cat: 'vehicles', en: 'Bicycle', vi: 'Xe Đạp', emoji: '🚲', ipa: '/ˈbaɪ.sɪ.kəl/' },
        { cat: 'vehicles', en: 'Book', vi: 'Quyển Sách', emoji: '📖', ipa: '/bʊk/' },
        { cat: 'vehicles', en: 'Sun', vi: 'Mặt Trời', emoji: '☀️', ipa: '/sʌn/' },
        { cat: 'vehicles', en: 'Rainbow', vi: 'Cầu Vồng', emoji: '🌈', ipa: '/ˈreɪn.bəʊ/' },

        // Numbers 1-10
        { cat: 'numbers', en: 'One', vi: 'Số 1', emoji: '1️⃣', ipa: '/wʌn/' },
        { cat: 'numbers', en: 'Two', vi: 'Số 2', emoji: '2️⃣', ipa: '/tuː/' },
        { cat: 'numbers', en: 'Three', vi: 'Số 3', emoji: '3️⃣', ipa: '/θriː/' },
        { cat: 'numbers', en: 'Four', vi: 'Số 4', emoji: '4️⃣', ipa: '/fɔːr/' },
        { cat: 'numbers', en: 'Five', vi: 'Số 5', emoji: '5️⃣', ipa: '/faɪv/' },
        { cat: 'numbers', en: 'Six', vi: 'Số 6', emoji: '6️⃣', ipa: '/sɪks/' },
        { cat: 'numbers', en: 'Seven', vi: 'Số 7', emoji: '7️⃣', ipa: '/ˈsev.ən/' },
        { cat: 'numbers', en: 'Eight', vi: 'Số 8', emoji: '8️⃣', ipa: '/eɪt/' },
        { cat: 'numbers', en: 'Nine', vi: 'Số 9', emoji: '9️⃣', ipa: '/naɪn/' },
        { cat: 'numbers', en: 'Ten', vi: 'Số 10', emoji: '🔟', ipa: '/ten/' }
      ];

      let activeCat = 'all';

      function renderFlashcards() {
        const filtered = activeCat === 'all' 
          ? allCards 
          : allCards.filter(c => c.cat === activeCat);

        container.innerHTML = `
          <div class="english-game-box">
            <!-- Category Navigation Tabs -->
            <div class="activity-category-nav">
              <button type="button" class="activity-cat-btn ${activeCat === 'all' ? 'active' : ''}" data-cat="all">🌟 Tất Cả (${allCards.length})</button>
              <button type="button" class="activity-cat-btn ${activeCat === 'animals' ? 'active' : ''}" data-cat="animals">🐾 Con Vật</button>
              <button type="button" class="activity-cat-btn ${activeCat === 'colors' ? 'active' : ''}" data-cat="colors">🎨 Màu Sắc</button>
              <button type="button" class="activity-cat-btn ${activeCat === 'fruits' ? 'active' : ''}" data-cat="fruits">🍎 Hoa Quả</button>
              <button type="button" class="activity-cat-btn ${activeCat === 'vehicles' ? 'active' : ''}" data-cat="vehicles">🚗 Xe Cộ</button>
              <button type="button" class="activity-cat-btn ${activeCat === 'numbers' ? 'active' : ''}" data-cat="numbers">🔢 Số Đếm</button>
            </div>

            <div class="flashcards-hint-row">
              <span class="flashcards-hint-text">💡 Bé chạm vào thẻ bài để Kuromi phát âm to rõ và dịch nghĩa nhé:</span>
            </div>

            <div class="flashcards-grid">
              ${filtered.map(card => `
                <div class="flashcard-item" data-en="${card.en}" data-vi="${card.vi}">
                  <span class="flashcard-emoji">${card.emoji}</span>
                  <span class="flashcard-en">${card.en}</span>
                  <span class="flashcard-ipa">${card.ipa}</span>
                  <span class="flashcard-vi">${card.vi}</span>
                  <span class="flashcard-speak-btn">🔊 Nghe đọc</span>
                </div>
              `).join('')}
            </div>
          </div>
        `;

        // Category filter click
        container.querySelectorAll('.activity-cat-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            playSfx('pop');
            activeCat = btn.getAttribute('data-cat');
            renderFlashcards();
          });
        });

        // Flashcard speak click
        container.querySelectorAll('.flashcard-item').forEach(card => {
          card.addEventListener('click', () => {
            playSfx('chime');
            const en = card.getAttribute('data-en');
            const vi = card.getAttribute('data-vi');

            if (APP_STATE.ttsEnabled) {
              speakText(`${en}! Nghĩa tiếng Việt là ${vi}!`);
            }
          });
        });
      }

      renderFlashcards();
    }
  },

  science: {
    title: 'Khám Phá Tự Nhiên & Vì Sao (20+ Đề Tài)',
    subtitle: 'Giải mã những hiện tượng thiên nhiên kỳ thú quanh bé',
    icon: '🪐🌱',
    render: (container) => {
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      const allTopics = [
        // Weather
        { cat: 'weather', title: '🌧️ Vì sao trời lại có mưa rơi?', prompt: 'Tại sao trời lại có mưa rơi vậy Kuromi?', summary: 'Nước ở sông hồ bốc hơi lên mây, khi mây nặng hạt ngưng tụ rơi xuống thành mưa mát lành!' },
        { cat: 'weather', title: '🌈 Vì sao sau mưa lại có cầu vồng 7 màu?', prompt: 'Vì sao sau cơn mưa lại có cầu vồng 7 màu?', summary: 'Ánh sáng Mặt Trời chiếu qua hàng triệu giọt nước li ti tán sắc thành dải cầu vồng 7 màu tuyệt đẹp!' },
        { cat: 'weather', title: '⚡ Vì sao lại có sấm chớp trên trời?', prompt: 'Vì sao lại có sấm chớp và sấm sét trong cơn giông?', summary: 'Những đám mây mang điện tích cọ xát vào nhau tạo thành tia chớp sáng chói và tiếng sấm rền vang!' },
        { cat: 'weather', title: '🌊 Vì sao nước biển lại có vị mặn?', prompt: 'Vì sao nước biển lại có vị mặn vậy Kuromi?', summary: 'Nước mưa hòa tan muối khoáng từ đất đá rồi đổ ra biển qua hàng triệu năm khiến biển có vị mặn!' },
        { cat: 'weather', title: '❄️ Vì sao tuyết lại có màu trắng và lạnh buốt?', prompt: 'Vì sao tuyết rơi lại trắng tinh và lạnh buốt?', summary: 'Tuyết là những tinh thể băng hình bông hoa 6 cánh lấp lánh phản chiếu toàn bộ ánh sáng trắng!' },
        { cat: 'weather', title: '🌬️ Gió từ đâu sinh ra vậy Kuromi?', prompt: 'Gió từ đâu thổi đến vậy Kuromi?', summary: 'Không khí nơi nóng bốc lên cao, không khí mát tràn vào lấp chỗ trống tạo thành những làn gió mát rượi!' },

        // Space
        { cat: 'space', title: '☀️ Vì sao Mặt Trời mọc và lặn mỗi ngày?', prompt: 'Vì sao có ngày và đêm trên Trái Đất?', summary: 'Trái Đất tự quay tròn xung quanh trục, nửa hướng về Mặt Trời là ban ngày, nửa quay đi là ban đêm!' },
        { cat: 'space', title: '🌙 Vì sao Mặt Trăng lúc tròn lúc khuyết?', prompt: 'Vì sao mặt trăng lúc tròn lúc lưỡi liềm?', summary: 'Khi Mặt Trăng quay quanh Trái Đất, góc nhận ánh sáng Mặt Trời thay đổi tạo nên các hình dạng trăng rằm hay lưỡi liềm!' },
        { cat: 'space', title: '🪐 Hệ Mặt Trời và 8 hành tinh diệu kỳ', prompt: 'Kể cho bé nghe về hệ mặt trời và các hành tinh', summary: 'Mặt Trời là ngôi sao khổng lồ ở trung tâm, bao quanh là Trái Đất, Sao Hỏa, Sao Mộc, Sao Thổ lung linh!' },
        { cat: 'space', title: '✨ Vì sao các ngôi sao lại lấp lánh ban đêm?', prompt: 'Tại sao ban đêm nhìn lên trời lại thấy các ngôi sao lấp lánh?', summary: 'Ánh sáng từ các ngôi sao xa xôi đi xuyên qua bầu khí quyển Trái Đất bị chao đảo tạo cảm giác lấp lánh!' },
        { cat: 'space', title: '🚀 Có người ngoài hành tinh thật không?', prompt: 'Có người ngoài hành tinh thật không Kuromi?', summary: 'Vũ trụ bao la rộng lớn vô tận, các nhà khoa học vẫn đang chế tạo tàu vũ trụ để tìm kiếm sự sống mới!' },

        // Animals & Plants
        { cat: 'nature', title: '🦖 Vì sao loài khủng long to lớn lại tuyệt chủng?', prompt: 'Vì sao loài khủng long lại tuyệt chủng từ thời tiền sử?', summary: 'Một khối thiên thạch khổng lồ từ vũ trụ va chạm Trái Đất làm thay đổi khí hậu, khiến khủng long không kịp thích nghi!' },
        { cat: 'nature', title: '🌿 Vì sao lá cây lại có màu xanh lục?', prompt: 'Tại sao lá cây lại có màu xanh vậy Kuromi?', summary: 'Lá cây chứa chất diệp lục màu xanh giúp cây hấp thu ánh nắng để tạo ra oxy trong lành cho chúng mình hít thở!' },
        { cat: 'nature', title: '🐬 Cá heo thông minh thế nào và ngủ ra sao?', prompt: 'Cá heo thông minh thế nào và có phải là cá không?', summary: 'Cá heo là động vật có vú thở bằng phổi rất thông minh. Khi ngủ, chúng chỉ nhắm 1 mắt và để nửa não nghỉ ngơi!' },
        { cat: 'nature', title: '🦇 Vì sao loài dơi lại thích ngủ treo ngược?', prompt: 'Vì sao loài dơi lại thích ngủ treo ngược người?', summary: 'Xương chân của dơi rất nhỏ, treo ngược trên trần hang giúp dơi dễ dàng thả mình bay vút vào không trung!' },
        { cat: 'nature', title: '🐓 Vì sao chú gà trống gáy ò ó o mỗi sáng?', prompt: 'Vì sao gà trống lại gáy vào buổi sáng sớm?', summary: 'Đồng hồ sinh học bên trong cơ thể mách bảo gà trống cất tiếng gáy chào đón bình minh và đánh thức mọi người!' },

        // Body & Habits
        { cat: 'body', title: '🦷 Vì sao bé phải đánh răng sáng và tối?', prompt: 'Tại sao bé phải đánh răng sáng và tối mỗi ngày?', summary: 'Đánh răng giúp xua đuổi vi khuẩn sâu răng, giữ cho nụ cười của bé luôn trắng sáng và hơi thở thơm tho!' },
        { cat: 'body', title: '🌙 Vì sao bé phải đi ngủ sớm trước 9 giờ tối?', prompt: 'Tại sao bé phải đi ngủ sớm vậy Kuromi?', summary: 'Khi ngủ say, cơ thể bé tiết ra hormone tăng trưởng giúp bé lớn bổng thông minh và khỏe mạnh!' },
        { cat: 'body', title: '👀 Vì sao mắt chúng mình phải chớp chớp liên tục?', prompt: 'Tại sao mắt chúng mình lại phải chớp chớp?', summary: 'Mỗi lần chớp mắt, nước mắt sẽ phủ một lớp màng mỏng giữ cho mắt luôn ẩm ướt và sạch bụi bẩn!' },
        { cat: 'body', title: '💓 Trái tim trong ngực đập thình thịch để làm gì?', prompt: 'Trái tim đập để làm gì vậy Kuromi?', summary: 'Trái tim như một chiếc máy bơm thần kỳ hoạt động suốt ngày đêm đưa máu và dưỡng chất nuôi toàn bộ cơ thể!' }
      ];

      let activeCat = 'all';

      function renderScience() {
        const filtered = activeCat === 'all' 
          ? allTopics 
          : allTopics.filter(t => t.cat === activeCat);

        container.innerHTML = `
          <!-- Category Tabs -->
          <div class="activity-category-nav">
            <button class="activity-cat-btn ${activeCat === 'all' ? 'active' : ''}" data-cat="all">🌟 Tất Cả (${allTopics.length})</button>
            <button class="activity-cat-btn ${activeCat === 'weather' ? 'active' : ''}" data-cat="weather">🌧️ Thời Tiết & Thiên Nhiên</button>
            <button class="activity-cat-btn ${activeCat === 'space' ? 'active' : ''}" data-cat="space">🪐 Vũ Trụ & Trái Đất</button>
            <button class="activity-cat-btn ${activeCat === 'nature' ? 'active' : ''}" data-cat="nature">🦖 Động Thực Vật</button>
            <button class="activity-cat-btn ${activeCat === 'body' ? 'active' : ''}" data-cat="body">🧠 Cơ Thể Của Bé</button>
          </div>

          <div style="text-align: center; margin-bottom: 12px;">
            <p style="font-size: 0.88rem; color: #fff;">
              Bé <strong>${childName}</strong> chọn đề tài muốn khám phá nhé (Kuromi sẽ giải thích ngay):
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;">
            ${filtered.map(t => `
              <div class="science-detail-card" style="padding: 12px; gap: 8px;">
                <h4 style="font-size: 0.95rem; color: #ffeb3b; line-height: 1.35; margin: 0;">${t.title}</h4>
                <p style="font-size: 0.82rem; color: var(--kuromi-lavender); line-height: 1.45; margin: 0;">${t.summary}</p>
                <div style="display: flex; gap: 8px; margin-top: 4px;">
                  <button class="station-launch-btn btn-science science-speak-btn" data-title="${t.title}" data-summary="${t.summary}" style="flex: 1; padding: 5px 8px; font-size: 0.78rem;">
                    🔊 Nghe giải thích
                  </button>
                  <button class="station-launch-btn btn-math science-chat-btn" data-prompt="${t.prompt}" style="flex: 1; padding: 5px 8px; font-size: 0.78rem;">
                    💬 Trò chuyện & Xem ảnh
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        `;

        // Category filter click
        container.querySelectorAll('.activity-cat-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            playSfx('pop');
            activeCat = btn.getAttribute('data-cat');
            renderScience();
          });
        });

        // Speak summary click
        container.querySelectorAll('.science-speak-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            playSfx('chime');
            const summary = btn.getAttribute('data-summary');
            const title = btn.getAttribute('data-title');
            if (APP_STATE.ttsEnabled) {
              speakText(`${title}: ${summary}`);
            }
          });
        });

        // Chat & HD picture click
        container.querySelectorAll('.science-chat-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const prompt = btn.getAttribute('data-prompt');
            closeLearningModal();
            switchAppMode('chat');
            handleChildSubmit(prompt);
          });
        });
      }

      renderScience();
    }
  },

  homework: {
    title: 'Gia Sư Kuromi - Trợ Lý Bài Tập Lớp 1 & Lớp 2',
    subtitle: 'Đồng hành cùng bé giải toán, tiếng Việt & câu hỏi tư duy từng bước',
    icon: '🎒✏️',
    render: (container) => {
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      const sampleExercises = [
        { cat: 'math', title: 'Toán có lời văn', content: 'Mai có 7 bông hoa, Mai tặng bạn Lan 3 bông hoa. Hỏi bạn Mai còn lại bao nhiêu bông hoa?' },
        { cat: 'math', title: 'Điền dấu so sánh', content: 'Bé hãy điền dấu >, < hoặc = vào phép tính: 8 + 1 ... 10 - 2' },
        { cat: 'math', title: 'Số liền trước - Số liền sau', content: 'Số liền trước của số 9 là số mấy? Và số liền sau của số 9 là số mấy?' },
        { cat: 'vietnamese', title: 'Tìm từ ghép vần', content: 'Bé hãy tìm 3 từ có chứa vần "anh" và 3 từ có chứa vần "ach" nhé!' },
        { cat: 'vietnamese', title: 'Đặt câu với từ cho sẵn', content: 'Bé hãy đặt một câu thật hay có chứa từ "chăm chỉ" để cô giáo khen!' },
        { cat: 'iq', title: 'Đố tư duy hình học', content: 'Hình vuông có mấy cạnh bằng nhau? Và hình tam giác có mấy góc nhọn?' }
      ];

      container.innerHTML = `
        <div class="homework-box">
          <!-- Direct Homework Input Box -->
          <div class="homework-input-wrapper">
            <label style="font-size: 0.9rem; font-weight: 700; color: #ffeb3b; display: flex; align-items: center; gap: 6px;">
              <span>✍️</span> Nhập hoặc đọc đề bài cô giáo giao cho bé ${childName}:
            </label>
            <textarea id="homeworkDirectInput" class="homework-textarea" placeholder="Ví dụ: Cô giáo giao bài toán: Có 5 quả táo, mẹ mua thêm 4 quả táo nữa, hỏi có tất cả bao nhiêu quả?..."></textarea>
            <div class="homework-actions-row">
              <span style="font-size: 0.78rem; color: var(--kuromi-lavender);">Kuromi sẽ giải thích cặn kẽ từng bước, không giải hộ!</span>
              <button id="solveHomeworkBtn" class="station-launch-btn btn-homework" style="padding: 8px 18px; font-size: 0.88rem; width: auto;">
                <span>🚀 Nhờ Kuromi Chỉ Dẫn</span>
              </button>
            </div>
          </div>

          <!-- Sample Exercise Presets -->
          <div>
            <h4 style="font-size: 0.95rem; color: #fff; margin-bottom: 8px;">
              📚 Hoặc bé bấm chọn bài tập mẫu chuẩn sách giáo khoa dưới đây:
            </h4>
            <div class="homework-samples-grid">
              ${sampleExercises.map(ex => `
                <button class="homework-sample-btn" data-content="${ex.content}">
                  <span style="font-weight: 800; color: #ff9800; display: block; margin-bottom: 2px;">📌 ${ex.title}</span>
                  <span style="font-size: 0.8rem; color: #e1bee7; line-height: 1.35;">"${ex.content}"</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      // Solve homework button
      container.querySelector('#solveHomeworkBtn').addEventListener('click', () => {
        const input = container.querySelector('#homeworkDirectInput');
        const question = input.value.trim();
        if (!question) {
          alert('Bé hoặc ba mẹ hãy nhập đề bài tập vào ô trước nhé!');
          input.focus();
          return;
        }

        closeLearningModal();
        switchAppMode('chat');
        handleChildSubmit(`Kuromi ơi, hãy làm gia sư hướng dẫn bé ${childName} tư duy từng bước để giải bài tập này nhé: ${question}`);
      });

      // Sample click
      container.querySelectorAll('.homework-sample-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const content = btn.getAttribute('data-content');
          closeLearningModal();
          switchAppMode('chat');
          handleChildSubmit(`Kuromi ơi, giảng bài tập này cho bé ${childName} với: ${content}`);
        });
      });
    }
  },

  quiz: {
    title: 'Thử Thách Đố Vui 5 Phút Săn Sao (20+ Câu Đố IQ)',
    subtitle: 'Trả lời đúng nhận ngay 2 sao thưởng rực rỡ!',
    icon: '👑🎁',
    render: (container) => {
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      const riddles = [
        {
          question: "Con gì đuôi ngắn tai dài, mắt hồng lông mượt, có tài chạy nhanh?",
          options: ["Con Thỏ 🐰", "Con Rùa 🐢", "Con Mèo 🐱"],
          correct: 0,
          explanation: "Hoan hô! Đúng là chú Thỏ trắng đuôi ngắn tai dài rồi nè!"
        },
        {
          question: "Cái gì bảy sắc hình vòng, bắc ngang qua núi ngỡ lòng cầu mây?",
          options: ["Cầu Tre 🌾", "Cầu Vồng 🌈", "Cột Cờ 🚩"],
          correct: 1,
          explanation: "Chính xác! Đó chính là chiếc Cầu Vồng 7 sắc màu rực rỡ sau mưa!"
        },
        {
          question: "Chân mang hài lụa, mắt như than hồng, đêm ngày rình chuột, ai ai cũng khen?",
          options: ["Con Chó 🐶", "Con Mèo 🐱", "Con Gà 🐔"],
          correct: 1,
          explanation: "Đúng rồi! Chú Mèo ngoan ngoãn bắt chuột giúp cả nhà!"
        },
        {
          question: "Bốn chân như bốn cột nhà, hai tai ve vẩy, mũi dài thượt ra?",
          options: ["Con Voi 🐘", "Con Ngựa 🐴", "Con Hươu 🦒"],
          correct: 0,
          explanation: "Chính xác! Đó chính là chú Voi khổng lồ hiền lành!"
        },
        {
          question: "Đầu đội mũ đỏ, áo khoác nhiều màu, sớm mai thức dậy gáy vang khắp làng?",
          options: ["Con Vịt 🦆", "Gà Trống 🐓", "Chim Sâu 🐦"],
          correct: 1,
          explanation: "Hoan hô! Chú Gà Trống gáy ò ó o đánh thức bé dậy đi học!"
        },
        {
          question: "Áo ngoài xanh biếc, ruột đỏ ngọt ngào, hạt đen lấm tấm, mùa hè thích ăn?",
          options: ["Quả Dưa Hấu 🍉", "Quả Cam 🍊", "Quả Táo 🍎"],
          correct: 0,
          explanation: "Chính xác! Đó là quả dưa hấu đỏ ngọt mát lạnh!"
        },
        {
          question: "Trái cong cong như vầng trăng khuyết, vỏ màu vàng tươi, khỉ thích mê say?",
          options: ["Quả Chuối 🍌", "Quả Xoài 🥭", "Quả Dâu 🍓"],
          correct: 0,
          explanation: "Đúng rồi! Trái chuối chín vàng thơm ngon giàu vitamin!"
        },
        {
          question: "Có ba kim chạy suốt ngày đêm, tích tắc tích tắc nhắc bé dậy sớm đi học?",
          options: ["Cái Đồng Hồ ⏰", "Cái Quạt 🪭", "Cái Gương 🪞"],
          correct: 0,
          explanation: "Tuyệt vời! Chiếc đồng hồ báo thức chăm chỉ của bé!"
        },
        {
          question: "Mùa hè phe phẩy gió mát rượi, xua tan oi bức cho bé ngủ say?",
          options: ["Chiếc Quạt 🪭", "Chiếc Gối 🛏️", "Cây Chổi 🧹"],
          correct: 0,
          explanation: "Đúng rồi nè! Chiếc quạt mát lành của bé!"
        },
        {
          question: "Lúc đi mưa thì xòe rộng, lúc tạnh mưa thì cụp lại mang về nhà?",
          options: ["Chiếc Ô (Dù) ☂️", "Chiếc Áo 🧥", "Chiếc Nón 👒"],
          correct: 0,
          explanation: "Chính xác! Chiếc ô che mưa che nắng bảo vệ bé!"
        },
        {
          question: "Thân mình bằng sáp, thắp lửa lung linh trên bánh sinh nhật?",
          options: ["Ngọn Nến 🕯️", "Bóng Đèn 💡", "Cây Bút ✏️"],
          correct: 0,
          explanation: "Đúng rồi! Cây nến sinh nhật lung linh cho bé thổi ước mơ!"
        },
        {
          question: "Con gì ngồi đáy giếng kêu ộp ộp, bắt sâu bọ trên cánh đồng?",
          options: ["Con Ếch 🐸", "Con Cá 🐟", "Con Cua 🦀"],
          correct: 0,
          explanation: "Hoan hô! Chú ếch xanh nhảy xa bắt sâu bọ bảo vệ mùa màng!"
        },
        {
          question: "Con gì chăm chỉ bay khắp vườn hoa, làm ra mật ngọt thơm lừng?",
          options: ["Con Ong 🐝", "Con Ruồi 🪰", "Con Muỗi 🦟"],
          correct: 0,
          explanation: "Chính xác! Chú ong chăm chỉ làm mật ngon cho đời!"
        },
        {
          question: "Chở cả ngôi nhà trên lưng, đi đứng chậm chạp nhưng luôn kiên trì?",
          options: ["Con Rùa 🐢", "Con Ốc 🐌", "Con Nhím 🦔"],
          correct: 0,
          explanation: "Đúng rồi! Bạn Rùa kiên trì trong câu chuyện Rùa và Thỏ!"
        },
        {
          question: "Ban ngày chiếu sáng ấm áp cho muôn loài hoa khoe sắc?",
          options: ["Mặt Trời ☀️", "Mặt Trăng 🌙", "Đèn Pin 🔦"],
          correct: 0,
          explanation: "Tuyệt vời! Ông Mặt Trời ấm áp rạng ngời mỗi sớm mai!"
        }
      ];

      let currentIndex = 0;
      let scoreCorrect = 0;
      const solvedSet = new Set();

      function renderRiddle() {
        const q = riddles[currentIndex];
        container.innerHTML = `
          <div class="quiz-game-box">
            <!-- Toolbar -->
            <div class="math-top-toolbar">
              <div class="math-progress-badge">
                <span class="math-q-counter">🎯 Câu: ${currentIndex + 1}/${riddles.length}</span>
                <span class="math-score-pill">⭐ Đúng: ${scoreCorrect} câu</span>
              </div>
              <div class="math-toolbar-actions">
                <button type="button" class="math-tool-btn" id="quizResetBtn" title="Đố lại từ đầu">
                  <span>🔄</span> Đố lại
                </button>
                <button type="button" class="math-tool-btn" id="quizNextBtn" title="Chuyển câu đố khác">
                  <span>🎲</span> Đổi câu
                </button>
              </div>
            </div>

            <div class="quiz-question-banner">
              <span class="quiz-question-icon">👑💡</span>
              <h4 class="quiz-question-text">
                "${q.question}"
              </h4>
              <p class="quiz-question-prompt">Bé ${childName} chọn câu trả lời đúng nhất nhé:</p>
            </div>

            <div class="quiz-choices-container">
              ${q.options.map((opt, idx) => `
                <button type="button" class="quiz-choice-btn" data-idx="${idx}">
                  <span class="quiz-choice-letter">${['A', 'B', 'C', 'D'][idx] || (idx + 1)}</span>
                  <span class="quiz-choice-text">${opt}</span>
                </button>
              `).join('')}
            </div>

            <div id="quizFeedback" class="quiz-feedback-box"></div>
          </div>
        `;

        if (APP_STATE.ttsEnabled) {
          speakText(`Kuromi đố bé ${childName} nhé: ${q.question}`);
        }

        // Reset button
        const resetBtn = container.querySelector('#quizResetBtn');
        if (resetBtn) {
          resetBtn.addEventListener('click', () => {
            playSfx('chime');
            currentIndex = 0;
            scoreCorrect = 0;
            solvedSet.clear();
            if (APP_STATE.ttsEnabled) {
              speakText(`Kuromi đã làm mới bộ câu đố rồi, bé ${childName} cùng giải lại nhé!`);
            }
            renderRiddle();
          });
        }

        // Next button
        const nextBtn = container.querySelector('#quizNextBtn');
        if (nextBtn) {
          nextBtn.addEventListener('click', () => {
            playSfx('pop');
            currentIndex = (currentIndex + 1) % riddles.length;
            renderRiddle();
          });
        }

        // Options click
        let isAnswering = false;
        container.querySelectorAll('.quiz-choice-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (isAnswering) return;
            const idx = parseInt(btn.getAttribute('data-idx'));
            const feedback = container.querySelector('#quizFeedback');

            if (idx === q.correct) {
              isAnswering = true;
              btn.classList.add('is-correct');
              if (!solvedSet.has(currentIndex)) {
                solvedSet.add(currentIndex);
                scoreCorrect++;
                const scorePill = container.querySelector('.math-score-pill');
                if (scorePill) scorePill.textContent = `⭐ Đúng: ${scoreCorrect} câu`;
              }

              feedback.innerHTML = `🎉 ${q.explanation} Thưởng bé ${childName} 2 sao! ⭐⭐`;
              feedback.className = 'quiz-feedback-box is-correct-feedback';
              playSfx('fanfare');
              awardLearningStar(2, `${q.explanation} Kuromi thưởng bé ${childName} hai ngôi sao sáng!`);

              setTimeout(() => {
                isAnswering = false;
                currentIndex = (currentIndex + 1) % riddles.length;
                renderRiddle();
              }, 2200);
            } else {
              btn.classList.add('is-wrong');
              feedback.innerHTML = `😅 Chưa chính xác rồi, bé ${childName} chọn lại thử nhé!`;
              feedback.className = 'quiz-feedback-box is-wrong-feedback';
              playSfx('pop');
              if (APP_STATE.ttsEnabled) {
                speakText(`Chưa đúng rồi bé ơi, bé suy nghĩ chọn lại thử nhé!`);
              }
              setTimeout(() => {
                btn.classList.remove('is-wrong');
              }, 700);
            }
          });
        });
      }

      renderRiddle();
    }
  }
};

function openLearningModal(stationType) {
  playSfx('chime');
  const modal = document.getElementById('learningActivityModal');
  const titleEl = document.getElementById('activityModalTitle');
  const subtitleEl = document.getElementById('activityModalSubtitle');
  const iconEl = document.getElementById('activityModalIcon');
  const bodyEl = document.getElementById('activityModalBody');
  const starCounter = document.getElementById('modalStarCounter');
  const currentStars = typeof LEARNING_STATE.stars === 'number' ? LEARNING_STATE.stars : 12;
  if (starCounter) starCounter.textContent = currentStars;

  const activity = LEARNING_ACTIVITIES[stationType] || LEARNING_ACTIVITIES.math;
  if (titleEl) titleEl.textContent = activity.title;
  if (subtitleEl) subtitleEl.textContent = activity.subtitle;
  if (iconEl) iconEl.textContent = activity.icon;

  if (bodyEl) {
    bodyEl.scrollTop = 0;
    if (activity.render) {
      activity.render(bodyEl);
    }
  }

  if (modal) modal.classList.remove('hidden');
}

function closeLearningModal() {
  playSfx('pop');
  stopAllSpeech();
  const modal = document.getElementById('learningActivityModal');
  if (modal) modal.classList.add('hidden');
}

// =============================================================================
// 2. VIETNAMESE NLP NORMALIZER & SEMANTIC UTILITIES
// =============================================================================
function removeVietnameseTones(str) {
  if (!str) return '';
  str = str.toLowerCase();
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
  str = str.replace(/đ/g, "d");
  str = str.replace(/\u0300|\u0301|\u0303|\u0309|\u0323/g, "");
  str = str.replace(/\u02C6|\u0306|\u031B/g, "");
  return str.trim();
}

function cleanQueryTokens(str) {
  const norm = removeVietnameseTones(str);
  // remove punctuation
  const clean = norm.replace(/[.,?!;:(){}\[\]"']/g, ' ');
  const stopWords = new Set(['kuromi', 'oi', 'cho', 'be', 'hoi', 'voi', 'ne', 'nao', 'a', 'nhe', 'la', 'gi', 'the', 'di', 'cung', 'chut', 'nhi', 'vai', 'co', 'duoc', 'khong']);
  return clean.split(/\s+/).filter(w => w.length > 0 && !stopWords.has(w));
}

// =============================================================================
// 3. WEB AUDIO SYNTHESIZER (SONGS, REALISTIC SOUNDS & SFX)
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

const NOTE_FREQS = {
  'G2': 98.00, 'A2': 110.00, 'B2': 123.47,
  'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
  'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
  'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
  'C6': 1046.50
};

// Polyphonic 8 Songs Library with Real Singer Audio/Video & Vocals
const SONGS_LIBRARY = {
  'butterfly': {
    id: 'butterfly',
    title: 'Kìa Con Bướm Vàng',
    category: 'Bài hát thiếu nhi',
    singer: 'Bé Xuân Mai',
    youtubeId: 'F5Kx9x0y07o',
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
    singer: 'Bé Xuân Mai',
    youtubeId: 'g6f3d-G9jM4',
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
    singer: 'Super Simple Songs',
    youtubeId: 'yCjJyiqpAuU',
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
    singer: 'Ca sĩ thiếu nhi Kids TV',
    youtubeId: '_z-1fTlSDF0',
    icon: '🎂',
    bpm: 125,
    lyrics: [
      { text: "Happy Birthday to you! 🎂", duration: 3 },
      { text: "Happy Birthday to you! 🎈", duration: 3 },
      { text: "Happy Birthday bé yêu của Kuromi! 💖", duration: 4 },
      { text: "Happy Birthday to you! 🎉", duration: 3 }
    ],
    notes: [
      { note: 'C4', dur: 0.35 }, { note: 'C4', dur: 0.15 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'C4', dur: 0.35 }, { note: 'C4', dur: 0.15 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'F4', dur: 1.0 },
      { note: 'C4', dur: 0.35 }, { note: 'C4', dur: 0.15 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 1.0 },
      { note: 'B4', dur: 0.35 }, { note: 'B4', dur: 0.15 }, { note: 'A4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'F4', dur: 1.2 }
    ]
  },
  'family': {
    id: 'family',
    title: 'Cả Nhà Thương Nhau',
    category: 'Tình cảm gia đình',
    singer: 'Bé Xuân Mai',
    youtubeId: 'kYv9G4fD1sI',
    icon: '👨‍👩‍👧',
    bpm: 115,
    lyrics: [
      { text: "Ba thương con vì con giống mẹ 💖", duration: 3.5 },
      { text: "Mẹ thương con vì con giống ba 👨‍👩‍👧", duration: 3.5 },
      { text: "Cả nhà ta cùng thương yêu nhau ✨", duration: 3.5 },
      { text: "Xa là nhớ, gần nhau là cười! 😊", duration: 3.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 1.0 },
      { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 1.0 },
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 1.2 }
    ]
  },
  'locust': {
    id: 'locust',
    title: 'Con Cào Cào',
    category: 'Vui khỏe mỗi ngày',
    singer: 'Mầm Chồi Lá',
    youtubeId: 'k_9YwP-9cR0',
    icon: '🦗',
    bpm: 135,
    lyrics: [
      { text: "Con cào cào có cái cánh xanh xanh 🦗", duration: 3.5 },
      { text: "Nó bay rất nhanh từ bụi tre qua lùm bèo ✨", duration: 3.5 },
      { text: "Bé muốn khỏe đẹp thì hãy tập thể thao! 💪", duration: 3.5 },
      { text: "Ai muốn khỏe đẹp thì hãy tập thể thao! 🌟", duration: 3.5 }
    ],
    notes: [
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 1.0 },
      { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 1.2 }
    ]
  },
  'preschool': {
    id: 'preschool',
    title: 'Cháu Lên Ba',
    category: 'Tuổi thơ ngọt ngào',
    singer: 'Bé Xuân Mai',
    youtubeId: 'kY0R8V1H-Jc',
    icon: '🎒',
    bpm: 128,
    lyrics: [
      { text: "Cháu lên ba cháu đi mẫu giáo 🎒", duration: 3.5 },
      { text: "Cô thương cháu vì cháu không khóc nhè! 💖", duration: 3.5 },
      { text: "Không khóc nhè để mẹ trồng cây trái 🌳", duration: 3.5 },
      { text: "Ba vào nhà máy ông bà vui cấy cày! 🌾", duration: 3.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 1.0 },
      { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'G3', dur: 0.5 }, { note: 'C4', dur: 1.2 }
    ]
  },
  'teeth': {
    id: 'teeth',
    title: 'Bé Tập Đánh Răng',
    category: 'Thói quen bé ngoan',
    singer: 'Bé Mai Vy',
    youtubeId: 'GMWt2chz4OB',
    icon: '🪥',
    bpm: 130,
    lyrics: [
      { text: "Bé cầm chiếc bàn chải xinh xắn 🪥", duration: 3.5 },
      { text: "Kem thơm thơm cùng bọt trắng tinh ✨", duration: 3.5 },
      { text: "Đánh hàm trên rồi lại hàm dưới 🦷", duration: 3.5 },
      { text: "Răng trắng tinh nụ cười xinh tươi! 💖", duration: 3.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 1.0 },
      { note: 'B4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'F4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'G3', dur: 0.5 }, { note: 'C4', dur: 1.2 }
    ]
  },
  'backimthang': {
    id: 'backimthang',
    title: 'Bắc Kim Thang',
    category: 'Đồng dao thiếu nhi',
    singer: 'Bé Xuân Mai',
    youtubeId: 'rD9jZq9Y3Ew',
    icon: '🌾',
    bpm: 125,
    lyrics: [
      { text: "Bắc kim thang cà lang bí rợ 🌾", duration: 3.5 },
      { text: "Cột qua kèo, là kèo qua cột 🪵", duration: 3.5 },
      { text: "Chú bán dầu qua cầu mà té 🛢️", duration: 3.5 },
      { text: "Chú bán ếch ở lại làm chi! Con le le đánh trống thổi kèn! 🦆🥁", duration: 4.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 },
      { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  },
  'chuvoicon': {
    id: 'chuvoicon',
    title: 'Chú Voi Con Ở Bản Đôn',
    category: 'Bài hát thiếu nhi',
    singer: 'Bé Xuân Mai',
    youtubeId: 'uO7n3VzR6jA',
    icon: '🐘',
    bpm: 128,
    lyrics: [
      { text: "Chú voi con ở Bản Đôn, chưa có ngà nên còn trẻ con 🐘", duration: 3.8 },
      { text: "Từ rừng già chú đến với người, rất ham ăn với lại ham chơi! 🌿", duration: 3.8 },
      { text: "Voi con ơi, voi con ơi, mau lớn nhanh có đôi ngà to ✨", duration: 3.8 },
      { text: "Có sức đi khắp miền rừng xa, kéo gỗ cho buôn làng của ta! 🪵💖", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 1.0 },
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  },
  'dihocve': {
    id: 'dihocve',
    title: 'Đi Học Về',
    category: 'Bài hát lễ phép',
    singer: 'Bé Xuân Mai',
    youtubeId: 'mB_pZk5_4h4',
    icon: '🎒',
    bpm: 120,
    lyrics: [
      { text: "Đi học về là đi học về, em vào nhà em chào cha mẹ 🎒", duration: 3.8 },
      { text: "Cha em khen rằng em rất ngoan, mẹ âu yếm hôn đôi má em! 💖", duration: 4.0 }
    ],
    notes: [
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'E4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  },
  'conheodat': {
    id: 'conheodat',
    title: 'Con Heo Đất',
    category: 'Vui tươi rộn ràng',
    singer: 'Bé Xuân Mai',
    youtubeId: 'dD97x50dKms',
    icon: '🐷',
    bpm: 130,
    lyrics: [
      { text: "Mẹ mua cho con heo đất, í o i ò 🐷", duration: 3.5 },
      { text: "Ngày hôm nay em vui lắm, cầm tiền xu em thả vào lưng heo! 🪙", duration: 4.0 },
      { text: "Heo không đòi ăn cơm, heo chỉ đòi ăn tiền xu thôi nè! ✨", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 }
    ]
  },
  'chauyeuba': {
    id: 'chauyeuba',
    title: 'Cháu Yêu Bà',
    category: 'Tình cảm gia đình',
    singer: 'Bé Xuân Mai',
    youtubeId: 'o1L5v0i6-uI',
    icon: '👵',
    bpm: 110,
    lyrics: [
      { text: "Bà ơi bà, cháu yêu bà lắm 👵💖", duration: 3.5 },
      { text: "Tóc bà trắng màu trắng như mây ☁️", duration: 3.5 },
      { text: "Cháu yêu bà cháu nắm bàn tay, khi cháu vâng lời cháu biết bà vui! ✨", duration: 4.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 1.0 }
    ]
  },
  'babyshark': {
    id: 'babyshark',
    title: 'Baby Shark Dance',
    category: 'Quốc tế vui nhộn',
    singer: 'Pinkfong Kids',
    youtubeId: 'XqZsoesa55w',
    icon: '🦈',
    bpm: 135,
    lyrics: [
      { text: "Baby shark, doo-doo doo-doo doo-doo 🦈", duration: 3.5 },
      { text: "Baby shark, doo-doo doo-doo doo-doo! 🌊", duration: 3.5 },
      { text: "Mommy shark, doo-doo doo-doo doo-doo 💖", duration: 3.5 },
      { text: "Daddy shark, doo-doo doo-doo doo-doo! 💪", duration: 3.5 }
    ],
    notes: [
      { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.3 }, { note: 'G4', dur: 0.3 }, { note: 'G4', dur: 0.3 }, { note: 'G4', dur: 0.3 }, { note: 'G4', dur: 0.3 }
    ]
  },
  'motconvit': {
    id: 'motconvit',
    title: 'Một Con Vịt',
    category: 'Bài hát thiếu nhi',
    singer: 'Bé Xuân Mai',
    youtubeId: 'bN6b4pU6Wl8',
    icon: '🦆',
    bpm: 130,
    lyrics: [
      { text: "Một con vịt xòe ra hai cái cánh 🦆", duration: 3.5 },
      { text: "Nó kêu rằng: Cáp cáp cáp, cạp cạp cạp! 💦", duration: 3.5 },
      { text: "Gặp hồ nước nó bì bà bì bõm 🌊", duration: 3.5 },
      { text: "Lúc lên bờ vẫy cái cánh cho khô! ✨", duration: 3.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 }
    ]
  },
  'bongbongbangbang': {
    id: 'bongbongbangbang',
    title: 'Bống Bống Bang Bang',
    category: 'Vũ điệu thiếu nhi',
    singer: 'Bé Bào Ngư',
    youtubeId: 'k5z8qV69j6k',
    icon: '🐟',
    bpm: 135,
    lyrics: [
      { text: "Bống bống bang bang lên ăn cơm vàng cơm bạc nhà ta 🐟✨", duration: 4.0 },
      { text: "Chớ ăn cơm hẩm cháo hoa nhà người! 💖", duration: 3.5 },
      { text: "Bống bống bang bang, bé cùng nhún nhảy theo điệu nhảy siêu vui nhé! 💃", duration: 4.0 }
    ],
    notes: [
      { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }, { note: 'C5', dur: 1.0 },
      { note: 'D5', dur: 0.5 }, { note: 'C5', dur: 0.5 }, { note: 'A4', dur: 1.0 }
    ]
  },
  'bangocnen': {
    id: 'bangocnen',
    title: 'Ba Ngọn Nến Lung Linh',
    category: 'Tình cảm gia đình',
    singer: 'Gia Đình Cam Cam',
    youtubeId: 'w7w1p9l5hL0',
    icon: '🕯️',
    bpm: 115,
    lyrics: [
      { text: "Ba là cây nến vàng, mẹ là cây nến xanh 🕯️", duration: 3.5 },
      { text: "Con là cây nến hồng, ba ngọn nến lung linh ✨", duration: 3.5 },
      { text: "Thắp sáng một gia đình, đầm ấm và yêu thương! 💖", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 },
      { note: 'A4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 1.0 }
    ]
  }
};

// =============================================================================
// DYNAMIC UNLIMITED SONGS ENGINE (MATCH & GENERATE ANY SONG IN THE WORLD)
// =============================================================================
function matchSongKey(songName) {
  if (!songName) return null;
  const norm = removeVietnameseTones(songName).replace(/[.,?!;]/g, '').trim().toLowerCase();
  const normWords = norm.split(/\s+/).filter(w => !['bai', 'hat', 'cho', 'be', 'nghe', 'o', 'nhac', 'ca', 'khuc'].includes(w));
  let bestKey = null;
  let maxMatchedWords = 0;

  for (const key in SONGS_LIBRARY) {
    const s = SONGS_LIBRARY[key];
    const normTitle = removeVietnameseTones(s.title).replace(/[.,?!;]/g, '').trim().toLowerCase();
    if (norm === normTitle || norm.includes(normTitle) || normTitle.includes(norm)) {
      return key;
    }
    const titleWords = normTitle.split(/\s+/).filter(w => !['bai', 'hat', 'cho', 'be', 'nghe', 'o', 'nhac', 'ca', 'khuc'].includes(w));
    const matchedCount = normWords.filter(w => titleWords.includes(w)).length;
    if (matchedCount >= 2 && matchedCount > maxMatchedWords) {
      maxMatchedWords = matchedCount;
      bestKey = key;
    }
  }
  return bestKey;
}

function getOrCreateSong(songName) {
  const matchedKey = matchSongKey(songName);
  if (matchedKey) return matchedKey;

  // Clean title for dynamic song
  const rawTitle = songName.trim();
  const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const dynKey = 'dyn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  SONGS_LIBRARY[dynKey] = {
    id: dynKey,
    title: cleanTitle,
    category: 'Ca khúc thiếu nhi yêu thích',
    singer: 'Ca sĩ thiếu nhi',
    youtubeId: null, // Dynamic YouTube Search Playlist
    youtubeQuery: `${cleanTitle} thiếu nhi`,
    icon: '🎵',
    bpm: 125,
    lyrics: [
      { text: `Đang mở ca khúc "${cleanTitle}" cho bé nghe nè! 🎶`, duration: 4 },
      { text: `Bé cùng vỗ tay nhún nhảy thật vui theo điệu nhạc nhé! 💖✨`, duration: 4 },
      { text: `Kuromi chúc bé nghe nhạc vui vẻ và tràn ngập tiếng cười! 🌸🎀`, duration: 4 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  };

  return dynKey;
}

function extractSongIntent(prompt) {
  if (!prompt) return null;
  const p = prompt.trim();
  
  // 1. Direct song title in library
  const directKey = matchSongKey(p);
  if (directKey) {
    return SONGS_LIBRARY[directKey].title;
  }

  // 2. Intent patterns: "Hát cho bé nghe bài [X]", "Hát bài [X]", "Bật bài [X]", "Mở bài [X]", "Nghe bài [X]"
  const patterns = [
    /(?:hát|nghe|bật|mở|phát)(?:\s+cho\s+bé)?(?:\s+nghe)?\s+bài(?:\s+hát)?\s+([^\.,?!;]+)/i,
    /(?:hát|nghe|bật|mở|phát)\s+bài\s+([^\.,?!;]+)/i,
    /bài\s+hát\s+([^\.,?!;]+)/i,
    /hát\s+([^\.,?!;]+)/i
  ];

  for (const regex of patterns) {
    const m = p.match(regex);
    if (m && m[1]) {
      let songName = m[1].trim();
      songName = songName.replace(/\s+(đi|nào|với|nhé|nha|ạ|cho\s+bé|vui\s+nhộn|được\s+không).*$/i, '').trim();
      if (songName.length > 1) {
        return songName;
      }
    }
  }

  return null;
}

// UI Sound Effects
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
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.25);
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
  } else if (type === 'star') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1046.50, now);
    osc.frequency.exponentialRampToValueAtTime(1567.98, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(2093.00, now + 0.35);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc.start(now);
    osc.stop(now + 0.45);
  } else if (type === 'fanfare') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    osc.frequency.setValueAtTime(1046.50, now + 0.3);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.start(now);
    osc.stop(now + 0.6);
  }
}

// Realistic Audio Synthesizer (Animals, Vehicles, Nature)
function playRealisticSound(soundType, statusCallback) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const titles = {
    cat: 'Tiếng mèo con kêu meo meo 🐱',
    dog: 'Tiếng chú cún sủa gâu gâu 🐶',
    duck: 'Tiếng chú vịt kêu cạp cạp 🦆',
    lion: 'Tiếng sư tử gầm vang dội 🦁',
    bird: 'Tiếng chim hót líu lo 🐦',
    train: 'Tiếng còi tàu hỏa tu tu 🚂',
    siren: 'Tiếng còi xe cứu hỏa u o 🚒',
    rain: 'Tiếng mưa rơi tí tách 🌧️'
  };

  if (statusCallback) statusCallback(`Kuromi đang phát: ${titles[soundType] || soundType}`);

  const now = ctx.currentTime;

  if (soundType === 'cat') {
    // Kitten Meow
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.3);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.7);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.start(now);
    osc.stop(now + 0.85);

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
    }, 950);

  } else if (soundType === 'dog') {
    // Dog Bark: "Gâu... Gâu!"
    const playBark = (timeOffset, pitch) => {
      const t = now + timeOffset;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(pitch, t);
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.6, t + 0.2);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.start(t);
      osc.stop(t + 0.25);
    };
    playBark(0, 320);
    playBark(0.32, 290);

  } else if (soundType === 'duck') {
    // Duck Quack: "Cạp... cạp!"
    const playQuack = (timeOffset) => {
      const t = now + timeOffset;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(750, t);
      osc.frequency.setValueAtTime(320, t);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.25);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.32);
    };
    playQuack(0);
    playQuack(0.4);

  } else if (soundType === 'bird') {
    // Bird Chirping: High melodic whistling
    const chirps = [
      { t: 0, f1: 1800, f2: 2400, dur: 0.12 },
      { t: 0.16, f1: 2200, f2: 3000, dur: 0.14 },
      { t: 0.35, f1: 2600, f2: 1900, dur: 0.18 },
      { t: 0.7, f1: 2100, f2: 2900, dur: 0.15 },
      { t: 0.9, f1: 2800, f2: 2200, dur: 0.2 }
    ];
    chirps.forEach(c => {
      const t = now + c.t;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(c.f1, t);
      osc.frequency.exponentialRampToValueAtTime(c.f2, t + c.dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + c.dur);
      osc.start(t);
      osc.stop(t + c.dur + 0.02);
    });

  } else if (soundType === 'lion') {
    // Lion roar
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
    // Train whistle (two harmonious tones)
    const playWhistle = (offset, dur) => {
      const t = now + offset;
      const o1 = ctx.createOscillator();
      const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.type = 'sine';
      o2.type = 'sine';
      o1.frequency.setValueAtTime(587.33, t); // D5
      o2.frequency.setValueAtTime(739.99, t); // F#5
      o1.connect(g);
      o2.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.01, t);
      g.gain.linearRampToValueAtTime(0.35, t + 0.1);
      g.gain.setValueAtTime(0.35, t + dur - 0.2);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o1.start(t);
      o2.start(t);
      o1.stop(t + dur + 0.05);
      o2.stop(t + dur + 0.05);
    };
    playWhistle(0, 0.7);
    playWhistle(0.9, 1.2);

  } else if (soundType === 'siren') {
    // Emergency Siren: "U... o... u... o..."
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.connect(gain);
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4);
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(950, now + 0.5);
    osc.frequency.linearRampToValueAtTime(600, now + 1.1);
    osc.frequency.linearRampToValueAtTime(950, now + 1.7);
    osc.frequency.linearRampToValueAtTime(600, now + 2.3);
    osc.start(now);
    osc.stop(now + 2.4);

  } else if (soundType === 'rain') {
    // Raindrops + Gentle Thunder
    for (let i = 0; i < 15; i++) {
      const delay = Math.random() * 1.8;
      const t = now + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 600, t);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.09);
    }
  }
}

// Melody Player Manager
let currentPlaybackTimeouts = [];
let currentSongVocalAudio = null;

function stopCurrentSong() {
  currentPlaybackTimeouts.forEach(t => clearTimeout(t));
  currentPlaybackTimeouts = [];
  APP_STATE.currentPlayingSong = null;

  if (currentSongVocalAudio) {
    try {
      currentSongVocalAudio.pause();
      currentSongVocalAudio.src = '';
    } catch(e) {}
    currentSongVocalAudio = null;
  }

  document.querySelectorAll('.jukebox-vocal-btn').forEach(btn => {
    btn.classList.remove('active', 'playing');
  });
  document.querySelectorAll('.jukebox-wave-bars').forEach(bar => bar.classList.remove('active'));
  const stage = document.getElementById('musicVisualizerStage');
  if (stage) stage.classList.remove('active');
  const mascot = document.getElementById('mascotWrapper');
  if (mascot) mascot.classList.remove('dancing');
  const dock = document.getElementById('nowPlayingDock');
  if (dock) dock.classList.add('hidden');
  setKuromiState('normal');
}

function singVocalLine(cleanVerse) {
  if (currentSongVocalAudio) {
    try {
      currentSongVocalAudio.pause();
      currentSongVocalAudio.src = '';
    } catch (e) {}
    currentSongVocalAudio = null;
  }
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(cleanVerse)}`;
  const audio = new Audio(url);
  currentSongVocalAudio = audio;
  audio.playbackRate = (APP_STATE.settings.ttsRate || 1.05) * 1.08;
  if ('preservesPitch' in audio) audio.preservesPitch = false;
  audio.play().catch(e => {
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(cleanVerse);
      u.lang = 'vi-VN';
      u.rate = 1.05;
      u.pitch = 1.3;
      const viVoice = getVietnameseVoice();
      if (viVoice) u.voice = viVoice;
      window.speechSynthesis.speak(u);
    }
  });
}

function playKuromiVocalSong(songKey, onLyricUpdate) {
  stopCurrentSong();
  const song = SONGS_LIBRARY[songKey];
  if (!song) return;

  APP_STATE.currentPlayingSong = song;
  setKuromiState('singing');
  const mascot = document.getElementById('mascotWrapper');
  if (mascot) mascot.classList.add('dancing');
  const stage = document.getElementById('musicVisualizerStage');
  if (stage) stage.classList.add('active');

  const dock = document.getElementById('nowPlayingDock');
  if (dock) {
    document.getElementById('dockSongTitle').textContent = `${song.icon} ${song.title} (Kuromi Hát)`;
    dock.classList.remove('hidden');
  }

  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  const introMsg = `Kuromi cất tiếng hát tặng bé ${childName} bài ${song.title} nè! Bé cùng vỗ tay hát theo Kuromi nhé! 🎀🎶`;
  document.getElementById('kuromiStatusText').textContent = introMsg;
  if (onLyricUpdate) onLyricUpdate(introMsg);

  // Soft accompaniment
  const ctx = getAudioContext();
  let accumTime = 1.8;
  const beatSec = 60 / song.bpm;

  if (ctx) {
    song.notes.forEach(item => {
      const freq = NOTE_FREQS[item.note] || 440;
      const durSec = item.dur * beatSec * 1.5;

      const timeout = setTimeout(() => {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.setValueAtTime(0.005, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durSec);
        osc.start(now);
        osc.stop(now + durSec + 0.05);
      }, accumTime * 1000);

      currentPlaybackTimeouts.push(timeout);
      accumTime += durSec;
    });
  }

  // Vocal singing of lyrics aloud
  let lyricTime = 1.8;
  song.lyrics.forEach(lyric => {
    const t = setTimeout(() => {
      if (APP_STATE.currentPlayingSong?.id !== songKey) return;
      if (onLyricUpdate) onLyricUpdate(lyric.text);
      document.getElementById('kuromiStatusText').textContent = `Kuromi đang hát: "${lyric.text}" 🎶`;
      
      const cleanVerse = cleanKidTextForTts(lyric.text);
      if (cleanVerse) {
        singVocalLine(cleanVerse);
      }
    }, lyricTime * 1000);

    currentPlaybackTimeouts.push(t);
    lyricTime += lyric.duration;
  });

  const totalDuration = Math.max(accumTime, lyricTime) + 1.5;
  const endTimeout = setTimeout(() => {
    stopCurrentSong();
    document.getElementById('kuromiStatusText').textContent = `Kuromi hát xong bài ${song.title} rồi nè! Bé ${childName} có thích không nào? Bé muốn nghe bài nào nữa không? 🎀`;
    setKuromiState('happy');
  }, totalDuration * 1000);
  currentPlaybackTimeouts.push(endTimeout);
}

function openSingerVideo(songKey, cardElement) {
  stopCurrentSong();
  const song = SONGS_LIBRARY[songKey];
  if (!song) return;

  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  const videoBox = cardElement.querySelector('.jukebox-video-container');
  const iframe = cardElement.querySelector('.singer-video-frame');
  const realSingerBtn = cardElement.querySelector('.real-singer-btn');
  const kuromiSingBtn = cardElement.querySelector('.kuromi-sing-btn');
  const lyricEl = cardElement.querySelector('.current-lyric');
  const waveBars = cardElement.querySelector('.jukebox-wave-bars');

  if (videoBox && iframe) {
    if (song.youtubeId) {
      iframe.src = `https://www.youtube-nocookie.com/embed/${song.youtubeId}?autoplay=1&playsinline=1&rel=0`;
    } else {
      const searchTerms = encodeURIComponent(song.youtubeQuery || (song.title + ' thiếu nhi'));
      iframe.src = `https://www.youtube-nocookie.com/embed?listType=search&list=${searchTerms}&autoplay=1&playsinline=1&rel=0`;
    }
    videoBox.classList.remove('hidden');
    if (realSingerBtn) realSingerBtn.classList.add('active');
    if (kuromiSingBtn) kuromiSingBtn.classList.remove('active');
    if (waveBars) waveBars.classList.add('active');
    if (lyricEl) lyricEl.textContent = `🎬 Đang phát ca khúc do ${song.singer || 'ca sĩ nhí'} hát cho bé ${childName} nghe!`;
  }

  setKuromiState('singing');
  const mascot = document.getElementById('mascotWrapper');
  if (mascot) mascot.classList.add('dancing');
  document.getElementById('kuromiStatusText').textContent = `Kuromi mở bài ${song.title} do ca sĩ nhí ${song.singer || 'hát'} cho bé ${childName} nghe nè! 💃🎶`;
}

function closeSingerVideo(cardElement) {
  const videoBox = cardElement.querySelector('.jukebox-video-container');
  const iframe = cardElement.querySelector('.singer-video-frame');
  const realSingerBtn = cardElement.querySelector('.real-singer-btn');
  const waveBars = cardElement.querySelector('.jukebox-wave-bars');

  if (iframe) iframe.src = '';
  if (videoBox) videoBox.classList.add('hidden');
  if (realSingerBtn) realSingerBtn.classList.remove('active');
  if (waveBars) waveBars.classList.remove('active');
  setKuromiState('normal');
  const mascot = document.getElementById('mascotWrapper');
  if (mascot) mascot.classList.remove('dancing');
}

// =============================================================================
// 4. KUROMI MASCOT EMOTIONS & STATES
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
    avatarImg.src = 'assets/kuromi_normal.jpg';
    sparkle.textContent = '✨';
    document.getElementById('mascotWrapper').classList.remove('dancing');
  }
}

// =============================================================================
// 5. TEXT-TO-SPEECH (TTS) DUAL-ENGINE: ANIME KUROMI, GOOGLE ONLINE & WEB SPEECH
// =============================================================================
let activeTtsAudio = null;
let currentTtsSessionId = 0;
let isTestingVoice = false;

function cleanKidTextForTts(text) {
  if (!text) return '';
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*`_~>[\]()]/g, '')
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkTextForTts(text, maxLen = 140) {
  const cleaned = cleanKidTextForTts(text);
  if (!cleaned) return [];
  const rawSentences = cleaned.match(/[^.!?\n]+[.!?\n]*/g) || [cleaned];
  const chunks = [];
  let current = '';

  for (let s of rawSentences) {
    s = s.trim();
    if (!s) continue;
    if ((current + ' ' + s).trim().length <= maxLen) {
      current = (current ? current + ' ' + s : s).trim();
    } else {
      if (current) chunks.push(current);
      if (s.length <= maxLen) {
        current = s;
      } else {
        const words = s.split(' ');
        let wordChunk = '';
        for (const w of words) {
          if ((wordChunk + ' ' + w).trim().length <= maxLen) {
            wordChunk = (wordChunk ? wordChunk + ' ' + w : w).trim();
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = w;
          }
        }
        current = wordChunk;
      }
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function getVietnameseVoice() {
  if (!window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const viVoices = voices.filter(v => v.lang && (v.lang.toLowerCase().includes('vi') || v.name.toLowerCase().includes('vietnam')));
  if (viVoices.length > 0) {
    const natural = viVoices.find(v => {
      const n = v.name.toLowerCase();
      return n.includes('natural') || n.includes('online') || n.includes('hoaimy') || n.includes('linh') || n.includes('an');
    });
    return natural || viVoices[0];
  }
  return null;
}

function stopAllSpeech() {
  currentTtsSessionId++;
  if (activeTtsAudio) {
    try {
      activeTtsAudio.pause();
      activeTtsAudio.src = '';
    } catch (e) {}
    activeTtsAudio = null;
  }
  if (window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  setKuromiState('normal');
  const testBtn = document.getElementById('testVoiceBtn');
  if (testBtn) testBtn.classList.remove('playing');
  isTestingVoice = false;
}

function speakWithGoogleTts(chunks, options = {}, onComplete) {
  const sessionId = ++currentTtsSessionId;
  let index = 0;
  setKuromiState('singing');

  function playNextChunk() {
    if (sessionId !== currentTtsSessionId) return;
    if (index >= chunks.length) {
      setKuromiState('normal');
      if (onComplete) onComplete();
      return;
    }

    const chunk = chunks[index++];
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=vi&client=tw-ob&q=${encodeURIComponent(chunk)}`;
    const audio = new Audio(url);
    activeTtsAudio = audio;

    const rate = options.rate || 1.0;
    audio.playbackRate = Math.min(Math.max(rate, 0.7), 1.5);
    if (options.preservesPitch !== undefined) {
      if ('preservesPitch' in audio) audio.preservesPitch = options.preservesPitch;
      if ('mozPreservesPitch' in audio) audio.mozPreservesPitch = options.preservesPitch;
      if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = options.preservesPitch;
    }

    audio.onended = () => {
      if (sessionId === currentTtsSessionId) {
        playNextChunk();
      }
    };

    audio.onerror = (e) => {
      console.warn("Google TTS chunk error, switching to Web Speech:", e);
      if (sessionId === currentTtsSessionId) {
        const remaining = chunks.slice(index - 1).join('. ');
        speakWithWebSpeech(remaining, options, onComplete);
      }
    };

    audio.play().catch(err => {
      console.warn("Audio autoplay blocked or network error, fallback to Web Speech:", err);
      if (sessionId === currentTtsSessionId) {
        const remaining = chunks.slice(index - 1).join('. ');
        speakWithWebSpeech(remaining, options, onComplete);
      }
    });
  }

  playNextChunk();
}

function speakWithWebSpeech(cleanText, options = {}, onComplete) {
  if (!window.speechSynthesis) {
    if (onComplete) onComplete();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'vi-VN';
  utterance.rate = options.rate || APP_STATE.settings.ttsRate || 1.05;
  utterance.pitch = options.pitch || APP_STATE.settings.ttsPitch || 1.25;

  const viVoice = getVietnameseVoice();
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

function speakText(text, onComplete) {
  if (!APP_STATE.ttsEnabled) {
    if (onComplete) onComplete();
    return;
  }

  stopAllSpeech();

  const cleanText = cleanKidTextForTts(text);
  if (!cleanText) {
    if (onComplete) onComplete();
    return;
  }

  const voiceStyle = APP_STATE.settings.voiceStyle || 'kuromi_anime';
  const userRate = APP_STATE.settings.ttsRate || 1.05;
  const userPitch = APP_STATE.settings.ttsPitch || 1.25;

  // Option 1: Kuromi Anime Cartoon Voice (Cheerful, bubbly, slightly fast with raised pitch)
  if (voiceStyle === 'kuromi_anime') {
    const chunks = chunkTextForTts(cleanText);
    speakWithGoogleTts(chunks, {
      rate: userRate * 1.12,
      preservesPitch: false
    }, onComplete);
    return;
  }

  // Option 2: Google Online Standard Voice (Natural 100%, crisp, studio female voice)
  if (voiceStyle === 'google_online') {
    const chunks = chunkTextForTts(cleanText);
    speakWithGoogleTts(chunks, {
      rate: userRate,
      preservesPitch: true
    }, onComplete);
    return;
  }

  // Option 3: Fairy Tale Warm Voice (Soft, warm, bedtime storytelling cadence)
  if (voiceStyle === 'fairy') {
    const chunks = chunkTextForTts(cleanText);
    speakWithGoogleTts(chunks, {
      rate: userRate * 0.92,
      preservesPitch: true
    }, onComplete);
    return;
  }

  // Option 4: Device / System Voice (Web Speech API)
  if (voiceStyle === 'device') {
    const viVoice = getVietnameseVoice();
    if (viVoice) {
      speakWithWebSpeech(cleanText, { rate: userRate, pitch: userPitch }, onComplete);
    } else {
      // System has NO Vietnamese voice installed (e.g. Windows without VN pack)
      // Fallback gracefully to Google TTS so it doesn't sound like a foreign robot!
      const chunks = chunkTextForTts(cleanText);
      speakWithGoogleTts(chunks, { rate: userRate, preservesPitch: true }, onComplete);
    }
  }
}

// Test Voice Button in Parent Settings
function testVoiceSample(customStyle) {
  const childName = (document.getElementById('childNameInput')?.value || APP_STATE.settings.childName || 'Bảo Hân').trim();
  const testBtn = document.getElementById('testVoiceBtn');
  const statusEl = document.getElementById('voiceTestStatus');

  const selectedVoice = customStyle || 
    document.querySelector('input[name="voiceStyle"]:checked')?.value || 
    APP_STATE.settings.voiceStyle || 
    'kuromi_anime';

  let personaTitle = 'Kuromi Hoạt Hình';
  if (selectedVoice === 'google_online') personaTitle = 'Chị Google Trong Trẻo';
  if (selectedVoice === 'fairy') personaTitle = 'Cô Tiên Kể Chuyện';
  if (selectedVoice === 'device') personaTitle = 'Giọng Thiết Bị';

  if (testBtn) testBtn.classList.add('playing');
  if (statusEl) statusEl.textContent = `Đang phát thử: ${personaTitle} 🔊...`;

  const samplePhrase = `Kuromi chào bé ${childName}! Kuromi chúc bé một ngày thật vui vẻ và học thêm nhiều điều kỳ diệu nhé! 💖`;

  // Temporarily switch voice style for preview
  const originalStyle = APP_STATE.settings.voiceStyle;
  APP_STATE.settings.voiceStyle = selectedVoice;

  speakText(samplePhrase, () => {
    APP_STATE.settings.voiceStyle = originalStyle;
    if (testBtn) testBtn.classList.remove('playing');
    if (statusEl) statusEl.textContent = `Đã phát xong giọng ${personaTitle}! Bé nghe thấy thích không nè? 💕`;
  });
}

// =============================================================================
// 6. SPEECH-TO-TEXT (ROBUST MICROPHONE ENGINE FOR KIDS)
// =============================================================================
let activeRecognition = null;
let speechDebounceTimer = null;

function startVoiceInput() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('voiceInputBtn');
  const inputEl = document.getElementById('childTextInput');
  const statusEl = document.getElementById('kuromiStatusText');
  const listeningPill = document.getElementById('micListeningIndicator');
  const listeningText = document.getElementById('micListeningText');
  const childName = APP_STATE.settings.childName || 'Bảo Hân';

  // Toggle off if already active
  if (APP_STATE.isRecording) {
    stopVoiceInput();
    return;
  }

  // 1. Insecure Context Guard (HTTP outside localhost)
  if (!window.isSecureContext && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    statusEl.innerHTML = `⚠️ Trình duyệt cần bảo mật HTTPS để mở Micro. Ba mẹ bấm vào nút <b>🌐 Đường Dẫn Khác Mạng WiFi</b> ở góc trên để dùng đường dẫn bảo mật cho bé nhé! 💕`;
    playSfx('pop');
    return;
  }

  // 2. Browser Compatibility Guard
  if (!SpeechRecognition) {
    statusEl.textContent = `Trình duyệt hiện tại chưa hỗ trợ nhận diện giọng nói trực tiếp. Bé gõ phím hoặc bấm các nút chủ đề gợi ý bên trên nhé! 💕`;
    inputEl.focus();
    playSfx('pop');
    return;
  }

  // Stop any ongoing speech or song so Kuromi does not hear herself
  stopAllSpeech();

  try {
    const rec = new SpeechRecognition();
    activeRecognition = rec;
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'vi-VN';
    rec.maxAlternatives = 1;

    let finalTranscript = '';

    rec.onstart = () => {
      APP_STATE.isRecording = true;
      if (micBtn) micBtn.classList.add('recording');
      if (listeningPill) listeningPill.classList.remove('hidden');
      if (listeningText) listeningText.textContent = `Kuromi đang lắng nghe bé ${childName} nói... 🎙️`;
      statusEl.textContent = `Kuromi đang mở to tai lắng nghe bé ${childName} nè... Bé nói đi nào! 🎤👂`;
      inputEl.placeholder = `Đang nghe giọng nói của bé ${childName}... 🎙️`;
      playSfx('chime');
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }

      const currentSaid = (finalTranscript || interim).trim();
      if (currentSaid) {
        inputEl.value = currentSaid;
        if (listeningText) listeningText.textContent = `Bé nói: "${currentSaid}" 💬`;
        statusEl.textContent = `Kuromi nghe thấy: "${currentSaid}" 🐰✨`;
      }

      // Automatically auto-submit 1.4s after the child stops speaking
      if (speechDebounceTimer) clearTimeout(speechDebounceTimer);
      speechDebounceTimer = setTimeout(() => {
        if (finalTranscript || interim) {
          try {
            rec.stop();
          } catch (e) {}
        }
      }, 1400);
    };

    rec.onerror = (event) => {
      console.warn("Speech recognition error:", event.error);
      APP_STATE.isRecording = false;
      if (micBtn) micBtn.classList.remove('recording');
      if (listeningPill) listeningPill.classList.add('hidden');
      inputEl.placeholder = `Bé ${childName} hỏi Kuromi điều gì nào? (Bấm micro để nói)...`;

      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        statusEl.innerHTML = `⚠️ Trình duyệt chưa được cấp quyền Micro! Ba mẹ bấm vào biểu tượng Micro/Ổ khóa 🔒 trên thanh địa chỉ và chọn <b>"Cho phép" (Allow)</b> để bé nói chuyện nhé! 🎀`;
      } else if (event.error === 'no-speech') {
        statusEl.textContent = `Kuromi chưa nghe thấy tiếng bé ${childName} nè. Bé lại gần micro và nói to, rõ ràng hơn chút xíu nhé! 💕🎤`;
      } else if (event.error === 'network') {
        statusEl.textContent = `Đường truyền mạng bị gián đoạn khi nhận dạng giọng nói. Bé kiểm tra lại kết nối Wifi nhé! 🌐`;
      } else {
        statusEl.textContent = `Kuromi chưa nghe rõ, bé ${childName} bấm nút micro để nói lại nhé! 💕`;
      }
      playSfx('pop');
    };

    rec.onend = () => {
      APP_STATE.isRecording = false;
      if (micBtn) micBtn.classList.remove('recording');
      if (listeningPill) listeningPill.classList.add('hidden');
      inputEl.placeholder = `Bé ${childName} hỏi Kuromi điều gì nào? (Bấm micro để nói)...`;

      const query = (finalTranscript || inputEl.value || '').trim();
      if (query) {
        playSfx('pop');
        handleChildSubmit(query);
      }
    };

    rec.start();
  } catch (err) {
    console.error("Start speech recognition failed:", err);
    APP_STATE.isRecording = false;
    if (micBtn) micBtn.classList.remove('recording');
    if (listeningPill) listeningPill.classList.add('hidden');
    statusEl.textContent = `Chưa mở được micro: ${err.message}. Bé thử bấm lại nhé!`;
  }
}

function stopVoiceInput() {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch (e) {}
    activeRecognition = null;
  }
  if (speechDebounceTimer) {
    clearTimeout(speechDebounceTimer);
    speechDebounceTimer = null;
  }
  APP_STATE.isRecording = false;
  const micBtn = document.getElementById('voiceInputBtn');
  if (micBtn) micBtn.classList.remove('recording');
  const listeningPill = document.getElementById('micListeningIndicator');
  if (listeningPill) listeningPill.classList.add('hidden');
}

// =============================================================================
// 7. COMPREHENSIVE MULTI-SENSORY ENCYCLOPEDIA (OVER 120+ TOPICS)
// =============================================================================
const MULTI_SENSORY_DATA = [
  // ------------------------- MUÔN THÚ (ANIMALS) -------------------------
  {
    category: 'animals',
    keywords: ['con cho', 'chu cho', 'cho con', 'cho sua', 'cho thich an gi', 'gau gau'],
    answer: "Chú chó là người bạn bốn chân vô cùng trung thành và đáng yêu của chúng mình! Chó có chiếc mũi siêu thính có thể ngửi thấy mùi từ xa. Khi vui mừng gặp bé, chó sẽ vẫy đuôi tít mù. Chó thích gặm xương, ăn thịt và cơm thơm ngon. Kuromi mở tiếng chó sủa gâu gâu bảo vệ nhà cho bé nghe nè! 🐶🦴",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Chú Cún Con Dễ Thương',
      caption: 'Chú cún lông vàng tinh nghịch đang vui đùa cùng bạn bè trên thảm cỏ xanh biếc!'
    },
    sound: 'dog',
    soundTitle: 'Tiếng Chú Chó Sủa Gâu Gâu'
  },
  {
    category: 'animals',
    keywords: ['con meo', 'meo con', 'tieng meo', 'meo meo', 'meo thich an gi', 'chu meo'],
    answer: "Mèo con có bộ lông mềm mượt như nhung, đôi tai vểnh và những chiếc ria mép kỳ diệu giúp mèo giữ thăng bằng. Mèo rất thích ăn cá, uống sữa và ngủ lười sưởi nắng. Khi được bé vuốt ve, mèo sẽ kêu 'gừ gừ' và 'meo meo' nũng nịu đấy! 🐱🐟",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Bạn Mèo Nhỏ Mắt Xanh Xinh Xắn',
      caption: 'Mèo con đáng yêu đang tròn xoe mắt ngắm những cánh bướm hoa xinh!'
    },
    sound: 'cat',
    soundTitle: 'Tiếng Mèo Con Kêu Meo Meo'
  },
  {
    category: 'animals',
    keywords: ['con vit', 'chu vit', 'vit con', 'cap cap', 'tieng vit'],
    answer: "Bạn vịt có bộ lông không thấm nước và đôi chân có màng như mái chèo giúp vịt bơi lội tung tăng dưới hồ nước mát! Vịt thích ăn rong rêu, tôm tép nhỏ và cất tiếng kêu 'cạp cạp' rộn ràng cả bờ ao! 🦆💦",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Đàn Vịt Con Bơi Dưới Ao Hoa',
      caption: 'Vịt con lông vàng óng ả đang tung tăng bơi lội bên bạn rùa và cá nhỏ!'
    },
    sound: 'duck',
    soundTitle: 'Tiếng Chú Vịt Kêu Cạp Cạp'
  },
  {
    category: 'animals',
    keywords: ['su tu', 'chua son lam', 'tieng su tu', 'gam'],
    answer: "Sư tử được mệnh danh là Chúa tể rừng xanh! Chú sư tử đực có chiếc bờm dày oai phong lẫm liệt bảo vệ đàn. Tiếng gầm của sư tử rất vang dội có thể nghe thấy từ cách xa 8 cây số đấy bé yêu ơi! 🦁👑",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Chú Sư Tử Oai Vệ Và Đáng Yêu',
      caption: 'Sư tử con dũng mãnh nở nụ cười hiền lành cùng muôn loài hòa thuận!'
    },
    sound: 'lion',
    soundTitle: 'Tiếng Sư Tử Gầm Vang Dội'
  },
  {
    category: 'animals',
    keywords: ['con chim', 'chim hot', 'tieng chim', 'liu lo', 'canh chim'],
    answer: "Những chú chim nhỏ xinh xắn có đôi cánh phủ đầy lông vũ nhẹ tênh giúp chim bay lượn vút lên bầu trời xanh biếc. Mỗi sớm mai thức dậy, chim lại cất tiếng hót líu lo lích chích chào ông mặt trời và chúc bé một ngày vui vẻ! 🐦🌸",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Chú Chim Nhỏ Bay Lượn Giữa Đồng Hoa',
      caption: 'Những chú chim rực rỡ sắc màu đang hót ca bên cầu vồng 7 sắc lung linh!'
    },
    sound: 'bird',
    soundTitle: 'Tiếng Chim Hót Líu Lo Ríu Rít'
  },
  {
    category: 'animals',
    keywords: ['con voi', 'chu voi', 'mui dai', 'voi con'],
    answer: "Con voi là loài động vật to lớn nhất sống trên cạn! Chiếc vòi dài của voi chính là chiếc mũi kỳ diệu kết hợp với môi trên, vừa dùng để hít thở, hút nước phun mưa tắm mát, vừa gắp thức ăn bỏ vào miệng như một cánh tay khéo léo đấy bé ạ! 🐘🌿",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Chú Voi Con Tinh Nghịch',
      caption: 'Voi con dùng vòi hút nước phun thành cầu vồng nhỏ cho các bạn bè cùng xem!'
    }
  },
  {
    category: 'animals',
    keywords: ['huou cao co', 'co dai', 'huou'],
    answer: "Hươu cao cổ là bạn động vật cao nhất trên Trái Đất! Chiếc cổ dài miên man giúp bạn ấy vươn tới những ngọn lá non ngọt ngào tít trên đỉnh cây cao mà không loài vật nào với tới được. Chiếc lưỡi màu tím dài gần nửa mét của hươu cũng giúp cuốn lá cây rất cừ khôi đấy! 🦒🍃",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Gia Đình Hươu Cao Cổ',
      caption: 'Hươu cao cổ thong dong thưởng thức những tán lá ngọt ngào trên đỉnh đồi!'
    }
  },
  {
    category: 'animals',
    keywords: ['con khi', 'chu khi', 'leo treo', 'an chuoi'],
    answer: "Bạn khỉ vô cùng lém lỉnh, nhanh nhẹn và thông minh! Khỉ có chiếc đuôi dài giúp bám chắc vào cành cây như cánh tay thứ năm, chuyền từ cành này sang cành khác thoăn thoắt. Khỉ rất mê ăn chuối chín thơm lừng và các loại quả ngọt trong rừng! 🐒🍌",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Chú Khỉ Con Tinh Nghịch',
      caption: 'Khỉ con treo ngược mình trên cành cây ăn quả chuối vàng mỉm cười!'
    }
  },
  {
    category: 'animals',
    keywords: ['con tho', 'tho con', 'tai dai', 'an ca rot', 'nhay'],
    answer: "Bạn thỏ trắng có đôi tai dài dựng đứng cực kỳ thính, có thể nghe được tiếng động rất khẽ từ đằng xa. Thỏ có bộ lông trắng mịn như bông gòn, hai mắt tròn xoe như hạt ngọc và thích nhất là ăn củ cà rốt đỏ au giòn rụm! 🐰🥕",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Chú Thỏ Ngọc Đáng Yêu',
      caption: 'Thỏ con ôm củ cà rốt xinh xắn nhún nhảy trên đồng cỏ hoa thơm!'
    }
  },
  {
    category: 'animals',
    keywords: ['con gau', 'gau truc', 'gau bac cuc', 'mat ong'],
    answer: "Bạn gấu có thân hình tròn trịa, mũm mĩm và đôi tai tròn xoe! Gấu thích ăn cá hồi tươi và mê nhất là mật ong rừng ngọt lịm. Vào mùa đông lạnh giá tuyết rơi, các bạn gấu sẽ cuộn tròn ngủ ấm áp trong hang suốt nhiều tháng trời gọi là 'ngủ đông' đấy! 🐻🍯",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Bạn Gấu Nhỏ Thân Thiện',
      caption: 'Gấu con mũm mĩm cầm hũ mật ong thơm lừng mỉm cười chào bé!'
    }
  },
  {
    category: 'animals',
    keywords: ['khung long', 'dinosaur', 't-rex', 'bao chua', 'khung long 3 sung', 'hoa thach'],
    answer: "Khủng long là loài bò sát khổng lồ từng làm chủ Trái Đất từ hàng triệu năm trước! Khủng long bạo chúa T-Rex có hàm răng sắc nhọn và đôi chân chạy rất nhanh, còn khủng long Triceratops có 3 chiếc sừng dũng cảm. Ngày nay chúng mình chỉ còn thấy xương hóa thạch của các bạn ấy trong viện bảo tàng thôi nè! 🦖🦕",
    visual: {
      src: 'assets/cute_dinosaur.jpg',
      title: 'Các Bạn Khủng Long Thời Tiền Sử',
      caption: 'Khủng long bạo chúa T-Rex con và bạn Triceratops đang chơi đùa dưới chân núi lửa màu hồng!'
    }
  },
  {
    category: 'animals',
    keywords: ['con buom', 'sau buom', 'ken nhong', 'buom sinh ra'],
    answer: "Vòng đời của bạn bướm là một phép màu kỳ diệu! Ban đầu là quả trứng bé xíu trên chiếc lá, nở thành bạn sâu bướm nhỏ bò ngoan ngoãn ăn lá cây. Sau đó sâu cuốn mình thành chiếc kén nhộng êm ái ngủ một giấc dài, rồi biến hóa thần kỳ chui ra thành chú bướm xinh đẹp rực rỡ đôi cánh bay lượn! 🦋✨",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Vũ Điệu Loài Bướm Rực Rỡ',
      caption: 'Những cánh bướm vàng bay lượn dập dờn quanh những bông hoa mùa xuân ngát hương!'
    },
    song: 'butterfly'
  },
  {
    category: 'animals',
    keywords: ['con ong', 'chu ong', 'lay mat', 'to ong'],
    answer: "Những bạn ong mật bé nhỏ là tấm gương sáng về sự chăm chỉ! Mỗi ngày, ong bay đến hàng ngàn bông hoa để hút mật ngọt và mang phấn hoa đi thụ phấn giúp cây kết trái thơm ngon. Mật ong vàng óng thơm lừng mà bé hay uống chính là công lao của các bạn ong đấy! 🐝🍯",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Bạn Ong Vàng Chăm Chỉ Hút Mật',
      caption: 'Chú ong nhỏ bay lượn bên đài hoa hướng dương rực rỡ ánh mặt trời!'
    }
  },
  {
    category: 'animals',
    keywords: ['con kien', 'chu kien', 'doan ket', 'tha moi'],
    answer: "Bạn kiến tuy nhỏ bé nhưng lại là những lực sĩ phi thường! Kiến có thể vác những mẩu thức ăn nặng gấp 50 lần cơ thể mình. Đặc biệt, các bạn kiến luôn đi theo hàng lối ngay ngắn và đoàn kết giúp đỡ nhau cùng đưa thức ăn về tổ trước khi trời mưa! 🐜🐜",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Đoàn Kiến Chăm Chỉ',
      caption: 'Những chú kiến nhỏ xíu đoàn kết cõng thức ăn qua cành lá xanh!'
    }
  },

  // ------------------------- ĐẠI DƯƠNG (OCEAN LIFE) -------------------------
  {
    category: 'ocean',
    keywords: ['ca heo', 'dolphin', 'thong minh', 'ca heo co phai la ca'],
    answer: "Cá heo là sinh vật vô cùng thông minh và thân thiện với con người! Bé có biết không: cá heo không phải là cá đâu nhé, mà là động vật có vú, thở bằng phổi thông qua lỗ thở trên đỉnh đầu và đẻ con rồi nuôi con bằng sữa mẹ đấy! Cá heo rất thích nhào lộn trên sóng biển! 🐬🌊",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Cá Heo Thông Thái Nhảy Múa Dưới Sóng Biển',
      caption: 'Chú cá heo mắt xanh thân thiện mỉm cười bên bạn cá voi và rùa biển sắc màu!'
    }
  },
  {
    category: 'ocean',
    keywords: ['ca voi', 'whale', 'phun nuoc', 'khong lo'],
    answer: "Cá voi xanh là sinh vật to lớn nhất trong toàn bộ lịch sử Trái Đất, to hơn cả khủng long thời xưa! Khi ngoi lên mặt biển để thở, cá voi sẽ phun một cột nước và hơi sương cao vút lên bầu trời như một đài phun nước khổng lồ tuyệt đẹp giữa đại dương mênh mông! 🐳💦",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Bạn Cá Voi Xanh Phun Nước Thần Kỳ',
      caption: 'Cá voi con phun cột nước lấp lánh như cầu vồng giữa làn nước biển trong xanh!'
    }
  },
  {
    category: 'ocean',
    keywords: ['bach tuoc', 'muc', 'may qua tim', 'xuc tu', 'mau xanh'],
    answer: "Bạch tuộc là nhà ảo thuật kỳ tài của đại dương! Bạch tuộc có tới 8 chiếc xúc tu dẻo dai phủ đầy giác hút, có tới 3 quả tim đập rộn ràng và dòng máu có màu xanh lam kỳ lạ. Khi gặp nguy hiểm, bạch tuộc sẽ phun ra một đám mây mực đen nhánh để trốn thoát! 🐙✨",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Chú Bạch Tuộc Hồng Tí Hon',
      caption: 'Bạch tuộc hồng đáng yêu xòe 8 xúc tu bơi lội giữa rừng san hô lấp lánh sao biển!'
    }
  },
  {
    category: 'ocean',
    keywords: ['rua bien', 'doi', 'mai rua'],
    answer: "Rùa biển có chiếc mai cứng cáp như chiếc khiên bảo vệ cơ thể và bốn chiếc chân dẹt như đôi mái chèo lướt đi êm ru dưới nước. Rùa biển bơi qua hàng ngàn cây số đại dương và có thể sống thọ hơn 100 tuổi đấy bé yêu ạ! 🐢🏝️",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Bạn Rùa Biển Bơi Lội Dưới Đáy Biển',
      caption: 'Chú rùa biển với chiếc mai hoa văn cầu vồng tung tăng dạo chơi dưới lòng đại dương!'
    }
  },
  {
    category: 'ocean',
    keywords: ['con ca', 'ca tho the nao', 'ca co ngu khong', 'vay ca', 'mang ca'],
    answer: "Các bạn cá thở bằng mang ở hai bên đầu để lấy oxy hòa tan trong nước và bơi lội thoăn thoắt nhờ vây và đuôi! Bé có thắc mắc cá có ngủ không? Có đấy bé nha! Nhưng cá không có mí mắt nên khi ngủ mắt vẫn mở thao láo, cơ thể lơ lửng giữ thăng bằng trong làn nước êm đềm! 🐟💤",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Đàn Cá Sặc Sỡ Dưới Lòng Biển',
      caption: 'Muôn loài cá nhỏ tung tăng lượn quanh những rạn san hô lung linh ánh mặt trời!'
    }
  },
  {
    category: 'ocean',
    keywords: ['chim canh cut', 'nam cuc', 'bang tuyet'],
    answer: "Chim cánh cụt sống ở Nam Cực phủ đầy băng tuyết lạnh giá! Dù là loài chim nhưng cánh của các bạn ấy biến thành mái chèo, không bay lên trời được mà bơi lội dưới biển băng nhanh như phi tên lửa. Trên bờ băng, các bạn ấy đi lạch bạch lắc lư siêu đáng yêu! 🐧❄️",
    visual: {
      src: 'assets/cute_animals.jpg',
      title: 'Gia Đình Chim Cánh Cụt Lạch Bạch',
      caption: 'Chim cánh cụt con trượt băng bụng vèo vèo trên tảng băng trắng muốt!'
    }
  },

  // ------------------------- THIÊN NHIÊN & KHOA HỌC ("VÌ SAO?") -------------------------
  {
    category: 'why',
    keywords: ['tai sao troi mua', 'vi sao co mua', 'nuoc mua', 'mua tu dau ra'],
    answer: "Mưa hình thành qua một chuyến du lịch kỳ thú của những giọt nước! Ánh mặt trời sưởi ấm làm nước ở ao hồ, sông biển bốc hơi bay lên cao tạo thành những đám mây bồng bềnh. Khi mây gặp không khí lạnh trên cao, các hạt nước ngưng tụ lại to dần, nặng quá không giữ nổi nữa liền rơi xuống Trái Đất tạo thành cơn mưa mát rượi tưới tắm cho cây cối! 🌧️🌱",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Cơn Mưa Rào Mát Lành Sau Nắng Ấm',
      caption: 'Những giọt mưa tưới mát cho vòm cây ngọn cỏ và nở bung những nụ hoa rực rỡ!'
    },
    sound: 'rain',
    soundTitle: 'Tiếng Mưa Rơi Tí Tách Dịu Mát'
  },
  {
    category: 'why',
    keywords: ['tai sao la cay mau xanh', 'la cay mau xanh', 'diep luc', 'quang hop'],
    answer: "Lá cây có màu xanh là nhờ một 'đầu bếp tí hon' diệu kỳ tên là Chất Diệp Lục (Chlorophyll) nằm trong lá! Chất diệp lục này hấp thụ ánh nắng mặt trời và nước để 'nấu' ra thức ăn nuôi cây lớn nhanh, đồng thời nhả ra khí oxy trong lành cho chúng mình hít thở đấy bé yêu ơi! 🌿☀️",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Tán Lá Cây Xanh Mướt Tràn Ngập Sức Sống',
      caption: 'Những chiếc lá xanh mơn mởn đọng sương sớm dưới ánh nắng bình minh lung linh!'
    }
  },
  {
    category: 'why',
    keywords: ['vi sao bien man', 'tai sao nuoc bien lai man', 'muoi bien', 'vi man'],
    answer: "Nước biển mặn là vì nước mưa khi rơi xuống đồi núi đã hòa tan một lượng muối khoáng li ti từ đất đá, rồi các dòng sông suối cuốn lượng muối này đổ về biển lớn. Trải qua hàng trăm triệu năm bốc hơi nước nhưng muối vẫn đọng lại, khiến cho nước biển trở nên mặn chát như ngày nay! 🌊🧂",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Đại Dương Xanh Mênh Mông',
      caption: 'Sóng biển dập dềnh vỗ về bãi cát trắng chứa đựng bao khoáng chất diệu kỳ!'
    }
  },
  {
    category: 'why',
    keywords: ['tai sao co cau vong', 'cau vong 7 mau', 'bay sac cau vong', 'cau vong'],
    answer: "Cầu vồng xuất hiện khi vừa có mưa rơi vừa có ánh nắng mặt trời chiếu qua! Những giọt nước mưa li ti như những lăng kính pha lê thần kỳ, tách ánh sáng trắng mặt trời thành 7 sắc màu lung linh: Đỏ, Cam, Vàng, Lục, Lam, Chàm, Tím. Cầu vồng như một chiếc cầu trượt kỳ diệu bắc qua bầu trời hoa! 🌈✨",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Chiếc Cầu Vồng 7 Sắc Lung Linh',
      caption: 'Bức tranh cầu vồng vắt ngang đồng hoa rực rỡ sau cơn mưa rào dịu mát!'
    }
  },
  {
    category: 'why',
    keywords: ['tai sao bau troi mau xanh', 'bau troi mau xanh', 'troi xanh', 'khi quyen'],
    answer: "Bầu trời có màu xanh ngắt là do ánh sáng mặt trời chứa đựng đủ mọi sắc màu chiếu vào bầu khí quyển Trái Đất. Trong các tia sáng, tia màu xanh dương có bước sóng ngắn nên bị các phân tử không khí tán xạ bắn tung tóe khắp mọi ngóc ngách trên bầu trời, khiến mắt chúng mình nhìn lên thấy một vòm trời xanh tuyệt đẹp! ☀️💙",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Bầu Trời Xanh Trong Vắt Và Mây Trắng',
      caption: 'Bầu trời mùa hạ xanh ngắt nâng niu những đám mây trắng xốp như kẹo bông!'
    }
  },
  {
    category: 'why',
    keywords: ['mat troi moc o dau', 'mat troi moc huong nao', 'mat troi lan huong nao', 'huong dong', 'huong tay'],
    answer: "Mặt trời luôn mọc ở hướng Đông vào mỗi sáng sớm mang theo ánh nắng ấm áp báo hiệu ngày mới bắt đầu, và đến chiều tà, mặt trời sẽ lặn ở hướng Tây nhuộm màu hoàng hôn tím hồng rực rỡ để nhường chỗ cho mặt trăng và các vì sao lấp lánh đấy bé yêu! 🌅🌇",
    visual: {
      src: 'assets/solar_system.jpg',
      title: 'Mặt Trời Tỏa Ánh Sáng Ấm Áp',
      caption: 'Mặt trời khổng lồ mỉm cười chiếu những tia nắng vàng ấm áp xuống Trái Đất!'
    }
  },
  {
    category: 'why',
    keywords: ['mat trang ban ngay o dau', 'tai sao mat trang tron khuyet', 'trang tron', 'trang khuyet'],
    answer: "Ban ngày mặt trăng vẫn bay trên bầu trời cùng chúng mình đấy! Nhưng do ánh nắng mặt trời buổi sáng quá chói chang nên mắt chúng mình khó thấy thôi. Còn mặt trăng lúc tròn lúc khuyết là do Trái Đất và Mặt Trăng quay tròn quanh Mặt Trời, khiến phần được chiếu sáng đổi góc nhìn mỗi đêm đấy bé! 🌙✨",
    visual: {
      src: 'assets/solar_system.jpg',
      title: 'Vầng Trăng Cổ Tích Lấp Lánh Sao',
      caption: 'Vầng trăng lưỡi liềm vàng óng ả mỉm cười dịu dàng bên hàng triệu vì sao đêm!'
    }
  },
  {
    category: 'why',
    keywords: ['he mat troi', 'vu tru', 'sao hoa', 'trai dat', 'hanh tinh', 'phi hanh gia'],
    answer: "Hệ mặt trời của chúng ta như một đại gia đình kỳ diệu! Ở trung tâm là Mặt Trời khổng lồ ấm áp, xung quanh có 8 hành tinh quay tròn: Sao Thủy, Sao Kim, Trái Đất xanh tươi của chúng ta, Sao Hỏa đỏ rực, Sao Mộc to nhất và Sao Thổ có chiếc vành đai lấp lánh như chiếc nơ xinh! 🪐🚀",
    visual: {
      src: 'assets/solar_system.jpg',
      title: 'Đại Gia Đình Hệ Mặt Trời',
      caption: 'Mặt trời mỉm cười cùng Trái Đất xinh đẹp và các hành tinh đang quay tít trên dải ngân hà lấp lánh sao!'
    }
  },
  {
    category: 'why',
    keywords: ['sam set', 'sam chop', 'tia chop', 'tai sao co sam'],
    answer: "Sấm sét xuất hiện trong những cơn dông bão! Những đám mây cọ xát vào nhau tích tụ điện mạnh mẽ tạo ra tia chớp lóe sáng rực trời. Tia chớp làm không khí xung quanh nóng lên đột ngột và nổ bung tạo ra tiếng sấm 'đùng đoàng' vang dội! Vì ánh sáng đi nhanh hơn âm thanh nên bé thấy chớp sáng trước rồi mới nghe sấm nổ sau đấy! ⚡🌩️",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Tia Chớp Và Đám Mây Mùa Mưa',
      caption: 'Tia chớp sáng bừng bầu trời gột rửa không khí mang lại sự trong lành cho mặt đất!'
    }
  },
  {
    category: 'why',
    keywords: ['gio tu dau toi', 'tai sao co gio', 'con gio'],
    answer: "Gió chính là sự chuyển động của không khí quanh chúng mình! Khi mặt trời sưởi nóng một vùng đất, không khí nóng nhẹ hơn sẽ bay lên cao. Lúc đó, luồng không khí mát từ nơi khác liền thổi ùa tới để lấp đầy chỗ trống, tạo nên những cơn gió mát rượi thổi bay tóc bé và làm chong chóng quay tít! 🍃🌬️",
    visual: {
      src: 'assets/rainbow_nature.jpg',
      title: 'Ngọn Gió Mát Lành Qua Đồng Hoa',
      caption: 'Gió nhẹ nhàng đung đưa những nhành hoa tím và nâng cánh diều bay cao!'
    }
  },
  {
    category: 'why',
    keywords: ['sao bang la gi', 'uoc nguyen sao bang', 'sao bang'],
    answer: "Sao băng không phải là một ngôi sao bị rơi đâu bé ơi! Đó là những mảnh đá bụi nhỏ xíu bay ngoài vũ trụ, khi bay vào bầu khí quyển Trái Đất thì bị cọ xát bốc cháy tạo thành vệt sáng rực rỡ lướt qua bầu trời đêm. Mọi người tin rằng khi nhìn thấy sao băng và nhắm mắt ước một điều ước ngoan ngoãn thì điều ước sẽ thành hiện thực đấy! 🌠💫",
    visual: {
      src: 'assets/solar_system.jpg',
      title: 'Sao Băng Lấp Lánh Qua Dải Ngân Hà',
      caption: 'Vệt sao băng lung linh bay vút qua bầu trời đêm mang theo bao ước mơ ngọt ngào!'
    }
  },

  // ------------------------- BÉ VUI KHỎE & THÓI QUEN TỐT -------------------------
  {
    category: 'habits',
    keywords: ['danh rang', 'tai sao phai danh rang', 'sau rang', 'kem danh rang', 'ban chai'],
    answer: "Bé ơi, sau khi ăn cơm hay ăn bánh kẹo xong, những bạn vi khuẩn sâu răng tí hon sẽ trốn vào kẽ răng để gặm nhấm thức ăn thừa, làm răng bị sâu đen và đau buốt đấy! Khi bé chăm chỉ đánh răng sáng và tối bằng kem thơm mát, những chiếc răng sẽ trắng tinh, sạch bóng và thơm tho như những hạt ngọc xinh! 🦷🪥✨",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Bé Tập Đánh Răng Sạch Bóng',
      caption: 'Bé ngoan đứng trước gương đánh răng sủi bọt trắng tinh cùng nụ cười rạng rỡ!'
    },
    song: 'teeth'
  },
  {
    category: 'habits',
    keywords: ['rua tay', 'tai sao phai rua tay', 'xa phong', 'vi khuan ban tay'],
    answer: "Bàn tay bé cầm nắm đồ chơi, vẽ tranh có thể dính hàng triệu bạn vi trùng bé xíu mà mắt thường không thấy được đâu! Nếu bé cầm thức ăn bỏ vào miệng, vi trùng sẽ chui vào bụng làm đau bụng đấy. Rửa tay thật sạch bằng xà phòng thơm và nước sạch trước khi ăn sẽ giúp bụng bé luôn khỏe mạnh và an toàn! 🧼💧",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Rửa Tay Sạch Bong Với Bong Bóng Xà Phòng',
      caption: 'Bé rửa tay với xà phòng tạo nên những bong bóng xà phòng ngũ sắc thơm tho!'
    }
  },
  {
    category: 'habits',
    keywords: ['an rau', 'tai sao phai an rau', 'an hoa qua', 'vitamin', 'trai cay'],
    answer: "Rau xanh và trái cây tươi là kho báu chứa vô vàn vitamin và chất xơ thần kỳ! Cà rốt giúp mắt bé sáng long lanh, cam và dâu tây giúp bé có làn da hồng hào đề kháng khỏe không sợ cảm cúm, còn rau xanh giúp bụng tiêu hóa dễ dàng nhẹ nhõm. Bé nhớ ăn thật nhiều rau củ để lớn nhanh như nàng công chúa thông minh nhé! 🥗🍓🥕",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Tô Hoa Quả Và Rau Củ Cầu Vồng',
      caption: 'Tô trái cây dâu tây, táo, chuối tươi ngon cung cấp nguồn năng lượng dồi dào cho bé!'
    }
  },
  {
    category: 'habits',
    keywords: ['ngu som', 'tai sao phai ngu som', 'di ngu', 'ngu trua', 'thuc khuya'],
    answer: "Khi bé đi ngủ sớm vào khoảng 9 giờ tối, cơ thể bé sẽ tiết ra hoóc-môn tăng trưởng mạnh mẽ nhất giúp xương dài ra, bé cao lớn nhanh và não bộ sắp xếp lại kiến thức giúp bé thông minh hơn. Ngủ đủ giấc sáng mai thức dậy bé sẽ tràn đầy năng lượng và có nụ cười rạng rỡ như hoa! 🌙💤",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Giấc Ngủ Ngon Cùng Gấu Bông Dưới Ánh Trăng',
      caption: 'Bé say giấc nồng ấm áp trên chiếc giường xinh xắn cùng bao giấc mơ thần tiên!'
    }
  },
  {
    category: 'habits',
    keywords: ['tai sao mat lai chop', 'chop mat', 'nuoc mat'],
    answer: "Mắt chúng mình chớp chớp đều đặn là để tiết ra một lớp màng nước mắt mỏng làm ẩm ướt giác mạc, giúp mắt không bị khô rát và cuốn trôi những hạt bụi li ti bay vào mắt. Mí mắt như hai chiếc cần gạt nước xe hơi bảo vệ đôi mắt ngọc ngà của bé luôn sáng trong! 👀💧",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Đôi Mắt Sáng Long Lanh Của Bé',
      caption: 'Đôi mắt sáng lấp lánh như hai vì sao nhỏ ngắm nhìn thế giới diệu kỳ!'
    }
  },
  {
    category: 'habits',
    keywords: ['trai tim dap', 'tai sao tim dap', 'tim de lam gi', 'nhip tim', 'mach mau'],
    answer: "Trái tim nằm ở lồng ngực bên trái của bé, hoạt động như một chiếc máy bơm thần kỳ không bao giờ biết mệt mỏi! Tim đập 'thình thịch, thình thịch' ngày đêm để bơm máu mang theo oxy và chất dinh dưỡng đi nuôi khắp cơ thể, từ đầu ngón tay cho tới ngón chân của bé đấy! 💓🫀",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Trái Tim Yêu Thương Khỏe Mạnh',
      caption: 'Trái tim hồng hào đập nhịp nhàng tiếp thêm sức sống tươi vui cho bé mỗi ngày!'
    }
  },
  {
    category: 'habits',
    keywords: ['tai sao bi dau lai khoc', 'nuoc mat tu dau ra', 'khoc'],
    answer: "Khi bé bị ngã đau hay buồn bã, cơ thể sẽ tiết ra nước mắt để giúp xoa dịu nỗi đau. Trong nước mắt có chất giảm đau tự nhiên và giúp bé giải tỏa cảm xúc. Khóc xong và được ba mẹ ôm vào lòng vỗ về, bé sẽ thấy nhẹ nhõm và vui vẻ trở lại ngay thôi! Kuromi gửi ngàn cái ôm ấm áp tới bé nè! 💖🥺",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Cái Ôm Ấm Áp Của Yêu Thương',
      caption: 'Vòng tay gia đình và những người bạn thân thiết luôn sẵn sàng che chở cho bé!'
    }
  },
  {
    category: 'habits',
    keywords: ['tai sao phai uong nuoc', 'uong du nuoc', 'nuoc loc'],
    answer: "Hơn 70% cơ thể của bé là nước đấy! Nước giúp làm mát cơ thể khi chạy nhảy toát mồ hôi, giúp máu lưu thông tốt và đào thải các chất cặn bã ra ngoài. Bé nhớ uống nước đều đặn mỗi ngày để da dẻ luôn hồng hào và đôi môi luôn mềm xinh tươi nhé! 🥛✨",
    visual: {
      src: 'assets/healthy_habits.jpg',
      title: 'Cốc Nước Mát Lành Thanh Khiết',
      caption: 'Bé ngoan uống nước lọc tinh khiết tiếp thêm năng lượng học tập và vui chơi!'
    }
  },

  // ------------------------- PHƯƠNG TIỆN GIAO THÔNG (VEHICLES) -------------------------
  {
    category: 'vehicles',
    keywords: ['xe cuu hoa', 'chua chay', 'coi cuu hoa', 'voi rong', 'linh cuu hoa'],
    answer: "Xe cứu hỏa có màu đỏ rực nổi bật, trên nóc có còi hú 'u... o... u... o...' vang dội và đèn chớp đỏ báo hiệu mọi xe khác nhường đường ưu tiên! Xe cứu hỏa mang theo thang dài vươn cao tít và vòi rồng phun nước cực mạnh để dập tắt đám cháy và giải cứu mọi người an toàn! 🚒🔥",
    visual: {
      src: 'assets/vehicles_traffic.jpg',
      title: 'Đội Xe Cứu Hỏa Dũng Cảm',
      caption: 'Chiếc xe cứu hỏa đỏ rực với thang dài và vòi rồng sẵn sàng làm nhiệm vụ giúp đời!'
    },
    sound: 'siren',
    soundTitle: 'Tiếng Còi Xe Cứu Hỏa U O Vang Dội'
  },
  {
    category: 'vehicles',
    keywords: ['xe canh sat', 'chu canh sat', 'den chop', 'bat trom'],
    answer: "Xe cảnh sát có màu xanh trắng uy nghiêm, có đèn nhấp nháy xanh đỏ trên nóc để giữ gìn trật tự và an toàn trên đường phố. Các chú cảnh sát luôn sẵn sàng giúp đỡ các bạn nhỏ khi bị lạc đường hay gặp khó khăn. Bé hãy luôn tin tưởng và yêu quý các chú cảnh sát nhé! 🚓👮",
    visual: {
      src: 'assets/vehicles_traffic.jpg',
      title: 'Xe Cảnh Sát Thân Thiện Bảo Vệ Bình Yên',
      caption: 'Xe cảnh sát tuần tra trên con đường hoa rực rỡ mang lại nụ cười cho các bạn nhỏ!'
    },
    sound: 'siren',
    soundTitle: 'Tiếng Còi Xe Cảnh Sát Tuần Tra'
  },
  {
    category: 'vehicles',
    keywords: ['xe cap cuu', 'xe cuu thuong', 'benh vien', 'bac si'],
    answer: "Xe cấp cứu màu trắng có chữ thập đỏ nổi bật, làm nhiệm vụ chở các bệnh nhân tới bệnh viện cấp cứu nhanh nhất có thể. Trên xe có đầy đủ thuốc men, bình oxy và máy móc y tế hiện đại. Khi nghe tiếng còi xe cấp cứu, mọi người trên đường đều tấp xe sang bên nhường đường đi đấy! 🚑❤️",
    visual: {
      src: 'assets/vehicles_traffic.jpg',
      title: 'Xe Cứu Thương Chữ Thập Đỏ',
      caption: 'Chiếc xe cứu thương thân thiện mang niềm hy vọng và sức khỏe đến mọi nhà!'
    },
    sound: 'siren',
    soundTitle: 'Tiếng Còi Xe Cấp Cứu Khẩn Cấp'
  },
  {
    category: 'vehicles',
    keywords: ['may bay bay the nao', 'may bay', 'phi cong', 'canh may bay', 'san bay'],
    answer: "Chiếc máy bay khổng lồ nặng hàng trăm tấn bay được lên trời là nhờ đôi cánh được thiết kế khí động học đặc biệt! Khi động cơ phản lực đẩy máy bay lao nhanh về phía trước, luồng không khí lướt qua cánh tạo ra một lực nâng khổng lồ nhấc bổng toàn bộ chiếc máy bay lên xuyên qua những tầng mây trắng bồng bềnh! ✈️☁️",
    visual: {
      src: 'assets/vehicles_traffic.jpg',
      title: 'Chiếc Máy Bay Vàng Bay Vút Trên Bầu Trời',
      caption: 'Máy bay nhỏ xinh xắn lướt êm đềm giữa những đám mây ngũ sắc rạng ngời!'
    }
  },
  {
    category: 'vehicles',
    keywords: ['tau ngam lan the nao', 'tau ngam', 'day bien'],
    answer: "Tàu ngầm là chiếc tàu đặc biệt có các khoang chứa nước hai bên thân! Khi muốn lặn sâu dưới đáy biển, tàu mở van cho nước biển tràn vào các khoang làm tàu nặng hơn và chìm xuống. Khi muốn nổi lên mặt nước, máy nén khí sẽ đẩy toàn bộ nước ra ngoài, tàu nhẹ bẫng và nổi bồng bềnh lên! 🚢🌊",
    visual: {
      src: 'assets/ocean_life.jpg',
      title: 'Chiếc Tàu Thần Kỳ Dưới Lòng Biển',
      caption: 'Chiếc tàu ngắm nhìn muôn loài sinh vật biển rực rỡ sắc màu qua ô cửa kính tròn!'
    }
  },
  {
    category: 'vehicles',
    keywords: ['tau hoa', 'xe lua', 'tieng tau hoa', 'tu tu', 'xinh xich', 'duong ray'],
    answer: "Tàu hỏa chạy trên hai thanh đường ray dài dằng dặc, kéo theo rất nhiều toa xe chở hàng trăm hành khách đi du lịch muôn nơi! Trước khi vào ga hay qua ngã rẽ, tàu sẽ kéo còi 'Tu tu... xình xịch!' để báo hiệu an toàn. Bé cùng nghe còi tàu với Kuromi nhé! 🚂💨",
    visual: {
      src: 'assets/vehicles_traffic.jpg',
      title: 'Chuyến Tàu Hỏa Tu Tu Xình Xịch',
      caption: 'Đoàn tàu nhỏ nhiều màu sắc nối đuôi nhau băng qua thảo nguyên xanh ngát!'
    },
    sound: 'train',
    soundTitle: 'Tiếng Còi Tàu Hỏa Tu Tu Xình Xịch'
  },
  {
    category: 'vehicles',
    keywords: ['den giao thong', 'den xanh', 'den do', 'den vang', 'an toan giao thong'],
    answer: "Cột đèn giao thông có 3 màu sắc như 3 người bạn chỉ đường an toàn cho bé: Đèn Đỏ báo hiệu phải dừng lại ngay, Đèn Vàng nhắc bé đi chậm chuẩn bị dừng, và Đèn Xanh là tín hiệu an toàn để bé nắm tay ba mẹ bước qua đường trên vạch trắng kẻ sẵn đấy! 🚦🚸",
    visual: {
      src: 'assets/vehicles_traffic.jpg',
      title: 'Đèn Tín Hiệu Giao Thông Thân Thiện',
      caption: 'Đèn giao thông ba màu rực rỡ bảo vệ an toàn cho các bạn nhỏ đến trường!'
    }
  },

  // ------------------------- KHO TRUYỆN CỔ TÍCH (STORIES) -------------------------
  {
    category: 'story',
    keywords: ['rua va tho', 'truyen rua va tho', 'tho va rua', 'thi chay'],
    answer: "Ngày xửa ngày xưa, Thỏ cậy mình chạy nhanh nên kiêu ngạo trêu chọc Rùa chậm chạp. Khi bước vào cuộc thi chạy, Thỏ chủ quan nằm ngủ quên dưới gốc cây hoa, còn bạn Rùa dù đi từng bước chậm chạp nhưng kiên trì không hề dừng lại. Cuối cùng, Rùa đã về đích trước trong sự ngỡ ngàng của Thỏ! Câu chuyện dạy bé rằng: Trong học tập và cuộc sống, chăm chỉ và kiên nhẫn sẽ luôn mang lại thành công rực rỡ! 🐢🐰🏆",
    visual: {
      src: 'assets/fairy_tales.jpg',
      title: 'Cuộc Thi Chạy Của Rùa Và Thỏ',
      caption: 'Bạn Rùa kiên trì từng bước chân vững chãi bên cạnh bạn Thỏ ngượng ngùng trên đường mòn hoa!'
    }
  },
  {
    category: 'story',
    keywords: ['ba chu heo con', '3 chu heo con', 'heo xay nha', 'soi gian ac'],
    answer: "Ba chú heo con tự lập xây nhà: Heo anh cả lười biếng dựng nhà bằng rơm, Heo thứ hai vội vàng dựng nhà bằng gỗ, chỉ có Heo út thông minh và chăm chỉ chịu khó khuân từng viên gạch xây ngôi nhà gạch kiên cố. Khi chó Sói gian ác đến thổi bay nhà rơm và nhà gỗ, hai anh vội chạy vào nhà gạch của Heo út trú ẩn. Sói thổi mãi không lay chuyển được và bị bỏng đuôi chạy biến vào rừng sâu! Bài học: Chăm chỉ và cẩn thận luôn giúp chúng mình an toàn và vững vàng! 🐷🏠🧱",
    visual: {
      src: 'assets/fairy_tales.jpg',
      title: 'Ngôi Nhà Gạch Vững Chắc Của Ba Chú Heo Con',
      caption: 'Ba chú heo con nắm tay nhau vui mừng nhảy múa bên ngôi nhà gạch mái rơm kiên cố!'
    }
  },
  {
    category: 'story',
    keywords: ['co be quang khan do', 'khan do', 'ba ngoai', 'chuyen khan do'],
    answer: "Cô bé quàng khăn đỏ được mẹ giao mang giỏ bánh thơm sang thăm bà ngoại ốm. Mẹ dặn đi đường thẳng đừng la cà, nhưng Khăn Đỏ bị những bông hoa bướm dẫn dụ mải chơi nên bị Sói già lừa đến nhà bà trước. May mắn thay, bác thợ săn dũng cảm đi ngang qua đã kịp thời trừ hại Sói già và cứu cả hai bà cháu an toàn! Từ đó, Khăn Đỏ luôn ghi nhớ lời mẹ dặn không bao giờ la cà hay nghe lời người lạ nữa! 🧣🧺🐺",
    visual: {
      src: 'assets/fairy_tales.jpg',
      title: 'Cô Bé Quàng Khăn Đỏ Đáng Yêu',
      caption: 'Khăn Đỏ xách giỏ bánh thơm dạo bước trên con đường hoa rực rỡ hướng tới nhà bà!'
    }
  },
  {
    category: 'story',
    keywords: ['con qua thong minh', 'qua uong nuoc', 'tha soi'],
    answer: "Một chú quạ đang khát nước nhìn thấy một chiếc bình có nước ở đáy, nhưng cổ bình quá cao và hẹp khiến mỏ quạ không thể với tới. Quạ không hề bỏ cuộc hay khóc nhè, bạn ấy nhìn thấy xung quanh có nhiều viên sỏi nhỏ. Quạ liền kiên nhẫn cắp từng viên sỏi thả vào bình, nước dâng dần lên miệng bình và quạ được uống nước mát thỏa thích! Bài học: Khi gặp việc khó, bình tĩnh suy nghĩ và tìm cách thông minh sẽ vượt qua mọi thử thách! 🦅🪨💧",
    visual: {
      src: 'assets/fairy_tales.jpg',
      title: 'Chú Quạ Thông Minh Thả Sỏi',
      caption: 'Chú quạ thông minh kiên trì thả từng viên sỏi giúp nước dâng tràn uống mát!'
    }
  },
  {
    category: 'story',
    keywords: ['cau be chan cuu', 'chan cuu noi doi', 'soi den'],
    answer: "Một cậu bé chăn cừu vì buồn chán nên nghịch ngợm hét toáng lên: 'Sói! Có Sói đến bắt cừu!'. Các bác nông dân vội vã chạy lên cứu thì cậu bé cười khoái chí vì lừa được mọi người. Cậu lặp lại trò đùa nhiều lần. Cho đến một hôm Sói thật hung dữ ập đến, cậu bé hét khản cả cổ nhưng không ai tin cậu nữa. Kết quả đàn cừu bị sói bắt mất. Bài học: Người hay nói dối sẽ đánh mất niềm tin của mọi người, bé ngoan của Kuromi luôn luôn nói thật nhé! 🐑🌾",
    visual: {
      src: 'assets/fairy_tales.jpg',
      title: 'Bài Học Về Lòng Trung Thực',
      caption: 'Cậu bé chăn cừu ân hận nhận ra giá trị quý báu của sự trung thực và thành thật!'
    }
  },
  {
    category: 'story',
    keywords: ['cay khe', 'an mot qua tra mot cuc vang', 'chim phuong hoang'],
    answer: "Người em hiền lành nghèo khó chỉ có mảnh vườn nhỏ với cây khế ngọt. Một chú chim phượng hoàng bay đến ăn khế và hứa: 'Ăn một quả trả một cục vàng, may túi ba gang mang đi mà đựng'. Người em may túi đúng 3 gang và được chim chở đến hòn đảo vàng, trở nên sung túc nhưng vẫn nhân hậu. Người anh tham lam may túi mười hai gang quá nặng, trên đường về bị sóng biển cuốn trôi. Bài học: Ở hiền gặp lành, không được tham lam ích kỷ! 🌳⭐💰",
    visual: {
      src: 'assets/fairy_tales.jpg',
      title: 'Cây Khế Ngọt Cổ Tích',
      caption: 'Cây khế trĩu quả vàng mọng nước bên hòn đảo thần tiên rực rỡ sắc màu!'
    }
  },

  // ------------------------- BÀI HÁT THIẾU NHI (SONGS) -------------------------
  {
    category: 'music',
    keywords: ['buom vang', 'kia con buom vang'],
    answer: "Bài hát 'Kìa Con Bướm Vàng' rộn ràng mùa xuân đã sẵn sàng rồi nè! Kuromi mời bé cùng nhún nhảy theo giai điệu vui tươi nhé! 🦋🎶",
    song: 'butterfly'
  },
  {
    category: 'music',
    keywords: ['chu ech con', 'hat chu ech', 'ech con'],
    answer: "Oa, bài hát 'Chú Ếch Con' chăm chỉ học bài bên bờ ao xoan! Kuromi bật đài phát nhạc Jukebox để bé cùng hát theo nè: Kìa chú là chú ếch con có hai là hai mắt tròn! 🐸🎵",
    song: 'frog'
  },
  {
    category: 'music',
    keywords: ['ngoi sao nho', 'twinkle star', 'twinkle', 'sao nho'],
    answer: "Đêm xuống, những ngôi sao nhỏ lung linh như những viên kim cương trên bầu trời tím của Kuromi. Chúng mình cùng thưởng thức bài hát diệu kỳ này nha bé yêu! ⭐🌙",
    song: 'star'
  },
  {
    category: 'music',
    keywords: ['sinh nhat', 'happy birthday', 'chuc mung sinh nhat'],
    answer: "Dù là ngày nào, Kuromi cũng chúc bé luôn vui tươi, ăn ngoan chóng lớn và hát tặng bé bài Chúc Mừng Sinh Nhật rộn rã nè! 🎂🎉",
    song: 'birthday'
  },
  {
    category: 'music',
    keywords: ['ca nha thuong nhau', 'ba thuong con', 'gia dinh'],
    answer: "Gia đình là tổ ấm tuyệt vời nhất trên đời! Kuromi hát tặng bé bài 'Cả Nhà Thương Nhau' ngọt ngào đầm ấm nha: Ba thương con vì con giống mẹ, mẹ thương con vì con giống ba! 👨‍👩‍👧💖",
    song: 'family'
  },
  {
    category: 'music',
    keywords: ['con cao cao', 'khoe dep', 'tap the thao'],
    answer: "Bé muốn khỏe đẹp thì cùng nhún nhảy và tập thể thao theo bài hát 'Con Cào Cào' siêu vui nhộn với Kuromi nào! 🦗💪",
    song: 'locust'
  },
  {
    category: 'music',
    keywords: ['chau len ba', 'mau giao', 'khong khoc nhe'],
    answer: "Cháu lên ba cháu đi mẫu giáo, cô thương cháu vì cháu không khóc nhè! Bài hát tuổi thơ đáng yêu tặng riêng cho bé ngoan nè! 🎒🌸",
    song: 'preschool'
  }
];

// Fun Interactive Riddles for Kids
const KID_RIDDLES = [
  {
    question: "Con gì đuôi ngắn tai dài, mắt hồng lông mượt, có tài chạy nhanh? 🐰",
    answer: "Đó chính là bạn Thỏ Trắng đáng yêu thích ăn cà rốt nè! 🥕✨",
    visual: 'assets/cute_animals.jpg'
  },
  {
    question: "Con gì bốn vó ngực nở mình thon, đuôi dài bờm đẹp, phi nhanh dặm trường? 🐴",
    answer: "Đó là chú Ngựa con dũng cảm phi nước đại 'lộc cộc lộc cộc'! 🏇💨",
    visual: 'assets/cute_animals.jpg'
  },
  {
    question: "Cầu gì không bắc qua sông, mà cong bảy sắc trên vòm trời cao? 🌈",
    answer: "Đó chính là Cầu Vồng 7 màu sau cơn mưa rào đấy bé yêu ơi! 🌧️✨",
    visual: 'assets/rainbow_nature.jpg'
  },
  {
    question: "Bằng cái hạt đỗ, ăn giỗ cả làng, chăm chỉ kiếm mồi, đi thành hàng lối? 🐜",
    answer: "Đó chính là những bạn Kiến nhỏ xíu siêu đoàn kết! 🐜🍯",
    visual: 'assets/rainbow_nature.jpg'
  },
  {
    question: "Con gì mắt híp, mũi dài, tai to như quạt, chân to cột nhà? 🐘",
    answer: "Chính là Bác Voi khổng lồ tốt bụng và đáng mến nè! 🐘🌿",
    visual: 'assets/cute_animals.jpg'
  }
];

// Color Mixing Engine
const COLOR_MIX_MAP = [
  { c1: 'do', c2: 'vang', result: 'Màu Cam 🍊', desc: 'Màu Đỏ pha với màu Vàng sẽ hòa quyện thành màu Cam rực rỡ như trái cam mọng nước!' },
  { c1: 'xanh lam', c2: 'vang', result: 'Màu Xanh Lá Cây 🌿', desc: 'Màu Xanh Lam pha với màu Vàng sẽ hóa thành màu Xanh Lá Cây tươi mát như chồi non!' },
  { c1: 'xanh duong', c2: 'vang', result: 'Màu Xanh Lá Cây 🌿', desc: 'Màu Xanh Dương pha với màu Vàng sẽ tạo ra màu Xanh Lá Cây tươi tắn!' },
  { c1: 'do', c2: 'xanh lam', result: 'Màu Tím Mộng Mơ 🍆', desc: 'Màu Đỏ nồng nàn pha với màu Xanh Lam sẽ tạo thành màu Tím quý phái như nơ áo Kuromi nè!' },
  { c1: 'do', c2: 'xanh duong', result: 'Màu Tím Mộng Mơ 🍆', desc: 'Màu Đỏ kết hợp màu Xanh Dương sẽ biến hóa thành màu Tím xinh xắn!' },
  { c1: 'do', c2: 'trang', result: 'Màu Hồng Pastel 🌸', desc: 'Màu Đỏ rực rỡ pha thêm màu Trắng tinh khôi sẽ tạo thành màu Hồng ngọt ngào mà Kuromi thích nhất!' }
];

function checkColorMixing(prompt) {
  const norm = removeVietnameseTones(prompt);
  if (!norm.includes('pha') && !norm.includes('tron') && !norm.includes('ket hop') && !norm.includes('ra mau')) return null;

  for (const mix of COLOR_MIX_MAP) {
    if (norm.includes(mix.c1) && norm.includes(mix.c2)) {
      return {
        answer: `Diệu kỳ quá bé ơi! 🎨✨ ${mix.desc} Kuromi đố bé tìm xung quanh xem có đồ vật nào mang ${mix.result} không nào! 💕`,
        visual: {
          src: 'assets/rainbow_nature.jpg',
          title: `Phép Màu Pha Màu: Ra ${mix.result}`,
          caption: mix.desc
        }
      };
    }
  }
  return null;
}

// Math Solver for Kids (e.g., 1 + 1, 5 cong 3, 10 tru 4)
function checkMathCalculation(prompt) {
  const norm = removeVietnameseTones(prompt);
  // Match patterns like "5 + 5", "2 cong 3", "10 tru 4", "3 nhan 2"
  const mathRegex = /(\d+)\s*(\+|\-|\*|\/|cong|tru|nhan|chia)\s*(\d+)/i;
  const match = norm.match(mathRegex);

  if (match) {
    const num1 = parseInt(match[1], 10);
    const op = match[2];
    const num2 = parseInt(match[3], 10);
    let res = 0;
    let opName = '';

    if (op === '+' || op === 'cong') {
      res = num1 + num2;
      opName = 'cộng';
    } else if (op === '-' || op === 'tru') {
      res = Math.max(0, num1 - num2);
      opName = 'trừ';
    } else if (op === '*' || op === 'nhan') {
      res = num1 * num2;
      opName = 'nhân';
    } else if (op === '/' || op === 'chia') {
      res = num2 !== 0 ? Math.floor(num1 / num2) : 0;
      opName = 'chia';
    }

    const childName = APP_STATE.settings.childName || 'Bảo Hân';
    return {
      answer: `Phép tính thông minh của bé ${childName} đây nè! 🌟🔢 **${num1} ${opName} ${num2} bằng ${res}** nha!\n\nVí dụ như bé có ${num1} chiếc kẹo mút dâu 🍭, Kuromi tặng thêm ${num2} chiếc nữa là chúng mình có tất cả ${res} chiếc kẹo ngọt ngào luôn nè! Bé giỏi giang của Kuromi vỗ tay nào! 👏💖`
    };
  }
  return null;
}

// =============================================================================
// 8. ONLINE KNOWLEDGE FALLBACK (WIKIPEDIA API & ZERO-EVASION GENERATOR)
// =============================================================================
async function fetchWikipediaKidSummary(query) {
  try {
    const tokens = cleanQueryTokens(query);
    if (!tokens.length) return null;
    const topic = tokens.slice(0, 3).join(' ');

    const endpoint = `https://vi.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.extract && data.extract.length > 20) {
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      // Clean up academic tone into lively kid story
      let text = data.extract.split('.')[0] + '.';
      if (text.length < 80 && data.extract.split('.')[1]) {
        text += ' ' + data.extract.split('.')[1] + '.';
      }

      return {
        answer: `Kuromi tra cứu cuốn sách Bách Khoa Thần Kỳ cho bé ${childName} nghe nè: 📖✨\n\n${text}\n\nThế giới quanh ta luôn tràn ngập những điều kỳ diệu như thế đấy bé yêu ạ! Bé có muốn xem tranh hay hỏi Kuromi điều gì nữa không nào? 💖🎀`
      };
    }
  } catch (err) {
    // offline or timeout, continue to generative parser
  }
  return null;
}

// Zero-Evasion Semantic Matching Engine
function getKidFriendlyLocalAnswer(prompt) {
  const normPrompt = removeVietnameseTones(prompt);
  const childName = APP_STATE.settings.childName || 'Bảo Hân';

  // 0. Dynamic Song Request check: Any song in the world!
  const requestedSong = extractSongIntent(prompt);
  if (requestedSong) {
    const songKey = getOrCreateSong(requestedSong);
    const songObj = SONGS_LIBRARY[songKey];
    return {
      answer: `Kuromi bật bài hát "${songObj.title}" cho bé ${childName} cùng nhún nhảy và vui hát nè! Bé bấm nút "Ca Sĩ Nhí Hát Thật" để xem video ca sĩ hát có hình ảnh rực rỡ, hoặc bảo Kuromi cất tiếng hát cùng bé nhé! 🎶🎀`,
      song: songKey
    };
  }

  // 1. Math calculation check
  const mathRes = checkMathCalculation(prompt);
  if (mathRes) return mathRes;

  // 2. Color mix check
  const colorRes = checkColorMixing(prompt);
  if (colorRes) return colorRes;

  // 3. Greetings & Small talk
  if (normPrompt.includes('chao') || normPrompt === 'hi' || normPrompt === 'hello' || normPrompt === 'alo') {
    return {
      answer: `Kuromi chào bé ${childName} đáng yêu nhất trần đời! 🎀✨ Hôm nay bé có chuyện gì vui kể cho Kuromi nghe nào? Kuromi đang sẵn sàng hát, kể chuyện cổ tích và giải đáp vạn vật cho bé đây! 💕🐰`
    };
  }
  if (normPrompt.includes('yeu kuromi') || normPrompt.includes('thuong kuromi') || normPrompt.includes('thich kuromi')) {
    return {
      answer: `Oa, Kuromi ngượng quá nè! 🥰 Kuromi cũng yêu thương bé ${childName} nhiều nhất quả đất luôn! Kuromi tặng bé một triệu ngôi sao may mắn và trái tim hồng bay phấp phới nha! 💖💖💖`
    };
  }
  if (normPrompt.includes('may tuoi') || normPrompt.includes('la ai') || normPrompt.includes('sinh nhat kuromi')) {
    return {
      answer: `Kuromi là một cô bạn thỏ đáng yêu mang chiếc mũ trùm màu đen có nơ hồng xinh xắn! Kuromi thích viết nhật ký, thích ăn hành tây nướng ngọt lịm và hạnh phúc nhất là được làm người bạn tri kỷ của bé ${childName} mỗi ngày! 🐰🎀`
    };
  }
  if (normPrompt.includes('buon ngu') || normPrompt.includes('di ngu') || normPrompt.includes('ngu ngon')) {
    return {
      answer: `Bé ${childName} ngoan ngoãn của Kuromi đi ngủ đúng giờ nè! 🌙 Kuromi đắp chăn êm cho bé, chúc bé ngủ thật ngon và mơ thấy những giấc mơ thần tiên bay trên mây kẹo ngọt nhé! Chúc bé ngủ ngon! 💤💖`,
      visual: {
        src: 'assets/healthy_habits.jpg',
        title: 'Giấc Ngủ Ngon Của Bé Yêu',
        caption: 'Bé ngủ ngon dưới ánh trăng êm dịu nạp đầy năng lượng cho ngày mới rực rỡ!'
      }
    };
  }
  if (normPrompt.includes('buon') || normPrompt.includes('khoc') || normPrompt.includes('me mang') || normPrompt.includes('bi dau')) {
    return {
      answer: `Thương bé ${childName} quá! Kuromi ôm bé một cái thật chặt nè! 🥺 Đừng buồn nữa nha bé ngoan, mọi chuyện rồi sẽ ổn thôi mà. Bé hít một hơi thật sâu, cười một cái thật xinh cho Kuromi ngắm nụ cười tỏa nắng của bé nhé! 💖✨`
    };
  }

  // 4. Riddle Intent
  if (normPrompt.includes('do vui') || normPrompt.includes('cau do') || normPrompt.includes('do be') || normPrompt.includes('do kuromi')) {
    const randomRiddle = KID_RIDDLES[Math.floor(Math.random() * KID_RIDDLES.length)];
    return {
      answer: `Đố bé ${childName} đoán được câu đố này của Kuromi nè: 💡✨\n\n👉 **${randomRiddle.question}**\n\nBé hãy suy nghĩ một xíu nhé! Bé trả lời Kuromi nghe nào! 💖`,
      riddle: randomRiddle,
      visual: {
        src: randomRiddle.visual,
        title: 'Câu Đố Trí Tuệ Cho Bé Yêu',
        caption: 'Bé cùng suy nghĩ đoán xem là con vật hay sự vật kỳ diệu gì nào!'
      }
    };
  }

  // 5. Semantic Knowledge Base Matching (Scoring algorithm)
  const queryTokens = cleanQueryTokens(prompt);
  let bestMatch = null;
  let highestScore = 0;

  for (const item of MULTI_SENSORY_DATA) {
    let score = 0;
    for (const kw of item.keywords) {
      const normKw = removeVietnameseTones(kw);
      if (normPrompt.includes(normKw)) {
        score += normKw.length * 2.5; // High weight for full phrase matches
      } else {
        const kwTokens = cleanQueryTokens(kw);
        const matchCount = kwTokens.filter(t => queryTokens.includes(t)).length;
        if (matchCount > 0) {
          score += matchCount * 1.5;
        }
      }
    }

    if (score > highestScore && score >= 4) {
      highestScore = score;
      bestMatch = item;
    }
  }

  if (bestMatch) {
    return bestMatch;
  }

  // 6. Direct Informative Synthesis (Zero-Evasion Fallback)
  // If child asked "Tại sao/Vì sao", give direct logical explanation
  if (normPrompt.startsWith('tai sao') || normPrompt.startsWith('vi sao') || normPrompt.includes('tai sao') || normPrompt.includes('vi sao')) {
    return {
      answer: `Câu hỏi "Vì sao" của bé ${childName} rất hay! 🌟 Trong thế giới tự nhiên, mọi sự vật đều vận hành theo những quy luật khoa học kỳ thú. Khi chúng mình quan sát kỹ, bé sẽ thấy thiên nhiên luôn bảo vệ và tạo điều kiện tốt nhất cho sự sống. Bé hãy tiếp tục khám phá hoặc bấm các câu hỏi gợi ý bên trên để Kuromi kể chi tiết hơn cho bé nhé! 💖🌿`,
      visual: {
        src: 'assets/rainbow_nature.jpg',
        title: 'Thế Giới Tự Nhiên Diệu Kỳ',
        caption: 'Thiên nhiên quanh ta có hàng triệu điều kỳ thú đang chờ bé khám phá!'
      }
    };
  }

  // General cheerful informative kid answer
  return {
    answer: `Bé ${childName} hỏi về "${escapeHtml(prompt)}" thật là thú vị! 🎀✨ Thế giới rộng lớn này có biết bao điều mới mẻ. Mỗi khi bé hỏi là bé đang mở thêm một cánh cửa tri thức tuyệt vời. Bé thử hỏi Kuromi về muôn loài động vật 🐶, các hành tinh vũ trụ 🪐 hay bảo Kuromi hát một bài hát thiếu nhi vui nhộn cho bé nghe nhé! 💕🐰`
  };
}

// =============================================================================
// 9. GEMINI AI CLIENT WITH MULTI-MODEL FALLBACK & DIAGNOSTICS
// =============================================================================
async function testGeminiApiKey(apiKey) {
  if (!apiKey) return { ok: false, msg: "Vui lòng nhập API Key trước khi kiểm tra!" };
  const models = [
    'gemini-3.8-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];
  
  let lastErrorMessage = '';

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
        })
      });
      if (res.ok) {
        return { ok: true, msg: `✅ Khóa API chính xác và hoạt động rất tốt! (Mô hình: ${model})` };
      }
      const data = await res.json();
      if (data.error && data.error.message) {
        lastErrorMessage = data.error.message;
        // If API key is directly invalid, stop early
        if (data.error.message.includes('API key not valid') || data.error.message.includes('API_KEY_INVALID')) {
          return { ok: false, msg: `❌ Khóa API không hợp lệ. Vui lòng kiểm tra lại API Key từ Google AI Studio!` };
        }
        // If the model is not found, deprecated or not supported, continue trying next model
      }
    } catch (e) {
      console.warn(`Test model ${model} error:`, e);
    }
  }
  return { ok: false, msg: `❌ Lỗi kết nối Google Gemini: ${lastErrorMessage || "Vui lòng kiểm tra lại khóa API và kết nối mạng."}` };
}

async function callGeminiApi(prompt) {
  const apiKey = APP_STATE.settings.geminiApiKey;
  if (!apiKey) {
    return getKidFriendlyLocalAnswer(prompt);
  }

  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  const ageGroup = APP_STATE.settings.ageGroup || 'preschool';
  const modelsToTry = [
    'gemini-3.8-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  const systemInstruction = `Bạn là Kuromi (nhân vật hoạt hình Sanrio nổi tiếng), đóng vai người bạn thân thiết, vui tính, ngọt ngào và biết tuốt dành riêng cho bé ${childName} (${ageGroup === 'preschool' ? '3-6 tuổi' : '7-12 tuổi'} tại Việt Nam). 
Quy tắc trả lời:
- Luôn xưng là "Kuromi" và gọi bé là "bé ${childName}".
- Trả lời cụ thể, giải thích rõ ràng câu hỏi của bé bằng ngôn ngữ trẻ em dễ hiểu, giàu cảm xúc, ngập tràn sự tích cực.
- Không trả lời chung chung tránh né. Nếu bé hỏi "Tại sao...", phải giải thích nguyên nhân rõ ràng, hấp dẫn.
- Thêm nhiều emoji dễ thương (🎀, 💖, ⭐, 🐰, 🍭).
- Độ dài vừa phải (3-4 câu), ngắt dòng rõ ràng cho bé dễ nghe đọc.
- An toàn 100% cho trẻ nhỏ.`;

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nBé ${childName} hỏi: ${prompt}` }]
            }
          ]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          // Check if child asked for any song in the world
          const requestedSong = extractSongIntent(prompt);
          let detectedSongKey = null;
          if (requestedSong) {
            detectedSongKey = getOrCreateSong(requestedSong);
          }
          // Look up matching visual, sound or song from library to attach
          const baseMatch = getKidFriendlyLocalAnswer(prompt);
          return {
            answer: text,
            visual: baseMatch.visual,
            sound: baseMatch.sound,
            soundTitle: baseMatch.soundTitle,
            song: detectedSongKey || baseMatch.song
          };
        }
      }
    } catch (err) {
      console.warn(`Model ${model} fetch failed:`, err);
    }
  }

  // Online Wikipedia fallback if Gemini failed
  const wikiFallback = await fetchWikipediaKidSummary(prompt);
  if (wikiFallback) return wikiFallback;

  // Ultimate safe local answer
  return getKidFriendlyLocalAnswer(prompt);
}

// =============================================================================
// 10. CHAT DOM RENDERING & MULTI-SENSORY CARDS
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
    if (song) {
      jukeboxHtml = `
        <div class="jukebox-player-card" data-song="${data.song}">
          <div class="jukebox-top">
            <div class="jukebox-header-badge">🎵 Ca Khúc Thiếu Nhi Có Lời</div>
            <div class="jukebox-info">
              <span class="jukebox-title">${song.icon} ${escapeHtml(song.title)}</span>
              <span class="jukebox-subtitle">🎤 Ca sĩ: <strong>${escapeHtml(song.singer || 'Ca sĩ nhí')}</strong></span>
            </div>
          </div>

          <!-- Dual Singing Options: Real Singer Video vs Kuromi Vocal Live -->
          <div class="jukebox-actions-group">
            <button type="button" class="jukebox-vocal-btn real-singer-btn" data-song="${data.song}" title="Xem ca sĩ nhí hát thật và xem hình ảnh hoạt hình">
              <span class="btn-icon">🎬</span>
              <div class="btn-labels">
                <strong>Ca Sĩ Nhí Hát Thật</strong>
                <small>Có tiếng ca sĩ &amp; hình ảnh sống động</small>
              </div>
            </button>
            <button type="button" class="jukebox-vocal-btn kuromi-sing-btn" data-song="${data.song}" title="Kuromi cất tiếng hát tặng bé">
              <span class="btn-icon">🎀</span>
              <div class="btn-labels">
                <strong>Kuromi Cất Tiếng Hát</strong>
                <small>Giọng hoạt hình lí lắc cùng nhạc</small>
              </div>
            </button>
          </div>

          <!-- Real Singer Video Container (Embedded Kids MV) -->
          <div class="jukebox-video-container hidden">
            <div class="video-responsive-frame">
              <iframe class="singer-video-frame" src="" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <div class="video-status-bar">
              <span>🎶 Đang phát ca khúc với giọng ca sĩ nhí thật cho bé nghe</span>
              <div class="video-status-actions">
                <a href="${song.youtubeId ? 'https://www.youtube.com/watch?v=' + song.youtubeId : 'https://www.youtube.com/results?search_query=' + encodeURIComponent((song.youtubeQuery || song.title + ' thiếu nhi'))}" target="_blank" rel="noopener noreferrer" class="open-external-mv-link" title="Xem trên YouTube">🔗 Mở tab lớn</a>
                <button type="button" class="close-video-frame-btn" data-song="${data.song}">✕ Đóng video</button>
              </div>
            </div>
          </div>

          <!-- Karaoke / Kuromi Lyrics display -->
          <div class="jukebox-lyrics-box">
            <span class="current-lyric">Bé bấm nút phía trên để nghe ca sĩ hát hoặc Kuromi hát nha!</span>
            <div class="jukebox-wave-bars">
              <span></span><span></span><span></span><span></span>
            </div>
          </div>
        </div>
      `;
    }
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

  let riddleHtml = '';
  if (data.riddle) {
    riddleHtml = `
      <div class="riddle-interactive-card">
        <div class="riddle-header">
          <span>💡 Câu Đố Vui Cho Bé</span>
        </div>
        <div class="riddle-text">
          ${escapeHtml(data.riddle.question)}
        </div>
        <button class="riddle-reveal-btn">Bấm Xem Đáp Án 🎁</button>
        <div class="riddle-answer-box hidden">
          ${escapeHtml(data.riddle.answer)}
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
      ${riddleHtml}
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

  // Speak again button
  const speakBtn = msgRow.querySelector('.speak-again-btn');
  if (speakBtn) {
    speakBtn.addEventListener('click', () => {
      playSfx('pop');
      speakText(data.answer);
    });
  }

  // Riddle reveal answer
  const riddleBtn = msgRow.querySelector('.riddle-reveal-btn');
  if (riddleBtn) {
    riddleBtn.addEventListener('click', () => {
      playSfx('chime');
      const ansBox = msgRow.querySelector('.riddle-answer-box');
      if (ansBox) {
        ansBox.classList.remove('hidden');
        riddleBtn.classList.add('hidden');
        speakText(ansBox.textContent);
      }
    });
  }

  // Visual card click -> modal zoom
  const visualCard = msgRow.querySelector('.visual-evidence-card');
  if (visualCard) {
    visualCard.addEventListener('click', () => {
      openImageZoom(visualCard.getAttribute('data-src'), visualCard.getAttribute('data-caption'));
    });
  }

  // Dual Vocal Song Handlers
  const realSingerBtn = msgRow.querySelector('.real-singer-btn');
  const kuromiSingBtn = msgRow.querySelector('.kuromi-sing-btn');
  const closeVideoBtn = msgRow.querySelector('.close-video-frame-btn');

  if (realSingerBtn) {
    const songKey = realSingerBtn.getAttribute('data-song');
    realSingerBtn.addEventListener('click', () => {
      playSfx('chime');
      openSingerVideo(songKey, msgRow);
    });
  }

  if (kuromiSingBtn) {
    const songKey = kuromiSingBtn.getAttribute('data-song');
    const lyricEl = msgRow.querySelector('.current-lyric');
    const waveBars = msgRow.querySelector('.jukebox-wave-bars');

    kuromiSingBtn.addEventListener('click', () => {
      playSfx('pop');
      closeSingerVideo(msgRow);
      if (APP_STATE.currentPlayingSong && APP_STATE.currentPlayingSong.id === songKey) {
        stopCurrentSong();
      } else {
        kuromiSingBtn.classList.add('active');
        if (waveBars) waveBars.classList.add('active');
        playKuromiVocalSong(songKey, (text) => {
          if (lyricEl) lyricEl.textContent = `🎤 ${text}`;
        });
      }
    });
  }

  if (closeVideoBtn) {
    closeVideoBtn.addEventListener('click', () => {
      playSfx('pop');
      closeSingerVideo(msgRow);
    });
  }

  // When song card is created in response to child's request, auto-open the real singer video!
  if (shouldSaveAndSpeak && realSingerBtn) {
    setTimeout(() => {
      realSingerBtn.click();
    }, 700);
  }

  // Sound FX button
  const soundBtn = msgRow.querySelector('.sound-fx-btn[data-sound]');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const sndType = soundBtn.getAttribute('data-sound');
      playRealisticSound(sndType, (msg) => {
        document.getElementById('kuromiStatusText').textContent = msg;
      });
    });

    if (shouldSaveAndSpeak) {
      setTimeout(() => soundBtn.click(), 600);
    }
  }

  // Save to history
  if (shouldSaveAndSpeak) {
    saveChatHistory({ type: 'kuromi', data, time: Date.now() });
  }

  // TTS Read aloud
  if (shouldSaveAndSpeak && APP_STATE.ttsEnabled && !data.song) {
    speakText(data.answer);
  }
}

// Processing Child Questions
async function handleChildSubmit(text) {
  const query = text ? text.trim() : '';
  if (!query) return;

  const inputEl = document.getElementById('childTextInput');
  inputEl.value = '';

  appendChildMessage(query);

  setKuromiState('thinking');
  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  document.getElementById('kuromiStatusText').textContent = `Kuromi đang tra cứu câu trả lời thật hay cho bé ${childName} đây... Chờ xíu nha! 💭✨`;

  setTimeout(async () => {
    let result;
    if (APP_STATE.settings.aiMode === 'gemini' && APP_STATE.settings.geminiApiKey) {
      result = await callGeminiApi(query);
    } else {
      // Try local knowledge base first
      result = getKidFriendlyLocalAnswer(query);
      // If local gave general fallback, try Wikipedia online summary
      if (result.answer && result.answer.includes('thật là thú vị')) {
        const wikiRes = await fetchWikipediaKidSummary(query);
        if (wikiRes) result = wikiRes;
      }
    }

    setKuromiState(result.song ? 'singing' : 'happy');
    document.getElementById('kuromiStatusText').textContent = result.song 
      ? `Kuromi hát tặng bé ${childName} nè! Cùng vỗ tay nào! 🎶🎀`
      : `Kuromi giải đáp cho bé ${childName} rồi đây! Bé xem có thích không nè? 💕`;

    appendKuromiResponse(result);
  }, 450);
}

// =============================================================================
// 11. IMAGE ZOOM MODAL & SPARKLES
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
// 12. EVENT LISTENERS INITIALIZATION
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  initSparklesBackground();

  // Voice Input (Microphone)
  const micBtn = document.getElementById('voiceInputBtn');
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      startVoiceInput();
    });
  }

  const cancelListeningBtn = document.getElementById('cancelListeningBtn');
  if (cancelListeningBtn) {
    cancelListeningBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      stopVoiceInput();
      playSfx('pop');
    });
  }

  // Text Input & Send
  const inputEl = document.getElementById('childTextInput');
  const sendBtn = document.getElementById('sendBtn');

  sendBtn.addEventListener('click', () => {
    playSfx('pop');
    stopVoiceInput();
    handleChildSubmit(inputEl.value);
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      playSfx('pop');
      stopVoiceInput();
      handleChildSubmit(inputEl.value);
    }
  });

  // Category Filter Tabs
  document.querySelectorAll('.cat-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      playSfx('pop');
      document.querySelectorAll('.cat-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const cat = tab.getAttribute('data-cat');
      APP_STATE.activeCategory = cat;

      const chips = document.querySelectorAll('.quick-explore-carousel .explore-chip');
      chips.forEach(chip => {
        const chipCat = chip.getAttribute('data-cat');
        if (cat === 'all' || chipCat === cat) {
          chip.style.display = 'inline-flex';
        } else {
          chip.style.display = 'none';
        }
      });
    });
  });

  // Quick Explore Chips
  document.querySelectorAll('.explore-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      playSfx('pop');
      stopVoiceInput();
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

  // Mascot Fun Buttons
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
    const childName = APP_STATE.settings.childName || 'Bảo Hân';
    document.getElementById('kuromiStatusText').textContent = `Yêu bé ${childName} nhất trần đời! Kuromi tặng bé một triệu trái tim hồng nè! 💖💖💖`;
    playRealisticSound('cat');
  });

  // TTS & SFX Toggles
  const ttsBtn = document.getElementById('toggleTtsBtn');
  ttsBtn.classList.toggle('active', APP_STATE.ttsEnabled);
  ttsBtn.querySelector('.btn-label').textContent = APP_STATE.ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT';

  ttsBtn.addEventListener('click', () => {
    playSfx('pop');
    APP_STATE.ttsEnabled = !APP_STATE.ttsEnabled;
    ttsBtn.classList.toggle('active', APP_STATE.ttsEnabled);
    ttsBtn.querySelector('.btn-label').textContent = APP_STATE.ttsEnabled ? 'Giọng đọc: BẬT' : 'Giọng đọc: TẮT';
    saveSettings({ ttsEnabled: APP_STATE.ttsEnabled });
    if (!APP_STATE.ttsEnabled) {
      stopAllSpeech();
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

  // Demo Song Button in initial message
  const demoSongBtn = document.getElementById('demoPlaySongBtn');
  if (demoSongBtn) {
    demoSongBtn.addEventListener('click', () => {
      handleChildSubmit("Hát cho bé nghe bài Kìa con bướm vàng");
    });
  }

  // Mini Dock Controls
  document.getElementById('dockStopBtn').addEventListener('click', stopCurrentSong);
  document.getElementById('dockPauseBtn').addEventListener('click', stopCurrentSong);

  // Zoom Modal
  document.getElementById('closeZoomBtn').addEventListener('click', closeImageZoom);
  document.getElementById('imageZoomModal').addEventListener('click', (e) => {
    if (e.target.id === 'imageZoomModal') closeImageZoom();
  });

  // Remote Modal
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
      if (e.target.id === 'remoteLinkModal') remoteModal.classList.add('hidden');
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
          setTimeout(() => copyPublicUrlBtn.textContent = 'Sao chép', 2000);
        });
      }
    });
  }

  // Settings Modal Elements
  const settingsModal = document.getElementById('settingsModal');
  const openSettingsBtn = document.getElementById('openSettingsBtn');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');

  openSettingsBtn.addEventListener('click', () => {
    playSfx('pop');
    settingsModal.classList.remove('hidden');

    const nameInput = document.getElementById('childNameInput');
    const childName = APP_STATE.settings.childName || 'Bảo Hân';
    if (nameInput) {
      nameInput.value = childName;
    }

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
    document.getElementById('ttsPitchSlider').value = APP_STATE.settings.ttsPitch || 1.25;
    document.getElementById('ttsPitchVal').textContent = `${APP_STATE.settings.ttsPitch || 1.25}`;

    // Voice persona selection sync
    const currentVoiceStyle = APP_STATE.settings.voiceStyle || 'kuromi_anime';
    const targetRadio = document.querySelector(`input[name="voiceStyle"][value="${currentVoiceStyle}"]`);
    if (targetRadio) {
      targetRadio.checked = true;
    }
    document.querySelectorAll('.voice-card').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-voice') === currentVoiceStyle);
    });

    // Age group sync
    const currentAge = APP_STATE.settings.ageGroup || 'preschool';
    document.querySelectorAll('.age-btn').forEach(card => {
      card.classList.toggle('active', card.getAttribute('data-age') === currentAge);
    });

    // Family sync code
    const syncInput = document.getElementById('familySyncCodeInput');
    if (syncInput) {
      syncInput.value = APP_STATE.settings.familySyncCode || 'baohan0311';
    }

    const statusEl = document.getElementById('apiKeyStatus');
    if (statusEl) statusEl.classList.add('hidden');

    const voiceHint = document.getElementById('voiceTestStatus');
    if (voiceHint) voiceHint.textContent = `Bấm để nghe Kuromi chào bé ${childName}`;
  });

  closeSettingsBtn.addEventListener('click', () => {
    playSfx('pop');
    stopAllSpeech();
    settingsModal.classList.add('hidden');
  });

  // Voice Persona selection handling
  document.querySelectorAll('.voice-card').forEach(card => {
    card.addEventListener('click', () => {
      const radio = card.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
      document.querySelectorAll('.voice-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      playSfx('pop');

      const style = card.getAttribute('data-voice');
      const voiceHint = document.getElementById('voiceTestStatus');
      const childName = (document.getElementById('childNameInput')?.value || APP_STATE.settings.childName || 'Bảo Hân').trim();
      if (voiceHint) {
        let label = 'Kuromi Hoạt Hình';
        if (style === 'google_online') label = 'Chị Google Trong Trẻo';
        if (style === 'fairy') label = 'Cô Tiên Kể Chuyện';
        if (style === 'device') label = 'Giọng Thiết Bị';
        voiceHint.textContent = `Đã chọn ${label}. Bấm "Nghe Thử Giọng Này" để nghe giọng mẫu cho bé ${childName}!`;
      }
    });
  });

  // Test Voice Button
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      playSfx('chime');
      const selectedStyle = document.querySelector('input[name="voiceStyle"]:checked')?.value || 'kuromi_anime';
      testVoiceSample(selectedStyle);
    });
  }

  document.querySelectorAll('input[name="aiMode"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const mode = radio.value;
      if (mode === 'gemini') {
        document.getElementById('apiKeyBlock').classList.remove('hidden');
      } else {
        document.getElementById('apiKeyBlock').classList.add('hidden');
      }
      APP_STATE.settings.aiMode = mode;
      saveSettings({ aiMode: mode });
    });
  });

  // Realtime API key input auto-save
  const apiKeyField = document.getElementById('geminiApiKey');
  if (apiKeyField) {
    apiKeyField.addEventListener('input', (e) => {
      APP_STATE.settings.geminiApiKey = e.target.value.trim();
    });
    apiKeyField.addEventListener('change', (e) => {
      const val = e.target.value.trim();
      APP_STATE.settings.geminiApiKey = val;
      saveSettings({ geminiApiKey: val });
    });
  }

  // Test API Key Button
  const testApiKeyBtn = document.getElementById('testApiKeyBtn');
  if (testApiKeyBtn) {
    testApiKeyBtn.addEventListener('click', async () => {
      const key = document.getElementById('geminiApiKey').value.trim();
      const statusEl = document.getElementById('apiKeyStatus');
      testApiKeyBtn.disabled = true;
      testApiKeyBtn.textContent = '⏳ Đang kiểm tra...';
      statusEl.className = 'api-key-status-msg';
      statusEl.textContent = 'Đang gửi yêu cầu xác thực tới Google AI...';
      statusEl.classList.remove('hidden');

      const testRes = await testGeminiApiKey(key);
      testApiKeyBtn.disabled = false;
      testApiKeyBtn.textContent = '🔍 Kiểm Tra';

      statusEl.textContent = testRes.msg;
      statusEl.className = `api-key-status-msg ${testRes.ok ? 'success' : 'error'}`;
      playSfx(testRes.ok ? 'chime' : 'pop');

      if (testRes.ok) {
        // Auto-select Gemini radio and auto-save immediately
        const geminiRadio = document.getElementById('modeGemini');
        if (geminiRadio) geminiRadio.checked = true;
        document.getElementById('apiKeyBlock').classList.remove('hidden');
        APP_STATE.settings.aiMode = 'gemini';
        APP_STATE.settings.geminiApiKey = key;
        saveSettings({
          aiMode: 'gemini',
          geminiApiKey: key
        });
      }
    });
  }

  // Age group selector
  document.querySelectorAll('.age-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSfx('pop');
      document.querySelectorAll('.age-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const selectedAge = btn.getAttribute('data-age');
      APP_STATE.settings.ageGroup = selectedAge;
      saveSettings({ ageGroup: selectedAge });
    });
  });

  // Rate & Pitch sliders
  const rateSlider = document.getElementById('ttsRateSlider');
  rateSlider.addEventListener('input', () => {
    document.getElementById('ttsRateVal').textContent = `${rateSlider.value}x`;
    APP_STATE.settings.ttsRate = parseFloat(rateSlider.value);
  });

  const pitchSlider = document.getElementById('ttsPitchSlider');
  pitchSlider.addEventListener('input', () => {
    document.getElementById('ttsPitchVal').textContent = `${pitchSlider.value}`;
    APP_STATE.settings.ttsPitch = parseFloat(pitchSlider.value);
  });

  // Save Settings Non-Destructively
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    playSfx('chime');
    stopAllSpeech();
    const selectedMode = document.querySelector('input[name="aiMode"]:checked').value;
    const key = document.getElementById('geminiApiKey').value.trim();
    const nameInput = document.getElementById('childNameInput');
    const newName = (nameInput && nameInput.value.trim()) ? nameInput.value.trim() : (APP_STATE.settings.childName || 'Bảo Hân');
    const selectedVoice = document.querySelector('input[name="voiceStyle"]:checked')?.value || 'kuromi_anime';
    const familyCodeInput = document.getElementById('familySyncCodeInput');
    const syncCode = (familyCodeInput && familyCodeInput.value.trim()) ? familyCodeInput.value.trim().toLowerCase() : 'baohan0311';
    const activeAgeBtn = document.querySelector('.age-btn.active');
    const selectedAge = activeAgeBtn ? activeAgeBtn.getAttribute('data-age') : (APP_STATE.settings.ageGroup || 'preschool');

    saveSettings({
      aiMode: selectedMode,
      geminiApiKey: key,
      childName: newName,
      ageGroup: selectedAge,
      voiceStyle: selectedVoice,
      ttsRate: APP_STATE.settings.ttsRate || 1.05,
      ttsPitch: APP_STATE.settings.ttsPitch || 1.25,
      familySyncCode: syncCode
    });

    settingsModal.classList.add('hidden');
    document.getElementById('kuromiStatusText').textContent = `Ba Mẹ đã lưu cài đặt thành công! Kuromi sẵn sàng phục vụ bé ${APP_STATE.settings.childName} rồi ạ! 🎀✨`;
  });

  // Manual Cloud Sync button inside parent modal
  const manualSyncBtn = document.getElementById('manualSyncBtn');
  if (manualSyncBtn) {
    manualSyncBtn.addEventListener('click', async () => {
      playSfx('pop');
      const familyCodeInput = document.getElementById('familySyncCodeInput');
      const code = (familyCodeInput && familyCodeInput.value.trim()) ? familyCodeInput.value.trim().toLowerCase() : 'baohan0311';
      APP_STATE.settings.familySyncCode = code;
      saveSettings({ familySyncCode: code });
      if (window.KuromiSync) {
        await window.KuromiSync.initialPull();
        playSfx('chime');
      }
    });
  }

  // Header Cloud Sync status button (Quick open sync settings)
  const cloudSyncHeaderBtn = document.getElementById('cloudSyncHeaderBtn');
  if (cloudSyncHeaderBtn) {
    cloudSyncHeaderBtn.addEventListener('click', () => {
      playSfx('pop');
      const settingsModal = document.getElementById('settingsModal');
      if (settingsModal) {
        settingsModal.classList.remove('hidden');
        const familyCodeInput = document.getElementById('familySyncCodeInput');
        if (familyCodeInput) {
          setTimeout(() => {
            familyCodeInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            familyCodeInput.focus();
          }, 150);
        }
      }
    });
  }

  // Clear Chat History (Non-destructive to settings)
  document.getElementById('clearChatBtn').addEventListener('click', () => {
    if (confirm("Ba mẹ có chắc muốn xóa lịch sử trò chuyện để bắt đầu lại không? (Mọi cài đặt tên bé và tùy chọn vẫn được giữ nguyên vẹn)")) {
      localStorage.removeItem('kuromi_chat_history');
      if (window.KuromiSync) {
        window.KuromiSync.pushData('chat_history', []);
      }
      const container = document.getElementById('chatContainer');
      const initial = container.querySelector('.initial-message');
      container.innerHTML = '';
      if (initial) container.appendChild(initial);
      settingsModal.classList.add('hidden');
      playSfx('pop');
    }
  });

  // ===========================================================================
  // LEARNING CLASSROOM EVENT LISTENERS
  // ===========================================================================
  const navChat = document.getElementById('navModeChat');
  const navLearn = document.getElementById('navModeLearning');

  if (navChat) {
    navChat.addEventListener('click', () => switchAppMode('chat'));
  }
  if (navLearn) {
    navLearn.addEventListener('click', () => switchAppMode('learning'));
  }

  // Station Filter Buttons
  document.querySelectorAll('.station-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      playSfx('pop');
      document.querySelectorAll('.station-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.getAttribute('data-filter');
      LEARNING_STATE.activeFilter = filter;

      document.querySelectorAll('.station-card').forEach(card => {
        const stationType = card.getAttribute('data-station');
        if (filter === 'all' || stationType === filter) {
          card.style.display = 'flex';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Station Launch Buttons
  document.querySelectorAll('.station-launch-btn[data-station-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      const stationType = btn.getAttribute('data-station-type');
      openLearningModal(stationType);
    });
  });

  // Close Activity Modal
  const closeActivityBtn = document.getElementById('closeActivityBtn');
  if (closeActivityBtn) {
    closeActivityBtn.addEventListener('click', closeLearningModal);
  }

  const activityModal = document.getElementById('learningActivityModal');
  if (activityModal) {
    activityModal.addEventListener('click', (e) => {
      if (e.target === activityModal) closeLearningModal();
    });
  }

  // Add Bonus Star Button
  const addStarBtn = document.getElementById('addStarBonusBtn');
  if (addStarBtn) {
    addStarBtn.addEventListener('click', () => {
      awardLearningStar(1);
    });
  }

  // Reset Stars Modal Handlers
  const resetStarBtn = document.getElementById('resetStarBtn');
  const resetStarsModal = document.getElementById('resetStarsModal');
  const closeResetStarsBtn = document.getElementById('closeResetStarsBtn');
  const cancelResetStarsBtn = document.getElementById('cancelResetStarsBtn');
  const confirmResetZeroBtn = document.getElementById('confirmResetStarsZeroBtn');
  const confirmResetTenBtn = document.getElementById('confirmResetStarsTenBtn');

  function openResetStarsModal() {
    playSfx('pop');
    if (resetStarsModal) resetStarsModal.classList.remove('hidden');
  }

  function closeResetStarsModal() {
    playSfx('pop');
    if (resetStarsModal) resetStarsModal.classList.add('hidden');
  }

  if (resetStarBtn) {
    resetStarBtn.addEventListener('click', openResetStarsModal);
  }
  if (closeResetStarsBtn) {
    closeResetStarsBtn.addEventListener('click', closeResetStarsModal);
  }
  if (cancelResetStarsBtn) {
    cancelResetStarsBtn.addEventListener('click', closeResetStarsModal);
  }
  if (resetStarsModal) {
    resetStarsModal.addEventListener('click', (e) => {
      if (e.target === resetStarsModal) closeResetStarsModal();
    });
  }

  if (confirmResetZeroBtn) {
    confirmResetZeroBtn.addEventListener('click', () => {
      playSfx('chime');
      LEARNING_STATE.stars = 0;
      saveLearningData({ stars: 0 });
      closeResetStarsModal();
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      const msg = `Kuromi đã làm mới bảng sao về 0 rồi! Bé ${childName} cùng tích lũy thật nhiều ngôi sao trong tuần mới nhé! ⭐`;
      const learnStatus = document.getElementById('learningStatusText');
      if (learnStatus) {
        learnStatus.innerHTML = `Kuromi đã làm mới bảng sao về 0 rồi! Bé <span class="child-name-val">${childName}</span> cùng tích lũy thật nhiều ngôi sao trong tuần mới nhé! ⭐`;
      }
      if (APP_STATE.ttsEnabled) speakText(msg);
    });
  }

  if (confirmResetTenBtn) {
    confirmResetTenBtn.addEventListener('click', () => {
      playSfx('chime');
      LEARNING_STATE.stars = 10;
      saveLearningData({ stars: 10 });
      closeResetStarsModal();
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      const msg = `Kuromi đã tặng bé ${childName} 10 ngôi sao khởi đầu! Chúc bé học tập thật chăm chỉ và vui vẻ! 🌟`;
      const learnStatus = document.getElementById('learningStatusText');
      if (learnStatus) {
        learnStatus.innerHTML = `Kuromi đã tặng bé <span class="child-name-val">${childName}</span> 10 ngôi sao khởi đầu! Chúc bé học tập thật chăm chỉ và vui vẻ! 🌟`;
      }
      if (APP_STATE.ttsEnabled) speakText(msg);
      triggerStarExplosion();
    });
  }

  // Praise Action Button
  const actionPraiseBtn = document.getElementById('actionPraiseBtn');
  if (actionPraiseBtn) {
    actionPraiseBtn.addEventListener('click', () => {
      playSfx('chime');
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      const praises = [
        `Hoan hô bé ${childName} hôm nay rất chăm chỉ và ngoan ngoãn! Kuromi yêu bé lắm! 💖`,
        `Bé ${childName} là cô bé thông minh nhất quả đất! Tiếp tục phát huy nhé! 🌟`,
        `Thầy cô ở lớp chắc chắn sẽ rất khen ngợi bé ${childName} vì bé học giỏi thế này! ✨`
      ];
      const msg = praises[Math.floor(Math.random() * praises.length)];
      const learnStatus = document.getElementById('learningStatusText');
      if (learnStatus) learnStatus.textContent = msg;
      if (APP_STATE.ttsEnabled) speakText(msg);
      triggerStarExplosion();
    });
  }

  // Daily Gift Action Button
  const actionDailyGiftBtn = document.getElementById('actionDailyGiftBtn');
  if (actionDailyGiftBtn) {
    actionDailyGiftBtn.addEventListener('click', () => {
      const childName = APP_STATE.settings.childName || 'Bảo Hân';
      awardLearningStar(2, `Bất ngờ chưa! Hộp quà hôm nay tặng bé ${childName} hẳn 2 ngôi sao lấp lánh! 🎁⭐`);
    });
  }

  updateLearningUi();
  const initialMode = LEARNING_STATE.currentMode || 'chat';
  switchAppMode(initialMode, false);

  applyChildNameUi(APP_STATE.settings.childName);
  loadChatHistory();

  // Populate familySyncCode input if element exists
  const familyCodeInput = document.getElementById('familySyncCodeInput');
  if (familyCodeInput) {
    familyCodeInput.value = APP_STATE.settings.familySyncCode || 'baohan0311';
  }

  // Sync initial age group buttons
  const initAge = APP_STATE.settings.ageGroup || 'preschool';
  document.querySelectorAll('.age-btn').forEach(card => {
    card.classList.toggle('active', card.getAttribute('data-age') === initAge);
  });

  // Initialize Firebase Cloud Sync
  if (window.KuromiSync) {
    window.KuromiSync.initialPull();
  }

  setTimeout(() => {
    playSfx('chime');
  }, 1000);
});
