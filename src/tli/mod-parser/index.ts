import type { Mod } from "../mod";
import { allParsers } from "./templates";
import type { ModParser } from "./types";

export { spec, t, ts } from "./template";
export type { TemplateBuilder } from "./types";

const multi = (parsers: ModParser[]): ModParser => ({
  parse(input: string): Mod[] | undefined {
    for (const parser of parsers) {
      const result = parser.parse(input);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  },
});

const combinedParser = multi(allParsers);

/**
 * Parses an affix line string and returns extracted mods.
 *
 * Return value semantics:
 * - `undefined`: No parser matched the input (parse failure)
 * - `[]`: Successfully parsed, but no mods to extract (intentional no-op)
 * - `[...mods]`: Successfully parsed with one or more extracted mods
 */
export const parseMod = (input: string): Mod[] | undefined => {
  const normalized = input.trim().toLowerCase();
  return combinedParser.parse(normalized);
};

// Roll-invariant identity of an affix line: same affix at different
// rolls/tiers yields the same key. Used for the TLI same-affix rule (additional
// bonuses of the same affix add together; distinct affixes multiply).
// The +/- sign stays in the key: rolls never flip sign, so "+7% additional
// damage" (bonus affix) and "-5% additional damage" (penalty rider) are
// distinct affixes and must multiply, not sum.
export const affixLineKey = (lineText: string): string =>
  lineText
    .trim()
    .toLowerCase()
    .replace(/\d+(?:\.\d+)?/g, "#");

// parseMod, with each resulting mod stamped with the source line's affixKey.
// Use for player-facing affix text (gear, talents, pactspirits). Do NOT use
// for support skills or engine-generated mods — those are intentionally
// individually-multiplicative.
export const parseModKeyed = (input: string): Mod[] | undefined => {
  const mods = parseMod(input);
  if (mods === undefined) {
    return undefined;
  }
  const affixKey = affixLineKey(input);
  return mods.map((m) => ({ ...m, affixKey }));
};
