from datetime import datetime

from app import models
from app.database import SessionLocal, engine


models.Base.metadata.create_all(bind=engine)


SI_FACILITATORS = [
    {
        "name": "Boikano Lesufi",
        "module_assignment": "PHY 111F / PHY 122F",
        "session_time": "Mon: 16:30-18:00",
        "consultation_time": "Fri: 10:30-12:00",
    },
    {
        "name": "Bongiwe Dhladhla",
        "module_assignment": "MAT 111F / MAT 121F",
        "session_time": "Tue: 11:30-12:45",
        "consultation_time": "13:30-14:30 (day not given)",
    },
    {
        "name": "Bukho Mangcobo",
        "module_assignment": "ECO 111 / ECO 121",
        "session_time": "Thu: 11:30-12:45",
        "consultation_time": "Fri: 10:00-11:00",
    },
    {
        "name": "Joel Vuyo Ngwenya",
        "module_assignment": "PCL 111 / PCL 121",
        "session_time": "Mon: 14:00-14:45; Thu: 11:00-11:45",
        "consultation_time": "Fri: 11:00-13:00",
    },
    {
        "name": "Khangelani Makasi",
        "module_assignment": "FAS 121",
        "session_time": "Thu: 14:00",
        "consultation_time": "Fri: 15:00",
    },
    {
        "name": "Luphumezo Ngcetane",
        "module_assignment": "PSY 111F",
        "session_time": "Wed: 11:20-12:55 (Psychology Building)",
        "consultation_time": "Wed: 13:00-14:00",
    },
    {
        "name": "Luyanda Sithole",
        "module_assignment": "PHL 111 / PHL 126",
        "session_time": "Fri: 11:00-13:00",
        "consultation_time": "Thu: 13:00-15:00",
    },
    {
        "name": "Shelly Kidane",
        "module_assignment": "ECO 111F / ECO 121F",
        "session_time": "Thu: 11:30-13:00",
        "consultation_time": "Thu: 15:30-17:00",
    },
    {
        "name": "Simbulele Tshemese",
        "module_assignment": "AGC 111 / AGC 122",
        "session_time": "Wed: 17:00-18:30",
        "consultation_time": "Thu: 10:00-11:00",
    },
    {
        "name": "Siyanda Lwana",
        "module_assignment": "IPS 111F / IPS 121F",
        "session_time": "Mon: 16:00-17:30",
        "consultation_time": "Tue: 10:30-11:20",
    },
    {
        "name": "Lwandile Mtsweni",
        "module_assignment": "CLT 111 / IFS 121",
        "session_time": "Wed: 13:30-15:00",
        "consultation_time": "Fri: 12:00-13:00",
    },
    {
        "name": "Mandisa Makhathini",
        "module_assignment": "BOT 211 / BOT 221",
        "session_time": "Mon & Fri: 10:30",
        "consultation_time": "Tue: 10:30; Thu: 11:20",
    },
    {
        "name": "Mishael Kwaku Yeboah",
        "module_assignment": "CSC111F / CSC121F",
        "session_time": "Tue: 10:30-12:05",
        "consultation_time": "Fri: 10:30-12:05",
    },
    {
        "name": "Mpilwenhle Jubane",
        "module_assignment": "MAT 111",
        "session_time": "Tue: 08:00-08:45; Wed: 11:20-12:05",
        "consultation_time": "Tue: 14:00-15:30",
    },
    {
        "name": "Yonela Natacia Somi",
        "module_assignment": "ACG 111 / ACG 121",
        "session_time": "Tue: 09:40-11:10 (Psychology Building)",
        "consultation_time": "Fri: 13:00-14:30",
    },
    {
        "name": "Ngcebo Bhengu",
        "module_assignment": "PHY 113/114 / PHY 123 & PHY 124",
        "session_time": "Fri: 11:20-12:55",
        "consultation_time": "Wed: 11:20-12:55",
    },
    {
        "name": "Siziphiwe Qokoyi",
        "module_assignment": "ESP 111 / ESP 122",
        "session_time": "Tue: 16:00-17:30",
        "consultation_time": "Mon: 13:00-14:00",
    },
    {
        "name": "Miya Thembani",
        "module_assignment": "PHY 112 / PHY 122",
        "session_time": "Wed: 11:40",
        "consultation_time": "Wed: 14:00",
    },
    {
        "name": "Ukho Jokazi",
        "module_assignment": "ESP 111 / ESP 122",
        "session_time": "Mon & Wed: 16:30-17:30",
        "consultation_time": "12:00-13:00 (day not given)",
    },
    {
        "name": "Ntando Kedama",
        "module_assignment": "PUB 214 / PUB 224",
        "session_time": "Fri: 16:00-17:30",
        "consultation_time": "Tue: 13:00-14:00",
    },
    {
        "name": "Nthabiseng Molele",
        "module_assignment": "ESP 111 / ESP 122",
        "session_time": "Fri: 13:00-14:30",
        "consultation_time": "Mon: 14:00-15:00",
    },
    {
        "name": "Odwa Ndlala",
        "module_assignment": "PHL 111F / PHL 125F",
        "session_time": "17:00-18:30 (day not given)",
        "consultation_time": "Fri: 13:00-14:00",
    },
    {
        "name": "Redeem Mandevha",
        "module_assignment": "SI Assistant",
        "session_time": None,
        "consultation_time": None,
        "is_assistant": True,
    },
    {
        "name": "Reoletile Segooa",
        "module_assignment": "MAT 111F / MAT 121F",
        "session_time": "Mon: 14:00-15:30",
        "consultation_time": "Thu: 13:00-14:30",
    },
    {
        "name": "Samkelo Mngqibisa",
        "module_assignment": "PAC 110 / PAC 121",
        "session_time": "Mon & Tue: 13:00-13:45",
        "consultation_time": "Wed & Thu: 13:00-13:45",
    },
    {
        "name": "Uzusiphe Vuzane",
        "module_assignment": "SI Assistant",
        "session_time": None,
        "consultation_time": None,
        "is_assistant": True,
    },
    {
        "name": "Vuyo Nofotyela",
        "module_assignment": "HSH 211 / HSH 221",
        "session_time": "Thu: 14:30-16:00",
        "consultation_time": "Fri: 13:00-13:45",
    },
    {
        "name": "Xolelwa Mpikwa",
        "module_assignment": "TFN 111 / STD 121",
        "session_time": "Thu: 14:30-15:15; Fri: 10:40-11:25",
        "consultation_time": "Mon: 11:30-12:30; Wed: 12:00-13:00",
    },
    {
        "name": "Bandile Yolwa",
        "module_assignment": "MSM 121",
        "session_time": "Thu: 11:40-13:20",
        "consultation_time": "Thu: 14:00-14:45",
    },
]


