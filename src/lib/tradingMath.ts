export interface OHLCV {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradeCharges {
  brokerage: number;
  stt: number;
  exchangeTx: number;
  gst: number;
  sebiStamp: number;
  total: number;
}

export function calculateEMA(candles: OHLCV[], period: number): { time: number; value: number }[] {
  if (candles.length < period || period <= 0) return [];
  const k = 2 / (period + 1);
  const result: { time: number; value: number }[] = [];
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let ema = sum / period;
  result.push({ time: candles[period - 1].time, value: Number(ema.toFixed(2)) });

  for (let i = period; i < candles.length; i++) {
    ema = candles[i].close * k + ema * (1 - k);
    result.push({ time: candles[i].time, value: Number(ema.toFixed(2)) });
  }
  return result;
}

export function calculateSMA(candles: OHLCV[], period: number): { time: number; value: number }[] {
  if (candles.length < period || period <= 0) return [];
  const result: { time: number; value: number }[] = [];
  for (let i = period - 1; i < candles.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += candles[j].close;
    }
    result.push({ time: candles[i].time, value: Number((sum / period).toFixed(2)) });
  }
  return result;
}

export function calculateBollingerBands(
  candles: OHLCV[],
  period = 20,
  stdDevMultiplier = 2
): {
  upper: { time: number; value: number }[];
  middle: { time: number; value: number }[];
  lower: { time: number; value: number }[];
} {
  const upper: { time: number; value: number }[] = [];
  const middle: { time: number; value: number }[] = [];
  const lower: { time: number; value: number }[] = [];

  if (candles.length < period) return { upper, middle, lower };

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((acc, c) => acc + c.close, 0) / period;
    const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    const t = candles[i].time;
    middle.push({ time: t, value: Number(mean.toFixed(2)) });
    upper.push({ time: t, value: Number((mean + stdDevMultiplier * sd).toFixed(2)) });
    lower.push({ time: t, value: Number((mean - stdDevMultiplier * sd).toFixed(2)) });
  }
  return { upper, middle, lower };
}

export function calculateIndianCharges(turnover: number): TradeCharges {
  const brokerage = Math.min(20, turnover * 0.0003);
  const stt = turnover * 0.00025;
  const exchangeTx = turnover * 0.0000325;
  const sebiStamp = turnover * 0.00003;
  const gst = (brokerage + exchangeTx) * 0.18;
  const total = Number((brokerage + stt + exchangeTx + gst + sebiStamp).toFixed(2));
  return {
    brokerage: Number(brokerage.toFixed(2)),
    stt: Number(stt.toFixed(2)),
    exchangeTx: Number(exchangeTx.toFixed(2)),
    gst: Number(gst.toFixed(2)),
    sebiStamp: Number(sebiStamp.toFixed(2)),
    total,
  };
}

export function calculateRiskReward(
  side: 'BUY' | 'SELL',
  entry: number,
  sl: number,
  tp: number
): { ratio: number; label: string; valid: boolean } {
  if (!entry || !sl || !tp || entry <= 0) {
    return { ratio: 0, label: '—', valid: false };
  }
  const risk = side === 'BUY' ? entry - sl : sl - entry;
  const reward = side === 'BUY' ? tp - entry : entry - tp;
  if (risk <= 0 || reward <= 0) {
    return { ratio: 0, label: 'Invalid SL/TP', valid: false };
  }
  const ratio = Number((reward / risk).toFixed(2));
  return { ratio, label: `1 : ${ratio}`, valid: true };
}

export function checkStopLossTakeProfit(
  side: 'BUY' | 'SELL',
  currentPrice: number,
  sl: number | null,
  tp: number | null
): 'SL' | 'TP' | null {
  if (side === 'BUY') {
    if (sl && sl > 0 && currentPrice <= sl) return 'SL';
    if (tp && tp > 0 && currentPrice >= tp) return 'TP';
  } else {
    if (sl && sl > 0 && currentPrice >= sl) return 'SL';
    if (tp && tp > 0 && currentPrice <= tp) return 'TP';
  }
  return null;
}

