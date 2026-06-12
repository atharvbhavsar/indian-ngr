import os
import glob

search_dir = r"d:\RailwayWeb\RailwayWeb\frontend\src"
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith((".js", ".jsx")):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f, 1):
                    if "handleSubmitUser" in line or "handleSaveUser" in line:
                        print(f"{path} L{idx}: {line.strip()}")
