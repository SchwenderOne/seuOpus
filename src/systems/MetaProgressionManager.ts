/**
 * MetaProgressionManager - Handles persistent game progress across runs
 * Uses localStorage for persistence
 */

const SAVE_KEY = 'roguelike_meta_progression';

/**
 * Permanent upgrade definitions
 */
export enum PermanentUpgradeType {
  MAX_HP = 'perm_max_hp',
  MOVE_SPEED = 'perm_move_speed',
  DAMAGE = 'perm_damage',
  PICKUP_RADIUS = 'perm_pickup_radius',
  XP_GAIN = 'perm_xp_gain',
  GOLD_GAIN = 'perm_gold_gain',
  STARTING_LEVEL = 'perm_starting_level',
  CRITICAL_CHANCE = 'perm_critical_chance',
}

export interface PermanentUpgrade {
  type: PermanentUpgradeType;
  name: string;
  description: string;
  icon: string;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  valuePerLevel: number;
  valueType: 'flat' | 'percent';
}

export const PERMANENT_UPGRADES: PermanentUpgrade[] = [
  {
    type: PermanentUpgradeType.MAX_HP,
    name: 'Vitality',
    description: 'Increase starting HP',
    icon: '❤️',
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.5,
    valuePerLevel: 10,
    valueType: 'flat',
  },
  {
    type: PermanentUpgradeType.MOVE_SPEED,
    name: 'Swiftness',
    description: 'Increase movement speed',
    icon: '👟',
    maxLevel: 5,
    baseCost: 75,
    costMultiplier: 1.8,
    valuePerLevel: 5,
    valueType: 'percent',
  },
  {
    type: PermanentUpgradeType.DAMAGE,
    name: 'Power',
    description: 'Increase base damage',
    icon: '⚔️',
    maxLevel: 10,
    baseCost: 100,
    costMultiplier: 1.6,
    valuePerLevel: 5,
    valueType: 'percent',
  },
  {
    type: PermanentUpgradeType.PICKUP_RADIUS,
    name: 'Magnetism',
    description: 'Increase pickup radius',
    icon: '🧲',
    maxLevel: 5,
    baseCost: 50,
    costMultiplier: 1.5,
    valuePerLevel: 15,
    valueType: 'percent',
  },
  {
    type: PermanentUpgradeType.XP_GAIN,
    name: 'Wisdom',
    description: 'Increase XP gain',
    icon: '📚',
    maxLevel: 5,
    baseCost: 100,
    costMultiplier: 2.0,
    valuePerLevel: 10,
    valueType: 'percent',
  },
  {
    type: PermanentUpgradeType.GOLD_GAIN,
    name: 'Greed',
    description: 'Increase gold gain',
    icon: '💰',
    maxLevel: 5,
    baseCost: 150,
    costMultiplier: 2.0,
    valuePerLevel: 15,
    valueType: 'percent',
  },
  {
    type: PermanentUpgradeType.STARTING_LEVEL,
    name: 'Veteran',
    description: 'Start at higher level',
    icon: '⭐',
    maxLevel: 3,
    baseCost: 500,
    costMultiplier: 3.0,
    valuePerLevel: 1,
    valueType: 'flat',
  },
  {
    type: PermanentUpgradeType.CRITICAL_CHANCE,
    name: 'Precision',
    description: 'Chance to deal double damage',
    icon: '🎯',
    maxLevel: 5,
    baseCost: 200,
    costMultiplier: 2.0,
    valuePerLevel: 5,
    valueType: 'percent',
  },
];

/**
 * Character definition
 */
export interface CharacterDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockCost: number;
  unlockRequirement?: string;
  stats: {
    hp: number;
    speed: number;
    damage: number;
    fireRate: number;
    pickupRadius: number;
  };
  specialAbility?: string;
}

