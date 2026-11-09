import json, re, sys, time, urllib.request, urllib.error, html as htmllib

HDRS = {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/html, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Referer": "https://github.com/",
}

CACHE = {}

def get(url, retries=4):
    if url in CACHE:
        return CACHE[url]
    last = (-1, "")
    for attempt in range(retries):
        req = urllib.request.Request(url, headers=HDRS)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                code, body = r.status, r.read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            code, body = e.code, e.read().decode("utf-8", "replace")
        except Exception as e:
            code, body = -1, str(e)
        last = (code, body)
        if code == 200:
            break
        time.sleep(1.5 * (attempt + 1))
    CACHE[url] = last
    return last

def parse_sidebar(user):
    """Return dict slug -> {tier, img, name} from a user's achievements sidebar."""
    code, body = get(f"https://github.com/users/{user}/achievements")
    if code != 200:
        return {"__error__": code}
    out = {}
    # sidebar badges
    for m in re.finditer(
        r'<img src="(https://github\.githubassets\.com/assets/([a-z0-9\-]+)-(default|bronze|silver|gold)-([0-9a-f]+)\.png)"[^>]*alt="Achievement: ([^"]+)"',
        body,
    ):
        img, slug, tier, _h, name = m.groups()
        out[slug] = {"tier": tier, "img": img, "name": htmllib.unescape(name)}
    # achievements tab page has more
    code2, body2 = get(f"https://github.com/{user}?tab=achievements")
    if code2 == 200:
        for m in re.finditer(
            r'href="/([^"/]+)\?achievement=([a-z0-9\-]+)&amp;tab=achievements".*?src="(https://github\.githubassets\.com/assets/([a-z0-9\-]+)-(default|bronze|silver|gold)-([0-9a-f]+)\.png)"[^>]*alt="Achievement: ([^"]+)"(.*?)</a>',
            body2,
            re.S,
        ):
            _u, slug, img, _s, tier, _h, name, tail = m.groups()
            lm = re.search(r'achievement-tier-label--(\w+)[^>]*>(x\d+)<', tail)
            label = lm.group(2) if lm else ""
            lbl = lm.group(1) if lm else ""
            out[slug] = {
                "tier": tier,
                "label": label,
                "labelTier": lbl,
                "img": img,
                "name": htmllib.unescape(name),
            }
    return out


def parse_detail(user, slug):
    """Return achievement detail: description text + tier threshold events."""
    code, body = get(f"https://github.com/users/{user}/achievements/{slug}/detail?hovercard=1")
    if code != 200:
        return None
    txt = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", body, flags=re.S | re.I)
    # description: <div class="mt-1">@user ... </div>
    desc = None
    md = re.search(r'<div class="mt-1">(.*?)</div>', txt, re.S)
    if md:
        desc = htmllib.unescape(re.sub(r"<[^>]+>", "", md.group(1))).strip()
    name = None
    mn = re.search(r"<h3>(.*?)</h3>", txt, re.S)
    if mn:
        name = htmllib.unescape(re.sub(r"<[^>]+>", "", mn.group(1))).strip()
    events = []
    for m in re.finditer(r'<span>([^<]+)</span>', txt):
        ev = htmllib.unescape(m.group(1)).strip()
        if ev and not ev.startswith("Achievement"):
            events.append(ev)
    # tier unlock history entries like "Bronze unlocked"
    unlocks = re.findall(r'<span\s*>\s*([A-Za-z ]+)\s+unlocked\s*</span>', txt)
    detail_bg = None
    mb = re.search(r"background-image: url\('([^']+)'\)", txt)
    if mb:
        detail_bg = mb.group(1)
    imgs = re.findall(r'https://github\.githubassets\.com/assets/[a-z0-9\-]+-(?:default|bronze|silver|gold)-[0-9a-f]+\.png', txt)
    return {
        "name": name,
        "desc": desc,
        "events": events,
        "unlocks": unlocks,
        "detailBg": detail_bg,
        "imgs": sorted(set(imgs)),
    }


if __name__ == "__main__":
    mode = sys.argv[1]
    if mode == "sidebar":
        print(json.dumps(parse_sidebar(sys.argv[2]), indent=1, ensure_ascii=False))
    elif mode == "detail":
        print(json.dumps(parse_detail(sys.argv[2], sys.argv[3]), indent=1, ensure_ascii=False))
