# app/email_service.py
import logging
import smtplib
import re
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.config import settings

logger = logging.getLogger("credit_tracker.email")

# ---------- Jinja2 Setup ----------
template_env = Environment(
    loader=FileSystemLoader("app/templates"),
    autoescape=select_autoescape(["html", "xml"]),
)


def _render_template(template_name: str, context: dict) -> str:
    """Render an HTML template with the given context."""
    template = template_env.get_template(template_name)
    context.setdefault("base_url", getattr(settings, "base_url", "http://localhost:5173"))
    return template.render(**context)


def _send_html_email(to_email: str, subject: str, html_content: str, text_content: str = None) -> None:
    """
    Send an HTML email with a plain-text fallback.
    """
    if settings.email_dev_mode:
        logger.info("[DEV MODE] Email to %s: %s\n%s", to_email, subject, text_content or html_content)
        return

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = settings.smtp_from_email
    msg["To"] = to_email

    # Plain text fallback
    if text_content:
        part_text = MIMEText(text_content, "plain")
        msg.attach(part_text)
    else:
        # Generate a simple plain text from HTML (very basic)
        plain = re.sub(r'<[^>]+>', '', html_content)
        part_text = MIMEText(plain, "plain")
        msg.attach(part_text)

    # HTML part
    part_html = MIMEText(html_content, "html")
    msg.attach(part_html)

    try:
        if settings.smtp_use_ssl:
            with smtplib.SMTP_SSL(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                if settings.smtp_use_tls:
                    server.starttls()
                if settings.smtp_username:
                    server.login(settings.smtp_username, settings.smtp_password)
                server.sendmail(settings.smtp_from_email, [to_email], msg.as_string())
        logger.info("Sent HTML email to %s", to_email)
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP Authentication failed. Check your email and app password.")
        raise
    except smtplib.SMTPRecipientsRefused:
        logger.error("Recipient email address refused: %s", to_email)
        raise
    except smtplib.SMTPException as e:
        logger.exception("SMTP error sending email to %s: %s", to_email, str(e))
        raise
    except Exception:
        logger.exception("Failed to send HTML email to %s", to_email)
        raise


# ---------- PIN Email ----------

def send_login_pin_email(to_email: str, name: str, pin: str) -> None:
    """
    Send a login PIN email using HTML template.
    """
    html_content = _render_template("pin_email.html", {
        "name": name,
        "pin": pin,
    })
    text_content = f"Hi {name},\n\nYour login PIN is: {pin}\n\nIf you didn't request this, please ignore this email."
    _send_html_email(to_email, "🔑 Your Graduation Credit Tracker login PIN", html_content, text_content)


# ---------- Grade Released Email ----------

def send_grade_released_email(student, module, grade: float, semester: str) -> None:
    """
    Send a grade release notification using HTML template.
    """
    passed = grade >= settings.pass_mark

    html_content = _render_template("grade_released.html", {
        "name": student.name,
        "module_code": module.code,
        "module_name": module.name,
        "semester": semester,
        "grade": grade,
        "passed": passed,
    })

    text_content = (
        f"Hi {student.name},\n\n"
        f"Your grade for {module.code} ({module.name}) has been released.\n"
        f"Semester: {semester}\n"
        f"Grade: {grade}%\n"
        f"Status: {'Passed' if passed else 'Failed'}\n\n"
        f"– Graduation Credit Tracker"
    )

    _send_html_email(
        student.email,
        f"📊 Grade Released: {module.code} – {module.name}",
        html_content,
        text_content
    )


# ---------- Achievement Unlocked Email ----------

def send_achievement_unlocked_email(student, achievement: dict) -> None:
    """
    Send an achievement unlocked notification using HTML template.
    """
    html_content = _render_template("achievement_unlocked.html", {
        "name": student.name,
        "icon": achievement.get("icon", "🏆"),
        "achievement_title": achievement["title"],
        "achievement_description": achievement["description"],
    })

    text_content = (
        f"Hi {student.name},\n\n"
        f"🎉 Congratulations!\n"
        f"You've unlocked: {achievement['title']}\n"
        f"{achievement['description']}\n\n"
        f"– Graduation Credit Tracker"
    )

    _send_html_email(
        student.email,
        f"🏆 Achievement Unlocked: {achievement['title']}",
        html_content,
        text_content
    )


# ---------- Bulk Email ----------

def send_bulk_email(to_emails: List[str], subject: str, body: str, sender_email: str) -> dict:
    """
    Send a bulk email to multiple recipients using HTML template.
    """
    sent = 0
    failed = 0
    recipients = []
    errors = []

    if settings.email_dev_mode:
        logger.info("[DEV MODE - no email sent] Bulk email to %d recipients", len(to_emails))
        logger.info("Subject: %s", subject)
        logger.info("Body: %s", body[:200])
        return {
            "sent": len(to_emails),
            "failed": 0,
            "recipients": to_emails,
            "errors": [],
        }

    for email in to_emails:
        try:
            # Render HTML template for each recipient (allows personalization)
            html_content = _render_template("bulk_email.html", {
                "subject": subject,
                "body": body.replace("\n", "<br>"),
            })
            text_content = f"Subject: {subject}\n\n{body}"

            _send_html_email(email, subject, html_content, text_content)
            sent += 1
            recipients.append(email)
            logger.info("Sent bulk email to %s", email)

        except Exception as e:
            failed += 1
            errors.append(f"{email}: {str(e)}")
            logger.error("Failed to send bulk email to %s: %s", email, str(e))

    return {
        "sent": sent,
        "failed": failed,
        "recipients": recipients,
        "errors": errors,
    }