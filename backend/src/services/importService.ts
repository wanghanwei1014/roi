import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import pool from '../config/database';
import { parseDateColumn, parseRoiValue, isInsufficient } from '../utils/dateUtils';

interface CsvRow {
  [key: string]: string;
}

interface ParsedRow {
  date: string;
  dayOfWeek: string;
  app: string;
  bidType: string;
  country: string;
  installs: number;
  roiDay0: number;
  roiDay1: number;
  roiDay3: number;
  roiDay7: number;
  roiDay14: number;
  roiDay30: number;
  roiDay60: number;
  roiDay90: number;
  insufficientDay0: number;
  insufficientDay1: number;
  insufficientDay3: number;
  insufficientDay7: number;
  insufficientDay14: number;
  insufficientDay30: number;
  insufficientDay60: number;
  insufficientDay90: number;
}

function getCol(row: CsvRow, key: string): string {
  if (row[key] !== undefined) return row[key];
  const stripped = key.replace(/^\uFEFF/, '');
  if (row[stripped] !== undefined) return row[stripped];
  const bomKey = '\uFEFF' + key;
  if (row[bomKey] !== undefined) return row[bomKey];
  for (const k of Object.keys(row)) {
    if (k.replace(/^\uFEFF/, '') === stripped) return row[k];
  }
  return '';
}

function parseRow(row: CsvRow): ParsedRow {
  const dateCol = getCol(row, '日期');
  const { date, dayOfWeek } = parseDateColumn(dateCol);

  const roiDay0 = parseRoiValue(getCol(row, '当日ROI'));
  const roiDay1 = parseRoiValue(getCol(row, '1日ROI'));
  const roiDay3 = parseRoiValue(getCol(row, '3日ROI'));
  const roiDay7 = parseRoiValue(getCol(row, '7日ROI'));
  const roiDay14 = parseRoiValue(getCol(row, '14日ROI'));
  const roiDay30 = parseRoiValue(getCol(row, '30日ROI'));
  const roiDay60 = parseRoiValue(getCol(row, '60日ROI'));
  const roiDay90 = parseRoiValue(getCol(row, '90日ROI'));

  return {
    date,
    dayOfWeek,
    app: getCol(row, 'app'),
    bidType: getCol(row, '出价类型') || 'CPI',
    country: getCol(row, '国家地区'),
    installs: parseInt(getCol(row, '应用安装.总次数') || '0', 10) || 0,
    roiDay0,
    roiDay1,
    roiDay3,
    roiDay7,
    roiDay14,
    roiDay30,
    roiDay60,
    roiDay90,
    insufficientDay0: isInsufficient(date, 'day0') ? 1 : 0,
    insufficientDay1: isInsufficient(date, 'day1') ? 1 : 0,
    insufficientDay3: isInsufficient(date, 'day3') ? 1 : 0,
    insufficientDay7: isInsufficient(date, 'day7') ? 1 : 0,
    insufficientDay14: isInsufficient(date, 'day14') ? 1 : 0,
    insufficientDay30: isInsufficient(date, 'day30') ? 1 : 0,
    insufficientDay60: isInsufficient(date, 'day60') ? 1 : 0,
    insufficientDay90: isInsufficient(date, 'day90') ? 1 : 0,
  };
}

export async function importCsvFile(filePath: string): Promise<{ imported: number }> {
  const absolutePath = path.isAbsolute(filePath) ? filePath : path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`CSV file not found: ${absolutePath}`);
  }

  const rows: ParsedRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(absolutePath, { encoding: 'utf-8' })
      .pipe(csv())
      .on('data', (row: CsvRow) => {
        try {
          rows.push(parseRow(row));
        } catch (err) {
          console.error('Error parsing row:', row, err);
        }
      })
      .on('end', resolve)
      .on('error', reject);
  });

  if (rows.length === 0) {
    return { imported: 0 };
  }

  const conn = await pool.getConnection();
  try {
    await conn.query('TRUNCATE TABLE roi_data');

    const BATCH_SIZE = 100;
    let imported = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const placeholders = batch.map(() => '(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').join(',');
      const values = batch.flatMap(r => [
        r.date, r.dayOfWeek, r.app, r.bidType, r.country, r.installs,
        r.roiDay0, r.roiDay1, r.roiDay3, r.roiDay7, r.roiDay14, r.roiDay30, r.roiDay60, r.roiDay90,
        r.insufficientDay0, r.insufficientDay1, r.insufficientDay3, r.insufficientDay7,
        r.insufficientDay14, r.insufficientDay30, r.insufficientDay60, r.insufficientDay90,
      ]);

      await conn.query(
        `INSERT INTO roi_data (date, day_of_week, app, bid_type, country, installs,
          roi_day0, roi_day1, roi_day3, roi_day7, roi_day14, roi_day30, roi_day60, roi_day90,
          insufficient_day0, insufficient_day1, insufficient_day3, insufficient_day7,
          insufficient_day14, insufficient_day30, insufficient_day60, insufficient_day90)
        VALUES ${placeholders}`,
        values
      );
      imported += batch.length;
    }

    return { imported };
  } finally {
    conn.release();
  }
}
