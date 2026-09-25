from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models
from app.database import get_db
from app.dependencies import get_current_student
from app.services import progress_service

router = APIRouter(prefix="/rewards", tags=["XP Rewards"])

REWARD_CATALOG = [
    {"id": "title-rising-scholar", "name": "Rising Scholar", "description": "Equip a scholar title on your GCT profile.", "category": "title", "cost_xp": 250, "icon": "🎓", "min_level": 1},
    {"id": "title-credit-hunter", "name": "Credit Hunter", "description": "Show that you are chasing every credit.", "category": "title", "cost_xp": 450, "icon": "⚡", "min_level": 2},
    {"id": "title-study-strategist", "name": "Study Strategist", "description": "A title for students who plan ahead.", "category": "title", "cost_xp": 700, "icon": "🧠", "min_level": 3},
    {"id": "title-campus-scholar", "name": "Campus Scholar", "description": "A prestigious academic community title.", "category": "title", "cost_xp": 1100, "icon": "🏛️", "min_level": 4},
    {"id": "title-graduation-master", "name": "Graduation Master", "description": "A high-level graduation journey title.", "category": "title", "cost_xp": 1800, "icon": "👑", "min_level": 5},
    {"id": "theme-ocean", "name": "Ocean Focus", "description": "Unlock an ocean-inspired profile theme.", "category": "theme", "cost_xp": 400, "icon": "🌊", "min_level": 2},
    {"id": "theme-violet", "name": "Violet Scholar", "description": "Unlock a violet profile theme.", "category": "theme", "cost_xp": 650, "icon": "💜", "min_level": 3},
    {"id": "theme-gold", "name": "Fort Hare Gold", "description": "Unlock a premium gold profile theme.", "category": "theme", "cost_xp": 1200, "icon": "✨", "min_level": 4},
    {"id": "frame-scholar", "name": "Scholar Frame", "description": "A clean frame for your community profile.", "category": "frame", "cost_xp": 500, "icon": "🖼️", "min_level": 2},
    {"id": "frame-legend", "name": "Legend Frame", "description": "A premium animated prestige frame for top progress.", "category": "frame", "cost_xp": 5000, "icon": "💫", "min_level": 8},
    {"id": "marcel-classic", "name": "Classic Marcel", "description": "Classic Marcel visual theme and concise response style.", "category": "marcel", "cost_xp": 300, "icon": "🤖", "min_level": 1},
    {"id": "marcel-scholar", "name": "Scholar Marcel", "description": "Give Marcel a scholar-themed presentation.", "category": "marcel", "cost_xp": 900, "icon": "📚", "min_level": 3},
    {"id": "marcel-graduation", "name": "Graduation Marcel", "description": "A graduation-themed Marcel cosmetic.", "category": "marcel", "cost_xp": 1600, "icon": "🎓", "min_level": 5},

    # More titles
    {"id": "title-module-master", "name": "Module Master", "description": "A title for students steadily conquering their modules.", "category": "title", "cost_xp": 900, "icon": "📘", "min_level": 3},
    {"id": "title-prerequisite-pro", "name": "Prerequisite Pro", "description": "Show off your smart academic planning.", "category": "title", "cost_xp": 1350, "icon": "🧩", "min_level": 4},
    {"id": "title-credit-commander", "name": "Credit Commander", "description": "A prestige title for serious credit progress.", "category": "title", "cost_xp": 2200, "icon": "⚔️", "min_level": 6},
    {"id": "title-knowledge-sharer", "name": "Knowledge Sharer", "description": "Celebrate meaningful contributions to the student community.", "category": "title", "cost_xp": 2600, "icon": "🤝", "min_level": 7},
    {"id": "title-fort-hare-legend", "name": "Fort Hare Legend", "description": "One of the highest prestige titles in GCT.", "category": "title", "cost_xp": 6500, "icon": "🦁", "min_level": 12},

    # More profile themes
    {"id": "theme-emerald", "name": "Emerald Focus", "description": "A calm green study-inspired Community profile theme.", "category": "theme", "cost_xp": 550, "icon": "🌿", "min_level": 2},
    {"id": "theme-midnight", "name": "Midnight Scholar", "description": "A deep midnight profile theme for focused scholars.", "category": "theme", "cost_xp": 950, "icon": "🌙", "min_level": 4},
    {"id": "theme-sunset", "name": "Sunset Campus", "description": "A warm sunset-inspired Community profile theme.", "category": "theme", "cost_xp": 1400, "icon": "🌅", "min_level": 5},
    {"id": "theme-royal", "name": "Royal Scholar", "description": "A premium royal profile look for advanced students.", "category": "theme", "cost_xp": 2400, "icon": "👑", "min_level": 7},
    {"id": "theme-legend", "name": "Legendary Gold", "description": "An elite gold-and-dark prestige profile theme.", "category": "theme", "cost_xp": 4500, "icon": "🏆", "min_level": 10},

    # More profile frames
    {"id": "frame-focus", "name": "Focus Frame", "description": "A clean study-focused Community profile frame.", "category": "frame", "cost_xp": 750, "icon": "🎯", "min_level": 3},
    {"id": "frame-campus", "name": "Campus Frame", "description": "A polished frame inspired by campus achievement.", "category": "frame", "cost_xp": 1250, "icon": "🏛️", "min_level": 4},
    {"id": "frame-honours", "name": "Honours Frame", "description": "A premium frame for high-level GCT progression.", "category": "frame", "cost_xp": 2100, "icon": "🏅", "min_level": 6},
    {"id": "frame-lion", "name": "Lion Pride Frame", "description": "A bold Fort Hare-inspired prestige frame.", "category": "frame", "cost_xp": 3500, "icon": "🦁", "min_level": 8},
    {"id": "frame-master", "name": "Graduation Master Frame", "description": "An elite animated-style frame for advanced students.", "category": "frame", "cost_xp": 7000, "icon": "🌟", "min_level": 11},

    # More Marcel cosmetics / personalities
    {"id": "marcel-focus", "name": "Focus Marcel", "description": "A focused Marcel style for concise study-oriented guidance.", "category": "marcel", "cost_xp": 650, "icon": "🎯", "min_level": 2},
    {"id": "marcel-night", "name": "Midnight Marcel", "description": "A midnight visual style with calm, structured responses.", "category": "marcel", "cost_xp": 1200, "icon": "🌙", "min_level": 4},
    {"id": "marcel-coach", "name": "Coach Marcel", "description": "A motivating study-coach presentation that keeps academic advice grounded.", "category": "marcel", "cost_xp": 2100, "icon": "📣", "min_level": 6},
    {"id": "marcel-legend", "name": "Legend Marcel", "description": "A premium Marcel cosmetic for high-level students.", "category": "marcel", "cost_xp": 4200, "icon": "✨", "min_level": 9},
    {"id": "marcel-lion", "name": "Lion Marcel", "description": "A Fort Hare-inspired prestige Marcel cosmetic.", "category": "marcel", "cost_xp": 6500, "icon": "🦁", "min_level": 12},

    # Extra titles
    {"id": "title-study-streak", "name": "Study Streak", "description": "A bright title for students building steady academic momentum.", "category": "title", "cost_xp": 600, "icon": "🔥", "min_level": 2},
    {"id": "title-goal-getter", "name": "Goal Getter", "description": "For students who keep moving toward their graduation goals.", "category": "title", "cost_xp": 1050, "icon": "🎯", "min_level": 4},
    {"id": "title-campus-mentor", "name": "Campus Mentor", "description": "A community-minded prestige title.", "category": "title", "cost_xp": 1750, "icon": "🫱🏽‍🫲🏾", "min_level": 5},
    {"id": "title-academic-vanguard", "name": "Academic Vanguard", "description": "A high-tier title for advanced GCT progression.", "category": "title", "cost_xp": 3200, "icon": "🛡️", "min_level": 9},
    {"id": "title-lions-pride", "name": "Lion's Pride", "description": "A premium Fort Hare-inspired community title.", "category": "title", "cost_xp": 5000, "icon": "🦁", "min_level": 11},

    # Extra themes
    {"id": "theme-sky", "name": "Sky Scholar", "description": "A light sky-inspired profile theme.", "category": "theme", "cost_xp": 700, "icon": "☁️", "min_level": 3},
    {"id": "theme-forest", "name": "Forest Focus", "description": "A rich forest-inspired profile theme.", "category": "theme", "cost_xp": 1100, "icon": "🌲", "min_level": 4},
    {"id": "theme-rose", "name": "Rose Quartz", "description": "A soft rose-inspired Community profile theme.", "category": "theme", "cost_xp": 1600, "icon": "🌸", "min_level": 5},
    {"id": "theme-cosmic", "name": "Cosmic Scholar", "description": "A deep cosmic prestige profile theme.", "category": "theme", "cost_xp": 2900, "icon": "🌌", "min_level": 8},
    {"id": "theme-lion", "name": "Lion Pride", "description": "A premium blue-and-gold Fort Hare-inspired theme.", "category": "theme", "cost_xp": 5200, "icon": "🦁", "min_level": 11},

    # Extra frames
    {"id": "frame-spark", "name": "Spark Frame", "description": "A bright starter prestige frame.", "category": "frame", "cost_xp": 650, "icon": "⚡", "min_level": 2},
    {"id": "frame-book", "name": "Knowledge Frame", "description": "A book-inspired frame for dedicated learners.", "category": "frame", "cost_xp": 1000, "icon": "📚", "min_level": 4},
    {"id": "frame-diamond", "name": "Diamond Scholar Frame", "description": "A crisp premium frame for accomplished students.", "category": "frame", "cost_xp": 2800, "icon": "💎", "min_level": 7},
    {"id": "frame-cosmic", "name": "Cosmic Frame", "description": "A glowing cosmic frame for high-level profiles.", "category": "frame", "cost_xp": 4600, "icon": "🌌", "min_level": 10},
    {"id": "frame-ultimate", "name": "Ultimate Scholar Frame", "description": "One of GCT's rarest profile frames.", "category": "frame", "cost_xp": 8500, "icon": "👑", "min_level": 12},

    # Extra Marcel styles
    {"id": "marcel-calm", "name": "Calm Marcel", "description": "A relaxed Marcel style with clear, measured explanations.", "category": "marcel", "cost_xp": 800, "icon": "🧘", "min_level": 3},
    {"id": "marcel-strategist", "name": "Strategist Marcel", "description": "A planning-focused Marcel presentation for structured guidance.", "category": "marcel", "cost_xp": 1450, "icon": "🧠", "min_level": 5},
    {"id": "marcel-campus", "name": "Campus Marcel", "description": "A friendly campus-inspired Marcel style.", "category": "marcel", "cost_xp": 2500, "icon": "🏛️", "min_level": 7},
    {"id": "marcel-cosmic", "name": "Cosmic Marcel", "description": "A premium cosmic Marcel visual style.", "category": "marcel", "cost_xp": 4800, "icon": "🌌", "min_level": 10},
    {"id": "marcel-master", "name": "Master Marcel", "description": "The highest-tier Marcel cosmetic in the rewards collection.", "category": "marcel", "cost_xp": 8000, "icon": "👑", "min_level": 12},
]
CATALOG = {item["id"]: item for item in REWARD_CATALOG}


