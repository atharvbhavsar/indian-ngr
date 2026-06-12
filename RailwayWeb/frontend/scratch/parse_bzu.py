import zipfile
import xml.etree.ElementTree as ET
import os
import json

def read_xlsx(filename):
    ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(filename) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            sst_xml = z.read('xl/sharedStrings.xml')
            sst_root = ET.fromstring(sst_xml)
            strings = [t.text if t.text is not None else "" for t in sst_root.findall('.//ns:t', ns)]
        
        sheet_xml = z.read('xl/worksheets/sheet1.xml')
        sheet_root = ET.fromstring(sheet_xml)
        
        rows = []
        for row in sheet_root.findall('.//ns:row', ns):
            row_data = {}
            for cell in row.findall('ns:c', ns):
                cell_ref = cell.get('r')
                col_letter = ''.join(filter(str.isalpha, cell_ref))
                
                val_el = cell.find('ns:v', ns)
                if val_el is not None:
                    val = val_el.text
                    cell_type = cell.get('t')
                    if cell_type == 's':
                        val = strings[int(val)]
                    row_data[col_letter] = val
                else:
                    row_data[col_letter] = None
            rows.append(row_data)
        return rows

excel_path = r"d:\RailwayWeb\RailwayWeb\frontend\TI BZU.xlsx"
output_path = r"d:\RailwayWeb\RailwayWeb\frontend\scratch\bzu_data.json"
if os.path.exists(excel_path):
    rows = read_xlsx(excel_path)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(rows, f, indent=2)
    print(f"Parsed data written to {output_path}")
else:
    print(f"File not found: {excel_path}")
