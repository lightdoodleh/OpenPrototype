/**
 * 新手引导 — 首次打开工作台时，用分步气泡把主要功能走一遍。
 *
 * 设计约束（改这个文件前先看一眼）：
 *   1. 外壳 HTML 是脚手架时复制的、之后不会自动升级，所以引导逻辑必须留在 /_kit/ 下，
 *      外壳里只有一对 <!-- onboarding:start/end --> 引用标签。
 *   2. runtime/shell/ 不在 static-check 的 NON_PAGE_DIRS 白名单里，会被当页面文件扫描，
 *      所以存储访问沿用 agent-panel.js 的 window['localStorage'] 写法绕开 FORBIDDEN_STORAGE 红线。
 *   3. 不改动外壳内联脚本和 agent-panel.js：锚点就绪靠 rAF 轮询等，重放按钮靠运行时注入。
 *
 * 调试：window.ProtoTour.reset() 清除"已看过"标记；URL 加 ?tour=off 可整体关闭。
 */
(function() {
  const KIT = window.PROTO_KIT || {};
  const NS = (KIT.productId || 'proto') + '-navigator';
  const SEEN_KEY = NS + '-onboarding-seen';
  const TOUR_VERSION = '1';        // 引导改版时 +1，可让老用户重新看一次
  const tourStorage = window['localStorage'];   // 见文件头约束 2，勿改成点号访问

  const GAP = 12;                  // 气泡与高亮框的间距
  const MARGIN = 12;               // 气泡与视口边缘的最小留白
  const PAD = 4;                   // 高亮框相对目标元素的外扩
  const READY_TIMEOUT = 8000;
  const VISIBLE_TIMEOUT = 20000;   // 标签页迟迟不可见时的兜底，见 waitVisible

  // ── 步骤配置 ──────────────────────────────────────────
  // selector 支持字符串或数组（数组取并集包围盒，一次框住相邻的几个元素）；
  // fallback 在主锚点不可见时兜底（例如 Agent 栏处于折叠态）。
  const STEPS = [
    {
      selector: ['#newFolderBtn', '#newPageBtn'],
      placement: 'bottom',
      title: '第一步 · 先把页面建起来',
      body: '点 <b>新建文件夹</b> 分模块，点 <b>新建页面</b> 建一个原型页。建完会自动写进左侧导航树，不用手动改配置。'
    },
    {
      selector: ['#navSearchInput', '#sidebarTree'],
      placement: 'right',
      title: '第二步 · 在这儿找页面',
      body: '左侧是全部原型页面，按目录分组。页面多了就在 <b>搜索</b> 框里输标题关键字，支持模糊匹配；拖动条目还能直接调整顺序。'
    },
    {
      selector: '#previewPlaceholder',
      fallback: '#previewFrame',
      placement: 'left',
      title: '第三步 · 点开就能预览',
      body: '点左侧任意页面，这里直接渲染出来，右上角 <b>在新标签打开 ↗</b> 可以全屏看。页面右下角还有个 <b>PRD</b> 悬浮按钮，随时能看和改这一页的需求说明。'
    },
    {
      selector: '#agentInput',
      fallback: '#agentPanel',
      placement: 'left',
      title: '第四步 · 用大白话改页面',
      body: '选中页面后，在这里描述你要改什么，比如「表格加一列负责人」。Agent 会直接改代码，中间的预览会自动刷新。'
    },
    {
      selector: '#agentPrdUpdateBtn',
      fallback: '#agentPanel',
      placement: 'left',
      title: '第五步 · 按 PRD 标红一键更新',
      body: '在 PRD 里把要改的地方标红，回到这里点这个按钮，Agent 就会按标红内容改页面。<b>需要先选中一个页面，按钮才可点。</b>'
    }
  ];

  // ── 运行状态 ──────────────────────────────────────────
  const state = {
    active: false,
    steps: [],        // 本次要走的步骤（已过滤掉这版外壳里不存在的锚点）
    index: 0,
    shown: 0,         // 实际展示过的步数，用来判断结束时该不该记"已看过"
    lastFocus: null,
    reposition: null
  };

  let els = {};

  // ── 工具 ──────────────────────────────────────────────
  // offsetParent 为 null 就说明自身或某个祖先 display:none —— 正是"Agent 栏折叠了"这种要走
  // fallback 的情况（本引导的锚点都不是 position:fixed，不会误判）。
  // 刻意不量 getBoundingClientRect 的宽高：布局还没排完时（刚导航完、标签页在后台）
  // 量出来会是 0，把本该展示的步骤误判成不可见而跳过。
  function isVisible(el) {
    return !!el && el.offsetParent !== null;
  }

  const selectorList = sel => (Array.isArray(sel) ? sel : [sel]);

  /** 解析一个步骤的锚点：主 selector 全不可见时退回 fallback，都不行返回 [] */
  function resolveTargets(step) {
    const pick = sel => selectorList(sel).map(s => document.querySelector(s)).filter(isVisible);
    const main = pick(step.selector);
    if (main.length) return main;
    return step.fallback ? pick(step.fallback) : [];
  }

  /**
   * 这一步在当前这版外壳里存不存在（只看 DOM 里有没有，不量尺寸）。
   * 步骤清单按"存在"过滤而不是按"可见"过滤：布局偶尔会有一瞬间量不到尺寸
   * （刚导航完还没排版、标签页在后台等），按可见过滤会把步骤永久少算一条。
   * 真正的可见性判断留到 go() 展示那一刻做。
   */
  function stepExists(step) {
    const has = sel => selectorList(sel).some(s => document.querySelector(s));
    return has(step.selector) || (step.fallback ? has(step.fallback) : false);
  }

  /** 多个元素的并集包围盒 */
  function unionRect(targets) {
    let top = Infinity, left = Infinity, right = -Infinity, bottom = -Infinity;
    targets.forEach(el => {
      const r = el.getBoundingClientRect();
      top = Math.min(top, r.top);
      left = Math.min(left, r.left);
      right = Math.max(right, r.right);
      bottom = Math.max(bottom, r.bottom);
    });
    return { top, left, right, bottom, width: right - left, height: bottom - top };
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  // ── DOM ───────────────────────────────────────────────
  function buildDom() {
    const blocker = document.createElement('div');
    blocker.className = 'tour-blocker';

    const spotlight = document.createElement('div');
    spotlight.className = 'tour-spotlight';

    const bubble = document.createElement('div');
    bubble.className = 'tour-bubble';
    bubble.setAttribute('role', 'dialog');
    bubble.setAttribute('aria-modal', 'true');
    bubble.setAttribute('aria-labelledby', 'tourTitle');
    bubble.innerHTML = [
      '<div class="tour-bubble-arrow"></div>',
      '<div class="tour-step-index" id="tourStepIndex"></div>',
      '<div class="tour-title" id="tourTitle"></div>',
      '<div class="tour-body" id="tourBody"></div>',
      '<div class="tour-actions">',
      '  <button class="tour-skip" id="tourSkipBtn" type="button">跳过引导</button>',
      '  <span class="tour-actions-spacer"></span>',
      '  <button class="tour-btn" id="tourPrevBtn" type="button">上一步</button>',
      '  <button class="tour-btn tour-btn-primary" id="tourNextBtn" type="button">下一步</button>',
      '</div>'
    ].join('');

    document.body.appendChild(blocker);
    document.body.appendChild(spotlight);
    document.body.appendChild(bubble);

    els = {
      blocker,
      spotlight,
      bubble,
      arrow: bubble.querySelector('.tour-bubble-arrow'),
      stepIndex: bubble.querySelector('#tourStepIndex'),
      title: bubble.querySelector('#tourTitle'),
      body: bubble.querySelector('#tourBody'),
      skip: bubble.querySelector('#tourSkipBtn'),
      prev: bubble.querySelector('#tourPrevBtn'),
      next: bubble.querySelector('#tourNextBtn')
    };

    els.skip.addEventListener('click', () => stop(true));
    els.prev.addEventListener('click', () => go(state.index - 1));
    els.next.addEventListener('click', () => go(state.index + 1));
  }

  function teardownDom() {
    [els.blocker, els.spotlight, els.bubble].forEach(el => { if (el) el.remove(); });
    els = {};
  }

  // ── 定位 ──────────────────────────────────────────────
  /**
   * 把气泡贴到高亮矩形旁边：首选方向放不下就翻到对侧；两侧都放不下且目标本身足够大
   * （典型如"整个中间预览区"），就直接居中盖在目标上，比硬挤到边上压住目标边缘好看；
   * 目标很小则退回 clamp 回视口，免得气泡把目标整个遮住。
   * 箭头指向目标中心；目标中心落在气泡范围外时直接藏掉，免得指错地方。
   */
  function place(rect, placement) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const bw = els.bubble.offsetWidth;
    const bh = els.bubble.offsetHeight;

    const horizontal = placement === 'left' || placement === 'right';
    const fitsBefore = horizontal ? rect.left - GAP - bw >= MARGIN : rect.top - GAP - bh >= MARGIN;
    const fitsAfter = horizontal
      ? rect.right + GAP + bw <= vw - MARGIN
      : rect.bottom + GAP + bh <= vh - MARGIN;
    const roomInside = horizontal ? rect.width > bw + 40 : rect.height > bh + 40;

    if (!fitsBefore && !fitsAfter && roomInside) {
      const left = clamp(rect.left + rect.width / 2 - bw / 2, MARGIN, Math.max(MARGIN, vw - bw - MARGIN));
      const top = clamp(rect.top + rect.height / 2 - bh / 2, MARGIN, Math.max(MARGIN, vh - bh - MARGIN));
      els.bubble.style.left = left + 'px';
      els.bubble.style.top = top + 'px';
      els.arrow.className = 'tour-bubble-arrow is-hidden';
      return;
    }

    let dir = placement;
    if (dir === 'bottom' && !fitsAfter && fitsBefore) dir = 'top';
    else if (dir === 'top' && !fitsBefore && fitsAfter) dir = 'bottom';
    else if (dir === 'right' && !fitsAfter && fitsBefore) dir = 'left';
    else if (dir === 'left' && !fitsBefore && fitsAfter) dir = 'right';

    let left, top;
    if (dir === 'bottom' || dir === 'top') {
      left = rect.left + rect.width / 2 - bw / 2;
      top = dir === 'bottom' ? rect.bottom + GAP : rect.top - GAP - bh;
    } else {
      left = dir === 'right' ? rect.right + GAP : rect.left - GAP - bw;
      top = rect.top + rect.height / 2 - bh / 2;
    }

    left = clamp(left, MARGIN, Math.max(MARGIN, vw - bw - MARGIN));
    top = clamp(top, MARGIN, Math.max(MARGIN, vh - bh - MARGIN));

    els.bubble.style.left = left + 'px';
    els.bubble.style.top = top + 'px';

    // 箭头
    els.arrow.className = 'tour-bubble-arrow is-' + dir;
    if (dir === 'bottom' || dir === 'top') {
      const centerX = rect.left + rect.width / 2;
      if (centerX < left + 16 || centerX > left + bw - 16) els.arrow.classList.add('is-hidden');
      else { els.arrow.style.left = (centerX - left - 8) + 'px'; els.arrow.style.top = ''; }
    } else {
      const centerY = rect.top + rect.height / 2;
      if (centerY < top + 16 || centerY > top + bh - 16) els.arrow.classList.add('is-hidden');
      else { els.arrow.style.top = (centerY - top - 8) + 'px'; els.arrow.style.left = ''; }
    }
  }

  /** 重新量一遍当前步的锚点并摆好高亮框和气泡（resize / scroll 时也走这里） */
  function reposition() {
    const step = state.steps[state.index];
    if (!step) return;
    const targets = resolveTargets(step);
    if (!targets.length) return;

    const rect = unionRect(targets);
    els.spotlight.style.left = (rect.left - PAD) + 'px';
    els.spotlight.style.top = (rect.top - PAD) + 'px';
    els.spotlight.style.width = (rect.width + PAD * 2) + 'px';
    els.spotlight.style.height = (rect.height + PAD * 2) + 'px';

    place({
      left: rect.left - PAD,
      top: rect.top - PAD,
      right: rect.right + PAD,
      bottom: rect.bottom + PAD,
      width: rect.width + PAD * 2,
      height: rect.height + PAD * 2
    }, step.placement);
  }

  // ── 步骤切换 ──────────────────────────────────────────
  function go(index) {
    if (index < 0) return;
    // 一条都没真正展示过就走到头，说明是异常情况（锚点全都量不到），
    // 别把"已看过"记下来，否则用户会白白错过这次引导
    if (index >= state.steps.length) return stop(state.shown > 0);

    state.index = index;
    const step = state.steps[index];
    const targets = resolveTargets(step);

    // 走到这一步时锚点没了（比如中途切了页面），跳过它继续往下
    if (!targets.length) return go(index + 1);
    state.shown++;

    targets[0].scrollIntoView({ block: 'nearest', inline: 'nearest' });

    els.stepIndex.textContent = `第 ${index + 1} 步 / 共 ${state.steps.length} 步`;
    els.title.textContent = step.title;
    els.body.innerHTML = step.body;
    els.prev.hidden = index === 0;
    els.next.textContent = index === state.steps.length - 1 ? '开始使用' : '下一步';

    reposition();
    els.next.focus();
  }

  function onKeyDown(e) {
    if (!state.active) return;
    if (e.key === 'Escape') { e.preventDefault(); stop(true); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(state.index + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (state.index > 0) go(state.index - 1); }
    else if (e.key === 'Tab') {
      // 焦点锁在气泡内，别让 Tab 跑到被遮住的界面上
      const focusable = Array.from(els.bubble.querySelectorAll('button')).filter(b => !b.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  // ── 启停 ──────────────────────────────────────────────
  function start() {
    if (state.active) return;

    const steps = STEPS.filter(stepExists);
    if (!steps.length) return;   // 界面还没就绪到能引导的程度，安静退出

    state.active = true;
    state.steps = steps;
    state.index = 0;
    state.shown = 0;
    state.lastFocus = document.activeElement;

    buildDom();
    document.addEventListener('keydown', onKeyDown, true);
    state.reposition = () => { if (state.active) reposition(); };
    window.addEventListener('resize', state.reposition);
    window.addEventListener('scroll', state.reposition, true);   // capture：侧栏树自己也会滚

    go(0);
  }

  /** persist=true 表示这是用户主动看完/跳过，记下来下次不再自动弹 */
  function stop(persist) {
    if (!state.active) return;
    state.active = false;

    document.removeEventListener('keydown', onKeyDown, true);
    window.removeEventListener('resize', state.reposition);
    window.removeEventListener('scroll', state.reposition, true);
    state.reposition = null;

    teardownDom();

    if (persist) {
      try { tourStorage.setItem(SEEN_KEY, TOUR_VERSION); } catch (err) { /* 隐私模式下写不进去，忽略 */ }
    }
    if (state.lastFocus && state.lastFocus.focus) state.lastFocus.focus();
    state.lastFocus = null;
  }

  function reset() {
    try { tourStorage.removeItem(SEEN_KEY); } catch (err) { /* 同上 */ }
  }

  // ── 就绪等待 ──────────────────────────────────────────
  // 导航树要等 nav-tree.json 拉完才有内容，Agent 面板要等 agent-panel.js 建完 DOM。
  // 用轮询而不是去改那两处现有代码派发事件，保持零侵入；超时也照常开场（步骤会自动过滤）。
  // 这里刻意用 setTimeout 而不是 requestAnimationFrame：后台标签页里 rAF 会被完全冻结，
  // 连超时都不会推进，工作台在后台标签打开时引导就永远不会出现。
  // 标签页在后台时不开场：一来用户根本没在看，白白消耗掉唯一一次首开引导；
  // 二来后台标签的布局可能量到 0 宽高，会把步骤误判成"锚点不可见"而跳过。
  // 加超时兜底：个别嵌入式浏览器会一直报 hidden，不能让引导永远卡在这儿等。
  // 超时后照常开场也是安全的 —— 步骤清单按"存在"过滤，且一条都没展示成功时不会记"已看过"。
  function waitVisible() {
    if (document.visibilityState !== 'hidden') return Promise.resolve();
    return new Promise(resolve => {
      const timer = setTimeout(finish, VISIBLE_TIMEOUT);
      function finish() {
        clearTimeout(timer);
        document.removeEventListener('visibilitychange', onChange);
        resolve();
      }
      function onChange() { if (document.visibilityState !== 'hidden') finish(); }
      document.addEventListener('visibilitychange', onChange);
    });
  }

  function waitReady() {
    return new Promise(resolve => {
      const t0 = Date.now();
      (function tick() {
        const treeReady = !!document.querySelector('#sidebarTree .file-row, #sidebarTree .folder');
        const agentReady = !!document.getElementById('agentInput');
        if ((treeReady && agentReady) || Date.now() - t0 > READY_TIMEOUT) return resolve();
        setTimeout(tick, 100);
      })();
    });
  }

  // ── 重放入口 ──────────────────────────────────────────
  // 外壳 HTML 是冻结的，所以这个按钮在运行时注入到侧栏标题行（.copy-address-btn 旁边）。
  function injectReplayButton() {
    const row = document.querySelector('.sidebar-title-row');
    if (!row || row.querySelector('.tour-replay-btn')) return;
    const btn = document.createElement('button');
    btn.className = 'tour-replay-btn';
    btn.type = 'button';
    btn.textContent = '?';
    btn.title = '重新看一遍新手引导';
    btn.setAttribute('aria-label', '重新看一遍新手引导');
    btn.addEventListener('click', start);
    row.appendChild(btn);
  }

  // ── 入口 ──────────────────────────────────────────────
  async function init() {
    injectReplayButton();

    if (new URLSearchParams(window.location.search).get('tour') === 'off') return;
    let seen = null;
    try { seen = tourStorage.getItem(SEEN_KEY); } catch (err) { return; }
    if (seen === TOUR_VERSION) return;

    await waitVisible();
    await waitReady();
    start();
  }

  window.ProtoTour = { start, stop: () => stop(false), reset };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
