export interface RoiValue {
  value: number;
  insufficient: boolean;
}

export interface RoiRecord {
  date: string;
  app: string;
  country: string;
  installs: number;
  roi: {
    day0: RoiValue;
    day1: RoiValue;
    day3: RoiValue;
    day7: RoiValue;
    day14: RoiValue;
    day30: RoiValue;
    day60: RoiValue;
    day90: RoiValue;
  };
  isPrediction?: boolean;
}

export interface FiltersResponse {
  success: boolean;
  data: {
    apps: string[];
    countries: string[];
    bidTypes: string[];
  };
}

export interface TrendInfo {
  period: RoiPeriod;
  direction: 'up' | 'down' | 'flat';
  slopePerDay: number;
  recentAvg: number;
}

export interface AnomalyPoint {
  date: string;
  period: RoiPeriod;
  value: number;
  expected: number;
  deviation: number;
}

export interface RoiDataResponse {
  success: boolean;
  data: RoiRecord[];
  prediction: RoiRecord[];
  trend: TrendInfo[];
  anomalies: AnomalyPoint[];
  meta: {
    total: number;
    dateRange: [string, string];
  };
}

export type RoiPeriod = 'day0' | 'day1' | 'day3' | 'day7' | 'day14' | 'day30' | 'day60' | 'day90';

export type DisplayMode = 'raw' | 'moving_avg';
export type ScaleMode = 'linear' | 'log';

export interface ChartDataPoint {
  date: string;
  day0?: number | null;
  day1?: number | null;
  day3?: number | null;
  day7?: number | null;
  day14?: number | null;
  day30?: number | null;
  day60?: number | null;
  day90?: number | null;
  isPrediction?: boolean;
  [key: string]: number | null | undefined | boolean | string;
}

export const ROI_PERIOD_LABELS: Record<RoiPeriod, string> = {
  day0: '当日',
  day1: '1日',
  day3: '3日',
  day7: '7日',
  day14: '14日',
  day30: '30日',
  day60: '60日',
  day90: '90日',
};

export const ROI_PERIOD_COLORS: Record<RoiPeriod, string> = {
  day0: '#8884d8',
  day1: '#82ca9d',
  day3: '#ffc658',
  day7: '#ff7300',
  day14: '#0088fe',
  day30: '#00C49F',
  day60: '#FF6B6B',
  day90: '#A855F7',
};
