# Championship Rankings Frontend - Firebase Firestore Integration Guide

## Application Overview
Create a fullstack Nuxt application to display championship table tennis rankings using Firebase Firestore Web SDK for direct client-side data fetching. The app features region selection, level filtering, player lists, and detailed player statistics.

## Data Architecture

### Firestore Collection Structure

The backend uses Firebase/Firestore with the following optimized collections:

#### 1. `/region-summaries` Collection
**Purpose**: Main dashboard data with AI-generated insights
**Document ID Pattern**: `{region}-week-{weekName}` (e.g., "LIEGE-week-12")

**Contains**:
- Region metadata (total players, participating clubs)
- Player counts by championship level (P1, P2, P3, P4, P5, P6, NAT_WB)
- Top 10 players per level for quick display
- AI-generated weekly summary with highlights and trends
- Timestamp for data freshness

**Use Cases**:
- Initial page load to show region overview
- Display AI insights and key highlights
- Quick access to top performers
- Level selector with player counts

#### 2. `/rankings` Collection (Flattened Structure)
**Purpose**: Complete player rankings optimized for filtering and querying
**Document ID Pattern**: `{weekName}-{region}-{level}-{uniqueIndex}`

**Contains**:
- Individual player ranking records
- Position within their level and region
- Complete points breakdown (5pt, 3pt, 2pt, 1pt, 0pt counts)
- Player identification (name, club, unique index)
- Week and region context

**Use Cases**:
- Display complete player lists for a specific level
- Search and filter players
- Sort by points or position
- Pagination for large lists

