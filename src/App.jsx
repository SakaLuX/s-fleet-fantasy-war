import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const MAX_CITADEL_LEVEL = 50;

const LOCAL_KEY = "s_fleet_fantasy_war_local_save_v6";

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
    id: "veteran",
    title: "Arena Veteran",
    text: "Câștigă 5 lupte.",
    reward: { gold: 350, wood: 140, crystals: 30, xp: 140 },
    check: (game) => game.stats.wins >= 5
  }
];

function createStarterGame(playerName = "Lord S-Fleet", className = "Knight") {
  return {
    version: 6,
    playerName,
    className,
    level: 1,
    xp: 0,
    xpToNext: 100,
    resources: { gold: 350, wood: 220, crystals: 45, energy: 12 },
    city: { lastResourceCollectionAt: null },
    classLocked: true,
    buildings: {
      citadel: { level: 1 },
      barracks: { level: 1 },
      mine: { level: 1 },
      lumber: { level: 1 },
      academy: { level: 1 }
    },
    inventory: [],
    equipment: { weapon: null, armor: null, ring: null, amulet: null },
    stats: { wins: 0, losses: 0, itemsFound: 0, dungeonWins: 0, bossKills: 0 },
    completedQuests: [],
    world: { selectedZoneId: "goblin_forest", completedBosses: [], clears: {} },
    createdAt: new Date().toISOString()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeGame(game) {
  if (!game) return null;
  const next = clone(game);
  next.version = 6;
  next.resources = { gold: 0, wood: 0, crystals: 0, energy: 0, ...(next.resources || {}) };
  next.city = { lastResourceCollectionAt: null, ...(next.city || {}) };
  next.classLocked = true;
  next.buildings = {
    citadel: { level: 1 },
    barracks: { level: 1 },
    mine: { level: 1 },
    academy: { level: 1 },
    ...(next.buildings || {})
  };
  next.inventory = Array.isArray(next.inventory) ? next.inventory : [];
  next.equipment = { weapon: null, armor: null, ring: null, amulet: null, ...(next.equipment || {}) };
  next.stats = { wins: 0, losses: 0, itemsFound: 0, dungeonWins: 0, bossKills: 0, ...(next.stats || {}) };
  next.completedQuests = Array.isArray(next.completedQuests) ? next.completedQuests : [];
  next.world = { selectedZoneId: "goblin_forest", completedBosses: [], clears: {}, ...(next.world || {}) };
  next.world.completedBosses = Array.isArray(next.world.completedBosses) ? next.world.completedBosses : [];
  next.world.clears = next.world.clears || {};
  return next;
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

function getHeroStats(game) {
  const base = CLASSES[game.className].base;
  const b = game.buildings;
  const levelBonus = game.level - 1;
  const gear = equipmentBonus(game);

  const hp = base.hp + levelBonus * 18 + b.citadel.level * 12 + gear.hp;
  const attack = base.attack + levelBonus * 4 + b.barracks.level * 3 + gear.attack;
  const defense = base.defense + levelBonus * 2 + b.citadel.level * 2 + gear.defense;
  const mana = base.mana + levelBonus * 7 + b.academy.level * 8 + gear.mana;
  const power =
    100 +
    game.level * 45 +
    b.citadel.level * 35 +
    b.barracks.level * 35 +
    b.academy.level * 25 +
    b.mine.level * 15 +
    b.lumber.level * 15 +
    gear.power;

  return { hp, attack, defense, mana, power, gear };
}

function getMaxEnergy(game) {
  return 20 + game.level + game.buildings.citadel.level;
}

function getHourlyIncome(game) {
  return {
    gold: 80 + game.buildings.mine.level * 35,
    wood: 45 + game.buildings.lumber.level * 35 + game.buildings.citadel.level * 8,
    crystals: 5 + game.buildings.academy.level * 3
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
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
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
  const next = clone(game);
  next.resources.gold += reward.gold || 0;
  next.resources.wood += reward.wood || 0;
  next.resources.crystals += reward.crystals || 0;
  next.xp += reward.xp || 0;

  while (next.xp >= next.xpToNext) {
    next.xp -= next.xpToNext;
    next.level += 1;
    next.xpToNext = Math.round(next.xpToNext * 1.35);
    next.resources.energy = Math.min(getMaxEnergy(next), next.resources.energy + 4);
  }

  next.resources.energy = Math.min(next.resources.energy, getMaxEnergy(next));
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
  return resources.gold >= cost.gold && resources.wood >= cost.wood && resources.crystals >= cost.crystals;
}

function getBuildingMaxLevel(game, key) {
  if (key === "citadel") return MAX_CITADEL_LEVEL;
  return Math.max(1, game.buildings.citadel.level);
}

function getBuildingUpgradeStatus(game, key) {
  const level = game.buildings[key].level;
  const maxLevel = getBuildingMaxLevel(game, key);

  if (level >= maxLevel) {
    const reason = key === "citadel" ? `Max Lv. ${MAX_CITADEL_LEVEL}` : `Cere Citadel Lv. ${level + 1}`;
    return { can: false, reason, maxLevel };
  }

  const cost = getBuildingCost(game, key);
  if (!canAfford(game.resources, cost)) {
    return { can: false, reason: "Resurse insuficiente", maxLevel };
  }

  return { can: true, reason: "Upgrade", maxLevel };
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
            <p>Construiești orașul, ridici eroul, lupți cu monștri, primești iteme și echipezi eroul.</p>
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
        <div className="badge">Update 4 · Hourly Kingdom</div>
        <h1>S-Fleet Fantasy War ⚔️</h1>
        <p>{game.playerName} · Level {game.level} · {game.className}</p>
      </div>

      <div className="top-actions">
        <div className="stat-box">👑 <b>{stats.power}</b><span>Power</span></div>
        <div className="stat-box">🏆 <b>{game.stats.wins}</b><span>Wins</span></div>
        <div className="stat-box">🎒 <b>{totalItemCount(game)}</b><span>Items</span></div>
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

function City({ game, setGame }) {
  const [now, setNow] = useState(Date.now());
  const collectionState = getCollectionState(game, now);
  const hourlyIncome = getHourlyIncome(game);
  const maxEnergy = getMaxEnergy(game);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  function collect() {
    setGame((prev) => applyHourlyCollection(prev, Date.now()).game);
    setNow(Date.now());
  }

  function upgrade(key) {
    setGame((prev) => {
      const status = getBuildingUpgradeStatus(prev, key);
      if (!status.can) return prev;
      const cost = getBuildingCost(prev, key);
      const next = clone(prev);
      next.resources.gold -= cost.gold;
      next.resources.wood -= cost.wood;
      next.resources.crystals -= cost.crystals;
      next.buildings[key].level += 1;
      return next;
    });
  }

  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <h2>Orașul tău</h2>
          <p>Colectarea merge o singură dată pe oră. Citadel poate ajunge la level 50, iar celelalte clădiri pot crește doar până la nivelul Citadel.</p>
        </div>
        <button className="primary" disabled={!collectionState.ready} onClick={collect}>
          {collectionState.ready ? "Colectează resurse" : `Disponibil în ${formatCountdown(collectionState.remainingMs)}`}
        </button>
      </div>

      <div className="collect-panel">
        <div><b>Producție / oră</b><span>{hourlyIncome.gold} gold · {hourlyIncome.wood} wood · {hourlyIncome.crystals} crystals</span></div>
        <div><b>Ore pregătite</b><span>{collectionState.ready ? collectionState.hours : 0}h</span></div>
        <div><b>Energie la colectare</b><span>se umple la maxim: {maxEnergy}</span></div>
      </div>

      <div className="grid four">
        {Object.entries(BUILDINGS).map(([key, building]) => {
          const cost = getBuildingCost(game, key);
          const level = game.buildings[key].level;
          const status = getBuildingUpgradeStatus(game, key);
          const maxText = key === "citadel" ? `Max Lv. ${MAX_CITADEL_LEVEL}` : `Max permis: Lv. ${status.maxLevel} după Citadel`;
          return (
            <article className="building" key={key}>
              <div className="building-top"><span>{building.emoji}</span><b>Lv. {level}</b></div>
              <h3>{building.name}</h3>
              <p>{building.description}</p>
              <small>{level >= status.maxLevel ? maxText : `Cost: ${cost.gold} gold · ${cost.wood} wood · ${cost.crystals} crystals`}</small>
              <button disabled={!status.can} onClick={() => upgrade(key)}>{status.reason}</button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Battle({ game, setGame }) {
  const heroStats = useMemo(() => getHeroStats(game), [game]);
  const [enemy, setEnemy] = useState(() => randomEnemy(game.level));
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
    setEnemy(randomEnemy(game.level));
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
        dropped = createItem(next.level, defeatedEnemy.name);
        if (next.inventory.length < 60) {
          next.inventory.push(dropped);
          next.stats.itemsFound += 1;
        } else {
          next.resources.gold += dropped.value;
          dropped = { ...dropped, soldBecauseFull: true };
        }
      }

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
            <p>Level {game.level} · {game.className}</p>
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
  const [enemy, setEnemy] = useState(() => createWorldEnemy(selectedZone, game.level, false));
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
    setEnemy(createWorldEnemy(zone, game.level, false));
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
    setEnemy(createWorldEnemy(zone, game.level, isBoss));
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
        dropped = createItem(Math.max(next.level, zone.level), defeatedEnemy.name, defeatedEnemy.rarityBoost);
        if (next.inventory.length < 60) {
          next.inventory.push(dropped);
          next.stats.itemsFound += 1;
        } else {
          next.resources.gold += dropped.value;
          dropped = { ...dropped, soldBecauseFull: true };
        }
      }

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
            <p>Level {game.level} · {game.className}</p>
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

function Hero({ game }) {
  const stats = getHeroStats(game);
  const selectedClass = CLASSES[game.className];

  return (
    <section className="grid two">
      <div className="panel">
        <h2>Erou</h2>
        <div className="hero-profile">
          <div className="big-emoji">{selectedClass.emoji}</div>
          <div>
            <h3>{game.playerName}</h3>
            <p>Level {game.level} · {game.className}</p>
          </div>
        </div>

        <Progress label="XP" value={game.xp} max={game.xpToNext} />

        <div className="grid two mini-stats">
          <div>❤️ HP <b>{stats.hp}</b><small>Gear +{stats.gear.hp}</small></div>
          <div>⚔️ Attack <b>{stats.attack}</b><small>Gear +{stats.gear.attack}</small></div>
          <div>🛡️ Defense <b>{stats.defense}</b><small>Gear +{stats.gear.defense}</small></div>
          <div>🔮 Mana <b>{stats.mana}</b><small>Gear +{stats.gear.mana}</small></div>
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

  useEffect(() => {
    async function loadGame() {
      setLoading(true);

      if (!hasSupabase || !session) {
        const raw = localStorage.getItem(LOCAL_KEY);
        setGame(raw ? normalizeGame(JSON.parse(raw)) : null);
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

      const { error } = await supabase
        .from("game_saves")
        .upsert({
          user_id: session.user.id,
          player_name: normalized.playerName,
          class_name: normalized.className,
          data: normalized
        }, { onConflict: "user_id" });

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
        <button className={tab === "hero" ? "active" : ""} onClick={() => setTab("hero")}>🧙 Erou</button>
        <button className={tab === "quests" ? "active" : ""} onClick={() => setTab("quests")}>📜 Questuri</button>
        <button className="danger-tab" onClick={resetSave}>Reset progres</button>
      </nav>

      {tab === "city" && <City game={game} setGame={setGame} />}
      {tab === "battle" && <Battle game={game} setGame={setGame} />}
      {tab === "world" && <Dungeon game={game} setGame={setGame} />}
      {tab === "inventory" && <Inventory game={game} setGame={setGame} />}
      {tab === "hero" && <Hero game={game} />}
      {tab === "quests" && <Quests game={game} setGame={setGame} />}
    </main>
  );
}

export default function App() {
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
