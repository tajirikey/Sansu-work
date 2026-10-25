import type { MinecraftItem } from "./rewards";

/* ═══════════════════════════════════════════════════════════════
   カービィ シリーズ（16×16 ドット）

   量産のしくみ = 「レイヤー合成」
     からだ（ベース） × いろ（パレット） × ぼうし（コピー能力レイヤー）

   - 新しいいろ   → KIRBY_COLORS に 1 行足すだけ
   - 新しいのうりょく → ABILITIES に ぼうしのドット（上の数行）を足すだけ
   - くみあわせ    → KIRBY_COMBOS に [いろ, のうりょく] を足すだけ
   - 1 体ずつ描くキャラ/アイテム → px16() で 16 行のもじれつを書く
   どのレイヤーも '.' は とうめい。文字はそのレイヤーのパレットの色になる。
   ═══════════════════════════════════════════════════════════════ */

type Rarity = MinecraftItem["rarity"];
type Palette = Record<string, string>;
interface Layer {
  rows: string[];
  palette: Palette;
}

const SIZE = 16;
const SERIES = "kirby";

/** Stack layers top-to-bottom: later layers paint over earlier ones. */
function compose(...layers: Layer[]): string[][] {
  const out = Array.from({ length: SIZE }, () => Array<string>(SIZE).fill(""));
  for (const { rows, palette } of layers) {
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch !== "." && palette[ch]) out[y][x] = palette[ch];
      });
    });
  }
  return out;
}

function item(id: string, name: string, nameJa: string, rarity: Rarity, ...layers: Layer[]): MinecraftItem {
  return { id, name, nameJa, rarity, series: SERIES, pixels: compose(...layers) };
}

/** One-off 16×16 sprite. */
function px16(id: string, name: string, nameJa: string, rarity: Rarity, palette: Palette, rows: string[]): MinecraftItem {
  return item(id, name, nameJa, rarity, { rows, palette });
}

/* ─── からだ ─── */

// o=りんかく b=からだ h=ハイライト s=かげ e=め w=めのひかり u=めのした c=ほっぺ m=くち f/g=あし
const KIRBY_BODY = [
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "...oobbbbbboo...",
  "..obbbbbbbbbbo..",
  ".obbhbbbbbbbbbo.",
  ".obhbbwbbwbbbbo.",
  "obhbbbebbebbbbbo",
  "obbbbbubbubbbbbo",
  "obbbccbmmbccbbbo",
  "obbbbbbbbbbbbbso",
  ".obbbbbbbbbbbso.",
  "..obbbbbbbbsso..",
  ".fffffoooofffff.",
  "..gggg....gggg..",
];

const FACE: Palette = { e: "#1A1640", w: "#FFFFFF", u: "#3B5BDB", m: "#9C1B45" };

interface KirbyColor {
  key: string;
  en: string;
  ja: string;
  rarity: Rarity;
  palette: Palette;
  extra?: Layer; // e.g. sparkles drawn over the body
}

const SPARKLE: Layer = {
  palette: { W: "#FFFFFF", Y: "#FFF3BF" },
  rows: [
    "..............Y.",
    ".............YWY",
    "..W...........Y.",
    ".WWW............",
    "..W.............",
    "................",
    "................",
    "................",
    "................",
    "................",
    "..............W.",
    ".............WWW",
    "..............W.",
  ],
};

