const THETA_BY_GRADE = { A: 0.35, B: 0.42, C: 0.5, D: 0.58, E: 0.65 };
const currencyFormatter = new Intl.NumberFormat('ko-KR');

const state = {
  grade: 'B',
  pHat: 0.74,
  theta: THETA_BY_GRADE.B,
  reqAmount: 35000000,
  income: 84000000,
  limit: 50000000,
  charts: {},
  policy: {},
  whatif: {},
};

/**
 * @description 지정한 값이 범위를 벗어나지 않도록 보정한다.
 * @param {number} value - 조정할 숫자.
 * @param {number} min - 하한값.
 * @param {number} max - 상한값.
 * @returns {number} 보정된 숫자.
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * @description 숫자를 지정한 자릿수로 반올림한다.
 * @param {number} value - 반올림 대상.
 * @param {number} [digits=2] - 소수 자릿수.
 * @returns {number} 반올림된 숫자.
 */
function round(value, digits = 2) {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

/**
 * @description 원화 금액을 통화 표기로 변환한다.
 * @param {number} amount - 금액 값.
 * @returns {string} 통화 형식의 문자열.
 */
function formatKRW(amount) {
  return '₩' + currencyFormatter.format(Math.round(amount || 0));
}

/**
 * @description 천원 단위 값을 원화 표기로 변환한다.
 * @param {number} amount - 원 단위 금액.
 * @returns {string} 천원 단위 포맷 문자열.
 */
function formatKRWThousandUnit(amount) {
  return '₩' + currencyFormatter.format(Math.round((amount || 0) / 1000));
}

/**
 * @description 연속 이벤트를 지연시켜 호출 빈도를 줄인다.
 * @param {Function} fn - 실행할 함수.
 * @param {number} [wait=250] - 지연 시간(ms).
 * @returns {Function} 디바운스 래핑 함수.
 */
function debounce(fn, wait = 250) {
  let timer;
  return function debounced() {
    const context = this;
    const args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () {
      fn.apply(context, args);
    }, wait);
  };
}

// 1) 슬라이더(range)와 숫자(number) 양방향 동기화 유틸
function bindRangeAndNumber(rangeEl, numberEl, onChange) {
  // -- 슬라이더 → 숫자
  rangeEl.addEventListener('input', () => {
    numberEl.value = rangeEl.value;            // 같은 단위(%)로 보관
    onChange?.(Number(rangeEl.value));         // 변경 콜백으로 외부 업데이트
  });

  // -- 숫자 → 슬라이더 (유효성 체크 + 클램프)
  numberEl.addEventListener('input', () => {
    const min = Number(numberEl.min ?? rangeEl.min ?? 0);
    const max = Number(numberEl.max ?? rangeEl.max ?? 100);
    let v = Number(numberEl.value);
    if (Number.isNaN(v)) return;               // 비숫자 입력 중엔 무시
    v = Math.min(max, Math.max(min, v));       // 범위 강제
    numberEl.value = v.toFixed(2);             // 표시 포맷(필요시 조정)
    rangeEl.value = numberEl.value;            // 슬라이더도 이동
    onChange?.(v);
  });
}


/**
 * @description ECharts 인스턴스를 생성하거나 반환한다.
 * @param {string} domId - 대상 요소 ID.
 * @returns {echarts.ECharts|null} 차트 인스턴스 또는 null.
 */
function getChart(domId) {
  const el = document.getElementById(domId);
  if (!el) return null;
  if (!state.charts[domId]) {
    state.charts[domId] = echarts.init(el, null, { renderer: 'svg' });
    window.addEventListener('resize', function () {
      state.charts[domId].resize();
    });
  }
  return state.charts[domId];
}

/**
 * @description 게이지 차트를 렌더링한다.
 * @param {Object} params - 게이지 설정값.
 * @param {string} params.domId - 차트 DOM ID.
 * @param {number} params.value - 승인 확률(0~1).
 * @param {number} params.threshold - 임계값 θ(0~1).
 * @param {string} params.status - 승인 상태 텍스트.
 * @param {string} [params.title='승인확률'] - 접근성용 제목.
 * @returns {echarts.ECharts|null} 렌더된 차트.
 */
