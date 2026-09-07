const { performance } = require('perf_hooks');

async function measureYahooRPS() {
  const { default: yahooFinance } = await import('yahoo-finance2');
  const symbol = 'AAPL';

  const start = performance.now();
  const end = new Date();
  const startDate = new Date(end);
  startDate.setDate(startDate.getDate() - 10);

  const data = await yahooFinance.historical(symbol, {
    period1: startDate.toISOString().split('T')[0],
    period2: end.toISOString().split('T')[0],
  });

  const elapsed = performance.now() - start;
  const elapsedSec = elapsed / 1000;

  const points = data?.length || 0;
  const rps = points / elapsedSec;

  console.log('=== Yahoo Finance2 Single Quote Measurement ===');
  console.log(`Symbol: ${symbol}`);
  console.log(`Data points returned: ${points}`);
  console.log(`Elapsed: ${elapsedSec.toFixed(4)}s (${elapsed.toFixed(2)}ms)`);
  console.log(`Approx RPS (data points / elapsed): ${rps.toFixed(2)}`);
  console.log(`Approx RPS (1 call / elapsed): ${(1 / elapsedSec).toFixed(2)}`);
  if (data && data.length) {
    console.log(`Last close: ${data[data.length - 1].close}`);
  }
}

measureYahooRPS().catch(console.error);
