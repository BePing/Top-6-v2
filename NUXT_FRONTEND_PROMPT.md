# Nuxt Championship Rankings Frontend - Development Prompt

## Project Overview
Create a fullstack Nuxt.js application to display championship table tennis rankings with region selection, level filtering, player lists, and detailed player statistics.

## Tech Stack Requirements
- **Frontend**: Nuxt 3 with Vue 3 composition API
- **Styling**: Tailwind CSS for responsive design
- **Backend**: Nuxt server API routes
- **Database**: Firebase/Firestore integration
- **UI Components**: HeadlessUI or Nuxt UI for interactive elements

## Application Structure

### 1. App Layout & Navigation
```vue
<!-- layouts/default.vue -->
<template>
  <div class="min-h-screen bg-gray-50">
    <!-- App Bar with Region Selector -->
    <header class="bg-white shadow-md">
      <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <h1 class="text-xl font-bold text-gray-900">Championship Rankings</h1>
          
          <!-- Region Selector -->
          <div class="flex items-center space-x-4">
            <select v-model="selectedRegion" @change="onRegionChange" 
                    class="border border-gray-300 rounded-md px-3 py-2">
              <option value="">Select Region</option>
              <option v-for="region in regions" :key="region" :value="region">
                {{ formatRegionName(region) }}
              </option>
            </select>
            
            <!-- Current Week Display -->
            <span class="text-sm text-gray-600">Week {{ currentWeek }}</span>
          </div>
        </div>
      </nav>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <slot />
    </main>
  </div>
</template>
```

### 2. Home Page with Level Selector and Rankings
```vue
<!-- pages/index.vue -->
<template>
  <div>
    <!-- Region Info & AI Summary -->
    <div v-if="regionSummary" class="mb-8">
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-2xl font-bold mb-4">{{ formatRegionName(selectedRegion) }} Rankings</h2>
        
        <!-- AI Summary (if available) -->
        <div v-if="regionSummary.aiSummary" class="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 class="font-semibold text-blue-900 mb-2">Weekly Analysis</h3>
          <p class="text-blue-800 mb-3">{{ regionSummary.aiSummary.summary }}</p>
          
          <div class="grid md:grid-cols-2 gap-4">
            <!-- Key Highlights -->
            <div>
              <h4 class="font-medium text-blue-900 mb-2">Key Highlights</h4>
              <ul class="text-sm text-blue-700 space-y-1">
                <li v-for="highlight in regionSummary.aiSummary.keyHighlights" 
                    :key="highlight" class="flex items-start">
                  <span class="w-2 h-2 bg-blue-400 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                  {{ highlight }}
                </li>
              </ul>
            </div>
            
            <!-- Top Performers -->
            <div>
              <h4 class="font-medium text-blue-900 mb-2">Top Performers</h4>
              <div class="space-y-2">
                <div v-for="performer in regionSummary.aiSummary.topPerformers.slice(0, 3)" 
                     :key="performer.name" class="text-sm">
                  <span class="font-medium text-blue-800">{{ performer.name }}</span>
                  <span class="text-blue-600"> ({{ performer.club }})</span>
                  <p class="text-blue-700 text-xs">{{ performer.achievement }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Level Selector Tabs -->
        <div class="border-b border-gray-200 mb-6">
          <nav class="-mb-px flex space-x-8">
            <button v-for="level in availableLevels" :key="level"
                    @click="selectedLevel = level"
                    :class="[
                      selectedLevel === level 
                        ? 'border-blue-500 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                      'whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm'
                    ]">
              {{ level }} ({{ getLevelPlayerCount(level) }})
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Players Ranking List -->
    <div v-if="selectedLevel && currentRankings.length > 0" class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200">
        <h3 class="text-lg font-semibold">{{ selectedLevel }} Rankings</h3>
      </div>
      
      <div class="divide-y divide-gray-200">
        <div v-for="(player, index) in currentRankings" :key="player.uniqueIndex"
             @click="selectPlayer(player)"
             class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
          
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <!-- Position Badge -->
              <div class="flex-shrink-0">
                <span :class="[
                  'inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium',
                  index < 3 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                ]">
                  {{ player.position || index + 1 }}
                </span>
              </div>
              
              <!-- Player Info -->
              <div>
                <h4 class="text-base font-medium text-gray-900">{{ player.name }}</h4>
                <p class="text-sm text-gray-500">{{ player.clubName || player.club }}</p>
              </div>
            </div>
            
            <!-- Points Info -->
            <div class="text-right">
              <p class="text-lg font-semibold text-gray-900">{{ player.points.total }} pts</p>
              <div class="flex space-x-2 text-xs text-gray-500">
                <span v-if="player.points.count5Pts">5p: {{ player.points.count5Pts }}</span>
                <span v-if="player.points.count3Pts">3p: {{ player.points.count3Pts }}</span>
                <span v-if="player.points.count2Pts">2p: {{ player.points.count2Pts }}</span>
                <span v-if="player.points.count1Pts">1p: {{ player.points.count1Pts }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="selectedRegion && selectedLevel" class="text-center py-12">
      <div class="text-gray-400">
        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012-2" />
        </svg>
        <h3 class="mt-2 text-sm font-medium text-gray-900">No rankings found</h3>
        <p class="mt-1 text-sm text-gray-500">No players found for {{ selectedLevel }} in {{ formatRegionName(selectedRegion) }}</p>
      </div>
    </div>

    <!-- Player Detail Modal -->
    <PlayerDetailModal v-if="selectedPlayer" 
                       :player="selectedPlayer" 
                       :details="playerDetails"
                       @close="closePlayerModal" />
  </div>
</template>

<script setup>
// Page logic will be implemented here
</script>
```

