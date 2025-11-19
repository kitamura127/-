# Phase 2: 共通クラスの作成 - 完了ガイド

## 📦 成果物

Phase 2では以下のファイルを作成しました：

1. **common-classes.css** - 共通クラス定義ファイル（10カテゴリ、100以上のクラス）
2. **PHASE2-README.md** - このファイル

---

## 🎯 Phase 2の目的

Phase 2では、**既存のコードを一切変更せず**、新しい共通クラスを追加するだけです。

これにより：
- ✅ 既存コードへの影響ゼロ
- ✅ Phase 3以降で段階的に適用可能
- ✅ 新規開発では即座に使用可能
- ✅ リスクなしでクラスを追加

---

## 📚 追加された共通クラス

### 1. サイドバー関連（14クラス）
```css
.sidebar-base               /* サイドバーベース */
.sidebar-base--left         /* 左配置 */
.sidebar-base--right        /* 右配置 */
.sidebar-header             /* ヘッダー */
.sidebar-title              /* タイトル */
.sidebar-subtitle           /* サブタイトル */
.sidebar-content            /* コンテンツエリア */
.sidebar-controls           /* コントロールエリア */
```

### 2. トグルボタン関連（6クラス）
```css
.toggle-btn-base            /* トグルボタンベース */
.toggle-btn-base--left      /* 左配置 */
.toggle-btn-base--right     /* 右配置 */
.sidebar-hidden             /* サイドバー非表示時 */
.sidebar-visible            /* サイドバー表示時 */
```

### 3. バッジ関連（15クラス）
```css
.badge                      /* バッジベース */
.badge--sm                  /* 小サイズ */
.badge--lg                  /* 大サイズ */
.badge--danger              /* 赤（危険） */
.badge--success             /* 緑（成功） */
.badge--info                /* 青（情報） */
.badge--warning             /* 黄（警告） */
.badge--purple              /* 紫 */
.badge--indigo              /* 藍 */
.badge--gray                /* 灰 */
.badge--yellow              /* 黄 */
.badge--orange              /* 橙 */
.badge--count               /* カウントバッジ */
.badge--new                 /* NEWバッジ */
.badge--duplicate           /* 重複バッジ */
```

### 4. ボタン関連（9クラス）
```css
.btn-base                   /* ボタンベース */
.btn-base--sm               /* 小サイズ */
.btn-base--lg               /* 大サイズ */
.btn-base--primary          /* プライマリカラー */
.btn-base--success          /* 成功カラー */
.btn-base--danger           /* 危険カラー */
.btn-base--full             /* フルワイド */
```

### 5. アイテムリスト関連（5クラス）
```css
.item-base                  /* アイテムベース */
.item-name                  /* アイテム名 */
.item-text                  /* アイテムテキスト */
.item-memo                  /* アイテムメモ */
```

### 6. 統計パネル関連（15クラス）
```css
.stats-panel-base           /* 統計パネルベース */
.stats-panel-base--large    /* 大サイズ */
.stats-header-base          /* ヘッダー */
.stats-title-base           /* タイトル */
.stats-content-base         /* コンテンツ */
.stat-item-base             /* 統計アイテム */
.stat-value-base            /* 統計値 */
.stat-label-base            /* 統計ラベル */
.stat-divider-base          /* ディバイダー */
.stats-message-base         /* メッセージ */
/* 各クラスに --large バリエーションあり */
```

### 7. タブ関連（4クラス）
```css
.tabs-base                  /* タブコンテナ */
.tab-btn-base               /* タブボタン */
.tab-content-base           /* タブコンテンツ */
```

### 8. 入力フィールド関連（3クラス）
```css
.input-base                 /* インプット */
.select-base                /* セレクト */
.textarea-base              /* テキストエリア */
```

### 9. モバイル対応（自動適用）
- すべての共通クラスはモバイル対応済み
- `@media (max-width: 768px)` で自動的に最適化

### 10. ユーティリティクラス（20以上）
```css
.empty-state                /* 空の状態 */
.loading-base               /* ローディング */
.spinner-base               /* スピナー */
.error-message              /* エラーメッセージ */
.hidden                     /* 非表示 */
.flex, .flex-col, .flex-1   /* フレックスレイアウト */
.items-center, .justify-between  /* フレックス配置 */
.gap-sm, .gap-md, .gap-lg   /* 間隔 */
.mt-*, .mb-*, .p-*          /* マージン・パディング */
```

---

## 🚀 使い方

### ステップ1: 共通クラスを追加

Phase 1適用済みのHTMLファイルの `<style>` タグ内に、`common-classes.css` の内容を追加：

```html
<style>
  /* Phase 1: CSS変数 */
  :root { ... }

  /* Phase 2: 共通クラス */
  /* ここに common-classes.css の内容をコピー */

  /* 既存のスタイル */
  * { ... }
  body { ... }
  ...
</style>
```

