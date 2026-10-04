"""UFH FSA 2026 prospectus, printed pp. 113–114: Geography & GIS (40018).

MAT113 (prospectus) vs MAT123 (bundled seed) remains unresolved, tracked
in GitHub issue #119; do not certify that first-year option here.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class GeographyGIS2026Tests(unittest.TestCase):
    def test_compulsory_modules(self):
        expected = {
            "GEG111","GEG121","GIS111","GIS121","CSC113","CSC121",
            "GEG212","GEG221","GIS212","GIS222","GSS211","GSS221",
            "GEG312","GEG313","GEG322","GEG323",
            "GIS314","GIS315","GIS324","GIS325",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40018"]["compulsory"]), expected)

    def test_second_year_elective_choices(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40018"]}
        self.assertEqual(set(groups["y2s1-elective"]["options"]),
                         {"COC211","COC212","BOT212","BOT213","ZOO213"})
        self.assertEqual(set(groups["y2s2-elective"]["options"]),
                         {"COC223","COC224","BOT222","BOT223","ZOO225"})
        for key in ("y2s1-elective","y2s2-elective"):
            self.assertEqual(groups[key]["min_credits"], 16)

    def test_first_year_elective_credit_requirement(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40018"]}
        self.assertEqual(groups["y1s1-elective"]["min_credits"], 16)
        self.assertEqual(groups["y1s2-elective"]["min_credits"], 16)

if __name__ == "__main__":
    unittest.main()
