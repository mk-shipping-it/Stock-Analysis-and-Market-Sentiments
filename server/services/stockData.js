async function getLatestClosePrice(symbol) {
  try {
    const { default: YahooFinance } = await import('yahoo-finance2');
    const yahooFinance = new YahooFinance();
    yahooFinance.suppressNotices?.(['yahooSurvey']);
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 10);

    const data = await yahooFinance.historical(symbol, {
      period1: start.toISOString().split('T')[0],
      period2: end.toISOString().split('T')[0],
    });

    if (!data || data.length === 0) {
      console.error(`No data for ${symbol}`);
      return null;
    }
    const closes = data.map(d => d.close);
    const last = closes[closes.length - 1];
    const prev = closes.length >= 2 ? closes[closes.length - 2] : last;
    return [last, prev];
  } catch (err) {
    console.error(`Error fetching price for ${symbol}:`, err.message);
    return null;
  }
}

module.exports = { getLatestClosePrice };

// Apr20 fix: API changes
