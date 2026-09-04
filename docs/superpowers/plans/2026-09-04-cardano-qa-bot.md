# Cardano Q&A ボット Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cardano初心者向けに、ウォレット操作・SPO(プール)選び・DRep選びの3トピックをボタン選択+自由文入力で辿れる、完全静的な決定木チャットボットを構築する。想定される質問をできる限り幅広く洗い出し、厚みのあるQ&Aベースを最初から作り込む。

**Architecture:** バックエンドなしの完全静的サイト(HTML/CSS/素のJS、ESモジュール)。会話内容は`content/*.js`の決定木データとして持ち、`app.js`のチャットエンジンがそれを解釈してチャットバブルUIとして描画する。自由文入力は辞書ベースのキーワードマッチングで決定木ノードにルーティングする(AI API不使用)。SPO推薦・DRep推薦の2機能のみ、自分が運営する無料公開ページ(`hfot.github.io`)へ読み取り専用fetchを行う。

**Tech Stack:** 素のHTML/CSS/JavaScript(ESモジュール)。ビルドツール・フレームワーク・パッケージマネージャ不要。ローカル動作確認にはESモジュールのCORS制約を避けるため簡易HTTPサーバー(`npx serve` または `python -m http.server`)を使う。

## Global Constraints

- AI API・LLM連携は一切使わない(仕様書「スコープ外」より)。
- 自由文入力のマッチングは辞書ベースのキーワード一致のみ。当て推量やAI的な自由応答は行わない。
- 自由文がキーワードに1件もヒットしない場合は「うまく聞き取れませんでした。下の選択肢から選んでください」と表示し、選択肢ボタンに誘導する(仕様書より/ユーザー確定事項)。
- バックエンドなし、外部通信なし。完全にブラウザ内で完結する。
- 対象ユーザーはCardano初心者。専門用語を前提にせず、初めて触る人が読める粒度で回答文を書く(仕様書「スコープ」より)。
- **キーワードは1トークン=空白を含まない単語(日本語の名詞・専門用語・英字の固有名詞)にする。** 照合は`ユーザー入力文字列.includes(キーワード)`(キーワードが入力文字列に部分一致するか)で行うため、「デレゲート 手順」のような空白入りの複合キーワードは、ユーザーが短い単語だけ打った場合に一致しない。必ず単語単位に分割して登録する。
- **自動テストは設けない**(仕様書「テスト方針」より、ユーザー確定事項)。各タスクの検証はローカルサーバーを立てブラウザで手動確認する。この方針は`superpowers:writing-plans`のデフォルトであるTDD手順から意図的に外れている — 仕様書で明示的に承認された決定のため。
- **SPO推薦機能(Task 7)は例外的に外部への読み取り専用fetchを行う**(`https://hfot.github.io/cardano-relay-health/`)。これは自分自身が運営する無料・APIキー不要の公開ページであり、AI APIでも第三者サービスでもないため、Global Constraintsの「AI API不使用」とは別枠として扱う。GitHub Pagesはデフォルトで`Access-Control-Allow-Origin: *`を返すためCORS問題は発生しない([[project_spo_onchain_alive]]で同じ「HTML直読み」方式の前例あり)。
- **DRep推薦機能(Task 8)も同様に外部への読み取り専用fetchを行う**(`https://hfot.github.io/drep-terminal-v6/`)。これも自分自身が運営する無料・APIキー不要の公開ページであり、CORS問題は発生しない。Blockfrost等の有償APIキーを必要とする「上級者向け」機能は導入しない(ユーザー確定事項)。

参照仕様書: `docs/superpowers/specs/2026-09-04-cardano-qa-bot-design.md`

---

## File Structure

```
cardano-qa-bot/
├── index.html          # チャットUIのDOM骨格
├── styles.css          # チャットバブル・ボタンのスタイル
├── app.js              # チャットエンジン(状態管理・描画・ナビゲーション・キーワードマッチング)
├── content/
│   ├── wallet.js        # ウォレット操作トピックの決定木データ(7カテゴリ・31回答ノード)
│   ├── spo.js           # SPO選びトピックの決定木データ(5カテゴリ・24回答ノード + Task 7でrecommend-pool 1件追加)
│   └── drep.js          # DRep選びトピックの決定木データ(5カテゴリ・19回答ノード + Task 8でrecommend-drep 1件追加)
└── README.md            # 起動方法・デプロイ方法・コンテンツ追加方法
```

全体で **96ノード**(選択肢ノード20 + 回答ノード74 + 推薦ノード2)。

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

// answer: 最終回答(終端)。label は候補一覧表示用の短い見出し。keywords は空白を含まない単語の配列
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

