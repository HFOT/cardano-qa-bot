import walletContent from "./content/wallet.js";
import spoContent from "./content/spo.js";
import drepContent from "./content/drep.js";

const HOME_NODE_ID = "home";

const HOME_NODE = {
  type: "choice",
  text: "こんにちは。Cardano Q&Aボットです。何について知りたいですか?",
  options: [
    { label: "ウォレット操作について", next: "wallet-root" },
    { label: "SPO(プール)選びについて", next: "spo-root" },
    { label: "DRep選びについて", next: "drep-root" },
  ],
};

function mergeNodes() {
  return Object.assign(
    { [HOME_NODE_ID]: HOME_NODE },
    walletContent.nodes,
    spoContent.nodes,
    drepContent.nodes
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

function appendBubble(text, sender) {
  const bubble = document.createElement("div");
  bubble.className = "bubble " + sender;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
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
        const good = pools.filter((p) => typeof p.score === "number" && p.score >= 85);
        if (good.length === 0) throw new Error("no qualifying pools");
        const picked = pickRandomN(good, 5);
        const lines = picked.map((p, i) => {
          const ticker = p.ticker || "(Ticker未設定)";
          const grade = p.score >= 95 ? "S" : "A";
          const marginPct = Math.round(p.margin * 1000) / 10;
          const stakeText = Math.round(p.stake).toLocaleString();
          return `${i + 1}. [${ticker}] ${grade}(${p.score}点) / ステーク${stakeText}₳ / 委任者${p.delegators}人 / 手数料${marginPct}%+${p.fixedAda}₳`;
        });
        appendBubble(
          "健全性ランキング(hfot.github.io/cardano-relay-health)からS・Aグレードのプールを5件ランダムに紹介します:\n\n" +
            lines.join("\n"),
          "bot"
        );
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      })
      .catch(() => {
        if (seq !== recommendSeq || state.currentNodeId !== nodeId) return;
        appendBubble(node.errorText, "bot");
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      });
    return;
  }
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

async function fetchRelayHealthPools() {
  const res = await fetch(RELAY_HEALTH_URL);
  const html = await res.text();
  const marker = "const data=";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;
  const arrStart = markerIdx + marker.length;
  const jsonText = extractBalancedJson(html, arrStart, "[", "]");
  if (!jsonText) return null;
  return JSON.parse(jsonText);
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

renderNode(HOME_NODE_ID);
