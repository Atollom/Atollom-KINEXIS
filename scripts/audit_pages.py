#!/usr/bin/env python3
"""
audit_pages.py — KINEXIS Dashboard Page Status Checker

Scans every page.tsx under src/dashboard/app and classifies it:

  functional_real  — reads from Supabase / real API (backend-connected)
  functional_mock  — renders real UI but data is hardcoded / from mockData
  placeholder      — stub with "Agente #X" banner, Fase 2 text, or empty glassmorphism card
  wrapper          — thin file that just re-exports another component
  auth             — login / error / unauthorized (outside shell, not app pages)

Outputs a JSON report to stdout.  Save with:
  python scripts/audit_pages.py > page-status.json
"""

import json
import os
import re
import sys
from pathlib import Path

# ── Repo root ─────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parent.parent
APP_ROOT  = REPO_ROOT / "src" / "dashboard" / "app"

# ── Detection signals (ordered: first match wins for the primary status) ──────

# Pages outside the (shell) group — auth/utility, not product pages
AUTH_PATHS = {"/login", "/error", "/unauthorized", "/privacidad", "/terminos", ""}   # "" = root

# Real data: connects to Supabase or backend API
REAL_SIGNALS = [
    (r"from\s+['\"]@/lib/supabase['\"]",           "imports supabase client"),
    (r"createClient\s*\(\s*\)",                     "calls createClient()"),
    (r"getAuthenticatedTenant",                     "uses getAuthenticatedTenant"),
    (r"getUserRole",                                "uses getUserRole"),
    (r"createBrowserSupabaseClient",                "uses browser supabase client"),
    (r"from\s+['\"]@/lib/auth['\"]",                "imports auth lib"),
    (r"process\.env\.(PYTHON_BACKEND_URL|API_URL)", "reads backend URL env var"),
    (r"authenticatedFetch",                         "uses authenticatedFetch"),
    (r"supabase\.from\s*\(",                        "queries supabase table"),
]

# Mock data: hardcoded arrays or imported from mockData
MOCK_SIGNALS = [
    (r"from\s+['\"]@/lib/mockData['\"]",            "imports mockData"),
    (r"from\s+['\"]@/lib/mock",                     "imports mock lib"),
    (r"mockConversations|mockInboxStats|CFDI_RECIBIDAS|CFDI_STATS|CFDI_EMITIDAS",
                                                    "uses mock constants"),
    (r"const\s+\w+\s*[=:]\s*\[[\s\S]{0,30}\{",     "inline data array literal"),
    (r"useMemo\s*\(\s*\(\s*\)\s*=>",                "useMemo with computed data"),
]

# Placeholder: stub cards, "coming soon" patterns, Fase 2 comments
PLACEHOLDER_SIGNALS = [
    (r"glassmorphism\s+p-12",                       "glassmorphism stub card"),
    (r"<ComingSoon",                                "ComingSoon component"),
    (r"Fase\s*[23]",                                "Fase 2/3 reference"),
    (r"pr[oó]ximamente",                            "próximamente text"),
    (r"disponible\s+en\s+Fase",                     "disponible en Fase N"),
    (r"Agente\s*#\d+.*en\s+desarrollo",             "agent in development"),
    (r"coming.?soon",                               "coming soon text (EN)"),
    (r"En\s+construcci[oó]n",                       "en construcción text"),
    (r"Conectando\s+con\s+",                        "Conectando con… text"),
    (r'"placeholder"',                              'placeholder class/attr'),
]

# Wrapper: tiny file that just re-exports or renders another component
WRAPPER_SIGNALS = [
    (r"^['\"]use client['\"]",                      "client directive only"),
]


def _match_signals(content: str, signals: list[tuple[str, str]]) -> list[str]:
    """Return descriptions of all matched signals."""
    found = []
    for pattern, description in signals:
        if re.search(pattern, content, re.IGNORECASE | re.MULTILINE):
            found.append(description)
    return found


def classify(path: Path, content: str, route: str) -> dict:
    lines      = content.splitlines()
    line_count = len(lines)
    char_count = len(content)

    real_hits        = _match_signals(content, REAL_SIGNALS)
    mock_hits        = _match_signals(content, MOCK_SIGNALS)
    placeholder_hits = _match_signals(content, PLACEHOLDER_SIGNALS)

    # ── Auth / utility pages ──────────────────────────────────────────────────
    if route in AUTH_PATHS or route.startswith("/("):
        # double-check: only flag as auth if it's NOT inside (shell)
        if "/(shell)/" not in route:
            status = "auth"
            return _record(path, route, status, line_count, char_count,
                           real_hits, mock_hits, placeholder_hits)

    # ── Wrapper: very small files (<20 lines, no real logic) ─────────────────
    if line_count <= 20 and not real_hits and not mock_hits:
        # must have at least one import of a real component to be a wrapper
        if re.search(r"import\s+\{?\s*\w", content) and \
           not re.search(r"useState|useEffect|fetch\(", content):
            status = "wrapper"
            return _record(path, route, status, line_count, char_count,
                           real_hits, mock_hits, placeholder_hits)

    # ── Functional real ───────────────────────────────────────────────────────
    if real_hits:
        status = "functional_real"
        return _record(path, route, status, line_count, char_count,
                       real_hits, mock_hits, placeholder_hits)

    # ── Placeholder ───────────────────────────────────────────────────────────
    if placeholder_hits:
        status = "placeholder"
        return _record(path, route, status, line_count, char_count,
                       real_hits, mock_hits, placeholder_hits)

    # ── Functional mock ───────────────────────────────────────────────────────
    if mock_hits:
        status = "functional_mock"
        return _record(path, route, status, line_count, char_count,
                       real_hits, mock_hits, placeholder_hits)

    # ── Fallback: placeholder (PageHeader + almost nothing else) ─────────────
    has_pageheader = bool(re.search(r"<PageHeader", content))
    has_state      = bool(re.search(r"useState|useEffect|fetch\(|await ", content))
    if has_pageheader and not has_state and line_count < 60:
        status = "placeholder"
    else:
        status = "functional_mock"   # has UI but patterns not matched — assume mock

    return _record(path, route, status, line_count, char_count,
                   real_hits, mock_hits, placeholder_hits)


