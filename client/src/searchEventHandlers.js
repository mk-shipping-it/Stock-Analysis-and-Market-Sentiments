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
