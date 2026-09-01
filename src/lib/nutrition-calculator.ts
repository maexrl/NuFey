export interface PatientMetricsInput {
  gender: 'male' | 'female';
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'intense' | 'very_intense';
  goal: 'weight_loss' | 'maintenance' | 'hypertrophy';
}

export interface CalculatedEnergyRequirements {
  bmr: number; // Taxa Metabólica Basal (Mifflin-St Jeor)
  tdee: number; // Gasto Energético Total (GET)
  targetCalories: number;
  macros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  waterMl: number;
}

export function calculateEnergyRequirements(input: PatientMetricsInput): CalculatedEnergyRequirements {
  const weight = input.weightKg > 0 ? input.weightKg : 70;
  const height = input.heightCm > 0 ? input.heightCm : 170;
  const age = input.ageYears > 0 ? input.ageYears : 30;

  // Equação de Mifflin-St Jeor
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = input.gender === 'male' ? bmr + 5 : bmr - 161;

  // Fator de Atividade
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    intense: 1.725,
    very_intense: 1.9,
  };

  const multiplier = activityMultipliers[input.activityLevel] || 1.55;
  const tdee = bmr * multiplier;

  // Ajuste por Objetivo
  let targetCalories = tdee;
  if (input.goal === 'weight_loss') targetCalories = tdee - 500;
  else if (input.goal === 'hypertrophy') targetCalories = tdee + 350;

  if (targetCalories < 1200) targetCalories = 1200;

  // Distribuição de Macronutrientes
  let proteinRatio = 0.25;
  let fatRatio = 0.25;
  let carbRatio = 0.50;

  if (input.goal === 'hypertrophy') {
    proteinRatio = 0.30;
    fatRatio = 0.25;
    carbRatio = 0.45;
  } else if (input.goal === 'weight_loss') {
    proteinRatio = 0.35;
    fatRatio = 0.25;
    carbRatio = 0.40;
  }

  const proteinGrams = Math.round((targetCalories * proteinRatio) / 4);
  const fatGrams = Math.round((targetCalories * fatRatio) / 9);
  const carbsGrams = Math.round((targetCalories * carbRatio) / 4);
  const waterMl = Math.round(weight * 35);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories: Math.round(targetCalories),
    macros: { proteinGrams, carbsGrams, fatGrams },
    waterMl,
  };
}

export function calculatePollock7Folds(
  folds: {
    chest: number;
    axillary: number;
    triceps: number;
    subscapular: number;
    abdominal: number;
    suprailiac: number;
    thigh: number;
  },
  age: number,
  gender: 'male' | 'female'
): number {
  const sum =
    (folds.chest || 0) +
    (folds.axillary || 0) +
    (folds.triceps || 0) +
    (folds.subscapular || 0) +
    (folds.abdominal || 0) +
    (folds.suprailiac || 0) +
    (folds.thigh || 0);

  if (sum <= 0) return 0;

  let bodyDensity = 0;
  const safeAge = age > 0 ? age : 30;

  if (gender === 'male') {
    bodyDensity = 1.112 - (0.00043499 * sum) + (0.00000055 * sum * sum) - (0.00028826 * safeAge);
  } else {
    bodyDensity = 1.097 - (0.00046971 * sum) + (0.00000056 * sum * sum) - (0.00012828 * safeAge);
  }

  if (bodyDensity <= 0) return 0;

  // Fórmula de Siri
  const bodyFatPercent = ((4.95 / bodyDensity) - 4.5) * 100;
  return Number(Math.max(0, bodyFatPercent).toFixed(1));
}
