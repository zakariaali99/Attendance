# دليل تشغيل تطبيق سطح المكتب الخوارزمي

## نظرة عامة

يوفر هذا الدليل طريقتين لتشغيل نظام حضور وانصراف الخوارزمي:

1. **الطريقة الأولى: سطح المكتب (Electron)** - تشغيل ك تطبيق سطح مكتب
2. **الطريقة الثانية: خادم Windows (NSSM)** - تشغيل كخدمة نظام

---

## الطريقة الأولى: تشغيل ك تطبيق سطح المكتب (Electron)

### المتطلبات

1. **Python 3.11+** - يجب تثبيت Python
2. **Node.js 18+** - مطلوب لبناء التطبيق
3. **PyInstaller** - سيُثبت تلقائياً أثناء البناء

###步骤 خطوة بخطوة

#### الخطوة 1: التحقق من المتطلبات

افتح CMD ونفذ الأوامر التالية:

```cmd
python --version
node --version
npm --version
```

Если لم يتم تثبيت أي منهما، قم بتثبيتها:
- Python: https://www.python.org/downloads/
- Node.js: https://nodejs.org/

#### الخطوة 2: تنزيل الكود

```cmd
git clone https://github.com/zakariaali99/testAttendance.git
cd testAttendance
```

#### الخطوة 3: بناء التطبيق

```cmd
cd electron
build-app.bat
```

سترى النتيجة التالية:
```
[1/5] Installing Python dependencies...
[2/5] Building Django executable with PyInstaller...
[3/5] Copying built files to electron/build...
[4/5] Installing Node.js dependencies...
[5/5] Building Electron app...
```

#### الخطوة 4: تشغيل التطبيق

بعد البناء، ستجد ملف التنصيب في:
```
electron/dist/Al-Khwarizmi-Attendance-Setup.exe
```

قم بتشغيل هذا الملف واتبع خطوات التثبيت.

#### الخطوة 5: تشغيل التطبيق المُثبت

بعد التثبيت، ستجد التطبيق في:
- سطح المكتب: اختصار "Al-Khwarizmi Attendance"
- قائمة ابدأ: "Al-Khwarizmi Attendance"

---

## الطريقة الثانية: تشغيل كخدمة Windows (NSSM)

### المتطلبات

1. **Python 3.11+**
2. **NSSM** - أداة إدارة خدمات Windows

###步骤 خطوة بخطوة

#### الخطوة 1: تنزيل NSSM

1. اذهب إلى: https://nssm.cc/download
2. حمل الإصدار الأخير (nssm-2.24.zip)
3. فك الضغط ونسخ `nssm.exe` إلى مسار النظام أو إلى مجلد المشروع

#### الخطوة 2: إعداد Python

افتح ملف `setup_service.bat` وعدّل السطر:
```batch
set PYTHON_PATH=C:\path\to\your\python.exe
```
لوضع المسار الصحيح لـ Python على جهازك.

#### الخطوة 3: تثبيت الخدمة

```cmd
setup_service.bat
```

#### الخطوة 4: تشغيل الخدمة

```cmd
nssm start AlKhwarizmiAttendance
```

#### الخطوة 5: الوصول للنظام

افتح المتصفح وانتقل إلى:
```
http://localhost:8000
```

---

## جدول مقارنة الطريقتين

| الخاصية | Electron (سطح المكتب) | NSSM (خدمة) |
|---------|----------------------|--------------|
| الواجهة | تطبيق سطح مكتب | متصفح الويب |
| التشغيل | اختصار على سطح المكتب | خدمة نظام |
| البريد | 8765 | 8000 |
| التثبيت | تنصيب MSI/EXE | إعداد NSSM |
| التحديث | إعادة التثبيت | تحديث الكود |

---

## حل المشاكل الشائعة

### مشكلة: "Python not found"

الحل: تأكد من تثبيت Python وإضافته لـ PATH

### مشكلة: "Node.js not found"

الحل: ثبت Node.js من الموقع الرسمي

### مشكلة: "Port already in use"

الحل: تأكد من إغلاق أي تطبيقات أخرى تستخدم نفس المنفذ

### مشكلة: الخدمة لا تبدأ

الحل: افتح سجل الأحداث وأبحث عن الأخطاء:
```cmd
eventvwr
```
ابحث في "Application Logs"

---

## إعدادات البيئة

### متغيرات البيئة الداخلية

| المتغير | الوصف | القيمة الافتراضية |
|---------|-------|------------------|
| `PORT` | رقم المنفذ | 8000 (NSSM) / 8765 (Electron) |
| `HOST` | عنوان المضيف | 0.0.0.0 |
| `DEBUG` | وضع التصحيح | False |
| `DESKTOP_MODE` | وضع سطح المكتب | 1 (Electron) / 0 (NSSM) |

### لتغيير رقم المنفذ (NSSM):

```batch
set PORT=9000
python run_server.py
```

---

## تحديث النظام

### لـ Electron:
1..Build مجلد جديد من الكود المحدث
2. شغل ملف التنصيب الجديد

### لـ NSSM:
1. أوقف الخدمة: `nssm stop AlKhwarizmiAttendance`
2.حدث الكود
3. أعد تشغيل الخدمة: `nssm start AlKhwarizmiAttendance`

---

## معلومات تقنية

### المنافذ المستخدمة:
- **8765** - تطبيق Electron (الاتصال الداخلي)
- **8000** - خدمة NSSM

### مسار الملفات:
- **التطبيق**: `electron/dist/`
- **البناء**: `electron/build/`
- **السجلات**: `electron/logs/`

---

## الدعم الفني

للأسئلة أو المشاكل:
- راجع ملف PRODUCTION_DEPLOYMENT.md
- تحقق من سجلات الأخطاء في مجلد logs