function renderApprovalGauge(params) {
  const chart = getChart(params.domId);
  if (!chart) {
    return null;
  }

  // Helper function to read CSS variables, copied from gauge.js
  function readVar(name, fallback) {
    const root = document.body || document.documentElement;
    if (!root) return fallback;
    const value = getComputedStyle(root).getPropertyValue(name);
    return value && value.trim() ? value.trim() : fallback;
  }

  const opts = {
    title: params.title || '승인확률',
    subtitle: '', // Subtitle is explicitly cleared
    status: params.status,
  };

  const decisionTone = (function () {
    switch (opts.status) {
      case '승인 권고': case '승인': return '#16a34a';
      case '신중 검토': return '#f59e0b';
      case '승인 거절': case '거절 권고': return '#dc2626';
      default: return null;
    }
  })();

  const accent = decisionTone || opts.accent || readVar('--kb-color-accent', '#f7b500');
  const track = opts.track || readVar('--kb-color-track', '#dde3f3');
  const needle = opts.needle || readVar('--kb-color-gauge-needle', '#1f2937');
  const thresholdColor = opts.thresholdColor || '#a0aec0';
  const title = opts.title || '승인 확률';
  const subtitle = ''; // Subtitle is forced to be empty

  const valuePct = clamp(Number(params.value) * 100, 0, 100);
  const threshPct = clamp(Number(params.threshold) * 100, 0, 100);

  const bandWidth = 14;
  const showValue = true;
  const valueFormatter = function (val) { return Math.round(val) + '%'; };
  const valueFontSize = 22;
  const valueOffset = [0, '42%'];
  const animationDuration = 420;
  const animationEasing = 'cubicOut';
  const pointerWidth = 6;

  chart.setOption(
    {
      animationDuration: animationDuration,
      animationDurationUpdate: animationDuration,
      animationEasing: animationEasing,
      animationEasingUpdate: animationEasing,
      title: undefined, // Subtitle object is removed
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
          axisTick: { distance: -24, length: 6, splitNumber: 2, lineStyle: { color: 'rgba(99, 102, 241, 0.18)', width: 1 } },
          splitLine: { length: 12, distance: -24, lineStyle: { width: 2, color: 'rgba(15, 23, 42, 0.2)' } },
          axisLabel: { show: false }, // Axis labels are hidden
          detail: { show: showValue, valueAnimation: true, formatter: valueFormatter, color: '#0f172a', fontSize: valueFontSize, fontWeight: 600, offsetCenter: valueOffset },
          title: { show: true, offsetCenter: [0, '-30%'], color: 'rgba(55, 65, 81, 0.75)', fontSize: 14, fontWeight: 600, formatter: title },
          data: [{ value: valuePct }],
        },
        {
          name: 'gauge-threshold', type: 'gauge', startAngle: 220, endAngle: -40, min: 0, max: 100, radius: '100%',
          axisLine: { lineStyle: { width: 0 } },
          pointer: { show: params.threshold !== undefined && params.threshold !== null, icon: 'path://M-1.5 -60 L1.5 -60 L1.5 10 L-1.5 10 Z', length: '85%', width: 3, offsetCenter: [0, '18%'], itemStyle: { color: thresholdColor } },
          anchor: { show: false }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { show: false },
          data: [{ value: threshPct }],
        },
      ],
    },
    false,
  );
  return chart;
}

/**
 * @description 요약 영역의 θ 라벨을 갱신한다.
 * @param {number} value - 현재 θ 값.
 */
function setThetaLabel(value) {
  // 임계치 라벨은 더 이상 사용되지 않습니다.
  const inline = document.getElementById('thetaText');
  if (inline) inline.textContent = '임계값 θ = ' + value.toFixed(2);
}

/**
 * @description 승인 여부 배지 문구와 색상을 계산한다.
 * @param {number} pHat - 승인 확률.
 * @param {number} theta - 임계값.
 * @returns {{text:string,tone:string}} 표시 정보.
 */
function getDecisionMeta(pHat, theta) {
  if (pHat >= theta + 0.05) return { text: '승인 권고', tone: 'approve' };
  if (pHat >= theta - 0.05) return { text: '신중 검토', tone: 'hold' };
  return { text: '거절 권고', tone: 'reject' };
}

