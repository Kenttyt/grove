// Philippine Date and Time Utilities
// Timezone: Asia/Manila (UTC+8)

export const formatPHDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatPHDateShort = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatPHTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('en-PH', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const formatPHDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

export const getPHCurrentDate = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
};

// Calculate next check date (7 days from now in PH time)
export const calculateNextCheckDate = (daysFromNow: number = 7): string => {
  const phNow = getPHCurrentDate();
  const nextDate = new Date(phNow);
  nextDate.setDate(nextDate.getDate() + daysFromNow);
  return formatPHDateShort(nextDate);
};
