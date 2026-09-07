fetch('/api/stocks')
  .then(r => r.json())
  .then(data => {
    stocks = Array.isArray(data) ? data : []
    renderStocks([...stocks])
  })
  .catch(() => {
    if (grid) grid.innerHTML = '<p style="color:#c00;">Could not load quotes.</p>'
  })
