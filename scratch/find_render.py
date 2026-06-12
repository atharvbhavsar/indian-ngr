with open(r"d:\RailwayWeb\RailwayWeb\frontend\src\constants\aomMockData.js", "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f, 1):
        if "initialUserFormData" in line or "export const initialUserFormData" in line:
            print(f"L{idx}: {line.strip()}")
            # print next 10 lines
            for j in range(idx, min(idx + 15, len(f.readlines()) + idx)):
                print(f"  {j+1}: {f.readlines()[j].strip() if j < len(f.readlines()) else ''}")