export function runEmaCrossoverBacktest(
  candles: OHLCV[],
  fastPeriod: number,
  slowPeriod: number,
  initialCapital = 100000
): {
  totalTrades: number;
  winRate: number;
  netPnl: number;
  returnPct: number;
  profitFactor: number;
  maxDrawdownPct: number;
} {
  const slice = candles.slice(-100);
  if (slice.length < slowPeriod + 2 || fastPeriod >= slowPeriod) {
    return { totalTrades: 0, winRate: 0, netPnl: 0, returnPct: 0, profitFactor: 0, maxDrawdownPct: 0 };
  }

  const fastMap = new Map<number, number>();
  const slowMap = new Map<number, number>();
  calculateEMA(slice, fastPeriod).forEach((p) => fastMap.set(p.time, p.value));
  calculateEMA(slice, slowPeriod).forEach((p) => slowMap.set(p.time, p.value));

  let position: { side: 'BUY' | 'SELL'; entry: number } | null = null;
  const pnls: number[] = [];
  let equity = initialCapital;
  let peakEquity = initialCapital;
  let maxDd = 0;

  for (let i = 1; i < slice.length; i++) {
    const prevT = slice[i - 1].time;
    const currT = slice[i].time;
    const fPrev = fastMap.get(prevT);
    const sPrev = slowMap.get(prevT);
    const fCurr = fastMap.get(currT);
    const sCurr = slowMap.get(currT);
    if (fPrev === undefined || sPrev === undefined || fCurr === undefined || sCurr === undefined) continue;

    const price = slice[i].close;
    const qty = Math.max(1, Math.floor((initialCapital * 0.25) / price));

    // Bullish crossover
    if (fPrev <= sPrev && fCurr > sCurr) {
      if (position && position.side === 'SELL') {
        const pnl = (position.entry - price) * qty;
        pnls.push(pnl);
        equity += pnl;
      }
      position = { side: 'BUY', entry: price };
    }
    // Bearish crossover
    else if (fPrev >= sPrev && fCurr < sCurr) {
      if (position && position.side === 'BUY') {
        const pnl = (price - position.entry) * qty;
        pnls.push(pnl);
        equity += pnl;
      }
      position = { side: 'SELL', entry: price };
    }

    if (equity > peakEquity) peakEquity = equity;
    const dd = ((peakEquity - equity) / peakEquity) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  // Close open position on last candle
  if (position && slice.length > 0) {
    const lastPrice = slice[slice.length - 1].close;
    const qty = Math.max(1, Math.floor((initialCapital * 0.25) / position.entry));
    const pnl = position.side === 'BUY' ? (lastPrice - position.entry) * qty : (position.entry - lastPrice) * qty;
    pnls.push(pnl);
    equity += pnl;
  }

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p <= 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  const netPnl = Number(pnls.reduce((a, b) => a + b, 0).toFixed(2));
  const winRate = pnls.length ? Number(((wins.length / pnls.length) * 100).toFixed(1)) : 0;
  const profitFactor = grossLoss > 0 ? Number((grossWin / grossLoss).toFixed(2)) : grossWin > 0 ? 3.5 : 0;

  return {
    totalTrades: pnls.length,
    winRate,
    netPnl,
    returnPct: Number(((netPnl / initialCapital) * 100).toFixed(2)),
    profitFactor,
    maxDrawdownPct: Number(maxDd.toFixed(2)),
  };
}

export type MarketSpeedMode = 'scalping' | 'intraday' | 'swing';

export interface MarketSpeedConfig {
  mode: MarketSpeedMode;
  label: string;
  shortLabel: string;
  intervalMs: number;
  ticksPerCandle: number;
  description: string;
}

export const MARKET_SPEED_MODES: Record<MarketSpeedMode, MarketSpeedConfig> = {
  scalping: {
    mode: 'scalping',
    label: 'Scalping (Fast - 400ms)',
    shortLabel: 'Scalp · 400ms',
    intervalMs: 400,
    ticksPerCandle: 12,
    description: 'Fast tick updates for quick second-by-second trading.',
  },
  intraday: {
    mode: 'intraday',
    label: 'Intraday (Normal - 1200ms)',
    shortLabel: 'Intraday · 1.2s',
    intervalMs: 1200,
    ticksPerCandle: 10,
    description: 'Balanced speed for regular day trading (Default).',
  },
  swing: {
    mode: 'swing',
    label: 'Swing / Positional (Slow - 3000ms)',
    shortLabel: 'Swing · 3.0s',
    intervalMs: 3000,
    ticksPerCandle: 8,
    description: 'Slow, relaxed price updates for longer trades and easy analysis.',
  },
};

export function resolveMarketSpeedConfig(mode?: string): MarketSpeedConfig {
  if (mode && mode in MARKET_SPEED_MODES) {
    return MARKET_SPEED_MODES[mode as MarketSpeedMode];
  }
  return MARKET_SPEED_MODES.intraday;
}

