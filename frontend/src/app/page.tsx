"use client";

import React from 'react';
import FilterBar from '@/components/FilterBar';
import ControlPanel from '@/components/ControlPanel';
import ROIChart from '@/components/ROIChart';
import TrendPanel from '@/components/TrendPanel';
import ThemeToggle from '@/components/ThemeToggle';
import { useROIData } from '@/hooks/useROIData';

export default function Home() {
  const {
    filters,
    selectedApp,
    selectedCountry,
    selectedBidType,
    displayMode,
    scaleMode,
    data,
    predictionData,
    trendData,
    anomalyData,
    loading,
    error,
    dateRange,
    setSelectedApp,
    setSelectedCountry,
    setSelectedBidType,
    setDisplayMode,
    setScaleMode,
  } = useROIData();

  const appNumber = selectedApp ? selectedApp.replace('App-', '') : 'X';
  const subtitle = displayMode === 'moving_avg' ? '(7日移动平均)' : '(原始数据)';

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              App-{appNumber}-多时间维度ROI趋势
            </h1>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                数据范围:最近90天
              </span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6">
          <FilterBar
            apps={filters.apps}
            countries={filters.countries}
            bidTypes={filters.bidTypes}
            selectedApp={selectedApp}
            selectedCountry={selectedCountry}
            selectedBidType={selectedBidType}
            onAppChange={setSelectedApp}
            onCountryChange={setSelectedCountry}
            onBidTypeChange={setSelectedBidType}
          />
        </div>

        {/* Control Panel */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6">
          <ControlPanel
            displayMode={displayMode}
            scaleMode={scaleMode}
            onDisplayModeChange={setDisplayMode}
            onScaleModeChange={setScaleMode}
          />
        </div>

        {/* Trend & Anomaly Panel */}
        {!loading && !error && data.length > 0 && (
          <TrendPanel trendData={trendData} anomalyData={anomalyData} />
        )}

        {/* Chart */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 md:p-6">
          {loading && (
            <div className="flex items-center justify-center h-[520px]">
              <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>加载数据中...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-[520px]">
              <div className="text-center">
                <p className="text-red-500 mb-2">加载失败: {error}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">请确保后端服务已启动并导入数据</p>
              </div>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="flex items-center justify-center h-[520px]">
              <div className="text-center">
                <p className="text-gray-500 dark:text-gray-400 mb-2">暂无数据</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">请先导入CSV数据或调整筛选条件</p>
              </div>
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <ROIChart
              data={data}
              predictionData={predictionData}
              anomalyData={anomalyData}
              scaleMode={scaleMode}
              displayMode={displayMode}
            />
          )}
        </div>
      </div>
    </main>
  );
}
