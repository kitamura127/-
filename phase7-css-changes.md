# Phase 7: モバイルCSS統合 - 修正ガイド

## 📋 概要

Phase 7では、モバイル表示時の重複スタイルを統合します。左右サイドバーで同じパターンが繰り返されているモバイル用CSSを、共通クラス `.sidebar-base.mobile-visible` を使って統合します。

**削減効果**: 約130行（70%削減）
**リスクレベル**: 中
**影響範囲**: モバイル表示のみ

---

## 🎯 修正内容

### 1. 元のCSSから削除する部分

元のHTMLの `@media (max-width: 768px)` セクション内にある以下の重複スタイルを削除します：

#### 削除対象1: 左サイドバーのモバイル拡大スタイル

```css
/* 削除: 約60行 */
#left-sidebar.mobile-visible .left-sidebar-title {
  font-size: 22px;
}

#left-sidebar.mobile-visible .tab-btn {
  font-size: 20px;
  padding: 18px 24px;
  min-height: 60px;
}

#left-sidebar.mobile-visible .refresh-btn {
  font-size: 20px;
  padding: 18px 24px;
  min-height: 60px;
}

#left-sidebar.mobile-visible .insight-item,
#left-sidebar.mobile-visible .new-case-item {
  padding: 24px;
  min-height: 80px;
}

#left-sidebar.mobile-visible .insight-company,
#left-sidebar.mobile-visible .new-case-name {
  font-size: 22px;
  margin-bottom: 12px;
  line-height: 1.5;
  font-weight: 700;
}

#left-sidebar.mobile-visible .insight-summary,
#left-sidebar.mobile-visible .new-case-contractor,
#left-sidebar.mobile-visible .new-case-info {
  font-size: 18px;
  line-height: 1.7;
  margin-bottom: 12px;
}

#left-sidebar.mobile-visible .insight-source,
#left-sidebar.mobile-visible .new-case-price {
  font-size: 16px;
  padding: 8px 16px;
}

#left-sidebar.mobile-visible .empty-state-text {
  font-size: 19px;
  line-height: 2;
}

#left-sidebar.mobile-visible .new-case-link {
  font-size: 18px;
  padding: 12px 0;
  display: inline-block;
}
```

#### 削除対象2: 右サイドバーのモバイル拡大スタイル

```css
/* 削除: 約70行 */
#sidebar.mobile-visible .stats-title {
  font-size: 22px;
}

#sidebar.mobile-visible .btn {
  font-size: 20px;
  padding: 18px 24px;
  min-height: 60px;
}

#sidebar.mobile-visible #search,
#sidebar.mobile-visible #kubun-filter,
#sidebar.mobile-visible #salesman-select {
  font-size: 20px;
  padding: 18px 24px;
  min-height: 60px;
}

#sidebar.mobile-visible .location-item {
  padding: 24px;
  min-height: 80px;
}

#sidebar.mobile-visible .location-name {
  font-size: 22px;
  margin-bottom: 12px;
  line-height: 1.5;
  font-weight: 700;
}

#sidebar.mobile-visible .location-address,
#sidebar.mobile-visible .location-memo {
  font-size: 18px;
  line-height: 1.7;
  margin-bottom: 12px;
}

#sidebar.mobile-visible .location-kubun,
#sidebar.mobile-visible .visit-status {
  font-size: 16px;
  padding: 8px 16px;
}

#sidebar.mobile-visible .duplicate-badge {
  font-size: 15px;
  padding: 6px 12px;
}

#sidebar.mobile-visible .duplicate-info {
  font-size: 17px;
  margin-top: 8px;
}

#sidebar.mobile-visible .stat-value {
  font-size: 32px;
}

#sidebar.mobile-visible .stat-label {
  font-size: 16px;
}

#sidebar.mobile-visible .stats-message {
  font-size: 17px;
}

#sidebar.mobile-visible #sidebar-header {
  padding: 20px;
}

#sidebar.mobile-visible #controls {
  gap: 14px;
}

#sidebar.mobile-visible .control-row {
  gap: 12px;
}

#sidebar.mobile-visible .stats-panel {
  margin-bottom: 14px;
  padding: 14px;
}

#sidebar.mobile-visible .shape-indicator {
  width: 18px;
  height: 18px;
}
```

