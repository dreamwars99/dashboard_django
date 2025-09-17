// CSRF ? í° ?»ê¸°(?¥ê³  4.2)
function getCookie(name) {
  const value = document.cookie.match('(^|;)\s*' + name + '\s*=\s*([^;]+)');
  return value ? value.pop() : '';
}
const CSRF_TOKEN = getCookie('csrftoken');

(() => {
  // ?€?œë³´???„ì—­??ì´ˆê¸°?”í•˜??ì¦‰ì‹œ ?¤í–‰ ?¨ìˆ˜ë¡?ì¢Œì¸¡ ?…ë ¥, ì¤‘ì•™ ì°¨íŠ¸, ?°ì¸¡ ê²°ì¬ ë³´ì¡°ë¥??˜ë‚˜???ë¦„?¼ë¡œ ë¬¶ìŠµ?ˆë‹¤.
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);
  const setText = (sel, text) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (el) el.textContent = text;
  };
  const numberFormat = new Intl.NumberFormat('ko-KR');
  const percentFormat = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const debounce = (fn, wait = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };
  const fmtAmount = (value, suffix = '?µì›') => {
    if (!Number.isFinite(value)) return '-';
    return `${numberFormat.format(Math.round(value))}${suffix}`;
  };
  const fmtPercent = (value) => {
    if (!Number.isFinite(value)) return '-';
    return `${percentFormat.format(value * 100)}%`;
  };

  const toastStack = $('#toastStack');
  const showToast = (message, tone = 'info') => {
    if (!toastStack) return;
    const toast = document.createElement('div');
    toast.className = `toast toast--${tone}`;
    toast.textContent = message;
    toastStack.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => toast.remove(), 220);
    }, 2400);
  };

  const GRADE_BADGES = {
    A: 'grade--a',
    'A-': 'grade--a',
    'BBB+': 'grade--b',
    BBB: 'grade--b',
    'BB+': 'grade--c',
    BB: 'grade--c',
    'B+': 'grade--d',
  };

