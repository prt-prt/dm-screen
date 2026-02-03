# DM Screen - Application Specification

A selfhosted web application for Dungeon Masters to manage their D&D sessions.

## Overview

DM Screen is a personal tool designed to streamline tabletop RPG session management. It provides a centralized interface for notes, creature management, audio ambiance, combat tracking, and utility calculations.

## Tech Stack

- **Frontend**: Next.js (React)
- **Backend**: Next.js API routes
- **Database**: SQLite (file-based, simple deployment)
- **File Storage**: Local filesystem
- **Deployment**: Self-hosted

## Core Features

### 1. Session Notes

- Create, edit, and delete session notes
- Rich text or markdown support
- Organize notes by campaign/session
- Search functionality

### 2. Statblock Manager

- Store monster and NPC statblocks
- Support for standard D&D 5e statblock format
- Fields: name, size, type, AC, HP, speed, ability scores, skills, actions, etc.
- Tagging and categorization
- Quick search and filter

### 3. Audio System

#### Audio File Management
- Upload and store audio files (mp3, wav, ogg)
- Organize into categories (ambient, music, effects)
- Preview playback

#### Audio Scene Builder
- Create scenes combining multiple audio tracks
- Save scene configurations
- Quick-load scenes during sessions

#### Playback Controls
- Individual volume control per track
- Master volume control
- Channel mixing (e.g., ambient vs music vs effects)
- Loop toggle per track
- Fade in/out controls

### 4. Initiative Tracker

- Add combatants (players, monsters, NPCs)
- Roll or manually set initiative
- Sort by initiative order
- Track HP, conditions, and notes per combatant
- Round counter
- Quick add from saved statblocks

### 5. Unit Calculator

- Feet to meters conversion
- Meters to feet conversion
- Common D&D distance conversions (squares to feet/meters)
- Weight conversions (pounds to kg)

## Future Considerations

This application is designed to be extensible. Additional features may be added as needs arise.

## Data Model (Initial)

### Campaign
- id, name, description, created_at, updated_at

### Session Note
- id, campaign_id, title, content, session_date, created_at, updated_at

### Statblock
- id, name, size, type, alignment, armor_class, hit_points, speed, abilities (JSON), skills (JSON), actions (JSON), tags, created_at, updated_at

### Audio File
- id, name, file_path, category, duration, created_at

### Audio Scene
- id, name, tracks (JSON array with file_id, volume, loop settings), created_at, updated_at

### Combatant (for initiative tracker - session state, not persisted long-term)
- id, name, initiative, hp_current, hp_max, conditions, notes, statblock_id (optional)

## API Structure

```
/api/campaigns
/api/sessions
/api/statblocks
/api/audio/files
/api/audio/scenes
/api/initiative (websocket or polling for real-time updates if needed)
```

## Non-Goals (for initial version)

- Multi-user support / authentication (private single-user app)
- Cloud sync
- Mobile-specific UI (desktop-first)
- Dice roller (may add later)
- Map/battle grid (may add later)
