// デプロイのたびに index.html の ?v= と合わせて番号を上げる(キャッシュの新旧混在防止)
import walletContent from "./content/wallet.js?v=25";
import spoContent from "./content/spo.js?v=25";
import drepContent from "./content/drep.js?v=25";
import scamContent from "./content/scam.js?v=25";
import valueContent from "./content/value.js?v=25";
import midnightContent from "./content/midnight.js?v=25";
import gameContent from "./content/game.js?v=25";

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

// ---- 🎰 スロットマシン ----
// getCandidates: () => Promise<array|null>
// reelText: (item) => リールに流す短い文字列
// buildResult: (item) => 当選表示のDOM
function buildSlotMachine(getCandidates, reelText, buildResult, errorText) {
  const box = document.createElement("div");
  box.className = "slot-machine";
  const windowEl = document.createElement("div");
  windowEl.className = "slot-window";
  windowEl.textContent = "— READY —";
  const spinBtn = document.createElement("button");
  spinBtn.type = "button";
  spinBtn.className = "slot-spin-btn";
  spinBtn.textContent = "🎰 回す!";
  const resultEl = document.createElement("div");
  resultEl.className = "slot-result";
  const noteEl = document.createElement("div");
  noteEl.className = "slot-note";
  noteEl.textContent = "※遊びです。委任の推奨ではありません。";
  box.appendChild(windowEl);
  box.appendChild(spinBtn);
  box.appendChild(resultEl);
  box.appendChild(noteEl);

  let spinning = false;
  spinBtn.addEventListener("click", async () => {
    if (spinning) return;
    spinning = true;
    spinBtn.disabled = true;
    windowEl.classList.remove("slot-win");
    resultEl.replaceChildren();
    const candidates = await getCandidates();
    if (!candidates || candidates.length === 0) {
      windowEl.textContent = "— ERROR —";
      resultEl.textContent = errorText;
      spinning = false;
      spinBtn.disabled = false;
      return;
    }
    const winner = candidates[Math.floor(Math.random() * candidates.length)];
    // リール演出: 速く回り、だんだん減速して当選で止まる
    let delay = 55;
    const startedAt = performance.now();
    const DURATION = 2300;
    function tick() {
      const elapsed = performance.now() - startedAt;
      if (elapsed >= DURATION) {
        windowEl.textContent = reelText(winner);
        windowEl.classList.add("slot-win");
        resultEl.replaceChildren(buildResult(winner));
        spinning = false;
        spinBtn.disabled = false;
        spinBtn.textContent = "🎰 もう一回!";
        return;
      }
      const random = candidates[Math.floor(Math.random() * candidates.length)];
      windowEl.textContent = reelText(random);
      delay = 55 + (elapsed / DURATION) * (elapsed / DURATION) * 320;
      setTimeout(tick, delay);
    }
    tick();
  });
  return box;
}

// ---- ⚔️ SPOカードバトル(トップトランプ方式・3ラウンド) ----
const BATTLE_STATS = [
  { key: "score", label: "健全性", fmt: (v) => v + "点", higherWins: true },
  { key: "stake", label: "ステーク", fmt: (v) => Math.round(v / 1000).toLocaleString() + "k₳", higherWins: true },
  { key: "delegators", label: "委任者", fmt: (v) => v + "人", higherWins: true },
  { key: "margin", label: "手数料(低が勝ち)", fmt: (v) => Math.round(v * 1000) / 10 + "%", higherWins: false },
  { key: "rtt", label: "応答速度(低が勝ち)", fmt: (v) => Math.round(v) + "ms", higherWins: false },
];

function buildBattleCard(pool, { faceDown, onPickStat }) {
  const card = document.createElement("div");
  card.className = "battle-card" + (faceDown ? " face-down" : "");
  const name = document.createElement("div");
  name.className = "battle-card-name";
  name.textContent = faceDown ? "???" : "[" + pool.ticker + "]";
  card.appendChild(name);
  BATTLE_STATS.forEach((stat, idx) => {
    const row = document.createElement(onPickStat ? "button" : "div");
    if (onPickStat) {
      row.type = "button";
      row.addEventListener("click", () => onPickStat(idx));
    }
    row.className = "battle-stat";
    row.dataset.statIdx = String(idx);
    const lb = document.createElement("span");
    lb.className = "battle-stat-label";
    lb.textContent = stat.label;
    const val = document.createElement("span");
    val.className = "battle-stat-value";
    val.textContent = faceDown ? "?" : stat.fmt(pool[stat.key]);
    row.appendChild(lb);
    row.appendChild(val);
    card.appendChild(row);
  });
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
    const machine = buildSlotMachine(
      async () => {
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
      (p) => "[" + p.ticker + "]",
      (p) => {
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
      node.errorText
    );
    appendBubble("🎰 **SPOスロット**! S・Aグレードのプールだけが入ったリールです。回してみてください:", "bot");
    appendBubble(machine, "bot");
    clearOptions();
    renderNavButtons({ showBack: state.history.length > 0, showHome: true });
    return;
  }

  if (node.type === "slot-drep") {
    const machine = buildSlotMachine(
      async () => fetchDrepTarget15Candidates(),
      (d) => d.name || d.id.slice(0, 16) + "…",
      (d) => {
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
      node.errorText
    );
    appendBubble("🎰 **DRepスロット**! 投票力1.5%未満(Target 15)のDRepだけが入ったリールです。回してみてください:", "bot");
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

chartBtn.addEventListener("click", () => {
  const opening = chartPanel.hidden;
  chartPanel.hidden = !opening;
  chartBtn.textContent = opening ? "チャート ▴" : "チャート ▾";
  if (opening) showChart(chartDays);
});

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
