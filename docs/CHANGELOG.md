# Changelog

Architectural decisions and behavior-changing fixes.

## 2026-07-13 — S13 data rewrite from official patch notes (branch `s13-official-data`)

- Source of truth: official Chinese SS13 notes (poster.xd.cn/r/ss13pn). Repo's
  S13 active-skill numbers were confirmed accurate; trait tree, Terra supports,
  legendaries, and Frost Mirror ladder were pre-release inventions — replaced
  wholesale with official data.
- Skill fixes: Thunderstorm +3%/target and Thorn +1%/100-life are *additional*
  buckets; old Terra durations 3s→6s; Frost Terra 629/s; Swamp explosion 710
  (terra-count stacking removed); Haunting Terra 6s.
- Crimson Severance = rework/rename of Mother Goddess' Paddock (necklace);
  pre-rework entry kept for old saves.
- Known gaps: official notes give one roll set (corruption mirrors normal);
  new mechanics (Extremity, Severance Mark, Bond, Mirror Stage, Divine Elegy,
  Three Saints Doctrine) are plain text, unmodeled by the engine; Flame Blast /
  Prismatic Arrow supports skipped (base skills absent); ~40-skill balance
  pass + Nether King slates + Sweet Dream removal still pending.

## 2026-07-13 — Review fixes to the same-affix rule

- affixLineKey keeps the +/- sign: penalty riders ("-5% additional damage")
  no longer sum with same-worded bonus affixes.
- calculateAddn groups within source class only (Gear vs Talent vs …) and
  floors grouped sums at -100% (multiplier can hit 0, never negative).
- at_max_channeled_stacks gate counts only condition-passing channel mods.
- "no per-level data" warning skips buff-only actives (Ice Bond).

## 2026-07-13 — Calc engine gap fixes (branch `fix/engine-gaps`)

- **Same-affix rule** (`calculateAddn`): additional% bonuses from the SAME
  affix (identified by roll-invariant `affixKey` stamped at parse time) now
  ADD into one multiplier bucket; distinct affixes multiply. Engine-generated
  mods (skill levels 21+, hero traits, supports, inline offense mods) are
  keyless and stay individually multiplicative. Matches the official manual.
  DPS drops for builds stacking duplicate-worded additional affixes.
- **Curse cap**: manual `enemyCurseCount` config is clamped to
  1 + AddnCurse mods; curse debuff application (active slots + TriggersSkill)
  deduped per curse and capped, active-slot curses take priority.
- **Destiny resolution**: installed destinies with blank `resolvedAffix`
  resolve from destiny data by name+type at midpoint roll instead of
  silently deleting the ring's original affix.
- **Eternal stacks**: per-stack buffs were applying at ONE stack due to a
  normalization ordering bug; now normalized with configurable stack counts
  defaulting to max (Morale/Nightmare/Shadow 50, Reign 10). Policy: optimistic
  uptime defaults, config-overridable (same as blessings).
- **Channeled stacks**: `at_max_channeled_stacks` honors the (previously
  dead) `channeledStacks` config; default remains at-max.
- **Ailment mods surfaced as unmodeled**: ailment/area_ailment/
  slash_strike_skill_ailment DmgPct mods contribute 0 (no ailment DPS path)
  and are now listed in a visible "Not Modeled" section instead of silently
  dropped. "Ailment Damage Enhancement" re-bucketed damage_over_time →
  ailment: it no longer (incorrectly) multiplied persistent-zone DoT.
- **Skill-data quality**: skills without per-level data warn instead of
  silently disappearing from results; flat placeholder base-damage tables
  (Fire Burst, Shackles of Malice, [Test] skills) flag "placeholder" in the
  Stats panel — +skill-level results understated until real tables imported.
- Added `Hit`/`Bombardment` to SKILL_TAGS (S13 data used them; typecheck had
  been failing silently on main).
