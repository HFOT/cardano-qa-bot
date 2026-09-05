// デプロイのたびに index.html の ?v= と合わせて番号を上げる(キャッシュの新旧混在防止)
import walletContent from "./content/wallet.js?v=37";
import spoContent from "./content/spo.js?v=37";
import drepContent from "./content/drep.js?v=37";
import scamContent from "./content/scam.js?v=37";
import valueContent from "./content/value.js?v=37";
import midnightContent from "./content/midnight.js?v=37";
import gameContent from "./content/game.js?v=37";

const HOME_NODE_ID = "home";

const HOME_NODE = {
  type: "choice",
  text: "こんにちは。何について知りたいですか?",
  options: [
    { label: "ウォレット操作について", next: "wallet-root" },
    { label: "SPO(プール)選びについて", next: "spo-root" },
    { label: "DRep選びについて", next: "drep-root" },
    { label: "詐欺の手口を知る", next: "scam-root" },
    { label: "ADAの価値は上がるの?", next: "value-root" },
    { label: "Midnightって何?", next: "mn-root" },
    { label: "🎰 スロットで遊ぶ", next: "game-root" },
  ],
};

function mergeNodes() {
  return Object.assign(
    { [HOME_NODE_ID]: HOME_NODE },
    walletContent.nodes,
    spoContent.nodes,
    drepContent.nodes,
    scamContent.nodes,
    valueContent.nodes,
    midnightContent.nodes,
    gameContent.nodes
  );
}

const nodes = mergeNodes();

const state = {
  currentNodeId: HOME_NODE_ID,
  history: [],
};

let recommendSeq = 0;

const chatLog = document.getElementById("chat-log");
const chatOptions = document.getElementById("chat-options");
const freeTextForm = document.getElementById("free-text-form");
const freeTextInput = document.getElementById("free-text-input");
const homeBtn = document.getElementById("home-btn");

// **強調** 記法だけを解釈する。DOM組み立てのみで innerHTML は使わない。
function renderRichText(target, text) {
  const parts = String(text).split("**");
  parts.forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      const em = document.createElement("strong");
      em.className = "em";
      em.textContent = part;
      target.appendChild(em);
    } else {
      target.appendChild(document.createTextNode(part));
    }
  });
}

