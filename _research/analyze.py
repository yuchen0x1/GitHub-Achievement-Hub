import json, re
from collections import defaultdict

d = json.load(open("harvest_out.json", encoding="utf-8"))
ach = d["achievements"]
det = d["details"]

print("=== ACHIEVEMENTS SEEN ===")
for slug, meta in ach.items():
    print(f"\n## {slug}  |  name={meta['name']}  |  tiers_seen={meta['tiers_seen']}")
    for t, img in sorted(meta["imgs"].items()):
        print(f"   {t:8} {img}")
    # descriptions
    descs = set()
    for r in det:
        if r["slug"] == slug and r.get("desc"):
            descs.add(r["desc"])
    for x in sorted(descs):
        print("   DESC:", x)
    # events (tier thresholds)
    ev = defaultdict(set)
    for r in det:
        if r["slug"] == slug:
            for e in r.get("events") or []:
                ev[e].add(r["user"])
    for e, us in sorted(ev.items()):
        print(f"   EV: {e}   (n={len(us)})")
    unl = set()
    for r in det:
        if r["slug"] == slug:
            unl.update(r.get("unlocks") or [])
    if unl:
        print("   UNLOCKS:", unl)
