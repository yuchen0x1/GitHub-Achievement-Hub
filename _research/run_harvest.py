import json, os, sys, time
from harvest import parse_sidebar, parse_detail

USERS = [
    "torvalds", "gaearon", "sindresorhus", "yyx990803", "antfu", "tj",
    "octocat", "defunkt", "mojombo", "technoweenie", "kneath", "schacon",
    "isaacs", "nodejs", "david", "jresig", "defunkt", "gvanrossum",
    "dhh", "aral", "mdo", "jhy", "zachman", "aaronpk", "mitchellh",
    "tjholoway", "rauchg", "sindresorhus", "kentcdodds", "wesbos",
    "sarah_edo", "cassidoo", "addyosmani", "yyx990803", "egoist",
    "vuejs", "facebook", "microsoft", "google", "vercel", "sveltejs",
    "rust-lang", "golang", "nodejs", "denoland", "pyca", "psf",
    "tiangolo", "encode", "pallets", "jazzband", "scipy", "numpy",
    "huggingface", "openai", "anthropics", "langchain-ai", "vercel",
    "kamranahmedse", "sindresorhus", "tj", "leerob", "shadcn", "yyx990803",
    "donovanhide", "simonw", "tiangolo", "swyxio", "kentcdodds",
    "jasontheweb", "jasonkhan", "joshbruce", "jessepollak", "aaronlevy",
    "steipete", "marmelab", "arthurdeuble", "mgechev", "vsavkin",
    "jaredpar", "kriswilder", "mreiferson", "thomasf85", "mikehebert",
]

# high-tier accounts to hit gold thresholds
GOLD_CANDIDATES = [
    "torvalds", "gaearon", "sindresorhus", "antfu", "tj", "marmelab",
    "gvanrossum", "defunkt", "mojombo", "technoweenie", "kneath", "schacon",
    "isaacs", "jresig", "dhh", "aral", "mdo", "mitchellh", "rauchg",
    "kentcdodds", "wesbos", "addyosmani", "leerob", "shadcn", "simonw",
    "steipete", "jasonkhan", "jessepollak", "aaronlevy", "jaredpar",
]

seen = {}
detail_rows = []
users = sorted(set(USERS) | set(GOLD_CANDIDATES))
for i, u in enumerate(users):
    try:
        sb = parse_sidebar(u)
    except Exception as e:
        print(f"ERR {u}: {e}", file=sys.stderr)
        continue
    if not sb or "__error__" in sb:
        continue
    if sb:
        print(f"[{i+1}/{len(users)}] {u}: {','.join(sorted(sb))}", file=sys.stderr)
    for slug, meta in sb.items():
        seen.setdefault(slug, {"name": meta["name"], "tiers_seen": set(), "imgs": {}})
        seen[slug]["tiers_seen"].add(meta.get("tier"))
        seen[slug]["imgs"][meta["tier"]] = meta["img"]
    for slug in sb:
        try:
            d = parse_detail(u, slug)
        except Exception as e:
            d = None
        if d:
            detail_rows.append({"user": u, "slug": slug, **d})
        time.sleep(0.15)

out = {
    "achievements": {
        k: {
            "name": v["name"],
            "tiers_seen": sorted(v["tiers_seen"]),
            "imgs": v["imgs"],
        }
        for k, v in sorted(seen.items())
    },
    "details": detail_rows,
}
with open("harvest_out.json", "w", encoding="utf-8") as f:
    json.dump(out, f, indent=1, ensure_ascii=False)
print("WROTE harvest_out.json", len(seen), "achievements,", len(detail_rows), "details")
