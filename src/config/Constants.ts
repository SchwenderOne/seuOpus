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
export const MAX_ENEMIES_ON_SCREEN = 125; // 2.5x original 50

// XP and Leveling
export const BASE_XP_TO_LEVEL = 10;
export const XP_SCALING_FACTOR = 1.5;
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
  // Base radius at level 1 (protection zone) - 75% larger than original
  BASE_RADIUS: 263,
  // Radius increase per level (scaled proportionally)
  RADIUS_PER_LEVEL: 88,
  // Maximum level (5 stations)
  MAX_LEVEL: 5,
  // Base upgrade time in ms (5 seconds)
  BASE_UPGRADE_TIME: 5000,
  // Additional time per level in ms (5 seconds more per level)
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
    [50, 3],      // Level 2
    [100, 5],     // Level 3
    [200, 8],     // Level 4
    [400, 12],    // Level 5
  ],
  // Benefits per level
  BENEFITS: {
    // Level 2: HP regen per second while inside (% of max HP)
    HP_REGEN_RATE: 0.02,      // 2% per second
    // Level 3: Damage boost while inside
    DAMAGE_BOOST: 1.25,       // +25%
    // Level 4: XP multiplier while inside
    XP_BOOST: 1.5,            // +50%
    // Level 5: Fire rate boost while inside
    FIRE_RATE_BOOST: 1.2,     // +20%
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
