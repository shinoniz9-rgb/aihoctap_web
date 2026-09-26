/**
 * KUROMI AI BOT FOR KIDS - 100% GOOGLE GEMINI AI CLOUD INTELLIGENCE
 * Pure Gemini AI Engine, Web Audio Jukebox, Vietnamese Studio TTS & Kids Learning
 */

// =============================================================================
// 1. GLOBAL STATE & SETTINGS (NON-DESTRUCTIVE SAFE MERGE - 100% GEMINI AI)
// =============================================================================
const DEFAULT_SETTINGS = {
  childName: 'Bảo Hân',
  aiMode: 'gemini', // 100% Google Gemini AI Siêu Trí Tuệ Trực Tuyến
  geminiApiKey: '',
  ageGroup: 'primary', // 'preschool' (3-6) or 'primary' (7-12)
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
      // Nâng cấp bảo toàn: Bắt buộc 100% Gemini Cloud AI, loại bỏ hoàn toàn chế độ nội bộ
      parsed.aiMode = 'gemini';
      if (parsed.geminiApiKey && parsed.geminiApiKey.startsWith('AQ.Ab8')) {
        parsed.geminiApiKey = '';
      }
      return { ...DEFAULT_SETTINGS, ...parsed, aiMode: 'gemini' };
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

        // Sync Gemini API Key
        const apiKeyField = document.getElementById('geminiApiKey');
        if (apiKeyField && effectiveKey) apiKeyField.value = effectiveKey;
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
    youtubeId: 'UL4lDzpz6yk',
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
    youtubeId: 'k8Qv36HebWY',
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
    youtubeId: 'SIZl1_d17uo',
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
    youtubeId: '3TQqcORbt6c',
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
    youtubeId: 'oTW2jBkLnHE',
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
    youtubeId: 'pw6rw2_ZhCU',
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
    youtubeId: '5dmAgpLJK7E',
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
    singer: 'Cao Lê Hà Trang',
    youtubeId: 'QMW4M-03wBo',
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
    youtubeId: 'YqVUlQ5Ls1U',
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
    youtubeId: 'd_oNWvY8QVA',
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
    youtubeId: '_WPF__SVBn0',
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
    youtubeId: 'OcIALhFrt-Q',
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
    youtubeId: 'GhZML0HSli8',
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
    singer: 'Ngọc Lễ & Phương Thảo',
    youtubeId: 'CIj9kO9IgzQ',
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
  },
  'meo': {
    id: 'meo',
    title: 'Rửa Mặt Như Mèo',
    category: 'Bài hát thiếu nhi',
    singer: 'Bé Xuân Mai',
    youtubeId: 'yC9MpeW8qfY',
    icon: '🐱',
    bpm: 130,
    lyrics: [
      { text: "Meo meo meo, rửa mặt như mèo 🐱", duration: 3.5 },
      { text: "Xấu xấu lắm chẳng được mẹ yêu! 💖", duration: 3.5 },
      { text: "Khăn mặt đâu mà ngồi liếm láp ✨", duration: 3.5 },
      { text: "Đau mắt rồi lại khóc meo meo! 😿", duration: 3.5 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 },
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'C4', dur: 1.0 }
    ]
  },
  'alibaba': {
    id: 'alibaba',
    title: 'Alibaba',
    category: 'Vui nhộn',
    singer: 'Bé Xuân Mai',
    youtubeId: 'Fu0IT5oRx7Q',
    icon: '👳‍♂️',
    bpm: 135,
    lyrics: [
      { text: "Khi xưa Alibaba như vầng trăng sáng chiếu trên trần gian 🌙", duration: 4.0 },
      { text: "Hôm nay Alibaba như làn mây ấm phiêu du ngàn nơi ✨", duration: 4.0 },
      { text: "Alibaba, Alibaba, vui tươi đáng yêu ngàn đời! 💖", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 0.5 }
    ]
  },
  'chiongnau': {
    id: 'chiongnau',
    title: 'Chị Ong Nâu Và Em Bé',
    category: 'Bài hát thiếu nhi',
    singer: 'Mầm Chồi Lá',
    youtubeId: 'S5VJ1CWHzO4',
    icon: '🐝',
    bpm: 125,
    lyrics: [
      { text: "Chị ong nâu nâu nâu nâu, chị bay đi đâu đi đâu? 🐝", duration: 4.0 },
      { text: "Bác gà trống mới gáy, ông mặt trời mới dậy ☀️", duration: 4.0 },
      { text: "Mà trên những cành hoa em đã thấy chị bay 🌸", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 1.0 }
    ]
  },
  'doithuyen': {
    id: 'doithuyen',
    title: 'Em Đi Chơi Thuyền',
    category: 'Bài hát thiếu nhi',
    singer: 'Bé Xuân Mai',
    youtubeId: 'MrIo8gZ7tSw',
    icon: '⛵',
    bpm: 120,
    lyrics: [
      { text: "Em đi chơi thuyền trong thảo cầm viên ⛵", duration: 3.5 },
      { text: "Chim kêu hót mừng chào đón xuân về 🌸", duration: 3.5 },
      { text: "Thuyền con vịt nó bơi bơi bơi, thuyền con rồng nó bay bay bay! 🦆", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 1.0 }
    ]
  },
  'traidatnay': {
    id: 'traidatnay',
    title: 'Trái Đất Này Là Của Chúng Mình',
    category: 'Hòa bình & Bạn bè',
    singer: 'Bé Mai Vy',
    youtubeId: '6_fMOEtzgU8',
    icon: '🌍',
    bpm: 125,
    lyrics: [
      { text: "Trái đất này là của chúng mình 🌍", duration: 3.5 },
      { text: "Quả bóng xanh bay giữa trời xanh 🎈", duration: 3.5 },
      { text: "Bồ câu ơi tiếng chim gù thương mến, hải âu ơi cánh chim vờn sóng biển! 🕊️", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 1.0 }
    ]
  },
  'concobebe': {
    id: 'concobebe',
    title: 'Con Cò Bé Bé',
    category: 'Đồng dao tuổi thơ',
    singer: 'Bé Xuân Mai',
    youtubeId: 'jO2vrSXVDo0',
    icon: '🕊️',
    bpm: 120,
    lyrics: [
      { text: "Con cò bé bé nó đậu cành tre 🕊️", duration: 3.5 },
      { text: "Đi không hỏi mẹ biết đi đường nào 🌿", duration: 3.5 },
      { text: "Khi đi em hỏi, khi về em chào, miệng em chúm chím mẹ có yêu không nào! 💖", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 }
    ]
  },
  'thangcuoi': {
    id: 'thangcuoi',
    title: 'Thằng Cuội',
    category: 'Đồng dao cổ tích',
    singer: 'Ca sĩ thiếu nhi',
    youtubeId: '_8r2T85vVz0',
    icon: '🌙',
    bpm: 110,
    lyrics: [
      { text: "Bóng trăng trắng ngà, có cây đa to 🌙", duration: 3.5 },
      { text: "Có thằng Cuội già, ôm một mối mơ 🌟", duration: 3.5 },
      { text: "Gió mây cùng đùa, trăng sáng lung linh khắp trần gian! ✨", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'A4', dur: 1.0 }
    ]
  },
  'chimvanhkhuyen': {
    id: 'chimvanhkhuyen',
    title: 'Con Chim Vành Khuyên',
    category: 'Bài hát lễ phép',
    singer: 'Bé Xuân Mai',
    youtubeId: 'WyRtgnf5Tds',
    icon: '🐦',
    bpm: 125,
    lyrics: [
      { text: "Có con chim vành khuyên nhỏ, dáng trông thật ngoan ngoãn quá 🐦", duration: 3.5 },
      { text: "Gọi dạ, bảo vâng, líu lo chào đón mọi người ✨", duration: 3.5 },
      { text: "Chim gặp bác chào mào chào bác, chim gặp cô sơn ca chào cô! 🌸", duration: 4.0 }
    ],
    notes: [
      { note: 'G4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 0.5 }, { note: 'C5', dur: 1.0 }
    ]
  },
  'namngontayngoan': {
    id: 'namngontayngoan',
    title: 'Năm Ngón Tay Ngoan',
    category: 'Bài hát giáo dục',
    singer: 'Bé Khánh Ngọc',
    youtubeId: 'i9nHld-R8HI',
    icon: '🖐️',
    bpm: 120,
    lyrics: [
      { text: "Xòe bàn tay, đếm ngón tay 🖐️", duration: 3.5 },
      { text: "Một anh béo trông thật đến hay, ngón tay cái là anh cả! ✨", duration: 3.5 },
      { text: "Cả năm ngón tay đều chăm chỉ, giúp bé làm bao việc tốt mỗi ngày! 💖", duration: 4.0 }
    ],
    notes: [
      { note: 'C4', dur: 0.5 }, { note: 'D4', dur: 0.5 }, { note: 'E4', dur: 0.5 }, { note: 'G4', dur: 1.0 }
    ]
  }
};