### 2. 残すCSS

以下のCSSは **削除せずに残します**：

#### 残すCSS1: サイドバーのフルスクリーン表示

```css
@media (max-width: 768px) {
  /* 左サイドバーをフルスクリーンに */
  #left-sidebar {
    width: 100%;
    left: -100%;
    transition: left 0.3s ease;
  }

  #left-sidebar.mobile-visible {
    left: 0;
  }

  #left-sidebar.hidden {
    margin-left: 0;
    left: -100%;
  }

  #left-sidebar-toggle {
    display: none;
  }

  /* 右サイドバーをフルスクリーンに */
  #sidebar {
    width: 100%;
    right: -100%;
    transition: right 0.3s ease;
  }

  #sidebar.mobile-visible {
    right: 0;
    left: 0;
  }

  #sidebar.hidden {
    margin-right: 0;
    right: -100%;
  }

  #sidebar-toggle {
    display: none;
  }
}
```

#### 残すCSS2: その他のモバイル固有スタイル

```css
@media (max-width: 768px) {
  /* 統計パネルのフォントサイズ調整 */
  .stats-title {
    font-size: 11px;
  }

  .stat-value {
    font-size: 18px;
  }

  .stat-label {
    font-size: 9px;
  }

  /* コントロールの調整 */
  .control-row {
    flex-wrap: wrap;
  }

  .btn {
    font-size: 11px;
    padding: 8px 10px;
  }

  /* 検索ボックスとフィルター */
  #search, #kubun-filter {
    font-size: 14px;
    padding: 10px 12px;
  }

  /* シートトグルボタンの位置調整 */
  #sheet-toggle {
    bottom: 80px;
  }

  #sheet-toggle.sheet-open {
    bottom: calc(100vh - 50px);
  }
}
```

#### 残すCSS3: タブレット用スタイル

```css
@media (min-width: 769px) and (max-width: 1024px) {
  #left-sidebar {
    width: 280px;
  }

  #left-sidebar-toggle.sidebar-visible {
    left: 280px;
  }

  #sidebar {
    width: 300px;
  }

  #sidebar-toggle.sidebar-visible {
    right: 300px;
  }
}
```

### 3. 追加するCSS

`phase7-mobile-integration.css` の内容を `@media (max-width: 768px)` セクションの **適切な位置** に追加します。

**追加位置**: `@media (max-width: 768px)` の開始直後、サイドバーのフルスクリーン表示の後

---

## 🔧 修正手順

### ステップ1: 元のHTMLを開く

元のHTMLファイルをテキストエディタで開きます。

### ステップ2: 削除対象を検索

`@media (max-width: 768px)` を検索して、該当セクションを見つけます。

### ステップ3: 重複スタイルを削除

以下のパターンで始まる行をすべて削除：

