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
        { label: "先行事例に学ぶガバナンスのリスク", next: "drep-risk" },
        { label: "TARGET15: 集中を避けたおすすめDRep", next: "drep-recommend" },
      ],
    },

    "drep-risk": {
      type: "choice",
      text: "ブロックチェーンのガバナンスは、Cardanoより先に他のチェーンがいくつも**手痛い失敗**を経験しています。先行事例を知っておくと、Cardanoで「何に気をつけて見張るべきか」がはっきりします。どの事例から見ますか?",
      options: [
        { label: "The DAO事件(Ethereum分裂)", next: "drep-risk-dao" },
        { label: "Bitcoinブロックサイズ戦争", next: "drep-risk-blocksize" },
        { label: "Steem乗っ取り事件(取引所の票)", next: "drep-risk-exchange" },
        { label: "低投票率と大口支配", next: "drep-risk-turnout" },
        { label: "票の売買・買収", next: "drep-risk-bribe" },
        { label: "まとめ: Cardanoへの教訓", next: "drep-risk-summary" },
      ],
    },

    "drep-risk-dao": {
      type: "answer",
      label: "The DAO事件(Ethereum分裂)",
      text: "2016年、Ethereum上の投資ファンド「The DAO」がバグを突かれ、当時の時価で数十億円相当のETHが流出しました。コミュニティは「巻き戻すためのハードフォーク」を選びましたが、**「コードが法だ、介入すべきでない」と反対した人々が分裂**し、Ethereum Classicという別チェーンが生まれました。\n\n**教訓**: 危機のときほど「ルールを曲げてでも救済するか」で共同体は割れます。**緊急時にどう決めるかの手順を、平時に決めておくこと**の重要性を示した事件です。Cardanoが憲法や憲法委員会という「決め方のルール」を先に整備しているのは、この教訓の延長線にあります。",
      keywords: ["TheDAO", "ハードフォーク", "EthereumClassic"],
    },

    "drep-risk-blocksize": {
      type: "answer",
      label: "Bitcoinブロックサイズ戦争",
      text: "2015〜2017年、Bitcoinは「ブロックを大きくして手数料を下げるべきか」という技術論争で真っ二つになりました。**正式な意思決定の仕組みがなかった**ため、議論はSNSや企業間の駆け引きで何年も泥沼化し、最終的にBitcoin Cashという分裂で決着しました。\n\n**教訓**: 「ガバナンスの仕組みを持たない」こと自体がリスクだということです。決め方がなければ、声の大きい者・資金力のある者の場外乱闘になります。Cardanoがオンチェーン投票という**公式の決着方法**を持つのは、まさにこの反省からです。ただし仕組みがあっても、参加者が投票しなければ同じことが起こりえます。",
      keywords: ["ブロックサイズ", "BitcoinCash", "分裂"],
    },

    "drep-risk-exchange": {
      type: "answer",
      label: "Steem乗っ取り事件(取引所の票)",
      text: "2020年、SteemというチェーンでTron創業者による買収に反発したコミュニティに対し、**取引所が「預かっていた利用者のコイン」を無断でステーキングして投票**し、コミュニティ側の代表者を排除する事件が起きました。利用者の資産が、本人の知らないところで乗っ取りの道具にされたのです(その後コミュニティはHiveへ分裂)。\n\n**教訓**: **取引所にコインを置いたままにすると、あなたの票は取引所のものになりうる**ということ。Cardanoでも、取引所が大口DRepとして振る舞う懸念は常に議論されています。自分のウォレットで保有し、自分の意思で委任することが、この攻撃への一番の防御です。",
      keywords: ["Steem", "取引所票", "乗っ取り", "Hive"],
    },

    "drep-risk-turnout": {
      type: "answer",
      label: "低投票率と大口支配",
      text: "多くのDAO(分散型組織)で繰り返されてきたのが、**投票率の低さ**です。参加率が数%しかない投票では、ごく少数の大口保有者の意向がそのまま「コミュニティの総意」になってしまいます。MakerDAOなどの著名なDAOでも、実質的に少数の大口が方針を左右する状態がたびたび問題になりました。\n\n**教訓**: 仕組みがどれだけ立派でも、**参加しない多数派は「支配されることに同意した」のと同じ結果**になります。Cardanoでも上位DRepへの集中は現実の課題で、だからこそTarget 15(上位10者の合計を15%未満に)のような分散運動があり、このボットの推薦機能もその思想で作られています。あなたの委任1件が、まさにこの統計を動かします。",
      keywords: ["投票率", "大口", "MakerDAO", "無関心"],
    },

    "drep-risk-bribe": {
      type: "answer",
      label: "票の売買・買収",
      text: "DeFiの世界では、投票権に報酬を払って誘導する「**買収市場**」が実際に成立しています(Curve周辺の\"bribe\"市場が有名)。ルール上は合法な報酬でも、**票が思想ではなくお金で動く構造**になると、ガバナンスは資金力の勝負に変わります。\n\n**教訓**: Cardanoでも将来、「委任してくれたら見返りを出す」という誘いが現れる可能性はあります。見返り付きの委任勧誘を見たら、**その人は誰の利益のために投票するのか**を考えてみてください。DRep選びで「投票理由を公開しているか」を重視するのは、この買収リスクへの対抗策でもあります。",
      keywords: ["買収", "bribe", "票の売買"],
    },

    "drep-risk-summary": {
      type: "answer",
      label: "まとめ: Cardanoへの教訓",
      text: "先行事例が教えてくれるリスクを、Cardanoに引きつけてまとめます:\n\n・**決め方のルールがないと分裂する**(Bitcoin・The DAO)→ Cardanoは憲法とオンチェーン投票を先に整備した\n・**取引所預けっぱなしは票の乗っ取りリスク**(Steem)→ 自分のウォレットで持ち、自分で委任する\n・**低投票率は大口支配と同義**(多くのDAO)→ 参加率と集中度を見張る(Target 15)\n・**票はお金で買われうる**(DeFiの買収市場)→ 投票理由を公開するDRepを選ぶ\n\n仕組みは失敗から学んで作られましたが、**仕組みだけでは守れません**。最後の防衛線は、ホルダー一人ひとりが「保有し、委任し、見張る」ことです。それがこのボットがDRep委任を繰り返しおすすめする理由です。",
      keywords: ["ガバナンスリスク", "教訓", "先行事例"],
    },

    "drep-recommend": {
      type: "recommend-drep",
      label: "TARGET15: 集中を避けたおすすめDRep",
      loadingText: "hfot.github.io/drep-terminal-v6 で投票力データを確認しています…",
      errorText: "現在データを取得できませんでした。https://hfot.github.io/drep-terminal-v6/ を直接確認してください。",
      keywords: ["TARGET15", "おすすめDRep", "集中回避"],
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
      text: "はい、まったく別の委任です。SPOへの委任は**「ステーキング報酬」**のため、DRepへの委任は**「ガバナンス投票権」**のためのものです。1つのウォレットから両方に別々に委任することができ、片方だけ設定してもう片方は未設定、という状態も可能です。\n\n下のミニブラウザで、2つの委任の関係を図解したページをそのまま見られます:",
      embed: "https://hfot.github.io/cardano-two-delegations/",
      keywords: ["2つの委任", "違い"],
    },
    "drep-basics-noaction": {
      type: "answer",
      label: "投票に参加しないとどうなる?",
      text: "DRepに委任せず、自分でも投票しないままにしていても、ADAを取り上げられたり手数料を課されたりといった罰則はありません。ただし2025年のPlominハードフォーク以降は、**DRepに委任していないとステーキング報酬を引き出せません**(実在のDRepでも、既定の「棄権(Abstain)」「不信任(No-Confidence)」でも構いません)。またその分のADAは議案の集計に反映されないため、ガバナンスに自分の意見を届けたい場合は、DRepへの委任か自己投票のどちらかをしておくことをおすすめします。",
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
      keywords: ["選ぶ基準", "DRep選び", "DRepの選び方"],
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
      keywords: ["DRep委任", "GovTool", "委任手順"],
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
      keywords: ["DRep保証金", "DRep登録"],
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
