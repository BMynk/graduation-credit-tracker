import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


def run(command, cwd):
    print(f"\n$ {' '.join(command)}")
    subprocess.run(command, cwd=cwd, check=True)


def main():
    run([sys.executable, "-m", "compileall", "-q", "app"], BACKEND)

    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite:///./community_ci.db"
    env.setdefault("SECRET_KEY", "community-ci-secret-key")

    code = """
from app.database import Base, engine
from app.main import app
from app import models

Base.metadata.create_all(bind=engine)
required = {
    "communities",
    "community_channels",
    "community_messages",
    "community_reactions",
}
missing = required.difference(Base.metadata.tables)
assert not missing, f"Missing community tables: {sorted(missing)}"

paths = {route.path for route in app.routes if hasattr(route, "path")}
required_paths = {
    "/community/me",
    "/community/channels/{channel_id}/messages",
    "/community/messages/{message_id}",
    "/community/messages/{message_id}/reactions",
}
missing_paths = required_paths.difference(paths)
assert not missing_paths, f"Missing community routes: {sorted(missing_paths)}"
print("Backend community smoke test passed.")
"""
    print("\n$ backend community smoke test")
    subprocess.run([sys.executable, "-c", code], cwd=BACKEND, env=env, check=True)

    if (FRONTEND / "package-lock.json").exists():
        run(["npm", "ci"], FRONTEND)
    else:
        run(["npm", "install"], FRONTEND)
    run(["npm", "run", "build"], FRONTEND)


if __name__ == "__main__":
    main()
