/**
 * @agencyos/wellness-hub-sdk — Nutrition Facade
 * Nutrition planning, meal tracking, and dietary goal management.
 */

export interface NutritionPlan {
  id: string;
  userId: string;
  name: string;
  dailyCalorieTarget: number;
  macros: { proteinG: number; carbsG: number; fatG: number };
  durationWeeks: number;
  dietType: 'balanced' | 'keto' | 'vegan' | 'vegetarian' | 'paleo' | 'mediterranean';
  createdAt: string;
}

export interface MealPlan {
  id: string;
  nutritionPlanId: string;
  dayOfWeek: number;
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    name: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    ingredients: string[];
  }[];
}

export interface DietGoal {
  id: string;
  userId: string;
  type: 'lose-weight' | 'gain-muscle' | 'maintain' | 'improve-energy' | 'manage-condition';
  targetWeightKg?: number;
  timelineWeeks: number;
  restrictions: string[];
  allergies: string[];
  createdAt: string;
}

export function createNutritionPlanner() {
  return {
    createNutritionPlan: async (
      _userId: string,
      _goal: DietGoal,
    ): Promise<NutritionPlan> => {
      throw new Error('Implement with your nutrition AI backend');
    },

    generateMealPlan: async (
      _nutritionPlanId: string,
      _weekNumber: number,
    ): Promise<MealPlan[]> => {
      throw new Error('Implement with your meal planning backend');
    },

    logMeal: async (
      _userId: string,
      _meal: Pick<MealPlan['meals'][0], 'name' | 'calories' | 'proteinG' | 'carbsG' | 'fatG'>,
    ): Promise<{ logged: boolean; dailySummary: { consumed: number; remaining: number } }> => {
      throw new Error('Implement with your food logging backend');
    },

    getDailyNutritionSummary: async (
      _userId: string,
      _date: string,
    ): Promise<{ calories: number; protein: number; carbs: number; fat: number; water: number }> => {
      throw new Error('Implement with your nutrition analytics backend');
    },

    setDietGoal: async (
      _userId: string,
      _goal: Omit<DietGoal, 'id' | 'userId' | 'createdAt'>,
    ): Promise<DietGoal> => {
      throw new Error('Implement with your goals backend');
    },
  };
}
