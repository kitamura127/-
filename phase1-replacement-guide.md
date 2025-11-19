# Phase 1: CSS変数置き換えガイド

## 概要
このドキュメントは、元のHTMLファイルのCSS内のハードコードされた値をCSS変数に置き換える具体的な手順を示します。

---

## 置き換えマッピング表

### 色（Colors）

| 元の値 | CSS変数 | 用途 |
|--------|---------|------|
| `#4285f4` | `var(--primary-color)` | プライマリカラー（青） |
| `#3367d6` | `var(--primary-hover)` | プライマリホバー |
| `#4caf50` | `var(--success-color)` | 成功・緑 |
| `#2e7d32` | `var(--success-dark)` | 濃い緑 |
| `#ffc107` | `var(--warning-color)` | 警告・黄 |
| `#f57f17` | `var(--warning-dark)` | 濃い黄 |
| `#f44336` | `var(--danger-color)` | 危険・赤 |
| `#c62828` | `var(--danger-dark)` | 濃い赤 |
| `#2196F3` | `var(--info-color)` | 情報・青 |
| `#1565c0` | `var(--info-dark)` | 濃い青 |
| `#333` | `var(--text-primary)` | メインテキスト |
| `#555` | `var(--text-secondary)` | セカンダリテキスト |
| `#666` | `var(--text-tertiary)` | 三次テキスト |
| `#999` | `var(--text-muted)` | 薄いテキスト |
| `white` | `var(--bg-white)` | 白背景 |
| `#f8f9fa` | `var(--bg-gray-lighter)` | 薄いグレー背景 |
| `#f5f5f5` | `var(--bg-gray-light)` | グレー背景 |
| `#e0e0e0` | `var(--border-color)` | ボーダー |
| `#f0f0f0` | `var(--border-light)` | 薄いボーダー |
| `#ddd` | `var(--border-dark)` | 濃いボーダー |
| `#ccc` | `var(--border-darker)` | より濃いボーダー |

### サイズ（Sizes）

| 元の値 | CSS変数 | 用途 |
|--------|---------|------|
| `340px` | `var(--sidebar-width)` | 右サイドバー幅 |
| `320px` | `var(--left-sidebar-width)` | 左サイドバー幅 |
| `280px` | `var(--sidebar-width-tablet-left)` | タブレット時左サイドバー |
| `300px` | `var(--sidebar-width-tablet-right)` | タブレット時右サイドバー |
| `2px` | `var(--border-radius-xs)` | 極小角丸 |
| `4px` | `var(--border-radius-sm)` | 小角丸 |
| `6px` | `var(--border-radius-md)` | 中角丸 |
| `8px` | `var(--border-radius-lg)` | 大角丸 |
| `10px` | `var(--border-radius-xl)` | 特大角丸 |
| `12px` | `var(--border-radius-xxl)` | 超大角丸 |
| `20px` | `var(--border-radius-pill)` | ピル型 |
| `30px` | `var(--border-radius-pill-lg)` | 大ピル型 |
| `50%` | `var(--border-radius-round)` | 円形 |

### フォントサイズ（Font Sizes）

| 元の値 | CSS変数 | 用途 |
|--------|---------|------|
| `10px` | `var(--font-size-xs)` | 極小 |
| `11px` | `var(--font-size-sm)` | 小 |
| `12px` | `var(--font-size-md)` | 中 |
| `13px` | `var(--font-size-base)` | 基本 |
| `14px` | `var(--font-size-lg)` | 大 |
| `15px` | `var(--font-size-xl)` | 特大 |
| `16px` | `var(--font-size-xxl)` | 超大 |
| `18px` | `var(--font-size-huge)` | 巨大 |
| `20px` | `var(--font-size-title)` | タイトル |
| `22px` | `var(--font-size-large-title)` | 大タイトル |

### 間隔（Spacing）

