/**
 * Game Constants
 * Central location for all magic numbers and configuration values
 */

// Tile Configuration
export const TILE_SIZE = 32;
export const CHARACTER_FRAME_SIZE = 48;
export const UI_GRID_SIZE = 32;

// Map Configuration
export const MAP_WIDTH_TILES = 64; // Number of tiles wide
export const MAP_HEIGHT_TILES = 64; // Number of tiles tall
export const MAP_WIDTH = MAP_WIDTH_TILES * TILE_SIZE;
export const MAP_HEIGHT = MAP_HEIGHT_TILES * TILE_SIZE;

// Player Configuration
export const PLAYER_SPEED = 200;
export const PLAYER_MAX_HP = 100;
export const PLAYER_PICKUP_RANGE = 64;
export const PLAYER_INVINCIBILITY_DURATION = 1000; // ms

// Projectile Configuration
export const PROJECTILE_SPEED = 400;
export const PROJECTILE_LIFESPAN = 2000; // ms
export const PROJECTILE_POOL_SIZE = 100;

// Enemy Configuration
export const ENEMY_SPAWN_DISTANCE = 400; // Spawn at least this far from player
export const ENEMY_DESPAWN_DISTANCE = 800; // Despawn if further than this
export const INITIAL_SPAWN_INTERVAL = 800; // ms (2.5x faster than original 2000ms)
export const MIN_SPAWN_INTERVAL = 200; // ms (2.5x faster than original 500ms)
export const SPAWN_INTERVAL_DECREASE_RATE = 50; // ms decrease per wave

// Wave Configuration
export const WAVE_DURATION = 30000; // 30 seconds per wave
export const MAX_ENEMIES_ON_SCREEN = 90; // Balanced for gameplay (original 50, was 125)

// XP and Leveling
export const BASE_XP_TO_LEVEL = 10;
export const XP_SCALING_FACTOR = 1.35; // Smoother progression (was 1.5)
export const XP_GEM_VALUE = 1;

// Game Timer
export const GAME_DURATION = 5 * 60 * 1000; // 5 minutes in ms

// Scene Keys
export const SCENE_KEYS = {
  BOOT: 'BootScene',
  PRELOADER: 'PreloaderScene',
  MAIN_MENU: 'MainMenuScene',
  GAME: 'GameScene',
  GAME_OVER: 'GameOverScene',
} as const;

// Asset Keys
export const ASSET_KEYS = {
  // Tilesets
  MAIN_TILESET: 'main_tileset',
  
  // Character
  PLAYER_WALK_DOWN: 'player_walk_down',
  PLAYER_WALK_SIDE: 'player_walk_side',
  PLAYER_WALK_UP: 'player_walk_up',
  PLAYER_DEATH: 'player_death',
  
  // Weapons
  WEAPON_PREFIX: 'weapon_',
  PROJECTILE_PREFIX: 'projectile_',
  
  // Enemies
  ENEMY_PREFIX: 'enemy_',
  
  // UI
  UI_TILESET: 'ui_tileset',
  BUTTON_SET: 'button_set',
  
  // Effects
  EFFECT_PREFIX: 'effect_',
} as const;

// Animation Keys
export const ANIM_KEYS = {
  PLAYER_IDLE: 'player_idle',
  PLAYER_WALK_DOWN: 'player_walk_down',
  PLAYER_WALK_SIDE: 'player_walk_side',
  PLAYER_WALK_UP: 'player_walk_up',
  PLAYER_DEATH: 'player_death',
} as const;

// Depth Layers (z-index)
export const DEPTH = {
  FLOOR: 0,
  DECORATIONS: 10,
  SHADOWS: 20,
  ITEMS: 30,
  STATION: 35,
  ENEMIES: 40,
  PLAYER: 50,
  PROJECTILES: 60,
  EFFECTS: 70,
  UI: 100,
} as const;