function appendBubble(content, sender) {
  const bubble = document.createElement("div");
  bubble.className = "bubble " + sender;
  if (content instanceof Node) {
    bubble.classList.add("has-block");
    bubble.appendChild(content);
  } else {
    renderRichText(bubble, content);
  }
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

// 推薦結果の表。セルは textContent / DOM 組み立てのみ(リモートデータをinnerHTMLに通さない)。
function buildRecommendTable(headers, rows) {
  const wrap = document.createElement("div");
  wrap.className = "tbl-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const trh = document.createElement("tr");
  headers.forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    trh.appendChild(th);
  });
  thead.appendChild(trh);
  table.appendChild(thead);
  const tbody = document.createElement("tbody");
  rows.forEach((cells) => {
    const tr = document.createElement("tr");
    cells.forEach((c) => {
      const td = document.createElement("td");
      if (c instanceof Node) td.appendChild(c);
      else td.textContent = c;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}

function clearOptions() {
  chatOptions.innerHTML = "";
}

function renderOptionButtons(options, onSelect) {
  clearOptions();
  options.forEach((opt) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option-btn";
    btn.textContent = opt.label;
    btn.addEventListener("click", () => onSelect(opt));
    chatOptions.appendChild(btn);
  });
}

function renderNavButtons({ showBack, showHome }) {
  const wrap = document.createElement("div");
  wrap.className = "nav-buttons";
  if (showBack) {
    const backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "nav-btn";
    backBtn.textContent = "前の質問に戻る";
    backBtn.addEventListener("click", goBack);
    wrap.appendChild(backBtn);
  }
  if (showHome) {
    const topBtn = document.createElement("button");
    topBtn.type = "button";
    topBtn.className = "nav-btn";
    topBtn.textContent = "トップに戻る";
    topBtn.addEventListener("click", goHome);
    wrap.appendChild(topBtn);
  }
  chatOptions.appendChild(wrap);
}

// ミニブラウザ(iframe埋め込み)。answerノードのembedと推薦結果の両方で使う。
// 同じURLはセッション中1回だけ埋め込む(重いページを更新ボタンのたびに増殖させない)。
const embeddedUrls = new Set();

function appendEmbed(url, title, opts = {}) {
  if (opts.once && embeddedUrls.has(url)) return;
  embeddedUrls.add(url);
  const box = document.createElement("div");
  box.className = "embed-box";
  const viewport = document.createElement("div");
  viewport.className = "embed-viewport";
  const frame = document.createElement("iframe");
  frame.src = url;
  frame.loading = "lazy";
  frame.referrerPolicy = "no-referrer";
  frame.title = title || "embedded page";
  const open = document.createElement("a");
  open.href = url;
  open.target = "_blank";
  open.rel = "noopener";
  open.className = "embed-open";
  open.textContent = "全画面で開く ↗";
  viewport.appendChild(frame);
  box.appendChild(viewport);
  box.appendChild(open);
  appendBubble(box, "bot");
  // 埋め込み先はPC幅想定のページが多いので、仮想幅で描画して丸ごと縮小表示する
  // (右側が切れるのを防ぐ。少し小さく見えるのは仕様)
  const VIRTUAL_W = 1080;
  const visibleW = viewport.clientWidth;
  const visibleH = viewport.clientHeight;
  if (visibleW > 0 && visibleW < VIRTUAL_W) {
    const scale = visibleW / VIRTUAL_W;
    frame.style.width = VIRTUAL_W + "px";
    frame.style.height = Math.round(visibleH / scale) + "px";
    frame.style.transform = "scale(" + scale + ")";
  }
}

// ---- 🎰 スロットマシン(3リール・本物の当たり外れ・金貨シャワー) ----
// リールにはターゲット(プール/DRep)のほか、スキャム・ラグ・DAppsなどが混ざる。
// ターゲットは必ず1つは出るが、3つ揃うとは限らない。揃ったときだけ実在の1件が開示される。
const SLOT_FILLERS = [
  { key: "scam", icon: "🧟", label: "スキャム" },
  { key: "rug", icon: "🧻", label: "ラグ" },
  { key: "dapps", icon: "📱", label: "DApps" },
  { key: "ada", icon: "₳", label: "ADA" },
  { key: "lucky", icon: "⭐", label: "LUCKY" },
];
const SLOT_MISS_LINES = [
  "はずれ! でも₳は1枚も減っていない。そこらのカジノより良心的。",
  "うーん、噛み合わない。ガバナンスと同じですね。",
  "リールの神は気まぐれ。DRepの投票率より読めない。",
  "はずれ。でも大丈夫、あなたのシードフレーズは無事です。",
  "僕は委任しましぇん!! …と言い張る自由もあります。それが分散です。",
  "回すなよ! 絶対回すなよ! (※回してください)",
  "投票率が上がらないの、なんでだろう〜。",
  "聞いてないよぉ…(委任解除されたSPOの心の声)",
  "同情するなら委任くれ。(プールの本音)",
  "この台、失敗しないので。…今、外しましたけど。",
  "さっき流れてたプール名、クセがすごい!",
];
const SLOT_JACKPOT_LINES = [
  "3つ揃いました。もう委任変えちゃいましょうかｗｗ(※遊びです)",
  "これはもう運命では? 責任は取りませんが、縁は感じます。",
  "台が光りました。あなたの指、才能あります。",
  "おめでとうございます! 賞金は出ませんが知識が増えます。",
  "世の中には2種類の人間がいる。委任か、委任以外か。— 今日のあなたは前者。",
  "いつ委任するか? 今でしょ! (※ご自身の判断でｗ)",
  "そこに委任はあるんか? …ここにあります。",
  "委任は裏切らない。筋肉と同じで。",
  "委任は文化だ。— おめでとう、あなたは今日から文化人ｗ",
  "揃った瞬間だけ饒舌になる台。それがCARDANO SLOTS。",
  "安心してください、委任してますよ。",
  "あなたはもう、委任している。",
  "委任にコミットする。",
  "じぇじぇじぇ! 3つ揃った!",
  "委任、1、2、3、ダー!",
  "委任は力なり。",
  "ガバナンスは会議室で起きてるんじゃない。オンチェーンで起きてるんだ!",
];

function coinShower(container, count) {
  for (let i = 0; i < count; i++) {
    const coin = document.createElement("span");
    coin.className = "slot-coin";
    coin.textContent = "₳";
    coin.style.left = Math.random() * 92 + 4 + "%";
    coin.style.animationDelay = Math.random() * 0.7 + "s";
    coin.style.fontSize = 12 + Math.random() * 12 + "px";
    container.appendChild(coin);
    setTimeout(() => coin.remove(), 2400);
  }
}

// リールのマス: 絵文字+文字ラベルの2段表示
function setReelSymbol(reelEl, symbol) {
  reelEl.replaceChildren();
  const icon = document.createElement("span");
  icon.className = "reel-icon";
  icon.textContent = symbol.icon;
  const lbl = document.createElement("span");
  lbl.className = "reel-label";
  lbl.textContent = symbol.label;
  reelEl.appendChild(icon);
  reelEl.appendChild(lbl);
}

// config: { getCandidates, target: {icon,label}, reelText, buildResult, errorText }
function buildSlotMachine(config) {
  const box = document.createElement("div");
  box.className = "slot-machine slot-cabinet";
  // カジノ風マーキー(看板+点滅ライト)
  const marquee = document.createElement("div");
  marquee.className = "slot-marquee";
  const lightsTop = document.createElement("div");
  lightsTop.className = "slot-lights";
  for (let i = 0; i < 14; i++) {
    const bulb = document.createElement("span");
    bulb.className = "bulb";
    bulb.style.animationDelay = (i % 2) * 0.4 + "s";
    lightsTop.appendChild(bulb);
  }
  const marqueeTitle = document.createElement("div");
  marqueeTitle.className = "slot-marquee-title";
  marqueeTitle.textContent = "✦ CARDANO SLOTS ✦";
  marquee.appendChild(lightsTop);
  marquee.appendChild(marqueeTitle);

  const legendEl = document.createElement("div");
  legendEl.className = "slot-legend";
  legendEl.textContent =
    config.target.icon + config.target.label + " ×3で大当たり! " + config.target.label + "は毎回どこかに必ずいます";
  const reelsWrap = document.createElement("div");
  reelsWrap.className = "slot-reels";
  const reels = [0, 1, 2].map(() => {
    const r = document.createElement("div");
    r.className = "slot-reel";
    setReelSymbol(r, { icon: "?", label: "READY" });
    reelsWrap.appendChild(r);
    return r;
  });
  const nameEl = document.createElement("div");
  nameEl.className = "slot-name";
  const spinBtn = document.createElement("button");
  spinBtn.type = "button";
  spinBtn.className = "slot-spin-btn";
  spinBtn.textContent = "🎰 回す!";
  const resultEl = document.createElement("div");
  resultEl.className = "slot-result";
  const noteEl = document.createElement("div");
  noteEl.className = "slot-note";
  noteEl.textContent = "※遊びです。委任の推奨ではありません。";
  box.appendChild(marquee);
  box.appendChild(legendEl);
  box.appendChild(reelsWrap);
  box.appendChild(nameEl);
  box.appendChild(spinBtn);
  box.appendChild(resultEl);
  box.appendChild(noteEl);

  // 出目を作る: ターゲット1つは保証、残りは確率で決まる。
  // ターゲットのマスには実在の名前(Ticker/DRep名)が入り、
  // 大当たりのときは3つとも「同じ名前」が揃う。
  function rollOutcome(candidates) {
    const flags = [true, false, false];
    for (let i = 1; i < 3; i++) flags[i] = Math.random() < 0.38;
    for (let i = flags.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = flags[i];
      flags[i] = flags[j];
      flags[j] = t;
    }
    const hits = flags.filter(Boolean).length;
    const winner =
      hits === 3 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
    const symbols = flags.map((isTarget) => {
      if (!isTarget) {
        return SLOT_FILLERS[Math.floor(Math.random() * SLOT_FILLERS.length)];
      }
      const item = winner || candidates[Math.floor(Math.random() * candidates.length)];
      return { key: config.target.key, icon: config.target.icon, label: config.labelFor(item) };
    });
    return { symbols, hits, winner };
  }

  function countKey(symbols, key) {
    return symbols.filter((s) => s.key === key).length;
  }

  let spinning = false;
  spinBtn.addEventListener("click", async () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    nameEl.textContent = "";
    nameEl.className = "slot-name";
    resultEl.replaceChildren();
    reels.forEach((r) => {
      r.className = "slot-reel spinning";
    });
    const candidates = await config.getCandidates();
    if (!candidates || candidates.length === 0) {
      reels.forEach((r) => {
        r.className = "slot-reel";
        setReelSymbol(r, { icon: "✕", label: "ERROR" });
      });
      resultEl.textContent = config.errorText;
      spinning = false;
      spinBtn.disabled = false;
      return;
    }
    const outcome = rollOutcome(candidates);
    const stopAt = [1100, 1700, 2400];
    const startedAt = performance.now();
    const stopped = [false, false, false];

    // スピン中もターゲットのマスには実在の名前がチラチラ流れる
    function randomSpinSymbol() {
      if (Math.random() < 0.34) {
        const item = candidates[Math.floor(Math.random() * candidates.length)];
        return { key: config.target.key, icon: config.target.icon, label: config.labelFor(item) };
      }
      return SLOT_FILLERS[Math.floor(Math.random() * SLOT_FILLERS.length)];
    }

    function finish() {
      const scams = countKey(outcome.symbols, "scam");
      const rugs = countKey(outcome.symbols, "rug");
      if (outcome.hits === 3) {
        // 🏆 大当たり: 同じ名前が3つ揃う → その実在の1件を説明つきで開示 + 金貨シャワー
        reels.forEach((r) => r.classList.add("aligned", "tier-s"));
        const winner = outcome.winner;
        coinShower(box, 26);
        nameEl.textContent = "🏆 JACKPOT! " + config.reelText(winner);
        nameEl.classList.add("slot-name-win");
        const wrap = document.createElement("div");
        const joke = document.createElement("div");
        joke.className = "slot-joke";
        joke.textContent =
          SLOT_JACKPOT_LINES[Math.floor(Math.random() * SLOT_JACKPOT_LINES.length)];
        const desc = document.createElement("div");
        desc.className = "slot-desc";
        desc.textContent = config.describe(winner);
        wrap.appendChild(joke);
        wrap.appendChild(desc);
        wrap.appendChild(config.buildResult(winner));
        resultEl.replaceChildren(wrap);
      } else if (outcome.hits === 2) {
        coinShower(box, 5);
        nameEl.textContent = "おしい! あと1つ! 台は叩かないでください!";
      } else if (scams === 3) {
        nameEl.textContent = "🧟🧟🧟 スキャムフィーバー!!(最悪のフィーバー) シードフレーズを抱えて逃げて!";
        nameEl.classList.add("slot-name-bad");
      } else if (scams === 2) {
        nameEl.textContent = "🧟×2 スキャムゾンビ発生! DMは開けるな! 走れ!";
        nameEl.classList.add("slot-name-bad");
      } else if (rugs === 3) {
        nameEl.textContent = "🧻🧻🧻 全面ラグ張り!! この部屋、床がない!";
        nameEl.classList.add("slot-name-bad");
      } else if (rugs === 2) {
        nameEl.textContent = "🧻×2 ラグ発生! 敷物ごと資産が滑っていく〜!";
        nameEl.classList.add("slot-name-bad");
      } else {
        nameEl.textContent = SLOT_MISS_LINES[Math.floor(Math.random() * SLOT_MISS_LINES.length)];
      }
      spinning = false;
      spinBtn.disabled = false;
      spinBtn.textContent = "🎰 もう一回!";
    }

    function tick() {
      const elapsed = performance.now() - startedAt;
      let allStopped = true;
      reels.forEach((r, i) => {
        if (stopped[i]) return;
        if (elapsed >= stopAt[i]) {
          stopped[i] = true;
          setReelSymbol(r, outcome.symbols[i]);
          r.className = "slot-reel stopped";
        } else {
          allStopped = false;
          setReelSymbol(r, randomSpinSymbol());
        }
      });
      if (allStopped) {
        finish();
        return;
      }
      setTimeout(tick, 70);
    }
    tick();
  });
  return box;
}

// ---- ⚔️ SPOカードバトル(トップトランプ方式・3ラウンド) ----
const BATTLE_STATS = [
  { key: "score", label: "健全性", fmt: (v) => v + "点", higherWins: true, meter: (v) => v / 100 },
  { key: "stake", label: "ステーク", fmt: (v) => Math.round(v / 1000).toLocaleString() + "k₳", higherWins: true, meter: (v) => Math.min(v / 60000000, 1) },
  { key: "delegators", label: "委任者", fmt: (v) => v + "人", higherWins: true, meter: (v) => Math.min(v / 1500, 1) },
  { key: "margin", label: "手数料 ↓", fmt: (v) => Math.round(v * 1000) / 10 + "%", higherWins: false, meter: (v) => 1 - Math.min(v / 0.05, 1) },
  { key: "rtt", label: "応答速度 ↓", fmt: (v) => Math.round(v) + "ms", higherWins: false, meter: (v) => 1 - Math.min(v / 300, 1) },
];

function tickerHue(ticker) {
  let h = 7;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) % 3600;
  return h % 360;
}

