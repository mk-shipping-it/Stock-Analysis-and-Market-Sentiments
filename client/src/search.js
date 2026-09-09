const searchInput = document.getElementById('search-input');
const forecastPanel = document.getElementById('forecast-panel');

async function onSearch() {
  const q = searchInput?.value.trim().toUpperCase();
  if (!q) { if (forecastPanel) forecastPanel.style.display = 'none'; return; }
  if (!/^[A-Z.]{1,6}$/.test(q)) return;
  try {
    const data = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: q })
    }).then(r => r.json());
    if (data.error) throw new Error(data.error);
    if (forecastPanel) {
      forecastPanel.style.display = 'block';
      forecastPanel.innerHTML = `
        <h3 style="margin:0 0 12px; color:#1a1a1a;">${q} — 5-day forecast</h3>
        <p style="font-size:0.9rem; color:#666; margin-bottom:8px;">Open: ${data.open} · High: ${data.high} · Low: ${data.low} · Volume: ${data.volume}</p>
        <p style="font-size:0.9rem; margin-bottom:8px;">RMSE: ${data.error_lr} · Idea: ${data.idea} · Signal: ${data.signal || 'HOLD'}</p>
        <a href="results.html?symbol=${q}" style="color:#2D4475; text-decoration:none; font-size:0.9rem;">Full prediction →</a>
      `;
    }
  } catch (e) {
    if (forecastPanel) forecastPanel.innerHTML = `<p style="color:#c00; font-size:0.9rem;">${e.message}</p>`;
  }
}

if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch();
      const v = searchInput.value.trim().toUpperCase();
      if (v && /^[A-Z.]{1,6}$/.test(v)) window.location.href = 'results.html?symbol=' + encodeURIComponent(v);
    }
  });

  const phrases = ['Search ticker e.g. AAPL', 'Try TSLA', 'Try NVDA', 'Try MSFT'];
  let p = 0, c = 0, wait = 0, del = false;
  setInterval(() => {
    if (searchInput.value) return;
    if (wait > 0) { wait--; return; }
    const full = phrases[p];
    c += del ? -1 : 1;
    searchInput.placeholder = full.slice(0, Math.max(0, c));
    if (!del && c >= full.length) { del = true; wait = 14; }
    else if (del && c <= 0) { del = false; p = (p + 1) % phrases.length; }
  }, 80);
}
