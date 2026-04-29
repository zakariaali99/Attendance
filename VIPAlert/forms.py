from django import forms
from django import forms
from django.contrib.auth.models import Permission
from django.forms import CheckboxSelectMultiple
from VIPAlert.models import User



class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(attrs={
        'class': 'form-control rounded-pill',
        'placeholder': 'كلمة المرور (اتركه فارغاً للحفاظ على القديمة)'
    }), required=False)
    
    user_permissions = forms.ModelMultipleChoiceField(
        queryset=Permission.objects.filter(content_type__app_label='VIPAlert', codename__startswith='can_'),
        widget=forms.CheckboxSelectMultiple(attrs={'class': 'permission-checkbox'}),
        required=False,
        label="الصلاحيات"
    )

    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'is_admin', 'user_type', 'user_permissions']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control rounded-pill', 'placeholder': 'الاسم بالكامل'}),
            'email': forms.EmailInput(attrs={'class': 'form-control rounded-pill', 'placeholder': 'البريد الإلكتروني'}),
            'user_type': forms.Select(attrs={'class': 'form-control rounded-pill'}),
            'is_admin': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.fields['user_permissions'].initial = self.instance.user_permissions.all()

    def save(self, commit=True):
        user = super().save(commit=False)
        password = self.cleaned_data.get("password")
        if password:
            user.set_password(password)
        
        if commit:
            user.save()
            if 'user_permissions' in self.cleaned_data:
                user.user_permissions.set(self.cleaned_data['user_permissions'])
        return user


class LoginForm(forms.Form):
    identifier = forms.CharField(required=True, max_length=4096)
    password = forms.CharField(max_length=4096, required=True, widget=forms.PasswordInput)

    identifier.widget.attrs = {
        'class': 'form-control rounded-pill',
        'placeholder': 'اسم المستخدم أو البريد الإلكتروني'
    }

    password.widget.attrs = {
        'class': 'form-control rounded-pill',
        'placeholder': 'كلمة المرور'
    }
    def clean(self):
        self.clean_user()
        return super().clean()


    def clean_user(self):
        identifier = self.cleaned_data["identifier"].strip()
        pw = self.cleaned_data["password"]
        users = User.objects.filter(email__iexact=identifier)
        if users.count() <= 0:
            users = User.objects.filter(name__iexact=identifier)
        if users.count() > 0:
            user = users.first()
            if user.check_password(pw):
                return user

        raise forms.ValidationError("Wrong user name or password.")
        return None
