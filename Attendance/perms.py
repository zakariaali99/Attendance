# Permission logics - currently not used in the application.
# If django-permission is needed in the future, install it:
# pip install django-permission
# and uncomment the logic below.

# from permission.logics import AuthorPermissionLogic, CollaboratorsPermissionLogic
#
# PERMISSION_LOGICS = (
#     ('Attendance.Employee', AuthorPermissionLogic()),
#     ('Attendance.Employee', CollaboratorsPermissionLogic()),
# )

PERMISSION_LOGICS = ()