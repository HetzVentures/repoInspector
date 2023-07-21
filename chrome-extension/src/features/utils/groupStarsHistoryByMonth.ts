import { getYearMonth } from './getYearMonth';
import { getKeysForStatisticPeriod } from './getKeysForStatisticPeriod';

const fillMissingMonths = (starHistory: StarHistoryByMonth) => {
  const filledStarHistory = { ...starHistory };
  const allMonths = getKeysForStatisticPeriod(starHistory);
  let totalCount = 0;

  allMonths.forEach((key) => {
    if (key in filledStarHistory) {
      totalCount += filledStarHistory[key].count;
      filledStarHistory[key].count = totalCount;
    } else {
      filledStarHistory[key] = { count: totalCount };
    }
  });

  return filledStarHistory;
};

export const groupStarsHistoryByMonth = (starHistory: StarHistory[]) => {
  const result: StarHistoryByMonth = {};
  const now = new Date();
  const currentMonthKey = getYearMonth(now);

  starHistory.forEach((item) => {
    const date = new Date(item.starredAt);
    const yearMonth = getYearMonth(date);

    if (!result[yearMonth]) {
      result[yearMonth] = {
        count: 0,
      };
    }

    result[yearMonth].count++;
  });

  const lastMonthStars = result[currentMonthKey]
    ? result[currentMonthKey].count
    : 0;

  const stars_history = fillMissingMonths(result);

  return { stars_history, lastMonthStars };
};
