from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .models import *
from .serializers import *

class EmployeeList(ListCreateAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class EmployeeDetail(RetrieveUpdateDestroyAPIView):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

class DeviceList(ListCreateAPIView):
    queryset = ZKTDevice.objects.all()
    serializer_class = ZKTDeviceSerializer

class ProfileList(ListCreateAPIView):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class RecordList(ListAPIView):
    queryset = Record.objects.all().order_by('-timestamp')
    serializer_class = RecordSerializer
    filterset_fields = ['user_id', 'device']

class VacationList(ListCreateAPIView):
    queryset = Vacation.objects.all()
    serializer_class = VacationSerializer
    filterset_fields = ['employee']
