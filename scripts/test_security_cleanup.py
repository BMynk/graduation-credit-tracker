import ast
from pathlib import Path

from pydantic import ValidationError

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"

def route_paths(source_path):
    tree = ast.parse(source_path.read_text(encoding="utf-8"))
    paths = set()
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for decorator in node.decorator_list:
            if not isinstance(decorator, ast.Call):
                continue
            func = decorator.func
            if not isinstance(func, ast.Attribute):
                continue
            if not isinstance(func.value, ast.Name) or func.value.id != "router":
                continue
            if decorator.args and isinstance(decorator.args[0], ast.Constant):
                value = decorator.args[0].value
                if isinstance(value, str):
                    paths.add(value)
    return paths

def main():
    # Every admin password creation/reset path must enforce the same minimum.
    from app.schemas import AdminCreate, AdminPasswordReset

    for factory, payload in (
        (AdminCreate, {"name": "Test Admin", "username": "testadmin", "password": "short123", "is_super_admin": False}),
        (AdminPasswordReset, {"new_password": "short123"}),
    ):
        try:
            factory(**payload)
        except ValidationError:
            pass
        else:
            raise AssertionError("Admin passwords shorter than 12 characters must be rejected")

    admin_paths = route_paths(BACKEND / "app" / "routers" / "admin.py")
    management_paths = route_paths(BACKEND / "app" / "routers" / "admin_management.py")

    for path in (
        "/simulation/seed",
        "/simulation/academic-records",
        "/simulation/community-activity",
    ):
        assert path not in admin_paths, path

    assert "/change-password" in management_paths
    assert "/reset-password" not in management_paths
    assert "/{admin_id}/reset-password" in management_paths
    print("Production security cleanup tests passed.")

if __name__ == "__main__":
    main()
