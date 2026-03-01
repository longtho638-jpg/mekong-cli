---
name: wellness-hub-sdk
description: Unified Wellness SDK — fitness tracking, nutrition planning, mental health tools, wearable integration, coaching. Use for health apps, fitness platforms, corporate wellness programs.
license: MIT
version: 1.0.0
---

# Wellness Hub SDK Skill

Build fitness apps, nutrition platforms, mental health tools, and wearable-connected wellness systems.

## When to Use

- Workout plans, exercise logging, and fitness progress
- Nutrition tracking, meal planning, and macro calculation
- Mental health: mood journaling, guided meditation, CBT tools
- Wearable device sync (Apple Health, Google Fit, Garmin, Fitbit)
- Coaching programs and client management
- Corporate wellness challenges and team leaderboards

## SDK Architecture

| Sub-path | Facade | Domain |
|----------|--------|--------|
| `@agencyos/wellness-hub-sdk/fitness` | FitnessFacade | Workouts, exercises, progress |
| `@agencyos/wellness-hub-sdk/nutrition` | NutritionFacade | Meals, macros, food database |
| `@agencyos/wellness-hub-sdk/mental` | MentalHealthFacade | Mood, meditation, CBT journaling |

## Underlying Packages

| Package | Purpose |
|---------|---------|
| `@agencyos/vibe-wellness` | Core wellness engine |
| `@agencyos/vibe-fitness` | Fitness and workout management |
| `@agencyos/vibe-nutrition` | Nutrition and meal planning |

## Usage

```typescript
import { createFitnessTracker, createNutritionPlanner, createMentalHealthEngine } from '@agencyos/wellness-hub-sdk';

const workout = await createFitnessTracker().logSession({
  userId: 'user_123',
  type: 'strength',
  duration: 45,
  exercises: [{ name: 'Squat', sets: 3, reps: 10, weight: 80 }],
});

const meal = await createNutritionPlanner().logMeal({
  userId: 'user_123',
  items: [{ foodId: 'chicken-breast-100g', quantity: 150 }],
  mealType: 'lunch',
});

const entry = await createMentalHealthEngine().logMood({
  userId: 'user_123',
  score: 7,
  tags: ['calm', 'focused'],
  note: 'Good meditation session',
});
```

## Key Types

- `WorkoutSession` — exercise list, duration, calories burned, heart rate zones
- `NutritionLog` — daily macros, meal breakdown, hydration
- `MoodEntry` — score, tags, journal text, trigger analysis
- `WearableSync` — device data, steps, sleep, HRV, VO2 max

## Related Skills

- `healthcare-hub-sdk` — Clinical health data patterns
- `digital-health` — Health platform architecture