// Space Station Configuration
export const SPACE_STATION = {
  // Base radius at level 1 (protection zone)
  BASE_RADIUS: 200,
  // Radius increase per level (Level 5 gets bonus)
  RADIUS_PER_LEVEL: 50,
  // Level 5 bonus radius
  LEVEL_5_RADIUS_BONUS: 100, // +50% larger at max level
  // Maximum level
  MAX_LEVEL: 5,
  // Base upgrade time in ms (5 seconds)
  BASE_UPGRADE_TIME: 5000,
  // Additional time per level in ms
  UPGRADE_TIME_PER_LEVEL: 5000,
  // Material spawn interval in ms (every 20 seconds)
  MATERIAL_SPAWN_INTERVAL: 20000,
  // Max materials on map at once
  MAX_MATERIALS_ON_MAP: 8,
  // Material spawn distance from player (min, max)
  MATERIAL_SPAWN_DISTANCE_MIN: 200,
  MATERIAL_SPAWN_DISTANCE_MAX: 500,
  // Upgrade costs per level [gold, materials]
  UPGRADE_COSTS: [
    [0, 0],       // Level 1 (free/starting)
    [50, 3],      // Level 2 - Sanctuary Shield
    [100, 5],     // Level 3 - HP Regen
    [200, 8],     // Level 4 - Combat Buffs
    [400, 12],    // Level 5 - Ultimate Station
  ],
  
  // === LEVEL BENEFITS (Revised for Lingering Buff System) ===
  BENEFITS: {
    // Level 2: Sanctuary Shield - temporary shield on entering zone
    SANCTUARY_SHIELD: {
      PERCENT: 0.15,           // 15% of max HP as shield
      COOLDOWN: 30000,         // 30 second cooldown
    },
    
    // Level 3: HP Regeneration
    HP_REGEN: {
      RATE_INSIDE: 0.02,       // 2% per second while inside
      RATE_LINGERING: 0.005,   // 0.5% per second after leaving
      LINGER_DURATION: 10000,  // 10 seconds after leaving
    },
    
    // Level 4: Combat Buffs (LINGERING - apply after leaving zone)
    COMBAT_BUFFS: {
      DAMAGE_BOOST: 1.20,      // +20% damage
      XP_BOOST: 1.30,          // +30% XP
      DURATION: 12000,         // 12 seconds after leaving
    },
    
    // Level 5: Ultimate Buffs (LINGERING)
    ULTIMATE_BUFFS: {
      FIRE_RATE_BOOST: 1.15,   // +15% fire rate
      SPEED_BOOST: 1.10,       // +10% movement speed
      DURATION: 12000,         // 12 seconds after leaving
    },
  },
  
  // === STATION MODULES (Horizontal Progression) ===
  MODULES: {
    // Unlock modules at station level 2
    UNLOCK_LEVEL: 2,
    MAX_TIER: 3,
    
    // Shield Generator - Uses JUNK materials
    SHIELD: {
      NAME: 'Shield Generator',
      MATERIAL_TYPE: 'junk',
      COSTS: [5, 10, 15], // Tier 1, 2, 3
      EFFECTS: {
        TIER_1: { DAMAGE_REDUCTION: 0.15 },           // 15% less damage inside
        TIER_2: { SHIELD_BONUS: 0.10 },               // +10% shield capacity
        TIER_3: { SHIELD_REGEN_RATE: 0.01 },          // 1% shield regen/s inside
      },
    },
    
    // Medical Bay - Uses CHEST materials
    MEDICAL: {
      NAME: 'Medical Bay',
      MATERIAL_TYPE: 'chest',
      COSTS: [5, 10, 15],
      EFFECTS: {
        TIER_1: { REGEN_MULTIPLIER: 2.0 },            // Double HP regen rate
        TIER_2: { EMERGENCY_HEAL_THRESHOLD: 0.30, EMERGENCY_HEAL_AMOUNT: 0.20 }, // 20% heal when entering below 30% HP
        TIER_3: { LINGER_DURATION_BONUS: 5000 },      // +5s lingering regen
      },
    },
    
    // Power Core - Uses SLOB materials
    POWER: {
      NAME: 'Power Core',
      MATERIAL_TYPE: 'slob',
      COSTS: [5, 10, 15],
      EFFECTS: {
        TIER_1: { BUFF_DURATION_BONUS: 5000 },        // +5s to all lingering buffs
        TIER_2: { DAMAGE_BONUS: 0.10 },               // +10% to damage bonus
        TIER_3: { LIFESTEAL: 0.03 },                  // 3% lifesteal during buffs
      },
    },
    
    // Sensor Array - Uses ANY materials
    SENSOR: {
      NAME: 'Sensor Array',
      MATERIAL_TYPE: 'any',
      COSTS: [5, 10, 15],
      EFFECTS: {
        TIER_1: { MATERIAL_SPAWN_RATE: 1.5 },         // 50% faster material spawns
        TIER_2: { MAGNET_RANGE_BONUS: 1.0 },          // +100% magnet range inside
        TIER_3: { MINIMAP_REVEAL: true },             // Reveal materials on minimap
      },
    },
  },
} as const;

// Supply Drop Configuration
export const SUPPLY_DROP = {
  // Spawn interval in ms (45 seconds)
  SPAWN_INTERVAL: 45000,
  // First drop spawn time (20 seconds into game)
  FIRST_SPAWN_DELAY: 20000,
  // Maximum drops on map at once
  MAX_DROPS_ON_MAP: 3,
  // Drop fall duration in ms
  FALL_DURATION: 1500,
  // Drop collection radius
  COLLECTION_RADIUS: 40,
  // Time before drop despawns (60 seconds)
  DESPAWN_TIME: 60000,
  // Drop type weights (higher = more common)
  DROP_WEIGHTS: {
    gold: 30,       // 30% chance
    material: 25,   // 25% chance
    health: 20,     // 20% chance
    power: 15,      // 15% chance - temp damage boost
    speed: 10,      // 10% chance - temp speed boost
  },
  // Rewards per drop type
  REWARDS: {
    gold: { min: 25, max: 75 },
    material: { amount: 2 },
    health: { percent: 0.3 },  // 30% of max HP
    power: { multiplier: 1.5, duration: 10000 },  // +50% damage for 10s
    speed: { multiplier: 1.4, duration: 8000 },   // +40% speed for 8s
  },
  // Visual settings
  FALL_HEIGHT: 400,  // How high the pod starts
  SHADOW_SCALE: 0.3, // Initial shadow scale
} as const;
