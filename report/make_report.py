"""担当者別売上実績表（前年同月・当月）から、A3横1枚の昨対比レポートを作る。

使い方: python3 make_report.py 前年.xlsx 当年.xlsx 出力.pdf
  図はSVGで描き、Chromium（to_pdf.js）でPDFにする。
  matplotlibで直接PDFにすると日本語フォントの埋め込みが崩れ、Acrobatで文字化けするため。
"""
import os
import subprocess
import sys

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.gridspec import GridSpec
from matplotlib.ticker import FuncFormatter

from parse import load

FONT = "Noto Sans CJK JP"
for _f in ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
           "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"):
    try:
        font_manager.fontManager.addfont(_f)
    except OSError:
        pass
plt.rcParams.update({
    "font.family": FONT,
    "svg.fonttype": "none",   # 文字は文字のままSVGに書き出す
    "font.size": 12,
    "axes.edgecolor": "#c3c2b7",
    "axes.linewidth": 0.8,
    "axes.labelcolor": "#52514e",
    "xtick.color": "#52514e",
    "ytick.color": "#52514e",
    "axes.spines.top": False,
    "axes.spines.right": False,
    "axes.grid": True,
    "axes.grid.axis": "y",
    "grid.color": "#e6e5e0",
    "grid.linewidth": 0.6,
    "axes.axisbelow": True,
})

INK, INK2, MUTED = "#0b0b0b", "#52514e", "#8a8984"
PREV, CUR = "#b4b3ad", "#2a78d6"   # 前年=グレー, 当年=青
UP, DOWN = "#1c7c4a", "#c23b3a"
PREV_LABEL, CUR_LABEL = "前年 2025年9月", "当年 2026年9月"

BANDS = [(None, 38, "38未満"), (38, 40, "38〜40"), (40, 42, "40〜42"),
         (42, 44, "42〜44"), (44, 46, "44〜46"), (46, 48, "46〜48"),
         (48, None, "48以上")]
LABELS = [b[2] for b in BANDS]


def pct_label(lab):  # 表用 "38未満" → "38%未満"
    return lab.replace("未満", "%未満").replace("以上", "%以上") if lab[-1] in "満上" else lab + "%"


def band_of(rate):
    for i, (lo, hi, _) in enumerate(BANDS):
        if (lo is None or rate >= lo) and (hi is None or rate < hi):
            return i


def man(v):           # 円 → 万円
    return v / 1e4


def fmt_man(v):
    return f"{man(v):,.0f}"


def pct(a, b):
    return (a / b - 1) * 100 if b else float("nan")


def updown(v, unit, d, up, down):
    return f"{abs(v):,.{d}f}{unit}{up if v >= 0 else down}"


def summarize(path):
    _, recs, total = load(path)
    sites = [r for r in recs if r["sales"] > 0]
    bands = [dict(n=0, sales=0.0, profit=0.0) for _ in BANDS]
    for r in sites:
        b = bands[band_of(r["profit"] / r["sales"] * 100)]
        b["n"] += 1; b["sales"] += r["sales"]; b["profit"] += r["profit"]
    others = [r for r in recs if r["sales"] <= 0]
    return dict(sites=sites, total=total, bands=bands, others=others)


def style_ax(ax, title):
    ax.set_title(title, loc="left", fontsize=14, fontweight="bold", color=INK, pad=14)
    ax.tick_params(length=0)


