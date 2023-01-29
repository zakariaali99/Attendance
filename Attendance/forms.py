from django import forms
from django.utils import timezone

from .models import *


class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        # fields = '__all__'  # ['name', 'phone', 'email', 'start_date', 'expire_date']
        exclude = ["password", "device"]

        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'الاسم'}),

            'attendance_id': forms.TextInput(attrs={
                'rows': 3,
                'class': 'form-control rounded-pill',
                'placeholder': 'رقم الموظف'})
            ,
            'phone': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'رقم الموظف'})
            ,
            'default_profile': forms.Select(attrs={
                'class': 'form-control rounded-pill',

            })
            ,'current_vacations': forms.NumberInput(attrs={
                'class': 'form-control rounded-pill',

            }),
        }



class ProfileForm(forms.ModelForm):
    class Meta:
        model = Profile
        # fields = '__all__'  # ['name', 'phone', 'email', 'start_date', 'expire_date']
        exclude = ["days", ]

        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'اسم الوردية'
            }),

            'start_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                # 'placeholder': 'رقم الموظف',
                'type': 'time'
            })
            ,
            'end_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                # 'placeholder': 'البريد الالكتروني',
                'type': 'time'
            }),

            'allowed_start_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                
                'type': 'time'
            }),
            'calculate_start_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                
                'type': 'time'
            }),
            'calculate_end_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                
                'type': 'time'
            }),
            'allowed_end_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                # 'placeholder': 'تاريخ بداية العقد',
                'type': 'time'
            }),
            'shift_start_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                # 'placeholder': 'تاريخ بداية ',
                'type': 'time'
            }),
            'shift_end_time': forms.TimeInput(attrs={
                'class': 'form-control rounded-pill',
                # 'placeholder': 'تاريخ بداية العقد',
                'type': 'time'
            }),
            'days': forms.CheckboxSelectMultiple(attrs={
                # 'class': 'form-control rounded-pill',
                # 'placeholder': 'تاريخ بداية العقد',

            }),
        }
       


class DeviceForm(forms.ModelForm):
    class Meta:
        model = ZKTDevice
        fields = '__all__'  # ['name', 'phone', 'email', 'start_date', 'expire_date']


        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'الاسم'}),

            'ip': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'عنوان الجهاز (IP)'})
            ,
            'port': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                'placeholder': 'المنفذ (Port)'})
            ,
        }


class ReportFilterForm(forms.Form):
    from_date = forms.DateField(initial=timezone.now().date())
    to_date = forms.DateField(initial=timezone.now().date())
    # device = forms.ModelChoiceField(queryset=ZKTDevice.objects.all(), initial=ZKTDevice.objects.order_by('id').first())

    from_date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })
    to_date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })
    # device.widget.attrs = {
    #     'class': 'form-control rounded-pill',
    # }



class AddVacationForm(forms.Form):
    date = forms.DateField(initial=timezone.now().date())
    to_date = forms.DateField(initial=timezone.now().date())
    # type = forms.ModelChoiceField(queryset=VacationType.objects.all(), initial=VacationType.objects.order_by('id').first())
    note = forms.CharField(max_length=250, required=False)
    # employees = forms.ModelMultipleChoiceField(queryset=Employee.objects.filter(active=False))

    # type.widget.attrs = {
    #     'class': 'form-control rounded-pill',
    #     # 'type': 'date'
    # }
    date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })
    to_date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })
    note.widget.attrs = {
        'class': 'form-control rounded-pill',
    }

    # employees.widget.attrs = {
    #     'class': 'form-control rounded w-100',
    # }


class FilterVacationsForm(forms.Form):
    date = forms.DateField(initial=None, required=False)
    to_date = forms.DateField(initial=None, required=False)
    # type = forms.ModelChoiceField(queryset=VacationType.objects.all(), initial=None, required=False)
    # employees = forms.ModelChoiceField(queryset=Employee.objects.filter(active=False), required=False)

    # type.widget.attrs = {
    #     'class': 'form-control rounded-pill',
    #     # 'type': 'date'
    # }

    date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })

    to_date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })

    # employees.widget.attrs = {
    #     'class': 'form-control rounded-pill w-100',
    # }



class AddVacationTypeForm(forms.ModelForm):
    class Meta:
        model = VacationType
        fields = '__all__'  # ['name', 'phone', 'email', 'start_date', 'expire_date']


        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control rounded-pill',
                }),
        }


class EditVacationForm(forms.ModelForm):
    class Meta:
        model = Vacation
        fields = '__all__'  # ['name', 'phone', 'email', 'start_date', 'expire_date']


        widgets = {
            'note': forms.TextInput(attrs={'class': 'form-control rounded-pill'}),
            'date': forms.DateInput(attrs={'class': 'form-control rounded-pill'}),
            'to_date': forms.DateInput(attrs={'class': 'form-control rounded-pill'}),
            'vacation_type': forms.Select(attrs={'class': 'rounded-pill w-100'}),
            'employee': forms.Select(attrs={'class': 'rounded-pill w-100'}),
        }


class FilterExceptionsForm(forms.Form):
    date = forms.DateField(initial=None, required=False)
    to_date = forms.DateField(initial=None, required=False)
    type = forms.ChoiceField(choices=[('','---------')]+Exception.types, initial=None, required=False)
    employees = forms.ModelChoiceField(queryset=Employee.objects.filter(active=False), required=False)

    type.widget.attrs = {
        'class': 'form-control rounded-pill',
        # 'type': 'date'
    }

    date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })

    to_date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })

    employees.widget.attrs = {
        'class': 'form-control rounded-pill w-100',
    }




class AddExceptionForm(forms.Form):
    date = forms.DateField(initial=timezone.now().date())
    # to_date = forms.DateField(initial=timezone.now().date())
    # type = forms.ChoiceField(choices=Exception.types, initial=VacationType.objects.order_by('id').first())
    note = forms.CharField(max_length=250, required=False)
    # employees = forms.ModelMultipleChoiceField(queryset=Employee.objects.filter(active=False))

    # type.widget.attrs = {
    #     'class': 'form-control rounded-pill',
    #     # 'type': 'date'
    # }
    date.widget = forms.DateInput(attrs={
        'class': 'form-control rounded-pill',
        'type': 'date'
    })
    # to_date.widget = forms.DateInput(attrs={
    #     'class': 'form-control rounded-pill',
    #     'type': 'date'
    # })
    note.widget.attrs = {
        'class': 'form-control rounded-pill',
    }

    # employees.widget.attrs = {
    #     'class': 'form-control rounded w-100',
    # }




class EditExceptionForm(forms.ModelForm):
    class Meta:
        model = Exception
        fields = '__all__'  # ['name', 'phone', 'email', 'start_date', 'expire_date']


        widgets = {
            'note': forms.TextInput(attrs={'class': 'form-control rounded-pill'}),
            'date': forms.DateInput(attrs={'class': 'form-control rounded-pill'}),
            
            'type': forms.Select(attrs={'class': 'rounded-pill w-100'}),
            'employee': forms.Select(attrs={'class': 'rounded-pill w-100'}),
        }
