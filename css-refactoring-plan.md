# CSS段階的リファクタリング計画

## 基本方針
- 各ステップは独立してテスト可能
- 影響範囲を最小限に抑える
- 後戻り可能な設計
- ファイルサイズとコード複雑度を考慮

---

## Phase 1: CSS変数の導入（最小リスク）
**影響範囲**: 小
**所要時間**: 短
**リスク**: 低

### 作業内容
`:root` にCSS変数を定義して、色・サイズ・間隔などを一元管理

```css
:root {
  /* Colors */
  --primary-color: #4285f4;
  --success-color: #4caf50;
  --warning-color: #ffc107;
  --danger-color: #f44336;
  --text-primary: #333;
  --text-secondary: #666;
  --text-muted: #999;
  --border-color: #e0e0e0;
  --bg-white: white;
  --bg-gray-light: #f8f9fa;
  --bg-gray: #f5f5f5;

  /* Sizes */
  --sidebar-width: 340px;
  --left-sidebar-width: 320px;
  --border-radius-sm: 4px;
  --border-radius-md: 6px;
  --border-radius-lg: 8px;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 12px;
  --spacing-lg: 15px;
  --spacing-xl: 20px;

  /* Typography */
  --font-size-xs: 10px;
  --font-size-sm: 11px;
  --font-size-md: 13px;
  --font-size-lg: 15px;

  /* Shadows */
  --shadow-sm: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.15);
  --shadow-lg: 0 4px 20px rgba(0,0,0,0.1);
}
```

### メリット
- 既存コードに影響を与えずに導入可能
- 後続のフェーズで段階的に使用できる
- テーマ変更が容易になる

### 修正箇所
- `<style>` タグの先頭に追加のみ

---

## Phase 2: 共通クラスの作成（低リスク）
**影響範囲**: 小
**所要時間**: 短
**リスク**: 低

### 作業内容
汎用的な共通クラスを新規作成（既存コードは変更しない）

```css
/* 共通クラス */
.sidebar-base {
  background: var(--bg-white);
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

.toggle-btn-base {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  padding: 15px 8px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  z-index: 200;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 18px;
}

.badge-base {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.btn-base {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  background: var(--bg-white);
  color: var(--text-primary);
  cursor: pointer;
  font-size: var(--font-size-md);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}
```

### メリット
- 既存コードは一切変更しない
- 次フェーズで段階的に置き換え可能
- クラス名の衝突リスクなし

### 修正箇所
- CSSに共通クラスを追加のみ

---

## Phase 3: サイドバーのCSS統合（中リスク）
**影響範囲**: 中
**所要時間**: 中
**リスク**: 中

### 作業内容
`#left-sidebar` と `#sidebar` のスタイルを共通クラス + 個別差分に分離

#### Before（現状）
```css
#left-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

#sidebar {
  width: 340px;
  background: white;
  /* ... 同じプロパティが繰り返し ... */
  border-left: 1px solid #e0e0e0;
  right: 0;
}
```

#### After（改善後）
```css
/* 共通スタイル */
.sidebar-base {
  background: var(--bg-white);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  bottom: 0;
  z-index: 100;
  transition: all 0.3s ease;
}

/* 個別差分のみ */
#left-sidebar {
  width: var(--left-sidebar-width);
  border-right: 1px solid var(--border-color);
  left: 0;
}

#sidebar {
  width: var(--sidebar-width);
  border-left: 1px solid var(--border-color);
  right: 0;
}
```

### HTMLへの影響
```html
<!-- Before -->
<div id="left-sidebar">

<!-- After -->
<div id="left-sidebar" class="sidebar-base">
```

### テスト項目
- 左サイドバーの表示・非表示
- 右サイドバーの表示・非表示
- モバイル表示での動作
- トランジションの動作

### 修正箇所
- CSS: 2箇所のID定義を統合
- HTML: 2箇所にクラス追加

---

