"""Populate the database with real programmes, modules, prerequisites, and electives
from the 2026 Faculty of Science & Agriculture prospectus.

Usage:
    python seed.py
"""

from app import models
from app.database import Base, SessionLocal, engine
from app.security import hash_password

# ---------- PROGRAMMES ----------
PROGRAMMES = [
    {"code": "40008", "name": "BSc Botany and Entomology", "faculty": "Science & Agriculture"},
    {"code": "40009", "name": "BSc Botany and Microbiology", "faculty": "Science & Agriculture"},
    {"code": "40011", "name": "BSc Chemistry and Botany", "faculty": "Science & Agriculture"},
    {"code": "40013", "name": "BSc Chemistry and Geology", "faculty": "Science & Agriculture"},
    {"code": "40014", "name": "BSc Computer Science and Applied Mathematics", "faculty": "Science & Agriculture"},
    {"code": "40015", "name": "BSc Computer Science and Physics", "faculty": "Science & Agriculture"},
    {"code": "40016", "name": "BSc Computer Science and Statistics", "faculty": "Science & Agriculture"},
    {"code": "40017", "name": "BSc Geography and Geology", "faculty": "Science & Agriculture"},
    {"code": "40023", "name": "BSc Geology and Physics", "faculty": "Science & Agriculture"},
    {"code": "40024", "name": "BSc Mathematics and Physics", "faculty": "Science & Agriculture"},
    {"code": "40025", "name": "BSc Computer Science and Mathematics", "faculty": "Science & Agriculture"},
    {"code": "40029", "name": "BSc Statistics and Geology", "faculty": "Science & Agriculture"},
    {"code": "40012", "name": "BSc Chemistry Single Major", "faculty": "Science & Agriculture"},
    {"code": "40018", "name": "BSc Geography and GIS", "faculty": "Science & Agriculture"},
    {"code": "40020", "name": "BSc GIS and Computer Science", "faculty": "Science & Agriculture"},
    {"code": "40022", "name": "BSc Geology and GIS", "faculty": "Science & Agriculture"},
    {"code": "40026", "name": "BSc Mathematics and Chemistry", "faculty": "Science & Agriculture"},
    {"code": "40027", "name": "BSc Microbiology and Zoology", "faculty": "Science & Agriculture"},
    {"code": "40028", "name": "BSc Mathematical Statistics and Mathematics", "faculty": "Science & Agriculture"},
    {"code": "40032", "name": "BSc Entomology and Microbiology", "faculty": "Science & Agriculture"},
    {"code": "40033", "name": "BSc GIS and Zoology", "faculty": "Science & Agriculture"},
    {"code": "40034", "name": "BSc GIS and Entomology", "faculty": "Science & Agriculture"},
    {"code": "40035", "name": "BSc Applied Mathematics and Mathematics", "faculty": "Science & Agriculture"},
    {"code": "40036", "name": "BSc Applied Mathematics and Statistics", "faculty": "Science & Agriculture"},
    {"code": "40037", "name": "BSc Applied Mathematics and Physics", "faculty": "Science & Agriculture"},
    {"code": "40039", "name": "BSc Biochemistry and Microbiology", "faculty": "Science & Agriculture"},
    {"code": "40040", "name": "BSc Biochemistry and Chemistry", "faculty": "Science & Agriculture"},
    {"code": "40041", "name": "BSc Biochemistry and Computer Science", "faculty": "Science & Agriculture"},
    {"code": "40042", "name": "BSc Botany and Zoology", "faculty": "Science & Agriculture"},
    {"code": "40043", "name": "BSc Chemistry and Physics", "faculty": "Science & Agriculture"},
]

