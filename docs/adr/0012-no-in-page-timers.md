Status: accepted

# No in-page timers — step durations are display-only

We do not build interactive in-page countdown timers. A step's `timer` (ISO-8601)
duration renders as **plain text** next to the step; that's it. People already have better
timers everywhere they cook — Siri, Alexa, Google Home, the oven, a phone, a kitchen
timer — and an in-page timer only works while the tab is open and foregrounded.

## Consequences

- The `timer` schema field is **retained** (useful data; could feed future features) but is
  inert in the UI.
- Drops a whole interactive component + its edge cases (backgrounding, notifications,
  audio permissions) from scope.