def band_bars(ax, prev, cur, label_fmt, ylabel, peak_note=True):
    x = range(len(LABELS))
    w = 0.4
    bp = ax.bar([i - w / 2 - 0.01 for i in x], prev, w, color=PREV, label=PREV_LABEL)
    bc = ax.bar([i + w / 2 + 0.01 for i in x], cur, w, color=CUR, label=CUR_LABEL)
    ax.set_xticks(list(x), LABELS, fontsize=9.5)
    ax.set_xlabel("粗利率（%）", fontsize=11)
    ax.yaxis.set_major_formatter(FuncFormatter(lambda v, _: label_fmt(v)))
    ax.set_ylabel(ylabel, fontsize=11)
    top = max(max(prev), max(cur))
    ax.set_ylim(0, top * 1.18)
    for bars, vals, col in ((bp, prev, MUTED), (bc, cur, INK)):
        for b, v in zip(bars, vals):
            if v:
                ax.text(b.get_x() + b.get_width() / 2, b.get_height() + top * 0.012,
                        label_fmt(v), ha="center", va="bottom", fontsize=9, color=col)
    ax.legend(frameon=False, fontsize=11, loc="upper left", handlelength=1.2)


def kpi_tile(ax, name, pv, cv, kind):
    ax.axis("off")
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax.transAxes,
                               facecolor="#f7f7f5", edgecolor="none"))
    diff = cv - pv
    if kind == "man":
        main_s, prev_s = f"{fmt_man(cv)}万円", f"{fmt_man(pv)}万円"
        diff_s = f"{fmt_man(abs(diff))}万円（{abs(pct(cv, pv)):.1f}%）"
    else:
        main_s, prev_s = f"{cv:.2f}%", f"{pv:.2f}%"
        diff_s = f"{abs(diff):.2f}ポイント"
    word = "増" if diff > 0 else "減"
    if kind == "rate":
        word = "上昇" if diff > 0 else "低下"
    ax.text(0.05, 0.80, name, fontsize=11.5, color=INK2, transform=ax.transAxes)
    ax.text(0.05, 0.48, main_s, fontsize=28, fontweight="bold", color=INK, transform=ax.transAxes)
    ax.text(0.05, 0.25, f"前年 {prev_s}", fontsize=11.5, color=MUTED, transform=ax.transAxes)
    ax.text(0.05, 0.07, f"前年比 {'▲' if diff > 0 else '▼'} {diff_s}{word}", fontsize=11.5,
            color=UP if diff > 0 else DOWN, transform=ax.transAxes)


