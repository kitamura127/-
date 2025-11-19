# Phase 4: HTML修正ガイド

## 概要

Phase 4では、HTMLに共通クラスを追加して、トグルボタンのCSS重複定義を削除します。

---

## HTML修正箇所

### 1. 左サイドバートグルボタン

#### Before（現状）
```html
<button id="left-sidebar-toggle" class="sidebar-visible" onclick="toggleLeftSidebar()">
  <span id="left-toggle-icon">◀</span>
</button>
```

#### After（Phase 4適用後）
```html
<button id="left-sidebar-toggle" class="toggle-btn-base toggle-btn-base--left sidebar-visible" onclick="toggleLeftSidebar()">
  <span id="left-toggle-icon">◀</span>
</button>
```

**変更点**:
- `class="toggle-btn-base toggle-btn-base--left sidebar-visible"` に変更
- 既存の `sidebar-visible` クラスは保持

---

### 2. 右サイドバートグルボタン

#### Before（現状）
```html
<button id="sidebar-toggle" class="sidebar-visible" onclick="toggleSidebar()">
  <span id="toggle-icon">◀</span>
</button>
```

#### After（Phase 4適用後）
```html
<button id="sidebar-toggle" class="toggle-btn-base toggle-btn-base--right sidebar-visible" onclick="toggleSidebar()">
  <span id="toggle-icon">◀</span>
</button>
```

**変更点**:
- `class="toggle-btn-base toggle-btn-base--right sidebar-visible"` に変更
- 既存の `sidebar-visible` クラスは保持

---

## CSS修正箇所

### 削除するCSS

以下のCSSブロックを**完全に削除**します：

#### 1. 左トグルボタンの基本スタイル（削除）

```css
/* 削除対象 */
#left-sidebar-toggle {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 1px solid #e0e0e0;
  border-left: none;
  padding: 15px 8px;
  cursor: pointer;
  border-radius: 0 8px 8px 0;
  box-shadow: 2px 0 8px rgba(0,0,0,0.1);
  z-index: 200;
  transition: left 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 18px;
}

#left-sidebar-toggle.sidebar-hidden {
  left: 0;
}

#left-sidebar-toggle.sidebar-visible {
  left: 320px;
}
```

#### 2. 右トグルボタンの基本スタイル（削除）

```css
/* 削除対象 */
#sidebar-toggle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  background: white;
  border: 1px solid #e0e0e0;
  border-right: none;
  padding: 15px 8px;
  cursor: pointer;
  border-radius: 8px 0 0 8px;
  box-shadow: -2px 0 8px rgba(0,0,0,0.1);
  z-index: 200;
  transition: right 0.3s ease;
  display: flex;
  align-items: center;
  font-size: 18px;
}

#sidebar-toggle.sidebar-hidden {
  right: 0;
}

#sidebar-toggle.sidebar-visible {
  right: 340px;
}
```

---

### 追加するCSS

`phase4-toggle-integration.css` の内容を、削除した箇所に追加します。

```css
/* Phase 4: トグルボタンCSS統合 */

/* 左トグルボタン - 個別プロパティ */
#left-sidebar-toggle {
  transition: left var(--transition-normal) ease;
}

#left-sidebar-toggle.sidebar-hidden {
  left: 0;
}

#left-sidebar-toggle.sidebar-visible {
  left: var(--left-sidebar-width);
}

/* 右トグルボタン - 個別プロパティ */
#sidebar-toggle {
  transition: right var(--transition-normal) ease;
}

#sidebar-toggle.sidebar-hidden {
  right: 0;
}

#sidebar-toggle.sidebar-visible {
  right: var(--sidebar-width);
}

/* タブレット対応 */
@media (min-width: 769px) and (max-width: 1024px) {
  #left-sidebar-toggle.sidebar-visible {
    left: var(--sidebar-width-tablet-left);
  }

  #sidebar-toggle.sidebar-visible {
    right: var(--sidebar-width-tablet-right);
  }
}

/* モバイル対応 */
@media (max-width: 768px) {
  #left-sidebar-toggle,
  #sidebar-toggle {
    display: none;
  }
}
```

---

## モバイル対応の修正

### 削除するCSS（モバイル部分）

```css
/* 削除対象 - @media (max-width: 768px) 内 */

#left-sidebar-toggle {
  display: none;
}

#sidebar-toggle {
  display: none;
}
```

これらは Phase 4 の統合CSSに含まれるため、既存の定義を削除します。

---

## タブレット対応の修正

### Before
```css
@media (min-width: 769px) and (max-width: 1024px) {
  #left-sidebar-toggle.sidebar-visible {
    left: 280px;
  }

  #sidebar-toggle.sidebar-visible {
    right: 300px;
  }
}
```