function poolRarity(pool) {
  if (pool.score >= 95) return { cls: "rarity-s", label: "★ LEGEND" };
  if (pool.score >= 85) return { cls: "rarity-a", label: "◆ EPIC" };
  return { cls: "rarity-b", label: "● RARE" };
}

function buildBattleCard(pool, { faceDown, onPickStat }) {
  const card = document.createElement("div");
  if (faceDown) {
    card.className = "battle-card face-down";
    const back = document.createElement("div");
    back.className = "card-back";
    const mark = document.createElement("span");
    mark.textContent = "₳";
    back.appendChild(mark);
    card.appendChild(back);
    return card;
  }

  const rarity = poolRarity(pool);
  card.className = "battle-card card-reveal " + rarity.cls;
  const hue = tickerHue(pool.ticker);

  // ヘッダー: レアリティ + ticker
  const head = document.createElement("div");
  head.className = "card-head";
  const rarityEl = document.createElement("span");
  rarityEl.className = "card-rarity";
  rarityEl.textContent = rarity.label;
  const nameEl = document.createElement("span");
  nameEl.className = "card-name";
  nameEl.textContent = pool.ticker;
  head.appendChild(rarityEl);
  head.appendChild(nameEl);
  card.appendChild(head);

  // アート面: tickerから生成される固有の紋章
  const art = document.createElement("div");
  art.className = "card-art";
  art.style.background =
    `radial-gradient(circle at 30% 30%, hsl(${hue}, 85%, 62%), transparent 55%),` +
    `radial-gradient(circle at 72% 65%, hsl(${(hue + 60) % 360}, 80%, 55%), transparent 52%),` +
    `radial-gradient(circle at 50% 90%, hsl(${(hue + 200) % 360}, 75%, 45%), transparent 60%),` +
    `hsl(${hue}, 45%, 16%)`;
  const emblem = document.createElement("span");
  emblem.className = "card-emblem";
  emblem.textContent = pool.ticker.slice(0, 2);
  art.appendChild(emblem);
  card.appendChild(art);

  // 能力: メーターバー付き
  const stats = document.createElement("div");
  stats.className = "card-stats";
  BATTLE_STATS.forEach((stat, idx) => {
    const row = document.createElement(onPickStat ? "button" : "div");
    if (onPickStat) {
      row.type = "button";
      row.addEventListener("click", () => onPickStat(idx));
    }
    row.className = "battle-stat";
    row.dataset.statIdx = String(idx);
    const top = document.createElement("span");
    top.className = "battle-stat-top";
    const lb = document.createElement("span");
    lb.className = "battle-stat-label";
    lb.textContent = stat.label;
    const val = document.createElement("span");
    val.className = "battle-stat-value";
    val.textContent = stat.fmt(pool[stat.key]);
    top.appendChild(lb);
    top.appendChild(val);
    const meter = document.createElement("span");
    meter.className = "battle-meter";
    const fill = document.createElement("span");
    fill.className = "battle-meter-fill";
    fill.style.width = Math.round(Math.max(0.04, Math.min(stat.meter(pool[stat.key]), 1)) * 100) + "%";
    meter.appendChild(fill);
    row.appendChild(top);
    row.appendChild(meter);
    stats.appendChild(row);
  });
  card.appendChild(stats);
  return card;
}

function buildSpoBattle(getCandidates, errorText) {
  const box = document.createElement("div");
  box.className = "battle-box";
  const header = document.createElement("div");
  header.className = "battle-header";
  const arena = document.createElement("div");
  arena.className = "battle-arena";
  const verdict = document.createElement("div");
  verdict.className = "battle-verdict";
  const controls = document.createElement("div");
  controls.className = "battle-controls";
  const note = document.createElement("div");
  note.className = "slot-note";
  note.textContent = "※遊びです。カードの強さと委任先の良し悪しは別の話です。";
  box.appendChild(header);
  box.appendChild(arena);
  box.appendChild(verdict);
  box.appendChild(controls);
  box.appendChild(note);

  let deck = null;
  let round = 0;
  let myScore = 0;
  let cpuScore = 0;
  let myCard = null;
  let cpuCard = null;

  function draw() {
    return deck[Math.floor(Math.random() * deck.length)];
  }

  function updateHeader() {
    header.textContent = round > 3
      ? "けっか はっぴょう!"
      : `ROUND ${round}/3 ── あなた ${myScore} - ${cpuScore} あいて`;
  }

  function startRound() {
    round += 1;
    updateHeader();
    verdict.textContent = "自分のカードから、勝負する能力を選んでください!";
    controls.replaceChildren();
    myCard = draw();
    do {
      cpuCard = draw();
    } while (cpuCard.pool === myCard.pool);
    arena.replaceChildren(
      buildBattleCard(myCard, { faceDown: false, onPickStat: resolveRound }),
      buildBattleCard(cpuCard, { faceDown: true })
    );
  }

  function resolveRound(statIdx) {
    const stat = BATTLE_STATS[statIdx];
    // 相手カードをオープンして両者の選択能力をハイライト
    arena.replaceChildren(
      buildBattleCard(myCard, { faceDown: false }),
      buildBattleCard(cpuCard, { faceDown: false })
    );
    arena.querySelectorAll(`.battle-stat[data-stat-idx="${statIdx}"]`).forEach((el) => {
      el.classList.add("battle-stat-active");
    });
    const mine = myCard[stat.key];
    const theirs = cpuCard[stat.key];
    let result;
    if (mine === theirs) {
      result = "引き分け!";
    } else {
      const iWin = stat.higherWins ? mine > theirs : mine < theirs;
      if (iWin) {
        myScore += 1;
        result = "🎉 勝ち!";
      } else {
        cpuScore += 1;
        result = "😢 負け…";
      }
    }
    updateHeader();
    verdict.textContent = `「${stat.label}」で勝負 → ${result}`;
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "slot-spin-btn";
    if (round < 3) {
      nextBtn.textContent = "次のラウンドへ ▶";
      nextBtn.addEventListener("click", startRound);
    } else {
      nextBtn.textContent = "結果を見る 🏆";
      nextBtn.addEventListener("click", showFinal);
    }
    controls.replaceChildren(nextBtn);
  }

  function showFinal() {
    round = 4;
    updateHeader();
    arena.replaceChildren();
    let msg;
    if (myScore > cpuScore) msg = `🏆 あなたの勝ち! (${myScore} - ${cpuScore})`;
    else if (myScore < cpuScore) msg = `😢 あなたの負け… (${myScore} - ${cpuScore})`;
    else msg = `🤝 引き分け! (${myScore} - ${cpuScore})`;
    verdict.textContent = msg;
    const againBtn = document.createElement("button");
    againBtn.type = "button";
    againBtn.className = "slot-spin-btn";
    againBtn.textContent = "⚔️ もう一回たたかう";
    againBtn.addEventListener("click", () => {
      round = 0;
      myScore = 0;
      cpuScore = 0;
      startRound();
    });
    controls.replaceChildren(againBtn);
  }

  (async () => {
    header.textContent = "カードを配っています…";
    const candidates = await getCandidates();
    if (!candidates || candidates.length < 6) {
      header.textContent = "— ERROR —";
      verdict.textContent = errorText;
      return;
    }
    deck = candidates;
    startRound();
  })();

  return box;
}

// ---- 🏃 ADAランナー(横スクロール・ジャンプ回避ゲーム) ----
// ゲームオーバー時に表示する「現実の提案」の実例(教育オチ)
const WORST_PROPOSALS = [
  "調達のときだけ「投票お願いします!」と現れて、資金を得たあとは音沙汰なし。",
  "エコシステムには一部だけ貢献し、残りの資金はそのまま給料に消えた。",
  "資金調達後、GitHubのコミットはゼロ。ロードマップも一度も更新されなかった。",
  "同じ内容の提案を名前だけ変えて何度も出し、多重に資金を調達していた。",
  "報告書は毎回提出されるが、中身はテンプレの使い回しで検証できる成果物がない。",
  "マイルストーン報告が自画自賛だけで、動くものが最後まで出てこなかった。",
];
const BEST_PROPOSALS = [
  "調達前から動くプロトタイプを公開し、調達後も毎月の進捗報告とGitHub更新を続けた。",
  "予算の内訳を最初からすべて公開し、余った資金はTreasuryに返還した。",
  "成果物をオープンソースで公開し、他のプロジェクトも再利用できるようにした。",
  "コミュニティの指摘を受けて仕様を修正し、完成後も自費で運用を続けている。",
  "調達額を必要最小限に絞り、追加が必要なときは成果を見せてから再提案した。",
  "検証可能なマイルストーンを設定し、達成できなかった部分を正直に報告した。",
];