### Task 2: 決定木エンジンのコア実装 + ウォレット操作トピック(7カテゴリ・31回答ノード)

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
        { label: "トークン・NFTの管理", next: "wallet-tokens" },
        { label: "トラブルシューティング", next: "wallet-troubleshoot" },
        { label: "取引所とのやり取り", next: "wallet-exchange" },
      ],
    },

    "wallet-choose": {
      type: "choice",
      text: "ウォレット選びで気になるのは?",
      options: [
        { label: "そもそもウォレットって何?", next: "wallet-choose-what" },
        { label: "どのウォレットがいいの?", next: "wallet-choose-which" },
        { label: "ライトウォレットとフルノードの違い", next: "wallet-choose-lightnode" },
        { label: "ハードウェアウォレットは必要?", next: "wallet-choose-hw" },
        { label: "複数ウォレットアプリを併用してもいい?", next: "wallet-choose-multiapp" },
      ],
    },
    "wallet-choose-what": {
      type: "answer",
      label: "そもそもウォレットって何?",
      text: "ウォレットは、Cardanoネットワーク上のADAやトークンを管理するための、鍵(秘密鍵)を保管する道具です。銀行口座のようにお金そのものを預かっているわけではなく、「あなたの資産はブロックチェーン上にあり、ウォレットはそれを操作する鍵を持っている」とイメージすると分かりやすいです。",
      keywords: ["ウォレットとは", "そもそもウォレット"],
    },
    "wallet-choose-which": {
      type: "answer",
      label: "どのウォレットがいいの?",
      text: "初心者にはEternl、Nami、Yoroiなどのブラウザ拡張型(ライトウォレット)が扱いやすいです。スマホならEternlやYoroiのモバイル版もあります。どれもADAの送受金・ステーキング・DRep委任に対応しています。まずは1つ選んで少額のADAで操作に慣れるのがおすすめです。",
      keywords: ["Eternl", "Nami", "Yoroi", "Daedalus", "選び方"],
    },
    "wallet-choose-lightnode": {
      type: "answer",
      label: "ライトウォレットとフルノードの違い",
      text: "Daedalusはブロックチェーン全体を自分の端末にダウンロードする「フルノード」型で、起動や同期に時間がかかりますが、より自立した検証ができます。Eternl・Nami・Yoroiなどは外部のサーバーに問い合わせる「ライトウォレット」型で、インストール後すぐ使えて動作も軽いです。初心者には基本的にライトウォレットで十分です。",
      keywords: ["フルノード", "ライトウォレット", "Daedalus"],
    },
    "wallet-choose-hw": {
      type: "answer",
      label: "ハードウェアウォレットは必要?",
      text: "少額のADAを試す段階では必須ではありません。ただし、まとまった金額を長期保有する場合はLedgerやTrezorなどのハードウェアウォレットと連携すると、秘密鍵がネットに繋がらない機器の中で管理されるため安全性が大きく上がります。EternlやYoroiはハードウェアウォレット連携に対応しています。",
      keywords: ["ハードウェアウォレット", "Ledger", "Trezor"],
    },
    "wallet-choose-multiapp": {
      type: "answer",
      label: "複数ウォレットアプリを併用してもいい?",
      text: "同じシードフレーズを複数のウォレットアプリ(例: EternlとYoroi)に読み込ませて併用することは技術的には可能です。ただし同時に別々のアプリで操作すると残高の反映がずれて見えることがあるため、普段使いは1つのアプリに絞るのがおすすめです。",
      keywords: ["併用", "複数アプリ"],
    },

    "wallet-basic": {
      type: "choice",
      text: "基本操作で気になるのは?",
      options: [
        { label: "ADAの受け取り方", next: "wallet-basic-receive" },
        { label: "ADAの送金方法・手数料", next: "wallet-basic-send" },
        { label: "送金が反映されない時", next: "wallet-basic-pending" },
        { label: "複数アドレスの使い方", next: "wallet-basic-multiaddress" },
        { label: "ミニマムADAって何?", next: "wallet-basic-minada" },
        { label: "コラテラル(collateral)って何?", next: "wallet-basic-collateral" },
      ],
    },
    "wallet-basic-receive": {
      type: "answer",
      label: "ADAの受け取り方",
      text: "ウォレットの「受け取る(Receive)」画面を開くと、自分のADA用アドレスとQRコードが表示されます。このアドレスを送り主に伝える(またはQRコードを読み取ってもらう)だけでADAを受け取れます。アドレスは公開して問題ありませんが、シードフレーズは絶対に教えないでください。",
      keywords: ["受け取り", "入金", "アドレス", "QRコード"],
    },
    "wallet-basic-send": {
      type: "answer",
      label: "ADAの送金方法・手数料",
      text: "「送る(Send)」画面で、送り先アドレスと金額を入力して送金します。送金には小額のネットワーク手数料(トランザクション手数料)がかかり、金額はウォレットが自動計算して送金前に表示してくれます。送り先アドレスは1文字でも間違えると届かないので、コピー&ペーストかQRコード読み取りを使い、手入力は避けましょう。",
      keywords: ["送金", "手数料", "送る"],
    },
    "wallet-basic-pending": {
      type: "answer",
      label: "送金が反映されない時",
      text: "Cardanoの送金は通常数分で反映されますが、ネットワークが混雑していると少し時間がかかることがあります。まずはCardanoScanなどのブロックエクスプローラーでトランザクションIDを検索し、承認(confirm)されているか確認してください。承認済みなのにウォレット上の残高が変わらない場合は、ウォレットの同期・再起動を試してみましょう。",
      keywords: ["反映されない", "CardanoScan", "同期"],
    },
    "wallet-basic-multiaddress": {
      type: "answer",
      label: "複数アドレスの使い方",
      text: "Cardanoのウォレットは1つのシードフレーズから複数の受け取りアドレスを生成できます。相手ごとに違うアドレスを使うことでプライバシーを高められますが、残高やステーキングはウォレット単位(シードフレーズ単位)でまとめて管理されるので、どのアドレスにADAが届いても合計残高に反映されます。難しく考えず、基本は表示された最初のアドレスを使えば十分です。",
      keywords: ["複数アドレス"],
    },
    "wallet-basic-minada": {
      type: "answer",
      label: "ミニマムADAって何?",
      text: "Cardanoでは、ADA以外のトークンやNFTを1つのアドレスに保持するために、そのアドレスに一定量以上のADAが一緒に入っている必要があります。これを「ミニマムADA」と呼びます。トークンをたくさん持つと、その分ミニマムADAとして必要な金額も増えていく仕組みです。",
      keywords: ["ミニマムADA", "minADA"],
    },
    "wallet-basic-collateral": {
      type: "answer",
      label: "コラテラル(collateral)って何?",
      text: "コラテラルは、スマートコントラクト(DApps)を利用する際にウォレット側で確保しておく少額のADAです。トランザクションの実行に失敗した場合の手数料保証として使われる仕組みで、普段のADA送金だけをしている分には意識する必要はありません。DAppsを使う前にウォレットの設定画面でコラテラルを用意しておくとスムーズです。",
      keywords: ["コラテラル", "collateral"],
    },

    "wallet-security": {
      type: "choice",
      text: "セキュリティについて気になるのは?",
      options: [
        { label: "シードフレーズって何?なぜ大事?", next: "wallet-security-seed" },
        { label: "シードフレーズの安全な保管方法", next: "wallet-security-storage" },
        { label: "詐欺・フィッシングの見分け方", next: "wallet-security-phishing" },
        { label: "パスワードを忘れた/端末を無くした", next: "wallet-security-recovery" },
        { label: "DAppsへのウォレット接続は安全?", next: "wallet-security-dapp-connect" },
      ],
    },
    "wallet-security-seed": {
      type: "answer",
      label: "シードフレーズって何?なぜ大事?",
      text: "シードフレーズ(リカバリーフレーズ)は、あなたのウォレットの中身すべてを復元できる15〜24個の英単語です。これさえあれば誰でもあなたのADAを操作できてしまうため、パスワード以上に厳重に扱う必要があります。ウォレット作成時に一度だけ表示されるので、必ずその場で控えてください。",
      keywords: ["シードフレーズ", "リカバリーフレーズ"],
    },
    "wallet-security-storage": {
      type: "answer",
      label: "シードフレーズの安全な保管方法",
      text: "紙に手書きして、金庫や信頼できる場所など複数の物理的な場所に分けて保管するのが基本です。スマホのメモ、スクリーンショット、クラウドストレージ、メールなど「ネットに繋がる場所」には絶対に保存しないでください。写真として撮影するのも避けましょう。",
      keywords: ["保管", "バックアップ"],
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
      keywords: ["パスワード", "端末", "復元"],
    },
    "wallet-security-dapp-connect": {
      type: "answer",
      label: "DAppsへのウォレット接続は安全?",
      text: "公式サイトや信頼できるDApps(分散型アプリ)にウォレットを「接続(Connect)」するだけでは、ADAが抜き取られることはありません。危険なのは接続後に表示される署名(サイン)リクエストの内容を確認せずに何でも承認してしまうことです。よくわからない署名リクエストが来たら、内容を読むか一旦キャンセルしましょう。",
      keywords: ["DApps", "接続", "署名"],
    },

    "wallet-staking": {
      type: "choice",
      text: "ステーキングについて気になるのは?",
      options: [
        { label: "ステーキングって何?なぜやるべき?", next: "wallet-staking-what" },
        { label: "デレゲートの手順", next: "wallet-staking-howto" },
        { label: "デレゲートしたADAは引き出せる?", next: "wallet-staking-locked" },
        { label: "報酬はいつ・どうやってもらえる?", next: "wallet-staking-rewards" },
        { label: "委任を解除して保有だけにできる?", next: "wallet-staking-dereg" },
      ],
    },
    "wallet-staking-what": {
      type: "answer",
      label: "ステーキングって何?なぜやるべき?",
      text: "ステーキングは、保有しているADAをステークプールに預ける(委任する)ことで、ネットワークの運営に参加し、報酬を受け取れる仕組みです。ADAは自分のウォレットに入ったまま動かせるので、預けたら引き出せなくなるわけではありません。持っているだけなら委任しない理由がないくらい、基本的な機能です。",
      keywords: ["ステーキング", "委任"],
    },
    "wallet-staking-howto": {
      type: "answer",
      label: "デレゲートの手順",
      text: "ウォレットの「Staking」タブから、委任したいプールを選んで「Delegate」を実行するだけです。実行時に小さなネットワーク手数料がかかります。委任は1〜2エポック(数日)後に有効になり、それ以降エポックごとに報酬が計算されるようになります。",
      keywords: ["デレゲート", "手順", "Delegate"],
    },
    "wallet-staking-locked": {
      type: "answer",
      label: "デレゲートしたADAは引き出せる?",
      text: "デレゲートしても、ADAはロックされず自分のウォレットの中で自由に送金・使用できます。ステーキングは「預ける」というより「投票権を貸す」ようなイメージで、いつでもプールの変更や委任解除ができます。",
      keywords: ["ロック", "引き出せる"],
    },
    "wallet-staking-rewards": {
      type: "answer",
      label: "報酬はいつ・どうやってもらえる?",
      text: "Cardanoの報酬は約5日周期の「エポック」ごとに計算され、委任してから2〜3エポック(1〜2週間程度)後に初回の報酬が届き始めます。報酬は自動でウォレット残高に加算されるので、請求などの操作は不要です。",
      keywords: ["報酬", "エポック"],
    },
    "wallet-staking-dereg": {
      type: "answer",
      label: "委任を解除して保有だけにできる?",
      text: "はい、プールへの委任を解除して「委任なしで保有するだけ」の状態にすることもできます。ウォレットのStaking画面から委任解除(deregister)を選ぶと、以後は報酬が発生しなくなりますが、ADA自体はそのままあなたの手元に残ります。特別な理由がなければ、報酬がもらえる委任状態のままにしておくのがお得です。",
      keywords: ["委任解除", "deregister"],
    },

    "wallet-tokens": {
      type: "choice",
      text: "トークン・NFTについて気になるのは?",
      options: [
        { label: "NFTの保管・確認方法", next: "wallet-tokens-nft" },
        { label: "ネイティブトークンの表示のされ方", next: "wallet-tokens-native" },
        { label: "知らないトークンやNFTが届いた時の注意点", next: "wallet-tokens-airdrop-scam" },
      ],
    },
    "wallet-tokens-nft": {
      type: "answer",
      label: "NFTの保管・確認方法",
      text: "CardanoのNFTはADAと同じウォレットの中に自動的に表示されます。EternlやYoroiにはNFT専用の一覧タブがあり、画像やコレクション名が表示されます。NFTを送るときもADAと同じ「送る」画面から、送り先アドレスとNFTを選ぶだけで送金できます。",
      keywords: ["NFT"],
    },
    "wallet-tokens-native": {
      type: "answer",
      label: "ネイティブトークンの表示のされ方",
      text: "Cardanoでは独自トークン(ネイティブトークン)もADAと同じウォレットの中にそのまま表示されます。取引所で買ったトークンやプロジェクトから配布されたトークンも、送金先のアドレスさえ合っていれば自動的にウォレットの一覧に現れます。表示名やアイコンが正しく出ないトークンもありますが、残高自体は正しく反映されています。",
      keywords: ["ネイティブトークン", "トークン"],
    },
    "wallet-tokens-airdrop-scam": {
      type: "answer",
      label: "知らないトークンやNFTが届いた時の注意点",
      text: "頼んでもいないトークンやNFTが勝手にウォレットに届くことがあります(エアドロップ詐欺・ダストアタック)。これ自体でADAが盗まれることはありませんが、そのトークンをDApps上で「売る」「クレームする」といった操作をしようとすると、詐欺サイトへの接続や不正な署名を誘導される場合があります。身に覚えのないトークンには触らず放置するのが一番安全です。",
      keywords: ["エアドロップ", "ダストアタック"],
    },

    "wallet-troubleshoot": {
      type: "choice",
      text: "困った時・トラブルで気になるのは?",
      options: [
        { label: "ブラウザ拡張が反応しない/開かない", next: "wallet-troubleshoot-extension" },
        { label: "アップデート後に残高が0に見える", next: "wallet-troubleshoot-update-balance" },
        { label: "DApps操作でエラーが出る", next: "wallet-troubleshoot-dapp-error" },
        { label: "自分がどのプールに委任しているか確認したい", next: "wallet-troubleshoot-check-delegation" },
      ],
    },
    "wallet-troubleshoot-extension": {
      type: "answer",
      label: "ブラウザ拡張が反応しない/開かない",
      text: "まずはブラウザを再起動する、拡張機能を無効化して再度有効化する、ブラウザ自体を最新版に更新する、を順番に試してください。それでも直らない場合は、ウォレットの拡張機能をアンインストールしてから公式サイト経由で再インストールし、シードフレーズで復元してください。シードフレーズさえあれば中身が消えることはありません。",
      keywords: ["拡張機能", "反応しない"],
    },
    "wallet-troubleshoot-update-balance": {
      type: "answer",
      label: "アップデート後に残高が0に見える",
      text: "ウォレットのアップデートや再インストールの直後は、ブロックチェーンとの同期がまだ終わっていないために残高が一時的に0や不正確な表示になることがあります。同期には数分〜数十分かかる場合があるので、少し時間を置いてから再度確認してください。それでも直らない場合はシードフレーズでの復元を試してください(ADA自体が失われることはありません)。",
      keywords: ["残高0", "アップデート"],
    },
    "wallet-troubleshoot-dapp-error": {
      type: "answer",
      label: "DApps操作でエラーが出る",
      text: "コラテラルが設定されていない、ネットワーク(メインネット/テストネット)の選択が合っていない、DApps側が混雑している、などが主な原因です。まずウォレット設定でコラテラルが用意されているか確認し、それでも解決しない場合は少し時間を置いて再試行してみてください。",
      keywords: ["DAppsエラー"],
    },
    "wallet-troubleshoot-check-delegation": {
      type: "answer",
      label: "自分がどのプールに委任しているか確認したい",
      text: "ウォレットのStaking画面を開くと、現在委任しているプールの名前・Ticker・手数料などが表示されます。CardanoScanなどのブロックエクスプローラーで自分のステークアドレスを検索しても、委任先のプール情報を確認できます。",
      keywords: ["委任先確認", "ステークアドレス"],
    },

    "wallet-exchange": {
      type: "choice",
      text: "取引所とのやり取りで気になるのは?",
      options: [
        { label: "取引所からウォレットへ送金する時の注意点", next: "wallet-exchange-withdraw" },
        { label: "ウォレットから取引所へ送金する時の注意点", next: "wallet-exchange-deposit" },
        { label: "コールド/ホットウォレットの違い", next: "wallet-exchange-cold-hot" },
      ],
    },
    "wallet-exchange-withdraw": {
      type: "answer",
      label: "取引所からウォレットへ送金する時の注意点",
      text: "取引所の出金画面に、あなたの個人ウォレットの「受け取る」画面で表示されたアドレスを正確にコピー&ペーストしてください。1文字でも間違えると資産が失われる可能性があります。初めての送金では、まず少額だけ送って着金を確認してから、残りをまとめて送るのが安全です。",
      keywords: ["取引所出金"],
    },
    "wallet-exchange-deposit": {
      type: "answer",
      label: "ウォレットから取引所へ送金する時の注意点",
      text: "取引所側の入金画面に表示された、その取引所専用の入金アドレスに送金してください。取引所によっては入金時に「メモ」や「タグ」の入力が必要な場合もあるので、指示がある場合は必ず入力してください(Cardanoの入金では通常不要です)。ここでも初回は少額でのテスト送金がおすすめです。",
      keywords: ["取引所入金"],
    },
    "wallet-exchange-cold-hot": {
      type: "answer",
      label: "コールド/ホットウォレットの違い",
      text: "ホットウォレットはインターネットに繋がった状態のウォレット(EternlやYoroiなど)で、日常的な操作がしやすい反面、端末がハッキングされるリスクがあります。コールドウォレットはLedgerやTrezorのようにインターネットから切り離して秘密鍵を保管する方式で、安全性が高い分、操作の手間は少し増えます。長期保有分はコールド、日常使いする分だけホットに置くのが一般的です。",
      keywords: ["コールドウォレット", "ホットウォレット"],
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

ブラウザをリロードし、以下を確認する:
- トップ画面で「ウォレット操作について」の1択が表示される
- クリックすると7つの選択肢(選び方/基本操作/セキュリティ/ステーキング/トークン・NFT/トラブルシューティング/取引所とのやり取り)が表示される
- 「ウォレットの選び方」→「どのウォレットがいいの?」まで進み、回答文が表示され、「前の質問に戻る」「トップに戻る」ボタンが出ることを確認する
- 「前の質問に戻る」を押すと1つ前の選択肢画面に戻ることを確認する
- 「トップに戻る」を押すとトップ画面に戻ることを確認する
- ウォレット配下の全31回答ノードを一通りクリックし、回答文が表示されることを確認する(各カテゴリの選択肢を全部押していけば良い)
- ブラウザコンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js content/wallet.js
git commit -m "feat: decision-tree engine + wallet topic content"
```

---

### Task 3: SPO(プール)選びトピックの追加(5カテゴリ・24回答ノード)

**Files:**
- Create: `content/spo.js`
- Modify: `app.js`(import追加・merge対象追加・HOME_NODEの選択肢追加)

**Interfaces:**
- Consumes: Task 2の`mergeNodes()`・`HOME_NODE.options`・データ構造の契約
- Produces: `content/spo.js`は`{ nodes: {...} }`をdefault exportする(SPOトピックの24回答ノード)

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
        { label: "非集中化・コミュニティ", next: "spo-community" },
      ],
    },

    "spo-basics": {
      type: "choice",
      text: "基本的な仕組みについて気になるのは?",
      options: [
        { label: "SPOとステーキングの関係は?", next: "spo-basics-what" },
        { label: "プールはどこで探せる?", next: "spo-basics-where" },
        { label: "プールのTickerとプールIDの違いは?", next: "spo-basics-ticker-id" },
        { label: "ステーク登録手数料(deposit)って何?", next: "spo-basics-deposit" },
      ],
    },
    "spo-basics-what": {
      type: "answer",
      label: "SPOとステーキングの関係は?",
      text: "SPO(Stake Pool Operator)は、ブロック生成用のサーバーを運営している人・組織のことです。私たちがADAをプールに委任すると、そのプールの取り分としてブロック生成に参加する権利が増え、生成された報酬が委任者にも分配されます。つまりSPO選びは「誰に運営を任せて報酬を分けてもらうか」を選ぶ作業です。",
      keywords: ["SPO", "ステークプール"],
    },
    "spo-basics-where": {
      type: "answer",
      label: "プールはどこで探せる?",
      text: "各ウォレットのStaking画面内の検索機能で名前やTickerから探せるほか、pool.pmやadapools.orgといった外部サイトでは手数料・サチュレーション・稼働率などの詳細情報を比較できます。まずはウォレット内の検索で候補を絞り、外部サイトで詳細を確認するのがおすすめです。",
      keywords: ["探し方", "pool.pm", "adapools"],
    },
    "spo-basics-ticker-id": {
      type: "answer",
      label: "プールのTickerとプールIDの違いは?",
      text: "Ticker([SPO1]のような短い記号)は人間が覚えやすいように付けられた愛称のようなもので、同じTickerを名乗るプールが偽物として存在することもあります。プールID(長い英数字の文字列)はそのプール固有の識別子で、絶対に重複しません。委任前に公式サイトなどでプールIDまで確認すると、偽プールへの誤委任を防げます。",
      keywords: ["Ticker", "プールID"],
    },
    "spo-basics-deposit": {
      type: "answer",
      label: "ステーク登録手数料(deposit)って何?",
      text: "ウォレットで初めてステーキングを行う際、ステークキーを登録するための保証金(deposit)が一度だけ差し引かれます。この保証金は、将来ステーキングをやめてステークキーを登録解除(deregister)した際に、ADAとして手元に戻ってきます。使ったら消える手数料ではなく、預け金のようなものです。",
      keywords: ["deposit", "保証金"],
    },

    "spo-fees": {
      type: "choice",
      text: "手数料・報酬まわりで気になるのは?",
      options: [
        { label: "手数料(margin)って何?目安は?", next: "spo-fees-margin" },
        { label: "固定手数料(fixed cost)って何?", next: "spo-fees-fixed" },
        { label: "ROA(報酬率)は信用していい?", next: "spo-fees-roa" },
        { label: "手数料は途中で変更される?", next: "spo-fees-change" },
      ],
    },
    "spo-fees-margin": {
      type: "answer",
      label: "手数料(margin)って何?目安は?",
      text: "margin(可変手数料)は、そのプールが得た報酬のうち運営者が取る割合です。0%〜数%まで幅がありますが、0%を謳うプールが必ずしも一番お得とは限らず、運営の継続性やサチュレーション状況も合わせて見る必要があります。数字だけで即決せず、他の指標と合わせて判断しましょう。",
      keywords: ["margin", "可変手数料", "手数料"],
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
      keywords: ["ROA", "年利"],
    },
    "spo-fees-change": {
      type: "answer",
      label: "手数料は途中で変更される?",
      text: "はい、SPOはmarginやfixed costをいつでも変更できます。変更は即座には反映されず、数エポック後に適用される仕組みになっているため、急に不利な条件へ変えられても委任者側が気づいて対応する猶予があります。手数料を頻繁に変更するプールは、変更履歴を確認してから委任するとより安心です。",
      keywords: ["手数料変更"],
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
        { label: "k-parameterって何?", next: "spo-trust-kparam" },
        { label: "マルチプール運営者は避けるべき?", next: "spo-trust-multipool" },
        { label: "新規登録されたばかりのプールに委任するのはあり?", next: "spo-trust-newpool" },
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
      keywords: ["saturation", "サチュレーション"],
    },
    "spo-trust-uptime": {
      type: "answer",
      label: "稼働率(uptime)・ブロック実績の見方",
      text: "稼働率(uptime)は、そのプールのサーバーがどれだけ安定して動き続けているかを示す指標です。稼働率が低いプールは、本来生成できるはずのブロックを取りこぼし、委任者の報酬機会も失われます。プール一覧サイトの過去のブロック生成履歴と合わせて、安定して稼働しているかを確認しましょう。",
      keywords: ["uptime", "稼働率"],
    },
    "spo-trust-decentralization": {
      type: "answer",
      label: "非集中化に貢献するプールの選び方",
      text: "Cardanoは特定の大きなプールに委任が集中しすぎないことを大切にしています。すでに委任が非常に多い有名プールよりも、サチュレーションに余裕があり運営実績も安定している中小規模のプールを選ぶことは、ネットワーク全体の非集中化に貢献する選択になります。",
      keywords: ["非集中化", "分散化"],
    },
    "spo-trust-scam": {
      type: "answer",
      label: "怪しいプールの見分け方",
      text: "極端に高いROAだけを強調している、運営者情報や過去の運用実績が一切公開されていない、SNSのDMで特定のプールへの委任を執拗に勧めてくる、といったプールは注意が必要です。プールへの委任はADA自体が奪われる操作ではありませんが、判断材料が乏しいプールへの委任は報酬面で不利益を被る可能性があります。",
      keywords: ["怪しいプール", "詐欺プール"],
    },
    "spo-trust-kparam": {
      type: "answer",
      label: "k-parameterって何?",
      text: "k-parameterは、Cardanoネットワーク全体で「理想的には何個のプールに委任が分散しているべきか」を表すプロトコルパラメータです。このk-parameterから、1プールあたりの適正な委任上限(サチュレーションの目安)が計算されています。値自体を覚える必要はなく、「サチュレーションはこのk-parameterから逆算されている」と知っておけば十分です。",
      keywords: ["k-parameter", "kパラメータ"],
    },
    "spo-trust-multipool": {
      type: "answer",
      label: "マルチプール運営者は避けるべき?",
      text: "同じ運営者が複数のプールを運営しているケース自体は珍しくなく、必ずしも悪いことではありません。ただし、1人の運営者が非常に多くのプールを持っている場合、実質的な運営の集中(非集中化に逆行する状態)になっている可能性があるため、非集中化を重視するなら独立した小規模運営者のプールを選ぶのも一つの考え方です。",
      keywords: ["マルチプール"],
    },
    "spo-trust-newpool": {
      type: "answer",
      label: "新規登録されたばかりのプールに委任するのはあり?",
      text: "新規プールは実績データがまだ少なく、稼働の安定性を判断しにくいという弱点があります。一方で、サチュレーションに余裕があり非集中化に貢献しやすいという利点もあります。運営者の情報公開や説明の丁寧さを確認した上で、様子を見ながら少額から委任してみるという選び方もできます。",
      keywords: ["新規プール"],
    },

    "spo-after": {
      type: "choice",
      text: "プールを選んだ後のことで気になるのは?",
      options: [
        { label: "プールを変更したい時は?", next: "spo-after-switch" },
        { label: "デレゲートしてもすぐ報酬が出ないのはなぜ?", next: "spo-after-epoch" },
        { label: "複数プールに分けるべき?", next: "spo-after-split" },
        { label: "委任していたプールが引退(retire)したら?", next: "spo-after-retired" },
        { label: "プールの実績グラフはどう読む?", next: "spo-after-chart" },
      ],
    },
    "spo-after-switch": {
      type: "answer",
      label: "プールを変更したい時は?",
      text: "ウォレットのStaking画面から、いつでも別のプールへ委任し直すことができます。変更には小さなネットワーク手数料がかかりますが、ADA自体が失われることはありません。変更後は再び1〜2エポック程度で新しいプールでの計算が反映されます。",
      keywords: ["プール変更"],
    },
    "spo-after-epoch": {
      type: "answer",
      label: "デレゲートしてもすぐ報酬が出ないのはなぜ?",
      text: "Cardanoの報酬計算は約5日ごとの「エポック」という区切りで行われます。委任した直後のエポックはまだ集計対象に入らず、実際に報酬として反映されるまでには2〜3エポック(1〜2週間程度)かかるのが通常です。焦らず待つのがポイントです。",
      keywords: ["報酬", "エポック"],
    },
    "spo-after-split": {
      type: "answer",
      label: "複数プールに分けるべき?",
      text: "少額のうちは1つのプールにまとめて問題ありません。委任額が大きくなってきたら、複数の信頼できるプールに分散することでサチュレーションの影響を避けたり、特定の運営者への依存を減らしたりできます。分散は「必須」ではなく「余裕が出てきたら検討する選択肢」と捉えて大丈夫です。",
      keywords: ["複数プール", "分散委任"],
    },
    "spo-after-retired": {
      type: "answer",
      label: "委任していたプールが引退(retire)したら?",
      text: "SPOが運営をやめる(retire)と宣言したプールに委任していても、ADAが失われることはありません。ただし引退後はブロック生成が行われなくなり報酬が止まるため、引退予定日を確認したら早めに別のプールへ委任し直すことをおすすめします。プール一覧サイトでは引退予定のプールに「Retiring」などの表示が出ます。",
      keywords: ["プール引退", "retiring"],
    },
    "spo-after-chart": {
      type: "answer",
      label: "プールの実績グラフはどう読む?",
      text: "多くのプール一覧サイトでは、過去のエポックごとのブロック生成数や稼働率が折れ線・棒グラフで表示されます。安定して横ばい〜右肩の実績が続いているプールは信頼性が高く、逆にブロック生成が急に途切れている期間があるプールは、サーバートラブルがあった可能性があるので注意深く見てみましょう。",
      keywords: ["実績グラフ"],
    },

    "spo-community": {
      type: "choice",
      text: "非集中化・コミュニティについて気になるのは?",
      options: [
        { label: "コミュニティプールとは?なぜ選ぶ意義がある?", next: "spo-community-what" },
        { label: "プールの地理的分散(ロケーション)は考慮すべき?", next: "spo-community-geo" },
        { label: "自分でSPOになるにはどうすればいい?", next: "spo-community-become" },
      ],
    },
    "spo-community-what": {
      type: "answer",
      label: "コミュニティプールとは?なぜ選ぶ意義がある?",
      text: "コミュニティプールとは、個人や小規模なグループが運営し、収益の一部を教育・開発・啓発活動などに還元しているプールのことです。大手プールと違い、委任することがそのままコミュニティ活動の支援にもつながる点が特徴です。プールの説明文に活動内容が書かれていることが多いので、興味があれば読んでみるとよいでしょう。",
      keywords: ["コミュニティプール"],
    },
    "spo-community-geo": {
      type: "answer",
      label: "プールの地理的分散(ロケーション)は考慮すべき?",
      text: "サーバーの設置場所が世界各地に分散しているほど、特定の地域で起きた通信障害や災害の影響をネットワーク全体が受けにくくなります。初心者が必須で気にする項目ではありませんが、こだわりたい場合はプールの説明文でサーバーの拠点情報を確認するとよいでしょう。",
      keywords: ["ロケーション", "地理的分散"],
    },
    "spo-community-become": {
      type: "answer",
      label: "自分でSPOになるにはどうすればいい?",
      text: "SPOになるには、サーバー(ノード)の構築・運用の技術知識に加えて、登録に必要な保証金や、プレッジとして預けるADAの用意が必要です。Cardano公式ドキュメントにステークプール運営の手順がまとめられているので、興味があればまずそちらを確認してみることをおすすめします。",
      keywords: ["SPOになる", "プール運営"],
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
- SPO配下の全24回答ノード(基本4/手数料4/信頼性8/事後5/コミュニティ3)を一通りクリックし、回答文が表示されることを確認する
- 「戻る」「トップに戻る」がSPO配下でも正しく動作することを確認する
- コンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js content/spo.js
git commit -m "feat: add SPO selection topic"
```

---

### Task 4: DRep選びトピックの追加(5カテゴリ・19回答ノード)

**Files:**
- Create: `content/drep.js`
- Modify: `app.js`(import追加・merge対象追加・HOME_NODEの選択肢追加)

**Interfaces:**
- Consumes: Task 3までの`mergeNodes()`・`HOME_NODE.options`
- Produces: `content/drep.js`は`{ nodes: {...} }`をdefault exportする(DRepトピックの19回答ノード)

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
        { label: "ガバナンスアクション・議案について", next: "drep-actions" },
      ],
    },

    "drep-basics": {
      type: "choice",
      text: "DRepの基本について気になるのは?",
      options: [
        { label: "DRepって何?なぜ必要?", next: "drep-basics-what" },
        { label: "DRepとSPOへの委任は別物?", next: "drep-basics-vs-spo" },
        { label: "投票に参加しないとどうなる?", next: "drep-basics-noaction" },
        { label: "自分の一票はどれくらい意味を持つ?", next: "drep-basics-weight" },
      ],
    },
    "drep-basics-what": {
      type: "answer",
      label: "DRepって何?なぜ必要?",
      text: "DRep(Delegated Representative)は、Cardanoのガバナンス(Voltaire)における投票の代理人です。プロトコルの変更やTreasury(国庫)の使い道など、コミュニティが決める議案に対して、自分の代わりに投票してもらう相手を選ぶ仕組みです。ADA保有者は自分で投票することも、DRepに委任することもできます。",
      keywords: ["DRep", "ガバナンス", "Voltaire"],
    },
    "drep-basics-vs-spo": {
      type: "answer",
      label: "DRepとSPOへの委任は別物?",
      text: "はい、まったく別の委任です。SPOへの委任は「ステーキング報酬」のため、DRepへの委任は「ガバナンス投票権」のためのものです。1つのウォレットから両方に別々に委任することができ、片方だけ設定してもう片方は未設定、という状態も可能です。",
      keywords: ["2つの委任"],
    },
    "drep-basics-noaction": {
      type: "answer",
      label: "投票に参加しないとどうなる?",
      text: "DRepに委任せず、自分でも投票しないままにしていても、罰則やペナルティは一切ありません。ただしその分のADAは議案の集計に反映されないため、ガバナンスに自分の意見を届けたい場合は、DRepへの委任か自己投票のどちらかをしておくことをおすすめします。",
      keywords: ["投票しない", "参加しない"],
    },
    "drep-basics-weight": {
      type: "answer",
      label: "自分の一票はどれくらい意味を持つ?",
      text: "Cardanoのガバナンス投票は、保有・委任しているADAの量に応じて票の重みが決まる仕組みです。少額の保有でも票が完全に無視されるわけではなく、全体の集計に組み込まれます。1人の影響力の大きさよりも「多くの人が意思表示すること」自体に意味があると考えるとよいでしょう。",
      keywords: ["票の重み"],
    },

    "drep-choose": {
      type: "choice",
      text: "DRepの選び方で気になるのは?",
      options: [
        { label: "DRepを選ぶ基準は?", next: "drep-choose-criteria" },
        { label: "投票傾向はどこで見れる?", next: "drep-choose-history" },
        { label: "委任していたDRepが引退したら?", next: "drep-choose-retired" },
      ],
    },
    "drep-choose-criteria": {
      type: "answer",
      label: "DRepを選ぶ基準は?",
      text: "過去の投票実績(実際にどれだけ投票に参加しているか)、投票理由の説明を公開しているか、自分の考え方(例えば開発重視、コミュニティ重視など)と近いか、といった点を基準にするのがおすすめです。有名だからという理由だけで選ばず、投票の中身や説明の透明性を見ることが大切です。",
      keywords: ["選ぶ基準"],
    },
    "drep-choose-history": {
      type: "answer",
      label: "投票傾向はどこで見れる?",
      text: "GovTool(Cardanoの公式ガバナンスツール)では、各DRepのプロフィールや過去の投票履歴、投票理由を確認できます。委任前に一度目を通し、自分の考えと近いか確認しておくと安心です。",
      keywords: ["投票傾向", "GovTool"],
    },
    "drep-choose-retired": {
      type: "answer",
      label: "委任していたDRepが引退したら?",
      text: "委任していたDRepが登録を取り消す(退任する)と、そのDRepは新しい投票の集計対象から外れます。ADAが失われることはありませんが、自分の票が実質的に反映されなくなるため、退任が分かったら別のDRepへ委任し直すか、自己投票に切り替えることをおすすめします。",
      keywords: ["DRep引退", "DRep退任"],
    },

    "drep-howto": {
      type: "choice",
      text: "委任のやり方で気になるのは?",
      options: [
        { label: "DRepへの委任手順は?", next: "drep-howto-delegate" },
        { label: "DRepを変更したい時は?", next: "drep-howto-change" },
        { label: "委任してもADAは動かせなくなる?", next: "drep-howto-locked" },
        { label: "DRep登録の保証金って何?", next: "drep-howto-deposit" },
        { label: "投票結果はどこで見れる?", next: "drep-howto-results" },
      ],
    },
    "drep-howto-delegate": {
      type: "answer",
      label: "DRepへの委任手順は?",
      text: "GovToolにウォレットを接続し、委任したいDRepを検索して「Delegate」を実行するのが基本的な流れです。EternlなどウォレットによってはGovToolを経由せず、ウォレット内から直接DRep委任ができるものもあります。実行時には小さなネットワーク手数料がかかります。",
      keywords: ["DRep委任", "GovTool"],
    },
    "drep-howto-change": {
      type: "answer",
      label: "DRepを変更したい時は?",
      text: "SPOへの委任と同じように、いつでも別のDRepへ委任し直すことができます。考えが変わったり、選んだDRepの投票傾向が自分と合わないと感じたりした場合は、気軽に変更して大丈夫です。",
      keywords: ["DRep変更"],
    },
    "drep-howto-locked": {
      type: "answer",
      label: "委任してもADAは動かせなくなる?",
      text: "いいえ、DRepへの委任もADAをロックするものではありません。SPOへの委任と同様、ADAは自分のウォレットに入ったまま自由に送金・使用でき、DRep委任は投票権だけを代理してもらう仕組みです。",
      keywords: ["DRepロック"],
    },
    "drep-howto-deposit": {
      type: "answer",
      label: "DRep登録の保証金って何?",
      text: "自分自身をDRepとして登録する場合(委任される側になる場合)、SPOの登録と同じように一定の保証金(deposit)が必要です。この保証金は、DRep登録を取り消した際にADAとして手元に戻ってきます。他のDRepに委任するだけの場合は、この保証金は必要ありません。",
      keywords: ["DRep保証金"],
    },
    "drep-howto-results": {
      type: "answer",
      label: "投票結果はどこで見れる?",
      text: "GovToolのガバナンスアクション一覧ページで、それぞれの議案に対する賛成・反対・棄権の集計状況をリアルタイムで確認できます。投票期間が終了した議案は、可決・否決の最終結果も同じ画面で確認できます。",
      keywords: ["投票結果"],
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
      keywords: ["自己投票"],
    },
    "drep-other-abstain": {
      type: "answer",
      label: "Abstain/No Confidenceって何?",
      text: "Abstain(棄権)は「あえてどの議案にも意見を表明しない」という意思表示のための特別なDRepです。No Confidence(不信任)は「現在提案されている執行体制そのものに反対する」という意思表示のための特別なDRepです。どちらも特定の個人ではなく、Cardanoに組み込まれた選択肢として用意されています。",
      keywords: ["Abstain", "NoConfidence", "棄権"],
    },
    "drep-other-catalyst": {
      type: "answer",
      label: "Catalystとの違いは?",
      text: "Catalystは、コミュニティのアイデアに資金(Treasuryの一部)を配分するファンドプログラムで、提案への投票にはCatalyst専用の登録が必要です。一方DRepへの委任は、プロトコルパラメータの変更などCardano全体のガバナンス議案に対する投票の仕組みで、両者は目的も投票の仕組みも別物です。",
      keywords: ["Catalyst"],
    },

    "drep-actions": {
      type: "choice",
      text: "ガバナンスアクション・議案について気になるのは?",
      options: [
        { label: "ガバナンスアクションにはどんな種類がある?", next: "drep-actions-types" },
        { label: "投票期間はどれくらい?", next: "drep-actions-period" },
        { label: "Constitutional Committee(憲法委員会)って何?", next: "drep-actions-cc" },
        { label: "SPOも投票に関わるって本当?", next: "drep-actions-spo-vote" },
      ],
    },
    "drep-actions-types": {
      type: "answer",
      label: "ガバナンスアクションにはどんな種類がある?",
      text: "主なガバナンスアクションには、プロトコルパラメータ変更、Treasury(国庫)からの資金拠出、ハードフォークの実施、憲法委員会メンバーの変更、単なる周知のためのInfo Actionなどがあります。種類によって可決に必要な賛成の割合(しきい値)が異なります。",
      keywords: ["ガバナンスアクション"],
    },
    "drep-actions-period": {
      type: "answer",
      label: "投票期間はどれくらい?",
      text: "投票期間は議案ごとにエポック単位で定められており、提出されたガバナンスアクションはこの期間内に投票を締め切ります。GovToolの各議案ページで、締め切りまでの残りエポック数を確認できます。",
      keywords: ["投票期間", "締め切り"],
    },
    "drep-actions-cc": {
      type: "answer",
      label: "Constitutional Committee(憲法委員会)って何?",
      text: "Constitutional Committee(憲法委員会)は、ガバナンスアクションがCardanoの憲法に沿っているかを確認し、承認・却下の投票を行う組織です。DRepやSPOとは別の第三の投票者として、ガバナンス全体のチェック機能を担っています。",
      keywords: ["ConstitutionalCommittee", "憲法委員会"],
    },
    "drep-actions-spo-vote": {
      type: "answer",
      label: "SPOも投票に関わるって本当?",
      text: "はい、一部のガバナンスアクション(特にプロトコルの根幹に関わるものなど)では、DRepと憲法委員会に加えてSPOも投票権を持ちます。議案の種類によって、DRep・SPO・憲法委員会のどの組み合わせの承認が必要かが決まっている、三者体制のような仕組みになっています。",
      keywords: ["SPO投票", "三者投票"],
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
- DRep配下の全19回答ノード(基本4/選び方3/委任5/その他3/議案4)を一通りクリックし、回答文が表示されることを確認する
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
- Consumes: `nodes`(3トピック+home、全94ノードのうちanswer型74件にトピックごとの`keywords`配列が揃っている状態)、`renderNode(nodeId, opts)`、`state.currentNodeId`、`state.history`
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

1. **単一ヒット**: 自由文入力欄に「シードフレーズ」と入力して送信 → `wallet-security-seed`の回答("シードフレーズ(リカバリーフレーズ)は…")が表示され、その直前に `"シードフレーズ" についてですね。` という一言が表示されることを確認する(`シードフレーズ`をkeywordsに持つのはこのノードのみのため、単一ヒットになる)

2. **複数ヒット**: 自由文入力欄に「エポック」と入力して送信(`wallet-staking-rewards`と`spo-after-epoch`の両方が`keywords: [..., "エポック"]`を持つため2件が同点でヒットする) → 「もしかして、次のどれかについて聞きたいですか?」に続けて候補ボタンが2つ表示されることを確認する。候補ボタンを1つクリックして該当の回答に遷移することを確認する

3. **ノーヒット**: 自由文入力欄に「今日の天気は?」のような無関係な文を入力して送信 → 「うまく聞き取れませんでした。下の選択肢から選んでください。」と表示され、直前にいた画面の選択肢ボタン(トップ画面にいた場合は3択)が再表示されることを確認する

- コンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add app.js
git commit -m "feat: keyword-based free text matching"
```

---

### Task 7: SPO推薦機能(リレー健全性ランキング連携)

自分が運営する `https://hfot.github.io/cardano-relay-health/` は、単一HTMLの中に `const data=[...]` という形で1,280件のプールデータ(ticker/pool/score/stake/sat/margin/fixedAda/rank等)がJSON配列として埋め込まれている。GitHub Pagesはデフォルトで`Access-Control-Allow-Origin: *`を返すため、ブラウザから`fetch()`して直接読み取れる(2026-09-04実測確認済み)。このタスクでは、このページをfetchしてS/Aグレード(スコア85点以上)のプールを5件ランダムに紹介する機能を追加する。

**Files:**
- Modify: `content/spo.js`(`spo-root`に選択肢を追加、`spo-recommend`ノードを追加)
- Modify: `app.js`(fetch・パース・ランダム抽出・描画ロジックを追加)

**Interfaces:**
- Consumes: Task 3までの`spo.js`の`nodes`、Task 2の`renderNode`/`renderNavButtons`/`appendBubble`/`clearOptions`
- Produces: `pickRandomN(arr, n)` — Task 8でも再利用する汎用のランダム抽出関数

- [ ] **Step 1: `content/spo.js`の`spo-root`に選択肢を追加する**

`"spo-root"`の`options`配列の末尾に追記する:

```js
        { label: "健全性ランキング上位のプールを見る", next: "spo-recommend" },
```

`spo-root`ノードの直後(`spo-basics`の前)に新しいノードを追加する:

```js
    "spo-recommend": {
      type: "recommend-pool",
      label: "健全性ランキング上位のプールを見る",
      loadingText: "hfot.github.io/cardano-relay-health で健全性ランキングを確認しています…",
      errorText: "現在ランキングを取得できませんでした。https://hfot.github.io/cardano-relay-health/ を直接確認してください。",
      keywords: ["ランキング", "おすすめプール", "健全性"],
    },
```

- [ ] **Step 2: `app.js`にランダム抽出関数と配列/オブジェクトの中括弧バランス抽出関数を追加する**

`buildKeywordIndex`関数の直前に追加する:

```js
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
```

- [ ] **Step 3: `buildKeywordIndex`の条件を広げる(recommend系ノードもキーワード検索対象にする)**

次のコード:

```js
    if (node.type === "answer" && Array.isArray(node.keywords)) {
```

を、次のように置き換える:

```js
    if (Array.isArray(node.keywords)) {
```

- [ ] **Step 4: `renderNode`に`recommend-pool`タイプの処理を追加する**

`if (node.type === "answer") { ... }`ブロックの直後(`return;`の後、`function goBack()`の前)に追加する:

```js
  if (node.type === "recommend-pool") {
    appendBubble(node.loadingText, "bot");
    clearOptions();
    fetchRelayHealthPools()
      .then((pools) => {
        if (!pools || pools.length === 0) throw new Error("empty");
        const good = pools.filter((p) => typeof p.score === "number" && p.score >= 85);
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
        appendBubble(node.errorText, "bot");
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      });
    return;
  }
```

- [ ] **Step 5: ローカルサーバーで手動確認する**

ブラウザをリロードし、トップ画面→「SPO(プール)選びについて」→「健全性ランキング上位のプールを見る」で以下を確認する:

- 「健全性ランキングを確認しています…」の後、数秒でS・Aグレードのプールが5件、Ticker/スコア/ステーク/委任者数/手数料つきで表示される
- 複数回実行して、表示される5件が毎回変わりうる(ランダム)ことを確認する
- 「前の質問に戻る」「トップに戻る」が正しく動くことを確認する
- ブラウザのDevToolsでネットワークを切断した状態(オフラインモード)で再度実行し、`errorText`のフォールバックメッセージが表示されることを確認する
- コンソールにエラーが出ていないこと

- [ ] **Step 6: Commit**

```bash
git add app.js content/spo.js
git commit -m "feat: SPO recommendation from relay-health ranking"
```

---

### Task 8: DRep推薦機能(TARGET15 — 集中回避のランダム推薦)

Daedalus 11.3.0のDRep Discovery Centerは、上位10 DRepの合計投票力を15%未満に抑える「Target 15」キャンペーンに基づき、投票力1.5%未満のDRepからランダムに候補を提示する設計を採用している(開発者Adam Deanの解説による)。このタスクでは同じ考え方を、自分が運営する `https://hfot.github.io/drep-terminal-v6/` のデータで再現する。このページには`const DB = {"epochs":[...], "dreps":[{rank, id, name, name_ja, category, latest_vp, change_pct, series, delegators, chg_24h, ticker}, ...], "total_vp":{"<epoch>": <数値>, ...}, ...}` という形でトップ50 DRepの投票力データ(`latest_vp`は100万ADA単位)が埋め込まれている(2026-09-04実測確認済み)。`total_vp`の最新エポックの値に対する`latest_vp`の割合が1.5%未満のDRepを候補として抽出する。

**Files:**
- Modify: `content/drep.js`(`drep-root`に選択肢を追加、`drep-recommend`ノードを追加)
- Modify: `app.js`(fetch・パース・フィルタ・描画ロジックを追加)

**Interfaces:**
- Consumes: Task 4までの`drep.js`の`nodes`、Task 7の`pickRandomN`・`extractBalancedJson`
- Produces: (他タスクから参照される新規インターフェースなし)

- [ ] **Step 1: `content/drep.js`の`drep-root`に選択肢を追加する**

`"drep-root"`の`options`配列の末尾に追記する:

```js
        { label: "TARGET15: 集中を避けたおすすめDRep", next: "drep-recommend" },
```

`drep-root`ノードの直後(`drep-basics`の前)に新しいノードを追加する:

```js
    "drep-recommend": {
      type: "recommend-drep",
      label: "TARGET15: 集中を避けたおすすめDRep",
      loadingText: "hfot.github.io/drep-terminal-v6 で投票力データを確認しています…",
      errorText: "現在データを取得できませんでした。https://hfot.github.io/drep-terminal-v6/ を直接確認してください。",
      keywords: ["TARGET15", "おすすめDRep", "集中回避"],
    },
```

- [ ] **Step 2: `app.js`にDRepデータの取得関数を追加する**

`fetchRelayHealthPools`関数の直後に追加する:

```js
const DREP_TERMINAL_URL = "https://hfot.github.io/drep-terminal-v6/";

async function fetchDrepTarget15Candidates() {
  const res = await fetch(DREP_TERMINAL_URL);
  const html = await res.text();
  const marker = "const DB";
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return null;
  const braceIdx = html.indexOf("{", markerIdx);
  if (braceIdx === -1) return null;
  const jsonText = extractBalancedJson(html, braceIdx, "{", "}");
  if (!jsonText) return null;
  const db = JSON.parse(jsonText);
  const dreps = db.dreps;
  const totalVpByEpoch = db.total_vp;
  if (!Array.isArray(dreps) || !totalVpByEpoch) return null;
  const latestEpoch = Math.max(...Object.keys(totalVpByEpoch).map(Number));
  const totalVp = totalVpByEpoch[String(latestEpoch)];
  if (!totalVp) return null;
  return dreps
    .filter((d) => typeof d.latest_vp === "number" && d.latest_vp / totalVp < 0.015)
    .map((d) => Object.assign({}, d, { sharePct: (d.latest_vp / totalVp) * 100 }));
}
```

- [ ] **Step 3: `renderNode`に`recommend-drep`タイプの処理を追加する**

Task 7 Step 4で追加した`recommend-pool`のブロックの直後に追加する:

```js
  if (node.type === "recommend-drep") {
    appendBubble(node.loadingText, "bot");
    clearOptions();
    fetchDrepTarget15Candidates()
      .then((candidates) => {
        if (!candidates || candidates.length === 0) throw new Error("empty");
        const picked = pickRandomN(candidates, 5);
        const lines = picked.map((d, i) => {
          const displayName = d.name_ja || d.name || d.id;
          const vpAda = Math.round(d.latest_vp * 1_000_000).toLocaleString();
          const sharePct = d.sharePct.toFixed(2);
          return `${i + 1}. ${displayName}(#${d.rank}) / 投票力${vpAda}₳(全体の${sharePct}%) / ${d.id}`;
        });
        appendBubble(
          "TARGET15(上位10 DRepへの集中を避ける思想)に沿って、投票力1.5%未満のDRepを5件ランダムに紹介します:\n\n" +
            lines.join("\n") +
            "\n\n委任前に各DRepの最新の投票実績をGovTool(https://gov.tools)で確認してください。",
          "bot"
        );
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      })
      .catch(() => {
        appendBubble(node.errorText, "bot");
        renderNavButtons({ showBack: state.history.length > 0, showHome: true });
      });
    return;
  }