export const CHARACTERS: CharacterDefinition[] = [
  {
    id: 'knight',
    name: 'Knight',
    description: 'Balanced fighter with no weaknesses',
    icon: '🛡️',
    unlockCost: 0,
    stats: { hp: 100, speed: 100, damage: 100, fireRate: 100, pickupRadius: 100 },
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Fast and deadly, but fragile',
    icon: '🗡️',
    unlockCost: 500,
    stats: { hp: 70, speed: 130, damage: 120, fireRate: 110, pickupRadius: 100 },
    specialAbility: '+10% Critical Chance',
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'High damage, slow movement',
    icon: '🧙',
    unlockCost: 750,
    stats: { hp: 80, speed: 85, damage: 150, fireRate: 90, pickupRadius: 130 },
    specialAbility: '+20% XP Gain',
  },
  {
    id: 'berserker',
    name: 'Berserker',
    description: 'Deals more damage at low HP',
    icon: '🪓',
    unlockCost: 1000,
    stats: { hp: 120, speed: 110, damage: 90, fireRate: 120, pickupRadius: 80 },
    specialAbility: 'Rage: +50% damage below 30% HP',
  },
  {
    id: 'merchant',
    name: 'Merchant',
    description: 'Finds more gold, but weaker combat',
    icon: '💎',
    unlockCost: 1500,
    unlockRequirement: 'Collect 5000 total gold',
    stats: { hp: 90, speed: 100, damage: 80, fireRate: 100, pickupRadius: 150 },
    specialAbility: '+50% Gold Find',
  },
  {
    id: 'vampire',
    name: 'Vampire',
    description: 'Lifesteal on kills',
    icon: '🧛',
    unlockCost: 2000,
    unlockRequirement: 'Kill 1000 enemies total',
    stats: { hp: 85, speed: 105, damage: 110, fireRate: 100, pickupRadius: 100 },
    specialAbility: 'Heal 3 HP per kill',
  },
];

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  reward: number;
  isSecret?: boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  // Kill achievements
  { id: 'first_blood', name: 'First Blood', description: 'Kill your first enemy', icon: '🗡️', reward: 10 },
  { id: 'slayer_100', name: 'Monster Slayer', description: 'Kill 100 enemies in one run', icon: '💀', reward: 50 },
  { id: 'slayer_500', name: 'Mass Extinction', description: 'Kill 500 enemies in one run', icon: '☠️', reward: 150 },
  { id: 'boss_hunter', name: 'Boss Hunter', description: 'Kill your first boss', icon: '👑', reward: 75 },
  { id: 'boss_slayer', name: 'Boss Slayer', description: 'Kill 10 bosses total', icon: '🏆', reward: 200 },
  
  // Survival achievements
  { id: 'survivor_1', name: 'Survivor', description: 'Survive for 1 minute', icon: '⏱️', reward: 25 },
  { id: 'survivor_3', name: 'Endurance', description: 'Survive for 3 minutes', icon: '⏰', reward: 75 },
  { id: 'victor', name: 'Victor', description: 'Complete a run (5 minutes)', icon: '🏅', reward: 200 },
  
  // Level achievements
  { id: 'level_5', name: 'Growing Strong', description: 'Reach level 5', icon: '⬆️', reward: 25 },
  { id: 'level_10', name: 'Experienced', description: 'Reach level 10', icon: '📈', reward: 75 },
  { id: 'level_20', name: 'Master', description: 'Reach level 20', icon: '🎓', reward: 200 },
  
  // Weapon achievements
  { id: 'weapon_unlock', name: 'Armed', description: 'Unlock a second weapon', icon: '🔫', reward: 30 },
  { id: 'evolution', name: 'Evolution', description: 'Evolve a weapon', icon: '🌟', reward: 100 },
  { id: 'all_weapons', name: 'Arsenal', description: 'Unlock all weapons in one run', icon: '⚔️', reward: 150 },
  
  // Gold achievements
  { id: 'gold_100', name: 'Pocket Change', description: 'Collect 100 gold total', icon: '🪙', reward: 20 },
  { id: 'gold_1000', name: 'Wealthy', description: 'Collect 1000 gold total', icon: '💰', reward: 100 },
  { id: 'gold_5000', name: 'Rich', description: 'Collect 5000 gold total', icon: '💎', reward: 300 },
  
  // Special achievements
  { id: 'untouched', name: 'Untouchable', description: 'Survive 1 minute without taking damage', icon: '✨', reward: 150 },
  { id: 'no_upgrade', name: 'Minimalist', description: 'Win without taking any upgrades', icon: '🎭', reward: 500, isSecret: true },
  { id: 'speedrun', name: 'Speedrunner', description: 'Win in under 4 minutes', icon: '⚡', reward: 300, isSecret: true },
];

/**
 * Save data structure
 */
export interface MetaProgressionData {
  gold: number;
  totalGoldEarned: number;
  totalKills: number;
  totalBossKills: number;
  totalRuns: number;
  totalVictories: number;
  highestWave: number;
  highestLevel: number;
  longestSurvival: number;
  upgradesLevels: Record<PermanentUpgradeType, number>;
  unlockedCharacters: string[];
  selectedCharacter: string;
  unlockedAchievements: string[];
  statistics: {
    totalPlayTime: number;
    fastestVictory: number;
  };
}

