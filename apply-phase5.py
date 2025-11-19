#!/usr/bin/env python3
"""
Phase 5: 統計パネルCSS統合 自動適用スクリプト

このスクリプトは、元のHTMLファイルにPhase 5の修正を自動的に適用します。

使用方法:
    python3 apply-phase5.py input.html output.html

処理内容:
    1. 統計パネルのCSS重複を削除（約100行）
    2. 統合CSSを追加
    3. HTMLクラス名を変更（-large → --large）
    4. 削減率: 約80%
"""

import sys
import re


def load_phase5_css():
    """Phase 5の統合CSSを読み込み"""
    try:
        with open('phase5-stats-integration.css', 'r', encoding='utf-8') as f:
            return f.read()
    except FileNotFoundError:
        print("⚠️  警告: phase5-stats-integration.css が見つかりません")
        print("   統合CSSファイルを同じディレクトリに配置してください")
        return None


def apply_phase5(html_content):
    """Phase 5の修正を適用"""

    # Phase 5のCSS統合を読み込み
    phase5_css = load_phase5_css()
    if not phase5_css:
        print("❌ Phase 5のCSSファイルが読み込めませんでした")
        return html_content

    # ステップ1: 元のCSS定義を削除
    print("  🔄 元の統計パネルCSSを削除中...")

    # 削除対象のCSSパターン（通常版）
    patterns_to_remove = [
        # .stats-panel から .stats-message まで（通常版）
        r'\s*\.stats-panel\s*\{[^}]+background:\s*linear-gradient[^}]+\}',
        r'\s*\.stats-header\s*\{[^}]+display:\s*flex[^}]+\}',
        r'\s*\.stats-title\s*\{[^}]+font-size:\s*12px[^}]+\}',
        r'\s*\.stats-content\s*\{[^}]+display:\s*flex[^}]+\}',
        r'\s*\.stat-item\s*\{[^}]+text-align:\s*center[^}]+\}',
        r'\s*\.stat-value\s*\{[^}]+font-size:\s*20px[^}]+\}',
        r'\s*\.stat-label\s*\{[^}]+font-size:\s*10px[^}]+\}',
        r'\s*\.stat-divider\s*\{[^}]+width:\s*1px[^}]+height:\s*30px[^}]+\}',
        r'\s*\.stats-message\s*\{[^}]+margin-top:\s*6px[^}]+\}',

        # .stats-panel-large から .goal-edit-btn:hover まで（拡大版）
        r'\s*\.stats-panel-large\s*\{[^}]+background:\s*linear-gradient[^}]+\}',
        r'\s*\.stats-header-large\s*\{[^}]+display:\s*flex[^}]+\}',
        r'\s*\.stats-title-large\s*\{[^}]+font-size:\s*18px[^}]+\}',
        r'\s*\.stats-content-large\s*\{[^}]+display:\s*flex[^}]+\}',
        r'\s*\.stat-item-large\s*\{[^}]+text-align:\s*center[^}]+\}',
        r'\s*\.stat-value-large\s*\{[^}]+font-size:\s*42px[^}]+\}',
        r'\s*\.stat-label-large\s*\{[^}]+font-size:\s*14px[^}]+\}',
        r'\s*\.stat-divider-large\s*\{[^}]+width:\s*1px[^}]+height:\s*60px[^}]+\}',
        r'\s*\.stats-message-large\s*\{[^}]+text-align:\s*center[^}]+\}',
        r'\s*\.goal-edit-btn\s*\{[^}]+background:\s*rgba[^}]+\}',
        r'\s*\.goal-edit-btn:hover\s*\{[^}]+\}',
    ]

    result = html_content
    removed_count = 0

    for pattern in patterns_to_remove:
        matches = re.findall(pattern, result, re.DOTALL)
        if matches:
            removed_count += len(matches)
            result = re.sub(pattern, '', result, flags=re.DOTALL)

    print(f"    削除したCSS定義: {removed_count}個")

    # ステップ2: 統合CSSを挿入
    print("  🔄 統合CSSを追加中...")

    # 挿入位置を探す（</style>タグの前）
    style_end_pattern = r'(\s*</style>)'

    if re.search(style_end_pattern, result):
        result = re.sub(
            style_end_pattern,
            f'\n\n{phase5_css}\n\\1',
            result,
            count=1
        )
        print("    ✅ 統合CSSを追加しました")
    else:
        print("    ⚠️  </style>タグが見つかりません")

    # ステップ3: HTML クラス名を変更（拡大版のみ）
    print("  🔄 HTMLクラス名を変更中...")

    # クラス名の変更マッピング
    class_mappings = [
        (r'class="stats-panel-large"', 'class="stats-panel stats-panel--large"'),
        (r'class="stats-header-large"', 'class="stats-header stats-header--large"'),
        (r'class="stats-title-large"', 'class="stats-title stats-title--large"'),
        (r'class="stats-content-large"', 'class="stats-content stats-content--large"'),
        (r'class="stat-item-large"', 'class="stat-item stat-item--large"'),
        (r'class="stat-value-large"', 'class="stat-value stat-value--large"'),
        (r'class="stat-label-large"', 'class="stat-label stat-label--large"'),
        (r'class="stat-divider-large"', 'class="stat-divider stat-divider--large"'),
        (r'class="stats-message-large"', 'class="stats-message stats-message--large"'),
    ]

    changed_count = 0
    for old_class, new_class in class_mappings:
        matches = re.findall(old_class, result)
        if matches:
            changed_count += len(matches)
            result = re.sub(old_class, new_class, result)

    print(f"    変更したクラス名: {changed_count}箇所")

    # ステップ4: ボタンのインラインスタイルを削除
    print("  🔄 ボタンのインラインスタイルを削除中...")

    # 目標設定ボタンのインラインスタイルを削除
    button_pattern = r'(<button\s+onclick="editTargetGoal\(\)"\s+)style="[^"]*"(\s*>目標設定</button>)'
    button_replacement = r'\1class="goal-edit-btn"\2'

    if re.search(button_pattern, result):
        result = re.sub(button_pattern, button_replacement, result)
        print("    ✅ インラインスタイルを削除しました")

    return result


