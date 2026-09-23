from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ADMIN_ROUTER = ROOT / "backend" / "app" / "routers" / "admin.py"
ADMIN_MANAGEMENT = ROOT / "backend" / "app" / "routers" / "admin_management.py"

def main():
    admin_source = ADMIN_ROUTER.read_text(encoding="utf-8")
    management_source = ADMIN_MANAGEMENT.read_text(encoding="utf-8")

    for route in (
        '@router.post("/simulation/seed"',
        '@router.post("/simulation/academic-records"',
        '@router.post("/simulation/community-activity"',
    ):
        assert route not in admin_source, route

    assert '@router.post("/change-password")' in management_source
    assert '@router.post("/reset-password")' not in management_source
    assert "verify_password(" in management_source
    assert "payload.current_password" in management_source
    print("Production security cleanup tests passed.")

if __name__ == "__main__":
    main()
