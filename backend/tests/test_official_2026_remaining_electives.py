"""Prospectus-based elective group regression checks for remaining 2026 programmes.

UFH FSA 2026 prospectus printed pp. 119-128. Static checks only.
"""
import unittest
from seed import REQUIREMENT_GROUPS, MODULES

# Each group: semester, required credits, exact eligible module catalogue.
EXPECTED = {
    "40028": {
        "y2s1-stat-choice": (1, 16, "STM213 STM214"),
        "y2s2-stat-choice": (2, 16, "STM223 STM224"),
        "y2s2-math-choice": (2, 8, "MAT227 MAT228"),
        "y2s1-elective": (1, 16, "COC211 COC212 PHY213 PHY214 MAP212"),
        "y2s2-elective": (2, 16, "COC223 COC224 PHY223 PHY224 MAP222"),
    },
    "40033": {
        "y1s1-elective": (1, 16, "PHY111 PHY112 STA111 MAT111 BOT111 CSC113"),
        "y1s2-elective": (2, 16, "PHY121 PHY122 STA121 MAT121 BOT121 CSC121"),
        "y2s1-elective": (1, 16, "COC211 COC212 MAT212 MAT213 PHY213 PHY214 GEG212 BOT212 BOT213 STM213 STM214"),
        "y2s2-elective": (2, 16, "COC223 COC224 MAT226 MAT227 PHY223 PHY224 GEG221 BOT222 BOT223 STM223 STM224"),
    },
    "40034": {
        "y1s1-elective": (1, 16, "PHY111 PHY112 STA111 MAT111 BOT111 CSC113"),
        "y1s2-elective": (2, 16, "PHY121 PHY122 STA121 MAT121 BOT121 CSC121"),
        "y2s1-elective": (1, 16, "COC211 COC212 MAT212 MAT213 PHY213 PHY214 GEG212 BOT212 BOT213 STM213 STM214"),
        "y2s2-elective": (2, 16, "COC223 COC224 MAT226 MAT227 PHY223 PHY224 GEG221 BOT222 BOT223 STM223 STM224"),
    },
    "40039": {
        "y2s1-electives": (1, 32, "PAC211 PAC215 BOT212 BOT213 ZOO213"),
        "y2s2-electives": (2, 32, "PAC222 PAC224 BOT222 BOT223 ZOO224 ZOO225"),
    },
    "40040": {
        "y2s1-elective": (1, 16, "BOT212 BOT213 MIC213 ZOO213"),
        "y2s2-elective": (2, 16, "BOT222 BOT223 MIC223 ZOO224 ZOO225"),
    },
    "40041": {
        "y1s1-elective": (1, 16, "BOT111 ZOO111"),
        "y1s2-elective": (2, 16, "BOT121 ZOO121"),
        "y2s2-math-choice": (2, 8, "MAT227 MAT228"),
        "y2s1-elective": (1, 16, "BOT212 BOT213 ZOO213"),
        "y2s2-elective": (2, 16, "BOT222 BOT223 ZOO224 ZOO225"),
    },
}


class RemainingElectiveGroups2026Tests(unittest.TestCase):
    def test_prospectus_group_catalogues_and_credit_requirements(self):
        for code, expected_groups in EXPECTED.items():
            actual = {g["key"]: g for g in REQUIREMENT_GROUPS[code]}
            for key, (semester, credits, options) in expected_groups.items():
                with self.subTest(programme=code, group=key):
                    self.assertIn(key, actual)
                    group = actual[key]
                    self.assertEqual(group["semester"], semester)
                    self.assertEqual(group["min_credits"], credits)
                    self.assertEqual(set(group["options"]), set(options.split()))

    def test_each_group_can_reach_its_minimum_with_catalogue_credits(self):
        credits = {code: value for code, _, value, _, _ in MODULES}
        for code, expected_groups in EXPECTED.items():
            actual = {g["key"]: g for g in REQUIREMENT_GROUPS[code]}
            for key in expected_groups:
                with self.subTest(programme=code, group=key):
                    group = actual[key]
                    self.assertGreaterEqual(
                        sum(credits[code] for code in set(group["options"])),
                        group["min_credits"],
                    )


if __name__ == "__main__":
    unittest.main()
