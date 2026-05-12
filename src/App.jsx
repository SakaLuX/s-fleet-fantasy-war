import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const hasSupabase = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const supabase = hasSupabase ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const LOCAL_KEY = "s_fleet_fantasy_war_local_save_v2";

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
    id: "veteran",
    title: "Arena Veteran",
    text: "Câștigă 5 lupte.",
    reward: { gold: 350, wood: 140, crystals: 30, xp: 140 },
    check: (game) => game.stats.wins >= 5
  }
];

function createStarterGame(playerName = "Lord S-Fleet", className = "Knight") {
  return {
    version: 2,
    playerName,
    className,
    level: 1,
    xp: 0,
    xpToNext: 100,
    resources: { gold: 350, wood: 220, crystals: 45, energy: 12 },
    buildings: {
      citadel: { level: 1 },
      barracks: { level: 1 },
      mine: { level: 1 },
      academy: { level: 1 }
    },
    stats: { wins: 0, losses: 0 },
    completedQuests: [],
    createdAt: new Date().toISOString()
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getHeroStats(game) {
  const base = CLASSES[game.className].base;
  const b = game.buildings;
  const levelBonus = game.level - 1;

  const hp = base.hp + levelBonus * 18 + b.citadel.level * 12;
  const attack = base.attack + levelBonus * 4 + b.barracks.level * 3;
  const defense = base.defense + levelBonus * 2 + b.citadel.level * 2;
  const mana = base.mana + levelBonus * 7 + b.academy.level * 8;
  const power =
    100 +
    game.level * 45 +
    b.citadel.level * 35 +
    b.barracks.level * 35 +
    b.academy.level * 25 +
    b.mine.level * 15;

  return { hp, attack, defense, mana, power };
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
    next.resources.energy += 4;
  }

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

function randomEnemy(level) {
  const maxIndex = Math.min(ENEMIES.length - 1, Math.floor((level - 1) / 2));
  const enemy = clone(ENEMIES[Math.floor(Math.random() * (maxIndex + 1))]);
  const scale = 1 + Math.max(0, level - 1) * 0.12;
  enemy.maxHp = Math.round(enemy.hp * scale);
  enemy.hp = enemy.maxHp;
  enemy.attack = Math.round(enemy.attack * scale);
  enemy.defense = Math.round(enemy.defense * scale);
  enemy.reward = {
    gold: Math.round(enemy.reward.gold * scale),
    wood: Math.round(enemy.reward.wood * scale),
    crystals: Math.round(enemy.reward.crystals * scale),
    xp: Math.round(enemy.reward.xp * scale)
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
            <p>Construiești orașul, ridici eroul, lupți cu monștri și salvezi progresul.</p>
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
        <div className="badge">Alpha MVP</div>
        <h1>S-Fleet Fantasy War ⚔️</h1>
        <p>{game.playerName} · Level {game.level} · {game.className}</p>
      </div>

      <div className="top-actions">
        <div className="stat-box">👑 <b>{stats.power}</b><span>Power</span></div>
        <div className="stat-box">🏆 <b>{game.stats.wins}</b><span>Wins</span></div>
        <div className="stat-box">💾 <b>{saveStatus}</b><span>Save</span></div>
        {session && <button className="danger" onClick={onLogout}>Logout</button>}
      </div>
    </header>
  );
}

function Resources({ game }) {
  return (
    <section className="resources">
      <div className="resource">🪙 <span>Gold</span><b>{game.resources.gold}</b></div>
      <div className="resource">🪵 <span>Wood</span><b>{game.resources.wood}</b></div>
      <div className="resource">💎 <span>Crystals</span><b>{game.resources.crystals}</b></div>
      <div className="resource">⚡ <span>Energy</span><b>{game.resources.energy}</b></div>
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
  function collect() {
    setGame((prev) => {
      const next = clone(prev);
      next.resources.gold += 80 + next.buildings.mine.level * 35;
      next.resources.wood += 45 + next.buildings.citadel.level * 18;
      next.resources.crystals += 5 + next.buildings.academy.level * 3;
      next.resources.energy = Math.min(20 + next.level, next.resources.energy + 3);
      return next;
    });
  }

  function upgrade(key) {
    setGame((prev) => {
      const cost = getBuildingCost(prev, key);
      if (!canAfford(prev.resources, cost)) return prev;
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
          <p>Upgrade-urile cresc puterea eroului și producția de resurse.</p>
        </div>
        <button className="primary" onClick={collect}>Colectează resurse</button>
      </div>

      <div className="grid four">
        {Object.entries(BUILDINGS).map(([key, building]) => {
          const cost = getBuildingCost(game, key);
          const level = game.buildings[key].level;
          const affordable = canAfford(game.resources, cost);
          return (
            <article className="building" key={key}>
              <div className="building-top"><span>{building.emoji}</span><b>Lv. {level}</b></div>
              <h3>{building.name}</h3>
              <p>{building.description}</p>
              <small>Cost: {cost.gold} gold · {cost.wood} wood · {cost.crystals} crystals</small>
              <button disabled={!affordable} onClick={() => upgrade(key)}>Upgrade</button>
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
    setGame((prev) => {
      let next = clone(prev);
      next.stats.wins += 1;
      next.resources.energy = Math.max(0, next.resources.energy - 1);
      next = applyReward(next, defeatedEnemy.reward);
      return next;
    });
    addLog(`Victorie! Reward: ${defeatedEnemy.reward.gold} gold, ${defeatedEnemy.reward.xp} XP.`);
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
            <p>Luptă pe ture contra monștrilor.</p>
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

function Hero({ game, setGame }) {
  const stats = getHeroStats(game);

  function changeClass(className) {
    setGame((prev) => ({ ...prev, className }));
  }

  return (
    <section className="grid two">
      <div className="panel">
        <h2>Erou</h2>
        <div className="hero-profile">
          <div className="big-emoji">{CLASSES[game.className].emoji}</div>
          <div>
            <h3>{game.playerName}</h3>
            <p>Level {game.level} · {game.className}</p>
          </div>
        </div>

        <Progress label="XP" value={game.xp} max={game.xpToNext} />

        <div className="grid two mini-stats">
          <div>❤️ HP <b>{stats.hp}</b></div>
          <div>⚔️ Attack <b>{stats.attack}</b></div>
          <div>🛡️ Defense <b>{stats.defense}</b></div>
          <div>🔮 Mana <b>{stats.mana}</b></div>
        </div>
      </div>

      <div className="panel">
        <h2>Schimbă clasa</h2>
        <p>Pentru MVP poți schimba clasa ca să testăm balansul.</p>
        <div className="class-list">
          {Object.entries(CLASSES).map(([key, item]) => (
            <button key={key} className={game.className === key ? "class-card active" : "class-card"} onClick={() => changeClass(key)}>
              <span className="class-emoji">{item.emoji}</span>
              <span>
                <b>{item.title}</b>
                <small>{item.skill.name}</small>
              </span>
            </button>
          ))}
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
        setGame(raw ? JSON.parse(raw) : null);
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

      setGame(data?.data || null);
      setSaveStatus(data?.data ? "Cloud" : "New");
      setLoading(false);
    }

    loadGame();
  }, [session]);

  useEffect(() => {
    if (!game || loading) return;

    const timer = window.setTimeout(async () => {
      if (!hasSupabase || !session) {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(game));
        setSaveStatus("Local");
        return;
      }

      setSaveStatus("Saving");

      const { error } = await supabase
        .from("game_saves")
        .upsert({
          user_id: session.user.id,
          player_name: game.playerName,
          class_name: game.className,
          data: game
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
        <button className={tab === "hero" ? "active" : ""} onClick={() => setTab("hero")}>🧙 Erou</button>
        <button className={tab === "quests" ? "active" : ""} onClick={() => setTab("quests")}>📜 Questuri</button>
        <button className="danger-tab" onClick={resetSave}>Reset progres</button>
      </nav>

      {tab === "city" && <City game={game} setGame={setGame} />}
      {tab === "battle" && <Battle game={game} setGame={setGame} />}
      {tab === "hero" && <Hero game={game} setGame={setGame} />}
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
