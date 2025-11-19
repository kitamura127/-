# Phase 6: HTML/JavaScript修正ガイド

## 概要

Phase 6では、HTMLとJavaScript内のバッジクラス名を、Phase 2の共通クラスに置き換えます。

---

## クラス名マッピング表

### 1. 区分バッジ

| 旧クラス | 新クラス | 用途 |
|---------|---------|------|
| `location-kubun kubun-タネ未満` | `badge badge--danger location-kubun` | タネ未満 |
| `location-kubun kubun-戦略予材` | `badge badge--success location-kubun` | 戦略予材 |
| `location-kubun kubun-現場` | `badge badge--info location-kubun` | 現場 |
| `location-kubun kubun-その他` | `badge badge--purple location-kubun` | その他 |
| `location-kubun kubun-default` | `badge badge--indigo location-kubun` | デフォルト |

### 2. 訪問ステータスバッジ

| 旧クラス | 新クラス | 用途 |
|---------|---------|------|
| `visit-status status-recent` | `badge badge--gray visit-status` | 最近訪問 |
| `visit-status status-warning` | `badge badge--yellow visit-status` | 警告 |
| `visit-status status-urgent` | `badge badge--danger visit-status` | 緊急 |

### 3. その他のバッジ

| 旧クラス | 新クラス | 用途 |
|---------|---------|------|
| `cases-badge` | `badge badge--count cases-badge` | 新着案件数 |
| `update-badge` | `badge badge--new update-badge` | 更新通知 |
| `duplicate-badge` | `badge badge--duplicate` | 重複警告 |

### 4. 優先度バッジ

| 旧クラス | 新クラス | 用途 |
|---------|---------|------|
| `insight-priority priority-high` | `badge badge--danger insight-priority` | 高優先度 |
| `insight-priority priority-medium` | `badge badge--orange insight-priority` | 中優先度 |
| `insight-priority priority-low` | `badge badge--success insight-priority` | 低優先度 |

### 5. 価格バッジ

| 旧クラス | 新クラス | 用途 |
|---------|---------|------|
| `new-case-price` | `badge badge--success new-case-price` | 案件価格 |

---

## HTML修正箇所

### 1. 左サイドバー - 新着案件数バッジ

#### Before
```html
<button class="tab-btn" onclick="switchLeftTab('newcases')">
  📬 新着案件 <span class="cases-badge hidden" id="left-cases-badge">0</span>
</button>
```

#### After
```html
<button class="tab-btn" onclick="switchLeftTab('newcases')">
  📬 新着案件 <span class="badge badge--count cases-badge hidden" id="left-cases-badge">0</span>
</button>
```

---

## JavaScript修正箇所

### 1. displayLocations() 関数内

**区分バッジの生成**:

#### Before
```javascript
const kubunClass = loc.kubun ? `kubun-${loc.kubun}` : 'kubun-default';

item.innerHTML = `
  <div>
    ${loc.kubun ? `<span class="location-kubun ${kubunClass}">${escapeHtml(loc.kubun)}</span>` : ''}
    <span class="visit-status ${visitStatus.class}">${visitStatus.label}</span>
  </div>
`;
```

#### After
```javascript
// 区分バッジのクラスマッピング
const kubunClassMap = {
  'タネ未満': 'badge badge--danger location-kubun',
  '戦略予材': 'badge badge--success location-kubun',
  '現場': 'badge badge--info location-kubun',
  'その他': 'badge badge--purple location-kubun',
  'default': 'badge badge--indigo location-kubun'
};

const kubunClass = loc.kubun ? kubunClassMap[loc.kubun] || kubunClassMap['default'] : kubunClassMap['default'];

// 訪問ステータスのクラスマッピング
const statusClassMap = {
  'status-recent': 'badge badge--gray visit-status',
  'status-warning': 'badge badge--yellow visit-status',
  'status-urgent': 'badge badge--danger visit-status'
};

const statusClass = statusClassMap[visitStatus.class] || 'badge badge--gray visit-status';

item.innerHTML = `
  <div>
    ${loc.kubun ? `<span class="${kubunClass}">${escapeHtml(loc.kubun)}</span>` : ''}
    <span class="${statusClass}">${visitStatus.label}</span>
  </div>
