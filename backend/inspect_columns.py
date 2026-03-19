import pandas as pd
import sys

# Set stdout to utf-8
sys.stdout.reconfigure(encoding='utf-8')

try:
    df = pd.read_csv(r"C:\Users\shash\Desktop\wbda\data\2000.csv", encoding='latin1')
    print("Columns found:")
    for col in df.columns:
        print(f"'{col}'")
except Exception as e:
    print(e)
