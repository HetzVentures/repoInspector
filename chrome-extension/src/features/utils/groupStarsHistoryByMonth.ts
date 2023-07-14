export const groupStarsHistoryByMonth = (starHistory: StarHistory[]) => {
  const result: StarHistoryByMonth = {};

  starHistory.forEach((item) => {
    const date = new Date(item.starredAt);
    const yearMonth = `${date.getFullYear()}.${(date.getMonth() + 1)
      .toString()
      .padStart(2, '0')}`;

    if (!result[yearMonth]) {
      result[yearMonth] = {
        count: 0,
        users: [],
      };
    }

    result[yearMonth].count++;
    result[yearMonth].users.push(item.node.login);
  });

  return result;
};
