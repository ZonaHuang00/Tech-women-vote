/* ============================================================
   content.js — 所有可編輯文字集中管理
   ============================================================
   
   ★ 修改此檔案即可更新頁面上的所有文字 ★
   
   注意：Q1/Q2/Q3 的選項直接寫在 vote.html 中，
   因為選項牽涉到 emoji + HTML 結構，直接改 HTML 最直觀。
   此檔案管理的是：Hero、狀態列、按鈕、錯誤訊息、感謝頁、Dashboard 等文字。
   
   ============================================================ */

const CONTENT = {

  /* ------ 活動基本資訊 ------ */
  event: {
    year: '2026',
    name: 'TechWomen@TW',
    logoInitials: 'TW',
  },

  /* ------ Hero Section ------ */
  hero: {
    theme: ['跨世代共融', 'AI', '女性領導力'],
    themeSeparator: '×',
    welcome: '歡迎每一位開創未來的妳。<br>妳的聲音，將成為改變的力量。',
    badge: '✦ 午餐時段 · 現場互動投票',
    scrollHint: '向下滑動開始投票',
  },

  /* ------ 投票狀態列 ------ */
  status: {
    liveText: '投票進行中',
    countPrefix: '已有',
    countSuffix: '人參與',
  },

  /* ------ 題目標題與提示（選項寫在 vote.html）------ */
  questions: {
    q1: {
      tag: 'Q1',
      typeLabel: '複選題',
      title: '你認為未來 10 年職場最重要的能力是什麼？',
      hint: '最多可選擇 3 項',
      maxSelect: 3,
    },
    q2: {
      tag: 'Q2',
      typeLabel: '複選題',
      title: '不同世代最能互相學習的能力是什麼？',
      hint: '最多可選擇 3 項',
      maxSelect: 3,
    },
    q3: {
      tag: 'Q3',
      typeLabel: '複選題',
      title: '請選出最符合你期待未來職場的三個詞',
      hint: '最多可選擇 3 項',
      maxSelect: 3,
    },
  },

  /* ------ 送出區域 ------ */
  submit: {
    buttonText: '送出我的投票',
    loadingText: '送出中⋯',
    note: '每人限投一次，送出後無法修改',
  },

  /* ------ 已投票 / 截止畫面 ------ */
  states: {
    alreadyVoted: {
      icon: '🗳️',
      title: '妳已完成投票',
      message: '每人限投一次，感謝妳的參與！',
      sub: '結果將在下午 Workshop 時公佈',
    },
    closed: {
      icon: '⏰',
      title: '投票已截止',
      message: '感謝妳的關注，請期待下午的結果公佈！',
      linkText: '查看投票結果',
      linkUrl: 'result.html',
    },
  },

  /* ------ 感謝頁 ------ */
  thankyou: {
    title: '感謝妳的參與！',
    subtitle: '投票已成功送出 🎉',
    timeLabel: '🕐 投票時間',
    idLabel: '🎫 投票編號',
    eventInfo: [
      { icon: '📍', text: '投票結果將於下午 Workshop 時段公佈' },
      { icon: '💡', text: '請留意現場大螢幕的即時排行榜' },
      { icon: '☕', text: '享用午餐的同時，期待精彩下午場！' },
    ],
    footerQuote: '妳的每一個選擇，都在推動科技更具包容力。',
  },

  /* ------ Dashboard ------ */
  dashboard: {
    headerTitle: '現場投票結果',
    votersLabel: '參與人數',
    timeLabel: '統計時間',
    loading: '正在載入投票結果⋯',
    notReady: {
      icon: '🔒',
      title: '結果尚未公佈',
      message: '投票仍在進行中，請稍候⋯',
    },
    panels: {
      q1: { badge: 'Q1', title: '未來 10 年職場最重要的能力' },
      q2: { badge: 'Q2', title: '跨世代最能互相學習的能力' },
      q3: { badge: 'Q3', title: '最期待的未來職場關鍵詞' },
    },
  },

  /* ------ Footer ------ */
  footer: {
    brand: 'TechWomen<span>@</span>TW',
    copy: '© 2026',
  },

  /* ------ 驗證錯誤訊息 ------ */
  errors: {
    checkboxMin: '請至少選擇一個選項',
    checkboxMax: '已達選擇上限',
    networkError: '送出失敗，請檢查網路連線後再試一次',
  },
};