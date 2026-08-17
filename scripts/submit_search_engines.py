#!/usr/bin/env python3
"""
CamTech — Submit to ALL Search Engines
========================================
Submits camtech.cam URLs to every major search engine for indexing.
Uses:
  - IndexNow API (Bing, Yandex, DuckDuckGo, Seznam, Naver instant indexing)
  - Google Ping (sitemap notification)
  - Bing Sitemap Ping
"""

import urllib.request
import urllib.parse
import json
import ssl

SITE = "https://camtech.cam"
INDEXNOW_KEY = "6243ecb26b5352f7de1758e5f5df72bb"

URLS = [
    f"{SITE}/",
    f"{SITE}/#tts",
    f"{SITE}/#sticker",
    f"{SITE}/#ai",
    f"{SITE}/sitemap.xml",
    f"{SITE}/robots.txt",
]

# Allow self-signed certs (some search engine endpoints may have issues)
ctx = ssl.create_default_context()

print("=" * 60)
print("  🌐 Submitting camtech.cam to ALL Search Engines")
print("=" * 60)

# ═══ 1. IndexNow — Instant indexing for Bing, Yandex, DuckDuckGo, Seznam, Naver ═══
indexnow_engines = [
    ("Bing + DuckDuckGo", "https://www.bing.com/indexnow"),
    ("Yandex", "https://yandex.com/indexnow"),
    ("IndexNow (shared)", "https://api.indexnow.org/indexnow"),
]

payload = json.dumps({
    "host": "camtech.cam",
    "key": INDEXNOW_KEY,
    "keyLocation": f"{SITE}/{INDEXNOW_KEY}.txt",
    "urlList": URLS
}).encode('utf-8')

for name, endpoint in indexnow_engines:
    try:
        req = urllib.request.Request(
            endpoint,
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        resp = urllib.request.urlopen(req, timeout=15, context=ctx)
        status = resp.getcode()
        if status in (200, 202):
            print(f"  ✅ {name}: Accepted! (HTTP {status})")
        else:
            print(f"  ⚠️  {name}: HTTP {status}")
    except Exception as e:
        print(f"  ⚠️  {name}: {e}")

# ═══ 2. Google — Sitemap Ping ═══
try:
    sitemap_url = urllib.parse.quote(f"{SITE}/sitemap.xml", safe=":/")
    google_ping = f"https://www.google.com/ping?sitemap={sitemap_url}"
    resp = urllib.request.urlopen(google_ping, timeout=15, context=ctx)
    if resp.getcode() == 200:
        print(f"  ✅ Google: Sitemap ping accepted!")
    else:
        print(f"  ⚠️  Google: HTTP {resp.getcode()}")
except Exception as e:
    print(f"  ⚠️  Google: {e}")

# ═══ 3. Bing — Sitemap Ping ═══
try:
    bing_ping = f"https://www.bing.com/ping?sitemap={urllib.parse.quote(f'{SITE}/sitemap.xml', safe=':/')}"
    resp = urllib.request.urlopen(bing_ping, timeout=15, context=ctx)
    if resp.getcode() == 200:
        print(f"  ✅ Bing: Sitemap ping accepted!")
    else:
        print(f"  ⚠️  Bing: HTTP {resp.getcode()}")
except Exception as e:
    print(f"  ⚠️  Bing: {e}")

print(f"\n{'=' * 60}")
print("  📋 MANUAL STEPS REQUIRED (one-time setup)")
print(f"{'=' * 60}")
print("""
  You need to register your site on these platforms (one-time):

  🔍 Google Search Console (MOST IMPORTANT)
     → https://search.google.com/search-console
     → Click "Add Property" → Enter "camtech.cam"
     → Verify via HTML tag (already in your index.html)
     → Replace GOOGLE_VERIFICATION_CODE in index.html with the code Google gives you
     → Submit sitemap: https://camtech.cam/sitemap.xml

  🔍 Bing Webmaster Tools (also covers Yahoo & DuckDuckGo)
     → https://www.bing.com/webmasters
     → Click "Add Site" → Enter "camtech.cam"
     → Verify via HTML tag
     → Replace BING_VERIFICATION_CODE in index.html with the code Bing gives you
     → Submit sitemap: https://camtech.cam/sitemap.xml

  🔍 Yandex Webmaster
     → https://webmaster.yandex.com
     → Add site → camtech.cam
     → Replace YANDEX_VERIFICATION_CODE in index.html

  🔍 Baidu Webmaster (for Chinese users)
     → https://ziyuan.baidu.com
     → Add site → camtech.cam
     → Replace BAIDU_VERIFICATION_CODE in index.html

  🔍 DuckDuckGo
     → Automatically crawls from Bing. No separate submission needed!

  🔍 Yahoo
     → Uses Bing's index. No separate submission needed!

  🍎 Apple (Siri, Spotlight)
     → Automatically discovers from sitemap. No submission needed!

  After replacing the verification codes in index.html,
  push to main and your CI/CD will auto-deploy!
""")
print("✅ Done!")
