// utils/dateUtils.ts - 日付変換ユーティリティ
import { EraType } from '../types/Employee';

// 元号開始年（西暦）
const eraStartYears: Record<EraType, number> = {
  '令和': 2019,
  '平成': 1989,
  '昭和': 1926,
  '大正': 1912,
  '明治': 1868
};

/**
 * 西暦から和暦に変換する
 * @param year 西暦年
 * @param month 月
 * @param day 日
 * @returns { era: 元号, year: 和暦年, month: 月, day: 日 }
 */
export const convertToWareki = (year: number, month: number, day: number): { era: EraType; year: number; month: number; day: number } => {
  let era: EraType = '令和';
  let warekiYear = 0;

  if (year >= 2019) {
    era = '令和';
    warekiYear = year - 2019 + 1;
  } else if (year >= 1989) {
    era = '平成';
    warekiYear = year - 1989 + 1;
  } else if (year >= 1926) {
    era = '昭和';
    warekiYear = year - 1926 + 1;
  } else if (year >= 1912) {
    era = '大正';
    warekiYear = year - 1912 + 1;
  } else if (year >= 1868) {
    era = '明治';
    warekiYear = year - 1868 + 1;
  }

  return { era, year: warekiYear, month, day };
};

/**
 * 和暦から西暦に変換する
 * @param era 元号
 * @param year 和暦年
 * @param month 月
 * @param day 日
 * @returns { year: 西暦年, month: 月, day: 日 }
 */
export const convertToGregorian = (era: EraType, year: number, month: number, day: number): { year: number; month: number; day: number } => {
  const startYear = eraStartYears[era] || 0;
  const gregorianYear = startYear + year - 1;
  
  return { year: gregorianYear, month, day };
};

/**
 * 日付文字列を和暦形式に変換する
 * @param dateStr 日付文字列 (YYYY-MM-DD)
 * @returns 和暦形式の文字列 (例: 令和3年4月1日)
 */
export const formatToWareki = (dateStr: string): string => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  const wareki = convertToWareki(year, month, day);
  return `${wareki.era}${wareki.year}年${wareki.month}月${wareki.day}日`;
};

/**
 * 元号と和暦年から西暦年を取得
 * @param era 元号
 * @param year 和暦年（文字列）
 * @returns 西暦年（数値）
 */
export const getGregorianYear = (era: EraType, year: string): number => {
  const warekiYear = parseInt(year, 10);
  const startYear = eraStartYears[era] || 0;
  return startYear + warekiYear - 1;
};

/**
 * 元号、和暦年、月、日からDate型に変換
 * @param era 元号
 * @param year 和暦年（文字列）
 * @param month 月（文字列）
 * @param day 日（文字列）
 * @returns Date型のオブジェクト
 */
export const getDateFromWareki = (era: EraType, year: string, month: string, day: string): Date => {
  const gregorianYear = getGregorianYear(era, year);
  const monthNum = parseInt(month, 10);
  const dayNum = parseInt(day, 10);
  
  return new Date(gregorianYear, monthNum - 1, dayNum);
};