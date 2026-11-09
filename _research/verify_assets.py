import json, re
from harvest import get

ASSETS = {
    "pull-shark": {
        "default": "pull-shark-default-498c279a747d.png",
        "bronze": "pull-shark-bronze-a37accb528d1.png",
        "silver": "pull-shark-silver-0643f87ac9fd.png",
        "gold": "pull-shark-gold-90985540b385.png",
    },
    "starstruck": {
        "default": "starstruck-default-b6610abad518.png",
        "bronze": "starstruck-bronze-b71ec4d7766a.png",
        "silver": "starstruck-silver-275c101223c0.png",
        "gold": "starstruck-gold-a35e077693cc.png",
    },
    "pair-extraordinaire": {
        "default": "pair-extraordinaire-default-579438a20e01.png",
        "bronze": "pair-extraordinaire-bronze-797214f41e7e.png",
        "silver": "pair-extraordinaire-silver-a0b2b472348c.png",
        "gold": "pair-extraordinaire-gold-5335a3b8ae7d.png",
    },
    "galaxy-brain": {
        "default": "galaxy-brain-default-847262c21056.png",
        "bronze": "galaxy-brain-bronze-da3c4829fd22.png",
        "silver": "galaxy-brain-silver-2ce8da282a85.png",
        "gold": "galaxy-brain-gold-9c2c03fd1acf.png",
    },
    "finishing-touch": {
        "default": "finishing-touch-default-764b3a996d62.png",
        "bronze": "finishing-touch-bronze-7c49185628f3.png",
        "silver": "finishing-touch-silver-75ab9a5c22ba.png",
        "gold": "finishing-touch-gold-e19e1fcbfee2.png",
    },
    "quickdraw": {"default": "quickdraw-default-39c6aec8ff89.png"},
    "yolo": {"default": "yolo-default-be0bbff04951.png"},
    "public-sponsor": {"default": "public-sponsor-default-9fa68986b057.png"},
    "arctic-code-vault-contributor": {"default": "arctic-code-vault-contributor-default-df8d74122a06.png"},
    "mars-2020-contributor": {"default": "mars-2020-contributor-default-c9cad8495acf.png"},
    "proxima-pioneer": {"default": "proxima-pioneer-default-51cd4e4969d5.png"},
    "proxima-staffshipper": {"default": "proxima-staffshipper-default-84f658288021.png"},
    "proxima-staffuser": {"default": "proxima-staffuser-default-02bf6163ea31.png"},
}

results = {}
for slug, tiers in ASSETS.items():
    for tier, fname in tiers.items():
        url = f"https://github.githubassets.com/assets/{fname}"
        code, body = get(url)
        results[f"{slug}/{tier}"] = code
        print(f"{code}  {tier:8} {url}  ({len(body)} bytes)")

json.dump(results, open("asset_codes.json", "w", encoding="utf-8"), indent=1)
bad = [k for k, v in results.items() if v != 200]
print("\nNON-200:", bad if bad else "none")
