# app/routers/community.py

from datetime import datetime

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


# ============================================================
# COMMUNITY STUDENT PROFILES + CONSENT-BASED PRIVATE MESSAGING
# ============================================================

def _author(student: models.Student):
    return schemas.CommunityAuthorOut(
        id=student.id,
        name=student.name,
        current_year=student.current_year,
        is_simulated=student.student_number.startswith("SIM-"),
    )


def _pair(a: int, b: int):
    return (a, b) if a < b else (b, a)


def _conversation_for(db: Session, a: int, b: int):
    one, two = _pair(a, b)
    return (
        db.query(models.PrivateConversation)
        .filter(
            models.PrivateConversation.student_one_id == one,
            models.PrivateConversation.student_two_id == two,
            models.PrivateConversation.is_active.is_(True),
        )
        .first()
    )


@router.get("/students/{student_id}/profile", response_model=schemas.CommunityStudentProfileOut)
def community_student_profile(
    student_id: int,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    student = (
        db.query(models.Student)
        .options(joinedload(models.Student.programme))
        .filter(
            models.Student.id == student_id,
            models.Student.programme_id == current_student.programme_id,
            models.Student.is_active.is_(True),
        )
        .first()
    )
    if student is None:
        raise HTTPException(status_code=404, detail="Student profile not found")

    chat_status = "self" if student.id == current_student.id else None
    if student.id != current_student.id:
        conversation = _conversation_for(db, current_student.id, student.id)
        if conversation:
            chat_status = "accepted"
        else:
            request_row = (
                db.query(models.PrivateChatRequest)
                .filter(
                    (
                        (models.PrivateChatRequest.sender_id == current_student.id)
                        & (models.PrivateChatRequest.receiver_id == student.id)
                    )
                    | (
                        (models.PrivateChatRequest.sender_id == student.id)
                        & (models.PrivateChatRequest.receiver_id == current_student.id)
                    )
                )
                .order_by(models.PrivateChatRequest.id.desc())
                .first()
            )
            if request_row:
                if request_row.status == "pending":
                    chat_status = (
                        "outgoing_pending"
                        if request_row.sender_id == current_student.id
                        else "incoming_pending"
                    )
                else:
                    chat_status = request_row.status

    return schemas.CommunityStudentProfileOut(
        id=student.id,
        name=student.name,
        programme_code=student.programme.code,
        programme_name=student.programme.name,
        current_year=student.current_year,
        is_simulated=student.student_number.startswith("SIM-"),
        chat_status=chat_status,
    )


@router.post("/chat-requests/{student_id}", response_model=schemas.PrivateChatRequestOut, status_code=201)
@limiter.limit("10/minute")
def request_private_chat(
    request: Request,
    student_id: int,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    if student_id == current_student.id:
        raise HTTPException(status_code=400, detail="You cannot request a chat with yourself")

    target = (
        db.query(models.Student)
        .filter(
            models.Student.id == student_id,
            models.Student.programme_id == current_student.programme_id,
            models.Student.is_active.is_(True),
        )
        .first()
    )
    if target is None:
        raise HTTPException(status_code=404, detail="Student not found in your programme community")
    if _conversation_for(db, current_student.id, target.id):
        raise HTTPException(status_code=409, detail="You already have an active conversation")

    reverse = (
        db.query(models.PrivateChatRequest)
        .filter(
            models.PrivateChatRequest.sender_id == target.id,
            models.PrivateChatRequest.receiver_id == current_student.id,
            models.PrivateChatRequest.status == "pending",
        )
        .first()
    )
    if reverse:
        raise HTTPException(status_code=409, detail="This student has already sent you a chat request")

    row = (
        db.query(models.PrivateChatRequest)
        .filter(
            models.PrivateChatRequest.sender_id == current_student.id,
            models.PrivateChatRequest.receiver_id == target.id,
        )
        .first()
    )
    if row and row.status == "pending":
        raise HTTPException(status_code=409, detail="Chat request already pending")
    if row:
        row.status = "pending"
        row.created_at = datetime.utcnow()
        row.responded_at = None
    else:
        row = models.PrivateChatRequest(sender_id=current_student.id, receiver_id=target.id)
        db.add(row)

    db.commit()
    db.refresh(row)
    return schemas.PrivateChatRequestOut(
        id=row.id, sender=_author(current_student), receiver=_author(target),
        status=row.status, created_at=row.created_at, responded_at=row.responded_at,
    )


@router.get("/chat-requests", response_model=list[schemas.PrivateChatRequestOut])
def list_chat_requests(
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    rows = (
        db.query(models.PrivateChatRequest)
        .options(joinedload(models.PrivateChatRequest.sender), joinedload(models.PrivateChatRequest.receiver))
        .filter(
            (models.PrivateChatRequest.sender_id == current_student.id)
            | (models.PrivateChatRequest.receiver_id == current_student.id)
        )
        .order_by(models.PrivateChatRequest.created_at.desc())
        .all()
    )
    return [
        schemas.PrivateChatRequestOut(
            id=r.id, sender=_author(r.sender), receiver=_author(r.receiver),
            status=r.status, created_at=r.created_at, responded_at=r.responded_at,
        )
        for r in rows
    ]


@router.post("/chat-requests/{request_id}/accept", response_model=schemas.PrivateConversationOut)
def accept_chat_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    row = (
        db.query(models.PrivateChatRequest)
        .options(joinedload(models.PrivateChatRequest.sender))
        .filter(
            models.PrivateChatRequest.id == request_id,
            models.PrivateChatRequest.receiver_id == current_student.id,
            models.PrivateChatRequest.status == "pending",
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Pending chat request not found")

    conversation = _conversation_for(db, current_student.id, row.sender_id)
    if conversation is None:
        one, two = _pair(current_student.id, row.sender_id)
        conversation = models.PrivateConversation(student_one_id=one, student_two_id=two)
        db.add(conversation)
        db.flush()

    row.status = "accepted"
    row.responded_at = datetime.utcnow()
    db.commit()
    db.refresh(conversation)
    return schemas.PrivateConversationOut(
        id=conversation.id, other_student=_author(row.sender),
        created_at=conversation.created_at, is_active=conversation.is_active,
    )


@router.post("/chat-requests/{request_id}/decline", response_model=schemas.PrivateChatRequestOut)
def decline_chat_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    row = (
        db.query(models.PrivateChatRequest)
        .options(joinedload(models.PrivateChatRequest.sender), joinedload(models.PrivateChatRequest.receiver))
        .filter(
            models.PrivateChatRequest.id == request_id,
            models.PrivateChatRequest.receiver_id == current_student.id,
            models.PrivateChatRequest.status == "pending",
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Pending chat request not found")
    row.status = "declined"
    row.responded_at = datetime.utcnow()
    db.commit()
    return schemas.PrivateChatRequestOut(
        id=row.id, sender=_author(row.sender), receiver=_author(row.receiver),
        status=row.status, created_at=row.created_at, responded_at=row.responded_at,
    )


@router.get("/conversations", response_model=list[schemas.PrivateConversationOut])
def list_private_conversations(
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    rows = (
        db.query(models.PrivateConversation)
        .options(joinedload(models.PrivateConversation.student_one), joinedload(models.PrivateConversation.student_two))
        .filter(
            models.PrivateConversation.is_active.is_(True),
            (models.PrivateConversation.student_one_id == current_student.id)
            | (models.PrivateConversation.student_two_id == current_student.id),
        )
        .order_by(models.PrivateConversation.created_at.desc())
        .all()
    )
    result = []
    for row in rows:
        other = row.student_two if row.student_one_id == current_student.id else row.student_one
        result.append(schemas.PrivateConversationOut(
            id=row.id, other_student=_author(other),
            created_at=row.created_at, is_active=row.is_active,
        ))
    return result


def _allowed_conversation(db: Session, conversation_id: int, student_id: int):
    row = (
        db.query(models.PrivateConversation)
        .filter(
            models.PrivateConversation.id == conversation_id,
            models.PrivateConversation.is_active.is_(True),
            (models.PrivateConversation.student_one_id == student_id)
            | (models.PrivateConversation.student_two_id == student_id),
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return row


@router.get("/conversations/{conversation_id}/messages", response_model=list[schemas.PrivateMessageOut])
def private_messages(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    _allowed_conversation(db, conversation_id, current_student.id)
    rows = (
        db.query(models.PrivateMessage)
        .options(joinedload(models.PrivateMessage.sender))
        .filter(models.PrivateMessage.conversation_id == conversation_id)
        .order_by(models.PrivateMessage.id.asc())
        .limit(200)
        .all()
    )
    return [
        schemas.PrivateMessageOut(
            id=m.id, conversation_id=m.conversation_id, sender=_author(m.sender),
            content=m.content, created_at=m.created_at, read_at=m.read_at,
        )
        for m in rows
    ]


@router.post("/conversations/{conversation_id}/messages", response_model=schemas.PrivateMessageOut, status_code=201)
@limiter.limit("30/minute")
def send_private_message(
    request: Request,
    conversation_id: int,
    payload: schemas.PrivateMessageCreate,
    db: Session = Depends(get_db),
    current_student: models.Student = Depends(get_current_student),
):
    _allowed_conversation(db, conversation_id, current_student.id)
    message = models.PrivateMessage(
        conversation_id=conversation_id,
        sender_id=current_student.id,
        content=payload.content.strip(),
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return schemas.PrivateMessageOut(
        id=message.id, conversation_id=message.conversation_id,
        sender=_author(current_student), content=message.content,
        created_at=message.created_at, read_at=message.read_at,
    )