const KIRBY_COLORS: KirbyColor[] = [
  { key: "pink", en: "Kirby", ja: "カービィ", rarity: "common",
    palette: { o: "#9C2A5B", b: "#F9A8C9", h: "#FFE1EE", s: "#E77FA8", c: "#FF5C8A", f: "#E2264D", g: "#A3123A" } },
  { key: "yellow", en: "Yellow Kirby", ja: "きいろカービィ", rarity: "uncommon",
    palette: { o: "#B08A00", b: "#FFF08A", h: "#FFFBE0", s: "#F5D547", c: "#FF9F43", f: "#F08C00", g: "#B35F00" } },
  { key: "red", en: "Red Kirby", ja: "あかカービィ", rarity: "uncommon",
    palette: { o: "#8E1B1B", b: "#FF6B6B", h: "#FFC9C9", s: "#E03131", c: "#FFD8A8", f: "#862E2E", g: "#5A1A1A" } },
  { key: "blue", en: "Blue Kirby", ja: "あおカービィ", rarity: "uncommon",
    palette: { o: "#1C3D8C", b: "#74C0FC", h: "#D0EBFF", s: "#4D9DE0", c: "#F783AC", f: "#1971C2", g: "#0B4A8B" } },
  { key: "green", en: "Green Kirby", ja: "みどりカービィ", rarity: "uncommon",
    palette: { o: "#2B6A2F", b: "#8CE99A", h: "#D3F9D8", s: "#51CF66", c: "#FF8787", f: "#2F9E44", g: "#1B5E20" } },
  { key: "purple", en: "Purple Kirby", ja: "むらさきカービィ", rarity: "uncommon",
    palette: { o: "#4B2A85", b: "#B197FC", h: "#E5DBFF", s: "#845EF7", c: "#F783AC", f: "#6741D9", g: "#3B1E8C" } },
  { key: "white", en: "Snow Kirby", ja: "しろカービィ", rarity: "uncommon",
    palette: { o: "#868E96", b: "#F8F9FA", h: "#FFFFFF", s: "#DEE2E6", c: "#FFA8C5", f: "#F06595", g: "#A61E4D" } },
  { key: "orange", en: "Orange Kirby", ja: "オレンジカービィ", rarity: "uncommon",
    palette: { o: "#A0410D", b: "#FFA94D", h: "#FFE8CC", s: "#F76707", c: "#FF6B6B", f: "#D9480F", g: "#8A2E06" } },
  { key: "shadow", en: "Shadow Kirby", ja: "シャドーカービィ", rarity: "rare",
    palette: { o: "#1A1A2E", b: "#6C6F7F", h: "#A5A8B8", s: "#4A4D5C", c: "#8A3D5C", f: "#2B2D3A", g: "#15161F", u: "#FA5252" } },
  { key: "gold", en: "Gold Kirby", ja: "ゴールドカービィ", rarity: "epic",
    palette: { o: "#8F6400", b: "#FFD43B", h: "#FFF9DB", s: "#F59F00", c: "#FF922B", f: "#E67700", g: "#995200" },
    extra: SPARKLE },
];

/* ─── コピー能力（ぼうしレイヤー：上から数行だけ描けばOK） ─── */

interface Ability {
  key: string;
  en: string;
  ja: string;
  rarity: Rarity;
  hat: Layer;
}