// =============================================================================
// DYNAMIC UNLIMITED SONGS ENGINE (MATCH & GENERATE ANY SONG IN THE WORLD)
// =============================================================================
// Alias dictionary for instantaneous keyword & typo recognition
const SONG_ALIASES = {
  'butterfly': ['con buom', 'buom vang', 'kia con buom vang', 'kia con buom', 'con buom vang', 'nhac con buom', 'nhac kia con buom vang'],
  'frog': ['chu ech', 'ech con', 'chu ech con', 'hai mat tron', 'ho bom', 'nhac chu ech con', 'nhac ech con'],
  'family': ['ca nha', 'ca nha thuong nhau', 'ba thuong con', 'thuong yeu nhau', 'me thuong con', 'nhac ca nha thuong nhau'],
  'locust': ['cao cao', 'con cao cao', 'canh xanh xanh', 'khoe dep', 'nhac con cao cao'],
  'preschool': ['chau len ba', 'chau len 3', 'di mau giao', 'co thuong chau', 'khong khoc nhe', 'nhac chau len ba'],
  'teeth': ['danh rang', 'tap danh rang', 'be tap danh rang', 'rang trang', 'trang tinh', 'nhac be tap danh rang'],
  'backimthang': ['bac kim thang', 'nhac bac kim thang', 'bai hat bac kim thang', 'ca lang bi ro', 'chu ban dau', 'chu ban ech'],
  'chuvoicon': ['chu voi', 'voi con', 'ban don', 'o ban don', 'chu voi con', 'nhac chu voi con'],
  'dihocve': ['di hoc ve', 'chao cha me', 'cha khen', 'di hoc', 'nhac di hoc ve'],
  'conheodat': ['con heo dat', 'heo dat', 'lon dat', 'tien xu', 'i o i o', 'nhac con heo dat'],
  'chauyeuba': ['chau yeu ba', 'ba oi ba', 'toc ba trang', 'yeu ba', 'nhac chau yeu ba'],
  'motconvit': ['mot con vit', '1 con vit', 'con vit', 'xoe ra hai cai canh', 'cap cap', 'bi ba bi bom', 'nhac mot con vit'],
  'bongbongbangbang': ['bong bong bang bang', 'bong bong', 'com vang com bac', 'nhac bong bong bang bang'],
  'bangocnen': ['ba ngon nen', 'ngon nen', 'ba ngon nen lung linh', 'ba la cay nen vang', 'nhac ba ngon nen lung linh'],
  'alibaba': ['alibaba', 'ali ba ba', 'khi xua alibaba', 'nhac alibaba'],
  'chiongnau': ['chi ong nau', 'ong nau', 'chi ong nau nau', 'ong nau va em be', 'nhac chi ong nau'],
  'doithuyen': ['em di choi thuyen', 'di choi thuyen', 'thuyen con vit', 'nhac em di choi thuyen'],
  'traidatnay': ['trai dat nay la cua chung minh', 'trai dat nay', 'qua bong xanh', 'nhac trai dat nay'],
  'concobebe': ['con co be be', 'co be be', 'con co', 'nhac con co be be'],
  'thangcuoi': ['thang cuoi', 'chu cuoi', 'bong trang trang', 'nhac thang cuoi'],
  'chimvanhkhuyen': ['chim vanh khuyen', 'con chim vanh khuyen', 'vanh khuyen nho', 'nhac chim vanh khuyen'],
  'namngontayngoan': ['nam ngon tay ngoan', 'ngon tay ngoan', 'nhac nam ngon tay ngoan'],
  'meo': ['rua mat nhu meo', 'meo meo', 'con meo', 'meo rua mat', 'meo con', 'nhac rua mat nhu meo'],
  'star': ['ngoi sao nho', 'ngoi sao', 'twinkle', 'little star', 'sao nho', 'nhac ngoi sao nho'],
  'birthday': ['chuc mung sinh nhat', 'sinh nhat', 'happy birthday', 'birthday', 'nhac sinh nhat'],
  'babyshark': ['baby shark', 'ca map', 'shark dance', 'pinkfong', 'nhac baby shark']
};

