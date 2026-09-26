# app/schemas.py
from datetime import datetime
from typing import List, Optional
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


# ---------- Programme / Module ----------

class ModuleOut(BaseModel):
    code: str
    name: str
    credits: int
    category: str
    level: int
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class ModuleDetailOut(ModuleOut):
    prerequisites: List[str] = []
    unlocks: List[str] = []


class ModuleCreate(BaseModel):
    code: str
    name: str
    credits: int
    category: str
    level: int
    description: Optional[str] = None


class ModuleUpdate(BaseModel):
    name: Optional[str] = None
    credits: Optional[int] = None
    category: Optional[str] = None
    level: Optional[int] = None
    description: Optional[str] = None


class CurriculumModuleOut(ModuleOut):
    is_compulsory: bool
    curriculum_year: int
    curriculum_semester: int


class ProgrammeOut(BaseModel):
    code: str
    name: str
    faculty: Optional[str] = None
    total_credits_required: int

    model_config = {"from_attributes": True}


class ProgrammeCurriculumOut(ProgrammeOut):
    modules_by_level: dict[int, List[CurriculumModuleOut]]


# ---------- Student models ----------

class StudentOut(BaseModel):
    id: int
    name: str
    student_number: str
    email: str
    current_year: int
    target_average: float
    programme: ProgrammeOut

    model_config = {"from_attributes": True}


class AdminStudentOut(StudentOut):
    is_active: bool


# ---------- Paginated Response ----------

class PaginatedStudentResponse(BaseModel):
    total: int
    skip: int
    limit: int
    students: List[AdminStudentOut]


# ---------- Student passwordless auth ----------

class PinRequest(BaseModel):
    student_number: str
    email: EmailStr


class StudentLoginRequest(BaseModel):
    student_number: str
    email: EmailStr
    pin: str = Field(min_length=6, max_length=6)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class StudentUpdate(BaseModel):
    target_average: Optional[float] = Field(default=None, ge=0, le=100)


# ---------- Admin auth ----------

class AdminLogin(BaseModel):
    username: str
    password: str


# ---------- Admin-managed student records ----------

class AdminStudentCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    student_number: str = Field(min_length=3, max_length=30)
    email: EmailStr
    programme_code: str
    current_year: int = Field(default=1, ge=1, le=4)


class AdminStudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    programme_code: Optional[str] = None
    current_year: Optional[int] = Field(default=None, ge=1, le=4)
    target_average: Optional[float] = Field(default=None, ge=0, le=100)
    is_active: Optional[bool] = None


class AdminStudentCreatedOut(AdminStudentOut):
    login_pin: str


# ---------- Admin account management ----------

class AdminCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=8, max_length=100)
    is_super_admin: bool = False


class AdminUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=2, max_length=120)
    is_active: Optional[bool] = None
    is_super_admin: Optional[bool] = None


class AdminPasswordReset(BaseModel):
    new_password: str = Field(min_length=8, max_length=100)


class AdminPasswordChange(BaseModel):
    current_password: str = Field(min_length=1, max_length=100)
    new_password: str = Field(min_length=12, max_length=100)


class AdminOut(BaseModel):
    id: int
    name: str
    username: str
    email: Optional[str] = None
    is_active: bool
    is_super_admin: bool
    created_at: datetime
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None

    model_config = {"from_attributes": True}


class AdminProfileOut(BaseModel):
    id: int
    name: str
    username: str
    email: Optional[str] = None
    is_active: bool
    is_super_admin: bool

    model_config = {"from_attributes": True}


# ---------- Impersonation ----------

class ImpersonateRequest(BaseModel):
    student_id: int


# ---------- Prerequisite Management ----------

class PrerequisiteUpdate(BaseModel):
    prerequisite_codes: List[str]


# ---------- Programme-Module Management ----------

class ProgrammeModuleAdd(BaseModel):
    module_code: str
    is_compulsory: bool = False
    year: int = Field(default=1, ge=1, le=6)
    semester: int = Field(default=1, ge=1, le=2)


class ProgrammeModuleUpdate(BaseModel):
    is_compulsory: Optional[bool] = None
    year: Optional[int] = Field(default=None, ge=1, le=6)
    semester: Optional[int] = Field(default=None, ge=1, le=2)


class ProgrammeModuleOut(BaseModel):
    programme_code: str
    programme_name: str
    module_code: str
    module_name: str
    is_compulsory: bool
    year: int
    semester: int

    model_config = {"from_attributes": True}

