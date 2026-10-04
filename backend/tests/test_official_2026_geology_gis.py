"""Independent 2026 UFH FSA prospectus tests for Geology & GIS (40022).

Printed pp. 115–116. The printed MAT113 / bundled MAT123 discrepancy
is tracked separately in issue #119 and not certified by this test.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class GeologyGIS2026Tests(unittest.TestCase):
    def test_compulsory_modules(self):
        expected = {
            "GLG111","GLG121","PAC110","PAC121","GIS111","GIS121",
            "GLG212","GLG213","GLG222","GLG223",
            "GIS212","GIS222","GSS211","GSS221",
            "GLG312","GLG313","GLG322","GLG323",
            "GIS314","GIS315","GIS324","GIS325",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40022"]["compulsory"]), expected)

    def test_first_year_elective_credits_and_unambiguous_options(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40022"]}
        self.assertEqual(groups["y1s1-elective"]["min_credits"], 16)
        self.assertEqual(groups["y1s2-elective"]["min_credits"], 16)
        self.assertEqual(set(groups["y1s1-elective"]["options"]),
                         {"PHY113","PHY114","GEG111","STA111","MAT112","BOT111","ZOO111"})
        self.assertEqual(set(groups["y1s2-elective"]["options"]) - {"MAT123"},
                         {"PHY123","PHY124","GEG121","STA121","BOT121","ZOO121"})

if __name__ == "__main__":
    unittest.main()
