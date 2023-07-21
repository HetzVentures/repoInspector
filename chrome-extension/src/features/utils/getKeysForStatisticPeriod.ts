export const getKeysForStatisticPeriod = (statistic: {
  [key: string]: unknown;
}) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const sortedDates = Object.keys(statistic).sort((a, b) => a.localeCompare(b));
  const startDate = sortedDates[0];

  const filledMonths = [];
  let [year, month] = startDate.split('.').map(Number);

  while (
    !(year > currentYear || (year === currentYear && month > currentMonth))
  ) {
    const dateKey = `${year}.${month.toString().padStart(2, '0')}`;
    filledMonths.push(dateKey);

    month++;

    if (month > 12) {
      year++;
      month = 1;
    }
  }

  return filledMonths;
};