/**
 * @description 상단 요약값(등급, 한도, 진행바)을 갱신한다.
 * @param {Object} params - 요약 데이터.
 * @param {number} params.pHat - 승인 확률.
 * @param {number} params.theta - 임계값.
 * @param {number} params.limit - 추천 한도.
 * @param {number} params.reqAmount - 요청 금액.
 * @param {string} params.grade - 신용 등급.
 */
function updateSummary(params) {
  const gradeEl = document.querySelector('.kb-grade__value');
  const gradeWrap = gradeEl ? gradeEl.parentElement : null;
  const decisionEl = document.getElementById('decisionText');
  const reqEl = document.getElementById('reqLimit');
  const recEl = document.getElementById('recLimit');
  const progressEl = document.getElementById('summaryProgressBar');

  if (gradeEl) gradeEl.textContent = params.grade;
  if (gradeWrap) {
    gradeWrap.classList.remove('kb-grade--A', 'kb-grade--B', 'kb-grade--C', 'kb-grade--D', 'kb-grade--E');
    gradeWrap.classList.add('kb-grade--' + params.grade);
  }

  if (decisionEl) {
    const meta = getDecisionMeta(params.pHat, params.theta);
    decisionEl.textContent = meta.text;
    decisionEl.classList.remove('kb-decision--approve', 'kb-decision--hold', 'kb-decision--reject');
    decisionEl.classList.add('kb-decision--' + meta.tone);
  }

  if (reqEl) reqEl.textContent = formatKRW(params.reqAmount);
  if (recEl) recEl.textContent = formatKRW(params.limit);

  const ratio = params.limit > 0 ? clamp(params.reqAmount / params.limit, 0, 1) : 0;
  if (progressEl) {
    const percent = Math.round(ratio * 100);
    progressEl.style.width = percent + '%';
    progressEl.setAttribute('aria-valuenow', String(percent));
  }
}

/**
 * @description θ 슬라이더 팝오버를 바인딩한다.
 */
function bindThetaControls() {
  const button = document.getElementById('thetaEditBtn');
  const popover = document.getElementById('thetaPopover');
  const range = document.getElementById('thetaRange');
  const output = document.getElementById('thetaOut');
  const applyBtn = document.getElementById('thetaApply');
  const cancelBtn = document.getElementById('thetaCancel');

  if (!button || !popover || !range || !output || !applyBtn || !cancelBtn) return;

  const syncSlider = function () {
    range.value = state.theta.toFixed(2);
    output.textContent = state.theta.toFixed(2);
  };

  button.addEventListener('click', function () {
    if (popover.hidden) {
      syncSlider();
      popover.hidden = false;
      range.focus();
    } else {
      popover.hidden = true;
    }
  });

  range.addEventListener('input', function () {
    output.textContent = Number(range.value).toFixed(2);
  });

  applyBtn.addEventListener('click', function () {
    const next = Number(range.value);
    if (Number.isNaN(next)) return;
    applyState({ theta: clamp(next, 0, 1) });
    popover.hidden = true;
    if (state.whatif.recalculate) state.whatif.recalculate();
  });

  cancelBtn.addEventListener('click', function () {
    syncSlider();
    popover.hidden = true;
  });

  popover.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      syncSlider();
      popover.hidden = true;
      button.focus();
    }
  });

  syncSlider();
}

/**
 * @description SHAP 상위 Top-N을 수평 바로 표현한다.
 * @param {string} elId - 차트 DOM ID.
 * @param {Array<{feature:string,value:number}>} shapArray - SHAP 값 목록.
 */
