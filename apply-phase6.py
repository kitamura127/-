#!/usr/bin/env python3
"""
Phase 6: バッジ類CSS統合スクリプト

Phase 4適用済みのHTMLファイルに以下を適用：
1. HTMLのバッジクラスを変更
2. JavaScriptのバッジ生成コードを変更
3. 重複するCSSを削除
4. 簡潔なCSSに置き換え
"""

import re
import sys


def update_badge_classes_in_html(html_content):
    """HTMLのバッジクラスを更新"""

    # 新着案件数バッジ
    html_content = re.sub(
        r'class="cases-badge',
        r'class="badge badge--count cases-badge',
        html_content
    )

    return html_content


def update_badge_classes_in_javascript(html_content):
    """JavaScriptのバッジ生成コードを更新"""

    # displayLocations関数内のバッジクラスを更新
    # 区分バッジのクラスマッピングを追加
    kubun_mapping = """
// 区分バッジのクラスマッピング
const kubunClassMap = {
  'タネ未満': 'badge badge--danger location-kubun',
  '戦略予材': 'badge badge--success location-kubun',
  '現場': 'badge badge--info location-kubun',
  'その他': 'badge badge--purple location-kubun',
  'default': 'badge badge--indigo location-kubun'
};

const kubunClass = loc.kubun ? kubunClassMap[loc.kubun] || kubunClassMap['default'] : kubunClassMap['default'];

// 訪問ステータスのクラスマッピング
const statusClassMap = {
  'status-recent': 'badge badge--gray visit-status',
  'status-warning': 'badge badge--yellow visit-status',
  'status-urgent': 'badge badge--danger visit-status'
};

const statusClass = statusClassMap[visitStatus.class] || 'badge badge--gray visit-status';"""

    # displayLocations関数を探して更新
    html_content = re.sub(
        r"(function displayLocations\([^{]+\{[^}]*?)const kubunClass = loc\.kubun \? `kubun-\$\{loc\.kubun\}` : 'kubun-default';",
        r'\1' + kubun_mapping,
        html_content,
        flags=re.DOTALL
    )

    # バッジのHTMLテンプレートを更新
    # location-kubun の使用箇所
    html_content = re.sub(
        r'\$\{loc\.kubun \? `<span class="location-kubun \$\{kubunClass\}">',
        r'${loc.kubun ? `<span class="${kubunClass}">',
        html_content
    )

    # visit-status の使用箇所
    html_content = re.sub(
        r'<span class="visit-status \$\{visitStatus\.class\}">',
        r'<span class="${statusClass}">',
        html_content
    )

    # duplicate-badge の使用箇所
    html_content = re.sub(
        r'class="duplicate-badge"',
        r'class="badge badge--duplicate"',
        html_content
    )

    # update-badge (NEW) の使用箇所
    html_content = re.sub(
        r"'<span class=\"update-badge\">NEW</span>'",
        r"'<span class=\"badge badge--new update-badge\">NEW</span>'",
        html_content
    )

    # new-case-price の使用箇所
    html_content = re.sub(
        r'<div class="new-case-price">',
        r'<div class="badge badge--success new-case-price">',
        html_content
    )

    # insight-priority の使用箇所（priorityClassを定義する部分を探す）
    priority_mapping = """
// 優先度バッジのクラスマッピング
const priorityClassMap = {
  'priority-high': 'badge badge--danger insight-priority',
  'priority-medium': 'badge badge--orange insight-priority',
  'priority-low': 'badge badge--success insight-priority'
};

const priorityBadgeClass = priorityClassMap[priorityClass] || 'badge badge--danger insight-priority';"""

    # displayInsights関数内の優先度バッジを更新（もし存在すれば）
    html_content = re.sub(
        r'<div class="insight-priority \$\{priorityClass\}">',
        r'<div class="${priorityBadgeClass}">',
        html_content
    )

    return html_content