```

- [ ] **Step 4: ローカルサーバーで手動確認する**

ブラウザをリロードし、トップ画面→「DRep選びについて」→「TARGET15: 集中を避けたおすすめDRep」で以下を確認する:

- 「投票力データを確認しています…」の後、数秒で投票力1.5%未満のDRepが5件、名前/順位/投票力(ADA換算)/シェア%/DRep IDつきで表示される
- 複数回実行して、表示される5件が毎回変わりうる(ランダム)ことを確認する
- 表示された投票力シェアがいずれも1.5%未満になっていることを目視で確認する
- オフラインモードで再実行し、`errorText`のフォールバックメッセージが表示されることを確認する
- コンソールにエラーが出ていないこと

- [ ] **Step 5: Commit**

```bash
git add app.js content/drep.js
git commit -m "feat: DRep TARGET15 recommendation from drep-terminal data"
```

---

### Task 9: 最終仕上げ・README・全体通し確認

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

全体で96ノード(選択肢20 + 回答74 + 推薦2)。ウォレット39ノード(7カテゴリ)、
SPO選び31ノード(5カテゴリ+リレー健全性ランキング連携)、DRep選び26ノード(5カテゴリ+TARGET15連携)。

SPO推薦とDRep推薦の2機能だけは例外的に外部サイトへ読み取り専用のfetchを行う
(`hfot.github.io/cardano-relay-health` と `hfot.github.io/drep-terminal-v6`。
どちらも自分が運営する無料・APIキー不要の公開ページ)。それ以外はAI・外部API不使用の完全静的動作。

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
- ノードの種類は5つ: `choice`(選択肢分岐)/ `message`(一言だけの中継)/ `answer`(終端の回答、`keywords`で自由文検索に対応)/ `recommend-pool`(SPO健全性ランキングからのランダム推薦)/ `recommend-drep`(DRep TARGET15ランダム推薦)
- `keywords`には空白を含まない単語を登録すること(照合は`ユーザー入力.includes(keyword)`のため、空白入りの複合キーワードは短い入力とマッチしない)
- `hfot.github.io`側のページ構造(埋め込みデータの変数名やフィールド名)が変わると、SPO/DRep推薦機能が壊れる。壊れた場合はまず`errorText`のフォールバックが出ることを確認し、`app.js`の`fetchRelayHealthPools`/`fetchDrepTarget15Candidates`内のマーカー文字列(`"const data="` / `"const DB"`)とフィールド名を実際のページに合わせて更新する
```

