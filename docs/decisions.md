# Decisions and known issues

## Decisions
1. **Separate repo and app.** The website (FurCon-Map-Track) stays exactly as it is. This app
   reads a snapshot of its data. (Reason: different runtimes, different release cycles.)
2. **Expo + React Native + TypeScript, built as a development build.** MapLibre has native code,
   so Expo Go can't run it. (Reason: one codebase for Android and iOS, builds from Windows via EAS.)
3. **MapLibre + OpenFreeMap tiles** (`src/config.ts`, one line to swap). Vector tiles on the GPU
   give smooth pan/zoom and fast pin rendering; OpenFreeMap needs no API key or billing account.
   It is donation-funded public infrastructure, so before a big launch either sponsor it or
   self-host tiles (e.g. Protomaps). Alternatives considered: Google Maps (needs a Cloud billing
   account and key), Apple Maps (iOS only).
4. **Circle layers, not image markers.** No asset-sizing guesswork, one GPU draw. A paw icon is
   a polish task once it can be tuned on a real screen.
5. **Bundled snapshot is the initial cache.** The app paints from data on the device. The API
   refresh and local cache come in a later milestone. The website API must be locked down
   (writes require auth) before it is hosted for the app.
6. **GPS "Near me" replaces typed-address geocoding in v1.** The website geocodes through the
   public Nominatim service, which has strict usage limits; GPS needs no third party.
7. **Travel estimates keep the website's rules** ($0.50/mile; flight tiers 200/350/500) with two
   guards: no driving cost beyond 1,500 miles, no flight price beyond 3,500 miles.

8. **Paw pins are images drawn on the GPU** (`assets/paw*.png`, made by `scripts/make_paw_icons.py`
   at 1x/2x/3x so they're the same size and sharp on every phone). Selected = bigger paw plus a halo.
   Saved = a gold ring. Past events = gray paw.
9. **Dark mode follows the phone** and swaps the basemap to OpenFreeMap's `dark` style, which is
   an unmodified upstream fork and marked incomplete there. Good enough for now; restyle after launch.
   All UI colors are in `src/theme.ts` and a test enforces WCAG AA contrast for both palettes.
10. **The "you are here" radar is a native view anchored to the map (`Marker`) animated with
    Reanimated**, so the pulse runs on the UI thread and never re-renders React or the map.
11. **One bottom sheet, two contents** (details or a list), floating above a bottom bar with three
    buttons. Fewer gesture conflicts than stacked sheets. The Android back button steps out
    of details, then the list.
12. **Saved conventions live on the device** in `expo-sqlite`'s key-value store, read synchronously at
    startup so there's no loading flash. They will sync to an account if/when accounts exist.
13. **Flights button always shows.** For events with stale dates it searches by city only.

## Travel-cost estimate: recommendation
Keep it a labeled rough estimate (people drive different cars). The upgrade that costs almost
nothing: let the user set their own MPG and gas price once (saved on the device) and show
`road miles / MPG * price`, with road miles approximated as straight-line miles x 1.25. Replace the
made-up flight price tiers with the Flights button, which shows real prices. Live gas prices and
real routing are paid or keyed APIs, so only add them if they prove worth it.

## Data issues found in the website repo (not fixed there)
- **All 100 conventions are dated 2025.** The app shows a notice until dates are refreshed.
- **Corrupted accents in `data/conventions.db`** (Malmö became MalmÃ¶): the seed `.sql` was read
  with the Windows default encoding. The export script reads the `.sql` as UTF-8 instead. Website
  fix: `open(SEED_SQL_PATH, 'r', encoding='utf-8')`, then rebuild the database.
- **48 of 100 conventions are outside the US** (6 in Canada, 42 elsewhere), and for non-US events the `state` column holds a country name.
- **`Futerkon` has placeholder coordinates (50.0, 20.0).**
- **Check WikiFur's license/terms** before shipping its data in a published app.

## Not yet verified
- Nothing here has been run on a physical device or emulator yet. The JavaScript bundle compiles,
  the native project generates, the types check, and the 25 unit tests pass.
