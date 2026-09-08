const axios = require('axios');
const { RSI, MACD } = require('technicalindicators');

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

  const xMean = XTrain.reduce((a, b) => a + b, 0) / XTrain.length
  const xStd = Math.sqrt(XTrain.reduce((sum, v) => sum + (v - xMean) ** 2, 0) / XTrain.length) || 1
  const standardize = (v) => (v - xMean) / xStd

  const XTrainS = XTrain.map(standardize)
  const XTestS = XTest.map(standardize)
  const XForecastS = XForecast.map(standardize)

  const nT = XTrainS.length
  const sumX = XTrainS.reduce((a, b) => a + b, 0)
  const sumY = yTrain.reduce((a, b) => a + b, 0)
  const sumXY = XTrainS.reduce((s, xi, i) => s + xi * yTrain[i], 0)
  const sumX2 = XTrainS.reduce((s, xi) => s + xi * xi, 0)

  const slope = (nT * sumXY - sumX * sumY) / (nT * sumX2 - sumX * sumX) || 0
  const intercept = (sumY - slope * sumX) / nT

  const predict = (x) => slope * x + intercept
  const yTestPred = XTestS.map((x) => predict(x) * 1.04)
  const rmse = Math.sqrt(yTest.reduce((s, yi, i) => s + (yi - yTestPred[i]) ** 2, 0) / yTest.length)
  const forecastSet = XForecastS.map((x) => Math.round(predict(x) * 1.04 * 100) / 100)
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

  let signal = 'HOLD', rsi = null, macdBull = null;
  if (closes.length >= 35) {
    rsi = RSI.calculate({ values: closes, period: 14 }).at(-1);
    const m = MACD.calculate({ values: closes, fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 }).at(-1);
    macdBull = m ? m.MACD > m.signal : null;
    if (rsi < 30 && macdBull) signal = 'BUY';
    else if (rsi > 70 && macdBull === false) signal = 'SELL';
    rsi = Math.round(rsi * 10) / 10;
  }

  const last = data[data.length - 1]
  const recent = data.slice(-30)

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
    idea,
    signal,
    rsi,
    macdBull,
    chart_data: chartData,
  }
}

module.exports = { getForecast }

// Apr25 optimize: caching
