# Phase 1-7 テスト手順書

## 📋 概要

このドキュメントでは、Phase 1-7を適用したHTMLファイルをテストする手順を説明します。

---

## 🎯 テストの目的

Phase 1-7の適用により、以下の変更が加わっています：
- **Phase 1**: CSS変数の導入（60+変数）
- **Phase 2**: 共通クラスの追加（100+クラス）
- **Phase 3**: サイドバーCSS統合（60行削減）
- **Phase 4**: トグルボタンCSS統合（40行削減）
- **Phase 6**: バッジCSS統合（80行削減）
- **Phase 7**: モバイルCSS統合（130行削減）

**合計削減**: 310行（目標400行の78%達成）

---

## 🔧 準備

### ステップ1: 元のHTMLファイルを準備

元のHTMLファイル（約2700行）を `index-original.html` として保存してください。

```bash
# 元のHTMLファイルを配置
cp /path/to/your/original-file.html index-original.html
```

または、会話で提供いただいた元のHTMLコードを `index-original.html` として保存してください。

### ステップ2: リポジトリをクローン

```bash
git clone <your-repo-url>
cd <repo-directory>
git checkout claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq
```

### ステップ3: 必要なファイルを確認

以下のファイルが存在することを確認：

```bash
ls -la *.py *.css
```

必要なファイル：
- `apply-all-phases.py` （更新済み：Phase 1-7対応）
- `apply-phase1.py`
- `apply-phase2.py`
- `apply-phase3.py`
- `apply-phase4.py`
- `apply-phase6.py`
- `apply-phase7.py`
- `css-variables.css`
- `common-classes.css`

---

## 🚀 Phase 1-7の適用

### オプション1: 一括適用（推奨）

```bash
python3 apply-all-phases.py index-original.html index-complete.html
```

**期待される出力**:
```
============================================================
📖 Phase 1-7 統合適用スクリプト
============================================================
入力ファイル: index-original.html
出力ファイル: index-complete.html
ファイルサイズ: XXX,XXX バイト

🔄 Phase 1を適用中...
  ✅ Phase 1 完了 (+6,000 バイト)
🔄 Phase 2を適用中...
  ✅ Phase 2 完了 (+19,000 バイト)
🔄 Phase 3を適用中...
  ✅ Phase 3 完了 (-2,000 バイト)
🔄 Phase 4を適用中...
  ✅ Phase 4 完了 (-1,500 バイト)
🔄 Phase 6を適用中...
  ✅ Phase 6 完了 (-3,000 バイト)
🔄 Phase 7を適用中...
  ✅ Phase 7 完了 (-4,500 バイト)

============================================================
✅ すべてのPhaseの適用が完了しました！
============================================================
出力ファイル: index-complete.html
ファイルサイズ: XXX,XXX バイト
差分: +14,000 バイト

📊 適用されたPhase:
  ✅ Phase 1: CSS変数導入
  ✅ Phase 2: 共通クラス追加
  ✅ Phase 3: サイドバーCSS統合 (60行削減)
  ✅ Phase 4: トグルボタンCSS統合 (40行削減)
  ✅ Phase 6: バッジCSS統合 (80行削減)
  ✅ Phase 7: モバイルCSS統合 (130行削減)

  ⏭️  Phase 5: 統計パネルCSS統合 (スキップ)

📈 累積削減: 310行 (目標400行の78%達成)
```

### オプション2: 段階的適用

各Phaseを個別に適用して、段階的にテストすることもできます：

```bash
# Phase 1
python3 apply-phase1.py index-original.html index-phase1.html

# Phase 2
python3 apply-phase2.py index-phase1.html index-phase2.html

# Phase 3
python3 apply-phase3.py index-phase2.html index-phase3.html

# Phase 4
python3 apply-phase4.py index-phase3.html index-phase4.html

# Phase 6
python3 apply-phase6.py index-phase4.html index-phase6.html

# Phase 7
python3 apply-phase7.py index-phase6.html index-phase7.html
```