`;
```

---

### 2. displayInsights() 関数内

**優先度バッジの生成**:

#### Before
```javascript
html += `
  <div class="insight-item" onclick="showInsightDetail(${index})">
    <div class="insight-priority ${priorityClass}">${opp.priority}</div>
    ...
  </div>
`;
```

#### After
```javascript
// 優先度バッジのクラスマッピング
const priorityClassMap = {
  'priority-high': 'badge badge--danger insight-priority',
  'priority-medium': 'badge badge--orange insight-priority',
  'priority-low': 'badge badge--success insight-priority'
};

const priorityBadgeClass = priorityClassMap[priorityClass] || 'badge badge--danger insight-priority';

html += `
  <div class="insight-item" onclick="showInsightDetail(${index})">
    <div class="${priorityBadgeClass}">${opp.priority}</div>
    ...
  </div>
`;
```

---

### 3. displayNewCases() 関数内

**価格バッジの生成**:

#### Before
```javascript
item.innerHTML = `
  <div class="new-case-name">${escapeHtml(caseData.projectName)}</div>
  ...
  <div class="new-case-price">💰 ${caseData.price.toLocaleString()}円</div>
  ...
`;
```

#### After
```javascript
item.innerHTML = `
  <div class="new-case-name">${escapeHtml(caseData.projectName)}</div>
  ...
  <div class="badge badge--success new-case-price">💰 ${caseData.price.toLocaleString()}円</div>
  ...
`;
```

---

### 4. showInfo() と showMobileModal() 関数内

**重複バッジの生成**:

#### Before
```javascript
const duplicateBadge = hasDuplicates ?
  `<span class="duplicate-badge" title="${loc.duplicates.join(', ')}も登録">⚠️ 重複</span>` : '';
```

#### After
```javascript
const duplicateBadge = hasDuplicates ?
  `<span class="badge badge--duplicate" title="${loc.duplicates.join(', ')}も登録">⚠️ 重複</span>` : '';
```

---

### 5. 更新バッジ（NEWバッジ）の生成

#### Before
```javascript
${highlightNew && index === locations.length - 1 ? '<span class="update-badge">NEW</span>' : ''}
```

#### After
```javascript
${highlightNew && index === locations.length - 1 ? '<span class="badge badge--new update-badge">NEW</span>' : ''}
```

---

## CSS修正箇所

### 削除するCSS

以下のCSSブロックを**完全に削除**します：

```css
/* 削除対象 */
.location-kubun {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  margin-top: 4px;
  font-weight: 500;
}

.kubun-タネ未満 {
  background: #ffebee;
  color: #c62828;
}

.kubun-戦略予材 {
  background: #e8f5e9;
  color: #2e7d32;
}

.kubun-現場 {
  background: #e3f2fd;
  color: #1565c0;
}

.kubun-その他 {
  background: #f3e5f5;
  color: #7b1fa2;
}

.kubun-default {
  background: #e8eaf6;
  color: #5e35b1;
}

.visit-status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  margin-top: 4px;
  font-weight: 500;
  margin-left: 4px;
}

.status-recent {
  background: #e0e0e0;
  color: #616161;
}

.status-warning {
  background: #fff9c4;
  color: #f57f17;
}

.status-urgent {
  background: #ffebee;
  color: #c62828;
}

.cases-badge {
  background: #f44336;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
}

.update-badge {
  background: #4caf50;
  color: white;
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 10px;
  margin-left: 6px;
  font-weight: 500;
}

.duplicate-badge {
  background: #ff9800;
  color: white;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: 10px;
  margin-left: 6px;
  font-weight: 600;
  cursor: help;
}

.insight-priority {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 6px;
}

.priority-high {
  background: #ffebee;
  color: #c62828;
}

.priority-medium {
  background: #fff3e0;
  color: #ef6c00;
}

.priority-low {
  background: #e8f5e9;
  color: #2e7d32;
}

.new-case-price {
  display: inline-block;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  margin-top: 6px;
}
```

---

### 追加するCSS

`phase6-badge-integration.css` の内容を、削除した箇所に追加します。

