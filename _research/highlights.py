import re
from harvest import get

for u in ["sindresorhus", "torvalds", "octocat", "defunkt"]:
    code, b = get(f"https://github.com/users/{u}", retries=4)
    if code != 200:
        print(u, code)
        continue
    i = b.find("Profile highlights")
    seg = b[max(0, i - 200): i + 2500] if i > 0 else ""
    imgs = sorted(set(re.findall(r"https://github\.githubassets\.com/assets/([a-z0-9\-]+\.png)", seg)))
    names = sorted(set(re.findall(r'alt="([^"]{3,40})"', seg)))
    print(u, code, "imgs:", imgs[:10], "names:", names[:10])
