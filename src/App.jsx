import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const MAX_CITADEL_LEVEL = 50;
const MAX_HERO_LEVEL = 100;
const MAX_PARAGON_LEVEL = 250;

const LOCAL_KEY = "s_fleet_fantasy_war_local_save_v10";

const CLASSES = {
  Knight: {
    emoji: "🛡️",
    title: "Knight",
    description: "Tank puternic, viață mare și apărare solidă.",
    base: { hp: 160, attack: 18, defense: 12, mana: 35 },
    skill: { name: "Shield Break", cost: 12, power: 1.75 }
  },
  Mage: {
    emoji: "✨",
    title: "Mage",
    description: "Damage magic mare, dar mai puțină apărare.",
    base: { hp: 110, attack: 27, defense: 5, mana: 75 },
    skill: { name: "Arcane Burst", cost: 18, power: 2.1 }
  },
  Archer: {
    emoji: "🏹",
    title: "Archer",
    description: "Clasă echilibrată cu atac rapid și critic bun.",
    base: { hp: 130, attack: 22, defense: 8, mana: 52 },
    skill: { name: "Rain Arrow", cost: 15, power: 1.9 }
  }
};

const BUILDINGS = {
  citadel: {
    emoji: "🏰",
    name: "Citadel",
    description: "Inima regatului. Crește HP, defense și power.",
    baseCost: { gold: 120, wood: 80, crystals: 10 }
  },
  barracks: {
    emoji: "⚔️",
    name: "Barracks",
    description: "Antrenează soldați. Crește atacul eroului.",
    baseCost: { gold: 95, wood: 55, crystals: 8 }
  },
  mine: {
    emoji: "⛏️",
    name: "Gold Mine",
    description: "Produce aur și ajută economia regatului.",
    baseCost: { gold: 75, wood: 45, crystals: 5 }
  },
  lumber: {
    emoji: "🪓",
    name: "Wood Collector",
    description: "Strânge lemn pentru construcții. Funcționează ca Gold Mine, dar pentru wood.",
    baseCost: { gold: 85, wood: 35, crystals: 6 }
  },
  academy: {
    emoji: "🔮",
    name: "Arcane Academy",
    description: "Crește mana și puterea magică.",
    baseCost: { gold: 110, wood: 65, crystals: 12 }
  },
  wall: {
    emoji: "🧱",
    name: "Protection Wall",
    description: "Zidul de protecție apără orașul când alți jucători trimit atacuri.",
    baseCost: { gold: 180, wood: 220, crystals: 18 }
  },
  watchtower: {
    emoji: "🗼",
    name: "Observation Tower",
    description: "Turnul de observație arată atacurile care ajung spre orașul tău.",
    baseCost: { gold: 150, wood: 130, crystals: 22 }
  }
};

const ENEMIES = [
  { name: "Goblin Raider", emoji: "🧌", hp: 95, attack: 14, defense: 3, reward: { gold: 70, wood: 25, crystals: 5, xp: 35 } },
  { name: "Dark Wolf", emoji: "🐺", hp: 120, attack: 17, defense: 4, reward: { gold: 95, wood: 35, crystals: 7, xp: 48 } },
  { name: "Skeleton Captain", emoji: "💀", hp: 150, attack: 21, defense: 7, reward: { gold: 135, wood: 45, crystals: 10, xp: 70 } },
  { name: "Infernal Brute", emoji: "🔥", hp: 195, attack: 28, defense: 10, reward: { gold: 210, wood: 70, crystals: 18, xp: 105 } }
];


const WORLD_ZONES = [
  {
    id: "goblin_forest",
    name: "Goblin Forest",
    emoji: "🌲",
    level: 1,
    energyCost: 1,
    dropChance: 0.70,
    rarityBoost: 0,
    rewardMultiplier: 1,
    description: "Pădure de început, bună pentru gold, XP și primele iteme.",
    enemies: [
      { name: "Goblin Scout", emoji: "🧌", hp: 90, attack: 13, defense: 3, reward: { gold: 68, wood: 28, crystals: 5, xp: 34 } },
      { name: "Forest Thief", emoji: "🗡️", hp: 105, attack: 15, defense: 4, reward: { gold: 82, wood: 32, crystals: 6, xp: 42 } }
    ],
    boss: { name: "Goblin King", emoji: "👑", hp: 185, attack: 24, defense: 9, reward: { gold: 260, wood: 105, crystals: 22, xp: 130 } }
  },
  {
    id: "wolf_valley",
    name: "Dark Wolves Valley",
    emoji: "🐺",
    level: 3,
    energyCost: 2,
    dropChance: 0.76,
    rarityBoost: 1,
    rewardMultiplier: 1.25,
    description: "Vale periculoasă cu lupi rapizi și drop-uri Rare mai dese.",
    enemies: [
      { name: "Dark Wolf", emoji: "🐺", hp: 135, attack: 20, defense: 5, reward: { gold: 112, wood: 42, crystals: 9, xp: 62 } },
      { name: "Alpha Stalker", emoji: "🌘", hp: 160, attack: 23, defense: 7, reward: { gold: 132, wood: 48, crystals: 11, xp: 75 } }
    ],
    boss: { name: "Fenrir Shade", emoji: "🐺", hp: 285, attack: 34, defense: 13, reward: { gold: 430, wood: 150, crystals: 42, xp: 220 } }
  },
  {
    id: "skeleton_crypt",
    name: "Skeleton Crypt",
    emoji: "💀",
    level: 5,
    energyCost: 2,
    dropChance: 0.82,
    rarityBoost: 2,
    rewardMultiplier: 1.55,
    description: "Criptă întunecată pentru jucători cu echipament mai bun. Epic poate pica mai des.",
    enemies: [
      { name: "Bone Soldier", emoji: "💀", hp: 175, attack: 27, defense: 10, reward: { gold: 165, wood: 55, crystals: 16, xp: 95 } },
      { name: "Crypt Necromancer", emoji: "🪄", hp: 155, attack: 32, defense: 8, reward: { gold: 185, wood: 62, crystals: 18, xp: 110 } }
    ],
    boss: { name: "Lich Commander", emoji: "☠️", hp: 380, attack: 45, defense: 18, reward: { gold: 720, wood: 220, crystals: 75, xp: 360 } }
  },
  {
    id: "infernal_gate",
    name: "Infernal Gate",
    emoji: "🔥",
    level: 8,
    energyCost: 3,
    dropChance: 0.90,
    rarityBoost: 3,
    rewardMultiplier: 2.0,
    description: "Zona grea pentru Legendary drops, boss puternic și reward mare.",
    enemies: [
      { name: "Infernal Brute", emoji: "🔥", hp: 240, attack: 40, defense: 15, reward: { gold: 250, wood: 80, crystals: 30, xp: 150 } },
      { name: "Demon Guard", emoji: "😈", hp: 290, attack: 46, defense: 19, reward: { gold: 310, wood: 95, crystals: 36, xp: 185 } }
    ],
    boss: { name: "Astaroth Flame Lord", emoji: "👹", hp: 620, attack: 68, defense: 28, reward: { gold: 1250, wood: 320, crystals: 145, xp: 720 } }
  }
];

const SLOTS = {
  weapon: { label: "Weapon", emoji: "⚔️" },
  armor: { label: "Armor", emoji: "🛡️" },
  ring: { label: "Ring", emoji: "💍" },
  amulet: { label: "Amulet", emoji: "📿" }
};

const RARITIES = {
  Common: { mult: 1, weight: 58 },
  Rare: { mult: 1.45, weight: 27 },
  Epic: { mult: 2.05, weight: 12 },
  Legendary: { mult: 3, weight: 3 }
};

const ITEM_NAMES = {
  weapon: ["Iron Blade", "Hunter Bow", "Arcane Staff", "War Axe", "Citadel Saber"],
  armor: ["Guard Plate", "Wolfhide Armor", "Mystic Robe", "Knight Vest", "Dragon Scale"],
  ring: ["Ring of Focus", "Band of Might", "Shadow Ring", "Crystal Loop", "Royal Signet"],
  amulet: ["Amulet of Life", "Mana Charm", "Sun Pendant", "Moon Relic", "Ancient Talisman"]
};

const MOUNTS = {
  brown_horse: {
    name: "Brown Horse",
    emoji: "🐴",
    description: "Mount de început pentru drumuri rapide între dungeon-uri.",
    cost: { gold: 0, wood: 0, crystals: 0 },
    bonus: { hp: 20, attack: 2, defense: 1, mana: 0, energy: 1, power: 90 }
  },
  war_wolf: {
    name: "War Wolf",
    emoji: "🐺",
    description: "Mount agresiv, bun pentru atac și dungeon farming.",
    cost: { gold: 1200, wood: 450, crystals: 80 },
    bonus: { hp: 45, attack: 7, defense: 3, mana: 0, energy: 3, power: 260 }
  },
  crystal_stag: {
    name: "Crystal Stag",
    emoji: "🦌",
    description: "Mount magic, crește mana și energia maximă.",
    cost: { gold: 2200, wood: 650, crystals: 160 },
    bonus: { hp: 55, attack: 4, defense: 4, mana: 40, energy: 5, power: 430 }
  },
  dragon_whelp: {
    name: "Dragon Whelp",
    emoji: "🐉",
    description: "Mount rar cu bonus mare de power, attack și survivability.",
    cost: { gold: 5200, wood: 1300, crystals: 420 },
    bonus: { hp: 120, attack: 14, defense: 8, mana: 60, energy: 8, power: 980 }
  }
};

const QUESTS = [
  {
    id: "first_blood",
    title: "First Blood",
    text: "Câștigă prima luptă contra monștrilor.",
    reward: { gold: 120, wood: 50, crystals: 10, xp: 45 },
    check: (game) => game.stats.wins >= 1
  },
  {
    id: "builder",
    title: "Young Builder",
    text: "Ridică orice clădire la nivelul 2.",
    reward: { gold: 160, wood: 95, crystals: 15, xp: 65 },
    check: (game) => Object.values(game.buildings).some((b) => b.level >= 2)
  },
  {
    id: "collector",
    title: "Loot Collector",
    text: "Adună cel puțin 3 iteme în inventar sau echipate.",
    reward: { gold: 220, wood: 80, crystals: 22, xp: 85 },
    check: (game) => totalItemCount(game) >= 3
  },
  {
    id: "dungeon_runner",
    title: "Dungeon Runner",
    text: "Câștigă 3 lupte în World Map / Dungeon.",
    reward: { gold: 300, wood: 120, crystals: 35, xp: 130 },
    check: (game) => (game.stats.dungeonWins || 0) >= 3
  },
  {
    id: "boss_slayer",
    title: "Boss Slayer",
    text: "Învinge primul boss de zonă.",
    reward: { gold: 500, wood: 180, crystals: 60, xp: 220 },
    check: (game) => (game.stats.bossKills || 0) >= 1
  },
  {
    id: "first_mount",
    title: "Mounted Hero",
    text: "Echipează primul mount.",
    reward: { gold: 260, wood: 120, crystals: 30, xp: 120 },
    check: (game) => Boolean(game.mounts?.active)
  },
  {
    id: "paladin_guard",
    title: "City Protector",
    text: "Setează Paladinul să protejeze orașul.",
    reward: { gold: 260, wood: 150, crystals: 35, xp: 130 },
    check: (game) => game.paladin?.mode === "city"
  },
  {
    id: "veteran",
    title: "Arena Veteran",
    text: "Câștigă 5 lupte.",
    reward: { gold: 350, wood: 140, crystals: 30, xp: 140 },
    check: (game) => game.stats.wins >= 5
  }
];

