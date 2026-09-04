// デプロイのたびに index.html の ?v= と合わせて番号を上げる(キャッシュの新旧混在防止)
import walletContent from "./content/wallet.js?v=13";
import spoContent from "./content/spo.js?v=13";
import drepContent from "./content/drep.js?v=13";
import scamContent from "./content/scam.js?v=13";

const HOME_NODE_ID = "home";

const HOME_NODE = {
  type: "choice",
  text: "こんにちは。何について知りたいですか?",
  options: [
    { label: "ウォレット操作について", next: "wallet-root" },
    { label: "SPO(プール)選びについて", next: "spo-root" },
    { label: "DRep選びについて", next: "drep-root" },
    { label: "詐欺の手口を知る", next: "scam-root" },
  ],
};

function mergeNodes() {
  return Object.assign(
    { [HOME_NODE_ID]: HOME_NODE },
    walletContent.nodes,
    spoContent.nodes,
    drepContent.nodes,
    scamContent.nodes
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
  state.history = [];
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

  appendBubble("うまく聞き取れませんでした。下の選択肢から選んでください。", "bot");
  const fallbackNode = nodes[state.currentNodeId];
  if (fallbackNode && fallbackNode.type === "choice") {
    renderNode(state.currentNodeId);
  } else {
    goHome();
  }
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

renderNode(HOME_NODE_ID);