function initShapBar(elId, shapArray) {
  const chart = getChart(elId);
  if (!chart) return;

  const items = shapArray.slice(0, 6);
  const labels = [];
  const data = [];
  for (let i = items.length - 1; i >= 0; i -= 1) {
    labels.push(items[i].feature);
    data.push({
      value: round(items[i].value, 2),
      itemStyle: { color: items[i].value >= 0 ? '#198754' : '#dc3545' },
    });
  }

  chart.setOption({
    grid: { left: 110, right: 40, top: 24, bottom: 24 },
    xAxis: {
      type: 'value',
      axisLabel: { formatter: function (value) { return value.toFixed(2); }, color: '#6c757d' },
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
    },
    yAxis: {
      type: 'category',
      data: labels,
      axisTick: { show: false },
      axisLabel: { color: '#212529', fontSize: 12 },
    },
    series: [
      {
        type: 'bar',
        data: data,
        label: {
          show: true,
          formatter: function (params) { return params.value.toFixed(2); },
          color: '#212529',
        },
        barWidth: 16,
        markLine: {
          silent: true,
          lineStyle: { color: 'rgba(13,110,253,0.6)', width: 1.5 },
          symbol: 'none',
          data: [{ xAxis: 0 }],
        },
        labelLayout: function (params) {
          const value = params.value;
          const align = value >= 0 ? 'left' : 'right';
          const offset = value >= 0 ? params.rect.width + 6 : -6;
          return {
            x: params.rect.x + offset,
            align: align,
          };
        },
      },
    ],
    animationDuration: 600,
  }, true);

  chart.getDom().setAttribute('aria-label', '상위 SHAP 기여도 6개 항목 차트');
}

/**
 * @description 정책 지표의 현재값과 타깃을 비교한다.
 * @param {string} elId - 차트 DOM ID.
 * @param {Array<{label:string,value:number,target:number,direction:string}>} items - 정책 목록.
 */
function initPolicyGap(elId, items) {
  const chart = getChart(elId);
  if (!chart) return;

  const categories = items.map(function (item) { return item.label; });
  const diffData = items.map(function (item) {
    const diff = item.direction === '≥' ? item.value - item.target : item.target - item.value;
    const meets = diff >= 0;
    return {
      value: round(diff, 2),
      meets: meets,
      actual: item.value,
      target: item.target,
      direction: item.direction,
    };
  });
  const maxAbs = Math.max.apply(null, diffData.map(function (row) { return Math.abs(row.value); })) || 0.1;
  const extent = round(maxAbs * 1.2, 2);

  chart.setOption({
    grid: { left: 90, right: 32, top: 24, bottom: 24 },
    xAxis: {
      type: 'value',
      min: -extent,
      max: extent,
      axisLabel: { formatter: function (value) { return value.toFixed(2); }, color: '#6c757d' },
      splitLine: { show: true, lineStyle: { color: 'rgba(13,110,253,0.1)', type: 'dashed' } },
      axisLine: { lineStyle: { color: 'rgba(13,110,253,0.4)' } },
    },
    yAxis: {
      type: 'category',
      data: categories,
      axisTick: { show: false },
      axisLabel: { color: '#212529', fontWeight: 600 },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function (params) {
        const bar = params.find(function (p) { return p.seriesType === 'bar'; });
        if (!bar) return '';
        const datum = diffData[bar.dataIndex];
        const verdict = datum.meets ? '충족' : '미달';
        return categories[bar.dataIndex]
          + '<br/>현황: ' + datum.actual.toFixed(2)
          + '<br/>정책(' + datum.direction + '): ' + datum.target.toFixed(2)
          + '<br/>여유: ' + datum.value.toFixed(2) + ' (' + verdict + ')';
      },
    },
    series: [
      {
        type: 'bar',
        data: diffData.map(function (item) {
          return {
            value: item.value,
            itemStyle: { color: item.meets ? '#198754' : '#dc3545' },
            actual: item.actual,
            target: item.target,
            meets: item.meets,
          };
        }),
        barWidth: 22,
        label: {
          show: true,
          color: '#212529',
          formatter: function (params) { return params.value.toFixed(2); },
        },
        labelLayout: function (params) {
          const value = params.value;
          const align = value >= 0 ? 'left' : 'right';
          const offset = value >= 0 ? params.rect.width + 6 : -6;
          return {
            x: params.rect.x + offset,
            align: align,
          };
        },
        markLine: {
          silent: true,
          lineStyle: { color: 'rgba(13,110,253,0.6)', width: 1.5 },
          symbol: 'none',
          data: [{ xAxis: 0 }],
        },
      },
    ],
  }, true);

  chart.getDom().setAttribute('aria-label', '정책 갭 보드 차트');
}

/**
 * @description 위험 행렬 히트맵을 렌더링한다.
 * @param {string} elId - 차트 DOM ID.
 * @param {string[]} rows - 행 라벨.
 * @param {string[]} cols - 열 라벨.
 * @param {Array<{r:string,c:string,v:number}>} cells - 셀 값.
 */
