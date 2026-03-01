import urllib.request, json

url = 'http://localhost:3001/api/roi-data?app=App-1&country=%E7%BE%8E%E5%9B%BD&mode=moving_avg&window=7'
r = urllib.request.urlopen(url)
d = json.loads(r.read())
p = d['prediction']
data = d['data']
print(f'Data count: {len(data)}')
print(f'Data range: {data[0]["date"]} to {data[-1]["date"]}')
print(f'Prediction count: {len(p)}')
print(f'Prediction range: {p[0]["date"]} to {p[-1]["date"]}')
print()
print("--- Last 5 data points ---")
for x in data[-5:]:
    d0 = x['roi']['day0']['value']
    d7 = x['roi']['day7']['value']
    d30 = x['roi']['day30']['value']
    d90 = x['roi']['day90']['value']
    insuf_d0 = x['roi']['day0']['insufficient']
    insuf_d90 = x['roi']['day90']['insufficient']
    print(f"{x['date']}: day0={d0}(insuf={insuf_d0}), day7={d7}, day30={d30}, day90={d90}(insuf={insuf_d90})")
print()
print("--- All prediction points (non-zero) ---")
for x in p:
    vals = {k: x['roi'][k]['value'] for k in ['day0','day1','day3','day7','day14','day30','day60','day90']}
    nonzero = {k: v for k, v in vals.items() if v > 0}
    if nonzero:
        print(f"{x['date']}: {nonzero}")
