import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "HTI.settings")
django.setup()

from django.test import Client
from django.contrib.auth.models import User

c = Client()
user = User.objects.first()
if user:
    c.force_login(user)

response = c.get('/vacation/view')
print("Status Code:", response.status_code)
if response.status_code == 500:
    print(response.content.decode('utf-8'))
