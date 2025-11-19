# Phase 5: 統計パネルCSS統合 - HTML/JavaScript修正ガイド

## 📋 概要

Phase 5では、`.stats-panel` と `.stats-panel-large` の重複を解消します。基本クラス + モディファイアクラスのパターンを使って統合します。

**削減効果**: 約100行（50%削減）
**リスクレベル**: 高
**影響範囲**: 統計パネルの表示（右サイドバーとリスト表示の2カラムレイアウト）

---

## 🎯 修正内容

### 1. HTML修正: 通常版統計パネル（右サイドバー内）

#### Before
```html
<div class="stats-panel" id="stats-panel">
  <div class="stats-header">
    <div class="stats-title">📊 今月の戦略予材接触状況</div>
    <button onclick="editTargetGoal()" style="...">目標設定</button>
  </div>
  <div class="stats-content">
    <div class="stat-item">
      <div class="stat-value" id="stat-visited">-</div>
      <div class="stat-label">訪問済</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-value" id="stat-target">-</div>
      <div class="stat-label">目標</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-value" id="stat-rate">-%</div>
      <div class="stat-label">達成率</div>
    </div>
  </div>
  <div class="stats-message" id="stat-message"></div>
</div>
```

#### After
```html
<div class="stats-panel" id="stats-panel">
  <div class="stats-header">
    <div class="stats-title">📊 今月の戦略予材接触状況</div>
    <button onclick="editTargetGoal()" class="goal-edit-btn">目標設定</button>
  </div>
  <div class="stats-content">
    <div class="stat-item">
      <div class="stat-value" id="stat-visited">-</div>
      <div class="stat-label">訪問済</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-value" id="stat-target">-</div>
      <div class="stat-label">目標</div>
    </div>
    <div class="stat-divider"></div>
    <div class="stat-item">
      <div class="stat-value" id="stat-rate">-%</div>
      <div class="stat-label">達成率</div>
    </div>
  </div>
  <div class="stats-message" id="stat-message"></div>
</div>
```

**変更点**:
- ボタンのインラインスタイルを削除し、`class="goal-edit-btn"` を追加
- その他の構造は変更なし

### 2. HTML修正: 拡大版統計パネル（リスト表示の2カラムレイアウト内）

#### Before
```html
<div class="stats-panel-large">
  <div class="stats-header-large">
    <div class="stats-title-large">📊 今月の戦略予材接触状況</div>
    <button onclick="editTargetGoal()" class="goal-edit-btn">目標設定</button>
  </div>
  <div class="stats-content-large">
    <div class="stat-item-large">
      <div class="stat-value-large" id="stat-visited-large">-</div>
      <div class="stat-label-large">訪問済</div>
    </div>
    <div class="stat-divider-large"></div>
    <div class="stat-item-large">
      <div class="stat-value-large" id="stat-target-large">-</div>
      <div class="stat-label-large">目標</div>
    </div>
    <div class="stat-divider-large"></div>
    <div class="stat-item-large">
      <div class="stat-value-large" id="stat-rate-large">-%</div>
      <div class="stat-label-large">達成率</div>
    </div>
  </div>
  <div class="stats-message-large" id="stat-message-large"></div>
</div>
```

#### After
```html
<div class="stats-panel stats-panel--large">
  <div class="stats-header stats-header--large">
    <div class="stats-title stats-title--large">📊 今月の戦略予材接触状況</div>
    <button onclick="editTargetGoal()" class="goal-edit-btn">目標設定</button>
  </div>
  <div class="stats-content stats-content--large">
    <div class="stat-item stat-item--large">
      <div class="stat-value stat-value--large" id="stat-visited-large">-</div>
      <div class="stat-label stat-label--large">訪問済</div>
    </div>
    <div class="stat-divider stat-divider--large"></div>
    <div class="stat-item stat-item--large">
      <div class="stat-value stat-value--large" id="stat-target-large">-</div>
      <div class="stat-label stat-label--large">目標</div>
    </div>
    <div class="stat-divider stat-divider--large"></div>
    <div class="stat-item stat-item--large">
      <div class="stat-value stat-value--large" id="stat-rate-large">-%</div>
      <div class="stat-label stat-label--large">達成率</div>
    </div>
  </div>
  <div class="stats-message stats-message--large" id="stat-message-large"></div>
</div>
```