const PD_THRESHOLD_BY_GRADE = {
    A: 0.20,
    'A-': 0.24,
    'BBB+': 0.28,
    BBB: 0.32,
    'BB+': 0.36,
    BB: 0.40,
    'B+': 0.45,
  };

  function getPdThreshold(grade) {
    return PD_THRESHOLD_BY_GRADE[grade] ?? 0.35;
  }

  const METRIC_RULES = {
    gpm: (v) => (v >= 0.2 ? 'good' : v >= 0.1 ? 'warn' : 'risk'),
    npm: (v) => (v >= 0.08 ? 'good' : v >= 0.04 ? 'warn' : 'risk'),
    cr: (v) => (v >= 1.5 ? 'good' : v >= 1.0 ? 'warn' : 'risk'),
    qr: (v) => (v >= 1.2 ? 'good' : v >= 0.8 ? 'warn' : 'risk'),
    dar: (v) => (v <= 0.5 ? 'good' : v <= 0.6 ? 'warn' : 'risk'),
    roa: (v) => (v >= 0.05 ? 'good' : v >= 0.02 ? 'warn' : 'risk'),
    altman: (v) => (v >= 3 ? 'good' : v >= 1.8 ? 'warn' : 'risk'),
    olson: (v) => (v <= 0.5 ? 'good' : v <= 1.0 ? 'warn' : 'risk'),
  };

  const FEATURE_LABELS = {
    'Net sales': 'ë§¤ì¶œ??,
    Sales: 'ë§¤ì¶œ??,
    COGS: 'ë§¤ì¶œ?ê?',
    'Depreciation & amortization': 'ê°ê??ê°ë¹?,
    EBIT: '?ì—…?´ìµ',
    'Net Income': '?¹ê¸°?œì´??,
    Inventory: '?¬ê³ ?ì‚°',
    'Total Receivables': 'ë§¤ì¶œì±„ê¶Œ',
    'Current assets': '? ë™?ì‚°',
    'Total Current Liabilities': '? ë™ë¶€ì±?,
    'Total Long-term debt': '?¥ê¸°ì°¨ì…ê¸?,
    'Retained Earnings': '?´ìµ?‰ì—¬ê¸?,
    'Market value': '?œê?ì´ì•¡',
    Altman_Z: '?ŒíŠ¸ë§?Z-Score',
    Olson_O: '?¬ìŠ¨ O-Score',
    DSCR: 'DSCR',
  };

  const DEFAULT_DELTAS = ['PD ë³€?? 0%p', '?±ê¸‰ ë³€?? ?†ìŒ', 'ê¶Œê³  ?œë„: ë³€???†ìŒ'];
  const DEFAULT_SHAP_ITEMS = [
    { name: 'Retained Earnings', value: -0.18 },
    { name: 'Debt to Asset', value: 0.14 },
    { name: 'Quick Ratio', value: -0.09 },
    { name: 'Net Profit Margin', value: -0.07 },
    { name: 'Long-term Debt', value: 0.06 },
  ];
  const DEFAULT_FI_ITEMS = [
    { name: 'Altman_Z', value: 72 },
    { name: 'Retained Earnings', value: 68 },
    { name: 'Market value', value: 58 },
    { name: 'Current Ratio', value: 52 },
    { name: 'Net Income', value: 46 },
  ];
  const DEFAULT_COLLATERAL_ITEMS = [
    { type: 'ë¶€?™ì‚°', value: 320, ltv: 58 },
    { type: '?¤ë¹„?ì‚°', value: 120, ltv: 65 },
  ];

  const ensureItems = (value, fallback) => (value && value.length ? value : fallback);
  const renderCollection = (target, items, buildItem, buildEmpty) => {
    const container = typeof target === 'string' ? $(target) : target;
    if (!container) return;
    container.innerHTML = '';
    const collection = items && items.length ? items : [];
    if (collection.length === 0) {
      if (buildEmpty) {
        const emptyNode = buildEmpty();
        if (emptyNode) container.appendChild(emptyNode);
      }
      return;
    }
    collection.forEach((item, index) => {
      const node = buildItem(item, index);
      if (node) container.appendChild(node);
    });
  };

  const setHorizontalBarChart = (chart, items, { gridLeft = 140, showDivergence = false, barColor = '#0d6efd' } = {}) => {
    if (!chart) return;
    const data = items.map((item) =>
      showDivergence
        ? { value: item.value, itemStyle: { color: item.value >= 0 ? '#0d6efd' : '#dc3545' } }
        : { value: item.value, itemStyle: { color: barColor } },
    );
    const xAxis = { type: 'value' };
    if (showDivergence) {
      xAxis.axisLabel = { formatter: (val) => val.toFixed(2) };
    }
    chart.setOption({
      grid: { top: 10, bottom: 10, left: gridLeft, right: 20 },
      xAxis,
      yAxis: {
        type: 'category',
        data: items.map((item) => mapFeatureName(item.name)),
      },
      series: [{ type: 'bar', data }],
    });
  };


  // ?…ë ¥, ê³„ì‚°, ?œë‚˜ë¦¬ì˜¤ ê²°ê³¼ë¥?ë³´ê??˜ëŠ” ?¨ì¼ ?íƒœ ì»¨í…Œ?´ë„ˆë¡?ëª¨ë“  ?Œë”ë§??¨ìˆ˜ê°€ ì°¸ì¡°?©ë‹ˆ??
  const state = {
    meta: {
      companyName: '',
      regNo: '',
      industry: '',
      fiscalYear: '',
    },
    fin: {
      netSales: 0,
      cogs: 0,
      da: 0,
      ebit: 0,
      netIncome: 0,
      inventory: 0,
      receivables: 0,
      currentAssets: 0,
      currentLiab: 0,
      ltDebt: 0,
      retainedEarnings: 0,
      mktValue: 0,
    },
    ratios: {
      gp: 0,
      gpm: 0,
      npm: 0,
      cr: 0,
      qr: 0,
      dar: 0,
      roa: 0,
      altman: 0,
      olson: 0,
    },
    risk: {
      pd: 0.18,
      grade: '--',
      limit: 0,
      rate: 0,
      covenants: [],
      flags: [],
      deltasSummary: [...DEFAULT_DELTAS],
    },
    scenario: {
      revDelta: 0,
      marginDelta: 0,
      debtDelta: 0,
      mktDelta: 0,
      fxDelta: 0,
      baseRateDelta: 0,
      marginMode: 'gpm',
    },
    shap: [],
    fi: [],
    counters: {
      whatIf: 0,
      inputChanges: 0,
    },
    modelVersion: '-',
  };

  // HTML ì°¨íŠ¸ ì»¨í…Œ?´ë„ˆ id?€ ë§¤ì¹­?˜ëŠ” ECharts ?¸ìŠ¤?´ìŠ¤ë¥?ìºì‹œ?©ë‹ˆ??
  const charts = {
    shap: null,
    fi: null,
    radar: null,
    trend: null,
    peer: null,
    heatmap: null,
  };
  let gaugeFrame = null;

  // ì¢Œì¸¡ ?…ë ¥ ?¨ë„???„ë“œ?€ ë²„íŠ¼??state???°ê²°?˜ì—¬ ê°?ë³€ê²????¬ê³„?°ì„ ?¸ë¦¬ê±°í•©?ˆë‹¤.
  function bindInputs() {
    ['companyName', 'regNo', 'industry'].forEach((id) => {
      const el = $(`#${id}`);
      if (!el) return;
      el.addEventListener('input', (event) => {
        state.meta[id] = event.target.value;
        bumpInputCounter();
      });
    });
    const fiscalYear = $('#fiscalYear');
    if (fiscalYear) {
      fiscalYear.addEventListener('change', (event) => {
        state.meta.fiscalYear = event.target.value;
        bumpInputCounter();
      });
    }

    const numericIds = Object.keys(state.fin);
    numericIds.forEach((id) => {
      const el = $(`#${id}`);
      if (!el) return;
      el.addEventListener(
        'input',
        debounce(() => {
          const value = parseFloat(el.value);
          if (Number.isFinite(value) && value >= 0) {
            if (id === 'cogs' && state.fin.netSales && value > state.fin.netSales) {
              showToast('ë§¤ì¶œ?ê???ë§¤ì¶œ?¡ì„ ì´ˆê³¼?????†ìŠµ?ˆë‹¤.', 'warn');
              el.value = state.fin.cogs;
              return;
            }
            state.fin[id] = value;
            bumpInputCounter();
            recalcAndRender();
          } else {
            showToast('?Œìˆ˜???…ë ¥?????†ìŠµ?ˆë‹¤.', 'warn');
            el.value = state.fin[id];
          }
        }),
      );
    });

    const fetchBtn = $('#btnFetchData');
    if (fetchBtn) {
      fetchBtn.addEventListener('click', async () => {
        try {
          const data = await fetchCompanyMock();
          hydrateWithFetchedData(data);
          state.modelVersion = data.modelVersion || '-';
          state.shap = data.shap || [];
          state.fi = data.fi || [];
          recalcAndRender();
          showToast('ê¸°ì—… ?°ì´?°ë? ë¶ˆëŸ¬?”ìŠµ?ˆë‹¤.', 'success');
        } catch (error) {
          console.error(error);
          showToast('?°ì´??ë¶ˆëŸ¬?¤ê¸°???¤íŒ¨?ˆìŠµ?ˆë‹¤.', 'error');
        }
      });
    }
  }

  // ì¤‘ì•™ What-if ì¹´ë“œ???¬ë¼?´ë”?€ ? ê???state.scenario?€ ?™ê¸°?”í•©?ˆë‹¤.
  function bindWhatIfControls() {
    const sliderMap = [
      { id: 'revDelta', key: 'revDelta', formatter: (v) => `${v}%` },
      { id: 'marginDelta', key: 'marginDelta', formatter: (v) => `${v}%p` },
      { id: 'debtDelta', key: 'debtDelta', formatter: (v) => `${v}` },
      { id: 'mktDelta', key: 'mktDelta', formatter: (v) => `${v}%` },
      { id: 'fxDelta', key: 'fxDelta', formatter: (v) => `${v}%` },
      { id: 'baseRateDelta', key: 'baseRateDelta', formatter: (v) => `${Number(v).toFixed(1)}%p` },
    ];
    const debouncedApply = debounce(applyWhatIfScenario, 150);
    sliderMap.forEach(({ id, key, formatter }) => {
      const slider = $(`#${id}`);
      const chip = $(`#${id}Val`);
      if (!slider) return;
      slider.addEventListener('input', (event) => {
        const value = Number(event.target.value);
        state.scenario[key] = value;
        if (chip) chip.textContent = formatter(value);
        debouncedApply();
      });
    });

    const marginTabs = [$('#marginModeGPM'), $('#marginModeNPM')];
    marginTabs.forEach((tab) => {
      tab?.addEventListener('click', () => {
        marginTabs.forEach((t) => t?.classList.remove('active'));
        tab.classList.add('active');
        state.scenario.marginMode = tab.dataset.mode;
        applyWhatIfScenario();
      });
    });
  }

  // ?¬ë¼?´ë” ì¡°ì • ??postWhatIfMock ?‘ë‹µ??ë°›ì•„ ì¤‘ì•™ KPI?€ ?°ì¸¡ ë¡œê·¸ë¥?ê°±ì‹ ?©ë‹ˆ??
  function fetchCorporatePHat(payload) {
    return fetch('/api/predict/corporate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': CSRF_TOKEN,
      },
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch corporate probability');
        }
        return response.json();
      })
      .then((data) => {
        if (data && typeof data.p_hat === 'number') {
          return clamp(data.p_hat, 0, 1);
        }
        if (data && typeof data.model_raw === 'number') {
          return clamp(1 - data.model_raw, 0, 1);
        }
        throw new Error('Malformed corporate prediction response');
      });
  }\n  function applyWhatIfScenario() {
    postWhatIfMock(state.meta, state.scenario, state.fin, state.risk)
      .then((response) => {
        state.risk.pd = response.pd_new;
        state.risk.grade = response.grade_new;
        state.risk.limit = response.limit_new;
        state.risk.rate = response.rate_new;
        state.risk.deltasSummary = response.deltas_summary || [];
        state.counters.whatIf += 1;
        state.risk.flags = computePolicyFlags(state.ratios);
        updateSummaryStrip();
        renderWhatIfSummary();
        renderAuditInfo();
        updateDecisionEvidence();
        updateGauge();
      })
      .catch((error) => {
        console.error(error);
        showToast('What-if ?ìš© ì¤??¤ë¥˜ê°€ ë°œìƒ?ˆìŠµ?ˆë‹¤.', 'error');
      });
  }

  // ?ìµ/?¬ë¬´ ?…ë ¥??ë¹„ìœ¨ë¡??˜ì‚°??ì¢Œì¸¡ ì§€?œì? ?ˆì´??ì°¨íŠ¸?ì„œ ?¬ìš©?©ë‹ˆ??
  function computeRatios(fin) {
    const gp = Math.max(0, fin.netSales - fin.cogs);
    const gpm = fin.netSales > 0 ? gp / fin.netSales : 0;
    const npm = fin.netSales > 0 ? fin.netIncome / fin.netSales : 0;
    const cr = fin.currentLiab > 0 ? fin.currentAssets / fin.currentLiab : 0;
    const quickAssets = Math.max(0, fin.currentAssets - fin.inventory);
    const qr = fin.currentLiab > 0 ? quickAssets / fin.currentLiab : 0;
    const totalAssets = Math.max(1, fin.currentAssets + Math.max(0, fin.netSales * 0.4));
    const totalLiab = fin.currentLiab + fin.ltDebt;
    const dar = totalAssets > 0 ? totalLiab / totalAssets : 0;
    const roa = totalAssets > 0 ? fin.netIncome / totalAssets : 0;

    const workingCapital = fin.currentAssets - fin.currentLiab;
    const altman =
      1.2 * (workingCapital / totalAssets) +
      1.4 * (fin.retainedEarnings / totalAssets) +
      3.3 * (fin.ebit / totalAssets) +
      0.6 * (fin.mktValue / Math.max(totalLiab, 1)) +
      1.0 * (fin.netSales / totalAssets);

    const logTA = Math.log(Math.max(totalAssets, 1));
    const olson =
      -1.32 -
      0.407 * logTA +
      6.03 * (totalLiab / totalAssets) -
      1.43 * (workingCapital / totalAssets) +
      0.076 * (fin.currentLiab / Math.max(fin.currentAssets, 1)) -
      1.72 * (fin.netIncome / totalAssets);

    return { gp, gpm, npm, cr, qr, dar, roa, altman, olson };
  }

  // ê°„ì´ PD ëª¨ë¸: ë¹„ìœ¨ê³?ë¶€ì±??˜ì???ì¡°í•©???„í—˜?„ë? ê³„ì‚°?©ë‹ˆ??
  function computePD(fin, ratios) {
    const z =
      0.0007 * fin.ltDebt -
      0.001 * fin.retainedEarnings -
      0.55 * ratios.npm -
      0.25 * ratios.qr +
      0.75 * ratios.dar -
      0.000018 * fin.mktValue +
      0.00015 * Math.max(0, fin.inventory - 800) +
      0.4 * (ratios.olson > 0 ? ratios.olson : 0);
    const pd = 1 / (1 + Math.exp(-z));
    return clamp(pd, 0.01, 0.99);
  }

  function deriveGrade(pd) {
    if (pd < 0.03) return 'A';
    if (pd < 0.06) return 'A-';
    if (pd < 0.1) return 'BBB+';
    if (pd < 0.15) return 'BBB';
    if (pd < 0.25) return 'BB+';
    if (pd < 0.35) return 'BB';
    return 'B+';
  }

  function suggestLimitAndRate(pd, fin) {
    const baseLimit = Math.max(0, fin.netSales * 0.18);
    const adjFactor = 1 - pd;
    const limit = Math.round(baseLimit * (0.55 + 0.85 * adjFactor));
    const baseRate = 5.0;
    const riskSpread = 6.5 * pd + (state.scenario.baseRateDelta || 0) * 0.4;
    const rate = Math.round((baseRate + riskSpread) * 100) / 100;
    return { limit, rate };
  }

  // ?•ì±… ?„ê³„ê°’ê³¼ ë¹„êµ???°ì¸¡ ?•ì±… ê²½ê³  ?œê·¸ ëª©ë¡???ì„±?©ë‹ˆ??
  function computePolicyFlags(ratios) {
    const flags = [];
    if (ratios.cr < 1) flags.push({ text: '? ë™ë¹„ìœ¨ < 1.0', kind: 'danger' });
    if (ratios.dar > 0.6) flags.push({ text: 'ë¶€ì±??ì‚° > 60%', kind: 'warn' });
    if (ratios.olson > 1.0) flags.push({ text: '?¬ìŠ¨ O-Score ê²½ê³ ', kind: 'warn' });
    if (state.meta.industry && ratios.dar > 0.55) flags.push({ text: '?…ì¢… ?œë„ ê·¼ì ‘', kind: 'info' });
    return flags;
  }

  // ì¢Œì¸¡ ?…ë ¥ê°’ì´ ë°”ë€??Œë§ˆ???¸ì¶œ?˜ì–´ ëª¨ë“  ?Œìƒ ?°ì´?°ë? ?¬ê³„?°í•˜ê³??œê°?”ë? ?¤ì‹œ ê·¸ë¦½?ˆë‹¤.
  function recalcAndRender() {
    state.ratios = computeRatios(state.fin);
    state.risk.pd = computePD(state.fin, state.ratios);
    state.risk.grade = deriveGrade(state.risk.pd);
    const suggestion = suggestLimitAndRate(state.risk.pd, state.fin);
    state.risk.limit = suggestion.limit;
    state.risk.rate = suggestion.rate;
    state.risk.covenants = ['?¬ë¬´?œí‘œ ?œì¶œ', 'DSCR ??1.2'];
    state.risk.flags = computePolicyFlags(state.ratios);

    renderAutoMetrics();
    updateSummaryStrip();
    renderWhatIfSummary();
    updateShapAndFI();
    updateRadar();
    updateTrend();
    updatePeer();
    updateHeatmap();
    renderCollateral();
    renderAuditInfo();
    updateDecisionEvidence();
    updateGauge();
  }

  // ì¢Œì¸¡ ?˜ë‹¨ KPI ì¹´ë“œ???ë™ ê³„ì‚° ê²°ê³¼ë¥?ì¶œë ¥?©ë‹ˆ??
  function renderAutoMetrics() {
    [
      ['#gp', fmtAmount(state.ratios.gp)],
      ['#gpm', fmtPercent(state.ratios.gpm)],
      ['#npm', fmtPercent(state.ratios.npm)],
      ['#cr', state.ratios.cr.toFixed(2)],
      ['#qr', state.ratios.qr.toFixed(2)],
      ['#dar', fmtPercent(state.ratios.dar)],
      ['#roa', fmtPercent(state.ratios.roa)],
      ['#altman', state.ratios.altman.toFixed(2)],
      ['#olson', state.ratios.olson.toFixed(2)],
    ].forEach(([selector, value]) => setText(selector, value));

    Object.entries({
      gpm: state.ratios.gpm,
      npm: state.ratios.npm,
      cr: state.ratios.cr,
      qr: state.ratios.qr,
      dar: state.ratios.dar,
      roa: state.ratios.roa,
      altman: state.ratios.altman,
      olson: state.ratios.olson,
    }).forEach(([metric, value]) => updateMetricBadge(metric, value));
  }

  function updateMetricBadge(metric, value) {
    const badge = document.querySelector(`.metric-badge[data-metric="${metric}"]`);
    if (!badge) return;
    const rule = METRIC_RULES[metric];
    if (!rule || !Number.isFinite(value)) {
      badge.textContent = '-';
      badge.className = 'metric-badge';
      return;
    }
    const status = rule(value);
    badge.className = `metric-badge metric-badge--${status}`;
    badge.textContent = status === 'good' ? '?‘í˜¸' : status === 'warn' ? 'ì£¼ì˜' : '?„í—˜';
  }

  // ë©”ì¸ ?ë‹¨ ?”ì•½ ì¹´ë“œ ?˜ì¹˜?€ ?±ê¸‰ ë±ƒì?, ?•ì±… ?Œë˜ê·¸ë? ê°±ì‹ ?©ë‹ˆ??
  function updateSummaryStrip() {
    setText('#summaryLimit', fmtAmount(state.risk.limit));
    setText('#summaryRate', `${state.risk.rate.toFixed(2)}%`);
    setText('#summaryCovenant', `${state.risk.covenants.length}ê±?);
    const gradeBadge = $('#gradeBadge');
    if (gradeBadge) {
      gradeBadge.textContent = state.risk.grade;
      gradeBadge.className = 'grade-badge';
      const cls = GRADE_BADGES[state.risk.grade] || 'grade--unknown';
      gradeBadge.classList.add(cls);
    }
    const flagsWrap = $('#policyFlags');
    if (flagsWrap) {
      renderCollection(
        flagsWrap,
        state.risk.flags,
        (flag) => {
          const badge = document.createElement('span');
          badge.className = `flag ${flag.kind}`;
          badge.textContent = flag.text;
          return badge;
        },
        () => {
          const span = document.createElement('span');
          span.className = 'flag info';
          span.textContent = '?•ì±… ?„ë°˜ ?†ìŒ';
          return span;
        },
      );
    }

  }
  // What-if ì¹´ë“œ ?˜ë‹¨ pill ?ìŠ¤?¸ë? ìµœì‹  deltasSummaryë¡?ê°±ì‹ ?©ë‹ˆ??
  function renderWhatIfSummary() {
    const items = ensureItems(state.risk.deltasSummary, DEFAULT_DELTAS);
    renderCollection('#whatIfSummary', items, (text) => {
      const pill = document.createElement('span');
      pill.className = 'whatif-pill';
      pill.textContent = text;
      return pill;
    });
  }

  // ECharts ?¸ìŠ¤?´ìŠ¤ë¥?ê´€ë¦¬í•˜ê¸??„í•œ ?¬í¼ ?¨ìˆ˜
  function getChart(domId) {
    if (typeof echarts === 'undefined') return null;
    const el = document.getElementById(domId);
    if (!el) return null;
    if (!charts[domId]) {
      charts[domId] = echarts.init(el, null, { renderer: 'svg' });
    }
    return charts[domId];
  }

  // PD ê²Œì´ì§€ ?œê°???µì…˜: ?‰ìƒ ë°´ë“œ??ë²”ìœ„ë¥?ë°”ê¾¸?¤ë©´ ???¨ìˆ˜ë¥?ì¡°ì •?©ë‹ˆ??
  function updateGauge() {
    const threshold = getPdThreshold(state.risk.grade);
    const pdValue = state.risk.pd;

    const chart = getChart('pdGauge');
    if (!chart) {
      return null;
    }

    function readVar(name, fallback) {
      const root = document.body || document.documentElement;
      if (!root) return fallback;
      const value = getComputedStyle(root).getPropertyValue(name);
      return value && value.trim() ? value.trim() : fallback;
    }

    const decisionTone = (function () {
      if (pdValue < threshold - 0.05) return '#16a34a'; // approve: green
      if (pdValue <= threshold + 0.05) return '#f59e0b'; // hold: yellow
      return '#dc2626'; // reject: red
    })();

    const accent = decisionTone || readVar('--kb-color-accent', '#1b64da');
    const track = readVar('--kb-color-track', '#dde3f3');
    const needle = readVar('--kb-color-gauge-needle', '#1f2937');
    const thresholdColor = '#a0aec0';
    const title = 'ë¶€?„í™•ë¥?(PD)';

    const valuePct = clamp(Number(pdValue) * 100, 0, 100);
    const threshPct = clamp(Number(threshold) * 100, 0, 100);

    const bandWidth = 14;
    const showValue = true;
    const valueFormatter = function (val) { return percentFormat.format(val) + '%'; };
    const valueFontSize = 20;
    const valueOffset = [0, '40%'];
    const animationDuration = 420;
    const animationEasing = 'cubicOut';
    const pointerWidth = 6;

    const option = {
      animationDuration: animationDuration,
      animationDurationUpdate: animationDuration,
      animationEasing: animationEasing,
      animationEasingUpdate: animationEasing,
      title: undefined, // Subtitle removed
      series: [
        {
          name: 'gauge-track', type: 'gauge', startAngle: 220, endAngle: -40, min: 0, max: 100, radius: '100%',
          progress: { show: true, width: bandWidth, roundCap: true, itemStyle: { color: accent, shadowBlur: 12, shadowColor: 'rgba(15, 23, 42, 0.18)' } },
          axisLine: { roundCap: true, lineStyle: { width: bandWidth, color: [ [valuePct / 100, accent], [1, track] ] } },
          pointer: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { show: false },
          data: [{ value: valuePct }],
        },
        {
          name: 'gauge-pointer', type: 'gauge', startAngle: 220, endAngle: -40, min: 0, max: 100, radius: '100%',
          axisLine: { lineStyle: { width: 0 } },
          pointer: { show: true, icon: 'path://M2 -70 L-2 -70 L-6 10 L0 70 L6 10 Z', length: '70%', width: pointerWidth, offsetCenter: [0, '10%'], itemStyle: { color: needle } },
          anchor: { show: true, showAbove: true, size: 12, itemStyle: { color: needle } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false }, // Labels hidden
          detail: { show: showValue, valueAnimation: true, formatter: valueFormatter, color: '#0f172a', fontSize: valueFontSize, fontWeight: 600, offsetCenter: valueOffset },
          title: { show: true, offsetCenter: [0, '-30%'], color: 'rgba(55, 65, 81, 0.75)', fontSize: 14, fontWeight: 600, formatter: title },
          data: [{ value: valuePct }],
        },
        {
          name: 'gauge-threshold', type: 'gauge', startAngle: 220, endAngle: -40, min: 0, max: 100, radius: '100%',
          axisLine: { lineStyle: { width: 0 } },
          pointer: { show: threshold !== undefined && threshold !== null, icon: 'path://M-1.5 -60 L1.5 -60 L1.5 10 L-1.5 10 Z', length: '85%', width: 3, offsetCenter: [0, '18%'], itemStyle: { color: thresholdColor } },
          anchor: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { show: false },
          data: [{ value: threshPct }],
        },
      ],
    };

    const rafAvailable = typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function';
    if (rafAvailable) {
      if (gaugeFrame) {
        window.cancelAnimationFrame(gaugeFrame);
      }
      gaugeFrame = window.requestAnimationFrame(function () {
        chart.setOption(option, false);
      });
    } else {
      chart.setOption(option, false);
    }
  }
  // XAI ??— ?œì‹œ??SHAP/Feature Importance ë§‰ë? ì°¨íŠ¸ë¥?ê°±ì‹ ?©ë‹ˆ??
  function updateShapAndFI() {
    const shapItems = ensureItems(state.shap, DEFAULT_SHAP_ITEMS);
    const fiItems = ensureItems(state.fi, DEFAULT_FI_ITEMS);
    setHorizontalBarChart(charts.shap, shapItems, { gridLeft: 140, showDivergence: true });
    setHorizontalBarChart(charts.fi, fiItems, { gridLeft: 160 });
  }

  function mapFeatureName(name) {
    if (FEATURE_LABELS[name]) return FEATURE_LABELS[name];
    return name;
  }

  // ?¬ë¬´ë¹„ìœ¨ ?ˆì´??ì°¨íŠ¸ë¥?computeRatios ê²°ê³¼ë¡??Œë”ë§í•©?ˆë‹¤.
  function updateRadar() {
    if (!charts.radar) return;
    const r = state.ratios;
    charts.radar.setOption({
      radar: {
        indicator: [
          { name: '? ë™??, max: 3 },
          { name: '?¹ì¢Œ', max: 3 },
          { name: 'ë¶€ì±?, max: 1 },
          { name: '?˜ìµ??, max: 0.4 },
          { name: 'ROA', max: 0.2 },
          { name: 'ë§¤ì¶œì´ì´?µë¥ ', max: 0.6 },
        ],
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [r.cr, r.qr, r.dar, r.npm, r.roa, r.gpm],
              areaStyle: { opacity: 0.2 },
            },
          ],
        },
      ],
    });
  }

  // ?ìµê³?ë¶€ì±?ì¶”ì´ë¥?? í˜• ê·¸ë˜?„ë¡œ ê·¸ë¦½?ˆë‹¤; placeholder ë¹„ìœ¨??ì¡°ì •???ë¦„???œì–´?©ë‹ˆ??
  function updateTrend() {
    if (!charts.trend) return;
    const years = ['2020', '2021', '2022', '2023', '?„ì¬'];
    const sales = [0.7, 0.8, 0.9, 1.0, 1.0].map((ratio) => state.fin.netSales * ratio);
    const ebitSeries = [0.6, 0.75, 0.85, 1.0, 1.0].map((ratio) => state.fin.ebit * ratio);
    const niSeries = [0.5, 0.7, 0.85, 1.0, 1.0].map((ratio) => state.fin.netIncome * ratio);
    const debtSeries = [1.2, 1.1, 1.0, 0.95, 1.0].map((ratio) => state.fin.ltDebt * ratio);

    charts.trend.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['ë§¤ì¶œ', '?ì—…?´ìµ', '?œì´??, '?¥ê¸°ì°¨ì…'] },
      xAxis: { type: 'category', data: years },
      yAxis: { type: 'value' },
      series: [
        { name: 'ë§¤ì¶œ', type: 'line', smooth: true, data: sales },
        { name: '?ì—…?´ìµ', type: 'line', smooth: true, data: ebitSeries },
        { name: '?œì´??, type: 'line', smooth: true, data: niSeries },
        { name: '?¥ê¸°ì°¨ì…', type: 'line', smooth: true, data: debtSeries },
      ],
    });
  }

  // ?™ì¢…?…ê³„ ë¹„êµ ?°ì ?„ë? êµ¬ì„±?˜ë©° ì¢Œí‘œ ì¶?ë²”ìœ„???¬ê¸°?ì„œ ?œì–´?©ë‹ˆ??
  function updatePeer() {
    if (!charts.peer) return;
    const peerData = [
      { name: '?¹ì‚¬', value: [state.ratios.dar * 100, state.ratios.roa * 100, state.fin.netSales] },
      { name: '?…ì¢… ì¤‘ìœ„??, value: [55, 4.5, state.fin.netSales * 0.8] },
    ];
    charts.peer.setOption({
      tooltip: {
        trigger: 'item',
        formatter: (params) => `${params.name}<br/>ë¶€ì±„ë¹„?? ${params.value[0].toFixed(1)}%<br/>ROA: ${params.value[1].toFixed(2)}%<br/>ë§¤ì¶œ: ${fmtAmount(params.value[2])}`,
      },
      xAxis: { name: 'ë¶€ì±„ë¹„??%)', min: 0, max: 120 },
      yAxis: { name: 'ROA(%)', min: -5, max: 15 },
      series: [
        {
          type: 'scatter',
          symbolSize: (val) => Math.max(20, Math.sqrt(Math.abs(val[2]))),
          data: peerData.map((d) => ({ name: d.name, value: d.value })),
        },
      ],
    });
  }

  // ?´ë³´ ì§‘ì¤‘???ˆíŠ¸ë§? ?„ì¬??ë¬´ì‘???°ì´?°ë? ?¬ìš©?˜ë?ë¡??¤ì œ LTV ?°ì´?°ë? ?£ìœ¼?¤ë©´ ??ë¶€ë¶„ì„ êµì²´?©ë‹ˆ??
  function updateHeatmap() {
    if (!charts.heatmap) return;
    const categories = ['ê·¸ë£¹', '?…ì¢…', 'ì§€??];
    const buckets = ['Low', 'Mid', 'High'];
    const data = [];
    categories.forEach((cat, row) => {
      buckets.forEach((bucket, col) => {
        const value = Math.round(Math.random() * 100);
        data.push([col, row, value]);
      });
    });
    charts.heatmap.setOption({
      tooltip: { position: 'top' },
      grid: { height: '80%', top: '10%' },
      xAxis: { type: 'category', data: buckets, splitArea: { show: true } },
      yAxis: { type: 'category', data: categories, splitArea: { show: true } },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '0%',
      },
      series: [
        {
          type: 'heatmap',
          data,
        },
      ],
    });
  }

  // ë©”ì¸ ?´ë³´ ?¹ì…˜ ë¦¬ìŠ¤?¸ë? ì±„ìš°ë©?state.risk.collateral???˜ì •?˜ë©´ ì¦‰ì‹œ ë°˜ì˜?©ë‹ˆ??
  function renderCollateral(collateral = []) {
    const data = ensureItems(collateral, DEFAULT_COLLATERAL_ITEMS);
    renderCollection('#collateralList', data, (item) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.type}</strong><span>${fmtAmount(item.value)}</span><span>LTV ${item.ltv}%</span>`;
      return li;
    });
  }

  // ?°ì¸¡ ê°ì‚¬ ë¡œê·¸ ì¹´ë“œ??ëª¨ë¸ ë²„ì „ê³??…ë ¥/?œë‚˜ë¦¬ì˜¤ ?Ÿìˆ˜ë¥??œì‹œ?©ë‹ˆ??
  function renderAuditInfo() {
    setText('#modelVersion', state.modelVersion || '-');
    setText('#whatIfLog', `${state.counters.whatIf}ê±?);
    setText('#inputHistory', `${state.counters.inputChanges}??);
  }

  function bumpInputCounter() {
    state.counters.inputChanges += 1;
    renderAuditInfo();
  }

  // ?°ì¸¡ ?˜ì‚¬ê²°ì • ê·¼ê±° ëª©ë¡??SHAP ?ìœ„ ??ª©ê³??•ì±… ?Œë˜ê·¸ë¡œ ì±„ì›?ˆë‹¤.
  function updateDecisionEvidence() {
    const list = $('#decisionEvidence');
    if (!list) return;
    const shapEntries = ensureItems(state.shap, DEFAULT_SHAP_ITEMS)
      .slice(0, 3)
      .map((item) => ({ type: 'shap', item }));
    const flagEntries = state.risk.flags.map((flag) => ({ type: 'flag', flag }));
    const evidenceItems = [...shapEntries, ...flagEntries];
    renderCollection(
      list,
      evidenceItems,
      (entry) => {
        const li = document.createElement('li');
        if (entry.type === 'shap') {
          li.textContent = `${mapFeatureName(entry.item.name)} (${entry.item.value >= 0 ? '+' : ''}${entry.item.value.toFixed(2)})`;
        } else {
          li.textContent = entry.flag.text;
        }
        return li;
      },
      () => {
        const li = document.createElement('li');
        li.textContent = 'ê·¼ê±° ?°ì´?°ê? ?†ìŠµ?ˆë‹¤.';
        return li;
      },
    );
  }

  // DART/ëª¨ì˜ API ?‘ë‹µ??state??ì£¼ì…?˜ì—¬ ì´ˆê¸°ê°’ê³¼ ëª¨ë¸ ë²„ì „??ê°±ì‹ ?©ë‹ˆ??
  function hydrateWithFetchedData(payload) {
    if (!payload) return;
    Object.assign(state.meta, payload.meta || {});
    Object.assign(state.fin, payload.fin || {});
    state.modelVersion = payload.modelVersion || state.modelVersion;
    state.shap = payload.shap || state.shap;
    state.fi = payload.fi || state.fi;
    renderCollateral(payload.collateral || []);

    $('#companyName').value = state.meta.companyName || '';
    $('#regNo').value = state.meta.regNo || '';
    $('#industry').value = state.meta.industry || '';
    $('#fiscalYear').value = state.meta.fiscalYear || '';

    Object.keys(state.fin).forEach((key) => {
      const el = $(`#${key}`);
      if (el) el.value = state.fin[key] || 0;
    });
    updateDecisionEvidence();
  }

  // ì¤‘ì•™/?°ì¸¡ ì°¨íŠ¸ ì»¨í…Œ?´ë„ˆë¥?EChartsë¡?ì´ˆê¸°?”í•˜ê³?ì°??¬ê¸° ë³€?”ì— ?€?‘í•©?ˆë‹¤.
  function initCharts() {
    if (typeof echarts === 'undefined') return;
    charts.shap = echarts.init($('#shapBar'), null, { renderer: 'svg' });
    charts.fi = echarts.init($('#fiChart'), null, { renderer: 'svg' });
    charts.radar = echarts.init($('#ratioRadar'), null, { renderer: 'svg' });
    charts.trend = echarts.init($('#trendLine'), null, { renderer: 'svg' });
    charts.peer = echarts.init($('#peerScatter'), null, { renderer: 'svg' });
    charts.heatmap = echarts.init($('#concentrationHeatmap'), null, { renderer: 'svg' });

    window.addEventListener(
      'resize',
      debounce(() => {
        Object.values(charts).forEach((chart) => chart && chart.resize());
      }, 150),
    );
  }

  // XAI ì¹´ë“œ????ë²„íŠ¼??ë°”ì¸?©í•˜???´ë‹¹ ì°¨íŠ¸ë¥?ë³´ì—¬ì¤ë‹ˆ??
  function bindTabs() {
    const shapTab = $('#tabShap');
    const fiTab = $('#tabFI');
    const shapWrap = $('#shapWrap');
    const fiWrap = $('#fiWrap');
    shapTab?.addEventListener('click', () => {
      shapTab.classList.add('active');
      fiTab?.classList.remove('active');
      shapWrap.style.display = 'block';
      fiWrap.style.display = 'none';
      charts.shap?.resize();
    });
    fiTab?.addEventListener('click', () => {
      fiTab.classList.add('active');
      shapTab?.classList.remove('active');
      shapWrap.style.display = 'none';
      fiWrap.style.display = 'block';
      charts.fi?.resize();
    });
  }

  // ?°ì¸¡ sLLM ì´ˆì•ˆ ?…ë ¥ì°½ì— ê¸°ë³¸ ë¬¸ì¥??ì±„ìš°ê³?ê·¼ê±° ë¦¬ìŠ¤?¸ë? ì´ˆê¸°?”í•©?ˆë‹¤.
  function initDecisionDraft() {
    const decisionDraft = $('#decisionDraft');
    const initial = `ì¡°ê±´ë¶€ ?¹ì¸ ê¶Œê³ ?œë¦¬ë©? ê¶Œê³  ?œë„ ${fmtAmount(state.risk.limit)} / ê¶Œê³  ê¸ˆë¦¬ ${state.risk.rate.toFixed(2)}% ?ìš©???œì•ˆ?©ë‹ˆ?? ?„ìˆ˜ ?½ì •: ${state.risk.covenants.join(', ')}.`;
    if (decisionDraft) decisionDraft.value = initial;
    updateDecisionEvidence();
  }

  // TODO: ?¤ì œ APIë¥??°ê²°?˜ë©´ ??ëª¨ì˜ ?°ì´??ë¡œë”ë¥?êµì²´?˜ì„¸??
  async function fetchCompanyMock() {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      meta: {
        companyName: '?ˆì œ?„ì',
        regNo: '123-45-67890',
        industry: 'C26',
        fiscalYear: '2024',
      },
      fin: {
        netSales: 5200,
        cogs: 3600,
        da: 210,
        ebit: 430,
        netIncome: 270,
        inventory: 620,
        receivables: 830,
        currentAssets: 3100,
        currentLiab: 1850,
        ltDebt: 1150,
        retainedEarnings: 950,
        mktValue: 15200,
      },
      shap: DEFAULT_SHAP_ITEMS.map((item) => ({ ...item })),
      fi: DEFAULT_FI_ITEMS.map((item) => ({ ...item })),
      collateral: DEFAULT_COLLATERAL_ITEMS.map((item) => ({ ...item })),
      modelVersion: 'Corporate-Risk-v0.9',
    };
  }

  // TODO: ?¤ì œ What-if API ?‘ë‹µ êµ¬ì¡°??ë§ì¶”??êµì²´???„ì‹œ ê³„ì‚° ë¡œì§?…ë‹ˆ??
  async function postWhatIfMock(meta, scenario, fin, risk) {
    await new Promise((resolve) => setTimeout(resolve, 200));
    const marginFactor = scenario.marginMode === 'npm' ? 0.0015 : 0.001;
    const pdAdjust =
      scenario.revDelta * -0.002 +
      scenario.marginDelta * -marginFactor +
      scenario.debtDelta * 0.0004 +
      scenario.baseRateDelta * 0.005 +
      scenario.fxDelta * 0.0006;
    const pdNew = clamp(risk.pd + pdAdjust, 0.01, 0.99);
    const gradeNew = deriveGrade(pdNew);
    const limitNew = Math.round(risk.limit * (1 + scenario.revDelta / 200 + (scenario.marginDelta || 0) / 150));
    const rateNew = clamp(risk.rate + scenario.baseRateDelta * 0.4 - scenario.marginDelta * 0.03 + scenario.fxDelta * 0.01, 0.5, 20);
    const deltaLimit = limitNew - risk.limit;
    const summary = [
      `PD ë³€?? ${(pdNew - risk.pd < 0 ? '' : '+')}${percentFormat.format((pdNew - risk.pd) * 100)}p`,
      `?±ê¸‰ ë³€?? ${gradeNew === risk.grade ? 'ë³€???†ìŒ' : `${risk.grade} ??${gradeNew}`}`,
      `ê¶Œê³  ?œë„: ${deltaLimit === 0 ? 'ë³€???†ìŒ' : `${deltaLimit > 0 ? '+' : ''}${fmtAmount(deltaLimit)}`}`,
    ];
    return {
      pd_new: pdNew,
      grade_new: gradeNew,
      limit_new: limitNew,
      rate_new: rateNew,
      deltas_summary: summary,
    };
  }

  // ì´ˆê¸° ì§„ì…?? ì°¨íŠ¸ë¥?ë§Œë“¤ê³??…ë ¥/??„ ë°”ì¸?©í•œ ??ì²??Œë”ë§ì„ ?¤í–‰?©ë‹ˆ??
  function init() {
    initCharts();
    bindInputs();
    bindWhatIfControls();
    bindTabs();
    recalcAndRender();
    initDecisionDraft();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();










