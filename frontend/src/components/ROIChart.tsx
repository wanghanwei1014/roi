"use client";

import React, { useState, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint, ROI_PERIOD_LABELS, ROI_PERIOD_COLORS, RoiPeriod, AnomalyPoint } from '@/types';

interface ROIChartProps {
  data: ChartDataPoint[];
  predictionData: ChartDataPoint[];
  anomalyData: AnomalyPoint[];
  scaleMode: 'linear' | 'log';
  displayMode: string;
}

const ROI_KEYS: RoiPeriod[] = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: ChartDataPoint;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const isPrediction = payload[0]?.payload?.isPrediction;
  const dataPoint = payload[0]?.payload;

  const anomalyKeys = dataPoint
    ? ROI_KEYS.filter(k => dataPoint[`${k}_anomaly`])
    : [];

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 max-w-xs">
      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2">
        {label} {isPrediction && <span className="text-orange-500 text-xs">(预测)</span>}
      </p>
      <div className="space-y-1">
        {payload
          .filter(p => p.value !== null && p.value !== undefined)
          .map((p, i) => {
            const periodKey = ROI_KEYS.find(k => p.name?.includes(ROI_PERIOD_LABELS[k]));
            const isAnomaly = periodKey && anomalyKeys.includes(periodKey);
            return (
              <div key={i} className="flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                  <span className="text-gray-600 dark:text-gray-400">{p.name}</span>
                  {isAnomaly && <span className="text-amber-500 text-[10px] font-semibold">异常</span>}
                </div>
                <span className="font-medium text-gray-900 dark:text-gray-100">{p.value.toFixed(2)}%</span>
              </div>
            );
          })}
      </div>
    </div>
  );
}

function makeAnomalyDot(periodKey: string) {
  return function AnomalyDot(props: Record<string, unknown>) {
    const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartDataPoint };
    if (!payload || !payload[`${periodKey}_anomaly`]) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="none" stroke="#f59e0b" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={2.5} fill="#f59e0b" />
      </g>
    );
  };
}

export default function ROIChart({ data, predictionData, anomalyData, scaleMode, displayMode }: ROIChartProps) {
  const [hiddenLines, setHiddenLines] = useState<Set<string>>(new Set());

  const handleLegendClick = useCallback((dataKey: string) => {
    setHiddenLines(prev => {
      const next = new Set(prev);
      if (next.has(dataKey)) {
        next.delete(dataKey);
      } else {
        next.add(dataKey);
      }
      return next;
    });
  }, []);

  const { chartData, hasPrediction } = useMemo(() => {
    const combined: ChartDataPoint[] = data.map(d => ({ ...d }));

    if (predictionData.length > 0 && data.length > 0) {
      const predByDate = new Map<string, ChartDataPoint>();
      for (const pred of predictionData) {
        predByDate.set(pred.date, pred);
      }

      for (const key of ROI_KEYS) {
        for (let i = combined.length - 1; i >= 0; i--) {
          if (combined[i][key] !== null && combined[i][key] !== undefined) {
            combined[i][`${key}_pred`] = combined[i][key];
            break;
          }
        }
      }

      for (let i = 0; i < combined.length; i++) {
        const pred = predByDate.get(combined[i].date);
        if (!pred) continue;
        for (const key of ROI_KEYS) {
          if ((combined[i][key] === null || combined[i][key] === undefined) && pred[key] !== null && pred[key] !== undefined) {
            combined[i][`${key}_pred`] = pred[key];
          }
        }
        predByDate.delete(combined[i].date);
      }

      const remainingDates = Array.from(predByDate.keys()).sort();
      for (const date of remainingDates) {
        const pred = predByDate.get(date)!;
        const point: ChartDataPoint = { date, isPrediction: true };
        for (const key of ROI_KEYS) {
          point[key] = null;
          point[`${key}_pred`] = pred[key];
        }
        combined.push(point);
      }
    }

    return { chartData: combined, hasPrediction: predictionData.length > 0 };
  }, [data, predictionData]);

  const suffix = displayMode === 'moving_avg' ? '(7日均值)' : '';

  const formatYAxis = (value: number) => `${value}%`;
  const formatXAxis = (value: string) => {
    if (!value) return '';
    const parts = value.split('-');
    return `${parts[1]}/${parts[2]}`;
  };

  const yDomain = useMemo((): [number | string, number | string] => {
    if (scaleMode === 'log') {
      return [0.1, 'auto'];
    }
    return [0, 'auto'];
  }, [scaleMode]);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={520}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            tickFormatter={formatYAxis}
            tick={{ fontSize: 11 }}
            scale={scaleMode}
            domain={yDomain}
            allowDataOverflow
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={() => (
              <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '12px 20px', paddingTop: '10px', cursor: 'pointer' }}>
                {ROI_KEYS.map(key => {
                  const isHidden = hiddenLines.has(key);
                  return (
                    <span
                      key={key}
                      onClick={() => handleLegendClick(key)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                    >
                      <svg width="14" height="3"><line x1="0" y1="1.5" x2="14" y2="1.5" stroke={isHidden ? '#ccc' : ROI_PERIOD_COLORS[key]} strokeWidth="2" /></svg>
                      <span style={{ color: isHidden ? '#ccc' : undefined, textDecoration: isHidden ? 'line-through' : 'none' }}>
                        {ROI_PERIOD_LABELS[key]}{suffix}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          />

          <ReferenceLine
            y={100}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray=""
            label={{
              value: "100%回本线",
              position: "right",
              fill: "#ef4444",
              fontSize: 12,
              fontWeight: 600,
            }}
          />

          {ROI_KEYS.map(key => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              name={`${ROI_PERIOD_LABELS[key]}${suffix}`}
              stroke={ROI_PERIOD_COLORS[key]}
              strokeWidth={2}
              dot={anomalyData.length > 0 ? makeAnomalyDot(key) : false}
              activeDot={{ r: 4 }}
              connectNulls={false}
              hide={hiddenLines.has(key)}
            />
          ))}

          {hasPrediction && ROI_KEYS.map(key => (
            <Line
              key={`pred-${key}`}
              type="monotone"
              dataKey={`${key}_pred`}
              name={`${ROI_PERIOD_LABELS[key]}${suffix}(预测)`}
              stroke={ROI_PERIOD_COLORS[key]}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              connectNulls
              hide={hiddenLines.has(key)}
              legendType="none"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
