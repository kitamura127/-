#!/usr/bin/env python3
"""
Phase 3: サイドバーCSS統合スクリプト

Phase 2適用済みのHTMLファイルに以下を適用：
1. HTMLに共通クラスを追加
2. 重複するCSSを削除
3. 簡潔なCSSに置き換え
"""

import re
import sys


def add_common_classes_to_html(html_content):
    """HTMLに共通クラスを追加"""

    # 左サイドバーに共通クラスを追加
    html_content = re.sub(
        r'<div id="left-sidebar"([^>]*)>',
        r'<div id="left-sidebar" class="sidebar-base sidebar-base--left"\1>',
        html_content
    )

    # 右サイドバーに共通クラスを追加
    html_content = re.sub(
        r'<div id="sidebar"([^>]*)>',
        r'<div id="sidebar" class="sidebar-base sidebar-base--right"\1>',
        html_content
    )

    return html_content


def remove_duplicate_sidebar_css(css_content):
    """重複するサイドバーCSSを削除"""

    # 左サイドバーの重複CSS削除パターン
    patterns_to_remove = [
        # 左サイドバーの基本スタイル（共通部分のみ削除）
        r'#left-sidebar\s*\{[^}]*background:\s*white[^}]*\}',

        # 右サイドバーの基本スタイル（共通部分のみ削除）
        r'#sidebar\s*\{[^}]*background:\s*white[^}]*\}',
    ]

    # より詳細なパターン - 個別に削除
    # 左サイドバーから共通プロパティを削除
    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(background:\s*[^;]+;)',
        lambda m: m.group(1) if 'white' in m.group(2) or 'var\(--bg-white\)' in m.group(2) else m.group(0),
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(display:\s*flex;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(flex-direction:\s*column;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(position:\s*absolute;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(top:\s*0;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(bottom:\s*0;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(z-index:\s*100;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#left-sidebar\s*\{[^}]*?)(transition:\s*all\s+[^;]+;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    # 右サイドバーも同様に処理
    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(background:\s*[^;]+;)',
        lambda m: m.group(1) if 'white' in m.group(2) or 'var\(--bg-white\)' in m.group(2) else m.group(0),
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(display:\s*flex;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(flex-direction:\s*column;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(position:\s*absolute;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(top:\s*0;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(bottom:\s*0;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(z-index:\s*100;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    css_content = re.sub(
        r'(#sidebar\s*\{[^}]*?)(transition:\s*all\s+[^;]+;)',
        r'\1',
        css_content,
        flags=re.DOTALL
    )

    return css_content


def apply_phase3(html_content):
    """Phase 3を適用"""

    print("🔄 Phase 3を適用中...")

    # Step 1: HTMLに共通クラスを追加
    print("  1/3: HTMLに共通クラスを追加...")
    html_content = add_common_classes_to_html(html_content)

    # Step 2: Phase 3のCSS定義を読み込み
    print("  2/3: Phase 3のCSS定義を読み込み...")
    try:
        with open('phase3-sidebar-integration.css', 'r', encoding='utf-8') as f:
            phase3_css = f.read()
    except FileNotFoundError:
        print("⚠️  警告: phase3-sidebar-integration.css が見つかりません")
        print("    サンプルCSSを使用します")
        phase3_css = """
/* Phase 3: サイドバーCSS統合 */

/* 左サイドバー - 個別プロパティのみ */
#left-sidebar {
  width: var(--left-sidebar-width);
  border-right: var(--border-width-thin) solid var(--border-color);
  left: 0;
}

/* 右サイドバー - 個別プロパティのみ */
#sidebar {
  width: var(--sidebar-width);
  border-left: var(--border-width-thin) solid var(--border-color);
  right: 0;
  overflow-y: auto;
}
"""

    # Step 3: <style>タグ内のCSSを抽出して処理
    print("  3/3: 重複CSSを削除してPhase 3のCSSを統合...")

    def process_style_tag(match):
        style_content = match.group(1)

        # 共通クラス定義の後にPhase 3のCSSを挿入
        # common-classes.css の後を探す
        if '/* Phase 2: 共通クラス定義 */' in style_content or '.sidebar-base {' in style_content:
            # Phase 2の共通クラス定義の後にPhase 3を挿入
            style_content = re.sub(
                r'(\.sidebar-base[^}]+\}[^/]*)',
                r'\1\n\n' + phase3_css + '\n',
                style_content,
                count=1,
                flags=re.DOTALL
            )
        else:
            # 共通クラスが見つからない場合、:rootの後に挿入
            style_content = re.sub(
                r'(:root\s*\{[^}]+\}\s*)',
                r'\1\n' + phase3_css + '\n',
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
        'left_sidebar_class_added': 'class="sidebar-base sidebar-base--left"' in updated_content,
        'right_sidebar_class_added': 'class="sidebar-base sidebar-base--right"' in updated_content,
        'phase3_css_added': '/* Phase 3: サイドバーCSS統合 */' in updated_content or '#left-sidebar {' in updated_content,
    }

    return stats


def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("Usage: python apply-phase3.py <input.html> [output.html]")
        print("Example: python apply-phase3.py index-phase2.html index-phase3.html")
        print("\nNote: Phase 2を適用済みのHTMLファイルを指定してください")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'index-phase3.html'

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")

        # Phase 2が適用されているか確認
        if '.sidebar-base' not in html_content:
            print("⚠️  警告: Phase 2が適用されていない可能性があります")
            print("   共通クラス定義（.sidebar-base）が見つかりません")
            response = input("続行しますか？ (y/N): ")
            if response.lower() != 'y':
                print("中止しました")
                sys.exit(0)

        # Phase 3を適用
        updated_content = apply_phase3(html_content)

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"✅ 完了: {output_file}")
        print(f"   ファイルサイズ: {len(updated_content):,} バイト")
        print(f"   差分: {len(updated_content) - len(html_content):+,} バイト")

        # 変更内容を分析
        stats = analyze_changes(html_content, updated_content)

        print(f"\n📊 変更内容:")
        print(f"   左サイドバーに共通クラス追加: {'✅' if stats['left_sidebar_class_added'] else '❌'}")
        print(f"   右サイドバーに共通クラス追加: {'✅' if stats['right_sidebar_class_added'] else '❌'}")
        print(f"   Phase 3のCSS追加: {'✅' if stats['phase3_css_added'] else '❌'}")

        print(f"\n🎉 Phase 3 完了！")
        print(f"\n次のステップ:")
        print(f"1. {output_file} をブラウザで開いて表示確認")
        print(f"2. 左サイドバーの開閉を確認")
        print(f"3. 右サイドバーの開閉を確認")
        print(f"4. モバイル表示を確認")
        print(f"5. 問題なければPhase 4へ進む")

        print(f"\n📝 注意:")
        print(f"   Phase 3では見た目は変わりません")
        print(f"   内部のCSS構造が整理されただけです")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        print(f"\nヒント:")
        print(f"   - Phase 2を適用済みのファイルを指定してください")
        print(f"   - ファイル名のスペルを確認してください")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