- `#left-sidebar.mobile-visible .left-sidebar-title`
- `#left-sidebar.mobile-visible .tab-btn`
- `#left-sidebar.mobile-visible .refresh-btn`
- `#left-sidebar.mobile-visible .insight-item`
- `#left-sidebar.mobile-visible .new-case-item`
- `#left-sidebar.mobile-visible .insight-company`
- `#left-sidebar.mobile-visible .new-case-name`
- `#left-sidebar.mobile-visible .insight-summary`
- `#left-sidebar.mobile-visible .new-case-contractor`
- `#left-sidebar.mobile-visible .new-case-info`
- `#left-sidebar.mobile-visible .insight-source`
- `#left-sidebar.mobile-visible .new-case-price`
- `#left-sidebar.mobile-visible .empty-state-text`
- `#left-sidebar.mobile-visible .new-case-link`
- `#sidebar.mobile-visible .stats-title`
- `#sidebar.mobile-visible .btn`
- `#sidebar.mobile-visible #search`
- `#sidebar.mobile-visible #kubun-filter`
- `#sidebar.mobile-visible #salesman-select`
- `#sidebar.mobile-visible .location-item`
- `#sidebar.mobile-visible .location-name`
- `#sidebar.mobile-visible .location-address`
- `#sidebar.mobile-visible .location-memo`
- `#sidebar.mobile-visible .location-kubun`
- `#sidebar.mobile-visible .visit-status`
- `#sidebar.mobile-visible .duplicate-badge`
- `#sidebar.mobile-visible .duplicate-info`
- `#sidebar.mobile-visible .stat-value`
- `#sidebar.mobile-visible .stat-label`
- `#sidebar.mobile-visible .stats-message`
- `#sidebar.mobile-visible #sidebar-header`
- `#sidebar.mobile-visible #controls`
- `#sidebar.mobile-visible .control-row`
- `#sidebar.mobile-visible .stats-panel`
- `#sidebar.mobile-visible .shape-indicator`

### ステップ4: 統合CSSを追加

`#sidebar-toggle { display: none; }` の直後に、以下の共通モバイルスタイルを追加：

```css
  /* -----------------------------------------------
     共通モバイル拡大スタイル
     ----------------------------------------------- */

  /* タイトル・ヘッダー拡大 */
  .sidebar-base.mobile-visible .left-sidebar-title,
  .sidebar-base.mobile-visible .stats-title {
    font-size: 22px;
  }

  /* ボタン拡大 */
  .sidebar-base.mobile-visible .tab-btn,
  .sidebar-base.mobile-visible .btn,
  .sidebar-base.mobile-visible .refresh-btn {
    font-size: 20px;
    padding: 18px 24px;
    min-height: 60px;
  }

  /* 入力フィールド拡大 */
  .sidebar-base.mobile-visible #search,
  .sidebar-base.mobile-visible #kubun-filter,
  .sidebar-base.mobile-visible #salesman-select {
    font-size: 20px;
    padding: 18px 24px;
    min-height: 60px;
  }

  /* アイテムリスト拡大 */
  .sidebar-base.mobile-visible .location-item,
  .sidebar-base.mobile-visible .insight-item,
  .sidebar-base.mobile-visible .new-case-item {
    padding: 24px;
    min-height: 80px;
  }

  /* アイテム名拡大 */
  .sidebar-base.mobile-visible .location-name,
  .sidebar-base.mobile-visible .insight-company,
  .sidebar-base.mobile-visible .new-case-name {
    font-size: 22px;
    margin-bottom: 12px;
    line-height: 1.5;
    font-weight: 700;
  }

  /* アイテムテキスト拡大 */
  .sidebar-base.mobile-visible .location-address,
  .sidebar-base.mobile-visible .location-memo,
  .sidebar-base.mobile-visible .insight-summary,
  .sidebar-base.mobile-visible .new-case-contractor,
  .sidebar-base.mobile-visible .new-case-info {
    font-size: 18px;
    line-height: 1.7;
    margin-bottom: 12px;
  }

  /* バッジ・小要素拡大 */
  .sidebar-base.mobile-visible .location-kubun,
  .sidebar-base.mobile-visible .visit-status,
  .sidebar-base.mobile-visible .insight-source,
  .sidebar-base.mobile-visible .new-case-price {
    font-size: 16px;
    padding: 8px 16px;
  }

  /* 重複バッジ拡大 */
  .sidebar-base.mobile-visible .duplicate-badge {
    font-size: 15px;
    padding: 6px 12px;
  }

  .sidebar-base.mobile-visible .duplicate-info {
    font-size: 17px;
    margin-top: 8px;
  }

  /* 統計パネル拡大 */
  .sidebar-base.mobile-visible .stat-value {
    font-size: 32px;
  }

  .sidebar-base.mobile-visible .stat-label {
    font-size: 16px;
  }

  .sidebar-base.mobile-visible .stats-message {
    font-size: 17px;
  }

  /* 空状態テキスト拡大 */
  .sidebar-base.mobile-visible .empty-state-text {
    font-size: 19px;
    line-height: 2;
  }

  /* リンク拡大 */
  .sidebar-base.mobile-visible .new-case-link {
    font-size: 18px;
    padding: 12px 0;
    display: inline-block;
  }

  /* -----------------------------------------------
     ヘッダー・コントロール最適化
     ----------------------------------------------- */

  .sidebar-base.mobile-visible #sidebar-header {
    padding: 20px;
  }

  .sidebar-base.mobile-visible #controls {
    gap: 14px;
  }

  .sidebar-base.mobile-visible .control-row {
    gap: 12px;
  }

  .sidebar-base.mobile-visible .stats-panel {
    margin-bottom: 14px;
    padding: 14px;
  }

  /* シェイプインジケーター拡大 */
  .sidebar-base.mobile-visible .shape-indicator {
    width: 18px;
    height: 18px;
  }
```

