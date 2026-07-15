import { describe, expect, test } from "vitest";
import { ActiveSkills } from "@/src/data/skill/active";
import { getSkillLevelDataQuality } from "./level-data-quality";

const find = (name: string) => {
  const skill = ActiveSkills.find((s) => s.name === name);
  if (skill === undefined) throw new Error(`skill not found: ${name}`);
  return skill;
};

describe("getSkillLevelDataQuality", () => {
  test("skill without levelValues is missing", () => {
    expect(getSkillLevelDataQuality(find("Aimed Shot"))).toBe("missing");
  });

  test("flat real skill is placeholder", () => {
    expect(getSkillLevelDataQuality(find("Fire Burst"))).toBe("placeholder");
  });

  test("flat test skill is placeholder", () => {
    expect(getSkillLevelDataQuality(find("[Test] Simple Attack"))).toBe(
      "placeholder",
    );
  });

  test("skill with real per-level growth is measured", () => {
    expect(getSkillLevelDataQuality(find("Frost Spike"))).toBe("measured");
  });

  test("buff-only skill (no base-damage keys) is measured", () => {
    expect(getSkillLevelDataQuality(find("Ice Bond"))).toBe("measured");
  });
});
