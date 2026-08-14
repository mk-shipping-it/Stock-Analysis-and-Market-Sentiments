// Shared state — mirrors Bibliotheca src/state.js (grid, searchInput, Fuse)
const grid = document.getElementById('card-grid')
const searchInput = document.getElementById('search-input')
const resultCount = document.getElementById('result-count')
const forecastPanel = document.getElementById('forecast-panel')

// Demo watchlist — stands in for Bibliotheca `books` catalog (1000 entries)
// Keep same shape idea: title/author/cover → symbol/name/price for reuse of card-grid
const stocks = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: '—', change: '—' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', price: '—', change: '—' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', price: '—', change: '—' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', price: '—', change: '—' },
  { symbol: 'TSLA', name: 'Tesla Inc.', price: '—', change: '—' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', price: '—', change: '—' },
]