---

## ✅ テスト手順

### 1. デスクトップ表示テスト（1920x1080）

#### ブラウザで開く

```bash
# ブラウザで開く
open index-complete.html          # macOS
xdg-open index-complete.html      # Linux
start index-complete.html         # Windows
```

#### チェックリスト

- [ ] ページが正常に表示される
- [ ] 見た目が元のHTMLと同じ
- [ ] 左サイドバーが表示される
- [ ] 右サイドバーが表示される
- [ ] 左サイドバートグルボタンが表示される
- [ ] 右サイドバートグルボタンが表示される
- [ ] 左サイドバーの開閉が動作する
- [ ] 右サイドバーの開閉が動作する
- [ ] タブの切り替えが動作する
- [ ] 検索機能が動作する
- [ ] フィルター機能が動作する
- [ ] マップが表示される
- [ ] コンソールにエラーがない

### 2. タブレット表示テスト（768x1024）

ブラウザのDevTools（F12）でデバイスモードに切り替え、タブレットサイズに設定：

```
幅: 768px〜1024px
高さ: 1024px
```

#### チェックリスト

- [ ] ページが正常に表示される
- [ ] 左サイドバーの幅が280pxになっている
- [ ] 右サイドバーの幅が300pxになっている
- [ ] 左トグルボタンが280px位置にある
- [ ] 右トグルボタンが300px位置にある
- [ ] すべての機能が動作する

### 3. モバイル表示テスト（375x667）

ブラウザのDevTools（F12）でモバイルサイズに設定：

```
幅: 375px
高さ: 667px
```

#### チェックリスト - 基本動作

- [ ] ページが正常に表示される
- [ ] 左サイドバートグルボタンが非表示
- [ ] 右サイドバートグルボタンが非表示
- [ ] 左サイドバーがフルスクリーンで表示される（mobile-visible時）
- [ ] 右サイドバーがフルスクリーンで表示される（mobile-visible時）
- [ ] モバイル切替ボタンが表示される

#### チェックリスト - フォントサイズ（mobile-visible時）

**左サイドバー**:
- [ ] タイトル「🧠 営業インテリジェンス」が22px
- [ ] タブボタンが20px
- [ ] 更新ボタンが20px
- [ ] インサイトアイテムが24px padding
- [ ] 新着案件アイテムが24px padding
- [ ] 会社名が22px
- [ ] 説明文が18px
- [ ] ソース情報が16px

**右サイドバー**:
- [ ] 統計パネルタイトルが22px
- [ ] ボタンが20px
- [ ] 検索ボックスが20px
- [ ] フィルターが20px
- [ ] 営業先アイテムが24px padding
- [ ] 営業先名が22px
- [ ] 住所・メモが18px
- [ ] バッジが16px
- [ ] 統計数値が32px

#### チェックリスト - タップ領域

- [ ] すべてのボタンがmin-height: 60px以上
- [ ] すべてのリストアイテムがmin-height: 80px以上
- [ ] タップしやすい十分な領域がある

### 4. レスポンシブブレークポイント確認

以下の幅でブレークポイントが正しく機能するか確認：

- [ ] 767px → 768px で正しく切り替わる
- [ ] 768px → 769px で正しく切り替わる
- [ ] 1024px → 1025px で正しく切り替わる

### 5. 機能テスト

#### サイドバー機能
- [ ] 左サイドバーのタブ切り替え（インサイト ⇔ 新着案件）
- [ ] 更新ボタンの動作
- [ ] 営業先リストのスクロール
- [ ] 営業先アイテムのクリック

#### バッジ表示
- [ ] 区分バッジ（タネ未満、戦略予材、現場、その他）
- [ ] 訪問ステータスバッジ（最近訪問、警告、緊急）
- [ ] 新着バッジ
- [ ] 重複バッジ

#### マップ機能
- [ ] マーカーの表示
- [ ] マーカーのクリック
- [ ] 情報ウィンドウの表示
- [ ] ルート検索リンク