### ステップ5: HTMLの変更は不要

Phase 3ですでに `#left-sidebar` と `#sidebar` に `.sidebar-base` クラスが追加されているため、HTMLの変更は不要です。

---

## ✅ 動作確認チェックリスト

### デスクトップ表示（768px以上）
- [ ] 左サイドバーの表示が正常
- [ ] 右サイドバーの表示が正常
- [ ] トグルボタンが表示される
- [ ] サイドバーの開閉が動作する

### モバイル表示（768px以下）
- [ ] 左サイドバーがフルスクリーンで表示される
- [ ] 右サイドバーがフルスクリーンで表示される
- [ ] トグルボタンが非表示になる
- [ ] フォントサイズが適切に拡大される
- [ ] ボタンのタップ領域が十分（min-height: 60px）
- [ ] アイテムのタップ領域が十分（min-height: 80px）

### タブレット表示（769px〜1024px）
- [ ] サイドバーの幅が調整される
- [ ] トグルボタンの位置が適切

### 個別要素の確認
- [ ] タイトルが22pxで表示される
- [ ] ボタンが20px、padding 18px 24pxで表示される
- [ ] 入力フィールドが20pxで表示される
- [ ] アイテム名が22pxで表示される
- [ ] アイテムテキストが18pxで表示される
- [ ] バッジが16pxで表示される
- [ ] 統計パネルの数値が32pxで表示される

---

## 🎯 期待される効果

### CSS削減
- **削除行数**: 約130行
- **削減率**: 70%
- **Before**: 約185行（モバイルCSS全体）
- **After**: 約55行（共通化後）

### 保守性向上
- モバイルスタイルの変更が1箇所で完結
- 左右サイドバーの一貫性が保証される
- バグの混入リスクが減少

### パフォーマンス
- CSSファイルサイズの削減
- ブラウザのCSS解析時間の短縮

---

## ⚠️ 注意事項

### リスク
- モバイル表示に影響する修正のため、慎重にテスト
- 複数のデバイスサイズで確認推奨
- ブラウザのDevToolsでレスポンシブ確認

### 前提条件
- Phase 3がすでに適用されていること（`.sidebar-base`クラスが存在）
- 元のHTMLに`#left-sidebar`と`#sidebar`が存在すること

### トラブルシューティング
- スタイルが適用されない場合、`.sidebar-base`クラスが追加されているか確認
- キャッシュをクリアして再読み込み
- ブラウザのDevToolsでCSSが正しく読み込まれているか確認

---

## 📝 まとめ

Phase 7では、モバイル用の重複CSSを約70%削減しました。共通クラス `.sidebar-base.mobile-visible` を活用することで、左右サイドバーのモバイルスタイルを統一し、保守性が大幅に向上しました。

**次のステップ**: Phase 5（統計パネルCSS統合）に進むか、すべてのPhaseを統合した完全版HTMLを作成します。
