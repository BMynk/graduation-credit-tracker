"""Opt-in live Marcel smoke benchmark. Never runs in CI without explicit invocation.

Usage:
  MARCEL_BASE_URL=https://YOUR-RENDER-BACKEND.example.com \\
  python backend/scripts/benchmark_marcel_live.py

Optional authenticated checks:
  MARCEL_TOKEN=<temporary-student-token> MARCEL_BASE_URL=... \\
  python backend/scripts/benchmark_marcel_live.py

The script never prints tokens, messages, or private student data.
"""
import json
import os
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def main():
    base = os.getenv("MARCEL_BASE_URL", "").strip().rstrip("/")
    if not base or urllib.parse.urlparse(base).scheme != "https" or not urllib.parse.urlparse(base).hostname:
        print("Set MARCEL_BASE_URL to the HTTPS URL of your deployed backend.")
        return 2
    token = os.getenv("MARCEL_TOKEN", "").strip()
    cases = [
        ("public_navigation", "How do I use the Graduation Credit Tracker planning page?", "planning", False),
    ]
    if token:
        cases += [
            ("credits", "How many credits remain in my programme?", "summary", True),
            ("module_eligibility", "Which modules am I eligible to take next semester?", "planning", True),
            ("failed_module", "Can you explain my failed modules using my records?", "history", True),
            ("graduation", "What graduation requirements do I still need to satisfy?", "summary", True),
        ]
    results = []
    for label, question, page, authenticated in cases:
        payload = json.dumps({"message": question, "current_page": page, "history": []}).encode()
        headers = {"Content-Type": "application/json"}
        if authenticated:
            headers["Authorization"] = f"Bearer {token}"
        req = urllib.request.Request(base + "/assistant/chat", data=payload, headers=headers, method="POST")
        started = time.perf_counter()
        try:
            with urllib.request.urlopen(req, timeout=45) as response:
                data = json.load(response)
                code = response.status
            valid = isinstance(data.get("message"), str) and bool(data["message"].strip())
            error = None if valid else "missing or empty assistant response"
        except urllib.error.HTTPError as exc:
            code, valid, error = exc.code, False, "HTTP error (details withheld)"
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            code, valid, error = None, False, type(exc).__name__
        elapsed = round((time.perf_counter() - started) * 1000)
        results.append({"case": label, "http_status": code, "elapsed_ms": elapsed, "response_present": valid, "error": error})
    print(json.dumps({"results": results, "median_elapsed_ms": statistics.median(x["elapsed_ms"] for x in results), "note": "End-to-end timing includes network, backend and AI model. Response presence does not establish academic correctness; manually compare answers with the authenticated dashboard."}, indent=2))
    return 0 if all(x["response_present"] for x in results) else 1


if __name__ == "__main__":
    sys.exit(main())