function buildRunnerGame() {
  const box = document.createElement("div");
  box.className = "runner-box";
  const stageWrap = document.createElement("div");
  stageWrap.className = "runner-stage";
  const canvas = document.createElement("canvas");
  canvas.width = 560;
  canvas.height = 300;
  canvas.className = "runner-canvas";
  canvas.setAttribute("tabindex", "0");
  const overlay = document.createElement("div");
  overlay.className = "runner-overlay";
  stageWrap.appendChild(canvas);
  stageWrap.appendChild(overlay);
  const hud = document.createElement("div");
  hud.className = "runner-hud";
  const lessons = document.createElement("div");
  lessons.className = "runner-lessons";
  box.appendChild(stageWrap);
  box.appendChild(hud);
  box.appendChild(lessons);

  const ctx = canvas.getContext("2d");
  const W = 560;
  const H = 300;
  const GROUND_Y = 262;
  const STAGE_LEN = 1250;
  const P = { x: 60, y: GROUND_Y, vy: 0, w: 26, h: 30 };
  const GRAVITY = 0.55;
  const JUMP_V = -10.2;
  let entities = [];
  let frame = 0;
  let stage = 1;
  let stageFrame = 0;
  let mode = "all"; // "all" | 1 | 2 | 3
  let score = 0;
  let loot = 0;
  let fudActive = false;
  let stolenTotal = 0;
  let dece = 0;
  let cent = 0;
  let minionQueue = 0;
  let flash = 0;
  let running = false;
  let playing = false; // 章プレイ中(オーバーレイ非表示)
  let best = 0;
  let nextSpawn = 60;
  try {
    best = parseInt(localStorage.getItem("wc_runner_best") || "0", 10) || 0;
  } catch (e) {}

  const STAGE_META = {
    1: {
      title: "STAGE 1 ホルダー章",
      icon: "🏃",
      rules: [
        "🧟スキャム・🧻ラグ → ジャンプでよける(当たると終了)",
        "🟢いい提案 → 取る(+50)",
        "🔴わるい提案 → スルー(取ると-80)",
        "₳コイン → +15",
      ],
    },
    2: {
      title: "STAGE 2 ラグプル・スキャム章",
      icon: "🧟",
      rules: [
        "立場逆転! あなたがゾンビ(悪役体験)",
        "🙂ホルダーに触れて資金を奪う(+100)",
        "💢FUDを取ると次の強奪が2倍",
        "🏦銀行で換金して初めてスコアになる",
      ],
    },
    3: {
      title: "STAGE 3 分散化章",
      icon: "🌐",
      rules: [
        "🌐分散を取る? 🏛中央集権を取る? 選択の連続",
        "👑ボス → 中央集権が半減、ただし手下ラッシュ",
        "最後にネットワークの形が決まる",
        "🌐 ≧ 🏛 なら分散化エンディング",
      ],
    },
  };

  function themeColors() {
    const cs = getComputedStyle(document.documentElement);
    return {
      bg: cs.getPropertyValue("--panel").trim() || "#ffffff",
      ground: cs.getPropertyValue("--hairline").trim() || "#ccc",
      text: cs.getPropertyValue("--text").trim() || "#111",
      accent: cs.getPropertyValue("--accent").trim() || "#0a84ff",
    };
  }

  function makeBtn(label, cls, onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = cls;
    b.textContent = label;
    b.addEventListener("click", (e) => {
      e.stopPropagation();
      onClick();
    });
    return b;
  }

  function clearCanvasIdle() {
    const c = themeColors();
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);
  }

  // ---- 画面: タイトル(章選択) ----
  function showTitle() {
    running = false;
    playing = false;
    clearCanvasIdle();
    lessons.replaceChildren();
    hud.textContent = "BEST " + best;
    overlay.replaceChildren();
    overlay.classList.remove("hidden");
    const t = document.createElement("div");
    t.className = "runner-title";
    t.textContent = "🏃 ADAランナー";
    const sub = document.createElement("div");
    sub.className = "runner-sub";
    sub.textContent = "章をえらんで遊ぶ(遊び方は各章の画面で)";
    overlay.appendChild(t);
    overlay.appendChild(sub);
    overlay.appendChild(
      makeBtn("▶ 全3章 通しプレイ", "runner-btn runner-btn-main", () => showStageIntro(1, "all"))
    );
    [1, 2, 3].forEach((n) => {
      overlay.appendChild(
        makeBtn(STAGE_META[n].icon + " " + STAGE_META[n].title, "runner-btn", () =>
          showStageIntro(n, n)
        )
      );
    });
  }

  // ---- 画面: 章の説明 + スタート ----
  function showStageIntro(n, selectedMode) {
    running = false;
    playing = false;
    clearCanvasIdle();
    overlay.replaceChildren();
    overlay.classList.remove("hidden");
    const t = document.createElement("div");
    t.className = "runner-title";
    t.textContent = STAGE_META[n].icon + " " + STAGE_META[n].title;
    overlay.appendChild(t);
    const rulesBox = document.createElement("div");
    rulesBox.className = "runner-rules";
    STAGE_META[n].rules.forEach((line) => {
      const li = document.createElement("div");
      li.textContent = line;
      rulesBox.appendChild(li);
    });
    overlay.appendChild(rulesBox);
    overlay.appendChild(
      makeBtn("▶ スタート (タップ/スペースでジャンプ)", "runner-btn runner-btn-main", () =>
        startStage(n, selectedMode)
      )
    );
    overlay.appendChild(makeBtn("章をえらびなおす", "runner-btn runner-btn-sub", showTitle));
  }

  function startStage(n, selectedMode) {
    mode = selectedMode;
    stage = n;
    stageFrame = 0;
    entities = [];
    P.y = GROUND_Y;
    P.vy = 0;
    flash = 0;
    nextSpawn = 50;
    if (mode !== "all" || n === 1) {
      frame = 0;
      score = 0;
      stolenTotal = 0;
      dece = 0;
      cent = 0;
    }
    loot = 0;
    fudActive = false;
    minionQueue = 0;
    lessons.replaceChildren();
    overlay.classList.add("hidden");
    playing = true;
    running = true;
    canvas.focus();
    loop();
  }

  // ---- 画面: 結果 ----
  function saveBest() {
    const f = Math.floor(score);
    if (f > best) {
      best = f;
      try {
        localStorage.setItem("wc_runner_best", String(best));
      } catch (e) {}
    }
    return f;
  }

  function addLesson(cls, text) {
    const el = document.createElement("div");
    el.className = "lesson " + cls;
    el.textContent = text;
    lessons.appendChild(el);
  }

  function showResult(titleText, lines, isGood) {
    running = false;
    playing = false;
    const f = saveBest();
    overlay.replaceChildren();
    overlay.classList.remove("hidden");
    const t = document.createElement("div");
    t.className = "runner-title " + (isGood ? "runner-title-good" : "runner-title-bad");
    t.textContent = titleText;
    overlay.appendChild(t);
    const info = document.createElement("div");
    info.className = "runner-rules";
    lines.concat(["スコア " + f + " / ベスト " + best]).forEach((line) => {
      const li = document.createElement("div");
      li.textContent = line;
      info.appendChild(li);
    });
    overlay.appendChild(info);
    overlay.appendChild(
      makeBtn("🔁 もう一回", "runner-btn runner-btn-main", () =>
        showStageIntro(mode === "all" ? 1 : stage, mode)
      )
    );
    overlay.appendChild(makeBtn("章をえらぶ", "runner-btn runner-btn-sub", showTitle));
    hud.textContent = "SCORE " + f + "　BEST " + best;
  }

  function onStageClear() {
    if (mode === "all" && stage < 3) {
      // 次章の説明画面へ(スコア持ち越し)
      running = false;
      playing = false;
      showStageIntro(stage + 1, "all");
      return;
    }
    // 結果表示
    if (stage === 1) {
      showResult("✅ ホルダー章 クリア!", ["スキャムを見抜く目、育っています"], true);
      const worst = WORST_PROPOSALS[Math.floor(Math.random() * WORST_PROPOSALS.length)];
      const bestEx = BEST_PROPOSALS[Math.floor(Math.random() * BEST_PROPOSALS.length)];
      addLesson("lesson-worst", "📉 現実の最悪な提案の例: " + worst);
      addLesson("lesson-best", "📈 現実の最善な提案の例: " + bestEx);
    } else if (stage === 2) {
      showResult(
        "🧟 スキャム章 終了",
        ["奪った資金 " + stolenTotal.toLocaleString() + "₳", "未換金のまま消えた分 " + loot.toLocaleString() + "₳"],
        false
      );
      addLesson(
        "lesson-worst",
        "📉 あなたが奪った" + stolenTotal.toLocaleString() + "₳は、現実では誰かの大切な資産。手口を知った今、守る側に回ろう。"
      );
    } else {
      const isDece = dece >= cent;
      showResult(
        isDece ? "🌐 分散化エンディング" : "🏛 中央集権エンディング",
        ["分散 " + dece + " vs 中央 " + cent],
        isDece
      );
      addLesson(
        isDece ? "lesson-best" : "lesson-worst",
        isDece
          ? "🌐 あなたの選択でネットワークは分散を保った。現実でも、一票一委任が同じ力を持っています。"
          : "🏛 ネットワークは中央集権に傾いた。分散への小さな選択の積み重ねが、現実の防波堤です。"
      );
      addLesson("lesson-moral", "詳しくは「詐欺の手口を知る」「ADAの価値」トピックで解説しています。");
    }
  }

  function onGameOver() {
    showResult("💀 GAME OVER", ["スキャムかラグに接触…"], false);
    const worst = WORST_PROPOSALS[Math.floor(Math.random() * WORST_PROPOSALS.length)];
    const bestEx = BEST_PROPOSALS[Math.floor(Math.random() * BEST_PROPOSALS.length)];
    addLesson("lesson-worst", "📉 現実の最悪な提案の例: " + worst);
    addLesson("lesson-best", "📈 現実の最善な提案の例: " + bestEx);
    addLesson("lesson-moral", "現実の提案も「取るか・スルーするか」。投票の前に過去の実績を見よう!");
  }

  function jump() {
    if (!playing) return;
    if (P.y >= GROUND_Y - 1) {
      P.vy = JUMP_V;
    }
  }

  function drawRunner(c) {
    const cx = P.x + P.w / 2;
    const feetY = P.y;
    if (stage === 2) {
      ctx.font = "34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🧟", cx, feetY - 2);
      if (fudActive) {
        ctx.font = "14px sans-serif";
        ctx.fillText("💢×2", cx + 26, feetY - 38);
      }
      return;
    }
    const hipY = feetY - 14;
    const shoulderY = feetY - 26;
    const headCY = feetY - 34;
    const airborne = P.y < GROUND_Y - 1;
    const phase = Math.sin(frame * 0.38);
    ctx.strokeStyle = c.text;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(cx, shoulderY);
    ctx.lineTo(cx, hipY);
    ctx.stroke();
    ctx.beginPath();
    if (airborne) {
      ctx.moveTo(cx, hipY);
      ctx.lineTo(cx + 8, hipY + 6);
      ctx.lineTo(cx + 12, hipY + 1);
      ctx.moveTo(cx, hipY);
      ctx.lineTo(cx - 7, hipY + 7);
      ctx.lineTo(cx - 12, hipY + 3);
    } else {
      ctx.moveTo(cx, hipY);
      ctx.lineTo(cx + phase * 9, hipY + 8);
      ctx.lineTo(cx + phase * 13, feetY);
      ctx.moveTo(cx, hipY);
      ctx.lineTo(cx - phase * 9, hipY + 8);
      ctx.lineTo(cx - phase * 12, feetY - 1);
    }
    ctx.stroke();
    ctx.beginPath();
    if (airborne) {
      ctx.moveTo(cx, shoulderY + 2);
      ctx.lineTo(cx + 9, shoulderY - 6);
      ctx.moveTo(cx, shoulderY + 2);
      ctx.lineTo(cx - 9, shoulderY - 5);
    } else {
      ctx.moveTo(cx, shoulderY + 2);
      ctx.lineTo(cx - phase * 10, shoulderY + 9);
      ctx.moveTo(cx, shoulderY + 2);
      ctx.lineTo(cx + phase * 10, shoulderY + 8);
    }
    ctx.stroke();
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.arc(cx, headCY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("₳", cx, headCY + 4);
  }

  function spawn() {
    const airY = 180 + Math.random() * 50;
    const roll = Math.random();
    if (stage === 1) {
      if (roll < 0.3) {
        entities.push({ type: "scam", icon: "🧟", x: W + 20, y: GROUND_Y, w: 26, h: 28 });
      } else if (roll < 0.5) {
        entities.push({ type: "rug", icon: "🧻", x: W + 20, y: GROUND_Y, w: 30, h: 24 });
      } else if (roll < 0.68) {
        entities.push({ type: "good", icon: "🟢", x: W + 20, y: airY, w: 24, h: 24 });
      } else if (roll < 0.84) {
        entities.push({ type: "bad", icon: "🔴", x: W + 20, y: airY, w: 24, h: 24 });
      } else {
        entities.push({ type: "coin", icon: "", x: W + 20, y: airY + 10, w: 20, h: 20 });
      }
    } else if (stage === 2) {
      if (roll < 0.44) {
        entities.push({ type: "holder", icon: "🙂", x: W + 20, y: GROUND_Y, w: 26, h: 28 });
      } else if (roll < 0.62) {
        entities.push({ type: "fud", icon: "💢", x: W + 20, y: airY, w: 24, h: 24 });
      } else if (roll < 0.78) {
        entities.push({ type: "bank", icon: "🏦", x: W + 20, y: GROUND_Y, w: 32, h: 32 });
      } else {
        entities.push({ type: "coin", icon: "", x: W + 20, y: airY + 10, w: 20, h: 20 });
      }
    } else {
      if (minionQueue > 0) {
        minionQueue -= 1;
        entities.push({ type: "cent", icon: "🏛", x: W + 20, y: 180 + Math.random() * 50, w: 26, h: 26 });
      } else if (roll < 0.06) {
        entities.push({ type: "boss", icon: "👑", x: W + 20, y: GROUND_Y, w: 36, h: 34 });
      } else if (roll < 0.5) {
        entities.push({ type: "dece", icon: "🌐", x: W + 20, y: airY, w: 26, h: 26 });
      } else if (roll < 0.9) {
        entities.push({ type: "cent", icon: "🏛", x: W + 20, y: airY, w: 26, h: 26 });
      } else {
        entities.push({ type: "coin", icon: "", x: W + 20, y: airY + 10, w: 20, h: 20 });
      }
    }
    const speedBias = Math.min(frame / 2400, 1);
    nextSpawn = 34 + Math.floor(Math.random() * 38) - Math.floor(speedBias * 14);
  }

  function hit(a, b) {
    const shrink = 5;
    return (
      a.x + shrink < b.x + b.w - shrink &&
      a.x + a.w - shrink > b.x + shrink &&
      a.y + shrink < b.y + b.h - shrink &&
      a.y + a.h - shrink > b.y + shrink
    );
  }

  function loop() {
    if (!running) return;
    const c = themeColors();
    const speed = 3.6 + frame / 700;
    frame += 1;
    stageFrame += 1;
    score += 0.06;

    if (stageFrame >= STAGE_LEN) {
      onStageClear();
      return;
    }

    P.vy += GRAVITY;
    P.y += P.vy;
    if (P.y > GROUND_Y) {
      P.y = GROUND_Y;
      P.vy = 0;
    }

    nextSpawn -= 1;
    if (nextSpawn <= 0) spawn();
    const playerBox = { x: P.x, y: P.y - P.h, w: P.w, h: P.h };
    let died = false;
    entities.forEach((e) => {
      e.x -= speed;
      const eBox = { x: e.x, y: e.y - e.h, w: e.w, h: e.h };
      if (!e.dead && hit(playerBox, eBox)) {
        if (stage === 1) {
          if (e.type === "scam" || e.type === "rug") {
            died = true;
          } else if (e.type === "good") {
            score += 50;
            e.dead = true;
          } else if (e.type === "bad") {
            score = Math.max(0, score - 80);
            flash = 12;
            e.dead = true;
          } else if (e.type === "coin") {
            score += 15;
            e.dead = true;
          }
        } else if (stage === 2) {
          if (e.type === "holder") {
            const grab = fudActive ? 200 : 100;
            loot += grab;
            stolenTotal += grab;
            if (fudActive) fudActive = false;
            flash = 6;
            e.dead = true;
          } else if (e.type === "fud") {
            fudActive = true;
            e.dead = true;
          } else if (e.type === "bank") {
            score += loot;
            loot = 0;
            e.dead = true;
          } else if (e.type === "coin") {
            score += 15;
            e.dead = true;
          }
        } else {
          if (e.type === "dece") {
            dece += 1;
            score += 20;
            e.dead = true;
          } else if (e.type === "cent") {
            cent += 1;
            e.dead = true;
          } else if (e.type === "boss") {
            cent = Math.floor(cent / 2);
            minionQueue = 6;
            flash = 10;
            e.dead = true;
          } else if (e.type === "coin") {
            score += 15;
            e.dead = true;
          }
        }
      }
    });
    entities = entities.filter((e) => !e.dead && e.x > -40);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = c.bg;
    ctx.fillRect(0, 0, W, H);
    if (flash > 0) {
      ctx.fillStyle = stage === 2 ? "rgba(212, 160, 23, 0.15)" : "rgba(229, 72, 77, 0.18)";
      ctx.fillRect(0, 0, W, H);
      flash -= 1;
    }
    ctx.strokeStyle = c.ground;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y + 2);
    ctx.lineTo(W, GROUND_Y + 2);
    ctx.stroke();

    // 画面内ヘッダー(章名 + 進行バー)
    ctx.fillStyle = c.text;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(STAGE_META[stage].icon + " " + STAGE_META[stage].title, 12, 22);
    ctx.fillStyle = "rgba(120,120,128,0.25)";
    ctx.fillRect(12, 30, W - 24, 5);
    ctx.fillStyle = c.accent;
    ctx.fillRect(12, 30, (W - 24) * (stageFrame / STAGE_LEN), 5);

    // 章別サブ情報
    ctx.textAlign = "right";
    ctx.font = "bold 13px sans-serif";
    ctx.fillStyle = c.text;
    if (stage === 2) {
      ctx.fillText("未換金 " + loot + "₳" + (fudActive ? " 💢×2" : ""), W - 12, 22);
    } else if (stage === 3) {
      ctx.fillText("🌐" + dece + " vs 🏛" + cent, W - 12, 22);
    } else {
      ctx.fillText("SCORE " + Math.floor(score), W - 12, 22);
    }

    ctx.textAlign = "center";
    drawRunner(c);

    entities.forEach((e) => {
      if (e.type === "coin") {
        ctx.fillStyle = "#f5b90a";
        ctx.beginPath();
        ctx.arc(e.x + e.w / 2, e.y - e.h / 2, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#7a5700";
        ctx.font = "bold 12px sans-serif";
        ctx.fillText("₳", e.x + e.w / 2, e.y - e.h / 2 + 4);
      } else {
        ctx.font = e.type === "boss" ? "32px sans-serif" : "24px sans-serif";
        ctx.fillText(e.icon, e.x + e.w / 2, e.y - 4);
      }
    });

    hud.textContent = "SCORE " + Math.floor(score) + "　BEST " + best;

    if (died) {
      onGameOver();
      return;
    }
    requestAnimationFrame(loop);
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  canvas.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      jump();
    }
  });

  showTitle();
  return box;
}

