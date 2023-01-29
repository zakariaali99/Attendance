from django.contrib import admin
from django.urls import path, include
from .api_views import *

app_name = "AttendanceAPI"

urlpatterns = [

    path('employee/list', EmployeeList.as_view(), name="list"),
    
]

