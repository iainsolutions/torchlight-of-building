import { decodeBuildCode } from "@/src/lib/build-code";
import * as fs from "node:fs";
const code = fs.readFileSync("/tmp/code.txt", "utf8").trim().replace(/\s/g, "");
const data = decodeBuildCode(code);
const d: any = data;
const slots = d.heroPage?.memorySlots ?? {};
console.log("slot keys:", Object.keys(slots));
let totalInt = 0;
for (const k of Object.keys(slots)) {
  const m = slots[k];
  if (!m) continue;
  console.log(`\n-- ${k} (${m.memoryType}) --`);
  console.log(" baseStat:", m.baseStat);
  const intMatch = (m.baseStat ?? "").match(/\+(\d+) Intelligence/);
  if (intMatch) totalInt += parseInt(intMatch[1]);
  console.log(" fixed:", JSON.stringify(m.fixedAffixes));
  console.log(" random:", JSON.stringify(m.randomAffixes));
}
console.log("\n=== Total INT from memory baseStats:", totalInt);
