if (searchInput) {
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSearch()
      // also navigate to results for full page (mirrors old Home.jsx behavior)
      const v = searchInput.value.trim().toUpperCase()
      if (v && /^[A-Z.]{1,6}$/.test(v)) window.location.href = 'results.html?symbol=' + encodeURIComponent(v)
    }
  })
}

(() => {
  if (!searchInput) return
  const phrases = ['Search ticker e.g. AAPL', 'Try TSLA', 'Try NVDA', 'Try MSFT']
  let p = 0, c = 0, wait = 0, del = false
  setInterval(() => {
    if (searchInput.value) return
    if (wait > 0) { wait--; return }
    const full = phrases[p]
    c += del ? -1 : 1
    searchInput.placeholder = full.slice(0, Math.max(0, c))
    if (!del && c >= full.length) { del = true; wait = 14 }
    else if (del && c <= 0) { del = false; p = (p + 1) % phrases.length }
  }, 80)
})()
