"use client";

import React, { useState } from 'react';
import { TrendInfo, AnomalyPoint, ROI_PERIOD_LABELS, ROI_PERIOD_COLORS, RoiPeriod } from '@/types';

interface TrendPanelProps {
  trendData: TrendInfo[];
  anomalyData: AnomalyPoint[];
}

const DIRECTION_CONFIG = {
  up: { icon: '↗', label: '上升趋势', className: 'text-green-600 dark:text-green-400' },
  down: { icon: '↘', label: '下降趋势', className: 'text-red-500 dark:text-red-400' },
  flat: { icon: '→', label: '平稳', className: 'text-gray-500 dark:text-gray-400' },
} as const;

export default function TrendPanel({ trendData, anomalyData }: TrendPanelProps) {
  const [expanded, setExpanded] = useState(false);

  if (trendData.length === 0) return null;

  const anomalyCountByPeriod = anomalyData.reduce<Record<string, number>>((acc, a) => {
    acc[a.period] = (acc[a.period] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 md:p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            趋势分析 & 异常检测
          </span>
          {anomalyData.length > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              {anomalyData.length} 个异常点
            </span>
          )}
          {anomalyData.length === 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
              无异常
            </span>
          )}
          <div className="hidden sm:flex items-center gap-2 ml-2">
            {trendData.filter(t => !t.period.startsWith('day0')).slice(0, 4).map(t => {
              const cfg = DIRECTION_CONFIG[t.direction];
              return (
                <span key={t.period} className={`text-xs ${cfg.className}`}>
                  {ROI_PERIOD_LABELS[t.period as RoiPeriod]} {cfg.icon}
                </span>
              );
            })}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 md:px-6 md:pb-6 space-y-4">
          {/* Trend Grid */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              各周期趋势（近14天）
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {trendData.map(t => {
                const cfg = DIRECTION_CONFIG[t.direction];
                const anomalyCount = anomalyCountByPeriod[t.period] || 0;
                return (
                  <div
                    key={t.period}
                    className="relative rounded-lg border border-gray-100 dark:border-gray-700/50 p-3 bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ color: ROI_PERIOD_COLORS[t.period as RoiPeriod] }}
                      >
                        {ROI_PERIOD_LABELS[t.period as RoiPeriod]}
                      </span>
                      {anomalyCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                          {anomalyCount}异常
                        </span>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 ${cfg.className}`}>
                      <span className="text-lg font-bold">{cfg.icon}</span>
                      <span className="text-sm font-medium">{cfg.label}</span>
                    </div>
                    <div className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                      <div>日均变化: <span className="font-medium">{t.slopePerDay > 0 ? '+' : ''}{t.slopePerDay}%</span></div>
                      <div>近期均值: <span className="font-medium">{t.recentAvg}%</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Anomaly Details */}
          {anomalyData.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                异常数据点明细
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">日期</th>
                      <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">周期</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">实际值</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">预期值</th>
                      <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">偏离</th>
                    </tr>
                  </thead>
                  <tbody>
                    {anomalyData.slice(0, 20).map((a, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="py-1.5 px-3 text-gray-700 dark:text-gray-300">{a.date}</td>
                        <td className="py-1.5 px-3">
                          <span style={{ color: ROI_PERIOD_COLORS[a.period as RoiPeriod] }} className="font-medium">
                            {ROI_PERIOD_LABELS[a.period as RoiPeriod]}
                          </span>
                        </td>
                        <td className="py-1.5 px-3 text-right font-mono text-gray-700 dark:text-gray-300">{a.value}%</td>
                        <td className="py-1.5 px-3 text-right font-mono text-gray-500 dark:text-gray-400">{a.expected}%</td>
                        <td className={`py-1.5 px-3 text-right font-mono font-medium ${a.deviation > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                          {a.deviation > 0 ? '+' : ''}{a.deviation}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {anomalyData.length > 20 && (
                  <p className="text-xs text-gray-400 mt-2 px-3">
                    仅显示前20条，共 {anomalyData.length} 个异常点
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