# ---------- ALL MODULES ----------
MODULES = [
    # First Year - Common
    ("CSC113", "Introduction to Computer Science", 16, "core", 1),
    ("CSC121", "Programming Fundamentals", 16, "core", 1),
    ("MAT111", "Calculus I", 16, "core", 1),
    ("MAT112", "Calculus for Scientists", 16, "core", 1),
    ("MAT121", "Linear Algebra I", 16, "core", 1),
    ("MAT123", "Linear Algebra II", 16, "core", 1),
    ("PHY111", "Mechanics I", 8, "core", 1),
    ("PHY112", "Mechanics II", 8, "core", 1),
    ("PHY113", "Physics I", 8, "core", 1),
    ("PHY114", "Physics II", 8, "core", 1),
    ("PHY121", "Electromagnetism I", 8, "core", 1),
    ("PHY122", "Electromagnetism II", 8, "core", 1),
    ("PHY123", "Physics III", 8, "core", 1),
    ("PHY124", "Physics IV", 8, "core", 1),
    ("STA111", "Introduction to Statistics", 16, "core", 1),
    ("STA121", "Probability Theory", 16, "core", 1),
    ("PAC110", "Chemistry I", 16, "core", 1),
    ("PAC121", "Chemistry II", 16, "core", 1),
    ("BOT111", "Botany I", 16, "core", 1),
    ("BOT121", "Botany II", 16, "core", 1),
    ("ZOO111", "Zoology I", 16, "core", 1),
    ("ZOO121", "Zoology II", 16, "core", 1),
    ("GLG111", "Geology I", 16, "core", 1),
    ("GLG121", "Geology II", 16, "core", 1),
    ("GIS111", "Introduction to GIS", 16, "core", 1),
    ("GIS121", "Spatial Data Analysis", 16, "core", 1),
    ("GEG111", "Geography I", 16, "core", 1),
    ("GEG121", "Geography II", 16, "core", 1),
    ("MNU111", "Mathematics for Non-Scientists I", 16, "elective", 1),
    ("MNU121", "Mathematics for Non-Scientists II", 8, "elective", 1),
    ("MNU122", "Mathematics for Non-Scientists III", 8, "elective", 1),
    
    # Second Year - Computer Science
    ("COC211", "Advanced Programming", 8, "core", 2),
    ("COC212", "Computer Architecture and Organisation", 8, "core", 2),
    ("COC223", "Data Structures and Algorithms", 8, "core", 2),
    ("COC224", "Database Management and Design", 8, "core", 2),
    ("COC312", "Operating Systems", 16, "core", 3),
    ("COC313", "Object Oriented Programming", 16, "core", 3),
    ("COC323", "Introduction to Computer Networks", 16, "core", 3),
    ("COC324", "Software Engineering", 16, "core", 3),
    
    # Third Year - Computer Science
    ("CSC312", "Operating Systems", 16, "core", 3),
    ("CSC313", "Object Oriented Programming", 16, "core", 3),
    ("CSC323", "Introduction to Computer Networks", 16, "core", 3),
    ("CSC324", "Software Engineering", 16, "core", 3),
    
    # Second Year - Mathematics
    ("MAT212", "Fundamentals of Mathematics", 8, "core", 2),
    ("MAT213", "Advanced Calculus", 8, "core", 2),
    ("MAT225", "Linear Algebra", 8, "core", 2),
    ("MAT226", "Linear Algebra", 8, "core", 2),
    ("MAT227", "Real Analysis", 8, "core", 2),
    ("MAT228", "Geometry", 8, "core", 2),
    
    # Third Year - Mathematics
    ("MAT312", "Abstract Algebra", 16, "core", 3),
    ("MAT313", "Real Analysis A", 16, "core", 3),
    ("MAT314", "History of Mathematics I", 16, "core", 3),
    ("MAT323", "Complex Analysis", 16, "core", 3),
    ("MAT324", "Real Analysis B", 16, "core", 3),
    ("MAT325", "History of Mathematics II", 16, "core", 3),
    
    # Second Year - Statistics
    ("STM213", "Introduction to Mathematical Statistics A", 16, "core", 2),
    ("STM214", "Introduction to Mathematical Statistics B", 16, "core", 2),
    ("STM223", "Introduction to Mathematical Statistics C", 16, "core", 2),
    ("STM224", "Introduction to Mathematical Statistics D", 16, "core", 2),
    ("STM212", "Introduction to Mathematical Statistics", 16, "core", 2),
    ("STM221", "Introduction to Mathematical Statistics", 16, "core", 2),
    ("STM222", "Introduction to Mathematical Statistics", 16, "core", 2),
    
    # Third Year - Statistics
    ("STM312", "Advanced Mathematical Statistics A1", 16, "core", 3),
    ("STM313", "Introductory Applied Statistics B1", 16, "core", 3),
    ("STM322", "Advanced Mathematical Statistics A2", 16, "core", 3),
    ("STM323", "Introductory Applied Statistics B2", 16, "core", 3),
    
    # Second Year - Applied Mathematics
    ("MAP212", "Introduction to Numerical Methods", 16, "core", 2),
    ("MAP222", "Introduction to Analytical Methods", 16, "core", 2),
    
    # Third Year - Applied Mathematics
    ("MAP311", "Special and Orthogonal Functions", 16, "core", 3),
    ("MAP312", "Advanced Numerical Differentiation and Integration", 16, "core", 3),
    ("MAP321", "Partial Differential Equations", 16, "core", 3),
    ("MAP322", "Numerical Solutions to Differential Equations", 16, "core", 3),
    
    # Second Year - Physics
    ("PHY213", "Mechanics", 8, "core", 2),
    ("PHY214", "Electromagnetism and AC Theory", 8, "core", 2),
    ("PHY223", "Analogue Electronics", 8, "core", 2),
    ("PHY224", "Advanced Electromagnetism", 8, "core", 2),
    
    # Third Year - Physics
    ("PHY311", "Modern Physics", 16, "core", 3),
    ("PHY312", "Thermal Physics", 16, "core", 3),
    ("PHY321", "Quantum Mechanics and Solid State Physics", 16, "core", 3),
    ("PHY322", "Mathematical Methods and Statistical Mechanics", 16, "core", 3),
    ("PHY323", "Advanced Physics", 16, "core", 3),
    
    # Second Year - Botany
    ("BOT212", "Evolution and Lower Plant Diversity", 8, "core", 2),
    ("BOT213", "Evolution and Higher Plant Diversity", 8, "core", 2),
    ("BOT222", "Plant Physiology and Biotechnology", 8, "core", 2),
    ("BOT223", "Plant Ecology and Taxonomy", 8, "core", 2),
    
    # Third Year - Botany
    ("BOT312", "Plant Anatomy", 16, "core", 3),
    ("BOT313", "Plant Ecology", 16, "core", 3),
    ("BOT322", "Plant Biochemistry", 16, "core", 3),
    ("BOT323", "Plant Systematics", 16, "core", 3),
    ("BOT324", "Advanced Botany", 16, "core", 3),
    
    # Second Year - Zoology
    ("ZOO213", "Scientific Method and Ecology", 16, "core", 2),
    ("ZOO225", "Insect Biology, Diversity and Ecology", 16, "core", 2),
    ("ZOO224", "Zoology Elective", 16, "elective", 2),
    
    # Second Year - Microbiology
    ("MIC213", "Introduction to Microbiology", 16, "core", 2),
    ("MIC223", "Soil Microbiology and Microbial Genetics", 16, "core", 2),
    
    # Third Year - Microbiology
    ("MIC311", "Microbial Physiology and Metabolism", 16, "core", 3),
    ("MIC312", "Immunology, Virology and Antimicrobial Chemotherapy", 16, "core", 3),
    ("MIC321", "Molecular Biology and Basic Genetic Engineering", 16, "core", 3),
    ("MIC322", "Applied Microbiology and Biotechnology", 16, "core", 3),
    
    # Second Year - Biochemistry
    ("BCH215", "Introductory Biochemistry", 16, "core", 2),
    ("BCH224", "Metabolism and Enzymology", 16, "core", 2),
    
    # Additional prospectus modules used by 2026 BSc combinations
    ("PAC216", "PAC 216", 16, "core", 2),
    ("PAC218", "PAC 218", 16, "core", 2),
    ("PAC225", "PAC 225", 16, "core", 2),
    ("PAC227", "PAC 227", 16, "core", 2),
    ("PAC315", "PAC 315", 16, "core", 3),
    ("PAC317", "PAC 317", 16, "core", 3),
    ("PAC326", "PAC 326", 16, "core", 3),
    ("PAC328", "PAC 328", 16, "core", 3),
    ("GIS314", "GIS 314", 16, "core", 3),
    ("GIS315", "GIS 315", 16, "core", 3),
    ("GIS324", "GIS 324", 16, "core", 3),
    ("GIS325", "GIS 325", 16, "core", 3),
    ("ZOO314", "ZOO 314", 16, "core", 3),
    ("ZOO315", "ZOO 315", 16, "core", 3),
    ("ZOO316", "ZOO 316", 16, "core", 3),
    ("ZOO324", "ZOO 324", 16, "core", 3),
    ("ZOO325", "ZOO 325", 16, "core", 3),
    ("ZOO326", "ZOO 326", 16, "core", 3),
    ("BCH313", "BCH 313", 16, "core", 3),
    ("BCH314", "BCH 314", 16, "core", 3),
    ("BCH323", "BCH 323", 16, "core", 3),
    ("BCH324", "BCH 324", 16, "core", 3),

    # Second Year - Chemistry
    ("PAC211", "Inorganic Chemistry I", 16, "core", 2),
    ("PAC213", "Organic Chemistry I", 16, "core", 2),
    ("PAC215", "Organic Chemistry I", 16, "core", 2),
    ("PAC222", "Analytical Chemistry I", 16, "core", 2),
    ("PAC223", "Physical Chemistry I", 16, "core", 2),
    ("PAC224", "Physical Chemistry II", 16, "core", 2),
    
    # Third Year - Chemistry
    ("PAC311", "Organic Chemistry II", 16, "core", 3),
    ("PAC312", "Analytical Chemistry II", 16, "core", 3),
    ("PAC321", "Inorganic Chemistry II", 16, "core", 3),
    ("PAC323", "Organic Chemistry III", 16, "core", 3),
    
    # Second Year - Geology
    ("GLG212", "Crystallography, Mineral Optics, Igneous Petrology", 16, "core", 2),
    ("GLG213", "Structural Geology and Field Mapping", 16, "core", 2),
    ("GLG222", "Geochemistry and Economic Geology", 16, "core", 2),
    ("GLG223", "Sedimentology and South African Geology", 16, "core", 2),
    
    # Third Year - Geology
    ("GLG312", "Geochemistry and Hydrogeology", 16, "core", 3),
    ("GLG313", "Structural Geology and South African Geology", 16, "core", 3),
    ("GLG322", "Metamorphic Petrology and Engineering Geology", 16, "core", 3),
    ("GLG323", "Economic Geology, Statistics and Data Analysis", 16, "core", 3),
    
    # Second Year - Geography
    ("GEG212", "Pedology, Population, Climatology, Settlement Geography", 16, "core", 2),
    ("GEG221", "Economic Geography, Geomorphology, Statistics", 16, "core", 2),
    ("GEG222", "Geographic Information Systems", 16, "core", 2),
    
    # Third Year - Geography
    ("GEG312", "Economic Geography and Geographical Research", 16, "core", 3),
    ("GEG313", "Biogeography", 16, "core", 3),
    ("GEG322", "Climatology and Geomorphology", 16, "core", 3),
    ("GEG323", "Settlement Geography and Geographical Research", 16, "core", 3),
    
    # Second Year - GIS
    ("GIS212", "Technical Issues in GIS", 16, "core", 2),
    ("GIS222", "Applications in GIS", 16, "core", 2),
    
    # Second Year - GSS
    ("GSS211", "Geographic Information Science", 16, "elective", 2),
    ("GSS221", "Advanced Geographic Information Science", 16, "elective", 2),
    
    # Second Year - DCS
    ("DCS211", "Project Management", 8, "core", 2),
    ("DCS212", "Data Analysis Techniques", 8, "core", 2),
    ("DCS221", "Mathematics for Artificial Intelligence", 8, "core", 2),
    ("DCS222", "Embedded Systems Programming", 8, "core", 2),
    ("DCS223", "Computational Modeling", 8, "core", 2),
    ("DCS224", "Technopreneurship", 8, "core", 2),
]

