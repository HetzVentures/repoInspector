export const getPullRequestStatistic = (prs: PullRequest[]) => {
  const currentDate = new Date();
  const twelveMonthsAgo = new Date().setFullYear(currentDate.getFullYear() - 1);
  let prsMergedLTM = 0;

  prs.forEach((pr) => {
    const closedAt = pr.node.closedAt
      ? new Date(pr.node.closedAt).getTime()
      : null;

    if (closedAt && closedAt >= twelveMonthsAgo) prsMergedLTM++;
  });

  return prsMergedLTM;
};