function initRiskHeatmap(elId, rows, cols, cells) {
  const chart = getChart(elId);
  if (!chart) return;

  const data = cells.map(function (cell) {
    return [
      cols.indexOf(cell.c),
      rows.indexOf(cell.r),
      round(clamp(cell.v, 0, 1), 2),
    ];
  });

  chart.setOption({
    grid: { left: 90, right: 30, top: 20, bottom: 60 },
    xAxis: {
      type: 'category',
      data: cols,
      splitArea: { show: true, areaStyle: { color: ['rgba(13,110,253,0.02)', 'rgba(13,110,253,0.08)'] } },
      axisLabel: { color: '#6c757d', fontWeight: 600 },
      axisLine: { lineStyle: { color: 'rgba(13,110,253,0.35)' } },
    },
    yAxis: {
      type: 'category',
      data: rows,
      splitArea: { show: true, areaStyle: { color: ['rgba(13,110,253,0.02)', 'rgba(13,110,253,0.08)'] } },
      axisLabel: { color: '#6c757d', fontWeight: 600 },
      axisLine: { lineStyle: { color: 'rgba(13,110,253,0.35)' } },
    },
    tooltip: {
      formatter: function (params) {
        const rowName = rows[params.value[1]];
        const colName = cols[params.value[0]];
        return rowName + ' / ' + colName + ': ' + Math.round(params.value[2] * 100) + '%';
      },
    },
    visualMap: {
      min: 0,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#d7e8ff', '#0d6efd'] },
      formatter: function (value) { return Math.round(value * 100) + '%'; },
    },
    series: [
      {
        name: 'risk',
        type: 'heatmap',
        data: data,
        label: { show: true, formatter: function (params) { return Math.round(params.data[2] * 100) + '%'; }, color: '#0b1f44', fontWeight: 600 },
        itemStyle: { borderWidth: 4, borderColor: '#f8f9fe' },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(13,110,253,0.35)' } },
      },
    ],
  }, true);

  chart.getDom().setAttribute('aria-label', '리스크 매트릭스 열지도');
}

/**
 * @description 승인율 추이 선 그래프를 렌더링한다.
 * @param {string} elId - 차트 DOM ID.
 * @param {Array<{t:string,rate:number}>} points - 시계열 데이터.
 */
function initTrendLine(elId, points) {
  const chart = getChart(elId);
  if (!chart) return;

  chart.setOption({
    grid: { left: 60, right: 30, top: 20, bottom: 60 },
    xAxis: { type: 'category', data: points.map(function (p) { return p.t; }) },
    yAxis: {
      type: 'value',
      min: 0,
      max: 1,
      axisLabel: { formatter: function (value) { return Math.round(value * 100) + '%'; } },
    },
    tooltip: {
      trigger: 'axis',
      formatter: function (params) {
        const point = params[0];
        return point.axisValue + '<br/>승인율: ' + (point.value * 100).toFixed(1) + '%';
      },
    },
    dataZoom: [
      { type: 'inside', minSpan: 20 },
      { type: 'slider', bottom: 10, height: 18 },
    ],
    series: [
      {
        type: 'line',
        smooth: true,
        areaStyle: { color: 'rgba(13,110,253,0.15)' },
        lineStyle: { color: '#0d6efd', width: 3 },
        symbolSize: 8,
        data: points.map(function (point) { return clamp(point.rate, 0, 1); }),
      },
    ],
  }, true);

  chart.getDom().setAttribute('aria-label', '최근 승인율 추이 차트');
}

/**
 * @description 레이더 형태로 위험 프로파일을 시각화한다.
 * @param {string} elId - 차트 DOM ID.
 * @param {Array<{label:string,value:number,target:number,max:number}>} metrics - 위험 지표.
 */
