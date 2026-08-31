/* ============================================================
   2026 TechWomen@TW — Core Application
   ============================================================ */

/* ---- 設定區 ---- */
var API_URL = 'https://script.google.com/macros/s/AKfycbyVRI7a4Cg5utMYEX3ud5D7qKiWMD4RpDBUnpI0gZfxjOQ1--fEw2IFpuG9lhfD9pcUAA/exec';

var VOTE_DEADLINE = new Date('2026-12-31T13:30:00+08:00');
var VOTED_KEY = 'techwomen_2026_voted';

// 判斷是否為離線模式
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
  currentLang: 'zh', // 預設語言 ('zh' 或 'en')
  questionIds: ['q1', 'q2', 'q3'],
  selectedValues: { q1: [], q2: [], q3: [] },

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

    // 渲染雙語介面與題目
    this.render();
    this.bindEvents();
    this.loadVoterCount();
  },

  setLanguage: function(lang) {
    if (this.currentLang === lang) return;
    this.currentLang = lang;
    this.render();
  },

  render: function() {
    var self = this;
    var lang = this.currentLang;
    var ui = (typeof CONTENT !== 'undefined' && CONTENT.ui && CONTENT.ui[lang]) ? CONTENT.ui[lang] : {};

    // 1. 切換語言按鈕樣式
    var btnZh = document.getElementById('langBtnZh');
    var btnEn = document.getElementById('langBtnEn');
    if (btnZh && btnEn) {
      btnZh.className = 'lang-toggle-btn ' + (lang === 'zh' ? 'active' : '');
      btnEn.className = 'lang-toggle-btn ' + (lang === 'en' ? 'active' : '');
    }
    var langHint = document.getElementById('langHint');
    if (langHint) langHint.textContent = ui.langSwitchHint || '';

    // 2. Hero 區域多語系文字
    var heroThemes = document.querySelectorAll('.hero-theme .theme-line');
    if (heroThemes.length >= 3 && ui.heroThemes) {
      heroThemes[0].textContent = ui.heroThemes[0];
      heroThemes[1].textContent = ui.heroThemes[1];
      heroThemes[2].textContent = ui.heroThemes[2];
    }
    var heroWelcome = document.querySelector('.hero-welcome');
    if (heroWelcome && ui.heroWelcome) heroWelcome.innerHTML = ui.heroWelcome;
    var heroBadge = document.querySelector('.hero-badge');
    if (heroBadge && ui.heroBadge) heroBadge.innerHTML = '<span class="badge-glow"></span>' + ui.heroBadge;
    var scrollHint = document.querySelector('.scroll-hint span');
    if (scrollHint && ui.scrollHint) scrollHint.textContent = ui.scrollHint;

    // 3. 狀態列文字
    var liveText = document.getElementById('liveStatusText');
    if (liveText) liveText.textContent = ui.liveStatus || '投票進行中';
    var prefixText = document.getElementById('countPrefixText');
    if (prefixText) prefixText.textContent = ui.countPrefix ? ui.countPrefix + ' ' : '';
    var suffixText = document.getElementById('countSuffixText');
    if (suffixText) suffixText.textContent = ' ' + (ui.countSuffix || '人參與');

    // 4. 動態渲染所有題目與選項
    var container = document.getElementById('questionsContainer');
    if (container && typeof CONTENT !== 'undefined' && CONTENT.questions) {
      container.innerHTML = '';

      this.questionIds.forEach(function(qid) {
        var qData = CONTENT.questions[qid];
        if (!qData) return;

        var maxSelect = qData.maxSelect || 3;
        var badgeClass = qData.badgeClass || '';
        var chipClass = qData.chipClass || '';

        var card = document.createElement('section');
        card.className = 'question-card glass-card';
        card.setAttribute('data-question', qid);

        var title = qData.title[lang] || qData.title['zh'];
        var hint = qData.hint[lang] || qData.hint['zh'];
        var typeLabel = qData.typeLabel[lang] || qData.typeLabel['zh'];

        var optionsHtml = '';
        qData.options.forEach(function(opt) {
          // ★ 送出時一律採用固定中文文字或唯一識別，確保 GAS 統計一致
          var submitValue = opt.text['zh'];
          var displayLabel = opt.text[lang] || opt.text['zh'];
          var isChecked = self.selectedValues[qid].indexOf(submitValue) > -1 ? 'checked' : '';

          optionsHtml += `
            <label class="vote-chip ${chipClass}">
              <input type="checkbox" name="${qid}" value="${submitValue}" ${isChecked}>
              <div class="chip-face">
                <span class="chip-icon">${opt.icon}</span>
                <span class="chip-text">${displayLabel}</span>
                <div class="chip-check-ring">
                  <svg viewBox="0 0 20 20" fill="none"><path d="M6 10l3 3 5-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </div>
              </div>
            </label>
          `;
        });

        var curCount = self.selectedValues[qid].length;
        var counterText = ui.counterTemplate ? ui.counterTemplate(curCount, maxSelect) : `已選 ${curCount} / ${maxSelect} 項`;

        card.innerHTML = `
          <div class="card-glow"></div>
          <div class="q-header">
            <span class="q-badge ${badgeClass}">${qData.tag}</span>
            <span class="q-type">${typeLabel}</span>
          </div>
          <h2 class="q-title">${title}</h2>
          <p class="q-hint">${hint}</p>
          <div class="chip-grid" id="${qid}-options">
            ${optionsHtml}
          </div>
          <div class="selection-counter" id="${qid}-counter">${counterText}</div>
          <div class="error-message" id="${qid}-error"></div>
        `;

        container.appendChild(card);
      });

      // 重新綁定 Checkbox 事件
      this.bindCheckboxEvents();
    }

    // 5. 按鈕與提示文字
    var submitBtnText = document.querySelector('#submitBtn .btn-text');
    if (submitBtnText && ui.submitBtn) submitBtnText.textContent = ui.submitBtn;
    var submitBtnLoading = document.querySelector('#submitBtn .btn-loading');
    if (submitBtnLoading && ui.submittingBtn) submitBtnLoading.innerHTML = '<span class="spinner"></span>' + ui.submittingBtn;
    var submitNote = document.querySelector('.submit-note');
    if (submitNote && ui.submitNote) submitNote.textContent = ui.submitNote;

    // 6. 狀態頁面文字 (Already Voted / Closed)
    var avTitle = document.querySelector('#alreadyVotedScreen h2');
    if (avTitle && ui.alreadyVotedTitle) avTitle.textContent = ui.alreadyVotedTitle;
    var avMsg = document.querySelector('#alreadyVotedScreen p');
    if (avMsg && ui.alreadyVotedMsg) avMsg.textContent = ui.alreadyVotedMsg;
    var avSub = document.querySelector('#alreadyVotedScreen .state-sub');
    if (avSub && ui.alreadyVotedSub) avSub.textContent = ui.alreadyVotedSub;

    var clTitle = document.querySelector('#closedScreen h2');
    if (clTitle && ui.closedTitle) clTitle.textContent = ui.closedTitle;
    var clMsg = document.querySelector('#closedScreen p');
    if (clMsg && ui.closedMsg) clMsg.textContent = ui.closedMsg;
    var clLink = document.querySelector('#closedScreen .cta-link');
    if (clLink && ui.closedLink) clLink.textContent = ui.closedLink;
  },

  showScreen: function(screenId) {
    var form = document.getElementById('voteForm');
    if (form) form.style.display = 'none';
    var pill = document.querySelector('.status-pill');
    if (pill) pill.style.display = 'none';
    var langWrap = document.querySelector('.lang-switch-wrapper');
    if (langWrap) langWrap.style.display = 'none';
    var el = document.getElementById(screenId);
    if (el) el.style.display = 'flex';
  },

  bindEvents: function() {
    var self = this;
    var form = document.getElementById('voteForm');
    if (!form) return;

    // 表單送出
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      self.submitVote();
    });
  },

  bindCheckboxEvents: function() {
    var self = this;
    var lang = this.currentLang;
    var ui = (typeof CONTENT !== 'undefined' && CONTENT.ui && CONTENT.ui[lang]) ? CONTENT.ui[lang] : {};

    this.questionIds.forEach(function(qid) {
      var qConfig = { maxSelect: 3 };
      if (typeof CONTENT !== 'undefined' && CONTENT.questions && CONTENT.questions[qid]) {
        qConfig = CONTENT.questions[qid];
      }
      var maxSelect = qConfig.maxSelect || 3;
      var allInputs = document.querySelectorAll('input[name="' + qid + '"]');
      var counter = document.getElementById(qid + '-counter');

      for (var i = 0; i < allInputs.length; i++) {
        (function(checkbox) {
          checkbox.addEventListener('change', function() {
            var checkedInputs = document.querySelectorAll('input[name="' + qid + '"]:checked');
            var checkedCount = checkedInputs.length;

            // 超過上限復原
            if (checkedCount > maxSelect) {
              checkbox.checked = false;
              if (counter) {
                counter.textContent = ui.counterMaxLimit ? ui.counterMaxLimit(maxSelect) : `已選 ${maxSelect} / ${maxSelect} 項（已達上限）`;
                counter.style.color = 'var(--c-danger)';
                setTimeout(function() { counter.style.color = ''; }, 1500);
              }
              return;
            }

            // 更新已選紀錄
            var currentSelections = [];
            for (var j = 0; j < checkedInputs.length; j++) {
              currentSelections.push(checkedInputs[j].value);
            }
            self.selectedValues[qid] = currentSelections;

            // 更新計數器
            if (counter) {
              counter.textContent = ui.counterTemplate ? ui.counterTemplate(checkedCount, maxSelect) : `已選 ${checkedCount} / ${maxSelect} 項`;
            }

            // 清除錯誤
            self.clearError(qid);
          });
        })(allInputs[i]);
      }
    });
  },

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
      void card.offsetWidth;
      card.classList.add('has-error');
    }
  },

  validate: function() {
    var self = this;
    var valid = true;
    var firstErrorCard = null;
    var lang = this.currentLang;
    var ui = (typeof CONTENT !== 'undefined' && CONTENT.ui && CONTENT.ui[lang]) ? CONTENT.ui[lang] : {};
    var errMsg = ui.errorMin || '請至少選擇一個選項';

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

    if (!valid && firstErrorCard) {
      firstErrorCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return valid;
  },

  submitVote: function() {
    var self = this;
    var lang = this.currentLang;
    var ui = (typeof CONTENT !== 'undefined' && CONTENT.ui && CONTENT.ui[lang]) ? CONTENT.ui[lang] : {};

    if (!this.validate()) return;

    if (new Date() > VOTE_DEADLINE) {
      this.showScreen('closedScreen');
      return;
    }

    var btn = document.getElementById('submitBtn');
    if (btn) btn.classList.add('loading');

    var voteId = generateVoteId();
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

    var voteTime = formatTime(new Date());
    var redirectUrl = 'thankyou.html?id=' + encodeURIComponent(voteId) + '&t=' + encodeURIComponent(voteTime);

    // 離線模式
    if (isOffline()) {
      console.log('[離線模式] 投票資料：', payload);
      setCookie(VOTED_KEY, voteId, 48);
      window.location.href = redirectUrl;
      return;
    }

    // 線上模式：送出到 Google Apps Script
    fetch(API_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload)
    }).then(function() {
      setCookie(VOTED_KEY, voteId, 48);
      window.location.href = redirectUrl;
    }).catch(function(err) {
      console.error('Submit error:', err);
      if (btn) btn.classList.remove('loading');
      var errMsg = ui.networkError || '送出失敗，請檢查網路連線後再試一次';
      alert(errMsg);
    });
  },

  loadVoterCount: function() {
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
   ThankYouApp & ResultApp 保留原始設定
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

var ResultApp = {
  init: function() {
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
    var canvas = document.getElementById('wordCloudCanvas');
    if (!canvas) return;
    var container = canvas.parentElement;
    if (!container) return;

    var entries = Object.entries(words)
      .map(function(e) { return { text: String(e[0]), count: Number(e[1]) || 0 }; })
      .filter(function(e) { return e.text.trim() !== '' && e.count > 0; })
      .sort(function(a, b) { return b.count - a.count; });

    if (entries.length === 0) {
      canvas.style.display = 'none';
      var oldEmpty = container.querySelector('.word-cloud-empty');
      if (oldEmpty) oldEmpty.remove();

      var empty = document.createElement('div');
      empty.className = 'word-cloud-empty';
      empty.textContent = '尚無文字回饋';
      empty.style.cssText = 'width:100%;height:100%;min-height:240px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,.4);font-size:2rem;font-weight:600;';
      container.appendChild(empty);
      return;
    }

    canvas.style.display = 'block';
    var oldEmpty = container.querySelector('.word-cloud-empty');
    if (oldEmpty) oldEmpty.remove();

    var w = container.clientWidth;
    if (!w || w < 100) w = canvas.clientWidth || 900;
    var h = container.clientHeight;
    if (!h || h < 180) h = Math.round(w * 0.58);
    h = Math.max(260, Math.min(h, 520));

    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    var ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var maxCount = entries[0].count;
    var minCount = entries[entries.length - 1].count;
    var MAX_FONT = Math.min(82, Math.max(56, w * 0.075));
    var MIN_FONT = Math.min(30, Math.max(22, w * 0.028));

    function getFontSize(count) {
      if (maxCount === minCount) return Math.round((MAX_FONT + MIN_FONT) / 2);
      var ratio = (count - minCount) / (maxCount - minCount);
      return Math.round(MIN_FONT + ratio * (MAX_FONT - MIN_FONT));
    }

    var colors = ['#A78BFA', '#F472B6', '#818CF8', '#34D399', '#FBBF24', '#FB923C', '#C4B5FD', '#F9A8D4'];
    var placed = [];

    function isCollision(a, b) {
      var padding = 8;
      return !(a.x + a.w + padding < b.x || b.x + b.w + padding < a.x || a.y + a.h + padding < b.y || b.y + b.h + padding < a.y);
    }

    function findPosition(text, fontSize) {
      ctx.font = '700 ' + fontSize + 'px "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var textWidth = ctx.measureText(text).width;
      var boxWidth = textWidth + 12;
      var boxHeight = fontSize * 1.25;
      var centerX = w / 2;
      var centerY = h / 2;
      var maxRadius = Math.min(w, h) * 0.48;

      for (var radius = 0; radius <= maxRadius; radius += 4) {
        var steps = Math.max(12, Math.round(radius * 0.35));
        for (var s = 0; s < steps; s++) {
          var angle = (s / steps) * Math.PI * 2 + radius * 0.045;
          var x = centerX + Math.cos(angle) * radius - boxWidth / 2;
          var y = centerY + Math.sin(angle) * radius - boxHeight / 2;
          if (x < 8 || x + boxWidth > w - 8 || y < 8 || y + boxHeight > h - 8) continue;
          var rect = { x: x, y: y, w: boxWidth, h: boxHeight };
          var collision = false;
          for (var p = 0; p < placed.length; p++) {
            if (isCollision(rect, placed[p])) {
              collision = true;
              break;
            }
          }
          if (!collision) {
            return { x: x, y: y, width: textWidth, height: boxHeight, rect: rect };
          }
        }
      }
      return null;
    }

    entries.forEach(function(entry, index) {
      var fontSize = getFontSize(entry.count);
      var result = null;
      for (var attempt = 0; attempt < 8; attempt++) {
        result = findPosition(entry.text, fontSize);
        if (result) break;
        fontSize = Math.round(fontSize * 0.88);
        if (fontSize < 18) {
          fontSize = 18;
          result = findPosition(entry.text, fontSize);
          break;
        }
      }
      if (!result) return;
      placed.push(result.rect);
      ctx.font = '700 ' + fontSize + 'px "Noto Sans TC", "Microsoft JhengHei", Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      var opacity = 0.72;
      if (maxCount > 0) opacity = 0.70 + 0.30 * (entry.count / maxCount);
      ctx.globalAlpha = opacity;
      ctx.fillStyle = colors[index % colors.length];
      ctx.fillText(entry.text, result.x, result.y + result.height / 2);
      ctx.globalAlpha = 1;
    });

    var kwEl = document.getElementById('keywordList');
    if (kwEl) {
      kwEl.innerHTML = '';
      kwEl.style.display = 'none';
    }
  }
};