function slotStatLine(pairs) {
  const wrap = document.createElement("div");
  wrap.className = "slot-stats";
  pairs.forEach(([label, value]) => {
    const span = document.createElement("span");
    span.textContent = label + " " + value;
    wrap.appendChild(span);
  });
  return wrap;
}

// 「他の5件を見る」ボタン + ナビの共通描画
function renderRerollAndNav(nodeId, label) {
  renderOptionButtons([{ label: label, next: nodeId }], (opt) => {
    appendBubble(opt.label, "user");
    renderNode(nodeId);
  });
  renderNavButtons({ showBack: state.history.length > 0, showHome: true });
}

function renderNode(nodeId, opts = {}) {
  const node = nodes[nodeId];
  if (!node) {
    appendBubble("該当する内容が見つかりませんでした。トップに戻ります。", "bot");
    return renderNode(HOME_NODE_ID);
  }

  state.currentNodeId = nodeId;

  if (opts.matchedKeyword) {
    appendBubble(`"${opts.matchedKeyword}" についてですね。`, "bot");
  }

  if (node.type === "message") {
    appendBubble(node.text, "bot");
    return renderNode(node.next);
  }

  if (node.type === "choice") {
    appendBubble(node.text, "bot");
    renderOptionButtons(node.options, (opt) => {
      appendBubble(opt.label, "user");
      state.history.push(nodeId);
      renderNode(opt.next);
    });
    if (nodeId !== HOME_NODE_ID) {
      renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    }
    return;
  }

  if (node.type === "answer") {
    appendBubble(node.text, "bot");
    if (node.embed) {
      appendEmbed(node.embed, node.label);
    }
    clearOptions();
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  if (node.type === "recommend-pool") {
    appendBubble(node.loadingText, "bot");
    clearOptions();
    const seq = ++recommendSeq;
    fetchRelayHealthPools()
      .then((pools) => {
        if (seq !== recommendSeq || state.currentNodeId !== nodeId) return;
        if (!pools || pools.length === 0) throw new Error("empty");
        const good = pools.filter(
          (p) =>
            typeof p.score === "number" &&
            p.score >= 85 &&
            p.ticker &&
            p.ticker !== "N/A"
        );
        if (good.length === 0) throw new Error("no qualifying pools");
        const picked = pickRandomN(good, 5);
        appendBubble(
          "健全性ランキング(hfot.github.io/cardano-relay-health)から**S・Aグレード**のプールを5件ランダムに紹介します:",
          "bot"
        );
        const rows = picked.map((p) => {
          const ticker = p.ticker;
          const grade = p.score >= 95 ? "S" : "A";
          const gradeCell = document.createElement("span");
          gradeCell.className = grade === "S" ? "grade grade-s" : "grade grade-a";
          gradeCell.textContent = `${grade} ${p.score}`;
          const marginPct = Math.round(p.margin * 1000) / 10;
          return [
            ticker,
            gradeCell,
            `${marginPct}% + ${p.fixedAda}₳`,
            `${Math.round(p.stake).toLocaleString()}₳`,
            `${p.delegators}人`,
          ];
        });
        appendBubble(
          buildRecommendTable(["Ticker", "評価", "手数料", "ステーク", "委任者"], rows),
          "bot"
        );
        appendEmbed(RELAY_HEALTH_URL, "Relay Health Ranking", { once: true });
        renderRerollAndNav(nodeId, "🔄 他の5件を見る");
      })
      .catch(() => {
        if (seq !== recommendSeq || state.currentNodeId !== nodeId) return;
        appendBubble(node.errorText, "bot");
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      });
    return;
  }

  if (node.type === "recommend-drep") {
    appendBubble(node.loadingText, "bot");
    clearOptions();
    const seq = ++recommendSeq;
    fetchDrepTarget15Candidates()
      .then((candidates) => {
        if (seq !== recommendSeq || state.currentNodeId !== nodeId) return;
        if (!candidates || candidates.length === 0) throw new Error("empty");
        const picked = pickRandomN(candidates, 5);
        appendBubble(
          "TARGET15(上位10 DRepへの集中を避ける思想)に沿って、投票力**1.5%未満**のDRepを5件ランダムに紹介します:",
          "bot"
        );
        const rows = picked.map((d) => {
          const nameCell = document.createElement("div");
          const nameLine = document.createElement("div");
          nameLine.className = "drep-name";
          nameLine.textContent = d.name || "(名前未登録)";
          const idLine = document.createElement("div");
          idLine.className = "drep-id";
          idLine.textContent = d.id;
          nameCell.appendChild(nameLine);
          nameCell.appendChild(idLine);
          const vpAda = Math.round(d.latest_vp * 1_000_000).toLocaleString();
          return [nameCell, `#${d.rank}`, `${vpAda}₳`, `${d.sharePct.toFixed(2)}%`];
        });
        appendBubble(
          buildRecommendTable(["DRep", "順位", "投票力", "シェア"], rows),
          "bot"
        );
        appendBubble(
          "委任前に各DRepの最新の投票実績をGovTool(https://gov.tools)で確認してください。",
          "bot"
        );
        renderRerollAndNav(nodeId, "🔄 他のDRepを見る");
      })
      .catch(() => {
        if (seq !== recommendSeq || state.currentNodeId !== nodeId) return;
        appendBubble(node.errorText, "bot");
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      });
    return;
  }

  if (node.type === "slot-pool") {
    const machine = buildSlotMachine({
      getCandidates: async () => {
        const pools = await fetchRelayHealthPools();
        if (!pools) return null;
        return pools.filter(
          (p) =>
            typeof p.score === "number" &&
            p.score >= 85 &&
            p.ticker &&
            p.ticker !== "N/A"
        );
      },
      target: { key: "pool", icon: "🏊", label: "POOL" },
      labelFor: (p) => p.ticker.slice(0, 6),
      describe: (p) => {
        const grade = p.score >= 95 ? "S" : "A";
        const sizeText = p.stake < 5000000 ? "小規模で応援しがいのある" : p.stake < 20000000 ? "中規模の安定した" : "大規模な";
        const satPct = Math.round((p.sat || 0) * 100);
        return (
          "[" + p.ticker + "] は健全性" + grade + "グレード(" + p.score + "点)の" + sizeText +
          "プール。委任者" + p.delegators + "人、飽和度" + satPct + "%。" +
          (satPct < 50 ? "サチュレーションに余裕があり、非集中化に貢献できる委任先候補です。" : "人気プールなので飽和度には注意を。")
        );
      },
      reelText: (p) => "[" + p.ticker + "]",
      buildResult: (p) => {
        const grade = p.score >= 95 ? "S" : "A";
        const marginPct = Math.round(p.margin * 1000) / 10;
        return slotStatLine([
          ["🎉", "[" + p.ticker + "]"],
          ["評価", grade + " " + p.score + "点"],
          ["手数料", marginPct + "% + " + p.fixedAda + "₳"],
          ["ステーク", Math.round(p.stake).toLocaleString() + "₳"],
          ["委任者", p.delegators + "人"],
        ]);
      },
      errorText: node.errorText,
    });
    appendBubble(
      "🎰 **SPOスロット**! リールには🏊POOLのほかに🧟スキャムや🧻ラグも紛れています。**🏊POOLが3つ揃うと大当たり** — S・Aグレードの実在プールが1つ開示されます:",
      "bot"
    );
    appendBubble(machine, "bot");
    clearOptions();
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  if (node.type === "slot-drep") {
    const machine = buildSlotMachine({
      getCandidates: async () => fetchDrepTarget15Candidates(),
      target: { key: "drep", icon: "🗳️", label: "DRep" },
      labelFor: (d) => (d.name || "DRep").slice(0, 7),
      describe: (d) => {
        return (
          (d.name || "このDRep") + " は投票力ランキング#" + d.rank + "、シェア" + d.sharePct.toFixed(2) +
          "%のDRep。上位に集中しすぎない規模で、Target 15(上位10者で15%未満)の分散思想に合う候補です。委任前にGovToolで投票実績を確認してください。"
        );
      },
      reelText: (d) => d.name || d.id.slice(0, 16) + "…",
      buildResult: (d) => {
        const wrap = document.createElement("div");
        wrap.appendChild(
          slotStatLine([
            ["🎉", d.name || "(名前未登録)"],
            ["順位", "#" + d.rank],
            ["投票力", Math.round(d.latest_vp * 1_000_000).toLocaleString() + "₳"],
            ["シェア", d.sharePct.toFixed(2) + "%"],
          ])
        );
        const idLine = document.createElement("div");
        idLine.className = "drep-id";
        idLine.textContent = d.id;
        wrap.appendChild(idLine);
        return wrap;
      },
      errorText: node.errorText,
    });
    appendBubble(
      "🎰 **DRepスロット**! リールには🗳️DRepのほかに🧟スキャムや🧻ラグも紛れています。**🗳️DRepが3つ揃うと大当たり** — 投票力1.5%未満(Target 15)の実在DRepが1人開示されます:",
      "bot"
    );
    appendBubble(machine, "bot");
    clearOptions();
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  if (node.type === "spo-battle") {
    const battle = buildSpoBattle(async () => {
      const pools = await fetchRelayHealthPools();
      if (!pools) return null;
      // バトルには全能力値が揃ったカードだけを使う(RTT未計測などは除外)
      return pools.filter(
        (p) =>
          typeof p.score === "number" &&
          p.score >= 70 &&
          p.ticker &&
          p.ticker !== "N/A" &&
          typeof p.stake === "number" &&
          typeof p.delegators === "number" &&
          typeof p.margin === "number" &&
          typeof p.rtt === "number" &&
          p.rtt > 0
      );
    }, node.errorText);
    appendBubble(
      "⚔️ **SPOカードバトル**! 実在のプールがカードになって登場。自分のカードの能力をひとつ選んで、伏せられた相手カードと勝負。3ラウンド先取で勝敗が決まります:",
      "bot"
    );
    appendBubble(battle, "bot");
    clearOptions();
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  if (node.type === "runner-game") {
    appendBubble("🏃 **ADAランナー**! 章をえらんであそぼう — 遊び方はゲーム画面の中に出ます:", "bot");
    appendBubble(buildRunnerGame(), "bot");
    clearOptions();
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  console.warn("[QA-BOT] unknown node type:", node.type, "for node:", nodeId);
}

function goBack() {
  const prev = state.history.pop();
  if (prev === undefined) {
    return goHome();
  }
  renderNode(prev);
}

function goHome() {
  // 会話ログをリセットして初期画面(ヒーロー+紹介枠)に戻す
  state.history = [];
  chatLog.replaceChildren();
  renderNode(HOME_NODE_ID);
}

homeBtn.addEventListener("click", goHome);

function pickRandomN(arr, n) {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy.slice(0, n);
}

function extractBalancedJson(text, startIdx, openChar, closeChar) {
  if (text[startIdx] !== openChar) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) { escape = false; }
      else if (ch === "\\") { escape = true; }
      else if (ch === '"') { inString = false; }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) return text.slice(startIdx, i + 1);
    }
  }
  return null;
}

const RELAY_HEALTH_URL = "https://hfot.github.io/cardano-relay-health/";

let _poolsCache = null;

async function fetchRelayHealthPools() {
  if (_poolsCache) return _poolsCache;
  const res = await fetch(RELAY_HEALTH_URL);
  if (!res.ok) return null;
  const html = await res.text();
  const marker = "const data=";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;
  const arrStart = markerIdx + marker.length;
  const jsonText = extractBalancedJson(html, arrStart, "[", "]");
  if (!jsonText) return null;
  _poolsCache = JSON.parse(jsonText);
  return _poolsCache;
}

const DREP_TERMINAL_URL = "https://hfot.github.io/drep-terminal-v6/";

let _drepCache = null;

async function fetchDrepTarget15Candidates() {
  if (_drepCache) return _drepCache;
  const res = await fetch(DREP_TERMINAL_URL);
  if (!res.ok) return null;
  const html = await res.text();
  const dbIdx = html.indexOf("const DB");
  if (dbIdx === -1) return null;
  const dbBrace = html.indexOf("{", dbIdx);
  if (dbBrace === -1) return null;
  const dbText = extractBalancedJson(html, dbBrace, "{", "}");
  if (!dbText) return null;
  const db = JSON.parse(dbText);
  const dreps = db.dreps;
  if (!Array.isArray(dreps)) return null;
  // total_vp はページによって DB の外(別の const オブジェクト)にあるため、独立に探す
  let totalVpByEpoch = db.total_vp;
  if (!totalVpByEpoch) {
    const tvIdx = html.indexOf('"total_vp":');
    if (tvIdx === -1) return null;
    const tvBrace = html.indexOf("{", tvIdx);
    if (tvBrace === -1) return null;
    const tvText = extractBalancedJson(html, tvBrace, "{", "}");
    if (!tvText) return null;
    totalVpByEpoch = JSON.parse(tvText);
  }
  const epochs = Object.keys(totalVpByEpoch).map(Number).filter((n) => !isNaN(n));
  if (epochs.length === 0) return null;
  const latestEpoch = Math.max(...epochs);
  const totalVp = totalVpByEpoch[String(latestEpoch)];
  if (typeof totalVp !== "number" || !(totalVp > 0)) return null;
  _drepCache = dreps
    .filter((d) => typeof d.latest_vp === "number" && d.latest_vp > 0 && d.latest_vp / totalVp < 0.015)
    .map((d) => Object.assign({}, d, { sharePct: (d.latest_vp / totalVp) * 100 }));
  return _drepCache;
}

function buildKeywordIndex(nodesMap) {
  const index = [];
  Object.entries(nodesMap).forEach(([nodeId, node]) => {
    if (Array.isArray(node.keywords)) {
      node.keywords.forEach((keyword) => {
        index.push({ nodeId, keyword });
      });
    }
  });
  return index;
}

const keywordIndex = buildKeywordIndex(nodes);

function matchKeywords(inputText) {
  const counts = new Map();
  const matchedKeywordsByNode = new Map();

  keywordIndex.forEach(({ nodeId, keyword }) => {
    if (inputText.includes(keyword)) {
      counts.set(nodeId, (counts.get(nodeId) || 0) + 1);
      const list = matchedKeywordsByNode.get(nodeId) || [];
      list.push(keyword);
      matchedKeywordsByNode.set(nodeId, list);
    }
  });

  if (counts.size === 0) {
    return { bestNodeIds: [], matchedKeywordsByNode };
  }

  const maxCount = Math.max(...counts.values());
  const bestNodeIds = [...counts.entries()]
    .filter(([, count]) => count === maxCount)
    .map(([nodeId]) => nodeId);

  if (bestNodeIds.length > 1) {
    const longestByNode = bestNodeIds.map((nodeId) => {
      const kws = matchedKeywordsByNode.get(nodeId);
      return { nodeId, len: Math.max(...kws.map((k) => k.length)) };
    });
    const maxLen = Math.max(...longestByNode.map((e) => e.len));
    const winners = longestByNode.filter((e) => e.len === maxLen);
    if (winners.length === 1) {
      const winId = winners[0].nodeId;
      const kws = matchedKeywordsByNode.get(winId);
      kws.sort((a, b) => b.length - a.length);
      return { bestNodeIds: [winId], matchedKeywordsByNode };
    }
  }

  return { bestNodeIds, matchedKeywordsByNode };
}

function handleFreeTextSubmit(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  appendBubble(trimmed, "user");

  const { bestNodeIds, matchedKeywordsByNode } = matchKeywords(trimmed);

  if (bestNodeIds.length === 1) {
    const nodeId = bestNodeIds[0];
    const matchedKeyword = matchedKeywordsByNode.get(nodeId)[0];
    state.history.push(state.currentNodeId);
    renderNode(nodeId, { matchedKeyword });
    return;
  }

  if (bestNodeIds.length > 1) {
    appendBubble("もしかして、次のどれかについて聞きたいですか?", "bot");
    const options = bestNodeIds.map((nodeId) => ({
      label: nodes[nodeId].label,
      next: nodeId,
    }));
    renderOptionButtons(options, (opt) => {
      appendBubble(opt.label, "user");
      state.history.push(state.currentNodeId);
      renderNode(opt.next);
    });
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  // ノーヒット: 行き止まりにせず、反応できる言葉の実例をボタンで提示する
  appendBubble(
    "うまく聞き取れませんでした。例えば、こんな言葉に反応できます:",
    "bot"
  );
  const suggestions = [
    { label: "シードフレーズ", next: "wallet-security-seed" },
    { label: "送金のやり方", next: "wallet-basic-send" },
    { label: "ステーキングとは", next: "wallet-staking-what" },
    { label: "プールの選び方", next: "spo-trust" },
    { label: "DRepとは", next: "drep-basics-what" },
    { label: "詐欺の手口", next: "scam-root" },
    { label: "ADAの価格", next: "value-root" },
    { label: "報酬はどうなる?", next: "value-rewards" },
  ];
  renderOptionButtons(suggestions, (opt) => {
    appendBubble(opt.label, "user");
    state.history.push(state.currentNodeId);
    renderNode(opt.next);
  });
  renderNavButtons({ showBack: state.history.length > 0, showHome: true });
}

freeTextForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleFreeTextSubmit(freeTextInput.value);
  freeTextInput.value = "";
});

