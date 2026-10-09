import openpyxl, re

def load(path):
    ws = openpyxl.load_workbook(path, data_only=True).worksheets[0]
    rows = list(ws.iter_rows(values_only=True))
    period = rows[0][4]
    recs, person, total = [], None, None
    i = 4
    while i < len(rows):
        r = rows[i]
        if r[0] is None and r[1] and r[2] is None and '計' not in str(r[1]):
            person = str(r[1]).strip()
        elif r[2] == '[売上]':
            p = rows[i + 1]
            rec = dict(person=person, code=r[0], name=str(r[1]).strip(),
                       sales=r[12] or 0, cost=p[12] or 0, profit=p[14] or 0,
                       ninku=p[16] or 0)
            if '総合計' in rec['name']:
                total = rec
            elif '担当者計' not in rec['name']:
                recs.append(rec)
            i += 1
        i += 1
    return period, recs, total
