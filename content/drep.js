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
