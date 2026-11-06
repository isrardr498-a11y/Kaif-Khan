import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEMA,
  calculateSMA,
  calculateBollingerBands,
  calculateIndianCharges,
  calculateRiskReward,
  checkStopLossTakeProfit,
  runEmaCrossoverBacktest,
  resolveMarketSpeedConfig,
  MARKET_SPEED_MODES,
  OHLCV,
} from './tradingMath';

const sampleCandles: OHLCV[] = Array.from({ length: 100 }, (_, i) => {
  const base = 24000 + Math.sin(i / 4) * 250 + i * 3;
  return {
    time: 1700000000 + i * 60,
    open: Number((base - 10).toFixed(2)),
    high: Number((base + 25).toFixed(2)),
    low: Number((base - 25).toFixed(2)),
    close: Number(base.toFixed(2)),
    volume: 10000 + i * 120,
  };
});

test('SMA and EMA calculations produce valid aligned series', () => {
  const sma20 = calculateSMA(sampleCandles, 20);
  const ema20 = calculateEMA(sampleCandles, 20);
  assert.equal(sma20.length, 81);
  assert.equal(ema20.length, 81);
  assert.equal(sma20[0].value, ema20[0].value);
});

test('Bollinger Bands upper is strictly above middle and lower', () => {
  const bb = calculateBollingerBands(sampleCandles, 20, 2);
  assert.equal(bb.middle.length, 81);
  assert.ok(bb.upper[10].value > bb.middle[10].value);
  assert.ok(bb.middle[10].value > bb.lower[10].value);
});

test('Indian brokerage and regulatory charges cap brokerage at Rs 20', () => {
  const charges = calculateIndianCharges(500000);
  assert.equal(charges.brokerage, 20);
  assert.ok(charges.total > 20);
});

test('Risk-to-Reward ratio validates long and short setups accurately', () => {
  const longRR = calculateRiskReward('BUY', 24000, 23900, 24250);
  assert.equal(longRR.valid, true);
  assert.equal(longRR.ratio, 2.5);
  assert.equal(longRR.label, '1 : 2.5');

  const shortRR = calculateRiskReward('SELL', 24000, 24100, 23700);
  assert.equal(shortRR.valid, true);
  assert.equal(shortRR.ratio, 3);

  const invalidRR = calculateRiskReward('BUY', 24000, 24100, 24200);
  assert.equal(invalidRR.valid, false);
});

test('Stop-Loss and Take-Profit trigger detection works for BUY and SELL', () => {
  assert.equal(checkStopLossTakeProfit('BUY', 23890, 23900, 24200), 'SL');
  assert.equal(checkStopLossTakeProfit('BUY', 24210, 23900, 24200), 'TP');
  assert.equal(checkStopLossTakeProfit('SELL', 24105, 24100, 23800), 'SL');
  assert.equal(checkStopLossTakeProfit('SELL', 23790, 24100, 23800), 'TP');
  assert.equal(checkStopLossTakeProfit('BUY', 24050, 23900, 24200), null);
});

test('EMA crossover strategy backtester runs on 100 candles', () => {
  const res = runEmaCrossoverBacktest(sampleCandles, 5, 15, 100000);
  assert.ok(res.totalTrades >= 1);
  assert.ok(res.winRate >= 0 && res.winRate <= 100);
});

test('Market Speed / Trading Style selector resolves 400ms, 1200ms default, and 3000ms accurately', () => {
  const defaultCfg = resolveMarketSpeedConfig();
  assert.equal(defaultCfg.mode, 'intraday');
  assert.equal(defaultCfg.intervalMs, 1200);

  assert.equal(MARKET_SPEED_MODES.scalping.intervalMs, 400);
  assert.equal(MARKET_SPEED_MODES.intraday.intervalMs, 1200);
  assert.equal(MARKET_SPEED_MODES.swing.intervalMs, 3000);
});

