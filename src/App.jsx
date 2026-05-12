import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const MAX_CITADEL_LEVEL = 50;
const MAX_HERO_LEVEL = 100;
const MAX_PARAGON_LEVEL = 250;

const MAX_VIP_LEVEL = 10;

const VIP_LEVELS = [
  { level: 1, cost: 8, bonus: { resource: 3, xp: 2, build: 1, pvp: 1 }, label: "VIP I" },
  { level: 2, cost: 12, bonus: { resource: 5, xp: 4, build: 2, pvp: 2 }, label: "VIP II" },
  { level: 3, cost: 18, bonus: { resource: 8, xp: 6, build: 3, pvp: 3 }, label: "VIP III" },
  { level: 4, cost: 25, bonus: { resource: 10, xp: 8, build: 4, pvp: 4 }, label: "VIP IV" },
  { level: 5, cost: 35, bonus: { resource: 13, xp: 10, build: 5, pvp: 5 }, label: "VIP V" },
  { level: 6, cost: 48, bonus: { resource: 16, xp: 12, build: 6, pvp: 6 }, label: "VIP VI" },
  { level: 7, cost: 64, bonus: { resource: 19, xp: 14, build: 7, pvp: 7 }, label: "VIP VII" },
  { level: 8, cost: 82, bonus: { resource: 22, xp: 16, build: 8, pvp: 8 }, label: "VIP VIII" },
  { level: 9, cost: 105, bonus: { resource: 26, xp: 18, build: 9, pvp: 9 }, label: "VIP IX" },
  { level: 10, cost: 135, bonus: { resource: 30, xp: 22, build: 10, pvp: 12 }, label: "VIP X" }
];

const TITLES = {
  novice: { label: "Novice Lord", emoji: "🌱", bonus: { hp: 0, attack: 0, defense: 0, mana: 0, power: 0 } },
  goblin_slayer: { label: "Goblin Slayer", emoji: "🧌", bonus: { hp: 20, attack: 3, defense: 1, mana: 0, power: 120 } },
  city_builder: { label: "City Builder", emoji: "🏰", bonus: { hp: 35, attack: 0, defense: 4, mana: 0, power: 180 } },
  arena_champion: { label: "Arena Champion", emoji: "🏆", bonus: { hp: 40, attack: 6, defense: 2, mana: 0, power: 260 } },
  paragon: { label: "Paragon Hero", emoji: "⭐", bonus: { hp: 80, attack: 8, defense: 5, mana: 30, power: 450 } },
  guild_guardian: { label: "Guild Guardian", emoji: "🛡️", bonus: { hp: 100, attack: 5, defense: 10, mana: 0, power: 520 } },
  world_bane: { label: "World Bane", emoji: "🐉", bonus: { hp: 120, attack: 12, defense: 6, mana: 40, power: 760 } }
};

const ACHIEVEMENTS = [
  { id: "wins_10", title: "Fighter", text: "Win 10 battles.", titleId: "goblin_slayer", reward: { diamonds: 15, xp: 120 }, check: (game) => (game.stats.wins || 0) >= 10 },
  { id: "citadel_10", title: "Stone Kingdom", text: "Upgrade the Citadel to level 10.", titleId: "city_builder", reward: { gold: 2500, wood: 1800, crystals: 120 }, check: (game) => (game.buildings.citadel?.level || 1) >= 10 },
  { id: "pvp_10", title: "Arena Champion", text: "Win 10 PvP battles.", titleId: "arena_champion", reward: { diamonds: 30, sCoins: 2, xp: 200 }, check: (game) => (game.stats.pvpWins || 0) >= 10 },
  { id: "paragon_1", title: "Beyond Level 100", text: "Reach your first Paragon level.", titleId: "paragon", reward: { diamonds: 50, sCoins: 4 }, check: (game) => (game.paragonLevel || 0) >= 1 },
  { id: "guild_member", title: "Alliance Oath", text: "Join an alliance.", titleId: "guild_guardian", reward: { gold: 1800, crystals: 80 }, check: (game) => Boolean(game.guild?.id) },
  { id: "world_boss_5000", title: "World Boss Hunter", text: "Deal 5000 total damage to the World Boss.", titleId: "world_bane", reward: { diamonds: 75, sCoins: 5 }, check: (game) => (game.stats.worldBossDamage || 0) >= 5000 }
];

const WORLD_BOSS_CONFIG = {
  id: "ancient_dragon",
  name: "Ancient Dragon",
  emoji: "🐉",
  maxHp: 500000,
  durationHours: 24,
  rewardPreview: "Gold, Diamonds, S-Coins and rare items based on damage dealt."
};



const CLASS_EVOLUTIONS = {
  Knight: {
    Paladin: { emoji: "🛡️", bonus: { hp: 220, attack: 20, defense: 36, mana: 40, power: 1400 }, text: "Holy defender focused on city defense and survival." },
    Warlord: { emoji: "⚔️", bonus: { hp: 140, attack: 42, defense: 18, mana: 10, power: 1450 }, text: "Offensive commander with stronger raids and PvP pressure." }
  },
  Mage: {
    Archmage: { emoji: "🌌", bonus: { hp: 80, attack: 55, defense: 8, mana: 120, power: 1500 }, text: "Pure magic damage and larger mana pool." },
    Necromancer: { emoji: "☠️", bonus: { hp: 150, attack: 38, defense: 16, mana: 80, power: 1450 }, text: "Dark magic with improved sustain and boss damage." }
  },
  Archer: {
    Ranger: { emoji: "🏹", bonus: { hp: 130, attack: 38, defense: 18, mana: 55, power: 1425 }, text: "Balanced hunter with strong PvE control." },
    Assassin: { emoji: "🗡️", bonus: { hp: 80, attack: 58, defense: 8, mana: 35, power: 1500 }, text: "Critical burst specialist for PvP and raids." }
  }
};

const CAMPAIGN_CHAPTERS = [
  { id: "chapter_1", title: "Chapter I · Goblin Forest", req: 1, reward: { gold: 900, wood: 500, xp: 160 }, text: "Clear the forest and secure the first trade road." },
  { id: "chapter_2", title: "Chapter II · Wolf Valley", req: 8, reward: { gold: 1800, wood: 900, crystals: 80, xp: 280 }, text: "Hunt the dark wolves threatening the border villages." },
  { id: "chapter_3", title: "Chapter III · Skeleton Crypt", req: 18, reward: { gold: 3200, crystals: 160, diamonds: 15, xp: 480 }, text: "Enter the crypt and break the undead army." },
  { id: "chapter_4", title: "Chapter IV · Infernal Gate", req: 35, reward: { gold: 5200, wood: 2800, diamonds: 35, xp: 760 }, text: "Close the infernal gate before it burns the kingdom." },
  { id: "chapter_5", title: "Chapter V · Dragon Citadel", req: 60, reward: { gold: 9000, crystals: 450, diamonds: 65, sCoins: 3, xp: 1250 }, text: "Challenge the dragon citadel and claim royal glory." }
];

const SEASON_REWARDS = [
  { tier: 1, points: 50, reward: { gold: 1000, xp: 100 } },
  { tier: 2, points: 150, reward: { wood: 1200, crystals: 80 } },
  { tier: 3, points: 300, reward: { diamonds: 25, xp: 300 } },
  { tier: 4, points: 600, reward: { gold: 5000, diamonds: 40, sCoins: 1 } },
  { tier: 5, points: 1000, reward: { diamonds: 80, sCoins: 4 } }
];

function getEvolutionBonus(game) {
  const evolution = game?.evolution;
  const data = CLASS_EVOLUTIONS[game?.className]?.[evolution];
  return data?.bonus || { hp: 0, attack: 0, defense: 0, mana: 0, power: 0 };
}

const LOCAL_KEY = "s_fleet_fantasy_war_local_save_v16";

const CLASSES = {
  Knight: {
    emoji: "🛡️",
    title: "Knight",
    description: "Strong tank with high health and solid defense.",
    base: { hp: 160, attack: 18, defense: 12, mana: 35 },
    skill: { name: "Shield Break", cost: 12, power: 1.75 }
  },
  Mage: {
    emoji: "✨",
    title: "Mage",
    description: "High magic damage, but lower defense.",
    base: { hp: 110, attack: 27, defense: 5, mana: 75 },
    skill: { name: "Arcane Burst", cost: 18, power: 2.1 }
  },
  Archer: {
    emoji: "🏹",
    title: "Archer",
    description: "Balanced class with fast attacks and good critical potential.",
    base: { hp: 130, attack: 22, defense: 8, mana: 52 },
    skill: { name: "Rain Arrow", cost: 15, power: 1.9 }
  }
};

const BUILDINGS = {
  citadel: {
    emoji: "🏰",
    name: "Citadel",
    description: "The heart of the kingdom. Increases HP, defense and power.",
    baseCost: { gold: 120, wood: 80, crystals: 10 }
  },
  barracks: {
    emoji: "⚔️",
    name: "Barracks",
    description: "Trains soldiers. Increases hero attack.",
    baseCost: { gold: 95, wood: 55, crystals: 8 }
  },
  mine: {
    emoji: "⛏️",
    name: "Gold Mine",
    description: "Produces gold and supports the kingdom economy.",
    baseCost: { gold: 75, wood: 45, crystals: 5 }
  },
  lumber: {
    emoji: "🪓",
    name: "Wood Collector",
    description: "Collects wood for construction. Works like the Gold Mine, but for wood.",
    baseCost: { gold: 85, wood: 35, crystals: 6 }
  },
  academy: {
    emoji: "🔮",
    name: "Arcane Academy",
    description: "Increases mana and magical power.",
    baseCost: { gold: 110, wood: 65, crystals: 12 }
  },
  wall: {
    emoji: "🧱",
    name: "Protection Wall",
    description: "The protection wall defends the city when other players launch attacks.",
    baseCost: { gold: 180, wood: 220, crystals: 18 }
  },
  watchtower: {
    emoji: "🗼",
    name: "Observation Tower",
    description: "The observation tower shows attacks heading toward your city.",
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
    description: "Starter forest, good for gold, XP and first items.",
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
    description: "Dangerous valley with fast wolves and more frequent Rare drops.",
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
    description: "Dark crypt for players with better equipment. Epic drops can appear more often.",
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
    description: "Hard zone for Legendary drops, a powerful boss and big rewards.",
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
    description: "Starter mount for faster travel between dungeons.",
    cost: { gold: 0, wood: 0, crystals: 0 },
    bonus: { hp: 20, attack: 2, defense: 1, mana: 0, energy: 1, power: 90 }
  },
  war_wolf: {
    name: "War Wolf",
    emoji: "🐺",
    description: "Aggressive mount, good for attack and dungeon farming.",
    cost: { gold: 1200, wood: 450, crystals: 80 },
    bonus: { hp: 45, attack: 7, defense: 3, mana: 0, energy: 3, power: 260 }
  },
  crystal_stag: {
    name: "Crystal Stag",
    emoji: "🦌",
    description: "Magic mount that increases mana and max energy.",
    cost: { gold: 2200, wood: 650, crystals: 160 },
    bonus: { hp: 55, attack: 4, defense: 4, mana: 40, energy: 5, power: 430 }
  },
  dragon_whelp: {
    name: "Dragon Whelp",
    emoji: "🐉",
    description: "Rare mount with a large power, attack and survivability bonus.",
    cost: { gold: 5200, wood: 1300, crystals: 420 },
    bonus: { hp: 120, attack: 14, defense: 8, mana: 60, energy: 8, power: 980 }
  }
};

const QUESTS = [
  {
    id: "first_blood",
    title: "First Blood",
    text: "Win your first battle against monsters.",
    reward: { gold: 120, wood: 50, crystals: 10, xp: 45 },
    check: (game) => game.stats.wins >= 1
  },
  {
    id: "builder",
    title: "Young Builder",
    text: "Upgrade any building to level 2.",
    reward: { gold: 160, wood: 95, crystals: 15, xp: 65 },
    check: (game) => Object.values(game.buildings).some((b) => b.level >= 2)
  },
  {
    id: "collector",
    title: "Loot Collector",
    text: "Collect at least 3 items in inventory or equipped.",
    reward: { gold: 220, wood: 80, crystals: 22, xp: 85 },
    check: (game) => totalItemCount(game) >= 3
  },
  {
    id: "dungeon_runner",
    title: "Dungeon Runner",
    text: "Win 3 battles in World Map / Dungeon.",
    reward: { gold: 300, wood: 120, crystals: 35, xp: 130 },
    check: (game) => (game.stats.dungeonWins || 0) >= 3
  },
  {
    id: "boss_slayer",
    title: "Boss Slayer",
    text: "Defeat your first zone boss.",
    reward: { gold: 500, wood: 180, crystals: 60, xp: 220 },
    check: (game) => (game.stats.bossKills || 0) >= 1
  },
  {
    id: "first_mount",
    title: "Mounted Hero",
    text: "Equip your first mount.",
    reward: { gold: 260, wood: 120, crystals: 30, xp: 120 },
    check: (game) => Boolean(game.mounts?.active)
  },
  {
    id: "paladin_guard",
    title: "City Protector",
    text: "Set the Paladin to protect the city.",
    reward: { gold: 260, wood: 150, crystals: 35, xp: 130 },
    check: (game) => game.paladin?.mode === "city"
  },
  {
    id: "veteran",
    title: "Arena Veteran",
    text: "Win 5 battles.",
    reward: { gold: 350, wood: 140, crystals: 30, xp: 140 },
    check: (game) => game.stats.wins >= 5
  }
];

const DAILY_LOGIN_REWARDS = [
  { day: 1, label: "Day 1", reward: { gold: 500 } },
  { day: 2, label: "Day 2", reward: { wood: 350, crystals: 20 } },
  { day: 3, label: "Day 3", reward: { diamonds: 20 } },
  { day: 4, label: "Day 4", reward: { sCoins: 3 } },
  { day: 5, label: "Day 5", reward: { gold: 1500, wood: 900, crystals: 90 } },
  { day: 6, label: "Day 6", reward: { energyFull: true } },
  { day: 7, label: "Day 7", reward: { sCoins: 7, diamonds: 50, chestBoost: 4 } }
];