#### 3. `/players-points-details` Collection
**Purpose**: Detailed player statistics and match history
**Document ID Pattern**: `{uniqueIndex}` (player's unique identifier)

**Contains**:
- Complete match history with individual game results
- Points earned per match and week
- Victory counts and point distributions
- Performance trends over time
- Level attribution history

**Use Cases**:
- Player detail modal/page
- Performance analysis and trends
- Match-by-match breakdown
- Historical comparisons

#### 4. `/computation-metadata` Collection
**Purpose**: System metadata and processing information
**Document ID Pattern**: `week-{weekName}`

**Contains**:
- Processing timestamps
- Data freshness indicators
- System version information
- Total players processed

**Use Cases**:
- Data validation
- Cache invalidation
- System monitoring

## Firebase Firestore Integration Strategy

### Firestore Web SDK Setup

#### Initial Firebase Configuration
**Objective**: Initialize Firebase app with Firestore in the Nuxt application

**Required Setup**:
- Install Firebase Web SDK in the client-side application
- Configure Firebase project credentials using environment variables
- Initialize Firestore instance with proper security rules
- Enable offline persistence for better user experience

**Authentication Considerations**:
- Firestore security rules allow public read access to championship data
- No user authentication required for viewing rankings
- All write operations handled server-side via Admin SDK

### Direct Firestore Queries

#### 1. Application Initialization
**Objective**: Get current week and validate data availability

**Firestore Query**:
- Query `computation-metadata` collection
- Get latest document or current week document
- Extract current week number and last update timestamp
- Use this data to determine which week's rankings to display

**Query Pattern**:
- Collection: `computation-metadata`
- Document ID: `week-{currentWeek}` or query by timestamp
- Fields needed: weekName, timestamp, totalPlayersProcessed

#### 2. Region Summary Loading
**Objective**: Load region overview with AI insights and statistics

**Firestore Query**:
- Direct document fetch from `region-summaries` collection
- Document ID follows pattern: `{region}-week-{weekName}`
- Single read operation for complete region data

**Query Pattern**:
- Collection: `region-summaries`
- Document ID: `LIEGE-week-12` (example)
- Fields returned: region, totalPlayers, playersByLevel, topPlayersByLevel, aiSummary

**Real-time Option**:
- Use Firestore document snapshots for live updates
- Listen to document changes if data updates during user session
- Implement proper cleanup of listeners on component unmount

#### 3. Player Rankings Display
**Objective**: Query and display filtered player rankings

**Firestore Query Structure**:
- Collection: `rankings`
- Where clauses: region, level, weekName
- Order by: position (ascending)
- Limit: 50 players per page for performance

**Query Filtering**:
- Filter by region: `where('region', '==', selectedRegion)`
- Filter by level: `where('level', '==', selectedLevel)`
- Filter by week: `where('weekName', '==', currentWeek)`
- Sort by position: `orderBy('position', 'asc')`

**Pagination Implementation**:
- Use Firestore `limit()` and `startAfter()` for pagination
- Track last visible document for next page queries
- Implement infinite scroll or traditional page navigation

#### 4. Player Detail Loading
**Objective**: Fetch comprehensive player statistics

**Firestore Query**:
- Direct document read from `players-points-details`
- Document ID is the player's uniqueIndex
- Single query returns complete player history

**Query Pattern**:
- Collection: `players-points-details`
- Document ID: player's uniqueIndex
- Fields: name, club, points array, history array, levelAttributed

**Data Processing**:
- Sort points array by weekName for chronological display
- Parse match history for performance trends
- Calculate statistics from raw match data

## Query Optimization

### Firestore Index Requirements

The application requires specific composite indexes for efficient querying:

1. **Region + Level + Week Queries**
   - Fields: region (asc), level (asc), weekName (desc), position (asc)
   - Used for: Main rankings display

2. **Player History Queries**
   - Fields: uniqueIndex (asc), weekName (desc)
   - Used for: Player performance tracking

3. **Club-based Queries**
   - Fields: clubIndex (asc), weekName (desc), points.total (desc)
   - Used for: Club performance analysis

### Firestore Caching and Offline Support

#### Firestore Offline Persistence
- Enable Firestore offline persistence for automatic local caching
- Cached data available immediately on app load
- Automatic synchronization when connection restored

#### Custom Caching Strategy
- Use Firestore's built-in caching mechanisms
- Implement memory caching for frequently accessed region summaries
- Cache player rankings data during user session
- Store user preferences (selected region/level) in localStorage

#### Cache Invalidation
- Rely on Firestore's automatic cache management
- Implement manual cache refresh for stale data detection
- Use timestamp comparison for data freshness validation

## Performance Considerations

### Data Loading Patterns

#### Progressive Loading
1. Load region overview first (fastest)
2. Load basic player list for selected level
3. Load detailed player data on demand (modal/detail view)

#### Pagination Strategy
- Load 50 players initially
- Implement infinite scroll or traditional pagination
- Preload next page on user scroll

#### Firestore Real-time Capabilities
- Championship data updates weekly, real-time not critical
- Use Firestore snapshots for live data if needed during computation
- Focus on fast initial loads and smooth offline experience

### Firestore Error Handling

#### Network Failures
- Firestore Web SDK handles offline scenarios automatically
- Implement custom error handling for query failures
- Show user-friendly messages for network issues
- Use cached data when offline

#### Missing Data Scenarios
- Handle documents that don't exist gracefully
- Check for AI summary availability before displaying
- Provide fallback UI when player details are missing
- Implement proper loading states during queries

#### Query Limitations
- Handle Firestore query limits (composite index requirements)
- Implement fallback queries if complex filters fail
- Manage quota exceeded scenarios

## Firestore Integration Architecture

### Firebase Project Configuration

#### Environment Setup
- Configure Firebase project credentials for web app
- Set up Firestore database with proper security rules
- Enable offline persistence in Firebase configuration
- Configure authentication (if needed for admin features)

#### Security Rules Considerations
- Public read access for championship data collections
- Restrict write access to server-side operations only
- Implement field-level security where appropriate
- Rate limiting through Firebase console

### Client-Side Firestore Usage

#### Query Construction Patterns
- Build dynamic queries based on user selections
- Use query constraints for filtering and ordering
- Implement proper error boundaries around queries
- Handle loading states during query execution

#### Data Transformation
- Transform Firestore documents to application data models
- Parse nested objects (AI summaries, points breakdowns)
- Sort and filter data on client-side when needed
- Implement data validation for UI consistency

#### Memory Management
- Properly detach Firestore listeners on component cleanup
- Manage query subscriptions to prevent memory leaks
- Use Firestore's built-in garbage collection
- Implement lazy loading for large datasets

## State Management

### Application State Structure

#### Global State
- Current selected region
- Current week number
- Available regions list
- User preferences (cached selections)

#### Page-Level State
- Region summary data
- Current level selection
- Player rankings list
- Loading and error states

#### Component State
- Selected player for detail view
- Modal visibility
- Sorting preferences
- Search filters

### Firestore-Specific State Management

#### Query State Management
- Track active Firestore queries and subscriptions
- Manage loading states for each collection query
- Handle query errors and retry mechanisms
- Maintain query results in reactive state

#### Real-time Data Synchronization
- Use Firestore document listeners where appropriate
- Update UI reactively when data changes
- Handle listener attachment and detachment
- Manage subscription lifecycle with component lifecycle

#### Browser Navigation Integration
- Store query parameters (region, level, week) in URL
- Enable deep linking to specific rankings views
- Use browser history for navigation state
- Restore Firestore queries from URL parameters

## Firestore Performance Optimization

### Query Optimization Strategies
- Use composite indexes for complex multi-field queries
- Limit query results to necessary data only
- Implement query result caching at application level
- Use Firestore's built-in caching for repeated queries

### Data Loading Best Practices
- Load region summary first (single document read)
- Defer player rankings until level selected
- Lazy load player details on user interaction
- Implement progressive data loading for better UX

### Mobile and Offline Considerations
- Enable Firestore offline persistence for mobile users
- Prioritize essential data for offline availability
- Handle network state changes gracefully
- Provide clear indicators of offline vs online data

### Cost Optimization
- Minimize document reads through efficient queries
- Use Firestore's local cache to reduce billable operations
- Implement proper pagination to limit data transfer
- Monitor query performance and optimize expensive operations

This Firestore-based architecture provides direct client-side data access while leveraging Firebase's offline capabilities, real-time features, and automatic scaling, making it ideal for a responsive championship rankings application with AI-powered insights.