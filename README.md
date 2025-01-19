# CRUX - Action Tray Module for Foundry VTT
*(Combat Ready User Xperience)*

> This module is a continuation and enhancement of the "Action Pack" module originally created by Tero Parvinen. You can find the original module here: https://github.com/teroparvinen/foundry-action-pack

CRUX extends the DND5E system by providing a customizable, sliding tray interface for quick access to character actions, abilities, and spells.

## Overview

CRUX streamlines gameplay by providing instant access to all activatable items and abilities without requiring the character sheet to be open. The tray slides out from the left side of the screen, offering an organized, comprehensive view of all available actions.

## Features

### Core Functionality
- Sliding tray panel with customizable width and icon sizes
- Quick access to all activatable items, spells, and abilities
- Support for Foundry VTT v12+ and DND5E system
- Integration with Tidy5e Sheet sections (optional)

### Token Controls
- Quick access to token configuration
- Target mode toggle
- Status effects management window
- Combat integration (add to combat)
- Elevation control with numeric input

### Action Display
- **Basic Actions**: Quick access to common actions
  - Dash
  - Disengage
  - Dodge
  - Grapple
  - Hide
  - Shove

- **Item Categories**:
  - Favorites section for quick access to important items
  - Equipped items (displayed at the top)
  - Inventory items with activation types
  - Features with activation types
  - Spells (prepared, innate, and rituals)
  - Categorized by spell level (cantrips through 9th level)

### Special Indicators
Items are tagged for easy identification when they are:
- Bonus Actions (B)
- Reactions (R)
- Concentration spells (C)
- Ritual spells (Rt)
- Unprepared spells (U)
- Legendary actions (L)

### Interactive Features
- Flippable character portrait (click to flip for more Stats)
- Click item name to expand and view description
- Item Interaction Features:
  - Drag and drop targeting system (hold targeting key to enable)
  - Charge modification:
    - Hold Shift + Left Click to increase charges
    - Hold Shift + Right Click to decrease charges
  - Middle Click to open item sheet
  - Click on name to expand description
  - Click on image to roll item
- Quick access to:
  - Ability checks and saves
  - End turn function (in combat)
  - Character sheet (via character name)
  - Initiative rolling (when unrolled in combat)
  - Status effects management
- Expand/collapse all sections button

### Hot Keys
- Toggle tray visibility (default: E)
- Access skills list (default: K)
  - Opens panel and reveals skills if closed
  - Toggles skill list when panel is open
  - Scrolls to skill list if at bottom of panel
- Item targeting (configurable key)
  - Hold to enable targeting mode
  - Drag items onto tokens to use them

### Customization Options
- **Display Modes**:
  - Toggle: Manual open/close
  - Automatic: Toggle for players, Selection-based for DMs
  - Always Show: Persistent display

- **Section Visibility**:
  - Show/Hide Favorites Section
  - Show/Hide Equipped Section
  - Show/Hide Features Section
  - Show/Hide Spells Section
  - Show/Hide Inventory Section
  Each section can be individually toggled through settings

- **Visual Settings**:
  - Three icon sizes (Small, Medium, Large)
  - Two tray widths (Small, Large)
  - Spell slot visualization:
    - Optional spell slot dots
    - Optional numerical fractions (e.g., 3/4)
    - Independent toggles for dots and numbers

- **Skills Display**:
  - Collapsible at top
  - Listed at bottom
  - None (disabled)

- **Section States**:
  - Configurable default states for skills section (Open/Collapsed)
  - Configurable default states for main sections (Open/Collapsed)
  - Configurable default states for sub-sections (Open/Collapsed)

- **Additional Options**:
  - Alphabetical sorting (optional)
  - Show unprepared cantrips (optional)
  - Hide/show depleted items
  - Assume default character when no token is selected
  - Use Tidy5e Sheet sections instead of standard Crux sections

## Installation

1. In Foundry VTT's setup screen, go to the "Add-on Modules" tab
2. Click "Install Module"
3. Search for "CRUX" or paste this manifest URL:
   ```
   https://github.com/Relic-Repo/crux/releases/latest/download/module.json
   ```

## Compatibility
- Requires Foundry VTT version 12 or higher
- Verified compatible with Foundry VTT version 12
- Designed for the DND5E system
