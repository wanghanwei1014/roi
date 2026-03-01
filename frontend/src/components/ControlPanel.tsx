"use client";

import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { DisplayMode } from '@/types';

interface ControlPanelProps {
  displayMode: DisplayMode;
  scaleMode: 'linear' | 'log';
  onDisplayModeChange: (mode: DisplayMode) => void;
  onScaleModeChange: (mode: 'linear' | 'log') => void;
}

export default function ControlPanel({
  displayMode,
  scaleMode,
  onDisplayModeChange,
  onScaleModeChange,
}: ControlPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-8">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">数据显示模式：</span>
        <RadioGroup
          value={displayMode}
          onValueChange={(v) => onDisplayModeChange(v as DisplayMode)}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="moving_avg" id="mode-ma" />
            <Label htmlFor="mode-ma" className="cursor-pointer text-sm whitespace-nowrap">显示移动平均值</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="raw" id="mode-raw" />
            <Label htmlFor="mode-raw" className="cursor-pointer text-sm whitespace-nowrap">显示原始数据</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Y轴刻度：</span>
        <RadioGroup
          value={scaleMode}
          onValueChange={(v) => onScaleModeChange(v as 'linear' | 'log')}
          className="flex items-center gap-4"
        >
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="linear" id="scale-linear" />
            <Label htmlFor="scale-linear" className="cursor-pointer text-sm whitespace-nowrap">线性刻度</Label>
          </div>
          <div className="flex items-center gap-1.5">
            <RadioGroupItem value="log" id="scale-log" />
            <Label htmlFor="scale-log" className="cursor-pointer text-sm whitespace-nowrap">对数刻度</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