# ---------- PREREQUISITES ----------
PREREQUISITES = {
    # Botany
    "BOT212": ["BOT111", "BOT121"],
    "BOT213": ["BOT111", "BOT121"],
    "BOT222": ["BOT111", "BOT121"],
    "BOT223": ["BOT111", "BOT121"],
    "BOT312": ["BOT212", "BOT213", "BOT222", "BOT223", "PAC110", "PAC121"],
    "BOT313": ["BOT212", "BOT222", "PAC110", "PAC121"],
    "BOT322": ["BOT212", "BOT222", "PAC110", "PAC121"],
    "BOT323": ["BOT212", "BOT222", "PAC110", "PAC121"],
    
    # Microbiology
    "MIC213": ["PAC121", "BOT111", "ZOO111"],
    "MIC223": ["MIC213"],
    "MIC311": ["MIC213"],
    "MIC312": ["MIC213"],
    "MIC321": ["MIC213"],
    "MIC322": ["MIC311"],
    
    # Biochemistry
    "BCH215": ["PAC110", "PAC121", "BOT111", "BOT121"],
    "BCH224": ["BCH215"],
    
    # Zoology
    "ZOO213": ["ZOO111", "ZOO121"],
    "ZOO225": ["ZOO111", "ZOO121", "ZOO213"],
    
    # Chemistry
    "PAC211": ["PAC110", "PAC121", "MAT111", "MAT112", "MAT121", "MAT123"],
    "PAC213": ["PAC110", "PAC121"],
    "PAC215": ["PAC110", "PAC121"],
    "PAC222": ["PAC211"],
    "PAC223": ["PAC211", "PAC213"],
    "PAC224": ["PAC211", "PAC213"],
    "PAC311": ["PAC223", "PAC312"],
    "PAC312": ["PAC222", "MAT121", "MAT123"],
    "PAC321": ["PAC312"],
    "PAC323": ["PAC223", "PAC312"],
    
    # Geology
    "GLG212": ["GLG111", "PAC110"],
    "GLG213": ["GLG121", "PAC121"],
    "GLG222": ["GLG121", "PAC110"],
    "GLG223": ["GLG111", "GLG121"],
    "GLG312": ["GLG212", "PAC110"],
    "GLG313": ["GLG213", "PAC110"],
    "GLG322": [],
    "GLG323": [],
    
    # Geography
    "GEG212": ["GEG111", "GEG121"],
    "GEG221": ["GEG111", "GEG121"],
    "GEG312": ["GEG212", "GEG222"],
    "GEG313": ["GEG212", "GEG222"],
    "GEG322": ["GEG212", "GEG222"],
    "GEG323": ["GEG212", "GEG222"],
    
    # GIS
    "GIS212": ["GIS111", "GIS121"],
    "GIS222": ["GIS111", "GIS121"],
    
    # Computer Science
    "COC211": ["CSC121"],
    "COC212": ["CSC121"],
    "COC223": ["COC211"],
    "COC224": ["CSC121"],
    "COC312": ["COC212"],
    "COC313": ["COC211"],
    "COC323": ["COC212"],
    "COC324": ["COC211"],
    "CSC312": ["COC212"],
    "CSC313": ["COC211"],
    "CSC323": ["COC212"],
    "CSC324": ["COC211"],
    
    # Mathematics
    "MAT212": ["MAT111", "MAT121"],
    "MAT213": ["MAT111", "MAT121"],
    "MAT225": ["MAT212"],
    "MAT226": ["MAT212"],
    "MAT227": ["MAT213", "MAT212"],
    "MAT228": ["MAT111", "MAT121"],
    "MAT312": ["MAT212", "MAT226"],
    "MAT313": ["MAT227"],
    "MAT314": ["MAT213", "MAT212"],
    "MAT323": ["MAT213", "MAT212"],
    "MAT324": ["MAT313"],
    "MAT325": ["MAT314"],
    
    # Statistics
    "STM212": ["MAT111", "MAT121"],
    "STM213": ["MAT111", "MAT121"],
    "STM214": ["STA121"],
    "STM221": ["STM212"],
    "STM222": ["STM212"],
    "STM223": ["STM213"],
    "STM224": ["STM214"],
    "STM312": ["STM223", "STM224"],
    "STM313": ["STM223", "STM224"],
    "STM322": ["STM312"],
    "STM323": ["STM313"],
    
    # Applied Mathematics
    "MAP212": ["MAT111", "MAT121"],
    "MAP222": ["MAT213", "PHY121"],
    "MAP311": ["MAP212", "MAT213", "MAP222", "MAT226"],
    "MAP312": ["MAP212"],
    "MAP321": ["MAP311"],
    "MAP322": ["MAP312"],
    
    # Physics
    "PHY213": ["PHY111", "PHY112"],
    "PHY214": ["PHY111", "PHY112"],
    "PHY223": [],
    "PHY224": ["PHY121", "PHY122"],
    "PHY311": ["PHY213", "PHY223", "MAT226", "MAT227"],
    "PHY312": ["PHY213", "PHY214"],
    "PHY321": ["PHY223", "PHY224"],
    "PHY322": ["PHY223", "PHY224"],
}

# ---------- CURRICULUM POSITION ----------
# UFH module codes encode the normal semester in the tens digit:
# x1x = Semester 1 and x2x = Semester 2.  The module level supplies
# the curriculum year for these three-year BSc combinations.
def curriculum_position(module):
    code = module.code
    semester = 1
    if len(code) >= 2 and code[-2].isdigit():
        semester_digit = int(code[-2])
        if semester_digit in (1, 2):
            semester = semester_digit
    return module.level, semester


