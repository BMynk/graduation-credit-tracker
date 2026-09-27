"""Prerequisite rules that cannot be represented by the legacy many-to-many table alone.

The database relationship stores all prerequisite modules for display and joins.  Rules in
ANY_OF_PREREQUISITES mean that completing any one listed module satisfies the
prerequisite requirement for the target module.
"""

ANY_OF_PREREQUISITES = {
    # 2026 Faculty of Science & Agriculture prospectus:
    # STM312 and STM313 each require STM223 OR STM224.
    "STM312": {"STM223", "STM224"},
    "STM313": {"STM223", "STM224"},
}
