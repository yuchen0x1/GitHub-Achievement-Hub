import json, sys, urllib.request, urllib.error

HDRS = {
    "X-Requested-With": "XMLHttpRequest",
    "Accept": "application/json, text/html, */*",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Referer": "https://github.com/",
}

def get(url):
    req = urllib.request.Request(url, headers=HDRS)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:
        return -1, str(e)

if __name__ == "__main__":
    url = sys.argv[1]
    code, body = get(url)
    print("HTTP", code)
    print(body[:6000])
