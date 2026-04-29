import pandas as pd
import sys

def inspect_file(file_path):
    print(f"--- Inspecting {file_path} ---")
    try:
        # For .xls files, we might need xlrd
        if file_path.endswith('.xls'):
            df = pd.read_excel(file_path, engine='xlrd')
        else:
            df = pd.read_excel(file_path)
        
        print("Headers:", df.columns.tolist())
        print("Sample Data (First 5 rows):")
        print(df.head().to_string())
        print("\n")
    except Exception as e:
        print(f"Error reading {file_path}: {e}")

inspect_file('/Users/zakaria/projects/antigravity/attendance/data/InOutData.xls')
inspect_file('/Users/zakaria/projects/antigravity/attendance/data/report (7).xlsx')
