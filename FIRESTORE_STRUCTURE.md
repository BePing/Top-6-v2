# Firestore Data Structure for Championship Rankings

This document describes the improved Firestore data structure for storing championship computation results, optimized for backend API consumption and frontend queries.

## Collections Overview

### 1. `/tops` (Legacy - Maintained for backwards compatibility)
Original hierarchical structure organized by region and level.

**Document structure:**
```typescript
{
  region: {
    clubs: string[],
    levels: {
      [level: string]: PlayerPosition[]
    }
  }
}
```

### 2. `/rankings` (New - Optimized for queries)
Flattened structure for efficient querying and filtering.

**Document ID:** `{weekName}-{region}-{level}-{uniqueIndex}` (sanitized to replace invalid characters like `/`, `\`, `#`, etc. with `_`)

**Document structure:**
```typescript
{
  uniqueIndex: string,
  name: string,
  clubIndex: string,
  clubName: string,
  region: string,
  level: string,
  position: number,
  points: {
    total: number,
    breakdown: {
      count5Pts: number,
      count3Pts: number,
      count2Pts: number,
      count1Pts: number,
      count0Pts: number
    }
  },
  weekName: number,
  lastUpdated: Date
}
```

### 3. `/players-points-details` (Enhanced)
Detailed player information with historical data.

**Document ID:** `{uniqueIndex}`

**Document structure:**
```typescript
{
  name: string,
  club: string,
  points: PlayerPoint[],
  levelAttributed: string,
  history: PlayerPointsHistory[],
  lastUpdated: Date,
  weekName: number
}
```

### 4. `/region-summaries` (New)
Aggregated data for efficient dashboard queries with AI-generated analysis.

**Document ID:** `{region}-week-{weekName}`

**Document structure:**
```typescript
{
  region: string,
  totalPlayers: number,
  playersByLevel: { [level: string]: number },
  topPlayersByLevel: { [level: string]: PlayerPosition[] },
  clubs: string[],
  lastUpdated: Date,
  aiSummary?: {
    region: string,
    weekName: number,
    summary: string,
    keyHighlights: string[],
    topPerformers: Array<{
      name: string,
      club: string,
      level: string,
      achievement: string
    }>,
    trends: {
      risingPlayers: string[],
      dominantClubs: string[],
      competitiveLevel: string,
      weeklyInsight: string
    },
    generatedAt: Date
  }
}
```

### 5. `/computation-metadata` (New)
Metadata about computation runs.

**Document ID:** `week-{weekName}`

**Document structure:**
```typescript
{
  timestamp: Date,
  weekName: number,
  version: string,
  totalPlayersProcessed: number,
  regionsProcessed: string[],
  levelsProcessed: string[]
}
```

## Query Examples

### Get current week rankings for a region and level
```javascript
db.collection('rankings')
  .where('weekName', '==', currentWeek)
  .where('region', '==', 'LIEGE')
  .where('level', '==', 'P1')
  .orderBy('position', 'asc')
  .get()
```

### Get player ranking history
```javascript
db.collection('rankings')
  .where('uniqueIndex', '==', playerUniqueIndex)
  .orderBy('weekName', 'desc')
  .get()
```

### Get club players rankings
```javascript
db.collection('rankings')
  .where('clubIndex', '==', clubIndex)
  .where('weekName', '==', currentWeek)
  .orderBy('points.total', 'desc')
  .get()
```

### Get region summary with AI analysis
```javascript
db.collection('region-summaries')
  .doc(`${region}-week-${weekName}`)
  .get()

// Access AI summary
const regionDoc = await db.collection('region-summaries')
  .doc(`${region}-week-${weekName}`)
  .get();

const aiSummary = regionDoc.data()?.aiSummary;
if (aiSummary) {
  console.log('AI Summary:', aiSummary.summary);
  console.log('Key Highlights:', aiSummary.keyHighlights);
  console.log('Top Performers:', aiSummary.topPerformers);
}
```

## Performance Optimizations

1. **Firestore Indexes**: Defined in `firestore.indexes.json` for optimal query performance
2. **Batch Operations**: All writes use Firestore batch operations (max 500 operations per batch)
3. **Chunked Processing**: Large datasets are processed in chunks to avoid memory issues
4. **Selective Updates**: Only players in current rankings are updated in detailed collection
5. **Summary Data**: Pre-aggregated data reduces computation load on frontend

## Benefits for Backend APIs

1. **Fast Queries**: Flattened structure enables efficient filtering and sorting
2. **Flexible Access**: Multiple query patterns supported with proper indexing
3. **Real-time Updates**: Structure supports real-time listeners for live rankings
4. **Historical Data**: Complete history preserved for trending and analytics
5. **Metadata Tracking**: Computation metadata for debugging and monitoring
6. **Scalable**: Optimized for large datasets and high query volumes

## Migration Notes

- Legacy `/tops` collection is maintained for backward compatibility
- New structure is additive - existing functionality continues to work
- Firestore indexes must be deployed before first use: `firebase deploy --only firestore:indexes`