## Phase 4: トグルボタンのCSS統合（中リスク）
**影響範囲**: 中
**所要時間**: 中
**リスク**: 中

### 作業内容
`#left-sidebar-toggle` と `#sidebar-toggle` を共通化

#### Before
```css
#left-sidebar-toggle {
  position: absolute;
  left: 0;
  /* ... 長いプロパティリスト ... */
  border-radius: 0 8px 8px 0;
}

#sidebar-toggle {
  position: absolute;
  right: 0;
  /* ... 同じプロパティリスト ... */
  border-radius: 8px 0 0 8px;
}
```

#### After
```css
.toggle-btn-base {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-white);
  border: 1px solid var(--border-color);
  padding: 15px 8px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  z-index: 200;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 18px;
}

#left-sidebar-toggle {
  left: 0;
  border-left: none;
  border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
}

#sidebar-toggle {
  right: 0;
  border-right: none;
  border-radius: var(--border-radius-lg) 0 0 var(--border-radius-lg);
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
}
```

### HTMLへの影響
```html
<button id="left-sidebar-toggle" class="toggle-btn-base sidebar-visible">
<button id="sidebar-toggle" class="toggle-btn-base sidebar-visible">
```

### テスト項目
- トグルボタンのクリック動作
- アニメーション・トランジション
- ホバー効果
- 位置の正確性

### 修正箇所
- CSS: 2箇所のID定義を統合
- HTML: 2箇所にクラス追加

---

## Phase 5: 統計パネルのCSS統合（高リスク）
**影響範囲**: 大
**所要時間**: 長
**リスク**: 高

### 作業内容
`.stats-panel` と `.stats-panel-large` の重複を解消

#### 戦略
サイズ違いのバリエーションクラスを使用

```css
/* 基本スタイル */
.stats-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 10px 12px;
  border-radius: var(--border-radius-lg);
  color: white;
}

/* サイズバリエーション */
.stats-panel--large {
  padding: 24px;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stats-header--large {
  margin-bottom: 20px;
}

/* 同様に他の要素も統合 */
```

### HTMLへの影響
```html
<!-- 通常版 -->
<div class="stats-panel">
  <div class="stats-header">
    <div class="stats-title">

<!-- 拡大版 -->
<div class="stats-panel stats-panel--large">
  <div class="stats-header stats-header--large">
    <div class="stats-title stats-title--large">
```

### テスト項目
- 両方の統計パネルの表示
- レイアウト崩れの確認
- フォントサイズの確認
- レスポンシブ対応

### 修正箇所
- CSS: 8つの重複クラスセットを統合
- HTML: 2箇所のパネル構造を修正
- JavaScript: `updateLargeStats()` の調整

---

## Phase 6: バッジ類のCSS統合（低リスク）
**影響範囲**: 小
**所要時間**: 短
**リスク**: 低

### 作業内容
区分バッジとステータスバッジを統合

#### Before
```css
.kubun-タネ未満 {
  background: #ffebee;
  color: #c62828;
}
.kubun-戦略予材 {
  background: #e8f5e9;
  color: #2e7d32;
}
/* ... 5つのバッジ定義 ... */

.status-recent { /* 同じパターン */ }
.status-warning { /* 同じパターン */ }
.status-urgent { /* 同じパターン */ }
```

#### After
```css
/* 基本バッジスタイル */
.badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  margin-top: 4px;
}

/* カラーバリエーション */
.badge--danger { background: #ffebee; color: #c62828; }
.badge--success { background: #e8f5e9; color: #2e7d32; }
.badge--info { background: #e3f2fd; color: #1565c0; }
.badge--purple { background: #f3e5f5; color: #7b1fa2; }
.badge--default { background: #e8eaf6; color: #5e35b1; }
.badge--gray { background: #e0e0e0; color: #616161; }
.badge--warning { background: #fff9c4; color: #f57f17; }
```

