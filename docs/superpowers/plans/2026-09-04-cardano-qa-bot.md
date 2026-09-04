# Cardano Q&A ボット Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cardano初心者向けに、ウォレット操作・SPO(プール)選び・DRep選びの3トピックをボタン選択+自由文入力で辿れる、完全静的な決定木チャットボットを構築する。

**Architecture:** バックエンドなし・外部API呼び出しなしの完全静的サイト(HTML/CSS/素のJS、ESモジュール)。会話内容は`content/*.js`の決定木データとして持ち、`app.js`のチャットエンジンがそれを解釈してチャットバブルUIとして描画する。自由文入力は辞書ベースのキーワードマッチングで決定木ノードにルーティングする(AI API不使用)。

**Tech Stack:** 素のHTML/CSS/JavaScript(ESモジュール)。ビルドツール・フレームワーク・パッケージマネージャ不要。ローカル動作確認にはESモジュールのCORS制約を避けるため簡易HTTPサーバー(`npx serve` または `python -m http.server`)を使う。

## Global Constraints

- AI API・LLM連携は一切使わない(仕様書「スコープ外」より)。
- 自由文入力のマッチングは辞書ベースのキーワード一致のみ。当て推量やAI的な自由応答は行わない。
- 自由文がキーワードに1件もヒットしない場合は「うまく聞き取れませんでした。下の選択肢から選んでください」と表示し、選択肢ボタンに誘導する(仕様書より/ユーザー確定事項)。
- バックエンドなし、外部通信なし。完全にブラウザ内で完結する。
- 対象ユーザーはCardano初心者。専門用語を前提にせず、初めて触る人が読める粒度で回答文を書く(仕様書「スコープ」より)。
- **自動テストは設けない**(仕様書「テスト方針」より、ユーザー確定事項)。各タスクの検証はローカルサーバーを立てブラウザで手動確認する。この方針は`superpowers:writing-plans`のデフォルトであるTDD手順から意図的に外れている — 仕様書で明示的に承認された決定のため。

参照仕様書: `docs/superpowers/specs/2026-09-04-cardano-qa-bot-design.md`

---

## File Structure

```
cardano-qa-bot/
├── index.html          # チャットUIのDOM骨格
├── styles.css          # チャットバブル・ボタンのスタイル
├── app.js              # チャットエンジン(状態管理・描画・ナビゲーション・キーワードマッチング)
├── content/
│   ├── wallet.js        # ウォレット操作トピックの決定木データ
│   ├── spo.js           # SPO選びトピックの決定木データ
│   └── drep.js          # DRep選びトピックの決定木データ
└── README.md            # 起動方法・デプロイ方法・コンテンツ追加方法
```

## データ構造(全タスク共通の契約)

各`content/*.js`は次の形を`default export`する:

```js
export default {
  nodes: {
    "node-id": { /* ノード定義 */ },
    // ...
  },
};
```

ノードは3種類のいずれか:

```js
// choice: 質問 + 選択肢ボタン
{ type: "choice", text: "質問文", options: [{ label: "表示文言", next: "node-id" }, ...] }

// message: 一言添えるだけの中継ノード(表示後、自動でnextへ進む)
{ type: "message", text: "一言", next: "node-id" }

// answer: 最終回答(終端)。label は候補一覧表示用の短い見出し
{ type: "answer", label: "短い見出し", text: "回答本文", keywords: ["語1", "語2", ...] }
```

トピックのルートノードのidは `<topic>-root` の命名規則に統一する(例: `wallet-root`)。

---

### Task 1: プロジェクト雛形

**Files:**
- Create: `index.html`
- Create: `styles.css`
- Create: `app.js`

**Interfaces:**
- Produces: `index.html`が`#chat-log`(チャット履歴表示)、`#chat-options`(選択肢ボタン表示)、`#free-text-form`+`#free-text-input`(自由文入力フォーム)、`#home-btn`(トップに戻るボタン)のDOM要素IDを提供する。以降の全タスクはこのID群を前提にする。

- [ ] **Step 1: `index.html`を作成する**

```html
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Cardano Q&Aボット</title>
<link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="chat-app">
    <header id="chat-header">
      <h1>Cardano Q&amp;Aボット</h1>
      <button id="home-btn" type="button">トップに戻る</button>
    </header>
    <div id="chat-log" role="log" aria-live="polite"></div>
    <div id="chat-options"></div>
    <form id="free-text-form">
      <input id="free-text-input" type="text" placeholder="気になることを入力(例: 手数料、シードフレーズ)" autocomplete="off">
      <button type="submit">送信</button>
    </form>
  </div>
  <script type="module" src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: `styles.css`を作成する**

```css
:root {
  --bg: #0f1117;
  --panel: #171a23;
  --bot-bubble: #232733;
  --user-bubble: #2f6fed;
  --text: #e8eaf0;
  --muted: #9aa1b1;
  --accent: #2f6fed;
  --border: #2a2e3a;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif;
  background: var(--bg);
  color: var(--text);
  display: flex;
  justify-content: center;
  min-height: 100vh;
}

#chat-app {
  width: 100%;
  max-width: 640px;
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

#chat-header h1 {
  font-size: 16px;
  margin: 0;
}

#home-btn {
  background: transparent;
  border: 1px solid #3a3f4d;
  color: var(--muted);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
}

#chat-log {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 14px;
  line-height: 1.5;
  font-size: 14px;
  white-space: pre-wrap;
}

