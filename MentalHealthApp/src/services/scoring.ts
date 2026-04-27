export interface Scores {
  anxiety: number;
  depression: number;
  stress: number;
}

export interface Question {
  id: string;
  text: string;
  category: 'anxiety' | 'depression' | 'stress';
}

// Arbitrary thresholds denoting "High-Risk" category levels (based loosely on DASS-21 Severe scale)
const HIGH_RISK_THRESHOLDS = {
  anxiety: 14,
  depression: 13,
  stress: 16
};

/**
 * Computes the scores from raw answers.
 */
export const computeScores = (answers: Record<string, number>, questions: Question[]): Scores => {
  const scores: Scores = { anxiety: 0, depression: 0, stress: 0 };
  const counts: Scores = { anxiety: 0, depression: 0, stress: 0 };

  questions.forEach(q => {
    if (answers[q.id] !== undefined) {
      scores[q.category] += answers[q.id];
      counts[q.category] += 1;
    }
  });

  // Assuming we use sums, as per backend
  return scores;
};

/**
 * Evaluates the scores returned by the backend to determine if the user hits ANY 
 * high-risk threshold across the 3 categories.
 */
export const checkHighRisk = (scores: Scores): boolean => {
  if (
    scores.anxiety > HIGH_RISK_THRESHOLDS.anxiety ||
    scores.depression > HIGH_RISK_THRESHOLDS.depression ||
    scores.stress > HIGH_RISK_THRESHOLDS.stress
  ) {
    return true; // Any individual category hitting the threshold triggers High-Risk
  }
  
  return false;
};

/**
 * Returns a personalized categorization message string for the specific category.
 */
export const getCategoryMessage = (category: keyof Scores, score: number): string => {
  if (score > HIGH_RISK_THRESHOLDS[category]) {
    return "Severe: High intervention recommended.";
  } else if (score > HIGH_RISK_THRESHOLDS[category] / 2) {
    return "Moderate: Recommend continuing monitoring and self-care routines.";
  }
  return "Mild: Healthy range. Keep up your positive habits.";
};
