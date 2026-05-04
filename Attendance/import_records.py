import xlrd
from .models import Record, Employee, ZKTDevice
from django.utils import timezone
import datetime

def import_records_from_xls(file_path, user=None):
    """
    Imports records from InOutData.xls format using xlrd.
    Headers expected: ['رقم البصمه', 'التاريخ والوقت', 'المكان', 'طريقة التسجيل']
    """
    try:
        workbook = xlrd.open_workbook(file_path)
        sheet = workbook.sheet_by_index(0)
        
        # Get headers
        headers = [str(sheet.cell_value(0, i)).strip() for i in range(sheet.ncols)]
        
        required_cols = ['رقم البصمه', 'التاريخ والوقت']
        col_map = {}
        for col in required_cols:
            if col not in headers:
                return False, f"Missing required column: {col}"
            col_map[col] = headers.index(col)
        
        # Optional columns
        if 'طريقة التسجيل' in headers:
            col_map['طريقة التسجيل'] = headers.index('طريقة التسجيل')
            
        records_to_create = []
        skipped_count = 0
        success_count = 0
        
        for row_idx in range(1, sheet.nrows):
            user_id_val = sheet.cell_value(row_idx, col_map['رقم البصمه'])
            # Handle numeric IDs from Excel
            try:
                user_id = str(int(float(user_id_val)))
            except:
                user_id = str(user_id_val)
                
            timestamp_val = sheet.cell_value(row_idx, col_map['التاريخ والوقت'])
            
            dt = None
            if sheet.cell_type(row_idx, col_map['التاريخ والوقت']) == xlrd.XL_CELL_DATE:
                dt_tuple = xlrd.xldate_as_tuple(timestamp_val, workbook.datemode)
                dt = datetime.datetime(*dt_tuple)
            elif isinstance(timestamp_val, str):
                try:
                    dt = datetime.datetime.strptime(timestamp_val, '%Y-%m-%d %H:%M:%S')
                except ValueError:
                    try:
                        dt = datetime.datetime.strptime(timestamp_val, '%Y/%m/%d %H:%M:%S')
                    except ValueError:
                        continue
            
            if not dt:
                continue
                
            if timezone.is_naive(dt):
                dt = timezone.make_aware(dt)
            
            # Check for duplicates in current session and DB
            if Record.objects.filter(user_id=user_id, timestamp=dt).exists():
                skipped_count += 1
                continue
                
            punch = "IMPORT"
            if 'طريقة التسجيل' in col_map:
                punch = str(sheet.cell_value(row_idx, col_map['طريقة التسجيل']))

            record = Record(
                user_id=user_id,
                timestamp=dt,
                punch=punch,
                note=f"Imported from Excel by {user.name if user else 'System'}"
            )
            records_to_create.append(record)
            success_count += 1
            
        if records_to_create:
            Record.objects.bulk_create(records_to_create)
            
        return True, f"Successfully imported {success_count} records. Skipped {skipped_count} duplicates."
        
    except Exception as e:
        return False, str(e)