.bubble.bot {
  align-self: flex-start;
  background: var(--bot-bubble);
  border-bottom-left-radius: 4px;
}

.bubble.user {
  align-self: flex-end;
  background: var(--user-bubble);
  color: white;
  border-bottom-right-radius: 4px;
}

#chat-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 16px 12px;
}

.option-btn {
  background: var(--panel);
  border: 1px solid #3a3f4d;
  color: var(--text);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.option-btn:hover {
  border-color: var(--accent);
}

.nav-buttons {
  display: flex;
  gap: 8px;
  width: 100%;
  margin-top: 4px;
}

.nav-btn {
  background: transparent;
  border: 1px dashed #3a3f4d;
  color: var(--muted);
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 12px;
}

#free-text-form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid var(--border);
}

#free-text-input {
  flex: 1;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #3a3f4d;
  background: var(--panel);
  color: var(--text);
  font-size: 14px;
}

#free-text-form button[type="submit"] {
  background: var(--accent);
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}
```

- [ ] **Step 3: `app.js`を仮の動作確認用コードで作成する**

```js
console.log("Cardano Q&A bot loaded");
document.getElementById("chat-log").textContent = "読み込み確認OK";
```

- [ ] **Step 4: ローカルサーバーを起動して手動確認する**

Run: `npx serve .`  (または `python -m http.server 8000`)

ブラウザで表示されたURL(例: `http://localhost:3000`)を開き、以下を確認する:
- ページタイトルが「Cardano Q&Aボット」になっている
- ヘッダーに「トップに戻る」ボタンが表示されている
- チャット欄に「読み込み確認OK」と表示されている
- 下部に自由文入力欄と送信ボタンが表示されている
- ブラウザのコンソールに `Cardano Q&A bot loaded` と出力されている(エラーが出ていないこと)

- [ ] **Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "scaffold: chat UI skeleton"
```

---

### Task 2: 決定木エンジンのコア実装 + ウォレット操作トピック

**Files:**
- Create: `content/wallet.js`
- Modify: `app.js`(Task 1の仮コードを置き換える)

**Interfaces:**
- Consumes: Task 1で作成した`#chat-log` `#chat-options` `#free-text-form` `#free-text-input` `#home-btn`
- Produces: `content/wallet.js`は`{ nodes: {...} }`をdefault exportする(上記データ構造の契約)。`app.js`は`renderNode(nodeId, opts)`・`goBack()`・`goHome()`という内部関数を持ち、以降のタスクはこれらを変更せず`nodes`のマージ元とHOME_NODEの選択肢だけを拡張する。

- [ ] **Step 1: `content/wallet.js`を作成する**