# ---------- PROGRAMME MODULES ----------
PROGRAMME_MODULES = {
    # BSc Botany and Microbiology (40009) - Fully prescribed
    "40009": {
        "compulsory": [
            "BOT111", "ZOO111", "PAC110", "STA111",
            "BOT121", "ZOO121", "PAC121", "STA121",
            "BOT212", "BOT213", "MIC213", "BCH215", "ZOO213",
            "BOT222", "BOT223", "MIC223", "BCH224", "ZOO225",
            "BOT312", "BOT313", "MIC311", "MIC312",
            "BOT322", "BOT323", "MIC321", "MIC322",
        ],
        "elective": [],
    },
    
    # BSc Chemistry and Botany (40011)
    "40011": {
        "compulsory": [
            "BOT111", "PAC110", "MAT112", "ZOO111",
            "BOT121", "PAC121", "MAT123", "ZOO121",
            "BOT212", "BOT213", "PAC211", "PAC215",
            "BOT222", "BOT223", "PAC222", "PAC224",
            "BOT312", "BOT313", "PAC311", "PAC312",
            "BOT322", "BOT324", "PAC321", "PAC323",
        ],
        "elective": [
            "BCH215", "MIC213", "ZOO213",
            "BCH224", "MIC223", "ZOO224", "ZOO225",
        ],
    },
    
    # BSc Chemistry and Geology (40013) - Fully prescribed
    "40013": {
        "compulsory": [
            "PAC110", "GLG111", "MAT112", "PHY111", "PHY112",
            "PAC121", "GLG121", "MAT123", "PHY121", "PHY122",
            "PAC211", "PAC215", "GLG212", "GLG213",
            "PAC222", "PAC224", "GLG222", "GLG223",
            "PAC311", "PAC312", "GLG312", "GLG313",
            "PAC321", "PAC323", "GLG322", "GLG323",
        ],
        "elective": [],
    },
    
    # BSc Computer Science and Applied Mathematics (40014)
    "40014": {
        "compulsory": [
            "CSC113", "MAT111", "PHY113", "PHY114",
            "CSC121", "MAT121", "PHY123", "PHY124",
            "COC211", "COC212", "MAP212", "DCS211", "DCS212",
            "COC223", "COC224", "MAP222", "DCS223", "DCS224",
            "CSC312", "CSC313", "MAP311", "MAP312",
            "CSC323", "CSC324", "MAP321", "MAP322",
        ],
        "elective": [
            "STA111", "MNU111",
            "STA121", "MNU121", "MNU122",
            "MAT212", "MAT213", "STM213", "STM214",
            "MAT226", "MAT227", "STM223", "STM224",
        ],
    },
    
    # BSc Computer Science and Physics (40015) - Fully prescribed
    "40015": {
        "compulsory": [
            "CSC113", "MAT111", "PHY111", "PHY112", "STA111",
            "CSC121", "MAT121", "PHY121", "PHY122", "STA121",
            "COC211", "COC212", "PHY213", "PHY214", "MAT212", "MAT213", "DCS211", "DCS212",
            "COC223", "COC224", "PHY223", "PHY224", "MAT226", "MAT227", "MAT228", "DCS222", "DCS224",
            "COC312", "COC313", "PHY311", "PHY312",
            "COC323", "COC324", "PHY321", "PHY322",
        ],
        "elective": [],
    },
    
    # BSc Computer Science and Statistics (40016)
    "40016": {
        "compulsory": [
            "CSC113", "MAT111", "PHY111", "PHY112", "STA111",
            "CSC121", "MAT121", "PHY121", "PHY122", "STA121",
            "COC211", "COC212", "STM213", "STM214", "DCS211", "DCS212",
            "COC223", "COC224", "STM223", "STM224", "DCS223", "DCS224",
            "CSC312", "CSC313", "STM312", "STM313",
            "CSC323", "CSC324", "STM322", "STM323",
        ],
        "elective": [
            "MAT212", "MAT213", "PHY213", "PHY214", "MAP212",
            "MAT226", "MAT225", "MAT228", "PHY223", "PHY224", "MAP222",
        ],
    },
    
    # BSc Geography and Geology (40017)
    "40017": {
        "compulsory": [
            "GEG111", "GLG111", "GIS111", "PAC110",
            "GEG121", "GLG121", "GIS121", "PAC121",
            "GEG212", "GLG212", "GLG213",
            "GEG221", "GLG222", "GLG223",
            "GEG312", "GEG313", "GLG312", "GLG313",
            "GEG322", "GEG323", "GLG322", "GLG323",
        ],
        "elective": [
            "GIS212", "GSS211",
            "GIS222", "GSS221",
        ],
    },
    
    # BSc Geology and Physics (40023) - Fully prescribed
    "40023": {
        "compulsory": [
            "GLG111", "PHY111", "PHY112", "PAC110", "MAT111",
            "GLG121", "PHY121", "PHY122", "PAC121", "MAT121",
            "GLG212", "PHY213", "PHY214", "GIS212", "MAT212", "MAT213",
            "GLG222", "PHY223", "PHY224", "GIS222", "MAT226", "MAT227", "MAT228",
            "GLG312", "GLG313", "PHY311", "PHY312",
            "GLG322", "GLG323", "PHY322", "PHY323",
        ],
        "elective": [],
    },
    
    # BSc Mathematics and Physics (40024)
    "40024": {
        "compulsory": [
            "MAT111", "PHY111", "PHY112", "CSC113", "STA111",
            "MAT121", "PHY121", "PHY122", "CSC121", "STA121",
            "MAT212", "MAT213", "PHY213", "PHY214", "DCS211", "DCS212",
            "MAT226", "MAT227", "MAT228", "PHY223", "PHY224", "DCS221", "DCS222",
            "MAT312", "MAT313", "MAT314", "PHY311", "PHY312",
            "MAT323", "MAT324", "MAT325", "PHY321", "PHY322",
        ],
        "elective": [
            "COC211", "COC212", "MAP212", "STM213", "STM214",
            "COC223", "COC224", "MAP222", "STM223", "STM224",
        ],
    },
    
    # BSc Computer Science and Mathematics (40025) - Fully prescribed
    "40025": {
        "compulsory": [
            "CSC113", "MAT111", "PHY111", "PHY112", "STA111",
            "CSC121", "MAT121", "PHY121", "PHY122", "STA121",
            "COC211", "COC212", "MAT212", "MAT213", "DCS211", "DCS212",
            "COC223", "COC224", "MAT225", "MAT227", "MAT228", "DCS222", "DCS224",
            "CSC312", "CSC313", "MAT312",
            "CSC323", "CSC324", "MAT323",
        ],
        "elective": [
            "MAT313", "MAT314",
            "MAT324", "MAT325",
        ],
    },
    
    # BSc Statistics and Geology (40029)
    "40029": {
        "compulsory": [
            "STA111", "GLG111", "GIS111", "PAC110",
            "STA121", "GLG121", "GIS121", "PAC121",
            "STM213", "STM214", "GLG212", "GLG213", "GIS212",
            "STM223", "STM224", "GLG222", "GLG223", "GIS222",
            "STM312", "STM313", "GLG312", "GLG313",
            "STM322", "STM323", "GLG322", "GLG323",
        ],
        "elective": [],
    },

    # BSc Botany and Entomology (40008)
    "40008": {
        "compulsory": ["BOT111","ZOO111","PAC110","STA111","BOT121","ZOO121","PAC121","STA121","BOT212","BOT213","ZOO213","BCH215","MIC213","BOT222","BOT223","ZOO225","BCH224","MIC223","BOT312","BOT313","ZOO314","ZOO316","BOT322","BOT323","ZOO324","ZOO326"],
        "elective": [],
    },
    # BSc Chemistry Single Major (40012)
    "40012": {
        "compulsory": ["PAC110","MAT112","PHY113","PHY114","MNU111","PAC121","MAT123","PHY123","PHY124","MNU121","MNU122","PAC211","PAC215","PAC216","PAC218","PAC222","PAC224","PAC225","PAC227","PAC312","PAC311","PAC315","PAC317","PAC321","PAC323","PAC326","PAC328"],
        "elective": [],
    },
    # BSc Geography and GIS (40018)
    "40018": {
        "compulsory": ["GEG111","GIS111","CSC113","GEG121","GIS121","CSC121","GEG212","GIS212","GSS211","GEG221","GIS222","GSS221","GEG312","GEG313","GIS314","GIS315","GEG322","GEG323","GIS324","GIS325"],
        "elective": ["PHY113","PHY114","GLG111","STA111","MAT112","BOT111","ZOO111","PAC110","PHY123","PHY124","GLG121","STA121","MAT123","BOT121","ZOO121","PAC121","COC211","COC212","BOT212","BOT213","ZOO213","COC223","COC224","BOT222","BOT223","ZOO225"],
    },
    # BSc GIS and Computer Science (40020)
    "40020": {
        "compulsory": ["GIS111","CSC113","GIS121","CSC121","COC211","COC212","GIS212","GSS211","COC223","COC224","GIS222","GSS221","GIS314","GIS315","CSC312","CSC313","GIS324","GIS325","CSC323","CSC324"],
        "elective": ["ZOO111","PAC110","GEG111","STA111","MAT112","BOT111","PHY113","PHY114","ZOO121","PAC121","GEG121","STA121","MAT123","BOT121","PHY123","PHY124","GEG212","BOT212","BOT213","ZOO213","GEG221","BOT222","BOT223","ZOO225"],
    },
    # BSc Geology and GIS (40022)
    "40022": {
        "compulsory": ["GLG111","PAC110","GIS111","GLG121","PAC121","GIS121","GLG212","GLG213","GIS212","GSS211","GLG222","GLG223","GIS222","GSS221","GLG312","GLG313","GIS314","GIS315","GLG322","GLG323","GIS324","GIS325"],
        "elective": ["PHY113","PHY114","GEG111","STA111","MAT112","BOT111","ZOO111","PHY123","PHY124","GEG121","STA121","MAT123","BOT121","ZOO121"],
    },
    # BSc Mathematics and Chemistry (40026)
    "40026": {
        "compulsory": ["MAT111","PHY113","PHY114","PAC110","MNU111","MAT121","PHY123","PHY124","PAC121","MNU121","MNU122","MAT212","MAT213","PAC211","PAC215","MAT226","PAC222","PAC224","MAT312","PAC311","PAC312","MAT323","PAC321","PAC323"],
        "elective": ["MAT227","MAT228","MAP212","PHY213","PHY214","MAP222","PHY223","PHY224","MAT313","MAT314","MAT324","MAT325"],
    },
    # BSc Microbiology and Zoology (40027)
    "40027": {
        "compulsory": ["BOT111","PAC110","STA111","ZOO111","BOT121","PAC121","STA121","ZOO121","MIC213","ZOO213","BCH215","BOT212","BOT213","MIC223","ZOO224","BCH224","BOT222","BOT223","MIC311","MIC312","ZOO314","ZOO315","MIC321","MIC322","ZOO324","ZOO325"],
        "elective": [],
    },
    # BSc Mathematical Statistics and Mathematics (40028)
    "40028": {
        "compulsory": ["CSC113","MAT111","PHY111","PHY112","STA111","CSC121","MAT121","PHY121","PHY122","STA121","MAT212","MAT213","DCS211","DCS212","MAT226","DCS221","DCS223","MAT312","STM312","STM313","MAT323","STM322","STM323"],
        "elective": ["MAT227","MAT228","STM213","STM214","STM223","STM224","COC211","COC212","PHY213","PHY214","MAP212","COC223","COC224","PHY223","PHY224","MAP222","MAT313","MAT314","MAT324","MAT325"],
    },
    # BSc Entomology and Microbiology (40032)
    "40032": {
        "compulsory": ["BOT111","ZOO111","PAC110","STA111","BOT121","ZOO121","PAC121","STA121","MIC213","ZOO213","BCH215","BOT212","BOT213","MIC223","ZOO225","BCH224","BOT222","BOT223","MIC311","MIC312","ZOO314","ZOO316","MIC321","MIC322","ZOO324","ZOO326"],
        "elective": [],
    },
    # BSc GIS and Zoology (40033)
    "40033": {
        "compulsory": ["ZOO111","GIS111","GEG111","ZOO121","GIS121","GEG121","ZOO213","GIS212","GSS211","ZOO224","GIS222","GSS221","ZOO314","ZOO315","GIS314","GIS315","ZOO324","ZOO325","GIS324","GIS325"],
        "elective": ["PHY111","PHY112","STA111","MAT111","BOT111","CSC113","PHY121","PHY122","STA121","MAT121","BOT121","CSC121","COC211","COC212","MAT212","MAT213","PHY213","PHY214","GEG212","BOT212","BOT213","STM213","STM214","COC223","COC224","MAT226","MAT227","PHY223","PHY224","GEG221","BOT222","BOT223","STM223","STM224"],
    },
    # BSc GIS and Entomology (40034)
    "40034": {
        "compulsory": ["ZOO111","GIS111","GEG111","ZOO121","GIS121","GEG121","ZOO213","GIS212","GSS211","ZOO225","GIS222","GSS221","ZOO314","ZOO316","GIS314","GIS315","ZOO324","ZOO326","GIS324","GIS325"],
        "elective": ["PHY111","PHY112","STA111","MAT111","BOT111","CSC113","PHY121","PHY122","STA121","MAT121","BOT121","CSC121","COC211","COC212","MAT212","MAT213","PHY213","PHY214","GEG212","BOT212","BOT213","STM213","STM214","COC223","COC224","MAT226","MAT227","PHY223","PHY224","GEG221","BOT222","BOT223","STM223","STM224"],
    },
    # BSc Applied Mathematics and Mathematics (40035)
    "40035": {
        "compulsory": ["CSC113","MAT111","PHY111","PHY112","CSC121","MAT121","PHY121","PHY122","MAT212","MAT213","MAP212","DCS211","DCS212","MAT226","MAP222","DCS221","DCS223","MAT312","MAP311","MAP312","MAT323","MAP321","MAP322"],
        "elective": ["STA111","MNU111","STA121","MNU121","MNU122","MAT227","MAT228","COC211","COC212","PHY213","PHY214","STM213","STM214","COC223","COC224","PHY223","PHY224","STM223","STM224","MAT313","MAT314","MAT324","MAT325"],
    },
    # BSc Applied Mathematics and Statistics (40036)
    "40036": {
        "compulsory": ["CSC113","MAT111","PHY111","PHY112","STA111","CSC121","MAT121","PHY121","PHY122","STA121","MAP212","DCS211","DCS212","MAP222","DCS221","DCS223","MAP311","MAP312","STM312","STM313","MAP321","MAP322","STM322","STM323"],
        "elective": ["STM213","STM214","MAT212","MAT213","COC211","COC212","PHY213","PHY214","STM223","STM224","MAT226","MAT227","MAT228","COC223","COC224","PHY223","PHY224"],
    },
    # BSc Applied Mathematics and Physics (40037)
    "40037": {
        "compulsory": ["CSC113","MAT111","PHY111","PHY112","CSC121","MAT121","PHY121","PHY122","MAP212","PHY213","PHY214","DCS211","DCS212","MAP222","PHY223","PHY224","DCS222","DCS223","MAP311","MAP312","PHY311","PHY312","MAP321","MAP322","PHY321","PHY322"],
        "elective": ["STA111","MNU111","STA121","MNU121","MNU122","COC211","COC212","MAT212","MAT213","STM213","STM214","COC223","COC224","MAT226","MAT227","MAT228","STM223","STM224"],
    },
    # BSc Biochemistry and Microbiology (40039)
    "40039": {
        "compulsory": ["BOT111","MAT112","PAC110","ZOO111","BOT121","MAT123","PAC121","ZOO121","BCH215","MIC213","BCH224","MIC223","BCH313","BCH314","MIC311","MIC312","BCH323","BCH324","MIC321","MIC322"],
        "elective": ["PAC211","PAC215","BOT212","BOT213","ZOO213","PAC222","PAC224","BOT222","BOT223","ZOO224","ZOO225"],
    },
    # BSc Biochemistry and Chemistry (40040)
    "40040": {
        "compulsory": ["BOT111","MAT112","PAC110","ZOO111","BOT121","MAT123","PAC121","ZOO121","BCH215","PAC211","PAC215","BCH224","PAC222","PAC224","BCH313","BCH314","PAC311","PAC312","BCH323","BCH324","PAC321","PAC323"],
        "elective": ["BOT212","BOT213","MIC213","ZOO213","BOT222","BOT223","MIC223","ZOO224","ZOO225"],
    },
    # BSc Biochemistry and Computer Science (40041)
    "40041": {
        "compulsory": ["CSC113","PAC110","MAT111","CSC121","PAC121","MAT121","BCH215","COC211","COC212","MAT212","MAT213","BCH224","COC223","COC224","MAT226","BCH313","BCH314","CSC312","CSC313","BCH323","BCH324","CSC323","CSC324"],
        "elective": ["BOT111","ZOO111","BOT121","ZOO121","MAT227","MAT228","BOT212","BOT213","ZOO213","BOT222","BOT223","ZOO224","ZOO225"],
    },
    # BSc Botany and Zoology (40042)
    "40042": {
        "compulsory": ["BOT111","ZOO111","PAC110","STA111","BOT121","ZOO121","PAC121","STA121","BOT212","BOT213","ZOO213","BCH215","MIC213","BOT222","BOT223","ZOO224","BCH224","MIC223","BOT312","BOT313","ZOO314","ZOO315","BOT322","BOT323","ZOO324","ZOO325"],
        "elective": [],
    },
    # BSc Chemistry and Physics (40043)
    "40043": {
        "compulsory": ["PHY111","PHY112","PAC110","MAT111","PHY121","PHY122","PAC121","MAT121","PHY213","PHY214","PAC211","PAC215","PHY223","PHY224","PAC222","PAC224","PHY311","PHY312","PAC311","PAC312","PHY322","PHY323","PAC321","PAC323"],
        "elective": ["CSC113","GLG111","CSC121","GLG121","COC211","COC212","MAT212","MAT213","GLG212","COC223","COC224","MAT226","MAT227","MAT228","GLG222"],
    },

}

