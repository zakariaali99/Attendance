from permission.logics import *
# from permission.logics import CollaboratorxsPermissionLogic

PERMISSION_LOGICS = (
    ('Attendance.Employee', AuthorPermissionLogic()),
    ('Attendance.Employee', CollaboratorsPermissionLogic()),
)