- [ ] **Step 3: 仕様書のテスト方針に沿って全体を通しで手動確認する**

ローカルサーバーを起動し、ブラウザで以下をすべて確認する:

- 3トピック(ウォレット/SPO/DRep)すべて、決定木を最後まで辿れる(行き止まりなし。合計96ノード)
- 自由文入力: キーワード単一ヒット/複数ヒット/ノーヒットの3パターンが仕様通りに動く
- SPO推薦・DRep推薦がそれぞれ正常時/オフライン時の両方で仕様通りに動く
- 「前の質問に戻る」「トップに戻る」が全トピックで正しく遷移する
- ブラウザの幅を狭めて(スマホ幅を想定)表示が崩れないことを確認する
- ブラウザコンソールにエラーが出ていないこと

- [ ] **Step 4: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: add README and gitignore"
```

---

### Task 10: Apple風デザインリニューアル

ユーザーからの追加要件(2026-09-04、実装中に受領): 「アップル風のおしゃれなやり取りができる、デザイン性の高いBOTの画面にしてほしい」。
機能・DOM構造・エンジン(app.js)は完成済みなので、このタスクは見た目だけを作り替える。

**Files:**
- Modify: `styles.css`(全面書き換え)
- Modify: `index.html`(class付与などマークアップの最小調整のみ許可)

**Interfaces:**
- Consumes: 既存のDOM要素ID(`#chat-log` `#chat-options` `#free-text-form` `#free-text-input` `#home-btn`)と、app.jsが動的に生成する要素のclass(`bubble bot` / `bubble user` / `option-btn` / `nav-btn` / `nav-buttons`)
- Produces: なし(見た目のみ)
- 制約: **app.jsは1文字も変更しない**。id/classの名前も変更しない(app.jsが参照しているため)。index.htmlのDOM構造(要素の種類・ネスト・id)も変更しない。許されるのはclass追加・meta追加・styles.cssの完全書き換えのみ。

