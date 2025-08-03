# WordTree

ブラウザ上でユーザが自由に文章を入力／ペーストし、任意の単語を選択すると、その単語に対応する多言語訳・類語・語源を即座に取得し、直感的に可視化できる軽量Webアプリケーションです。

## 機能

- **テキスト入力領域**: リッチテキストエリアでテキストを入力・ペースト
- **単語選択検知**: クリック／ドラッグで選択された単語を自動検出
- **辞書データ取得**: Free Dictionary APIを使用した辞書的な意味の取得
- **類語データ取得**: Datamuse APIを使用した類語の取得
- **結果表示UI**: サイドパネルで辞書・類語をタブ分け表示
- **ショートカットキー**: Ctrl+Shift+Kでパネル開閉

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **データ取得**: React Query (@tanstack/react-query)
- **API**: Next.js API Routes
- **辞書API**: Free Dictionary API
- **類語API**: Datamuse API
- **デプロイ**: Vercel

## セットアップ

### 前提条件

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 環境変数

現在は外部APIを使用しているため、追加の環境変数は不要です。

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. テキスト入力領域に文章を入力またはペースト
3. 任意の単語をクリックまたはドラッグで選択
4. 自動的に辞書データと類語が取得され、右側のパネルに表示
5. タブを切り替えて辞書・類語を確認

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にアカウントを作成
2. GitHubリポジトリをVercelに接続
3. 自動デプロイが実行されます

### 手動デプロイ

```bash
# Vercel CLIのインストール
npm i -g vercel

# デプロイ
vercel
```

## 開発

### プロジェクト構造

```
src/
├── app/
│   ├── api/lookup/route.ts  # APIエンドポイント
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── QueryProvider.tsx    # React Query Provider
│   ├── TextEditor.tsx       # テキスト入力コンポーネント
│   └── WordLookupPanel.tsx  # 結果表示パネル
└── hooks/
    └── useWordLookup.ts     # データ取得フック
```

### 追加予定機能

- [ ] 語源データ取得
- [ ] 翻訳機能
- [ ] 可視化機能（D3.js）
- [ ] モバイル対応の改善
- [ ] 多言語UI対応

## ライセンス

MIT License