const DAILY_QUESTS = [
  {
    id: "daily_wins",
    title: "Win 5 battles",
    text: "Any normal battle or dungeon battle counts.",
    target: 5,
    getProgress: (game) => game.daily?.progress?.combatWins || 0,
    reward: { gold: 650, crystals: 25, xp: 85 }
  },
  {
    id: "daily_collect",
    title: "Collect resources",
    text: "Use the hourly collection in the city.",
    target: 1,
    getProgress: (game) => game.daily?.progress?.collections || 0,
    reward: { wood: 500, diamonds: 5, xp: 45 }
  },
  {
    id: "daily_paladin",
    title: "Train the Paladin",
    text: "Complete one Paladin training.",
    target: 1,
    getProgress: (game) => game.daily?.progress?.paladinTraining || 0,
    reward: { gold: 500, crystals: 35, xp: 70 }
  },
  {
    id: "daily_sell",
    title: "Sell 3 items",
    text: "Use Sell or Sell entire inventory.",
    target: 3,
    getProgress: (game) => game.daily?.progress?.itemsSold || 0,
    reward: { gold: 800, diamonds: 8, xp: 55 }
  },
  {
    id: "daily_city_attack",
    title: "Launch a city attack",
    text: "Launch a city attack from the Arena.",
    target: 1,
    getProgress: (game) => game.daily?.progress?.cityAttacks || 0,
    reward: { gold: 900, sCoins: 1, xp: 90 }
  }
];

