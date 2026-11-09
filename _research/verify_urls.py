import json
from harvest import get

URLS = [
    ("https://docs.github.com/en/account-and-profile/reference/profile-reference", "OFFICIAL_DOC"),
    ("https://github.blog/changelog/2022-06-09-achievements-public-beta/", "CHANGELOG"),
    ("https://github.blog/2022-06-09-introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/", "OFFICIAL_BLOG"),
    ("https://github.blog/2021-04-19-open-source-goes-to-mars/", "OFFICIAL_BLOG"),
    ("https://docs.github.com/en/account-and-profile/how-tos/contribution-settings/manage-visibility-settings-for-private-contributions-and-achievements", "OFFICIAL_DOC"),
    ("https://github.com/orgs/community/discussions/106536", "OFFICIAL_DISCUSSION"),
    ("https://github.com/orgs/community/discussions/190909", "OFFICIAL_DISCUSSION"),
    ("https://github.com/orgs/community/discussions/190842", "OFFICIAL_DISCUSSION"),
    ("https://github.com/orgs/community/discussions/211041", "OFFICIAL_DISCUSSION"),
    ("https://github.com/Schweinepriester/github-profile-achievements", "COMMUNITY"),
    ("https://github.com/drknzz/GitHub-Achievements", "COMMUNITY"),
    ("https://github.com/nmloc/gh-achievements", "COMMUNITY"),
    ("https://github.com/Schweinepriester/github-profile-achievements/discussions/9", "COMMUNITY"),
    ("https://github.com/Schweinepriester/github-profile-achievements/discussions/6", "COMMUNITY"),
    ("https://github.com/Schweinepriester/github-profile-achievements/discussions/925", "COMMUNITY"),
    ("https://github.com/nmloc/gh-achievements/issues", "COMMUNITY"),
    ("https://web.archive.org/web/20220531023858/https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/customizing-your-profile/personalizing-your-profile", "ARCHIVE"),
    ("https://github.com/users/torvalds/achievements/pull-shark/detail?hovercard=1", "LIVE_ENDPOINT"),
    ("https://github.com/torvalds?tab=achievements", "LIVE_ENDPOINT"),
    ("https://github.com/ljharb?tab=achievements", "LIVE_ENDPOINT"),
    ("https://github.com/dylanatsmith?tab=achievements", "LIVE_ENDPOINT"),
    ("https://github.com/brannon?tab=achievements", "LIVE_ENDPOINT"),
    ("https://github.com/timrogers?tab=achievements", "LIVE_ENDPOINT"),
    ("https://github.com/settings/profile#profile-settings-heading", "LIVE_ENDPOINT"),
    ("https://archiveprogram.github.com/", "OFFICIAL"),
    ("https://github.blog/2022-06-09-introducing-achievements-recognizing-the-many-stages-of-a-developers-coding-journey/#what-achievements-are-there", "OFFICIAL_BLOG"),
]

res = {}
for url, t in URLS:
    code, body = get(url, retries=3)
    res[url] = code
    print(f"{code}  [{t}]  {url}")

json.dump(res, open("url_codes.json", "w", encoding="utf-8"), indent=1, ensure_ascii=False)
