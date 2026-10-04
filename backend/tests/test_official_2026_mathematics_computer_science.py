"""UFH FSA 2026 prospectus printed pp. 117-118: Mathematics and Computer Science (40025).

Independent catalogue/choice regression checks; no database writes.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS


class MathematicsComputerScience2026Tests(unittest.TestCase):
    def test_first_to_third_year_module_catalogue(self):
        curriculum = PROGRAMME_MODULES["40025"]
        expected_compulsory = {
            "CSC113", "CSC121", "MAT111", "MAT121",
            "PHY111", "PHY112", "PHY121", "PHY122",
            "COC211", "COC212", "COC223", "COC224",
            "MAT212", "MAT213", "MAT225", "MAT227", "MAT228",
            "DCS211", "DCS212", "DCS223", "DCS224",
            "CSC312", "CSC313", "CSC323", "CSC324",
            "MAT312", "MAT323",
        }
        expected_elective = {
            "STA111", "STA121", "MNU111", "MNU121", "MNU122",
            "MAP212", "MAP222", "PHY213", "PHY214", "PHY223", "PHY224",
            "STM213", "STM214", "STM223", "STM224",
            "MAT313", "MAT314", "MAT324", "MAT325",
        }
        self.assertEqual(set(curriculum["compulsory"]) | set(curriculum["elective"]),
                         expected_compulsory | expected_elective)

    def test_elective_and_math_choices(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40025"]}
        expected = {
            "y1s1-stream": (1, 1, 16, {"STA111", "MNU111"}),
            "y1s2-stream": (1, 2, 16, {"STA121", "MNU121", "MNU122"}),
            "y2s1-elective": (2, 1, 16, {"MAP212", "PHY213", "PHY214", "STM213", "STM214"}),
            "y2s2-elective": (2, 2, 16, {"MAP222", "PHY223", "PHY224", "STM223", "STM224"}),
            "y2s2-math-choice": (2, 2, 8, {"MAT227", "MAT228"}),
            "y3s1-math-choice": (3, 1, 16, {"MAT313", "MAT314"}),
            "y3s2-math-choice": (3, 2, 16, {"MAT324", "MAT325"}),
        }
        self.assertEqual(set(groups), set(expected))
        for key, (year, semester, credits, options) in expected.items():
            with self.subTest(group=key):
                group = groups[key]
                self.assertEqual((group["year"], group["semester"]), (year, semester))
                self.assertEqual(group["min_modules"], 1)
                self.assertEqual(group["min_credits"], credits)
                self.assertEqual(set(group["options"]), options)


if __name__ == "__main__":
    unittest.main()