```js
export default {
  nodes: {
    "wallet-root": {
      type: "choice",
      text: "ウォレットについて、何を知りたいですか?",
      options: [
        { label: "ウォレットの選び方", next: "wallet-choose" },
        { label: "基本操作(送金・受取)", next: "wallet-basic" },
        { label: "シードフレーズ・セキュリティ", next: "wallet-security" },
        { label: "ステーキング(デレゲート)の始め方", next: "wallet-staking" },
      ],
    },

    "wallet-choose": {
      type: "choice",
      text: "ウォレット選びで気になるのは?",
      options: [
        { label: "どのウォレットがいいの?", next: "wallet-choose-which" },
        { label: "ライトウォレットとフルノードの違い", next: "wallet-choose-lightnode" },
        { label: "ハードウェアウォレットは必要?", next: "wallet-choose-hw" },
      ],
    },
    "wallet-choose-which": {
      type: "answer",
      label: "どのウォレットがいいの?",
      text: "初心者にはEternl、Nami、Yoroiなどのブラウザ拡張型(ライトウォレット)が扱いやすいです。スマホならEternlやYoroiのモバイル版もあります。どれもADAの送受金・ステーキング・DRep委任に対応しています。まずは1つ選んで少額のADAで操作に慣れるのがおすすめです。",
      keywords: ["ウォレット選び", "Eternl", "Nami", "Yoroi", "Daedalus", "どのウォレット"],
    },
    "wallet-choose-lightnode": {
      type: "answer",
      label: "ライトウォレットとフルノードの違い",
      text: "Daedalusはブロックチェーン全体を自分の端末にダウンロードする「フルノード」型で、起動や同期に時間がかかりますが、より自立した検証ができます。Eternl・Nami・Yoroiなどは外部のサーバーに問い合わせる「ライトウォレット」型で、インストール後すぐ使えて動作も軽いです。初心者には基本的にライトウォレットで十分です。",
      keywords: ["フルノード", "ライトウォレット", "Daedalus", "違い"],
    },
    "wallet-choose-hw": {
      type: "answer",
      label: "ハードウェアウォレットは必要?",
      text: "少額のADAを試す段階では必須ではありません。ただし、まとまった金額を長期保有する場合はLedgerやTrezorなどのハードウェアウォレットと連携すると、秘密鍵がネットに繋がらない機器の中で管理されるため安全性が大きく上がります。EternlやYoroiはハードウェアウォレット連携に対応しています。",
      keywords: ["ハードウェアウォレット", "Ledger", "Trezor"],
    },

    "wallet-basic": {
      type: "choice",
      text: "基本操作で気になるのは?",
      options: [
        { label: "ADAの受け取り方", next: "wallet-basic-receive" },
        { label: "ADAの送金方法・手数料", next: "wallet-basic-send" },
        { label: "送金が反映されない時", next: "wallet-basic-pending" },
        { label: "複数アドレスの使い方", next: "wallet-basic-multiaddress" },
      ],
    },
    "wallet-basic-receive": {
      type: "answer",
      label: "ADAの受け取り方",
      text: "ウォレットの「受け取る(Receive)」画面を開くと、自分のADA用アドレスとQRコードが表示されます。このアドレスを送り主に伝える(またはQRコードを読み取ってもらう)だけでADAを受け取れます。アドレスは公開して問題ありませんが、シードフレーズは絶対に教えないでください。",
      keywords: ["受け取り方", "入金", "アドレス", "QRコード"],
    },
    "wallet-basic-send": {
      type: "answer",
      label: "ADAの送金方法・手数料",
      text: "「送る(Send)」画面で、送り先アドレスと金額を入力して送金します。送金には小額のネットワーク手数料(トランザクション手数料)がかかり、金額はウォレットが自動計算して送金前に表示してくれます。送り先アドレスは1文字でも間違えると届かないので、コピー&ペーストかQRコード読み取りを使い、手入力は避けましょう。",
      keywords: ["送金", "手数料", "送る", "トランザクション手数料"],
    },
    "wallet-basic-pending": {
      type: "answer",
      label: "送金が反映されない時",
      text: "Cardanoの送金は通常数分で反映されますが、ネットワークが混雑していると少し時間がかかることがあります。まずはCardanoScanなどのブロックエクスプローラーでトランザクションIDを検索し、承認(confirm)されているか確認してください。承認済みなのにウォレット上の残高が変わらない場合は、ウォレットの同期・再起動を試してみましょう。",
      keywords: ["反映されない", "送金 遅い", "CardanoScan", "同期"],
    },
    "wallet-basic-multiaddress": {
      type: "answer",
      label: "複数アドレスの使い方",
      text: "Cardanoのウォレットは1つのシードフレーズから複数の受け取りアドレスを生成できます。相手ごとに違うアドレスを使うことでプライバシーを高められますが、残高やステーキングはウォレット単位(シードフレーズ単位)でまとめて管理されるので、どのアドレスにADAが届いても合計残高に反映されます。難しく考えず、基本は表示された最初のアドレスを使えば十分です。",
      keywords: ["複数アドレス", "アドレス 使い分け"],
    },

    "wallet-security": {
      type: "choice",
      text: "セキュリティについて気になるのは?",
      options: [
        { label: "シードフレーズって何?なぜ大事?", next: "wallet-security-seed" },
        { label: "シードフレーズの安全な保管方法", next: "wallet-security-storage" },
        { label: "詐欺・フィッシングの見分け方", next: "wallet-security-phishing" },
        { label: "パスワードを忘れた/端末を無くした", next: "wallet-security-recovery" },
      ],
    },
    "wallet-security-seed": {
      type: "answer",
      label: "シードフレーズって何?なぜ大事?",
      text: "シードフレーズ(リカバリーフレーズ)は、あなたのウォレットの中身すべてを復元できる15〜24個の英単語です。これさえあれば誰でもあなたのADAを操作できてしまうため、パスワード以上に厳重に扱う必要があります。ウォレット作成時に一度だけ表示されるので、必ずその場で控えてください。",
      keywords: ["シードフレーズ", "リカバリーフレーズ", "シード"],
    },
    "wallet-security-storage": {
      type: "answer",
      label: "シードフレーズの安全な保管方法",
      text: "紙に手書きして、金庫や信頼できる場所など複数の物理的な場所に分けて保管するのが基本です。スマホのメモ、スクリーンショット、クラウドストレージ、メールなど「ネットに繋がる場所」には絶対に保存しないでください。写真として撮影するのも避けましょう。",
      keywords: ["シードフレーズ 保管", "バックアップ"],
    },
    "wallet-security-phishing": {
      type: "answer",
      label: "詐欺・フィッシングの見分け方",
      text: "公式サイトのURLを毎回確認し、SNSやDMで送られてきたリンクは開かないようにしましょう。「シードフレーズを入力してください」と求めてくるサイトやサポート窓口は100%詐欺です。公式のウォレットやガバナンスツール(GovToolなど)がシードフレーズの入力を求めることはありません。",
      keywords: ["詐欺", "フィッシング", "偽サイト"],
    },
    "wallet-security-recovery": {
      type: "answer",
      label: "パスワードを忘れた/端末を無くした",
      text: "ウォレットのログインパスワードを忘れても、シードフレーズさえあれば新しい端末に同じウォレットを復元できます。逆にシードフレーズを無くしてしまうと、パスワードが分かっていても復元・サポートによる救済は一切できません。だからこそシードフレーズの保管がウォレット管理の最重要ポイントです。",
      keywords: ["パスワード 忘れた", "端末 紛失", "復元"],
    },

    "wallet-staking": {
      type: "choice",
      text: "ステーキングについて気になるのは?",
      options: [
        { label: "ステーキングって何?なぜやるべき?", next: "wallet-staking-what" },
        { label: "デレゲートの手順", next: "wallet-staking-howto" },
        { label: "デレゲートしたADAは引き出せる?", next: "wallet-staking-locked" },
        { label: "報酬はいつ・どうやってもらえる?", next: "wallet-staking-rewards" },
      ],
    },
    "wallet-staking-what": {
      type: "answer",
      label: "ステーキングって何?なぜやるべき?",
      text: "ステーキングは、保有しているADAをステークプールに預ける(委任する)ことで、ネットワークの運営に参加し、報酬を受け取れる仕組みです。ADAは自分のウォレットに入ったまま動かせるので、預けたら引き出せなくなるわけではありません。持っているだけなら委任しない理由がないくらい、基本的な機能です。",
      keywords: ["ステーキングとは", "委任とは", "なぜステーキング"],
    },
    "wallet-staking-howto": {
      type: "answer",
      label: "デレゲートの手順",
      text: "ウォレットの「Staking」タブから、委任したいプールを選んで「Delegate」を実行するだけです。実行時に小さなネットワーク手数料がかかります。委任は1〜2エポック(数日)後に有効になり、それ以降エポックごとに報酬が計算されるようになります。",
      keywords: ["デレゲート 手順", "委任のやり方", "Delegate"],
    },
    "wallet-staking-locked": {
      type: "answer",
      label: "デレゲートしたADAは引き出せる?",
      text: "デレゲートしても、ADAはロックされず自分のウォレットの中で自由に送金・使用できます。ステーキングは「預ける」というより「投票権を貸す」ようなイメージで、いつでもプールの変更や委任解除ができます。",
      keywords: ["ロックされる", "引き出せる", "デレゲート 解除"],
    },
    "wallet-staking-rewards": {
      type: "answer",
      label: "報酬はいつ・どうやってもらえる?",
      text: "Cardanoの報酬は約5日周期の「エポック」ごとに計算され、委任してから2〜3エポック(1〜2週間程度)後に初回の報酬が届き始めます。報酬は自動でウォレット残高に加算されるので、請求などの操作は不要です。",
      keywords: ["報酬 いつ", "エポック", "ステーキング報酬"],
    },
  },
};
```