// ---- ADA価格(CoinGecko simple/price・無料/キー不要/CORS可) + 保有総額計算 ----
const ADA_PRICE_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=jpy,usd";
const priceEl = document.getElementById("ada-price");
const amountEl = document.getElementById("ada-amount");
const totalEl = document.getElementById("ada-total");
let adaPrice = null;

function formatJpy(n) {
  return "¥" + Math.round(n).toLocaleString();
}

function formatUsd(n) {
  return "$" + (n >= 100 ? Math.round(n).toLocaleString() : n.toFixed(2));
}

function updateAdaTotal() {
  if (!adaPrice) return;
  const amount = parseFloat(amountEl.value);
  if (!isFinite(amount) || amount <= 0) {
    totalEl.textContent = "= ¥–";
    return;
  }
  totalEl.textContent =
    "= " + formatJpy(amount * adaPrice.jpy) + " (" + formatUsd(amount * adaPrice.usd) + ")";
}

fetch(ADA_PRICE_URL)
  .then((r) => (r.ok ? r.json() : null))
  .then((data) => {
    const p = data && data.cardano;
    if (!p || typeof p.jpy !== "number" || typeof p.usd !== "number") {
      throw new Error("bad price data");
    }
    adaPrice = p;
    priceEl.textContent =
      "ADA ¥" +
      p.jpy.toLocaleString(undefined, { maximumFractionDigits: 2 }) +
      " / $" +
      p.usd.toFixed(4);
    updateAdaTotal();
  })
  .catch(() => {
    priceEl.textContent = "ADA 価格取得不可";
  });

