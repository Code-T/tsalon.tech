/** Clock arithmetic under a user-selected five-hour assumption, not quota data. */
export function calculateResetWindow(knownStartBeijing: string, useFiveHours: boolean) {
  if (!useFiveHours || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(knownStartBeijing)) return null;
  const start = Date.parse(`${knownStartBeijing}:00+08:00`);
  if (!Number.isFinite(start)) return null;
  // Date.parse normalizes impossible dates such as February 30; reject them.
  const normalized = new Date(start + 8 * 3600000).toISOString().slice(0, 16);
  if (normalized !== knownStartBeijing) return null;
  const end = start + 5 * 3600000;
  return {
    endIso: new Date(end).toISOString(),
    endBeijing: new Date(end + 8 * 3600000).toISOString().slice(0, 16).replace('T', ' '),
  };
}

export function initResetWindowCalculator(provider: string, locale: 'zh' | 'en') {
  const input = document.getElementById(`${provider}-window-start`) as HTMLInputElement | null;
  const button = document.getElementById(`${provider}-calculate`) as HTMLButtonElement | null;
  const result = document.getElementById(`${provider}-calc-result`);
  const tips = document.getElementById(`${provider}-calc-tips`);
  if (!input || !button || !result || !tips) return;
  const emptyTip = locale === 'zh' ? '输入已知窗口起点后，点击“按 5 小时计算”。' : 'Enter a known window start, then select “Calculate with 5 hours”.';
  const clear = () => {
    result.textContent = '—';
    tips.textContent = emptyTip;
  };
  input.addEventListener('input', clear);
  button.addEventListener('click', () => {
    const calculation = calculateResetWindow(input.value, true);
    if (!calculation) {
      clear();
      tips.textContent = locale === 'zh' ? '请填写有效的窗口开始日期和时间（北京时间）。' : 'Enter a valid window start date and time in Beijing time (UTC+8).';
      return;
    }
    result.textContent = calculation.endBeijing;
    tips.textContent = locale === 'zh'
      ? '假设窗口长度恰好为 5 小时。此结果不代表账号实际恢复时间，请以产品内显示为准。'
      : 'Assumes an exact five-hour window. This is not your account recovery time; use the time shown in the product.';
  });
  clear();
}
