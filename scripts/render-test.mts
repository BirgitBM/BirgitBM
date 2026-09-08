import { reelRendern } from "../src/lib/render/ffmpeg";
import { zeitleisteBauen, clipsVerteilen, textUmbrechen, zeitfensterLesen } from "../src/lib/render/timeline";

const SP = process.argv[2];

// Zeitfenster-Erkennung in allen Schreibweisen, die im Dashboard vorkommen
console.log("--- Zeitfenster lesen ---");
for (const z of ["0:00–0:03", "3:00-10:00", "0-3s", "10-15", "12-18s", "1:05–1:20", "quatsch", "5-2"]) {
  console.log(`  "${z}" ->`, JSON.stringify(zeitfensterLesen(z)));
}

console.log("--- Textumbruch ---");
console.log(" ", textUmbrechen("Der teuerste Wirkstoff bringt nichts, wenn die Hautbarriere gestört ist"));

// Reel wie aus dem Dashboard: 0-3, 3-10, 10-15 (ihr Beispiel), also 15 Sekunden
const overlays = [
  { zeit: "0:00–0:03", text: "Microneedling ≠ Microneedling" },
  { zeit: "0:03–0:10", text: "Spiculae lösen sich im Gewebe auf und wirken anders" },
  { zeit: "0:10–0:15", text: "Das bedeutet für deine Behandlung: weniger Ausfallzeit" },
];

const { segmente, gesamtdauer, uebersprungen } = zeitleisteBauen(overlays);
console.log("--- Zeitleiste ---");
console.log("  Segmente:", segmente);
console.log("  Gesamtdauer:", gesamtdauer, "Sekunden");
console.log("  Übersprungen:", uebersprungen);
console.log("  Clipverteilung (2 Clips):", clipsVerteilen(2, segmente, gesamtdauer));

console.log("--- Rendern ---");
const start = Date.now();
const ergebnis = await reelRendern({
  clips: [{ pfad: `${SP}/render/clipA.mp4` }, { pfad: `${SP}/render/clipB.mp4` }],
  overlays,
  ziel: `${SP}/render/reel.mp4`,
});
console.log("  Ergebnis:", ergebnis);
console.log("  Dauer des Renderns:", ((Date.now() - start) / 1000).toFixed(1), "Sekunden");