# ---------- Dashboard & Analytics ----------

class ProgrammeCount(BaseModel):
    programme_code: str
    programme_name: str
    student_count: int


class AtRiskStudentOut(BaseModel):
    id: int
    name: str
    student_number: str
    programme_code: str
    weighted_average: Optional[float]
    target_average: float
    failed_blocking_count: int
    reasons: List[str]


class DashboardStats(BaseModel):
    total_students: int
    active_students: int
    students_by_programme: List[ProgrammeCount]
    cohort_average: Optional[float]
    at_risk_count: int
    at_risk_students: List[AtRiskStudentOut]


class ProgressBandOut(BaseModel):
    label: str
    student_count: int


class AcademicYearCountOut(BaseModel):
    year: int
    student_count: int


class AnalyticsProgrammeOut(BaseModel):
    programme_code: str
    programme_name: str
    student_count: int
    avg_percentage_complete: Optional[float]
    avg_weighted_average: Optional[float]


class AdminAnalyticsOut(BaseModel):
    active_students: int
    graduation_ready_count: int
    requirements_remaining_count: int
    failed_prerequisite_count: int
    below_target_count: int
    progress_distribution: List[ProgressBandOut]
    students_by_year: List[AcademicYearCountOut]
    programme_performance: List[AnalyticsProgrammeOut]
    bottleneck_modules: List["BottleneckModuleOut"]


class BottleneckModuleOut(BaseModel):
    code: str
    name: str
    fail_count: int


class ProgrammeBreakdown(BaseModel):
    programme_code: str
    programme_name: str
    student_count: int
    avg_percentage_complete: Optional[float]
    avg_weighted_average: Optional[float]
    bottleneck_modules: List[BottleneckModuleOut]


# ---------- Marks & Bulk Upload ----------

class ModuleCompletion(BaseModel):
    module_code: str
    semester: str
    grade: float = Field(ge=0, le=100)

    @field_validator("semester")
    @classmethod
    def semester_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("semester must not be blank")
        return v.strip()


class BulkUploadRowResult(BaseModel):
    row: int
    identifier: str
    status: str
    detail: Optional[str] = None


class BulkUploadReport(BaseModel):
    total_rows: int
    succeeded: int
    failed: int
    results: List[BulkUploadRowResult]


# ---------- Progress / Enrolments ----------

class EnrolmentOut(BaseModel):
    id: int
    module: ModuleOut
    semester: str
    grade: Optional[float]
    status: str
    attempt: int
    updated_at: datetime

    model_config = {"from_attributes": True}


class FailedModuleOut(BaseModel):
    module: ModuleOut
    semester: str
    grade: Optional[float]
    attempt: int
    is_prerequisite_for_major: bool


class CategoryBreakdown(BaseModel):
    credits_completed: int
    modules_completed: int


class ProgressSummary(BaseModel):
    programme: ProgrammeOut
    current_year: int
    credits_completed: int
    credits_required: int
    credits_remaining: int
    percentage_complete: float
    weighted_average: Optional[float]
    modules_completed: int
    modules_failed_pending_retake: int
    category_breakdown: dict[str, CategoryBreakdown]
    missing_compulsory_modules: List[ModuleOut]
    failed_modules: List[FailedModuleOut]


# ---------- Enhanced Graduation Audit ----------

class ModuleRequirementItem(BaseModel):
    code: str
    name: str
    credits: int
    level: int
    category: str

    year: Optional[int] = None
    semester: Optional[int] = None

    is_compulsory: bool = False

    # Used by curriculum_by_year
    is_completed: Optional[bool] = None


class RequirementCategory(BaseModel):
    completed: int
    total: int
    percentage: float

    completed_modules: List[ModuleRequirementItem]
    missing_modules: List[ModuleRequirementItem]


class LevelCredits(BaseModel):
    total: int
    completed: int


class CategoryCredits(BaseModel):
    total: int
    completed: int


class RequirementsBreakdown(BaseModel):
    compulsory: RequirementCategory
    elective: RequirementCategory

    by_level: dict[int, LevelCredits]
    by_category: dict[str, CategoryCredits]


class PrerequisiteWarning(BaseModel):
    module: str
    missing_prereq: str

    year: Optional[int] = None
    semester: Optional[int] = None