### After
```css
@media (min-width: 769px) and (max-width: 1024px) {
  #left-sidebar-toggle.sidebar-visible {
    left: var(--sidebar-width-tablet-left);
  }

  #sidebar-toggle.sidebar-visible {
    right: var(--sidebar-width-tablet-right);
  }
}
```

---

## 修正手順

### ステップ1: HTMLの修正

1. `<button id="left-sidebar-toggle"` を探す
2. `class="toggle-btn-base toggle-btn-base--left sidebar-visible"` に変更
3. `<button id="sidebar-toggle"` を探す
4. `class="toggle-btn-base toggle-btn-base--right sidebar-visible"` に変更

### ステップ2: CSSの削除

1. `#left-sidebar-toggle { ... }` ブロックを探す
2. 重複部分を削除（約20行）
3. `#sidebar-toggle { ... }` ブロックを探す
4. 重複部分を削除（約20行）

### ステップ3: CSSの追加

1. 削除した箇所に `phase4-toggle-integration.css` の内容を追加
2. 個別プロパティ（transition, position）のみを残す

### ステップ4: 動作確認

1. ブラウザで開く
2. 左トグルボタンをクリック → 左サイドバーが開閉
3. 右トグルボタンをクリック → 右サイドバーが開閉
4. ボタンの位置がサイドバーに追従するか確認
5. モバイル表示でボタンが非表示になるか確認

---

## 確認ポイント

### 表示確認
- [ ] 左トグルボタンが正しい位置に表示される
- [ ] 右トグルボタンが正しい位置に表示される
- [ ] ボタンのスタイル（ボーダー、背景色）が正しい
- [ ] ボタンのアイコンが表示される

### 機能確認
- [ ] 左トグルボタンのクリックで左サイドバーが開閉
- [ ] 右トグルボタンのクリックで右サイドバーが開閉
- [ ] ボタンの位置がサイドバーに追従する
- [ ] アニメーション（トランジション）が滑らか

### レスポンシブ確認
- [ ] デスクトップ（1920x1080）
  - 左ボタン: 0px（閉）→ 320px（開）
  - 右ボタン: 0px（閉）→ 340px（開）
- [ ] タブレット（768x1024）
  - 左ボタン: 280px（開）
  - 右ボタン: 300px（開）
- [ ] モバイル（375x667）
  - 両ボタン: 非表示

### JavaScript確認
- [ ] `toggleLeftSidebar()` 関数が動作する
- [ ] `toggleSidebar()` 関数が動作する
- [ ] クラスの付け替え（`sidebar-hidden` ⇔ `sidebar-visible`）が動作

---

## トラブルシューティング

### Q: トグルボタンが表示されない
**A:** 共通クラスが正しく追加されているか確認してください。
```html
<!-- 正しい -->
<button id="left-sidebar-toggle" class="toggle-btn-base toggle-btn-base--left sidebar-visible">

<!-- 間違い -->
<button id="left-sidebar-toggle" class="sidebar-visible">
```

### Q: トグルボタンの位置がおかしい
**A:** CSS変数が正しく定義されているか確認してください。
```css
/* Phase 1で定義されているはず */
:root {
  --left-sidebar-width: 320px;
  --sidebar-width: 340px;
}
```

### Q: ボタンをクリックしても動かない
**A:** JavaScriptのエラーがないか確認してください。
- ブラウザのコンソールを確認
- `toggleLeftSidebar()` と `toggleSidebar()` 関数が存在するか確認
- `sidebar-hidden` と `sidebar-visible` クラスが切り替わっているか確認

### Q: ボタンのスタイルがおかしい
**A:** Phase 2の共通クラスが定義されているか確認してください。
```css
/* Phase 2で定義されているはず */
.toggle-btn-base {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  /* ... */
}

.toggle-btn-base--left {
  left: 0;
  border-left: none;
  border-radius: 0 var(--border-radius-lg) var(--border-radius-lg) 0;
  box-shadow: var(--shadow-right);
}

.toggle-btn-base--right {
  right: 0;
  border-right: none;
  border-radius: var(--border-radius-lg) 0 0 var(--border-radius-lg);
  box-shadow: var(--shadow-left);
}
```

---

## 期待される結果

### CSS削減
- 削除前: 約60行
- 削除後: 約20行
- **削減量: 約40行（67%削減）**

### ファイルサイズ
- Phase 3適用版: X KB
- Phase 4適用版: (X - 1.5) KB
- **削減: 約1.5KB**

### メリット
- ✅ 重複コードの大幅削減
- ✅ 保守性の向上
- ✅ 一貫性の向上
- ✅ CSS変数の活用

---

## 次のステップ

Phase 4が完了したら、Phase 6（バッジ類のCSS統合）に進むことを推奨します。

**Phase 5（統計パネル）は高リスクのため、後回しにすることをお勧めします。**
