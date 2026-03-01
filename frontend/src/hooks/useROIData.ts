"use client";

import { useState, useEffect, useCallback } from 'react';
import { fetchFilters, fetchRoiData } from '@/lib/api';
import { RoiRecord, DisplayMode, ChartDataPoint, RoiPeriod, TrendInfo, AnomalyPoint } from '@/types';

interface Filters {
  apps: string[];
  countries: string[];
  bidTypes: string[];
}

interface UseROIDataReturn {
  filters: Filters;
  selectedApp: string;
  selectedCountry: string;
  selectedBidType: string;
  displayMode: DisplayMode;
  scaleMode: 'linear' | 'log';
  data: ChartDataPoint[];
  predictionData: ChartDataPoint[];
  trendData: TrendInfo[];
  anomalyData: AnomalyPoint[];
  loading: boolean;
  error: string | null;
  dateRange: [string, string];
  setSelectedApp: (app: string) => void;
  setSelectedCountry: (country: string) => void;
  setSelectedBidType: (bidType: string) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setScaleMode: (mode: 'linear' | 'log') => void;
}

const ROI_KEYS: RoiPeriod[] = ['day0', 'day1', 'day3', 'day7', 'day14', 'day30', 'day60', 'day90'];

function toChartPoint(record: RoiRecord): ChartDataPoint {
  const point: ChartDataPoint = {
    date: record.date,
    isPrediction: record.isPrediction || false,
  };

  for (const key of ROI_KEYS) {
    const roi = record.roi[key];
    if (roi.insufficient && roi.value === 0) {
      point[key] = null;
    } else {
      point[key] = roi.value;
    }
  }

  return point;
}

export function useROIData(): UseROIDataReturn {
  const [filters, setFilters] = useState<Filters>({ apps: [], countries: [], bidTypes: [] });
  const [selectedApp, setSelectedApp] = useState<string>('');
  const [selectedCountry, setSelectedCountry] = useState<string>('');
  const [selectedBidType, setSelectedBidType] = useState<string>('');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('moving_avg');
  const [scaleMode, setScaleMode] = useState<'linear' | 'log'>('linear');
  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [predictionData, setPredictionData] = useState<ChartDataPoint[]>([]);
  const [trendData, setTrendData] = useState<TrendInfo[]>([]);
  const [anomalyData, setAnomalyData] = useState<AnomalyPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[string, string]>(['', '']);

  useEffect(() => {
    fetchFilters()
      .then(res => {
        setFilters(res.data);
        if (res.data.apps.length > 0) {
          setSelectedApp(prev => prev || res.data.apps[0]);
        }
      })
      .catch(err => setError(err.message));
  }, []);

  const loadData = useCallback(async () => {
    if (!selectedApp) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchRoiData({
        app: selectedApp,
        country: selectedCountry || undefined,
        bidType: selectedBidType || undefined,
        mode: displayMode,
        window: 7,
      });

      const anomalies: AnomalyPoint[] = result.anomalies || [];
      const anomalySet = new Set(anomalies.map(a => `${a.date}_${a.period}`));

      const chartPoints = result.data.map(record => {
        const point = toChartPoint(record);
        for (const key of ROI_KEYS) {
          if (anomalySet.has(`${record.date}_${key}`)) {
            point[`${key}_anomaly`] = true;
          }
        }
        return point;
      });

      setData(chartPoints);
      setPredictionData(result.prediction.map(toChartPoint));
      setTrendData(result.trend || []);
      setAnomalyData(anomalies);
      setDateRange(result.meta.dateRange);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [selectedApp, selectedCountry, selectedBidType, displayMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
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
  };
}
