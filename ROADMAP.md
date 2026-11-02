# Roadmap

Next milestone: **v1 on itch.io** (free, playable in the browser). A Godot version comes later, shaped by feedback from this release.

## Toward v1

### Code health
- [ ] Fix the ESLint setup: most of the ~3.8k reported problems come from the `indent` rule disagreeing with the code style
- [ ] Make the full test suite exit cleanly in every environment (every spec passes on its own; investigate the combined run)
- [ ] Review and merge `feat/experimental` (seeded runs, daily challenges, Oracle)

### Gameplay and polish
- [ ] Polish the meteor revenge warning
- [ ] Tune difficulty curve and combo pacing
- [ ] Sound effects and music
- [ ] Settings: volume, fullscreen, controls

### Release
- [ ] Web build tuned for itch.io (embed size, input focus)
- [ ] itch.io page with screenshots and a feedback channel
- [ ] Changelog

## After v1

- [ ] Use player feedback to plan the Godot version
