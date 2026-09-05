# 「Cardanoって結局なに?」トピック 実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** サイト名と同じ問いに答えるトピックを追加し、既存7トピックの「なぜ」を供給する。

**Architecture:** `content/basics.js` を新設し、既存の決定木エンジンにノードを足すだけで成立させる。他トピックへ送客する4ノードは、`answer` が `options` を捨てる制約のため `type: "choice"` として本文を `text` に置く。ライブ数値は専用ノード1つに隔離し、`renderNode` に新しい node type 分岐を1つ追加して実装する（既存の `recommend-pool` などと同じパターン）。

**Tech Stack:** 素の ES モジュール。ビルドツールなし。バックエンドなし。AI API 不使用。

**Spec:** `_docs/specs/2026-09-06-cardano-basics-design.md`

## Global Constraints

- **`renderNode` の既存分岐・既存ヘルパー関数は変更しない。** 追加のみ。
- **AI API を使わない。** データ取得は同一オリジン（`hfot.github.io`）の公開ファイルのみ。
- **`innerHTML` を使わない。** DOM は組み立てて追加する（既存 `buildRecommendTable` の作法）。
- **強調は `**〜**` 記法。** エンジンが `<strong>` に変換する。
- **キーワードは空白を含まない単一トークン。** マッチは `input.includes(keyword)` の最長一致。
- **自動テストは無い。** 本計画における「テスト」は次の2つを指す。
  1. `node --input-type=module --check < <file>` による構文チェック
  2. **新しいポート**で `python -m http.server` を立ててのブラウザ確認
     （ES モジュールはブラウザキャッシュが強固で `?v=` でも消えないため、
     検証のたびにポートを変える）
- **解説文に数字を埋め込まない。** 数字は `basics-now` に隔離する。
- **`?v=` は全アセットで同じ番号に上げる。** 現在 59 → 60。
- 作業ドキュメントは `_docs/` に置く（`docs/` は Jekyll が配信してしまう）。

---

## File Structure

| ファイル | 役割 | 変更 |
|---|---|---|
| `content/basics.js` | 新トピックの6ノード。決定木データのみ、ロジックを持たない | 新規 |
| `app.js` | import 1行 / `mergeNodes()` 1行 / `HOME_NODE.options` 1行 / スナップショット取得ヘルパー / `live-stats` 分岐 | 追記のみ |
| `index.html` | `?v=` の更新 | 数値のみ |

`content/basics.js` は他の `content/*.js` と同じく**データだけ**を持つ。取得やレンダリングは
すべて `app.js` 側に置き、トピックファイルは差し替え可能なままにする。

---

### Task 1: 静的な5ノードとホームへの配線

トピックが表示され、4つの送客先へ遷移できるところまで。ライブ数値は Task 2。

**Files:**
- Create: `content/basics.js`
- Modify: `app.js`（import 部・`mergeNodes()`・`HOME_NODE.options`）

**Interfaces:**
- Consumes: 既存ノードID `wallet-root` / `spo-root` / `value-root` / `drep-root`
- Produces: ノードID `basics-root` `basics-where` `basics-reward` `basics-fee` `basics-vote` `basics-who`。
  Task 2 は `basics-root` `basics-reward` `basics-vote` の `options` に1件ずつ追記する。

- [ ] **Step 1: `content/basics.js` を作る**

`basics-now` への導線は Task 2 で足すので、この時点では書かない。