function matchSongKey(songName) {
  if (!songName) return null;
  const rawNorm = removeVietnameseTones(songName).replace(/[.,?!;]/g, '').trim().toLowerCase();
  if (rawNorm.length < 2) return null;

  // Loại bỏ các tiền tố thông dụng như "nhac", "bai hat", "ca khuc", "bai", "hat bai"...
  const cleanNorm = rawNorm.replace(/^(?:nhac|bai hat|ca khuc|bai ca|bai nhac|bai|hat bai|hat)\s+/, '').trim();

  // 1. Khớp chính xác với từ khóa Alias (cả dạng gốc lẫn dạng đã làm sạch tiền tố)
  for (const key in SONG_ALIASES) {
    for (const alias of SONG_ALIASES[key]) {
      if (rawNorm === alias || cleanNorm === alias) {
        return key;
      }
    }
  }

  // 2. Khớp chính xác với Tên Bài Hát trong thư viện
  for (const key in SONGS_LIBRARY) {
    const s = SONGS_LIBRARY[key];
    const normTitle = removeVietnameseTones(s.title).replace(/[.,?!;]/g, '').trim().toLowerCase();
    if (rawNorm === normTitle || cleanNorm === normTitle) {
      return key;
    }
  }

  // 3. Khớp cụm từ phụ (Substring matching)
  for (const key in SONG_ALIASES) {
    for (const alias of SONG_ALIASES[key]) {
      if (alias.length >= 5 && (rawNorm.includes(alias) || cleanNorm.includes(alias) || (cleanNorm.length >= 5 && alias.includes(cleanNorm)))) {
        return key;
      }
    }
  }

  for (const key in SONGS_LIBRARY) {
    const s = SONGS_LIBRARY[key];
    const normTitle = removeVietnameseTones(s.title).replace(/[.,?!;]/g, '').trim().toLowerCase();
    if (normTitle.length >= 5 && (rawNorm.includes(normTitle) || cleanNorm.includes(normTitle) || (cleanNorm.length >= 5 && normTitle.includes(cleanNorm)))) {
      return key;
    }
  }

  return null;
}

