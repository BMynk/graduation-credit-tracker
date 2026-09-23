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
from fastapi.testclient import TestClient
from app.main import app

paths = {route.path for route in app.routes}
for path in (
    "/admin/simulation/seed",
    "/admin/simulation/academic-records",
    "/admin/simulation/community-activity",
):
    assert path not in paths, path

assert "/admin-management/change-password" in paths
assert "/admin-management/reset-password" not in paths
print("Production security cleanup tests passed.")
"""
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)

if __name__ == "__main__":
    main()
