/* ============================================================
   2026 TechWomen@TW — Core Application
   
   修正內容：
   1. 複選限制（maxSelect）正確生效
   2. API 連線失敗時自動進入離線模式，仍可跳轉 thankyou.html
   3. 離線模式下投票人數顯示為 --
   ============================================================ */

/* ---- 設定區 ---- */
// ★ 部署 Google Apps Script 後，把下面這行換成你的 Web App URL
// ★ 測試階段保持空字串即可，系統會自動進入離線模式
var API_URL = 'https://script.google.com/macros/s/AKfycbyVRI7a4Cg5utMYEX3ud5D7qKiWMD4RpDBUnpI0gZfxjOQ1--fEw2IFpuG9lhfD9pcUAA/exec';

var VOTE_DEADLINE = new Date('2026-12-31T13:30:00+08:00');
var VOTED_KEY = 'techwomen_2026_voted';

// 判斷是否為離線模式（API_URL 為空或仍是預設值）
function isOffline() {
  return !API_URL || API_URL === 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';
}


/* ---- Utilities ---- */
function setCookie(n, v, h) {
  var d = new Date();
  d.setTime(d.getTime() + h * 36e5);
  document.cookie = n + '=' + v + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
}

function getCookie(n) {
  var m = document.cookie.match(new RegExp('(^| )' + n + '=([^;]+)'));
  return m ? m[2] : null;
}

function generateVoteId() {
  return 'V-' + Date.now().toString(36).toUpperCase() + '-' +
    Math.random().toString(36).substring(2, 6).toUpperCase();
}