function createStarterGame(playerName = "Lord S-Fleet", className = "Knight") {
  return {
    version: 10,
    playerName,
    className,
    level: 1,
    paragonLevel: 0,
    xp: 0,
    xpToNext: 100,
    resources: { gold: 350, wood: 220, crystals: 45, diamonds: 20, sCoins: 0, energy: 10 },
    city: { lastResourceCollectionAt: null },
    guild: { id: null, name: null, tag: null, role: null },
    classLocked: true,
    buildings: {
      citadel: { level: 1 },
      barracks: { level: 1 },
      mine: { level: 1 },
      lumber: { level: 1 },
      academy: { level: 1 },
      wall: { level: 1 },
      watchtower: { level: 1 }
    },
    inventory: [],
    equipment: { weapon: null, armor: null, ring: null, amulet: null },
    mounts: { owned: ["brown_horse"], active: "brown_horse" },
    paladin: { level: 1, xp: 0, xpToNext: 100, mode: "city" },
    stats: { wins: 0, losses: 0, itemsFound: 0, dungeonWins: 0, bossKills: 0, pvpWins: 0, pvpLosses: 0, cityAttackWins: 0, cityAttackLosses: 0, cityDefenseWins: 0, cityDefenseLosses: 0 },
    completedQuests: [],
    world: { selectedZoneId: "goblin_forest", completedBosses: [], clears: {} },
    createdAt: new Date().toISOString()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeGame(game) {
  if (!game || typeof game !== "object") return null;
  const next = clone(game);
  next.version = 10;
  if (!CLASSES[next.className]) next.className = "Knight";
  next.playerName = typeof next.playerName === "string" && next.playerName.trim() ? next.playerName.trim() : "Lord S-Fleet";
  next.resources = { gold: 0, wood: 0, crystals: 0, diamonds: 0, sCoins: 0, energy: 10, ...(next.resources || {}) };
  next.resources.gold = Math.max(0, Math.floor(Number(next.resources.gold) || 0));
  next.resources.wood = Math.max(0, Math.floor(Number(next.resources.wood) || 0));
  next.resources.crystals = Math.max(0, Math.floor(Number(next.resources.crystals) || 0));
  next.resources.diamonds = Math.max(0, Math.floor(Number(next.resources.diamonds) || 0));
  next.resources.sCoins = Math.max(0, Math.floor(Number(next.resources.sCoins) || 0));
  next.resources.energy = Math.max(0, Math.floor(Number(next.resources.energy) || 10));
  next.city = { lastResourceCollectionAt: null, ...(next.city || {}) };
  next.guild = { id: null, name: null, tag: null, role: null, ...(next.guild || {}) };
  next.level = Math.max(1, Math.min(MAX_HERO_LEVEL, Math.floor(Number(next.level) || 1)));
  next.paragonLevel = Math.max(0, Math.min(MAX_PARAGON_LEVEL, Math.floor(Number(next.paragonLevel) || 0)));
  if (next.level < MAX_HERO_LEVEL) next.paragonLevel = 0;
  next.classLocked = true;

  const savedBuildings = next.buildings && typeof next.buildings === "object" ? next.buildings : {};
  const citadelLevel = Math.max(1, Math.min(MAX_CITADEL_LEVEL, Math.floor(Number(savedBuildings.citadel?.level) || 1)));
  next.buildings = {};
  Object.keys(BUILDINGS).forEach((key) => {
    const saved = savedBuildings[key] || {};
    const rawLevel = Math.floor(Number(saved.level) || 1);
    const cap = key === "citadel" ? MAX_CITADEL_LEVEL : citadelLevel;
    const level = Math.max(1, Math.min(cap, rawLevel));
    const building = { level };
    const upgradingTo = Math.floor(Number(saved.upgradingTo) || 0);
    const upgradeCompleteAt = saved.upgradeCompleteAt || null;
    const upgradeStartedAt = saved.upgradeStartedAt || null;
    if (upgradingTo > level && upgradeCompleteAt) {
      building.upgradingTo = Math.min(key === "citadel" ? MAX_CITADEL_LEVEL : Math.max(cap, upgradingTo), upgradingTo);
      building.upgradeCompleteAt = upgradeCompleteAt;
      building.upgradeStartedAt = upgradeStartedAt;
    }
    next.buildings[key] = building;
  });

  next.inventory = Array.isArray(next.inventory) ? next.inventory.filter(Boolean).slice(0, 80) : [];
  next.equipment = { weapon: null, armor: null, ring: null, amulet: null, ...(next.equipment || {}) };
  Object.keys(SLOTS).forEach((slot) => {
    if (next.equipment[slot] && next.equipment[slot].slot !== slot) next.equipment[slot] = null;
  });

  next.mounts = { owned: ["brown_horse"], active: "brown_horse", ...(next.mounts || {}) };
  next.mounts.owned = Array.isArray(next.mounts.owned) && next.mounts.owned.length ? next.mounts.owned.filter((id) => MOUNTS[id]) : ["brown_horse"];
  if (!next.mounts.owned.includes("brown_horse")) next.mounts.owned.unshift("brown_horse");
  if (!next.mounts.active || !next.mounts.owned.includes(next.mounts.active)) next.mounts.active = next.mounts.owned[0];

  next.paladin = { level: 1, xp: 0, xpToNext: 100, mode: "city", ...(next.paladin || {}) };
  const paladinMaxLevel = Math.max(1, getProgressionLevel(next));
  next.paladin.level = Math.max(1, Math.min(paladinMaxLevel, Math.floor(Number(next.paladin.level) || 1)));
  next.paladin.xp = Math.max(0, Math.floor(Number(next.paladin.xp) || 0));
  next.paladin.xpToNext = Math.max(80, Math.floor(Number(next.paladin.xpToNext) || 100));
  next.paladin.mode = next.paladin.mode === "battle" ? "battle" : "city";

  next.stats = { wins: 0, losses: 0, itemsFound: 0, dungeonWins: 0, bossKills: 0, pvpWins: 0, pvpLosses: 0, cityAttackWins: 0, cityAttackLosses: 0, cityDefenseWins: 0, cityDefenseLosses: 0, ...(next.stats || {}) };
  Object.keys(next.stats).forEach((key) => { next.stats[key] = Math.max(0, Math.floor(Number(next.stats[key]) || 0)); });
  next.completedQuests = Array.isArray(next.completedQuests) ? next.completedQuests : [];
  next.world = { selectedZoneId: "goblin_forest", completedBosses: [], clears: {}, ...(next.world || {}) };
  next.world.selectedZoneId = getZone(next.world.selectedZoneId).id;
  next.world.completedBosses = Array.isArray(next.world.completedBosses) ? next.world.completedBosses : [];
  next.world.clears = next.world.clears && typeof next.world.clears === "object" ? next.world.clears : {};
  next.resources.energy = Math.min(next.resources.energy, getMaxEnergy(next));
  return next;
}

function safeJsonParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function totalItemCount(game) {
  return (game.inventory?.length || 0) + Object.values(game.equipment || {}).filter(Boolean).length;
}

function pick(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function rarityRoll(rarityBoost = 0) {
  const weights = {
    Common: Math.max(10, RARITIES.Common.weight - rarityBoost * 13),
    Rare: RARITIES.Rare.weight + rarityBoost * 7,
    Epic: RARITIES.Epic.weight + rarityBoost * 4,
    Legendary: RARITIES.Legendary.weight + rarityBoost * 2
  };
  const total = Object.values(weights).reduce((sum, value) => sum + value, 0);
  let roll = Math.random() * total;
  for (const [name, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return name;
  }
  return "Common";
}

function createItem(level = 1, source = "Monster", rarityBoost = 0) {
  const slot = pick(Object.keys(SLOTS));
  const rarity = rarityRoll(rarityBoost);
  const rarityData = RARITIES[rarity];
  const name = `${rarity} ${pick(ITEM_NAMES[slot])}`;
  const base = Math.max(1, level);
  const stats = { hp: 0, attack: 0, defense: 0, mana: 0 };

  if (slot === "weapon") stats.attack = Math.round((6 + base * 2.2) * rarityData.mult);
  if (slot === "armor") {
    stats.hp = Math.round((28 + base * 8) * rarityData.mult);
    stats.defense = Math.round((3 + base * 1.2) * rarityData.mult);
  }
  if (slot === "ring") {
    stats.attack = Math.round((3 + base * 1.2) * rarityData.mult);
    stats.defense = Math.round((2 + base * 0.8) * rarityData.mult);
  }
  if (slot === "amulet") {
    stats.hp = Math.round((18 + base * 5) * rarityData.mult);
    stats.mana = Math.round((10 + base * 4) * rarityData.mult);
  }

  const power = stats.hp + stats.attack * 6 + stats.defense * 7 + stats.mana * 2;
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name,
    slot,
    rarity,
    level,
    source,
    stats,
    power,
    value: Math.max(15, Math.round(power * 1.2 + level * 10)),
    createdAt: new Date().toISOString()
  };
}

function itemStatsText(item) {
  if (!item) return "Empty";
  const parts = [];
  if (item.stats.hp) parts.push(`HP +${item.stats.hp}`);
  if (item.stats.attack) parts.push(`ATK +${item.stats.attack}`);
  if (item.stats.defense) parts.push(`DEF +${item.stats.defense}`);
  if (item.stats.mana) parts.push(`Mana +${item.stats.mana}`);
  return parts.join(" · ") || "No stats";
}

function equipmentBonus(game) {
  const bonus = { hp: 0, attack: 0, defense: 0, mana: 0, power: 0 };
  Object.values(game.equipment || {}).filter(Boolean).forEach((item) => {
    bonus.hp += item.stats.hp || 0;
    bonus.attack += item.stats.attack || 0;
    bonus.defense += item.stats.defense || 0;
    bonus.mana += item.stats.mana || 0;
    bonus.power += item.power || 0;
  });
  return bonus;
}

function getProgressionLevel(game) {
  return (game.level || 1) + (game.paragonLevel || 0);
}

function getProgressionLabel(game) {
  if ((game.level || 1) >= MAX_HERO_LEVEL) {
    return `Level ${MAX_HERO_LEVEL} · Paragon ${game.paragonLevel || 0}`;
  }
  return `Level ${game.level || 1}`;
}

function getXpLabel(game) {
  if ((game.level || 1) >= MAX_HERO_LEVEL && (game.paragonLevel || 0) >= MAX_PARAGON_LEVEL) return "Max Paragon";
  if ((game.level || 1) >= MAX_HERO_LEVEL) return "Paragon XP";
  return "XP";
}

function getMountBonus(game) {
  const mount = MOUNTS[game.mounts?.active];
  return mount?.bonus || { hp: 0, attack: 0, defense: 0, mana: 0, energy: 0, power: 0 };
}

function getPaladinBattleBonus(game) {
  const paladin = game.paladin || { level: 1, mode: "city" };
  if (paladin.mode !== "battle") return { hp: 0, attack: 0, defense: 0, mana: 0, power: 0, damage: 0 };
  return {
    hp: 18 + paladin.level * 6,
    attack: 2 + Math.floor(paladin.level * 1.4),
    defense: 1 + Math.floor(paladin.level * 0.8),
    mana: 0,
    power: 80 + paladin.level * 22,
    damage: 6 + Math.floor(paladin.level * 2.2)
  };
}

function getPaladinCityBonus(game) {
  const paladin = game.paladin || { level: 1, mode: "city" };
  if (paladin.mode !== "city") return { gold: 0, wood: 0, crystals: 0, defensePower: 0 };
  return {
    gold: 20 + paladin.level * 8,
    wood: 18 + paladin.level * 7,
    crystals: 2 + Math.floor(paladin.level / 3),
    defensePower: 100 + paladin.level * 35
  };
}

function getHeroStats(game) {
  const base = CLASSES[game.className].base;
  const b = game.buildings;
  const levelBonus = game.level - 1;
  const gear = equipmentBonus(game);
  const mount = getMountBonus(game);
  const paladin = getPaladinBattleBonus(game);
  const progression = getProgressionLevel(game);

  const hp = base.hp + levelBonus * 18 + (game.paragonLevel || 0) * 6 + b.citadel.level * 12 + gear.hp + mount.hp + paladin.hp;
  const attack = base.attack + levelBonus * 4 + (game.paragonLevel || 0) * 1 + b.barracks.level * 3 + gear.attack + mount.attack + paladin.attack;
  const defense = base.defense + levelBonus * 2 + Math.floor((game.paragonLevel || 0) * 0.7) + b.citadel.level * 2 + gear.defense + mount.defense + paladin.defense;
  const mana = base.mana + levelBonus * 7 + (game.paragonLevel || 0) * 2 + b.academy.level * 8 + gear.mana + mount.mana + paladin.mana;
  const power =
    100 +
    progression * 45 +
    b.citadel.level * 35 +
    b.barracks.level * 35 +
    b.academy.level * 25 +
    b.mine.level * 15 +
    b.lumber.level * 15 +
    (b.wall?.level || 0) * 45 +
    (b.watchtower?.level || 0) * 30 +
    gear.power +
    mount.power +
    paladin.power;

  return { hp, attack, defense, mana, power, gear, mount, paladin };
}

function getCityDefensePower(game) {
  const safe = normalizeGame(game);
  const stats = getHeroStats(safe);
  const wallLevel = safe.buildings.wall?.level || 1;
  const towerLevel = safe.buildings.watchtower?.level || 1;
  const citadelLevel = safe.buildings.citadel?.level || 1;
  const paladinCity = getPaladinCityBonus(safe);
  return Math.round(
    stats.power * 0.42 +
    citadelLevel * 135 +
    wallLevel * 520 +
    towerLevel * 95 +
    (paladinCity.defensePower || 0)
  );
}

function getCityAttackPower(game) {
  const safe = normalizeGame(game);
  const stats = getHeroStats(safe);
  const paladinBattle = getPaladinBattleBonus(safe);
  return Math.round(stats.power * 0.62 + paladinBattle.power * 0.35 + getProgressionLevel(safe) * 35);
}

function createPublicProfile(game) {
  const safe = normalizeGame(game);
  const stats = getHeroStats(safe);
  return {
    playerName: safe.playerName,
    className: safe.className,
    level: safe.level,
    paragonLevel: safe.paragonLevel || 0,
    progressionLevel: getProgressionLevel(safe),
    progressionLabel: getProgressionLabel(safe),
    power: stats.power,
    hp: stats.hp,
    attack: stats.attack,
    defense: stats.defense,
    mana: stats.mana,
    wins: safe.stats.wins || 0,
    losses: safe.stats.losses || 0,
    pvpWins: safe.stats.pvpWins || 0,
    pvpLosses: safe.stats.pvpLosses || 0,
    dungeonWins: safe.stats.dungeonWins || 0,
    bossKills: safe.stats.bossKills || 0,
    items: totalItemCount(safe),
    mount: safe.mounts?.active || "brown_horse",
    paladinMode: safe.paladin?.mode || "city",
    guildId: safe.guild?.id || null,
    guildName: safe.guild?.name || null,
    guildTag: safe.guild?.tag || null,
    cityDefensePower: getCityDefensePower(safe),
    cityAttackPower: getCityAttackPower(safe),
    citadelLevel: safe.buildings.citadel?.level || 1,
    wallLevel: safe.buildings.wall?.level || 1,
    watchtowerLevel: safe.buildings.watchtower?.level || 1,
    updatedAt: new Date().toISOString()
  };
}

function getMaxEnergy(game) {
  return 9 + getProgressionLevel(game) + (getMountBonus(game).energy || 0);
}

function getHourlyIncome(game) {
  const paladinCity = getPaladinCityBonus(game);
  return {
    gold: 80 + game.buildings.mine.level * 35 + paladinCity.gold,
    wood: 45 + game.buildings.lumber.level * 35 + game.buildings.citadel.level * 8 + paladinCity.wood,
    crystals: 5 + game.buildings.academy.level * 3 + paladinCity.crystals
  };
}

function getCollectionState(game, now = Date.now()) {
  const last = game.city?.lastResourceCollectionAt ? new Date(game.city.lastResourceCollectionAt).getTime() : 0;
  if (!last || Number.isNaN(last)) {
    return { ready: true, hours: 1, remainingMs: 0, nextAt: null };
  }

  const elapsedMs = Math.max(0, now - last);
  const fullHours = Math.floor(elapsedMs / 3600000);
  const remainingMs = fullHours >= 1 ? 0 : 3600000 - elapsedMs;

  return {
    ready: fullHours >= 1,
    hours: Math.min(24, Math.max(1, fullHours)),
    remainingMs,
    nextAt: last + 3600000
  };
}

function formatCountdown(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
}

function formatDuration(ms) {
  const totalMinutes = Math.max(1, Math.ceil(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getBuildDurationMs(game, key) {
  const nextLevel = (game.buildings[key]?.level || 1) + 1;
  const base = key === "citadel" ? 90000 : 60000;
  const scaling = key === "citadel" ? 1.24 : 1.18;
  return Math.min(12 * 3600000, Math.round(base * Math.pow(scaling, nextLevel - 1)));
}

function getBuildingTimer(game, key, now = Date.now()) {
  const building = game.buildings?.[key];
  if (!building?.upgradeCompleteAt) return { active: false, remainingMs: 0, progress: 0 };
  const completeAt = new Date(building.upgradeCompleteAt).getTime();
  const startedAt = building.upgradeStartedAt ? new Date(building.upgradeStartedAt).getTime() : now;
  if (!completeAt || Number.isNaN(completeAt)) return { active: false, remainingMs: 0, progress: 0 };
  const remainingMs = Math.max(0, completeAt - now);
  const totalMs = Math.max(1, completeAt - startedAt);
  const progress = Math.max(0, Math.min(100, ((now - startedAt) / totalMs) * 100));
  return { active: remainingMs > 0, remainingMs, progress, completeAt, startedAt, targetLevel: building.upgradingTo || building.level + 1 };
}

function applyCompletedConstructions(game, now = Date.now()) {
  const next = normalizeGame(game);
  let changed = false;
  Object.keys(BUILDINGS).forEach((key) => {
    const building = next.buildings[key];
    if (!building?.upgradeCompleteAt) return;
    const completeAt = new Date(building.upgradeCompleteAt).getTime();
    if (!completeAt || Number.isNaN(completeAt)) {
      delete building.upgradingTo;
      delete building.upgradeStartedAt;
      delete building.upgradeCompleteAt;
      changed = true;
      return;
    }
    if (completeAt <= now) {
      const maxLevel = getBuildingMaxLevel(next, key);
      building.level = Math.min(maxLevel, Math.max(building.level + 1, building.upgradingTo || building.level + 1));
      delete building.upgradingTo;
      delete building.upgradeStartedAt;
      delete building.upgradeCompleteAt;
      changed = true;
    }
  });
  return { game: next, changed };
}

function startBuildingUpgrade(game, key, now = Date.now()) {
  const next = applyCompletedConstructions(game, now).game;
  const status = getBuildingUpgradeStatus(next, key, now);
  if (!status.can) return next;
  const cost = getBuildingCost(next, key);
  const durationMs = getBuildDurationMs(next, key);
  next.resources.gold -= cost.gold;
  next.resources.wood -= cost.wood;
  next.resources.crystals -= cost.crystals;
  next.buildings[key].upgradingTo = next.buildings[key].level + 1;
  next.buildings[key].upgradeStartedAt = new Date(now).toISOString();
  next.buildings[key].upgradeCompleteAt = new Date(now + durationMs).toISOString();
  return next;
}

function getFinishConstructionCoinCost(game, key, now = Date.now()) {
  const timer = getBuildingTimer(game, key, now);
  if (!timer.active) return 0;
  return Math.max(1, Math.ceil(timer.remainingMs / 600000));
}

function finishConstructionWithCoins(game, key, now = Date.now()) {
  const next = normalizeGame(game);
  const cost = getFinishConstructionCoinCost(next, key, now);
  if (!cost || next.resources.sCoins < cost) return next;
  next.resources.sCoins -= cost;
  const building = next.buildings[key];
  building.level = Math.min(getBuildingMaxLevel(next, key), building.upgradingTo || building.level + 1);
  delete building.upgradingTo;
  delete building.upgradeStartedAt;
  delete building.upgradeCompleteAt;
  return next;
}

function applyHourlyCollection(game, now = Date.now()) {
  const next = normalizeGame(game);
  const state = getCollectionState(next, now);
  if (!state.ready) return { game: next, collected: null };

  const income = getHourlyIncome(next);
  const hours = state.hours;
  const collected = {
    hours,
    gold: income.gold * hours,
    wood: income.wood * hours,
    crystals: income.crystals * hours,
    energyBefore: next.resources.energy,
    energyAfter: getMaxEnergy(next)
  };

  next.resources.gold += collected.gold;
  next.resources.wood += collected.wood;
  next.resources.crystals += collected.crystals;
  next.resources.energy = getMaxEnergy(next);
  next.city.lastResourceCollectionAt = new Date(now).toISOString();

  return { game: next, collected };
}

function applyReward(game, reward) {
  const next = normalizeGame(game);
  next.resources.gold += reward.gold || 0;
  next.resources.wood += reward.wood || 0;
  next.resources.crystals += reward.crystals || 0;
  next.resources.diamonds += reward.diamonds || 0;
  next.resources.sCoins += reward.sCoins || 0;
  next.xp += reward.xp || 0;

  while (next.xp >= next.xpToNext) {
    if (next.level < MAX_HERO_LEVEL) {
      next.xp -= next.xpToNext;
      next.level += 1;
      next.xpToNext = next.level >= MAX_HERO_LEVEL ? 1400 : Math.round(next.xpToNext * 1.28);
      next.resources.energy = Math.min(getMaxEnergy(next), next.resources.energy + 1);
    } else if (next.paragonLevel < MAX_PARAGON_LEVEL) {
      next.xp -= next.xpToNext;
      next.paragonLevel += 1;
      next.xpToNext = Math.round(1400 + next.paragonLevel * 220);
      next.resources.energy = Math.min(getMaxEnergy(next), next.resources.energy + 1);
    } else {
      next.xp = 0;
      break;
    }
  }

  next.resources.energy = Math.min(next.resources.energy, getMaxEnergy(next));
  return next;
}

function addPaladinXp(game, amount) {
  const next = normalizeGame(game);
  const paladin = next.paladin;
  const maxPaladinLevel = Math.max(1, getProgressionLevel(next));
  paladin.xp += amount;
  while (paladin.xp >= paladin.xpToNext && paladin.level < maxPaladinLevel) {
    paladin.xp -= paladin.xpToNext;
    paladin.level += 1;
    paladin.xpToNext = Math.round(paladin.xpToNext * 1.22);
  }
  if (paladin.level >= maxPaladinLevel) paladin.xp = Math.min(paladin.xp, paladin.xpToNext);
  return next;
}

function getBuildingCost(game, key) {
  const level = game.buildings[key].level;
  const base = BUILDINGS[key].baseCost;
  return {
    gold: Math.round(base.gold * level * 1.35),
    wood: Math.round(base.wood * level * 1.25),
    crystals: Math.round(base.crystals * level * 1.2)
  };
}

function canAfford(resources, cost) {
  return (resources.gold || 0) >= (cost.gold || 0)
    && (resources.wood || 0) >= (cost.wood || 0)
    && (resources.crystals || 0) >= (cost.crystals || 0)
    && (resources.diamonds || 0) >= (cost.diamonds || 0)
    && (resources.sCoins || 0) >= (cost.sCoins || 0);
}

function payCost(game, cost) {
  const next = normalizeGame(game);
  if (!canAfford(next.resources, cost)) return { game: next, paid: false };
  next.resources.gold -= cost.gold || 0;
  next.resources.wood -= cost.wood || 0;
  next.resources.crystals -= cost.crystals || 0;
  next.resources.diamonds -= cost.diamonds || 0;
  next.resources.sCoins -= cost.sCoins || 0;
  return { game: next, paid: true };
}

function costText(cost) {
  const parts = [];
  if (cost.gold) parts.push(`${cost.gold} gold`);
  if (cost.wood) parts.push(`${cost.wood} wood`);
  if (cost.crystals) parts.push(`${cost.crystals} crystals`);
  if (cost.diamonds) parts.push(`${cost.diamonds} diamonds`);
  if (cost.sCoins) parts.push(`${cost.sCoins} S-Coins`);
  return parts.join(" · ") || "Free";
}

function getBuildingMaxLevel(game, key) {
  if (key === "citadel") return MAX_CITADEL_LEVEL;
  if (key === "wall") return Math.min(10, Math.max(1, game.buildings.citadel.level));
  return Math.max(1, game.buildings.citadel.level);
}

function getBuildingUpgradeStatus(game, key, now = Date.now()) {
  const level = game.buildings[key].level;
  const maxLevel = getBuildingMaxLevel(game, key);
  const timer = getBuildingTimer(game, key, now);
  if (timer.active) return { can: false, reason: `În construcție ${formatCountdown(timer.remainingMs)}`, maxLevel, timer };

  if (level >= maxLevel) {
    const reason = key === "citadel" ? `Max Lv. ${MAX_CITADEL_LEVEL}` : `Cere Citadel Lv. ${level + 1}`;
    return { can: false, reason, maxLevel };
  }

  const cost = getBuildingCost(game, key);
  if (!canAfford(game.resources, cost)) {
    return { can: false, reason: "Resurse insuficiente", maxLevel };
  }

  return { can: true, reason: "Upgrade", maxLevel, timer: null };
}

function scaleEnemy(enemy, level, extraScale = 1) {
  const next = clone(enemy);
  const scale = (1 + Math.max(0, level - 1) * 0.12) * extraScale;
  next.maxHp = Math.round(next.hp * scale);
  next.hp = next.maxHp;
  next.attack = Math.round(next.attack * scale);
  next.defense = Math.round(next.defense * scale);
  next.reward = {
    gold: Math.round(next.reward.gold * scale),
    wood: Math.round(next.reward.wood * scale),
    crystals: Math.round(next.reward.crystals * scale),
    xp: Math.round(next.reward.xp * scale)
  };
  return next;
}

function randomEnemy(level) {
  const maxIndex = Math.min(ENEMIES.length - 1, Math.floor((level - 1) / 2));
  return scaleEnemy(ENEMIES[Math.floor(Math.random() * (maxIndex + 1))], level, 1);
}

function getZone(zoneId) {
  return WORLD_ZONES.find((zone) => zone.id === zoneId) || WORLD_ZONES[0];
}

function isZoneUnlocked(game, zone) {
  return game.level >= zone.level;
}

function createWorldEnemy(zone, level, isBoss = false) {
  const source = isBoss ? zone.boss : pick(zone.enemies);
  const enemy = scaleEnemy(source, Math.max(level, zone.level), isBoss ? 1.25 : 1);
  const multiplier = zone.rewardMultiplier * (isBoss ? 1.6 : 1);
  enemy.zoneId = zone.id;
  enemy.zoneName = zone.name;
  enemy.isBoss = isBoss;
  enemy.energyCost = zone.energyCost;
  enemy.dropChance = Math.min(0.98, zone.dropChance + (isBoss ? 0.08 : 0));
  enemy.rarityBoost = zone.rarityBoost + (isBoss ? 1 : 0);
  enemy.reward = {
    gold: Math.round(enemy.reward.gold * multiplier),
    wood: Math.round(enemy.reward.wood * multiplier),
    crystals: Math.round(enemy.reward.crystals * multiplier),
    xp: Math.round(enemy.reward.xp * multiplier)
  };
  return enemy;
}

async function fetchPublicPlayers(limit = 50) {
  if (!supabase) return { players: [], error: "Supabase nu este configurat." };
  const { data, error } = await supabase.rpc("get_public_players", { limit_count: limit });
  if (error) return { players: [], error: error.message };
  const players = (data || [])
    .map((row) => ({
      userId: row.user_id,
      playerName: row.player_name || row.public_profile?.playerName || "Unknown Hero",
      className: row.class_name || row.public_profile?.className || "Knight",
      updatedAt: row.updated_at,
      profile: row.public_profile || {}
    }))
    .filter((row) => row.profile && Number(row.profile.power || 0) > 0)
    .sort((a, b) => Number(b.profile.power || 0) - Number(a.profile.power || 0));
  return { players, error: null };
}

function simulatePvpBattle(game, opponent) {
  const heroStats = getHeroStats(game);
  const enemy = opponent.profile || {};
  let heroHp = heroStats.hp;
  let enemyHp = Math.max(60, Number(enemy.hp) || 100);
  const enemyAttack = Math.max(5, Number(enemy.attack) || 12);
  const enemyDefense = Math.max(1, Number(enemy.defense) || 5);
  const log = [];

  for (let round = 1; round <= 18; round += 1) {
    const heroDamage = Math.max(4, Math.round(heroStats.attack * (0.85 + Math.random() * 0.35) - enemyDefense * 0.45));
    enemyHp = Math.max(0, enemyHp - heroDamage);
    log.push(`Runda ${round}: ${game.playerName} lovește ${opponent.playerName} pentru ${heroDamage} damage.`);
    if (enemyHp <= 0) break;

    const enemyDamage = Math.max(3, Math.round(enemyAttack * (0.82 + Math.random() * 0.36) - heroStats.defense * 0.42));
    heroHp = Math.max(0, heroHp - enemyDamage);
    log.push(`Runda ${round}: ${opponent.playerName} răspunde cu ${enemyDamage} damage.`);
    if (heroHp <= 0) break;
  }

  const won = enemyHp <= 0 || heroHp > enemyHp;
  const reward = won
    ? { gold: 120 + Math.round((opponent.profile.power || 0) * 0.04), wood: 45, crystals: 8, xp: 70 }
    : { gold: 35, wood: 15, crystals: 2, xp: 25 };

  return { won, reward, log: log.slice(-8).reverse(), heroHp, enemyHp };
}

function AuthScreen({ onSession }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function submit(e) {
    e.preventDefault();
    setStatus("");

    if (!hasSupabase) {
      setStatus("Supabase nu este configurat. Completează variabilele VITE_SUPABASE_URL și VITE_SUPABASE_ANON_KEY.");
      return;
    }

    const action = mode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { data, error } = await action;
    if (error) {
      setStatus(error.message);
      return;
    }

    if (data.session) {
      onSession(data.session);
    } else {
      setStatus("Cont creat. Verifică emailul pentru confirmare sau dezactivează confirmarea emailului în Supabase pentru test.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="badge">⚔️ Browser RPG Alpha</div>
        <h1>S-Fleet Fantasy War</h1>
        <p className="muted">Login/Register pentru salvare progres în cloud cu Supabase.</p>

        <form onSubmit={submit} className="form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="email@exemplu.ro" />

          <label>Parolă</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength="6" required placeholder="minimum 6 caractere" />

          <button className="primary" type="submit">
            {mode === "login" ? "Intră în joc" : "Creează cont"}
          </button>
        </form>

        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Nu ai cont? Creează unul" : "Ai deja cont? Intră în joc"}
        </button>

        {status && <div className="notice">{status}</div>}

        {!hasSupabase && (
          <div className="notice warning">
            Momentan rulează fără Supabase. Poți testa demo local, dar loginul se activează după configurarea variabilelor.
          </div>
        )}
      </section>
    </main>
  );
}

function Onboarding({ onStart }) {
  const [name, setName] = useState("Lord S-Fleet");
  const [className, setClassName] = useState("Knight");

  return (
    <main className="shell center">
      <section className="hero-card">
        <div className="badge">🏰 First Kingdom Setup</div>
        <h1>S-Fleet Fantasy War ⚔️</h1>
        <p className="muted">Alege numele lordului și clasa eroului. După salvare, progresul rămâne pe contul tău.</p>

        <div className="grid two">
          <div className="panel">
            <label>Numele lordului</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lord Ilie" />

            <div className="class-list">
              {Object.entries(CLASSES).map(([key, item]) => (
                <button key={key} className={className === key ? "class-card active" : "class-card"} onClick={() => setClassName(key)}>
                  <span className="class-emoji">{item.emoji}</span>
                  <span>
                    <b>{item.title}</b>
                    <small>{item.description}</small>
                  </span>
                </button>
              ))}
            </div>

            <button className="primary big" onClick={() => onStart(name.trim() || "Lord S-Fleet", className)}>
              Începe aventura
            </button>
          </div>

          <div className="panel kingdom-preview">
            <div className="big-emoji">🏰</div>
            <h2>Obiectiv MVP</h2>
            <p>Construiești orașul, ridici eroul până la Paragon, alegi mount-uri și folosești Paladinul.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function TopBar({ game, session, onLogout, saveStatus }) {
  const stats = getHeroStats(game);
  return (
    <header className="topbar">
      <div>
        <div className="badge">Update 8 · Build Timers / Shop / Trade</div>
        <h1>S-Fleet Fantasy War ⚔️</h1>
        <p>{game.playerName} · {getProgressionLabel(game)} · {game.className}</p>
      </div>

      <div className="top-actions">
        <div className="stat-box">👑 <b>{stats.power}</b><span>Power</span></div>
        <div className="stat-box">🏆 <b>{game.stats.wins}</b><span>Wins</span></div>
        <div className="stat-box">🎒 <b>{totalItemCount(game)}</b><span>Items</span></div>
        <div className="stat-box">🪙 <b>{game.resources.sCoins}</b><span>S-Coins</span></div>
        <div className="stat-box">💾 <b>{saveStatus}</b><span>Save</span></div>
        {session && <button className="danger" onClick={onLogout}>Logout</button>}
      </div>
    </header>
  );
}

function Resources({ game }) {
  const maxEnergy = getMaxEnergy(game);

  return (
    <section className="resources">
      <div className="resource">🪙 <span>Gold</span><b>{game.resources.gold}</b></div>
      <div className="resource">🪵 <span>Wood</span><b>{game.resources.wood}</b></div>
      <div className="resource">💎 <span>Crystals</span><b>{game.resources.crystals}</b></div>
      <div className="resource">🔷 <span>Diamonds</span><b>{game.resources.diamonds}</b></div>
      <div className="resource">🪙 <span>S-Coins</span><b>{game.resources.sCoins}</b></div>
      <div className="resource">⚡ <span>Energy</span><b>{game.resources.energy}/{maxEnergy}</b></div>
    </section>
  );
}

function Progress({ label, value, max }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="progress-wrap">
      <div className="progress-label"><span>{label}</span><span>{value}/{max}</span></div>
      <div className="progress"><div style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function CityVisualMap({ game, onUpgrade }) {
  const points = [
    { key: "citadel", x: 50, y: 38, size: "large" },
    { key: "barracks", x: 25, y: 62 },
    { key: "mine", x: 75, y: 65 },
    { key: "lumber", x: 18, y: 28 },
    { key: "academy", x: 78, y: 27 },
    { key: "wall", x: 50, y: 75 },
    { key: "watchtower", x: 35, y: 18 }
  ];

  return (
    <div className="city-map-card">
      <div className="city-skyline">
        <div className="city-sun">☀️</div>
        <div className="city-mountains" />
        <div className="city-river" />
        <div className="city-road road-one" />
        <div className="city-road road-two" />
        {points.map((point) => {
          const building = BUILDINGS[point.key];
          const level = game.buildings[point.key]?.level || 1;
          const status = getBuildingUpgradeStatus(game, point.key);
          return (
            <button
              key={point.key}
              type="button"
              className={`map-building ${point.size === "large" ? "large" : ""}`}
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
              onClick={() => onUpgrade(point.key)}
              title={status.can ? `Upgrade ${building.name}` : status.reason}
            >
              <span>{building.emoji}</span>
              <b>Lv. {level}</b>
              <small>{building.name}</small>
            </button>
          );
        })}
        {game.paladin?.mode === "city" && (
          <div className="map-paladin" title="Paladin protejează orașul">🛡️ Paladin Guard</div>
        )}
      </div>
    </div>
  );
}

function City({ game, setGame, session }) {
  const [now, setNow] = useState(Date.now());
  const normalizedGame = applyCompletedConstructions(game, now).game;
  const collectionState = getCollectionState(normalizedGame, now);
  const hourlyIncome = getHourlyIncome(normalizedGame);
  const maxEnergy = getMaxEnergy(normalizedGame);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      setGame((prev) => {
        const result = applyCompletedConstructions(prev, current);
        return result.changed ? result.game : prev;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [setGame]);

  function collect() {
    setGame((prev) => applyHourlyCollection(prev, Date.now()).game);
    setNow(Date.now());
  }

  function upgrade(key) {
    setGame((prev) => startBuildingUpgrade(prev, key, Date.now()));
  }

  function finishNow(key) {
    setGame((prev) => finishConstructionWithCoins(prev, key, Date.now()));
    setNow(Date.now());
  }

  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <h2>Orașul tău</h2>
          <p>Clădirile au timer de construcție. Poți finaliza instant cu S-Coins sau poți aștepta timerul.</p>
        </div>
        <button className="primary" disabled={!collectionState.ready} onClick={collect}>
          {collectionState.ready ? "Colectează resurse" : `Disponibil în ${formatCountdown(collectionState.remainingMs)}`}
        </button>
      </div>

      <div className="collect-panel">
        <div><b>Producție / oră</b><span>{hourlyIncome.gold} gold · {hourlyIncome.wood} wood · {hourlyIncome.crystals} crystals</span></div>
        <div><b>Ore pregătite</b><span>{collectionState.ready ? collectionState.hours : 0}h</span></div>
        <div><b>Energie la colectare</b><span>se umple la maxim: {maxEnergy}</span></div>
        <div><b>Protecție Paladin</b><span>{getPaladinCityBonus(normalizedGame).defensePower} city power</span></div>
      </div>

      <CityDefensePanel game={normalizedGame} session={session} />

      <CityVisualMap game={normalizedGame} onUpgrade={upgrade} />

      <div className="grid four">
        {Object.entries(BUILDINGS).map(([key, building]) => {
          const cost = getBuildingCost(normalizedGame, key);
          const level = normalizedGame.buildings[key].level;
          const status = getBuildingUpgradeStatus(normalizedGame, key, now);
          const timer = getBuildingTimer(normalizedGame, key, now);
          const finishCost = getFinishConstructionCoinCost(normalizedGame, key, now);
          const duration = getBuildDurationMs(normalizedGame, key);
          const maxText = key === "citadel" ? `Max Lv. ${MAX_CITADEL_LEVEL}` : `Max permis: Lv. ${status.maxLevel} după Citadel`;
          return (
            <article className="building" key={key}>
              <div className="building-top"><span>{building.emoji}</span><b>Lv. {level}</b></div>
              <h3>{building.name}</h3>
              <p>{building.description}</p>
              {timer.active ? (
                <div className="build-timer-box">
                  <small>Se construiește Lv. {timer.targetLevel} · rămas {formatCountdown(timer.remainingMs)}</small>
                  <div className="build-progress"><div style={{ width: `${timer.progress}%` }} /></div>
                  <button className="premium-mini" disabled={normalizedGame.resources.sCoins < finishCost} onClick={() => finishNow(key)}>
                    Finalizează acum · {finishCost} S-Coin
                  </button>
                </div>
              ) : (
                <small>{level >= status.maxLevel ? maxText : `Cost: ${costText(cost)} · timp ${formatDuration(duration)}`}</small>
              )}
              {!timer.active && <button disabled={!status.can} onClick={() => upgrade(key)}>{status.reason}</button>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Battle({ game, setGame }) {
  const heroStats = useMemo(() => getHeroStats(game), [game]);
  const [enemy, setEnemy] = useState(() => randomEnemy(getProgressionLevel(game)));
  const [heroHp, setHeroHp] = useState(heroStats.hp);
  const [mana, setMana] = useState(heroStats.mana);
  const [log, setLog] = useState(["Un inamic apare lângă citadelă."]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
  }, [heroStats.hp, heroStats.mana]);

  function addLog(text) {
    setLog((prev) => [text, ...prev].slice(0, 8));
  }

  function newEnemy() {
    setEnemy(randomEnemy(getProgressionLevel(game)));
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
    setLog(["O nouă amenințare se apropie de regat."]);
  }

  function finishWin(defeatedEnemy) {
    let dropped = null;

    setGame((prev) => {
      let next = normalizeGame(prev);
      next.stats.wins += 1;
      next.resources.energy = Math.max(0, next.resources.energy - 1);
      next = applyReward(next, defeatedEnemy.reward);

      if (Math.random() < 0.65) {
        dropped = createItem(getProgressionLevel(next), defeatedEnemy.name);
        if (next.inventory.length < 60) {
          next.inventory.push(dropped);
          next.stats.itemsFound += 1;
        } else {
          next.resources.gold += dropped.value;
          dropped = { ...dropped, soldBecauseFull: true };
        }
      }

      if (next.paladin.mode === "battle") next = addPaladinXp(next, 25);
      return next;
    });

    addLog(`Victorie! Reward: ${defeatedEnemy.reward.gold} gold, ${defeatedEnemy.reward.xp} XP.`);
    if (dropped?.soldBecauseFull) addLog(`Inventarul era plin. ${dropped.name} a fost convertit în ${dropped.value} gold.`);
    else if (dropped) addLog(`Item drop: ${SLOTS[dropped.slot].emoji} ${dropped.name} (${dropped.rarity}).`);
    setBusy(false);
  }

  function finishLoss() {
    setGame((prev) => {
      const next = clone(prev);
      next.stats.losses += 1;
      next.resources.energy = Math.max(0, next.resources.energy - 1);
      return next;
    });
    addLog("Ai fost învins. Eroul se întoarce în citadelă.");
    setBusy(false);
  }

  function enemyTurn(currentHeroHp, currentEnemy) {
    const dmg = Math.max(3, Math.round(currentEnemy.attack - heroStats.defense * 0.55 + Math.random() * 8));
    const after = Math.max(0, currentHeroHp - dmg);
    setHeroHp(after);
    addLog(`${currentEnemy.name} lovește pentru ${dmg} damage.`);
    if (after <= 0) finishLoss();
    else setBusy(false);
  }

  function attack(type) {
    if (busy) return;
    if (game.resources.energy <= 0) {
      addLog("Nu mai ai energie. Colectează resurse.");
      return;
    }

    const classData = CLASSES[game.className];
    let nextMana = mana;
    let damage;

    if (type === "skill") {
      if (mana < classData.skill.cost) {
        addLog("Mana insuficientă pentru skill.");
        return;
      }
      nextMana -= classData.skill.cost;
      damage = Math.max(8, Math.round(heroStats.attack * classData.skill.power - enemy.defense + Math.random() * 12));
      addLog(`${classData.skill.name}: ${damage} damage.`);
    } else {
      damage = Math.max(5, Math.round(heroStats.attack - enemy.defense * 0.6 + Math.random() * 10));
      addLog(`Atac normal: ${damage} damage.`);
    }

    if (heroStats.paladin.damage) {
      damage += heroStats.paladin.damage;
      addLog(`Paladinul lovește pentru ${heroStats.paladin.damage} damage.`);
    }

    setBusy(true);
    setMana(nextMana);

    const enemyAfter = { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    setEnemy(enemyAfter);

    if (enemyAfter.hp <= 0) {
      finishWin(enemy);
      return;
    }

    window.setTimeout(() => enemyTurn(heroHp, enemyAfter), 350);
  }

  return (
    <section className="grid two">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Battle Arena</h2>
            <p>Lupte pe ture. După victorie ai șansă de item drop.</p>
          </div>
          <button onClick={newEnemy}>Inamic nou</button>
        </div>

        <div className="combatants">
          <div className="combat-card hero">
            <div className="avatar">🧙</div>
            <h3>{game.playerName}</h3>
            <p>{getProgressionLabel(game)} · {game.className}</p>
            <Progress label="HP" value={heroHp} max={heroStats.hp} />
            <Progress label="Mana" value={mana} max={heroStats.mana} />
          </div>

          <div className="combat-card enemy">
            <div className="avatar">{enemy.emoji}</div>
            <h3>{enemy.name}</h3>
            <p>ATK {enemy.attack} · DEF {enemy.defense}</p>
            <Progress label="Enemy HP" value={enemy.hp} max={enemy.maxHp} />
          </div>
        </div>

        <div className="actions">
          <button className="primary" disabled={busy} onClick={() => attack("normal")}>Atac normal</button>
          <button className="primary alt" disabled={busy} onClick={() => attack("skill")}>
            {CLASSES[game.className].skill.name}
          </button>
        </div>
      </div>

      <div className="panel">
        <h2>Jurnal luptă</h2>
        <div className="battle-log">
          {log.map((item, idx) => <div key={`${item}-${idx}`}>{item}</div>)}
        </div>
      </div>
    </section>
  );
}


function Dungeon({ game, setGame }) {
  const [selectedZoneId, setSelectedZoneId] = useState(game.world?.selectedZoneId || "goblin_forest");
  const selectedZone = getZone(selectedZoneId);
  const heroStats = useMemo(() => getHeroStats(game), [game]);
  const [enemy, setEnemy] = useState(() => createWorldEnemy(selectedZone, getProgressionLevel(game), false));
  const [heroHp, setHeroHp] = useState(heroStats.hp);
  const [mana, setMana] = useState(heroStats.mana);
  const [log, setLog] = useState([`Ai intrat în ${selectedZone.name}.`]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
  }, [heroStats.hp, heroStats.mana]);

  useEffect(() => {
    const zone = getZone(selectedZoneId);
    setEnemy(createWorldEnemy(zone, getProgressionLevel(game), false));
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
    setLog([`Ai selectat zona ${zone.name}.`]);
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.world.selectedZoneId = selectedZoneId;
      return next;
    });
  }, [selectedZoneId]);

  function addLog(text) {
    setLog((prev) => [text, ...prev].slice(0, 9));
  }

  function startFight(isBoss = false) {
    const zone = getZone(selectedZoneId);
    if (!isZoneUnlocked(game, zone)) {
      addLog(`Zona se deblochează la level ${zone.level}.`);
      return;
    }
    if (game.resources.energy < zone.energyCost) {
      addLog(`Ai nevoie de ${zone.energyCost} energie pentru ${zone.name}.`);
      return;
    }
    setEnemy(createWorldEnemy(zone, getProgressionLevel(game), isBoss));
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
    setBusy(false);
    setLog([isBoss ? `Boss fight: ${zone.boss.name}!` : `Luptă nouă în ${zone.name}.`]);
  }

  function finishWin(defeatedEnemy) {
    let dropped = null;
    const zone = getZone(defeatedEnemy.zoneId || selectedZoneId);

    setGame((prev) => {
      let next = normalizeGame(prev);
      next.stats.wins += 1;
      next.stats.dungeonWins += 1;
      next.resources.energy = Math.max(0, next.resources.energy - defeatedEnemy.energyCost);
      next.world.clears[zone.id] = (next.world.clears[zone.id] || 0) + 1;

      if (defeatedEnemy.isBoss && !next.world.completedBosses.includes(zone.id)) {
        next.world.completedBosses.push(zone.id);
        next.stats.bossKills += 1;
        next.resources.crystals += 25 * zone.rarityBoost + 15;
      } else if (defeatedEnemy.isBoss) {
        next.stats.bossKills += 1;
      }

      next = applyReward(next, defeatedEnemy.reward);

      if (Math.random() < defeatedEnemy.dropChance) {
        dropped = createItem(Math.max(getProgressionLevel(next), zone.level), defeatedEnemy.name, defeatedEnemy.rarityBoost);
        if (next.inventory.length < 60) {
          next.inventory.push(dropped);
          next.stats.itemsFound += 1;
        } else {
          next.resources.gold += dropped.value;
          dropped = { ...dropped, soldBecauseFull: true };
        }
      }

      if (next.paladin.mode === "battle") next = addPaladinXp(next, defeatedEnemy.isBoss ? 60 : 30);
      return next;
    });

    addLog(`Victorie în ${zone.name}! Reward: ${defeatedEnemy.reward.gold} gold, ${defeatedEnemy.reward.xp} XP.`);
    if (defeatedEnemy.isBoss) addLog(`Boss învins: ${defeatedEnemy.name}. Zona este marcată ca progres.`);
    if (dropped?.soldBecauseFull) addLog(`Inventarul era plin. ${dropped.name} a fost convertit în ${dropped.value} gold.`);
    else if (dropped) addLog(`Dungeon drop: ${SLOTS[dropped.slot].emoji} ${dropped.name} (${dropped.rarity}).`);
    setBusy(false);
  }

  function finishLoss() {
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.stats.losses += 1;
      next.resources.energy = Math.max(0, next.resources.energy - enemy.energyCost);
      return next;
    });
    addLog("Ai fost învins în dungeon. Energia a fost consumată.");
    setBusy(false);
  }

  function enemyTurn(currentHeroHp, currentEnemy) {
    const dmg = Math.max(4, Math.round(currentEnemy.attack - heroStats.defense * 0.55 + Math.random() * 10));
    const after = Math.max(0, currentHeroHp - dmg);
    setHeroHp(after);
    addLog(`${currentEnemy.name} lovește pentru ${dmg} damage.`);
    if (after <= 0) finishLoss();
    else setBusy(false);
  }

  function attack(type) {
    if (busy) return;
    const zone = getZone(selectedZoneId);
    if (!isZoneUnlocked(game, zone)) {
      addLog(`Zona se deblochează la level ${zone.level}.`);
      return;
    }
    if (game.resources.energy < enemy.energyCost) {
      addLog(`Ai nevoie de ${enemy.energyCost} energie pentru această luptă.`);
      return;
    }

    const classData = CLASSES[game.className];
    let nextMana = mana;
    let damage;

    if (type === "skill") {
      if (mana < classData.skill.cost) {
        addLog("Mana insuficientă pentru skill.");
        return;
      }
      nextMana -= classData.skill.cost;
      damage = Math.max(10, Math.round(heroStats.attack * classData.skill.power - enemy.defense + Math.random() * 14));
      addLog(`${classData.skill.name}: ${damage} damage.`);
    } else {
      damage = Math.max(6, Math.round(heroStats.attack - enemy.defense * 0.6 + Math.random() * 11));
      addLog(`Atac normal: ${damage} damage.`);
    }

    if (heroStats.paladin.damage) {
      damage += heroStats.paladin.damage;
      addLog(`Paladinul lovește pentru ${heroStats.paladin.damage} damage.`);
    }

    setBusy(true);
    setMana(nextMana);

    const enemyAfter = { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    setEnemy(enemyAfter);

    if (enemyAfter.hp <= 0) {
      finishWin(enemy);
      return;
    }

    window.setTimeout(() => enemyTurn(heroHp, enemyAfter), 350);
  }

  return (
    <section className="grid dungeon-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>World Map / Dungeon</h2>
            <p>Alege zona, luptă cu monștri specifici și învinge boss-ul pentru progres.</p>
          </div>
          <div className="power-summary">⚡ Cost zonă: {selectedZone.energyCost}</div>
        </div>

        <div className="zone-grid">
          {WORLD_ZONES.map((zone) => {
            const unlocked = isZoneUnlocked(game, zone);
            const completed = game.world?.completedBosses?.includes(zone.id);
            const clears = game.world?.clears?.[zone.id] || 0;
            return (
              <button
                key={zone.id}
                className={`zone-card ${selectedZoneId === zone.id ? "active" : ""} ${!unlocked ? "locked" : ""}`}
                onClick={() => setSelectedZoneId(zone.id)}
              >
                <div className="zone-emoji">{zone.emoji}</div>
                <div>
                  <h3>{zone.name}</h3>
                  <p>{zone.description}</p>
                  <small>Level {zone.level}+ · Energy {zone.energyCost} · Clears {clears}</small>
                  <b>{completed ? "Boss defeated ✅" : unlocked ? "Unlocked" : `Locked până la level ${zone.level}`}</b>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>{selectedZone.emoji} {selectedZone.name}</h2>
            <p>Drop chance {Math.round(selectedZone.dropChance * 100)}% · Rarity boost +{selectedZone.rarityBoost}</p>
          </div>
          <div className="dungeon-actions">
            <button onClick={() => startFight(false)}>Monster</button>
            <button className="primary" onClick={() => startFight(true)}>Boss</button>
          </div>
        </div>

        <div className="combatants">
          <div className="combat-card hero">
            <div className="avatar">🧙</div>
            <h3>{game.playerName}</h3>
            <p>{getProgressionLabel(game)} · {game.className}</p>
            <Progress label="HP" value={heroHp} max={heroStats.hp} />
            <Progress label="Mana" value={mana} max={heroStats.mana} />
          </div>

          <div className="combat-card enemy">
            <div className="avatar">{enemy.emoji}</div>
            <h3>{enemy.name}</h3>
            <p>{enemy.isBoss ? "Boss" : "Monster"} · ATK {enemy.attack} · DEF {enemy.defense}</p>
            <Progress label="Enemy HP" value={enemy.hp} max={enemy.maxHp} />
          </div>
        </div>

        <div className="actions">
          <button className="primary" disabled={busy} onClick={() => attack("normal")}>Atac normal</button>
          <button className="primary alt" disabled={busy} onClick={() => attack("skill")}>{CLASSES[game.className].skill.name}</button>
        </div>

        <div className="battle-log dungeon-log">
          {log.map((item, idx) => <div key={`${item}-${idx}`}>{item}</div>)}
        </div>
      </div>
    </section>
  );
}


function ItemCard({ item, equipped, onEquip, onUnequip, onSell }) {
  return (
    <article className={`item-card rarity-${item.rarity}`}>
      <div className="item-head">
        <span className="item-icon">{SLOTS[item.slot].emoji}</span>
        <div>
          <h3>{item.name}</h3>
          <p>{item.rarity} · {SLOTS[item.slot].label} · Lv. {item.level}</p>
        </div>
      </div>

      <div className="item-stats">{itemStatsText(item)}</div>
      <div className="item-meta">
        <span>Power {item.power}</span>
        <span>Value {item.value} gold</span>
      </div>

      <div className="item-actions">
        {equipped ? (
          <button onClick={() => onUnequip(item.slot)}>Unequip</button>
        ) : (
          <button className="primary" onClick={() => onEquip(item)}>Equip</button>
        )}
        <button className="danger" onClick={() => onSell(item, equipped)}>Sell</button>
      </div>
    </article>
  );
}

function Inventory({ game, setGame }) {
  const [filter, setFilter] = useState("all");
  const stats = getHeroStats(game);
  const filteredInventory = game.inventory
    .filter((item) => filter === "all" || item.slot === filter)
    .sort((a, b) => b.power - a.power);

  function equipItem(item) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      const current = next.equipment[item.slot];
      next.inventory = next.inventory.filter((i) => i.id !== item.id);
      if (current) next.inventory.push(current);
      next.equipment[item.slot] = item;
      return next;
    });
  }

  function unequip(slot) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      const current = next.equipment[slot];
      if (!current) return prev;
      if (next.inventory.length >= 60) {
        next.resources.gold += current.value;
        next.equipment[slot] = null;
        return next;
      }
      next.inventory.push(current);
      next.equipment[slot] = null;
      return next;
    });
  }

  function sellItem(item, equipped = false) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.resources.gold += item.value;
      if (equipped) next.equipment[item.slot] = null;
      else next.inventory = next.inventory.filter((i) => i.id !== item.id);
      return next;
    });
  }

  return (
    <section className="grid inventory-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Echipament</h2>
            <p>Itemele echipate cresc HP, attack, defense, mana și power.</p>
          </div>
          <div className="power-summary">👑 Power {stats.power}</div>
        </div>

        <div className="equipment-grid">
          {Object.entries(SLOTS).map(([slot, info]) => {
            const item = game.equipment[slot];
            return (
              <div className="equipment-slot" key={slot}>
                <div className="slot-title">{info.emoji} {info.label}</div>
                {item ? (
                  <ItemCard item={item} equipped onUnequip={unequip} onSell={sellItem} />
                ) : (
                  <div className="empty-slot">Slot gol</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Inventar</h2>
            <p>{game.inventory.length}/60 iteme. Primești drop-uri după lupte câștigate.</p>
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Toate</option>
            {Object.entries(SLOTS).map(([slot, info]) => (
              <option key={slot} value={slot}>{info.label}</option>
            ))}
          </select>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="empty-inventory">
            🎒 Inventarul este gol. Mergi la Luptă și câștigă bătălii pentru item drops.
          </div>
        ) : (
          <div className="inventory-list">
            {filteredInventory.map((item) => (
              <ItemCard key={item.id} item={item} onEquip={equipItem} onSell={sellItem} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Shop({ game, setGame }) {
  const [classChoice, setClassChoice] = useState(game.className);
  const [renameValue, setRenameValue] = useState(game.playerName);
  const [message, setMessage] = useState("S-Coins se adaugă manual de creator după contact/plată.");

  function buy(cost, action, successText) {
    setGame((prev) => {
      const paid = payCost(prev, cost);
      if (!paid.paid) {
        setMessage(`Resurse insuficiente: ${costText(cost)}`);
        return paid.game;
      }
      const next = action(paid.game);
      setMessage(successText);
      return normalizeGame(next);
    });
  }

  function buyEnergyWithDiamonds() {
    buy({ diamonds: 12 }, (next) => {
      next.resources.energy = Math.min(getMaxEnergy(next), next.resources.energy + 10);
      return next;
    }, "Ai cumpărat +10 energie cu diamonds.");
  }

  function refillEnergyWithCoins() {
    buy({ sCoins: 1 }, (next) => {
      next.resources.energy = getMaxEnergy(next);
      return next;
    }, "Energia a fost umplută instant cu S-Coin.");
  }

  function buyChest(type) {
    const config = type === "epic"
      ? { cost: { diamonds: 35 }, boost: 2, text: "Epic chest cumpărat cu diamonds." }
      : { cost: { sCoins: 4 }, boost: 4, text: "Premium chest cumpărat cu S-Coins." };
    buy(config.cost, (next) => {
      if (next.inventory.length >= 60) {
        next.resources.gold += 250;
        return next;
      }
      const item = createItem(getProgressionLevel(next), type === "epic" ? "Diamond Chest" : "S-Coin Premium Chest", config.boost);
      next.inventory.push(item);
      next.stats.itemsFound += 1;
      return next;
    }, config.text);
  }

  function buyResourcePack() {
    buy({ diamonds: 18 }, (next) => {
      next.resources.gold += 1500;
      next.resources.wood += 900;
      next.resources.crystals += 90;
      return next;
    }, "Ai cumpărat pachet de resurse cu diamonds.");
  }

  function changeClass() {
    if (classChoice === game.className) {
      setMessage("Alege o clasă diferită pentru schimbare.");
      return;
    }
    buy({ sCoins: 10 }, (next) => {
      next.className = classChoice;
      next.classLocked = true;
      return next;
    }, `Clasa a fost schimbată în ${classChoice} cu S-Coins.`);
  }

  function renameHero() {
    const clean = renameValue.trim().slice(0, 28);
    if (!clean) {
      setMessage("Numele nu poate fi gol.");
      return;
    }
    buy({ sCoins: 2 }, (next) => {
      next.playerName = clean;
      return next;
    }, "Numele eroului a fost schimbat.");
  }

  return (
    <section className="grid shop-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Shop</h2>
            <p>Cumperi pachete cu gold/diamonds sau folosești S-Coins pentru funcții premium.</p>
          </div>
          <div className="power-summary">🔷 {game.resources.diamonds} diamonds · 🪙 {game.resources.sCoins} S-Coins</div>
        </div>

        <div className="shop-grid">
          <article className="shop-card">
            <h3>⚡ Energy Boost</h3>
            <p>Primești +10 energie, fără să aștepți colectarea.</p>
            <button onClick={buyEnergyWithDiamonds} disabled={!canAfford(game.resources, { diamonds: 12 })}>Cumpără · 12 diamonds</button>
          </article>
          <article className="shop-card premium">
            <h3>⚡ Full Energy</h3>
            <p>Umple energia instant la maximul caracterului.</p>
            <button onClick={refillEnergyWithCoins} disabled={!canAfford(game.resources, { sCoins: 1 })}>Cumpără · 1 S-Coin</button>
          </article>
          <article className="shop-card">
            <h3>🎁 Resource Pack</h3>
            <p>+1500 gold, +900 wood, +90 crystals.</p>
            <button onClick={buyResourcePack} disabled={!canAfford(game.resources, { diamonds: 18 })}>Cumpără · 18 diamonds</button>
          </article>
          <article className="shop-card">
            <h3>💎 Epic Chest</h3>
            <p>Item cu șansă mai bună la Rare/Epic.</p>
            <button onClick={() => buyChest("epic")} disabled={!canAfford(game.resources, { diamonds: 35 })}>Cumpără · 35 diamonds</button>
          </article>
          <article className="shop-card premium">
            <h3>🏆 Premium Chest</h3>
            <p>Item cu rarity boost mare, inclusiv șansă mai bună la Legendary.</p>
            <button onClick={() => buyChest("premium")} disabled={!canAfford(game.resources, { sCoins: 4 })}>Cumpără · 4 S-Coins</button>
          </article>
        </div>
      </div>

      <div className="panel">
        <h2>S-Coin Premium</h2>
        <p>S-Coin se cumpără doar prin contactarea creatorului jocului. Creatorul adaugă manual coinurile în cont după confirmare.</p>
        <div className="level-rules">
          <div><b>Schimbă clasa</b><span>10 S-Coins · păstrezi progresul, itemele și orașul</span></div>
          <div><b>Energie instant</b><span>1 S-Coin · umple energia la maxim</span></div>
          <div><b>Finalizează construcții</b><span>cost variabil · apare direct pe clădirea în construcție</span></div>
          <div><b>Premium chest</b><span>4 S-Coins · loot cu șansă mai bună la Legendary</span></div>
          <div><b>Rename hero</b><span>2 S-Coins · schimbă numele eroului</span></div>
        </div>

        <div className="shop-control">
          <label>Schimbă clasa cu S-Coins</label>
          <select value={classChoice} onChange={(e) => setClassChoice(e.target.value)}>
            {Object.keys(CLASSES).map((className) => <option key={className} value={className}>{className}</option>)}
          </select>
          <button className="primary" disabled={classChoice === game.className || !canAfford(game.resources, { sCoins: 10 })} onClick={changeClass}>Schimbă clasa · 10 S-Coins</button>
        </div>

        <div className="shop-control">
          <label>Schimbă numele eroului</label>
          <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} maxLength={28} />
          <button className="primary" disabled={!canAfford(game.resources, { sCoins: 2 })} onClick={renameHero}>Rename · 2 S-Coins</button>
        </div>

        <div className="notice">{message}</div>
      </div>
    </section>
  );
}

function TradeCenter({ game, setGame, session }) {
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [priceGold, setPriceGold] = useState(250);
  const [priceDiamonds, setPriceDiamonds] = useState(0);
  const [status, setStatus] = useState("Trade Center folosește Supabase Marketplace.");

  async function loadMarketplace() {
    if (!supabase || !session) {
      setStatus("Marketplace are nevoie de login Supabase.");
      return;
    }
    const { data, error } = await supabase
      .from("marketplace_listings")
      .select("id,seller_id,seller_name,item,price_gold,price_diamonds,status,buyer_id,proceeds_claimed,created_at,sold_at")
      .in("status", ["active", "sold"])
      .order("created_at", { ascending: false })
      .limit(80);
    if (error) {
      setStatus(`Eroare marketplace: ${error.message}. Rulează schema.sql din Update 8.`);
      return;
    }
    setListings((data || []).filter((row) => row.status === "active"));
    setMyListings((data || []).filter((row) => row.seller_id === session.user.id));
    setStatus("Marketplace actualizat.");
  }

  useEffect(() => {
    loadMarketplace();
  }, [session]);

  async function listItem() {
    if (!supabase || !session) {
      setStatus("Trebuie să fii logat pentru marketplace.");
      return;
    }
    const item = game.inventory.find((i) => i.id === selectedItemId);
    const gold = Math.max(0, Math.floor(Number(priceGold) || 0));
    const diamonds = Math.max(0, Math.floor(Number(priceDiamonds) || 0));
    if (!item) {
      setStatus("Alege un item din inventar.");
      return;
    }
    if (gold <= 0 && diamonds <= 0) {
      setStatus("Setează preț în gold sau diamonds.");
      return;
    }
    const { error } = await supabase.from("marketplace_listings").insert({
      seller_id: session.user.id,
      seller_name: game.playerName,
      item,
      price_gold: gold,
      price_diamonds: diamonds
    });
    if (error) {
      setStatus(`Nu am putut lista itemul: ${error.message}`);
      return;
    }
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.inventory = next.inventory.filter((i) => i.id !== item.id);
      return next;
    });
    setSelectedItemId("");
    setStatus(`${item.name} a fost listat în marketplace.`);
    await loadMarketplace();
  }

  async function buyListing(listing) {
    if (!supabase || !session) return;
    if (listing.seller_id === session.user.id) {
      setStatus("Nu poți cumpăra propriul item.");
      return;
    }
    if (!canAfford(game.resources, { gold: listing.price_gold, diamonds: listing.price_diamonds })) {
      setStatus("Nu ai destule resurse pentru acest item.");
      return;
    }
    const { data, error } = await supabase.rpc("buy_market_listing", { listing_id: listing.id });
    if (error) {
      setStatus(`Cumpărare eșuată: ${error.message}`);
      await loadMarketplace();
      return;
    }
    const bought = Array.isArray(data) ? data[0] : data;
    const item = bought?.item || listing.item;
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.resources.gold -= listing.price_gold || 0;
      next.resources.diamonds -= listing.price_diamonds || 0;
      if (next.inventory.length < 60) next.inventory.push(item);
      else next.resources.gold += Math.max(50, item.value || 50);
      return next;
    });
    setStatus(`Ai cumpărat ${item.name}.`);
    await loadMarketplace();
  }

  async function cancelListing(listing) {
    if (!supabase || !session) return;
    const { data, error } = await supabase.rpc("cancel_market_listing", { listing_id: listing.id });
    if (error) {
      setStatus(`Nu pot anula listingul: ${error.message}`);
      return;
    }
    const cancelled = Array.isArray(data) ? data[0] : data;
    const item = cancelled?.item || listing.item;
    setGame((prev) => {
      const next = normalizeGame(prev);
      if (next.inventory.length < 60) next.inventory.push(item);
      else next.resources.gold += Math.max(50, item.value || 50);
      return next;
    });
    setStatus(`Listing anulat: ${item.name}.`);
    await loadMarketplace();
  }

  async function claimSales() {
    if (!supabase || !session) return;
    const { data, error } = await supabase.rpc("claim_market_sales");
    if (error) {
      setStatus(`Nu pot colecta vânzările: ${error.message}`);
      return;
    }
    const claim = Array.isArray(data) ? data[0] : data;
    const gold = Number(claim?.claimed_gold || 0);
    const diamonds = Number(claim?.claimed_diamonds || 0);
    const count = Number(claim?.sales_count || 0);
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.resources.gold += gold;
      next.resources.diamonds += diamonds;
      return next;
    });
    setStatus(count ? `Ai colectat ${gold} gold și ${diamonds} diamonds din ${count} vânzări.` : "Nu ai vânzări noi de colectat.");
    await loadMarketplace();
  }

  if (!session) {
    return <section className="panel"><h2>Trade Center</h2><p>Trebuie să fii logat pentru schimburi între jucători.</p></section>;
  }

  const selectedItem = game.inventory.find((item) => item.id === selectedItemId);

  return (
    <section className="grid trade-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Trade Center</h2>
            <p>Listezi iteme în marketplace, iar alt jucător le poate cumpăra cu gold/diamonds.</p>
          </div>
          <button onClick={loadMarketplace}>Refresh</button>
        </div>

        <div className="trade-form">
          <label>Alege item de vânzare</label>
          <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
            <option value="">Selectează item</option>
            {game.inventory.map((item) => <option key={item.id} value={item.id}>{item.name} · Power {item.power}</option>)}
          </select>
          {selectedItem && <div className="item-stats">{SLOTS[selectedItem.slot].emoji} {selectedItem.name} · {itemStatsText(selectedItem)}</div>}
          <div className="grid two">
            <div><label>Preț gold</label><input type="number" min="0" value={priceGold} onChange={(e) => setPriceGold(e.target.value)} /></div>
            <div><label>Preț diamonds</label><input type="number" min="0" value={priceDiamonds} onChange={(e) => setPriceDiamonds(e.target.value)} /></div>
          </div>
          <button className="primary big" onClick={listItem} disabled={!selectedItemId}>Listează în marketplace</button>
        </div>

        <div className="section-title compact">
          <h3>Listingurile mele</h3>
          <button onClick={claimSales}>Colectează vânzări</button>
        </div>
        <div className="market-list small-list">
          {myListings.length === 0 ? <div className="empty-inventory">Nu ai listinguri.</div> : myListings.map((listing) => (
            <div className="market-row" key={listing.id}>
              <span>{SLOTS[listing.item.slot]?.emoji || "🎒"}</span>
              <div><b>{listing.item.name}</b><small>{listing.status} · {listing.price_gold} gold · {listing.price_diamonds} diamonds</small></div>
              {listing.status === "active" && <button className="danger" onClick={() => cancelListing(listing)}>Anulează</button>}
              {listing.status === "sold" && <b>{listing.proceeds_claimed ? "Claimed" : "Sold"}</b>}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Marketplace public</h2>
            <p>Cumperi iteme puse la vânzare de alți jucători.</p>
          </div>
          <div className="power-summary">🪙 {game.resources.gold} · 🔷 {game.resources.diamonds}</div>
        </div>
        <div className="market-list">
          {listings.length === 0 ? <div className="empty-inventory">Nu există iteme active la vânzare.</div> : listings.map((listing) => (
            <div className="market-row" key={listing.id}>
              <span>{SLOTS[listing.item.slot]?.emoji || "🎒"}</span>
              <div>
                <b>{listing.item.name}</b>
                <small>{listing.seller_name} · {itemStatsText(listing.item)} · Power {listing.item.power}</small>
              </div>
              <strong>{listing.price_gold} gold · {listing.price_diamonds} diamonds</strong>
              <button className="primary" disabled={listing.seller_id === session.user.id || !canAfford(game.resources, { gold: listing.price_gold, diamonds: listing.price_diamonds })} onClick={() => buyListing(listing)}>Buy</button>
            </div>
          ))}
        </div>
        <div className="notice">{status}</div>
      </div>
    </section>
  );
}

function Hero({ game }) {
  const stats = getHeroStats(game);
  const selectedClass = CLASSES[game.className];
  const xpLabel = getXpLabel(game);
  const maxed = game.level >= MAX_HERO_LEVEL && (game.paragonLevel || 0) >= MAX_PARAGON_LEVEL;

  return (
    <section className="grid two">
      <div className="panel">
        <h2>Erou</h2>
        <div className="hero-profile">
          <div className="big-emoji">{selectedClass.emoji}</div>
          <div>
            <h3>{game.playerName}</h3>
            <p>{getProgressionLabel(game)} · {game.className}</p>
          </div>
        </div>

        <Progress label={xpLabel} value={maxed ? 1 : game.xp} max={maxed ? 1 : game.xpToNext} />

        <div className="level-rules">
          <div><b>Hero max</b><span>Level {MAX_HERO_LEVEL}</span></div>
          <div><b>Paragon max</b><span>{MAX_PARAGON_LEVEL}</span></div>
          <div><b>Energy rule</b><span>10 la level 1, +1 / level sau Paragon</span></div>
        </div>

        <div className="grid two mini-stats">
          <div>❤️ HP <b>{stats.hp}</b><small>Gear +{stats.gear.hp} · Mount +{stats.mount.hp} · Paladin +{stats.paladin.hp}</small></div>
          <div>⚔️ Attack <b>{stats.attack}</b><small>Gear +{stats.gear.attack} · Mount +{stats.mount.attack} · Paladin +{stats.paladin.attack}</small></div>
          <div>🛡️ Defense <b>{stats.defense}</b><small>Gear +{stats.gear.defense} · Mount +{stats.mount.defense} · Paladin +{stats.paladin.defense}</small></div>
          <div>🔮 Mana <b>{stats.mana}</b><small>Gear +{stats.gear.mana} · Mount +{stats.mount.mana}</small></div>
        </div>
      </div>

      <div className="panel locked-class-panel">
        <h2>Clasă blocată</h2>
        <p>Clasa se alege la crearea eroului și rămâne permanentă pentru acest cont.</p>

        <div className="locked-class-card">
          <span className="class-emoji">{selectedClass.emoji}</span>
          <div>
            <b>{selectedClass.title}</b>
            <small>{selectedClass.description}</small>
            <small>Skill: {selectedClass.skill.name}</small>
          </div>
        </div>

        <div className="notice locked">
          🔒 Pentru altă clasă trebuie creat un erou nou / cont nou.
        </div>
      </div>
    </section>
  );
}

function Companions({ game, setGame }) {
  const activeMount = MOUNTS[game.mounts?.active];

  function canPay(cost) {
    return canAfford(game.resources, cost);
  }

  function unlockMount(id) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      if (next.mounts.owned.includes(id)) {
        next.mounts.active = id;
        return next;
      }
      const mount = MOUNTS[id];
      if (!canAfford(next.resources, mount.cost)) return next;
      next.resources.gold -= mount.cost.gold;
      next.resources.wood -= mount.cost.wood;
      next.resources.crystals -= mount.cost.crystals;
      next.mounts.owned.push(id);
      next.mounts.active = id;
      next.resources.energy = Math.min(next.resources.energy, getMaxEnergy(next));
      return next;
    });
  }

  function setPaladinMode(mode) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.paladin.mode = mode;
      return next;
    });
  }

  function trainPaladin() {
    setGame((prev) => {
      let next = normalizeGame(prev);
      const maxPaladinLevel = getProgressionLevel(next);
      const cost = { gold: 180 + next.paladin.level * 45, wood: 90 + next.paladin.level * 18, crystals: 15 + next.paladin.level * 4 };
      if (!canAfford(next.resources, cost) || next.paladin.level >= maxPaladinLevel) return next;
      next.resources.gold -= cost.gold;
      next.resources.wood -= cost.wood;
      next.resources.crystals -= cost.crystals;
      next = addPaladinXp(next, next.paladin.xpToNext);
      return next;
    });
  }

  const paladinMaxLevel = getProgressionLevel(game);
  const paladinCost = { gold: 180 + game.paladin.level * 45, wood: 90 + game.paladin.level * 18, crystals: 15 + game.paladin.level * 4 };
  const cityBonus = getPaladinCityBonus(game);
  const battleBonus = getPaladinBattleBonus({ ...game, paladin: { ...game.paladin, mode: "battle" } });

  return (
    <section className="grid companion-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Mount-uri</h2>
            <p>Mount-ul activ dă bonusuri la stats, power și energie maximă.</p>
          </div>
          <div className="power-summary">{activeMount ? `${activeMount.emoji} ${activeMount.name}` : "Fără mount"}</div>
        </div>

        <div className="mount-grid">
          {Object.entries(MOUNTS).map(([id, mount]) => {
            const owned = game.mounts.owned.includes(id);
            const active = game.mounts.active === id;
            const affordable = canPay(mount.cost);
            return (
              <article key={id} className={`mount-card ${active ? "active" : ""}`}>
                <div className="mount-emoji">{mount.emoji}</div>
                <h3>{mount.name}</h3>
                <p>{mount.description}</p>
                <small>HP +{mount.bonus.hp} · ATK +{mount.bonus.attack} · DEF +{mount.bonus.defense} · Mana +{mount.bonus.mana} · Energy +{mount.bonus.energy}</small>
                <small>Power +{mount.bonus.power}</small>
                <button disabled={!owned && !affordable} onClick={() => unlockMount(id)}>
                  {active ? "Activ" : owned ? "Equip" : `Unlock: ${mount.cost.gold} gold · ${mount.cost.wood} wood · ${mount.cost.crystals} crystals`}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Paladin Companion</h2>
            <p>Îl poți lăsa să protejeze orașul sau îl poți lua în lupte.</p>
          </div>
          <div className="power-summary">🛡️ Lv. {game.paladin.level}/{paladinMaxLevel}</div>
        </div>

        <div className="paladin-card">
          <div className="big-emoji">🛡️</div>
          <div>
            <h3>Royal Paladin</h3>
            <p>Mod curent: <b>{game.paladin.mode === "city" ? "Protejează orașul" : "Merge în luptă"}</b></p>
            <Progress label="Paladin XP" value={game.paladin.xp} max={game.paladin.xpToNext} />
          </div>
        </div>

        <div className="paladin-modes">
          <button className={game.paladin.mode === "city" ? "active" : ""} onClick={() => setPaladinMode("city")}>🏰 Protejează orașul</button>
          <button className={game.paladin.mode === "battle" ? "active" : ""} onClick={() => setPaladinMode("battle")}>⚔️ Ajută în lupte</button>
        </div>

        <div className="level-rules">
          <div><b>City mode</b><span>+{cityBonus.gold} gold/oră · +{cityBonus.wood} wood/oră · +{cityBonus.crystals} crystals/oră</span></div>
          <div><b>Battle mode</b><span>ATK +{battleBonus.attack} · DEF +{battleBonus.defense} · extra hit {battleBonus.damage}</span></div>
          <div><b>Train cost</b><span>{costText(paladinCost)}</span></div>
          <div><b>Limită training</b><span>Paladinul nu poate depăși nivelul eroului: {paladinMaxLevel}</span></div>
        </div>

        <button className="primary big" disabled={!canPay(paladinCost) || game.paladin.level >= paladinMaxLevel} onClick={trainPaladin}>
          {game.paladin.level >= paladinMaxLevel ? `Paladin Max Lv. ${paladinMaxLevel}` : "Antrenează Paladinul"}
        </button>
      </div>
    </section>
  );
}

function Arena({ game, setGame, session }) {
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("Se încarcă leaderboard-ul...");
  const [selectedId, setSelectedId] = useState("");
  const [battleLog, setBattleLog] = useState([]);
  const [cityAttackStatus, setCityAttackStatus] = useState("");

  async function loadPlayers() {
    setStatus("Se încarcă leaderboard-ul...");
    const result = await fetchPublicPlayers(50);
    if (result.error) {
      setPlayers([]);
      setStatus(`Leaderboard indisponibil: ${result.error}. Rulează scriptul SQL din supabase/schema.sql pentru Update 7.`);
      return;
    }
    setPlayers(result.players);
    setStatus(result.players.length ? "Leaderboard actualizat." : "Nu există încă profiluri publice. Salvează progresul și intră iar după deploy.");
  }

  useEffect(() => {
    if (hasSupabase && session) loadPlayers();
    else setStatus("PvP și leaderboard au nevoie de login Supabase.");
  }, [session]);

  const opponents = players.filter((player) => player.userId !== session?.user?.id);
  const selectedOpponent = opponents.find((player) => player.userId === selectedId) || opponents[0];

  async function launchCityAttack() {
    if (!selectedOpponent || !session || !supabase) {
      setCityAttackStatus("Alege un jucător și intră cu contul Supabase.");
      return;
    }
    setCityAttackStatus("Trimit atacul spre oraș...");
    const { data, error } = await supabase.rpc("launch_city_attack", { target_user_id: selectedOpponent.userId });
    if (error) {
      setCityAttackStatus(`Eroare atac oraș: ${error.message}. Rulează SQL-ul din Update 9.`);
      return;
    }
    const attack = Array.isArray(data) ? data[0] : data;
    const landsAt = attack?.lands_at ? new Date(attack.lands_at).toLocaleTimeString("ro-RO") : "în 10 minute";
    setCityAttackStatus(`Atacul spre ${selectedOpponent.playerName} a fost trimis. Ajunge la ${landsAt}.`);
  }

  function startPvp() {
    if (!selectedOpponent) {
      setBattleLog(["Nu există încă adversari disponibili."]);
      return;
    }

    const result = simulatePvpBattle(game, selectedOpponent);
    setGame((prev) => {
      let next = normalizeGame(prev);
      if (result.won) {
        next.stats.pvpWins += 1;
        next = applyReward(next, result.reward);
      } else {
        next.stats.pvpLosses += 1;
        next.resources.gold += result.reward.gold;
        next.resources.wood += result.reward.wood;
        next.resources.crystals += result.reward.crystals;
        next.xp += result.reward.xp;
      }
      return next;
    });

    setBattleLog([
      result.won ? `Victorie PvP contra ${selectedOpponent.playerName}!` : `Ai pierdut PvP contra ${selectedOpponent.playerName}.`,
      `Reward: ${result.reward.gold} gold · ${result.reward.wood} wood · ${result.reward.crystals} crystals · ${result.reward.xp} XP`,
      ...result.log
    ]);
  }

  return (
    <section className="grid two arena-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Leaderboard</h2>
            <p>Clasament după Power. Se actualizează din profilurile publice salvate în Supabase.</p>
          </div>
          <button onClick={loadPlayers}>Refresh</button>
        </div>

        <div className="leaderboard-list">
          {players.slice(0, 20).map((player, index) => (
            <div className={`leaderboard-row ${player.userId === session?.user?.id ? "self" : ""}`} key={player.userId || index}>
              <b>#{index + 1}</b>
              <span className="lb-name">{player.profile.playerName || player.playerName}</span>
              <span>{player.profile.className || player.className}</span>
              <span>{player.profile.progressionLabel || `Level ${player.profile.level || 1}`}</span>
              <strong>👑 {player.profile.power || 0}</strong>
              <small>Wins {player.profile.wins || 0} · PvP {player.profile.pvpWins || 0}/{player.profile.pvpLosses || 0}</small>
            </div>
          ))}
        </div>

        <div className="notice">{status}</div>
      </div>

      <div className="panel">
        <h2>PvP Arena</h2>
        <p>Alege un jucător din leaderboard și pornește o luptă PvP asincronă. Adversarul este simulat după stats-urile lui publice.</p>

        <div className="pvp-card">
          <label>Alege adversar</label>
          <select value={selectedOpponent?.userId || ""} onChange={(e) => setSelectedId(e.target.value)}>
            {opponents.length === 0 && <option value="">Nu există adversari</option>}
            {opponents.map((player) => (
              <option value={player.userId} key={player.userId}>
                {player.playerName} · Power {player.profile.power || 0}
              </option>
            ))}
          </select>

          {selectedOpponent && (
            <div className="opponent-preview">
              <div className="avatar small">{CLASSES[selectedOpponent.profile.className || selectedOpponent.className]?.emoji || "⚔️"}</div>
              <div>
                <h3>{selectedOpponent.playerName}</h3>
                <p>{selectedOpponent.profile.progressionLabel || "Level ?"} · Power {selectedOpponent.profile.power || 0}</p>
                <small>HP {selectedOpponent.profile.hp || 0} · ATK {selectedOpponent.profile.attack || 0} · DEF {selectedOpponent.profile.defense || 0}</small>
              </div>
            </div>
          )}

          <button className="primary big" onClick={startPvp} disabled={!selectedOpponent}>Start PvP</button>
          <button className="primary big city-attack-button" onClick={launchCityAttack} disabled={!selectedOpponent}>Trimite atac spre oraș · 10 min</button>
          {cityAttackStatus && <div className="notice">{cityAttackStatus}</div>}
        </div>

        <div className="battle-log pvp-log">
          {battleLog.length === 0 ? <div>Nu ai pornit încă o luptă PvP.</div> : battleLog.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
        </div>
      </div>
    </section>
  );
}


function CityDefensePanel({ game, session }) {
  const [attacks, setAttacks] = useState([]);
  const [status, setStatus] = useState(hasSupabase ? "Se verifică atacurile..." : "Atacurile pe orașe au nevoie de Supabase.");
  const [now, setNow] = useState(Date.now());

  async function loadAttacks() {
    if (!hasSupabase || !session) {
      setStatus("Intră cu un cont ca să vezi atacurile incoming.");
      return;
    }

    await supabase.rpc("resolve_due_city_attacks");
    const { data, error } = await supabase.rpc("get_city_attacks_for_player");
    if (error) {
      setStatus(`Atacurile pe orașe nu sunt active: ${error.message}. Rulează SQL-ul din Update 9.`);
      setAttacks([]);
      return;
    }
    setAttacks(data || []);
    setStatus((data || []).length ? "City defense actualizat." : "Nu ai atacuri active sau recente.");
  }

  useEffect(() => {
    loadAttacks();
    const timer = window.setInterval(() => {
      setNow(Date.now());
      loadAttacks();
    }, 20000);
    return () => window.clearInterval(timer);
  }, [session?.user?.id]);

  const incoming = attacks.filter((attack) => attack.defender_id === session?.user?.id && attack.status === "pending");
  const outgoing = attacks.filter((attack) => attack.attacker_id === session?.user?.id && attack.status === "pending");
  const recent = attacks.filter((attack) => attack.status === "resolved").slice(0, 4);
  const towerLevel = game.buildings.watchtower?.level || 1;
  const wallLevel = game.buildings.wall?.level || 1;

  return (
    <div className="city-defense-panel">
      <div className="defense-card strong">
        <b>🧱 City Defense</b>
        <span>{getCityDefensePower(game)} power · Wall Lv. {wallLevel}</span>
      </div>
      <div className="defense-card">
        <b>🗼 Observation Tower</b>
        <span>Lv. {towerLevel} · vede atacurile incoming</span>
      </div>
      <div className="defense-card">
        <b>📡 Incoming</b>
        <span>{incoming.length} atacuri spre oraș</span>
      </div>
      <div className="defense-card">
        <b>⚔️ Outgoing</b>
        <span>{outgoing.length} atacuri trimise</span>
      </div>

      {(incoming.length > 0 || outgoing.length > 0 || recent.length > 0) && (
        <div className="city-attack-list">
          {incoming.map((attack) => (
            <div className="city-attack-row incoming" key={attack.id}>
              <b>Incoming de la {attack.attacker_name}</b>
              <span>Ajunge în {formatCountdown(new Date(attack.lands_at).getTime() - now)} · ATK {attack.attack_power}</span>
            </div>
          ))}
          {outgoing.map((attack) => (
            <div className="city-attack-row outgoing" key={attack.id}>
              <b>Atacul tău spre {attack.defender_name}</b>
              <span>Ajunge în {formatCountdown(new Date(attack.lands_at).getTime() - now)} · ATK {attack.attack_power}</span>
            </div>
          ))}
          {recent.map((attack) => {
            const result = attack.result || {};
            const youAreAttacker = attack.attacker_id === session?.user?.id;
            const win = Boolean(result.attackerWin) === youAreAttacker;
            return (
              <div className="city-attack-row resolved" key={attack.id}>
                <b>{win ? "Victorie" : "Înfrângere"} · {attack.attacker_name} vs {attack.defender_name}</b>
                <span>ATK {result.attackPower || attack.attack_power} · DEF {result.defensePower || attack.defense_power_at_launch}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="notice compact">{status}</div>
    </div>
  );
}

function GuildPanel({ game, setGame, session }) {
  const [guilds, setGuilds] = useState([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState("Se încarcă guild-urile...");

  async function loadGuilds() {
    if (!hasSupabase || !session) {
      setStatus("Guild are nevoie de login Supabase.");
      return;
    }
    const { data, error } = await supabase.rpc("get_guilds", { limit_count: 50 });
    if (error) {
      setStatus(`Guild indisponibil: ${error.message}. Rulează SQL-ul din Update 9.`);
      setGuilds([]);
      return;
    }
    setGuilds(data || []);
    setStatus((data || []).length ? "Guild list actualizat." : "Nu există încă guild-uri. Creează prima alianță.");
  }

  useEffect(() => { loadGuilds(); }, [session?.user?.id]);

  async function createGuild() {
    if (!name.trim() || !tag.trim()) {
      setStatus("Completează numele și tag-ul guild-ului.");
      return;
    }
    const { data, error } = await supabase.rpc("create_guild", { guild_name: name.trim(), guild_tag: tag.trim().toUpperCase().slice(0, 5) });
    if (error) {
      setStatus(`Nu pot crea guild: ${error.message}`);
      return;
    }
    const guild = Array.isArray(data) ? data[0] : data;
    setGame((prev) => ({ ...normalizeGame(prev), guild: { id: guild.id, name: guild.name, tag: guild.tag, role: "leader" } }));
    setStatus(`Guild creat: [${guild.tag}] ${guild.name}`);
    setName("");
    setTag("");
    loadGuilds();
  }

  async function joinGuild(guild) {
    const { error } = await supabase.rpc("join_guild", { target_guild_id: guild.id });
    if (error) {
      setStatus(`Nu poți intra în guild: ${error.message}`);
      return;
    }
    setGame((prev) => ({ ...normalizeGame(prev), guild: { id: guild.id, name: guild.name, tag: guild.tag, role: "member" } }));
    setStatus(`Ai intrat în [${guild.tag}] ${guild.name}`);
    loadGuilds();
  }

  async function leaveGuild() {
    const { error } = await supabase.rpc("leave_guild");
    if (error) {
      setStatus(`Nu poți ieși din guild: ${error.message}`);
      return;
    }
    setGame((prev) => ({ ...normalizeGame(prev), guild: { id: null, name: null, tag: null, role: null } }));
    setStatus("Ai ieșit din guild.");
    loadGuilds();
  }

  return (
    <section className="grid two guild-layout">
      <div className="panel">
        <h2>Guild / Alianță</h2>
        {game.guild?.id ? (
          <div className="guild-current">
            <div className="big-emoji">🛡️</div>
            <h3>[{game.guild.tag}] {game.guild.name}</h3>
            <p>Rol: {game.guild.role || "member"}</p>
            <button className="danger" onClick={leaveGuild}>Ieși din guild</button>
          </div>
        ) : (
          <>
            <p>Nu ești într-o alianță. Creează una sau intră într-un guild existent.</p>
            <label>Nume guild</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="S-Fleet Alliance" />
            <label>Tag</label>
            <input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 5))} placeholder="SFLT" />
            <button className="primary big" onClick={createGuild}>Creează guild</button>
          </>
        )}
        <div className="notice">{status}</div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Guild List</h2>
            <p>Alianțele sunt comune pentru toți jucătorii.</p>
          </div>
          <button onClick={loadGuilds}>Refresh</button>
        </div>
        <div className="guild-list">
          {guilds.map((guild) => (
            <div className="guild-row" key={guild.id}>
              <div>
                <b>[{guild.tag}] {guild.name}</b>
                <span>{guild.members_count || 0} membri · Power {guild.total_power || 0}</span>
              </div>
              <button disabled={Boolean(game.guild?.id)} onClick={() => joinGuild(guild)}>Join</button>
            </div>
          ))}
          {guilds.length === 0 && <div className="empty-inventory">Nu există guild-uri încă.</div>}
        </div>
      </div>
    </section>
  );
}

function AdminPanel({ session }) {
  const [players, setPlayers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("Admin Panel se încarcă...");

  async function loadPlayers() {
    if (!hasSupabase || !session) {
      setStatus("Admin Panel are nevoie de login Supabase.");
      return;
    }
    const adminCheck = await supabase.rpc("is_current_user_admin");
    if (!adminCheck.data) {
      setStatus("Contul tău nu este admin. Adaugă emailul în tabela admin_users din Supabase.");
      return;
    }
    const { data, error } = await supabase.rpc("admin_list_players");
    if (error) {
      setStatus(`Admin Panel indisponibil: ${error.message}. Rulează SQL-ul din Update 9.`);
      return;
    }
    const list = data || [];
    setPlayers(list);
    const first = list[0];
    if (first && !selectedId) {
      setSelectedId(first.user_id);
      setJsonText(JSON.stringify(first.data || {}, null, 2));
    }
    setStatus(`Admin activ pentru ${session.user.email}. Jucători încărcați: ${list.length}`);
  }

  useEffect(() => { loadPlayers(); }, [session?.user?.id]);

  const selected = players.find((player) => player.user_id === selectedId);

  function choosePlayer(id) {
    const player = players.find((p) => p.user_id === id);
    setSelectedId(id);
    setJsonText(JSON.stringify(player?.data || {}, null, 2));
  }

  async function savePlayer() {
    try {
      const parsed = normalizeGame(JSON.parse(jsonText));
      const { error } = await supabase.rpc("admin_update_player_data", { target_user_id: selectedId, new_data: parsed });
      if (error) {
        setStatus(`Eroare salvare admin: ${error.message}`);
        return;
      }
      setStatus("Jucător actualizat. Refresh pentru date noi.");
      loadPlayers();
    } catch (error) {
      setStatus(`JSON invalid: ${error.message}`);
    }
  }

  function grant(resource, amount) {
    try {
      const parsed = normalizeGame(JSON.parse(jsonText));
      parsed.resources[resource] = Math.max(0, Number(parsed.resources[resource] || 0) + amount);
      setJsonText(JSON.stringify(parsed, null, 2));
      setStatus(`Am adăugat ${amount} ${resource}. Apasă Salvează ca să aplici.`);
    } catch (error) {
      setStatus(`Nu pot modifica: ${error.message}`);
    }
  }

  return (
    <section className="grid two admin-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Admin Panel</h2>
            <p>Funcționează doar pentru emailurile adăugate în Supabase `admin_users`.</p>
          </div>
          <button onClick={loadPlayers}>Refresh</button>
        </div>

        <label>Alege jucător</label>
        <select value={selectedId} onChange={(e) => choosePlayer(e.target.value)}>
          {players.map((player) => (
            <option value={player.user_id} key={player.user_id}>{player.email || "no-email"} · {player.player_name}</option>
          ))}
        </select>

        {selected && (
          <div className="admin-summary">
            <b>{selected.player_name}</b>
            <span>{selected.email} · {selected.class_name}</span>
          </div>
        )}

        <div className="admin-grants">
          <button onClick={() => grant("gold", 10000)}>+10k Gold</button>
          <button onClick={() => grant("wood", 10000)}>+10k Wood</button>
          <button onClick={() => grant("crystals", 1000)}>+1k Crystals</button>
          <button onClick={() => grant("diamonds", 250)}>+250 Diamonds</button>
          <button onClick={() => grant("sCoins", 100)}>+100 S-Coins</button>
        </div>

        <div className="notice">{status}</div>
      </div>

      <div className="panel">
        <h2>Modify Anything</h2>
        <p>Editează JSON-ul salvării. Poți schimba level, resurse, buildings, inventory, paladin, guild etc.</p>
        <textarea className="admin-json" value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck="false" />
        <button className="primary big" disabled={!selectedId} onClick={savePlayer}>Salvează modificările</button>
      </div>
    </section>
  );
}

function Quests({ game, setGame }) {
  function claim(quest) {
    if (!quest.check(game) || game.completedQuests.includes(quest.id)) return;
    setGame((prev) => {
      let next = applyReward(prev, quest.reward);
      next.completedQuests = [...next.completedQuests, quest.id];
      return next;
    });
  }

  return (
    <section className="grid three">
      {QUESTS.map((quest) => {
        const ready = quest.check(game);
        const done = game.completedQuests.includes(quest.id);
        return (
          <article className="panel quest" key={quest.id}>
            <h3>🏆 {quest.title}</h3>
            <p>{quest.text}</p>
            <small>Reward: {quest.reward.gold} gold · {quest.reward.wood} wood · {quest.reward.crystals} crystals · {quest.reward.xp} XP</small>
            <button className="primary" disabled={!ready || done} onClick={() => claim(quest)}>
              {done ? "Claimed" : ready ? "Claim reward" : "În progres"}
            </button>
          </article>
        );
      })}
    </section>
  );
}

function Game({ session }) {
  const [game, setGame] = useState(null);
  const [tab, setTab] = useState("city");
  const [saveStatus, setSaveStatus] = useState("...");
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!hasSupabase || !session) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase.rpc("is_current_user_admin");
      setIsAdmin(Boolean(data));
    }
    checkAdmin();
  }, [session]);

  useEffect(() => {
    async function loadGame() {
      setLoading(true);

      if (!hasSupabase || !session) {
        const raw = localStorage.getItem(LOCAL_KEY);
        setGame(normalizeGame(safeJsonParse(raw)));
        setSaveStatus("Local");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("game_saves")
        .select("data")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error) {
        setSaveStatus("Eroare");
        console.error(error);
      }

      setGame(data?.data ? normalizeGame(data.data) : null);
      setSaveStatus(data?.data ? "Cloud" : "New");
      setLoading(false);
    }

    loadGame();
  }, [session]);

  useEffect(() => {
    if (!game || loading) return;

    const timer = window.setTimeout(async () => {
      const normalized = normalizeGame(game);

      if (!hasSupabase || !session) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(normalized));
        setSaveStatus("Local");
        return;
      }

      setSaveStatus("Saving");

      const publicProfile = createPublicProfile(normalized);
      let { error } = await supabase
        .from("game_saves")
        .upsert({
          user_id: session.user.id,
          player_name: normalized.playerName,
          class_name: normalized.className,
          public_profile: publicProfile,
          data: normalized
        }, { onConflict: "user_id" });

      if (error && String(error.message || "").toLowerCase().includes("public_profile")) {
        const fallback = await supabase
          .from("game_saves")
          .upsert({
            user_id: session.user.id,
            player_name: normalized.playerName,
            class_name: normalized.className,
            data: normalized
          }, { onConflict: "user_id" });
        error = fallback.error;
      }

      setSaveStatus(error ? "Eroare" : "Cloud");
      if (error) console.error(error);
    }, 550);

    return () => window.clearTimeout(timer);
  }, [game, session, loading]);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  }

  function startGame(playerName, className) {
    setGame(createStarterGame(playerName, className));
  }

  function resetSave() {
    const ok = window.confirm("Sigur vrei să resetezi progresul acestui cont?");
    if (!ok) return;
    setGame(null);
  }

  if (loading) {
    return <main className="shell center"><div className="panel"><h2>Se încarcă salvarea...</h2></div></main>;
  }

  if (!game) {
    return <Onboarding onStart={startGame} />;
  }

  return (
    <main className="shell">
      <TopBar game={game} session={session} onLogout={logout} saveStatus={saveStatus} />
      <Resources game={game} />

      <nav className="tabs">
        <button className={tab === "city" ? "active" : ""} onClick={() => setTab("city")}>🏰 Oraș</button>
        <button className={tab === "battle" ? "active" : ""} onClick={() => setTab("battle")}>💀 Luptă</button>
        <button className={tab === "world" ? "active" : ""} onClick={() => setTab("world")}>🗺️ World</button>
        <button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>🎒 Inventory</button>
        <button className={tab === "shop" ? "active" : ""} onClick={() => setTab("shop")}>🛒 Shop</button>
        <button className={tab === "trade" ? "active" : ""} onClick={() => setTab("trade")}>🤝 Trade</button>
        <button className={tab === "hero" ? "active" : ""} onClick={() => setTab("hero")}>🧙 Erou</button>
        <button className={tab === "companions" ? "active" : ""} onClick={() => setTab("companions")}>🐴 Companions</button>
        <button className={tab === "arena" ? "active" : ""} onClick={() => setTab("arena")}>🏆 Arena</button>
        <button className={tab === "guild" ? "active" : ""} onClick={() => setTab("guild")}>🛡️ Guild</button>
        {isAdmin && <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>🧰 Admin</button>}
        <button className={tab === "quests" ? "active" : ""} onClick={() => setTab("quests")}>📜 Questuri</button>
        <button className="danger-tab" onClick={resetSave}>Reset progres</button>
      </nav>

      {tab === "city" && <City game={game} setGame={setGame} session={session} />}
      {tab === "battle" && <Battle game={game} setGame={setGame} />}
      {tab === "world" && <Dungeon game={game} setGame={setGame} />}
      {tab === "inventory" && <Inventory game={game} setGame={setGame} />}
      {tab === "shop" && <Shop game={game} setGame={setGame} />}
      {tab === "trade" && <TradeCenter game={game} setGame={setGame} session={session} />}
      {tab === "hero" && <Hero game={game} />}
      {tab === "companions" && <Companions game={game} setGame={setGame} />}
      {tab === "arena" && <Arena game={game} setGame={setGame} session={session} />}
      {tab === "guild" && <GuildPanel game={game} setGame={setGame} session={session} />}
      {tab === "admin" && isAdmin && <AdminPanel session={session} />}
      {tab === "quests" && <Quests game={game} setGame={setGame} />}
    </main>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || "Eroare necunoscută" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="shell center">
          <section className="panel recovery-panel">
            <h1>S-Fleet Fantasy War ⚔️</h1>
            <h2>Jocul a prins o eroare, dar nu mai lăsăm pagina neagră.</h2>
            <p>Apasă Reload. Dacă problema continuă, intră din nou după ce urci Update 7 complet pe GitHub și rulezi SQL-ul pentru leaderboard.</p>
            <div className="notice">Detaliu tehnic: {this.state.message}</div>
            <button className="primary big" onClick={() => window.location.reload()}>Reload game</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

function AppCore() {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(false);
  const [demoMode, setDemoMode] = useState(!hasSupabase);

  useEffect(() => {
    if (!hasSupabase) {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (!ready) {
    return <main className="shell center"><div className="panel"><h2>Se pregătește jocul...</h2></div></main>;
  }

  if (!hasSupabase || demoMode) {
    return (
      <>
        <Game session={null} />
        <div className="floating-demo">
          Demo local
          {hasSupabase && <button onClick={() => setDemoMode(false)}>Activează login</button>}
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen onSession={setSession} />
        <button className="demo-switch" onClick={() => setDemoMode(true)}>Testează fără cont</button>
      </>
    );
  }

  return <Game session={session} />;
}


export default function App() {
  return (
    <AppErrorBoundary>
      <AppCore />
    </AppErrorBoundary>
  );
}
