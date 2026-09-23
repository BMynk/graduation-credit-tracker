# app/routers/community.py

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_student
from app.rate_limit import limiter

router = APIRouter(prefix="/community", tags=["Community"])

DEFAULT_CHANNELS = (
    ("general", "General", "Talk with students in your community."),
    ("study-help", "Study Help", "Ask questions, share study tips, and help classmates."),
    ("random", "Random", "Relax, chat, and have fun with your classmates."),
)

ALL_YEARS_LEVEL = 0


def _get_or_create_community(
    db: Session,
    student: models.Student,
    year_level: int | None = None,
) -> models.Community:
    target_year = student.current_year if year_level is None else year_level
    community = (
        db.query(models.Community)
        .filter(
            models.Community.programme_id == student.programme_id,
            models.Community.year_level == target_year,
        )
        .first()
    )

    if community is None:
        community = models.Community(
            programme_id=student.programme_id,
            year_level=target_year,
        )
        db.add(community)
        db.flush()

        for slug, name, description in DEFAULT_CHANNELS:
            db.add(
                models.CommunityChannel(
                    community_id=community.id,
                    slug=slug,
                    name=name,
                    description=description,
                )
            )

        try:
            db.commit()
            db.refresh(community)
        except IntegrityError:
            # Two first-time requests for the same programme/year can race.
            # The database unique constraint decides the winner; the other
            # request rolls back and safely loads the community that won.
            db.rollback()
            community = (
                db.query(models.Community)
                .filter(
                    models.Community.programme_id == student.programme_id,
                    models.Community.year_level == target_year,
                )
                .first()
            )
            if community is None:
                raise

    return community


def _student_channel(db: Session, student: models.Student, channel_id: int):
    channel = (
        db.query(models.CommunityChannel)
        .join(models.Community)
        .filter(
            models.CommunityChannel.id == channel_id,
            models.Community.programme_id == student.programme_id,
            models.Community.year_level.in_([student.current_year, ALL_YEARS_LEVEL]),
            models.CommunityChannel.is_active.is_(True),
        )
        .first()
    )
    if channel is None:
        raise HTTPException(status_code=404, detail="Community channel not found")
    return channel.community, channel


def _message_out(message: models.CommunityMessage, current_student_id: int):
    return schemas.CommunityMessageOut(
        id=message.id,
        channel_id=message.channel_id,
        content=None if message.is_deleted else message.content,
        is_deleted=message.is_deleted,
        created_at=message.created_at,
        edited_at=message.edited_at,
        parent_message_id=message.parent_message_id,
        author=schemas.CommunityAuthorOut(
            id=message.student.id,
            name=message.student.name,
            current_year=message.student.current_year,
            is_simulated=message.student.student_number.startswith("SIM-"),
        ),
        reactions=[
            schemas.CommunityReactionSummary(
                emoji=emoji,
                count=len(items),
                reacted_by_me=any(r.student_id == current_student_id for r in items),
            )
            for emoji, items in _group_reactions(message.reactions).items()
        ],
    )


def _group_reactions(reactions):
    grouped = {}
    for reaction in reactions:
        grouped.setdefault(reaction.emoji, []).append(reaction)
    return grouped