### 6. パフォーマンステスト

#### ファイルサイズ確認

```bash
ls -lh index-original.html index-complete.html
```

**期待される結果**:
- 元のHTML: 約XXX KB
- 完全版HTML: 約XXX KB（元のサイズ + 約14KB）

#### ロード時間確認

ブラウザのDevTools > Network タブで：
- [ ] ページロード時間が許容範囲内
- [ ] CSSの解析時間が短縮されている

---

## 🐛 トラブルシューティング

### Q1: スクリプトが「ModuleNotFoundError」エラーを出す

**原因**: apply-phaseX.pyファイルが見つからない

**解決方法**:
```bash
# 必要なファイルがあるか確認
ls -la apply-phase*.py

# ない場合はgit pullで取得
git pull origin claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq
```

### Q2: 表示が崩れている

**原因**: CSSの適用エラーまたはキャッシュの問題

**解決方法**:
1. ブラウザのキャッシュをクリア（Ctrl+Shift+Delete）
2. スーパーリロード（Ctrl+Shift+R または Cmd+Shift+R）
3. ブラウザのDevToolsでコンソールエラーを確認

### Q3: モバイル表示でフォントが拡大されない

**原因**: `.sidebar-base` クラスが追加されていない

**解決方法**:
1. index-complete.htmlを開く
2. `#left-sidebar` タグに `class="sidebar-base ..."` が含まれているか確認
3. `#sidebar` タグに `class="sidebar-base ..."` が含まれているか確認

### Q4: スクリプトが途中で止まる

**原因**: 特定のPhaseでエラーが発生

**解決方法**:
1. エラーメッセージを確認
2. 該当するPhaseを個別に実行してデバッグ
3. 元のHTMLファイルが完全か確認

---

## 📊 テスト結果の記録

テスト完了後、以下の情報を記録してください：

```
テスト日時: ____年__月__日 __:__

環境:
- OS: _______________
- ブラウザ: _______________
- バージョン: _______________

ファイルサイズ:
- 元のHTML: ______ KB
- 完全版HTML: ______ KB
- 差分: ______ KB

テスト結果:
- デスクトップ表示: ☐ 合格 ☐ 不合格
- タブレット表示: ☐ 合格 ☐ 不合格
- モバイル表示: ☐ 合格 ☐ 不合格
- 機能テスト: ☐ 合格 ☐ 不合格
- パフォーマンス: ☐ 合格 ☐ 不合格

発見した問題:
1. ______________________________
2. ______________________________
3. ______________________________

総合評価: ☐ 合格 ☐ 不合格
```

---

## 🎉 テスト完了後

### すべてのテストが合格した場合

1. **GitHubにプッシュ**

```bash
git add index-original.html index-complete.html
git commit -m "Add complete HTML with Phase 1-7 applied

- Phase 1: CSS variables
- Phase 2: Common classes
- Phase 3: Sidebar CSS integration
- Phase 4: Toggle button CSS integration
- Phase 6: Badge CSS integration
- Phase 7: Mobile CSS integration

Total reduction: 310 lines (78% of 400-line target)
"
git push origin claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq
```

2. **Phase 5の検討**

Phase 5（統計パネルCSS統合）を実施すると、さらに約100行の削減が可能で、目標400行の完全達成となります。

3. **本番環境へのデプロイ**

テストが完全に成功したら、本番環境への適用を検討してください。

### テストで問題が見つかった場合

1. 問題の詳細を記録
2. 該当するPhaseを特定
3. 個別にPhaseを適用してデバッグ
4. 必要に応じてPhaseの修正または除外を検討

---

## 📞 サポート

問題が発生した場合：
1. このテスト手順書のトラブルシューティングセクションを確認
2. 各PhaseのREADMEファイルを確認
3. ブラウザのDeveloper Toolsでエラーを確認
4. 必要に応じて会話で質問してください

---

🎯 **目標**: Phase 1-7で310行（78%）削減を達成し、元のHTMLと同じ見た目・機能を維持する！
