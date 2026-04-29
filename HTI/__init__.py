# This will make sure the app is always imported when
# Django starts so that shared_task will use this app.
import os

if os.environ.get('DESKTOP_MODE') != '1':
    try:
        from .celery import app as celery_app
        __all__ = ('celery_app',)
    except Exception:
        celery_app = None
        __all__ = ()
else:
    celery_app = None
    __all__ = ()