- [ ] **Step 2: `app.js`をTask 1の仮コードから置き換え、決定木エンジンを実装する**

```js
import walletContent from "./content/wallet.js";

const HOME_NODE_ID = "home";

const HOME_NODE = {
  type: "choice",
  text: "こんにちは。Cardano Q&Aボットです。何について知りたいですか?",
  options: [
    { label: "ウォレット操作について", next: "wallet-root" },
  ],
};

function mergeNodes() {
  return Object.assign({ [HOME_NODE_ID]: HOME_NODE }, walletContent.nodes);
}

const nodes = mergeNodes();

const state = {
  currentNodeId: HOME_NODE_ID,
  history: [],
};

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

freeTextForm.addEventListener("submit", (e) => {
  e.preventDefault();
});

renderNode(HOME_NODE_ID);
```

- [ ] **Step 3: ローカルサーバーで手動確認する**

Run: `npx serve .` を起動し直し(またはブラウザをリロード)、以下を確認する:
- トップ画面で「ウォレット操作について」の1択が表示される
- クリックすると4つの選択肢(選び方/基本操作/セキュリティ/ステーキング)が表示される
- 「ウォレットの選び方」→「どのウォレットがいいの?」まで進み、回答文が表示され、「前の質問に戻る」「トップに戻る」ボタンが出ることを確認する
- 「前の質問に戻る」を押すと1つ前の選択肢画面に戻ることを確認する
- 「トップに戻る」を押すとトップ画面に戻ることを確認する
- ウォレット配下の全15回答ノード(下記チェックリスト)を一通りクリックし、回答文が表示されることを確認する:
  - どのウォレットがいいの? / ライトウォレットとフルノードの違い / ハードウェアウォレットは必要?
  - ADAの受け取り方 / ADAの送金方法・手数料 / 送金が反映されない時 / 複数アドレスの使い方
  - シードフレーズって何? / シードフレーズの保管方法 / 詐欺・フィッシングの見分け方 / パスワードを忘れた場合
  - ステーキングって何? / デレゲートの手順 / デレゲートしたADAは引き出せる? / 報酬はいつもらえる?
- ブラウザコンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js content/wallet.js
git commit -m "feat: decision-tree engine + wallet topic content"
```

---

### Task 3: SPO(プール)選びトピックの追加

**Files:**
- Create: `content/spo.js`
- Modify: `app.js`(import追加・merge対象追加・HOME_NODEの選択肢追加)

**Interfaces:**
- Consumes: Task 2の`mergeNodes()`・`HOME_NODE.options`・データ構造の契約
- Produces: `content/spo.js`は`{ nodes: {...} }`をdefault exportする(SPOトピックの13回答ノード)

- [ ] **Step 1: `content/spo.js`を作成する**

```js
export default {
  nodes: {
    "spo-root": {
      type: "choice",
      text: "プール(SPO)選びについて、何が気になりますか?",
      options: [
        { label: "そもそもSPO・プールって何?", next: "spo-basics" },
        { label: "手数料・報酬まわり", next: "spo-fees" },
        { label: "信頼できるプールの見分け方", next: "spo-trust" },
        { label: "プールを選んだ後のこと", next: "spo-after" },
      ],
    },

    "spo-basics": {
      type: "choice",
      text: "基本的な仕組みについて気になるのは?",
      options: [
        { label: "SPOとステーキングの関係は?", next: "spo-basics-what" },
        { label: "プールはどこで探せる?", next: "spo-basics-where" },
      ],
    },
    "spo-basics-what": {
      type: "answer",
      label: "SPOとステーキングの関係は?",
      text: "SPO(Stake Pool Operator)は、ブロック生成用のサーバーを運営している人・組織のことです。私たちがADAをプールに委任すると、そのプールの取り分としてブロック生成に参加する権利が増え、生成された報酬が委任者にも分配されます。つまりSPO選びは「誰に運営を任せて報酬を分けてもらうか」を選ぶ作業です。",
      keywords: ["SPOとは", "ステークプールとは", "プールの仕組み"],
    },
    "spo-basics-where": {
      type: "answer",
      label: "プールはどこで探せる?",
      text: "各ウォレットのStaking画面内の検索機能で名前やTickerから探せるほか、pool.pmやadapools.orgといった外部サイトでは手数料・サチュレーション・稼働率などの詳細情報を比較できます。まずはウォレット内の検索で候補を絞り、外部サイトで詳細を確認するのがおすすめです。",
      keywords: ["プール 探し方", "pool.pm", "adapools"],
    },

    "spo-fees": {
      type: "choice",
      text: "手数料・報酬まわりで気になるのは?",
      options: [
        { label: "手数料(margin)って何?目安は?", next: "spo-fees-margin" },
        { label: "固定手数料(fixed cost)って何?", next: "spo-fees-fixed" },
        { label: "ROA(報酬率)は信用していい?", next: "spo-fees-roa" },
      ],
    },
    "spo-fees-margin": {
      type: "answer",
      label: "手数料(margin)って何?目安は?",
      text: "margin(可変手数料)は、そのプールが得た報酬のうち運営者が取る割合です。0%〜数%まで幅がありますが、0%を謳うプールが必ずしも一番お得とは限らず、運営の継続性やサチュレーション状況も合わせて見る必要があります。数字だけで即決せず、他の指標と合わせて判断しましょう。",
      keywords: ["margin", "可変手数料", "手数料 目安"],
    },
    "spo-fees-fixed": {
      type: "answer",
      label: "固定手数料(fixed cost)って何?",
      text: "fixed cost(固定手数料)は、プールがブロックを1つ作るたびに運営者へ先に差し引かれる一定額のADAです。プロトコル全体で下限が決まっており、大きなプールでも小さなプールでも1ブロックあたり同じ額が引かれます。委任額が大きいほど、この固定手数料の影響(割合)は相対的に小さくなります。",
      keywords: ["fixed cost", "固定手数料"],
    },
    "spo-fees-roa": {
      type: "answer",
      label: "ROA(報酬率)は信用していい?",
      text: "ROA(見込み年利)はプール一覧サイトでよく表示されますが、直近の運の良し悪し(ブロックを多く/少なく引けたか)に左右されるため、短期間の数値をそのまま信用しすぎないのがコツです。むしろ稼働率やブロック実績の安定性、手数料構成など複数の指標を合わせて見た方が、長期的な期待値の参考になります。",
      keywords: ["ROA", "報酬率", "年利"],
    },

    "spo-trust": {
      type: "choice",
      text: "信頼できるプールの見分け方で気になるのは?",
      options: [
        { label: "プレッジ(pledge)って何?", next: "spo-trust-pledge" },
        { label: "サチュレーション(saturation)って何?なぜ避ける?", next: "spo-trust-saturation" },
        { label: "稼働率(uptime)・ブロック実績の見方", next: "spo-trust-uptime" },
        { label: "非集中化に貢献するプールの選び方", next: "spo-trust-decentralization" },
        { label: "怪しいプールの見分け方", next: "spo-trust-scam" },
      ],
    },
    "spo-trust-pledge": {
      type: "answer",
      label: "プレッジ(pledge)って何?",
      text: "pledge(プレッジ)は、運営者自身がそのプールに預けている自己資金の額です。プレッジが大きいほど、報酬計算上のボーナスが増える仕組みになっており、「運営者自身も本気で長く続ける意思がある」ことの目安にもなります。極端にプレッジが0に近いプールは、運営継続への本気度を疑う材料の一つになります。",
      keywords: ["pledge", "プレッジ"],
    },
    "spo-trust-saturation": {
      type: "answer",
      label: "サチュレーション(saturation)って何?なぜ避ける?",
      text: "saturation(サチュレーション)は、1つのプールに委任が集まりすぎて報酬効率が頭打ちになる状態です。サチュレーションに近い、または超えたプールに委任すると、本来もらえるはずの報酬が目減りします。プール一覧サイトでは「Saturation◯%」のように表示されるので、大きく超えていないプールを選ぶのが基本です。",
      keywords: ["saturation", "サチュレーション", "飽和"],
    },
    "spo-trust-uptime": {
      type: "answer",
      label: "稼働率(uptime)・ブロック実績の見方",
      text: "稼働率(uptime)は、そのプールのサーバーがどれだけ安定して動き続けているかを示す指標です。稼働率が低いプールは、本来生成できるはずのブロックを取りこぼし、委任者の報酬機会も失われます。プール一覧サイトの過去のブロック生成履歴と合わせて、安定して稼働しているかを確認しましょう。",
      keywords: ["uptime", "稼働率", "ブロック実績"],
    },
    "spo-trust-decentralization": {
      type: "answer",
      label: "非集中化に貢献するプールの選び方",
      text: "Cardanoは特定の大きなプールに委任が集中しすぎないことを大切にしています。すでに委任が非常に多い有名プールよりも、サチュレーションに余裕があり運営実績も安定している中小規模のプールを選ぶことは、ネットワーク全体の非集中化に貢献する選択になります。",
      keywords: ["非集中化", "分散化", "中小プール"],
    },
    "spo-trust-scam": {
      type: "answer",
      label: "怪しいプールの見分け方",
      text: "極端に高いROAだけを強調している、運営者情報や過去の運用実績が一切公開されていない、SNSのDMで特定のプールへの委任を執拗に勧めてくる、といったプールは注意が必要です。プールへの委任はADA自体が奪われる操作ではありませんが、判断材料が乏しいプールへの委任は報酬面で不利益を被る可能性があります。",
      keywords: ["怪しいプール", "詐欺プール"],
    },

    "spo-after": {
      type: "choice",
      text: "プールを選んだ後のことで気になるのは?",
      options: [
        { label: "プールを変更したい時は?", next: "spo-after-switch" },
        { label: "デレゲートしてもすぐ報酬が出ないのはなぜ?", next: "spo-after-epoch" },
        { label: "複数プールに分けるべき?", next: "spo-after-split" },
      ],
    },
    "spo-after-switch": {
      type: "answer",
      label: "プールを変更したい時は?",
      text: "ウォレットのStaking画面から、いつでも別のプールへ委任し直すことができます。変更には小さなネットワーク手数料がかかりますが、ADA自体が失われることはありません。変更後は再び1〜2エポック程度で新しいプールでの計算が反映されます。",
      keywords: ["プール変更", "re-delegate", "委任変更"],
    },
    "spo-after-epoch": {
      type: "answer",
      label: "デレゲートしてもすぐ報酬が出ないのはなぜ?",
      text: "Cardanoの報酬計算は約5日ごとの「エポック」という区切りで行われます。委任した直後のエポックはまだ集計対象に入らず、実際に報酬として反映されるまでには2〜3エポック(1〜2週間程度)かかるのが通常です。焦らず待つのがポイントです。",
      keywords: ["報酬 出ない", "エポック 反映"],
    },
    "spo-after-split": {
      type: "answer",
      label: "複数プールに分けるべき?",
      text: "少額のうちは1つのプールにまとめて問題ありません。委任額が大きくなってきたら、複数の信頼できるプールに分散することでサチュレーションの影響を避けたり、特定の運営者への依存を減らしたりできます。分散は「必須」ではなく「余裕が出てきたら検討する選択肢」と捉えて大丈夫です。",
      keywords: ["複数プール", "分散委任"],
    },
  },
};
```

- [ ] **Step 2: `app.js`を修正する**

`import walletContent from "./content/wallet.js";` の下に追加:

```js
import spoContent from "./content/spo.js";
```

`mergeNodes()`を次のように変更する:

```js
function mergeNodes() {
  return Object.assign(
    { [HOME_NODE_ID]: HOME_NODE },
    walletContent.nodes,
    spoContent.nodes
  );
}
```

`HOME_NODE.options`に追加する(配列の末尾に追記):

```js
    { label: "SPO(プール)選びについて", next: "spo-root" },
