# Phase 6: バッジ類CSS統合 - 完了ガイド

## 📦 成果物

Phase 6では以下のファイルを作成しました：

1. **phase6-badge-integration.css** - 統合後のバッジCSS
2. **phase6-html-changes.md** - HTML/JavaScript修正の詳細ガイド
3. **apply-phase6.py** - 自動適用スクリプト
4. **PHASE6-README.md** - このファイル

---

## 🎯 Phase 6の目的

Phase 6では、**バッジ類の重複CSSを大幅に削減**します。

### 削減内容
- ✅ 区分バッジ（.kubun-*）の重複CSS削除
- ✅ ステータスバッジ（.status-*）の重複CSS削除
- ✅ その他バッジ（.cases-badge, .update-badge等）の重複CSS削除
- ✅ Phase 2の共通クラスを活用
- ✅ 約80行のCSS削減（84%削減）

### リスクレベル
**低リスク** - バッジのスタイルは独立しており、他への影響が少ない

---

## 🚀 使用方法

### 自動適用（推奨）

```bash
# Phase 4適用済みファイルから
python3 apply-phase6.py index-phase4.html index-phase6.html
```

**期待される出力**:
```
📖 読み込み: index-phase4.html
   ファイルサイズ: XXX,XXX バイト
🔄 Phase 6を適用中...
  1/4: HTMLのバッジクラスを更新...
  2/4: JavaScriptのバッジ生成コードを更新...
  3/4: Phase 6のCSS定義を読み込み...
  4/4: 重複CSSを削除してPhase 6のCSSを統合...
✅ 完了: index-phase6.html
   ファイルサイズ: XXX,XXX バイト
   差分: -2,000 バイト

📊 変更内容:
   バッジ共通クラス使用箇所: 20+ 箇所
   区分バッジマッピング追加: ✅
   ステータスバッジマッピング追加: ✅
   Phase 6のCSS追加: ✅

🎉 Phase 6 完了！
```

---

## 📝 変更内容の詳細

### クラス名マッピング

| 旧クラス | 新クラス | 削減 |
|---------|---------|------|
| `kubun-タネ未満` | `badge badge--danger location-kubun` | 色定義削除 |
| `kubun-戦略予材` | `badge badge--success location-kubun` | 色定義削除 |
| `kubun-現場` | `badge badge--info location-kubun` | 色定義削除 |
| `kubun-その他` | `badge badge--purple location-kubun` | 色定義削除 |
| `status-recent` | `badge badge--gray visit-status` | 色定義削除 |
| `status-warning` | `badge badge--yellow visit-status` | 色定義削除 |
| `status-urgent` | `badge badge--danger visit-status` | 色定義削除 |
| `cases-badge` | `badge badge--count cases-badge` | 色定義削除 |
| `update-badge` | `badge badge--new update-badge` | 色定義削除 |
| `duplicate-badge` | `badge badge--duplicate` | 色定義削除 |
| `priority-high` | `badge badge--danger insight-priority` | 色定義削除 |
| `priority-medium` | `badge badge--orange insight-priority` | 色定義削除 |
| `priority-low` | `badge badge--success insight-priority` | 色定義削除 |

---

### JavaScript変更

#### Before
```javascript
const kubunClass = loc.kubun ? `kubun-${loc.kubun}` : 'kubun-default';

item.innerHTML = `
  <span class="location-kubun ${kubunClass}">${escapeHtml(loc.kubun)}</span>
  <span class="visit-status ${visitStatus.class}">${visitStatus.label}</span>
`;
```

#### After
```javascript
// クラスマッピング定義
const kubunClassMap = {
  'タネ未満': 'badge badge--danger location-kubun',
  '戦略予材': 'badge badge--success location-kubun',
  '現場': 'badge badge--info location-kubun',
  'その他': 'badge badge--purple location-kubun',
  'default': 'badge badge--indigo location-kubun'
};

const statusClassMap = {
  'status-recent': 'badge badge--gray visit-status',
  'status-warning': 'badge badge--yellow visit-status',
  'status-urgent': 'badge badge--danger visit-status'
};

const kubunClass = loc.kubun ? kubunClassMap[loc.kubun] || kubunClassMap['default'] : kubunClassMap['default'];
const statusClass = statusClassMap[visitStatus.class] || 'badge badge--gray visit-status';

item.innerHTML = `
  <span class="${kubunClass}">${escapeHtml(loc.kubun)}</span>
  <span class="${statusClass}">${visitStatus.label}</span>
`;
```

---

### CSS変更

#### 削除されるCSS（約80行）

```css
/* 削除される（15個のバッジ定義） */
.kubun-タネ未満 {
  background: #ffebee;
  color: #c62828;
}

.kubun-戦略予材 {
  background: #e8f5e9;
  color: #2e7d32;
}

/* ... 他13個のバッジ定義も削除 ... */
```

---

#### 残るCSS（個別差分のみ、約15行）

