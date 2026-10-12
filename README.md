# FurCon Map (mobile)

A fast, smooth map of furry conventions for Android (and later iOS). Built with Expo (React Native),
TypeScript, and MapLibre. This is the mobile companion to the website repo, FurCon-Map-Track.

**What it does now:** full-screen vector map with purple paw pins, tap a pin for a swipe-up details
sheet, instant search, a "where am I" button (zooms in with a radar ping), three bottom buttons
(Nearest 10, Saved, Popular), animated paw steps from your location to the selected convention,
save conventions on the phone, flights and
directions links, rough travel estimates, and a saved light/dark mode choice that starts by
following the phone setting.

## Run it on your Android phone (Windows)

You need: Node.js LTS (`node -v`), Git, a free account at expo.dev, and your Android phone.

MapLibre contains native code, so this app can't run inside the Expo Go app. You build a small
"development build" of your own app once (in Expo's cloud, no Android Studio needed), install it
on your phone, and from then on it hot-reloads from your PC like Expo Go does.

1. `npm install`
2. `npx eas-cli@latest login` (sign in with your expo.dev account)
3. `npx eas-cli@latest init` (links this folder to your Expo account; answer yes)
4. `npx eas-cli@latest build --profile development --platform android`
   - Say yes when it offers to generate a keystore.
   - It takes roughly 10-20 minutes. The free plan has a limited number of builds, so don't
     rebuild unless you add a native library or change `app.json`.
   - When it finishes, open the link or QR code on your phone, download the APK, and install it
     (Android will ask you to allow installs from your browser).
5. `npx expo start --dev-client`
6. Open the **FurCon Map** app you just installed and connect to the server (scan the QR code or
   pick it from the list). Phone and PC must be on the same Wi-Fi. If they can't see each other,
   use `npx expo start --dev-client --tunnel`.

### What "working" looks like
- A map of the US with unlabeled purple cluster circles and purple paw pins.
- Past event dates are shown without a dataset warning. The data refresh milestone updates them
  before launch.
- Tap a cluster and it zooms in. Tap a dot and a sheet slides up; drag it up for more.
- Type "anthro" in the search bar, tap a result, and the map flies there.
- Tap the round target button, allow location, and the map frames you and the five nearest conventions.

If something looks wrong, take a screenshot and note which step it happened on.

## The fast loop (so you don't reinstall the app for every change)

There are two kinds of build, and mixing them up is the usual reason changes "don't show up":

| Build | Command | What it is |
|---|---|---|
| **development** | `eas build --profile development --platform android` | Your own dev app. It connects to your PC, so edits to the code appear on the phone in 1-2 seconds. **Use this for daily work.** |
| **preview** | `eas build --profile preview --platform android` | A finished, standalone app with the code frozen inside. Every change needs a new build. Use it only to hand a test copy to a friend. |

Daily loop once the development app is installed:
1. `npx expo start --dev-client` on your PC.
2. Open the **FurCon Map** app on your phone. It connects to your PC.
3. Edit a file in VS Code, save, and the phone updates by itself.

You only need a new development build when you add or remove a **native** library, or change
plugins in `app.json`. Changing screens, colors, logic, or data never needs one.

## Appearance
Tap the sun/moon button beside the location control to switch between light and dark mode. Until
you choose, the app follows your phone's setting. Your choice is saved on this phone.

## Everyday commands
- `npm run typecheck` and `npm test` (47 tests). Run both before every commit.
- `npm run export-seed` re-exports the data. Edit the path in `package.json` if the website repo
  isn't next to this folder.

## Docs
- `docs/roadmap.md`: what's next, and the big ideas parked for later.
- `docs/constitution.md`: the rules (code, speed budgets, data, privacy). Paste it into Spec Kit.
- `docs/decisions.md`: why things are the way they are, plus known data problems.
- `AGENTS.md`: facts and guardrails for Copilot or any coding agent working in this repo.

## Roadmap (short version; the long version is in docs/roadmap.md)
1. Data refresh: current dates, source and verified-on fields, a repeatable process.
2. Lock down the website API (writes need auth), host it, and have the app refresh from it into a
   local cache.
3. A "Nearby" list view, favorites saved on the device.
4. Polish: paw icon, app icon and splash, tuned animations.
5. Release: audit Android permissions, privacy policy, store listing. iOS needs an Apple Developer
   account ($99/year); Google Play is a one-time $25.
