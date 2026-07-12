/**
 * 10x damage theorycrafting.
 *
 * Loads the user's actual SaveData fixture and runs calculateOffense for many
 * candidate in-game changes to find what it takes to 10x their Shackles DPS.
 */
import { describe, it } from "vitest";
import { parseSaveData } from "@/src/lib/schemas/save-data.schema";
import { loadSave } from "../storage/load-save";
import { calculateOffense, type OffenseResults } from "./offense";
import rawSave from "./user-save-fixture.json" with { type: "json" };

type SkillSummary = NonNullable<OffenseResults["skills"][keyof OffenseResults["skills"]]>;
const asNum = (n: number | undefined): number => (n === undefined ? 0 : n);

interface Snapshot {
  label: string;
  total: number;
}

const run = (label: string, mutate?: (save: any) => void): Snapshot => {
  const saveClone = JSON.parse(JSON.stringify(rawSave));
  if (mutate !== undefined) mutate(saveClone);
  const saveData = parseSaveData(saveClone);
  const loadout = loadSave(saveData);
  const results = calculateOffense({
    loadout,
    configuration: saveData.configurationPage,
  });
  const skills = results.skills as Record<string, SkillSummary | undefined>;
  let total = 0;
  for (const s of Object.values(skills)) total += asNum(s?.totalDps);
  return { label, total };
};

const fmt = (n: number): string => {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};

// ---- Mutation helpers ----
// Install a micro-fate destiny on every inner-ring slot of every pactspirit.
// Install a medium-fate destiny on every mid-ring slot.
const installDestinies = (s: any, microName: string, mediumName: string, microType = "Micro Fate", mediumType = "Medium Fate"): void => {
  for (const ps of ["slot1", "slot2", "slot3"]) {
    const rings = s.pactspiritPage[ps]?.rings;
    if (rings === undefined) continue;
    for (const rk of Object.keys(rings)) {
      const isInner = rk.startsWith("innerRing");
      rings[rk] = {
        installedDestiny: {
          destinyName: isInner ? microName : mediumName,
          destinyType: isInner ? microType : mediumType,
          resolvedAffix: "",
        },
      };
    }
  }
};

// Replace all suffixes on a gear piece with a custom one
const replaceSuffix = (s: any, slot: string, idx: number, newText: string): void => {
  const id = s.equipmentPage.equippedGear[slot]?.id;
  if (id === undefined) return;
  const item = s.equipmentPage.inventory.find((it: any) => it.id === id);
  if (item?.suffixes === undefined) return;
  item.suffixes[idx] = newText;
};

const replacePrefix = (s: any, slot: string, idx: number, newText: string): void => {
  const id = s.equipmentPage.equippedGear[slot]?.id;
  if (id === undefined) return;
  const item = s.equipmentPage.inventory.find((it: any) => it.id === id);
  if (item?.prefixes === undefined) return;
  item.prefixes[idx] = newText;
};

// Add an affix to a gear piece's baseAffixes array (implicit slot)
const addBaseAffix = (s: any, slot: string, text: string): void => {
  const id = s.equipmentPage.equippedGear[slot]?.id;
  if (id === undefined) return;
  const item = s.equipmentPage.inventory.find((it: any) => it.id === id);
  if (item === undefined) return;
  item.baseAffixes = item.baseAffixes ?? [];
  item.baseAffixes.push(text);
};

// Set the Sweet Dream Affix on a gear piece (dedicated single-string slot)
const setSweetDream = (s: any, slot: string, text: string): void => {
  const id = s.equipmentPage.equippedGear[slot]?.id;
  if (id === undefined) return;
  const item = s.equipmentPage.inventory.find((it: any) => it.id === id);
  if (item === undefined) return;
  item.sweetDreamAffix = text;
};

