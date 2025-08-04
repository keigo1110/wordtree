# WordTree

ブラウザ上でユーザーが自由に文章を入力し、任意の単語を選択すると、その単語に対応する辞書的な意味と類語を即座に取得し、直感的に可視化できる軽量Webアプリケーションです。

## 機能

- **多言語対応**: 日本語と英語の両方に対応
- **辞書検索**: 単語の詳細な意味と定義を表示
- **類語検索**: 関連する類語と対義語を表示
- **翻訳機能**: 30言語以上の多言語翻訳を提供
- **自動言語判定**: 入力された単語の言語を自動判定
- **リアルタイム検索**: 単語選択時に即座に結果を表示
- **レスポンシブデザイン**: モバイル・デスクトップ両対応

## 技術スタック

- **フレームワーク**: Next.js 15.4.5 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: React Query
- **日本語辞書**: Japanese WordNet (83,168単語)
- **英語辞書**: Datamuse API (Open English WordNet)
- **多言語翻訳**: Open Multilingual Wordnet (OMW)
- **デプロイ**: Vercel

## セットアップ

### 前提条件

- Node.js 18.0.0以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd wordtree

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

### データセットの準備

Japanese WordNetデータとOMWデータを自動的に処理するスクリプトが含まれています：

```bash
# Japanese WordNetデータ処理
node scripts/process-japanese-wordnet.js

# OMWデータのダウンロードと処理
npm run data:update
```

### 完全なセットアップ手順

```bash
# 1. リポジトリをクローン
git clone <repository-url>
cd wordtree

# 2. 依存関係をインストール
npm install

# 3. データセットの準備
npm run data:update

# 4. 開発サーバーを起動
npm run dev
```

**注意**: `npm run data:update`は初回のみ必要です。これにより約32MBの翻訳データが生成されます。

## 使用方法

1. ブラウザで `http://localhost:3000` にアクセス
2. テキストエリアに文章を入力またはペースト
3. 調べたい単語を選択（ダブルクリックまたはドラッグ）
4. 右側のパネルで辞書的な意味と類語を確認
5. 検索履歴は自動的に保存され、過去の検索結果を参照可能

### 検索機能

- **日本語単語**: Japanese WordNetから詳細な意味と類語を取得
- **英語単語**: Datamuse APIから英語の類語と関連語を取得
- **多言語翻訳**: OMWから30言語以上の翻訳を取得
- **自動言語判定**: 入力された単語の言語を自動で判定
- **リアルタイム検索**: 単語選択時に即座に結果を表示

## ライセンス

### Japanese WordNet

