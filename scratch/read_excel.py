import pandas as pd
import json

file_path = r"d:\RailwayWeb\RailwayWeb\frontend\TI BZU.xlsx"
df = pd.read_excel(file_path, sheet_name="Sheet1", header=None)

# Row 0 is header.
# Let's find data rows: rows where column 1 (Name) and column 4 (HRMS id) are not empty/nan, and row index > 0.
data_list = []
for idx in range(1, len(df)):
    row = df.iloc[idx].tolist()
    station = str(row[0]).strip() if pd.notna(row[0]) else ""
    name = str(row[1]).strip() if pd.notna(row[1]) else ""
    desig = str(row[2]).strip() if pd.notna(row[2]) else ""
    pf_no = str(row[3]).strip() if pd.notna(row[3]) else ""
    hrms_id = str(row[4]).strip() if pd.notna(row[4]) else ""
    mobile = str(row[5]).strip() if pd.notna(row[5]) else ""
    grade = str(row[6]).strip() if pd.notna(row[6]) else ""

    # Clean float strings (.0)
    if pf_no.endswith(".0"):
        pf_no = pf_no[:-2]
    if mobile.endswith(".0"):
        mobile = mobile[:-2]

    # Skip rows that are header separators (like "1.KRTH")
    if not name or name.lower() == "nan" or hrms_id.lower() == "nan":
        continue

    # Standardize designation
    desig_lower = desig.lower()
    if "pointsman" in desig_lower or desig_lower == "pm" or desig_lower == "pm a" or desig_lower == "pm b":
        std_desig = "Pointsman"
    elif "station master" in desig_lower or "stationmaster" in desig_lower or desig_lower == "sm" or desig_lower == "station master":
        std_desig = "Station Master"
    elif "ti" in desig_lower or "traffic inspector" in desig_lower:
        std_desig = "Traffic Inspector"
    else:
        std_desig = desig

    # Standardize grade
    grade = grade.upper().strip()
    if grade not in ["A", "B", "C", "D"]:
        grade = "Untested"

    data_list.append({
        "station": station.upper(),
        "name": name,
        "designation": std_desig,
        "pf_no": pf_no,
        "hrms_id": hrms_id.upper(),
        "mobile_no": mobile,
        "grade": grade
    })

print(f"Total cleaned records extracted: {len(data_list)}")
print("First 3 records:", json.dumps(data_list[:3], indent=2))

with open(r"d:\RailwayWeb\scratch\ti_bzu_data.json", "w") as f:
    json.dump(data_list, f, indent=2)