```js
export default {
  nodes: {
    "basics-root": {
      type: "choice",
      label: "Cardanoって結局なに?",
      keywords: ["Cardanoとは", "カルダノとは", "Cardanoって", "カルダノって", "ADAとは"],
      text: "あなたはもうADAを持っています。では、そのADAは**何の上に乗っている**のでしょうか。\n\nCardanoを説明する言葉はたくさんありますが、ここでは**あなたのADAから逆算**して見ていきます。知りたいものを選んでください。",
      options: [
        { label: "私のADAは、どこにあるの?", next: "basics-where" },
        { label: "なぜ持っているだけで報酬が出るの?", next: "basics-reward" },
        { label: "手数料は誰が受け取っているの?", next: "basics-fee" },
        { label: "なぜ投票の仕組みがあるの?", next: "basics-vote" },
        { label: "誰が作っていて、誰が決めるの?", next: "basics-who" },
      ],
    },

    "basics-where": {
      type: "choice",
      label: "私のADAは、どこにあるの?",
      keywords: ["ADAはどこ", "どこにある"],
      text: "**ADAはウォレットの中に入っていません。**\n\nADAが記録されているのは、世界中の参加者が同じ内容を持ち合っている**台帳**(ブロックチェーン)の上です。ウォレットが持っているのは、その台帳上の自分の分を**動かすための鍵**だけです。\n\nだから、次のことが起きます。\n\n・ウォレットアプリを消しても、ADAは消えません。鍵さえあれば別のアプリから復元できます\n・**シードフレーズを失うと、誰にも助けられません。** 鍵の持ち主だけが動かせる仕組みなので、どこかに問い合わせても復旧できません\n・**シードフレーズを渡すと、全部持っていかれます。** 鍵を渡すことと同じだからです\n\n銀行のように「預かっている誰か」がいないぶん、鍵の管理がすべて自分に来ます。",
      options: [{ label: "ウォレットの操作を見る", next: "wallet-root" }],
    },

    "basics-reward": {
      type: "choice",
      label: "なぜ持っているだけで報酬が出るの?",
      keywords: ["なぜ報酬", "報酬が出る仕組み", "プルーフオブステーク", "PoS"],
      text: "Cardanoは、取引の正しさを**預けられたADAの量で守る**仕組み(プルーフ・オブ・ステーク)です。\n\n新しいブロックを作る担当は、**多くのADAを託されているところほど回ってきやすい**ように決まります。担当になったプールがブロックを作り、その報酬が委任した人にも分配される。これが「持っているだけで報酬が出る」の中身です。\n\nここが最も誤解されるところですが、\n\n・**委任してもADAはウォレットから離れません**\n・**ロックもされません。** いつでも送金できます\n・預けているのは「ADAそのもの」ではなく「**そのADAの重み**」です\n\n報酬はプールの働きに左右されるので、どのプールに委任するかで結果が変わります。",
      options: [{ label: "プールの選び方を見る", next: "spo-root" }],
    },

    "basics-fee": {
      type: "choice",
      label: "手数料は誰が受け取っているの?",
      keywords: ["手数料はどこ", "手数料の行き先", "トレジャリー"],
      text: "送金で払った手数料は、**消えるのでも、運営会社に行くのでもありません。**\n\n集められた手数料は、\n\n・一部が**トレジャリー**(共同の資金)に積まれます\n・残りが**報酬**として、ブロックを作ったプールとその委任者に配られます\n\nつまり、手数料を払う側と受け取る側が**同じ集団の中にいます**。あなたが払った手数料の一部は、あなたが委任しているプールの報酬にもなります。\n\nトレジャリーに積まれた分は、投票で使い道が決まります。どこかの会社の売上になるわけではありません。",
      options: [{ label: "ADAの価値の話を見る", next: "value-root" }],
    },

    "basics-vote": {
      type: "choice",
      label: "なぜ投票の仕組みがあるの?",
      keywords: ["なぜ投票", "ガバナンスとは", "憲法"],
      text: "**Cardanoには所有者がいません。**\n\n止められる会社もなければ、独断で仕様を変えられる人もいない。ではどうやって物事を決めるのか——**決め方そのものを決めておく**しかありません。それがガバナンスです。\n\n・**憲法**があり、何をしてよいかの枠が書かれています\n・**DRep**(代理投票者)がいて、自分の代わりに投票してくれます\n・**トレジャリーの使い道**も投票で決まります\n\nADAを持っているだけで投票権は生まれます。ただし、**自分で投票するか、DRepに委任するか、棄権するかは自分で選びます。** 何もしなければ、その分の力は使われないままになります。",
      options: [{ label: "DRepの選び方を見る", next: "drep-root" }],
    },

    "basics-who": {
      type: "answer",
      label: "誰が作っていて、誰が決めるの?",
      keywords: ["誰が作った", "開発元", "IOG", "EMURGO", "三団体"],
      text: "開発と普及は、長らく**3つの団体**が担ってきました。\n\n・**IOG**(Input Output) — 研究と開発\n・**Cardano Foundation** — 標準化と普及を担うスイスの財団\n・**EMURGO** — 事業開発\n\nただし今は、**この3団体だけで仕様変更を決められる構造ではありません。** プロトコルの変更もトレジャリーの支出も、ガバナンスの投票を経て決まります。\n\nもうひとつの特徴が進め方です。Cardanoは**先に学術論文を書き、査読を受けてから実装する**という順番を取ってきました。速さより検証を優先する設計で、良くも悪くもここが他と違う点だとよく言われます。",
    },
  },
};
```