```css
/* Phase 6: バッジ類CSS統合 */

/* 区分バッジ - 個別プロパティ */
.location-kubun {
  margin-top: var(--spacing-xs);
}

/* 訪問ステータスバッジ - 個別プロパティ */
.visit-status {
  margin-top: var(--spacing-xs);
  margin-left: var(--spacing-xs);
}

/* 新着案件数バッジ - 個別プロパティ */
.cases-badge {
  margin-left: var(--spacing-md);
}

/* 更新バッジ - 個別プロパティ */
.update-badge {
  margin-left: var(--spacing-sm);
}

/* インサイト優先度バッジ - 個別プロパティ */
.insight-priority {
  margin-bottom: var(--spacing-sm);
}

/* 新着案件価格バッジ - 個別プロパティ */
.new-case-price {
  padding: var(--spacing-xxs) var(--spacing-lg);
  border-radius: var(--border-radius-xxl);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

/* 重複情報 */
.duplicate-info {
  font-size: var(--font-size-sm);
  color: var(--orange-color);
  margin-top: var(--spacing-xs);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
```

---

## 修正手順

### ステップ1: JavaScriptの修正

1. `displayLocations()` 関数内のバッジ生成コードを修正
2. `displayInsights()` 関数内のバッジ生成コードを修正
3. `displayNewCases()` 関数内のバッジ生成コードを修正
4. `showInfo()` と `showMobileModal()` 関数内のバッジ生成コードを修正

### ステップ2: HTMLの修正

1. 静的なHTMLに記述されたバッジクラスを修正
   - 新着案件数バッジ（`.cases-badge`）

### ステップ3: CSSの削除

1. バッジ関連のCSS定義を探す（約95行）
2. 重複部分を削除
3. `phase6-badge-integration.css` の内容を追加（約15行）

### ステップ4: 動作確認

1. ブラウザで開く
2. 全てのバッジが正しく表示されるか確認
3. 色が正しいか確認
4. スタイルが崩れていないか確認

---

## 確認ポイント

### 表示確認
- [ ] 区分バッジが正しく表示される
- [ ] 訪問ステータスバッジが正しく表示される
- [ ] 新着案件数バッジが正しく表示される
- [ ] 優先度バッジが正しく表示される
- [ ] 価格バッジが正しく表示される
- [ ] 重複バッジが正しく表示される
- [ ] 更新（NEW）バッジが正しく表示される

### 色確認
- [ ] タネ未満: 赤（#ffebee / #c62828）
- [ ] 戦略予材: 緑（#e8f5e9 / #2e7d32）
- [ ] 現場: 青（#e3f2fd / #1565c0）
- [ ] その他: 紫（#f3e5f5 / #7b1fa2）
- [ ] 最近訪問: 灰（#e0e0e0 / #616161）
- [ ] 警告: 黄（#fff9c4 / #f57f17）
- [ ] 緊急: 赤（#ffebee / #c62828）

### 機能確認
- [ ] バッジのクリックイベントが動作する（該当する場合）
- [ ] ツールチップが表示される（重複バッジ等）

---

## トラブルシューティング

### Q: バッジが表示されない
**A:** クラス名が正しく変更されているか確認
```javascript
// NG
class="kubun-タネ未満"

// OK
class="badge badge--danger location-kubun"
```

### Q: バッジの色が違う
**A:** Phase 2の共通クラスが定義されているか確認
```css
/* Phase 2で定義されているはず */
.badge--danger {
  background: var(--bg-danger-light);
  color: var(--danger-dark);
}
```

### Q: バッジの間隔がおかしい
**A:** 個別のマージン設定が残っているか確認
```css
/* phase6-badge-integration.css で定義 */
.location-kubun {
  margin-top: var(--spacing-xs);
}
```

---

## 期待される結果

### CSS削減
- 削除前: 約95行
- 削除後: 約15行
- **削減量: 約80行（84%削減）**

### ファイルサイズ
- Phase 4適用版: X KB
- Phase 6適用版: (X - 3) KB
- **削減: 約3KB**

---

## 次のステップ

Phase 6が完了したら、Phase 7（モバイルCSS整理）に進むことを推奨します。