const ABILITIES: Ability[] = [
  { key: "fire", en: "Fire", ja: "ファイア", rarity: "uncommon", hat: {
    palette: { R: "#E03131", O: "#FF922B", Y: "#FFE066" },
    rows: [
      ".....R....R.....",
      "...R.RO..ROR.R..",
      "..RORORYRYOROR..",
      "..ROYOYYYYOYOR..",
      "...RYYYYYYYYR...",
    ] } },
  { key: "ice", en: "Ice", ja: "アイス", rarity: "uncommon", hat: {
    palette: { C: "#4FC3F7", D: "#B3E5FC", W: "#FFFFFF" },
    rows: [
      "................",
      ".......CC.......",
      "......CDDC......",
      "..C..CDWWDC..C..",
      "..CDCCDDDDCCDC..",
      "...CCCCCCCCCC...",
    ] } },
  { key: "sword", en: "Sword", ja: "ソード", rarity: "rare", hat: {
    palette: { G: "#43A047", H: "#81C784", Y: "#FDD835" },
    rows: [
      "................",
      "......GGGG......",
      "....GGHGGGGG....",
      "...GGHGGGGGGGG..",
      "..GGGGGGGGGGGGGG",
      "..YYYYYYYYYYYY..",
    ] } },
  { key: "beam", en: "Beam", ja: "ビーム", rarity: "uncommon", hat: {
    palette: { P: "#8E24AA", Q: "#CE93D8", Y: "#FDD835", W: "#FFFFFF" },
    rows: [
      ".Y.....YY.....Y.",
      ".PP....PP....PP.",
      "..PP..PQQP..PP..",
      "..PQPPPQQPPPQP..",
      "...WWWWWWWWWW...",
    ] } },
  { key: "cutter", en: "Cutter", ja: "カッター", rarity: "uncommon", hat: {
    palette: { K: "#FFB300", L: "#FFE082", G: "#2E7D32", H: "#66BB6A" },
    rows: [
      ".....KKKKKK.....",
      "....KLLLLLLK....",
      ".....GGGGGG.....",
      "...GGHGGGGGGG...",
      "..GGGGGGGGGGGG..",
    ] } },
  { key: "sleep", en: "Sleep", ja: "スリープ", rarity: "common", hat: {
    palette: { N: "#3949AB", M: "#7986CB", W: "#FFFFFF", Z: "#90CAF9" },
    rows: [
      ".............ZZZ",
      "......NNNN....Z.",
      "....NNMNNNNN.ZZZ",
      "...NNNNNNNNNNW..",
      "..NNNNNNNNNNNNW.",
      "..WWWWWWWWWWWW..",
    ] } },
  { key: "spark", en: "Spark", ja: "スパーク", rarity: "uncommon", hat: {
    palette: { A: "#00C853", B: "#B9F6CA", Y: "#FFEA00" },
    rows: [
      "...Y...YY...Y...",
      "....Y.AAAA.Y....",
      ".....AABBAA.....",
      "..YY.AAAAAA.YY..",
      "......AAAA......",
    ] } },
  { key: "parasol", en: "Parasol", ja: "パラソル", rarity: "uncommon", hat: {
    palette: { R: "#E53935", W: "#FFFFFF", X: "#6D4C41" },
    rows: [
      "....RRRRRRRR....",
      "..RRWWRRRRWWRR..",
      ".RRRWWRRRRWWRRR.",
      ".......XX.......",
    ] } },
  { key: "cook", en: "Cook", ja: "コック", rarity: "rare", hat: {
    palette: { W: "#FFFFFF", V: "#DEE2E6" },
    rows: [
      ".....WWWWWW.....",
      "...WWWVWWWWWW...",
      "...WWWWWWWVWW...",
      "....WWWWWWWW....",
      "....VVVVVVVV....",
    ] } },
  { key: "ninja", en: "Ninja", ja: "ニンジャ", rarity: "rare", hat: {
    palette: { K: "#283593", R: "#E53935" },
    rows: [
      "................",
      "................",
      "................",
      ".....KKKKKK.....",
      "...KKKKKKKKKK...",
      "..KKKKKKKKKKKK..",
      ".RRRRRRRRRRRRRRR",
      "..............RR",
    ] } },
  { key: "hammer", en: "Hammer", ja: "ハンマー", rarity: "uncommon", hat: {
    palette: { W: "#FFFFFF", R: "#E03131" },
    rows: [
      "................",
      "................",
      "................",
      "................",
      "................",
      "..WWWWWRRWWWWWWW",
      ".WWWWWWRRWWWWWWW",
      "..............WW",
      "..............W.",
    ] } },
  { key: "wing", en: "Wing", ja: "ウィング", rarity: "rare", hat: {
    palette: { E: "#E53935", F: "#FFCA28", G: "#FFB300" },
    rows: [
      "...E..E..E..E...",
      "...EF.EF.EF.EF..",
      "....EFEFEFEFEF..",
      "....GGGGGGGG....",
    ] } },
  { key: "mike", en: "Mike", ja: "マイク", rarity: "rare", hat: {
    palette: { J: "#495057", K: "#ADB5BD" },
    rows: [
      "................",
      "................",
      "................",
      "....JJJJJJJJ....",
      "...J........J...",
      "..J..........J..",
      ".J............J.",
      "JJ............JJ",
      "JK............KJ",
      "JJ............JJ",
      ".J..............",
      "..JK............",
    ] } },
];

/** Rare colour × ability combos. Add a line here to mint a new one. */
const KIRBY_COMBOS: [color: string, ability: string, rarity: Rarity][] = [
  ["gold", "sword", "epic"],
  ["gold", "fire", "epic"],
  ["shadow", "ninja", "epic"],
  ["shadow", "sword", "epic"],
  ["blue", "ice", "rare"],
  ["red", "fire", "rare"],
  ["yellow", "spark", "rare"],
  ["green", "cutter", "rare"],
  ["purple", "beam", "rare"],
  ["white", "sleep", "rare"],
  ["orange", "hammer", "rare"],
];

function kirby(color: KirbyColor, ability?: Ability, rarity?: Rarity): MinecraftItem {
  const body: Layer = { rows: KIRBY_BODY, palette: { ...FACE, ...color.palette } };
  const base = color.extra ? [body, color.extra] : [body];
  if (!ability) return item(`kirby_${color.key}`, color.en, color.ja, color.rarity, ...base);
  const isPink = color.key === "pink";
  const ja = isPink ? `${ability.ja}カービィ` : `${color.ja.replace("カービィ", "")}${ability.ja}カービィ`;
  const en = isPink ? `${ability.en} Kirby` : `${color.en.replace(" Kirby", "")} ${ability.en} Kirby`;
  return item(`kirby_${color.key}_${ability.key}`, en, ja, rarity ?? ability.rarity, ...base, ability.hat);
}