- [ ] **Step 2: 構文チェックが通ることを確認**

Run: `cd /c/cardano-qa-bot && node --input-type=module --check < content/basics.js`
Expected: 何も出力されず終了コード 0

- [ ] **Step 3: `app.js` に import を追加**

`app.js` 冒頭、`exchangeContent` の import の**次の行**に追加する。

```js
import basicsContent from "./content/basics.js?v=59";
```

- [ ] **Step 4: `mergeNodes()` に登録**

`Object.assign` の引数末尾、`exchangeContent.nodes` の**次**に追加する。

```js
    basicsContent.nodes,
```

- [ ] **Step 5: ホーム画面の選択肢に追加**

`HOME_NODE.options` 配列の**先頭**に追加する。サイト名の問いなので最初に置く。

```js
    { label: "Cardanoって結局なに?", next: "basics-root" },
```

- [ ] **Step 6: 全モジュールの構文チェック**

Run:
```bash
cd /c/cardano-qa-bot && for f in content/*.js app.js; do node --input-type=module --check < "$f" >/dev/null 2>&1 && echo "OK   $f" || echo "FAIL $f"; done
```
Expected: 10ファイルすべて `OK`（`content/*.js` が8→9、それに `app.js`）

- [ ] **Step 7: ブラウザで導線を確認**

Run: `cd /c/cardano-qa-bot && (python -m http.server 4530 >/dev/null 2>&1 &) ; sleep 2`
`http://localhost:4530/` を開き、次を確認する。

1. ホーム画面の**先頭**に「Cardanoって結局なに?」がある
2. 押すと5つの枝が出る
3. 「私のADAは、どこにあるの?」→ 本文が出て「ウォレットの操作を見る」ボタンが出る
4. そのボタンでウォレットトピックへ遷移する
5. 同様に 報酬→SPO、手数料→ADAの価値、投票→DRep へ遷移する
6. 「誰が作っていて、誰が決めるの?」は本文のみ（送客ボタンなし）
7. 自由入力に `Cardanoとは` と打つと `basics-root` に着弾する
8. `**〜**` がアスタリスクのまま表示されていない（太字になっている）

Expected: 8項目すべて満たす。コンソールにエラーが出ない。

- [ ] **Step 8: コミット**

```bash
cd /c/cardano-qa-bot && git add content/basics.js app.js && git commit -m "Add a topic that answers the site's own name

The site is called What's Cardano? and had no topic answering it;
typing the question into the free-text box missed the keyword table
entirely. The five branches work backwards from what a holder already
has — where the ADA actually sits, why staking pays, where the fee
goes, why there is a vote — and hand off to the topic that covers the
doing.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: ライブ数値ノード `basics-now`

**Files:**
- Modify: `app.js`（取得ヘルパーの追加、`renderNode` への分岐追加）
- Modify: `content/basics.js`（`basics-now` ノードの追加、3ノードの `options` に導線追加）

**Interfaces:**
- Consumes: Task 1 の `basics-root` / `basics-reward` / `basics-vote`、既存の
  `fetchRelayHealthPools()`（`Array | null` を返す）、`buildRecommendTable(headers, rows)`、
  `appendBubble(content, sender)`、`renderNavButtons({showBack, showHome})`、`recommendSeq`
- Produces: `fetchDrepSnapshot()` → `Promise<Object | null>`、node type `"live-stats"`

- [ ] **Step 1: スナップショット取得ヘルパーを追加**

`app.js` の `fetchRelayHealthPools()` 定義の**直後**（`const DREP_TERMINAL_URL` の行の直前）に追加する。

```js
// DRep端末が毎日書き出しているスナップショット。同一オリジンなのでCORSは起きない。
const DREP_SNAPSHOT_URL = "https://hfot.github.io/drep-terminal-v6/drep-snapshot.json";

let _snapshotCache = null;