### 3. Player Detail Modal Component
```vue
<!-- components/PlayerDetailModal.vue -->
<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
      <!-- Background overlay -->
      <div class="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
           @click="$emit('close')"></div>

      <!-- Modal panel -->
      <div class="relative inline-block w-full max-w-4xl p-6 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-2xl font-bold text-gray-900">{{ player.name }}</h3>
            <p class="text-sm text-gray-500">{{ player.clubName || player.club }} • {{ player.level || 'Level' }}</p>
          </div>
          <button @click="$emit('close')" 
                  class="text-gray-400 hover:text-gray-600 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Current Stats -->
        <div class="grid md:grid-cols-4 gap-4 mb-8">
          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-blue-600">{{ player.points?.total || 0 }}</p>
            <p class="text-sm text-blue-500">Total Points</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-green-600">{{ player.points?.count5Pts || 0 }}</p>
            <p class="text-sm text-green-500">5-Point Wins</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-yellow-600">{{ player.points?.count3Pts || 0 }}</p>
            <p class="text-sm text-yellow-500">3-Point Wins</p>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg text-center">
            <p class="text-2xl font-bold text-purple-600">{{ player.position || 'N/A' }}</p>
            <p class="text-sm text-purple-500">Current Position</p>
          </div>
        </div>

        <!-- Detailed Points History -->
        <div v-if="details" class="space-y-6">
          <!-- Points Breakdown -->
          <div>
            <h4 class="text-lg font-semibold mb-4">Points Breakdown</h4>
            <div class="bg-gray-50 p-4 rounded-lg">
              <div class="grid grid-cols-5 gap-4 text-center">
                <div>
                  <p class="text-lg font-bold text-green-600">{{ details.points?.count5Pts || 0 }}</p>
                  <p class="text-xs text-gray-500">5pt wins</p>
                </div>
                <div>
                  <p class="text-lg font-bold text-blue-600">{{ details.points?.count3Pts || 0 }}</p>
                  <p class="text-xs text-gray-500">3pt wins</p>
                </div>
                <div>
                  <p class="text-lg font-bold text-yellow-600">{{ details.points?.count2Pts || 0 }}</p>
                  <p class="text-xs text-gray-500">2pt wins</p>
                </div>
                <div>
                  <p class="text-lg font-bold text-purple-600">{{ details.points?.count1Pts || 0 }}</p>
                  <p class="text-xs text-gray-500">1pt wins</p>
                </div>
                <div>
                  <p class="text-lg font-bold text-red-600">{{ details.points?.count0Pts || 0 }}</p>
                  <p class="text-xs text-gray-500">0pt (losses)</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Match History -->
          <div v-if="details.points && details.points.length > 0">
            <h4 class="text-lg font-semibold mb-4">Recent Matches</h4>
            <div class="max-h-64 overflow-y-auto">
              <div class="space-y-2">
                <div v-for="match in details.points.slice(0, 20)" :key="match.matchId || match.matchUniqueId"
                     class="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <p class="text-sm font-medium">Week {{ match.weekName }}</p>
                    <p class="text-xs text-gray-500">{{ match.level }} • Division {{ match.divisionId }}</p>
                  </div>
                  <div class="text-right">
                    <span :class="[
                      'inline-flex px-2 py-1 text-xs font-medium rounded',
                      match.pointsWon > 3 ? 'bg-green-100 text-green-800' : 
                      match.pointsWon > 0 ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    ]">
                      {{ match.pointsWon }}pt {{ match.victoryCount > 0 ? 'Win' : 'Loss' }}
                    </span>
                    <p v-if="match.forfeit > 0" class="text-xs text-red-500 mt-1">Forfeit</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Historical Performance -->
          <div v-if="details.history && details.history.length > 0">
            <h4 class="text-lg font-semibold mb-4">Performance History</h4>
            <div class="max-h-48 overflow-y-auto">
              <div class="space-y-2">
                <div v-for="entry in details.history.slice().reverse()" :key="`${entry.weekName}-${entry.level}`"
                     class="flex items-center justify-between p-2 border-l-4 border-blue-200 bg-blue-50">
                  <div>
                    <p class="text-sm font-medium">Week {{ entry.weekName }}</p>
                    <p class="text-xs text-gray-600">{{ entry.level }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold">Position {{ entry.position }}</p>
                    <p class="text-xs text-gray-600">{{ entry.points }} points</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading state -->
        <div v-else class="flex justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['close'])
defineProps({
  player: Object,
  details: Object
})
</script>
```

