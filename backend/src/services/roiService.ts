import pool from '../config/database';
import { RowDataPacket } from 'mysql2';

interface RoiRecord {
  date: string;
  app: string;
  country: string;
  installs: number;
  roi: {
    day0: { value: number; insufficient: boolean };
    day1: { value: number; insufficient: boolean };
    day3: { value: number; insufficient: boolean };
    day7: { value: number; insufficient: boolean };
    day14: { value: number; insufficient: boolean };
    day30: { value: number; insufficient: boolean };
    day60: { value: number; insufficient: boolean };
    day90: { value: number; insufficient: boolean };
  };
  isPrediction?: boolean;
}

interface TrendInfo {
  period: string;
  direction: 'up' | 'down' | 'flat';
  slopePerDay: number;
  recentAvg: number;
}

interface AnomalyPoint {
  date: string;
  period: string;
  value: number;
  expected: number;
  deviation: number;
}

interface QueryParams {
  app: string;
  country?: string;
  bidType?: string;
  startDate?: string;
  endDate?: string;
  mode?: 'raw' | 'moving_avg';
  window?: number;
}

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toISOString().split('T')[0];
}

function mapRow(row: RowDataPacket): RoiRecord {
  return {
    date: formatDate(row.date),
    app: row.app,
    country: row.country,
    installs: row.installs,
    roi: {
      day0: { value: parseFloat(row.roi_day0), insufficient: !!row.insufficient_day0 },
      day1: { value: parseFloat(row.roi_day1), insufficient: !!row.insufficient_day1 },
      day3: { value: parseFloat(row.roi_day3), insufficient: !!row.insufficient_day3 },
      day7: { value: parseFloat(row.roi_day7), insufficient: !!row.insufficient_day7 },
      day14: { value: parseFloat(row.roi_day14), insufficient: !!row.insufficient_day14 },
      day30: { value: parseFloat(row.roi_day30), insufficient: !!row.insufficient_day30 },
      day60: { value: parseFloat(row.roi_day60), insufficient: !!row.insufficient_day60 },
      day90: { value: parseFloat(row.roi_day90), insufficient: !!row.insufficient_day90 },
    },
  };
}

export async function getRoiData(params: QueryParams): Promise<{
  data: RoiRecord[];
  prediction: RoiRecord[];
  trend: TrendInfo[];
  anomalies: AnomalyPoint[];
  meta: { total: number; dateRange: [string, string] };
}> {
  const conditions: string[] = ['app = ?'];
  const values: (string | number)[] = [params.app];

  if (params.country) {
    conditions.push('country = ?');
    values.push(params.country);
  }
  if (params.bidType) {
    conditions.push('bid_type = ?');
    values.push(params.bidType);
  }
  if (params.startDate) {
    conditions.push('date >= ?');
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push('date <= ?');
    values.push(params.endDate);
  }

  const whereClause = conditions.join(' AND ');

  const needsAggregation = !params.country;

  let data: RoiRecord[];

  if (needsAggregation) {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
        date,
        app,
        '全部' AS country,
        SUM(installs) AS installs,
        AVG(roi_day0) AS roi_day0,
        AVG(roi_day1) AS roi_day1,
        AVG(roi_day3) AS roi_day3,
        AVG(roi_day7) AS roi_day7,
        AVG(roi_day14) AS roi_day14,
        AVG(roi_day30) AS roi_day30,
        AVG(roi_day60) AS roi_day60,
        AVG(roi_day90) AS roi_day90,
        MAX(insufficient_day0) AS insufficient_day0,
        MAX(insufficient_day1) AS insufficient_day1,
        MAX(insufficient_day3) AS insufficient_day3,
        MAX(insufficient_day7) AS insufficient_day7,
        MAX(insufficient_day14) AS insufficient_day14,
        MAX(insufficient_day30) AS insufficient_day30,
        MAX(insufficient_day60) AS insufficient_day60,
        MAX(insufficient_day90) AS insufficient_day90
      FROM roi_data
      WHERE ${whereClause}
      GROUP BY date, app
      ORDER BY date ASC`,
      values
    );
    data = rows.map(mapRow);
  } else {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT * FROM roi_data WHERE ${whereClause} ORDER BY date ASC`,
      values
    );
    data = rows.map(mapRow);
  }

  if (params.mode === 'moving_avg') {
    data = computeMovingAverage(data, params.window || 7);
  }

  const prediction = computePrediction(data);
  const trend = computeTrendAnalysis(data);
  const anomalies = computeAnomalies(data);

  const dates = data.map(d => d.date);
  const dateRange: [string, string] = dates.length > 0
    ? [dates[0], dates[dates.length - 1]]
    : ['', ''];

  return {
    data,
    prediction,
    trend,
    anomalies,
    meta: { total: data.length, dateRange },
  };
}