amountEl.addEventListener("input", updateAdaTotal);

// ---- 価格チャート(CoinGecko market_chart・無料/キー不要/CORS可) ----
const chartBtn = document.getElementById("chart-btn");
const chartPanel = document.getElementById("chart-panel");
const chartBox = document.getElementById("chart-box");
const chartMeta = document.getElementById("chart-meta");
const chartCache = {};
let chartDays = "30";

async function fetchChartPrices(days) {
  if (chartCache[days]) return chartCache[days];
  if (days === "max") {
    // CoinGecko無料枠は過去365日まで。全期間はBinanceの週足(2018年〜・USDT建て)を使う
    const res = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=ADAUSDT&interval=1w&limit=1000"
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data) || data.length < 2) return null;
    chartCache[days] = {
      prices: data.map((k) => [k[0], parseFloat(k[4])]),
      currency: "usd",
      note: "2018年〜・米ドル建て(Binance週足)",
    };
    return chartCache[days];
  }
  const res = await fetch(
    "https://api.coingecko.com/api/v3/coins/cardano/market_chart?vs_currency=jpy&days=" + days
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (!data || !Array.isArray(data.prices) || data.prices.length < 2) return null;
  chartCache[days] = { prices: data.prices, currency: "jpy", note: null };
  return chartCache[days];
}