# ---------- CURRICULUM CHOICE GROUPS ----------
# These encode the prospectus' OR/selection rules.  Options remain linked to
# ProgrammeModule for planning visibility, while graduation logic can evaluate
# the group instead of treating every option as compulsory.
REQUIREMENT_GROUPS = {
    "40011": [
        {"key": "y2s1-elective", "label": "Choose 16 credits: BCH215, MIC213 or ZOO213", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["BCH215", "MIC213", "ZOO213"]},
        {"key": "y2s2-elective", "label": "Choose 16 credits: BCH224, MIC223, ZOO224 or ZOO225", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["BCH224", "MIC223", "ZOO224", "ZOO225"]},
    ],
    "40014": [
        {"key": "y1s1-stream", "label": "Choose STA111 or MNU111", "year": 1, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["STA111", "MNU111"]},
        {"key": "y1s2-stream", "label": "Choose STA121 or MNU121 + MNU122", "year": 1, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["STA121", "MNU121", "MNU122"]},
        {"key": "y2s1-elective", "label": "Choose 16 credits from Mathematics or Mathematical Statistics", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["MAT212", "MAT213", "STM213", "STM214"]},
        {"key": "y2s2-elective", "label": "Choose 16 credits from Mathematics or Mathematical Statistics", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["MAT226", "MAT227", "STM223", "STM224"]},
    ],
    "40016": [
        {"key": "y2s1-stat", "label": "Choose STM213 or STM214", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["STM213", "STM214"]},
        {"key": "y2s2-stat", "label": "Choose STM223 or STM224", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["STM223", "STM224"]},
        {"key": "y2s1-elective", "label": "Choose 16 elective credits", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["MAT212", "MAT213", "PHY213", "PHY214", "MAP212"]},
        {"key": "y2s2-elective", "label": "Choose 16 elective credits", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["MAT226", "MAT225", "MAT228", "PHY223", "PHY224", "MAP222"]},
    ],
    "40017": [
        {"key": "y2s1-elective", "label": "Choose GIS212 or GSS211", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["GIS212", "GSS211"]},
        {"key": "y2s2-elective", "label": "Choose GIS222 or GSS221", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["GIS222", "GSS221"]},
    ],
    "40023": [
        {"key": "y2s2-math-choice", "label": "Choose MAT227 or MAT228", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 8, "options": ["MAT227", "MAT228"]},
    ],
    "40024": [
        {"key": "y2s2-math-choice", "label": "Choose MAT227 or MAT228", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 8, "options": ["MAT227", "MAT228"]},
        {"key": "y3s1-math-choice", "label": "Choose MAT313 or MAT314", "year": 3, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["MAT313", "MAT314"]},
        {"key": "y3s2-math-choice", "label": "Choose MAT324 or MAT325", "year": 3, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["MAT324", "MAT325"]},
    ],
    "40025": [
        {"key": "y1s1-stream", "label": "Choose STA111 or MNU111", "year": 1, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["STA111", "MNU111"]},
        {"key": "y1s2-stream", "label": "Choose STA121 or MNU121 + MNU122", "year": 1, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["STA121", "MNU121", "MNU122"]},
        {"key": "y2s2-math-choice", "label": "Choose MAT227 or MAT228", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 8, "options": ["MAT227", "MAT228"]},
        {"key": "y2s1-elective", "label": "Choose 16 elective credits", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["MAP212", "PHY213", "PHY214", "STM213", "STM214"]},
        {"key": "y2s2-elective", "label": "Choose 16 elective credits", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["MAP222", "PHY223", "PHY224", "STM223", "STM224"]},
        {"key": "y3s1-math-choice", "label": "Choose MAT313 or MAT314", "year": 3, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["MAT313", "MAT314"]},
        {"key": "y3s2-math-choice", "label": "Choose MAT324 or MAT325", "year": 3, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["MAT324", "MAT325"]},
    ],
    "40029": [
        {"key": "y2s1-stat", "label": "Choose STM213 or STM212", "year": 2, "semester": 1, "min_modules": 1, "min_credits": 16, "options": ["STM213", "STM212"]},
        {"key": "y2s2-stat", "label": "Choose STM221 or STM222", "year": 2, "semester": 2, "min_modules": 1, "min_credits": 16, "options": ["STM221", "STM222"]},
    ],,
    "40015": [
        {"key":"y2s2-math-choice","label":"Choose MAT227 or MAT228","year":2,"semester":2,"min_modules":1,"min_credits":8,"options":["MAT227","MAT228"]},
    ],
    "40018": [
        {"key":"y1s1-elective","label":"Choose 16 first-year elective credits","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["PHY113","PHY114","GLG111","STA111","MAT112","BOT111","ZOO111","PAC110"]},
        {"key":"y1s2-elective","label":"Choose 16 first-year elective credits","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["PHY123","PHY124","GLG121","STA121","MAT123","BOT121","ZOO121","PAC121"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","BOT212","BOT213","ZOO213"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","BOT222","BOT223","ZOO225"]},
    ],
    "40020": [
        {"key":"y1s1-elective","label":"Choose 32 first-year elective credits","year":1,"semester":1,"min_modules":1,"min_credits":32,"options":["ZOO111","PAC110","GEG111","STA111","MAT112","BOT111","PHY113","PHY114"]},
        {"key":"y1s2-elective","label":"Choose 32 first-year elective credits","year":1,"semester":2,"min_modules":1,"min_credits":32,"options":["ZOO121","PAC121","GEG121","STA121","MAT123","BOT121","PHY123","PHY124"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["GEG212","BOT212","BOT213","ZOO213"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["GEG221","BOT222","BOT223","ZOO225"]},
    ],
    "40022": [
        {"key":"y1s1-elective","label":"Choose 16 first-year elective credits","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["PHY113","PHY114","GEG111","STA111","MAT112","BOT111","ZOO111"]},
        {"key":"y1s2-elective","label":"Choose 16 first-year elective credits","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["PHY123","PHY124","GEG121","STA121","MAT123","BOT121","ZOO121"]},
    ],
    "40026": [
        {"key":"y2s2-math-choice","label":"Choose MAT227 or MAT228","year":2,"semester":2,"min_modules":1,"min_credits":8,"options":["MAT227","MAT228"]},
        {"key":"y2s1-elective","label":"Choose MAP212 or PHY213 + PHY214","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["MAP212","PHY213","PHY214"]},
        {"key":"y2s2-elective","label":"Choose MAP222 or PHY223 + PHY224","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["MAP222","PHY223","PHY224"]},
        {"key":"y3s1-math-choice","label":"Choose MAT313 or MAT314","year":3,"semester":1,"min_modules":1,"min_credits":16,"options":["MAT313","MAT314"]},
        {"key":"y3s2-math-choice","label":"Choose MAT324 or MAT325","year":3,"semester":2,"min_modules":1,"min_credits":16,"options":["MAT324","MAT325"]},
    ],
    "40028": [
        {"key":"y2s1-stat-choice","label":"Choose STM213 or STM214","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["STM213","STM214"]},
        {"key":"y2s2-stat-choice","label":"Choose STM223 or STM224","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["STM223","STM224"]},
        {"key":"y2s2-math-choice","label":"Choose MAT227 or MAT228","year":2,"semester":2,"min_modules":1,"min_credits":8,"options":["MAT227","MAT228"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","PHY213","PHY214","MAP212"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","PHY223","PHY224","MAP222"]},
        {"key":"y3s1-math-choice","label":"Choose MAT313 or MAT314","year":3,"semester":1,"min_modules":1,"min_credits":16,"options":["MAT313","MAT314"]},
        {"key":"y3s2-math-choice","label":"Choose MAT324 or MAT325","year":3,"semester":2,"min_modules":1,"min_credits":16,"options":["MAT324","MAT325"]},
    ],
    "40033": [
        {"key":"y1s1-elective","label":"Choose 16 first-year elective credits","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["PHY111","PHY112","STA111","MAT111","BOT111","CSC113"]},
        {"key":"y1s2-elective","label":"Choose 16 first-year elective credits","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["PHY121","PHY122","STA121","MAT121","BOT121","CSC121"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","MAT212","MAT213","PHY213","PHY214","GEG212","BOT212","BOT213","STM213","STM214"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","MAT226","MAT227","PHY223","PHY224","GEG221","BOT222","BOT223","STM223","STM224"]},
    ],
    "40034": [
        {"key":"y1s1-elective","label":"Choose 16 first-year elective credits","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["PHY111","PHY112","STA111","MAT111","BOT111","CSC113"]},
        {"key":"y1s2-elective","label":"Choose 16 first-year elective credits","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["PHY121","PHY122","STA121","MAT121","BOT121","CSC121"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","MAT212","MAT213","PHY213","PHY214","GEG212","BOT212","BOT213","STM213","STM214"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","MAT226","MAT227","PHY223","PHY224","GEG221","BOT222","BOT223","STM223","STM224"]},
    ],
    "40035": [
        {"key":"y1s1-stream","label":"Choose STA111 or MNU111","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["STA111","MNU111"]},
        {"key":"y1s2-stream","label":"Choose STA121 or MNU121 + MNU122","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["STA121","MNU121","MNU122"]},
        {"key":"y2s2-math-choice","label":"Choose MAT227 or MAT228","year":2,"semester":2,"min_modules":1,"min_credits":8,"options":["MAT227","MAT228"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","PHY213","PHY214","STM213","STM214"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","PHY223","PHY224","STM223","STM224"]},
        {"key":"y3s1-math-choice","label":"Choose MAT313 or MAT314","year":3,"semester":1,"min_modules":1,"min_credits":16,"options":["MAT313","MAT314"]},
        {"key":"y3s2-math-choice","label":"Choose MAT324 or MAT325","year":3,"semester":2,"min_modules":1,"min_credits":16,"options":["MAT324","MAT325"]},
    ],
    "40036": [
        {"key":"y2s1-stat-choice","label":"Choose STM213 or STM214","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["STM213","STM214"]},
        {"key":"y2s2-stat-choice","label":"Choose STM223 or STM224","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["STM223","STM224"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","MAT212","MAT213","PHY213","PHY214"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","MAT226","MAT227","MAT228","PHY223","PHY224"]},
    ],
    "40037": [
        {"key":"y1s1-stream","label":"Choose STA111 or MNU111","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["STA111","MNU111"]},
        {"key":"y1s2-stream","label":"Choose STA121 or MNU121 + MNU122","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["STA121","MNU121","MNU122"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","MAT212","MAT213","STM213","STM214"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","MAT226","MAT227","MAT228","STM223","STM224"]},
    ],
    "40039": [
        {"key":"y2s1-electives","label":"Choose 32 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":32,"options":["PAC211","PAC215","BOT212","BOT213","ZOO213"]},
        {"key":"y2s2-electives","label":"Choose 32 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":32,"options":["PAC222","PAC224","BOT222","BOT223","ZOO224","ZOO225"]},
    ],
    "40040": [
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["BOT212","BOT213","MIC213","ZOO213"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["BOT222","BOT223","MIC223","ZOO224","ZOO225"]},
    ],
    "40041": [
        {"key":"y1s1-elective","label":"Choose BOT111 or ZOO111","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["BOT111","ZOO111"]},
        {"key":"y1s2-elective","label":"Choose BOT121 or ZOO121","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["BOT121","ZOO121"]},
        {"key":"y2s2-math-choice","label":"Choose MAT227 or MAT228","year":2,"semester":2,"min_modules":1,"min_credits":8,"options":["MAT227","MAT228"]},
        {"key":"y2s1-elective","label":"Choose Botany or Zoology elective stream","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["BOT212","BOT213","ZOO213"]},
        {"key":"y2s2-elective","label":"Choose Botany or Zoology elective stream","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["BOT222","BOT223","ZOO224","ZOO225"]},
    ],
    "40043": [
        {"key":"y1s1-elective","label":"Choose CSC113 or GLG111","year":1,"semester":1,"min_modules":1,"min_credits":16,"options":["CSC113","GLG111"]},
        {"key":"y1s2-elective","label":"Choose CSC121 or GLG121","year":1,"semester":2,"min_modules":1,"min_credits":16,"options":["CSC121","GLG121"]},
        {"key":"y2s1-elective","label":"Choose 16 second-year elective credits","year":2,"semester":1,"min_modules":1,"min_credits":16,"options":["COC211","COC212","MAT212","MAT213","GLG212"]},
        {"key":"y2s2-elective","label":"Choose 16 second-year elective credits","year":2,"semester":2,"min_modules":1,"min_credits":16,"options":["COC223","COC224","MAT226","MAT227","MAT228","GLG222"]},
    ]
}


# ---------- ALIASES ----------
# Maps old/alternative codes to the actual module codes in the database
ALIAS_CODES = {
    "CSC211": "COC211",
    "CSC212": "COC212",
    "CSC223": "COC223",
    "CSC224": "COC224",
}


def seed():
    print("Dropping and recreating all tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # ---------- Create Super Admin ----------
        print("Creating super admin account...")
        db.add(models.Admin(
            name="System Administrator",
            username="admin",
            hashed_password=hash_password("AdminPass123!"),
            is_active=True,
            is_super_admin=True,
            created_by_id=None,
        ))

        # ---------- Create Programmes ----------
        print("Creating programmes...")
        programme_by_code = {}
        for p in PROGRAMMES:
            programme = models.Programme(**p)
            db.add(programme)
            programme_by_code[p["code"]] = programme
        db.flush()

        # ---------- Create Modules ----------
        print("Creating modules...")
        module_by_code = {}
        for code, name, credits, category, level in MODULES:
            if code in module_by_code:
                continue
            module = models.Module(
                code=code,
                name=name,
                credits=credits,
                category=category,
                level=level,
                description=None
            )
            db.add(module)
            module_by_code[code] = module
        db.flush()

        # ---------- Link Prerequisites ----------
        print("Linking prerequisites...")
        for code, prereq_codes in PREREQUISITES.items():
            if code not in module_by_code:
                print(f"  Warning: Module {code} not found for prerequisites")
                continue
            resolved = []
            for p in prereq_codes:
                actual = ALIAS_CODES.get(p, p)
                if actual in module_by_code:
                    resolved.append(module_by_code[actual])
                else:
                    print(f"  Warning: Prerequisite {p} for {code} not found")
            if resolved:
                module_by_code[code].prerequisites = resolved
        db.flush()

        # ---------- Link Modules to Programmes (with duplicate prevention) ----------
        print("Linking modules to programmes...")
        added_pairs = set()

        for programme_code, groups in PROGRAMME_MODULES.items():
            programme = programme_by_code.get(programme_code)
            choice_codes = {
                ALIAS_CODES.get(code, code)
                for spec in REQUIREMENT_GROUPS.get(programme_code, [])
                for code in spec["options"]
            }
            if not programme:
                print(f"  Warning: Programme {programme_code} not found")
                continue

            # Process compulsory modules
            for code in groups.get("compulsory", []):
                actual_code = ALIAS_CODES.get(code, code)
                if actual_code not in module_by_code:
                    print(f"  Warning: Module {code} (-> {actual_code}) not found for programme {programme_code}")
                    continue

                module = module_by_code[actual_code]
                pair = (programme.id, module.id)
                if pair in added_pairs:
                    continue

                year, semester = curriculum_position(module)
                db.add(models.ProgrammeModule(
                    programme=programme,
                    module=module,
                    is_compulsory=(actual_code not in choice_codes),
                    year=year,
                    semester=semester,
                ))
                added_pairs.add(pair)

            # Process elective modules
            for code in groups.get("elective", []):
                actual_code = ALIAS_CODES.get(code, code)
                if actual_code not in module_by_code:
                    print(f"  Warning: Elective {code} (-> {actual_code}) not found for programme {programme_code}")
                    continue

                module = module_by_code[actual_code]
                pair = (programme.id, module.id)
                if pair in added_pairs:
                    continue

                year, semester = curriculum_position(module)
                db.add(models.ProgrammeModule(
                    programme=programme,
                    module=module,
                    is_compulsory=False,
                    year=year,
                    semester=semester,
                ))
                added_pairs.add(pair)

        db.flush()

        # ---------- Link Curriculum Choice Groups ----------
        print("Linking curriculum choice groups...")
        for programme_code, groups in REQUIREMENT_GROUPS.items():
            programme = programme_by_code.get(programme_code)
            if not programme:
                continue
            for spec in groups:
                group = models.ProgrammeRequirementGroup(
                    programme_id=programme.id,
                    key=spec["key"],
                    label=spec["label"],
                    year=spec["year"],
                    semester=spec["semester"],
                    min_modules=spec["min_modules"],
                    min_credits=spec["min_credits"],
                )
                db.add(group)
                db.flush()
                for code in spec["options"]:
                    actual_code = ALIAS_CODES.get(code, code)
                    module = module_by_code.get(actual_code)
                    if module:
                        db.add(models.ProgrammeRequirementOption(group_id=group.id, module_id=module.id))

        db.flush()

        # ---------- Set Total Credits ----------
        print("Setting total credits for programmes...")
        for programme in programme_by_code.values():
            programme.total_credits_required = 384

        # ---------- Create Demo Student ----------
        print("Creating demo student...")
        demo = models.Student(
            name="Thabo Mokoena",
            student_number="202312345",
            email="tmokoena@example.ufh.ac.za",
            pin_hash=hash_password("123456"),
            programme_id=programme_by_code["40025"].id,
            current_year=2,
            target_average=65.0,
        )
        db.add(demo)
        db.flush()

        # ---------- Add Some Completed Modules ----------
        print("Adding completed modules for demo student...")
        completed_modules = [
            ("CSC113", "2024-S1", 72),
            ("CSC121", "2024-S1", 68),
            ("MAT111", "2024-S1", 61),
            ("MAT121", "2024-S1", 58),
            ("COC211", "2024-S2", 74),
            ("COC212", "2024-S2", 66),
        ]
        for code, semester, grade in completed_modules:
            actual_code = ALIAS_CODES.get(code, code)
            if actual_code in module_by_code:
                db.add(models.Enrolment(
                    student=demo,
                    module=module_by_code[actual_code],
                    semester=semester,
                    grade=grade,
                    status="completed",
                    attempt=1,
                ))

        # Add a failed module
        if "COC223" in module_by_code:
            db.add(models.Enrolment(
                student=demo,
                module=module_by_code["COC223"],
                semester="2024-S2",
                grade=42,
                status="failed",
                attempt=1,
            ))

        db.commit()
        print("
✅ Seed complete!")
        print("
📋 Login credentials:")
        print("   Student: 202312345 / tmokoena@example.ufh.ac.za / PIN: 123456")
        print("   Admin:   admin / AdminPass123!")
        print("   (Admin is a super admin)")

    except Exception as e:
        db.rollback()
        print(f"
❌ Error during seeding: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()