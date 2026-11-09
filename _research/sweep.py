import json, sys, time
from harvest import parse_sidebar

EXTRA = [
    "aral", "mdo", "mgechev", "vsavkin", "kriswilder", "arthurdeuble",
    "kentcdodds", "addyosmani", "cassidoo", "leerob", "shadcn", "antfu",
    "yyx990803", "egoist", "sindresorhus", "tj", "gaearon", "jasonkhan",
    "joshbruce", "jessepollak", "aaronlevy", "steipete", "marmelab",
    "gvanrossum", "defunkt", "mojombo", "technoweenie", "kneath", "schacon",
    "isaacs", "jresig", "dhh", "mitchellh", "rauchg", "wesbos", "simonw",
    "swyxio", "tiangolo", "thomasf85", "jaredpar", "mreiferson", "dylanatsmith",
    "brannon", "timrogers", "ljharb", "Schweinepriester", "Rongronggg9",
    "octocat", "mitchellh", "brianloveswords", "kelseyhightower", "anandthakker",
    "sindresorhus", "yyx990803", "kentcdodds", "tj", "donovanhide",
    "mrdoob", "mrdoob", "tjenkinson", "kylemathews", "mreiferson",
    "kriswilder", "rwaldron", "jdalton", "josephg", "rauchg", "mojombo",
    "technoweenie", "kneath", "rtomayko", "kballard", "pengwynn",
    "joshvap", "marco", "amir", "yihong0618", "exercism", "thoughtbot",
    "ankane", "ankitpokhrel", "sharu725", "sindresorhus", "leandro",
]

slugs = {}
for i, u in enumerate(sorted(set(EXTRA))):
    try:
        sb = parse_sidebar(u)
    except Exception as e:
        continue
    if not sb or "__error__" in sb:
        continue
    print(f"[{i+1}] {u}: {','.join(sorted(sb))}", file=sys.stderr)
    for slug, meta in sb.items():
        slugs.setdefault(slug, {"name": meta["name"], "users": 0, "tiers": set()})
        slugs[slug]["users"] += 1
        slugs[slug]["tiers"].add(meta.get("tier"))

print("\n=== DISTINCT SLUGS ===")
for s, m in sorted(slugs.items()):
    print(f"{s:35} {m['name']:35} users={m['users']:3} tiers={sorted(m['tiers'])}")
json.dump({k: {**v, "tiers": sorted(v["tiers"])} for k, v in slugs.items()},
          open("slug_sweep.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