def build_figure(P, C):
    tp, tc = P["total"], C["total"]
    rp, rc = tp["profit"] / tp["sales"] * 100, tc["profit"] / tc["sales"] * 100

    fig = plt.figure(figsize=(420 / 25.4, 297 / 25.4))  # A3横 420×297mm
    fig.patch.set_facecolor("white")

    L, R = 0.075, 0.925  # 左右の余白（約30mm）

    def band(top, bottom, ncols, wspace):
        return GridSpec(1, ncols, figure=fig, left=L, right=R,
                        top=top, bottom=bottom, wspace=wspace)

    # ---- タイトル ----
    fig.text(L, 0.90, "売上・粗利 昨対比（2026年9月 と 2025年9月）",
             fontsize=24, fontweight="bold", color=INK)

    # ---- KPI 3枚 + 要点 ----
    g = band(0.855, 0.735, 12, 1.2)
    kpi_tile(fig.add_subplot(g[0, 0:3]), "売上", tp["sales"], tc["sales"], "man")
    kpi_tile(fig.add_subplot(g[0, 3:6]), "粗利益", tp["profit"], tc["profit"], "man")
    kpi_tile(fig.add_subplot(g[0, 6:9]), "粗利率", rp, rc, "rate")

    def share(d, i):
        return d["bands"][i]["sales"] / sum(b["sales"] for b in d["bands"]) * 100

    pk_p = max(range(len(BANDS)), key=lambda i: P["bands"][i]["sales"])
    pk_c = max(range(len(BANDS)), key=lambda i: C["bands"][i]["sales"])
    ax = fig.add_subplot(g[0, 9:12])
    ax.axis("off")
    ax.add_patch(plt.Rectangle((0, 0), 1, 1, transform=ax.transAxes,
                               facecolor="#eef4fc", edgecolor="none"))
    ax.text(0.05, 0.80, "売上が一番多い粗利率帯", fontsize=11.5, color=INK2, transform=ax.transAxes)
    ax.text(0.05, 0.48, pct_label(LABELS[pk_c]), fontsize=28, fontweight="bold", color=CUR,
            transform=ax.transAxes)
    ax.text(0.05, 0.25, f"当年：売上の{share(C, pk_c):.0f}%がこの帯", fontsize=11.5, color=INK2,
            transform=ax.transAxes)
    ax.text(0.05, 0.07, f"前年：{pct_label(LABELS[pk_p])}（売上の{share(P, pk_p):.0f}%）", fontsize=11.5,
            color=MUTED, transform=ax.transAxes)

    # ---- 粗利率帯別：現場数・売上・粗利 ----
    g = band(0.63, 0.385, 3, 0.22)
    ax = fig.add_subplot(g[0, 0])
    band_bars(ax, [b["n"] for b in P["bands"]], [b["n"] for b in C["bands"]],
              lambda v: f"{v:.0f}", "現場数（件）")
    style_ax(ax, "① 粗利率帯別の現場数")
    ax = fig.add_subplot(g[0, 1])
    band_bars(ax, [b["sales"] for b in P["bands"]], [b["sales"] for b in C["bands"]],
              lambda v: f"{man(v):,.0f}", "売上（万円）")
    style_ax(ax, "② 粗利率帯別の売上")
    ax = fig.add_subplot(g[0, 2])
    band_bars(ax, [b["profit"] for b in P["bands"]], [b["profit"] for b in C["bands"]],
              lambda v: f"{man(v):,.0f}", "粗利（万円）")
    style_ax(ax, "③ 粗利率帯別の粗利")

    # ---- 集計表 ----
    ax = fig.add_axes([L, 0.085, R - L, 0.18])
    ax.axis("off")
    ax.set_title("④ 粗利率帯別の集計表（前年 → 当年）", loc="left", fontsize=14,
                 fontweight="bold", color=INK, pad=12)
    header = ["粗利率", "現場数", "売上（万円）", "粗利（万円）", "売上に占める割合"]
    rows = []
    for i, lab in enumerate(LABELS):
        bp, bc = P["bands"][i], C["bands"][i]
        rows.append([pct_label(lab), f"{bp['n']} → {bc['n']}",
                     f"{fmt_man(bp['sales'])} → {fmt_man(bc['sales'])}",
                     f"{fmt_man(bp['profit'])} → {fmt_man(bc['profit'])}",
                     f"{share(P, i):.1f}% → {share(C, i):.1f}%"])
    # 表は縦長になるので転置して横に並べる
    cols = [header] + rows
    table_rows = [[c[k] for c in cols] for k in range(len(header))]
    tbl = ax.table(cellText=table_rows[1:], colLabels=table_rows[0], cellLoc="center",
                   colWidths=[0.1] + [0.9 / len(rows)] * len(rows), bbox=[0, 0, 1, 1])
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(11)
    for (r, c), cell in tbl.get_celld().items():
        cell.set_edgecolor("#e6e5e0")
        if r == 0:
            cell.set_facecolor("#f5f4f1"); cell.set_text_props(fontweight="bold", color=INK2)
        if c == 0:
            cell.set_facecolor("#f5f4f1"); cell.set_text_props(color=INK2)
        if c == pk_c + 1:
            cell.set_facecolor("#e3eefc")

    return fig


def main(prev_path, cur_path, out_path):
    P, C = summarize(prev_path), summarize(cur_path)
    fig = build_figure(P, C)
    base = out_path.rsplit(".", 1)[0]
    svg = base + ".svg"
    fig.savefig(svg)
    fig.savefig(base + ".png", dpi=110)
    here = os.path.dirname(os.path.abspath(__file__))
    subprocess.run(["node", os.path.join(here, "to_pdf.js"), svg, out_path], check=True)
    os.remove(svg)


if __name__ == "__main__":
    main(*sys.argv[1:4])
