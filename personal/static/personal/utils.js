// [공통] range(슬라이더) ↔ number(숫자입력) 양방향 바인딩
export function bindRangeAndNumber(rangeEl, numberEl, onChange) {
  // 슬라이더 → 숫자
  rangeEl.addEventListener('input', () => {
    numberEl.value = rangeEl.value;
    onChange?.(Number(rangeEl.value));
  });
  // 숫자 → 슬라이더
  numberEl.addEventListener('input', () => {
    const min = Number(numberEl.min ?? rangeEl.min ?? 0);
    const max = Number(numberEl.max ?? rangeEl.max ?? 100);
    let v = Number(numberEl.value);
    if (Number.isNaN(v)) return;
    v = Math.min(max, Math.max(min, v));
    // step 맞춤 표시 (필요시 고정 소수점 조절)
    numberEl.value = v;
    rangeEl.value = v;
    onChange?.(v);
  });
}

// [공통] 게이지는 인스턴스 하나만 쓰고 setOption으로 업데이트(재init 금지)
let gaugeInstance = null;
export function updateGauge(pHat /* 0~1 */) {
  const el = document.getElementById('summaryGauge');
  gaugeInstance = gaugeInstance || echarts.init(el);
  const option = {
    series: [{ type:'gauge', progress:{show:true}, detail:{formatter:v=>Math.round(v*100)+'%'}, data:[{value:pHat}] }]
  };
  gaugeInstance.setOption(option, true); // 전체 덮어쓰기로 잔상 방지
}
