# Changelog

Architectural decisions and behavior-changing fixes.

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