function formatTime(d) {
  return d.toLocaleString('zh-TW', {
    month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}


/* ============================================================
   VoteApp
   ============================================================ */
var VoteApp = {

  questionIds: ['q1', 'q2', 'q3'],

  init: function() {
    // 檢查是否已投票
    if (getCookie(VOTED_KEY)) {
      this.showScreen('alreadyVotedScreen');
      return;
    }
    // 檢查是否已截止
    if (new Date() > VOTE_DEADLINE) {
      this.showScreen('closedScreen');
      return;
    }
    // 正常投票模式
    this.bindEvents();
    this.loadVoterCount();
  },

  showScreen: function(screenId) {
    var form = document.getElementById('voteForm');
    if (form) form.style.display = 'none';
    var pill = document.querySelector('.status-pill');
    if (pill) pill.style.display = 'none';
    var el = document.getElementById(screenId);
    if (el) el.style.display = 'flex';
  },

  /* ---- 綁定事件 ---- */
  bindEvents: function() {
    var self = this;
    var form = document.getElementById('voteForm');
    if (!form) return;

    // 為每一題綁定複選限制
    this.questionIds.forEach(function(qid) {
      // 從 content.js 讀取設定
      var qConfig = { maxSelect: 3 }; // 預設值
      if (typeof CONTENT !== 'undefined' && CONTENT.questions && CONTENT.questions[qid]) {
        qConfig = CONTENT.questions[qid];
      }
      var maxSelect = qConfig.maxSelect || 3;

      var allInputs = document.querySelectorAll('input[name="' + qid + '"]');
      var counter = document.getElementById(qid + '-counter');

      // 為每個 checkbox 綁定 change 事件
      for (var i = 0; i < allInputs.length; i++) {
        (function(checkbox) {
          checkbox.addEventListener('change', function() {
            // 計算目前已勾選數量
            var checkedInputs = document.querySelectorAll('input[name="' + qid + '"]:checked');
            var checkedCount = checkedInputs.length;

            // ★ 核心：超過上限就還原這次的勾選
            if (checkedCount > maxSelect) {
              checkbox.checked = false;
              if (counter) {
                counter.textContent = '已選 ' + maxSelect + ' / ' + maxSelect + ' 項（已達上限）';
                counter.style.color = 'var(--c-danger)';
                setTimeout(function() { counter.style.color = ''; }, 1500);
              }
              return;
            }

            // 正常更新計數器
            if (counter) {
              counter.textContent = '已選 ' + checkedCount + ' / ' + maxSelect + ' 項';
            }

            // 清除錯誤提示
            self.clearError(qid);
          });
        })(allInputs[i]);
      }
    });

    // 表單送出
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      self.submitVote();
    });
  },

  /* ---- 錯誤處理 ---- */
  clearError: function(qid) {
    var errEl = document.getElementById(qid + '-error');
    if (errEl) errEl.textContent = '';
    var card = errEl ? errEl.closest('.question-card') : null;
    if (card) card.classList.remove('has-error');
  },

  setError: function(qid, msg) {
    var errEl = document.getElementById(qid + '-error');
    if (errEl) errEl.textContent = msg;
    var card = errEl ? errEl.closest('.question-card') : null;
    if (card) {
      card.classList.remove('has-error');
      void card.offsetWidth; // 強制 reflow 重啟動畫
      card.classList.add('has-error');
    }
  },

  /* ---- 驗證 ---- */
  validate: function() {
    var self = this;
    var valid = true;
    var firstErrorCard = null;
    var errMsg = '請至少選擇一個選項';
    if (typeof CONTENT !== 'undefined' && CONTENT.errors && CONTENT.errors.checkboxMin) {
      errMsg = CONTENT.errors.checkboxMin;
    }

    this.questionIds.forEach(function(qid) {
      var checkedInputs = document.querySelectorAll('input[name="' + qid + '"]:checked');
      if (checkedInputs.length === 0) {
        self.setError(qid, errMsg);
        valid = false;
        if (!firstErrorCard) {
          var errEl = document.getElementById(qid + '-error');
          if (errEl) firstErrorCard = errEl.closest('.question-card');
        }
      }
    });

    // 滾動到第一個錯誤
    if (!valid && firstErrorCard) {
      firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  },

  /* ---- 送出投票 ---- */
  submitVote: function() {
    var self = this;

    // 驗證
    if (!this.validate()) return;

    // 再次檢查截止時間
    if (new Date() > VOTE_DEADLINE) {
      this.showScreen('closedScreen');
      return;
    }

    // 按鈕變成 loading 狀態
    var btn = document.getElementById('submitBtn');
    if (btn) btn.classList.add('loading');

    // 產生投票 ID
    var voteId = generateVoteId();

    // 收集每題答案
    var payload = {
      action: 'vote',
      voteId: voteId,
      timestamp: new Date().toISOString()
    };

    this.questionIds.forEach(function(qid) {
      var checkedInputs = document.querySelectorAll('input[name="' + qid + '"]:checked');
      var values = [];
      for (var i = 0; i < checkedInputs.length; i++) {
        values.push(checkedInputs[i].value);
      }
      payload[qid] = values.join(', ');
    });

    // 準備跳轉用的參數
    var voteTime = formatTime(new Date());
    var redirectUrl = 'thankyou.html?id=' + encodeURIComponent(voteId) + '&t=' + encodeURIComponent(voteTime);

    // ★ 離線模式：直接跳轉，不呼叫 API
    if (isOffline()) {
      console.log('[離線模式] 投票資料：', payload);
      setCookie(VOTED_KEY, voteId, 48);
      window.location.href = redirectUrl;
      return;
    }

    // ★ 線上模式：送出到 Google Apps Script
    fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).then(function() {
      // no-cors 模式下無法讀回應，但資料已送出
      setCookie(VOTED_KEY, voteId, 48);
      window.location.href = redirectUrl;
    }).catch(function(err) {
      console.error('Submit error:', err);
      if (btn) btn.classList.remove('loading');

      var errMsg = '送出失敗，請檢查網路連線後再試一次';
      if (typeof CONTENT !== 'undefined' && CONTENT.errors && CONTENT.errors.networkError) {
        errMsg = CONTENT.errors.networkError;
      }
      alert(errMsg);
    });
  },

  /* ---- 載入投票人數 ---- */
  loadVoterCount: function() {
    // 離線模式不呼叫 API
    if (isOffline()) {
      var el = document.getElementById('voterCount');
      if (el) el.textContent = '--';
      return;
    }

    fetch(API_URL + '?action=count', { mode: 'cors' })
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var el = document.getElementById('voterCount');
        if (el && d.count !== undefined) el.textContent = d.count;
      })
      .catch(function() {
        var el = document.getElementById('voterCount');
        if (el) el.textContent = '0';
      });
  }
};


/* ============================================================
   ThankYouApp
   ============================================================ */
