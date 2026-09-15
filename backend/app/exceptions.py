# app/exceptions.py
from typing import List


class PrerequisiteNotMetError(Exception):
    """Raised when a student tries to complete/enrol in a module without
    having passed its prerequisites yet."""

    def __init__(self, module_code: str, missing: List[str]):
        self.module_code = module_code
        self.missing = missing
        super().__init__(f"Missing prerequisites for {module_code}: {', '.join(missing)}")


class DuplicateModuleCompletionError(Exception):
    """Raised when trying to record a module the student has already passed."""

    def __init__(self, module_code: str):
        self.module_code = module_code
        super().__init__(f"{module_code} has already been completed")