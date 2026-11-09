import json, re
from harvest import get, parse_sidebar, parse_detail

TARGETS = [
    "ljharb", "Schweinepriester", "brannon", "timrogers", "dylanatsmith",
    "Rongronggg9", "octocat", "defunkt", "mojombo", "schacon",
    "aral", "mdo", "isaacs", "mitchellh", "steipete", "tiangolo",
]

out = {}
for u in TARGETS:
    sb = parse_sidebar(u)
    if not sb or "__error__" in sb:
        print(f"{u}: ERR {sb}")
        continue
    print(f"{u}: {sorted(sb)}")
    out[u] = sb
    for slug in sb:
        code, body = get(f"https://github.com/users/{u}/achievements/{slug}/detail?hovercard=1")
        if code != 200:
            continue
        # capture the tier-badge flip set and the history rows
        imgs = re.findall(
            r'https://github\.githubassets\.com/assets/([a-z0-9\-]+)-(default|bronze|silver|gold)-([0-9a-f]+)\.png',
            body,
        )
        rows = re.findall(r'<span>([^<]{2,80})</span>', body)
        unlocks = re.findall(r'<span\s*>\s*([^<]{2,30}?)\s+unlocked\s*</span>', body)
        label = re.findall(r'achievement-tier-label--(\w+)[^>]*>(x\d+)<', body)
        desc = re.search(r'<div class="mt-1">(.*?)</div>', body, re.S)
        descs = re.sub(r"<[^>]+>", "", desc.group(1)).strip() if desc else None
        rec = {
            "slug": slug,
            "imgs": sorted(set(imgs)),
            "rows": rows,
            "unlocks": unlocks,
            "label": label,
            "desc": descs,
            "sidebar": sb[slug],
        }
        print(f"   [{slug}] label={label} unlocks={unlocks} desc={descs}")
        print(f"       rows={rows[:14]}")
        print(f"       imgs={sorted(set(imgs))}")
        out[u][slug]["detail"] = rec

json.dump(out, open("targeted.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
print("OK")
