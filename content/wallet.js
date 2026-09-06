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
      text: "初心者にはEternlやLaceなどのブラウザ拡張型(ライトウォレット)が扱いやすいです。どちらもスマホ版があります。どれもADAの送受金・ステーキング・DRep委任に対応しています。まずは1つ選んで少額のADAで操作に慣れるのがおすすめです。",
      keywords: ["Eternl", "Lace", "Daedalus", "ウォレット選び", "ウォレットの選び方"],
    },
    "wallet-choose-lightnode": {
      type: "answer",
      label: "ライトウォレットとフルノードの違い",
      text: "Daedalusはブロックチェーン全体を自分の端末にダウンロードする「フルノード」型で、起動や同期に時間がかかりますが、より自立した検証ができます。EternlやLaceなどは外部のサーバーに問い合わせる「ライトウォレット」型で、インストール後すぐ使えて動作も軽いです。初心者には基本的にライトウォレットで十分です。",
      keywords: ["フルノード", "ライトウォレット", "Daedalus"],
    },
    "wallet-choose-hw": {
      type: "answer",
      label: "ハードウェアウォレットは必要?",
      text: "少額のADAを試す段階では必須ではありません。ただし、まとまった金額を長期保有する場合はLedgerやTrezorなどのハードウェアウォレットと連携すると、秘密鍵がネットに繋がらない機器の中で管理されるため安全性が大きく上がります。EternlやLaceはハードウェアウォレット連携に対応しています。",
      keywords: ["ハードウェアウォレット", "Ledger", "Trezor"],
    },
    "wallet-choose-multiapp": {
      type: "answer",
      label: "複数ウォレットアプリを併用してもいい?",
      text: "同じシードフレーズを複数のウォレットアプリ(例: EternlとLace)に読み込ませて併用することは技術的には可能です。ただし同時に別々のアプリで操作すると残高の反映がずれて見えることがあるため、普段使いは1つのアプリに絞るのがおすすめです。",
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
      text: "「送る(Send)」画面で、送り先アドレスと金額を入力して送金します。送金には小額のネットワーク手数料(トランザクション手数料)がかかり、金額はウォレットが自動計算して送金前に表示してくれます。送り先アドレスは1文字でも間違えると届かないので、コピー&ペーストかQRコード読み取りを使い、手入力は避けましょう。\n\nまた、コピーしたアドレスを別のアドレスに勝手にすり替えるウイルス(クリップボード改ざん)も存在します。ペーストした後、アドレスの**最初と最後の数文字**が一致しているか、送金前に**必ず自分の目で確認**してください。",
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
      text: "シードフレーズ(リカバリーフレーズ)は、あなたのウォレットの中身すべてを復元できる15〜24個の英単語です。**これさえあれば誰でもあなたのADAを操作できてしまう**ため、パスワード以上に厳重に扱う必要があります。ウォレット作成時に一度だけ表示されるので、必ずその場で控えてください。",
      keywords: ["シードフレーズ", "リカバリーフレーズ"],
    },
    "wallet-security-storage": {
      type: "answer",
      label: "シードフレーズの安全な保管方法",
      text: "紙に手書きして、金庫や信頼できる場所など複数の物理的な場所に分けて保管するのが基本です。スマホのメモ、スクリーンショット、クラウドストレージ、メールなど**「ネットに繋がる場所」には絶対に保存しないで**ください。写真として撮影するのも避けましょう。",
      keywords: ["保管", "バックアップ"],
    },
    "wallet-security-phishing": {
      type: "answer",
      label: "詐欺・フィッシングの見分け方",
      text: "公式サイトのURLを毎回確認し、SNSやDMで送られてきたリンクは開かないようにしましょう。**「シードフレーズを入力してください」と求めてくるサイトやサポート窓口は100%詐欺**です。公式のウォレットやガバナンスツール(GovToolなど)がシードフレーズの入力を求めることはありません。",
      keywords: ["詐欺", "フィッシング", "偽サイト"],
    },
    "wallet-security-recovery": {
      type: "answer",
      label: "パスワードを忘れた/端末を無くした",
      text: "ウォレットのログインパスワードを忘れても、シードフレーズさえあれば新しい端末に同じウォレットを復元できます。逆に**シードフレーズを無くしてしまうと、パスワードが分かっていても復元・サポートによる救済は一切できません**。だからこそシードフレーズの保管がウォレット管理の最重要ポイントです。",
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
      text: "Cardanoの報酬は約5日周期の「エポック」ごとに計算され、委任してから4エポック(約15〜20日)後に初回の報酬が届き始めます。報酬は自動でウォレット残高に加算されるので、請求などの操作は不要です。ただし2025年のPlominハードフォーク以降は、加算された報酬を引き出すにはDRepへの委任(「棄権(Abstain)」を選ぶのでも構いません)が必要です。",
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
      text: "CardanoのNFTはADAと同じウォレットの中に自動的に表示されます。EternlやLaceにはNFT専用の一覧タブがあり、画像やコレクション名が表示されます。NFTを送るときもADAと同じ「送る」画面から、送り先アドレスとNFTを選ぶだけで送金できます。",
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
        { label: "ADA取扱取引所と入出庫の注意点", next: "exchange-root" },
        { label: "取引所からウォレットへ送金する時の注意点", next: "wallet-exchange-withdraw" },
        { label: "ウォレットから取引所へ送金する時の注意点", next: "wallet-exchange-deposit" },
        { label: "コールド/ホットウォレットの違い", next: "wallet-exchange-cold-hot" },
      ],
    },
    "wallet-exchange-withdraw": {
      type: "answer",
      label: "取引所からウォレットへ送金する時の注意点",
      text: "取引所の出金画面に、あなたの個人ウォレットの「受け取る」画面で表示されたアドレスを正確にコピー&ペーストしてください。1文字でも間違えると資産が失われる可能性があります。ペースト後は、アドレスの**最初と最後の数文字**がウォレットの表示と一致しているか**必ず目で確認**しましょう(コピーしたアドレスをすり替えるウイルスへの対策です)。初めての送金では、まず少額だけ送って着金を確認してから、残りをまとめて送るのが安全です。",
      keywords: ["取引所出金"],
    },
    "wallet-exchange-deposit": {
      type: "answer",
      label: "ウォレットから取引所へ送金する時の注意点",
      text: "取引所側の入金画面に表示された、その取引所専用の入金アドレスに送金してください。取引所によっては入金時に「メモ」や「タグ」の入力が必要な場合もあるので、指示がある場合は必ず入力してください(Cardanoの入金では通常不要です)。ペースト後のアドレスの最初と最後の数文字の目視確認と、初回の少額テスト送金も忘れずに。",
      keywords: ["取引所入金"],
    },
    "wallet-exchange-cold-hot": {
      type: "answer",
      label: "コールド/ホットウォレットの違い",
      text: "ホットウォレットはインターネットに繋がった状態のウォレット(EternlやLaceなど)で、日常的な操作がしやすい反面、端末がハッキングされるリスクがあります。コールドウォレットはLedgerやTrezorのようにインターネットから切り離して秘密鍵を保管する方式で、安全性が高い分、操作の手間は少し増えます。長期保有分はコールド、日常使いする分だけホットに置くのが一般的です。",
      keywords: ["コールドウォレット", "ホットウォレット"],
    },
  },
};
