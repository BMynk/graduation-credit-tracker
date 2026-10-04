"""2026 UFH FSA prospectus printed pp. 118-119: Mathematics and Chemistry (40026).

Catalogue and choice verification only. Prospectus prints 80/48 third-year
semester totals and an inconsistent MAP212/222 credit display; do not infer
a correction to either from these tests.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS


class MathematicsChemistry2026Tests(unittest.TestCase):
    def test_compulsory_modules(self):
        expected = {
            "MAT111", "MAT121", "PHY113", "PHY114", "PHY123", "PHY124",
            "PAC110", "PAC121", "MNU111", "MNU121", "MNU122",
            "MAT212", "MAT213", "MAT226",
            "PAC211", "PAC215", "PAC222", "PAC224",
            "MAT312", "MAT323", "PAC311", "PAC312", "PAC321", "PAC323",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40026"]["compulsory"]), expected)

    def test_elective_catalogue(self):
        self.assertEqual(set(PROGRAMME_MODULES["40026"]["elective"]), {
            "MAT227", "MAT228", "MAP212", "MAP222",
            "PHY213", "PHY214", "PHY223", "PHY224",
            "MAT313", "MAT314", "MAT324", "MAT325",
        })

    def test_mathematics_and_second_year_elective_choices(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40026"]}
        expected = {
            "y2s2-math-choice": (2, 2, 8, {"MAT227", "MAT228"}),
            "y2s1-elective": (2, 1, 16, {"MAP212", "PHY213", "PHY214"}),
            "y2s2-elective": (2, 2, 16, {"MAP222", "PHY223", "PHY224"}),
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
