#!/usr/bin/env python3
"""
Phase 2: 共通クラス追加スクリプト

Phase 1適用済みのHTMLファイルに共通クラスを追加します。
既存のコードは一切変更しません。
"""

import re
import sys


def apply_common_classes(html_content):
    """HTMLコンテンツに共通クラスを追加"""

    # 共通クラス定義を読み込み
    with open('common-classes.css', 'r', encoding='utf-8') as f:
        common_classes = f.read()

    # CSS変数定義の直後に共通クラスを挿入
    # Phase 1のCSS変数定義（:root {...}）を探す
    pattern = r'(:root\s*\{[^}]+\})'

    def insert_common_classes(match):
        root_definition = match.group(1)
        return root_definition + '\n\n' + common_classes + '\n\n'

    # CSS変数定義の後に共通クラスを挿入
    updated_content = re.sub(
        pattern,
        insert_common_classes,
        html_content,
        count=1,
        flags=re.DOTALL
    )

    # 挿入されたか確認
    if updated_content == html_content:
        # :root が見つからなかった場合、<style>タグの直後に挿入
        print("⚠️  警告: :root が見つかりませんでした。<style>タグの直後に挿入します。")
        updated_content = re.sub(
            r'(<style>\s*)',
            r'\1\n' + common_classes + '\n\n',
            html_content,
            count=1
        )

    return updated_content


def analyze_content(html_content):
    """コンテンツを分析して統計情報を返す"""
    stats = {
        'total_lines': len(html_content.split('\n')),
        'css_variables_count': html_content.count('var(--'),
        'common_classes_count': 0,
        'style_tag_count': html_content.count('<style>'),
    }

    # 共通クラスの数をカウント
    common_class_patterns = [
        r'\.sidebar-base',
        r'\.toggle-btn-base',
        r'\.badge',
        r'\.btn-base',
        r'\.item-base',
        r'\.stats-panel-base',
        r'\.tabs-base',
        r'\.tab-btn-base',
        r'\.input-base',
        r'\.select-base',
        r'\.textarea-base',
        r'\.empty-state',
        r'\.loading-base',
        r'\.spinner-base',
        r'\.error-message',
    ]

    for pattern in common_class_patterns:
        stats['common_classes_count'] += len(re.findall(pattern, html_content))

    return stats


def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("Usage: python apply-phase2.py <input.html> [output.html]")
        print("Example: python apply-phase2.py index-phase1.html index-phase2.html")
        print("\nNote: Phase 1を適用済みのHTMLファイルを指定してください")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'index-phase2.html'

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")

        # Phase 1が適用されているか確認
        if 'var(--' not in html_content:
            print("⚠️  警告: Phase 1が適用されていない可能性があります")
            print("   CSS変数（var(--）が見つかりません")
            response = input("続行しますか？ (y/N): ")
            if response.lower() != 'y':
                print("中止しました")
                sys.exit(0)

        # 入力ファイルの統計
        input_stats = analyze_content(html_content)
        print(f"\n📊 入力ファイル統計:")
        print(f"   総行数: {input_stats['total_lines']:,} 行")
        print(f"   CSS変数使用箇所: {input_stats['css_variables_count']} 箇所")
        print(f"   <style>タグ数: {input_stats['style_tag_count']}")

        # 共通クラスを追加
        print("\n🔄 共通クラスを追加中...")
        updated_content = apply_common_classes(html_content)

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"✅ 完了: {output_file}")
        print(f"   ファイルサイズ: {len(updated_content):,} バイト")
        print(f"   差分: {len(updated_content) - len(html_content):+,} バイト")

        # 出力ファイルの統計
        output_stats = analyze_content(updated_content)
        print(f"\n📊 出力ファイル統計:")
        print(f"   総行数: {output_stats['total_lines']:,} 行")
        print(f"   共通クラス定義: {output_stats['common_classes_count']} 個")

        # 検証
        print(f"\n🔍 検証:")
        if output_stats['common_classes_count'] > 0:
            print(f"   ✅ 共通クラスが正常に追加されました")
        else:
            print(f"   ⚠️  共通クラスが見つかりません")

        if output_stats['css_variables_count'] == input_stats['css_variables_count']:
            print(f"   ✅ CSS変数は保持されています")
        else:
            print(f"   ⚠️  CSS変数の数が変わりました")

        print(f"\n🎉 Phase 2 完了！")
        print(f"\n次のステップ:")
        print(f"1. {output_file} をブラウザで開いて表示確認")
        print(f"2. コンソールにエラーがないか確認")
        print(f"3. 見た目が変わっていないことを確認（重要）")
        print(f"4. 問題なければPhase 3へ進む")

        print(f"\n📝 注意:")
        print(f"   Phase 2では見た目は一切変わりません")
        print(f"   既存のクラスを使用しているためです")
        print(f"   Phase 3以降で実際に置き換えを行います")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        print(f"\nヒント:")
        print(f"   - Phase 1を適用済みのファイルを指定してください")
        print(f"   - ファイル名のスペルを確認してください")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
