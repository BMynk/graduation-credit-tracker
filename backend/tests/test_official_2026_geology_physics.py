"""UFH FSA 2026 prospectus printed p. 116: Geology and Physics (40023).

Both MAT227 and MAT228 are catalogued as alternatives, not two
simultaneous degree requirements. Test the explicit choice group.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class GeologyPhysics2026Tests(unittest.TestCase):
    def test_compulsory_catalogue(self):
        expected = {
            "GLG111","GLG121","PHY111","PHY112","PHY121","PHY122",
            "PAC110","PAC121","MAT111","MAT121",
            "GLG212","GLG222","PHY213","PHY214","PHY223","PHY224",
            "GIS212","GIS222","MAT212","MAT213","MAT226",
            "MAT227","MAT228",
            "GLG312","GLG313","GLG322","GLG323",
            "PHY311","PHY312","PHY322","PHY323",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40023"]["compulsory"]), expected)
        self.assertEqual(PROGRAMME_MODULES["40023"]["elective"], [])

    def test_second_year_mathematics_alternative(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40023"]}
        choice = groups["y2s2-math-choice"]
        self.assertEqual(set(choice["options"]), {"MAT227","MAT228"})
        self.assertEqual(choice["min_credits"], 8)
        self.assertEqual(choice["min_modules"], 1)
        self.assertEqual((choice["year"], choice["semester"]), (2, 2))

if __name__ == "__main__":
    unittest.main()
