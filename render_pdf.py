from io import StringIO,BytesIO
from xhtml2pdf import pisa
from django.template.loader import get_template
from django.template import Context
from django.http import HttpResponse
from django.utils.safestring import SafeString
# from cgi import escape
from urllib.parse import *
from Attendance.models import *
from django.db.models import Q
import pdfkit

# pdfkit.from_url('https://www.delftstack.com/', 'sample.pdf')

def render_to_pdf(template_src, context_dict):
    template = get_template(template_src)
    context = dict()
    html  = template.render(context)
    print(html)
    print("--------------")
    
    pdfkit.from_string(html, "file.pdf",{
        'encoding': 'UTF-8',
        'enable-local-file-access': True
    },css=[])
    result = BytesIO()
    

    pdf = pisa.pisaDocument(BytesIO(html.encode("utf-8")), result, encoding='utf-8',)
    if not pdf.err:
        return HttpResponse(result.getvalue(), content_type='application/pdf')
    return HttpResponse('We had some errors<pre></pre>' )





# from_date, to_date = "2022-04-01","2022-04-30"
# rcs = Record.objects.filter(Q(timestamp__gte=from_date) & Q(timestamp__lte=to_date) )
# wds = WorkDay.objects.filter(Q(date__gte=from_date) & Q(date__lte=to_date))

# for u in Employee.objects.all():
#     u.set_records(rcs)
#     u.set_workdays(wds)
#     if u.count_hours <= 0:
#         u.active = True
#         u.save()



