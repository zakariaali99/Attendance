from django.contrib import admin
from django.urls import path, include
from .api_views import *

app_name = "AttendanceAPI"

urlpatterns = [
    path('employees/', EmployeeList.as_view(), name="list"),
    path('employees/<int:pk>/', EmployeeDetail.as_view(), name="detail"),
    path('devices/', DeviceList.as_view(), name="device_list"),
    path('profiles/', ProfileList.as_view(), name="profile_list"),
    path('records/', RecordList.as_view(), name="record_list"),
    path('vacations/', VacationList.as_view(), name="vacation_list"),
]

