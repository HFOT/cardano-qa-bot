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
