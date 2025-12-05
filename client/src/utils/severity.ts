export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export const SEVERITY_LEVELS: Record<SeverityLevel, number> = {
    critical: 5,
    high: 4,
    medium: 3,
    low: 2,
    info: 1,
};

export const SEVERITY_COLORS: Record<SeverityLevel, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    info: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
};

export const getSeverityColor = (severity: string): string => {
    const level = severity.toLowerCase() as SeverityLevel;
    return SEVERITY_COLORS[level] || SEVERITY_COLORS.info;
};

export const getSeverityScore = (severity: string): number => {
    const level = severity.toLowerCase() as SeverityLevel;
    return SEVERITY_LEVELS[level] || 0;
};