### HTMLへの影響
```html
<!-- Before -->
<span class="location-kubun kubun-タネ未満">タネ未満</span>
<span class="visit-status status-urgent">訪問必要</span>

<!-- After -->
<span class="badge badge--danger">タネ未満</span>
<span class="badge badge--danger">訪問必要</span>
```

### テスト項目
- 全バッジの表示確認
- 色の正確性
- レイアウトへの影響

### 修正箇所
- CSS: 15個のバッジ定義を8個に統合
- HTML/JavaScript: バッジクラス名の変更

---

## Phase 7: モバイル対応CSSの整理（中リスク）
**影響範囲**: 中
**所要時間**: 中
**リスク**: 中

### 作業内容
モバイル表示時の重複スタイルを統合

#### Before
```css
@media (max-width: 768px) {
  #left-sidebar.mobile-visible .left-sidebar-title { font-size: 22px; }
  #left-sidebar.mobile-visible .tab-btn { font-size: 20px; padding: 18px 24px; }
  /* ... 多数の重複 ... */

  #sidebar.mobile-visible .stats-title { font-size: 22px; }
  #sidebar.mobile-visible .btn { font-size: 20px; padding: 18px 24px; }
  /* ... 同じパターンの繰り返し ... */
}
```

#### After
```css
@media (max-width: 768px) {
  /* 共通のモバイル拡大 */
  .sidebar-base.mobile-visible .title { font-size: 22px; }
  .sidebar-base.mobile-visible .btn { font-size: 20px; padding: 18px 24px; min-height: 60px; }
  .sidebar-base.mobile-visible .item { padding: 24px; min-height: 80px; }
  .sidebar-base.mobile-visible .item-name { font-size: 22px; }
  .sidebar-base.mobile-visible .item-text { font-size: 18px; }
}
```

### テスト項目
- モバイル表示での確認
- タップ領域のサイズ確認
- フォントサイズの確認
- 各サイドバーでの動作確認

### 修正箇所
- CSS: メディアクエリ内の重複を統合
- HTML: クラス名の統一

---

## 実施順序とマイルストーン

### Week 1: 基礎準備（低リスク）
- ✅ Phase 1: CSS変数の導入
- ✅ Phase 2: 共通クラスの作成
- **成果物**: 変数とクラスを追加した新バージョン

### Week 2: 段階的適用（中リスク）
- ✅ Phase 3: サイドバーのCSS統合
- ✅ Phase 4: トグルボタンのCSS統合
- **成果物**: サイドバー・トグル統合版

### Week 3: 高度な統合（高リスク）
- ✅ Phase 5: 統計パネルのCSS統合
- **成果物**: 統計パネル統合版

### Week 4: 仕上げと最適化
- ✅ Phase 6: バッジ類のCSS統合
- ✅ Phase 7: モバイル対応CSSの整理
- **成果物**: 完全統合版

---

## 削減効果の予測

### CSS行数
- **現状**: 約1,100行
- **Phase 1-2完了後**: 約1,050行（50行削減、5%）
- **Phase 3-4完了後**: 約950行（150行削減、14%）
- **Phase 5完了後**: 約850行（250行削減、23%）
- **全Phase完了後**: 約700行（400行削減、36%）

### 保守性
- CSS変数による一元管理
- 共通クラスによる変更箇所の削減
- 命名規則の統一

---

## リスク管理

### 各Phaseの後退戦略
1. **Gitブランチ管理**: 各Phaseごとにコミット
2. **A/Bテスト**: 旧版と新版の並行運用
3. **ロールバック手順**: 各Phase完了時にタグ作成

### テスト基準
- ✅ デスクトップ表示（Chrome, Firefox, Safari）
- ✅ モバイル表示（iOS Safari, Android Chrome）
- ✅ タブレット表示
- ✅ 全機能の動作確認

---

## 次のアクション

どのPhaseから始めますか？

**推奨**: Phase 1（CSS変数の導入）から開始
- リスクが最小
- 後続のPhaseの基盤になる
- すぐに効果が見える