ELEP_FACILITATORS = [
    {
        "name": "Angel Aphane",
        "module_assignment": "STA 111 / STA 121 & 122",
        "session_time": "Wed: 17:00-18:30",
        "consultation_time": "Wed: 15:00-16:30",
    },
    {
        "name": "Asenathi Kondleka",
        "module_assignment": "ZOO 212",
        "session_time": "Mon: 15:00-16:30",
        "consultation_time": "Thu: 14:00-15:30",
    },
    {
        "name": "Banele Ntombela",
        "module_assignment": "ELEP Assistant",
        "session_time": None,
        "consultation_time": None,
        "is_assistant": True,
    },
    {
        "name": "Esabell Mahlangu",
        "module_assignment": "BEC 111 / BEC 121",
        "session_time": "Wed: 17:30-19:00",
        "consultation_time": "Mon: 14:00-15:00",
    },
    {
        "name": "Ignatia Lesego Khabo",
        "module_assignment": "ELEP Assistant",
        "session_time": None,
        "consultation_time": None,
        "is_assistant": True,
    },
    {
        "name": "Khanya Mudau",
        "module_assignment": "ECO 111F / ECO 121F",
        "session_time": "Tue: 09:40-11:10",
        "consultation_time": "Wed: 09:40-11:10",
    },
    {
        "name": "Juliet Kgagara",
        "module_assignment": "ECO 211 / ECO 221",
        "session_time": "Wed: 17:00-18:30",
        "consultation_time": "Fri: 12:00-13:30",
    },
    {
        "name": "Khanya Ntshinga",
        "module_assignment": "ACG 211",
        "session_time": "Mon: 17:00-18:30",
        "consultation_time": "Fri: 12:00-13:30",
    },
    {
        "name": "Lelethu Yekela",
        "module_assignment": "ACG 111 / ACG 121",
        "session_time": "Wed: 13:00-13:45",
        "consultation_time": "Thu: 10:45-11:30",
    },
    {
        "name": "Lunga Ngaka",
        "module_assignment": "MAP 211 / MAP 221",
        "session_time": "Tue: 14:00-15:30",
        "consultation_time": "Fri: 15:00-16:00",
    },
    {
        "name": "Luxolo Luvalo",
        "module_assignment": "MAT 212 & 223",
        "session_time": "Thu: 11:00-13:00",
        "consultation_time": "13:00-15:00 (day not given)",
    },
    {
        "name": "Sange Liyema Mtsi",
        "module_assignment": "HUS 112 / HUS 122",
        "session_time": "Fri: 13:40-15:10",
        "consultation_time": "Wed: 15:00-16:00",
    },
    {
        "name": "Simthandile Mamlambo",
        "module_assignment": "HUS 216 / HUS 226",
        "session_time": "Wed & Fri: 15:00-15:55",
        "consultation_time": "Wed: 10:30-11:30",
    },
    {
        "name": "Sinentlahla Siyephu",
        "module_assignment": "LSC 311",
        "session_time": "Wed: 16:00-17:30",
        "consultation_time": "Mon & Fri: 14:00-16:00",
    },
    {
        "name": "Sisipho Ranthaka",
        "module_assignment": "PHL 111F / PHL 125F",
        "session_time": "Fri: 17:00-18:30",
        "consultation_time": "Mon: 12:30-13:30 & 15:30-16:00",
    },
    {
        "name": "Siyamthanda Lombo",
        "module_assignment": "PSY 111 / PSY 122",
        "session_time": "Fri: 16:00-17:30",
        "consultation_time": "Thu: 10:00-11:00",
    },
    {
        "name": "Sinethemba Fuyizilo",
        "module_assignment": "HUS 227",
        "session_time": "Mon: 11:20-12:05; Fri: 10:30-11:15",
        "consultation_time": "Thu: 11:00-12:00",
    },
    {
        "name": "Sharon Bila",
        "module_assignment": "PHY 111",
        "session_time": "Fri: 13:00-14:30",
        "consultation_time": "Tue: 13:00-14:30",
    },
    {
        "name": "Netshilungwi Matamela",
        "module_assignment": "HUS 228",
        "session_time": "Wed: 10:00-11:30",
        "consultation_time": "Fri: 14:00-15:00",
    },
]