/* ─── ワドルディ（同じ合成のしくみ） ─── */

const WADDLE_BODY = [
  "................",
  "................",
  "................",
  ".....oooooo.....",
  "...oobbbbbboo...",
  "..obbbbbbbbbbo..",
  ".obhttttttttbbo.",
  ".obtttettettbbo.",
  "obbtttettettbbbo",
  "obbtttettettbbbo",
  "obbtcttttttctbbo",
  "obbbttttttttbbso",
  ".obbbbbbbbbbbso.",
  "..obbbbbbbbsso..",
  ".fffffoooofffff.",
  "..gggg....gggg..",
];
const WADDLE_PAL: Palette = {
  o: "#8A3A0C", b: "#F57C00", h: "#FFB74D", s: "#D35400", t: "#FFE0B2",
  e: "#3E2723", c: "#FF8A65", f: "#F9A825", g: "#B07800",
};
const BANDANA: Layer = {
  palette: { B: "#1C7ED6", D: "#74C0FC" },
  rows: [
    "................",
    "................",
    "................",
    ".....BBBBBB.....",
    "...BBDBBBDBBB...",
    "..BBBBBBBBBBBBBB",
    ".............B.B",
  ],
};
// Waddle Doo: paint the face over with body colour + one big eye
const DOO_EYE: Layer = {
  palette: { b: "#E8590C", W: "#FFFFFF", E: "#1A1640", L: "#4DABF7" },
  rows: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "...bbbbbbbbbb...",
    "...bbbWWWWbbb...",
    "...bbWWEEWWbb...",
    "...bbWWEEWWbb...",
    "...bbbWLLWbbb...",
    "...bbbbbbbbbb...",
  ],
};
const WADDLE_BASE: Layer = { rows: WADDLE_BODY, palette: WADDLE_PAL };

/* ─── ポイントスター（パレットちがいで量産） ─── */

const STAR = [
  ".......YS.......",
  ".......YS.......",
  "......YYYS......",
  "......YhYS......",
  ".....YYhYYS.....",
  "YYYYYYYhYYYYYYYS",
  ".YYYYYhYYYYYYYS.",
  "..YYYYYYYYYYYS..",
  "...YYYYYYYYYS...",
  "....YYYYYYYS....",
  "....YYYYYYYS....",
  "...YYYYYYYYYS...",
  "...YYYS..YYYS...",
  "..YYYS....YYYS..",
  "..YYS......YYS..",
  ".YS..........YS.",
];
const STAR_COLORS: [key: string, ja: string, rarity: Rarity, palette: Palette][] = [
  ["yellow", "きいろポイントスター", "common", { Y: "#FFD43B", h: "#FFF9DB", S: "#F08C00" }],
  ["green", "みどりポイントスター", "common", { Y: "#69DB7C", h: "#EBFBEE", S: "#2B8A3E" }],
  ["blue", "あおポイントスター", "uncommon", { Y: "#4DABF7", h: "#E7F5FF", S: "#1864AB" }],
  ["red", "あかポイントスター", "uncommon", { Y: "#FF6B6B", h: "#FFF5F5", S: "#C92A2A" }],
];
const WARP_TRAIL: Layer = {
  palette: { P: "#F783AC", B: "#74C0FC", G: "#8CE99A" },
  rows: [
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "................",
    "P...............",
    "PP..............",
    "BPP.............",
    "BB..............",
    "GB..............",
    "G...............",
  ],
};

/* ═══ 組み立て ═══ */

const colorByKey = Object.fromEntries(KIRBY_COLORS.map((c) => [c.key, c]));
const abilityByKey = Object.fromEntries(ABILITIES.map((a) => [a.key, a]));
const pink = colorByKey.pink;

