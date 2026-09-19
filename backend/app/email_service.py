# app/email_service.py

import logging
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List

from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import settings


logger = logging.getLogger("credit_tracker.email")


template_env = Environment(
    loader=FileSystemLoader("app/templates"),
    autoescape=select_autoescape(["html", "xml"]),
)


def _render_template(template_name: str, context: dict) -> str:
    template = template_env.get_template(template_name)

    context.setdefault(
        "base_url",
        getattr(settings, "base_url", "http://localhost:5173"),
    )

    return template.render(**context)


def _send_html_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str | None = None,
) -> None:

    if settings.email_dev_mode:
        logger.info(
            "[DEV MODE] Email to %s: %s\n%s",
            to_email,
            subject,
            text_content or html_content,
        )
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email

    if text_content:
        plain = text_content
    else:
        plain = re.sub(r"<[^>]+>", "", html_content)

    msg.attach(MIMEText(plain, "plain", "utf-8"))
    msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(
                settings.smtp_host,
                settings.smtp_port,
            ) as server:

                if settings.smtp_username:
                    server.login(
                        settings.smtp_username,
                        settings.smtp_password,
                    )

                server.sendmail(
                    settings.smtp_from_email,
                    [to_email],
                    msg.as_string(),
                )

        else:
            with smtplib.SMTP(
                settings.smtp_host,
                settings.smtp_port,
            ) as server:

                if settings.smtp_use_tls:
                    server.starttls()

                if settings.smtp_username:
                    server.login(
                        settings.smtp_username,
                        settings.smtp_password,
                    )

                server.sendmail(
                    settings.smtp_from_email,
                    [to_email],
                    msg.as_string(),
                )

        logger.info(
            "Sent HTML email to %s",
            to_email,
        )

    except smtplib.SMTPAuthenticationError:
        logger.error(
            "SMTP authentication failed."
        )
        raise

    except smtplib.SMTPRecipientsRefused:
        logger.error(
            "Recipient email refused: %s",
            to_email,
        )
        raise

    except smtplib.SMTPException as exc:
        logger.exception(
            "SMTP error sending email to %s: %s",
            to_email,
            str(exc),
        )
        raise

    except Exception:
        logger.exception(
            "Failed to send HTML email to %s",
            to_email,
        )
        raise


# ============================================================
# NEW STUDENT WELCOME
# ============================================================

def send_welcome_student_email(
    to_email: str,
    name: str,
    pin: str,
) -> None:

    html_content = _render_template(
        "welcome_student.html",
        {
            "name": name,
            "pin": pin,
        },
    )

    text_content = (
        f"Welcome to Graduation Credit Tracker\n\n"
        f"Hi {name},\n\n"
        f"Your student account has been created successfully.\n\n"
        f"Your login PIN: {pin}\n\n"
        f"This is your permanent login PIN. Keep it private "
        f"and use it for future sign-ins.\n\n"
        f"If you forget your PIN, you can request a new one "
        f"from the student login page.\n\n"
        f"Graduation Credit Tracker"
    )

    _send_html_email(
        to_email,
        "Welcome to Graduation Credit Tracker",
        html_content,
        text_content,
    )


# ============================================================
# STUDENT FORGOT PIN
# ============================================================

def send_pin_reset_email(
    to_email: str,
    name: str,
    pin: str,
) -> None:

    html_content = _render_template(
        "pin_reset.html",
        {
            "name": name,
            "pin": pin,
        },
    )

    text_content = (
        f"Your Graduation Credit Tracker PIN has been reset.\n\n"
        f"Hi {name},\n\n"
        f"We received a request for a new login PIN.\n\n"
        f"Your new PIN: {pin}\n\n"
        f"Your previous PIN no longer works. "
        f"Use this PIN for future sign-ins.\n\n"
        f"If you did not request this change, please contact "
        f"your administrator.\n\n"
        f"Graduation Credit Tracker"
    )

    _send_html_email(
        to_email,
        "Your Graduation Credit Tracker PIN has been reset",
        html_content,
        text_content,
    )


# ============================================================
# ADMIN PIN RESET
# ============================================================

