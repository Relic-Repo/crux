# Changelog

All notable changes to the CRUX module will be documented in this file.

## [2026-06-06] [2.2.2]

### Added
- Added a Movement Type popout for the SPD control on both the Actions and Actor panels.
  - Displays available token movement actions from Foundry/dnd5e, including movement icons and calculated speeds.
  - Supports Speed, Walk, Fly, Swim, Burrow, Crawl, Climb, Jump, and Blink where available.
  - Updates the token's movement action so Foundry movement and Scene Region movement costs can respond to the selected type.
- Added a new Elevation popout to replace the previous Foundry dialog flow.
  - Supports Level-relative and Scene elevation modes on Foundry V14 Scene Levels.
  - Shows GM-only Scene Level selection when levels are available.
  - Keeps V13-compatible elevation behavior through the compatibility layer.
- Added a GM-only setting to allow players to see and use Scene elevation mode.
  - Players never see the Scene Level selection list.

### Changed
- Updated Status Effects, Movement Type, and Elevation controls to use Crux anchored popouts.
  - Flyouts now open beside the Crux tray at the click position.
  - Flyouts close when focus/click moves outside them.
- Updated the SPD box on both panels to show the token's current movement action rather than only the actor's base speed.
- Updated movement speed display calculations for movement actions that derive from walk speed, such as Crawl, Swim, and Climb.
- Updated elevation controls with Set/Cancel buttons, direct numeric entry, and step buttons.
  - Left click steps by 1.
  - Shift-click steps by 5.
  - Shift+Alt-click steps by 10.
- Updated initiative rolling to respect dnd5e Skip Dialog Advantage and Skip Dialog Disadvantage keybindings.
- Updated Shift-click Add to Combat to immediately add combatants and roll initiative.

### Fixed
- Fixed NPC combatants not receiving the Roll Initiative popup button immediately after being added to combat.
- Fixed dnd5e senses compatibility warnings by reading the current `senses.ranges` schema while retaining legacy compatibility.

## [2026-06-03] [2.2.1]

### Added
- Added visual presets for Crux panel styling, including Foundry Light, Black Glass, Crimson Knight, and additional themed palettes.
- Added control settings for panel opacity, element opacity, and panel blur.
- Added settings preview behavior so visual preset, opacity, blur, size, and font controls preview live while editing.
- Added new SVG icon assets for Action panel controls, rest buttons, combat controls, and Actor panel details.
- Added attribution updates for bundled icons, textures, Font Awesome usage, and Brazilian Portuguese review credit.

### Changed
- Updated Crux styling so panel, element, text, border, hover, active, and accent colors are driven by the new visual preset system.
- Updated Crux CSS variable structure for future preset and add-on panel theming.
- Updated item-name interactions:
  - Left click now expands or collapses the Crux item description.
  - Right click now opens the item sheet.
  - Middle click keeps the Activities Menu behavior where supported.

## [2026-05-26] [2.2.0]

### Added
- Added tabbed panel navigation to Crux.
  - Actions remains the main play/action panel.
  - Actor adds a new alternate character sheet view inside the Crux tray.
- Added the Actor panel.
  - Displays portrait, AC, HP, Temp HP, Hit Dice, initiative, speed, proficiency, saving throws, identity cards, and trait summaries.
  - Supports PC and NPC actor displays with actor-appropriate identity and trait information.
  - Supports death save and exhaustion indicators for player characters.
  - Supports inline HP and Temp HP editing with Shift-click.
- Added direct Actor panel access with the Alt+C keybinding.

### Changed
- Updated Crux's default keybinding flow.
  - Shift+E now opens or returns to the Actions panel, and closes Crux when already on Actions.
  - Shift+K now toggles the Skills section.
- Updated the Actions panel actor card to better match the new Actor panel layout and play flow.
- Updated the downed actor portrait behavior so clicking the red skull portrait rolls a death saving throw instead of flipping the card.
- Updated Crux's panel styling to use the newer Actor panel visual language across the tray.

## [2026-05-18] [2.1.3]

### Fixed
- Fixed dnd5e item description enrichers in expanded Crux item summaries by enriching descriptions relative to their source item.
- Improved expanded item summary readability and spacing.
- Added left-side tray gutter spacing to visually balance the scrollbar gap.