function createStarterGame(playerName = "Lord S-Fleet", className = "Knight") {
  return {
    version: 15,
    playerName,
    className,
    level: 1,
    paragonLevel: 0,
    xp: 0,
    xpToNext: 100,
    resources: { gold: 350, wood: 220, crystals: 45, diamonds: 20, sCoins: 0, energy: 10 },
    vip: { level: 0 },
    achievements: { claimed: [] },
    title: "novice",
    worldBoss: { totalDamage: 0, attacksToday: 0, lastAttackDate: null },
    city: { lastResourceCollectionAt: null, shieldUntil: null },
    daily: {
      date: todayKey(),
      login: { lastClaimedDate: null, streak: 0 },
      progress: { combatWins: 0, dungeonWins: 0, collections: 0, paladinTraining: 0, itemsSold: 0, cityAttacks: 0 },
      claimedQuests: []
    },
    mail: [],
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
    stats: { wins: 0, losses: 0, itemsFound: 0, dungeonWins: 0, bossKills: 0, pvpWins: 0, pvpLosses: 0, cityAttackWins: 0, cityAttackLosses: 0, cityDefenseWins: 0, cityDefenseLosses: 0, worldBossDamage: 0, guildWarScore: 0 },
    completedQuests: [],
    world: { selectedZoneId: "goblin_forest", completedBosses: [], clears: {} },
    createdAt: new Date().toISOString()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("ro-RO", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return String(value);
  }
}

function normalizeDaily(daily) {
  const today = todayKey();
  const next = {
    date: today,
    login: { lastClaimedDate: null, streak: 0 },
    progress: { combatWins: 0, dungeonWins: 0, collections: 0, paladinTraining: 0, itemsSold: 0, cityAttacks: 0 },
    claimedQuests: [],
    ...(daily || {})
  };
  next.login = { lastClaimedDate: null, streak: 0, ...(next.login || {}) };
  next.progress = { combatWins: 0, dungeonWins: 0, collections: 0, paladinTraining: 0, itemsSold: 0, cityAttacks: 0, ...(next.progress || {}) };
  next.claimedQuests = Array.isArray(next.claimedQuests) ? next.claimedQuests : [];
  if (next.date !== today) {
    next.date = today;
    next.progress = { combatWins: 0, dungeonWins: 0, collections: 0, paladinTraining: 0, itemsSold: 0, cityAttacks: 0 };
    next.claimedQuests = [];
  }
  return next;
}

function rewardText(reward = {}) {
  const parts = [];
  if (reward.gold) parts.push(`${reward.gold} gold`);
  if (reward.wood) parts.push(`${reward.wood} wood`);
  if (reward.crystals) parts.push(`${reward.crystals} crystals`);
  if (reward.diamonds) parts.push(`${reward.diamonds} diamonds`);
  if (reward.sCoins) parts.push(`${reward.sCoins} S-Coins`);
  if (reward.xp) parts.push(`${reward.xp} XP`);
  if (reward.energyFull) parts.push("full energy");
  if (reward.chestBoost) parts.push("premium chest");
  return parts.join(" · ") || "Reward";
}

function addMail(game, title, body, type = "info") {
  const next = game;
  next.mail = Array.isArray(next.mail) ? next.mail : [];
  next.mail.unshift({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    title,
    body,
    type,
    read: false,
    createdAt: new Date().toISOString()
  });
  next.mail = next.mail.slice(0, 80);
  return next;
}

function unreadMailCount(game) {
  return (game.mail || []).filter((mail) => !mail.read).length;
}

function isShieldActivee(game, now = Date.now()) {
  const shieldUntil = game.city?.shieldUntil ? new Date(game.city.shieldUntil).getTime() : 0;
  return Boolean(shieldUntil && shieldUntil > now);
}

function shieldRemaining(game, now = Date.now()) {
  const shieldUntil = game.city?.shieldUntil ? new Date(game.city.shieldUntil).getTime() : 0;
  return Math.max(0, shieldUntil - now);
}

function addShield(game, hours) {
  const next = normalizeGame(game);
  const base = Math.max(Date.now(), next.city.shieldUntil ? new Date(next.city.shieldUntil).getTime() : 0);
  next.city.shieldUntil = new Date(base + hours * 3600000).toISOString();
  addMail(next, "Shield activated", `Your city is protected until ${formatDateTime(next.city.shieldUntil)}.`, "shield");
  return next;
}

function claimDailyLoginReward(game) {
  let next = normalizeGame(game);
  const today = todayKey();
  if (next.daily.login.lastClaimedDate === today) return { game: next, claimed: false, message: "Daily reward has already been claimed." };

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = todayKey(yesterday);
  const previousStreak = next.daily.login.lastClaimedDate === yesterdayKey ? next.daily.login.streak : 0;
  const newStreak = previousStreak >= 7 ? 1 : previousStreak + 1;
  const reward = DAILY_LOGIN_REWARDS[newStreak - 1].reward;

  next = applyReward(next, reward);
  if (reward.energyFull) next.resources.energy = getMaxEnergy(next);
  if (reward.chestBoost && next.inventory.length < 80) {
    const item = createItem(getProgressionLevel(next), "Daily Login Reward", reward.chestBoost);
    next.inventory.push(item);
    next.stats.itemsFound += 1;
  }
  next.daily.login.lastClaimedDate = today;
  next.daily.login.streak = newStreak;
  addMail(next, "Daily Login Reward", `You claimed Day ${newStreak}: ${rewardText(reward)}.`, "daily");
  return { game: next, claimed: true, message: `You claimed the reward for Day ${newStreak}.` };
}

function claimDailyQuestReward(game, questId) {
  let next = normalizeGame(game);
  const quest = DAILY_QUESTS.find((item) => item.id === questId);
  if (!quest) return { game: next, claimed: false, message: "Quest invalid." };
  if (next.daily.claimedQuests.includes(questId)) return { game: next, claimed: false, message: "Quest already claimed." };
  const progress = Math.min(quest.target, quest.getProgress(next));
  if (progress < quest.target) return { game: next, claimed: false, message: "The quest is not complete." };
  next = applyReward(next, quest.reward);
  next.daily.claimedQuests.push(questId);
  addMail(next, "Daily Quest completed", `${quest.title}: ${rewardText(quest.reward)}.`, "daily");
  return { game: next, claimed: true, message: `You claimed ${quest.title}.` };
}

function normalizeGame(game) {
  if (!game || typeof game !== "object") return null;
  const next = clone(game);
  next.version = 16;
  if (!CLASSES[next.className]) next.className = "Knight";
  next.playerName = typeof next.playerName === "string" && next.playerName.trim() ? next.playerName.trim() : "Lord S-Fleet";
  next.resources = { gold: 0, wood: 0, crystals: 0, diamonds: 0, sCoins: 0, energy: 10, ...(next.resources || {}) };
  next.resources.gold = Math.max(0, Math.floor(Number(next.resources.gold) || 0));
  next.resources.wood = Math.max(0, Math.floor(Number(next.resources.wood) || 0));
  next.resources.crystals = Math.max(0, Math.floor(Number(next.resources.crystals) || 0));
  next.resources.diamonds = Math.max(0, Math.floor(Number(next.resources.diamonds) || 0));
  next.resources.sCoins = Math.max(0, Math.floor(Number(next.resources.sCoins) || 0));
  const parsedEnergy = Number(next.resources.energy);
  next.resources.energy = next.resources.energy === undefined || next.resources.energy === null || next.resources.energy === ""
    ? 10
    : Math.max(0, Math.floor(Number.isFinite(parsedEnergy) ? parsedEnergy : 0));
  next.city = { lastResourceCollectionAt: null, shieldUntil: null, ...(next.city || {}) };
  next.daily = normalizeDaily(next.daily);
  next.mail = Array.isArray(next.mail) ? next.mail.filter(Boolean).slice(0, 80) : [];
  next.guild = { id: null, name: null, tag: null, role: null, ...(next.guild || {}) };
  next.level = Math.max(1, Math.min(MAX_HERO_LEVEL, Math.floor(Number(next.level) || 1)));
  next.paragonLevel = Math.max(0, Math.min(MAX_PARAGON_LEVEL, Math.floor(Number(next.paragonLevel) || 0)));
  if (next.level < MAX_HERO_LEVEL) next.paragonLevel = 0;
  next.classLocked = true;
  next.vip = { level: 0, ...(next.vip || {}) };
  next.vip.level = Math.max(0, Math.min(MAX_VIP_LEVEL, Math.floor(Number(next.vip.level) || 0)));
  next.achievements = { claimed: [], ...(next.achievements || {}) };
  next.achievements.claimed = Array.isArray(next.achievements.claimed) ? next.achievements.claimed : [];
  next.title = TITLES[next.title] ? next.title : "novice";
  next.worldBoss = { totalDamage: 0, attacksToday: 0, lastAttackDate: null, ...(next.worldBoss || {}) };
  if (next.worldBoss.lastAttackDate !== todayKey()) {
    next.worldBoss.lastAttackDate = todayKey();
    next.worldBoss.attacksToday = 0;
  }
  next.worldBoss.totalDamage = Math.max(0, Math.floor(Number(next.worldBoss.totalDamage) || 0));
  next.worldBoss.attacksToday = Math.max(0, Math.floor(Number(next.worldBoss.attacksToday) || 0));
  if (next.evolution && !CLASS_EVOLUTIONS[next.className]?.[next.evolution]) next.evolution = null;
  next.campaign = { completed: [], ...(next.campaign || {}) };
  next.campaign.completed = Array.isArray(next.campaign.completed) ? next.campaign.completed : [];
  next.season = { points: 0, claimed: [], premium: false, ...(next.season || {}) };
  next.season.points = Math.max(0, Math.floor(Number(next.season.points) || 0));
  next.season.claimed = Array.isArray(next.season.claimed) ? next.season.claimed : [];
  next.tutorial = { done: false, step: 0, ...(next.tutorial || {}) };
  next.blacksmith = { dust: 0, gems: 0, logs: [], ...(next.blacksmith || {}) };
  next.blacksmith.dust = Math.max(0, Math.floor(Number(next.blacksmith.dust) || 0));
  next.blacksmith.gems = Math.max(0, Math.floor(Number(next.blacksmith.gems) || 0));
  next.blacksmith.logs = Array.isArray(next.blacksmith.logs) ? next.blacksmith.logs.slice(0, 40) : [];
  next.coinRequests = Array.isArray(next.coinRequests) ? next.coinRequests.slice(0, 20) : [];
  next.securityLogs = Array.isArray(next.securityLogs) ? next.securityLogs.slice(0, 80) : [];

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

  next.inventory = Array.isArray(next.inventory) ? next.inventory.filter(Boolean).slice(0, 80).map(normalizeItem) : [];
  next.equipment = { weapon: null, armor: null, ring: null, amulet: null, ...(next.equipment || {}) };
  Object.keys(SLOTS).forEach((slot) => {
    if (next.equipment[slot] && next.equipment[slot].slot !== slot) next.equipment[slot] = null;
    if (next.equipment[slot]) next.equipment[slot] = normalizeItem(next.equipment[slot]);
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

  next.stats = { wins: 0, losses: 0, itemsFound: 0, dungeonWins: 0, bossKills: 0, pvpWins: 0, pvpLosses: 0, cityAttackWins: 0, cityAttackLosses: 0, cityDefenseWins: 0, cityDefenseLosses: 0, worldBossDamage: 0, guildWarScore: 0, ...(next.stats || {}) };
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


function normalizeItem(item) {
  if (!item || typeof item !== "object") return item;
  const next = { ...item };
  next.upgrade = Math.max(0, Math.min(15, Math.floor(Number(next.upgrade) || 0)));
  next.gems = Array.isArray(next.gems) ? next.gems.slice(0, 3) : [];
  const upgradeBonus = next.upgrade;
  const gemBonus = next.gems.length;
  next.stats = { hp: 0, attack: 0, defense: 0, mana: 0, ...(next.stats || {}) };
  next.displayPower = Math.round((next.power || 0) + upgradeBonus * 80 + gemBonus * 120);
  return next;
}

function itemStatsText(item) {
  if (!item) return "Empty";
  const parts = [];
  if (item.stats.hp) parts.push(`HP +${item.stats.hp}`);
  if (item.stats.attack) parts.push(`ATK +${item.stats.attack}`);
  if (item.stats.defense) parts.push(`DEF +${item.stats.defense}`);
  if (item.stats.mana) parts.push(`Mana +${item.stats.mana}`);
  if (item.upgrade) parts.push(`+${item.upgrade}`);
  if (item.gems?.length) parts.push(`${item.gems.length} gem${item.gems.length > 1 ? "s" : ""}`);
  return parts.join(" · ") || "No stats";
}

function equipmentBonus(game) {
  const bonus = { hp: 0, attack: 0, defense: 0, mana: 0, power: 0 };
  Object.values(game.equipment || {}).filter(Boolean).forEach((item) => {
    const upgrade = Math.max(0, Number(item.upgrade) || 0);
    const gems = Array.isArray(item.gems) ? item.gems.length : 0;
    bonus.hp += (item.stats.hp || 0) + upgrade * 8 + gems * 14;
    bonus.attack += (item.stats.attack || 0) + upgrade * 2 + gems * 3;
    bonus.defense += (item.stats.defense || 0) + upgrade * 2 + gems * 3;
    bonus.mana += (item.stats.mana || 0) + upgrade * 4 + gems * 8;
    bonus.power += (item.power || 0) + upgrade * 80 + gems * 120;
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

function getVipData(game) {
  const level = Math.max(0, Math.min(MAX_VIP_LEVEL, Number(game.vip?.level || 0)));
  return level > 0 ? VIP_LEVELS[level - 1] : { level: 0, cost: VIP_LEVELS[0].cost, bonus: { resource: 0, xp: 0, build: 0, pvp: 0 }, label: "VIP 0" };
}

function getVipBonus(game) {
  return getVipData(game).bonus;
}

function getTitleData(game) {
  return TITLES[game.title] || TITLES.novice;
}

function getTitleBonus(game) {
  return getTitleData(game).bonus;
}

function getUnlockedTitles(game) {
  const unlocked = new Set(["novice"]);
  ACHIEVEMENTS.forEach((achievement) => {
    if (game.achievements?.claimed?.includes(achievement.id) && achievement.titleId) unlocked.add(achievement.titleId);
  });
  return Array.from(unlocked).filter((titleId) => TITLES[titleId]);
}

function getAchievementProgressText(game, achievement) {
  if (achievement.id === "wins_10") return `${Math.min(game.stats.wins || 0, 10)}/10`;
  if (achievement.id === "citadel_10") return `${Math.min(game.buildings.citadel?.level || 1, 10)}/10`;
  if (achievement.id === "pvp_10") return `${Math.min(game.stats.pvpWins || 0, 10)}/10`;
  if (achievement.id === "paragon_1") return `${Math.min(game.paragonLevel || 0, 1)}/1`;
  if (achievement.id === "guild_member") return game.guild?.id ? "1/1" : "0/1";
  if (achievement.id === "world_boss_5000") return `${Math.min(game.stats.worldBossDamage || 0, 5000)}/5000`;
  return achievement.check(game) ? "Done" : "In progress";
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
  const title = getTitleBonus(game);
  const evolution = getEvolutionBonus(game);
  const vip = getVipBonus(game);
  const progression = getProgressionLevel(game);

  const hp = Math.round((base.hp + levelBonus * 18 + (game.paragonLevel || 0) * 6 + b.citadel.level * 12 + gear.hp + mount.hp + paladin.hp + title.hp + evolution.hp) * (1 + (vip.pvp || 0) / 200));
  const attack = Math.round((base.attack + levelBonus * 4 + (game.paragonLevel || 0) * 1 + b.barracks.level * 3 + gear.attack + mount.attack + paladin.attack + title.attack + evolution.attack) * (1 + (vip.pvp || 0) / 250));
  const defense = Math.round((base.defense + levelBonus * 2 + Math.floor((game.paragonLevel || 0) * 0.7) + b.citadel.level * 2 + gear.defense + mount.defense + paladin.defense + title.defense + evolution.defense) * (1 + (vip.pvp || 0) / 250));
  const mana = base.mana + levelBonus * 7 + (game.paragonLevel || 0) * 2 + b.academy.level * 8 + gear.mana + mount.mana + paladin.mana + title.mana + evolution.mana;
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
    paladin.power +
    title.power +
    evolution.power +
    (game.vip?.level || 0) * 180;

  return { hp, attack, defense, mana, power, gear, mount, paladin, evolution };
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
    title: getTitleData(safe).label,
    vipLevel: safe.vip?.level || 0,
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
    goldMineLevel: safe.buildings.mine?.level || 1,
    woodCollectorLevel: safe.buildings.lumber?.level || 1,
    wallLevel: safe.buildings.wall?.level || 1,
    watchtowerLevel: safe.buildings.watchtower?.level || 1,
    shieldUntil: safe.city?.shieldUntil || null,
    shieldActivee: isShieldActivee(safe),
    updatedAt: new Date().toISOString()
  };
}

function getMaxEnergy(game) {
  return 9 + getProgressionLevel(game);
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
  next.daily.progress.collections += 1;
  addMail(next, "Resources collected", `You collected ${collected.gold} gold, ${collected.wood} wood and ${collected.crystals} crystals for ${hours}h. Energy is full.`, "city");

  return { game: next, collected };
}

function applyReward(game, reward) {
  const next = normalizeGame(game);
  next.resources.gold += reward.gold || 0;
  next.resources.wood += reward.wood || 0;
  next.resources.crystals += reward.crystals || 0;
  next.resources.diamonds += reward.diamonds || 0;
  next.resources.sCoins += reward.sCoins || 0;
  next.xp += Math.round((reward.xp || 0) * (1 + (getVipBonus(next).xp || 0) / 100));

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
  if (timer.active) return { can: false, reason: `Under construction ${formatCountdown(timer.remainingMs)}`, maxLevel, timer };

  if (level >= maxLevel) {
    const reason = key === "citadel" ? `Max Lv. ${MAX_CITADEL_LEVEL}` : `Cere Citadel Lv. ${level + 1}`;
    return { can: false, reason, maxLevel };
  }

  const cost = getBuildingCost(game, key);
  if (!canAfford(game.resources, cost)) {
    return { can: false, reason: "Insufficient resources", maxLevel };
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
  const difficultyRoll = Math.random();
  const extraScale = difficultyRoll > 0.88 ? 1.45 : difficultyRoll > 0.68 ? 1.18 : 1;
  const enemyLevel = level + (difficultyRoll > 0.88 ? Math.ceil(level * 0.18) + 2 : difficultyRoll > 0.68 ? 1 : 0);
  const enemy = scaleEnemy(ENEMIES[Math.floor(Math.random() * (maxIndex + 1))], enemyLevel, extraScale);
  enemy.difficulty = extraScale > 1.35 ? "Elite" : extraScale > 1.05 ? "Strong" : "Normal";
  if (enemy.difficulty !== "Normal") enemy.name = `${enemy.difficulty} ${enemy.name}`;
  return enemy;
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
  if (!supabase) return { players: [], error: "Supabase is not configured." };
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
    log.push(`Round ${round}: ${game.playerName} hits ${opponent.playerName} for ${heroDamage} damage.`);
    if (enemyHp <= 0) break;

    const enemyDamage = Math.max(3, Math.round(enemyAttack * (0.82 + Math.random() * 0.36) - heroStats.defense * 0.42));
    heroHp = Math.max(0, heroHp - enemyDamage);
    log.push(`Round ${round}: ${opponent.playerName} responds with ${enemyDamage} damage.`);
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
      setStatus("Supabase is not configured. Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
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
      setStatus("Account created. Check your email for confirmation or disable email confirmation in Supabase for testing.");
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="badge">⚔️ Browser RPG Alpha</div>
        <h1>S-Fleet Fantasy War</h1>
        <p className="muted">Login/Register for cloud progress saving with Supabase.</p>

        <form onSubmit={submit} className="form">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="email@exemplu.ro" />

          <label>Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" minLength="6" required placeholder="minimum 6 caractere" />

          <button className="primary" type="submit">
            {mode === "login" ? "Enter game" : "Create account"}
          </button>
        </form>

        <button className="link-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "No account? Create one" : "Already have an account? Enter game"}
        </button>

        {status && <div className="notice">{status}</div>}

        {!hasSupabase && (
          <div className="notice warning">
            Currently running without Supabase. You can test local demo, but login activates after the variables are configured.
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
        <p className="muted">Choose your lord name and hero class. After saving, progress stays on your account.</p>

        <div className="grid two">
          <div className="panel">
            <label>Lord name</label>
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
              Start adventure
            </button>
          </div>

          <div className="panel kingdom-preview">
            <div className="big-emoji">🏰</div>
            <h2>Obiectiv MVP</h2>
            <p>Build the city, level your hero to Paragon, choose mounts and use the Paladin.</p>
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
        <div className="badge">Update 16 · City Raid System</div>
        <h1>S-Fleet Fantasy War ⚔️</h1>
        <p>{getTitleData(game).emoji} {game.playerName} · {getProgressionLabel(game)} · {game.className} · {getTitleData(game).label}</p>
      </div>

      <div className="top-actions">
        <div className="stat-box">👑 <b>{stats.power}</b><span>Power</span></div>
        <div className="stat-box">🏆 <b>{game.stats.wins}</b><span>Wins</span></div>
        <div className="stat-box">🎒 <b>{totalItemCount(game)}</b><span>Items</span></div>
        <div className="stat-box">⭐ <b>{game.vip?.level || 0}</b><span>VIP</span></div>
        <div className="stat-box">🪙 <b>{game.resources.sCoins}</b><span>S-Coins</span></div>
        <div className="stat-box">📩 <b>{unreadMailCount(game)}</b><span>Mail</span></div>
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
          <div className="map-paladin" title="Paladin protects the city">🛡️ Paladin Guard</div>
        )}
      </div>
    </div>
  );
}

function ShieldPanel({ game, setGame }) {
  const [now, setNow] = useState(Date.now());
  const active = isShieldActivee(game, now);
  const remaining = shieldRemaining(game, now);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function buyShield(hours, cost) {
    setGame((prev) => {
      const paid = payCost(prev, cost);
      if (!paid.paid) return paid.game;
      return addShield(paid.game, hours);
    });
  }

  return (
    <div className="shield-panel">
      <div>
        <h3>🛡️ Shield Protection</h3>
        <p>{active ? `Activee for ${formatCountdown(remaining)} · until ${formatDateTime(game.city.shieldUntil)}` : "No active shield. The city can be attacked."}</p>
      </div>
      <div className="shield-actions">
        <button disabled={!canAfford(game.resources, { diamonds: 25 })} onClick={() => buyShield(2, { diamonds: 25 })}>Shield 2h · 25 diamonds</button>
        <button disabled={!canAfford(game.resources, { diamonds: 70 })} onClick={() => buyShield(8, { diamonds: 70 })}>Shield 8h · 70 diamonds</button>
        <button className="premium-mini" disabled={!canAfford(game.resources, { sCoins: 3 })} onClick={() => buyShield(24, { sCoins: 3 })}>Shield 24h · 3 S-Coins</button>
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
          <h2>Your City</h2>
          <p>Buildings have construction timers. You can finish instantly with S-Coins or wait for the timer.</p>
        </div>
        <button className="primary" disabled={!collectionState.ready} onClick={collect}>
          {collectionState.ready ? "Collect resources" : `Available in ${formatCountdown(collectionState.remainingMs)}`}
        </button>
      </div>

      <div className="collect-panel">
        <div><b>Production / hour</b><span>{hourlyIncome.gold} gold · {hourlyIncome.wood} wood · {hourlyIncome.crystals} crystals</span></div>
        <div><b>Ready hours</b><span>{collectionState.ready ? collectionState.hours : 0}h</span></div>
        <div><b>Collection energy</b><span>fills to maximum: {maxEnergy}</span></div>
        <div><b>Paladin Protection</b><span>{getPaladinCityBonus(normalizedGame).defensePower} city power</span></div>
      </div>

      <ShieldPanel game={normalizedGame} setGame={setGame} />

      <CityDefensePanel game={normalizedGame} setGame={setGame} session={session} />

      <CityVisualMap game={normalizedGame} onUpgrade={upgrade} />

      <div className="grid four">
        {Object.entries(BUILDINGS).map(([key, building]) => {
          const cost = getBuildingCost(normalizedGame, key);
          const level = normalizedGame.buildings[key].level;
          const status = getBuildingUpgradeStatus(normalizedGame, key, now);
          const timer = getBuildingTimer(normalizedGame, key, now);
          const finishCost = getFinishConstructionCoinCost(normalizedGame, key, now);
          const duration = getBuildDurationMs(normalizedGame, key);
          const maxText = key === "citadel" ? `Max Lv. ${MAX_CITADEL_LEVEL}` : `Max allowed: Lv. ${status.maxLevel} based on Citadel`;
          return (
            <article className="building" key={key}>
              <div className="building-top"><span>{building.emoji}</span><b>Lv. {level}</b></div>
              <h3>{building.name}</h3>
              <p>{building.description}</p>
              {timer.active ? (
                <div className="build-timer-box">
                  <small>Building Lv. {timer.targetLevel} · remaining {formatCountdown(timer.remainingMs)}</small>
                  <div className="build-progress"><div style={{ width: `${timer.progress}%` }} /></div>
                  <button className="premium-mini" disabled={normalizedGame.resources.sCoins < finishCost} onClick={() => finishNow(key)}>
                    Finish now · {finishCost} S-Coin
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


function getCombatSpecials(game, heroStats) {
  const titlePower = getTitleBonus(game).power || 0;
  const critChance = Math.min(35, 8 + Math.floor(heroStats.attack / 120) + Math.floor((game.vip?.level || 0) / 2));
  const dodgeChance = Math.min(22, 5 + Math.floor(heroStats.defense / 180));
  const blockChance = Math.min(28, 6 + Math.floor(heroStats.defense / 120) + Math.floor(titlePower / 400));
  return { critChance, dodgeChance, blockChance };
}

function rollPercent(chance) {
  return Math.random() * 100 < chance;
}

function advancedSkillFor(game, slot = 1) {
  const progression = getProgressionLevel(game);
  const className = game.className;
  const skills = {
    Knight: [
      { name: "Shield Slam", cost: 10, power: 1.45, min: 1 },
      { name: "Execute", cost: 18, power: 2.35, min: 35 },
      { name: "Divine Guard", cost: 22, power: 1.85, min: 70 }
    ],
    Mage: [
      { name: "Fireball", cost: 12, power: 1.7, min: 1 },
      { name: "Meteor", cost: 26, power: 2.75, min: 45 },
      { name: "Arcane Nova", cost: 32, power: 3.1, min: 85 }
    ],
    Archer: [
      { name: "Poison Arrow", cost: 10, power: 1.55, min: 1 },
      { name: "Multi Shot", cost: 20, power: 2.25, min: 40 },
      { name: "Critical Focus", cost: 25, power: 2.85, min: 80 }
    ]
  };
  const list = skills[className] || skills.Knight;
  return list[Math.max(0, Math.min(list.length - 1, slot - 1))] || list[0];
}

function Battle({ game, setGame }) {
  const heroStats = useMemo(() => getHeroStats(game), [game]);
  const [enemy, setEnemy] = useState(() => randomEnemy(getProgressionLevel(game)));
  const [heroHp, setHeroHp] = useState(heroStats.hp);
  const [mana, setMana] = useState(heroStats.mana);
  const [log, setLog] = useState(["An enemy appears near the citadel."]);
  const [busy, setBusy] = useState(false);
  const [guildHelper, setGuildHelper] = useState(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState(1);

  useEffect(() => {
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
  }, [heroStats.hp, heroStats.mana]);

  useEffect(() => {
    if (!autoBattle || busy || enemy.hp <= 0 || heroHp <= 0) return;
    const timer = window.setTimeout(() => {
      const skill = mana >= CLASSES[game.className].skill.cost ? "skill" : "normal";
      attack(skill, 1);
    }, Math.max(180, 900 / battleSpeed));
    return () => window.clearTimeout(timer);
  }, [autoBattle, busy, enemy.hp, heroHp, mana, battleSpeed]);

  function addLog(text) {
    setLog((prev) => [text, ...prev].slice(0, 8));
  }

  function newEnemy() {
    setEnemy(randomEnemy(getProgressionLevel(game)));
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
    setLog(["A new threat approaches the kingdom."]);
  }

  async function callGuildHelper() {
    if (!game.guild?.id || !supabase) {
      addLog("You need an alliance to call for help.");
      return;
    }
    const { data, error } = await supabase.rpc("get_guild_members", { target_guild_id: game.guild.id });
    if (error) {
      addLog(`Cannot call the alliance: ${error.message}. Run the SQL from Update 16.`);
      return;
    }
    const allies = (data || []).filter((ally) => ally.user_id !== undefined);
    const bestAlly = allies
      .filter((ally) => ally.user_id !== null)
      .sort((a, b) => Number(b.power || 0) - Number(a.power || 0))[0];
    if (!bestAlly) {
      addLog("No alliance member is available.");
      return;
    }
    const helper = {
      name: bestAlly.player_name || "Guild Ally",
      power: Number(bestAlly.power || 0),
      attackBonus: Math.max(8, Math.round(Number(bestAlly.power || 0) * 0.025))
    };
    setGuildHelper(helper);
    addLog(`${helper.name} answers the alliance call: +${helper.attackBonus} damage per hit.`);
  }

  function finishWin(defeatedEnemy) {
    let dropped = null;

    setGame((prev) => {
      let next = normalizeGame(prev);
      next.stats.wins += 1;
      next.daily.progress.combatWins += 1;
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

    addLog(`Victory! Reward: ${defeatedEnemy.reward.gold} gold, ${defeatedEnemy.reward.xp} XP.`);
    if (dropped?.soldBecauseFull) addLog(`Inventory was full. ${dropped.name} was converted into ${dropped.value} gold.`);
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
    addLog("You were defeated. The hero returns to the citadel.");
    setBusy(false);
  }

  function enemyTurn(currentHeroHp, currentEnemy) {
    const specials = getCombatSpecials(game, heroStats);
    if (rollPercent(specials.dodgeChance)) {
      addLog(`Dodge! You avoided ${currentEnemy.name}'s attack.`);
      setBusy(false);
      return;
    }
    let dmg = Math.max(3, Math.round(currentEnemy.attack - heroStats.defense * 0.55 + Math.random() * 8));
    if (rollPercent(specials.blockChance)) {
      dmg = Math.max(1, Math.round(dmg * 0.45));
      addLog(`Block! Incoming damage was reduced.`);
    }
    const after = Math.max(0, currentHeroHp - dmg);
    setHeroHp(after);
    addLog(`${currentEnemy.name} hits for ${dmg} damage.`);
    if (after <= 0) finishLoss();
    else setBusy(false);
  }

  function attack(type, skillSlot = 1) {
    if (busy) return;
    if (game.resources.energy <= 0) {
      addLog("You have no energy left. Collect resources.");
      setAutoBattle(false);
      return;
    }

    const classData = CLASSES[game.className];
    const specials = getCombatSpecials(game, heroStats);
    let nextMana = mana;
    let damage;
    let skill = skillSlot === 1 ? classData.skill : advancedSkillFor(game, skillSlot);

    if (type === "skill") {
      if (getProgressionLevel(game) < (skill.min || 1)) {
        addLog(`${skill.name} unlocks at level ${skill.min}.`);
        return;
      }
      if (mana < skill.cost) {
        addLog("Not enough mana for the skill.");
        return;
      }
      nextMana -= skill.cost;
      damage = Math.max(8, Math.round(heroStats.attack * skill.power - enemy.defense + Math.random() * 12));
      if (rollPercent(specials.critChance)) {
        damage = Math.round(damage * 1.75);
        addLog(`Critical hit! ${skill.name}: ${damage} damage.`);
      } else {
        addLog(`${skill.name}: ${damage} damage.`);
      }
    } else {
      damage = Math.max(5, Math.round(heroStats.attack - enemy.defense * 0.6 + Math.random() * 10));
      if (rollPercent(specials.critChance)) {
        damage = Math.round(damage * 1.6);
        addLog(`Critical normal attack: ${damage} damage.`);
      } else {
        addLog(`Normal attack: ${damage} damage.`);
      }
    }

    if (heroStats.paladin.damage) {
      damage += heroStats.paladin.damage;
      addLog(`The Paladin hits for ${heroStats.paladin.damage} damage.`);
    }

    if (guildHelper) {
      damage += guildHelper.attackBonus;
      addLog(`${guildHelper.name} helps from the alliance for ${guildHelper.attackBonus} damage.`);
    }

    setBusy(true);
    setMana(nextMana);

    const enemyAfter = { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    setEnemy(enemyAfter);

    if (enemyAfter.hp <= 0) {
      finishWin(enemy);
      return;
    }

    window.setTimeout(() => enemyTurn(heroHp, enemyAfter), Math.max(120, 420 / battleSpeed));
  }

  return (
    <section className="grid two">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Battle Arena</h2>
            <p>Turn-based battles. After victory you have a chance for an item drop.</p>
          </div>
          <button onClick={newEnemy}>New enemy</button>
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
          <button className="primary" disabled={busy} onClick={() => attack("normal")}>Normal attack</button>
          <button className="primary alt" disabled={busy} onClick={() => attack("skill", 1)}>{CLASSES[game.className].skill.name}</button>
          <button disabled={busy} onClick={() => attack("skill", 2)}>{advancedSkillFor(game, 2).name}</button>
          <button disabled={busy} onClick={() => attack("skill", 3)}>{advancedSkillFor(game, 3).name}</button>
          <button disabled={busy || Boolean(guildHelper) || !game.guild?.id} onClick={callGuildHelper}>🤝 Call ally</button>
          <button onClick={() => setAutoBattle((v) => !v)}>{autoBattle ? "Stop auto battle" : "Auto battle"}</button>
          <button onClick={() => setBattleSpeed((v) => v >= 3 ? 1 : v + 1)}>Speed x{battleSpeed}</button>
        </div>
      </div>

      <div className="panel">
        <h2>Battle log</h2>
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
  const [log, setLog] = useState([`You joined ${selectedZone.name}.`]);
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
    setLog([`You selected zone ${zone.name}.`]);
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
      addLog(`Zone unlocks at level ${zone.level}.`);
      return;
    }
    if (game.resources.energy < zone.energyCost) {
      addLog(`You need ${zone.energyCost} energy for ${zone.name}.`);
      return;
    }
    setEnemy(createWorldEnemy(zone, getProgressionLevel(game), isBoss));
    setHeroHp(heroStats.hp);
    setMana(heroStats.mana);
    setBusy(false);
    setLog([isBoss ? `Boss fight: ${zone.boss.name}!` : `New battle in ${zone.name}.`]);
  }

  function finishWin(defeatedEnemy) {
    let dropped = null;
    const zone = getZone(defeatedEnemy.zoneId || selectedZoneId);

    setGame((prev) => {
      let next = normalizeGame(prev);
      next.stats.wins += 1;
      next.stats.dungeonWins += 1;
      next.daily.progress.combatWins += 1;
      next.daily.progress.dungeonWins += 1;
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

    addLog(`Victory in ${zone.name}! Reward: ${defeatedEnemy.reward.gold} gold, ${defeatedEnemy.reward.xp} XP.`);
    if (defeatedEnemy.isBoss) addLog(`Boss defeated: ${defeatedEnemy.name}. The zone is marked as progress.`);
    if (dropped?.soldBecauseFull) addLog(`Inventory was full. ${dropped.name} was converted into ${dropped.value} gold.`);
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
    addLog("You were defeated in the dungeon. Energy was consumed.");
    setBusy(false);
  }

  function enemyTurn(currentHeroHp, currentEnemy) {
    const dmg = Math.max(4, Math.round(currentEnemy.attack - heroStats.defense * 0.55 + Math.random() * 10));
    const after = Math.max(0, currentHeroHp - dmg);
    setHeroHp(after);
    addLog(`${currentEnemy.name} hits for ${dmg} damage.`);
    if (after <= 0) finishLoss();
    else setBusy(false);
  }

  function attack(type) {
    if (busy) return;
    const zone = getZone(selectedZoneId);
    if (!isZoneUnlocked(game, zone)) {
      addLog(`Zone unlocks at level ${zone.level}.`);
      return;
    }
    if (game.resources.energy < enemy.energyCost) {
      addLog(`You need ${enemy.energyCost} energy for this battle.`);
      return;
    }

    const classData = CLASSES[game.className];
    let nextMana = mana;
    let damage;

    if (type === "skill") {
      if (mana < classData.skill.cost) {
        addLog("Not enough mana for the skill.");
        return;
      }
      nextMana -= classData.skill.cost;
      damage = Math.max(10, Math.round(heroStats.attack * classData.skill.power - enemy.defense + Math.random() * 14));
      addLog(`${classData.skill.name}: ${damage} damage.`);
    } else {
      damage = Math.max(6, Math.round(heroStats.attack - enemy.defense * 0.6 + Math.random() * 11));
      addLog(`Normal attack: ${damage} damage.`);
    }

    if (heroStats.paladin.damage) {
      damage += heroStats.paladin.damage;
      addLog(`The Paladin hits for ${heroStats.paladin.damage} damage.`);
    }

    setBusy(true);
    setMana(nextMana);

    const enemyAfter = { ...enemy, hp: Math.max(0, enemy.hp - damage) };
    setEnemy(enemyAfter);

    if (enemyAfter.hp <= 0) {
      finishWin(enemy);
      return;
    }

    window.setTimeout(() => enemyTurn(heroHp, enemyAfter), Math.max(120, 420 / battleSpeed));
  }

  return (
    <section className="grid dungeon-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>World Map / Dungeon</h2>
            <p>Choose a zone, fight specific monsters and defeat the boss for progress.</p>
          </div>
          <div className="power-summary">⚡ Zone cost: {selectedZone.energyCost}</div>
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
                  <b>{completed ? "Boss defeated ✅" : unlocked ? "Unlocked" : `Locked until level ${zone.level}`}</b>
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
          <button className="primary" disabled={busy} onClick={() => attack("normal")}>Normal attack</button>
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
      next.daily.progress.itemsSold += 1;
      if (equipped) next.equipment[item.slot] = null;
      else next.inventory = next.inventory.filter((i) => i.id !== item.id);
      return next;
    });
  }

  function sellAllInventory() {
    setGame((prev) => {
      const next = normalizeGame(prev);
      const totalValue = next.inventory.reduce((sum, item) => sum + (item.value || 0), 0);
      const count = next.inventory.length;
      if (!count) return next;
      next.resources.gold += totalValue;
      next.daily.progress.itemsSold += count;
      next.inventory = [];
      addMail(next, "Inventory sold", `You sold ${count} items for ${totalValue} gold.`, "trade");
      return next;
    });
  }

  return (
    <section className="grid inventory-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Echipament</h2>
            <p>Equipped items increase HP, attack, defense, mana and power.</p>
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
            <p>{game.inventory.length}/60 items. You receive drops after won battles.</p>
          </div>
          <div className="inventory-tools">
            <button className="danger" disabled={game.inventory.length === 0} onClick={sellAllInventory}>Sell entire inventory</button>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Toate</option>
            {Object.entries(SLOTS).map(([slot, info]) => (
              <option key={slot} value={slot}>{info.label}</option>
            ))}
            </select>
          </div>
        </div>

        {filteredInventory.length === 0 ? (
          <div className="empty-inventory">
            🎒 Inventory is empty. Go to Battle and win fights for item drops.
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
  const [message, setMessage] = useState("S-Coins are added manually by the creator after contact/payment.");

  function buy(cost, action, successText) {
    setGame((prev) => {
      const paid = payCost(prev, cost);
      if (!paid.paid) {
        setMessage(`Insufficient resources: ${costText(cost)}`);
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
    }, "You bought +10 energy with diamonds.");
  }

  function refillEnergyWithCoins() {
    buy({ sCoins: 1 }, (next) => {
      next.resources.energy = getMaxEnergy(next);
      return next;
    }, "Energy was instantly refilled with S-Coin.");
  }

  function buyChest(type) {
    const config = type === "epic"
      ? { cost: { diamonds: 35 }, boost: 2, text: "Epic chest bought with diamonds." }
      : { cost: { sCoins: 4 }, boost: 4, text: "Premium chest bought with S-Coins." };
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
    }, "You bought a resource pack with diamonds.");
  }

  function changeClass() {
    if (classChoice === game.className) {
      setMessage("Choose a different class to change.");
      return;
    }
    buy({ sCoins: 10 }, (next) => {
      next.className = classChoice;
      next.classLocked = true;
  next.vip = { level: 0, ...(next.vip || {}) };
  next.vip.level = Math.max(0, Math.min(MAX_VIP_LEVEL, Math.floor(Number(next.vip.level) || 0)));
  next.achievements = { claimed: [], ...(next.achievements || {}) };
  next.achievements.claimed = Array.isArray(next.achievements.claimed) ? next.achievements.claimed : [];
  next.title = TITLES[next.title] ? next.title : "novice";
  next.worldBoss = { totalDamage: 0, attacksToday: 0, lastAttackDate: null, ...(next.worldBoss || {}) };
  if (next.worldBoss.lastAttackDate !== todayKey()) {
    next.worldBoss.lastAttackDate = todayKey();
    next.worldBoss.attacksToday = 0;
  }
  next.worldBoss.totalDamage = Math.max(0, Math.floor(Number(next.worldBoss.totalDamage) || 0));
  next.worldBoss.attacksToday = Math.max(0, Math.floor(Number(next.worldBoss.attacksToday) || 0));
  if (next.evolution && !CLASS_EVOLUTIONS[next.className]?.[next.evolution]) next.evolution = null;
  next.campaign = { completed: [], ...(next.campaign || {}) };
  next.campaign.completed = Array.isArray(next.campaign.completed) ? next.campaign.completed : [];
  next.season = { points: 0, claimed: [], premium: false, ...(next.season || {}) };
  next.season.points = Math.max(0, Math.floor(Number(next.season.points) || 0));
  next.season.claimed = Array.isArray(next.season.claimed) ? next.season.claimed : [];
  next.tutorial = { done: false, step: 0, ...(next.tutorial || {}) };
  next.blacksmith = { dust: 0, gems: 0, logs: [], ...(next.blacksmith || {}) };
  next.blacksmith.dust = Math.max(0, Math.floor(Number(next.blacksmith.dust) || 0));
  next.blacksmith.gems = Math.max(0, Math.floor(Number(next.blacksmith.gems) || 0));
  next.blacksmith.logs = Array.isArray(next.blacksmith.logs) ? next.blacksmith.logs.slice(0, 40) : [];
  next.coinRequests = Array.isArray(next.coinRequests) ? next.coinRequests.slice(0, 20) : [];
  next.securityLogs = Array.isArray(next.securityLogs) ? next.securityLogs.slice(0, 80) : [];
      return next;
    }, `Class was changed to ${classChoice} with S-Coins.`);
  }

  function renameHero() {
    const clean = renameValue.trim().slice(0, 28);
    if (!clean) {
      setMessage("Name cannot be empty.");
      return;
    }
    buy({ sCoins: 2 }, (next) => {
      next.playerName = clean;
      return next;
    }, "Hero name was changed.");
  }

  return (
    <section className="grid shop-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Shop</h2>
            <p>Buy packs with gold/diamonds or use S-Coins for premium features.</p>
          </div>
          <div className="power-summary">🔷 {game.resources.diamonds} diamonds · 🪙 {game.resources.sCoins} S-Coins</div>
        </div>

        <div className="shop-grid">
          <article className="shop-card">
            <h3>⚡ Energy Boost</h3>
            <p>Receive +10 energy without waiting for collection.</p>
            <button onClick={buyEnergyWithDiamonds} disabled={!canAfford(game.resources, { diamonds: 12 })}>Buy · 12 diamonds</button>
          </article>
          <article className="shop-card premium">
            <h3>⚡ Full Energy</h3>
            <p>Umple energia instant la maximul caracterului.</p>
            <button onClick={refillEnergyWithCoins} disabled={!canAfford(game.resources, { sCoins: 1 })}>Buy · 1 S-Coin</button>
          </article>
          <article className="shop-card">
            <h3>🎁 Resource Pack</h3>
            <p>+1500 gold, +900 wood, +90 crystals.</p>
            <button onClick={buyResourcePack} disabled={!canAfford(game.resources, { diamonds: 18 })}>Buy · 18 diamonds</button>
          </article>
          <article className="shop-card">
            <h3>💎 Epic Chest</h3>
            <p>Item with a better chance for Rare/Epic.</p>
            <button onClick={() => buyChest("epic")} disabled={!canAfford(game.resources, { diamonds: 35 })}>Buy · 35 diamonds</button>
          </article>
          <article className="shop-card premium">
            <h3>🏆 Premium Chest</h3>
            <p>Item with a large rarity boost, including a better Legendary chance.</p>
            <button onClick={() => buyChest("premium")} disabled={!canAfford(game.resources, { sCoins: 4 })}>Buy · 4 S-Coins</button>
          </article>
          <article className="shop-card">
            <h3>🛡️ Shield 8h</h3>
            <p>Protects the city against attacks for 8 hours.</p>
            <button onClick={() => buy({ diamonds: 70 }, (next) => addShield(next, 8), "Shield 8h activat.")} disabled={!canAfford(game.resources, { diamonds: 70 })}>Buy · 70 diamonds</button>
          </article>
          <article className="shop-card premium">
            <h3>🛡️ Shield 24h</h3>
            <p>Premium protection for the city for 24 hours.</p>
            <button onClick={() => buy({ sCoins: 3 }, (next) => addShield(next, 24), "Shield 24h activated.")} disabled={!canAfford(game.resources, { sCoins: 3 })}>Buy · 3 S-Coins</button>
          </article>
        </div>
      </div>

      <div className="panel">
        <h2>S-Coin Premium</h2>
        <p>S-Coin can only be purchased by contacting the game creator. The creator manually adds coins to the account after confirmation.</p>
        <div className="level-rules">
          <div><b>Change class</b><span>10 S-Coins · you keep progress, items and city</span></div>
          <div><b>Instant energy</b><span>1 S-Coin · fills energy to maximum</span></div>
          <div><b>Finish constructions</b><span>variable cost · appears directly on the building under construction</span></div>
          <div><b>Premium chest</b><span>4 S-Coins · loot with a better Legendary chance</span></div>
          <div><b>Rename hero</b><span>2 S-Coins · change hero name</span></div>
        </div>

        <div className="shop-control">
          <label>Change class with S-Coins</label>
          <select value={classChoice} onChange={(e) => setClassChoice(e.target.value)}>
            {Object.keys(CLASSES).map((className) => <option key={className} value={className}>{className}</option>)}
          </select>
          <button className="primary" disabled={classChoice === game.className || !canAfford(game.resources, { sCoins: 10 })} onClick={changeClass}>Change class · 10 S-Coins</button>
        </div>

        <div className="shop-control">
          <label>Change hero name</label>
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
  const [status, setStatus] = useState("Trade Center uses Supabase Marketplace.");
  const [marketFilter, setMarketFilter] = useState("all");
  const [sortMode, setSortMode] = useState("newest");

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
      setStatus(`Marketplace error: ${error.message}. Run schema.sql from Update 8.`);
      return;
    }
    setListings((data || []).filter((row) => row.status === "active"));
    setMyListings((data || []).filter((row) => row.seller_id === session.user.id));
    setStatus("Marketplace updated.");
  }

  useEffect(() => {
    loadMarketplace();
  }, [session]);

  async function listItem() {
    if (!supabase || !session) {
      setStatus("You must be logged in for the marketplace.");
      return;
    }
    const item = game.inventory.find((i) => i.id === selectedItemId);
    const gold = Math.max(0, Math.floor(Number(priceGold) || 0));
    const diamonds = Math.max(0, Math.floor(Number(priceDiamonds) || 0));
    if (!item) {
      setStatus("Choose an item from inventory.");
      return;
    }
    if (gold <= 0 && diamonds <= 0) {
      setStatus("Set a price in gold or diamonds.");
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
      setStatus(`Could not list the item: ${error.message}`);
      return;
    }
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.inventory = next.inventory.filter((i) => i.id !== item.id);
      return next;
    });
    setSelectedItemId("");
    setStatus(`${item.name} was listed in the marketplace.`);
    await loadMarketplace();
  }

  async function buyListing(listing) {
    if (!supabase || !session) return;
    if (listing.seller_id === session.user.id) {
      setStatus("You cannot buy your own item.");
      return;
    }
    if (!canAfford(game.resources, { gold: listing.price_gold, diamonds: listing.price_diamonds })) {
      setStatus("You do not have enough resources for this item.");
      return;
    }
    const { data, error } = await supabase.rpc("buy_market_listing", { listing_id: listing.id });
    if (error) {
      setStatus(`Purchase failed: ${error.message}`);
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
    setStatus(`You bought ${item.name}.`);
    await loadMarketplace();
  }

  async function cancelListing(listing) {
    if (!supabase || !session) return;
    const { data, error } = await supabase.rpc("cancel_market_listing", { listing_id: listing.id });
    if (error) {
      setStatus(`Cannot cancel listing: ${error.message}`);
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
      setStatus(`Cannot collect sales: ${error.message}`);
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
    setStatus(count ? `You collected ${gold} gold and ${diamonds} diamonds from ${count} sales.` : "You have no new sales to collect.");
    await loadMarketplace();
  }

  if (!session) {
    return <section className="panel"><h2>Trade Center</h2><p>You must be logged in for player trades.</p></section>;
  }

  const selectedItem = game.inventory.find((item) => item.id === selectedItemId);
  const visibleListings = listings
    .filter((listing) => marketFilter === "all" || listing.item?.slot === marketFilter || listing.item?.rarity === marketFilter)
    .sort((a, b) => {
      if (sortMode === "power") return Number(b.item?.power || 0) - Number(a.item?.power || 0);
      if (sortMode === "cheap") return (Number(a.price_gold || 0) + Number(a.price_diamonds || 0) * 1000) - (Number(b.price_gold || 0) + Number(b.price_diamonds || 0) * 1000);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <section className="grid trade-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Trade Center</h2>
            <p>List items in the marketplace so another player can buy them with gold/diamonds.</p>
          </div>
          <button onClick={loadMarketplace}>Refresh</button>
        </div>

        <div className="trade-form">
          <label>Choose item for sale</label>
          <select value={selectedItemId} onChange={(e) => setSelectedItemId(e.target.value)}>
            <option value="">Select item</option>
            {game.inventory.map((item) => <option key={item.id} value={item.id}>{item.name} · Power {item.power}</option>)}
          </select>
          {selectedItem && <div className="item-stats">{SLOTS[selectedItem.slot].emoji} {selectedItem.name} · {itemStatsText(selectedItem)}</div>}
          <div className="grid two">
            <div><label>Gold price</label><input type="number" min="0" value={priceGold} onChange={(e) => setPriceGold(e.target.value)} /></div>
            <div><label>Diamond price</label><input type="number" min="0" value={priceDiamonds} onChange={(e) => setPriceDiamonds(e.target.value)} /></div>
          </div>
          <button className="primary big" onClick={listItem} disabled={!selectedItemId}>List in marketplace</button>
        </div>

        <div className="section-title compact">
          <h3>Listingurile mele</h3>
          <button onClick={claimSales}>Collect sales</button>
        </div>
        <div className="market-list small-list">
          {myListings.length === 0 ? <div className="empty-inventory">You have no listings.</div> : myListings.map((listing) => (
            <div className="market-row" key={listing.id}>
              <span>{SLOTS[listing.item.slot]?.emoji || "🎒"}</span>
              <div><b>{listing.item.name}</b><small>{listing.status} · {listing.price_gold} gold · {listing.price_diamonds} diamonds</small></div>
              {listing.status === "active" && <button className="danger" onClick={() => cancelListing(listing)}>Cancel</button>}
              {listing.status === "sold" && <b>{listing.proceeds_claimed ? "Claimed" : "Sold"}</b>}
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Advanced Auction House</h2>
            <p>Buy items listed by other players, with filters and sorting.</p>
          </div>
          <div className="power-summary">🪙 {game.resources.gold} · 🔷 {game.resources.diamonds}</div>
        </div>
        <div className="auction-controls">
          <select value={marketFilter} onChange={(e) => setMarketFilter(e.target.value)}>
            <option value="all">Toate</option>
            {Object.entries(SLOTS).map(([slot, info]) => <option key={slot} value={slot}>{info.label}</option>)}
            {Object.keys(RARITIES).map((rarity) => <option key={rarity} value={rarity}>{rarity}</option>)}
          </select>
          <select value={sortMode} onChange={(e) => setSortMode(e.target.value)}>
            <option value="newest">Cele mai noi</option>
            <option value="power">Power mare</option>
            <option value="cheap">Cele mai ieftine</option>
          </select>
        </div>
        <div className="market-list">
          {visibleListings.length === 0 ? <div className="empty-inventory">There are no active items for sale for the selected filter.</div> : visibleListings.map((listing) => (
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

function Hero({ game, setGame }) {
  const stats = getHeroStats(game);
  const selectedClass = CLASSES[game.className];
  const xpLabel = getXpLabel(game);
  const maxed = game.level >= MAX_HERO_LEVEL && (game.paragonLevel || 0) >= MAX_PARAGON_LEVEL;
  const availableEvolutions = CLASS_EVOLUTIONS[game.className] || {};

  function chooseEvolution(name) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      if (getProgressionLevel(next) < 50 || !CLASS_EVOLUTIONS[next.className]?.[name]) return next;
      next.evolution = name;
      addMail(next, "Class evolution", `${next.className} evolved into ${name}.`, "hero");
      return next;
    });
  }

  return (
    <section className="grid two">
      <div className="panel">
        <h2>Hero</h2>
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
          <div><b>VIP</b><span>{getVipData(game).label}</span></div>
          <div><b>Title</b><span>{getTitleData(game).emoji} {getTitleData(game).label}</span></div>
        </div>

        <div className="grid two mini-stats">
          <div>❤️ HP <b>{stats.hp}</b><small>Gear +{stats.gear.hp} · Mount +{stats.mount.hp} · Paladin +{stats.paladin.hp}</small></div>
          <div>⚔️ Attack <b>{stats.attack}</b><small>Gear +{stats.gear.attack} · Mount +{stats.mount.attack} · Paladin +{stats.paladin.attack}</small></div>
          <div>🛡️ Defense <b>{stats.defense}</b><small>Gear +{stats.gear.defense} · Mount +{stats.mount.defense} · Paladin +{stats.paladin.defense}</small></div>
          <div>🔮 Mana <b>{stats.mana}</b><small>Gear +{stats.gear.mana} · Mount +{stats.mount.mana}</small></div>
        </div>
      </div>

      <div className="panel locked-class-panel">
        <h2>Class locked</h2>
        <p>The class is chosen when the hero is created and remains permanent for this account.</p>

        <div className="locked-class-card">
          <span className="class-emoji">{selectedClass.emoji}</span>
          <div>
            <b>{selectedClass.title}</b>
            <small>{selectedClass.description}</small>
            <small>Skill: {selectedClass.skill.name}</small>
          </div>
        </div>

        <div className="notice locked">
          🔒 For another class, you need to create a new hero / new account. Evolution unlocks at level 50.
        </div>
        <h3>Class evolution</h3>
        <div className="class-list">
          {Object.entries(availableEvolutions).map(([name, data]) => (
            <button key={name} className={game.evolution === name ? "class-card active" : "class-card"} disabled={getProgressionLevel(game) < 50} onClick={() => chooseEvolution(name)}>
              <span className="class-emoji">{data.emoji}</span>
              <span><b>{name}</b><small>{data.text}</small><small>Power +{data.bonus.power}</small></span>
            </button>
          ))}
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
      next.daily.progress.paladinTraining += 1;
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
            <p>The active mount gives stat and power bonuses. Max energy remains 10 + level/paragon.</p>
          </div>
          <div className="power-summary">{activeMount ? `${activeMount.emoji} ${activeMount.name}` : "No mount"}</div>
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
                <small>HP +{mount.bonus.hp} · ATK +{mount.bonus.attack} · DEF +{mount.bonus.defense} · Mana +{mount.bonus.mana}</small>
                <small>Power +{mount.bonus.power}</small>
                <button disabled={!owned && !affordable} onClick={() => unlockMount(id)}>
                  {active ? "Active" : owned ? "Equip" : `Unlock: ${mount.cost.gold} gold · ${mount.cost.wood} wood · ${mount.cost.crystals} crystals`}
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
            <p>You can leave him to protect the city or take him into battles.</p>
          </div>
          <div className="power-summary">🛡️ Lv. {game.paladin.level}/{paladinMaxLevel}</div>
        </div>

        <div className="paladin-card">
          <div className="big-emoji">🛡️</div>
          <div>
            <h3>Royal Paladin</h3>
            <p>Current mode: <b>{game.paladin.mode === "city" ? "Protects the city" : "Goes into battle"}</b></p>
            <Progress label="Paladin XP" value={game.paladin.xp} max={game.paladin.xpToNext} />
          </div>
        </div>

        <div className="paladin-modes">
          <button className={game.paladin.mode === "city" ? "active" : ""} onClick={() => setPaladinMode("city")}>🏰 Protects the city</button>
          <button className={game.paladin.mode === "battle" ? "active" : ""} onClick={() => setPaladinMode("battle")}>⚔️ Helps in battles</button>
        </div>

        <div className="level-rules">
          <div><b>City mode</b><span>+{cityBonus.gold} gold/hour · +{cityBonus.wood} wood/hour · +{cityBonus.crystals} crystals/hour</span></div>
          <div><b>Battle mode</b><span>ATK +{battleBonus.attack} · DEF +{battleBonus.defense} · extra hit {battleBonus.damage}</span></div>
          <div><b>Train cost</b><span>{costText(paladinCost)}</span></div>
          <div><b>Training limit</b><span>The Paladin cannot exceed the hero level: {paladinMaxLevel}</span></div>
        </div>

        <button className="primary big" disabled={!canPay(paladinCost) || game.paladin.level >= paladinMaxLevel} onClick={trainPaladin}>
          {game.paladin.level >= paladinMaxLevel ? `Paladin Max Lv. ${paladinMaxLevel}` : "Train the Paladin"}
        </button>
      </div>
    </section>
  );
}

function Arena({ game, setGame, session }) {
  const [players, setPlayers] = useState([]);
  const [status, setStatus] = useState("Loading leaderboard...");
  const [selectedId, setSelectedId] = useState("");
  const [battleLog, setBattleLog] = useState([]);
  const [cityAttackStatus, setCityAttackStatus] = useState("");

  async function loadPlayers() {
    setStatus("Loading leaderboard...");
    const result = await fetchPublicPlayers(50);
    if (result.error) {
      setPlayers([]);
      setStatus(`Leaderboard unavailable: ${result.error}. Run the SQL script from supabase/schema.sql for Update 7.`);
      return;
    }
    setPlayers(result.players);
    setStatus(result.players.length ? "Leaderboard updated." : "There are no public profiles yet. Save progress and enter again after deploy.");
  }

  useEffect(() => {
    if (hasSupabase && session) loadPlayers();
    else setStatus("PvP and leaderboard require Supabase login.");
  }, [session]);

  const opponents = players.filter((player) => player.userId !== session?.user?.id);
  const selectedOpponent = opponents.find((player) => player.userId === selectedId) || opponents[0];
  const sameGuildOpponent = Boolean(selectedOpponent && game.guild?.id && selectedOpponent.profile?.guildId === game.guild.id);

  async function launchCityAttack() {
    if (!selectedOpponent || !session || !supabase) {
      setCityAttackStatus("Choose a player and log in with the Supabase account.");
      return;
    }
    if (sameGuildOpponent) {
      setCityAttackStatus("You cannot attack the city of a member of the same alliance.");
      return;
    }
    setCityAttackStatus("Sending city attack...");
    const { data, error } = await supabase.rpc("launch_city_attack", { target_user_id: selectedOpponent.userId });
    if (error) {
      setCityAttackStatus(`City attack error: ${error.message}. Run the SQL from Update 16.`);
      return;
    }
    const attack = Array.isArray(data) ? data[0] : data;
    const landsAt = attack?.lands_at ? new Date(attack.lands_at).toLocaleTimeString("ro-RO") : "in 10 minutes";
    setCityAttackStatus(`The attack on ${selectedOpponent.playerName} was sent. It arrives at ${landsAt}.`);
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.daily.progress.cityAttacks += 1;
      addMail(next, "Attack sent", `The attack on ${selectedOpponent.playerName} arrives at ${landsAt}.`, "battle");
      return next;
    });
  }

  function startPvp() {
    if (!selectedOpponent) {
      setBattleLog(["There are no available opponents yet."]);
      return;
    }
    if (sameGuildOpponent) {
      setBattleLog(["You cannot start PvP against a member of the same alliance."]);
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
      result.won ? `PvP victory against ${selectedOpponent.playerName}!` : `You lost PvP against ${selectedOpponent.playerName}.`,
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
            <p>Ranking by Power. It updates from public profiles saved in Supabase.</p>
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
        <p>Choose a player from the leaderboard and start an asynchronous PvP battle. The opponent is simulated from public stats.</p>

        <div className="pvp-card">
          <label>Choose opponent</label>
          <select value={selectedOpponent?.userId || ""} onChange={(e) => setSelectedId(e.target.value)}>
            {opponents.length === 0 && <option value="">No opponents available</option>}
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

          <button className="primary big" onClick={startPvp} disabled={!selectedOpponent || sameGuildOpponent}>Start PvP</button>
          <button className="primary big city-attack-button" onClick={launchCityAttack} disabled={!selectedOpponent || sameGuildOpponent}>Launch city attack · 10 min</button>
          {sameGuildOpponent && <div className="notice warning">Members of the same alliance cannot attack each other.</div>}
          {cityAttackStatus && <div className="notice">{cityAttackStatus}</div>}
        </div>

        <div className="battle-log pvp-log">
          {battleLog.length === 0 ? <div>You have not started a PvP battle yet.</div> : battleLog.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
        </div>
      </div>
    </section>
  );
}


function CityDefensePanel({ game, setGame, session }) {
  const [attacks, setAttacks] = useState([]);
  const [status, setStatus] = useState(hasSupabase ? "Checking attacks..." : "City attacks require Supabase.");
  const [now, setNow] = useState(Date.now());

  async function loadAttacks() {
    if (!hasSupabase || !session) {
      setStatus("Log in with an account to see incoming attacks.");
      return;
    }

    const resolved = await supabase.rpc("resolve_due_city_attacks");
    if (!resolved.error && (resolved.data || []).length) {
      const fresh = await supabase.from("game_saves").select("data").eq("user_id", session.user.id).maybeSingle();
      if (!fresh.error && fresh.data?.data && setGame) setGame(normalizeGame(fresh.data.data));
    }
    const { data, error } = await supabase.rpc("get_city_attacks_for_player");
    if (error) {
      setStatus(`City attacks are not active: ${error.message}. Run the SQL from Update 16.`);
      setAttacks([]);
      return;
    }
    setAttacks(data || []);
    setStatus((data || []).length ? "City defense updated." : "You have no active or recent attacks.");
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
        <span>Lv. {towerLevel} · sees incoming attacks</span>
      </div>
      <div className="defense-card">
        <b>📡 Incoming</b>
        <span>{incoming.length} attacks toward the city</span>
      </div>
      <div className="defense-card">
        <b>⚔️ Outgoing</b>
        <span>{outgoing.length} sent attacks</span>
      </div>

      {(incoming.length > 0 || outgoing.length > 0 || recent.length > 0) && (
        <div className="city-attack-list">
          {incoming.map((attack) => (
            <div className="city-attack-row incoming" key={attack.id}>
              <b>Incoming de la {attack.attacker_name}</b>
              <span>Arrives in {formatCountdown(new Date(attack.lands_at).getTime() - now)} · ATK {attack.attack_power}</span>
            </div>
          ))}
          {outgoing.map((attack) => (
            <div className="city-attack-row outgoing" key={attack.id}>
              <b>Your attack on {attack.defender_name}</b>
              <span>Arrives in {formatCountdown(new Date(attack.lands_at).getTime() - now)} · ATK {attack.attack_power}</span>
            </div>
          ))}
          {recent.map((attack) => {
            const result = attack.result || {};
            const youAreAttacker = attack.attacker_id === session?.user?.id;
            const win = Boolean(result.attackerWin) === youAreAttacker;
            return (
              <div className="city-attack-row resolved" key={attack.id}>
                <b>{win ? "Victory" : "Defeat"} · {attack.attacker_name} vs {attack.defender_name}</b>
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
  const [status, setStatus] = useState("Loading guilds...");

  async function loadGuilds() {
    if (!hasSupabase || !session) {
      setStatus("Guild are nevoie de login Supabase.");
      return;
    }
    const { data, error } = await supabase.rpc("get_guilds", { limit_count: 50 });
    if (error) {
      setStatus(`Guild unavailable: ${error.message}. Run the SQL from Update 16.`);
      setGuilds([]);
      return;
    }
    setGuilds(data || []);
    setStatus((data || []).length ? "Guild list updated." : "There are no guilds yet. Create the first alliance.");
  }

  useEffect(() => { loadGuilds(); }, [session?.user?.id]);

  async function createGuild() {
    if (!name.trim() || !tag.trim()) {
      setStatus("Fill in the guild name and tag.");
      return;
    }
    const { data, error } = await supabase.rpc("create_guild", { guild_name: name.trim(), guild_tag: tag.trim().toUpperCase().slice(0, 5) });
    if (error) {
      setStatus(`Cannot create guild: ${error.message}`);
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
      setStatus(`Cannot join guild: ${error.message}`);
      return;
    }
    setGame((prev) => ({ ...normalizeGame(prev), guild: { id: guild.id, name: guild.name, tag: guild.tag, role: "member" } }));
    setStatus(`You joined [${guild.tag}] ${guild.name}`);
    loadGuilds();
  }

  async function leaveGuild() {
    const { error } = await supabase.rpc("leave_guild");
    if (error) {
      setStatus(`Cannot leave guild: ${error.message}`);
      return;
    }
    setGame((prev) => ({ ...normalizeGame(prev), guild: { id: null, name: null, tag: null, role: null } }));
    setStatus("You left the guild.");
    loadGuilds();
  }

  return (
    <section className="grid two guild-layout">
      <div className="panel">
        <h2>Guild / Alliance</h2>
        {game.guild?.id ? (
          <div className="guild-current">
            <div className="big-emoji">🛡️</div>
            <h3>[{game.guild.tag}] {game.guild.name}</h3>
            <p>Rol: {game.guild.role || "member"}</p>
            <button className="danger" onClick={leaveGuild}>Ieand from guild</button>
          </div>
        ) : (
          <>
            <p>You are not in an alliance. Create one or join an existing guild.</p>
            <label>Guild name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="S-Fleet Alliance" />
            <label>Tag</label>
            <input value={tag} onChange={(e) => setTag(e.target.value.toUpperCase().slice(0, 5))} placeholder="SFLT" />
            <button className="primary big" onClick={createGuild}>Create guild</button>
          </>
        )}
        <div className="notice">{status}</div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Guild List</h2>
            <p>Alliances are shared by all players.</p>
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
          {guilds.length === 0 && <div className="empty-inventory">There are no guilds yet.</div>}
        </div>
      </div>
    </section>
  );
}


function ProgressionPanel({ game, setGame }) {
  const [status, setStatus] = useState("VIP, achievements and titles are saved on your account.");
  const vip = getVipData(game);
  const nextVip = game.vip.level < MAX_VIP_LEVEL ? VIP_LEVELS[game.vip.level] : null;
  const unlockedTitles = getUnlockedTitles(game);

  function upgradeVip() {
    if (!nextVip) return;
    setGame((prev) => {
      const next = normalizeGame(prev);
      const target = VIP_LEVELS[next.vip.level];
      if (!target || next.resources.sCoins < target.cost) return next;
      next.resources.sCoins -= target.cost;
      next.vip.level += 1;
      addMail(next, "VIP upgraded", `You activated ${target.label}.`, "vip");
      return next;
    });
    setStatus("VIP upgrade aplicat.");
  }

  function claimAchievement(achievement) {
    setGame((prev) => {
      let next = normalizeGame(prev);
      if (next.achievements.claimed.includes(achievement.id) || !achievement.check(next)) return next;
      next = applyReward(next, achievement.reward);
      next.achievements.claimed.push(achievement.id);
      if (achievement.titleId && TITLES[achievement.titleId]) next.title = achievement.titleId;
      addMail(next, "Achievement unlocked", `${achievement.title}: ${rewardText(achievement.reward)}.`, "achievement");
      return next;
    });
    setStatus(`${achievement.title} revendicat.`);
  }

  function equipTitle(titleId) {
    setGame((prev) => ({ ...normalizeGame(prev), title: titleId }));
    setStatus(`Title equipped: ${TITLES[titleId].label}.`);
  }

  return (
    <section className="grid progression-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>VIP System</h2>
            <p>VIP is activated with S-Coins and gives permanent bonuses to resources, XP, build speed and PvP.</p>
          </div>
          <div className="power-summary">⭐ {vip.label}</div>
        </div>
        <div className="level-rules">
          <div><b>Resource bonus</b><span>+{vip.bonus.resource}%</span></div>
          <div><b>XP bonus</b><span>+{vip.bonus.xp}%</span></div>
          <div><b>Build speed</b><span>+{vip.bonus.build}%</span></div>
          <div><b>PvP stats</b><span>+{vip.bonus.pvp}%</span></div>
        </div>
        {nextVip ? (
          <button className="primary big" disabled={game.resources.sCoins < nextVip.cost} onClick={upgradeVip}>
            Upgrade la {nextVip.label} · {nextVip.cost} S-Coins
          </button>
        ) : <div className="notice">VIP is at maximum level.</div>}
        <div className="notice">{status}</div>
      </div>

      <div className="panel">
        <h2>Titles</h2>
        <p>The active title gives permanent hero bonuses.</p>
        <div className="title-grid">
          {unlockedTitles.map((titleId) => {
            const title = TITLES[titleId];
            return (
              <button key={titleId} className={game.title === titleId ? "title-card active" : "title-card"} onClick={() => equipTitle(titleId)}>
                <b>{title.emoji} {title.label}</b>
                <small>HP +{title.bonus.hp} · ATK +{title.bonus.attack} · DEF +{title.bonus.defense} · Mana +{title.bonus.mana}</small>
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel full-span">
        <h2>Achievements</h2>
        <div className="achievement-grid">
          {ACHIEVEMENTS.map((achievement) => {
            const claimed = game.achievements.claimed.includes(achievement.id);
            const ready = achievement.check(game);
            return (
              <article className={claimed ? "achievement-card claimed" : "achievement-card"} key={achievement.id}>
                <h3>{claimed ? "✅" : ready ? "🏆" : "🔒"} {achievement.title}</h3>
                <p>{achievement.text}</p>
                <small>Progress: {getAchievementProgressText(game, achievement)}</small>
                <small>Reward: {rewardText(achievement.reward)} {achievement.titleId ? `· Title: ${TITLES[achievement.titleId]?.label}` : ""}</small>
                <button disabled={!ready || claimed} onClick={() => claimAchievement(achievement)}>{claimed ? "Claimed" : ready ? "Claim" : "In progress"}</button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function GuildWarsPanel({ game, session }) {
  const [guilds, setGuilds] = useState([]);
  const [wars, setWars] = useState([]);
  const [targetGuildId, setTargetGuildId] = useState("");
  const [status, setStatus] = useState("Guild Wars require an alliance and Supabase.");

  async function loadWars() {
    if (!supabase || !session || !game.guild?.id) {
      setStatus("Join an alliance to view Guild Wars.");
      return;
    }
    const guildResult = await supabase.rpc("get_guilds", { limit_count: 80 });
    if (!guildResult.error) setGuilds((guildResult.data || []).filter((guild) => guild.id !== game.guild.id));
    const { data, error } = await supabase.rpc("get_guild_wars");
    if (error) {
      setStatus(`Guild Wars unavailable: ${error.message}. Run the SQL from Update 16.`);
      return;
    }
    setWars(data || []);
    setStatus("Guild Wars actualizat.");
  }

  useEffect(() => { loadWars(); }, [session?.user?.id, game.guild?.id]);

  async function declareWar() {
    if (!targetGuildId) {
      setStatus("Choose an enemy alliance.");
      return;
    }
    const { error } = await supabase.rpc("declare_guild_war", { target_guild_id: targetGuildId });
    if (error) setStatus(`Cannot declare war: ${error.message}`);
    else {
      setStatus("Guild War declarat for 24h.");
      loadWars();
    }
  }

  async function addWarScore() {
    const { error } = await supabase.rpc("add_guild_war_score", { score_points: Math.max(25, Math.round(getCityAttackPower(game) / 50)) });
    if (error) setStatus(`Cannot add score: ${error.message}`);
    else {
      setStatus("Score added for your alliance.");
      loadWars();
    }
  }

  return (
    <section className="grid two guild-war-layout">
      <div className="panel">
        <h2>Guild Wars</h2>
        <p>Declare war on another alliance. The war lasts 24h, and score comes from PvP/city/boss actions.</p>
        <label>Enemy alliance</label>
        <select value={targetGuildId} onChange={(e) => setTargetGuildId(e.target.value)}>
          <option value="">Choose guild</option>
          {guilds.map((guild) => <option key={guild.id} value={guild.id}>[{guild.tag}] {guild.name} · Power {guild.total_power}</option>)}
        </select>
        <button className="primary big" disabled={!game.guild?.id || !targetGuildId} onClick={declareWar}>Declare Guild War</button>
        <button className="primary big" disabled={!game.guild?.id} onClick={addWarScore}>Add score from your activity</button>
        <div className="notice">{status}</div>
      </div>

      <div className="panel">
        <div className="section-title"><h2>War Board</h2><button onClick={loadWars}>Refresh</button></div>
        <div className="war-list">
          {wars.length === 0 ? <div className="empty-inventory">There are no active/recent wars.</div> : wars.map((war) => (
            <div className="war-row" key={war.id}>
              <b>[{war.attacker_tag}] {war.attacker_name} vs [{war.defender_tag}] {war.defender_name}</b>
              <span>{war.attacker_score} - {war.defender_score} · {war.status} · final {formatDateTime(war.ends_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorldBossPanel({ game, setGame, session }) {
  const [boss, setBoss] = useState(null);
  const [log, setLog] = useState("World Boss is loading...");

  async function loadBoss() {
    if (!supabase || !session) {
      setLog("World Boss requires Supabase login.");
      return;
    }
    const { data, error } = await supabase.rpc("get_world_boss");
    if (error) {
      setLog(`World Boss unavailable: ${error.message}. Run the SQL from Update 16.`);
      return;
    }
    setBoss(Array.isArray(data) ? data[0] : data);
    setLog("World Boss updated.");
  }

  useEffect(() => { loadBoss(); }, [session?.user?.id]);

  async function attackBoss() {
    if (!boss || !supabase || !session) return;
    if (game.resources.energy < 2) {
      setLog("You need 2 energy for World Boss.");
      return;
    }
    const stats = getHeroStats(game);
    const guildBonus = game.guild?.id ? 1.15 : 1;
    const damage = Math.max(50, Math.round((stats.attack * 24 + stats.power * 0.12) * guildBonus * (0.85 + Math.random() * 0.35)));
    const { data, error } = await supabase.rpc("attack_world_boss", { damage_points: damage });
    if (error) {
      setLog(`Attack failed: ${error.message}`);
      return;
    }
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.resources.energy = Math.max(0, next.resources.energy - 2);
      next.stats.worldBossDamage += damage;
      next.worldBoss.totalDamage += damage;
      next.worldBoss.attacksToday += 1;
      if (next.guild?.id) next.stats.guildWarScore += Math.round(damage / 50);
      if (Math.random() < 0.25 && next.inventory.length < 80) next.inventory.push(createItem(getProgressionLevel(next), "World Boss", 4));
      return next;
    });
    setBoss(Array.isArray(data) ? data[0] : data);
    setLog(`You hit the World Boss for ${damage} damage.${game.guild?.id ? " Alliance bonus active." : ""}`);
  }

  const hp = Number(boss?.hp || WORLD_BOSS_CONFIG.maxHp);
  const maxHp = Number(boss?.max_hp || WORLD_BOSS_CONFIG.maxHp);
  const pct = Math.max(0, Math.min(100, (hp / maxHp) * 100));

  return (
    <section className="grid two world-boss-layout">
      <div className="panel boss-panel">
        <div className="big-emoji">{WORLD_BOSS_CONFIG.emoji}</div>
        <h2>{WORLD_BOSS_CONFIG.name}</h2>
        <p>{WORLD_BOSS_CONFIG.rewardPreview}</p>
        <div className="progress-wrap"><div className="progress-label"><span>Boss HP</span><span>{hp}/{maxHp}</span></div><div className="progress"><div style={{ width: `${pct}%` }} /></div></div>
        <button className="primary big" disabled={!boss || game.resources.energy < 2} onClick={attackBoss}>Attack World Boss · 2 energy</button>
        <button onClick={loadBoss}>Refresh</button>
        <div className="notice">{log}</div>
      </div>
      <div className="panel">
        <h2>Your damage</h2>
        <div className="level-rules">
          <div><b>Total damage</b><span>{game.stats.worldBossDamage || 0}</span></div>
          <div><b>Attacks today</b><span>{game.worldBoss.attacksToday || 0}</span></div>
          <div><b>Guild bonus</b><span>{game.guild?.id ? "+15% damage" : "Join an alliance for bonus"}</span></div>
          <div><b>Possible drop</b><span>25% item after attack</span></div>
        </div>
      </div>
    </section>
  );
}

function AdminPanel({ session }) {
  const [players, setPlayers] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [status, setStatus] = useState("Admin Panel is loading...");

  async function loadPlayers() {
    if (!hasSupabase || !session) {
      setStatus("Admin Panel are nevoie de login Supabase.");
      return;
    }
    const adminCheck = await supabase.rpc("is_current_user_admin");
    if (!adminCheck.data) {
      setStatus("Your account is not admin. Add the email to the admin_users table in Supabase.");
      return;
    }
    const { data, error } = await supabase.rpc("admin_list_players");
    if (error) {
      setStatus(`Admin Panel unavailable: ${error.message}. Run the SQL from Update 16.`);
      return;
    }
    const list = data || [];
    setPlayers(list);
    const first = list[0];
    if (first && !selectedId) {
      setSelectedId(first.user_id);
      setJsonText(JSON.stringify(first.data || {}, null, 2));
    }
    setStatus(`Admin activ for ${session.user.email}. Players loaded: ${list.length}`);
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
        setStatus(`Admin save error: ${error.message}`);
        return;
      }
      setStatus("Player updated. Refresh for new data.");
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
      setStatus(`Added ${amount} ${resource}. Press Save to apply.`);
    } catch (error) {
      setStatus(`Cannot modify: ${error.message}`);
    }
  }

  return (
    <section className="grid two admin-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Admin Panel</h2>
            <p>Works only for emails added in Supabase `admin_users`.</p>
          </div>
          <button onClick={loadPlayers}>Refresh</button>
        </div>

        <label>Choose player</label>
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
        <p>Edit the save JSON. You can change level, resources, buildings, inventory, paladin, guild, etc.</p>
        <textarea className="admin-json" value={jsonText} onChange={(e) => setJsonText(e.target.value)} spellCheck="false" />
        <button className="primary big" disabled={!selectedId} onClick={savePlayer}>Save changes</button>
      </div>
    </section>
  );
}

function DailyPanel({ game, setGame }) {
  const [message, setMessage] = useState("Daily rewards reset automatically at the start of a new day.");
  const today = todayKey();
  const claimedToday = game.daily?.login?.lastClaimedDate === today;
  const nextStreak = claimedToday ? game.daily.login.streak : ((game.daily.login.streak || 0) >= 7 ? 1 : (game.daily.login.streak || 0) + 1);

  function claimLogin() {
    setGame((prev) => {
      const result = claimDailyLoginReward(prev);
      setMessage(result.message);
      return result.game;
    });
  }

  function claimQuest(questId) {
    setGame((prev) => {
      const result = claimDailyQuestReward(prev, questId);
      setMessage(result.message);
      return result.game;
    });
  }

  return (
    <section className="grid daily-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Daily Login Rewards</h2>
            <p>Log in daily for a 7-day streak. After day 7, the cycle restarts.</p>
          </div>
          <button className="primary" disabled={claimedToday} onClick={claimLogin}>{claimedToday ? "Claimed azi" : `Claim Ziua ${nextStreak}`}</button>
        </div>
        <div className="daily-rewards-grid">
          {DAILY_LOGIN_REWARDS.map((item) => (
            <div className={`daily-reward ${item.day === nextStreak && !claimedToday ? "active" : ""} ${game.daily.login.streak >= item.day && claimedToday ? "claimed" : ""}`} key={item.day}>
              <b>{item.label}</b>
              <span>{rewardText(item.reward)}</span>
            </div>
          ))}
        </div>
        <div className="notice">{message}</div>
      </div>

      <div className="panel">
        <h2>Daily Quests</h2>
        <p>Daily quests reset automatically every day.</p>
        <div className="daily-quest-list">
          {DAILY_QUESTS.map((quest) => {
            const progress = Math.min(quest.target, quest.getProgress(game));
            const done = progress >= quest.target;
            const claimed = game.daily.claimedQuests.includes(quest.id);
            return (
              <div className="daily-quest-row" key={quest.id}>
                <div>
                  <b>{quest.title}</b>
                  <span>{quest.text}</span>
                  <small>Reward: {rewardText(quest.reward)}</small>
                </div>
                <div className="daily-quest-progress">
                  <strong>{progress}/{quest.target}</strong>
                  <button className="primary" disabled={!done || claimed} onClick={() => claimQuest(quest.id)}>{claimed ? "Claimed" : "Claim"}</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Inbox({ game, setGame, session }) {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState(hasSupabase ? "Loading reports..." : "Battle reports require Supabase.");

  async function loadReports() {
    if (!hasSupabase || !session) {
      setStatus("Log in with your Supabase account for battle reports.");
      return;
    }
    const resolved = await supabase.rpc("resolve_due_city_attacks");
    if (!resolved.error && (resolved.data || []).length) {
      const fresh = await supabase.from("game_saves").select("data").eq("user_id", session.user.id).maybeSingle();
      if (!fresh.error && fresh.data?.data) setGame(normalizeGame(fresh.data.data));
    }
    const { data, error } = await supabase.rpc("get_city_attacks_for_player");
    if (error) {
      setStatus(`Battle reports indisponibile: ${error.message}`);
      return;
    }
    setReports((data || []).filter((attack) => attack.status === "resolved").slice(0, 12));
    setStatus((data || []).length ? "Reports updated." : "There are no reports yet.");
  }

  useEffect(() => { loadReports(); }, [session?.user?.id]);

  function markAllRead() {
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.mail = next.mail.map((mail) => ({ ...mail, read: true }));
      return next;
    });
  }

  function deleteMail(id) {
    setGame((prev) => {
      const next = normalizeGame(prev);
      next.mail = next.mail.filter((mail) => mail.id !== id);
      return next;
    });
  }

  return (
    <section className="grid inbox-layout">
      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Inbox</h2>
            <p>Mesaje locale despre reward-uri, sales, shield and progres.</p>
          </div>
          <button onClick={markAllRead}>Mark as read</button>
        </div>
        <div className="mail-list">
          {(game.mail || []).length === 0 ? <div className="empty-inventory">You have no messages.</div> : game.mail.map((mail) => (
            <div className={`mail-row ${mail.read ? "read" : "unread"}`} key={mail.id}>
              <div>
                <b>{mail.read ? "✉️" : "📩"} {mail.title}</b>
                <span>{mail.body}</span>
                <small>{formatDateTime(mail.createdAt)} · {mail.type}</small>
              </div>
              <button className="danger" onClick={() => deleteMail(mail.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-title">
          <div>
            <h2>Battle Reports</h2>
            <p>Reports for city attacks, resolved after 10 minutes.</p>
          </div>
          <button onClick={loadReports}>Refresh</button>
        </div>
        <div className="battle-report-list">
          {reports.length === 0 ? <div className="empty-inventory">There are no city attack reports.</div> : reports.map((attack) => {
            const result = attack.result || {};
            const youAreAttacker = attack.attacker_id === session?.user?.id;
            const win = Boolean(result.attackerWin) === youAreAttacker;
            return (
              <div className={`battle-report ${win ? "win" : "loss"}`} key={attack.id}>
                <b>{win ? "Victory" : "Defeat"} · {attack.attacker_name} vs {attack.defender_name}</b>
                <span>ATK {result.attackPower || attack.attack_power} · DEF {result.defensePower || attack.defense_power_at_launch} · Wall {result.wallBefore ?? result.wallLevel ?? "?"}→{result.wallAfter ?? result.wallLevel ?? "?"}</span>
                {result.buildingDamage && (
                  <span>Damage: {Object.entries(result.buildingDamage).map(([key, val]) => `${key} ${val.from}→${val.to}${val.breached ? " broken" : ""}`).join(" · ")}</span>
                )}
                {result.stolen && (
                  <span>Stolen: {result.stolen.gold || 0} gold · {result.stolen.wood || 0} wood · {result.stolen.crystals || 0} crystals · {result.stolen.diamonds || 0} diamonds · S-Coins 0</span>
                )}
                <small>{formatDateTime(attack.resolved_at || attack.lands_at)}</small>
              </div>
            );
          })}
        </div>
        <div className="notice">{status}</div>
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
              {done ? "Claimed" : ready ? "Claim reward" : "In progress"}
            </button>
          </article>
        );
      })}
    </section>
  );
}


function BlacksmithPanel({ game, setGame }) {
  const [selectedId, setSelectedId] = useState("");
  const allItems = [...(game.inventory || []), ...Object.values(game.equipment || {}).filter(Boolean)];
  const selectedItem = allItems.find((item) => item.id === selectedId) || allItems[0];

  function updateItemEverywhere(next, updated) {
    next.inventory = next.inventory.map((item) => item.id === updated.id ? updated : item);
    Object.keys(next.equipment).forEach((slot) => {
      if (next.equipment[slot]?.id === updated.id) next.equipment[slot] = updated;
    });
  }

  function upgradeItem() {
    if (!selectedItem) return;
    setGame((prev) => {
      const next = normalizeGame(prev);
      const item = normalizeItem(selectedItem);
      const level = item.upgrade || 0;
      if (level >= 15) return next;
      const cost = { gold: 350 + level * 220, crystals: 25 + level * 12 };
      const paid = payCost(next, cost);
      if (!paid.paid) return next;
      const updated = normalizeItem({ ...item, upgrade: level + 1, value: item.value + 80 + level * 20 });
      updateItemEverywhere(paid.game, updated);
      paid.game.blacksmith.logs.unshift(`Upgraded ${updated.name} to +${updated.upgrade}.`);
      paid.game.season.points += 15;
      addMail(paid.game, "Blacksmith upgrade", `${updated.name} is now +${updated.upgrade}.`, "blacksmith");
      return paid.game;
    });
  }

  function socketGem() {
    if (!selectedItem) return;
    setGame((prev) => {
      const next = normalizeGame(prev);
      const item = normalizeItem(selectedItem);
      if ((item.gems || []).length >= 3 || next.blacksmith.gems < 1) return next;
      next.blacksmith.gems -= 1;
      const updated = normalizeItem({ ...item, gems: [...(item.gems || []), { type: "Ruby", level: 1 }] });
      updateItemEverywhere(next, updated);
      next.blacksmith.logs.unshift(`Socketed a gem into ${updated.name}.`);
      next.season.points += 10;
      return next;
    });
  }

  function dismantleItem() {
    if (!selectedItem) return;
    setGame((prev) => {
      const next = normalizeGame(prev);
      if (Object.values(next.equipment).some((item) => item?.id === selectedItem.id)) return next;
      next.inventory = next.inventory.filter((item) => item.id !== selectedItem.id);
      next.blacksmith.dust += Math.max(5, Math.round((selectedItem.power || 50) / 25));
      if (Math.random() < 0.35) next.blacksmith.gems += 1;
      next.blacksmith.logs.unshift(`Dismantled ${selectedItem.name}.`);
      next.season.points += 8;
      return next;
    });
  }

  function craftItem() {
    setGame((prev) => {
      const next = normalizeGame(prev);
      const cost = { gold: 900, wood: 400, crystals: 90 };
      const paid = payCost(next, cost);
      if (!paid.paid || paid.game.inventory.length >= 80) return next;
      const item = createItem(getProgressionLevel(paid.game), "Blacksmith Craft", 2);
      paid.game.inventory.push(item);
      paid.game.blacksmith.logs.unshift(`Crafted ${item.name}.`);
      paid.game.season.points += 20;
      return paid.game;
    });
  }

  return (
    <section className="grid two">
      <div className="panel">
        <div className="section-title">
          <div><h2>Blacksmith</h2><p>Upgrade, socket, dismantle and craft gear.</p></div>
          <div className="power-summary">✨ Dust {game.blacksmith.dust} · 💠 Gems {game.blacksmith.gems}</div>
        </div>
        <label>Select item</label>
        <select value={selectedItem?.id || ""} onChange={(e) => setSelectedId(e.target.value)}>
          {allItems.length === 0 && <option value="">No items</option>}
          {allItems.map((item) => <option key={item.id} value={item.id}>{item.name} +{item.upgrade || 0} · {SLOTS[item.slot]?.label}</option>)}
        </select>
        {selectedItem && <div className="notice">{selectedItem.name}: {itemStatsText(selectedItem)} · Power {selectedItem.displayPower || selectedItem.power}</div>}
        <div className="actions">
          <button className="primary" disabled={!selectedItem} onClick={upgradeItem}>Upgrade item</button>
          <button disabled={!selectedItem || game.blacksmith.gems < 1} onClick={socketGem}>Socket gem</button>
          <button disabled={!selectedItem} onClick={dismantleItem}>Dismantle</button>
          <button className="primary alt" onClick={craftItem}>Craft random item</button>
        </div>
      </div>
      <div className="panel">
        <h2>Forge log</h2>
        <div className="battle-log">{(game.blacksmith.logs || []).slice(0, 10).map((line, i) => <div key={i}>{line}</div>)}</div>
      </div>
    </section>
  );
}

function CampaignPanel({ game, setGame }) {
  function claimChapter(chapter) {
    setGame((prev) => {
      let next = normalizeGame(prev);
      if (next.campaign.completed.includes(chapter.id) || getProgressionLevel(next) < chapter.req) return next;
      next = applyReward(next, chapter.reward);
      next.campaign.completed.push(chapter.id);
      next.season.points += 50;
      addMail(next, "Campaign completed", `${chapter.title}: ${rewardText(chapter.reward)}.`, "campaign");
      return next;
    });
  }
  return (
    <section className="grid three">
      {CAMPAIGN_CHAPTERS.map((chapter) => {
        const done = game.campaign.completed.includes(chapter.id);
        const locked = getProgressionLevel(game) < chapter.req;
        return <article className="panel quest" key={chapter.id}>
          <h3>📜 {chapter.title}</h3><p>{chapter.text}</p>
          <small>Required level {chapter.req} · Reward: {rewardText(chapter.reward)}</small>
          <button className="primary" disabled={done || locked} onClick={() => claimChapter(chapter)}>{done ? "Completed" : locked ? "Locked" : "Complete chapter"}</button>
        </article>;
      })}
    </section>
  );
}

function SeasonPanel({ game, setGame }) {
  function claim(reward) {
    setGame((prev) => {
      let next = normalizeGame(prev);
      if (next.season.points < reward.points || next.season.claimed.includes(reward.tier)) return next;
      next = applyReward(next, reward.reward);
      next.season.claimed.push(reward.tier);
      addMail(next, "Season reward", `Tier ${reward.tier}: ${rewardText(reward.reward)}.`, "season");
      return next;
    });
  }
  function activatePremium() {
    setGame((prev) => {
      const paid = payCost(prev, { sCoins: 10 });
      if (!paid.paid) return normalizeGame(prev);
      paid.game.season.premium = true;
      addMail(paid.game, "Premium Battle Pass", "Premium season track activated.", "season");
      return paid.game;
    });
  }
  return (
    <section className="grid two">
      <div className="panel"><h2>Season / Battle Pass</h2><p>Earn points from battles, crafting, campaign and guild activity.</p><div className="power-summary">⭐ {game.season.points} season points · {game.season.premium ? "Premium active" : "Free track"}</div><button className="primary big" disabled={game.season.premium || game.resources.sCoins < 10} onClick={activatePremium}>Activate premium · 10 S-Coins</button></div>
      <div className="panel"><h2>Rewards</h2><div className="battle-log">{SEASON_REWARDS.map((r) => <div key={r.tier}><b>Tier {r.tier}</b> · {r.points} points · {rewardText(r.reward)} <button disabled={game.season.points < r.points || game.season.claimed.includes(r.tier)} onClick={() => claim(r)}>{game.season.claimed.includes(r.tier) ? "Claimed" : "Claim"}</button></div>)}</div></div>
    </section>
  );
}

function KingdomMapPanel({ game }) {
  const areas = ["Royal Citadel", "Resource Fields", "Enemy Camps", "Alliance Territory", "World Boss Lair", "Marketplace Road"];
  return <section className="panel"><h2>Expanded Kingdom Map</h2><p>Strategic overview for future territory control, fog of war and resource nodes.</p><div className="kingdom-map-grid">{areas.map((area, i) => <div className="map-node" key={area}><span>{["🏰","🌾","💀","🛡️","🐉","🛒"][i]}</span><b>{area}</b><small>Power influence {Math.round(getHeroStats(game).power / (i + 3))}</small></div>)}</div></section>;
}

function TutorialPanel({ game, setGame }) {
  const steps = ["Create your hero", "Collect hourly resources", "Win a battle", "Equip an item", "Join or create an alliance", "Protect your city"];
  function finishTutorial() {
    setGame((prev) => {
      let next = normalizeGame(prev);
      if (next.tutorial.done) return next;
      next.tutorial.done = true;
      next = applyReward(next, { gold: 1000, wood: 700, crystals: 80, diamonds: 10, xp: 120 });
      addMail(next, "Tutorial completed", "Welcome reward received.", "tutorial");
      return next;
    });
  }
  return <section className="grid two"><div className="panel"><h2>New Player Tutorial</h2><p>Guided checklist for new players.</p><div className="battle-log">{steps.map((step, i) => <div key={step}>✅ Step {i + 1}: {step}</div>)}</div><button className="primary big" disabled={game.tutorial.done} onClick={finishTutorial}>{game.tutorial.done ? "Tutorial reward claimed" : "Finish tutorial and claim reward"}</button></div><div className="panel"><h2>Notifications</h2><p>Important events already arrive in Inbox: raids, sales, rewards, guild and boss activity.</p><div className="notice">Browser/PWA notification hooks are prepared by the PWA files.</div></div></section>;
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
        setSaveStatus("Error");
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

      setSaveStatus(error ? "Error" : "Cloud");
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
    const ok = window.confirm("Are you sure you want to reset this account progress?");
    if (!ok) return;
    setGame(null);
  }

  if (loading) {
    return <main className="shell center"><div className="panel"><h2>Loading save...</h2></div></main>;
  }

  if (!game) {
    return <Onboarding onStart={startGame} />;
  }

  return (
    <main className="shell">
      <TopBar game={game} session={session} onLogout={logout} saveStatus={saveStatus} />
      <Resources game={game} />

      <nav className="tabs">
        <button className={tab === "city" ? "active" : ""} onClick={() => setTab("city")}>🏰 City</button>
        <button className={tab === "daily" ? "active" : ""} onClick={() => setTab("daily")}>🎁 Daily</button>
        <button className={tab === "progress" ? "active" : ""} onClick={() => setTab("progress")}>⭐ VIP</button>
        <button className={tab === "inbox" ? "active" : ""} onClick={() => setTab("inbox")}>📩 Inbox</button>
        <button className={tab === "battle" ? "active" : ""} onClick={() => setTab("battle")}>💀 Battle</button>
        <button className={tab === "blacksmith" ? "active" : ""} onClick={() => setTab("blacksmith")}>🔨 Blacksmith</button>
        <button className={tab === "campaign" ? "active" : ""} onClick={() => setTab("campaign")}>📖 Campaign</button>
        <button className={tab === "season" ? "active" : ""} onClick={() => setTab("season")}>🎟️ Season</button>
        <button className={tab === "kingdomMap" ? "active" : ""} onClick={() => setTab("kingdomMap")}>🧭 Map</button>
        <button className={tab === "tutorial" ? "active" : ""} onClick={() => setTab("tutorial")}>🎮 Tutorial</button>
        <button className={tab === "world" ? "active" : ""} onClick={() => setTab("world")}>🗺️ World</button>
        <button className={tab === "inventory" ? "active" : ""} onClick={() => setTab("inventory")}>🎒 Inventory</button>
        <button className={tab === "shop" ? "active" : ""} onClick={() => setTab("shop")}>🛒 Shop</button>
        <button className={tab === "trade" ? "active" : ""} onClick={() => setTab("trade")}>🤝 Trade</button>
        <button className={tab === "hero" ? "active" : ""} onClick={() => setTab("hero")}>🧙 Hero</button>
        <button className={tab === "companions" ? "active" : ""} onClick={() => setTab("companions")}>🐴 Companions</button>
        <button className={tab === "arena" ? "active" : ""} onClick={() => setTab("arena")}>🏆 Arena</button>
        <button className={tab === "guild" ? "active" : ""} onClick={() => setTab("guild")}>🛡️ Guild</button>
        <button className={tab === "guildWars" ? "active" : ""} onClick={() => setTab("guildWars")}>⚔️ Guild Wars</button>
        <button className={tab === "worldBoss" ? "active" : ""} onClick={() => setTab("worldBoss")}>🐉 World Boss</button>
        {isAdmin && <button className={tab === "admin" ? "active" : ""} onClick={() => setTab("admin")}>🧰 Admin</button>}
        <button className={tab === "quests" ? "active" : ""} onClick={() => setTab("quests")}>📜 Quests</button>
        <button className="danger-tab" onClick={resetSave}>Reset progress</button>
      </nav>

      {tab === "city" && <City game={game} setGame={setGame} session={session} />}
      {tab === "daily" && <DailyPanel game={game} setGame={setGame} />}
      {tab === "progress" && <ProgressionPanel game={game} setGame={setGame} />}
      {tab === "inbox" && <Inbox game={game} setGame={setGame} session={session} />}
      {tab === "battle" && <Battle game={game} setGame={setGame} />}
      {tab === "blacksmith" && <BlacksmithPanel game={game} setGame={setGame} />}
      {tab === "campaign" && <CampaignPanel game={game} setGame={setGame} />}
      {tab === "season" && <SeasonPanel game={game} setGame={setGame} />}
      {tab === "kingdomMap" && <KingdomMapPanel game={game} />}
      {tab === "tutorial" && <TutorialPanel game={game} setGame={setGame} />}
      {tab === "world" && <Dungeon game={game} setGame={setGame} />}
      {tab === "inventory" && <Inventory game={game} setGame={setGame} />}
      {tab === "shop" && <Shop game={game} setGame={setGame} />}
      {tab === "trade" && <TradeCenter game={game} setGame={setGame} session={session} />}
      {tab === "hero" && <Hero game={game} setGame={setGame} />}
      {tab === "companions" && <Companions game={game} setGame={setGame} />}
      {tab === "arena" && <Arena game={game} setGame={setGame} session={session} />}
      {tab === "guild" && <GuildPanel game={game} setGame={setGame} session={session} />}
      {tab === "guildWars" && <GuildWarsPanel game={game} session={session} />}
      {tab === "worldBoss" && <WorldBossPanel game={game} setGame={setGame} session={session} />}
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
    return { hasError: true, message: error?.message || "Unknown error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="shell center">
          <section className="panel recovery-panel">
            <h1>S-Fleet Fantasy War ⚔️</h1>
            <h2>The game caught an error, but we will not leave a black screen anymore.</h2>
            <p>Press Reload. If the problem continues, enter again after uploading the complete update to GitHub and running the SQL for leaderboard.</p>
            <div className="notice">Technical detail: {this.state.message}</div>
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
    return <main className="shell center"><div className="panel"><h2>Preparing game...</h2></div></main>;
  }

  if (!hasSupabase || demoMode) {
    return (
      <>
        <Game session={null} />
        <div className="floating-demo">
          Demo local
          {hasSupabase && <button onClick={() => setDemoMode(false)}>Activeate login</button>}
        </div>
      </>
    );
  }

  if (!session) {
    return (
      <>
        <AuthScreen onSession={setSession} />
        <button className="demo-switch" onClick={() => setDemoMode(true)}>Test without account</button>
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
