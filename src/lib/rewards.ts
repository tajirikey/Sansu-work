export interface MinecraftItem {
  id: string;
  name: string;
  nameJa: string;
  rarity: "common" | "uncommon" | "rare" | "epic";
  pixels: string[][]; // 8x8 pixel art grid with hex colors
}

const ITEMS: MinecraftItem[] = [
  {
    id: "diamond",
    name: "Diamond",
    nameJa: "ダイヤモンド",
    rarity: "epic",
    pixels: [
      ["", "", "", "#7DF9FF", "#7DF9FF", "", "", ""],
      ["", "", "#7DF9FF", "#B5F4FF", "#B5F4FF", "#7DF9FF", "", ""],
      ["", "#4DD0E1", "#7DF9FF", "#B5F4FF", "#B5F4FF", "#7DF9FF", "#4DD0E1", ""],
      ["#4DD0E1", "#26C6DA", "#4DD0E1", "#7DF9FF", "#7DF9FF", "#4DD0E1", "#26C6DA", "#4DD0E1"],
      ["#4DD0E1", "#26C6DA", "#4DD0E1", "#4DD0E1", "#4DD0E1", "#4DD0E1", "#26C6DA", "#4DD0E1"],
      ["", "#00ACC1", "#26C6DA", "#26C6DA", "#26C6DA", "#26C6DA", "#00ACC1", ""],
      ["", "", "#00ACC1", "#00838F", "#00838F", "#00ACC1", "", ""],
      ["", "", "", "#00838F", "#00838F", "", "", ""],
    ],
  },
  {
    id: "gold_ingot",
    name: "Gold Ingot",
    nameJa: "きんのインゴット",
    rarity: "rare",
    pixels: [
      ["", "", "", "", "", "", "", ""],
      ["", "", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "", ""],
      ["", "#FFD700", "#FFF176", "#FFF176", "#FFF176", "#FFD700", "#FFD700", ""],
      ["#FFD700", "#FFF176", "#FFF176", "#FFF176", "#FFF176", "#FFF176", "#FFD700", ""],
      ["#FFD700", "#FFC107", "#FFF176", "#FFF176", "#FFF176", "#FFC107", "#FFD700", ""],
      ["#FFD700", "#FFC107", "#FFC107", "#FFC107", "#FFC107", "#FFC107", "#FFD700", ""],
      ["", "#DAA520", "#DAA520", "#DAA520", "#DAA520", "#DAA520", "", ""],
      ["", "", "", "", "", "", "", ""],
    ],
  },
  {
    id: "iron_sword",
    name: "Iron Sword",
    nameJa: "てつのけん",
    rarity: "uncommon",
    pixels: [
      ["", "", "", "", "", "", "#C0C0C0", ""],
      ["", "", "", "", "", "#C0C0C0", "#E0E0E0", ""],
      ["", "", "", "", "#C0C0C0", "#E0E0E0", "", ""],
      ["", "", "", "#C0C0C0", "#E0E0E0", "", "", ""],
      ["", "#8B4513", "#C0C0C0", "#E0E0E0", "", "", "", ""],
      ["", "#8B4513", "#8B4513", "", "", "", "", ""],
      ["", "", "#8B4513", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
    ],
  },
  {
    id: "pickaxe",
    name: "Iron Pickaxe",
    nameJa: "てつのつるはし",
    rarity: "uncommon",
    pixels: [
      ["", "#C0C0C0", "#C0C0C0", "#C0C0C0", "", "", "", ""],
      ["", "#C0C0C0", "#E0E0E0", "#C0C0C0", "#8B4513", "", "", ""],
      ["", "", "", "#8B4513", "#8B4513", "", "", ""],
      ["", "", "#8B4513", "", "", "#8B4513", "", ""],
      ["", "#8B4513", "", "", "", "", "", ""],
      ["#8B4513", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
    ],
  },
  {
    id: "emerald",
    name: "Emerald",
    nameJa: "エメラルド",
    rarity: "rare",
    pixels: [
      ["", "", "", "#50C878", "#50C878", "", "", ""],
      ["", "", "#50C878", "#76EE9A", "#76EE9A", "#50C878", "", ""],
      ["", "#3CB371", "#50C878", "#76EE9A", "#76EE9A", "#50C878", "#3CB371", ""],
      ["#3CB371", "#2E8B57", "#3CB371", "#50C878", "#50C878", "#3CB371", "#2E8B57", "#3CB371"],
      ["#3CB371", "#2E8B57", "#3CB371", "#3CB371", "#3CB371", "#3CB371", "#2E8B57", "#3CB371"],
      ["", "#228B22", "#2E8B57", "#2E8B57", "#2E8B57", "#2E8B57", "#228B22", ""],
      ["", "", "#228B22", "#1B5E20", "#1B5E20", "#228B22", "", ""],
      ["", "", "", "#1B5E20", "#1B5E20", "", "", ""],
    ],
  },
  {
    id: "apple",
    name: "Apple",
    nameJa: "リンゴ",
    rarity: "common",
    pixels: [
      ["", "", "", "#5D4037", "", "", "", ""],
      ["", "", "", "#4CAF50", "#5D4037", "", "", ""],
      ["", "", "#F44336", "#F44336", "#F44336", "#F44336", "", ""],
      ["", "#F44336", "#EF5350", "#FF8A80", "#F44336", "#F44336", "#F44336", ""],
      ["", "#F44336", "#EF5350", "#F44336", "#F44336", "#E53935", "#F44336", ""],
      ["", "#F44336", "#E53935", "#F44336", "#E53935", "#C62828", "#E53935", ""],
      ["", "", "#C62828", "#E53935", "#C62828", "#C62828", "", ""],
      ["", "", "", "#C62828", "#C62828", "", "", ""],
    ],
  },
  {
    id: "tnt",
    name: "TNT",
    nameJa: "ティーエヌティー",
    rarity: "uncommon",
    pixels: [
      ["#F44336", "#F44336", "#F44336", "#F44336", "#F44336", "#F44336", "#F44336", "#F44336"],
      ["#F44336", "#EF5350", "#EF5350", "#EF5350", "#EF5350", "#EF5350", "#EF5350", "#F44336"],
      ["#B71C1C", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#B71C1C"],
      ["#B71C1C", "#fff", "#333", "#333", "#333", "#333", "#fff", "#B71C1C"],
      ["#B71C1C", "#fff", "#333", "#333", "#333", "#333", "#fff", "#B71C1C"],
      ["#B71C1C", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#B71C1C"],
      ["#F44336", "#D32F2F", "#D32F2F", "#D32F2F", "#D32F2F", "#D32F2F", "#D32F2F", "#F44336"],
      ["#F44336", "#F44336", "#F44336", "#F44336", "#F44336", "#F44336", "#F44336", "#F44336"],
    ],
  },
  {
    id: "creeper_head",
    name: "Creeper Head",
    nameJa: "クリーパーのあたま",
    rarity: "rare",
    pixels: [
      ["#4CAF50", "#4CAF50", "#4CAF50", "#4CAF50", "#4CAF50", "#4CAF50", "#4CAF50", "#4CAF50"],
      ["#4CAF50", "#1B5E20", "#1B5E20", "#4CAF50", "#4CAF50", "#1B5E20", "#1B5E20", "#4CAF50"],
      ["#4CAF50", "#1B5E20", "#1B5E20", "#4CAF50", "#4CAF50", "#1B5E20", "#1B5E20", "#4CAF50"],
      ["#4CAF50", "#4CAF50", "#4CAF50", "#1B5E20", "#1B5E20", "#4CAF50", "#4CAF50", "#4CAF50"],
      ["#4CAF50", "#4CAF50", "#1B5E20", "#1B5E20", "#1B5E20", "#1B5E20", "#4CAF50", "#4CAF50"],
      ["#4CAF50", "#4CAF50", "#1B5E20", "#1B5E20", "#1B5E20", "#1B5E20", "#4CAF50", "#4CAF50"],
      ["#4CAF50", "#4CAF50", "#1B5E20", "#4CAF50", "#4CAF50", "#1B5E20", "#4CAF50", "#4CAF50"],
      ["#388E3C", "#388E3C", "#388E3C", "#388E3C", "#388E3C", "#388E3C", "#388E3C", "#388E3C"],
    ],
  },
  {
    id: "ender_pearl",
    name: "Ender Pearl",
    nameJa: "エンダーパール",
    rarity: "epic",
    pixels: [
      ["", "", "#1A237E", "#1A237E", "#1A237E", "#1A237E", "", ""],
      ["", "#1A237E", "#283593", "#3F51B5", "#3F51B5", "#283593", "#1A237E", ""],
      ["#1A237E", "#283593", "#7986CB", "#9FA8DA", "#3F51B5", "#283593", "#283593", "#1A237E"],
      ["#1A237E", "#3F51B5", "#9FA8DA", "#C5CAE9", "#7986CB", "#3F51B5", "#283593", "#1A237E"],
      ["#1A237E", "#283593", "#3F51B5", "#7986CB", "#3F51B5", "#283593", "#1A237E", "#1A237E"],
      ["#1A237E", "#283593", "#283593", "#283593", "#283593", "#1A237E", "#1A237E", "#1A237E"],
      ["", "#1A237E", "#1A237E", "#283593", "#1A237E", "#1A237E", "#1A237E", ""],
      ["", "", "#1A237E", "#1A237E", "#1A237E", "#1A237E", "", ""],
    ],
  },
  {
    id: "cake",
    name: "Cake",
    nameJa: "ケーキ",
    rarity: "common",
    pixels: [
      ["", "", "", "", "", "", "", ""],
      ["", "#F44336", "", "#F44336", "", "#F44336", "", ""],
      ["", "#FFEB3B", "#FFEB3B", "#FFEB3B", "#FFEB3B", "#FFEB3B", "#FFEB3B", ""],
      ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
      ["#fff", "#FFCCBC", "#fff", "#fff", "#FFCCBC", "#fff", "#fff", "#FFCCBC"],
      ["#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff", "#fff"],
      ["#8D6E63", "#8D6E63", "#8D6E63", "#8D6E63", "#8D6E63", "#8D6E63", "#8D6E63", "#8D6E63"],
      ["", "", "", "", "", "", "", ""],
    ],
  },
  {
    id: "bow",
    name: "Bow",
    nameJa: "ゆみ",
    rarity: "uncommon",
    pixels: [
      ["", "", "#8B4513", "#8B4513", "", "", "", ""],
      ["", "#8B4513", "", "", "#ccc", "", "", ""],
      ["#8B4513", "", "", "", "", "#ccc", "", ""],
      ["#8B4513", "", "", "", "", "", "#ccc", ""],
      ["#8B4513", "", "", "", "", "#ccc", "", ""],
      ["", "#8B4513", "", "", "#ccc", "", "", ""],
      ["", "", "#8B4513", "#8B4513", "", "", "", ""],
      ["", "", "", "", "", "", "", ""],
    ],
  },
  {
    id: "golden_apple",
    name: "Golden Apple",
    nameJa: "きんのリンゴ",
    rarity: "epic",
    pixels: [
      ["", "", "", "#5D4037", "", "", "", ""],
      ["", "", "", "#4CAF50", "#5D4037", "", "", ""],
      ["", "", "#FFD700", "#FFD700", "#FFD700", "#FFD700", "", ""],
      ["", "#FFD700", "#FFF176", "#FFF9C4", "#FFD700", "#FFD700", "#FFD700", ""],
      ["", "#FFD700", "#FFF176", "#FFD700", "#FFD700", "#FFC107", "#FFD700", ""],
      ["", "#FFD700", "#FFC107", "#FFD700", "#FFC107", "#FF8F00", "#FFC107", ""],
      ["", "", "#FF8F00", "#FFC107", "#FF8F00", "#FF8F00", "", ""],
      ["", "", "", "#FF8F00", "#FF8F00", "", "", ""],
    ],
  },
];

const STORAGE_KEY = "sansu-collected-items";

export function getCollectedItems(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function addCollectedItem(itemId: string): void {
  const collected = getCollectedItems();
  if (!collected.includes(itemId)) {
    collected.push(itemId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collected));
  }
}

export function getRandomUncollectedItem(): MinecraftItem | null {
  const collected = getCollectedItems();
  const uncollected = ITEMS.filter((item) => !collected.includes(item.id));
  if (uncollected.length === 0) return null;
  return uncollected[Math.floor(Math.random() * uncollected.length)];
}

export function getAllItems(): MinecraftItem[] {
  return ITEMS;
}

export function getItemById(id: string): MinecraftItem | undefined {
  return ITEMS.find((item) => item.id === id);
}
