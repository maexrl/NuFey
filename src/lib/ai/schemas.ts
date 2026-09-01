export interface MealItem {
  foodName: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  substitutes?: string[];
}

export interface Meal {
  name: string;
  time: string;
  items: MealItem[];
}

export interface MealPlanAIResponse {
  title: string;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  waterRequirementMl: number;
  meals: Meal[];
  generalInstructions?: string[];
}