function getOrCreateSong(songName) {
  const matchedKey = matchSongKey(songName);
  if (matchedKey) return matchedKey;

  // Clean title for dynamic song
  let rawTitle = songName.trim();
  rawTitle = rawTitle.replace(/^(?:nhạc|bài\s+hát|bài\s+ca|bài\s+nhạc|bài|ca\s+khúc|hát\s+bài|hát)\s+/i, '').trim();
  const cleanTitle = rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1);
  const dynKey = 'dyn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

  SONGS_LIBRARY[dynKey] = {
    id: dynKey,
    title: cleanTitle,
    category: 'Ca khúc thiếu nhi yêu thích',
    singer: 'Ca sĩ thiếu nhi',
    youtubeId: null, // Dynamic YouTube Search
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
  const norm = removeVietnameseTones(p).toLowerCase();

  // 0. LOẠI TRỪ TUYỆT ĐỐI: Nếu là câu hỏi, câu đố hoặc yêu cầu kể chuyện thì KHÔNG PHẢI là bài hát!
  if (/^(?:tai sao|vi sao|ke chuyen|chuyen|truyen|co\s+phai|la gi|the nao|ai la|o dau|lam sao|co\s+.*khong|\?)/i.test(norm) ||
      norm.includes('tai sao') || norm.includes('vi sao') || norm.includes('ke chuyen') || norm.includes('truyen')) {
    return null;
  }

  // 1. Mẫu câu tìm kiếm và yêu cầu mở bài hát rõ ràng:
  // "tìm bài hát [X]", "tìm bài [X]", "hát bài [X]", "mở bài [X]", "bật bài [X]", "cho bé nghe bài [X]"
  const patterns = [
    /(?:tìm|kiếm|tra|hát|nghe|bật|mở|phát)(?:\s+cho\s+bé)?(?:\s+nghe)?\s+bài(?:\s+hát|\s+ca)?\s+([^\.,?!;]+)/i,
    /(?:tìm|kiếm|hát|nghe|bật|mở|phát)\s+bài\s+([^\.,?!;]+)/i,
    /(?:tìm|kiếm|hát|nghe|bật|mở|phát)\s+ca\s+khúc\s+([^\.,?!;]+)/i,
    /(?:tìm|kiếm|mở|bật|nghe)\s+nhạc\s+([^\.,?!;]+)/i,
    /bài\s+(?:hát|ca)\s+([^\.,?!;]+)/i,
    /ca\s+khúc\s+([^\.,?!;]+)/i,
    /(?:hát|phát)\s+([^\.,?!;]+)/i
  ];

  for (const regex of patterns) {
    const m = p.match(regex);
    if (m && m[1]) {
      let songName = m[1].trim();
      songName = songName.replace(/\s+(đi|nào|với|nhé|nha|ạ|cho\s+bé|vui\s+nhộn|được\s+không).*$/i, '').trim();
      songName = songName.replace(/^(?:nhạc|bài\s+hát|bài\s+ca|bài\s+nhạc|bài|ca\s+khúc|hát\s+bài|hát)\s+/i, '').trim();
      if (songName.length > 1) {
        return songName;
      }
    }
  }

  // 2. Yêu cầu chung: "hát đi", "hát một bài", "bật nhạc", "mở nhạc", "nghe nhạc", "hát bài mới", "hát cho bé nghe"
  if (/^(?:hát(?:\s+đi|\s+nào|\s+cho\s+bé(?:\s+nghe)?|\s+một\s+bài)?|bật\s+nhạc|mở\s+nhạc|nghe\s+nhạc|hát\s+bài\s+mới)$/i.test(norm) ||
      norm === 'hat' || norm === 'nghe nhac' || norm === 'bat nhac' || norm === 'mo nhac') {
    const keys = ['frog', 'butterfly', 'motconvit', 'backimthang', 'conheodat', 'babyshark'];
    const pick = keys[Math.floor(Math.random() * keys.length)];
    return SONGS_LIBRARY[pick].title;
  }

  // 3. Khớp chính xác tên bài hát khi người dùng chỉ gõ đúng tên bài hát
  const directKey = matchSongKey(p);
  if (directKey) {
    return SONGS_LIBRARY[directKey].title;
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

// Special Voice SFX Signatures
function playFairyChime() {
  if (!APP_STATE.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 fairy sparkle arpeggio
  freqs.forEach((f, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, now + i * 0.08);
    gain.gain.setValueAtTime(0.001, now + i * 0.08);
    gain.gain.linearRampToValueAtTime(0.14, now + i * 0.08 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now + i * 0.08);
    osc.stop(now + i * 0.08 + 0.65);
  });
}

function playDeviceBeep() {
  if (!APP_STATE.sfxEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'square';
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.setValueAtTime(1320, now + 0.06);
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.16);
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

// =============================================================================
// UNIFIED MASTER AUDIO & VOICE MANAGER (TRIỆT TIÊU 100% LỖI LẪN GIỌNG & TRÙNG TIẾNG)
// =============================================================================
let currentPlaybackTimeouts = [];
let currentSongVocalAudio = null;
let currentGlobalAudio = null;
let currentSongSessionId = 0;

function stopAllAudioAndVoices() {
  // 1. Tăng cả 2 session ID để triệt tiêu vĩnh viễn mọi audio/chunk/retry đang chờ
  currentTtsSessionId++;
  currentSongSessionId++;

  // 2. Dọn sạch toàn bộ timeout
  currentPlaybackTimeouts.forEach(t => clearTimeout(t));
  currentPlaybackTimeouts = [];

  if (speechDebounceTimer) {
    clearTimeout(speechDebounceTimer);
    speechDebounceTimer = null;
  }
  if (webSpeechWatchdogTimer) {
    clearTimeout(webSpeechWatchdogTimer);
    webSpeechWatchdogTimer = null;
  }

  // 3. Tắt Web Speech Synthesis
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
  activeSpeechUtterance = null;
  if (typeof window !== 'undefined') window._currentUtterance = null;

  // 4. Dập tắt toàn bộ HTML5 Audio elements
  if (activeTtsAudio) {
    try {
      activeTtsAudio.pause();
      activeTtsAudio.src = '';
      activeTtsAudio.load();
    } catch (e) {}
    activeTtsAudio = null;
  }

  if (currentSongVocalAudio) {
    try {
      currentSongVocalAudio.pause();
      currentSongVocalAudio.src = '';
      currentSongVocalAudio.load();
    } catch (e) {}
    currentSongVocalAudio = null;
  }

  if (currentGlobalAudio) {
    try {
      currentGlobalAudio.pause();
      currentGlobalAudio.src = '';
      currentGlobalAudio.load();
    } catch (e) {}
    currentGlobalAudio = null;
  }

  // 5. Tắt toàn bộ video YouTube đang nhúng trên mọi card
  document.querySelectorAll('.singer-video-frame').forEach(iframe => {
    try {
      iframe.src = 'about:blank';
      iframe.style.display = 'none';
    } catch (e) {}
  });
  document.querySelectorAll('.jukebox-video-container').forEach(box => {
    box.classList.add('hidden');
  });
  document.querySelectorAll('.real-singer-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelectorAll('.kuromi-sing-btn').forEach(btn => {
    btn.classList.remove('active', 'playing');
  });
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
  const testBtn = document.getElementById('testVoiceBtn');
  if (testBtn) testBtn.classList.remove('playing');
  isTestingVoice = false;
  APP_STATE.currentPlayingSong = null;
  setKuromiState('normal');
}

function stopCurrentSong() {
  stopAllAudioAndVoices();
}

function stopAllSpeech() {
  stopAllAudioAndVoices();
}

function singVocalLine(cleanVerse, onComplete) {
  const session = currentSongSessionId;
  let isFinished = false;
  const finishOnce = () => {
    if (isFinished || session !== currentSongSessionId) return;
    isFinished = true;
    if (onComplete) onComplete();
  };

  const viVoice = getVietnameseVoice();
  // Nếu thiết bị có sẵn giọng tiếng Việt cục bộ (iOS Linh / Android)
  if (viVoice && typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
      window.speechSynthesis.resume();
    } catch (e) {}
    const u = new SpeechSynthesisUtterance(cleanVerse);
    u.lang = viVoice.lang || 'vi-VN';
    u.voice = viVoice;
    u.rate = 1.1;
    u.pitch = 1.35; // Giọng Kuromi hát trong trẻo lí lắc
    u.onend = finishOnce;
    u.onerror = finishOnce;
    window._currentUtterance = u;
    try {
      window.speechSynthesis.speak(u);
      return;
    } catch (e) {}
  }

  // Máy không có giọng tiếng Việt: Dùng Google TTS Tiếng Việt chuẩn 100%
  let fallbackHandled = false;

  function tryHost(hIndex) {
    if (isFinished || session !== currentSongSessionId) return;
    fallbackHandled = false;
    const url = buildGoogleTtsUrl(cleanVerse, hIndex);
    const audio = new Audio();
    audio.referrerPolicy = 'no-referrer';
    audio.src = url;
    currentSongVocalAudio = audio;
    currentGlobalAudio = audio;
    audio.playbackRate = 1.15; // Hát vui tươi, nhí nhảnh
    if ('preservesPitch' in audio) audio.preservesPitch = false;
    if ('mozPreservesPitch' in audio) audio.mozPreservesPitch = false;
    if ('webkitPreservesPitch' in audio) audio.webkitPreservesPitch = false;

    audio.onended = finishOnce;

    const handleSongFallback = () => {
      if (isFinished || fallbackHandled || session !== currentSongSessionId) return;
      fallbackHandled = true;
      if (hIndex + 1 < GOOGLE_TTS_HOSTS.length) {
        tryHost(hIndex + 1);
      } else {
        finishOnce();
      }
    };

    audio.onerror = handleSongFallback;
    audio.play().catch(handleSongFallback);
  }

  tryHost(0);
}

function playKuromiVocalSong(songKey, onLyricUpdate) {
  // 1. DỪNG TRIỆT ĐỂ MỌI ÂM THANH & LỜI CHÀO / GIỌNG NÓI KHÁC TRƯỚC KHI BẮT ĐẦU HÁT!
  stopAllAudioAndVoices();

  const song = SONGS_LIBRARY[songKey];
  if (!song) return;

  const thisSongSession = currentSongSessionId;
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
  document.getElementById('kuromiStatusText').textContent = `Kuromi cất tiếng hát bài ${song.title} tặng bé ${childName} nè! 🎶🎀`;

  let verseIndex = 0;

  function singNextVerse() {
    if (thisSongSession !== currentSongSessionId || APP_STATE.currentPlayingSong?.id !== songKey) return;

    if (verseIndex >= song.lyrics.length) {
      // Kuromi hát xong trọn vẹn bài hát!
      const endTimeout = setTimeout(() => {
        if (thisSongSession !== currentSongSessionId) return;
        stopAllAudioAndVoices();
        document.getElementById('kuromiStatusText').textContent = `Kuromi hát xong bài ${song.title} rồi nè! Bé ${childName} có thích không nào? 🎀`;
        setKuromiState('happy');
        playSfx('sparkle');
      }, 1000);
      currentPlaybackTimeouts.push(endTimeout);
      return;
    }

    const lyric = song.lyrics[verseIndex++];
    if (onLyricUpdate) onLyricUpdate(lyric.text);
    document.getElementById('kuromiStatusText').textContent = `Kuromi đang hát: "${lyric.text}" 🎶`;

    const cleanVerse = cleanKidTextForTts(lyric.text);
    if (!cleanVerse) {
      singNextVerse();
      return;
    }

    // Hát từng câu tuần tự và CHỈ 1 CÂU DUY NHẤT một thời điểm!
    singVocalLine(cleanVerse, () => {
      if (thisSongSession !== currentSongSessionId || APP_STATE.currentPlayingSong?.id !== songKey) return;
      const pauseTimer = setTimeout(() => {
        singNextVerse();
      }, 500);
      currentPlaybackTimeouts.push(pauseTimer);
    });
  }

  // Bắt đầu ngay câu hát đầu tiên, không có câu chào nói chuyện đè lên!
  const startTimer = setTimeout(singNextVerse, 200);
  currentPlaybackTimeouts.push(startTimer);
}

function openSingerVideo(songKey, cardElement) {
  // 1. DỪNG TRIỆT ĐỂ MỌI ÂM THANH & GIỌNG ĐỌC TRƯỚC ĐÓ
  stopAllAudioAndVoices();

  const song = SONGS_LIBRARY[songKey];
  if (!song) return;

  const childName = APP_STATE.settings.childName || 'Bảo Hân';
  const videoBox = cardElement.querySelector('.jukebox-video-container');
  const iframe = cardElement.querySelector('.singer-video-frame');
  const realSingerBtn = cardElement.querySelector('.real-singer-btn');
  const kuromiSingBtn = cardElement.querySelector('.kuromi-sing-btn');
  const lyricEl = cardElement.querySelector('.current-lyric');
  const waveBars = cardElement.querySelector('.jukebox-wave-bars');
  const externalLink = cardElement.querySelector('.open-external-mv-link');

  const ytUrl = song.youtubeId 
    ? `https://www.youtube.com/watch?v=${song.youtubeId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent((song.youtubeQuery || song.title + ' thiếu nhi'))}`;

  if (externalLink) {
    externalLink.href = ytUrl;
    externalLink.innerHTML = `▶️ Mở Xem Trên YouTube 🎬`;
  }

  // NẾU BÀI HÁT CÓ MÃ YOUTUBE HỢP LỆ: Phát trực tiếp ngay trong khung video trên trang
  if (song.youtubeId && videoBox && iframe) {
    const embedSrc = `https://www.youtube.com/embed/${song.youtubeId}?autoplay=1&playsinline=1&rel=0`;
    iframe.setAttribute('referrerpolicy', 'origin');
    iframe.src = embedSrc;
    iframe.style.display = 'block';
    videoBox.classList.remove('hidden');

    if (realSingerBtn) realSingerBtn.classList.add('active');
    if (kuromiSingBtn) kuromiSingBtn.classList.remove('active');
    if (waveBars) waveBars.classList.add('active');
    if (lyricEl) {
      lyricEl.textContent = `🎬 Đang phát video ca khúc "${song.title}" cho bé ${childName} xem tại đây!`;
    }
  } else {
    // Nếu là bài hát chưa có mã video trực tiếp: Mở thẳng YouTube chất lượng cao
    window.open(ytUrl, '_blank', 'noopener,noreferrer');
    if (lyricEl) {
      lyricEl.textContent = `🎬 Đang mở YouTube phát video "${song.title}" cho bé ${childName} xem nhé!`;
    }
  }

  setKuromiState('singing');
  const mascot = document.getElementById('mascotWrapper');
  if (mascot) mascot.classList.add('dancing');
  document.getElementById('kuromiStatusText').textContent = `Kuromi mở bài ${song.title} cho bé ${childName} xem nè! 💃🎶`;
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
// 5. TEXT-TO-SPEECH (TTS) DUAL-ENGINE: 100% TIẾNG VIỆT CHUẨN XÁC CHO BÉ
// =============================================================================
let activeTtsAudio = null;
let currentTtsSessionId = 0;
let isTestingVoice = false;
let cachedVietnameseVoice = null;
let activeSpeechUtterance = null;
let webSpeechWatchdogTimer = null;

function cleanKidTextForTts(text) {
  if (!text) return '';
  return text
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[#*`_~>[\]()]/g, ' ')
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/[✨🎀💖⭐💡🎵🎶💃🎤👂👀🐶🐱🦆🦁🐦🐘🦖🐬🐙🚗🚑🚒🚨🚂✈️🚢🥗🧼🌾👵🦗🎒🦈🎂🧚🤖📱🎧🌙🌸🐾🥦❓]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function chunkTextForTts(text, maxLen = 100) {
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

// Danh sách các máy chủ Google Translate TTS dự phòng (Tất cả đều tl=vi - Tiếng Việt chuẩn)
const GOOGLE_TTS_HOSTS = [
  'https://translate.google.com/translate_tts',
  'https://translate.googleapis.com/translate_tts',
  'https://translate.google.com.vn/translate_tts'
];

function buildGoogleTtsUrl(text, hostIndex = 0) {
  const host = GOOGLE_TTS_HOSTS[hostIndex % GOOGLE_TTS_HOSTS.length];
  const client = hostIndex === 1 ? 'gtx' : 'tw-ob';
  return `${host}?ie=UTF-8&tl=vi&client=${client}&q=${encodeURIComponent(text)}`;
}

// Bộ lọc bảo vệ 100% tiếng Việt chuẩn (Tuyệt đối không nhận nhầm các giọng tiếng Anh có chữ 'an' hay 'siri')
function isVietnameseVoice(v) {
  if (!v) return false;
  const lang = (v.lang || '').toLowerCase().replace(/_/g, '-');
  const name = (v.name || '').toLowerCase();

  // 1. Phải có mã ngôn ngữ là tiếng Việt
  if (lang.startsWith('vi') || lang === 'vie' || lang.includes('-vn')) {
    return true;
  }

  // 2. Hoặc tên voice ghi rõ ràng Tiếng Việt
  if (name.includes('tiếng việt') || name.includes('vietnamese') || name.includes('vietnam') ||
      name.includes('vi-vn') || name.includes('vi_vn')) {
    return true;
  }

  // 3. Giọng tiếng Việt chuẩn Microsoft đã biết (Hoài My, Nam Minh)
  if (name.includes('hoaimy') || name.includes('namminh')) {
    return true;
  }

  return false;
}

// Quét và tìm bộ giọng Tiếng Việt của hệ thống
function refreshAvailableVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  if (!voices.length) return null;

  const viVoices = voices.filter(isVietnameseVoice);

  if (viVoices.length > 0) {
    const femaleOrNatural = viVoices.find(v => {
      const n = v.name.toLowerCase();
      return n.includes('natural') || n.includes('online') || n.includes('hoaimy') || 
             n.includes('linh') || n.includes('female') || n.includes('mai') || n.includes('nữ');
    });
    cachedVietnameseVoice = femaleOrNatural || viVoices[0];
    return cachedVietnameseVoice;
  }

  cachedVietnameseVoice = null;
  return null;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    refreshAvailableVoices();
  };
  refreshAvailableVoices();
}

function getVietnameseVoice() {
  if (cachedVietnameseVoice && isVietnameseVoice(cachedVietnameseVoice)) return cachedVietnameseVoice;
  return refreshAvailableVoices();
}


// Bộ phát Web Speech API với bảo vệ 100% TIẾNG VIỆT và Mutual Fallback
function speakWithWebSpeech(cleanText, options = {}, onComplete, onFallback) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onFallback) onFallback();
    else if (onComplete) onComplete();
    return;
  }

  const viVoice = getVietnameseVoice();
  // QUY TẮC CỐT LÕI: NẾU THIẾT BỊ KHÔNG CÓ GIỌNG TIẾNG VIỆT THỰC SỰ
  // TUYỆT ĐỐI KHÔNG ĐƯỢC ĐỌC (VÌ TRÌNH DUYỆT SẼ LẤY GIỌNG TIẾNG ANH ĐỌC LƠ LỚ, THÔ CỨNG)
  if (!viVoice) {
    console.log("Thiết bị không có voice tiếng Việt hợp lệ -> Chuyển sang Google TTS Tiếng Việt 100%");
    if (onFallback) onFallback();
    else {
      const chunks = chunkTextForTts(cleanText, 100);
      speakWithGoogleTts(chunks, options, onComplete);
    }
    return;
  }

  const chunks = chunkTextForTts(cleanText, 100);
  if (!chunks.length) {
    if (onComplete) onComplete();
    return;
  }

  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
  } catch (e) {}

  let chunkIndex = 0;
  const sessionId = ++currentTtsSessionId;
  setKuromiState('singing');

  function speakNextChunk() {
    if (sessionId !== currentTtsSessionId) return;
    if (chunkIndex >= chunks.length) {
      if (webSpeechWatchdogTimer) clearTimeout(webSpeechWatchdogTimer);
      setKuromiState('normal');
      activeSpeechUtterance = null;
      if (onComplete) onComplete();
      return;
    }

    const currentText = chunks[chunkIndex++];
    const utterance = new SpeechSynthesisUtterance(currentText);
    utterance.voice = viVoice;
    utterance.lang = viVoice.lang || 'vi-VN';

    const baseRate = options.rate || APP_STATE.settings.ttsRate || 1.05;
    utterance.rate = Math.min(Math.max(baseRate, 0.6), 1.6);
    const basePitch = options.pitch !== undefined ? options.pitch : (APP_STATE.settings.ttsPitch || 1.1);
    utterance.pitch = Math.min(Math.max(basePitch, 0.5), 1.8);

    activeSpeechUtterance = utterance;
    window._currentUtterance = utterance;

    if (webSpeechWatchdogTimer) clearTimeout(webSpeechWatchdogTimer);
    const safetyTimeoutMs = Math.max(3000, currentText.length * 200);
    webSpeechWatchdogTimer = setTimeout(() => {
      if (sessionId === currentTtsSessionId && chunkIndex < chunks.length) {
        speakNextChunk();
      } else if (sessionId === currentTtsSessionId) {
        setKuromiState('normal');
        if (onComplete) onComplete();
      }
    }, safetyTimeoutMs);

    utterance.onend = () => {
      if (webSpeechWatchdogTimer) clearTimeout(webSpeechWatchdogTimer);
      if (sessionId === currentTtsSessionId) {
        speakNextChunk();
      }
    };

    utterance.onerror = (err) => {
      console.warn("WebSpeech utterance error:", err);
      if (webSpeechWatchdogTimer) clearTimeout(webSpeechWatchdogTimer);
      if (sessionId === currentTtsSessionId) {
        if (chunkIndex <= 1 && onFallback) {
          onFallback();
        } else {
          speakNextChunk();
        }
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    } catch (e) {
      console.warn("Error in speechSynthesis.speak:", e);
      if (onFallback) onFallback();
      else if (onComplete) onComplete();
    }
  }

  speakNextChunk();
}

