/**
 * Helper functions cho Talent-related operations
 */

import { TalentLevel } from '../services/JobRoleLevel';

/**
 * Format URL để hiển thị ngắn gọn
 */
export const formatLinkDisplay = (url?: string): string => {
  if (!url) return '—';
  try {
    const parsed = new URL(url);
    let display = parsed.hostname;
    if (parsed.pathname && parsed.pathname !== '/') {
      display += parsed.pathname.length > 20 ? `${parsed.pathname.slice(0, 20)}…` : parsed.pathname;
    }
    return display.length > 30 ? `${display.slice(0, 30)}…` : display;
  } catch {
    return url.length > 30 ? `${url.slice(0, 30)}…` : url;
  }
};

/**
 * Convert TalentLevel enum value thành lowercase level name
 */
export const getTalentLevelName = (levelValue: number | undefined): string => {
  if (levelValue === undefined) return '';
  const match = Object.entries(TalentLevel).find(([, value]) => value === levelValue);
  return match?.[0]?.toLowerCase() ?? '';
};

/**
 * Normalize job role key để so sánh
 */
export const normalizeJobRoleKey = (position?: string | null, level?: string | null): string => {
  const normalizedPosition = (position ?? '').trim().toLowerCase();
  const normalizedLevel = (level ?? '').trim().toLowerCase();
  return `${normalizedPosition}|${normalizedLevel}`;
};

/**
 * Normalize certificate name để so sánh
 */
export const normalizeCertificateName = (name?: string | null): string => {
  return (name ?? '').trim().toLowerCase();
};

/**
 * Convert skill level string (Beginner, Intermediate, Advanced, Expert) thành level number
 * và sử dụng getLevelText để format
 */
export const getLevelTextForSkills = (level: string, getLevelText: (level: number) => string): string => {
  const levelMap: Record<string, number> = {
    'Beginner': 1,
    'Intermediate': 2,
    'Advanced': 3,
    'Expert': 4,
  };
  const levelNumber = levelMap[level] || 1;
  return getLevelText(levelNumber);
};