def _record(path, route, status, line_count, char_count, real_hits, mock_hits, placeholder_hits):
    return {
        "route":     route,
        "file":      str(path.relative_to(REPO_ROOT)).replace("\\", "/"),
        "status":    status,
        "lines":     line_count,
        "chars":     char_count,
        "signals": {
            "real":        real_hits,
            "mock":        mock_hits,
            "placeholder": placeholder_hits,
        },
    }


def route_from_path(path: Path) -> str:
    """Convert a file path to a Next.js route string."""
    rel = path.relative_to(APP_ROOT)
    parts = list(rel.parts)[:-1]   # drop page.tsx
    # strip Next.js group segments like (shell), (auth)
    parts = [p for p in parts if not (p.startswith("(") and p.endswith(")"))]
    if not parts:
        return "/"
    return "/" + "/".join(parts)


def run():
    pages = sorted(APP_ROOT.rglob("page.tsx"))

    results = []
    for page_path in pages:
        content = page_path.read_text(encoding="utf-8", errors="replace")
        route   = route_from_path(page_path)
        results.append(classify(page_path, content, route))

    # ── Summary counts ────────────────────────────────────────────────────────
    statuses = [r["status"] for r in results]
    summary  = {s: statuses.count(s) for s in sorted(set(statuses))}
    total    = len(results)

    # ── Group by status for the report ────────────────────────────────────────
    by_status: dict[str, list] = {}
    for r in results:
        by_status.setdefault(r["status"], []).append(r["route"])

    STATUS_ORDER = ["functional_real", "functional_mock", "placeholder", "wrapper", "auth"]

    report = {
        "summary": {
            "total_pages":      total,
            "functional_real":  summary.get("functional_real", 0),
            "functional_mock":  summary.get("functional_mock", 0),
            "placeholder":      summary.get("placeholder", 0),
            "wrapper":          summary.get("wrapper", 0),
            "auth":             summary.get("auth", 0),
        },
        "by_status": {s: sorted(by_status.get(s, [])) for s in STATUS_ORDER},
        "pages": sorted(results, key=lambda r: (
            STATUS_ORDER.index(r["status"]) if r["status"] in STATUS_ORDER else 99,
            r["route"],
        )),
    }

    print(json.dumps(report, indent=2, ensure_ascii=False))

    # ── Human-readable summary to stderr ─────────────────────────────────────
    print("\n" + "═" * 60, file=sys.stderr)
    print("  KINEXIS PAGE AUDIT RESULTS", file=sys.stderr)
    print("═" * 60, file=sys.stderr)
    print(f"  Total pages scanned : {total}", file=sys.stderr)
    print(f"  ✅ Functional real  : {summary.get('functional_real', 0)}", file=sys.stderr)
    print(f"  🟡 Functional mock  : {summary.get('functional_mock', 0)}", file=sys.stderr)
    print(f"  🔴 Placeholder      : {summary.get('placeholder', 0)}", file=sys.stderr)
    print(f"  ⚪ Wrapper          : {summary.get('wrapper', 0)}", file=sys.stderr)
    print(f"  🔵 Auth/utility     : {summary.get('auth', 0)}", file=sys.stderr)
    print("═" * 60, file=sys.stderr)

    if by_status.get("functional_real"):
        print(f"\n✅ FUNCTIONAL REAL ({len(by_status['functional_real'])}):", file=sys.stderr)
        for r in sorted(by_status["functional_real"]):
            print(f"   {r}", file=sys.stderr)

    if by_status.get("placeholder"):
        print(f"\n🔴 PLACEHOLDERS ({len(by_status['placeholder'])}) — need implementation:", file=sys.stderr)
        for r in sorted(by_status["placeholder"]):
            print(f"   {r}", file=sys.stderr)

    if by_status.get("functional_mock"):
        print(f"\n🟡 FUNCTIONAL MOCK ({len(by_status['functional_mock'])}) — needs real data:", file=sys.stderr)
        for r in sorted(by_status["functional_mock"]):
            print(f"   {r}", file=sys.stderr)


if __name__ == "__main__":
    run()
