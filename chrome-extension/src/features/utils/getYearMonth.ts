export const getYearMonth = (date: Date): string =>
  `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
