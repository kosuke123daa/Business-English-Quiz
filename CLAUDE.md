# ビジネス英語学習アプリ (beq)

## 識別子

`beq` （Business English Quiz）

## リソース命名規則（Vercel共用環境）

| リソース | ルール | 例 |
|---|---|---|
| PostgreSQL | `beq_` プレフィックス | `beq_users` |
| KV / Redis | `beq:` プレフィックス | `beq:marks:biz300` |
| Vercel Blob | `/beq/` ルート | `/beq/exports/` |
| Edge Config | `beqSettings` オブジェクト | `beqSettings.featureFlags` |

v1 では KV のみ使用。Postgres・Blob・Edge Config は v2 以降。

## 技術スタック

- Framework: React + Vite
- Language: TypeScript（strict mode）
- Styling: Tailwind CSS + shadcn/ui
- Storage: Vercel KV（@vercel/kv）
- AI API: Anthropic Messages API（サーバーサイドプロキシ経由）
- TTS: Web Speech API（ブラウザネイティブ、無料）
- Deploy: Vercel

DocuSign SDK はこのアプリでは未使用（標準スタックとして記載のみ）

## アプリ概要

ビジネス英語フレーズ（300問）を効率よく暗記するためのクイズアプリ。

### 画面構成（3階層）

```
SetsScreen        フレーズ集選択（進捗バー付き）
└ GroupsScreen    グループ選択（20問ずつ G1〜G15）
  └ QuizScreen    クイズ本体
```

## 主要機能

- 日→英 / 英→日 モード切替
- ランダム出題（グループ入場時にシャッフル）
- ✅正解 / ❌不正解 マーク（自動で次問へ）
- 🔊TTS（カスタム英文があればそちらを読み上げ）
- ✏️英文・日本語訳のインライン編集
- 📖文法解説（Anthropic API、解説はKVにキャッシュ）
  - 失敗時：3秒後自動リトライ → 失敗なら手動リトライボタン
- 📤/📥JSONエクスポート・インポート
- グループ別進捗表示（✅/❌/残り・ミニ進捗バー）
- ❌不正解まとめモード（セット内全不正解を横断出題）

## KV キー設計（全て `beq:` プレフィックス）

| キー | 型 | 内容 |
|---|---|---|
| `beq:marks:{setId}` | `Record<number, "o"\|"x">` | 正解・不正解記録 |
| `beq:cja:{setId}` | `Record<number, string>` | カスタム日本語訳 |
| `beq:cen:{setId}` | `Record<number, string>` | カスタム英文 |
| `beq:gc:{phraseId}` | `string` | 文法解説キャッシュ（フレーズ単位） |

v1 はシングルユーザー想定。マルチユーザー化するときはキーに `:{userId}` を追加。

## ファイル構成

```
beq/
├── api/
│   ├── marks.ts      # GET/POST 正解記録（KV）
│   ├── custom.ts     # GET/POST カスタム翻訳（KV）
│   └── grammar.ts    # GET/POST 文法解説（KV + Anthropic プロキシ）
├── src/
│   ├── types/
│   │   └── index.ts  # 共通型定義
│   ├── data/
│   │   └── biz300.ts # フレーズデータ（RAW文字列 + parseRaw）
│   ├── utils/
│   │   └── shuffle.ts
│   ├── hooks/
│   │   ├── useMarks.ts    # 正解記録の取得・更新
│   │   ├── useCustom.ts   # カスタム翻訳の取得・更新
│   │   └── useGrammar.ts  # 文法解説の取得
│   ├── components/
│   │   ├── SetsScreen.tsx
│   │   ├── GroupsScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── EditBox.tsx    # 英文・日本語訳の編集UI（共通）
│   │   └── ui/            # shadcn/ui コンポーネント
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
├── CLAUDE.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.ts
└── vercel.json
```

## 環境変数（.env.local）

```
ANTHROPIC_API_KEY=sk-ant-...
```

Vercel ダッシュボードの Environment Variables にも同じ値を設定すること。KV は Vercel ダッシュボードで Storage を作成してプロジェクトにリンクすると `KV_URL` 等が自動注入される。

## 実装上の注意事項

### React アンチパターン

- `renderJa()` / `renderEn()` は通常のJS関数として定義し `{renderJa(id)}` で呼ぶ
- コンポーネント内で `const JaText = () => ...` を定義して `<JaText />` で使うのは禁止（レンダリングのたびに別コンポーネントと認識されクラッシュする）

### shadcn/ui の使用推奨コンポーネント

| 用途 | コンポーネント |
|---|---|
| カード（セット・グループ） | Card |
| 進捗バー | Progress |
| 編集テキストエリア | Textarea |
| ボタン全般 | Button |
| バッジ（編集済・完了） | Badge |
| タブ（モード・フィルター） | Tabs |

## データ取得戦略

- 初回ロード時に全セットの marks / cja / cen を並列取得（Promise.all）
- 文法解説はオンデマンド取得（「文法解説を見る」ボタン押下時）
- 取得済み文法解説はローカル state にキャッシュ（ページリロードで再取得）

## JSONインポート時の処理

- en / ja がオリジナルと同値なら cen / cja に保存しない（無駄なカスタムを防ぐ）
- grammar は /api/grammar POST ではなく直接 KV に書き込む（インポート用エンドポイントを別途用意するか、クライアントから grammar API に PUT で送る）

## 元の Artifact 版からの主な変更点

| 項目 | Artifact 版 | Vercel 版 |
|---|---|---|
| ストレージ | window.storage | Vercel KV |
| Anthropic API | クライアントから直接呼び出し | /api/grammar 経由（APIキー秘匿） |
| データ永続性 | Artifactバージョン依存 | URL固定・永続 |
| 認証 | なし | v1なし（URL非公開で運用） |
| 言語 | JavaScript | TypeScript |