**デザイン方向(Apple / iMessage風)**:

- [ ] **Step 1: styles.cssを全面的に書き換える**

以下のデザイン言語で書き換える(実装者のデザイン判断で細部は最良に仕上げてよいが、方向性は固定):

1. **配色**: ライトモード基調。背景はわずかに暖かい白(#f5f5f7 — Apple公式サイトの背景色)、ヘッダーは磨りガラス(backdrop-filter: blur + 半透明白)。BOTバブルは#e9e9eb(iMessageのグレー)、ユーザーバブルはiMessageブルー(#0a84ff〜#007aff)の微グラデーション。文字は#1d1d1f。
2. **フォント**: -apple-system, "SF Pro Text", "Hiragino Sans", "Yu Gothic UI", sans-serif 系スタック。見出しはletter-spacing微調整。
3. **バブル**: iMessage風の大きめ角丸(18px前後)、送信側/受信側で尻尾側の角だけ小さく。box-shadowは極薄(0 1px 2px rgba(0,0,0,.06)程度)。登場時に軽いフェード+スライドイン(@keyframes、0.25s ease-out)。
4. **選択肢ボタン**: ピル型(角丸9999px)、白背景+薄いボーダー、hoverで軽く浮く(translateY(-1px)+shadow強化)、activeで沈む。transition 0.15s。
5. **入力欄**: ピル型、フォーカス時にiOS風のフォーカスリング(box-shadow: 0 0 0 3px rgba(10,132,255,.25))。送信ボタンは円形または角丸のブルー。
6. **全体**: 余白をたっぷり取り、区切り線は極薄。max-width 640pxは維持。スクロールバーは細くスタイリング。ダークモード対応は @media (prefers-color-scheme: dark) で、Appleのダーク配色(#1c1c1e背景、#2c2c2e BOTバブル)に切り替え。
7. **アクセシビリティ**: コントラスト比を保つ(ライトモードの本文は#1d1d1fで十分)。prefers-reduced-motion でアニメーション無効化。

- [ ] **Step 2: index.htmlの最小調整**

必要な場合のみ: meta theme-color追加、classの追加。DOM構造・idは不変。

- [ ] **Step 3: ローカルサーバーで手動確認する**

- ライト/ダーク両モードで表示確認(DevToolsのエミュレーション)
- バブル・ボタン・入力欄がApple風の見た目になっている
- 全機能(選択肢クリック、自由文入力、戻る/トップ)が引き続き動作する(app.js未変更なので動くはずだが確認)
- スマホ幅(375px)で崩れない
- コンソールにエラーなし

- [ ] **Step 4: Commit**

```bash
git add styles.css index.html
git commit -m "style: Apple/iMessage-inspired visual redesign"
```

---

### Task 11: 起動画面(ヒーロー)+ デザイン最終ブラッシュアップ

ユーザー要望(2026-09-04): 「デザインをもう少しかっこよくして終了。初めの起動画面だけしっかり作ろう」。

**Files:**
- Modify: `index.html`(chat-logの直前にヒーローセクションを静的に追加)
- Modify: `styles.css`(ヒーローのスタイル+全体ポリッシュ)

**Interfaces:**
- 制約は Task 10 と同一: **app.jsは1文字も変更しない**。既存のid/class/DOM構造は不変(要素の追加は可、既存要素の変更・削除は不可)。外部リソース禁止(フォント/画像CDN不可。ロゴ等はインラインSVGで作る)。
- ヒーローの表示制御はJSを使わず、CSSの`:has()`で行う: 会話が進んだら(=chat-logのバブルが2個以上になったら)ヒーローを畳む。例: `#chat-app:has(#chat-log > .bubble:nth-child(2)) #hero { ... 縮小/非表示 ... }`。`:has()`非対応ブラウザではヒーローが出続けるだけで機能は壊れない(グレースフルデグラデーション)。

**デザイン方向**:

- [ ] **Step 1: index.htmlにヒーローセクションを追加**

`<div id="chat-log">`の直前に静的な`<section id="hero">`を追加:
1. インラインSVGのロゴマーク(Cardanoを想起させる幾何学マーク — 円環+ノードのドット等。著作権のある公式ロゴの複製はしない。オリジナルの抽象マークにする)
2. タイトル「Cardano Q&A」+ サブタイトル(1行、初心者向けであることが伝わる文)
3. 3つの特徴チップ(ウォレット / プール選び / DRep選び)— 装飾のみ、クリック不要(実操作は下の選択肢ボタンで行う)

- [ ] **Step 2: styles.cssでヒーロー+全体ポリッシュ**

1. ヒーロー: 中央寄せ、ロゴにゆっくりした浮遊/呼吸アニメーション(prefers-reduced-motion対応)、タイトルは大きめのletter-spacingを絞った見出し、アクセントのグラデーションテキスト(iOSブルー系)
2. 会話開始後: `:has()`でヒーローをスムーズに縮小(max-height+opacity+transformのtransition)
3. 全体ポリッシュ: ボタン/入力への`:focus-visible`リング統一(--focus-ring使用、Task 10レビューの残課題を解消)、微細な影・余白の調整
4. ダークモードでも成立する配色

- [ ] **Step 3: 検証**

- ライト/ダーク両方でヒーローの見た目確認
- 選択肢クリックで会話が進んだらヒーローが畳まれること
- トップに戻る(会話リセット)でヒーローが再表示されること(chat-logが1バブルに戻るため:has()条件が外れる)
- 全機能が引き続き動作、コンソールエラーなし、375pxで崩れない

- [ ] **Step 4: Commit**

```bash
git add index.html styles.css
git commit -m "style: hero startup screen + design polish"
```
