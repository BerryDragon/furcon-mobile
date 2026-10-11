# FurCon Map Constitution

Paste this into Spec Kit's `/speckit.constitution` (or keep it as-is). Every spec, plan,
and task must comply with it.

## 1. Write the least code that fully solves the problem (the "ponytail" ladder)
Before adding code, climb down this ladder and stop at the first rung that works:
1. Does it need to exist at all? (Delete or skip it.)
2. Is it already in this repo? (Reuse it.)
3. Does the platform, language, or standard library do it? (Use that.)
4. Does a dependency we already installed do it?
5. Is it one small function? (Write it, with a test.)
6. A new dependency is allowed only with a one-line reason recorded in `docs/decisions.md`.

**Never cut:** input validation, error handling, security, privacy, accessibility, or tests
for logic. "Minimal" means no waste, not no safety.

## 2. Speed is a feature, with numbers
Measure on a real mid-range Android phone, release-like build.
- Cold start to an interactive map: under 2 seconds (tiles may arrive after).
- Pan and zoom: 55+ fps average, no stalls over 100 ms.
- Tap a pin to a visible details sheet: under 100 ms (data is local, nothing to wait for).
- Search results update: under 50 ms per keystroke.
- No layout shift: sheets and lists have fixed structure; images and icons have fixed sizes.
- Hermes JS bundle: 4 MB ceiling (3 MB at the first build).
- Nothing on the path to first paint depends on the network except map tiles.

How we get there (borrowed from McMaster-Carr's playbook, translated to mobile): render from
data already on the device, precompute before the user asks, prefetch on intent, never show a
spinner where cached data will do, keep the UI thread free (panning never re-renders React).

## 3. The dataset is a product feature
- A past event is never presented as upcoming. No guessed or invented dates, ever.
- Every convention carries a source and a date it was last verified (added in the data-refresh
  milestone). Refreshing is a repeatable script plus a checklist, not a one-off task.
- Travel costs are always labeled as rough estimates.

## 4. Privacy by default
- Location is requested only when the user taps "Near me", used on the device, and never
  transmitted, logged, or stored.
- No analytics, ads, or tracking SDKs.
- A privacy policy exists before any store submission.

## 5. Security
- Public APIs are read-only. Anything that writes requires authorization and is not in the app.
- No secrets in the repo or the app bundle. Any third-party key is restricted to this app.

## 6. Accessibility
- Touch targets at least 48 dp. Text contrast at WCAG AA or better.
- Every control has a screen-reader label. Meaning never depends on color alone.
- Respect the OS "reduce motion" and font-size settings.

## 7. Process
- Work in small milestones; each ends with `npm run typecheck && npm test` passing and a
  short written summary of what changed and what is still unverified.
- Don't rewrite working code just because a newer pattern is prettier.
