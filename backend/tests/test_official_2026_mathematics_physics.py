"""2026 UFH FSA prospectus printed pp. 116-117: Mathematics and Physics (40024).

Verifies module catalogue and credit/choice requirements. No database writes.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS


class MathematicsPhysics2026Tests(unittest.TestCase):
    def test_compulsory_catalogue(self):
        expected = {
            "MAT111", "MAT121", "PHY111", "PHY112", "PHY121", "PHY122",
            "CSC113", "CSC121", "STA111", "STA121",
            "MAT212", "MAT213", "MAT226", "MAT227", "MAT228",
            "PHY213", "PHY214", "PHY223", "PHY224",
            "DCS211", "DCS212", "DCS221", "DCS222",
            "MAT312", "MAT313", "MAT314", "MAT323", "MAT324", "MAT325",
            "PHY311", "PHY312", "PHY321", "PHY322",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40024"]["compulsory"]), expected)

    def test_second_year_elective_catalogue(self):
        self.assertEqual(set(PROGRAMME_MODULES["40024"]["elective"]), {
            "COC211", "COC212", "MAP212", "STM213", "STM214",
            "COC223", "COC224", "MAP222", "STM223", "STM224",
        })

    def test_choice_requirements(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40024"]}
        expected = {
            "y2s1-elective": (2, 1, 16, {"COC211", "COC212", "MAP212", "STM213", "STM214"}),
            "y2s2-elective": (2, 2, 16, {"COC223", "COC224", "MAP222", "STM223", "STM224"}),
            "y2s2-math-choice": (2, 2, 8, {"MAT227", "MAT228"}),
            "y3s1-math-choice": (3, 1, 16, {"MAT313", "MAT314"}),
            "y3s2-math-choice": (3, 2, 16, {"MAT324", "MAT325"}),
        }
        self.assertEqual(set(groups), set(expected))
        for key, (year, semester, credits, options) in expected.items():
            with self.subTest(group=key):
                group = groups[key]
                self.assertEqual((group["year"], group["semester"]), (year, semester))
                self.assertEqual(group["min_credits"], credits)
                self.assertEqual(group["min_modules"], 1)
                self.assertEqual(set(group["options"]), options)


if __name__ == "__main__":
    unittest.main()
