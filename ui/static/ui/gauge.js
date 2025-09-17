(function (global) {
  const instances = {};

  function clamp(value, min, max) {
    if (!Number.isFinite(value)) return min;
    return Math.min(Math.max(value, min), max);
  }

  function readVar(name, fallback) {
    const root = document.body || document.documentElement;
    if (!root) return fallback;
    const value = getComputedStyle(root).getPropertyValue(name);
    return value && value.trim() ? value.trim() : fallback;
  }

  function ensureInstance(domId) {
    if (typeof echarts === 'undefined') {
      return null;
    }
    const el = document.getElementById(domId);
    if (!el) {
      return null;
    }
    if (!instances[domId]) {
      instances[domId] = echarts.init(el, null, { renderer: 'svg' });
      window.addEventListener('resize', function () {
        const chart = instances[domId];
        if (chart) {
          chart.resize();
        }
      });
    }
    return instances[domId];
  }

  function render(domId, value, threshold, options) {
    const chart = ensureInstance(domId);
    if (!chart) {
      return null;
    }
    const opts = options || {};
    const accent = opts.accent || readVar('--kb-color-accent', '#f7b500');
    const track = opts.track || readVar('--kb-color-track', '#dde3f3');
    const needle = opts.needle || readVar('--kb-color-gauge-needle', '#1f2937');
    const thresholdColor = opts.thresholdColor || readVar('--kb-color-gauge-threshold', '#ef4444');
    const title = opts.title || '승인 확률';
    const subtitle = opts.subtitle || '';

    const valuePct = clamp(Number(value) * 100, 0, 100);
    const threshPct = clamp(Number(threshold) * 100, 0, 100);

    chart.setOption(
      {
        title: subtitle
          ? {
              text: subtitle,
              left: 'center',
              top: '68%',
              textStyle: {
                fontSize: 13,
                fontWeight: 500,
                color: 'rgba(55, 65, 81, 0.75)',
              },
            }
          : undefined,
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
              width: 16,
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
                width: 16,
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
              itemStyle: {
                color: needle,
              },
            },
            anchor: {
              show: true,
              showAbove: true,
              size: 12,
              itemStyle: { color: needle },
            },
            axisTick: {
              distance: -24,
              length: 6,
              splitNumber: 2,
              lineStyle: { color: 'rgba(99, 102, 241, 0.18)', width: 1 },
            },
            splitLine: {
              length: 12,
              distance: -24,
              lineStyle: { width: 2, color: 'rgba(15, 23, 42, 0.2)' },
            },
            axisLabel: {
              distance: 16,
              color: 'rgba(55, 65, 81, 0.65)',
              fontSize: 12,
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: '#0f172a',
              fontSize: 28,
              fontWeight: 700,
              offsetCenter: [0, '46%'],
            },
            title: {
              show: true,
              offsetCenter: [0, '-30%'],
              color: 'rgba(55, 65, 81, 0.75)',
              fontSize: 14,
              fontWeight: 600,
              formatter: title,
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
              show: true,
              length: '75%',
              width: 4,
              offsetCenter: [0, '-12%'],
              icon: 'path://M0 -9 L8 0 L0 9 Z',
              itemStyle: { color: thresholdColor },
            },
            detail: {
              show: true,
              formatter: function () {
                return '임계치 ' + Math.round(threshPct) + '%';
              },
              color: thresholdColor,
              fontSize: 12,
              offsetCenter: [0, '-68%'],
            },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            data: [{ value: threshPct }],
          },
        ],
      },
      true,
    );
    return chart;
  }

  global.KBGauge = {
    render: render,
  };
})(window);