// Bộ phát Google Translate TTS Tiếng Việt Online đa máy chủ (Multi-host + No-Referrer)
function speakWithGoogleTts(chunks, options = {}, onComplete, onFallback) {
  if (!chunks || !chunks.length) {
    if (onComplete) onComplete();
    return;
  }
  const sessionId = ++currentTtsSessionId;
  let index = 0;
  setKuromiState('singing');

  function playNextChunk() {
    if (sessionId !== currentTtsSessionId) return;
    if (index >= chunks.length) {
      setKuromiState('normal');
      activeTtsAudio = null;
      if (onComplete) onComplete();
      return;
    }

    const chunk = chunks[index++];

    function tryHost(hIndex) {
      if (sessionId !== currentTtsSessionId) return;
      let hostHandled = false;

      const url = buildGoogleTtsUrl(chunk, hIndex);
      const audio = new Audio();
      audio.referrerPolicy = 'no-referrer';
      audio.preload = 'auto';
      audio.src = url;
      activeTtsAudio = audio;
      currentGlobalAudio = audio;

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

      const handleFallback = () => {
        if (sessionId !== currentTtsSessionId || hostHandled) return;
        hostHandled = true;

        if (hIndex + 1 < GOOGLE_TTS_HOSTS.length) {
          tryHost(hIndex + 1);
        } else {
          // Thử sang Web Speech API nếu thiết bị có giọng tiếng Việt thực sự
          const viVoice = getVietnameseVoice();
          if (viVoice) {
            const remaining = chunks.slice(index - 1).join('. ');
            speakWithWebSpeech(remaining, options, onComplete);
          } else if (onFallback) {
            onFallback();
          } else {
            console.warn("Không thể tải Google TTS và máy không có giọng tiếng Việt.");
            setKuromiState('normal');
            if (onComplete) onComplete();
          }
        }
      };

      audio.onerror = handleFallback;
      audio.play().catch(handleFallback);
    }

    tryHost(0);
  }

  playNextChunk();
}

