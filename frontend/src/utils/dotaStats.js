export const calculateDotaLinearGrowth = (matches = []) => {
  if (!matches || matches.length < 2) {
    return { slope: 0.0, isCalibrated: false };
  }

  const n = matches.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  matches.forEach((match, index) => {
    const x = index + 1; // Match index: 1, 2, 3...
    const y = Number(
      match.performance_score ||
      match.metrics_payload?.performance_score ||
      0
    );

    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  });

  const denominator = n * sumXX - sumX * sumX;
  if (denominator === 0) return { slope: 0.0, isCalibrated: true };

  const slope = parseFloat(((n * sumXY - sumX * sumY) / denominator).toFixed(2));
  return { slope, isCalibrated: true };
};
