(function () {
  const numberFormat = new Intl.NumberFormat('ko-KR');
  const percentFormat = new Intl.NumberFormat('ko-KR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const PD_THRESHOLD_BY_GRADE = {
    'A+': 0.18,
    A: 0.2,
    'A-': 0.24,
    'BBB+': 0.28,
    BBB: 0.32,
    'BB+': 0.36,
    BB: 0.4,
    'B+': 0.45,
  };

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.max(min, Math.min(max, value));
  }

  function readCssVariable(name, fallback) {
    const root = document.documentElement || document.body;
    if (!root) return fallback;
    const value = getComputedStyle(root).getPropertyValue(name);
    return value && value.trim() ? value.trim() : fallback;
  }

  function parseNumeric(text) {
    if (!text) return null;
    const cleaned = text.replace(/[^0-9.,\-]/g, '').replace(/,/g, '');
    if (!cleaned) return null;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function getFirstAvailableNumber(keys) {
    if (typeof window === 'undefined') return null;
    for (const key of keys) {
      if (!(key in window)) continue;
      const value = window[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value.trim());
        if (Number.isFinite(parsed)) return parsed;
      }
    }
    return null;
  }

  function getFirstAvailableString(keys) {
    if (typeof window === 'undefined') return null;
    for (const key of keys) {
      if (!(key in window)) continue;
      const value = window[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  function resolveGrade(options) {
    if (options && typeof options.grade === 'string' && options.grade.trim()) {
      return options.grade.trim();
    }
    const gradeFromWindow = getFirstAvailableString([
      '__initial_grade',
      '__initialGrade',
      '__initial_creditGrade',
      '__initialRiskGrade',
      '__initial_rating',
      '__initialGradeText',
    ]);
    if (gradeFromWindow) return gradeFromWindow;
    const gradeEl = document.getElementById('aiGradeText');
    if (gradeEl && gradeEl.textContent && gradeEl.textContent.trim()) {
      return gradeEl.textContent.trim();
    }
    return null;
  }

  function resolveThreshold(options) {
    if (options && Number.isFinite(options.threshold)) {
      return clamp(options.threshold, 0, 1);
    }
    const thresholdFromWindow = getFirstAvailableNumber([
      '__initial_pdThreshold',
      '__initial_pd_threshold',
      '__pdThreshold',
      '__initialPdThreshold',
    ]);
    if (Number.isFinite(thresholdFromWindow)) {
      const normalized = thresholdFromWindow > 1 ? thresholdFromWindow / 100 : thresholdFromWindow;
      return clamp(normalized, 0, 1);
    }
    const grade = resolveGrade(options);
    if (grade && PD_THRESHOLD_BY_GRADE[grade]) {
      return clamp(PD_THRESHOLD_BY_GRADE[grade], 0, 1);
    }
    return 0.35;
  }

  function getGaugeElement(options) {
    if (options && options.element instanceof HTMLElement) return options.element;
    const candidates = [];
    if (options && typeof options.elementId === 'string') candidates.push(options.elementId);
    candidates.push('gaugeChart', 'pdGauge');
    for (const id of candidates) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function ensureGaugeInstance(el) {
    if (typeof echarts === 'undefined') return null;
    return echarts.getInstanceByDom(el) || echarts.init(el, null, { renderer: 'svg' });
  }

  function renderApprovalGauge(pHat, options = {}) {
    const gaugeEl = getGaugeElement(options);
    if (!gaugeEl) return null;

    const pdValue = clamp(Number(pHat), 0, 1);
    if (typeof echarts === 'undefined') {
      gaugeEl.textContent = percentFormat.format(pdValue * 100) + '%';
      return null;
    }

    const chart = ensureGaugeInstance(gaugeEl);
    if (!chart) return null;

    const threshold = resolveThreshold(options);
    const decisionTone = (() => {
      if (pdValue < threshold - 0.05) return '#16a34a';
      if (pdValue <= threshold + 0.05) return '#f59e0b';
      return '#dc2626';
    })();

    const accent = options.accent || decisionTone || readCssVariable('--kb-color-accent', '#1b64da');
    const track = readCssVariable('--kb-color-track', '#dde3f3');
    const needle = readCssVariable('--kb-color-gauge-needle', '#1f2937');
    const thresholdColor = '#a0aec0';

    const valuePct = clamp(pdValue * 100, 0, 100);
    const threshPct = clamp(threshold * 100, 0, 100);

    const option = {
      animationDuration: 420,
      animationDurationUpdate: 420,
      animationEasing: 'cubicOut',
      animationEasingUpdate: 'cubicOut',
      series: [
        {
          name: 'gauge-track',
          type: 'gauge',
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max: 100,
          radius: '100%',
          progress: {
            show: true,
            width: 14,
            roundCap: true,
            itemStyle: {
              color: accent,
              shadowBlur: 12,
              shadowColor: 'rgba(15, 23, 42, 0.18)',
            },
          },
          axisLine: {
            roundCap: true,
            lineStyle: {
              width: 14,
              color: [
                [valuePct / 100, accent],
                [1, track],
              ],
            },
          },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { show: false },
          data: [{ value: valuePct }],
        },
        {
          name: 'gauge-pointer',
          type: 'gauge',
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max: 100,
          radius: '100%',
          axisLine: { lineStyle: { width: 0 } },
          pointer: {
            show: true,
            icon: 'path://M2 -70 L-2 -70 L-6 10 L0 70 L6 10 Z',
            length: '70%',
            width: 6,
            offsetCenter: [0, '10%'],
            itemStyle: { color: needle },
          },
          anchor: { show: true, showAbove: true, size: 12, itemStyle: { color: needle } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: {
            show: true,
            valueAnimation: true,
            formatter: (val) => percentFormat.format(val) + '%',
            color: '#0f172a',
            fontSize: 20,
            fontWeight: 600,
            offsetCenter: [0, '40%'],
          },
          title: {
            show: true,
            offsetCenter: [0, '-30%'],
            color: 'rgba(55, 65, 81, 0.75)',
            fontSize: 14,
            fontWeight: 600,
            formatter: '신용 승인 확률',
          },
          data: [{ value: valuePct }],
        },
        {
          name: 'gauge-threshold',
          type: 'gauge',
          startAngle: 220,
          endAngle: -40,
          min: 0,
          max: 100,
          radius: '100%',
          axisLine: { lineStyle: { width: 0 } },
          pointer: {
            show: threshold !== null,
            icon: 'path://M-1.5 -60 L1.5 -60 L1.5 10 L-1.5 10 Z',
            length: '85%',
            width: 3,
            offsetCenter: [0, '18%'],
            itemStyle: { color: thresholdColor },
          },
          anchor: { show: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          detail: { show: false },
          data: [{ value: threshPct }],
        },
      ],
    };

    chart.setOption(option, false);
    return chart;
  }

  function formatCurrencyText(el) {
    if (!el || !el.textContent) return;
    const text = el.textContent.trim();
    if (!text || text.startsWith('₩')) return;
    const numeric = parseNumeric(text);
    if (!Number.isFinite(numeric)) return;
    el.textContent = '₩' + numberFormat.format(Math.round(numeric));
  }

  function initializeOnLoad() {
    const initialPHatRaw = getFirstAvailableNumber(['__initial_pHat', '__initial_phat', '__initialApprovalProbability']);
    const initialPHat = Number.isFinite(initialPHatRaw) ? initialPHatRaw : 0.5;
    renderApprovalGauge(initialPHat);

    formatCurrencyText(document.getElementById('askedAmountText'));
    formatCurrencyText(document.getElementById('aiLimitText'));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOnLoad);
  } else {
    initializeOnLoad();
  }

  window.renderApprovalGauge = renderApprovalGauge;
})();
