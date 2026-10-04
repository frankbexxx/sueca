# Changelog

All notable changes to the Sueca Card Game project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Sueca portrait geometry V3
- Adopt approved Sueca Phaser portrait V3 canonical geometry (`layoutProfile: suecaPortraitV3`).
- DOM / multiplayer Sueca and all landscape / other-variant layouts remain on DEFAULT geometry.
- Audit package + runtime validation screenshots under `docs/sueca-table-audit/`.
- Deferred visual follow-ups: Continue CTA placement; top-right HUD/chrome crowding.

## [0.1.0-alpha] - 2025-12

### 🎮 Features Added

#### Core Gameplay
- ✅ Full 4-player game implementation (2 teams of 2 players)
- ✅ Complete game logic following traditional Sueca rules
- ✅ Two dealing methods: Method A (Standard) and Method B (Dealer First)
- ✅ Counterclockwise rotation throughout gameplay
- ✅ Team selection via card draw (highest + lowest card)
- ✅ Dealer selection and rotation
- ✅ Trump suit determination and display
- ✅ Complete trick evaluation logic
- ✅ Scoring system (points, game wins, pente tracking)
- ✅ Round management (multiple rounds per game)

#### AI System
- ✅ Intelligent AI opponents with strategic gameplay
- ✅ Card tracking system (knows which cards have been played)
- ✅ AI difficulty levels (easy, medium, hard)
- ✅ Strategic card selection based on game state
- ✅ Fallback to external AI service (optional)

#### User Interface
- ✅ Modern React + TypeScript frontend
- ✅ Responsive design (desktop and mobile)
- ✅ Game board with visual card table
- ✅ Player hand display with card selection
- ✅ Trick visualization (cards in cross formation)
- ✅ Score display (points and game wins)
- ✅ Round and dealer information
- ✅ Dark mode support

#### Game Controls
- ✅ Start menu with game configuration
- ✅ Pause/Resume functionality
- ✅ Quit game with confirmation
- ✅ Settings menu (player names, AI difficulty, dealing method)
- ✅ New game option
- ✅ Player name customization

#### Modals
- ✅ Round end modal (shows scores and progress)
- ✅ Game start modal (shows trump card)
- ✅ Game over modal (shows final results)
- ✅ All modals with clean CSS styling

#### Code Quality
- ✅ Modular component architecture
- ✅ Centralized constants (`gameConstants.ts`)
- ✅ TypeScript with strict typing (no `any` types)
- ✅ Clean code with removed dead code
- ✅ Organized CSS with reusable classes
- ✅ No linter errors

### 🔧 Technical Improvements

- ✅ Refactored modals into separate components
- ✅ Extracted magic numbers to constants
- ✅ Moved inline styles to CSS classes
- ✅ Improved code organization and readability
- ✅ Better separation of concerns

### 🐛 Bugs Fixed

- ✅ Fixed trump card not appearing in Method A
- ✅ Fixed user not always being "You" (index 0)
- ✅ Fixed trump card visibility issues
- ✅ Fixed cards accumulating between rounds
- ✅ Fixed game state management issues

### 📦 Deployment

- ✅ Production deployment on Vercel
- ✅ Build optimization for production
- ✅ Asset path corrections for production
- ✅ Error handling improvements

### 📚 Documentation

- ✅ Comprehensive project documentation
- ✅ Game rules documentation
- ✅ Development guides
- ✅ Deployment guides

---

## [Unreleased] - Beta Phase

### Planned Features

- [ ] Unit tests for game logic
- [ ] Integration tests
- [ ] E2E tests
- [ ] Card animations
- [ ] Sound effects
- [ ] Improved mobile responsiveness
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Performance optimizations
- [ ] Code splitting and lazy loading

### Known Issues

- [ ] UI alignment issues on Android (mentioned in PROJECT_STATUS.md)
- [ ] Need testing on different browsers and devices

---

## Version History

- **v0.1.0-alpha** (2025-12): Initial alpha release with core functionality