class GraduationAudit(BaseModel):
    on_track: bool

    reasons: List[str]
    urgent_items: List[str]

    projected_semesters_remaining: Optional[int]
    average_credits_per_semester: Optional[float]

    requirements_breakdown: RequirementsBreakdown

    prerequisite_warnings: List[PrerequisiteWarning]

    in_progress_modules: int

    summary: ProgressSummary

    choice_requirements: List[dict] = []

    # Full programme roadmap:
    #
    # {
    #     "1": {
    #         "1": [module, module],
    #         "2": [module, module]
    #     },
    #     "2": {
    #         "1": [...],
    #         "2": [...]
    #     }
    # }
    #
    # String keys are used because JSON object keys
    # are strings when sent to the frontend.
    curriculum_by_year: dict[
        str,
        dict[
            str,
            List[ModuleRequirementItem]
        ]
    ] = {}


# ---------- Grade Predictor ----------

class GradePredictionItem(BaseModel):
    module_code: str
    predicted_grade: float = Field(ge=0, le=100)


class GradePredictionRequest(BaseModel):
    predictions: List[GradePredictionItem]


class GradePredictionResult(BaseModel):
    current_weighted_average: Optional[float]
    new_weighted_average: float
    change: float
    credits_completed: int
    credits_with_predictions: int
    total_credits_after: int
    modules_affected: List[dict]
    eligibility_warnings: List[str]
    graduation_impact: str


# ---------- Semester View ----------

class SemesterOut(BaseModel):
    semester: str
    modules: List[EnrolmentOut]
    credits_completed: int
    average: Optional[float]


# ---------- Module Details ----------

class ModuleStatus(str, Enum):
    COMPLETED = "completed"
    FAILED = "failed"
    IN_PROGRESS = "in-progress"
    PLANNED = "planned"
    NOT_TAKEN = "not_taken"


class ModuleDetailOut(ModuleOut):
    prerequisites: List[str] = []
    unlocks: List[str] = []
    status: Optional[str] = None
    grade: Optional[float] = None
    attempt: Optional[int] = None
    is_compulsory: Optional[bool] = None


class ModuleWithPrerequisitesOut(ModuleDetailOut):
    pass


class EligibleModuleOut(ModuleOut):
    reason: str


# ---------- Bulk Email ----------

class BulkEmailRequest(BaseModel):
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=10000)
    programme_code: Optional[str] = None  # If None, all programmes
    current_year: Optional[int] = None    # If None, all years
    is_active: bool = True                # Only send to active students by default
    send_test: bool = False               # If True, only send to the admin's email


class BulkEmailPreview(BaseModel):
    recipient_count: int
    sample_recipients: List[str]  # First 5 email addresses


class BulkEmailResult(BaseModel):
    total_sent: int
    failed: int
    recipients: List[str]
    errors: List[str]


# ============================================================
# SUPPORT SERVICES
# ============================================================

class SupportServiceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)

    short_name: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    category: str = Field(
        default="student_support",
        max_length=100,
    )

    description: str = Field(
        min_length=2,
        max_length=3000,
    )

    location: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    campus: Optional[str] = Field(
        default=None,
        max_length=150,
    )

    email: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    website: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    opening_hours: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    how_to_access: Optional[str] = Field(
        default=None,
        max_length=2000,
    )

    is_emergency: bool = False

    is_active: bool = True


class SupportServiceUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    short_name: Optional[str] = Field(
        default=None,
        max_length=50,
    )

    category: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    description: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=3000,
    )

    location: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    campus: Optional[str] = Field(
        default=None,
        max_length=150,
    )

    email: Optional[str] = Field(
        default=None,
        max_length=255,
    )

    phone: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    website: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    opening_hours: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    how_to_access: Optional[str] = Field(
        default=None,
        max_length=2000,
    )

    is_emergency: Optional[bool] = None

    is_active: Optional[bool] = None


class SupportServiceOut(BaseModel):
    id: int
    name: str
    short_name: Optional[str] = None
    category: str
    description: str

    location: Optional[str] = None
    campus: Optional[str] = None

    email: Optional[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None

    opening_hours: Optional[str] = None
    how_to_access: Optional[str] = None

    is_emergency: bool
    is_active: bool

    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )

# ============================================================
# FACILITATORS
# ============================================================

class FacilitatorCreate(BaseModel):
    name: str = Field(
        min_length=2,
        max_length=150,
    )

    programme_type: str = Field(
        min_length=2,
        max_length=20,
    )

    module_assignment: str = Field(
        min_length=1,
        max_length=500,
    )

    campus: str = Field(
        default="Alice",
        max_length=100,
    )

    session_time: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    consultation_time: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    is_assistant: bool = False
    is_active: bool = True