| 元の値 | CSS変数 | 用途 |
|--------|---------|------|
| `4px` | `var(--spacing-xs)` | 極小間隔 |
| `6px` | `var(--spacing-sm)` | 小間隔 |
| `8px` | `var(--spacing-md)` | 中間隔 |
| `10px` | `var(--spacing-lg)` | 大間隔 |
| `12px` | `var(--spacing-xl)` | 特大間隔 |
| `15px` | `var(--spacing-xxl)` | 超大間隔 |
| `20px` | `var(--spacing-xxxl)` | 巨大間隔 |
| `24px` | `var(--spacing-huge)` | 最大間隔 |

### シャドウ（Shadows）

| 元の値 | CSS変数 | 用途 |
|--------|---------|------|
| `0 2px 8px rgba(0,0,0,0.1)` | `var(--shadow-sm)` | 小シャドウ |
| `0 4px 12px rgba(0,0,0,0.15)` | `var(--shadow-md)` | 中シャドウ |
| `0 4px 20px rgba(0,0,0,0.1)` | `var(--shadow-lg)` | 大シャドウ |
| `0 4px 16px rgba(0,0,0,0.2)` | `var(--shadow-xl)` | 特大シャドウ |
| `-2px 0 8px rgba(0,0,0,0.1)` | `var(--shadow-left)` | 左シャドウ |
| `2px 0 8px rgba(0,0,0,0.1)` | `var(--shadow-right)` | 右シャドウ |
| `0 2px 10px rgba(0,0,0,0.2)` | `var(--shadow-bottom)` | 下シャドウ |

---

## 具体的な置き換え例

### Before（元のコード）
```css
#left-sidebar {
  width: 320px;
  background: white;
  border-right: 1px solid #e0e0e0;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.btn {
  padding: 6px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
  color: #333;
  font-size: 12px;
}

.location-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  font-size: 13px;
}
```

### After（CSS変数適用後）
```css
#left-sidebar {
  width: var(--left-sidebar-width);
  background: var(--bg-white);
  border-right: var(--border-width-thin) solid var(--border-color);
  padding: var(--spacing-xxl);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow-sm);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border: var(--border-width-thin) solid var(--border-dark);
  border-radius: var(--border-radius-md);
  background: var(--bg-white);
  color: var(--text-primary);
  font-size: var(--font-size-md);
}

.location-name {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
  font-size: var(--font-size-base);
}
```

---

## 主要セクション別の置き換え箇所

### 1. サイドバー関連

**#left-sidebar**
```css
/* Before */
width: 320px;
background: white;
border-right: 1px solid #e0e0e0;

/* After */
width: var(--left-sidebar-width);
background: var(--bg-white);
border-right: var(--border-width-thin) solid var(--border-color);
```

**#sidebar**
```css
/* Before */
width: 340px;
background: white;
border-left: 1px solid #e0e0e0;

/* After */
width: var(--sidebar-width);
background: var(--bg-white);
border-left: var(--border-width-thin) solid var(--border-color);
```

### 2. ボタン関連

**.btn**
```css
/* Before */
padding: 6px 12px;
border: 1px solid #ddd;
border-radius: 6px;
background: #fff;
color: #333;
font-size: 12px;

/* After */
padding: var(--spacing-sm) var(--spacing-xl);
border: var(--border-width-thin) solid var(--border-dark);
border-radius: var(--border-radius-md);
background: var(--bg-white);
color: var(--text-primary);
font-size: var(--font-size-md);
```

**.btn:hover**
```css
/* Before */
background: #f5f5f5;
border-color: #4285f4;

/* After */
background: var(--bg-gray-light);
border-color: var(--primary-color);
```

### 3. 統計パネル

**.stats-panel**
```css
/* Before */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
padding: 10px 12px;
border-radius: 8px;
color: white;

/* After */
background: var(--gradient-purple);
padding: var(--spacing-lg) var(--spacing-xl);
border-radius: var(--border-radius-lg);
color: var(--text-white);
```

### 4. バッジ類

**.kubun-タネ未満**
```css
/* Before */
background: #ffebee;
color: #c62828;

/* After */
background: var(--bg-danger-light);
color: var(--danger-dark);
```

