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
var API_URL = '';

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

    var entries = Object.entries(words)
      .map(function(e) { return { text: e[0], count: e[1] }; })
      .sort(function(a, b) { return b.count - a.count; });

    var canvas = document.getElementById('wordCloudCanvas');
    if (!canvas) return;
    var container = canvas.parentElement;

    if (entries.length === 0) {
      container.innerHTML = '<p style="color:rgba(255,255,255,.4);font-size:2rem;">尚無文字回饋</p>';
      return;
    }

    var dpr = window.devicePixelRatio || 1;
    var w = container.offsetWidth;
    var h = container.offsetHeight || Math.round(w * 0.55);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var mxC = entries[0].count;
    var mnC = entries[entries.length - 1].count;
    var mxF = Math.min(w * 0.08, 72);
    var mnF = Math.max(w * 0.02, 18);
    var colors = ['#A78BFA', '#F472B6', '#818CF8', '#34D399', '#FBBF24', '#FB923C', '#C4B5FD', '#F9A8D4'];
    var placed = [];

    function fs(c) {
      if (mxC === mnC) return (mxF + mnF) / 2;
      return mnF + ((c - mnC) / (mxC - mnC)) * (mxF - mnF);
    }

    function hit(a, b) {
      return !(a.x + a.w < b.x || b.x + b.w < a.x ||
               a.y + a.h < b.y || b.y + b.h < a.y);
    }

    function tryPlace(text, size) {
      ctx.font = 'bold ' + size + 'px "Inter","Noto Sans TC",sans-serif';
      var tw = ctx.measureText(text).width + 12;
      var th = size * 1.35;
      var cx = w / 2, cy = h / 2;
      var angle = Math.random() * Math.PI * 2;

      for (var r = 0; r < Math.max(w, h) * 0.55; r += 5) {
        var x = cx + r * Math.cos(angle) - tw / 2;
        var y = cy + r * Math.sin(angle) + th / 4;

        if (x < 4 || x + tw > w - 4 || y - th < 4 || y > h - 4) {
          angle += 0.5;
          continue;
        }

        var rect = { x: x, y: y - th, w: tw, h: th };
        var collision = false;
        for (var p = 0; p < placed.length; p++) {
          if (hit(rect, placed[p])) { collision = true; break; }
        }
        if (!collision) return { x: x, y: y, rect: rect };
        angle += 0.3;
      }
      return null;
    }

    entries.forEach(function(entry, i) {
      var size = fs(entry.count);
      var result = null;
      for (var attempt = 0; attempt < 5 && size >= mnF; attempt++) {
        result = tryPlace(entry.text, size);
        if (result) break;
        size *= 0.8;
      }
      if (result) {
        placed.push(result.rect);
        ctx.font = 'bold ' + size + 'px "Inter","Noto Sans TC",sans-serif';
        ctx.fillStyle = colors[i % colors.length];
        ctx.globalAlpha = 0.75 + (0.25 * entry.count / mxC);
        ctx.fillText(entry.text, result.x, result.y);
        ctx.globalAlpha = 1;
      }
    });

    // Keyword tags
    var kwEl = document.getElementById('keywordList');
    if (kwEl) {
      entries.slice(0, 8).forEach(function(entry) {
        var tag = document.createElement('span');
        tag.className = 'dash-kw-tag';
        tag.innerHTML = entry.text + ' <span class="dash-kw-count">' + entry.count + '</span>';
        kwEl.appendChild(tag);
      });
    }
  }
};