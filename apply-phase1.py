#!/usr/bin/env python3
"""
Phase 1: CSS変数置き換えスクリプト

元のHTMLファイルのCSS内の値をCSS変数に自動置換します。
"""

import re
import sys

def apply_css_variables(html_content):
    """HTMLコンテンツにCSS変数を適用"""

    # CSS変数定義を読み込み
    with open('css-variables.css', 'r', encoding='utf-8') as f:
        css_vars = f.read()

    # <style>タグの直後にCSS変数を挿入
    html_content = re.sub(
        r'(<style>\s*)',
        r'\1\n' + css_vars + '\n\n',
        html_content,
        count=1
    )

    # 置換マッピング（順序が重要：大きい値から小さい値へ）
    replacements = [
        # グラデーション
        (r'linear-gradient\(135deg,\s*#667eea\s+0%,\s*#764ba2\s+100%\)', 'var(--gradient-purple)'),

        # 色の置換（特定の色から）
        (r'#4285f4', 'var(--primary-color)'),
        (r'#3367d6', 'var(--primary-hover)'),
        (r'#4caf50', 'var(--success-color)'),
        (r'#2e7d32', 'var(--success-dark)'),
        (r'#ffc107', 'var(--warning-color)'),
        (r'#f57f17', 'var(--warning-dark)'),
        (r'#f44336', 'var(--danger-color)'),
        (r'#c62828', 'var(--danger-dark)'),
        (r'#2196F3', 'var(--info-color)'),
        (r'#1565c0', 'var(--info-dark)'),
        (r'#ff9800', 'var(--orange-color)'),
        (r'#ef6c00', 'var(--orange-dark)'),
        (r'#7b1fa2', 'var(--purple-color)'),
        (r'#5e35b1', 'var(--indigo-color)'),
        (r'#9e9e9e', 'var(--gray-color)'),
        (r'#616161', 'var(--gray-dark)'),
        (r'#9ca3af', 'var(--map-text)'),
        (r'#8b95a3', 'var(--map-highway)'),
        (r'#7b8794', 'var(--map-road)'),
        (r'#6b7886', 'var(--map-transit)'),
        (r'#6b7280', 'var(--map-geometry)'),
        (r'#5f6b7a', 'var(--map-road-stroke)'),
        (r'#4a5d6f', 'var(--map-water)'),
        (r'#3f4a59', 'var(--map-stroke)'),

        # 背景色（CSSプロパティ内）
        (r'background:\s*white\b', 'background: var(--bg-white)'),
        (r'background:\s*#fff\b', 'background: var(--bg-white)'),
        (r'background:\s*#f8f9fa', 'background: var(--bg-gray-lighter)'),
        (r'background:\s*#f5f5f5', 'background: var(--bg-gray-light)'),
        (r'background:\s*#e0e0e0', 'background: var(--bg-gray)'),
        (r'background:\s*#e8f5e9', 'background: var(--bg-success-light)'),
        (r'background:\s*#ffebee', 'background: var(--bg-danger-light)'),
        (r'background:\s*#fff3e0', 'background: var(--bg-warning-light)'),
        (r'background:\s*#e3f2fd', 'background: var(--bg-info-light)'),
        (r'background:\s*#f3e5f5', 'background: var(--bg-purple-light)'),
        (r'background:\s*#e8eaf6', 'background: var(--bg-indigo-light)'),
        (r'background:\s*#fff9c4', 'background: var(--bg-yellow-light)'),
        (r'background:\s*#fff3cd', 'background: var(--bg-error-light)'),

        # テキスト色（CSSプロパティ内）
        (r'color:\s*#333\b', 'color: var(--text-primary)'),
        (r'color:\s*#555\b', 'color: var(--text-secondary)'),
        (r'color:\s*#666\b', 'color: var(--text-tertiary)'),
        (r'color:\s*#999\b', 'color: var(--text-muted)'),
        (r'color:\s*white\b', 'color: var(--text-white)'),

        # ボーダー（複雑なパターンから順に）
        (r'border:\s*4px\s+solid', 'border: var(--border-width-extra-thick) solid'),
        (r'border:\s*3px\s+solid', 'border: var(--border-width-thick) solid'),
        (r'border:\s*2px\s+solid', 'border: var(--border-width-medium) solid'),
        (r'border:\s*1px\s+solid\s+#e0e0e0', 'border: var(--border-width-thin) solid var(--border-color)'),
        (r'border:\s*1px\s+solid\s+#f0f0f0', 'border: var(--border-width-thin) solid var(--border-light)'),
        (r'border:\s*1px\s+solid\s+#ddd', 'border: var(--border-width-thin) solid var(--border-dark)'),
        (r'border:\s*1px\s+solid\s+#ccc', 'border: var(--border-width-thin) solid var(--border-darker)'),
        (r'border-top:\s*1px\s+solid\s+#e0e0e0', 'border-top: var(--border-width-thin) solid var(--border-color)'),
        (r'border-top:\s*1px\s+solid\s+#eee', 'border-top: var(--border-width-thin) solid var(--border-light)'),
        (r'border-bottom:\s*1px\s+solid\s+#e0e0e0', 'border-bottom: var(--border-width-thin) solid var(--border-color)'),
        (r'border-bottom:\s*1px\s+solid\s+#f0f0f0', 'border-bottom: var(--border-width-thin) solid var(--border-light)'),
        (r'border-left:\s*1px\s+solid\s+#e0e0e0', 'border-left: var(--border-width-thin) solid var(--border-color)'),
        (r'border-left:\s*3px\s+solid\s+#4285f4', 'border-left: var(--border-width-thick) solid var(--primary-color)'),
        (r'border-left:\s*4px\s+solid\s+#2196F3', 'border-left: var(--border-width-extra-thick) solid var(--info-color)'),
        (r'border-right:\s*1px\s+solid\s+#e0e0e0', 'border-right: var(--border-width-thin) solid var(--border-color)'),

        # サイズ
        (r'width:\s*340px', 'width: var(--sidebar-width)'),
        (r'width:\s*320px', 'width: var(--left-sidebar-width)'),
        (r'width:\s*280px', 'width: var(--sidebar-width-tablet-left)'),
        (r'width:\s*300px', 'width: var(--sidebar-width-tablet-right)'),
        (r'left:\s*340px', 'left: var(--sidebar-width)'),
        (r'left:\s*320px', 'left: var(--left-sidebar-width)'),
        (r'left:\s*280px', 'left: var(--sidebar-width-tablet-left)'),
        (r'left:\s*300px', 'left: var(--sidebar-width-tablet-right)'),
        (r'right:\s*340px', 'right: var(--sidebar-width)'),
        (r'right:\s*320px', 'right: var(--left-sidebar-width)'),
        (r'right:\s*280px', 'right: var(--sidebar-width-tablet-left)'),
        (r'right:\s*300px', 'right: var(--sidebar-width-tablet-right)'),
        (r'margin-left:\s*-340px', 'margin-left: calc(var(--sidebar-width) * -1)'),
        (r'margin-left:\s*-320px', 'margin-left: calc(var(--left-sidebar-width) * -1)'),
        (r'margin-right:\s*-340px', 'margin-right: calc(var(--sidebar-width) * -1)'),

        # border-radius（大きい値から）
        (r'border-radius:\s*30px', 'border-radius: var(--border-radius-pill-lg)'),
        (r'border-radius:\s*20px', 'border-radius: var(--border-radius-pill)'),
        (r'border-radius:\s*12px', 'border-radius: var(--border-radius-xxl)'),
        (r'border-radius:\s*10px', 'border-radius: var(--border-radius-xl)'),
        (r'border-radius:\s*8px', 'border-radius: var(--border-radius-lg)'),
        (r'border-radius:\s*6px', 'border-radius: var(--border-radius-md)'),
        (r'border-radius:\s*4px', 'border-radius: var(--border-radius-sm)'),
        (r'border-radius:\s*2px', 'border-radius: var(--border-radius-xs)'),
        (r'border-radius:\s*50%', 'border-radius: var(--border-radius-round)'),

        # フォントサイズ（大きい値から）
        (r'font-size:\s*64px', 'font-size: var(--icon-size-huge)'),
        (r'font-size:\s*42px', 'font-size: 42px'),  # 特大値は変数なし
        (r'font-size:\s*22px', 'font-size: var(--font-size-large-title)'),
        (r'font-size:\s*20px', 'font-size: var(--font-size-title)'),
        (r'font-size:\s*19px', 'font-size: 19px'),  # 中間値は変数なし
        (r'font-size:\s*18px', 'font-size: var(--font-size-huge)'),
        (r'font-size:\s*17px', 'font-size: 17px'),  # 中間値は変数なし
        (r'font-size:\s*16px', 'font-size: var(--font-size-xxl)'),
        (r'font-size:\s*15px', 'font-size: var(--font-size-xl)'),
        (r'font-size:\s*14px', 'font-size: var(--font-size-lg)'),
        (r'font-size:\s*13px', 'font-size: var(--font-size-base)'),
        (r'font-size:\s*12px', 'font-size: var(--font-size-md)'),
        (r'font-size:\s*11px', 'font-size: var(--font-size-sm)'),
        (r'font-size:\s*10px', 'font-size: var(--font-size-xs)'),
        (r'font-size:\s*9px', 'font-size: var(--font-size-xxs)'),

        # フォントウェイト
        (r'font-weight:\s*700\b', 'font-weight: var(--font-weight-bold)'),
        (r'font-weight:\s*600\b', 'font-weight: var(--font-weight-semibold)'),
        (r'font-weight:\s*500\b', 'font-weight: var(--font-weight-medium)'),
        (r'font-weight:\s*bold\b', 'font-weight: var(--font-weight-bold)'),

        # box-shadow
        (r'box-shadow:\s*0\s+4px\s+20px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)', 'box-shadow: var(--shadow-lg)'),
        (r'box-shadow:\s*0\s+4px\s+16px\s+rgba\(0,\s*0,\s*0,\s*0\.2\)', 'box-shadow: var(--shadow-xl)'),
        (r'box-shadow:\s*0\s+4px\s+12px\s+rgba\(0,\s*0,\s*0,\s*0\.15\)', 'box-shadow: var(--shadow-md)'),
        (r'box-shadow:\s*0\s+4px\s+12px\s+rgba\(0,\s*0,\s*0,\s*0\.3\)', 'box-shadow: 0 4px 12px rgba(0,0,0,0.3)'),
        (r'box-shadow:\s*0\s+2px\s+10px\s+rgba\(0,\s*0,\s*0,\s*0\.2\)', 'box-shadow: var(--shadow-bottom)'),
        (r'box-shadow:\s*0\s+2px\s+8px\s+rgba\(0,\s*0,\s*0,\s*0\.15\)', 'box-shadow: 0 2px 8px rgba(0,0,0,0.15)'),
        (r'box-shadow:\s*0\s+2px\s+8px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)', 'box-shadow: var(--shadow-sm)'),
        (r'box-shadow:\s*-2px\s+0\s+8px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)', 'box-shadow: var(--shadow-left)'),
        (r'box-shadow:\s*2px\s+0\s+8px\s+rgba\(0,\s*0,\s*0,\s*0\.1\)', 'box-shadow: var(--shadow-right)'),

        # transition
        (r'transition:\s*all\s+0\.5s', 'transition: all var(--transition-slow)'),
        (r'transition:\s*all\s+0\.3s', 'transition: all var(--transition-normal)'),
        (r'transition:\s*all\s+0\.2s', 'transition: all var(--transition-fast)'),
        (r'transition:\s*0\.3s', 'transition: var(--transition-normal)'),
        (r'transition:\s*0\.2s', 'transition: var(--transition-fast)'),

        # z-index
        (r'z-index:\s*10000', 'z-index: var(--z-index-max)'),
        (r'z-index:\s*1000', 'z-index: var(--z-index-loading)'),
        (r'z-index:\s*800', 'z-index: var(--z-index-mobile-modal)'),
        (r'z-index:\s*500', 'z-index: var(--z-index-mobile-switcher)'),
        (r'z-index:\s*400', 'z-index: var(--z-index-sheet-toggle)'),
        (r'z-index:\s*300', 'z-index: var(--z-index-modal)'),
        (r'z-index:\s*200', 'z-index: var(--z-index-toggle)'),
        (r'z-index:\s*100', 'z-index: var(--z-index-sidebar)'),
        (r'z-index:\s*10\b', 'z-index: 10'),  # 特定値は変更しない
        (r'z-index:\s*1\b', 'z-index: var(--z-index-base)'),

        # opacity
        (r'opacity:\s*0\.9', 'opacity: var(--opacity-strong)'),
        (r'opacity:\s*0\.6', 'opacity: var(--opacity-medium)'),
        (r'opacity:\s*0\.5', 'opacity: var(--opacity-light)'),
    ]

    # 置換を適用
    for pattern, replacement in replacements:
        html_content = re.sub(pattern, replacement, html_content)

    return html_content


