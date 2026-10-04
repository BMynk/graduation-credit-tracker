"""Independent UFH FSA 2026 prospectus p. 121, programme 40032."""
import unittest
from seed import PROGRAMME_MODULES

class EntomologyMicrobiology2026Tests(unittest.TestCase):
    def test_40032_compulsory_and_no_electives(self):
        expected = {
            "BOT111","BOT121","ZOO111","ZOO121","PAC110","PAC121",
            "STA111","STA121","MIC213","MIC223","ZOO213","ZOO225",
            "BCH215","BCH224","BOT212","BOT213","BOT222","BOT223",
            "MIC311","MIC312","MIC321","MIC322",
            "ZOO314","ZOO316","ZOO324","ZOO326",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40032"]["compulsory"]), expected)
        self.assertEqual(PROGRAMME_MODULES["40032"]["elective"], [])

if __name__ == "__main__":
    unittest.main()