// Hàm đọc tin nhắn chính với 4 PHONG CÁCH GIỌNG ĐỌC TIẾNG VIỆT
function speakText(text, onComplete, force = false) {
  if (!APP_STATE.ttsEnabled && !force) {
    if (onComplete) onComplete();
    return;
  }

  stopAllSpeech();

  const cleanText = cleanKidTextForTts(text);
  if (!cleanText) {
    if (onComplete) onComplete();
    return;
  }

  try {
    getAudioContext();
  } catch (e) {}

  const voiceStyle = APP_STATE.settings.voiceStyle || 'kuromi_anime';
  const userRate = APP_STATE.settings.ttsRate || 1.05;
  const viVoice = getVietnameseVoice();
  const chunks = chunkTextForTts(cleanText, 100);

  // GIỌNG 1: Kuromi Hoạt Hình (Anime Sanrio - Nhí nhảnh, lí lắc, ngọt ngào, đáng yêu cho bé)
  if (voiceStyle === 'kuromi_anime') {
    playSfx('chime');
    if (viVoice) {
      speakWithWebSpeech(cleanText, {
        rate: 1.12 * (userRate / 1.05),
        pitch: 1.35 // Giọng trong trẻo, lí lắc anime Sanrio
      }, onComplete, () => {
        speakWithGoogleTts(chunks, {
          rate: 1.15 * (userRate / 1.05),
          preservesPitch: false
        }, onComplete);
      });
    } else {
      // Máy không có voice tiếng Việt: dùng Google TTS Tiếng Việt chuẩn với cao độ nhí nhảnh
      speakWithGoogleTts(chunks, {
        rate: 1.15 * (userRate / 1.05),
        preservesPitch: false
      }, onComplete);
    }
    return;
  }

  // GIỌNG 2: Chị Google Trong Trẻo (Chuẩn Studio Tiếng Việt Phổ Thông 100%)
  if (voiceStyle === 'google_online') {
    speakWithGoogleTts(chunks, {
      rate: 1.0 * (userRate / 1.05),
      preservesPitch: true
    }, onComplete, () => {
      if (viVoice) {
        speakWithWebSpeech(cleanText, {
          rate: 1.0 * (userRate / 1.05),
          pitch: 1.0
        }, onComplete);
      } else {
        if (onComplete) onComplete();
      }
    });
    return;
  }

  // GIỌNG 3: Cô Tiên Kể Chuyện (Ấm Áp Ru Êm, Chậm Rãi Truyền Cảm - Tiếng Việt 100%)
  if (voiceStyle === 'fairy') {
    playFairyChime();
    if (viVoice) {
      speakWithWebSpeech(cleanText, {
        rate: 0.85 * (userRate / 1.05),
        pitch: 0.95
      }, onComplete, () => {
        speakWithGoogleTts(chunks, {
          rate: 0.88 * (userRate / 1.05),
          preservesPitch: true
        }, onComplete);
      });
    } else {
      speakWithGoogleTts(chunks, {
        rate: 0.88 * (userRate / 1.05),
        preservesPitch: true
      }, onComplete);
    }
    return;
  }

  // GIỌNG 4: Giọng Thiết Bị (Bộ Tổng Hợp Hệ Thống Máy / iPad - Bảo Vệ Tiếng Việt 100%)
  if (voiceStyle === 'device') {
    playDeviceBeep();
    if (viVoice) {
      speakWithWebSpeech(cleanText, {
        rate: 1.02 * (userRate / 1.05),
        pitch: 1.05
      }, onComplete, () => {
        speakWithGoogleTts(chunks, {
          rate: 1.02 * (userRate / 1.05),
          preservesPitch: true
        }, onComplete);
      });
    } else {
      speakWithGoogleTts(chunks, {
        rate: 1.02 * (userRate / 1.05),
        preservesPitch: true
      }, onComplete);
    }
    return;
  }
}

