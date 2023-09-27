const normalizer = (value: number, min: number, max: number) =>
  ((value - min) / (max - min)) * 100;

export const calculateTotalRating = (data: { [key: string]: number }) => {
  const values = Object.values(data);
  const max = Math.max(...values);
  const min = Math.min(...values);

  const normalizeValue = (value: number) => normalizer(value, min, max);

  const starsRating = normalizeValue(data.stars) * 0.225;
  const contributorsRating = normalizeValue(data.contributors) * 0.2;
  const starsGrowthRating = normalizeValue(data.starsGrowth) * 0.05;
  const starsActivityRating = normalizeValue(data.starsActivity) * 0.125;
  const forksStarsRating = normalizeValue(data.forksStars) * 0.15;
  const issuesOpenedLTMRating = normalizeValue(data.issuesOpenedLTM) * 0.05;
  const issuesClosedLTMRating = normalizeValue(data.issuesClosedLTM) * 0.05;
  const PRMergedLTMRating = normalizeValue(data.pmMergedLTM) * 0.15;

  const total_rating =
    starsRating +
    contributorsRating +
    starsGrowthRating +
    starsActivityRating +
    forksStarsRating +
    issuesOpenedLTMRating +
    issuesClosedLTMRating +
    PRMergedLTMRating;

  return Math.round(total_rating);
};
