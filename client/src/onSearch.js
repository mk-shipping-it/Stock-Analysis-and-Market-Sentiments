async function onSearch() {
  const q = searchInput.value.trim().toUpperCase()
  if (!q) {
    renderStocks(stocks)
    if (forecastPanel) forecastPanel.style.display = 'none'
    return
  }
  // If input looks like ticker (1-5 chars, no spaces), fetch forecast and show panel — same UX as SAMS Home.jsx navigate /results
  if (/^[A-Z.]{1,6}$/.test(q)) {
    if (forecastPanel) {
      forecastPanel.style.display = 'block'
      forecastPanel.innerHTML = '<p style="color:#666; font-size:0.9rem;">Loading forecast for ' + q + '…</p>'
    }
    try {
      const data = await fetch('/api/predict', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ symbol: q }) }).then(r=>r.json())
      if (data.error) throw new Error(data.error)
      const filtered = stocks.filter(s => s.symbol.includes(q))
      const extra = filtered.length ? [] : [{ symbol: q, name: (data.symbol || q) + ' — forecast', price: data.open || '—', change: (data.sentiment_pol || '') }]
      renderStocks(filtered.length ? filtered : extra)
      if (forecastPanel) {
        forecastPanel.innerHTML = `
          <h3 style="margin:0 0 12px; color:#1a1a1a;">${q} — 5-day forecast</h3>
          <p style="font-size:0.9rem; color:#666; margin-bottom:8px;">Open: ${data.open} · High: ${data.high} · Low: ${data.low} · Volume: ${data.volume}</p>
          <p style="font-size:0.9rem; margin-bottom:8px;">Sentiment: <strong>${data.sentiment_pol}</strong> (Pos ${data.pos} / Neu ${data.neutral} / Neg ${data.neg})</p>
          <p style="font-size:0.9rem; margin-bottom:8px;">RMSE: ${data.error_lr} · Idea: ${data.idea}</p>
          <a href="results.html?symbol=${q}" style="color:#2D4475; text-decoration:none; font-size:0.9rem;">Full prediction →</a>
        `
      }
    } catch(e) {
      if (forecastPanel) forecastPanel.innerHTML = '<p style="color:#c00; font-size:0.9rem;">' + e.message + '</p>'
      const filtered = stocks.filter(s => s.symbol.includes(q))
      renderStocks(filtered)
    }
  } else {
    const filtered = stocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q))
    renderStocks(filtered)
  }
}
