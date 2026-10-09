"""担当者別売上実績表（前年同月・当月）から、A3横1枚の昨対比レポートPDFを作る。

使い方: python3 make_report.py 前年.xlsx 当年.xlsx 出力.pdf
"""
import sys
from collections import defaultdict

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.gridspec import GridSpec
from matplotlib.ticker import FuncFormatter

from parse import load

for _f in ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
           "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"):
    try:
        font_manager.fontManager.addfont(_f)
    except OSError:
        pass
plt.rcParams.update({
    "font.family": ["Noto Sans CJK JP", "IPAPGothic"],
    "pdf.fonttype": 42,
    "font.size": 10,
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

BANDS = [(None, 38, "38%未満"), (38, 40, "38〜40%"), (40, 42, "40〜42%"),
         (42, 44, "42〜44%"), (44, 46, "44〜46%"), (46, 48, "46〜48%"),
         (48, None, "48%以上")]


def band_of(rate):
    for i, (lo, hi, _) in enumerate(BANDS):
        if (lo is None or rate >= lo) and (hi is None or rate < hi):
            return i


def man(v):           # 円 → 万円
    return v / 1e4


def fmt_man(v, d=0):
    return f"{man(v):,.{d}f}"


def summarize(path):
    period, recs, total = load(path)
    sites = [r for r in recs if r["sales"] > 0]
    for r in sites:
        r["rate"] = r["profit"] / r["sales"] * 100
        r["band"] = band_of(r["rate"])
    bands = [dict(n=0, sales=0.0, profit=0.0) for _ in BANDS]
    for r in sites:
        b = bands[r["band"]]
        b["n"] += 1; b["sales"] += r["sales"]; b["profit"] += r["profit"]
    persons = defaultdict(lambda: dict(sales=0.0, profit=0.0, n=0))
    for r in sites:
        p = persons[r["person"]]
        p["sales"] += r["sales"]; p["profit"] += r["profit"]; p["n"] += 1
    others = [r for r in recs if r["sales"] <= 0]
    return dict(period=period, sites=sites, total=total, bands=bands,
                persons=persons, others=others)


def updown(v, unit, d, up, down):
    return f"{abs(v):,.{d}f}{unit}{up if v >= 0 else down}"


def pct(a, b):
    return (a / b - 1) * 100 if b else float("nan")


def style_ax(ax, title, sub=None):
    ax.set_title(title, loc="left", fontsize=13, fontweight="bold", color=INK, pad=22)
    if sub:
        ax.text(0, 1.02, sub, transform=ax.transAxes, fontsize=9, color=INK2, va="bottom")
    ax.tick_params(length=0)


def legend(ax, loc="upper left"):
    ax.legend(frameon=False, fontsize=9, loc=loc, handlelength=1.2, ncol=2)


def grouped_bars(ax, labels, prev, cur, ylabel_fmt, label_fmt, ylabel):
    x = range(len(labels))
    w = 0.38
    bp = ax.bar([i - w / 2 - 0.01 for i in x], prev, w, color=PREV, label="前年 2025年9月")
    bc = ax.bar([i + w / 2 + 0.01 for i in x], cur, w, color=CUR, label="当年 2026年9月")
    ax.set_xticks(list(x), labels, fontsize=9.5)
    ax.yaxis.set_major_formatter(FuncFormatter(ylabel_fmt))
    ax.set_ylabel(ylabel, fontsize=9)
    top = max(max(prev), max(cur))
    ax.set_ylim(0, top * 1.2)
    for bars, vals, col in ((bp, prev, MUTED), (bc, cur, INK)):
        for b, v in zip(bars, vals):
            if v:
                ax.text(b.get_x() + b.get_width() / 2, b.get_height() + top * 0.015,
                        label_fmt(v), ha="center", va="bottom", fontsize=8, color=col)
    legend(ax)


def hbar_pair(ax, disp, prev, cur, title, sub=None):
    y = list(range(len(disp)))
    h = 0.36
    top = max(prev + cur)
    for vals, col, lab, off, tcol in ((prev, PREV, "前年", -h / 2 - 0.01, MUTED),
                                      (cur, CUR, "当年", h / 2 + 0.01, INK)):
        bars = ax.barh([i + off for i in y], [man(v) for v in vals], h, color=col, label=lab)
        for b, v in zip(bars, vals):
            if v:
                ax.text(man(v) + man(top) * 0.015, b.get_y() + b.get_height() / 2,
                        f"{man(v):,.0f}", va="center", fontsize=8, color=tcol)
    ax.set_yticks(y, disp, fontsize=9.5)
    ax.set_ylim(len(disp) - 0.5, -0.5)
    ax.set_xlim(0, man(top) * 1.22)
    ax.grid(axis="y", visible=False)
    ax.grid(axis="x", color="#e6e5e0", linewidth=0.6)
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}"))
    ax.set_xlabel("万円", fontsize=9)
    ax.legend(frameon=False, fontsize=8.5, loc="lower right")
    style_ax(ax, title, sub)


def main(prev_path, cur_path, out_path):
    P, C = summarize(prev_path), summarize(cur_path)
    tp, tc = P["total"], C["total"]

    fig = plt.figure(figsize=(420 / 25.4, 297 / 25.4))  # A3横 420×297mm
    fig.patch.set_facecolor("white")
    def band(top, bottom):  # 段ごとに上下位置を指定した12列のグリッド
        return GridSpec(1, 12, figure=fig, left=0.045, right=0.975, top=top, bottom=bottom,
                        wspace=1.4)

    gs_kpi, gs_mid, gs_low = band(0.905, 0.800), band(0.625, 0.395), band(0.305, 0.105)

    # ---- タイトル ----
    fig.text(0.045, 0.958, "月次 売上・粗利 昨対比レポート（2026年9月 vs 2025年9月）",
             fontsize=21, fontweight="bold", color=INK)
    fig.text(0.045, 0.932,
             "出典：担当者別売上実績表 2025年9月分・2026年9月分　｜　金額は税抜・万円　｜　"
             "粗利率＝粗利益÷売上合計　｜　「現場」は表の得意先1行（担当者×得意先）を1件として集計",
             fontsize=9.5, color=INK2)

    # ---- KPIタイル ----
    kpis = [
        ("売上合計", tp["sales"], tc["sales"], "man"),
        ("粗利益", tp["profit"], tc["profit"], "man"),
        ("粗利率", tp["profit"] / tp["sales"] * 100, tc["profit"] / tc["sales"] * 100, "rate"),
        ("現場数（売上あり）", len(P["sites"]), len(C["sites"]), "count"),
        ("人工", tp["ninku"], tc["ninku"], "ninku"),
        ("1人工あたり粗利", tp["profit"] / tp["ninku"], tc["profit"] / tc["ninku"], "yen"),
    ]
    for i, (name, pv, cv, kind) in enumerate(kpis):
        ax = fig.add_subplot(gs_kpi[0, i * 2:i * 2 + 2])
        ax.axis("off")
        ax.add_patch(plt.Rectangle((-0.04, 0), 1.08, 1, transform=ax.transAxes,
                                   facecolor="#f5f4f1", edgecolor="none", clip_on=False))
        diff = cv - pv
        if kind == "man":
            main_s, prev_s = f"{fmt_man(cv)}万円", f"{fmt_man(pv)}万円"
            diff_s = f"{'+' if diff >= 0 else '−'}{fmt_man(abs(diff))}万円（{pct(cv, pv):+.1f}%）"
        elif kind == "rate":
            main_s, prev_s = f"{cv:.2f}%", f"{pv:.2f}%"
            diff_s = f"{diff:+.2f}ポイント"
        elif kind == "count":
            main_s, prev_s = f"{cv}件", f"{pv}件"
            diff_s = f"{diff:+d}件"
        elif kind == "ninku":
            main_s, prev_s = f"{cv:,.1f}人工", f"{pv:,.1f}人工"
            diff_s = f"{diff:+,.1f}人工（{pct(cv, pv):+.1f}%）"
        else:
            main_s, prev_s = f"{cv:,.0f}円", f"{pv:,.0f}円"
            diff_s = f"{diff:+,.0f}円（{pct(cv, pv):+.1f}%）"
        diff_s = diff_s.replace("-", "−")
        arrow = "▲" if diff > 0 else ("▼" if diff < 0 else "±")
        ax.text(0.03, 0.80, name, fontsize=11, color=INK2, transform=ax.transAxes)
        ax.text(0.03, 0.46, main_s, fontsize=22, fontweight="bold", color=INK, transform=ax.transAxes)
        ax.text(0.03, 0.26, f"前年 {prev_s}", fontsize=9.5, color=MUTED, transform=ax.transAxes)
        ax.text(0.03, 0.06, f"前年比 {arrow} {diff_s}", fontsize=9.5,
                color=UP if diff > 0 else (DOWN if diff < 0 else INK2), transform=ax.transAxes)

    labels = [b[2] for b in BANDS]

    # ---- 要点（数値から自動算出） ----
    def peak_band(d):
        i = max(range(len(BANDS)), key=lambda i: d["bands"][i]["sales"])
        tot = sum(b["sales"] for b in d["bands"])
        return labels[i], d["bands"][i]["sales"] / tot * 100

    def low_share(d, limit=42):
        tot = sum(b["sales"] for b in d["bands"])
        low = sum(b["sales"] for (lo, hi, _), b in zip(BANDS, d["bands"]) if hi is not None and hi <= limit)
        return low, low / tot * 100

    (pb, ps), (cb, cs) = peak_band(P), peak_band(C)
    (pl, pls), (cl, cls) = low_share(P), low_share(C)
    points = [
        f"売上が最も集まる粗利率帯は、前年の{pb}（売上の{ps:.1f}%）から当年は{cb}（{cs:.1f}%）に上がった。",
        f"粗利率42%未満の現場の売上は {fmt_man(pl)}万円（{pls:.1f}%）→ {fmt_man(cl)}万円（{cls:.1f}%）に減った。",
        f"全体の粗利率は{updown(tc['profit'] / tc['sales'] * 100 - tp['profit'] / tp['sales'] * 100, 'ポイント', 2, '上昇', '低下')}。"
        f"一方で売上が前年比{updown(pct(tc['sales'], tp['sales']), '%', 1, '増', '減')}のため、"
        f"粗利益は{updown(man(tc['profit'] - tp['profit']), '万円', 0, '増', '減')}。",
    ]
    ax = fig.add_axes([0.045, 0.705, 0.93, 0.07])
    ax.axis("off")
    ax.add_patch(plt.Rectangle((-0.005, 0), 1.01, 1, transform=ax.transAxes,
                               facecolor="#eef4fc", edgecolor="none", clip_on=False))
    ax.text(0.005, 0.5, "要点", fontsize=12, fontweight="bold", color=CUR, va="center",
            transform=ax.transAxes)
    ax.text(0.05, 0.5, "\n".join(f"・{t}" for t in points), fontsize=10.5, color=INK,
            va="center", linespacing=1.55, transform=ax.transAxes)

    # ---- ① 粗利率帯別 件数 ----
    ax = fig.add_subplot(gs_mid[0, 0:4])
    grouped_bars(ax, labels, [b["n"] for b in P["bands"]], [b["n"] for b in C["bands"]],
                 lambda v, _: f"{v:.0f}", lambda v: f"{v:.0f}件", "件数")
    style_ax(ax, "① 粗利率帯別の現場数", "どの粗利率の現場が多いか（2％刻み）")

    # ---- ② 粗利率帯別 売上額 ----
    ax = fig.add_subplot(gs_mid[0, 4:8])
    sp, sc = [b["sales"] for b in P["bands"]], [b["sales"] for b in C["bands"]]
    grouped_bars(ax, labels, sp, sc, lambda v, _: f"{man(v):,.0f}",
                 lambda v: f"{man(v):,.0f}", "売上（万円）")
    style_ax(ax, "② 粗利率帯別の売上額", "売上のボリュームゾーンはどの粗利率帯か")

    # ---- ③ 粗利率帯別 集計表 ----
    ax = fig.add_subplot(gs_mid[0, 8:12])
    ax.axis("off")
    style_ax(ax, "③ 粗利率帯別 集計表", "構成比＝売上のある現場の売上合計に対する割合。青い行が当年の売上最多帯")
    sp_tot, sc_tot = sum(sp), sum(sc)
    header = ["粗利率帯", "件数\n前年→当年", "売上（万円）\n前年→当年",
              "売上構成比\n前年→当年", "粗利（万円）\n前年→当年"]
    rows = []
    for i, lab in enumerate(labels):
        bp, bc = P["bands"][i], C["bands"][i]
        rows.append([lab, f"{bp['n']} → {bc['n']}",
                     f"{fmt_man(bp['sales'])} → {fmt_man(bc['sales'])}",
                     f"{bp['sales'] / sp_tot * 100:.1f}% → {bc['sales'] / sc_tot * 100:.1f}%",
                     f"{fmt_man(bp['profit'])} → {fmt_man(bc['profit'])}"])
    pp_tot = sum(b["profit"] for b in P["bands"]); pc_tot = sum(b["profit"] for b in C["bands"])
    rows.append(["合計", f"{len(P['sites'])} → {len(C['sites'])}",
                 f"{fmt_man(sp_tot)} → {fmt_man(sc_tot)}", "100% → 100%",
                 f"{fmt_man(pp_tot)} → {fmt_man(pc_tot)}"])
    tbl = ax.table(cellText=rows, colLabels=header, cellLoc="center",
                   colWidths=[0.15, 0.14, 0.25, 0.23, 0.23], bbox=[0, 0.0, 1, 1.0])
    tbl.auto_set_font_size(False)
    tbl.set_fontsize(9.5)
    peak = max(range(len(BANDS)), key=lambda i: C["bands"][i]["sales"])
    for (r, c), cell in tbl.get_celld().items():
        cell.set_edgecolor("#e6e5e0")
        if r == 0:
            cell.set_facecolor("#f5f4f1"); cell.set_text_props(color=INK2, fontsize=8.5)
        elif r == len(rows):
            cell.set_text_props(fontweight="bold")
        elif r - 1 == peak:
            cell.set_facecolor("#e3eefc")

    # ---- ④ 散布図：現場ごとの売上×粗利率 ----
    ax = fig.add_subplot(gs_low[0, 0:5])
    for d, col, lab, z in ((P, PREV, "前年 2025年9月", 2), (C, CUR, "当年 2026年9月", 3)):
        ax.scatter([man(r["sales"]) for r in d["sites"]], [r["rate"] for r in d["sites"]],
                   s=34, color=col, edgecolor="white", linewidth=0.8, label=lab, zorder=z)
    ax.set_xscale("log")
    ax.set_xlim(3, 2500)
    rp_all = tp["profit"] / tp["sales"] * 100
    rc_all = tc["profit"] / tc["sales"] * 100
    ax.axhline(rp_all, color=MUTED, linewidth=1, linestyle="--", zorder=1)
    ax.axhline(rc_all, color=CUR, linewidth=1, linestyle="--", zorder=1)
    top = sorted(C["sites"], key=lambda r: -r["sales"])[:3]
    for (dx, dy), r in zip([(-20, 70), (-20, 48), (-20, -60)], top):
        ax.annotate(f"{r['name']}  {fmt_man(r['sales'])}万円・{r['rate']:.1f}%",
                    (man(r["sales"]), r["rate"]), xytext=(dx, dy), textcoords="offset points",
                    ha="right", va="center", fontsize=8, color=INK2,
                    bbox=dict(facecolor="white", edgecolor="none", pad=1),
                    arrowprops=dict(arrowstyle="-", color="#8a8984", linewidth=0.8))
    ax.xaxis.set_major_formatter(FuncFormatter(lambda v, _: f"{v:,.0f}"))
    ax.set_xlabel("現場ごとの売上（万円・対数目盛）", fontsize=9)
    ax.set_ylabel("粗利率（%）", fontsize=9)
    ax.grid(axis="x", color="#e6e5e0", linewidth=0.6)
    legend(ax, "lower left")
    style_ax(ax, "④ 現場ごとの売上と粗利率",
             f"1点＝1現場。右ほど売上が大きい。破線＝全体の粗利率（前年{rp_all:.2f}%・当年{rc_all:.2f}%）。名前は当年の売上上位3件")

    # ---- ⑤⑥⑦ 担当者別 ----
    names = list(dict.fromkeys(list(C["persons"]) + list(P["persons"])))
    names = [n for n in names if n != "【営業共通】"]

    def get(d, n, k):
        return d["persons"][n][k] if n in d["persons"] else 0

    names.sort(key=lambda n: -(get(C, n, "sales") + get(P, n, "sales")))
    disp = [n.replace("退)", "（退）") for n in names]

    ax = fig.add_subplot(gs_low[0, 5:8])
    hbar_pair(ax, disp, [get(P, n, "sales") for n in names], [get(C, n, "sales") for n in names],
              "⑤ 担当者別 売上", "担当者の入替・担当替えがあり単純比較に注意")
    ax = fig.add_subplot(gs_low[0, 8:10])
    hbar_pair(ax, [""] * len(names), [get(P, n, "profit") for n in names],
              [get(C, n, "profit") for n in names], "⑥ 担当者別 粗利")
    ax.get_legend().remove()

    ax = fig.add_subplot(gs_low[0, 10:12])
    for i, n in enumerate(names):
        rp = get(P, n, "profit") / get(P, n, "sales") * 100 if get(P, n, "sales") else None
        rc = get(C, n, "profit") / get(C, n, "sales") * 100 if get(C, n, "sales") else None
        if rp and rc:
            ax.plot([rp, rc], [i, i], color="#d9d8d3", linewidth=2.5, zorder=1)
        if rp:
            ax.scatter([rp], [i], s=50, color=PREV, edgecolor="white", linewidth=1, zorder=2)
            ax.text(rp, i + 0.38, f"{rp:.1f}", ha="center", va="center", fontsize=7.5, color=MUTED)
        if rc:
            ax.scatter([rc], [i], s=50, color=CUR, edgecolor="white", linewidth=1, zorder=3)
            ax.text(rc, i - 0.38, f"{rc:.1f}", ha="center", va="center", fontsize=7.5, color=INK)
    ax.set_xlim(41, 48)
    ax.set_yticks(range(len(names)), [""] * len(names))
    ax.set_ylim(len(names) - 0.5, -0.5)
    ax.grid(axis="y", visible=False)
    ax.grid(axis="x", color="#e6e5e0", linewidth=0.6)
    ax.set_xlabel("%（灰＝前年・青＝当年）", fontsize=9)
    style_ax(ax, "⑦ 担当者別 粗利率")

    # ---- 注記 ----
    op = sum(r["profit"] for r in P["others"]); oc = sum(r["profit"] for r in C["others"])
    fig.text(0.045, 0.022,
             "注：上段の数値は実績表の<<総合計>>行の値。①〜⑦は売上のある現場のみで集計し、売上0の社内処理行"
             f"「諸口」（支払 前年{-op:,.0f}円・当年{-oc:,.0f}円）は除外。そのため③の粗利合計は上段の粗利益と一致しない。\n"
             "（退）は退職者。前年の担当者「田牧 光」「（退）鈴木 竜生」は当年の表になく、"
             "当年は「尾崎 高大」「（退）木村 佳照」が新たに載っている。",
             fontsize=8.5, color=INK2, linespacing=1.6)

    fig.savefig(out_path)
    fig.savefig(out_path.rsplit(".", 1)[0] + ".png", dpi=110)


if __name__ == "__main__":
    main(*sys.argv[1:4])