// Nút Nghe Thử Giọng Này Trong Cài Đặt Ba Mẹ (Kiểm Tra 4 Giọng Tiếng Việt)
function testVoiceSample(customStyle) {
  const childName = (document.getElementById('childNameInput')?.value || APP_STATE.settings.childName || 'Bảo Hân').trim();
  const testBtn = document.getElementById('testVoiceBtn');
  const statusEl = document.getElementById('voiceTestStatus');

  const selectedVoice = customStyle || 
    document.querySelector('input[name="voiceStyle"]:checked')?.value || 
    APP_STATE.settings.voiceStyle || 
    'kuromi_anime';

  let personaTitle = 'Kuromi Hoạt Hình';
  // Câu chào nhí nhảnh, ngọt ngào, đáng yêu đúng chuẩn Kuromi Sanrio:
  let samplePhrase = `Hí hí, Kuromi chào bé ${childName} đáng yêu nè! Kuromi chúc bé học thật giỏi và luôn cười tươi vui vẻ cùng Kuromi nha! 💖🎀`;

  if (selectedVoice === 'google_online') {
    personaTitle = 'Chị Google Trong Trẻo';
    samplePhrase = `Xin chào bé ${childName}. Chúc bé một buổi học tập thật chăm ngoan, tiến bộ và học thêm nhiều điều hay nhé! 👩‍🏫⭐`;
  } else if (selectedVoice === 'fairy') {
    personaTitle = 'Cô Tiên Kể Chuyện';
    samplePhrase = `Cô Tiên chào bé ${childName} yêu quý. Bé ngoan ngoãn lắng nghe những câu chuyện cổ tích êm đềm cùng cô nhé... 🧚✨`;
  } else if (selectedVoice === 'device') {
    personaTitle = 'Giọng Thiết Bị';
    samplePhrase = `Hệ thống thiết bị xin chào bé ${childName}. Trợ lý học tập đã sẵn sàng hỗ trợ bé khám phá thế giới xung quanh! 📱🤖`;
  }

  if (testBtn) testBtn.classList.add('playing');
  if (statusEl) statusEl.textContent = `Đang phát: ${personaTitle} (Tiếng Việt) 🔊...`;

  // Cập nhật và lưu lại giọng đang chọn
  APP_STATE.settings.voiceStyle = selectedVoice;
  saveSettings({ voiceStyle: selectedVoice });

  speakText(samplePhrase, () => {
    if (testBtn) testBtn.classList.remove('playing');
    if (statusEl) statusEl.textContent = `Đã phát xong: ${personaTitle}! Bé nghe thấy rõ ràng bằng Tiếng Việt chưa nè? 💕`;
  }, true);
}

// Prime Audio trên tương tác đầu tiên của người dùng để tránh trình duyệt di động chặn âm
if (typeof window !== 'undefined') {
  const primeAudioOnGesture = () => {
    try {
      getAudioContext();
      if (window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    } catch (e) {}
    window.removeEventListener('pointerdown', primeAudioOnGesture, { capture: true });
    window.removeEventListener('touchstart', primeAudioOnGesture, { capture: true });
    window.removeEventListener('click', primeAudioOnGesture, { capture: true });
  };
  window.addEventListener('pointerdown', primeAudioOnGesture, { capture: true, once: true });
  window.addEventListener('touchstart', primeAudioOnGesture, { capture: true, once: true });
  window.addEventListener('click', primeAudioOnGesture, { capture: true, once: true });
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
// 7. GOOGLE GEMINI AI CLIENT (100% ONLINE CLOUD INTELLIGENCE)
// =============================================================================
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest'
];

async function testGeminiApiKey(apiKey) {
  if (!apiKey) return { ok: false, msg: "Vui lòng nhập API Key trước khi kiểm tra!" };
  
  let lastErrorMessage = '';

  for (const model of GEMINI_MODELS) {
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
      }
    } catch (e) {
      console.warn(`Test model ${model} error:`, e);
    }
  }
  return { ok: false, msg: `❌ Lỗi kết nối Google Gemini: ${lastErrorMessage || "Vui lòng kiểm tra lại khóa API và kết nối mạng."}` };
}