**.kubun-戦略予材**
```css
/* Before */
background: #e8f5e9;
color: #2e7d32;

/* After */
background: var(--bg-success-light);
color: var(--success-dark);
```

### 5. アイテムリスト

**.location-item**
```css
/* Before */
padding: 12px 15px;
border-bottom: 1px solid #f0f0f0;

/* After */
padding: var(--spacing-xl) var(--spacing-xxl);
border-bottom: var(--border-width-thin) solid var(--border-light);
```

**.location-item:hover**
```css
/* Before */
background: #f8f9fa;

/* After */
background: var(--bg-gray-lighter);
```

### 6. 入力フィールド

**#search**
```css
/* Before */
padding: 8px 12px;
border: 1px solid #ddd;
border-radius: 6px;
font-size: 13px;

/* After */
padding: var(--spacing-md) var(--spacing-xl);
border: var(--border-width-thin) solid var(--border-dark);
border-radius: var(--border-radius-md);
font-size: var(--font-size-base);
```

**#search:focus**
```css
/* Before */
border-color: #4285f4;

/* After */
border-color: var(--primary-color);
```

---

## 適用手順

### ステップ1: CSS変数定義を追加
元のHTMLファイルの`<style>`タグの**先頭**に、`css-variables.css`の内容をコピー＆ペースト

### ステップ2: 検索置換を実行
以下の順序で検索置換を実行（正確な順序が重要）

#### 色の置換
```
#4285f4 → var(--primary-color)
#3367d6 → var(--primary-hover)
#4caf50 → var(--success-color)
#2e7d32 → var(--success-dark)
#ffc107 → var(--warning-color)
#f57f17 → var(--warning-dark)
#f44336 → var(--danger-color)
#c62828 → var(--danger-dark)
#2196F3 → var(--info-color)
#1565c0 → var(--info-dark)
#ff9800 → var(--orange-color)
#ef6c00 → var(--orange-dark)
#7b1fa2 → var(--purple-color)
#5e35b1 → var(--indigo-color)
#9e9e9e → var(--gray-color)
#616161 → var(--gray-dark)
```

#### テキスト色の置換（CSSプロパティ内のみ）
```
color: #333 → color: var(--text-primary)
color: #555 → color: var(--text-secondary)
color: #666 → color: var(--text-tertiary)
color: #999 → color: var(--text-muted)
color: white → color: var(--text-white)
```

#### 背景色の置換
```
background: white → background: var(--bg-white)
background: #f8f9fa → background: var(--bg-gray-lighter)
background: #f5f5f5 → background: var(--bg-gray-light)
background: #e0e0e0 → background: var(--bg-gray)
background: #e8f5e9 → background: var(--bg-success-light)
background: #ffebee → background: var(--bg-danger-light)
background: #fff3e0 → background: var(--bg-warning-light)
background: #e3f2fd → background: var(--bg-info-light)
background: #f3e5f5 → background: var(--bg-purple-light)
background: #e8eaf6 → background: var(--bg-indigo-light)
background: #fff9c4 → background: var(--bg-yellow-light)
background: #fff3cd → background: var(--bg-error-light)
```

#### ボーダー色の置換
```
border: 1px solid #e0e0e0 → border: var(--border-width-thin) solid var(--border-color)
border: 1px solid #f0f0f0 → border: var(--border-width-thin) solid var(--border-light)
border: 1px solid #ddd → border: var(--border-width-thin) solid var(--border-dark)
border: 1px solid #ccc → border: var(--border-width-thin) solid var(--border-darker)
border: 2px solid → border: var(--border-width-medium) solid
border: 3px solid → border: var(--border-width-thick) solid
border: 4px solid → border: var(--border-width-extra-thick) solid
```

#### サイズの置換
```
width: 340px → width: var(--sidebar-width)
width: 320px → width: var(--left-sidebar-width)
```