export const KIRBY_ITEMS: MinecraftItem[] = [
  // いろちがい
  ...KIRBY_COLORS.map((c) => kirby(c)),
  // コピー能力
  ...ABILITIES.map((a) => kirby(pink, a)),
  // レアなくみあわせ
  ...KIRBY_COMBOS.map(([c, a, r]) => kirby(colorByKey[c], abilityByKey[a], r)),

  // ワドルディ なかま
  item("waddle_dee", "Waddle Dee", "ワドルディ", "common", WADDLE_BASE),
  item("bandana_dee", "Bandana Waddle Dee", "バンダナワドルディ", "rare", WADDLE_BASE, BANDANA),
  item("waddle_doo", "Waddle Doo", "ワドルドゥ", "uncommon", WADDLE_BASE, DOO_EYE),

  // ポイントスター
  ...STAR_COLORS.map(([key, ja, rarity, palette]) =>
    px16(`point_star_${key}`, `Point Star (${key})`, ja, rarity, palette, STAR)),
  item("warp_star", "Warp Star", "ワープスター", "epic",
    { rows: STAR, palette: { Y: "#FFE066", h: "#FFFFFF", S: "#FAB005" } }, WARP_TRAIL),

  // ともだち・ボス
  px16("gordo", "Gordo", "ゴルドー", "uncommon",
    { o: "#2B2A4C", b: "#5C5A8A", h: "#8E8CC0", s: "#3F3D6B", w: "#FFFFFF", e: "#111111", S: "#D0D4DC" }, [
    ".......SS.......",
    ".S.....SS.....S.",
    "..S..oooooo..S..",
    "...SobbbbbboS...",
    "...obhbbbbbbo...",
    "..obbwwbbwwbbo..",
    "SSobbwebbewbboSS",
    "SSobbwebbewbboSS",
    "..obbbbbbbbbbo..",
    "..obbbbbbbbsbo..",
    "...obbbbbbbso...",
    "...SobbbbbboS...",
    "..S..oooooo..S..",
    ".S.....SS.....S.",
    ".......SS.......",
    "................",
  ]),
  px16("meta_knight", "Meta Knight", "メタナイト", "epic",
    { M: "#C5CCD6", H: "#F1F3F5", V: "#1B1B2F", Y: "#FFD43B", C: "#4B3F8C", B: "#2C3E8C", P: "#7B2D8E" }, [
    "................",
    ".....MMMMMM.....",
    "...MMMHMMMMMM...",
    "..MMHMMMMMMMMM..",
    "CCMMVVVVVVVVMMCC",
    "CCMVVYYVVYYVVMCC",
    "CCMVVYYVVYYVVMCC",
    "CCMMVVVVVVVVMMCC",
    "CCMMMMMMMMMMMMCC",
    "CCCBMMMMMMMMBCCC",
    "CCCBBBBBBBBBBCCC",
    "CCCBBBBBBBBBBCCC",
    ".CCCBBBBBBBBCCC.",
    "..CC.BBBBBB.CC..",
    "....PPP..PPP....",
    "...PPPP..PPPP...",
  ]),
  px16("king_dedede", "King Dedede", "デデデだいおう", "epic",
    { R: "#D6336C", W: "#FFFFFF", B: "#4C8DF6", o: "#1E3A8A", k: "#111111", Y: "#FFC53D", K: "#FFD43B", F: "#F59F00" }, [
    "......RRRR......",
    "....RRRRRRRR....",
    "...RRRRRRRRRR...",
    "...WWWWWWWWWW...",
    "..oBBBBBBBBBBo..",
    ".oBBWWBBBBWWBBo.",
    ".oBBWkBBBBkWBBo.",
    ".oBBBBYYYYBBBBo.",
    ".oBBBYYYYYYBBBo.",
    "..oBBBYYYYBBBo..",
    ".RRRoBBBBBBoRRR.",
    "RRRRRRKKKKRRRRRR",
    ".RRRWWWWWWWWRRR.",
    "..RRWWWWWWWWRR..",
    "...FFFF..FFFF...",
    "..FFFFF..FFFFF..",
  ]),
  px16("kracko", "Kracko", "クラッコ", "rare",
    { C: "#DEE2E6", s: "#ADB5BD", W: "#FFFFFF", E: "#4C6EF5", S: "#FFD43B", Y: "#FFE066" }, [
    "................",
    "...S...SS...S...",
    ".....CCCCCC.....",
    "..CCCCCCCCCCCC..",
    ".CCCCCCCCCCCCCC.",
    "CCCCCWWWWWWCCCCC",
    "CCCCWWWEEWWWCCCC",
    "CCCCWWWEEWWWCCCC",
    "CCCCCWWWWWWCCCCC",
    ".CCCCCCCCCCCCCC.",
    "..CCsCCCCCCsCC..",
    "...sssCCCCsss...",
    "....S..S..S..S..",
    ".......Y........",
    "......YY........",
    ".......Y........",
  ]),
  px16("whispy_woods", "Whispy Woods", "ウィスピーウッズ", "rare",
    { G: "#51CF66", H: "#B2F2BB", R: "#FA5252", T: "#9C6B3E", e: "#3E2410", g: "#2F9E44" }, [
    "....GGGGGGGG....",
    "..GGGHGGGGGGGG..",
    ".GGHGGGGGGGGGGG.",
    ".GGGGGGGRGGGGGG.",
    "..GGRGGGGGGGGG..",
    "....TTTTTTTT....",
    "....TTTTTTTT....",
    "....TeTTTTeT....",
    "....TeTTTTeT....",
    "....TTTTTTTT....",
    "....TTTeeTTT....",
    "....TTTeeTTT....",
    "....TTTTTTTT....",
    "...TTTTTTTTTT...",
    "..TT.TT..TT.TT..",
    "gggggggggggggggg",
  ]),

  // たべもの・どうぐ
  px16("maxim_tomato", "Maxim Tomato", "マキシムトマト", "rare",
    { o: "#7A0E1E", R: "#E8263E", h: "#FF8A9A", s: "#B5122A", W: "#FFFFFF", L: "#2F9E44" }, [
    "................",
    "................",
    ".....LL..LL.....",
    "...LLLLLLLLLL...",
    "..oRRLLLLLLRRo..",
    ".oRRhhRRRRRRRRo.",
    "oRRhhRRRRRRRRRRo",
    "oRhRWRRRRRWRRRRo",
    "oRRRWWRRRWWRRRRo",
    "oRRRWRWRWRWRRRso",
    "oRRRWRRWRRWRRRso",
    "oRRRWRRRRRWRRsso",
    ".oRRRRRRRRRRsso.",
    "..oRRRRRRRRsso..",
    "...oossssssoo...",
    "................",
  ]),
  px16("invincible_candy", "Invincible Candy", "むてきキャンディ", "epic",
    { o: "#5F3DC4", A: "#FF6B9E", B: "#FFD43B", C: "#69DB7C", D: "#4DABF7", W: "#FFFFFF", T: "#E9ECEF" }, [
    "................",
    ".....oooooo.....",
    "...ooAAAAAAoo...",
    "..oAABBBBBBAAo..",
    "..oABBCCCCBBAo..",
    ".oABBCCDDCCBBAo.",
    ".oABCCDWWDCCBAo.",
    ".oABCCDWWDCCBAo.",
    ".oABBCCDDCCBBAo.",
    "..oABBCCCCBBAo..",
    "..oAABBBBBBAAo..",
    "...ooAAAAAAoo...",
    ".....ooTToo.....",
    ".......TT.......",
    ".......TT.......",
    ".......TT.......",
  ]),
  px16("shortcake", "Strawberry Shortcake", "ショートケーキ", "uncommon",
    { G: "#2F9E44", R: "#E03131", h: "#FF8787", C: "#FFFFFF", W: "#FFDEEB", S: "#FFE8A3", s: "#F2C66D", P: "#E7F5FF", p: "#A5D8FF" }, [
    "................",
    "................",
    ".......GG.......",
    "......RRRR......",
    "......RhRR......",
    "..CCCCCCCCCCCC..",
    ".CCWCCCWCCCWCCC.",
    ".SSSSSSSSSSSSSS.",
    ".SSSSSSSSSSSSSS.",
    ".CCRCCCRCCCRCCC.",
    ".SSSSSSSSSSSSSS.",
    ".SSSSSSSSSSSSSS.",
    ".ssssssssssssss.",
    "PPPPPPPPPPPPPPPP",
    ".pppppppppppppp.",
    "................",
  ]),
  px16("star_rod", "Star Rod", "スターロッド", "epic",
    { Y: "#FFD43B", h: "#FFF3BF", P: "#F06595", W: "#FFFFFF", K: "#FAB005" }, [
    "...........Y....",
    "..........YYY...",
    "........YYYYYYY.",
    ".........YYhYY..",
    ".........YY.YY..",
    "........P.......",
    ".......PW.......",
    "......WP........",
    ".....PW.........",
    "....WP..........",
    "...PW...........",
    "..WP............",
    ".PW.............",
    "KK..............",
    "................",
    "................",
  ]),
];