function initRiskRadar(elId, metrics) {
  const chart = getChart(elId);
  if (!chart) return;

  const indicator = metrics.map(function (item) { return { name: item.label, max: item.max }; });
  const current = metrics.map(function (item) { return clamp(item.value, 0, item.max); });
  const target = metrics.map(function (item) { return clamp(item.target !== undefined ? item.target : item.max * 0.8, 0, item.max); });

  chart.setOption({
    legend: {
      bottom: 0,
      data: ['목표 프로파일', '현재 위험도'],
      textStyle: { color: '#6c757d', fontSize: 12 },
    },
    radar: {
      indicator: indicator,
      center: ['50%', '50%'],
      radius: '70%',
      splitNumber: 4,
      axisName: { color: '#0b1f44', fontSize: 12 },
      axisLine: { lineStyle: { color: 'rgba(13,110,253,0.35)' } },
      splitLine: { lineStyle: { color: 'rgba(13,110,253,0.2)' } },
      splitArea: {
        areaStyle: {
          color: ['rgba(13,110,253,0.02)', 'rgba(13,110,253,0.06)'],
        },
      },
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: target,
            name: '목표 프로파일',
            areaStyle: { color: 'rgba(13,110,253,0.18)' },
            lineStyle: { color: '#0d6efd', width: 2 },
            symbol: 'none',
          },
          {
            value: current,
            name: '현재 위험도',
            areaStyle: { color: 'rgba(255,193,7,0.25)' },
            lineStyle: { color: '#ffc107', width: 2 },
            symbol: 'circle',
            symbolSize: 4,
          },
        ],
      },
    ],
  }, true);

  chart.getDom().setAttribute('aria-label', '위험도 분석 레이더 차트');
}

/**
 * @description 서류 체크리스트를 렌더링한다.
 * @param {string} elId - 목록 요소 ID.
 * @param {Array<{label:string,status:string}>} items - 체크 항목.
 */
function renderChecklist(elId, items) {
  const list = document.getElementById(elId);
  if (!list) return;
  list.innerHTML = '';

  const iconMap = { ok: '✅', warn: '⚠️', missing: '⛔' };

  items.forEach(function (item) {
    const li = document.createElement('li');
    li.className = 'kb-checklist__item kb-checklist__item--' + item.status;

    const icon = document.createElement('span');
    icon.className = 'kb-checklist__icon';
    icon.textContent = iconMap[item.status] || '•';

    const label = document.createElement('span');
    label.className = 'kb-checklist__label';
    label.textContent = item.label;

    li.appendChild(icon);
    li.appendChild(label);
    list.appendChild(li);
  });
}

/**
 * @description 간단한 추천 한도 계산 모델을 적용한다.
 * @param {Object} params - 입력 시나리오.
 * @param {number} params.rate - 연이율(%).
 * @param {number} params.term - 상환 기간(개월).
 * @param {number} params.income - 연 소득.
 * @param {string} params.grade - 신용 등급.
 * @param {number} [params.theta=state.theta] - 임계값.
 * @returns {number} 추천 한도 금액.
 */
function recommendLimitSimple(params) {
  const rate = params.rate;
  const term = params.term;
  const income = params.income;
  const grade = params.grade;
  const theta = params.theta !== undefined ? params.theta : state.theta;

  const monthlyIncome = income / 12;
  const dsrMap = { A: 0.42, B: 0.38, C: 0.34, D: 0.3, E: 0.26 };
  const gradeBoost = { A: 1.1, B: 1.05, C: 1, D: 0.9, E: 0.8 };
  const allowableRatio = dsrMap[grade] !== undefined ? dsrMap[grade] : 0.34;
  const monthlyCapacity = monthlyIncome * allowableRatio;
  const monthlyRate = rate / 100 / 12;
  const pow = Math.pow(1 + monthlyRate, -term);
  const annuityFactor = monthlyRate > 0 ? (1 - pow) / monthlyRate : term;
  const basePrincipal = monthlyCapacity * annuityFactor;
  const certainty = 1 + (0.5 - theta) * 0.2;
  const factor = gradeBoost[grade] !== undefined ? gradeBoost[grade] : 1;
  const result = basePrincipal * factor * certainty;
  return clamp(result, 0, 200000000);
}

/**
 * @description 간단한 승인 확률 모형을 적용한다.
 * @param {Object} params - 입력 시나리오.
 * @param {number} params.rate - 연이율.
 * @param {number} params.term - 상환 기간.
 * @param {number} params.amount - 요청 금액.
 * @param {number} params.income - 연 소득.
 * @param {string} params.grade - 신용 등급.
 * @returns {number} 예상 승인 확률(0~1).
 */
