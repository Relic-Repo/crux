# CRUX - Action Tray Module for Foundry VTT

> This module is a continuation and enhancement of the "Action Pack" module originally created by Tero Parvinen. You can find the original module here: https://github.com/teroparvinen/foundry-action-pack

CRUX extends the DND5E system by providing a customizable, sliding tray interface for quick access to character actions, abilities, and spells.

## Overview

CRUX streamlines gameplay by providing instant access to all activatable items and abilities without requiring the character sheet to be open. The tray slides out from the left side of the screen, offering an organized, comprehensive view of all available actions.

## Features

### Core Functionality
- Sliding tray panel with customizable width and icon sizes
- Quick access to all activatable items, spells, and abilities
- Support for Foundry VTT v11+ and DND5E system

### Action Display
- **Basic Actions**: Quick access to common actions
  - Dash
  - Disengage
  - Dodge
  - Grapple
  - Hide
  - Shove

- **Item Categories**:
  - Favorites (drag and drop items from character sheet to add, hover and press "-" to remove)
  - Equipped items (displayed at the top)
  - Inventory items with activation types
  - Features with activation types
  - Spells (prepared, innate, and rituals)
  - Categorized by spell level (cantrips through 9th level)

### Special Indicators
Items are tagged for easy identification when they are:
- Bonus Actions
- Reactions
- Concentration spells
- Ritual spells
- Unprepared spells
- Legendary actions

### Interactive Features
- Right-click on item name/icon for fast-forward activation (skips dialog)
- Click item name to expand and view description
- Quick access to:
  - Ability checks and saves
  - End turn function (in combat)
  - Character sheet (via character name)
  - Initiative rolling (when unrolled in combat)

### Hot Keys
- Toggle tray visibility (default: E)
- Access skills list (default: K)
  - Opens panel and reveals skills if closed
  - Toggles skill list when panel is open
  - Scrolls to skill list if at bottom of panel

### Customization Options
- **Display Modes**:
  - Toggle: Manual open/close
  - When Token Selected: Automatic display with selection
  - Automatic: Toggle for players, Selection-based for DMs
  - Always Show: Persistent display
- **Visual Settings**:
  - Three icon sizes (Small, Medium, Large)
  - Two tray widths (Small, Large)
  - Optional spell slot dots
- **Skills Display**:
  - Collapsible at top
  - Listed at bottom
- **Section States**:
  - Configurable default states for skills section
  - Configurable default states for main sections
  - Configurable default states for sub-sections
- **Additional Options**:
  - Alphabetical sorting (optional)
  - Always show cantrips
  - Toggle visibility of tray activation icon
  - Hide/show depleted items
  - Assume default character when no token is selected

## Installation

1. In Foundry VTT's setup screen, go to the "Add-on Modules" tab
2. Click "Install Module"
3. Search for "CRUX" or paste this manifest URL:
   ```
   https://github.com/Relic-Repo/crux/releases/latest/download/module.json
   ```

## Compatibility
- Requires Foundry VTT version 11 or higher
- Verified compatible with Foundry VTT version 12
- Designed for the DND5E system
