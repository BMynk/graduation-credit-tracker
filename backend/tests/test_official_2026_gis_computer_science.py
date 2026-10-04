"""UFH FSA 2026 prospectus, printed pp. 114–115, programme 40020.

The printed first-year MAT113 vs bundled MAT123 needs explicit alias review;
this test deliberately does not certify that unresolved option.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class GISComputerScience2026Tests(unittest.TestCase):
    def test_40020_compulsory(self):
        expected = {
            "GIS111","GIS121","CSC113","CSC121",
            "COC211","COC212","COC223","COC224",
            "GIS212","GIS222","GSS211","GSS221",
            "GIS314","GIS315","GIS324","GIS325",
            "CSC312","CSC313","CSC323","CSC324",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40020"]["compulsory"]), expected)

    def test_40020_second_year_elective_choices(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40020"]}
        self.assertEqual(set(groups["y2s1-elective"]["options"]),
                         {"GEG212","BOT212","BOT213","ZOO213"})
        self.assertEqual(set(groups["y2s2-elective"]["options"]),
                         {"GEG221","BOT222","BOT223","ZOO225"})
        for key in ("y2s1-elective", "y2s2-elective"):
            self.assertEqual(groups[key]["min_credits"], 16)

    def test_40020_first_year_elective_credit_requirements(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40020"]}
        self.assertEqual(groups["y1s1-elective"]["min_credits"], 32)
        self.assertEqual(groups["y1s2-elective"]["min_credits"], 32)

if __name__ == "__main__":
    unittest.main()