function estimateProbability(params) {
  const gradeBonus = { A: 0.12, B: 0.08, C: 0.04, D: -0.02, E: -0.08 };
  const base = 0.5 + (gradeBonus[params.grade] || 0);
  const incomeFactor = clamp(params.income / 120000000, 0, 2) - 0.5;
  const ratePenalty = (params.rate - 7) * 0.015;
  const dti = clamp(params.amount / Math.max(params.income, 1), 0, 1.6);
  const termBonus = (params.term / 120) * 0.05;
  const score = base + incomeFactor * 0.1 - ratePenalty - dti * 0.25 + termBonus;
  return clamp(score, 0.05, 0.98);
}

/**
 * @description What-if 패널을 초기화하고 상태 연동을 담당한다.
 * @param {Object} initial - 초기 시나리오.
 * @param {number} initial.pHat - 기본 승인 확률.
 * @param {number} initial.theta - 기본 임계값.
 * @param {string} initial.grade - 기본 등급.
 */
function initWhatIfPanel(initial) {
  const rateEl = document.getElementById('wi_rate_range');
  const rateNumberEl = document.getElementById('wi_rate_input');
  const termEl = document.getElementById('wiTerm');
  const amountEl = document.getElementById('wiAmount');
  const incomeEl = document.getElementById('wiIncome');
  const outputs = {
    term: document.getElementById('wiTermOut'),
    amount: document.getElementById('wiAmountOut'),
    income: document.getElementById('wiIncomeOut'),
    pHat: document.getElementById('wiPHat'),
    progress: document.getElementById('wiProgress'),
  };

  if (!rateEl || !rateNumberEl || !termEl || !amountEl || !incomeEl) return;
  if (Object.values(outputs).some(function (el) { return !el; })) return;

  const defaults = {
    rate: initial.rate !== undefined ? initial.rate : 8.5,
    term: initial.term !== undefined ? initial.term : 60,
    amount: initial.amount !== undefined ? initial.amount : state.reqAmount,
    income: initial.income !== undefined ? initial.income : state.income,
  };

  rateEl.value = String(defaults.rate);
  rateNumberEl.value = Number(defaults.rate).toFixed(2);
  termEl.value = String(defaults.term);
  amountEl.value = String(defaults.amount);
  incomeEl.value = String(defaults.income);

  const syncOutputs = function () {
    rateNumberEl.value = Number(rateEl.value || 0).toFixed(2);
    outputs.term.textContent = termEl.value + '개월';
    outputs.amount.textContent = formatKRWThousandUnit(Number(amountEl.value));
    outputs.income.textContent = formatKRWThousandUnit(Number(incomeEl.value));
  };

  const recalc = function () {
    const rate = Number(rateEl.value);
    const term = Number(termEl.value);
    const amount = Number(amountEl.value);
    const income = Number(incomeEl.value);

    const limit = recommendLimitSimple({ rate: rate, term: term, income: income, grade: state.grade, theta: state.theta });
    const probability = estimateProbability({ rate: rate, term: term, amount: amount, income: income, grade: state.grade });
    const ratio = limit > 0 ? clamp(amount / limit, 0, 1) : 0;

    outputs.pHat.textContent = (probability * 100).toFixed(1) + '%';
    outputs.progress.style.width = Math.round(ratio * 100) + '%';
    outputs.progress.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));

    state.whatif.current = { rate: rate, term: term, amount: amount, income: income };
    applyState({ pHat: probability, reqAmount: amount, limit: limit });
  };

  state.whatif.recalculate = recalc;
  const debouncedRecalc = debounce(recalc, 250);

  bindRangeAndNumber(rateEl, rateNumberEl, function () {
    syncOutputs();
    debouncedRecalc();
  });

  [termEl, amountEl, incomeEl].forEach(function (input) {
    input.addEventListener('input', function () {
      syncOutputs();
      debouncedRecalc();
    });
    input.addEventListener('change', function () {
      syncOutputs();
      debouncedRecalc();
    });
  });

  syncOutputs();
  recalc();
}

/**
 * @description 차트를 지연 렌더링한다.
 * @param {string} domId - 차트 ID.
 * @param {Function} initializer - 초기화 함수.
 */
