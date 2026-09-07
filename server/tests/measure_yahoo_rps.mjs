import { performance } from 'perf_hooks';
import https from 'https';

function yahooQuote(symbol) {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 10 * 86400;
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d`;
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
        try {
          const data = JSON.parse(body);
          const result = data?.chart?.result?.[0];
          resolve(result);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function measureYahooRPS() {
  const symbol = 'AAPL';

  const start = performance.now();
  const result = await yahooQuote(symbol);
  const elapsed = performance.now() - start;
  const elapsedSec = elapsed / 1000;

  const dataPoints = result?.timestamp?.length || 0;
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const lastClose = closes[closes.length - 1];

  console.log('=== Yahoo Finance2 Single Quote Measurement ===');
  console.log(`Symbol: ${symbol}`);
  console.log(`Data points (daily): ${dataPoints}`);
  console.log(`Last close: ${lastClose}`);
  console.log(`Elapsed: ${elapsed.toFixed(2)}ms (${elapsedSec.toFixed(4)}s)`);
  console.log(`Approx RPS (1 call / elapsed): ${(1 / elapsedSec).toFixed(2)}`);
}

measureYahooRPS().catch(console.error);
