1. 目的
ブラウザ上でユーザが自由に文章を入力／ペーストし、任意の単語を選択すると、その単語に対応する 多言語訳・類語・語源 を即座に取得し、直感的に可視化できる軽量 Web アプリを、Vercel にワンクリックでデプロイできる形で提供する。

2. 背景・前提
想定ユーザ：ライター・編集者など
利用環境：PC／モバイル最新版ブラウザ
予算：可能な限り無料／低コスト（Vercel フリープラン範囲内を想定）
スケーラビリティ：当面は個人利用〜小規模トラフィックを想定

3. 機能要件
table:_
	ID	要件	詳細
	FR-1	テキスト入力領域	Web 上にリッチテキストエリアを配置し、キーボード入力・ペースト双方に対応
	FR-2	単語選択検知	クリック／ドラッグで選択された単語を JS で検出し、重複スペース・句読点を除去
	FR-3	データ取得	選択語をキーにデータを取得（それぞれモジュールを分けてOSSやSaaS APIなど変えられるようにしておく）
	FR-3-1	データ取得：辞書	辞書的な意味を調べる: 日英対応、英語→ Open English WordNet, 日本語→ Japanese WordNet
	FR-3-2	データ取得：類語	類語: 日英対応、英語→ Open English WordNet, 日本語→ Japanese WordNet
	FR-3-3	データ取得：類語	翻訳: LibreTranslate / LingvaNex など無償 REST
	FR-3-4	データ取得：語源	語源: Etymonline スクレイピング回避のため、 etymology-api (有志) か Wiktionary dump を自前 JSON 化
	FR-4	結果キャッシュ	同一単語検索を 24 h Edge KV に保存し、API コール削減
	FR-5	表示 UI	サイドパネル or コンテキストポップオーバーで結果をタブ分け表示（意味／訳／類語／語源）
	FR-6	可視化	類語をネットワークグラフ、語源をタイムライン & 影響受けた流れの系統樹を簡易表示（D3.js or Vis.js、SSR 不要）
	FR-7	多言語 UI	最初はja対応、のちのちja/en 切替（i18n routing）
	FR-8	ショートカットキー	任意キーでパネル開閉（例: ⌘+⇧+K）
	FR-9	モバイル対応	タップ長押し選択 → ボタンで呼び出し
	FR-10	エラーハンドリング	API タイムアウト・上限超過時にリトライ／ユーザ通知

4. 非機能要件

5. システム構成・技術選定
code:txt
 [Next.js 14 App Router]
  ├─ UI: React / TypeScript / Tailwind CSS
  ├─ Client Fetch: React Query
  ├─ Edge Function: /api/lookup (辞書的な意味・翻訳・類語・語源)
  ├─ Caching: Vercel KV (edge, LRU 24h)
  └─ Visualization: D3.js (client-side only)
Vercel Edge Functions: 最低レイテンシで無料 100 万 invocations/月。
Next.js App Router: ファイルベース routing＋SSG 可、React 18 Suspense で非同期データ取得。
Vercel KV: 50 MB 無料。Word→JSON を key-value 保存。
API Key 管理: Vercel Environment Variables に格納。

6. 画面遷移・UI ラフ
6.1 ホーム
	左側にエディタ／ペースト欄
6.2 単語選択時ポップオーバー
	「Lookup」ボタン
6.3 取得結果パネル
	右サイド固定（レスポンシブ時下部）
	タブ: Translation / Synonyms / Etymology
	グラフエリア & テキスト一覧