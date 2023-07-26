import { getYearMonth } from './getYearMonth';
import { getKeysForStatisticPeriod } from './getKeysForStatisticPeriod';

const fillMissingMonths = (chartData: ChartData) => {
  const filledChartData = { ...chartData };
  const allMonths = getKeysForStatisticPeriod(chartData);

  allMonths.forEach((key) => {
    if (!(key in filledChartData)) {
      filledChartData[key] = {
        opened: 0,
        closed: 0,
      };
    }
  });

  return filledChartData;
};

export const getIssuesStatistic = (issues: Issue[]) => {
  const currentDate = new Date();
  const twelveMonthsAgo = new Date().setFullYear(currentDate.getFullYear() - 1);

  const chartData: ChartData = {};
  let openedCount = 0;
  let closedCount = 0;

  issues.forEach((item) => {
    const createdAt = new Date(item.node.createdAt);
    const closedAt = item.node.closedAt ? new Date(item.node.closedAt) : null;
    const createdYearMonth = getYearMonth(createdAt);
    const closedYearMonth = closedAt ? getYearMonth(closedAt) : null;

    if (!chartData[createdYearMonth]) {
      chartData[createdYearMonth] = {
        opened: 0,
        closed: 0,
      };
    }

    chartData[createdYearMonth].opened++;

    if (closedYearMonth && !chartData[closedYearMonth]) {
      chartData[closedYearMonth] = {
        opened: 0,
        closed: 0,
      };
    }

    if (item.node.state === 'CLOSED' && closedYearMonth) {
      chartData[closedYearMonth].closed++;
    }

    if (createdAt.getTime() >= twelveMonthsAgo) {
      openedCount++;

      if (
        item.node.state === 'CLOSED' &&
        closedAt &&
        closedAt.getTime() >= twelveMonthsAgo
      ) {
        closedCount++;
      }
    }
  });

  const health = (closedCount / openedCount) * 100 || 0;

  return {
    chartData: fillMissingMonths(chartData),
    health,
    openedLTM: openedCount,
  };
};
