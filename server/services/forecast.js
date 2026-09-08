const axios = require('axios');
const { RSI, MACD } = require('technicalindicators');
const { linearRegression } = require('simple-statistics');

async function fetchHistory(symbol) {
  const end = Math.floor(Date.now() / 1000)
  const start = end - 2 * 365 * 24 * 3600
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${start}&period2=${end}&interval=1d`

  const res = await axios.get(url, {
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 10000,
  })

  const result = res.data?.chart?.result?.[0]
  if (!result) throw new Error(`No data for ${symbol}`)

  const timestamps = result.timestamp
  const quotes = result.indicators?.quote?.[0]
  if (!timestamps || !quotes) throw new Error(`Incomplete data for ${symbol}`)

  const data = timestamps.map((t, i) => ({
    date: new Date(t * 1000),
    open: quotes.open[i],
    high: quotes.high[i],
    low: quotes.low[i],
    close: quotes.close[i],
    volume: quotes.volume[i],
  })).filter((d) => d.close != null)

  if (data.length < 10) throw new Error(`Not enough data for ${symbol}`)
  return data
}

function linRegAlgo(closes) {
  const forecastOut = 5
  const n = closes.length

  const X = closes.slice(0, n - forecastOut)
  const y = closes.slice(forecastOut)
  const XForecast = closes.slice(-forecastOut)

  const splitIdx = Math.floor(0.8 * X.length)
  const XTrain = X.slice(0, splitIdx)
  const XTest = X.slice(splitIdx)
  const yTrain = y.slice(0, splitIdx)
  const yTest = y.slice(splitIdx)

  const lr = linearRegression(XTrain.map((_, i) => [XTrain[i], yTrain[i]]))
  const predict = (x) => lr.m * x + lr.b

  const yTestPred = XTest.map((x) => predict(x))
  const rmse = Math.sqrt(yTest.reduce((s, yi, i) => s + (yi - yTestPred[i]) ** 2, 0) / yTest.length)
  const forecastSet = XForecast.map((x) => Math.round(predict(x) * 100) / 100)
  const lrPred = forecastSet[0]

  return { forecastSet, lrPred, rmse }
}

function recommending(forecastSet) {
  return forecastSet[forecastSet.length - 1] > forecastSet[0] ? 'RISE' : 'FALL'
}

async function getForecast(symbol) {
  const data = await fetchHistory(symbol)
  const closes = data.map((d) => d.close)
  const { forecastSet, lrPred, rmse } = linRegAlgo(closes)
  const idea = recommending(forecastSet)

  let signal = 'HOLD', rsi = null, macdBull = null, macdConfirm = false;
  if (closes.length >= 35) {
    rsi = RSI.calculate({ values: closes, period: 14 }).at(-1);
    const m = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }).at(-1);
    macdBull = m ? m.MACD > m.signal : null;
    macdConfirm = macdBull === true;

    // Volatility-scaled bands so thresholds adapt to the stock instead of
    // hard-coding 30/70 (which NVDA sits above for weeks during a rally).
    const recentCloses = closes.slice(-21);
    const meanClose = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
    const vol = Math.sqrt(recentCloses.reduce((s, c) => s + (c - meanClose) ** 2, 0) / recentCloses.length) / meanClose;
    const band = Math.min(20, vol * 60);
    const oversold = 30 - band;
    const overbought = 70 + band;

    // Trend is primary. RSI only blocks at extremes; MACD is a confidence
    // modifier, not a gate, so the signal stays aligned with the forecast.
    if (idea === 'RISE' && rsi < oversold) signal = 'BUY';
    else if (idea === 'FALL' && rsi > overbought) signal = 'SELL';
    else signal = 'HOLD';

    rsi = Math.round(rsi * 10) / 10;
  }

  const last = data[data.length - 1]
  const recent = data.slice(-30)
  const meanPrice = closes.reduce((a, b) => a + b, 0) / closes.length || 1
  const rmsePct = Math.round((rmse / meanPrice) * 10000) / 100
  const confidence = rmsePct < 1 ? 'high' : rmsePct < 3 ? 'medium' : 'low'

  const chartData = {
    dates: recent.map((d) => d.date.toISOString().split('T')[0]),
    historical: recent.map((d) => Math.round(d.close * 100) / 100),
    forecast_dates: Array.from({ length: 5 }, (_, i) => {
      const d = new Date(data[data.length - 1].date)
      d.setDate(d.getDate() + i + 1)
      return d.toISOString().split('T')[0]
    }),
    forecast: forecastSet,
  }

  return {
    quote: symbol.toUpperCase(),
    lr_pred: lrPred,
    open: String(last.open || ''),
    close: String(last.close || ''),
    high: String(last.high || ''),
    low: String(last.low || ''),
    volume: String(last.volume || ''),
    forecast_set: forecastSet.map((v) => [v]),
    error_lr: Math.round(rmse * 100) / 100,
    error_pct: rmsePct,
    confidence,
    idea,
    signal,
    rsi,
    macdBull,
    macdConfirm,
    chart_data: chartData,
  }
}

module.exports = { getForecast }

// Apr25 optimize: caching