```

- [ ] **Step 3: ローカルサーバーで手動確認する**

ブラウザをリロードし、以下を確認する:
- トップ画面に「ウォレット操作について」「SPO(プール)選びについて」の2択が表示される
- SPO配下の全13回答ノード(基本2/手数料3/信頼性5/事後3)を一通りクリックし、回答文が表示されることを確認する
- 「戻る」「トップに戻る」がSPO配下でも正しく動作することを確認する
- コンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js content/spo.js
git commit -m "feat: add SPO selection topic"
```

---

### Task 4: DRep選びトピックの追加

**Files:**
- Create: `content/drep.js`
- Modify: `app.js`(import追加・merge対象追加・HOME_NODEの選択肢追加)

**Interfaces:**
- Consumes: Task 3までの`mergeNodes()`・`HOME_NODE.options`
- Produces: `content/drep.js`は`{ nodes: {...} }`をdefault exportする(DRepトピックの10回答ノード)

- [ ] **Step 1: `content/drep.js`を作成する**

```js
export default {
  nodes: {
    "drep-root": {
      type: "choice",
      text: "DRep選びについて、何が気になりますか?",
      options: [
        { label: "そもそもDRepって何?", next: "drep-basics" },
        { label: "DRepの選び方", next: "drep-choose" },
        { label: "委任のやり方", next: "drep-howto" },
        { label: "その他の選択肢・仕組み", next: "drep-other" },
      ],
    },

    "drep-basics": {
      type: "choice",
      text: "DRepの基本について気になるのは?",
      options: [
        { label: "DRepって何?なぜ必要?", next: "drep-basics-what" },
        { label: "DRepとSPOへの委任は別物?", next: "drep-basics-vs-spo" },
      ],
    },
    "drep-basics-what": {
      type: "answer",
      label: "DRepって何?なぜ必要?",
      text: "DRep(Delegated Representative)は、Cardanoのガバナンス(Voltaire)における投票の代理人です。プロトコルの変更やTreasury(国庫)の使い道など、コミュニティが決める議案に対して、自分の代わりに投票してもらう相手を選ぶ仕組みです。ADA保有者は自分で投票することも、DRepに委任することもできます。",
      keywords: ["DRepとは", "Delegated Representative", "ガバナンス", "Voltaire"],
    },
    "drep-basics-vs-spo": {
      type: "answer",
      label: "DRepとSPOへの委任は別物?",
      text: "はい、まったく別の委任です。SPOへの委任は「ステーキング報酬」のため、DRepへの委任は「ガバナンス投票権」のためのものです。1つのウォレットから両方に別々に委任することができ、片方だけ設定してもう片方は未設定、という状態も可能です。",
      keywords: ["DRep SPO 違い", "2つの委任"],
    },

    "drep-choose": {
      type: "choice",
      text: "DRepの選び方で気になるのは?",
      options: [
        { label: "DRepを選ぶ基準は?", next: "drep-choose-criteria" },
        { label: "投票傾向はどこで見れる?", next: "drep-choose-history" },
      ],
    },
    "drep-choose-criteria": {
      type: "answer",
      label: "DRepを選ぶ基準は?",
      text: "過去の投票実績(実際にどれだけ投票に参加しているか)、投票理由の説明を公開しているか、自分の考え方(例えば開発重視、コミュニティ重視など)と近いか、といった点を基準にするのがおすすめです。有名だからという理由だけで選ばず、投票の中身や説明の透明性を見ることが大切です。",
      keywords: ["DRep 選び方", "DRep 基準"],
    },
    "drep-choose-history": {
      type: "answer",
      label: "投票傾向はどこで見れる?",
      text: "GovTool(Cardanoの公式ガバナンスツール)では、各DRepのプロフィールや過去の投票履歴、投票理由を確認できます。委任前に一度目を通し、自分の考えと近いか確認しておくと安心です。",
      keywords: ["投票傾向", "GovTool", "投票履歴"],
    },

    "drep-howto": {
      type: "choice",
      text: "委任のやり方で気になるのは?",
      options: [
        { label: "DRepへの委任手順は?", next: "drep-howto-delegate" },
        { label: "DRepを変更したい時は?", next: "drep-howto-change" },
        { label: "委任してもADAは動かせなくなる?", next: "drep-howto-locked" },
      ],
    },
    "drep-howto-delegate": {
      type: "answer",
      label: "DRepへの委任手順は?",
      text: "GovToolにウォレットを接続し、委任したいDRepを検索して「Delegate」を実行するのが基本的な流れです。EternlなどウォレットによってはGovToolを経由せず、ウォレット内から直接DRep委任ができるものもあります。実行時には小さなネットワーク手数料がかかります。",
      keywords: ["DRep 委任 手順", "DRep Delegate", "GovTool 使い方"],
    },
    "drep-howto-change": {
      type: "answer",
      label: "DRepを変更したい時は?",
      text: "SPOへの委任と同じように、いつでも別のDRepへ委任し直すことができます。考えが変わったり、選んだDRepの投票傾向が自分と合わないと感じたりした場合は、気軽に変更して大丈夫です。",
      keywords: ["DRep 変更", "DRep 委任先変更"],
    },
    "drep-howto-locked": {
      type: "answer",
      label: "委任してもADAは動かせなくなる?",
      text: "いいえ、DRepへの委任もADAをロックするものではありません。SPOへの委任と同様、ADAは自分のウォレットに入ったまま自由に送金・使用でき、DRep委任は投票権だけを代理してもらう仕組みです。",
      keywords: ["DRep ロック", "DRep 動かせる"],
    },

    "drep-other": {
      type: "choice",
      text: "その他の選択肢・仕組みで気になるのは?",
      options: [
        { label: "自分でDRepになれる?(自己投票)", next: "drep-other-self" },
        { label: "Abstain/No Confidenceって何?", next: "drep-other-abstain" },
        { label: "Catalystとの違いは?", next: "drep-other-catalyst" },
      ],
    },
    "drep-other-self": {
      type: "answer",
      label: "自分でDRepになれる?(自己投票)",
      text: "はい、自分自身をDRepとして登録し、他人に委任せず自分で直接投票する(自己投票)ことも可能です。細かい議案まで自分の意思で判断したい人に向いていますが、その分、議案が出るたびに内容を確認して投票する手間がかかります。",
      keywords: ["自己投票", "自分でDRep", "DRep登録"],
    },
    "drep-other-abstain": {
      type: "answer",
      label: "Abstain/No Confidenceって何?",
      text: "Abstain(棄権)は「あえてどの議案にも意見を表明しない」という意思表示のための特別なDRepです。No Confidence(不信任)は「現在提案されている執行体制そのものに反対する」という意思表示のための特別なDRepです。どちらも特定の個人ではなく、Cardanoに組み込まれた選択肢として用意されています。",
      keywords: ["Abstain", "No Confidence", "棄権"],
    },
    "drep-other-catalyst": {
      type: "answer",
      label: "Catalystとの違いは?",
      text: "Catalystは、コミュニティのアイデアに資金(Treasuryの一部)を配分するファンドプログラムで、提案への投票にはCatalyst専用の登録が必要です。一方DRepへの委任は、プロトコルパラメータの変更などCardano全体のガバナンス議案に対する投票の仕組みで、両者は目的も投票の仕組みも別物です。",
      keywords: ["Catalyst", "Catalyst 違い"],
    },
  },
};
```

