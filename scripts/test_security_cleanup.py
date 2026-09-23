import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

def main():
    env = os.environ.copy()
    env.setdefault("SECRET_KEY", "security-cleanup-ci-secret")
    code = r"""
from app.main import app

def collect_paths(routes, prefix=""):
    found = set()
    for route in routes:
        route_path = getattr(route, "path", None)
        if route_path is not None:
            found.add(prefix + route_path)
        nested = getattr(route, "routes", None)
        if nested:
            found.update(collect_paths(nested, prefix + (route_path or "")))
    return found

paths = collect_paths(app.routes)
for path in (
    "/admin/simulation/seed",
    "/admin/simulation/academic-records",
    "/admin/simulation/community-activity",
):
    assert path not in paths, path

assert any(path.endswith("/change-password") for path in paths), sorted(paths)
assert not any(path.endswith("/reset-password") and "{admin_id}" not in path for path in paths), sorted(paths)
print("Production security cleanup tests passed.")
"""
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)

if __name__ == "__main__":
    main()
