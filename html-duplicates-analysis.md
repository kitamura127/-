# HTMLコードの重複分析レポート

## 1. CSSスタイルの重複

### 1.1 左右サイドバーのスタイル
**重複箇所**: `#left-sidebar` と `#sidebar`
- 基本的なレイアウトプロパティ（position, background, border, flex, z-index等）がほぼ同一
- 違いは `left/right` の配置と `border-left/border-right` のみ
- `.hidden`, `.mobile-visible` の状態管理も同様のパターン

**該当行**: 48-82行目（left-sidebar）, 362-394行目（sidebar）

### 1.2 サイドバートグルボタンのスタイル
**重複箇所**: `#left-sidebar-toggle` と `#sidebar-toggle`
- ほぼ全てのスタイルが共通
- 違いは `left/right` の配置、`border-radius`、`box-shadow` の向きのみ
- `.sidebar-hidden`, `.sidebar-visible` の状態管理も同じパターン

**該当行**: 84-106行目（left-sidebar-toggle）, 396-418行目（sidebar-toggle）

### 1.3 統計パネルのスタイル
**重複箇所**: `.stats-panel` と `.stats-panel-large`
- 同じ構造で異なるサイズ版が2つ存在
- `.stats-header` / `.stats-header-large`
- `.stats-title` / `.stats-title-large`
- `.stats-content` / `.stats-content-large`
- `.stat-item` / `.stat-item-large`
- `.stat-value` / `.stat-value-large`
- `.stat-label` / `.stat-label-large`
- `.stat-divider` / `.stat-divider-large`
- `.stats-message` / `.stats-message-large`

**該当行**:
- 通常版: 434-489行目
- 拡大版: 859-918行目

### 1.4 モバイル表示時のサイドバー調整
**重複箇所**: 左右サイドバーのモバイルスタイル
```css
#left-sidebar.mobile-visible { ... }
#sidebar.mobile-visible { ... }
```
- 同じプロパティセットが複数回繰り返される
- フォントサイズ、パディング、最小高さの調整が重複

**該当行**: 1046-1142行目

### 1.5 区分バッジのスタイル
**重複箇所**: `.kubun-*` クラス群
- 同じパターン（background, color, padding, border-radius等）が複数の区分タイプで繰り返される
- `.kubun-タネ未満`, `.kubun-戦略予材`, `.kubun-現場`, `.kubun-その他`, `.kubun-default`

**該当行**: 326-345行目

### 1.6 訪問ステータスのスタイル
**重複箇所**: `.status-*` クラス群
- `.status-recent`, `.status-warning`, `.status-urgent`
- 同じパターンが繰り返される

**該当行**: 347-362行目

---

## 2. HTML構造の重複

### 2.1 統計パネル
**重複箇所**: 2つの統計パネルが存在
1. `#stats-panel`（サイドバー内）- 1211-1233行目
2. `.stats-panel-large`（リスト表示用）- 1281-1298行目

### 2.2 空の状態表示
**重複箇所**: 複数のタブで同様の構造
- インサイトタブの空状態（1249-1256行目）
- 新着案件タブの空状態（1259-1266行目）
- JavaScriptで生成される空状態も複数箇所

### 2.3 モバイルモーダルのヘッダー構造
**重複箇所**: モーダルヘッダーとサイドバーヘッダー
- 似たようなレイアウトパターン

**該当行**: 1023-1044行目

---

## 3. JavaScriptの重複

### 3.1 サイドバートグル機能
**重複箇所**: `toggleLeftSidebar()` と `toggleSidebar()`
- ほぼ同一のロジック
- 対象要素とID名が異なるのみ

**該当行**:
- toggleLeftSidebar: 1573-1596行目
- toggleSidebar: 1902-1925行目

### 3.2 統計情報の更新
**重複箇所**:
- `updateStats()` - 統計データをDOMに反映
- `updateLargeStats()` - 同じデータを拡大版にコピー

**該当行**:
- updateStats: 2004-2034行目
- updateLargeStats: 1415-1423行目

### 3.3 訪問履歴の追加処理
**重複箇所**: `addVisit()` と `addVisitFromModal()`
- ほぼ同一のロジック
- UI要素のID接尾辞が異なるのみ（通常版 vs mobile版）

**該当行**:
- addVisit: 2329-2361行目
- addVisitFromModal: 2639-2671行目

### 3.4 営業先情報の表示内容生成
**重複箇所**: `showInfo()` と `showMobileModal()`
- 同じデータを異なるフォーマット（インフォウィンドウ vs モーダル）で表示
- リンク生成、訪問履歴表示、帝国データバンクPDF検索など、重複する処理が多数

**該当行**:
- showInfo: 2143-2293行目
- showMobileModal: 2412-2592行目

### 3.5 帝国データバンクPDF検索処理
**重複箇所**: `showInfo()` と `showMobileModal()` 内
- 同じ `google.script.run.findTeikokyPDF()` 呼び出しとコールバック処理
- リンク要素の生成ロジックがほぼ同一

**該当行**:
- showInfo内: 2253-2283行目
- showMobileModal内: 2552-2582行目

### 3.6 日付フォーマット処理
**重複箇所**: `formatDate()` と `getTodayDate()`
- 日付の年月日フォーマット処理が重複

**該当行**:
- formatDate: 2295-2302行目
- getTodayDate: 2304-2310行目

### 3.7 Sansan検索処理
**重複箇所**: `showInfo()` と `showMobileModal()` 内
- SansanのURL判定ロジック
- 会社名をコピーしてSansanを開く処理

**該当行**: 同じロジックが両関数内に存在

---

## 4. 文字列リテラルの重複

### 4.1 エラーメッセージ
- 「この機能はGoogle Apps Script環境でのみ動作します」が複数箇所
- 「追加に失敗しました」系のメッセージ

### 4.2 UI表示テキスト
- 「訪問履歴」「帝国データバンク」「Sansan」などのラベル
- 絵文字アイコン（📍、🏢、📇、🔍など）

### 4.3 HTMLテンプレート文字列
- リンクの生成パターン
- 訪問履歴の表示フォーマット

---

## 5. 重複による影響

### 保守性の問題
- 同じ修正を複数箇所に適用する必要がある
- 修正漏れのリスク

### コードサイズ
- CSS: 約1,100行中、推定30-40%が重複
- JavaScript: 約900行中、推定25-35%が重複

### パフォーマンス
- CSSの重複はレンダリングには影響少
- JavaScriptの重複関数は実行時のメモリ使用量に影響

---

## 6. 改善の優先度

### 高優先度
1. サイドバートグル機能の統合
2. 統計パネルスタイルの統合
3. 訪問履歴追加処理の統合
4. 帝国データバンクPDF検索処理の統合

### 中優先度
5. サイドバー・トグルボタンのCSS共通化
6. 営業先情報表示の統合（showInfo/showMobileModal）
7. バッジスタイルの共通化

### 低優先度
8. 文字列リテラルの定数化
9. HTMLテンプレートの共通化

---

## 7. 推奨される対応

1. **CSS変数の導入**: 色、サイズ、間隔などを変数化
2. **共通クラスの作成**: `.sidebar-base`, `.toggle-base` など
3. **関数の汎用化**: パラメータで左右を切り替え可能に
4. **テンプレート関数の作成**: 営業先情報表示の共通化
5. **定数ファイルの作成**: メッセージ、ラベル、設定値の一元管理