function fmtJpyPrice(v) {
  return "¥" + v.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function fmtUsdPrice(v) {
  return "$" + (v < 1 ? v.toFixed(4) : v.toFixed(2));
}

function renderChart(entry) {
  const prices = entry.prices;
  const fmt = entry.currency === "usd" ? fmtUsdPrice : fmtJpyPrice;
  const W = 560;
  const H = 150;
  const PAD = 6;
  const vals = prices.map((p) => p[1]);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const span = max - min || 1;
  const pts = prices.map((p, i) => {
    const x = PAD + (i / (prices.length - 1)) * (W - PAD * 2);
    const y = PAD + (1 - (p[1] - min) / span) * (H - PAD * 2);
    return x.toFixed(1) + "," + y.toFixed(1);
  });
  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("preserveAspectRatio", "none");
  const area = document.createElementNS(svgNS, "polygon");
  area.setAttribute(
    "points",
    PAD + "," + (H - PAD) + " " + pts.join(" ") + " " + (W - PAD) + "," + (H - PAD)
  );
  area.setAttribute("class", "chart-area");
  const line = document.createElementNS(svgNS, "polyline");
  line.setAttribute("points", pts.join(" "));
  line.setAttribute("class", "chart-line");
  svg.appendChild(area);
  svg.appendChild(line);
  chartBox.replaceChildren(svg);

  const first = vals[0];
  const last = vals[vals.length - 1];
  const chg = ((last - first) / first) * 100;
  chartMeta.replaceChildren();
  const parts = [
    ["現在", fmt(last)],
    ["高値", fmt(max)],
    ["安値", fmt(min)],
  ];
  parts.forEach(([label, value]) => {
    const span2 = document.createElement("span");
    span2.textContent = label + " " + value;
    chartMeta.appendChild(span2);
  });
  const chgSpan = document.createElement("span");
  chgSpan.className = chg >= 0 ? "chg-up" : "chg-down";
  chgSpan.textContent = "期間 " + (chg >= 0 ? "+" : "") + chg.toFixed(1) + "%";
  chartMeta.appendChild(chgSpan);
  if (entry.note) {
    const noteSpan = document.createElement("span");
    noteSpan.textContent = entry.note;
    chartMeta.appendChild(noteSpan);
  }
}

async function showChart(days) {
  chartDays = days;
  document.querySelectorAll(".chart-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.days === days);
  });
  chartBox.textContent = "読み込み中…";
  const entry = await fetchChartPrices(days);
  if (days !== chartDays) return; // タブが先に切り替わっていたら破棄
  if (!entry) {
    chartBox.textContent = "チャートを取得できませんでした";
    chartMeta.replaceChildren();
    return;
  }
  renderChart(entry);
}

const chartBackdrop = document.getElementById("chart-backdrop");
const chartClose = document.getElementById("chart-close");

function openChartPanel() {
  chartPanel.hidden = false;
  chartBackdrop.hidden = false;
  chartBtn.textContent = "チャート ▴";
  showChart(chartDays);
}

function closeChartPanel() {
  chartPanel.hidden = true;
  chartBackdrop.hidden = true;
  chartBtn.textContent = "チャート ▾";
}

chartBtn.addEventListener("click", () => {
  if (chartPanel.hidden) openChartPanel();
  else closeChartPanel();
});
chartClose.addEventListener("click", closeChartPanel);
chartBackdrop.addEventListener("click", closeChartPanel);

document.querySelectorAll(".chart-tab").forEach((b) => {
  b.addEventListener("click", () => showChart(b.dataset.days));
});

// ---- ライト/ダーク手動切替(未設定時はOS設定に従う) ----
const themeBtn = document.getElementById("theme-btn");

function isEffectiveDark() {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return true;
  if (attr === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function updateThemeIcon() {
  themeBtn.textContent = isEffectiveDark() ? "☀️" : "🌙";
}

try {
  const saved = localStorage.getItem("wc_theme");
  if (saved === "dark" || saved === "light") {
    document.documentElement.setAttribute("data-theme", saved);
  }
} catch (e) {}
updateThemeIcon();

themeBtn.addEventListener("click", () => {
  const next = isEffectiveDark() ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("wc_theme", next);
  } catch (e) {}
  updateThemeIcon();
});

// ---- 起動画面のゲームアイコン: タップでそのゲームのノードへ ----
document.querySelectorAll(".game-app").forEach((btn) => {
  btn.addEventListener("click", () => {
    const nodeId = btn.dataset.node;
    if (!nodes[nodeId]) return;
    const nameEl = btn.querySelector(".app-name");
    appendBubble("🎮 " + (nameEl ? nameEl.textContent : "ゲーム"), "user");
    state.history.push(state.currentNodeId);
    renderNode(nodeId);
  });
});

renderNode(HOME_NODE_ID);