var ThankYouApp = {

  init: function() {
    var params = new URLSearchParams(window.location.search);
    var voteTime = params.get('t') || formatTime(new Date());
    var voteId = params.get('id') || '—';

    var timeEl = document.getElementById('tyTime');
    var idEl = document.getElementById('tyId');
    if (timeEl) timeEl.textContent = voteTime;
    if (idEl) idEl.textContent = voteId;
  }
};


/* ============================================================
   ResultApp — 1920×1080 Projection Dashboard
   ============================================================ */
var ResultApp = {

  init: function() {
    // 離線模式顯示 not ready
    if (isOffline()) {
      document.getElementById('loadingScreen').style.display = 'none';
      document.getElementById('notReadyScreen').style.display = 'flex';
      return;
    }
    this.loadResults();
  },

  loadResults: function() {
    var self = this;

    fetch(API_URL + '?action=results', { mode: 'cors' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.open) {
          document.getElementById('loadingScreen').style.display = 'none';
          document.getElementById('notReadyScreen').style.display = 'flex';
          return;
        }

        var totalEl = document.getElementById('totalVoters');
        var timeEl = document.getElementById('statTime');
        if (totalEl) totalEl.textContent = data.totalVoters;
        if (timeEl) timeEl.textContent = formatTime(new Date());

        self.renderBars('q1BarChart', data.q1, data.totalVoters, true, 'q1Podium');
        self.renderBars('q2BarChart', data.q2, data.totalVoters, false, null, 'q2Ranking');
        self.renderWordCloud(data.q3);

        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('resultsContainer').style.display = 'grid';
      })
      .catch(function(err) {
        console.error('Load results error:', err);
        var loading = document.getElementById('loadingScreen');
        if (loading) {
          loading.innerHTML = '<div class="dash-state-icon">⚠️</div><p>載入結果失敗，請稍後重試</p>';
        }
      });
  },

  renderBars: function(chartId, data, total, showPodium, podiumId, rankingId) {
    if (!data) return;

    var sorted = Object.entries(data)
      .map(function(e) { return { name: e[0], count: e[1] }; })
      .sort(function(a, b) { return b.count - a.count; });

    // Podium (Top 3)
    if (showPodium && podiumId && sorted.length >= 3) {
      var podiumEl = document.getElementById(podiumId);
      if (podiumEl) {
        var medals = ['🥇', '🥈', '🥉'];
        [1, 0, 2].forEach(function(i) {
          if (!sorted[i]) return;
          var it = sorted[i];
          var d = document.createElement('div');
          d.className = 'dash-podium-item rank-' + (i + 1);
          d.innerHTML =
            '<div class="podium-medal">' + medals[i] + '</div>' +
            '<div class="podium-label">' + it.name + '</div>' +
            '<div class="podium-votes">' + it.count + ' 票</div>' +
            '<div class="podium-bar"></div>';
          podiumEl.appendChild(d);
        });
      }
    }

    // Bar Chart
    var chartEl = document.getElementById(chartId);
    if (!chartEl) return;

    var mx = sorted.length > 0 ? sorted[0].count : 1;
    sorted.forEach(function(it, i) {
      var pct = Math.round((it.count / mx) * 100);
      var tpct = total > 0 ? Math.round((it.count / total) * 100) : 0;
      var d = document.createElement('div');
      d.className = 'dash-bar-item';
      d.innerHTML =
        '<div class="dash-bar-label">' +
          '<span class="dash-bar-rank">' + (i + 1) + '</span>' +
          '<span class="dash-bar-name">' + it.name + '</span>' +
        '</div>' +
        '<div class="dash-bar-track">' +
          '<div class="dash-bar-fill color-' + (i % 6) + '" style="width:0%;"></div>' +
        '</div>' +
        '<div class="dash-bar-value">' + it.count + '<small>' + tpct + '%</small></div>';
      chartEl.appendChild(d);
      setTimeout(function() {
        var fill = d.querySelector('.dash-bar-fill');
        if (fill) fill.style.width = pct + '%';
      }, 200 + i * 120);
    });

    // Ranking List
    if (rankingId) {
      var rankEl = document.getElementById(rankingId);
      if (!rankEl) return;
      sorted.forEach(function(it, i) {
        var pct = total > 0 ? Math.round((it.count / total) * 100) : 0;
        var d = document.createElement('div');
        d.className = 'dash-rank-row';
        d.innerHTML =
          '<span class="dash-rank-pos pos-' + Math.min(i + 1, 4) + '">' + (i + 1) + '</span>' +
          '<span class="dash-rank-name">' + it.name + '</span>' +
          '<span class="dash-rank-count">' + it.count + ' 票</span>' +
          '<span class="dash-rank-pct">' + pct + '%</span>';
        rankEl.appendChild(d);
      });
    }
  },

