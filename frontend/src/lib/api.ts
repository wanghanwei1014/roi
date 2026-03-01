import { FiltersResponse, RoiDataResponse, DisplayMode } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export async function fetchFilters(): Promise<FiltersResponse> {
  const res = await fetch(`${API_BASE}/filters`);
  if (!res.ok) throw new Error('Failed to fetch filters');
  return res.json();
}

export async function fetchRoiData(params: {
  app: string;
  country?: string;
  bidType?: string;
  startDate?: string;
  endDate?: string;
  mode?: DisplayMode;
  window?: number;
}): Promise<RoiDataResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('app', params.app);
  if (params.country) searchParams.set('country', params.country);
  if (params.bidType) searchParams.set('bidType', params.bidType);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.mode) searchParams.set('mode', params.mode);
  if (params.window) searchParams.set('window', params.window.toString());

  const res = await fetch(`${API_BASE}/roi-data?${searchParams.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch ROI data');
  return res.json();
}

export async function importCsv(): Promise<{ success: boolean; imported: number }> {
  const res = await fetch(`${API_BASE}/import`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to import CSV');
  return res.json();
}
