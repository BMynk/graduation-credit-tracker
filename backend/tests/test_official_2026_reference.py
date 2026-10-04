"""Independent checks transcribed from UFH FSA 2026 prospectus, pp. 110–111.

Run: python -m unittest discover -s tests -p test_official_2026_reference.py
This checks bundled mappings; it does not alter production data.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS, MODULES

class OfficialProspectusReferenceTests(unittest.TestCase):
    def test_40014_compulsory_modules_match_official_table(self):
        # Computer Science and Applied Mathematics (40014), p. 111.
        expected = {
            "CSC113", "CSC121", "MAT111", "MAT121",
            "PHY113", "PHY114", "PHY123", "PHY124",
            "COC211", "COC212", "COC223", "COC224",
            "MAP212", "MAP222", "DCS211", "DCS212", "DCS223", "DCS224",
            "CSC312", "CSC313", "CSC323", "CSC324",
            "MAP311", "MAP312", "MAP321", "MAP322",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40014"]["compulsory"]), expected)

    def test_40014_elective_options_match_official_table(self):
        expected = {
            "STA111", "MNU111", "STA121", "MNU121", "MNU122",
            "MAT212", "MAT213", "STM213", "STM214",
            "MAT226", "MAT227", "STM223", "STM224",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40014"]["elective"]), expected)

    def test_40014_each_term_has_required_elective_choice(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40014"]}
        expected = {
            "y1s1-stream": ({"STA111", "MNU111"}, 16),
            "y1s2-stream": ({"STA121", "MNU121", "MNU122"}, 16),
            "y2s1-elective": ({"MAT212", "MAT213", "STM213", "STM214"}, 16),
            "y2s2-elective": ({"MAT226", "MAT227", "STM223", "STM224"}, 16),
        }
        for key, (options, credits) in expected.items():
            with self.subTest(key=key):
                self.assertEqual(set(groups[key]["options"]), options)
                self.assertEqual(groups[key]["min_credits"], credits)

    def test_40014_compulsory_term_credits(self):
        # Official table has 48 compulsory credits in years 1 and 2,
        # then 64 compulsory credits in each term of year 3.
        from seed import curriculum_position
        from types import SimpleNamespace
        catalog = {code: (credits, level) for code, _, credits, _, level in MODULES}
        term_totals = {}
        for code in PROGRAMME_MODULES["40014"]["compulsory"]:
            credits, level = catalog[code]
            year, semester = curriculum_position(SimpleNamespace(code=code, level=level))
            term_totals[(year, semester)] = term_totals.get((year, semester), 0) + credits
        self.assertEqual(term_totals, {
            (1, 1): 48, (1, 2): 48,
            (2, 1): 48, (2, 2): 48,
            (3, 1): 64, (3, 2): 64,
        })

if __name__ == "__main__":
    unittest.main()
