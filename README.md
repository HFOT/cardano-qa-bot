# What's Cardano?

Cardano初心者向けに、ウォレット操作・SPO(プール)選び・DRep選び・詐欺の手口の4トピックを
チャット形式(ボタン選択+自由文入力)で案内する、完全静的なQ&Aボットです。
AI APIは使用していません。回答内容はすべて `content/*.js` に決定木として記述されています。

全体で105ノード(選択肢21 + 回答82 + 推薦2)。ウォレット39ノード(7カテゴリ)、
SPO選び31ノード(5カテゴリ+リレー健全性ランキング連携)、DRep選び26ノード(5カテゴリ+TARGET15連携)、
詐欺の手口9ノード(実際にあった8つの手口)。

外部への読み取り専用fetchは3つだけ: SPO推薦(`hfot.github.io/cardano-relay-health`)、
DRep推薦(`hfot.github.io/drep-terminal-v6`)、ADA価格表示(CoinGecko `simple/price`、無料・キー不要)。
それ以外はAI・外部API不使用の完全静的動作。

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

- 既存トピックの回答を直接編集する場合は `content/wallet.js` / `content/spo.js` / `content/drep.js` / `content/scam.js` を編集する
- 回答文の中では `**強調したい語**` の記法が使え、アクセント色の太字で表示される(実装はDOM組み立てのみで`innerHTML`不使用)
- answerノードに `embed: "https://..."` を付けると、回答の下にそのページをミニブラウザ(iframe)として埋め込める(埋め込み先がX-Frame-Options等でブロックしていないこと)
- 新しいトピックを追加する場合:
  1. `content/<topic>.js` を作成し、`export default { nodes: { "<topic>-root": {...}, ... } }` の形で決定木を書く
  2. `app.js` の先頭で `import <topic>Content from "./content/<topic>.js";` を追加する
  3. `mergeNodes()` の `Object.assign(...)` に `<topic>Content.nodes` を追加する
  4. `HOME_NODE.options` に `{ label: "表示名", next: "<topic>-root" }` を追加する
- ノードの種類は5つ: `choice`(選択肢分岐)/ `message`(一言だけの中継)/ `answer`(終端の回答、`keywords`で自由文検索に対応)/ `recommend-pool`(SPO健全性ランキングからのランダム推薦)/ `recommend-drep`(DRep TARGET15ランダム推薦)
- `keywords`には空白を含まない単語を登録すること(照合は`ユーザー入力.includes(keyword)`のため、空白入りの複合キーワードは短い入力とマッチしない)
- **デプロイ時の約束**: CSS/JS/contentを変更したら、`index.html`の`?v=`と`app.js`冒頭のimportの`?v=`を同じ番号で1つ上げること。これを忘れると、閲覧者のブラウザキャッシュで「新しいHTML+古いCSS/JS」が混ざり表示が崩れる
- `hfot.github.io`側のページ構造(埋め込みデータの変数名やフィールド名)が変わると、SPO/DRep推薦機能が壊れる。壊れた場合はまず`errorText`のフォールバックが出ることを確認し、`app.js`の`fetchRelayHealthPools`/`fetchDrepTarget15Candidates`内のマーカー文字列(`"const data="` / `"const DB"` / `"total_vp":`)とフィールド名を実際のページに合わせて更新する