def _wallet(db: Session, student: models.Student):
    summary = progress_service.get_achievement_summary(db, student)
    current_xp = int(summary.get("total_xp") or 0)
    wallet = db.query(models.StudentRewardWallet).filter(models.StudentRewardWallet.student_id == student.id).first()
    if wallet is None:
        wallet = models.StudentRewardWallet(student_id=student.id, lifetime_xp=current_xp, spent_xp=0)
        db.add(wallet)
        db.flush()
    elif current_xp > wallet.lifetime_xp:
        wallet.lifetime_xp = current_xp
    db.commit()
    db.refresh(wallet)
    return wallet, summary


def _state(db: Session, student: models.Student):
    wallet, summary = _wallet(db, student)
    purchases = db.query(models.StudentRewardPurchase).filter(models.StudentRewardPurchase.student_id == student.id).all()
    owned = {row.reward_id: row for row in purchases}
    level_info = progress_service._get_achievement_level(wallet.lifetime_xp)
    level = int(level_info.get("level") or 1)
    rewards = []
    for item in REWARD_CATALOG:
        row = owned.get(item["id"])
        rewards.append({
            **item,
            "owned": row is not None,
            "equipped": bool(row and row.is_equipped),
            "level_unlocked": level >= item["min_level"],
        })
    return {
        "lifetime_xp": wallet.lifetime_xp,
        "spent_xp": wallet.spent_xp,
        "available_xp": max(wallet.lifetime_xp - wallet.spent_xp, 0),
        "level": level,
        "level_title": level_info.get("level_title"),
        "community_xp": sum(
            amount or 0
            for (amount,) in db.query(models.StudentXpEvent.xp_amount).filter(
                models.StudentXpEvent.student_id == student.id
            ).all()
        ),
        "showcase": [
            row.achievement_id
            for row in db.query(models.StudentAchievementShowcase).filter(
                models.StudentAchievementShowcase.student_id == student.id
            ).order_by(models.StudentAchievementShowcase.position.asc()).all()
        ],
        "rewards": rewards,
        "equipped": {row.category: row.reward_id for row in purchases if row.is_equipped},
    }


