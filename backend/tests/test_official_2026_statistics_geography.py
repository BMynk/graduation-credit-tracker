"""UFH FSA 2026 prospectus, printed pp. 112–113.

Independent checks of programme mappings; no student data mutation.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class OfficialProspectus2026Tests(unittest.TestCase):
    def test_computer_science_statistics_40016(self):
        expected = {
            "CSC113","CSC121","MAT111","MAT121","PHY111","PHY112",
            "PHY121","PHY122","STA111","STA121",
            "COC211","COC212","COC223","COC224",
            "DCS211","DCS212","DCS223","DCS224",
            "CSC312","CSC313","CSC323","CSC324",
            "STM312","STM313","STM322","STM323",
        }
        electives = {
            "STM213","STM214","STM223","STM224",
            "MAT212","MAT213","MAT226","MAT225","MAT228",
            "PHY213","PHY214","PHY223","PHY224","MAP212","MAP222",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40016"]["compulsory"]), expected)
        self.assertEqual(set(PROGRAMME_MODULES["40016"]["elective"]), electives)
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40016"]}
        self.assertEqual(set(groups["y2s1-stat"]["options"]), {"STM213","STM214"})
        self.assertEqual(set(groups["y2s2-stat"]["options"]), {"STM223","STM224"})
        self.assertEqual(groups["y2s1-elective"]["min_credits"], 16)
        self.assertEqual(groups["y2s2-elective"]["min_credits"], 16)

    def test_geography_geology_40017(self):
        expected = {
            "GEG111","GEG121","GLG111","GLG121","GIS111","GIS121",
            "PAC110","PAC121","GEG212","GEG221",
            "GLG212","GLG213","GLG222","GLG223",
            "GEG312","GEG313","GEG322","GEG323",
            "GLG312","GLG313","GLG322","GLG323",
        }
        electives = {"GIS212","GIS222","GSS211","GSS221"}
        self.assertEqual(set(PROGRAMME_MODULES["40017"]["compulsory"]), expected)
        self.assertEqual(set(PROGRAMME_MODULES["40017"]["elective"]), electives)
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40017"]}
        self.assertEqual(set(groups["y2s1-elective"]["options"]), {"GIS212","GSS211"})
        self.assertEqual(set(groups["y2s2-elective"]["options"]), {"GIS222","GSS221"})

if __name__ == "__main__":
    unittest.main()
