# Changelog

All notable changes to the CRUX module will be documented in this file.

## [2025-01-18] [1.0.7 - 1.0.8]

### Added
- New setting to control visibility of spell slot numbers:
  - Toggle display of numerical spell slot fractions (e.g., 3/4, 2/2)
  - Independent from spell slot dots setting
  - Enabled by default

- New charge modification feature:
  - Shift + Left Click to increase item charges
  - Now uses Shift + Right Click to decrease item charges

- New settings to control visibility of main sections:
  - Show/Hide Favorites Section
  - Show/Hide Equipped Section
  - Show/Hide Features Section
  - Show/Hide Spells Section
  - Show/Hide Inventory Section
  Each section can be individually toggled and is visible by default.

## [2025-01-16] [1.0.6]

### Current Features
- Core Functionality
  - Sliding tray panel with customizable width and icon sizes
  - Quick access to all activatable items, spells, and abilities
  - Support for Foundry VTT v12+ and DND5E system
  - Integration with Tidy 5e Sheet Sections

- Token Controls
  - Quick access to token configuration
  - Target mode toggle
  - Status effects management window
  - Combat integration
  - Elevation control with numeric input

- Action Display
  - Basic Actions (Dash, Disengage, Dodge, Grapple, Hide, Shove)
  - Categorized display of Favorites, Equipped items, Inventory items, Features, and Spells
  - Spell organization by level (cantrips through 9th level)

- Special Indicators for:
  - Bonus Actions
  - Reactions
  - Concentration spells
  - Ritual spells
  - Unprepared spells
  - Legendary actions

- Interactive Features
  - Flippable character portrait with stats
  - Expandable item descriptions
  - Quick access to ability checks and saves
  - Combat turn management
  - Status effects management
  - Expand/collapse all sections

- Hot Keys
  - Toggle tray visibility (default: E)
  - Access skills list (default: K)

- Customization Options
  - Multiple display modes (Toggle, When Token Selected, Automatic, Always Show)
  - Configurable icon sizes and tray widths
  - Optional spell slot dots
  - Configurable section states and sorting options
  - Flexible skills display positioning

## [2025-01-11]

### Changed
- Update GitHub Actions workflow
- Update GitHub Actions workflow conditions
- Fix GitHub Actions workflow syntax
- Add GitHub Actions workflow for releases

## [2025-01-10]

### Added
- Add Foundry VTT installation URLs to module.json
- Add packs directory to repository
- Initial commit: Add CRUX Foundry VTT module files