@router.get("")
def get_rewards(current_student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    return _state(db, current_student)


@router.post("/{reward_id}/purchase")
def purchase_reward(reward_id: str, current_student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    reward = CATALOG.get(reward_id)
    if reward is None:
        raise HTTPException(status_code=404, detail="Reward not found")
    wallet, summary = _wallet(db, current_student)
    level = int(progress_service._get_achievement_level(wallet.lifetime_xp).get("level") or 1)
    if level < reward["min_level"]:
        raise HTTPException(status_code=400, detail=f"Reach Level {reward['min_level']} to unlock this reward")
    exists = db.query(models.StudentRewardPurchase).filter(
        models.StudentRewardPurchase.student_id == current_student.id,
        models.StudentRewardPurchase.reward_id == reward_id,
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail="You already own this reward")
    available = wallet.lifetime_xp - wallet.spent_xp
    if available < reward["cost_xp"]:
        raise HTTPException(status_code=400, detail=f"You need {reward['cost_xp'] - available} more XP")
    wallet.spent_xp += reward["cost_xp"]
    db.add(models.StudentRewardPurchase(
        student_id=current_student.id,
        reward_id=reward_id,
        category=reward["category"],
        cost_xp=reward["cost_xp"],
    ))
    db.commit()
    return _state(db, current_student)


@router.post("/{reward_id}/equip")
def equip_reward(reward_id: str, current_student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    row = db.query(models.StudentRewardPurchase).filter(
        models.StudentRewardPurchase.student_id == current_student.id,
        models.StudentRewardPurchase.reward_id == reward_id,
    ).first()
    if row is None:
        raise HTTPException(status_code=400, detail="Purchase this reward before equipping it")
    db.query(models.StudentRewardPurchase).filter(
        models.StudentRewardPurchase.student_id == current_student.id,
        models.StudentRewardPurchase.category == row.category,
    ).update({"is_equipped": False}, synchronize_session=False)
    row.is_equipped = True
    db.commit()
    return _state(db, current_student)


@router.post("/{reward_id}/unequip")
def unequip_reward(reward_id: str, current_student: models.Student = Depends(get_current_student), db: Session = Depends(get_db)):
    row = db.query(models.StudentRewardPurchase).filter(
        models.StudentRewardPurchase.student_id == current_student.id,
        models.StudentRewardPurchase.reward_id == reward_id,
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="Reward not owned")
    row.is_equipped = False
    db.commit()
    return _state(db, current_student)


@router.put("/showcase")
def update_showcase(
    achievement_ids: list[str],
    current_student: models.Student = Depends(get_current_student),
    db: Session = Depends(get_db),
):
    unique_ids = list(dict.fromkeys(achievement_ids))
    if len(unique_ids) > 3:
        raise HTTPException(status_code=400, detail="You can showcase up to 3 achievements")

    summary = progress_service.get_achievement_summary(db, current_student)
    unlocked = {item["id"] for item in summary.get("achievements", []) if item.get("unlocked")}
    invalid = [item for item in unique_ids if item not in unlocked]
    if invalid:
        raise HTTPException(status_code=400, detail="Only unlocked achievements can be showcased")

    db.query(models.StudentAchievementShowcase).filter(
        models.StudentAchievementShowcase.student_id == current_student.id
    ).delete(synchronize_session=False)
    for position, achievement_id in enumerate(unique_ids, start=1):
        db.add(models.StudentAchievementShowcase(
            student_id=current_student.id,
            achievement_id=achievement_id,
            position=position,
        ))
    db.commit()
    return _state(db, current_student)
