"""Export the convention seed data from the website repo into this app.

Usage (run from the mobile repo root):
    python scripts/export_seed.py --sql ../FurCon-Map-Track/data/seed_conventions.sql

Why the SQL file and not conventions.db: the shipped .db was built by reading the
seed file with Windows' default encoding, which corrupted accented names
(Malmö -> MalmÃ¶). The seed .sql is correct UTF-8, so we load that into a
throwaway in-memory database and export from there.
"""
import argparse
import json
import sqlite3
from datetime import date
from pathlib import Path

COLUMNS = (
    "convention_id, name, city, state, start_date, end_date, latitude, longitude, "
    "popularity_rank, last_year_attendance, website_url"
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sql", required=True, help="path to seed_conventions.sql")
    parser.add_argument("--out", default="src/data/conventions.seed.json")
    args = parser.parse_args()

    db = sqlite3.connect(":memory:")
    db.executescript(Path(args.sql).read_text(encoding="utf-8"))
    rows = db.execute(f"SELECT {COLUMNS} FROM conventions ORDER BY popularity_rank").fetchall()

    conventions = [
        {
            "id": r[0],
            "name": r[1],
            "city": r[2],
            "state": r[3],
            "startDate": r[4],
            "endDate": r[5],
            "latitude": r[6],
            "longitude": r[7],
            "popularityRank": r[8],
            "lastYearAttendance": r[9],
            "websiteUrl": r[10] or None,
        }
        for r in rows
    ]
    payload = {
        "meta": {
            "generatedAt": date.today().isoformat(),
            "source": "FurCon-Map-Track data/seed_conventions.sql",
            "count": len(conventions),
        },
        "conventions": conventions,
    }
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"Wrote {len(conventions)} conventions to {out}")


if __name__ == "__main__":
    main()
