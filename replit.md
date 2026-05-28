# Neon Card Corps

A premium cyberpunk roguelike deckbuilder mobile game for iOS and Android.

## Run & Operate

- `pnpm --filter @workspace/neon-card-corps run dev` — run the Expo dev server
- `pnpm run typecheck` — full typecheck across all packages
- Required env: none (frontend-only, uses AsyncStorage)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (SDK 54) + Expo Router
- State: React Context + useReducer (no backend)
- Persistence: AsyncStorage (@react-native-async-storage/async-storage)
- UI: React Native StyleSheet, @expo/vector-icons

## Where things live

- `artifacts/neon-card-corps/` — main mobile app
- `artifacts/neon-card-corps/game/types.ts` — all TypeScript types
- `artifacts/neon-card-corps/game/cards.ts` — 20 data-driven cards
- `artifacts/neon-card-corps/game/enemies.ts` — 8 enemy types + NEXUS-7 boss
- `artifacts/neon-card-corps/game/synergies.ts` — 5 synergy definitions
- `artifacts/neon-card-corps/game/engine.ts` — core combat reducer (pure functions)
- `artifacts/neon-card-corps/context/MetaContext.tsx` — permanent progression (gold, upgrades)
- `artifacts/neon-card-corps/constants/colors.ts` — cyberpunk neon palette
- `artifacts/neon-card-corps/app/(tabs)/index.tsx` — main menu
- `artifacts/neon-card-corps/app/run.tsx` — combat screen (core loop)
- `artifacts/neon-card-corps/app/upgrade.tsx` — meta upgrade shop

## Architecture decisions

- Frontend-only: no backend server, no database — all game state is in-memory during a run, only meta progression persists via AsyncStorage.
- Data-driven cards: all 20 cards defined in `game/cards.ts` as plain objects — adding a new card requires one object entry, no code changes.
- Pure combat engine: `game/engine.ts` exports `combatReducer` (pure function), making it trivially testable. The run screen drives it via `useReducer`.
- All overlays inline in `run.tsx`: card selection, boss intro, victory, and game over are absolute-positioned overlays inside the run screen, keeping all combat state in one component.
- Synergies are computed from the full deck on every card play — no manual tracking needed.

## Product

- Main menu with run/upgrade/settings navigation
- Combat loop: 3 waves of enemies + 1 boss (NEXUS-7)
- 20 data-driven cards across 5 tag types: lightning, void, fire, ice, tech
- 5 synergy combos unlocked by stacking same-tag cards
- After each wave: choose 1 of 3 cards to add to deck
- Meta progression: earn gold each run, spend on 4 permanent upgrades
- Save/load via AsyncStorage (meta progress persists between sessions)

## User preferences

- Portrait mode, single player
- Premium feel, no ads/IAP in MVP
- Cyberpunk neon aesthetic: dark background #07000f, neon cyan #00f5ff

## Gotchas

- Do NOT create backend routes — this is a pure frontend game
- Card cost 0 is valid (Overclock card)
- Boss intro phase (boss_intro) requires DISMISS_BOSS_INTRO action to transition to player_turn
- Wave 4 = boss wave (NEXUS-7), waves 1-3 = regular enemy waves
- Adding cards dispatches ADD_CARD which also advances the wave

## Pointers

- See the `pnpm-workspace` skill for workspace structure
- See the `expo` skill for Expo-specific patterns