function lazyInitChart(domId, initializer) {
  const el = document.getElementById(domId);
  if (!el) return;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          initializer();
          obs.disconnect();
        }
      });
    }, { rootMargin: '0px 0px 120px 0px', threshold: 0.1 });
    observer.observe(el);
  } else {
    initializer();
  }
}

/**
 * @description 상태를 반영하고 요약/게이지를 갱신한다.
 * @param {Object} [partial={}] - 갱신할 상태 값.
 */
function applyState(partial) {
  const update = partial || {};
  Object.assign(state, update);
  const decision = getDecisionMeta(state.pHat, state.theta);
  renderApprovalGauge({ domId: 'gaugeChart', value: state.pHat, threshold: state.theta, title: '승인확률', subtitle: '', status: decision.text });
  updateSummary({ pHat: state.pHat, theta: state.theta, limit: state.limit, reqAmount: state.reqAmount, grade: state.grade });
}

document.addEventListener('DOMContentLoaded', function () {
  const demoShap = [
    { feature: '연소득', value: 0.12 },
    { feature: '부채비율', value: -0.09 },
    { feature: '신용점수', value: 0.07 },
    { feature: '연체기록', value: -0.05 },
    { feature: '재직연수', value: 0.04 },
    { feature: '신용이력', value: 0.03 },
  ];
  const policyItems = [
    { label: 'DSR', value: 0.33, target: 0.4, direction: '≤' },
    { label: '신용점수', value: 820, target: 650, direction: '≥' },
    { label: '부채비율', value: 1.1, target: 1.0, direction: '≤' },
  ];
  const rows = ['신용', '소득', '부채'];
  const cols = ['낮음', '중간', '높음'];
  const cells = [
    { r: '신용', c: '낮음', v: 0.2 },
    { r: '신용', c: '중간', v: 0.5 },
    { r: '신용', c: '높음', v: 0.9 },
    { r: '소득', c: '낮음', v: 0.3 },
    { r: '소득', c: '중간', v: 0.6 },
    { r: '소득', c: '높음', v: 0.8 },
    { r: '부채', c: '낮음', v: 0.2 },
    { r: '부채', c: '중간', v: 0.4 },
    { r: '부채', c: '높음', v: 0.7 },
  ];
  const points = [
    { t: '09-01', rate: 0.68 },
    { t: '09-02', rate: 0.71 },
    { t: '09-03', rate: 0.66 },
    { t: '09-04', rate: 0.74 },
    { t: '09-05', rate: 0.69 },
  ];
  const riskRadarItems = [
    { label: '신용도', value: 82, target: 78, max: 100 },
    { label: '상환능력', value: 76, target: 80, max: 100 },
    { label: '소득안정성', value: 70, target: 72, max: 100 },
    { label: '시장환경', value: 58, target: 65, max: 100 },
    { label: '담보가치', value: 74, target: 75, max: 100 },
  ];
  const checklistItems = [
    { label: '최근 급여명세서 업로드', status: 'ok' },
    { label: '소득 금액증명원 제출', status: 'missing' },
    { label: '담보 감정가 최신화', status: 'warn' },
    { label: '신용정보 활용 동의서 수집', status: 'ok' },
  ];

  const initialScenario = { rate: 8.5, term: 60, amount: state.reqAmount, income: state.income };
  state.limit = recommendLimitSimple({ rate: initialScenario.rate, term: initialScenario.term, income: initialScenario.income, grade: state.grade, theta: state.theta });

  applyState();
  bindThetaControls();
  renderChecklist('docChecklistList', checklistItems);

  lazyInitChart('shapChart', function () { initShapBar('shapChart', demoShap); });
  lazyInitChart('policyGap', function () { initPolicyGap('policyGap', policyItems); });
  lazyInitChart('riskHeatmap', function () { initRiskHeatmap('riskHeatmap', rows, cols, cells); });
  lazyInitChart('trendLine', function () { initTrendLine('trendLine', points); });
  lazyInitChart('summaryRiskRadar', function () { initRiskRadar('summaryRiskRadar', riskRadarItems); });

  initWhatIfPanel({ pHat: state.pHat, theta: state.theta, grade: state.grade, rate: initialScenario.rate, term: initialScenario.term, amount: initialScenario.amount, income: initialScenario.income });
});
