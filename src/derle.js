// Veri dosyalarını doğrular ve ../veri.json olarak yazar.
// Kullanım: node src/derle.js
const fs = require("fs");
const path = require("path");

const filozoflar = require("./veri-filozoflar.js").map(x => ({ ...x, t: "f" }));
const akimlar = require("./veri-akimlar.js").map(x => ({ ...x, t: "a" }));
const kavramlar = require("./veri-kavramlar.js").map(x => ({ ...x, t: "k" }));
const baglarMetni = require("./veri-baglar.js");

const ILISKILER = ["hoca", "etkiledi", "elestirdi", "temsil", "kurdu", "gelistirdi", "dogurdu", "karsi", "kavram", "ilgili"];
const DONEMLER = ["dogu", "antik", "helenistik", "ortacag", "islam", "ronesans", "modern", "aydinlanma", "ondokuz", "yirmi"];

const hatalar = [];
const varliklar = [...filozoflar, ...akimlar, ...kavramlar];
const idler = new Map();
for (const v of varliklar) {
  if (idler.has(v.id)) hatalar.push(`Yinelenen id: ${v.id}`);
  idler.set(v.id, v);
  if (!DONEMLER.includes(v.e)) hatalar.push(`Bilinmeyen dönem: ${v.id} → ${v.e}`);
  if (!v.n || !v.s) hatalar.push(`Eksik ad/özet: ${v.id}`);
}

const baglar = [];
const gorulen = new Set();
baglarMetni.split("\n").forEach((satir, no) => {
  satir = satir.trim();
  if (!satir || satir.startsWith("#")) return;
  const [a, r, b, ...fazla] = satir.split(/\s+/);
  if (fazla.length || !b) return hatalar.push(`Satır ${no + 1} biçimsiz: ${satir}`);
  if (!ILISKILER.includes(r)) return hatalar.push(`Satır ${no + 1} bilinmeyen ilişki: ${r}`);
  if (!idler.has(a)) return hatalar.push(`Satır ${no + 1} bilinmeyen kaynak: ${a}`);
  if (!idler.has(b)) return hatalar.push(`Satır ${no + 1} bilinmeyen hedef: ${b}`);
  const anahtar = `${a}|${r}|${b}`;
  if (gorulen.has(anahtar)) return hatalar.push(`Yinelenen bağ: ${satir}`);
  gorulen.add(anahtar);
  baglar.push([a, r, b]);
});

const bagsiz = varliklar.filter(v => !baglar.some(([a, , b]) => a === v.id || b === v.id)).map(v => v.id);
if (bagsiz.length) console.warn("Uyarı, bağı olmayan kayıtlar:", bagsiz.join(", "));

if (hatalar.length) {
  console.error(hatalar.join("\n"));
  process.exit(1);
}

const cikti = { surum: 1, varliklar, baglar };
fs.writeFileSync(path.join(__dirname, "..", "veri.json"), JSON.stringify(cikti));
console.log(`Tamam: ${filozoflar.length} filozof, ${akimlar.length} akım, ${kavramlar.length} kavram, ${baglar.length} bağ.`);
