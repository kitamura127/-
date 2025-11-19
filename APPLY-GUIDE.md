# Phase 1 + Phase 2 適用手順

## 📝 準備

元のHTMLコードを会話の最初で提供いただきましたが、非常に大きいため（約2700行）、以下の手順で適用してください。

---

## 🚀 適用手順

### ステップ1: リポジトリをクローン

```bash
git clone <your-repo-url>
cd <repo-directory>
git checkout claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq
```

### ステップ2: 元のHTMLファイルを配置

会話の最初で提供いただいた元のHTMLコードを `index-original.html` として保存してください。

```bash
# 元のHTMLコードを index-original.html として保存
# （エディタで開いてコピー＆ペースト）
```

### ステップ3: Phase 1を適用

```bash
# Phase 1: CSS変数の導入
python3 apply-phase1.py index-original.html index-phase1.html
```

**期待される結果**:
```
📖 読み込み: index-original.html
   ファイルサイズ: XXX,XXX バイト
🔄 CSS変数を適用中...
✅ 完了: index-phase1.html
   ファイルサイズ: XXX,XXX バイト
   差分: +6,000 バイト

📊 統計:
   CSS変数使用箇所: 200+ 箇所

🎉 Phase 1 完了！
```

### ステップ4: Phase 2を適用

```bash
# Phase 2: 共通クラスの追加
python3 apply-phase2.py index-phase1.html index-phase2.html
```

**期待される結果**:
```
📖 読み込み: index-phase1.html
   ファイルサイズ: XXX,XXX バイト

📊 入力ファイル統計:
   総行数: XXX 行
   CSS変数使用箇所: 200+ 箇所

🔄 共通クラスを追加中...
✅ 完了: index-phase2.html
   ファイルサイズ: XXX,XXX バイト
   差分: +19,000 バイト

📊 出力ファイル統計:
   総行数: XXX 行
   共通クラス定義: 100+ 個

🔍 検証:
   ✅ 共通クラスが正常に追加されました
   ✅ CSS変数は保持されています

🎉 Phase 2 完了！
```

### ステップ5: ブラウザで確認

```bash
# ブラウザで開いて確認
# macOS
open index-phase2.html

# Linux
xdg-open index-phase2.html

# Windows
start index-phase2.html
```

### ステップ6: 動作確認チェックリスト

- [ ] ページが正常に表示される
- [ ] 見た目が元のHTMLと同じ（重要）
- [ ] 左サイドバーの開閉が動作する
- [ ] 右サイドバーの開閉が動作する
- [ ] タブの切り替えが動作する
- [ ] 検索機能が動作する
- [ ] マップの操作が動作する
- [ ] モバイル表示が正常
- [ ] ブラウザのコンソールにエラーがない

### ステップ7: GitHubにプッシュ（オプション）

```bash
# 適用済みファイルをGitに追加
git add index-original.html index-phase1.html index-phase2.html

# コミット
git commit -m "Add HTML files with Phase 1 and Phase 2 applied"

# プッシュ
git push origin claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq
```

---

## 📁 現在のファイル構成

```
.
├── README.md
├── html-duplicates-analysis.md          # 重複分析レポート
├── css-refactoring-plan.md              # リファクタリング計画
│
├── css-variables.css                    # Phase 1: CSS変数定義
├── apply-phase1.py                      # Phase 1: 適用スクリプト
├── phase1-replacement-guide.md          # Phase 1: 詳細ガイド
├── PHASE1-README.md                     # Phase 1: 使用方法
│
├── common-classes.css                   # Phase 2: 共通クラス定義
├── apply-phase2.py                      # Phase 2: 適用スクリプト
├── PHASE2-README.md                     # Phase 2: 使用方法
│
├── index-original.html                  # 元のHTMLファイル（未適用）
├── index-phase1.html                    # Phase 1適用済み
└── index-phase2.html                    # Phase 1 + Phase 2適用済み
```

---

## 🌐 GitHubで確認する方法

現在のブランチの全ファイルをGitHub上で確認できます：

```
https://github.com/<username>/<repo>/tree/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq
```

個別ファイルのリンク：

### ドキュメント
- [重複分析レポート](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/html-duplicates-analysis.md)
- [リファクタリング計画](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/css-refactoring-plan.md)

### Phase 1
- [CSS変数定義](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/css-variables.css)
- [Phase 1 README](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/PHASE1-README.md)
- [適用スクリプト](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/apply-phase1.py)

### Phase 2
- [共通クラス定義](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/common-classes.css)
- [Phase 2 README](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/PHASE2-README.md)
- [適用スクリプト](https://github.com/<username>/<repo>/blob/claude/identify-html-duplicates-01AZRkiESFyCY7n2cmCaCpaq/apply-phase2.py)

---

## 🔍 主要ファイルの内容確認

### CSS変数定義 (css-variables.css)

60個以上のCSS変数を定義：
- 色: 40+個（primary, success, danger等）
- サイズ: 15+個（sidebar幅, border-radius等）
- 間隔: 10+個（spacing-xs ~ spacing-huge）
- フォント: 15+個（font-size, font-weight）
- その他: 20+個（shadow, transition, z-index等）

### 共通クラス定義 (common-classes.css)

100個以上の共通クラスを10カテゴリで定義：
1. サイドバー関連（14クラス）
2. トグルボタン関連（6クラス）
3. バッジ関連（15クラス）
4. ボタン関連（9クラス）
5. アイテムリスト関連（5クラス）
6. 統計パネル関連（15クラス）
7. タブ関連（4クラス）
8. 入力フィールド関連（3クラス）
9. モバイル対応（自動）
10. ユーティリティクラス（20以上）

---

## 📊 適用前後の比較

| 項目 | 元のHTML | Phase 1 | Phase 2 |
|------|---------|---------|---------|
| ファイルサイズ | ~X KB | ~(X+6) KB | ~(X+25) KB |
| CSS変数 | 0箇所 | 200+箇所 | 200+箇所 |
| 共通クラス | 0個 | 0個 | 100+個 |
| 見た目 | - | 同じ | 同じ |
| 機能 | - | 同じ | 同じ |

**注**: Phase 3以降で重複削除により、最終的に約400行（36%）削減予定

---

## ❓ よくある質問

### Q: HTMLファイルが大きすぎてGitHubで見れない
**A:** GitHubは大きなファイルの表示を制限します。以下の方法で確認してください：
- ローカルにクローンしてエディタで開く
- `git show` コマンドで確認
- Raw表示で確認

### Q: スクリプトが動かない
**A:** 以下を確認してください：
- Python 3がインストールされているか
- 必要なファイル（css-variables.css, common-classes.css）が同じディレクトリにあるか
- 入力ファイルのパスが正しいか

### Q: 見た目が変わってしまった
**A:** Phase 1とPhase 2では見た目は変わりません。変わった場合：
- ブラウザのキャッシュをクリア
- Developer Toolsでエラーを確認
- CSS変数が正しく定義されているか確認

---

## 🎯 次のステップ

Phase 1 + Phase 2の適用とテストが完了したら：

1. **成功した場合**:
   - Phase 3（サイドバーのCSS統合）に進む
   - 実際に重複を削減し始める

2. **問題があった場合**:
   - エラー内容を共有
   - トラブルシューティングを実施
   - 必要に応じてスクリプトを調整

---

準備ができたら、Phase 3に進みましょう！