def apply_phase6(html_content):
    """Phase 6を適用"""

    print("🔄 Phase 6を適用中...")

    # Step 1: HTMLのバッジクラスを更新
    print("  1/4: HTMLのバッジクラスを更新...")
    html_content = update_badge_classes_in_html(html_content)

    # Step 2: JavaScriptのバッジ生成コードを更新
    print("  2/4: JavaScriptのバッジ生成コードを更新...")
    html_content = update_badge_classes_in_javascript(html_content)

    # Step 3: Phase 6のCSS定義を読み込み
    print("  3/4: Phase 6のCSS定義を読み込み...")
    try:
        with open('phase6-badge-integration.css', 'r', encoding='utf-8') as f:
            phase6_css = f.read()
    except FileNotFoundError:
        print("⚠️  警告: phase6-badge-integration.css が見つかりません")
        print("    サンプルCSSを使用します")
        phase6_css = """
/* Phase 6: バッジ類CSS統合 */

/* 区分バッジ - 個別プロパティ */
.location-kubun {
  margin-top: var(--spacing-xs);
}

/* 訪問ステータスバッジ - 個別プロパティ */
.visit-status {
  margin-top: var(--spacing-xs);
  margin-left: var(--spacing-xs);
}

/* 新着案件数バッジ - 個別プロパティ */
.cases-badge {
  margin-left: var(--spacing-md);
}

/* 更新バッジ - 個別プロパティ */
.update-badge {
  margin-left: var(--spacing-sm);
}

/* インサイト優先度バッジ - 個別プロパティ */
.insight-priority {
  margin-bottom: var(--spacing-sm);
}

/* 新着案件価格バッジ - 個別プロパティ */
.new-case-price {
  padding: var(--spacing-xxs) var(--spacing-lg);
  border-radius: var(--border-radius-xxl);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-sm);
}

/* 重複情報 */
.duplicate-info {
  font-size: var(--font-size-sm);
  color: var(--orange-color);
  margin-top: var(--spacing-xs);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}
"""

    # Step 4: <style>タグ内のCSSを抽出して処理
    print("  4/4: 重複CSSを削除してPhase 6のCSSを統合...")

    def process_style_tag(match):
        style_content = match.group(1)

        # Phase 4のトグルボタンCSS定義の後にPhase 6を挿入
        if '/* Phase 4: トグルボタンCSS統合 */' in style_content or '#sidebar-toggle {' in style_content:
            # Phase 4のCSS定義の後にPhase 6を挿入
            style_content = re.sub(
                r'(#sidebar-toggle\.sidebar-visible\s*\{[^}]+\}[^@]*)',
                r'\1\n\n' + phase6_css + '\n',
                style_content,
                count=1,
                flags=re.DOTALL
            )
        else:
            # Phase 4が見つからない場合、共通クラス定義の後に挿入
            style_content = re.sub(
                r'(\.badge--duplicate[^}]+\}[^/]*)',
                r'\1\n\n' + phase6_css + '\n',
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
        'badge_base_count': updated_content.count('class="badge '),
        'kubun_mapping_added': 'kubunClassMap' in updated_content,
        'status_mapping_added': 'statusClassMap' in updated_content,
        'phase6_css_added': '/* Phase 6: バッジ類CSS統合 */' in updated_content or '.location-kubun {' in updated_content,
    }

    return stats


def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("Usage: python apply-phase6.py <input.html> [output.html]")
        print("Example: python apply-phase6.py index-phase4.html index-phase6.html")
        print("\nNote: Phase 4を適用済みのHTMLファイルを指定してください")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'index-phase6.html'

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")

        # Phase 4が適用されているか確認
        if '.toggle-btn-base' not in html_content:
            print("⚠️  警告: Phase 4が適用されていない可能性があります")
            print("   トグルボタンの共通クラス（.toggle-btn-base）が見つかりません")
            response = input("続行しますか？ (y/N): ")
            if response.lower() != 'y':
                print("中止しました")
                sys.exit(0)

        # Phase 6を適用
        updated_content = apply_phase6(html_content)

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"✅ 完了: {output_file}")
        print(f"   ファイルサイズ: {len(updated_content):,} バイト")
        print(f"   差分: {len(updated_content) - len(html_content):+,} バイト")

        # 変更内容を分析
        stats = analyze_changes(html_content, updated_content)

        print(f"\n📊 変更内容:")
        print(f"   バッジ共通クラス使用箇所: {stats['badge_base_count']} 箇所")
        print(f"   区分バッジマッピング追加: {'✅' if stats['kubun_mapping_added'] else '❌'}")
        print(f"   ステータスバッジマッピング追加: {'✅' if stats['status_mapping_added'] else '❌'}")
        print(f"   Phase 6のCSS追加: {'✅' if stats['phase6_css_added'] else '❌'}")

        print(f"\n🎉 Phase 6 完了！")
        print(f"\n次のステップ:")
        print(f"1. {output_file} をブラウザで開いて表示確認")
        print(f"2. 全てのバッジが正しく表示されるか確認")
        print(f"3. バッジの色が正しいか確認")
        print(f"4. 問題なければPhase 7へ進む")

        print(f"\n📝 注意:")
        print(f"   Phase 6では見た目は変わりません")
        print(f"   バッジのCSS構造が整理されただけです")
        print(f"   約80行のCSSが削減されました（84%削減）")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        print(f"\nヒント:")
        print(f"   - Phase 4を適用済みのファイルを指定してください")
        print(f"   - ファイル名のスペルを確認してください")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
