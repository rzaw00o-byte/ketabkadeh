"""ساخت اسکلت پوشه‌ها طبق ساختار سند استاد (بخش ۷).
اجرا از ریشه مخزن:  py -3.12 make_structure.py
پوشه frontend عمداً ساخته نمی‌شود چون create-next-app باید خودش آن را بسازد.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent

DIRS = [
    "backend/config/settings",
    "backend/apps/accounts", "backend/apps/catalog", "backend/apps/reviews",
    "backend/apps/cart", "backend/apps/orders", "backend/apps/payments",
    "backend/apps/seo",
    "backend/tests",
    "nginx",
    ".github/workflows",
    "docs",
]

for d in DIRS:
    p = ROOT / d
    p.mkdir(parents=True, exist_ok=True)
    keep = p / ".gitkeep"
    if not any(p.iterdir()):
        keep.touch()

for name in ("base", "development", "staging", "production"):
    (ROOT / f"backend/config/settings/{name}.py").touch()

gitignore = ROOT / ".gitignore"
if not gitignore.exists():
    gitignore.write_text(
        ".env\n*.env\n!example.env\n__pycache__/\n*.pyc\n.venv/\nvenv/\n"
        "node_modules/\n.next/\n.DS_Store\n.idea/\n.vscode/\n",
        encoding="utf-8",
    )

print("Done. حالا: git add . && git commit -m \"chore: add project skeleton\"")
