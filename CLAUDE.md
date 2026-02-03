# CLAUDE.md - AI Development Guidelines

This file provides context and guidelines for AI assistants working on this project.

## Project Overview

DM Screen is a D&D Dungeon Master tool built with Next.js. It is a single-user application with no authentication requirements.

## Key Documentation

- `SPEC.md` - Feature specification and requirements
- `README.md` - Setup and deployment instructions (to be created)

## Tech Decisions

- **Next.js**: Full-stack React framework with API routes
- **SQLite**: Simple, file-based database suitable for single-user deployment
- **Local filesystem**: Audio files stored on disk, not in database

## Development Guidelines

### Code Style

- Use TypeScript throughout
- Prefer functional components with hooks
- Keep components focused and small
- Use descriptive variable and function names

### File Structure

```
/src
  /app          # Next.js App Router pages
  /components   # React components
  /lib          # Utility functions, database, etc.
  /types        # TypeScript type definitions
/public
  /audio        # Uploaded audio files
/data           # SQLite database file
```

### Database

- Use SQLite with a simple ORM or query builder
- Migrations should be simple and versioned
- Database file lives in `/data/dm-screen.db`

### Audio Files

- Store in `/public/audio` or a dedicated `/uploads` directory
- Keep original filenames with unique prefixes to avoid collisions
- Support mp3, wav, ogg formats

### API Design

- RESTful endpoints under `/api`
- Return JSON responses
- Use appropriate HTTP status codes
- Keep endpoints simple and focused

## Feature Implementation Order (Suggested)

1. Project setup and basic layout
2. Session notes (simplest CRUD)
3. Statblock manager
4. Audio file upload and playback
5. Audio scenes
6. Initiative tracker
7. Unit calculator

## Common Tasks

### Adding a new feature

1. Update SPEC.md if it's a new requirement
2. Create necessary database migrations
3. Build API endpoints
4. Create UI components
5. Test locally

### Database changes

- Add migration files, don't modify existing ones
- Test migrations on a copy of the database first

## Things to Avoid

- Over-engineering for multi-user scenarios
- Adding authentication complexity
- External service dependencies (keep it self-contained)
- Complex build processes

## Notes for Future Sessions

- This is a personal project; pragmatic solutions over perfect architecture
- Features may be added incrementally; keep the codebase flexible
