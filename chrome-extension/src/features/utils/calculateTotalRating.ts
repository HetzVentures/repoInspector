const normalizer = (value: number, min: number, max: number) =>
  ((value - min) / (max - min)) * 100;

export const calculateTotalRating = (
  data: { [key: string]: number },
  totalRatingWeights: TotalRatingWeights,
) => {
  const values = Object.values(data);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const {
    starsWeight,
    contributorsWeight,
    starsGrowthWeight,
    starsActivityWeight,
    forksStarsWeight,
    issuesOpenedLTMWeight,
    issuesClosedLTMWeight,
    PRMergedLTMWeight,
  } = totalRatingWeights;

  const normalizeValue = (value: number) => normalizer(value, min, max);

  const starsRating = normalizeValue(data.stars) * starsWeight;
  const contributorsRating =
    normalizeValue(data.contributors) * contributorsWeight;
  const starsGrowthRating =
    normalizeValue(data.starsGrowth) * starsGrowthWeight;
  const starsActivityRating =
    normalizeValue(data.starsActivity) * starsActivityWeight;
  const forksStarsRating = normalizeValue(data.forksStars) * forksStarsWeight;
  const issuesOpenedLTMRating =
    normalizeValue(data.issuesOpenedLTM) * issuesOpenedLTMWeight;
  const issuesClosedLTMRating =
    normalizeValue(data.issuesClosedLTM) * issuesClosedLTMWeight;
  const PRMergedLTMRating =
    normalizeValue(data.pmMergedLTM) * PRMergedLTMWeight;

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