describe("10x damage theorycrafting", () => {
  it("finds path to 10x", () => {
    const rows: Snapshot[] = [];
    const BASE = run("BASELINE (your current build as exported)");
    rows.push(BASE);

    rows.push(
      run("D1: All 18 inner rings = Spell Damage micro (+16% ea)", (s) => {
        installDestinies(s, "Spell Damage", "Spell Damage");
      }),
    );

    rows.push(
      run("D2: All mid rings = Spell Damage medium (+32% ea)", (s) => {
        installDestinies(s, "Spell Damage", "Spell Damage");
      }),
    );

    rows.push(
      run("D3: Inner = Affliction Effect micro + Mid = Affliction Effect medium", (s) => {
        installDestinies(s, "Affliction Effect", "Affliction Effect");
      }),
    );

    rows.push(
      run("D4: Inner = Crit Dmg, Mid = Crit Dmg", (s) => {
        installDestinies(s, "Critical Strike Damage", "Critical Strike Damage");
      }),
    );

    rows.push(
      run("D5: Inner = Crit Rating, Mid = Crit Rating", (s) => {
        installDestinies(s, "Critical Strike Rating", "Critical Strike Rating");
      }),
    );

    // Gear: reroll Elder Sage Girdle suffix +28% Focus Speed (idx 0) to something else
    rows.push(
      run("G1: Belt suffix Focus Speed → +50% Spell Damage", (s) => {
        replaceSuffix(s, "belt", 0, "+50% Spell Damage");
      }),
    );
    rows.push(
      run("G2: Belt suffix Focus Speed → +30% Critical Strike Damage", (s) => {
        replaceSuffix(s, "belt", 0, "+30% Critical Strike Damage");
      }),
    );
    rows.push(
      run("G3: Belt suffix Focus Speed → +30% Affliction Effect", (s) => {
        replaceSuffix(s, "belt", 0, "+30% Affliction Effect");
      }),
    );

    // Offhand wand: rolls are decent; check upgrading main-hand to Spell Damage prefix
    rows.push(
      run("G4: Main-hand wand prefix '+111 Max Mana' → '+54% Spell Damage'", (s) => {
        replacePrefix(s, "mainHand", 0, "+54% Spell Damage");
      }),
    );

    // Add Affliction Effect on offhand suffix where Life Regain sits
    rows.push(
      run("G5: Offhand suffix 'Life Regain' → '+30% Affliction Effect'", (s) => {
        replaceSuffix(s, "offHand", 2, "+30% Affliction Effect");
      }),
    );

    // Compound: install destinies + gear swaps + pact levels
    rows.push(
      run("C1: Spell-Dmg destinies (all rings) + G1+G4", (s) => {
        installDestinies(s, "Spell Damage", "Spell Damage");
        replaceSuffix(s, "belt", 0, "+50% Spell Damage");
        replacePrefix(s, "mainHand", 0, "+54% Spell Damage");
      }),
    );
    rows.push(
      run("C2: C1 + pactspirits L1→L6 (paywall)", (s) => {
        installDestinies(s, "Spell Damage", "Spell Damage");
        replaceSuffix(s, "belt", 0, "+50% Spell Damage");
        replacePrefix(s, "mainHand", 0, "+54% Spell Damage");
        s.pactspiritPage.slot1.level = 6;
        s.pactspiritPage.slot2.level = 6;
        s.pactspiritPage.slot3.level = 6;
      }),
    );
    rows.push(
      run("C3: Crit Dmg destinies + G2 + all gear crit", (s) => {
        installDestinies(s, "Critical Strike Damage", "Critical Strike Damage");
        replaceSuffix(s, "belt", 0, "+30% Critical Strike Damage");
      }),
    );
    rows.push(
      run("C4: Mixed greedy: +SpellDmg inner, +CritDmg mid, +all gear spellDmg", (s) => {
        installDestinies(s, "Spell Damage", "Critical Strike Damage");
        replaceSuffix(s, "belt", 0, "+50% Spell Damage");
        replacePrefix(s, "mainHand", 0, "+54% Spell Damage");
        replaceSuffix(s, "offHand", 2, "+30% Affliction Effect");
      }),
    );

    // --- CURSE / BUFF SKILL SWAPS ---
    const setActiveSlot = (s: any, slotKey: string, skillName: string, level = 20): void => {
      const existing = s.skillPage.activeSkills[slotKey];
      if (existing === undefined) return;
      existing.skillName = skillName;
      existing.level = level;
    };

    rows.push(
      run("K1: Blink → Entangled Pain (curse: +DoT dmg debuff)", (s) => {
        setActiveSlot(s, "3", "Entangled Pain");
      }),
    );
    rows.push(
      run("K2: Blink → Arcane Circle (2nd +spell dmg buff)", (s) => {
        setActiveSlot(s, "3", "Arcane Circle");
      }),
    );
    rows.push(
      run("K3: Mana Boil → Arcane Circle (swap 1 spell-buff for another)", (s) => {
        setActiveSlot(s, "5", "Arcane Circle");
      }),
    );
    rows.push(
      run("K4: Blink→Entangled Pain AND Mana Boil→Arcane Circle", (s) => {
        setActiveSlot(s, "3", "Entangled Pain");
        setActiveSlot(s, "5", "Arcane Circle");
      }),
    );
    rows.push(
      run("K5: Everything relevant stacked (K4 + C4 gear)", (s) => {
        setActiveSlot(s, "3", "Entangled Pain");
        setActiveSlot(s, "5", "Arcane Circle");
        replaceSuffix(s, "belt", 0, "+30% Critical Strike Damage");
        replacePrefix(s, "mainHand", 0, "+54% Spell Damage");
      }),
    );

    // --- CURSE COUNT / ENEMY STATE ---
    rows.push(
      run("X1: enemyCurseCount 0→3 (tell calc you run 3 curses)", (s) => {
        s.configurationPage.enemyCurseCount = 3;
      }),
    );
    rows.push(
      run("X2: enemyCurseCount 0→5", (s) => {
        s.configurationPage.enemyCurseCount = 5;
      }),
    );
    rows.push(
      run("X3: targetEnemyHasFrail=true", (s) => {
        s.configurationPage.targetEnemyHasFrail = true;
      }),
    );
    rows.push(
      run("X4: hasCritRecently=true", (s) => {
        s.configurationPage.hasCritRecently = true;
      }),
    );
    rows.push(
      run("X5: everything X1-X4 + Blink→Entangled Pain", (s) => {
        s.configurationPage.enemyCurseCount = 5;
        s.configurationPage.targetEnemyHasFrail = true;
        s.configurationPage.hasCritRecently = true;
        setActiveSlot(s, "3", "Entangled Pain");
      }),
    );

    // --- CURSE-ADDING RING BASE AFFIXES ---
    // These are tier-0 ring base affixes that auto-trigger a curse on hit.
    // The engine auto-detects TriggersSkill mods and increments curse count
    // AND applies the curse's buff mods (e.g. Entangled Pain's DoT debuff).
    rows.push(
      run("R1: +Entangled Pain trigger on leftRing (DoT curse)", (s) => {
        addBaseAffix(
          s,
          "leftRing",
          "Triggers Lv. 20 Entangled Pain Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("R2: +Ominous curse aura on leftRing (generic curse)", (s) => {
        addBaseAffix(
          s,
          "leftRing",
          "Nearby enemies within 15 m are cursed by Lv. 20 Ominous",
        );
      }),
    );
    rows.push(
      run("R3: +Timid trigger on leftRing (hit-dmg curse)", (s) => {
        addBaseAffix(
          s,
          "leftRing",
          "Triggers Lv. 20 Timid Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("R4: +Frost Touch trigger on leftRing (cold curse)", (s) => {
        addBaseAffix(
          s,
          "leftRing",
          "Triggers Lv. 20 Frost Touch Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("R5: +Entangled Pain left AND +Timid right (2 added curses)", (s) => {
        addBaseAffix(
          s,
          "leftRing",
          "Triggers Lv. 20 Entangled Pain Curse upon inflicting damage. Cooldown: 0.2 s",
        );
        addBaseAffix(
          s,
          "rightRing",
          "Triggers Lv. 20 Timid Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("R6: R5 + swap Blink→Arcane Circle (keep 3 in-panel curses)", (s) => {
        addBaseAffix(
          s,
          "leftRing",
          "Triggers Lv. 20 Entangled Pain Curse upon inflicting damage. Cooldown: 0.2 s",
        );
        addBaseAffix(
          s,
          "rightRing",
          "Triggers Lv. 20 Timid Curse upon inflicting damage. Cooldown: 0.2 s",
        );
        setActiveSlot(s, "3", "Arcane Circle");
      }),
    );

    // --- SWEET DREAM AFFIXES (single dedicated slot, tier 0 craftable) ---
    // Ring Sweet Dream options — +1 Blessing Stack tier 0 affixes
    rows.push(
      run("SD1: Ring sweet dream = +1 Max Focus Blessing Stack", (s) => {
        setSweetDream(s, "leftRing", "+1 to Max Focus Blessing Stacks");
      }),
    );
    rows.push(
      run("SD2: Ring sweet dream = +1 Max Tenacity Blessing Stack", (s) => {
        setSweetDream(s, "leftRing", "+1 to Max Tenacity Blessing Stacks");
      }),
    );
    rows.push(
      run("SD3: Ring sweet dream = +1 Max Agility Blessing Stack", (s) => {
        setSweetDream(s, "leftRing", "+1 to Max Agility Blessing Stacks");
      }),
    );
    rows.push(
      run("SD4: Ring sweet dream = Adds 20% of Physical as Erosion", (s) => {
        setSweetDream(s, "leftRing", "Adds 20% of Physical Damage as Erosion Damage");
      }),
    );
    // Curse trigger via Sweet Dream slot (works even if baseAffix slot is used)
    rows.push(
      run("SD5: Ring sweet dream = Triggers Entangled Pain (DoT curse)", (s) => {
        setSweetDream(
          s,
          "leftRing",
          "Triggers Lv. 20 Entangled Pain Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("SD6: Ring sweet dream = Triggers Timid (hit curse)", (s) => {
        setSweetDream(
          s,
          "leftRing",
          "Triggers Lv. 20 Timid Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("SD7: Ring sweet dream = Ominous curse aura", (s) => {
        setSweetDream(
          s,
          "leftRing",
          "Nearby enemies within 15 m are cursed by Lv. 20 Ominous",
        );
      }),
    );

    // Necklace Sweet Dream options — additional curse triggers
    rows.push(
      run("SD8: Necklace sweet dream = Triggers Corruption (erosion curse)", (s) => {
        setSweetDream(
          s,
          "neck",
          "Triggers Lv. 20 Corruption Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("SD9: Necklace sweet dream = Triggers Electrocute (lightning)", (s) => {
        setSweetDream(
          s,
          "neck",
          "Triggers Lv. 20 Electrocute Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("SD10: Necklace sweet dream = Triggers Biting Cold", (s) => {
        setSweetDream(
          s,
          "neck",
          "Triggers Lv. 20 Biting Cold Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("SD11: Necklace sweet dream = Triggers Vulnerability", (s) => {
        setSweetDream(
          s,
          "neck",
          "Triggers Lv. 20 Vulnerability Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );

    // Combined Sweet Dream scenarios - stack both rings + necklace
    rows.push(
      run("SD12: BOTH rings = +1 Focus Blessing Stacks sweet dream", (s) => {
        setSweetDream(s, "leftRing", "+1 to Max Focus Blessing Stacks");
        setSweetDream(s, "rightRing", "+1 to Max Focus Blessing Stacks");
      }),
    );
    rows.push(
      run("SD13: Ring +1 Focus + Ring +1 Tenacity + Neck Corruption", (s) => {
        setSweetDream(s, "leftRing", "+1 to Max Focus Blessing Stacks");
        setSweetDream(s, "rightRing", "+1 to Max Tenacity Blessing Stacks");
        setSweetDream(
          s,
          "neck",
          "Triggers Lv. 20 Corruption Curse upon inflicting damage. Cooldown: 0.2 s",
        );
      }),
    );
    rows.push(
      run("SD14: 3x Sweet Dream + swap Blink→Arcane Circle", (s) => {
        setSweetDream(s, "leftRing", "+1 to Max Focus Blessing Stacks");
        setSweetDream(s, "rightRing", "+1 to Max Tenacity Blessing Stacks");
        setSweetDream(
          s,
          "neck",
          "Triggers Lv. 20 Corruption Curse upon inflicting damage. Cooldown: 0.2 s",
        );
        setActiveSlot(s, "3", "Arcane Circle");
      }),
    );

    // Print table sorted by total DPS desc
    rows.sort((a, b) => b.total - a.total);
    console.log("\n========== 10x DAMAGE SEARCH ==========");
    console.log(`Baseline: ${fmt(BASE.total)} DPS`);
    console.log(`Target (10x): ${fmt(BASE.total * 10)} DPS\n`);
    console.log(`${"scenario".padEnd(60)} | ${"DPS".padEnd(10)} | ${"×base".padEnd(7)} | Δ`);
    console.log("-".repeat(100));
    for (const r of rows) {
      const x = r.total / BASE.total;
      const delta = r.total - BASE.total;
      console.log(
        `${r.label.padEnd(60)} | ${fmt(r.total).padEnd(10)} | ${x.toFixed(2).padStart(5)}× | ${delta >= 0 ? "+" : ""}${fmt(delta)}`,
      );
    }
    console.log("=======================================\n");
  });
});
