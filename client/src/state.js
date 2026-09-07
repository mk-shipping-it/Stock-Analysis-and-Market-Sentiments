// Shared state — mirrors Bibliotheca src/state.js (grid, searchInput, Fuse)
const grid = document.getElementById('card-grid')
const searchInput = document.getElementById('search-input')
const resultCount = document.getElementById('result-count')
const forecastPanel = document.getElementById('forecast-panel')

// Live watchlist — populated from GET /api/stocks at boot (no hardcoded prices)
let stocks = []
