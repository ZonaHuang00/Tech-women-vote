/* ============================================================
   content.js — 所有可編輯文字與題目資料集中管理 (雙語支援)
   ============================================================
   ★ 修改此檔案即可更新中英文介面、題目與選項 ★
   ============================================================ */

const CONTENT = {
  // 活動基本資訊
  event: {
    year: '2026',
    name: 'TechWomen@TW',
    logoInitials: 'TW',
  },

  // 介面通用文字 (支援 zh 與 en)
  ui: {
    zh: {
      langSwitchHint: '可隨時切換語言',
      heroThemes: ['跨世代共融', 'AI', '女性領導力'],
      heroWelcome: '歡迎每一位開創未來的妳。<br>妳的聲音，將成為改變的力量。',
      heroBadge: '✦ 午餐時段 · 現場互動投票',
      scrollHint: '向下滑動開始投票',
      liveStatus: '投票進行中',
      countPrefix: '已有',
      countSuffix: '人參與',
      submitBtn: '送出我的投票',
      submittingBtn: '送出中⋯',
      submitNote: '每人限投一次，送出後無法修改',
      counterTemplate: (cur, max) => `已選 ${cur} / ${max} 項`,
      counterMaxLimit: (max) => `已選 ${max} / ${max} 項（已達上限）`,
      alreadyVotedTitle: '妳已完成投票',
      alreadyVotedMsg: '每人限投一次，感謝妳的參與！',
      alreadyVotedSub: '結果將在下午 Workshop 時公佈',
      closedTitle: '投票已截止',
      closedMsg: '感謝妳的關注，請期待下午的結果公佈！',
      closedLink: '查看投票結果',
      errorMin: '請至少選擇一個選項',
      errorMax: '已達選擇上限',
      networkError: '送出失敗，請檢查網路連線後再試一次'
    },
    en: {
      langSwitchHint: 'You can switch languages anytime',
      heroThemes: ['Intergenerational Inclusion', 'AI', 'Female Leadership'],
      heroWelcome: 'Welcome to every woman shaping the future.<br>Your voice will be the catalyst for change.',
      heroBadge: '✦ Lunch Session · Live Interactive Voting',
      scrollHint: 'Scroll down to start voting',
      liveStatus: 'Voting is live',
      countPrefix: '',
      countSuffix: 'participants',
      submitBtn: 'Submit Vote',
      submittingBtn: 'Submitting...',
      submitNote: 'One vote per person. Cannot be changed after submission.',
      counterTemplate: (cur, max) => `Selected ${cur} / ${max}`,
      counterMaxLimit: (max) => `Selected ${max} / ${max} (Limit reached)`,
      alreadyVotedTitle: 'You have already voted',
      alreadyVotedMsg: 'One vote per person. Thank you for participating!',
      alreadyVotedSub: 'Results will be announced during the afternoon Workshop',
      closedTitle: 'Voting has closed',
      closedMsg: 'Thank you for your interest. Stay tuned for the results this afternoon!',
      closedLink: 'View Results',
      errorMin: 'Please select at least one option',
      errorMax: 'Selection limit reached',
      networkError: 'Submission failed. Please check your network and try again.'
    }
  },

  // 投票題目與選項清單 (日後修改文字/選項請在此調整)
  questions: {
    q1: {
      tag: 'Q1',
      typeLabel: { zh: '複選題', en: 'Multiple Choice' },
      maxSelect: 3,
      title: {
        zh: '你認為未來 10 年職場最重要的能力是什麼？',
        en: 'What do you think will be the most important skills in the workplace over the next 10 years?'
      },
      hint: {
        zh: '最多可選擇 3 項',
        en: 'Select up to 3 options'
      },
      options: [
        { id: 'q1_ai', icon: '🤖', text: { zh: 'AI工具運用', en: 'AI Tool Application' } },
        { id: 'q1_emotion', icon: '🧘', text: { zh: '情緒管理', en: 'Emotional Management' } },
        { id: 'q1_comm', icon: '🤝', text: { zh: '溝通協調力', en: 'Communication & Coordination' } },
        { id: 'q1_problem', icon: '🧩', text: { zh: '解決問題的能力', en: 'Problem Solving Ability' } },
        { id: 'q1_resilience', icon: '💪', text: { zh: '抗壓性', en: 'Resilience' } },
        { id: 'q1_innovation', icon: '💡', text: { zh: '創新思維', en: 'Innovative Thinking' } },
        { id: 'q1_leadership', icon: '👑', text: { zh: '領導力', en: 'Leadership' } },
        { id: 'q1_networking', icon: '🌐', text: { zh: '人脈經營能力', en: 'Networking Ability' } },
        { id: 'q1_logic', icon: '🧠', text: { zh: '思考邏輯能力', en: 'Logical Thinking Ability' } },
        { id: 'q1_time', icon: '⏰', text: { zh: '時間管理能力', en: 'Time Management Ability' } }
      ]
    },
    q2: {
      tag: 'Q2',
      badgeClass: 'q-badge--pink',
      chipClass: 'vote-chip--pink',
      typeLabel: { zh: '複選題', en: 'Multiple Choice' },
      maxSelect: 3,
      title: {
        zh: '不同世代最能互相學習的能力是什麼？',
        en: 'What skills can different generations learn most from each other?'
      },
      hint: {
        zh: '最多可選擇 3 項',
        en: 'Select up to 3 options'
      },
      options: [
        // ★ 已將「問題解決思維」與「問題解決經驗」合併為單一選項
        { id: 'q2_problem_solving_exp', icon: '🔍', text: { zh: '問題解決思維與經驗', en: 'Problem-solving Mindset & Experience' } },
        { id: 'q2_comm', icon: '💬', text: { zh: '溝通與人際關係建立', en: 'Communication & Relationships' } },
        { id: 'q2_risk', icon: '⚠️', text: { zh: '風險意識管理', en: 'Risk Management' } },
        { id: 'q2_efficiency', icon: '⏱️', text: { zh: '工作效率與時間管理', en: 'Work Efficiency & Time Management' } },
        { id: 'q2_innovation', icon: '🚀', text: { zh: '創新思維與挑戰現狀', en: 'Innovative Thinking & Challenging the Status Quo' } },
        { id: 'q2_resilience', icon: '🏋️', text: { zh: '抗壓與韌性', en: 'Resilience & Stress Tolerance' } },
        { id: 'q2_crossculture', icon: '🌍', text: { zh: '跨文化合作能力', en: 'Cross-cultural Collaboration' } },
        { id: 'q2_balance', icon: '⚖️', text: { zh: '工作與生活平衡觀念', en: 'Work-Life Balance Mindset' } },
        { id: 'q2_career', icon: '📈', text: { zh: '職涯發展規劃能力', en: 'Career Planning' } },
        { id: 'q2_tech', icon: '📱', text: { zh: '新技術的接受度', en: 'Openness to New Technology' } }
      ]
    },
    q3: {
      tag: 'Q3',
      badgeClass: 'q-badge--teal',
      chipClass: 'vote-chip--teal',
      typeLabel: { zh: '複選題', en: 'Multiple Choice' },
      maxSelect: 3,
      title: {
        zh: '請選出最符合你期待未來職場的三個詞',
        en: 'Select three keywords that best describe your vision of the future workplace'
      },
      hint: {
        zh: '最多可選擇 3 項',
        en: 'Select up to 3 options'
      },
      options: [
        { id: 'q3_trust', icon: '🤞', text: { zh: '信任', en: 'Trust' } },
        { id: 'q3_respect', icon: '🙏', text: { zh: '尊重', en: 'Respect' } },
        { id: 'q3_growth', icon: '🌱', text: { zh: '成長', en: 'Growth' } },
        { id: 'q3_innovation', icon: '💡', text: { zh: '創新', en: 'Innovation' } },
        { id: 'q3_flexibility', icon: '🔄', text: { zh: '彈性', en: 'Flexibility' } },
        { id: 'q3_inclusion', icon: '🤗', text: { zh: '共融', en: 'Inclusion' } },
        { id: 'q3_ai_empower', icon: '🤖', text: { zh: 'AI賦能', en: 'AI Empowerment' } },
        { id: 'q3_diversity', icon: '🌈', text: { zh: '多元包容', en: 'Diversity' } },
        { id: 'q3_balance', icon: '⚖️', text: { zh: '工作生活平衡', en: 'Work-Life Balance' } },
        { id: 'q3_psy_safety', icon: '🛡️', text: { zh: '心理安全感', en: 'Psychological Safety' } }
      ]
    }
  },

  // 感謝頁設定
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

  // Dashboard 設定
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

  footer: {
    brand: 'TechWomen<span>@</span>TW',
    copy: '© 2026',
  }
};
