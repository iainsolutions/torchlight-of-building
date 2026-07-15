import type { BaseActiveSkill } from "@/src/data/skill/types";

// Level-value keys that carry base damage. If every present base-damage
// array is flat across all 40 levels, the skill's 1-20 base growth is
// placeholder data and +skill-level results are understated.
const BASE_DMG_KEYS = [
  "weaponAtkDmgPct",
  "spellDmgMin",
  "spellDmgMax",
  "sweepWeaponAtkDmgPct",
  "sweepAddedDmgEffPct",
  "steepWeaponAtkDmgPct",
  "steepAddedDmgEffPct",
  "comboStarter1WeaponAtkDmgPct",
  "comboStarter2WeaponAtkDmgPct",
  "comboFinisherWeaponAtkDmgPct",
  "persistentDamage",
] as const;

export type SkillLevelDataQuality = "missing" | "placeholder" | "measured";

export const getSkillLevelDataQuality = (
  skill: BaseActiveSkill,
): SkillLevelDataQuality => {
  const lv = skill.levelValues;
  if (lv === undefined) {
    return "missing";
  }
  const baseArrays = BASE_DMG_KEYS.map((k) => lv[k]).filter(
    (a): a is readonly number[] => a !== undefined,
  );
  if (baseArrays.length === 0) {
    return "measured"; // buff-only skill; nothing understated
  }
  const isFlat = (a: readonly number[]) => a.every((x) => x === a[0]);
  return baseArrays.every(isFlat) ? "placeholder" : "measured";
};
