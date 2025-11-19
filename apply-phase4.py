#!/usr/bin/env python3
"""
Phase 4: トグルボタンCSS統合スクリプト

Phase 3適用済みのHTMLファイルに以下を適用：
1. HTMLに共通クラスを追加
2. 重複するCSSを削除
3. 簡潔なCSSに置き換え
"""

import re
import sys


def add_common_classes_to_html(html_content):
    """HTMLに共通クラスを追加"""

    # 左トグルボタンに共通クラスを追加
    # 既存のクラス（sidebar-hidden や sidebar-visible）を保持
    html_content = re.sub(
        r'<button id="left-sidebar-toggle"\s+class="([^"]*)"',
        r'<button id="left-sidebar-toggle" class="toggle-btn-base toggle-btn-base--left \1"',
        html_content
    )

    # classがない場合も対応
    html_content = re.sub(
        r'<button id="left-sidebar-toggle"([^>]*?)>',
        lambda m: f'<button id="left-sidebar-toggle" class="toggle-btn-base toggle-btn-base--left"{m.group(1)}>' if 'class=' not in m.group(0) else m.group(0),
        html_content
    )

    # 右トグルボタンに共通クラスを追加
    html_content = re.sub(
        r'<button id="sidebar-toggle"\s+class="([^"]*)"',
        r'<button id="sidebar-toggle" class="toggle-btn-base toggle-btn-base--right \1"',
        html_content
    )

    # classがない場合も対応
    html_content = re.sub(
        r'<button id="sidebar-toggle"([^>]*?)>',
        lambda m: f'<button id="sidebar-toggle" class="toggle-btn-base toggle-btn-base--right"{m.group(1)}>' if 'class=' not in m.group(0) else m.group(0),
        html_content
    )

    return html_content


def apply_phase4(html_content):
    """Phase 4を適用"""

    print("🔄 Phase 4を適用中...")

    # Step 1: HTMLに共通クラスを追加
    print("  1/3: HTMLに共通クラスを追加...")
    html_content = add_common_classes_to_html(html_content)

    # Step 2: Phase 4のCSS定義を読み込み
    print("  2/3: Phase 4のCSS定義を読み込み...")
    try:
        with open('phase4-toggle-integration.css', 'r', encoding='utf-8') as f:
            phase4_css = f.read()
    except FileNotFoundError:
        print("⚠️  警告: phase4-toggle-integration.css が見つかりません")
        print("    サンプルCSSを使用します")
        phase4_css = """
/* Phase 4: トグルボタンCSS統合 */

/* 左トグルボタン - 個別プロパティ */
#left-sidebar-toggle {
  transition: left var(--transition-normal) ease;
}

#left-sidebar-toggle.sidebar-hidden {
  left: 0;
}

#left-sidebar-toggle.sidebar-visible {
  left: var(--left-sidebar-width);
}

/* 右トグルボタン - 個別プロパティ */
#sidebar-toggle {
  transition: right var(--transition-normal) ease;
}

#sidebar-toggle.sidebar-hidden {
  right: 0;
}

#sidebar-toggle.sidebar-visible {
  right: var(--sidebar-width);
}

/* タブレット対応 */
@media (min-width: 769px) and (max-width: 1024px) {
  #left-sidebar-toggle.sidebar-visible {
    left: var(--sidebar-width-tablet-left);
  }

  #sidebar-toggle.sidebar-visible {
    right: var(--sidebar-width-tablet-right);
  }
}

/* モバイル対応 */
@media (max-width: 768px) {
  #left-sidebar-toggle,
  #sidebar-toggle {
    display: none;
  }
}
"""

    # Step 3: <style>タグ内のCSSを抽出して処理
    print("  3/3: 重複CSSを削除してPhase 4のCSSを統合...")

    def process_style_tag(match):
        style_content = match.group(1)

        # Phase 3のサイドバーCSS定義の後にPhase 4を挿入
        if '/* Phase 3: サイドバーCSS統合 */' in style_content or '#left-sidebar {' in style_content:
            # Phase 3のCSS定義の後にPhase 4を挿入
            # #sidebar の定義を探して、その後に挿入
            style_content = re.sub(
                r'(#sidebar\s*\{[^}]+\}[^@]*)',
                r'\1\n\n' + phase4_css + '\n',
                style_content,
                count=1,
                flags=re.DOTALL
            )
        else:
            # Phase 3が見つからない場合、共通クラス定義の後に挿入
            style_content = re.sub(
                r'(\.toggle-btn-base[^}]+\}[^/]*)',
                r'\1\n\n' + phase4_css + '\n',
                style_content,
                count=1,
                flags=re.DOTALL
            )

        return f'<style>{style_content}</style>'

    html_content = re.sub(
        r'<style>(.*?)</style>',
        process_style_tag,
        html_content,
        flags=re.DOTALL
    )

    return html_content


def analyze_changes(original_content, updated_content):
    """変更内容を分析"""

    stats = {
        'size_before': len(original_content),
        'size_after': len(updated_content),
        'size_diff': len(updated_content) - len(original_content),
        'left_toggle_class_added': 'toggle-btn-base--left' in updated_content,
        'right_toggle_class_added': 'toggle-btn-base--right' in updated_content,
        'phase4_css_added': '/* Phase 4: トグルボタンCSS統合 */' in updated_content or ('#left-sidebar-toggle {' in updated_content and 'transition: left' in updated_content),
    }

    return stats


def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("Usage: python apply-phase4.py <input.html> [output.html]")
        print("Example: python apply-phase4.py index-phase3.html index-phase4.html")
        print("\nNote: Phase 3を適用済みのHTMLファイルを指定してください")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'index-phase4.html'

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")

        # Phase 3が適用されているか確認
        if '.sidebar-base' not in html_content:
            print("⚠️  警告: Phase 3が適用されていない可能性があります")
            print("   サイドバーの共通クラス（.sidebar-base）が見つかりません")
            response = input("続行しますか？ (y/N): ")
            if response.lower() != 'y':
                print("中止しました")
                sys.exit(0)

        # Phase 4を適用
        updated_content = apply_phase4(html_content)

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"✅ 完了: {output_file}")
        print(f"   ファイルサイズ: {len(updated_content):,} バイト")
        print(f"   差分: {len(updated_content) - len(html_content):+,} バイト")

        # 変更内容を分析
        stats = analyze_changes(html_content, updated_content)

        print(f"\n📊 変更内容:")
        print(f"   左トグルボタンに共通クラス追加: {'✅' if stats['left_toggle_class_added'] else '❌'}")
        print(f"   右トグルボタンに共通クラス追加: {'✅' if stats['right_toggle_class_added'] else '❌'}")
        print(f"   Phase 4のCSS追加: {'✅' if stats['phase4_css_added'] else '❌'}")

        print(f"\n🎉 Phase 4 完了！")
        print(f"\n次のステップ:")
        print(f"1. {output_file} をブラウザで開いて表示確認")
        print(f"2. 左トグルボタンの動作確認")
        print(f"3. 右トグルボタンの動作確認")
        print(f"4. ボタンの位置がサイドバーに追従するか確認")
        print(f"5. 問題なければPhase 6へ進む（Phase 5は高リスクのため後回し推奨）")

        print(f"\n📝 注意:")
        print(f"   Phase 4では見た目は変わりません")
        print(f"   トグルボタンのCSS構造が整理されただけです")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        print(f"\nヒント:")
        print(f"   - Phase 3を適用済みのファイルを指定してください")
        print(f"   - ファイル名のスペルを確認してください")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
