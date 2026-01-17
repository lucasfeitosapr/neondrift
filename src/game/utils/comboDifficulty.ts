import { config } from '../config';

export interface ComboDifficultyMultipliers {
  spawnMultiplier: number;
  meteorSpeedMultiplier: number;
}

export function getComboDifficultyMultipliers(comboCount: number): ComboDifficultyMultipliers {
  const comboSettings = config.dynamicDifficulty?.combo;
  if (!comboSettings) {
    return { spawnMultiplier: 1, meteorSpeedMultiplier: 1 };
  }
  
  const {
    minComboForAggro,
    spawnBonusPerLevel,
    spawnMaxMultiplier,
    lowComboSpawnMultiplier,
    meteorSpeedBonusPerLevel,
    meteorSpeedMaxMultiplier,
    lowComboSpeedMultiplier
  } = comboSettings;

  if (comboCount >= minComboForAggro) {
    const levelsAbove = comboCount - minComboForAggro + 1;
    const spawnMultiplier = Math.min(spawnMaxMultiplier, 1 + levelsAbove * spawnBonusPerLevel);
    const meteorSpeedMultiplier = Math.min(
      meteorSpeedMaxMultiplier,
      1 + levelsAbove * meteorSpeedBonusPerLevel
    );
    return { spawnMultiplier, meteorSpeedMultiplier };
  }

  const minAggroThreshold = Math.max(1, minComboForAggro - 1);
  const blend = Math.min(1, comboCount / minAggroThreshold);
  const spawnMultiplier = lowComboSpawnMultiplier + (1 - lowComboSpawnMultiplier) * blend;
  const meteorSpeedMultiplier = lowComboSpeedMultiplier + (1 - lowComboSpeedMultiplier) * blend;
  return { spawnMultiplier, meteorSpeedMultiplier };
}
