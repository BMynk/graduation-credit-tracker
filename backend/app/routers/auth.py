@router.post(
    "/request-pin",
    status_code=status.HTTP_204_NO_CONTENT,
)
@limiter.limit("3/minute")
def request_pin(
    request: Request,
    payload: schemas.PinRequest,
    db: Session = Depends(get_db),
):
    """
    Generate and email a new student PIN.

    This endpoint is intended for students who have forgotten
    their existing PIN.

    Security behaviour:
    - The response is always the same whether the supplied
      student number/email matches an account or not.
    - A new PIN is only stored after the reset email has been
      accepted for delivery.
    - If email delivery fails, the existing PIN remains valid.
    - Only the hash of the new PIN is stored.
    - The plaintext PIN is never stored in the database.
    """

    student = (
        db.query(models.Student)
        .filter(
            models.Student.student_number
            == payload.student_number
        )
        .first()
    )

    # Deliberately return the same response whether the account
    # exists or not. This helps prevent account enumeration.
    if (
        not student
        or not student.is_active
        or student.email.lower()
        != payload.email.lower()
    ):
        return None

    new_pin = generate_pin()

    try:
        # Send the replacement PIN before changing the database.
        #
        # If email delivery fails, the student's existing PIN
        # remains unchanged and can still be used.
        send_pin_reset_email(
            student.email,
            student.name,
            new_pin,
        )

        # Email was accepted for delivery, so replace the old PIN.
        student.pin_hash = hash_password(
            new_pin
        )

        db.commit()

    except Exception:
        # Do not leave a new PIN in the database if the email
        # could not be sent.
        db.rollback()

        # IMPORTANT:
        # Keep the external response identical. Returning an email
        # error here could reveal whether an account exists.
        return None

    return None