async function callGeminiApi(prompt) {
  const apiKey = ((APP_STATE.settings && APP_STATE.settings.geminiApiKey) || DEFAULT_SETTINGS.geminiApiKey || '').trim();
  const childName = (APP_STATE.settings && APP_STATE.settings.childName) || 'Bảo Hân';
  const ageGroup = (APP_STATE.settings && APP_STATE.settings.ageGroup) || 'primary';

  if (!apiKey) {
    return {
      answer: `Bé ${childName} ơi, Kuromi đã chuyển sang 100% Trí Tuệ Nhân Tạo Google Gemini AI trực tuyến (không dùng dữ liệu nội bộ)! 🎀✨ Ba Mẹ hãy bấm vào ⚙️ Cài Đặt (Góc Ba Mẹ) và dán Khóa Google Gemini API Key để Kuromi trò chuyện, làm toán, hát và kể chuyện cổ tích cho bé nghe nhé! 💕`
    };
  }

  const systemInstruction = `Bạn là Kuromi (nhân vật hoạt hình Sanrio nổi tiếng), đóng vai người bạn thân thiết, vui tính, ngọt ngào và biết tuốt dành riêng cho bé ${childName} (${ageGroup === 'preschool' ? '3-6 tuổi' : '5-10 tuổi'} tại Việt Nam). 
Quy tắc trả lời:
- Luôn xưng là "Kuromi" và gọi bé là "bé ${childName}".
- Trả lời cụ thể, giải thích rõ ràng câu hỏi của bé bằng ngôn ngữ trẻ em dễ hiểu, giàu cảm xúc, ngập tràn sự tích cực.
- Khi bé hỏi "Tại sao...", câu hỏi khoa học, vũ trụ, động vật, tự nhiên hay đời sống: Giải thích nguyên nhân chuẩn xác, sinh động, dễ hiểu, dùng hình ảnh so sánh ngộ nghĩnh (3-5 câu).
- Khi bé nhờ kể chuyện ("kể chuyện", "chuyện cổ tích", "kể chuyện bé nghe", chuyện Thánh Gióng, Thạch Sanh, Tấm Cám, công chúa, muông thú...): Hãy kể trọn vẹn một câu chuyện cổ tích / đồng thoại thật cuốn hút, ly kỳ, có mở đầu, cao trào và bài học yêu thương, lòng dũng cảm cho bé ${childName}.
- Khi bé nhờ hát hoặc hỏi bài hát: Giới thiệu vui tươi bài hát, nhắc bé cùng xem và hát trên YouTube.
- Thêm nhiều emoji dễ thương (🎀, 💖, ⭐, 🐰, 🍭, 🌸, ✨, 🌈).
- An toàn 100% cho trẻ nhỏ, luôn động viên và yêu thương bé.`;

  for (const model of GEMINI_MODELS) {
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
          // Check if child explicitly asked for a song
          const requestedSong = extractSongIntent(prompt);
          let detectedSongKey = null;
          if (requestedSong) {
            detectedSongKey = getOrCreateSong(requestedSong);
          }
          return {
            answer: text,
            song: detectedSongKey
          };
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Model ${model} returned error:`, errData);
      }
    } catch (err) {
      console.warn(`Model ${model} fetch failed:`, err);
    }
  }

  // If all models failed (e.g. no internet or quota reached)
  return {
    answer: `Bé ${childName} ơi, hiện tại kết nối mạng Internet hoặc máy chủ Google AI đang bị gián đoạn một xíu nè! 🐰📶 Ba Mẹ kiểm tra lại kết nối mạng Wifi/4G hoặc kiểm tra lại Khóa API trong phần Cài Đặt giúp bé nhé! 💕`
  };
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
      const ytUrl = song.youtubeId 
        ? `https://www.youtube.com/watch?v=${song.youtubeId}`
        : `https://www.youtube.com/results?search_query=${encodeURIComponent((song.youtubeQuery || song.title + ' thiếu nhi'))}`;

      jukeboxHtml = `
        <div class="jukebox-player-card" data-song="${data.song}">
          <div class="jukebox-top">
            <div class="jukebox-header-badge">🎵 Ca Khúc Thiếu Nhi YouTube &amp; Lời Hát</div>
            <div class="jukebox-info">
              <span class="jukebox-title">${song.icon} ${escapeHtml(song.title)}</span>
              <span class="jukebox-subtitle">🎤 Ca sĩ: <strong>${escapeHtml(song.singer || 'Ca sĩ thiếu nhi')}</strong></span>
            </div>
          </div>

          <!-- Triple Action Options: Direct YouTube vs In-Page Video vs Kuromi Live -->
          <div class="jukebox-actions-group">
            <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" referrerpolicy="origin-when-cross-origin" class="jukebox-vocal-btn youtube-direct-btn" title="Mở xem bài hát trực tiếp trên YouTube">
              <span class="btn-icon">▶️</span>
              <div class="btn-labels">
                <strong>Mở Xem Trên YouTube</strong>
                <small>Xem MV gốc có hình ảnh ca sĩ</small>
              </div>
            </a>
            <button type="button" class="jukebox-vocal-btn real-singer-btn" data-song="${data.song}" title="Xem video ngay trên màn hình này">
              <span class="btn-icon">🎬</span>
              <div class="btn-labels">
                <strong>Phát Video Tại Đây</strong>
                <small>Khung video bên dưới</small>
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
              <iframe class="singer-video-frame" src="" referrerpolicy="origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
            </div>
            <div class="video-status-bar">
              <span>🎶 Đang phát ca khúc cho bé nghe</span>
              <div class="video-status-actions">
                <a href="${ytUrl}" target="_blank" rel="noopener noreferrer" referrerpolicy="origin-when-cross-origin" class="open-external-mv-link" title="Xem trên YouTube">▶️ Mở Trên YouTube 🎬</a>
                <button type="button" class="close-video-frame-btn" data-song="${data.song}">✕ Đóng video</button>
              </div>
            </div>
          </div>

          <!-- Karaoke / Kuromi Lyrics display -->
          <div class="jukebox-lyrics-box">
            <span class="current-lyric">Bé bấm "▶️ Mở Xem Trên YouTube" hoặc "Phát Video Tại Đây" nha!</span>
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
  const childName = (APP_STATE.settings && APP_STATE.settings.childName) || 'Bảo Hân';
  document.getElementById('kuromiStatusText').textContent = `Kuromi đang kết nối Google AI để trả lời cho bé ${childName}... Chờ xíu nha! 💭✨`;

  setTimeout(async () => {
    // 100% Google Gemini AI Engine
    const result = await callGeminiApi(query);

    setKuromiState(result.song ? 'singing' : 'happy');
    document.getElementById('kuromiStatusText').textContent = result.song 
      ? `Kuromi mở bài hát tặng bé ${childName} nè! Cùng vỗ tay nào! 🎶🎀`
      : `Kuromi giải đáp cho bé ${childName} rồi đây! Bé xem có thích không nè? 💕`;

    appendKuromiResponse(result);
  }, 350);
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

  // Quick Action: "Hát bài mới"
  const quickSongBtn = document.getElementById('quickSongBtn');
  if (quickSongBtn) {
    quickSongBtn.addEventListener('click', () => {
      playSfx('pop');
      const songKeys = Object.keys(SONGS_LIBRARY);
      const randomKey = songKeys[Math.floor(Math.random() * songKeys.length)];
      const s = SONGS_LIBRARY[randomKey];
      handleChildSubmit(`Hát cho bé nghe bài ${s.title}`);
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

    const apiKeyBlock = document.getElementById('apiKeyBlock');
    if (apiKeyBlock) apiKeyBlock.classList.remove('hidden');
    const keyField = document.getElementById('geminiApiKey');
    if (keyField) keyField.value = APP_STATE.settings.geminiApiKey || '';
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
      APP_STATE.settings.voiceStyle = style;
      saveSettings({ voiceStyle: style });

      const voiceHint = document.getElementById('voiceTestStatus');
      const childName = (document.getElementById('childNameInput')?.value || APP_STATE.settings.childName || 'Bảo Hân').trim();
      if (voiceHint) {
        let label = 'Kuromi Hoạt Hình';
        if (style === 'google_online') label = 'Chị Google Trong Trẻo';
        if (style === 'fairy') label = 'Cô Tiên Kể Chuyện';
        if (style === 'device') label = 'Giọng Thiết Bị';
        voiceHint.textContent = `Đã chọn: ${label}. Bấm "Nghe Thử Giọng Này" để nghe giọng mẫu cho bé ${childName}!`;
      }
    });
  });

  // Test Voice Button
  const testVoiceBtn = document.getElementById('testVoiceBtn');
  if (testVoiceBtn) {
    testVoiceBtn.addEventListener('click', () => {
      const selectedStyle = document.querySelector('input[name="voiceStyle"]:checked')?.value || 'kuromi_anime';
      testVoiceSample(selectedStyle);
    });
  }


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