/**
 * Default save data
 */
const DEFAULT_SAVE: MetaProgressionData = {
  gold: 0,
  totalGoldEarned: 0,
  totalKills: 0,
  totalBossKills: 0,
  totalRuns: 0,
  totalVictories: 0,
  highestWave: 0,
  highestLevel: 0,
  longestSurvival: 0,
  upgradesLevels: {
    [PermanentUpgradeType.MAX_HP]: 0,
    [PermanentUpgradeType.MOVE_SPEED]: 0,
    [PermanentUpgradeType.DAMAGE]: 0,
    [PermanentUpgradeType.PICKUP_RADIUS]: 0,
    [PermanentUpgradeType.XP_GAIN]: 0,
    [PermanentUpgradeType.GOLD_GAIN]: 0,
    [PermanentUpgradeType.STARTING_LEVEL]: 0,
    [PermanentUpgradeType.CRITICAL_CHANCE]: 0,
  },
  unlockedCharacters: ['knight'],
  selectedCharacter: 'knight',
  unlockedAchievements: [],
  statistics: {
    totalPlayTime: 0,
    fastestVictory: 0,
  },
};

/**
 * MetaProgressionManager Singleton
 */
export class MetaProgressionManager {
  private static instance: MetaProgressionManager;
  private data: MetaProgressionData;
  private listeners: (() => void)[] = [];

  private constructor() {
    this.data = this.load();
  }

  public static getInstance(): MetaProgressionManager {
    if (!MetaProgressionManager.instance) {
      MetaProgressionManager.instance = new MetaProgressionManager();
    }
    return MetaProgressionManager.instance;
  }

  /**
   * Load save data from localStorage
   */
  private load(): MetaProgressionData {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new fields
        return { ...DEFAULT_SAVE, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load save data:', e);
    }
    return { ...DEFAULT_SAVE };
  }

