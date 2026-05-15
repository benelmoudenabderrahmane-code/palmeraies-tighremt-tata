import re
from urllib.parse import urlparse


def extract_asin(url: str) -> str | None:
    patterns = [
        r"/dp/([A-Z0-9]{10})",
        r"/gp/product/([A-Z0-9]{10})",
        r"asin=([A-Z0-9]{10})",
    ]
    for pat in patterns:
        m = re.search(pat, url)
        if m:
            return m.group(1)
    return None


def build_amazon_link(asin: str, tag: str, domain: str = "amazon.com") -> str:
    return f"https://www.{domain}/dp/{asin}?tag={tag}"


def make_affiliate_link(url: str, tag: str) -> str | None:
    asin = extract_asin(url)
    if not asin:
        return None
    parsed = urlparse(url)
    domain = parsed.netloc.replace("www.", "") if "amazon" in parsed.netloc else "amazon.com"
    return build_amazon_link(asin, tag, domain)
