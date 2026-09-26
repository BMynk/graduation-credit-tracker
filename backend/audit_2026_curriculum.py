"""Static consistency checks for the 2026 UFH BSc curriculum dataset.

Run from backend:
    python audit_2026_curriculum.py

This imports seed.py but does not call seed(), so it does not touch the database.
"""

from collections import Counter
from seed import PROGRAMMES, MODULES, PREREQUISITES, PROGRAMME_MODULES, REQUIREMENT_GROUPS, ALIAS_CODES

EXPECTED_TOTAL_CREDITS = 384


def main():
    errors = []
    warnings = []

    programme_codes = [p["code"] for p in PROGRAMMES]
    module_codes = [m[0] for m in MODULES]
    module_by_code = {m[0]: m for m in MODULES}

    for code, count in Counter(programme_codes).items():
        if count > 1:
            errors.append(f"Duplicate programme code: {code}")
    for code, count in Counter(module_codes).items():
        if count > 1:
            errors.append(f"Duplicate module code: {code}")

    known = set(module_codes)
    for code, prereqs in PREREQUISITES.items():
        if code not in known:
            errors.append(f"Prerequisite owner is missing: {code}")
        for raw in prereqs:
            resolved = ALIAS_CODES.get(raw, raw)
            if resolved not in known:
                errors.append(f"Missing prerequisite module: {code} -> {raw}")

    for programme in PROGRAMMES:
        code = programme["code"]
        if code not in PROGRAMME_MODULES:
            errors.append(f"Programme has no curriculum mapping: {code}")

    for code in PROGRAMME_MODULES:
        if code not in programme_codes:
            errors.append(f"Curriculum references unknown programme: {code}")

    for programme_code, groups in PROGRAMME_MODULES.items():
        seen = set()
        for kind in ("compulsory", "elective"):
            for raw in groups.get(kind, []):
                resolved = ALIAS_CODES.get(raw, raw)
                if resolved not in known:
                    errors.append(f"{programme_code}: missing {kind} module {raw}")
                if resolved in seen:
                    errors.append(f"{programme_code}: duplicate curriculum module {resolved}")
                seen.add(resolved)

    for programme_code, groups in REQUIREMENT_GROUPS.items():
        curriculum = PROGRAMME_MODULES.get(programme_code, {})
        linked = {
            ALIAS_CODES.get(raw, raw)
            for kind in ("compulsory", "elective")
            for raw in curriculum.get(kind, [])
        }
        keys = set()
        for group in groups:
            if group["key"] in keys:
                errors.append(f"{programme_code}: duplicate requirement key {group['key']}")
            keys.add(group["key"])
            if group["min_modules"] < 1 or group["min_credits"] < 1:
                errors.append(f"{programme_code}/{group['key']}: invalid minimum")
            option_credits = 0
            for raw in group["options"]:
                resolved = ALIAS_CODES.get(raw, raw)
                if resolved not in known:
                    errors.append(f"{programme_code}/{group['key']}: missing option {raw}")
                    continue
                if resolved not in linked:
                    errors.append(f"{programme_code}/{group['key']}: option {raw} not linked to programme")
                option_credits += module_by_code[resolved][2]
            if option_credits < group["min_credits"]:
                errors.append(f"{programme_code}/{group['key']}: options cannot meet credit minimum")

    # A completion path must at least be capable of reaching the programme's
    # published 384-credit requirement. Exact elective combinations are checked
    # through requirement groups rather than summing every optional module.
    for programme_code, curriculum in PROGRAMME_MODULES.items():
        choice_codes = {
            ALIAS_CODES.get(raw, raw)
            for group in REQUIREMENT_GROUPS.get(programme_code, [])
            for raw in group["options"]
        }
        compulsory_credits = sum(
            module_by_code[ALIAS_CODES.get(raw, raw)][2]
            for raw in curriculum.get("compulsory", [])
            if ALIAS_CODES.get(raw, raw) in known
            and ALIAS_CODES.get(raw, raw) not in choice_codes
        )
        required_choice_credits = sum(
            group["min_credits"]
            for group in REQUIREMENT_GROUPS.get(programme_code, [])
        )
        minimum_path = compulsory_credits + required_choice_credits
        if minimum_path < EXPECTED_TOTAL_CREDITS:
            warnings.append(
                f"{programme_code}: modeled minimum path is {minimum_path} credits; "
                f"verify remaining {EXPECTED_TOTAL_CREDITS - minimum_path} credits against prospectus."
            )

    print(f"Programmes: {len(PROGRAMMES)}")
    print(f"Modules: {len(MODULES)}")
    print(f"Errors: {len(errors)}")
    for item in errors:
        print(f"ERROR: {item}")
    print(f"Warnings: {len(warnings)}")
    for item in warnings:
        print(f"WARNING: {item}")

    if errors:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
