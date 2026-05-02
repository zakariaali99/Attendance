import os
import django
from django.test import Client
from VIPAlert.models import User

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'HTI.settings')
django.setup()

c = Client()
# find a superuser or any user
user = User.objects.first()
c.force_login(user)

try:
    response = c.get('/list')
    print("Status code:", response.status_code)
    if response.status_code == 500:
        print("Response content:")
        print(response.content.decode('utf-8'))
except Exception as e:
    import traceback
    traceback.print_exc()