## Backend API Implementation

### 4. Server API Routes
```typescript
// server/api/regions.get.ts
export default defineEventHandler(async (event) => {
  // Return available regions
  return {
    regions: ['HUY_WAREMME', 'LIEGE', 'VERVIERS'],
    currentWeek: 12 // Get from configuration
  }
})

// server/api/region-summary/[region]/[week].get.ts
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export default defineEventHandler(async (event) => {
  const { region, week } = getRouterParams(event)
  
  // Initialize Firebase (do this once in a plugin)
  const db = getFirestore()
  
  try {
    const doc = await db.collection('region-summaries')
      .doc(`${region}-week-${week}`)
      .get()
    
    if (!doc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Region summary not found'
      })
    }
    
    return doc.data()
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch region summary'
    })
  }
})

// server/api/rankings/[region]/[level]/[week].get.ts
export default defineEventHandler(async (event) => {
  const { region, level, week } = getRouterParams(event)
  const query = getQuery(event)
  const limit = parseInt(query.limit as string) || 50
  
  const db = getFirestore()
  
  try {
    const snapshot = await db.collection('rankings')
      .where('region', '==', region)
      .where('level', '==', level)
      .where('weekName', '==', parseInt(week))
      .orderBy('position', 'asc')
      .limit(limit)
      .get()
    
    const rankings = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return { rankings }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch rankings'
    })
  }
})

// server/api/player-details/[uniqueIndex].get.ts
export default defineEventHandler(async (event) => {
  const { uniqueIndex } = getRouterParams(event)
  
  const db = getFirestore()
  
  try {
    const doc = await db.collection('players-points-details')
      .doc(uniqueIndex)
      .get()
    
    if (!doc.exists) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Player details not found'
      })
    }
    
    return doc.data()
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch player details'
    })
  }
})
```

## Frontend Logic Implementation

### 5. Composables and State Management
```typescript
// composables/useRankings.ts
export const useRankings = () => {
  const selectedRegion = ref('')
  const selectedLevel = ref('')
  const currentWeek = ref(12)
  const regions = ref(['HUY_WAREMME', 'LIEGE', 'VERVIERS'])
  const availableLevels = ref(['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'NAT_WB'])
  
  const regionSummary = ref(null)
  const currentRankings = ref([])
  const selectedPlayer = ref(null)
  const playerDetails = ref(null)

  // Load initial data
  const loadRegions = async () => {
    try {
      const { data } = await $fetch('/api/regions')
      regions.value = data.regions
      currentWeek.value = data.currentWeek
    } catch (error) {
      console.error('Failed to load regions:', error)
    }
  }

  // Load region summary with AI analysis
  const loadRegionSummary = async (region: string, week: number) => {
    if (!region) return
    
    try {
      const data = await $fetch(`/api/region-summary/${region}/${week}`)
      regionSummary.value = data
      
      // Set default level to first available level with players
      if (data.playersByLevel) {
        const levelsWithPlayers = Object.entries(data.playersByLevel)
          .filter(([_, count]) => count > 0)
          .map(([level]) => level)
        
        if (levelsWithPlayers.length > 0 && !selectedLevel.value) {
          selectedLevel.value = levelsWithPlayers[0]
        }
      }
    } catch (error) {
      console.error('Failed to load region summary:', error)
      regionSummary.value = null
    }
  }

  // Load rankings for selected region/level
  const loadRankings = async (region: string, level: string, week: number) => {
    if (!region || !level) return
    
    try {
      const { rankings } = await $fetch(`/api/rankings/${region}/${level}/${week}`)
      currentRankings.value = rankings
    } catch (error) {
      console.error('Failed to load rankings:', error)
      currentRankings.value = []
    }
  }

  // Load player details
  const loadPlayerDetails = async (uniqueIndex: string) => {
    try {
      const details = await $fetch(`/api/player-details/${uniqueIndex}`)
      playerDetails.value = details
    } catch (error) {
      console.error('Failed to load player details:', error)
      playerDetails.value = null
    }
  }

  // Select player and load details
  const selectPlayer = async (player: any) => {
    selectedPlayer.value = player
    playerDetails.value = null // Reset details
    await loadPlayerDetails(player.uniqueIndex)
  }

  const closePlayerModal = () => {
    selectedPlayer.value = null
    playerDetails.value = null
  }

  // Utility functions
  const formatRegionName = (region: string) => {
    return region.replace(/_/g, ' ').toLowerCase()
      .replace(/\b\w/g, l => l.toUpperCase())
  }

  const getLevelPlayerCount = (level: string) => {
    return regionSummary.value?.playersByLevel?.[level] || 0
  }

  // Watchers for reactive updates
  watchEffect(() => {
    if (selectedRegion.value) {
      loadRegionSummary(selectedRegion.value, currentWeek.value)
    }
  })

  watchEffect(() => {
    if (selectedRegion.value && selectedLevel.value) {
      loadRankings(selectedRegion.value, selectedLevel.value, currentWeek.value)
    }
  })

  return {
    // State
    selectedRegion,
    selectedLevel,
    currentWeek,
    regions,
    availableLevels,
    regionSummary,
    currentRankings,
    selectedPlayer,
    playerDetails,
    
    // Actions
    loadRegions,
    loadRegionSummary,
    loadRankings,
    selectPlayer,
    closePlayerModal,
    
    // Utilities
    formatRegionName,
    getLevelPlayerCount
  }
}

// pages/index.vue script section
<script setup>
const {
  selectedRegion,
  selectedLevel,
  currentWeek,
  regions,
  availableLevels,
  regionSummary,
  currentRankings,
  selectedPlayer,
  playerDetails,
  loadRegions,
  selectPlayer,
  closePlayerModal,
  formatRegionName,
  getLevelPlayerCount
} = useRankings()

// Initialize data on mount
onMounted(() => {
  loadRegions()
})

// Handle region change
const onRegionChange = () => {
  selectedLevel.value = '' // Reset level selection
  currentRankings.value = [] // Clear current rankings
}
</script>
```

