export default {
  nodes: {
    "game-root": {
      type: "choice",
      label: "🎰 スロットで遊ぶ",
      keywords: ["スロット", "ガチャ", "ゲーム", "遊び", "運命"],
      text: "🎰 **運命のスロット**へようこそ!\n\nSPOスロットは健全性ランキングの**S・Aグレードのプール**から、DRepスロットは**投票力1.5%未満のDRep**から、リールがランダムに1件を引き当てます。\n\n※これは**遊び**です。当たった相手への委任を推奨・保証するものではありません。委任は必ず自分で調べてから!\n\nどっちを回しますか?",
      options: [
        { label: "🎰 SPOスロット", next: "game-slot-pool" },
        { label: "🎰 DRepスロット", next: "game-slot-drep" },
        { label: "⚔️ SPOカードバトル", next: "game-battle" },
        { label: "🏃 ADAランナー", next: "game-runner" },
      ],
    },

    "game-runner": {
      type: "runner-game",
      label: "🏃 ADAランナー",
      keywords: ["ランナー", "横スクロール"],
    },

    "game-battle": {
      type: "spo-battle",
      label: "⚔️ SPOカードバトル",
      errorText: "カードの準備に失敗しました。時間をおいて試してください。",
      keywords: ["カードバトル", "バトル", "対戦"],
    },

    "game-slot-pool": {
      type: "slot-pool",
      label: "🎰 SPOスロット",
      loadingText: "🎰 SPOスロットの準備中… (健全性ランキングを読み込んでいます)",
      errorText: "スロットの準備に失敗しました。時間をおいて試してください。",
      keywords: ["SPOスロット"],
    },

    "game-slot-drep": {
      type: "slot-drep",
      label: "🎰 DRepスロット",
      loadingText: "🎰 DRepスロットの準備中… (投票力データを読み込んでいます)",
      errorText: "スロットの準備に失敗しました。時間をおいて試してください。",
      keywords: ["DRepスロット"],
    },
  },
};
