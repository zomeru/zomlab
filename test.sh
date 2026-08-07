# #!/usr/bin/env bash
# set -euo pipefail

# PROJECT="/Users/zomeru/Desktop/zomlab"
# HISTORY="$HOME/Library/Application Support/Code - Insiders/User/History"

# echo "Project: $PROJECT"
# echo "History: $HISTORY"
# echo

# if [[ ! -d "$HISTORY" ]]; then
#   echo "VS Code Insiders history folder not found:"
#   echo "$HISTORY"
#   exit 1
# fi

# read -r -p "Restore latest VS Code history for every project file? [y/N] " answer
# [[ "$answer" =~ ^[Yy]$ ]] || exit 0

# python3 <<'PY'
# import json
# import shutil
# from pathlib import Path
# from urllib.parse import urlparse, unquote

# PROJECT = Path("/Users/zomeru/Desktop/zomlab").resolve()
# HISTORY = Path.home() / "Library/Application Support/Code - Insiders/User/History"

# restored = 0
# missing = 0
# errors = 0

# for metadata in HISTORY.rglob("entries.json"):
#     try:
#         data = json.loads(metadata.read_text())
#         resource = data.get("resource")
#         entries = data.get("entries", [])

#         if not resource or not entries:
#             continue

#         parsed = urlparse(resource)
#         if parsed.scheme != "file":
#             continue

#         original = Path(unquote(parsed.path)).resolve()

#         try:
#             relative = original.relative_to(PROJECT)
#         except ValueError:
#             continue

#         if relative.parts and relative.parts[0] == ".git":
#             continue

#         latest = max(entries, key=lambda e: e.get("timestamp", 0))
#         snapshot = metadata.parent / latest["id"]

#         if not snapshot.is_file():
#             print(f"MISSING: {relative}")
#             missing += 1
#             continue

#         destination = PROJECT / relative
#         destination.parent.mkdir(parents=True, exist_ok=True)
#         shutil.copy2(snapshot, destination)

#         print(f"RESTORED: {relative}")
#         restored += 1

#     except Exception as exc:
#         print(f"ERROR: {metadata}: {exc}")
#         errors += 1

# print()
# print("Recovery complete")
# print(f"Restored: {restored}")
# print(f"Missing:  {missing}")
# print(f"Errors:   {errors}")
# PY

python3 <<'PY'
import json
import shutil
from pathlib import Path
from urllib.parse import unquote, urlparse

folder = Path.home() / "Library/Application Support/Code - Insiders/User/History/-29c2f4ca"
data = json.loads((folder / "entries.json").read_text())

matches = []

for e in data["entries"]:
    snapshot = folder / e["id"]

    if not snapshot.is_file():
        continue

    text = snapshot.read_text(errors="ignore")

    if all(x in text for x in (
        "healthResponseSchema",
        "readyResponseSchema",
        "versionResponseSchema",
    )):
        matches.append((e.get("timestamp", 0), snapshot))

if not matches:
    raise SystemExit("No matching history version found")

_, snapshot = max(matches)

resource = data["resource"]
parsed = urlparse(resource)
destination = Path(unquote(parsed.path))

destination.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(snapshot, destination)

print(f"Restored:")
print(f"  {snapshot}")
print(f"-> {destination}")
PY