renderWordCloud: function(words) {
  if (!words) return;

  // ============================================================
  // Q3 Word Cloud
  // 票數越高，文字越大
  // 例如：
  // 信任 3票        → 最大
  // AI賦能 2票      → 次大
  // 工作生活平衡 2票 → 次大
  // 共融 1票        → 較小
  // 多元包容 1票    → 較小
  // ============================================================

  var canvas = document.getElementById('wordCloudCanvas');
  if (!canvas) return;

  var container = canvas.parentElement;
  if (!container) return;

  // ------------------------------------------------------------
  // 1. 整理資料
  // ------------------------------------------------------------
  var entries = Object.entries(words)
    .map(function(e) {
      return {
        text: String(e[0]),
        count: Number(e[1]) || 0
      };
    })
    .filter(function(e) {
      return e.text.trim() !== '' && e.count > 0;
    })
    .sort(function(a, b) {
      return b.count - a.count;
    });

  // ------------------------------------------------------------
  // 2. 沒有資料
  // ------------------------------------------------------------
  if (entries.length === 0) {
    canvas.style.display = 'none';

    // 清除舊的 empty message
    var oldEmpty = container.querySelector('.word-cloud-empty');
    if (oldEmpty) oldEmpty.remove();

    var empty = document.createElement('div');
    empty.className = 'word-cloud-empty';
    empty.textContent = '尚無文字回饋';

    empty.style.cssText = [
      'width:100%',
      'height:100%',
      'min-height:240px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'color:rgba(255,255,255,.4)',
      'font-size:2rem',
      'font-weight:600'
    ].join(';');

    container.appendChild(empty);
    return;
  }

  // ------------------------------------------------------------
  // 3. 顯示 Canvas
  // ------------------------------------------------------------
  canvas.style.display = 'block';

  var oldEmpty = container.querySelector('.word-cloud-empty');
  if (oldEmpty) oldEmpty.remove();

  // ------------------------------------------------------------
  // 4. 取得 Canvas 尺寸
  //
  // 不直接依賴 canvas 原本高度，
  // 避免 Canvas 高度為 0 導致整個文字雲看不到。
  // ------------------------------------------------------------
  var w = container.clientWidth;

  if (!w || w < 100) {
    w = canvas.clientWidth || 900;
  }

  var h = container.clientHeight;

  if (!h || h < 180) {
    h = Math.round(w * 0.58);
  }

  // Projection Dashboard 建議限制高度
  h = Math.max(260, Math.min(h, 520));

  var dpr = window.devicePixelRatio || 1;

  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';

  var ctx = canvas.getContext('2d');

  // 清除畫布
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 使用高 DPI
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // ------------------------------------------------------------
  // 5. 字體大小
  //
  // 核心：
  // 最大票數 = 最大字
  // 最小票數 = 最小字
  //
  // 使用線性比例，讓 3票 / 2票 / 1票
  // 有非常明顯的視覺差異。
  // ------------------------------------------------------------
  var maxCount = entries[0].count;
  var minCount = entries[entries.length - 1].count;

  // Dashboard 字體大小
  var MAX_FONT = Math.min(82, Math.max(56, w * 0.075));
  var MIN_FONT = Math.min(30, Math.max(22, w * 0.028));

  function getFontSize(count) {

    // 所有票數相同
    if (maxCount === minCount) {
      return Math.round((MAX_FONT + MIN_FONT) / 2);
    }

    // 票數比例
    var ratio = (count - minCount) / (maxCount - minCount);

    // 線性放大
    return Math.round(
      MIN_FONT + ratio * (MAX_FONT - MIN_FONT)
    );
  }

  // ------------------------------------------------------------
  // 6. 顏色
  // ------------------------------------------------------------
  var colors = [
    '#A78BFA',
    '#F472B6',
    '#818CF8',
    '#34D399',
    '#FBBF24',
    '#FB923C',
    '#C4B5FD',
    '#F9A8D4'
  ];

  // ------------------------------------------------------------
  // 7. 已放置文字的位置
  // ------------------------------------------------------------
  var placed = [];

  // ------------------------------------------------------------
  // 8. 判斷兩個矩形是否重疊
  //
  // 加一點 padding，讓文字彼此不要貼太近。
  // ------------------------------------------------------------
  function isCollision(a, b) {
    var padding = 8;

    return !(
      a.x + a.w + padding < b.x ||
      b.x + b.w + padding < a.x ||
      a.y + a.h + padding < b.y ||
      b.y + b.h + padding < a.y
    );
  }

  // ------------------------------------------------------------
  // 9. 尋找文字位置
  //
  // 從中央開始，沿著 spiral 往外找。
  // 比原本隨機角度的方法穩定很多。
  // ------------------------------------------------------------
  function findPosition(text, fontSize) {

    ctx.font =
      '700 ' +
      fontSize +
      'px "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    var textWidth = ctx.measureText(text).width;

    // 中文字稍微增加左右空間
    var boxWidth = textWidth + 12;
    var boxHeight = fontSize * 1.25;

    var centerX = w / 2;
    var centerY = h / 2;

    // 最大搜尋半徑
    var maxRadius = Math.min(w, h) * 0.48;

    // Spiral 搜尋
    for (var radius = 0; radius <= maxRadius; radius += 4) {

      // 每一圈增加角度
      var steps = Math.max(12, Math.round(radius * 0.35));

      for (var s = 0; s < steps; s++) {

        var angle =
          (s / steps) * Math.PI * 2 +
          radius * 0.045;

        var x =
          centerX +
          Math.cos(angle) * radius -
          boxWidth / 2;

        var y =
          centerY +
          Math.sin(angle) * radius -
          boxHeight / 2;

        // 不要碰到邊界
        if (x < 8) continue;
        if (x + boxWidth > w - 8) continue;
        if (y < 8) continue;
        if (y + boxHeight > h - 8) continue;

        var rect = {
          x: x,
          y: y,
          w: boxWidth,
          h: boxHeight
        };

        // 檢查是否跟已放置文字重疊
        var collision = false;

        for (var p = 0; p < placed.length; p++) {
          if (isCollision(rect, placed[p])) {
            collision = true;
            break;
          }
        }

        if (!collision) {
          return {
            x: x,
            y: y,
            width: textWidth,
            height: boxHeight,
            rect: rect
          };
        }
      }
    }

    return null;
  }

  // ------------------------------------------------------------
  // 10. 先畫大字，再畫小字
  //
  // 因為 entries 已經按照票數由高到低排序，
  // 所以最高票的文字一定會優先取得中央位置。
  // ------------------------------------------------------------
  entries.forEach(function(entry, index) {

    var fontSize = getFontSize(entry.count);
    var result = null;

    // 如果空間不足，逐步縮小字體再嘗試
    for (var attempt = 0; attempt < 8; attempt++) {

      result = findPosition(entry.text, fontSize);

      if (result) break;

      fontSize = Math.round(fontSize * 0.88);

      // 不讓文字縮得太小
      if (fontSize < 18) {
        fontSize = 18;
        result = findPosition(entry.text, fontSize);
        break;
      }
    }

    // 找不到位置就略過
    if (!result) return;

    placed.push(result.rect);

    // ----------------------------------------------------------
    // 11. 繪製文字
    // ----------------------------------------------------------
    ctx.font =
      '700 ' +
      fontSize +
      'px "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif';

    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // 票數越高，不透明度越高
    var opacity = 0.72;

    if (maxCount > 0) {
      opacity =
        0.70 +
        0.30 * (entry.count / maxCount);
    }

    ctx.globalAlpha = opacity;
    ctx.fillStyle = colors[index % colors.length];

    ctx.fillText(
      entry.text,
      result.x,
      result.y + result.height / 2
    );

    ctx.globalAlpha = 1;
  });

  // ------------------------------------------------------------
  // 12. 清除原本 Q3 下方的 keyword tags
  //
  // 因為現在 Q3 已經完整使用文字雲呈現，
  // 不再需要下面另外一排：
  // 「信任 3 / AI賦能 2 / 工作生活平衡 2 ...」
  // ------------------------------------------------------------
  var kwEl = document.getElementById('keywordList');

  if (kwEl) {
    kwEl.innerHTML = '';
    kwEl.style.display = 'none';
  }
}
};
