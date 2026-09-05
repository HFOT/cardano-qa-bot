export default {
  nodes: {
    "exchange-root": {
      type: "choice",
      text: "ADAを取り扱う国内サービスと、入出庫時の注意点を確認できます。**『ADA取扱い』でも、板取引・販売所・外部入出庫の対応範囲は同じではありません。** 分からないことは公式情報を確認し、判断できなければ送付前に取引所やプロジェクトへ直接問い合わせるのが基本です。",
      options: [
        { label: "情報は誰に確認すればいい?", next: "exchange-information-source" },
        { label: "主要サービスを比較する", next: "exchange-services" },
        { label: "取引所と販売所の違い", next: "exchange-types" },
        { label: "ADA入庫時に確認される項目", next: "exchange-deposit-checks" },
        { label: "トラベルルールとは?", next: "exchange-travel-rule" },
        { label: "よくある誤入庫・取り出せない例", next: "exchange-stuck-cases" },
        { label: "ADA送付前の最終チェック", next: "exchange-ada-checklist" },
      ],
    },

    "exchange-information-source": {
      type: "answer",
      label: "情報は誰に確認すればいい?",
      text: "判断の優先順位は、**①プロジェクトや取引所の公式サイト・取引画面 ②分からなければ公式サポートへ直接問い合わせ ③コミュニティ、SNS、動画、知人の話はアドバイスとして参考にする**、です。\n\n暗号資産の取扱い、入出庫停止、対応ネットワーク、最低数量、トラベルルールの入力項目は変更されます。他の人が以前送れたという話だけで判断せず、**自分が利用する取引所の現在の画面と公式回答**を確認してください。問い合わせるときは、秘密鍵やシードフレーズを絶対に渡さず、通貨名、ネットワーク、送付元・送付先サービス、予定数量を伝えます。",
      keywords: ["問い合わせ", "公式情報", "誰に聞く", "サポート", "コミュニティの情報"],
    },

    "exchange-types": {
      type: "answer",
      label: "取引所と販売所の違い",
      text: "**取引所(板取引)**は、利用者の売り注文と買い注文をマッチングします。指値・成行を選べ、販売所より価格差を抑えやすい一方、希望価格で約定しない場合があります。\n\n**販売所**は、交換業者が提示する価格で業者と直接売買します。操作と成立は分かりやすい一方、買値と売値の差(スプレッド)が実質的なコストになります。『売買手数料無料』でもスプレッドがゼロとは限りません。",
      keywords: ["取引所と販売所", "板取引", "販売所", "スプレッド"],
    },

    "exchange-services": {
      type: "choice",
      text: "一般利用者向けの主なADA取扱サービスです。確認したいサービスを選んでください。区分や入出庫条件は変更されるため、実際の送付前には各社のログイン後画面も確認してください。",
      options: [
        { label: "bitbank", next: "exchange-bitbank" },
        { label: "GMOコイン", next: "exchange-gmo" },
        { label: "SBI VCトレード", next: "exchange-sbi" },
        { label: "BITPOINT", next: "exchange-bitpoint" },
        { label: "OSL Japan", next: "exchange-osl" },
        { label: "Binance Japan", next: "exchange-binance" },
        { label: "BitTrade・OKJ", next: "exchange-bittrade-okj" },
        { label: "楽天ウォレット・CoinTrade", next: "exchange-rakuten-cointrade" },
      ],
    },

    "exchange-bitbank": {
      type: "answer",
      label: "bitbank",
      text: "**区分: 取引所(板取引)・販売所**\n\nADAの外部入出庫に対応しています。暗号資産を入庫すると、送付人情報と入金目的などを登録するまで『未反映入金』となり、口座残高へ反映されません。入金元が自分のプライベートウォレットか、他の取引所かも区別して登録します。ADAとCardanoネイティブトークン/NFTを同じトランザクションで送る、またはスマートコントラクトから直接送ると、自動反映されず回復が有償・不能になる可能性があります。",
      keywords: ["bitbank", "ビットバンク", "未反映入金"],
    },

    "exchange-gmo": {
      type: "answer",
      label: "GMOコイン",
      text: "**区分: 取引所(現物・板取引)・販売所**\n\nADAは取引所、販売所、つみたて暗号資産、ステーキングの対象です。外部ウォレットからの預入にも対応しています。送付時はキャンセルできないため、Cardanoの入金アドレス、数量、入出庫停止情報を毎回確認し、初回は少額でテストしてください。",
      keywords: ["GMOコイン", "GMO", "ADA取引所"],
    },

    "exchange-sbi": {
      type: "answer",
      label: "SBI VCトレード",
      text: "**区分: ADAは販売所(現物)**\n\nADAの入出庫とステーキングに対応しています。販売所では業者提示価格で売買するため、表示された買値と売値の差も確認してください。取引所全体に板取引機能があっても、ADAが板取引対象とは限らないため、サービス名ではなくADAの個別取引画面で判断します。",
      keywords: ["SBI VC", "SBI VCトレード"],
    },

    "exchange-bitpoint": {
      type: "answer",
      label: "BITPOINT",
      text: "**区分: BITPOINTは販売所、BITPOINT PROは取引所(板取引)**\n\nADAは両サービスの対象として案内されています。外部入出庫、最低数量、手数料、送付可能な相手先は変更されることがあるため、送付直前にADAの入出金画面で確認してください。販売所とPROでは価格の決まり方が違います。",
      keywords: ["BITPOINT", "ビットポイント", "BITPOINT PRO"],
    },

    "exchange-osl": {
      type: "answer",
      label: "OSL Japan",
      text: "**区分: 販売所**\n\n公式案内ではADAの売買と入出庫に対応しています。確認時点の案内では、ADAの入金最小数量は1 ADA、出金最小数量は10 ADAです。数量や手数料は変更される可能性があるため、取引前に最新の取引金額案内を確認してください。",
      keywords: ["OSL", "OSL Japan", "CoinBest"],
    },

    "exchange-binance": {
      type: "answer",
      label: "Binance Japan",
      text: "**区分: 取引所(現物)**\n\nADAを含む暗号資産の現物取引と外部入出庫を提供しています。複数ネットワークの選択肢が表示される場合でも、送付元と入庫先のネットワークを必ず一致させてください。日本の利用者はBinance Globalの一般情報だけで判断せず、Binance Japanで現在利用可能なADAペア、ネットワーク、送付先をログイン後画面で確認します。",
      keywords: ["Binance", "バイナンス", "Binance Japan"],
    },

    "exchange-bittrade-okj": {
      type: "answer",
      label: "BitTrade・OKJ",
      text: "**区分: 取引所・販売所の提供あり(ADAの現行対象は個別確認)**\n\n両社とも金融庁の登録一覧でADA取扱業者として掲載されています。ただし、売買できるサービス区分、ADA/JPYペア、外部入出庫、最低数量は変わる可能性があります。『会社がADAを取り扱う』ことと『今この画面で板取引・入庫できる』ことを分け、ログイン後の銘柄別画面で最終確認してください。",
      keywords: ["BitTrade", "ビットトレード", "OKJ", "オーケーコイン"],
    },

    "exchange-rakuten-cointrade": {
      type: "answer",
      label: "楽天ウォレット・CoinTrade",
      text: "**区分: 販売所型を中心に確認**\n\n両サービスの運営会社は金融庁の登録一覧でADA取扱業者として掲載されています。一方、ADAの売買対応、ステーキング、外部入出庫は別機能です。保有やステーキングが可能でも自由な外部送付が同じ条件で可能とは限りません。利用時点のADA入出庫画面と取引説明書を確認してください。",
      keywords: ["楽天ウォレット", "CoinTrade", "コイントレード"],
    },

    "exchange-deposit-checks": {
      type: "answer",
      label: "ADA入庫時に確認される項目",
      text: "交換業者によって名称は異なりますが、主に **入金元(自己管理ウォレット/取引所)、送付人が本人か第三者か、氏名・国・住所、送付元サービス名、入金目的、送付元アドレス、TxID** が確認されます。法人や第三者送付では、法人情報、所在地、実質的支配者、口座名義人との関係などが追加される場合があります。内容が不正確、または未登録だと、入金が未反映になったり取引が制限されたりすることがあります。",
      keywords: ["入庫時", "確認項目", "送付人情報", "入金目的", "TxID"],
    },

    "exchange-travel-rule": {
      type: "answer",
      label: "トラベルルールとは?",
      text: "日本では2023年6月1日から、交換業者が別の交換業者へ暗号資産を移転するとき、送付人・受取人の氏名や住所・識別情報、送付元・送付先アドレスなどの一定情報を通知・保存する仕組みが施行されています。自己管理ウォレットは業者間の通知義務から外れる場合がありますが、**無確認になるわけではありません**。マネーロンダリング対策や外為法上の確認として、ウォレット所有者、相手方、目的などの申告を求められることがあります。また、交換業者間でも送付先や情報通知システムの組み合わせにより直接送付できない場合があります。",
      keywords: ["トラベルルール", "Travel Rule", "自己管理ウォレット", "アンホステッドウォレット"],
    },

    "exchange-stuck-cases": {
      type: "choice",
      text: "ブロックチェーン上では取引所のアドレスへ到着していても、取引所の口座画面で扱えず、利用者自身では取り出せないことがあります。代表例を選んでください。",
      options: [
        { label: "ADAと別トークン/NFTを一緒に送った", next: "exchange-stuck-native-token" },
        { label: "スマートコントラクトから直接送った", next: "exchange-stuck-contract" },
        { label: "ERC-20・ラップ資産・違うネットワーク", next: "exchange-stuck-network" },
        { label: "出金元や古いアドレスへ送り返した", next: "exchange-stuck-address" },
        { label: "入庫数量・情報登録が足りない", next: "exchange-stuck-reflection" },
      ],
    },

    "exchange-stuck-native-token": {
      type: "answer",
      label: "ADAと別トークン/NFTを一緒に送った",
      text: "**よく知られたCardano固有の例です。** CardanoではADAとネイティブトークン/NFTを同じUTxOに入れて送れます。そのため、ADA入庫アドレスへ別トークンも一緒に届くことがあります。しかし、取引所がそのトークンを口座へ記帳・出庫する機能を持っていなければ、画面には表示されず、利用者は秘密鍵も持っていないため自分では取り出せません。bitbankも、このケースを有償回復できる『可能性がある』例として挙げていますが、回復は保証していません。**取引所へ送るUTxOにはADAだけが含まれることを確認**してください。",
      keywords: ["ネイティブトークン", "NFTを取引所", "トークンが取り出せない", "UTxO"],
    },

    "exchange-stuck-contract": {
      type: "answer",
      label: "スマートコントラクトから直接送った",
      text: "DEX、レンディング、報酬請求などのスマートコントラクトから取引所のADA入庫アドレスへ直接送ると、通常入庫と異なる取引構造のため自動検知・記帳されないことがあります。bitbankは、スマートコントラクトを利用したADA送付を、有償回復できる可能性はあるものの保証できない例として案内しています。**一度自分の通常ウォレットで受け取り、残高と同梱資産を確認してから取引所へ送る**のが安全です。",
      keywords: ["スマートコントラクトから送金", "DEXから取引所", "報酬を直接送る"],
    },

    "exchange-stuck-network": {
      type: "choice",
      text: "同じ銘柄名やティッカーでも、チェーンとトークン規格が違えば別の資産です。どの例を確認しますか?",
      options: [
        { label: "ERC-20を間違って送った", next: "exchange-stuck-erc20" },
        { label: "ラップドADAを送った", next: "exchange-stuck-wrapped" },
        { label: "ERC-20とBEP-20を間違えた", next: "exchange-stuck-evm-network" },
        { label: "ブリッジ資産をそのまま送った", next: "exchange-stuck-bridged" },
        { label: "間違った後にしてはいけないこと", next: "exchange-stuck-aftercare" },
      ],
      keywords: ["違うネットワーク", "BEP20 ADA", "ラップドADA", "Cardanoネットワーク"],
    },

    "exchange-stuck-erc20": {
      type: "answer",
      label: "ERC-20を間違って送った",
      text: "**ERC-20はEthereum上のトークン規格で、Cardanoネイティブ資産とは別物です。** Ethereum上の未対応ERC-20トークンを取引所のETH/ERC-20入庫アドレスへ送ると、オンチェーンでは成功しても取引所口座に記帳されないことがあります。Cardano形式のアドレスとEthereum形式のアドレスは異なるため通常は入力時に弾かれますが、取引所が表示したEVM系アドレスへ『対応していないERC-20』を送るケースは成立してしまいます。回復サービスを用意する取引所もありますが、対象トークン・ネットワーク・手数料に条件があり、回復できない場合もあります。",
      keywords: ["ERC20", "ERC-20", "未対応ERC20", "Ethereumトークン"],
    },

    "exchange-stuck-wrapped": {
      type: "answer",
      label: "ラップドADAを送った",
      text: "**ラップドADAは、Cardanoメインネット上のネイティブADAそのものではありません。** たとえばBNB Smart Chain上のBinance-Peg Cardano Tokenは、ティッカーがADAでもBEP-20トークンです。これを国内取引所の『Cardano ADA入庫』として送ってはいけません。まず、そのラップ資産とネットワークを正式にサポートするサービスでネイティブADAへ戻す必要があります。名称や価格が同じに見えても、**チェーン名・ネットワーク・コントラクトアドレス**まで一致しているか確認してください。",
      keywords: ["wrapped ADA", "ラップドADA", "Binance-Peg Cardano", "ペグADA"],
    },

    "exchange-stuck-evm-network": {
      type: "answer",
      label: "ERC-20とBEP-20を間違えた",
      text: "EthereumとBNB Smart ChainなどのEVM系ネットワークでは、同じ0x形式のアドレスを使えるため、**アドレスが正しく見えてもネットワークだけが違う**誤送付が起きます。ERC-20入庫しか対応しない取引所へBEP-20で送ると、自動反映されません。自己管理ウォレットなら同じ秘密鍵で該当ネットワークへ接続して回収できる場合がありますが、取引所アドレスでは秘密鍵を利用者が持たないため、取引所の回復対応に依存します。",
      keywords: ["ERC20とBEP20", "BEP20", "0xアドレス", "EVM誤送付"],
    },

    "exchange-stuck-bridged": {
      type: "answer",
      label: "ブリッジ資産をそのまま送った",
      text: "ブリッジを通ったUSDC、ETH、BTCなどは、移動先チェーン上では元資産を表す別トークンです。たとえばCardano上のブリッジ版トークンを、取引所のEthereum版USDCやBTC入庫先へそのまま送ることはできません。取引所が**その資産・そのチェーン・そのトークン識別子(コントラクトアドレスやCardanoのポリシーID)**をすべてサポートしている必要があります。対応が明記されていなければ、ブリッジの公式手順で元の資産へ戻してから送付します。",
      keywords: ["ブリッジ資産", "bridged token", "ポリシーID", "コントラクトアドレス"],
    },

    "exchange-stuck-aftercare": {
      type: "answer",
      label: "間違った後にしてはいけないこと",
      text: "誤送付後は、**『回収できます』とDMしてくる人へ秘密鍵・シードフレーズを渡さないでください。** 追加送金や復旧手数料を個人アドレスへ要求する相手も信用しません。まずTxID、送付日時、数量、資産名、送付元・送付先アドレス、利用ネットワーク、トークン識別子を保存し、受取側の公式サポートへ直接問い合わせます。自己管理ウォレットであっても、不明な復旧サイトへシードフレーズを入力せず、利用したウォレットやプロジェクトの公式窓口へ確認してください。",
      keywords: ["誤送付後", "回収詐欺", "復旧", "リカバリー詐欺"],
    },

    "exchange-stuck-address": {
      type: "answer",
      label: "出金元や古いアドレスへ送り返した",
      text: "以前取引所から出金されたときにブロックエクスプローラーへ表示された**送信元アドレスは、自分専用の入庫アドレスとは限りません**。そこへ送り返しても口座に反映されないことがあります。また、取引所の入庫アドレスは変更・廃止・期限切れになることがあります。過去の履歴、保存したアドレス帳、スクリーンショット、以前のQRコードを再利用せず、**入金のたびに取引所へログインし、その時点の『ADA入庫』画面に表示されたアドレスを取得**してください。変更の告知を見ていなくても、現在の公式画面を正として確認します。",
      keywords: ["送り返す", "出金元アドレス", "古いアドレス", "期限切れアドレス"],
    },

    "exchange-stuck-reflection": {
      type: "answer",
      label: "入庫数量・情報登録が足りない",
      text: "正しいアドレスへ届いても、最低入庫数量未満、必要承認数の不足、ウォレットメンテナンス、送付人情報の未登録などで口座へ反映されないことがあります。特に国内交換業者では、トラベルルールや外為法対応の情報登録が完了するまで『未反映』になる場合があります。TxIDでオンチェーン到着を確認し、取引所の未反映入金画面を確認したうえで、解決しなければ公式サポートへ問い合わせてください。",
      keywords: ["最低入庫数量", "反映されない", "承認数", "メンテナンス"],
    },

    "exchange-ada-checklist": {
      type: "answer",
      label: "ADA送付前の最終チェック",
      text: "送付前に確認: **①Cardanoメインネットである ②入金のたびにログインし、現在の入庫画面からアドレスを取得する ③過去のアドレス帳やQRコードを再利用しない ④最低入庫数量を満たす ⑤入出庫停止中でない ⑥送付人情報を登録できる ⑦アドレスの先頭と末尾を目視確認 ⑧初回・アドレス変更後は少額テスト ⑨TxIDを保存**。\n\nADAとネイティブトークン/NFTを同じ送付に含めず、DEXやスマートコントラクトから交換業者へ直接送るのも避けます。BNB Smart Chainなど別ネットワーク上のラップドADAをCardanoの入庫アドレスへ送ってはいけません。誤送付は取消不能で、回復できない場合があります。",
      keywords: ["送付前", "入庫注意", "誤送付", "Cardanoメインネット", "テスト送金"],
    },
  },
};
