import { describe, expect, test } from "vitest";
import { craftDestinyAffix, hasRanges } from "./pactspirit-utils";

describe("craftDestinyAffix", () => {
  test("resolves integer range at midpoint", () => {
    expect(craftDestinyAffix("+(14-18)% Attack Damage", 50)).toBe(
      "+16% Attack Damage",
    );
  });

  test("rounds integer ranges at non-midpoint rolls", () => {
    expect(craftDestinyAffix("+(14-18)% Attack Damage", 33)).toBe(
      "+15% Attack Damage",
    );
  });

  test("resolves decimal ranges to one decimal place", () => {
    expect(craftDestinyAffix("+(5-7.5)% Life Regeneration Speed", 100)).toBe(
      "+7.5% Life Regeneration Speed",
    );
    expect(craftDestinyAffix("+(5-7.5)% Life Regeneration Speed", 50)).toBe(
      "+6.3% Life Regeneration Speed",
    );
  });

  test("resolves signed ranges (penalty destinies)", () => {
    expect(craftDestinyAffix("(-36--30)% Wilt Damage taken", 50)).toBe(
      "-33% Wilt Damage taken",
    );
    expect(craftDestinyAffix("(-36--30)% Wilt Damage taken", 0)).toBe(
      "-36% Wilt Damage taken",
    );
    expect(craftDestinyAffix("(-36--30)% Wilt Damage taken", 100)).toBe(
      "-30% Wilt Damage taken",
    );
  });

  test("resolves multi-line signed ranges", () => {
    expect(
      craftDestinyAffix(
        "(-36--30)% additional Ignite Damage taken\n(-36--30)% Ignite Effect received",
        50,
      ),
    ).toBe("-33% additional Ignite Damage taken\n-33% Ignite Effect received");
  });
});

describe("hasRanges", () => {
  test("detects integer, decimal, and signed ranges", () => {
    expect(hasRanges("+(14-18)% Attack Damage")).toBe(true);
    expect(hasRanges("+(5-7.5)% Life Regeneration Speed")).toBe(true);
    expect(hasRanges("(-55--45)% Numbed Effect received")).toBe(true);
    expect(hasRanges("+16% Attack Damage")).toBe(false);
  });
});
