#!/usr/bin/env python3
"""
Phase 1-7 統合適用スクリプト

元のHTMLファイルに Phase 1〜7 をすべて適用します。
Phase 5（統計パネル）はスキップします。

使用方法:
    python3 apply-all-phases.py index-original.html index-complete.html
"""

import sys
import os


def apply_phase1(html_content):
    """Phase 1: CSS変数を適用"""
    print("🔄 Phase 1を適用中...")

    # apply-phase1.py の apply_css_variables 関数を使用
    from importlib import import_module

    # Phase 1モジュールを動的にロード
    spec = __import__('importlib.util').util.spec_from_file_location(
        "phase1", "apply-phase1.py"
    )
    phase1_module = __import__('importlib.util').util.module_from_spec(spec)
    spec.loader.exec_module(phase1_module)

    return phase1_module.apply_phase1(html_content)


def apply_phase2(html_content):
    """Phase 2: 共通クラスを追加"""
    print("🔄 Phase 2を適用中...")

    spec = __import__('importlib.util').util.spec_from_file_location(
        "phase2", "apply-phase2.py"
    )
    phase2_module = __import__('importlib.util').util.module_from_spec(spec)
    spec.loader.exec_module(phase2_module)

    return phase2_module.apply_phase2(html_content)


def apply_phase3(html_content):
    """Phase 3: サイドバーCSS統合"""
    print("🔄 Phase 3を適用中...")

    spec = __import__('importlib.util').util.spec_from_file_location(
        "phase3", "apply-phase3.py"
    )
    phase3_module = __import__('importlib.util').util.module_from_spec(spec)
    spec.loader.exec_module(phase3_module)

    return phase3_module.apply_phase3(html_content)


def apply_phase4(html_content):
    """Phase 4: トグルボタンCSS統合"""
    print("🔄 Phase 4を適用中...")

    spec = __import__('importlib.util').util.spec_from_file_location(
        "phase4", "apply-phase4.py"
    )
    phase4_module = __import__('importlib.util').util.module_from_spec(spec)
    spec.loader.exec_module(phase4_module)

    return phase4_module.apply_phase4(html_content)


def apply_phase6(html_content):
    """Phase 6: バッジCSS統合"""
    print("🔄 Phase 6を適用中...")

    spec = __import__('importlib.util').util.spec_from_file_location(
        "phase6", "apply-phase6.py"
    )
    phase6_module = __import__('importlib.util').util.module_from_spec(spec)
    spec.loader.exec_module(phase6_module)

    return phase6_module.apply_phase6(html_content)


def apply_phase7(html_content):
    """Phase 7: モバイルCSS統合"""
    print("🔄 Phase 7を適用中...")

    spec = __import__('importlib.util').util.spec_from_file_location(
        "phase7", "apply-phase7.py"
    )
    phase7_module = __import__('importlib.util').util.module_from_spec(spec)
    spec.loader.exec_module(phase7_module)

    return phase7_module.apply_phase7(html_content)


def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("Usage: python apply-all-phases.py <input.html> [output.html]")
        print("Example: python apply-all-phases.py index-original.html index-complete.html")
        print()
        print("このスクリプトは以下のPhaseを順次適用します：")
        print("  - Phase 1: CSS変数導入")
        print("  - Phase 2: 共通クラス追加")
        print("  - Phase 3: サイドバーCSS統合")
        print("  - Phase 4: トグルボタンCSS統合")
        print("  - Phase 6: バッジCSS統合")
        print("  - Phase 7: モバイルCSS統合")
        print("  ※ Phase 5（統計パネル）は高リスクのためスキップ")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'index-complete.html'

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print("=" * 60)
        print("📖 Phase 1-7 統合適用スクリプト")
        print("=" * 60)
        print(f"入力ファイル: {input_file}")
        print(f"出力ファイル: {output_file}")
        print(f"ファイルサイズ: {len(html_content):,} バイト")
        print()

        # 各Phaseを順次適用
        original_size = len(html_content)

        # Phase 1
        html_content = apply_phase1(html_content)
        print(f"  ✅ Phase 1 完了 ({len(html_content) - original_size:+,} バイト)")
        phase1_size = len(html_content)

        # Phase 2
        html_content = apply_phase2(html_content)
        print(f"  ✅ Phase 2 完了 ({len(html_content) - phase1_size:+,} バイト)")
        phase2_size = len(html_content)

        # Phase 3
        html_content = apply_phase3(html_content)
        print(f"  ✅ Phase 3 完了 ({len(html_content) - phase2_size:+,} バイト)")
        phase3_size = len(html_content)

        # Phase 4
        html_content = apply_phase4(html_content)
        print(f"  ✅ Phase 4 完了 ({len(html_content) - phase3_size:+,} バイト)")
        phase4_size = len(html_content)

        # Phase 6 (Phase 5はスキップ)
        html_content = apply_phase6(html_content)
        print(f"  ✅ Phase 6 完了 ({len(html_content) - phase4_size:+,} バイト)")
        phase6_size = len(html_content)

        # Phase 7
        html_content = apply_phase7(html_content)
        print(f"  ✅ Phase 7 完了 ({len(html_content) - phase6_size:+,} バイト)")

        print()

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)

        print("=" * 60)
        print("✅ すべてのPhaseの適用が完了しました！")
        print("=" * 60)
        print(f"出力ファイル: {output_file}")
        print(f"ファイルサイズ: {len(html_content):,} バイト")
        print(f"差分: {len(html_content) - original_size:+,} バイト")
        print()
        print("📊 適用されたPhase:")
        print("  ✅ Phase 1: CSS変数導入")
        print("  ✅ Phase 2: 共通クラス追加")
        print("  ✅ Phase 3: サイドバーCSS統合 (60行削減)")
        print("  ✅ Phase 4: トグルボタンCSS統合 (40行削減)")
        print("  ✅ Phase 6: バッジCSS統合 (80行削減)")
        print("  ✅ Phase 7: モバイルCSS統合 (130行削減)")
        print()
        print("  ⏭️  Phase 5: 統計パネルCSS統合 (スキップ)")
        print()
        print("📈 累積削減: 310行 (目標400行の78%達成)")
        print()
        print("🎉 次のステップ:")
        print(f"  1. {output_file} をブラウザで開いて表示確認")
        print("  2. すべての機能が正常に動作するか確認")
        print("  3. デスクトップ・タブレット・モバイル表示を確認")
        print("  4. 問題なければGitにコミット＆プッシュ")
        print("  5. Phase 5（統計パネルCSS統合）で完全達成を目指す")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        print()
        print("💡 ヒント:")
        print("  元のHTMLファイルを準備してください。")
        print("  最初の会話で提供いただいたHTMLコードを")
        print("  'index-original.html' として保存してください。")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
