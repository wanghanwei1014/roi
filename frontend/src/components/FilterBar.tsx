"use client";

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FilterBarProps {
  apps: string[];
  countries: string[];
  bidTypes: string[];
  selectedApp: string;
  selectedCountry: string;
  selectedBidType: string;
  onAppChange: (app: string) => void;
  onCountryChange: (country: string) => void;
  onBidTypeChange: (bidType: string) => void;
}

export default function FilterBar({
  apps,
  countries,
  bidTypes,
  selectedApp,
  selectedCountry,
  selectedBidType,
  onAppChange,
  onCountryChange,
  onBidTypeChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex flex-col gap-1 min-w-[160px]">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">用户安装渠道</label>
        <Select value="Apple" disabled>
          <SelectTrigger>
            <SelectValue placeholder="选择渠道" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">出价类型</label>
        <Select value={selectedBidType || 'all'} onValueChange={(v) => onBidTypeChange(v === 'all' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="选择出价类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {bidTypes.map(bt => (
              <SelectItem key={bt} value={bt}>{bt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">国家地区</label>
        <Select value={selectedCountry || 'all'} onValueChange={(v) => onCountryChange(v === 'all' ? '' : v)}>
          <SelectTrigger>
            <SelectValue placeholder="选择国家" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            {countries.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs font-medium text-gray-500 dark:text-gray-400">APP</label>
        <Select value={selectedApp} onValueChange={onAppChange}>
          <SelectTrigger>
            <SelectValue placeholder="选择APP" />
          </SelectTrigger>
          <SelectContent>
            {apps.map(a => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
