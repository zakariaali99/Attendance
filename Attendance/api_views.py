from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *

class EmployeeList(ListCreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

class EmployeeDetail(RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated]

class DeviceList(ListCreateAPIView):
    queryset = ZKTDevice.objects.all()
    serializer_class = ZKTDeviceSerializer
    permission_classes = [IsAuthenticated]

class ProfileList(ListCreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

class RecordList(ListAPIView):
    queryset = Record.objects.all().order_by('-timestamp')
    serializer_class = RecordSerializer
    filterset_fields = ['user_id', 'device']
    permission_classes = [IsAuthenticated]

class VacationList(ListCreateAPIView):
    queryset = Vacation.objects.all()
    serializer_class = VacationSerializer
    filterset_fields = ['employee']
    permission_classes = [IsAuthenticated]
