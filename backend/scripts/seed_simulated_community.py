"""Seed clearly marked demo activity into simulated programme communities."""
import random
from datetime import datetime, timedelta

from app import models
from app.routers.community import ALL_YEARS_LEVEL, DEFAULT_CHANNELS

SIM_PREFIX = "SIM-"

MESSAGES = {
    "general": [
        "Welcome everyone 👋 Hope the semester is going well.",
        "Anyone else using the planner to organise this week's work?",
        "Good luck with your classes this week everyone!",
        "What study routine has been working well for you lately?",
        "Remember to take breaks between study sessions too.",
        "Nice to see our programme community getting active.",
    ],
    "study-help": [
        "A useful tip: split a big topic into smaller sections and revise one at a time.",
        "Has anyone started revising this week's material yet?",
        "Making a short summary after each lecture has been helping me revise.",
        "Practice questions are helping me find the topics I still need to review.",
        "Does anyone want to compare study strategies for the next assessment?",
        "I have been using the module planner to keep track of what to revise next.",
    ],
    "random": [
        "Hope everyone is having a good day 😄",
        "Quick check-in: how is everyone's week going?",
        "What music do you usually listen to while studying?",
        "Weekend is getting closer 🎉",
        "Sending good energy to everyone working through assignments.",
        "This channel is a nice break from all the studying 😂",
    ],
}
REPLIES = [
    "That sounds useful, thanks for sharing.",
    "Same here 👍",
    "Good idea!",
    "I might try that too.",
    "Definitely agree with this.",
]
EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉", "👏"]


def _ensure_community(db, programme_id: int, year_level: int):
    community = db.query(models.Community).filter(
        models.Community.programme_id == programme_id,
        models.Community.year_level == year_level,
    ).first()
    if community:
        return community

    community = models.Community(programme_id=programme_id, year_level=year_level)
    db.add(community)
    db.flush()
    for slug, name, description in DEFAULT_CHANNELS:
        db.add(models.CommunityChannel(
            community_id=community.id, slug=slug, name=name,
            description=description, is_active=True,
        ))
    db.flush()
    return community


def seed_activity_with_db(db, messages_per_channel: int = 5) -> dict:
    if not 1 <= messages_per_channel <= 10:
        raise ValueError("messages_per_channel must be between 1 and 10")

    simulated = db.query(models.Student).filter(
        models.Student.student_number.like(f"{SIM_PREFIX}%"),
        models.Student.is_active.is_(True),
    ).order_by(models.Student.programme_id, models.Student.current_year, models.Student.id).all()

    by_programme = {}
    for student in simulated:
        by_programme.setdefault(student.programme_id, []).append(student)

    created_messages = 0
    created_replies = 0
    created_reactions = 0
    communities_touched = 0
    now = datetime.utcnow()

    for programme_id, students in by_programme.items():
        years = sorted({s.current_year for s in students})
        scopes = years + [ALL_YEARS_LEVEL]

        for year_level in scopes:
            eligible = students if year_level == ALL_YEARS_LEVEL else [
                s for s in students if s.current_year == year_level
            ]
            if not eligible:
                continue

            community = _ensure_community(db, programme_id, year_level)
            db.flush()
            channels = db.query(models.CommunityChannel).filter(
                models.CommunityChannel.community_id == community.id,
                models.CommunityChannel.is_active.is_(True),
            ).all()
            communities_touched += 1

            for channel in channels:
                # Idempotency: only seed an empty channel.
                if db.query(models.CommunityMessage.id).filter(
                    models.CommunityMessage.channel_id == channel.id
                ).first():
                    continue

                templates = MESSAGES.get(channel.slug, MESSAGES["general"])
                rng = random.Random(programme_id * 100000 + year_level * 1000 + channel.id)
                count = min(messages_per_channel, len(templates))
                selected = rng.sample(templates, count)

                seeded = []
                for index, text in enumerate(selected):
                    author = eligible[index % len(eligible)]
                    message = models.CommunityMessage(
                        channel_id=channel.id,
                        student_id=author.id,
                        content=text,
                        created_at=now - timedelta(minutes=(count - index) * 11 + rng.randint(1, 8)),
                    )
                    db.add(message)
                    db.flush()
                    seeded.append(message)
                    created_messages += 1

                if len(seeded) >= 2 and len(eligible) >= 2:
                    parent = seeded[1]
                    reply_author = next((s for s in eligible if s.id != parent.student_id), eligible[0])
                    reply = models.CommunityMessage(
                        channel_id=channel.id,
                        student_id=reply_author.id,
                        parent_message_id=parent.id,
                        content=rng.choice(REPLIES),
                        created_at=parent.created_at + timedelta(minutes=3),
                    )
                    db.add(reply)
                    db.flush()
                    created_replies += 1

                for message in seeded:
                    candidates = [s for s in eligible if s.id != message.student_id]
                    rng.shuffle(candidates)
                    for reactor in candidates[:min(3, len(candidates))]:
                        db.add(models.CommunityReaction(
                            message_id=message.id,
                            student_id=reactor.id,
                            emoji=rng.choice(EMOJIS),
                        ))
                        created_reactions += 1

    db.flush()
    return {
        "programmes": len(by_programme),
        "communities": communities_touched,
        "messages_created": created_messages,
        "replies_created": created_replies,
        "reactions_created": created_reactions,
        "messages_per_channel": messages_per_channel,
    }