function computeMovingAverage(data: RoiRecord[], windowSize: number): RoiRecord[] {
  const roiKeys = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const;
  const halfWindow = Math.floor(windowSize / 2);

  return data.map((record, idx) => {
    const newRoi = { ...record.roi };

    for (const key of roiKeys) {
      const windowValues: number[] = [];
      for (let j = Math.max(0, idx - halfWindow); j <= Math.min(data.length - 1, idx + halfWindow); j++) {
        const item = data[j].roi[key];
        if (!item.insufficient) {
          windowValues.push(item.value);
        }
      }

      if (windowValues.length > 0) {
        const avg = windowValues.reduce((sum, v) => sum + v, 0) / windowValues.length;
        newRoi[key] = { value: parseFloat(avg.toFixed(2)), insufficient: record.roi[key].insufficient };
      }
    }

    return { ...record, roi: newRoi };
  });
}

function fitQuadCoeffs(values: number[]): { c0: number; c1: number; c2: number } {
  const n = values.length;
  const x = values.map((_, i) => i);
  const y = values;

  if (n < 3) {
    const lr = linearRegression(x, y);
    return { c0: lr.intercept, c1: lr.slope, c2: 0 };
  }

  let sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
  for (let i = 0; i < n; i++) {
    const xi = x[i], yi = y[i], xi2 = xi * xi;
    sx += xi; sx2 += xi2; sx3 += xi2 * xi; sx4 += xi2 * xi2;
    sy += yi; sxy += xi * yi; sx2y += xi2 * yi;
  }

  const mat = [
    [n, sx, sx2, sy],
    [sx, sx2, sx3, sxy],
    [sx2, sx3, sx4, sx2y],
  ];

  for (let col = 0; col < 3; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < 3; row++) {
      if (Math.abs(mat[row][col]) > Math.abs(mat[pivotRow][col])) pivotRow = row;
    }
    [mat[col], mat[pivotRow]] = [mat[pivotRow], mat[col]];
    if (Math.abs(mat[col][col]) < 1e-12) {
      const lr = linearRegression(x, y);
      return { c0: lr.intercept, c1: lr.slope, c2: 0 };
    }
    for (let row = col + 1; row < 3; row++) {
      const factor = mat[row][col] / mat[col][col];
      for (let j = col; j < 4; j++) mat[row][j] -= factor * mat[col][j];
    }
  }

  const c2 = mat[2][3] / mat[2][2];
  const c1 = (mat[1][3] - mat[1][2] * c2) / mat[1][1];
  const c0 = (mat[0][3] - mat[0][1] * c1 - mat[0][2] * c2) / mat[0][0];
  return { c0, c1, c2 };
}

function computePrediction(data: RoiRecord[]): RoiRecord[] {
  const roiKeys = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const;

  if (data.length < 7) return [];

  const lastDate = new Date(data[data.length - 1].date);
  const futureHorizon = 7;
  const trainingWindow = 21;
  const curvatureDecay = 0.06;

  const predDateMap: Map<string, Record<string, { value: number; insufficient: boolean } | null>> = new Map();

  for (const key of roiKeys) {
    let lastValidIdx = -1;
    for (let i = data.length - 1; i >= 0; i--) {
      if (!data[i].roi[key].insufficient) {
        lastValidIdx = i;
        break;
      }
    }

    if (lastValidIdx < 4) continue;

    const valid: number[] = [];
    for (let i = 0; i <= lastValidIdx; i++) {
      if (!data[i].roi[key].insufficient) {
        valid.push(data[i].roi[key].value);
      }
    }

    const recent = valid.slice(-trainingWindow);
    if (recent.length < 5) continue;

    const n = recent.length;
    const { c1, c2 } = fitQuadCoeffs(recent);

    const anchor = recent[n - 1];
    const slope = c1 + 2 * c2 * (n - 1);
    const curvature = 2 * c2;

    const gapStart = lastValidIdx + 1;
    const totalSteps = (data.length - 1 - lastValidIdx) + futureHorizon;

    for (let h = 1; h <= totalSteps; h++) {
      const dateIdx = gapStart + h - 1;
      let predDateStr: string;

      if (dateIdx < data.length) {
        predDateStr = data[dateIdx].date;
      } else {
        const d = new Date(lastDate);
        d.setDate(d.getDate() + (dateIdx - data.length + 1));
        predDateStr = formatDate(d);
      }

      const curveWeight = Math.exp(-curvatureDecay * h);
      const predicted = Math.max(
        0,
        anchor + slope * h + 0.5 * curvature * h * h * curveWeight
      );

      if (!predDateMap.has(predDateStr)) {
        const empty: Record<string, null> = {};
        for (const k of roiKeys) empty[k] = null;
        predDateMap.set(predDateStr, empty);
      }
      predDateMap.get(predDateStr)![key] = { value: parseFloat(predicted.toFixed(2)), insufficient: false };
    }
  }

  const predictions: RoiRecord[] = [];
  const sortedDates = Array.from(predDateMap.keys()).sort();

  for (const dateStr of sortedDates) {
    const keyValues = predDateMap.get(dateStr)!;
    const roi: any = {};
    for (const key of roiKeys) {
      roi[key] = keyValues[key] || { value: 0, insufficient: true };
    }

    predictions.push({
      date: dateStr,
      app: data[0].app,
      country: data[0].country,
      installs: 0,
      roi,
      isPrediction: true,
    });
  }

  return predictions;
}

