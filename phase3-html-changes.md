# Phase 3: HTML修正ガイド

## 概要

Phase 3では、HTMLに共通クラスを追加して、CSSの重複定義を削除します。

---

## HTML修正箇所

### 1. 左サイドバー

#### Before（現状）
```html
<div id="left-sidebar">
  <div class="left-sidebar-header">
    <div class="left-sidebar-title">
      🧠 営業インテリジェンス
    </div>
  </div>
  ...
</div>
```

#### After（Phase 3適用後）
```html
<div id="left-sidebar" class="sidebar-base sidebar-base--left">
  <div class="left-sidebar-header">
    <div class="left-sidebar-title">
      🧠 営業インテリジェンス
    </div>
  </div>
  ...
</div>
```

**変更点**:
- `class="sidebar-base sidebar-base--left"` を追加

---

### 2. 右サイドバー

#### Before（現状）
```html
<div id="sidebar">
  <div id="sidebar-header">
    <div class="salesman-switcher">
      ...
    </div>
    ...
  </div>
  <div id="sidebar-content"></div>
</div>
```

#### After（Phase 3適用後）
```html
<div id="sidebar" class="sidebar-base sidebar-base--right">
  <div id="sidebar-header">
    <div class="salesman-switcher">
      ...
    </div>
    ...
  </div>
  <div id="sidebar-content"></div>
</div>
```

**変更点**:
- `class="sidebar-base sidebar-base--right"` を追加

---

## CSS修正箇所

### 削除するCSS

以下のCSSブロックを**完全に削除**します：

#### 1. 左サイドバーの基本スタイル（削除）

```css
/* 削除対象 */
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

#left-sidebar.hidden {
  margin-left: -320px;
}

#left-sidebar.mobile-visible {
  width: 100% !important;
  left: 0 !important;
  z-index: 300;
}
```

#### 2. 右サイドバーの基本スタイル（削除）

```css
/* 削除対象 */
#sidebar {
  width: 340px;
  background: white;
  overflow-y: auto;
  border-left: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 100;
}

#sidebar.hidden {
  margin-right: -340px;
}

#sidebar.mobile-visible {
  width: 100% !important;
  right: 0 !important;
  left: 0 !important;
  z-index: 300;
}
```

---

### 追加するCSS

`phase3-sidebar-integration.css` の内容を、削除した箇所に追加します。

```css
/* Phase 3: サイドバーCSS統合 */

/* 左サイドバー - 個別プロパティのみ */
#left-sidebar {
  width: var(--left-sidebar-width);
  border-right: var(--border-width-thin) solid var(--border-color);
  left: 0;
}

/* 右サイドバー - 個別プロパティのみ */
#sidebar {
  width: var(--sidebar-width);
  border-left: var(--border-width-thin) solid var(--border-color);
  right: 0;
  overflow-y: auto;
}

/* ... 残りのスタイル ... */
```

---

## モバイル対応の修正

### 削除するCSS

```css
/* 削除対象 - @media (max-width: 768px) 内 */

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
```

### 追加するCSS

```css
/* Phase 3: モバイル対応 - @media (max-width: 768px) 内 */

#left-sidebar {
  width: 100%;
  left: -100%;
  transition: left var(--transition-normal) ease;
}

#left-sidebar.mobile-visible {
  left: 0;
}

#left-sidebar.hidden {
  margin-left: 0;
  left: -100%;
}

#sidebar {
  width: 100%;
  right: -100%;
  transition: right var(--transition-normal) ease;
}

#sidebar.mobile-visible {
  right: 0;
}

#sidebar.hidden {
  margin-right: 0;
  right: -100%;
}

#left-sidebar-toggle {
  display: none;
}

#sidebar-toggle {
  display: none;
}
```

---

## タブレット対応の修正

タブレット対応のCSSは、CSS変数を使用するように修正します。

### Before
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

### After
```css
@media (min-width: 769px) and (max-width: 1024px) {
  #left-sidebar {
    width: var(--sidebar-width-tablet-left);
  }

  #left-sidebar-toggle.sidebar-visible {
    left: var(--sidebar-width-tablet-left);
  }

  #sidebar {
    width: var(--sidebar-width-tablet-right);
  }

  #sidebar-toggle.sidebar-visible {
    right: var(--sidebar-width-tablet-right);
  }
}
```

---

## 修正手順

### ステップ1: HTMLの修正

1. `<div id="left-sidebar">` を探す
2. `class="sidebar-base sidebar-base--left"` を追加
3. `<div id="sidebar">` を探す
4. `class="sidebar-base sidebar-base--right"` を追加

### ステップ2: CSSの削除

1. `#left-sidebar { ... }` ブロックを探す
2. 重複部分を削除（約30行）
3. `#sidebar { ... }` ブロックを探す
4. 重複部分を削除（約30行）

### ステップ3: CSSの追加

1. 削除した箇所に `phase3-sidebar-integration.css` の内容を追加
2. 個別プロパティのみを残す

### ステップ4: 動作確認

1. ブラウザで開く
2. 左サイドバーの開閉を確認
3. 右サイドバーの開閉を確認
4. モバイル表示を確認
5. タブレット表示を確認

---

## 確認ポイント

### 表示確認
- [ ] 左サイドバーが正常に表示される
- [ ] 右サイドバーが正常に表示される
- [ ] サイドバーの幅が正しい
- [ ] ボーダーが正しい位置に表示される

### 機能確認
- [ ] 左サイドバーのトグルが動作する
- [ ] 右サイドバーのトグルが動作する
- [ ] モバイル表示で正常に動作する
- [ ] タブレット表示で正常に動作する

### レスポンシブ確認
- [ ] デスクトップ（1920x1080）
- [ ] タブレット（768x1024）
- [ ] モバイル（375x667）

---

## トラブルシューティング

### Q: サイドバーが表示されない
**A:** 共通クラスが正しく追加されているか確認してください。
```html
<!-- 正しい -->
<div id="left-sidebar" class="sidebar-base sidebar-base--left">

<!-- 間違い -->
<div id="left-sidebar">
```

### Q: サイドバーの幅がおかしい
**A:** CSS変数が正しく定義されているか確認してください。
```css
/* Phase 1で定義されているはず */
:root {
  --left-sidebar-width: 320px;
  --sidebar-width: 340px;
}
```

### Q: トグルボタンが動かない
**A:** JavaScriptは変更していないので、HTMLのクラス追加のみで動作するはずです。
ブラウザのコンソールでエラーを確認してください。

---

## 期待される結果

### CSS削減
- 削除前: 約120行
- 削除後: 約60行
- **削減量: 約60行（50%削減）**

### ファイルサイズ
- Phase 2適用版: X KB
- Phase 3適用版: (X - 2) KB
- **削減: 約2KB**

### メリット
- ✅ 重複コードの削減
- ✅ 保守性の向上
- ✅ 一貫性の向上
- ✅ バグ修正が容易に

---

## 次のステップ

Phase 3が完了したら、Phase 4（トグルボタンのCSS統合）に進みます。