  /**
   * Save data to localStorage
   */
  public save(): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.notifyListeners();
    } catch (e) {
      console.warn('Failed to save data:', e);
    }
  }

  /**
   * Reset all progress (with confirmation)
   */
  public resetProgress(): void {
    this.data = { ...DEFAULT_SAVE };
    this.save();
  }

  // === Gold Management ===
  
  public getGold(): number {
    return this.data.gold;
  }

  public addGold(amount: number): void {
    // Apply gold gain bonus
    const bonus = this.getUpgradeValue(PermanentUpgradeType.GOLD_GAIN);
    const finalAmount = Math.floor(amount * (1 + bonus / 100));
    
    this.data.gold += finalAmount;
    this.data.totalGoldEarned += finalAmount;
    this.save();
  }

  public spendGold(amount: number): boolean {
    if (this.data.gold >= amount) {
      this.data.gold -= amount;
      this.save();
      return true;
    }
    return false;
  }

  // === Upgrades ===

  public getUpgradeLevel(type: PermanentUpgradeType): number {
    return this.data.upgradesLevels[type] || 0;
  }

  public getUpgradeCost(type: PermanentUpgradeType): number {
    const upgrade = PERMANENT_UPGRADES.find(u => u.type === type);
    if (!upgrade) return 0;
    
    const level = this.getUpgradeLevel(type);
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, level));
  }

  public getUpgradeValue(type: PermanentUpgradeType): number {
    const upgrade = PERMANENT_UPGRADES.find(u => u.type === type);
    if (!upgrade) return 0;
    
    const level = this.getUpgradeLevel(type);
    return level * upgrade.valuePerLevel;
  }

  public canUpgrade(type: PermanentUpgradeType): boolean {
    const upgrade = PERMANENT_UPGRADES.find(u => u.type === type);
    if (!upgrade) return false;
    
    const level = this.getUpgradeLevel(type);
    if (level >= upgrade.maxLevel) return false;
    
    return this.data.gold >= this.getUpgradeCost(type);
  }

  public purchaseUpgrade(type: PermanentUpgradeType): boolean {
    if (!this.canUpgrade(type)) return false;
    
    const cost = this.getUpgradeCost(type);
    if (this.spendGold(cost)) {
      this.data.upgradesLevels[type] = (this.data.upgradesLevels[type] || 0) + 1;
      this.save();
      return true;
    }
    return false;
  }

  // === Characters ===

  public isCharacterUnlocked(id: string): boolean {
    return this.data.unlockedCharacters.includes(id);
  }

  public unlockCharacter(id: string): boolean {
    const character = CHARACTERS.find(c => c.id === id);
    if (!character) return false;
    if (this.isCharacterUnlocked(id)) return false;
    if (this.data.gold < character.unlockCost) return false;
    
    this.spendGold(character.unlockCost);
    this.data.unlockedCharacters.push(id);
    this.save();
    return true;
  }

  public selectCharacter(id: string): boolean {
    if (!this.isCharacterUnlocked(id)) return false;
    this.data.selectedCharacter = id;
    this.save();
    return true;
  }

  public getSelectedCharacter(): CharacterDefinition {
    const character = CHARACTERS.find(c => c.id === this.data.selectedCharacter);
    return character || CHARACTERS[0];
  }

  // === Achievements ===

  public isAchievementUnlocked(id: string): boolean {
    return this.data.unlockedAchievements.includes(id);
  }

  public unlockAchievement(id: string): Achievement | null {
    if (this.isAchievementUnlocked(id)) return null;
    
    const achievement = ACHIEVEMENTS.find(a => a.id === id);
    if (!achievement) return null;
    
    this.data.unlockedAchievements.push(id);
    this.data.gold += achievement.reward;
    this.data.totalGoldEarned += achievement.reward;
    this.save();
    
    return achievement;
  }

  public getAchievements(): { achievement: Achievement; unlocked: boolean }[] {
    return ACHIEVEMENTS.map(a => ({
      achievement: a,
      unlocked: this.isAchievementUnlocked(a.id),
    }));
  }

  // === Statistics ===

  public updateRunStats(stats: {
    kills: number;
    bossKills: number;
    waveReached: number;
    levelReached: number;
    timeSurvived: number;
    goldCollected: number;
    victory: boolean;
  }): void {
    this.data.totalKills += stats.kills;
    this.data.totalBossKills += stats.bossKills;
    this.data.totalRuns += 1;
    
    if (stats.victory) {
      this.data.totalVictories += 1;
    }
    
    if (stats.waveReached > this.data.highestWave) {
      this.data.highestWave = stats.waveReached;
    }
    
    if (stats.levelReached > this.data.highestLevel) {
      this.data.highestLevel = stats.levelReached;
    }
    
    if (stats.timeSurvived > this.data.longestSurvival) {
      this.data.longestSurvival = stats.timeSurvived;
    }
    
    this.data.statistics.totalPlayTime += stats.timeSurvived;
    
    if (stats.victory) {
      if (this.data.statistics.fastestVictory === 0 || 
          stats.timeSurvived < this.data.statistics.fastestVictory) {
        this.data.statistics.fastestVictory = stats.timeSurvived;
      }
    }
    
    this.save();
  }

  public getData(): MetaProgressionData {
    return { ...this.data };
  }

  public getTotalGoldEarned(): number {
    return this.data.totalGoldEarned;
  }

  public getTotalKills(): number {
    return this.data.totalKills;
  }

  // === Calculated Stats for Game ===

  public getStartingHP(): number {
    const character = this.getSelectedCharacter();
    const baseHP = 100 * (character.stats.hp / 100);
    const bonus = this.getUpgradeValue(PermanentUpgradeType.MAX_HP);
    return Math.floor(baseHP + bonus);
  }

  public getSpeedMultiplier(): number {
    const character = this.getSelectedCharacter();
    const charBonus = character.stats.speed / 100;
    const upgradeBonus = this.getUpgradeValue(PermanentUpgradeType.MOVE_SPEED) / 100;
    return charBonus * (1 + upgradeBonus);
  }

  public getDamageMultiplier(): number {
    const character = this.getSelectedCharacter();
    const charBonus = character.stats.damage / 100;
    const upgradeBonus = this.getUpgradeValue(PermanentUpgradeType.DAMAGE) / 100;
    return charBonus * (1 + upgradeBonus);
  }

  public getPickupRadiusMultiplier(): number {
    const character = this.getSelectedCharacter();
    const charBonus = character.stats.pickupRadius / 100;
    const upgradeBonus = this.getUpgradeValue(PermanentUpgradeType.PICKUP_RADIUS) / 100;
    return charBonus * (1 + upgradeBonus);
  }

  public getXPMultiplier(): number {
    return 1 + this.getUpgradeValue(PermanentUpgradeType.XP_GAIN) / 100;
  }

  public getCriticalChance(): number {
    return this.getUpgradeValue(PermanentUpgradeType.CRITICAL_CHANCE) / 100;
  }

  public getStartingLevel(): number {
    return 1 + this.getUpgradeValue(PermanentUpgradeType.STARTING_LEVEL);
  }

  // === Listeners for UI updates ===

  public addListener(callback: () => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: () => void): void {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach(l => l());
  }
}