## [2026-05-17] [2.1.2]

### Changed
- Verified Foundry VTT v13 compatibility and widened the module compatibility minimum to Foundry VTT v13.

## [2026-05-17] [2.1.1]

### Fixed
- Fixed the Font Family setting so client font choices are applied reliably in Foundry VTT v14/ApplicationV2.
- Restored long character name handling so oversized fantasy names are resized correctly in the tray header.
- Fixed basic action buttons so fallback chat cards are created correctly in Foundry VTT v14.
- Updated basic action item activation to use Crux's normal activation path when actor-owned action items are present.
- Preserved dnd5e skip-dialog and advantage/disadvantage modifier key behavior when activating items through Crux, including MidiQOL-friendly item/activity use flows.

## [2026-05-16] [2.1.0]

### Added
- Foundry VTT v14 compatibility:
  - Updated the module manifest compatibility target to Foundry VTT v14
  - Updated item and activity sheet injection for ApplicationV2/native DOM sheets
- Support for "apothecary" spell category:
  - Added display of apothecary spells in the spell tray
  - Added spell slot tracking for apothecary spells
  - Added localization for the apothecary category
- New character name font size setting

### Fixed
- Fixed "force show" option for items not working properly
- Fixed dnd5e 5.1+ spell preparation display by supporting `system.method` and `system.prepared`
- Fixed Crux tray height and taskbar offset handling so the tray spans the full viewport when taskbar compatibility is not active
- Fixed Crux API initialization so `game.crux` utilities are preserved when the tray app is created
- Fixed module settings registration so per-setting `onChange` handlers are preserved
- Updated ability and skill roll calls for current dnd5e APIs

## [2025-04-16] [2.0.9]

### Fixed
- Alignment issues for Skills section
- Toggle Skills keybinding
- Permission Checks when updating Items with Crux Flags

## [2025-03-30] [2.0.8]

### Added
- New setting to control automatic activity selection:
  - When disabled (default), the system's activity selection dialog will be shown
  - When enabled, Crux will automatically use the first activity without showing the dialog
- New checkbox in DnD item forms to mark activities as "riders":
  - Appears in the Identity tab of item sheets
  - Controls the `flags.dnd5e.riders.activity` flag
  - Allows filtering activities that should not appear in the item use menu
- New setting to control compendium item processing:
  - Allows disabling compendium item processing for better performance
  - Enabled by default
- New setting in Items Details panel to change default visibility state of the Item in Crux
  - System Default - Filter as Crux has it filtered
  - Force Show - Always show the Item in Crux
  - Force Hidden - Never show the Item in Crux
- New Global Font Setting
  - New setting to adjust global font sizes
  - Renamed Font Multiplier to Content Multiplier.

### Fixxed
- Added back the Resolve Actor method.
  - oooops.


## [2025-03-25] [2.0.7]

### Added
- Ammunition Sub-Category
- Ammunition Remain Qty Editable
- Item with Thrown Property Remain Qty Editable
- Easter Eggs

## [2025-03-25] [2.0.6]

### Fixed
- Lag due to multiple selection data building in panel. Will only show one now if multiple are selected. First in array
- Global changes to button highlight behavior
- Error caused by unknown category

## [2025-03-24] [2.0.5]

### Fixed
- Removed Drag Targeting due to errors

### Added
- Quantity & Uses Adjustment Fields

## [2025-03-17] [2.0.4]

### Fixed
- Enrichers in Descriptions
- Activity Activation in Tray / Menu
- Activities Close Menu redundancies
- Activities not showing up when using Tidy 5e Sheets

### Added
- Added localization support for 9 additional languages:
  - Spanish (es)
  - French (fr)
  - German (de)
  - Italian (it)
  - Portuguese (Brazilian) (pt-BR)
  - Chinese (Simplified) (zh-CN)
  - Japanese (ja)
  - Korean (ko)
  - Russian (ru)
- Support for Items/Activities with Template Targeting
- Added Carolingian UI Font option
- Added Quantity

## [2025-03-11] [2.0.3]

### Fixed
- Items not showing due to no 'Uses'
- Error caused by race condition
- Tray size resetting after refresh

### Added
- Compatibility for Ripper's Taskbar

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