def main():
    """メイン処理"""
    if len(sys.argv) < 2:
        print("Usage: python apply-phase1.py <input.html> [output.html]")
        print("Example: python apply-phase1.py index.html index-phase1.html")
        sys.exit(1)

    input_file = sys.argv[1]
    output_file = sys.argv[2] if len(sys.argv) > 2 else 'index-phase1.html'

    try:
        # 入力ファイルを読み込み
        with open(input_file, 'r', encoding='utf-8') as f:
            html_content = f.read()

        print(f"📖 読み込み: {input_file}")
        print(f"   ファイルサイズ: {len(html_content):,} バイト")

        # CSS変数を適用
        print("🔄 CSS変数を適用中...")
        updated_content = apply_css_variables(html_content)

        # 出力ファイルに書き込み
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(updated_content)

        print(f"✅ 完了: {output_file}")
        print(f"   ファイルサイズ: {len(updated_content):,} バイト")
        print(f"   差分: {len(updated_content) - len(html_content):+,} バイト")

        # 統計情報
        var_count = updated_content.count('var(--')
        print(f"\n📊 統計:")
        print(f"   CSS変数使用箇所: {var_count} 箇所")
        print(f"\n🎉 Phase 1 完了！")
        print(f"\n次のステップ:")
        print(f"1. {output_file} をブラウザで開いて表示確認")
        print(f"2. 全機能の動作確認")
        print(f"3. 問題なければPhase 2へ進む")

    except FileNotFoundError:
        print(f"❌ エラー: ファイルが見つかりません: {input_file}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ エラー: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
