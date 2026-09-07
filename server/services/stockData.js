const axios = require('axios');

async function chartCloses(symbol, days) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - days * 24 * 3600;
  const res = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
    params: { period1: start, period2: end, interval: '1d' },
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000,
  });
  const result = res.data?.chart?.result?.[0];
  const closes = (result?.indicators?.quote?.[0]?.close || []).filter((c) => c != null);
  return closes;
}

async function getLatestClosePrice(symbol) {
  try {
    const closes = await chartCloses(symbol, 10);
    if (!closes.length) return null;
    const last = closes[closes.length - 1];
    const prev = closes.length >= 2 ? closes[closes.length - 2] : last;
    return [last, prev];
  } catch {
    return null;
  }
}

module.exports = { getLatestClosePrice, chartCloses };

// Yahoo quote SDK crumb-walled (429s); chart endpoint answers plain axios — use this