#### border-radiusの置換
```
border-radius: 2px → border-radius: var(--border-radius-xs)
border-radius: 4px → border-radius: var(--border-radius-sm)
border-radius: 6px → border-radius: var(--border-radius-md)
border-radius: 8px → border-radius: var(--border-radius-lg)
border-radius: 10px → border-radius: var(--border-radius-xl)
border-radius: 12px → border-radius: var(--border-radius-xxl)
border-radius: 20px → border-radius: var(--border-radius-pill)
border-radius: 30px → border-radius: var(--border-radius-pill-lg)
border-radius: 50% → border-radius: var(--border-radius-round)
```

#### フォントサイズの置換
```
font-size: 10px → font-size: var(--font-size-xs)
font-size: 11px → font-size: var(--font-size-sm)
font-size: 12px → font-size: var(--font-size-md)
font-size: 13px → font-size: var(--font-size-base)
font-size: 14px → font-size: var(--font-size-lg)
font-size: 15px → font-size: var(--font-size-xl)
font-size: 16px → font-size: var(--font-size-xxl)
font-size: 18px → font-size: var(--font-size-huge)
font-size: 20px → font-size: var(--font-size-title)
font-size: 22px → font-size: var(--font-size-large-title)
```

#### フォントウェイトの置換
```
font-weight: 400 → font-weight: var(--font-weight-normal)
font-weight: 500 → font-weight: var(--font-weight-medium)
font-weight: 600 → font-weight: var(--font-weight-semibold)
font-weight: 700 → font-weight: var(--font-weight-bold)
font-weight: bold → font-weight: var(--font-weight-bold)
```

#### シャドウの置換
```
box-shadow: 0 2px 8px rgba(0,0,0,0.1) → box-shadow: var(--shadow-sm)
box-shadow: 0 4px 12px rgba(0,0,0,0.15) → box-shadow: var(--shadow-md)
box-shadow: 0 4px 20px rgba(0,0,0,0.1) → box-shadow: var(--shadow-lg)
box-shadow: 0 4px 16px rgba(0,0,0,0.2) → box-shadow: var(--shadow-xl)
box-shadow: -2px 0 8px rgba(0,0,0,0.1) → box-shadow: var(--shadow-left)
box-shadow: 2px 0 8px rgba(0,0,0,0.1) → box-shadow: var(--shadow-right)
box-shadow: 0 2px 10px rgba(0,0,0,0.2) → box-shadow: var(--shadow-bottom)
```

### ステップ3: 手動調整
以下は手動で確認・調整が必要：

1. **グラデーション**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` → `var(--gradient-purple)`
2. **transition**: `0.2s` → `var(--transition-fast)`, `0.3s` → `var(--transition-normal)`
3. **opacity**: `0.5` → `var(--opacity-light)`, `0.9` → `var(--opacity-strong)`
4. **z-index**: 適切なCSS変数に置換

### ステップ4: 動作確認
- ブラウザで開いて表示確認
- 全機能の動作確認
- レスポンシブ表示確認

---

## 注意事項

### 置換しない箇所
以下は置換**しない**でください：

1. **JavaScript内の文字列**: JavaScriptコード内の色やサイズの文字列は置換不要
2. **コメント**: CSS/HTMLコメント内の値
3. **rgba値**: `rgba(255,255,255,0.2)` などの透明度付き色（一部除く）
4. **transform値**: `translateX(-50%)` など
5. **calc関数**: `calc(100vh - 60px)` など
6. **パーセント値**: `100%`, `50%` など（border-radius: 50%は除く）

### 検索置換の順序
**必ず大きい値から小さい値の順**で置換してください。
例：`15px` → `12px` → `10px` → `8px` の順

逆順だと、`8px`を先に置換すると`18px`も誤って置換されてしまいます。

---

## 期待される効果

### コード量
- CSS変数定義追加: +約200行
- 置換による可読性向上
- 実質的な削減はPhase 2以降

### メリット
- ✅ テーマ変更が容易
- ✅ 一貫性の向上
- ✅ 保守性の向上
- ✅ 後続Phaseの基盤

### 次のステップ
Phase 1完了後、Phase 2（共通クラスの作成）に進みます。
