"""UFH FSA 2026 prospectus, printed p. 110: chemistry curriculum checks."""
import unittest
from seed import PROGRAMME_MODULES

class ChemistryProspectus2026Tests(unittest.TestCase):
    def test_40012_chemistry_single_major(self):
        # All three years are fully prescribed in the official table.
        expected = {
            "PAC110","PAC121","MAT112","MAT123","PHY113","PHY114",
            "PHY123","PHY124","MNU111","MNU121","MNU122",
            "PAC211","PAC215","PAC222","PAC224",
            "PAC216","PAC225","PAC218","PAC227",
            "PAC312","PAC321","PAC311","PAC323",
            "PAC315","PAC326","PAC317","PAC328",
        }
        self.assertEqual(set(PROGRAMME_MODULES["40012"]["compulsory"]), expected)
        self.assertEqual(PROGRAMME_MODULES["40012"]["elective"], [])

    def test_40013_chemistry_geology_first_two_years(self):
        # Prospectus p. 110. Third-year module table follows on p. 111.
        expected_first_two = {
            "PAC110","PAC121","GLG111","GLG121","MAT112","MAT123",
            "PHY111","PHY112","PHY121","PHY122",
            "PAC211","PAC215","PAC222","PAC224",
            "GLG212","GLG213","GLG222","GLG223",
        }
        compulsory = set(PROGRAMME_MODULES["40013"]["compulsory"])
        self.assertTrue(expected_first_two.issubset(compulsory))
        self.assertEqual(
            {code for code in compulsory if code[3] in ("1","2")},
            expected_first_two,
        )
        self.assertEqual(PROGRAMME_MODULES["40013"]["elective"], [])

if __name__ == "__main__":
    unittest.main()