### ステップ2: 確認

ブラウザで開いて、エラーがないことを確認。
この時点では**見た目は一切変わりません**（既存クラスを使用しているため）。

---

## 💡 使用例

Phase 2のクラスは、新規要素や既存要素の置き換えで使用できます。

### 例1: 新規バッジの追加
```html
<!-- 旧スタイル -->
<span class="kubun-タネ未満">タネ未満</span>

<!-- 新スタイル（Phase 3以降で置き換え） -->
<span class="badge badge--danger">タネ未満</span>
```

### 例2: 新規ボタンの追加
```html
<!-- 旧スタイル -->
<button class="btn" onclick="...">ボタン</button>

<!-- 新スタイル（Phase 3以降で置き換え） -->
<button class="btn-base btn-base--primary" onclick="...">ボタン</button>
```

### 例3: 新規サイドバーの追加
```html
<!-- 新スタイル -->
<div class="sidebar-base sidebar-base--left">
  <div class="sidebar-header">
    <div class="sidebar-title">タイトル</div>
  </div>
  <div class="sidebar-content">
    <!-- コンテンツ -->
  </div>
</div>
```

---

## ✅ 動作確認チェックリスト

Phase 2適用後、以下を確認してください：

### 基本確認
- [ ] ページが正常に表示される
- [ ] コンソールにエラーが出ていない
- [ ] 既存の機能がすべて動作する
- [ ] 見た目が変わっていない（重要）

### ファイルサイズ確認
```bash
# Phase 1適用版と比較
ls -lh index-phase1.html index-phase2.html
```

---

## 📊 期待される結果

### ファイルサイズ
- Phase 1適用版: 約X KB
- Phase 2適用版: 約(X + 12) KB
- 共通クラス追加分: 約12 KB

### 追加内容
- 共通クラス: 100以上
- カテゴリ: 10種類
- モバイル対応: 自動

### メリット
✅ 新規開発で即座に使用可能
✅ 既存コードへの影響ゼロ
✅ Phase 3以降で段階的に置き換え可能
✅ コードの統一性が向上

---

## 🔄 Phase 3への準備

Phase 2完了後、Phase 3で実際に既存のコードを共通クラスに置き換えていきます。

### Phase 3プレビュー
Phase 3では以下を実施：
1. 左サイドバーのクラス置き換え
2. 右サイドバーのクラス置き換え
3. トグルボタンのクラス置き換え

**置き換え方針**:
- 1つのセクションずつ置き換え
- 置き換え後に動作確認
- 問題があれば即座に戻す

---

## 📝 変更内容の詳細

### 追加されたもの
- 共通クラス定義（約600行）
- モバイル対応スタイル
- ユーティリティクラス

### 変更されないもの
- HTML構造
- JavaScript コード
- 既存のクラス定義
- 既存のID定義
- 機能

---

## 🎯 次のステップ

Phase 2が完了したら、Phase 3に進むことができます。

### Phase 3: サイドバーのCSS統合
- 左サイドバーを `.sidebar-base--left` に置き換え
- 右サイドバーを `.sidebar-base--right` に置き換え
- 重複するスタイル定義を削除
- 約100行のCSS削減

---

## 📌 注意事項

### Phase 2の特徴
- **既存コードは一切変更しない**
- **新しいクラスを追加するだけ**
- **リスクは最小限**
- **すぐに動作確認可能**

### Git管理
Phase 2適用後は、必ずGitにコミット：
```bash
git add common-classes.css PHASE2-README.md
git commit -m "Apply Phase 2: Common classes"
git push
```

### バックアップ
Phase 1適用版は削除せず、Phase 2適用版と並行して保持してください。

---

## 🔧 トラブルシューティング

### Q: 共通クラスを追加したら表示が崩れた
**A:** 既存クラスと名前が衝突している可能性があります。
- 共通クラスは `-base` や `--variant` 接尾辞を使用
- 既存クラスとの衝突は基本的にないはず
- Developer Toolsでスタイルを確認

### Q: ファイルサイズが大きくなりすぎた
**A:** Phase 2は準備段階なので、一時的にサイズが増えます。
- Phase 3以降で既存スタイルを削除することで削減
- 最終的には約400行（36%）削減予定

### Q: どのクラスを使えばいい？
**A:** Phase 2では使用は任意です。
- Phase 3以降で段階的に置き換え
- 新規開発では共通クラスを使用推奨
- 既存コードは無理に変更しない

---

## ✨ Phase 2完了おめでとうございます！

共通クラスの追加により、統一的なスタイルの基盤が整いました。
Phase 3以降で実際に重複を削減していきます。

何か問題があれば、このREADMEのトラブルシューティングセクションを参照してください。
