# Changelog

All notable changes to the CRUX module will be documented in this file.

## [2025-03-09] [2.0.2]

### Fixed
- Improved scaling prevention:
  - Added setPosition method to CruxTrayAppV2 to ignore scale parameter from UI Scaler
  - Added setPosition method to CruxEffectsAppV2 to ignore scale parameter from UI Scaler
  - Ensures proper positioning and prevents external scaling interference

## [2025-03-09] [2.0.1]

### Changed
- Enhanced CSS for improved viewport coverage:
  - Extended window viewport to cover the whole screen
  - Added wrapper to prevent external scaling interference
  - Applied transform: none !important to the wrapper

## [2025-03-09] [2.0.0]

### Breaking Changes
- Complete architectural overhaul to use Foundry V12's ApplicationV2
- Removed support for Foundry V11, now requires V12
- Modernized codebase with ES modules and class-based organization

### Added
- New modular file structure:
  - Separated UI components into dedicated ApplicationV2 classes
  - Centralized state management
  - Unified hooks management
  - Dedicated utilities for DOM operations and DnD5e compatibility
  - Improved settings organization

### Changed
- Migrated from jQuery to native DOM manipulation
- Enhanced drag-and-drop implementation using modern browser APIs
- Improved performance through ApplicationV2's partial re-rendering
- Better state management and UI synchronization
- More robust error handling and type safety

### Technical Improvements
- Converted CruxTrayUI to CruxTrayAppV2 using HandlebarsApplicationMixin
- Converted CruxEffectsApp to CruxEffectsAppV2
- Implemented proper lifecycle methods for ApplicationV2
- Enhanced template rendering with PARTS system
- Improved action handling with ApplicationV2's actions system

## [2025-01-27] [1.1.1]

### Changed
- Enhanced Add to Combat functionality:
  - Added support for multiple actor selection
  - Improved combat creation handling for GMs
  - Better handling of actors already in combat
  - Maintains proper GM/Player permissions

- Added State Awareness for UI State when Actor Updates

### Fixed
- Template there/visible
  - Resolved issue with Crux hiding Item Templates on use.


## [2025-01-21] [1.1.0]

### Added
- New health monitor overlay for character portraits:
  - Dynamic red overlay that visualizes current health percentage
  - Granular scaling with different increments:
    * 100% to 50%: 10% increments
    * 50% to 10%: 5% increments
    * 10% to 0%: 1% increments
  - Configurable direction (fill up or down)
  - Smooth transitions for health changes
  - Semi-transparent overlay preserves portrait visibility

### Changed
- Enhanced drag target functionality:
  - Added client-based persistence for drag target toggle state
  - Toggle state now remains consistent when switching between actors
  - Improved visual feedback for active targeting state
  - Better handling of targeting mode across actor changes

### Bug Fixing
- Removed artifact code causing some items to fail.

## [2025-01-19] [1.0.9]

### Added
- New drag and drop targeting system:
  - Hold targeting key (configurable) to enable targeting mode
  - Drag items onto tokens to use them on that target
  - Visual targeting cursor feedback
  - Automatic target selection and item usage

### Changed
- Improved spell slot visualization:
  - Independent toggles for spell slot dots and numerical fractions
  - More intuitive spell slot management interface

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