async function fetchDrepSnapshot() {
  if (_snapshotCache) return _snapshotCache;
  const res = await fetch(DREP_SNAPSHOT_URL);
  if (!res.ok) return null;
  _snapshotCache = await res.json();
  return _snapshotCache;
}
```

- [ ] **Step 2: `renderNode` に `live-stats` 分岐を追加**

`node.type === "answer"` の分岐の**直後**に追加する。既存の分岐には触れない。

```js
  if (node.type === "live-stats") {
    appendBubble(node.loadingText, "bot");
    clearOptions();
    const seq = ++recommendSeq;
    Promise.all([fetchDrepSnapshot(), fetchRelayHealthPools()])
      .then(([snap, pools]) => {
        if (seq !== recommendSeq || state.currentNodeId !== nodeId) return;
        if (!snap || !snap.totals) throw new Error("no snapshot");
        const t = snap.totals;
        const num = (n) => Math.round(n).toLocaleString();
        // totals の *_m は百万ADA単位。10億単位に直して読みやすくする。
        const bil = (m) => (m / 1000).toFixed(2) + "B₳";
        const rows = [
          ["エポック", String(snap.epoch)],
          ["ステークプール", pools ? num(pools.length) : "—"],
          ["DRep", num(t.drep_count)],
          ["DRepへの委任者", num(t.total_delegators) + "人"],
          ["アクティブステーク", bil(t.active_stake_m)],
          ["流通量", bil(t.circulation_m)],
        ];
        appendBubble(buildRecommendTable(["項目", "いまの値"], rows), "bot");
        appendBubble(
          "出典: DRep端末の公開スナップショット(" + snap.generated_at + ")と、リレー健全性ランキング。**数字は日々変わります。**",
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
```

取り直しボタンは置かない。`_snapshotCache` があるため再取得されず、押しても同じ値が出て
誤解を招くため。

- [ ] **Step 3: `basics-now` ノードを追加**

`content/basics.js` の `"basics-who"` ノードの**次**に追加する。

```js
    "basics-now": {
      type: "live-stats",
      label: "いまの数字を見る",
      keywords: ["いまの数字", "現在の数字", "DRep数", "プール数"],
      loadingText: "公開されているスナップショットから、いまの数字を取ってきます...",
      errorText: "いまは数字を取得できませんでした。取得元のページが変わったか、一時的に届かない状態です。時間をおいて試してください。",
    },
```

- [ ] **Step 4: 3ノードから導線を張る**

`basics-root` の `options` 末尾に追加する。

```js
        { label: "いまの数字を見る", next: "basics-now" },
```

`basics-reward` の `options` 末尾に追加する。

```js
        { label: "いまの数字を見る", next: "basics-now" },
```

`basics-vote` の `options` 末尾に追加する。

```js
        { label: "いまの数字を見る", next: "basics-now" },
```

- [ ] **Step 5: 構文チェック**

Run:
```bash
cd /c/cardano-qa-bot && for f in content/*.js app.js; do node --input-type=module --check < "$f" >/dev/null 2>&1 && echo "OK   $f" || echo "FAIL $f"; done
```
Expected: 全ファイル `OK`

- [ ] **Step 6: 正常系をブラウザで確認**

Run: `cd /c/cardano-qa-bot && (python -m http.server 4531 >/dev/null 2>&1 &) ; sleep 2`
`http://localhost:4531/` を開き、次を確認する。

1. `basics-root` → 「いまの数字を見る」がある
2. 押すと読み込み文が出たあと、6行の表が出る
3. エポック・DRep数・委任者数・アクティブステーク・流通量に**実際の数値**が入っている
4. ステークプール欄が `—` ではなく数値になっている
5. 表の下に取得時刻が出ている
6. `basics-reward` と `basics-vote` からも同じノードに行ける

Expected: 6項目すべて満たす。コンソールにエラーが出ない。

- [ ] **Step 7: 異常系（フォールバック）を確認**

DevTools のコンソールで取得元を潰し、`errorText` に落ちることを確認する。

```js
window.fetch = () => Promise.resolve({ ok: false });
```

これを実行してからトップに戻り、再度「いまの数字を見る」を押す。

Expected: 表は出ず、`errorText` の文が出て、戻る/トップのボタンが出る。ページは壊れない。

- [ ] **Step 8: コミット**

```bash
cd /c/cardano-qa-bot && git add content/basics.js app.js && git commit -m "Show the current figures in one node instead of in the prose

DRep count, delegator count, epoch and pool count all come from files
this site already reads from the same origin, and the snapshot behind
them refreshes daily — so they can be stated rather than avoided.

They live in a node of their own. Inside the explanations, a failed
fetch would leave a sentence with a hole in it, and the reader would
have no way to tell which moment the numbers belonged to.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: デプロイと公開後の確認

**Files:**
- Modify: `index.html`（`?v=`）
- Modify: `app.js`（content import の `?v=`）

- [ ] **Step 1: 全アセットの `?v=` を 60 に上げる**

```bash
cd /c/cardano-qa-bot && sed -i 's|?v=59|?v=60|g' index.html && sed -i 's|\(\./content/[a-z]*\.js\)?v=[0-9]*|\1?v=60|' app.js && grep -n '?v=' index.html && grep -c '?v=60' app.js
```
Expected: `index.html` の6箇所（og:image・favicon3種・css・app.js）と `app.js` の9箇所（`basics.js` が増えて9になる）がすべて 60

- [ ] **Step 2: 最終の構文チェック**

Run:
```bash
cd /c/cardano-qa-bot && for f in content/*.js app.js; do node --input-type=module --check < "$f" >/dev/null 2>&1 && echo "OK   $f" || echo "FAIL $f"; done
```
Expected: 全ファイル `OK`

- [ ] **Step 3: リモートに未取込の変更がないか確認**

```bash
cd /c/cardano-qa-bot && git fetch origin -q && git log --oneline HEAD..origin/master | cat
```
Expected: 何も出ない。出た場合は `git pull --rebase` してから Step 2 に戻る。

- [ ] **Step 4: コミットして push**

```bash
cd /c/cardano-qa-bot && git add -A && git commit -m "Bump every ?v= to 60 for the new topic

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>" && git push origin HEAD
```

- [ ] **Step 5: Pages のビルド完了を待つ**

```bash
for i in 1 2 3 4 5 6; do s=$(gh api repos/HFOT/cardano-qa-bot/pages/builds/latest --jq '.status'); echo "$i: $s"; [ "$s" = "built" ] && break; sleep 20; done
```
Expected: `built`

- [ ] **Step 6: 公開後の確認**

```bash
echo "版数:"; curl -s "https://hfot.github.io/cardano-qa-bot/index.html" | grep -o '?v=[0-9]*' | sort -u
echo "新トピック配信:"; curl -s -o /dev/null -w "%{http_code}\n" "https://hfot.github.io/cardano-qa-bot/content/basics.js?v=60"
echo "_docs が非公開であること:"; curl -s -o /dev/null -w "%{http_code}\n" "https://hfot.github.io/cardano-qa-bot/_docs/specs/2026-09-06-cardano-basics-design.md"
```
Expected: 版数は `?v=60` のみ / `basics.js` は `200` / `_docs` は `404`

`_docs` が 404 でなかった場合、Jekyll の除外が効いていないので、仕様書と計画書を
repo 外へ退避してから push し直す。

- [ ] **Step 7: 公開サイトで最終確認**

`https://hfot.github.io/cardano-qa-bot/` を開き、Task 1 Step 7 の8項目と
Task 2 Step 6 の6項目を実機で確認する。スマホ幅(412px)でも新しい選択肢が
はみ出していないことを見る。

---

## Self-Review

**Spec coverage**

| 仕様の項目 | 対応 |
|---|---|
| 新規 `content/basics.js`、接頭辞 `basics-` | Task 1 Step 1 |
| ホーム先頭に追加 | Task 1 Step 5 |
| 5枝＋送客4本 | Task 1 Step 1 |
| 送客ノードは `type: "choice"` | Task 1 Step 1（4ノードすべて choice、`basics-who` のみ answer） |
| app.js 3箇所の配線 | Task 1 Step 3-5 |
| 自由入力キーワード | Task 1 Step 1（`basics-root` の keywords）、確認は Step 7-7 |
| 載せる数字5種 | Task 2 Step 2 の rows |
| 載せない数字（トレジャリー・報酬率） | 本文・表のどちらにも登場しない |
| 数字は専用ノードに隔離 | Task 2 Step 3 |
| `generated_at` の併記 | Task 2 Step 2 |
| 新 node type 分岐で実装、既存分岐は触らない | Task 2 Step 2 |
| 取得失敗時は `errorText` | Task 2 Step 2 の `.catch`、確認は Step 7 |
| 構文チェック → 新ポートで手動確認 | 各タスクの Step |
| `?v=` 一括更新 | Task 3 Step 1 |
| `_docs/` の 404 実測 | Task 3 Step 6 |

**Placeholder scan:** 「適切に」「必要に応じて」の類は無し。全ステップに実コードまたは実コマンドあり。

**Type consistency:** `fetchDrepSnapshot()` は Task 2 Step 1 で定義し Step 2 で使用。
`fetchRelayHealthPools()` / `buildRecommendTable()` / `appendBubble()` / `renderNavButtons()` /
`clearOptions()` / `recommendSeq` は既存（`app.js` に定義済み）を参照。
ノードIDは Task 1 で定義したものを Task 2 でそのまま使用。`?v=` は 59（Task 1-2）→ 60（Task 3）で一貫。
