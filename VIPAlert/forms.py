from django import forms
from django.contrib.auth.models import Permission
from django.forms import CheckboxSelectMultiple
from VIPAlert.models import User



class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(), required=False)
    password2 = forms.CharField(widget=forms.PasswordInput(), required=False)

    user_permissions = forms.ModelMultipleChoiceField(
        queryset=Permission.objects.filter(content_type_id__gt=7), widget=CheckboxSelectMultiple())

    # user_permissions.widget.attrs = {
    #     "class": 'form-check form-switch'
    # }
    class Meta:
        model = User
        fields = ['name', 'email', 'password', 'is_admin', 'user_type', 'user_permissions']

        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'Your Name'}),
            'email': forms.EmailInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'Your Email',
            }),
            'user_type': forms.Select(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'Select account type'
            }),
            'is_admin': forms.CheckboxInput(attrs={
                'class': 'rounded-pill',
            }),
        }

    password.widget.attrs = {
        'class': 'form-control rounded-pill',
        'placeholder': 'Password'
    }
    password2.widget.attrs = {
        'class': 'form-control rounded-pill',
        'placeholder': 'Retype Password'
    }

    def save(self, commit=True):
        if self.instance:
            if self.instance.id is not None:
                user = self.instance
                user = User.objects.get(id=user.id)
                pw = self.cleaned_data["password"]
                pw2 = self.cleaned_data["password2"]

                if pw == pw2 and len(pw) >= 5:
                    user.set_password(pw)
                print(self.cleaned_data)

                user.user_permissions.clear()
                user.user_permissions.add(*self.cleaned_data["user_permissions"])
                user.name = self.cleaned_data['name']
                user.email = self.cleaned_data['email']
                user.is_admin = self.cleaned_data["is_admin"]
                user.user_type = self.cleaned_data["user_type"]
                user.save()
                return user

        user = super().save(True)
        user.set_password(self.cleaned_data["password"])
        user.save()
        return user

    def clean_password(self):
        if "password" in self.data.keys():
            if self.data["password"] == "":
                return None
            if len(self.data['password']) < 6:
                raise forms.ValidationError("Too Short password")
        self.cleaned_data["password"] = self.data['password']
        return self.cleaned_data["password"]


class LoginForm(forms.Form):
    email = forms.EmailField(required=True)
    password = forms.CharField(max_length=4096, required=True, widget=forms.PasswordInput)

    email.widget.attrs = {
        'class': 'form-control rounded-pill',
        'placeholder': 'البريد الإلكتروني'
    }

    password.widget.attrs = {
        'class': 'form-control rounded-pill',
        'placeholder': 'كلمة المرور'
    }
    def clean(self):
        self.clean_user()
        return super().clean()


    def clean_user(self):
        email = self.cleaned_data["email"]
        pw = self.cleaned_data["password"]
        users = User.objects.filter(email__iexact=email)
        if users.count() > 0:
            user = users.first()
            if user.check_password(pw):
                return user

        raise forms.ValidationError("Wrong user name or password.")
        return None
