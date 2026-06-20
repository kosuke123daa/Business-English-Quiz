# beq（Business English Quiz）

ビジネス英語フレーズ（300問）を効率よく暗記するためのクイズアプリ。

詳しい設計・仕様は [CLAUDE.md](./CLAUDE.md) を参照してください。

## 主要機能

- 日→英 / 英→日 モード切替
- ランダム出題（グループ入場時にシャッフル）
- ✅正解 / ❌不正解 マーク（自動で次問へ）
- 🔊TTS（カスタム英文があればそちらを読み上げ、Web Speech API使用）
- ✏️英文・日本語訳のインライン編集
- 📖文法解説（Anthropic API、解説はKVにキャッシュ）
- 📤/📥 JSONエクスポート・インポート
- グループ別進捗表示（✅/❌/残り・ミニ進捗バー）
- ❌不正解まとめモード（セット内全不正解を横断出題）

## 技術スタック

- Framework: React + Vite
- Language: TypeScript（strict mode）
- Styling: Tailwind CSS + shadcn/ui 相当コンポーネント
- Storage: Vercel KV（@vercel/kv、`beq:` プレフィックスで他プロジェクトと共用環境を分離）
- AI API: Anthropic Messages API（`/api/grammar` 経由のサーバーサイドプロキシ）
- TTS: Web Speech API（ブラウザネイティブ）
- Deploy: Vercel

## セットアップ

```bash
npm install
cp .env.local.example .env.local  # ANTHROPIC_API_KEY を設定
npm run dev
```

Vercelにデプロイする場合は、ダッシュボードでKV Storageを作成してプロジェクトにリンクし、`ANTHROPIC_API_KEY` を Environment Variables に設定してください。

## スクリプト

| コマンド | 内容 |
|---|---|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | 型チェック + 本番ビルド |
| `npm run lint` | ESLint実行 |
| `npm run preview` | ビルド結果のプレビュー |

## ディレクトリ構成

```
beq/
├── api/                  # Vercel Edge Functions（KV連携）
│   ├── marks.ts          # 正解記録
│   ├── custom.ts         # カスタム英文・日本語訳
│   └── grammar.ts        # 文法解説（Anthropic API + KVキャッシュ）
├── src/
│   ├── types/            # 共通型定義
│   ├── data/biz300.ts    # フレーズデータ（300問）
│   ├── hooks/            # useMarks / useCustom / useGrammar
│   ├── components/        # SetsScreen / GroupsScreen / QuizScreen など
│   └── App.tsx
├── CLAUDE.md             # 詳細仕様
└── vercel.json
```