def seed_group(
    db,
    programme_type: str,
    records: list[dict],
):
    created = 0
    updated = 0

    for item in records:
        facilitator = (
            db.query(models.Facilitator)
            .filter(
                models.Facilitator.name
                == item["name"],
                models.Facilitator.programme_type
                == programme_type,
            )
            .first()
        )

        values = {
            "name": item["name"],
            "programme_type": programme_type,
            "module_assignment": (
                item["module_assignment"]
            ),
            "campus": "Alice",
            "session_time": (
                item.get("session_time")
            ),
            "consultation_time": (
                item.get("consultation_time")
            ),
            "is_assistant": (
                item.get(
                    "is_assistant",
                    False,
                )
            ),
            "is_active": True,
            "verified_at": datetime.utcnow(),
        }

        if facilitator is None:
            facilitator = (
                models.Facilitator(**values)
            )

            db.add(facilitator)
            created += 1

        else:
            for field, value in values.items():
                setattr(
                    facilitator,
                    field,
                    value,
                )

            updated += 1

    return created, updated


def main():
    db = SessionLocal()

    try:
        si_created, si_updated = (
            seed_group(
                db,
                "SI",
                SI_FACILITATORS,
            )
        )

        elep_created, elep_updated = (
            seed_group(
                db,
                "ELEP",
                ELEP_FACILITATORS,
            )
        )

        db.commit()

        print(
            "Facilitator seed complete."
        )

        print(
            f"SI: {si_created} created, "
            f"{si_updated} updated"
        )

        print(
            f"ELEP: {elep_created} created, "
            f"{elep_updated} updated"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()