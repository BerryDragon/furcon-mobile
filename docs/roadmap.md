# Roadmap

## Now (this update): functionality
Paw pins, dark mode, "where am I" with radar, Nearest 10 with dotted lines, Saved, Popular,
Flights link, fast dev loop.

## Next
1. **Data refresh.** Every convention gets current dates plus a source and a verified-on date.
   A past event is never shown as upcoming. Start with the top ~25 verified by hand, then widen.
2. **Scraper / auto-update** (hotels, venue, dates). Design it as a script that proposes changes
   you approve, not one that silently overwrites. Before building it, check WikiFur's license and
   each source site's terms; prefer official convention sites and APIs over scraping where possible.
3. **Lock down and host the website API** (writes need auth), then have the app refresh from it
   into a local cache.
4. **Trip cost, version 2** ("your car" MPG and gas price; see `docs/decisions.md`).
5. **Release prep (Android):** app icon and splash, permissions audit, privacy policy, Play listing
   (Google Play is a one-time $25).

## Later (each is its own project, so it gets its own spec)
- **iOS.** Same codebase. Needs an Apple Developer account ($99/year). EAS can build it from Windows.
- **Accounts and friends sharing locations.** This is a real backend plus a privacy design problem:
  explicit opt-in, friends-only, a "ghost mode", coarse location by default, easy blocking and
  reporting, and Apple/Google privacy disclosures. Conventions include minors, so safety defaults
  matter more than features here.
- **Status updates** ("Going to Megaplex"): small and safe once accounts exist.
- **"Find your homie" mode (Pokemon Go style).** Needs live location, a realtime backend, and a plan
  for the fact that GPS is unreliable inside big convention centers (walls, crowds, multiple floors).
  Indoor positioning (Bluetooth beacons, venue maps) is a research task before it's a coding task.
- **Street-view-style visuals** at the venue: depends on the licensing of any imagery used.
- **Custom map look** after launch (restyle the basemap in Maputnik and host the style file).
