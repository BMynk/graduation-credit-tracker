"""UFH FSA 2026 prospectus printed pp. 111-112: Computer Science and Physics (40015)."""
import unittest
from seed import PROGRAMME_MODULES, REQUIREMENT_GROUPS

class ComputerSciencePhysics2026Tests(unittest.TestCase):
    def test_compulsory_catalogue(self):
        expected = set("""CSC113 MAT111 PHY111 PHY112 STA111
            CSC121 MAT121 PHY121 PHY122 STA121
            COC211 COC212 PHY213 PHY214 MAT212 MAT213 DCS211 DCS212
            COC223 COC224 PHY223 PHY224 MAT226 MAT227 MAT228 DCS222 DCS224
            COC312 COC313 PHY311 PHY312 COC323 COC324 PHY321 PHY322""".split())
        self.assertEqual(set(PROGRAMME_MODULES["40015"]["compulsory"]), expected)
        self.assertEqual(PROGRAMME_MODULES["40015"]["elective"], [])

    def test_mathematics_alternative(self):
        groups = {g["key"]: g for g in REQUIREMENT_GROUPS["40015"]}
        choice = groups["y2s2-math-choice"]
        self.assertEqual(set(choice["options"]), {"MAT227", "MAT228"})
        self.assertEqual((choice["year"], choice["semester"]), (2, 2))
        self.assertEqual((choice["min_modules"], choice["min_credits"]), (1, 8))

if __name__ == "__main__":
    unittest.main()