- [ ] **Step 2: `app.js`を修正する**

`import spoContent from "./content/spo.js";` の下に追加:

```js
import drepContent from "./content/drep.js";
```

`mergeNodes()`を次のように変更する:

```js
function mergeNodes() {
  return Object.assign(
    { [HOME_NODE_ID]: HOME_NODE },
    walletContent.nodes,
    spoContent.nodes,
    drepContent.nodes
  );
}
```

`HOME_NODE.options`に追加する(配列の末尾に追記):

```js
    { label: "DRep選びについて", next: "drep-root" },
```

- [ ] **Step 3: ローカルサーバーで手動確認する**

ブラウザをリロードし、以下を確認する:
- トップ画面に3択(ウォレット操作/SPO選び/DRep選び)が表示される
- DRep配下の全10回答ノード(基本2/選び方2/委任3/その他3)を一通りクリックし、回答文が表示されることを確認する
- コンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js content/drep.js
git commit -m "feat: add DRep selection topic"
```

---

### Task 5: 自由文入力のキーワードマッチング

**Files:**
- Modify: `app.js`

**Interfaces:**
- Consumes: `nodes`(3トピック+home、全53件のcontentノードにトピックごとの`keywords`配列が揃っている状態)、`renderNode(nodeId, opts)`、`state.currentNodeId`、`state.history`
- Produces: `matchKeywords(text)` — 他タスクからは呼ばれないが、将来のトピック追加時もこの関数は変更不要(`keywords`さえ持たせれば自動で対象になる)

- [ ] **Step 1: `app.js`の末尾付近(`freeTextForm.addEventListener`より前)にキーワードインデックス構築とマッチング関数を追加する**

```js
function buildKeywordIndex(nodesMap) {
  const index = [];
  Object.entries(nodesMap).forEach(([nodeId, node]) => {
    if (node.type === "answer" && Array.isArray(node.keywords)) {
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
```

- [ ] **Step 2: `freeTextForm`の`submit`ハンドラを置き換える**

次のコード:

```js
freeTextForm.addEventListener("submit", (e) => {
  e.preventDefault();
});
```

を、次のように置き換える:

```js
freeTextForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleFreeTextSubmit(freeTextInput.value);
  freeTextInput.value = "";
});
```

- [ ] **Step 3: ローカルサーバーで手動確認する(3パターン)**

ブラウザをリロードし、トップ画面から以下を確認する:

1. **単一ヒット**: 自由文入力欄に「シードフレーズ」と入力して送信 → `wallet-security-seed`の回答("シードフレーズ(リカバリーフレーズ)は…")が表示され、その直前に `"シードフレーズ" についてですね。` という一言が表示されることを確認する

2. **複数ヒット**: 自由文入力欄に「委任」と入力して送信(`wallet-staking-howto`の"委任のやり方"、`spo-after-switch`の"委任変更"など複数ノードのkeywordsに部分一致するはず) → 「もしかして、次のどれかについて聞きたいですか?」に続けて候補ボタンが複数表示されることを確認する。候補ボタンを1つクリックして該当の回答に遷移することを確認する

3. **ノーヒット**: 自由文入力欄に「今日の天気は?」のような無関係な文を入力して送信 → 「うまく聞き取れませんでした。下の選択肢から選んでください。」と表示され、直前にいた画面の選択肢ボタン(トップ画面にいた場合は3択)が再表示されることを確認する

- コンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: keyword-based free text matching"
```

---

### Task 6: 最終仕上げ・README・全体通し確認

**Files:**
- Create: `README.md`
- Create: `.gitignore`

**Interfaces:**
- (このタスクはコード変更なし、ドキュメントと最終確認のみ)

- [ ] **Step 1: `.gitignore`を作成する**

```
.DS_Store
node_modules/
```

- [ ] **Step 2: `README.md`を作成する**

```markdown
# Cardano Q&A ボット

Cardano初心者向けに、ウォレット操作・SPO(プール)選び・DRep選びの3トピックを
チャット形式(ボタン選択+自由文入力)で案内する、完全静的なQ&Aボットです。
AI APIは使用していません。回答内容はすべて `content/*.js` に決定木として記述されています。

## ローカルで動かす

ESモジュール(`import`/`export`)を使っているため、`index.html`を直接ダブルクリックして
開くとブラウザのCORS制限で動作しません。簡易HTTPサーバーを立ててアクセスしてください。

```bash
npx serve .
# または
python -m http.server 8000
```

表示されたURL(例: `http://localhost:3000`)をブラウザで開いてください。

## デプロイ(GitHub Pages)

1. このリポジトリをGitHubにpushする
2. リポジトリの Settings → Pages → Branch で `master`(または`main`) / `/ (root)` を選択する
3. 数分後に `https://<username>.github.io/<repo名>/` で公開される

## コンテンツの追加・編集

- 既存トピックの回答を直接編集する場合は `content/wallet.js` / `content/spo.js` / `content/drep.js` を編集する
- 新しいトピックを追加する場合:
  1. `content/<topic>.js` を作成し、`export default { nodes: { "<topic>-root": {...}, ... } }` の形で決定木を書く
  2. `app.js` の先頭で `import <topic>Content from "./content/<topic>.js";` を追加する
  3. `mergeNodes()` の `Object.assign(...)` に `<topic>Content.nodes` を追加する
  4. `HOME_NODE.options` に `{ label: "表示名", next: "<topic>-root" }` を追加する
- ノードの種類は3つ: `choice`(選択肢分岐)/ `message`(一言だけの中継)/ `answer`(終端の回答、`keywords`で自由文検索に対応)
```

- [ ] **Step 3: 仕様書のテスト方針に沿って全体を通しで手動確認する**

ローカルサーバーを起動し、ブラウザで以下をすべて確認する:

- 3トピック(ウォレット/SPO/DRep)すべて、決定木を最後まで辿れる(行き止まりなし。合計38個の回答ノード、選択肢ノードを含めた総ノード数は53)
- 自由文入力: キーワード単一ヒット/複数ヒット/ノーヒットの3パターンが仕様通りに動く
- 「前の質問に戻る」「トップに戻る」が全トピックで正しく遷移する
- ブラウザの幅を狭めて(スマホ幅を想定)表示が崩れないことを確認する
- ブラウザコンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: add README and gitignore"
```