class FacilitatorUpdate(BaseModel):
    name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    programme_type: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=20,
    )

    module_assignment: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=500,
    )

    campus: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    session_time: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    consultation_time: Optional[str] = Field(
        default=None,
        max_length=500,
    )

    is_assistant: Optional[bool] = None
    is_active: Optional[bool] = None


class FacilitatorOut(BaseModel):
    id: int
    name: str
    programme_type: str
    module_assignment: str
    campus: str

    session_time: Optional[str] = None
    consultation_time: Optional[str] = None

    is_assistant: bool
    is_active: bool

    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

# ---------- Community ----------

class CommunityChannelOut(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str] = None

    model_config = {"from_attributes": True}


class CommunityOut(BaseModel):
    id: int
    year_level: int
    programme_code: str
    programme_name: str
    channels: List[CommunityChannelOut]


class CommunityAuthorOut(BaseModel):
    id: int
    name: str
    current_year: int
    is_simulated: bool = False


class CommunityReactionSummary(BaseModel):
    emoji: str
    count: int
    reacted_by_me: bool = False


class CommunityMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    parent_message_id: Optional[int] = None

    @field_validator("content")
    @classmethod
    def validate_content(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class CommunityReactionCreate(BaseModel):
    emoji: str = Field(min_length=1, max_length=16)

    @field_validator("emoji")
    @classmethod
    def validate_emoji(cls, value: str):
        allowed = {"👍", "❤️", "😂", "🔥", "🎉", "👏"}
        if value not in allowed:
            raise ValueError("Unsupported reaction")
        return value


class CommunityMessageOut(BaseModel):
    id: int
    channel_id: int
    content: Optional[str] = None
    is_deleted: bool
    created_at: datetime
    edited_at: Optional[datetime] = None
    parent_message_id: Optional[int] = None
    author: CommunityAuthorOut
    reactions: List[CommunityReactionSummary] = []


# ============================================================
# PRIVATE STUDENT MESSAGING
# ============================================================

class CommunityStudentProfileOut(BaseModel):
    id: int
    name: str
    programme_code: str
    programme_name: str
    current_year: int
    is_simulated: bool = False
    chat_status: Optional[str] = None
    past_paper_upload_count: int = 0
    contributor_achievement: Optional[str] = None
    equipped_title: Optional[str] = None
    equipped_theme: Optional[str] = None
    equipped_frame: Optional[str] = None
    equipped_marcel: Optional[str] = None
    achievement_showcase: List[str] = Field(default_factory=list)


class PrivateChatRequestOut(BaseModel):
    id: int
    sender: CommunityAuthorOut
    receiver: CommunityAuthorOut
    status: str
    created_at: datetime
    responded_at: Optional[datetime] = None


class PrivateConversationOut(BaseModel):
    id: int
    other_student: CommunityAuthorOut
    created_at: datetime
    is_active: bool


class PrivateMessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)

    @field_validator("content")
    @classmethod
    def validate_private_message(cls, value: str):
        value = value.strip()
        if not value:
            raise ValueError("Message cannot be empty")
        return value


class PrivateMessageOut(BaseModel):
    id: int
    conversation_id: int
    sender: CommunityAuthorOut
    content: str
    created_at: datetime
    read_at: Optional[datetime] = None


# ---------- Student notifications ----------

class StudentNotificationOut(BaseModel):
    id: str
    kind: str
    title: str
    message: str
    created_at: datetime
    unread: bool = True
    target: Optional[str] = None
    conversation_id: Optional[int] = None


# ---------- Past paper contribution achievements ----------

class PastPaperAchievementOut(BaseModel):
    key: str
    name: str
    description: str
    threshold: int
    unlocked: bool


class PastPaperAchievementProgressOut(BaseModel):
    upload_count: int
    highest_achievement: Optional[PastPaperAchievementOut] = None
    next_achievement: Optional[PastPaperAchievementOut] = None
    remaining_to_next: int = 0
    achievements: List[PastPaperAchievementOut] = []


# ---------- Community past papers ----------

class PastPaperOut(BaseModel):
    id: int
    module_code: str
    module_name: Optional[str] = None
    paper_year: int
    semester: Optional[int] = None
    level: int
    description: Optional[str] = None
    file_name: str
    file_url: str
    file_size: int
    created_at: datetime
    uploader: CommunityAuthorOut
