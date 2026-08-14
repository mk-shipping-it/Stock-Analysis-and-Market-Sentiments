function renderStocks(list) {
  if (!grid) return
  grid.innerHTML = list.map(s => `
    <div class="card" data-symbol="${s.symbol}" style="background:#fff; border:1px solid #ddd; border-radius:8px; padding:16px; cursor:pointer;">
      <div class="poster image-container" style="background:#f0f2f8; display:flex; align-items:center; justify-content:center; min-height:120px; border-radius:4px; margin-bottom:10px;">
        <span style="font-size:1.5rem; font-weight:700; color:#2D4475;">${s.symbol}</span>
      </div>
      <h2 class="title">${s.symbol} — ${s.name}</h2>
      <p style="font-size:0.8125rem; color:#666; margin-top:4px;">Price: ${s.price} · ${s.change}</p>
      <a href="results.html?symbol=${s.symbol}" style="font-size:0.8125rem; color:#2D4475; text-decoration:none; margin-top:8px; display:inline-block;">Forecast →</a>
    </div>
  `).join('')
  if (resultCount) resultCount.textContent = list.length + ' tickers'
}