function computeTrendAnalysis(data: RoiRecord[]): TrendInfo[] {
  const roiKeys = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const;
  const trends: TrendInfo[] = [];

  for (const key of roiKeys) {
    const valid = data.filter(d => !d.roi[key].insufficient);
    const recent = valid.slice(-14);

    if (recent.length < 3) {
      trends.push({ period: key, direction: 'flat', slopePerDay: 0, recentAvg: 0 });
      continue;
    }

    const x = recent.map((_, i) => i);
    const y = recent.map(d => d.roi[key].value);
    const lr = linearRegression(x, y);
    const avg = y.reduce((s, v) => s + v, 0) / y.length;

    const threshold = Math.max(0.1, avg * 0.005);
    let direction: 'up' | 'down' | 'flat';
    if (lr.slope > threshold) direction = 'up';
    else if (lr.slope < -threshold) direction = 'down';
    else direction = 'flat';

    trends.push({
      period: key,
      direction,
      slopePerDay: parseFloat(lr.slope.toFixed(4)),
      recentAvg: parseFloat(avg.toFixed(2)),
    });
  }

  return trends;
}

function computeAnomalies(data: RoiRecord[]): AnomalyPoint[] {
  const roiKeys = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'] as const;
  const anomalies: AnomalyPoint[] = [];
  const halfWindow = 7;

  for (const key of roiKeys) {
    const validData = data.filter(d => !d.roi[key].insufficient);
    if (validData.length < 5) continue;

    for (let i = 0; i < validData.length; i++) {
      const value = validData[i].roi[key].value;

      const windowValues: number[] = [];
      for (let j = Math.max(0, i - halfWindow); j <= Math.min(validData.length - 1, i + halfWindow); j++) {
        if (j !== i) windowValues.push(validData[j].roi[key].value);
      }

      if (windowValues.length < 3) continue;

      const mean = windowValues.reduce((s, v) => s + v, 0) / windowValues.length;
      const variance = windowValues.reduce((s, v) => s + (v - mean) ** 2, 0) / windowValues.length;
      const std = Math.sqrt(variance);

      if (std < 0.01) continue;

      const zScore = Math.abs(value - mean) / std;

      if (zScore > 2.5) {
        const deviation = mean !== 0 ? (value - mean) / mean * 100 : 0;
        anomalies.push({
          date: validData[i].date,
          period: key,
          value: parseFloat(value.toFixed(2)),
          expected: parseFloat(mean.toFixed(2)),
          deviation: parseFloat(deviation.toFixed(1)),
        });
      }
    }
  }

  return anomalies;
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumXX = x.reduce((a, xi) => a + xi * xi, 0);

  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export async function getFilters(): Promise<{
  apps: string[];
  countries: string[];
  bidTypes: string[];
}> {
  const [apps] = await pool.query<RowDataPacket[]>('SELECT DISTINCT app FROM roi_data ORDER BY app');
  const [countries] = await pool.query<RowDataPacket[]>('SELECT DISTINCT country FROM roi_data ORDER BY country');
  const [bidTypes] = await pool.query<RowDataPacket[]>('SELECT DISTINCT bid_type FROM roi_data ORDER BY bid_type');

  return {
    apps: apps.map(r => r.app),
    countries: countries.map(r => r.country),
    bidTypes: bidTypes.map(r => r.bid_type),
  };
}
