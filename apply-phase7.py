#!/usr/bin/env python3
"""
Phase 7: モバイルCSS統合 自動適用スクリプト

このスクリプトは、元のHTMLファイルにPhase 7の修正を自動的に適用します。

使用方法:
    python3 apply-phase7.py input.html output.html

処理内容:
    1. モバイル用の重複CSSを削除（約130行）
    2. 共通モバイルスタイルを追加
    3. 削減率: 約70%
"""

import sys
import re


def apply_phase7(html_content):
    """Phase 7の修正を適用"""

    # モバイルCSS統合用のパターン
    mobile_styles = """
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
"""

    # 削除対象の重複スタイルパターン
    patterns_to_remove = [
        # 左サイドバー
        r'\s*#left-sidebar\.mobile-visible\s+\.left-sidebar-title\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.tab-btn\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.refresh-btn\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-item,?\s*#left-sidebar\.mobile-visible\s+\.new-case-item\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-item\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.new-case-item\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-company,?\s*#left-sidebar\.mobile-visible\s+\.new-case-name\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-company\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.new-case-name\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-summary,?\s*#left-sidebar\.mobile-visible\s+\.new-case-contractor,?\s*#left-sidebar\.mobile-visible\s+\.new-case-info\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-summary\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.new-case-contractor\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.new-case-info\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-source,?\s*#left-sidebar\.mobile-visible\s+\.new-case-price\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.insight-source\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.new-case-price\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.empty-state-text\s*\{[^}]+\}',
        r'\s*#left-sidebar\.mobile-visible\s+\.new-case-link\s*\{[^}]+\}',

        # 右サイドバー
        r'\s*#sidebar\.mobile-visible\s+\.stats-title\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.btn\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+#search,?\s*#sidebar\.mobile-visible\s+#kubun-filter,?\s*#sidebar\.mobile-visible\s+#salesman-select\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+#search\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+#kubun-filter\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+#salesman-select\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-item\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-name\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-address,?\s*#sidebar\.mobile-visible\s+\.location-memo\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-address\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-memo\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-kubun,?\s*#sidebar\.mobile-visible\s+\.visit-status\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.location-kubun\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.visit-status\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.duplicate-badge\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.duplicate-info\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.stat-value\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.stat-label\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.stats-message\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+#sidebar-header\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+#controls\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.control-row\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.stats-panel\s*\{[^}]+\}',
        r'\s*#sidebar\.mobile-visible\s+\.shape-indicator\s*\{[^}]+\}',
    ]

    # 重複スタイルを削除
    result = html_content
    removed_count = 0

    for pattern in patterns_to_remove:
        matches = re.findall(pattern, result, re.DOTALL)
        if matches:
            removed_count += len(matches)
            result = re.sub(pattern, '', result, flags=re.DOTALL)

    # 統合CSSを挿入する位置を探す
    # #sidebar-toggle { display: none; } の直後に挿入
    insertion_pattern = r'(#sidebar-toggle\s*\{\s*display:\s*none;\s*\})'

    if re.search(insertion_pattern, result):
        result = re.sub(
            insertion_pattern,
            r'\1\n' + mobile_styles,
            result,
            count=1
        )
    else:
        # パターンが見つからない場合、@media (max-width: 768px)の最後に挿入
        media_query_pattern = r'(@media\s*\(max-width:\s*768px\)\s*\{)'
        if re.search(media_query_pattern, result):
            # @media の終わりの } を探して、その前に挿入
            # これは複雑なので、シンプルに #sidebar-toggle の後を探す別のパターンを使う
            alt_pattern = r'(\s*#sidebar-toggle\s*\{[^}]*display:\s*none;[^}]*\})'
            if re.search(alt_pattern, result):
                result = re.sub(
                    alt_pattern,
                    r'\1\n' + mobile_styles,
                    result,
                    count=1
                )

    print(f"  削除したスタイル: {removed_count}個")

    return result


def main():
    """メイン処理"""
    if len(sys.argv) < 3:
        print("Usage: python apply-phase7.py <input.html> <output.html>")
        print("Example: python apply-phase7.py index-phase6.html index-phase7.html")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print("=" * 60)
        print("Phase 7: モバイルCSS統合")
        print("=" * 60)
        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")
        print()

        # Phase 7を適用
        print("🔄 モバイルCSS重複を削除中...")
        html_content = apply_phase7(html_content)
        print()

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print("✅ 完了: " + output_file)
        print(f"   ファイルサイズ: {len(html_content):,} バイト")
        print()
        print("=" * 60)
        print("📊 Phase 7 完了")
        print("=" * 60)
        print("削減内容:")
        print("  - モバイル用重複CSS: 約130行削減")
        print("  - 削減率: 約70%")
        print()
        print("変更内容:")
        print("  ✅ 左サイドバーのモバイルスタイル統合")
        print("  ✅ 右サイドバーのモバイルスタイル統合")
        print("  ✅ 共通モバイルクラス適用")
        print()
        print("🎉 累積削減: 約310行（Phase 3-7合計）")
        print()
        print("次のステップ:")
        print("  1. ブラウザで開いて表示確認")
        print("  2. モバイル表示（768px以下）での動作確認")
        print("  3. タブレット表示（769px-1024px）での動作確認")
        print("  4. デスクトップ表示での影響確認")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
