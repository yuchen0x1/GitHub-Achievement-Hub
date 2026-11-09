import json, base64
from harvest import get

path = "content/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/personalizing-your-profile.md"
code, b = get(
    "https://api.github.com/repos/github/docs/commits?path=" + path + "&per_page=100", retries=2
)
d = json.loads(b)
for c in d:
    sha = c["sha"]
    cc, bb = get(
        f"https://api.github.com/repos/github/docs/contents/{path}?ref={sha}", retries=1
    )
    if cc != 200:
        print(sha[:9], c["commit"]["author"]["date"][:10], "ERR", cc)
        continue
    dd = json.loads(bb)
    txt = base64.b64decode(dd["content"]).decode("utf-8", "replace")
    print(
        sha[:9],
        c["commit"]["author"]["date"][:10],
        "DiscussionAnswered=",
        "Discussion answered" in txt,
        "| len",
        len(txt),
    )
