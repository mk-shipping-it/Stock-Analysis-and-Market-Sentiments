async function onSearch() {
  const q = searchInput.value.trim().toUpperCase()
  if (!q) {
    if (forecastPanel) forecastPanel.style.display = 'none'
    return
  }
  if (!/^[A-Z.]{1,6}$/.test(q)) return
  try {
    const data = await fetch('/api/predict', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ symbol: q }) }).then(r=>r.json())
    if (data.error) throw new Error(data.error)
    if (forecastPanel) {
      forecastPanel.style.display = 'block'
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
  }
}