このプロジェクトは[Japanese WordNet](https://bond-lab.github.io/wnja/)のデータを使用しています。

**ライセンス表示要件:**
日本語ワードネットのデータを直接・間接また全体・一部を問わずご利用になった上で、その成果を公開なさる場合は、以下のような文言で日本語ワードネットのサイトへリンクしてください：

```
日本語ワードネット（v1.1）© 2009-2011 NICT, 2012-2015 Francis Bond and 2016-2024 Francis Bond, Takayuki Kuribayashi
```

リンク先: https://bond-lab.github.io/wnja/index.ja.html

### Datamuse API

英語の辞書データは[Datamuse API](https://api.datamuse.com/)を使用しています。

**ライセンス表示:**
```
English WordNet data provided by Datamuse API
```

リンク先: https://api.datamuse.com/

### Open Multilingual Wordnet (OMW)

多言語翻訳データは[Open Multilingual Wordnet](https://github.com/omwn/omw-data)を使用しています。

**ライセンス表示:**
```
Open Multilingual Wordnet data provided by OMW project
```

リンク先: https://github.com/omwn/omw-data

## プロジェクト構造

```
wordtree/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── lookup/
│   │   │       └── route.ts          # API エンドポイント
│   │   ├── layout.tsx                # アプリケーションレイアウト
│   │   ├── page.tsx                  # メインページ
│   │   └── globals.css               # グローバルスタイル
│   ├── components/
│   │   ├── TextEditor.tsx            # テキストエディタ
│   │   ├── WordLookupPanel.tsx      # 検索結果パネル
│   │   └── QueryProvider.tsx         # React Query プロバイダー
│   ├── hooks/
│   │   └── useWordLookup.ts         # 検索フック
│   └── data/
│       ├── japanese-wordnet.json    # 処理済みJapanese WordNetデータ
│       └── multilingual-wordnet.json # 処理済みOMWデータ
├── scripts/
│   ├── process-japanese-wordnet.js  # Japanese WordNetデータ処理スクリプト
│   └── process-omw.js               # OMWデータ処理スクリプト
├── data/
│   ├── wnjpn-ok.tab                 # Japanese WordNet生データ
│   └── wnjpn-def.tab                # 定義データ
│   └── (omw-1.4/ は開発時のみ、本番では不要)
├── public/                           # 静的ファイル
├── package.json                      # 依存関係定義
├── tsconfig.json                     # TypeScript設定
├── next.config.ts                    # Next.js設定
├── tailwind.config.js                # Tailwind CSS設定
└── README.md
```

## API エンドポイント

### GET /api/lookup

単語の辞書情報と類語を取得します。

**パラメータ:**
- `word` (string, required): 検索する単語

**レスポンス例:**
```json
{
  "dictionary": {
    "word": "美しい",
    "meanings": [
      {
        "partOfSpeech": "形容詞",
        "definitions": [
          {
            "definition": "感覚を活気づけ、知的情緒的賞賛を喚起する"
          }
        ]
      }
    ]
  },
  "synonyms": {
    "word": "美しい",
    "synonyms": ["きれい", "綺麗", "美麗", "華麗", "優美", "端麗"]
  },
  "translations": {
    "word": "美しい",
    "translations": {
      "eng": ["beautiful", "lovely", "attractive"],
      "fra": ["beau", "belle", "joli"],
      "spa": ["hermoso", "bello", "bonito"],
      "deu": ["schön", "hübsch"],
      "ita": ["bello", "bellissimo"],
      "por": ["bonito", "belo"],
      "rus": ["красивый", "прекрасный"],
      "cmn": ["美丽", "漂亮"],
      "kor": ["아름다운", "예쁜"]
    }
  }
}
```

## 開発

### 開発サーバーの起動

```bash
npm run dev
```

### ビルド

```bash
npm run build
```

### 型チェック

```bash
npm run type-check
```

### リント

```bash
npm run lint
```

### データ更新

OMWデータの更新が必要な場合（年1回程度）：

```bash
# データの再ダウンロードと処理
npm run data:update

# または個別に実行
npm run data:download  # データダウンロードのみ
npm run data:process   # データ処理のみ
```

### データ処理スクリプト

```bash
# Japanese WordNetデータ処理
node scripts/process-japanese-wordnet.js

# OMWデータ処理
node scripts/process-omw.js
```

## データセット

### Japanese WordNet

- **単語数**: 83,168単語
- **エントリ数**: 144,308エントリ
- **品詞別分布**:
  - 名詞: 87,775
  - 形容詞: 17,670
  - 動詞: 31,715
  - 副詞: 7,148

### Open Multilingual Wordnet (OMW)

- **対応言語**: 19言語
- **総synset数**: 123,015
- **総lemma数**: 約100万語
- **ファイルサイズ**: 約32MB（処理済みJSON）

### データ処理

#### Japanese WordNet

Japanese WordNetの生データを効率的なJSON形式に変換するスクリプトが含まれています：

```bash
# データをダウンロード
curl -L https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn-ok.tab.gz -o data/wnjpn-ok.tab.gz
curl -L https://github.com/bond-lab/wnja/releases/download/v1.1/wnjpn-def.tab.gz -o data/wnjpn-def.tab.gz

# データを解凍
gunzip data/wnjpn-ok.tab.gz
gunzip data/wnjpn-def.tab.gz

# データを処理
node scripts/process-japanese-wordnet.js
```

#### OMWデータ

Open Multilingual Wordnetデータの処理：

```bash
# 自動処理（推奨）
npm run data:update

# 手動処理
curl -L "https://github.com/omwn/omw-data/releases/download/v1.4/omw-1.4.tar.xz" -o data/omw-1.4.tar.xz
tar -xf data/omw-1.4.tar.xz -C data/
node scripts/process-omw.js
```

## デプロイ

このプロジェクトはVercelにデプロイされています。

### 環境変数

本番環境では以下の環境変数が設定されています：
- `NEXT_PUBLIC_API_URL`: APIのベースURL

### デプロイ時の注意点

- **ファイルサイズ**: 処理済みJSONファイル（約32MB）はVercel Edge Functions制限内
- **データ更新**: 本番環境では生データは不要、処理済みJSONのみ使用
- **自動デプロイ**: GitHubプッシュにより自動的にデプロイ

## トラブルシューティング

### よくある問題

1. **npm run devでエラーが発生する場合**
   - 正しいディレクトリ（wordtree/）にいることを確認
   - `npm install`を再実行

2. **データが表示されない場合**
   - `node scripts/process-japanese-wordnet.js`を実行してデータを準備
   - `npm run data:update`を実行して翻訳データを準備

3. **翻訳機能が動作しない場合**
   - `src/data/multilingual-wordnet.json`が存在することを確認
   - `npm run data:process`を実行してデータを再生成

4. **APIエラーが発生する場合**
   - ネットワーク接続を確認
   - Datamuse APIの利用制限を確認
   - 翻訳機能はネットワークエラー時もフォールバック処理で動作

5. **ファイルサイズが大きすぎる場合**
   - 生データ（data/omw-1.4/）は削除可能
   - 処理済みJSONファイルのみが本番環境で使用される

## 貢献

プルリクエストやイシューの報告を歓迎します。

### 開発ガイドライン

1. フォークしてブランチを作成
2. 変更をコミット
3. プルリクエストを作成

## ライセンス

このプロジェクトのライセンスについては現在検討中です。ただし、Japanese WordNetデータの使用については、上記のライセンス要件を遵守してください。

## 更新履歴

- **v1.1.0**: 翻訳機能追加
  - 19言語の多言語翻訳機能
  - OMWデータ統合（123,015 synsets）
  - 翻訳タブUI追加
  - エラーハンドリング強化
  - 部分一致検索機能
- **v1.0.0**: 初期リリース
  - 日本語・英語辞書検索機能
  - リアルタイム検索
  - レスポンシブデザイン