**変更点**:
- すべての `-large` サフィックスを `--large` モディファイアに変更
- 基本クラスとモディファイアクラスの両方を指定

### 3. CSS修正: 元のCSSから削除する部分

#### 削除対象1: 通常版統計パネルのCSS

以下のCSS定義を **削除** します：

```css
.stats-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 10px;
  color: white;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.stats-title {
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  line-height: 1.2;
}

.stat-label {
  font-size: 10px;
  opacity: 0.9;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: rgba(255,255,255,0.3);
  margin: 0 8px;
}

.stats-message {
  margin-top: 6px;
  font-size: 11px;
  opacity: 0.9;
  text-align: center;
}
```

#### 削除対象2: 拡大版統計パネルのCSS

以下のCSS定義を **削除** します：

```css
.stats-panel-large {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 24px;
  color: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.stats-header-large {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.stats-title-large {
  font-size: 18px;
  font-weight: 700;
}

.stats-content-large {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 16px;
}

.stat-item-large {
  text-align: center;
  flex: 1;
}

.stat-value-large {
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label-large {
  font-size: 14px;
  opacity: 0.9;
}

.stat-divider-large {
  width: 1px;
  height: 60px;
  background: rgba(255, 255, 255, 0.3);
}

.stats-message-large {
  text-align: center;
  font-size: 15px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.goal-edit-btn {
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.5);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.goal-edit-btn:hover {
  background: rgba(255,255,255,0.3);
}
```

#### 削除対象3: インラインボタンスタイル

通常版統計パネルの目標設定ボタンから、以下のインラインスタイルを **削除** します：

```html
<!-- Before -->
<button onclick="editTargetGoal()" style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.5); color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; cursor: pointer;">目標設定</button>

<!-- After -->
<button onclick="editTargetGoal()" class="goal-edit-btn">目標設定</button>
```

### 4. CSS追加: 統合CSSの追加

`phase5-stats-integration.css` の内容を `<style>` タグ内の適切な位置に追加します。

**推奨追加位置**: Phase 2の共通クラス定義の後、または統計パネル関連のCSS定義があった場所

### 5. JavaScript修正: `updateLargeStats()` 関数

#### JavaScript関数の確認

元のHTMLに `updateLargeStats()` 関数がある場合、ID参照を確認します。

```javascript
function updateLargeStats() {
  const visited = document.getElementById('stat-visited').textContent;
  const target = document.getElementById('stat-target').textContent;
  const rate = document.getElementById('stat-rate').textContent;
  const message = document.getElementById('stat-message').textContent;

  document.getElementById('stat-visited-large').textContent = visited;
  document.getElementById('stat-target-large').textContent = target;
  document.getElementById('stat-rate-large').textContent = rate;
  document.getElementById('stat-message-large').textContent = message;
}
```

**変更不要**: ID名は変わらないため、JavaScript関数の修正は不要です。

---

## 🔧 修正手順

### ステップ1: バックアップ

```bash
cp index.html index-backup.html
```

### ステップ2: CSS削除

元のHTMLの `<style>` タグ内から、以下のクラス定義をすべて削除：

- `.stats-panel` から `.stats-message` まで（通常版）
- `.stats-panel-large` から `.goal-edit-btn:hover` まで（拡大版）

### ステップ3: CSS追加

`phase5-stats-integration.css` の内容を `<style>` タグ内に追加。

### ステップ4: HTML修正（通常版）

右サイドバー内の統計パネルを修正：

1. ボタンのインラインスタイルを削除
2. `class="goal-edit-btn"` を追加

### ステップ5: HTML修正（拡大版）

リスト表示の2カラムレイアウト内の統計パネルを修正：

