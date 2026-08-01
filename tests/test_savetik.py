import requests, re

with open('savetik.html', 'r', encoding='utf-8') as f:
    html = f.read()

hd_match = re.search(r'href="(https://dl\.snapcdn\.app[^"]+)"[^>]*>.*?(?:Download MP4 HD|Download MP4).*?</a>', html, re.IGNORECASE)
if hd_match:
    url = hd_match.group(1)
    print('Found URL:', url[:50])
    r = requests.get(url, stream=True)
    print('Status:', r.status_code)
    print('Content-Length:', r.headers.get('content-length'))
else:
    print('Not found')