@router.get("/me", response_model=schemas.CommunityOut)
def get_my_community(
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    community = _get_or_create_community(db, current_student)
    db.refresh(community)
    return schemas.CommunityOut(
        id=community.id,
        year_level=community.year_level,
        programme_code=current_student.programme.code,
        programme_name=current_student.programme.name,
        channels=[
            schemas.CommunityChannelOut.model_validate(channel)
            for channel in community.channels
            if channel.is_active
        ],
    )


@router.get("/all-years", response_model=schemas.CommunityOut)
def get_programme_community(
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    community = _get_or_create_community(db, current_student, ALL_YEARS_LEVEL)
    db.refresh(community)
    return schemas.CommunityOut(
        id=community.id,
        year_level=community.year_level,
        programme_code=current_student.programme.code,
        programme_name=current_student.programme.name,
        channels=[
            schemas.CommunityChannelOut.model_validate(channel)
            for channel in community.channels
            if channel.is_active
        ],
    )


@router.get("/channels/{channel_id}/messages", response_model=list[schemas.CommunityMessageOut])
def list_messages(
    channel_id: int,
    limit: int = Query(default=50, ge=1, le=100),
    before_id: int | None = Query(default=None, ge=1),
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    _, channel = _student_channel(db, current_student, channel_id)
    query = (
        db.query(models.CommunityMessage)
        .options(
            joinedload(models.CommunityMessage.student),
            joinedload(models.CommunityMessage.reactions),
        )
        .filter(models.CommunityMessage.channel_id == channel.id)
    )
    if before_id is not None:
        query = query.filter(models.CommunityMessage.id < before_id)

    messages = query.order_by(models.CommunityMessage.id.desc()).limit(limit).all()
    messages.reverse()
    return [_message_out(message, current_student.id) for message in messages]


@router.post(
    "/channels/{channel_id}/messages",
    response_model=schemas.CommunityMessageOut,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("15/minute")
def create_message(
    request: Request,
    channel_id: int,
    payload: schemas.CommunityMessageCreate,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    _, channel = _student_channel(db, current_student, channel_id)

    parent = None
    if payload.parent_message_id is not None:
        parent = (
            db.query(models.CommunityMessage)
            .filter(
                models.CommunityMessage.id == payload.parent_message_id,
                models.CommunityMessage.channel_id == channel.id,
            )
            .first()
        )
        if parent is None:
            raise HTTPException(status_code=400, detail="Reply target is not in this channel")

    message = models.CommunityMessage(
        channel_id=channel.id,
        student_id=current_student.id,
        content=payload.content.strip(),
        parent_message_id=parent.id if parent else None,
    )
    db.add(message)
    db.commit()

    message = (
        db.query(models.CommunityMessage)
        .options(
            joinedload(models.CommunityMessage.student),
            joinedload(models.CommunityMessage.reactions),
        )
        .filter(models.CommunityMessage.id == message.id)
        .first()
    )
    return _message_out(message, current_student.id)


@router.delete("/messages/{message_id}", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("20/minute")
def delete_own_message(
    request: Request,
    message_id: int,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    message = (
        db.query(models.CommunityMessage)
        .join(models.CommunityChannel)
        .join(models.Community)
        .filter(
            models.CommunityMessage.id == message_id,
            models.CommunityMessage.student_id == current_student.id,
            models.Community.programme_id == current_student.programme_id,
            models.Community.year_level.in_([current_student.current_year, ALL_YEARS_LEVEL]),
        )
        .first()
    )
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")

    message.content = ""
    message.is_deleted = True
    db.commit()
    return None


@router.post("/messages/{message_id}/reactions", response_model=schemas.CommunityMessageOut)
@limiter.limit("60/minute")
def toggle_reaction(
    request: Request,
    message_id: int,
    payload: schemas.CommunityReactionCreate,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    message = (
        db.query(models.CommunityMessage)
        .join(models.CommunityChannel)
        .join(models.Community)
        .filter(
            models.CommunityMessage.id == message_id,
            models.Community.programme_id == current_student.programme_id,
            models.Community.year_level.in_([current_student.current_year, ALL_YEARS_LEVEL]),
            models.CommunityMessage.is_deleted.is_(False),
        )
        .first()
    )
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found")

    existing = (
        db.query(models.CommunityReaction)
        .filter(
            models.CommunityReaction.message_id == message.id,
            models.CommunityReaction.student_id == current_student.id,
            models.CommunityReaction.emoji == payload.emoji,
        )
        .first()
    )
    if existing:
        db.delete(existing)
    else:
        db.add(
            models.CommunityReaction(
                message_id=message.id,
                student_id=current_student.id,
                emoji=payload.emoji,
            )
        )
    db.commit()

    refreshed = (
        db.query(models.CommunityMessage)
        .options(
            joinedload(models.CommunityMessage.student),
            joinedload(models.CommunityMessage.reactions),
        )
        .filter(models.CommunityMessage.id == message.id)
        .first()
    )
    return _message_out(refreshed, current_student.id)