1. `.stats-panel-large` → `.stats-panel .stats-panel--large`
2. `.stats-header-large` → `.stats-header .stats-header--large`
3. `.stats-title-large` → `.stats-title .stats-title--large`
4. `.stats-content-large` → `.stats-content .stats-content--large`
5. `.stat-item-large` → `.stat-item .stat-item--large`（3箇所）
6. `.stat-value-large` → `.stat-value .stat-value--large`（3箇所）
7. `.stat-label-large` → `.stat-label .stat-label--large`（3箇所）
8. `.stat-divider-large` → `.stat-divider .stat-divider--large`（2箇所）
9. `.stats-message-large` → `.stats-message .stats-message--large`

---

## ✅ 動作確認チェックリスト

### 通常版統計パネル（右サイドバー）

- [ ] 統計パネルが正常に表示される
- [ ] グラデーション背景が表示される
- [ ] タイトルが12pxで表示される
- [ ] 訪問済・目標・達成率が20pxで表示される
- [ ] ラベルが10pxで表示される
- [ ] 区切り線が表示される（高さ30px）
- [ ] メッセージが11pxで表示される
- [ ] 目標設定ボタンが表示され、クリックできる

### 拡大版統計パネル（リスト表示）

- [ ] 統計パネルが正常に表示される
- [ ] グラデーション背景が表示される
- [ ] タイトルが18pxで表示される
- [ ] 訪問済・目標・達成率が42pxで表示される
- [ ] ラベルが14pxで表示される
- [ ] 区切り線が表示される（高さ60px）
- [ ] メッセージが15pxで表示される
- [ ] 目標設定ボタンが表示され、クリックできる
- [ ] パディングが24pxになっている
- [ ] ボックスシャドウが表示される

### JavaScript機能

- [ ] `updateLargeStats()` 関数が正常に動作する
- [ ] 通常版の値が拡大版に正しくコピーされる
- [ ] 目標設定機能が正常に動作する
- [ ] 統計データの更新が正常に動作する

### レスポンシブ

- [ ] デスクトップ表示で通常版が表示される
- [ ] モバイルでリスト表示に切り替えたとき拡大版が表示される
- [ ] どちらのサイズでも見た目が崩れていない

---

## ⚠️ 注意事項

### 高リスクのポイント

1. **統計パネルは重要な情報を表示**
   - 訪問実績や目標達成率を表示するため、表示エラーは業務に影響
   - 慎重にテストすること

2. **2つのパネルが存在**
   - 右サイドバーの通常版
   - リスト表示の拡大版
   - 両方を修正する必要がある

3. **JavaScript連携**
   - `updateLargeStats()` 関数がID参照している
   - ID名は変更しないこと

4. **CSS変数の依存**
   - Phase 1で定義したCSS変数を使用
   - CSS変数が未定義の場合、表示が崩れる可能性

### トラブルシューティング

**Q1: 統計パネルの背景が表示されない**

原因: CSS変数 `--gradient-primary-start` と `--gradient-primary-end` が未定義

解決方法:
```css
:root {
  --gradient-primary-start: #667eea;
  --gradient-primary-end: #764ba2;
}
```

**Q2: フォントサイズがおかしい**

原因: CSS変数 `--font-size-*` が未定義

解決方法: `phase5-stats-integration.css` の `:root` セクションを確認し、必要な変数がすべて定義されているか確認

**Q3: 拡大版のスタイルが適用されない**

原因: モディファイアクラス `--large` が正しく追加されていない

解決方法: HTML を確認し、`class="stats-panel stats-panel--large"` のように基本クラスとモディファイアクラスの両方が指定されているか確認

---

## 📊 期待される削減効果

### CSS行数

| 項目 | Before | After | 削減 |
|------|--------|-------|------|
| 通常版CSS | 約50行 | 約25行 | 約25行 |
| 拡大版CSS | 約75行 | - | 約75行 |
| **合計** | **約125行** | **約25行** | **約100行** |

**削減率**: 80%

### 保守性の向上

- スタイルの変更が1箇所で完結
- 通常版と拡大版の一貫性が保証される
- BEM風の命名規則で可読性向上

---

## 📝 まとめ

Phase 5では、統計パネルの重複CSSを約100行（80%）削減します。基本クラス + モディファイアクラスのパターンを使うことで、保守性が大幅に向上します。

**重要**: 統計パネルは業務上重要な情報を表示するため、Phase 5の適用後は必ず動作確認を行ってください。
