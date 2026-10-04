"""Independent UFH FSA 2026 prospectus checks, printed pp. 108–109.

These verify the bundled reference for the listed programmes only.
They never rewrite student enrolments or academic marks.
"""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class BotanyProspectus2026Tests(unittest.TestCase):
    def test_40008_botany_entomology_compulsory(self):
        # Prospectus p. 108: fully prescribed, no electives.
        expected = {
            "BOT111", "BOT121", "ZOO111", "ZOO121", "PAC110", "PAC121",
            "STA111", "STA121", "BOT212", "BOT213", "BOT222", "BOT223",
            "ZOO213", "ZOO225", "BCH215", "BCH224", "MIC213", "MIC223",
            "BOT312", "BOT313", "BOT322", "BOT323",
            "ZOO314", "ZOO316", "ZOO324", "ZOO326",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40008"]["compulsory"]), expected)
        self.assertEqual(PROGRAMME_MODULES["40008"]["elective"], [])

    def test_40009_botany_microbiology_compulsory(self):
        # Prospectus pp. 108–109.
        expected = {
            "BOT111", "BOT121", "ZOO111", "ZOO121", "PAC110", "PAC121",
            "STA111", "STA121", "BOT212", "BOT213", "BOT222", "BOT223",
            "MIC213", "MIC223", "BCH215", "BCH224", "ZOO213", "ZOO225",
            "BOT312", "BOT313", "BOT322", "BOT323",
            "MIC311", "MIC312", "MIC321", "MIC322",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40009"]["compulsory"]), expected)
        self.assertEqual(PROGRAMME_MODULES["40009"]["elective"], [])

    def test_40011_chemistry_botany_compulsory_and_choices(self):
        # Prospectus p. 109: choose 16 credits from listed alternatives
        # in each second-year semester; options are not all compulsory.
        compulsory = {
            "BOT111", "BOT121", "PAC110", "PAC121", "MAT112", "MAT123",
            "ZOO111", "ZOO121", "BOT212", "BOT213", "BOT222", "BOT223",
            "PAC211", "PAC215", "PAC222", "PAC224",
            "BOT312", "BOT313", "BOT322", "BOT324",
            "PAC311", "PAC312", "PAC321", "PAC323",
        }
        electives = {"BCH215", "MIC213", "ZOO213",
                     "BCH224", "MIC223", "ZOO224", "ZOO225"}
        self.assertEqual(set(PROGRAMME_MODULES["40011"]["compulsory"]), compulsory)
        self.assertEqual(set(PROGRAMME_MODULES["40011"]["elective"]), electives)
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40011"]}
        self.assertEqual(set(groups["y2s1-elective"]["options"]),
                         {"BCH215", "MIC213", "ZOO213"})
        self.assertEqual(set(groups["y2s2-elective"]["options"]),
                         {"BCH224", "MIC223", "ZOO224", "ZOO225"})
        self.assertEqual(groups["y2s1-elective"]["min_credits"], 16)
        self.assertEqual(groups["y2s2-elective"]["min_credits"], 16)

if __name__ == "__main__":
    unittest.main()