## Setup Instructions

### 6. Project Configuration
```bash
# Create new Nuxt project
npx nuxi@latest init championship-rankings-frontend
cd championship-rankings-frontend

# Install dependencies
npm install @nuxtjs/tailwindcss firebase-admin
npm install --save-dev @headlessui/vue @heroicons/vue

# Add to nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    // Server-side environment variables
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
    firebasePrivateKey: process.env.FIREBASE_PRIVATE_KEY,
    firebaseClientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    
    // Public environment variables (exposed to client)
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },
  css: ['~/assets/css/main.css']
})
```

### 7. Environment Configuration
```env
# .env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com

# API Configuration
NUXT_PUBLIC_API_BASE=http://localhost:3000/api
```

### 8. Firebase Plugin
```typescript
// plugins/firebase.server.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

export default defineNitroPlugin(async (nitroApp) => {
  const config = useRuntimeConfig()
  
  // Initialize Firebase Admin (only if not already initialized)
  if (getApps().length === 0) {
    const serviceAccount = {
      projectId: config.firebaseProjectId,
      privateKey: config.firebasePrivateKey.replace(/\\n/g, '\n'),
      clientEmail: config.firebaseClientEmail,
    }

    initializeApp({
      credential: cert(serviceAccount)
    })
  }
})
```

## Additional Features

### 9. Loading States and Error Handling
```vue
<!-- components/LoadingSpinner.vue -->
<template>
  <div class="flex items-center justify-center p-8">
    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span class="ml-2 text-gray-600">{{ message }}</span>
  </div>
</template>

<!-- components/ErrorMessage.vue -->
<template>
  <div class="bg-red-50 border border-red-200 rounded-md p-4">
    <div class="flex">
      <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
      </svg>
      <div class="ml-3">
        <h3 class="text-sm font-medium text-red-800">Error</h3>
        <p class="text-sm text-red-700 mt-1">{{ message }}</p>
      </div>
    </div>
  </div>
</template>
```

### 10. Responsive Design Considerations
- Mobile-first approach with Tailwind CSS
- Collapsible navigation for mobile devices  
- Touch-friendly buttons and interactions
- Optimized modal display for mobile screens
- Proper table scrolling on small screens

### 11. Performance Optimizations
- Lazy loading of player details
- Caching of region summaries
- Pagination for large player lists
- Image optimization for club logos
- Server-side rendering for SEO

This comprehensive prompt provides everything needed to build a fullstack Nuxt application that displays championship rankings with the exact features you requested: region selection in the app bar, level filtering, player lists, and detailed player information on click.

The application will be fully responsive, include AI-generated summaries when available, and provide a smooth user experience with proper loading states and error handling.