def send_admin_pin_reset_email(
    to_email: str,
    name: str,
    pin: str,
) -> None:

    html_content = _render_template(
        "admin_pin_reset.html",
        {
            "name": name,
            "pin": pin,
        },
    )

    text_content = (
        f"Your Graduation Credit Tracker login PIN was reset "
        f"by an administrator.\n\n"
        f"Hi {name},\n\n"
        f"A system administrator issued a new login PIN "
        f"for your account.\n\n"
        f"Your new PIN: {pin}\n\n"
        f"Your previous PIN no longer works. "
        f"Keep this PIN private and use it for future sign-ins.\n\n"
        f"Graduation Credit Tracker"
    )

    _send_html_email(
        to_email,
        "Your Graduation Credit Tracker login PIN was reset",
        html_content,
        text_content,
    )


# ============================================================
# LEGACY PIN FUNCTION
# ============================================================

def send_login_pin_email(
    to_email: str,
    name: str,
    pin: str,
) -> None:
    """
    Backward-compatible function.

    New code should use one of:
    - send_welcome_student_email
    - send_pin_reset_email
    - send_admin_pin_reset_email
    """
    send_pin_reset_email(
        to_email,
        name,
        pin,
    )


# ============================================================
# GRADE RELEASED
# ============================================================

def send_grade_released_email(
    student,
    module,
    grade: float,
    semester: str,
) -> None:

    passed = grade >= settings.pass_mark

    html_content = _render_template(
        "grade_released.html",
        {
            "name": student.name,
            "module_code": module.code,
            "module_name": module.name,
            "semester": semester,
            "grade": grade,
            "passed": passed,
        },
    )

    text_content = (
        f"Hi {student.name},\n\n"
        f"Your grade for {module.code} "
        f"({module.name}) has been released.\n"
        f"Semester: {semester}\n"
        f"Grade: {grade}%\n"
        f"Status: {'Passed' if passed else 'Failed'}\n\n"
        f"Graduation Credit Tracker"
    )

    _send_html_email(
        student.email,
        f"Grade Released: {module.code} - {module.name}",
        html_content,
        text_content,
    )


# ============================================================
# ACHIEVEMENT
# ============================================================

def send_achievement_unlocked_email(
    student,
    achievement: dict,
) -> None:

    html_content = _render_template(
        "achievement_unlocked.html",
        {
            "name": student.name,
            "icon": achievement.get(
                "icon",
                "🏆",
            ),
            "achievement_title": achievement["title"],
            "achievement_description": achievement[
                "description"
            ],
        },
    )

    text_content = (
        f"Hi {student.name},\n\n"
        f"Congratulations!\n"
        f"You've unlocked: {achievement['title']}\n"
        f"{achievement['description']}\n\n"
        f"Graduation Credit Tracker"
    )

    _send_html_email(
        student.email,
        f"Achievement Unlocked: {achievement['title']}",
        html_content,
        text_content,
    )


# ============================================================
# BULK EMAIL
# ============================================================

def send_bulk_email(
    to_emails: List[str],
    subject: str,
    body: str,
    sender_email: str,
) -> dict:

    sent = 0
    failed = 0
    recipients = []
    errors = []

    if settings.email_dev_mode:
        logger.info(
            "[DEV MODE] Bulk email to %d recipients",
            len(to_emails),
        )

        return {
            "sent": len(to_emails),
            "failed": 0,
            "recipients": to_emails,
            "errors": [],
        }

    for email in to_emails:
        try:
            html_content = _render_template(
                "bulk_email.html",
                {
                    "subject": subject,
                    "body": body.replace(
                        "\n",
                        "<br>",
                    ),
                },
            )

            text_content = (
                f"Subject: {subject}\n\n{body}"
            )

            _send_html_email(
                email,
                subject,
                html_content,
                text_content,
            )

            sent += 1
            recipients.append(email)

        except Exception as exc:
            failed += 1

            errors.append(
                f"{email}: {str(exc)}"
            )

            logger.error(
                "Failed to send bulk email to %s: %s",
                email,
                str(exc),
            )

    return {
        "sent": sent,
        "failed": failed,
        "recipients": recipients,
        "errors": errors,
    }