```css
/* Phase 6: バッジ類CSS統合 */

/* 個別のマージン設定のみ残す */
.location-kubun {
  margin-top: var(--spacing-xs);
}

.visit-status {
  margin-top: var(--spacing-xs);
  margin-left: var(--spacing-xs);
}

.cases-badge {
  margin-left: var(--spacing-md);
}

.update-badge {
  margin-left: var(--spacing-sm);
}

.insight-priority {
  margin-bottom: var(--spacing-sm);
}

.new-case-price {
  padding: var(--spacing-xxs) var(--spacing-lg);
  border-radius: var(--border-radius-xxl);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}
```

---

## ✅ 動作確認チェックリスト

Phase 6適用後、以下を確認してください：

### 基本確認
- [ ] ページが正常に表示される
- [ ] 見た目が Phase 4 と同じ（重要）
- [ ] コンソールにエラーがない

### バッジ表示確認
- [ ] 区分バッジ（タネ未満、戦略予材、現場、その他）が表示される
- [ ] 訪問ステータスバッジ（最近訪問、警告、緊急）が表示される
- [ ] 新着案件数バッジが表示される
- [ ] 優先度バッジ（高、中、低）が表示される
- [ ] 価格バッジが表示される
- [ ] 重複バッジが表示される
- [ ] 更新（NEW）バッジが表示される

### 色確認
- [ ] タネ未満: 赤背景・赤文字
- [ ] 戦略予材: 緑背景・緑文字
- [ ] 現場: 青背景・青文字
- [ ] その他: 紫背景・紫文字
- [ ] 最近訪問: 灰背景・灰文字
- [ ] 警告: 黄背景・黄文字
- [ ] 緊急: 赤背景・赤文字

### スタイル確認
- [ ] バッジの角丸が正しい
- [ ] バッジのパディングが正しい
- [ ] バッジのマージンが正しい
- [ ] バッジのフォントサイズが正しい

---

## 📊 Phase 6での削減効果

### CSS削減
- **削除前（Phase 4）**: 約95行（バッジ関連）
- **削除後（Phase 6）**: 約15行（個別差分のみ）
- **削減量**: 約80行（84%削減）

### ファイルサイズ
- Phase 4適用版: X KB
- Phase 6適用版: (X - 3) KB
- **削減**: 約3KB

### 累積効果（Phase 1-6）

| Phase | CSS行数 | 削減量 | 累積削減 | 削減率 |
|-------|---------|--------|----------|--------|
| 元のHTML | 1,100行 | - | - | - |
| Phase 1-2 | 1,100行 | 0行 | 0行 | 0% |
| Phase 3 | 1,040行 | 60行 | 60行 | 5% |
| Phase 4 | 1,000行 | 40行 | 100行 | 9% |
| **Phase 6** | **920行** | **80行** | **180行** | **16%** |

**進捗**: 180行削減 / 400行目標 = **45%達成** 🎉

---

## 🎯 次のステップ

Phase 6が完了したら、Phase 7に進むことができます。

### 残りのフェーズ

| Phase | 内容 | 予想削減量 | リスク |
|-------|------|-----------|--------|
| ✅ Phase 1-6 | 完了 | 180行 | - |
| **Phase 7** | モバイルCSS整理 | 約130行 | 中 |
| Phase 5 | 統計パネルCSS統合 | 約100行 | 高 |

**推奨**: 次は Phase 7（モバイルCSS整理）に進む
- Phase 5は最後に実施（高リスクのため）

---

## 🔧 トラブルシューティング

### Q: バッジが表示されない
**A:** JavaScriptのクラスマッピングが正しく追加されているか確認
```javascript
// 追加されているはず
const kubunClassMap = {
  'タネ未満': 'badge badge--danger location-kubun',
  // ...
};
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

### Q: バッジの位置がずれた
**A:** 個別のマージン設定が適用されているか確認
```css
/* phase6-badge-integration.css で定義 */
.location-kubun {
  margin-top: var(--spacing-xs);
}
```

### Q: JavaScriptエラーが出る
**A:** クラスマッピングオブジェクトの定義位置を確認
- `displayLocations()` 関数内に定義されているか
- 変数名のスペルミスがないか
- オブジェクトの構文エラーがないか

---

## 📌 注意事項

### Phase 6の特徴
- **HTMLとJavaScriptの両方を変更**
- **見た目は変わらない**
- **機能も変わらない**
- **大幅なCSS削減（84%）**

### Git管理
Phase 6適用後は、必ずGitにコミット：
```bash
git add index-phase6.html
git commit -m "Apply Phase 6: Badge CSS integration"
git push
```

### バックアップ
Phase 4適用版は削除せず、Phase 6適用版と並行して保持してください。

---

## 📚 参考ドキュメント

- `phase6-badge-integration.css` - 統合後のCSS定義
- `phase6-html-changes.md` - HTML/JavaScript修正の詳細ガイド
- `css-refactoring-plan.md` - 全体のリファクタリング計画

---

## ✨ Phase 6完了おめでとうございます！

バッジ類のCSS統合により、さらに80行（84%）削減されました。
累積で180行削減、目標400行の45%を達成しました！

次は Phase 7（モバイルCSS整理）に進むことを推奨します。
Phase 5（統計パネル）は高リスクのため、最後に実施することをお勧めします。

何か問題があれば、このREADMEのトラブルシューティングセクションを参照してください。
