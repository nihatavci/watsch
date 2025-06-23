# Movie Night Nomination System - Product Requirements Document

## Overview
The Movie Night nomination system allows participants to collaboratively select movies for group viewing through a structured nomination and voting process.

## User Story
"As a Movie Night participant, I want to nominate movies and see all nominations in real-time so that our group can vote on the best options together."

## Core Requirements

### Phase 1: Nomination Phase
1. **Movie Search & Selection**
   - Participants can search for movies using TMDB API
   - AI-powered recommendations available via OpenAI integration
   - Clear movie details: poster, title, year, rating, synopsis
   - One-click movie selection from search/recommendations

2. **Nomination Submission**
   - Each participant can nominate exactly ONE movie per session
   - Nomination is permanent (no changing once submitted)
   - Real-time confirmation of successful nomination
   - Clear feedback if nomination fails

3. **Nominations Display**
   - **CRITICAL**: All nominations must be visible to all participants in real-time
   - Show nominated movie details: poster, title, year, rating
   - Display who nominated each movie (participant nickname)
   - Visual indicator when a participant has nominated
   - Live counter of total nominations

### Phase 2: Voting Phase
1. **Voting Interface**
   - All nominations displayed as voting cards
   - Each participant can vote for exactly ONE movie
   - Clear visual indication of selected vote
   - Vote submission confirmation

2. **Real-time Updates**
   - Vote counts update live for all participants
   - Visual progress indicators
   - Participant voting status indicators

### Phase 3: Results Phase
1. **Winner Display**
   - Clear announcement of winning movie
   - Vote breakdown display
   - Winner celebration animation
   - Ready-to-watch movie details

## Data Structure Requirements

### Nomination Object
```typescript
interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  media_type: 'movie' | 'tv';
  nominatedBy: string;        // participant ID
  nominatedByNickname: string; // display name
  votes: string[];            // array of participant IDs who voted
}
```

### Room Object
```typescript
interface MovieNightRoom {
  code: string;
  hostId: string;
  phase: 'waiting' | 'nominating' | 'voting' | 'complete';
  participants: Participant[];
  nominations: Movie[];        // MUST persist nominations
  winner: Movie | null;
  createdAt: number;
  updatedAt: number;
}
```

## Technical Requirements

### API Endpoints
- `POST /api/movie-night/nominate` - Submit nomination
- `GET /api/movie-night/room-status` - Get current room state (including nominations)
- `POST /api/movie-night/start-voting` - Host starts voting phase
- `POST /api/movie-night/vote` - Submit vote
- `POST /api/movie-night/finish-voting` - Host ends voting, reveals winner

### Real-time Updates
- Server-Sent Events (SSE) for live room updates
- Polling fallback for reliability
- Immediate UI updates on user actions
- Consistent data synchronization

### Data Persistence
- Nominations stored in KV store: `room:${roomCode}`
- Nominations MUST persist between page refreshes
- Phase transitions preserve all data
- Atomic updates to prevent data loss

## Current Issues Identified

### CRITICAL BUG: Missing Nominations Display
**Problem**: Nominations are submitted successfully but NOT displayed in the UI
**Impact**: Users think their nominations disappeared
**Root Cause**: No UI component renders `roomStatus.nominations` array

### Phase Mismatch
**Problem**: API uses `'nominate'` phase but UI checks for `'nominating'`
**Impact**: Phase detection logic fails
**Solution**: Standardize on consistent phase names

### Data Structure Inconsistency
**Problem**: Different nomination formats between API and UI
**Impact**: Nominations don't display correctly
**Solution**: Unified Movie interface across all components

## Success Metrics
1. **Functional**: 100% of nominations are visible immediately after submission
2. **Real-time**: Updates appear within 2 seconds for all participants
3. **Reliability**: No data loss during phase transitions
4. **User Experience**: Clear visual feedback at every step

## Priority Fixes Required
1. **P0**: Add nominations display UI component
2. **P0**: Fix phase name consistency ('nominate' vs 'nominating')
3. **P1**: Ensure real-time nomination updates
4. **P1**: Add participant nomination status indicators
5. **P2**: Improve error handling and user feedback 