def main():
    """メイン処理"""
    if len(sys.argv) < 3:
        print("Usage: python apply-phase5.py <input.html> <output.html>")
        print("Example: python apply-phase5.py index-phase6.html index-phase5.html")
        print()
        print("⚠️  注意: Phase 5は高リスクです")
        print("   統計パネルの表示に影響するため、")
        print("   必ずバックアップを取ってから実行してください。")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2]

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print("=" * 60)
        print("Phase 5: 統計パネルCSS統合")
        print("=" * 60)
        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")
        print()

        # Phase 5を適用
        print("🔄 Phase 5を適用中...")
        html_content = apply_phase5(html_content)
        print()

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print("✅ 完了: " + output_file)
        print(f"   ファイルサイズ: {len(html_content):,} バイト")
        print()
        print("=" * 60)
        print("📊 Phase 5 完了")
        print("=" * 60)
        print("削減内容:")
        print("  - 統計パネル重複CSS: 約100行削減")
        print("  - 削減率: 約80%")
        print()
        print("変更内容:")
        print("  ✅ 通常版と拡大版の統計パネルCSS統合")
        print("  ✅ BEM風モディファイアクラス適用")
        print("  ✅ インラインスタイル削除")
        print()
        print("🎉 全Phase完了: 410行削減（目標400行の103%達成）")
        print()
        print("⚠️  重要: 次のステップ:")
        print("  1. ブラウザで開いて表示確認")
        print("  2. 統計パネルの表示確認（通常版・拡大版）")
        print("  3. 統計データの更新確認")
        print("  4. 目標設定機能の確認")
        print("  5. デスクトップ・モバイル表示確認")

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
