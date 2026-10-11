# FurCon Map (mobile)

Expo (React Native) + TypeScript app: a fast, smooth map of furry conventions.
**Read `docs/constitution.md` first. It is the rulebook, and its rules beat convenience.**

## Facts that your training data probably has wrong
- Expo SDK 57. Versioned docs: https://docs.expo.dev/versions/v57.0.0/ . Don't answer Expo/EAS questions from memory.
- Map library is `@maplibre/maplibre-react-native` **v11**. Components are `Map`, `Camera`, `GeoJSONSource`, `Layer`, `Images`. Older names (`MapView`, `ShapeSource`, `SymbolLayer`, ...) are gone. Layer styles go in a camelCase `style` prop (`circleColor`, `textField`). Read the installed `.d.ts` files in `node_modules/@maplibre/maplibre-react-native/lib/typescript/module/` before using an API.
- MapLibre contains native code, so the app runs in a **development build**, not Expo Go.
- Install Expo-aware packages with `npx expo install <pkg>`, never plain `npm install`.
- TypeScript 6: type packages are opt-in via `types` in `tsconfig.json`.

## Before you say a task is done
`npm run typecheck && npm test`, then summarize what changed and what you could not verify.

## House rules
- Reuse before writing. Delete before adding. Don't rewrite working code to make it prettier.
- Pure logic lives in `src/lib/` with tests in `__tests__/`. Screens and components stay thin.
- Never hand-edit `android/` or `ios/` (they are generated). Native config goes in `app.json` / config plugins.
