import { Player } from '../entities/Player';
import { ProjectileManager } from './ProjectileManager';
import { XPGemManager } from './XPGemManager';
import { WeaponManager, WeaponType } from './WeaponManager';

/**
 * Upgrade types available in the game
 */
export enum UpgradeType {
  MAX_HP = 'max_hp',
  MOVE_SPEED = 'move_speed',
  DAMAGE = 'damage',
  FIRE_RATE = 'fire_rate',
  PICKUP_RADIUS = 'pickup_radius',
  HP_REGEN = 'hp_regen',
  // Weapon unlocks/upgrades
  WEAPON_AXE = 'weapon_axe',
  WEAPON_DAGGER = 'weapon_dagger',
  WEAPON_ORB = 'weapon_orb',
  // Weapon evolutions
  EVOLUTION_AXE = 'evolution_axe',
  EVOLUTION_DAGGER = 'evolution_dagger',
  EVOLUTION_ORB = 'evolution_orb',
}

/**
 * Upgrade definition
 */
export interface Upgrade {
  type: UpgradeType;
  name: string;
  description: string;
  icon: string;
  color: number;
  isWeapon?: boolean;
  weaponType?: WeaponType;
  isEvolution?: boolean;
  apply: (player: Player, projectileManager: ProjectileManager, xpGemManager: XPGemManager, weaponManager?: WeaponManager) => void;
}

/**
 * Evolution requirements
 */
export interface EvolutionRequirement {
  weaponType: WeaponType;
  minWeaponLevel: number;
  minPlayerLevel: number;
}

/**
 * Base stat upgrades
 */
const STAT_UPGRADES: Upgrade[] = [
  {
    type: UpgradeType.MAX_HP,
    name: '+20 Max HP',
    description: 'Increase maximum health by 20',
    icon: '❤️',
    color: 0xff4444,
    apply: (player) => {
      player.increaseMaxHP(20);
    },
  },
  {
    type: UpgradeType.MOVE_SPEED,
    name: '+15% Speed',
    description: 'Move faster to dodge enemies',
    icon: '👟',
    color: 0x44ff44,
    apply: (player) => {
      player.increaseMoveSpeed(0.15);
    },
  },
  {
    type: UpgradeType.DAMAGE,
    name: '+25% Damage',
    description: 'Deal more damage to enemies',
    icon: '⚔️',
    color: 0xff6600,
    apply: (_player, projectileManager) => {
      const currentDamage = projectileManager.getDamage();
      projectileManager.setDamage(Math.floor(currentDamage * 1.25));
    },
  },
  {
    type: UpgradeType.FIRE_RATE,
    name: '+20% Fire Rate',
    description: 'Shoot projectiles faster',
    icon: '🔥',
    color: 0xffcc00,
    apply: (_player, projectileManager) => {
      const currentRate = projectileManager.getFireRate();
      projectileManager.setFireRate(Math.floor(currentRate * 0.8));
    },
  },
  {
    type: UpgradeType.PICKUP_RADIUS,
    name: '+50% Pickup Radius',
    description: 'Attract XP gems from further away',
    icon: '💎',
    color: 0x00ffff,
    apply: (_player, _projectileManager, xpGemManager) => {
      const currentRadius = xpGemManager.getAttractRadius();
      xpGemManager.setAttractRadius(Math.floor(currentRadius * 1.5));
    },
  },
  {
    type: UpgradeType.HP_REGEN,
    name: 'Heal 30% HP',
    description: 'Restore some health',
    icon: '💚',
    color: 0x44ff88,
    apply: (player) => {
      player.heal(Math.floor(player.maxHealth * 0.3));
    },
  },
];

/**
 * Weapon upgrades - unlock new weapons or upgrade existing ones
 */
const WEAPON_UPGRADES: Record<WeaponType, { unlock: Upgrade; upgrade: Upgrade }> = {
  [WeaponType.WAND]: {
    unlock: STAT_UPGRADES[2], // Placeholder, wand is always unlocked
    upgrade: STAT_UPGRADES[2],
  },
  [WeaponType.AXE]: {
    unlock: {
      type: UpgradeType.WEAPON_AXE,
      name: 'Throwing Axe',
      description: 'Throw axes that boomerang back',
      icon: '🪓',
      color: 0xaa6633,
      isWeapon: true,
      weaponType: WeaponType.AXE,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.unlockWeapon(WeaponType.AXE);
      },
    },
    upgrade: {
      type: UpgradeType.WEAPON_AXE,
      name: 'Axe +1',
      description: 'Increase axe damage and speed',
      icon: '🪓',
      color: 0xaa6633,
      isWeapon: true,
      weaponType: WeaponType.AXE,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.upgradeWeapon(WeaponType.AXE);
      },
    },
  },
  [WeaponType.DAGGER]: {
    unlock: {
      type: UpgradeType.WEAPON_DAGGER,
      name: 'Rear Dagger',
      description: 'Throw daggers behind you',
      icon: '🗡️',
      color: 0x88aacc,
      isWeapon: true,
      weaponType: WeaponType.DAGGER,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.unlockWeapon(WeaponType.DAGGER);
      },
    },
    upgrade: {
      type: UpgradeType.WEAPON_DAGGER,
      name: 'Dagger +1',
      description: 'Throw more daggers',
      icon: '🗡️',
      color: 0x88aacc,
      isWeapon: true,
      weaponType: WeaponType.DAGGER,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.upgradeWeapon(WeaponType.DAGGER);
      },
    },
  },
  [WeaponType.ORB]: {
    unlock: {
      type: UpgradeType.WEAPON_ORB,
      name: 'Orbiting Orb',
      description: 'Orb circles around you',
      icon: '🔮',
      color: 0x00ffff,
      isWeapon: true,
      weaponType: WeaponType.ORB,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.unlockWeapon(WeaponType.ORB);
      },
    },
    upgrade: {
      type: UpgradeType.WEAPON_ORB,
      name: 'Orb +1',
      description: 'Add another orbiting orb',
      icon: '🔮',
      color: 0x00ffff,
      isWeapon: true,
      weaponType: WeaponType.ORB,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.upgradeWeapon(WeaponType.ORB);
      },
    },
  },
};

/**
 * Weapon evolutions - powerful upgrades requiring max level weapons + player level
 */
const WEAPON_EVOLUTIONS: Record<string, { upgrade: Upgrade; requirement: EvolutionRequirement }> = {
  death_spiral: {
    upgrade: {
      type: UpgradeType.EVOLUTION_AXE,
      name: '🌀 Death Spiral',
      description: 'Axe creates a massive spinning vortex!',
      icon: '🌀',
      color: 0xff0000,
      isWeapon: true,
      isEvolution: true,
      weaponType: WeaponType.AXE,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.evolveWeapon(WeaponType.AXE);
      },
    },
    requirement: {
      weaponType: WeaponType.AXE,
      minWeaponLevel: 5,
      minPlayerLevel: 8,
    },
  },
  blade_storm: {
    upgrade: {
      type: UpgradeType.EVOLUTION_DAGGER,
      name: '⚔️ Blade Storm',
      description: 'Daggers fire in ALL directions!',
      icon: '⚔️',
      color: 0x4444ff,
      isWeapon: true,
      isEvolution: true,
      weaponType: WeaponType.DAGGER,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.evolveWeapon(WeaponType.DAGGER);
      },
    },
    requirement: {
      weaponType: WeaponType.DAGGER,
      minWeaponLevel: 5,
      minPlayerLevel: 8,
    },
  },
  nova_shield: {
    upgrade: {
      type: UpgradeType.EVOLUTION_ORB,
      name: '💠 Nova Shield',
      description: 'Orbs explode on contact for massive AOE!',
      icon: '💠',
      color: 0x00ffff,
      isWeapon: true,
      isEvolution: true,
      weaponType: WeaponType.ORB,
      apply: (_player, _pm, _xp, weaponManager) => {
        weaponManager?.evolveWeapon(WeaponType.ORB);
      },
    },
    requirement: {
      weaponType: WeaponType.ORB,
      minWeaponLevel: 3,
      minPlayerLevel: 6,
    },
  },
};

/**
 * All available upgrades (for backwards compatibility)
 */
export const UPGRADES: Upgrade[] = STAT_UPGRADES;

/**
 * UpgradeSystem - Manages upgrade selection and application
 */
export class UpgradeSystem {
  private player: Player;
  private projectileManager: ProjectileManager;
  private xpGemManager: XPGemManager;
  private weaponManager?: WeaponManager;

  constructor(player: Player, projectileManager: ProjectileManager, xpGemManager: XPGemManager, weaponManager?: WeaponManager) {
    this.player = player;
    this.projectileManager = projectileManager;
    this.xpGemManager = xpGemManager;
    this.weaponManager = weaponManager;
  }

  /**
   * Set weapon manager (can be set after construction)
   */
  public setWeaponManager(weaponManager: WeaponManager): void {
    this.weaponManager = weaponManager;
  }

  /**
   * Get random upgrades for selection
   * Includes stat upgrades and weapon unlocks/upgrades based on current state
   */
  public getRandomUpgrades(count: number = 3): Upgrade[] {
    const availableUpgrades: Upgrade[] = [...STAT_UPGRADES];

    // Add weapon upgrades based on what's unlocked
    if (this.weaponManager) {
      // Axe
      if (!this.weaponManager.hasWeapon(WeaponType.AXE)) {
        availableUpgrades.push(WEAPON_UPGRADES[WeaponType.AXE].unlock);
      } else if (this.weaponManager.getWeaponLevel(WeaponType.AXE) < 5) {
        availableUpgrades.push(WEAPON_UPGRADES[WeaponType.AXE].upgrade);
      }

      // Dagger
      if (!this.weaponManager.hasWeapon(WeaponType.DAGGER)) {
        availableUpgrades.push(WEAPON_UPGRADES[WeaponType.DAGGER].unlock);
      } else if (this.weaponManager.getWeaponLevel(WeaponType.DAGGER) < 5) {
        availableUpgrades.push(WEAPON_UPGRADES[WeaponType.DAGGER].upgrade);
      }

      // Orb
      if (!this.weaponManager.hasWeapon(WeaponType.ORB)) {
        availableUpgrades.push(WEAPON_UPGRADES[WeaponType.ORB].unlock);
      } else if (this.weaponManager.getWeaponLevel(WeaponType.ORB) < 3) {
        availableUpgrades.push(WEAPON_UPGRADES[WeaponType.ORB].upgrade);
      }

      // Check for evolutions
      const playerLevel = this.player.currentLevel;
      for (const evoKey of Object.keys(WEAPON_EVOLUTIONS)) {
        const evo = WEAPON_EVOLUTIONS[evoKey];
        const req = evo.requirement;
        
        // Check if requirements are met and weapon not already evolved
        if (
          this.weaponManager.hasWeapon(req.weaponType) &&
          this.weaponManager.getWeaponLevel(req.weaponType) >= req.minWeaponLevel &&
          playerLevel >= req.minPlayerLevel &&
          !this.weaponManager.isWeaponEvolved(req.weaponType)
        ) {
          availableUpgrades.push(evo.upgrade);
        }
      }
    }

    // Shuffle and pick
    const shuffled = availableUpgrades.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  /**
   * Apply an upgrade
   */
  public applyUpgrade(upgrade: Upgrade): void {
    upgrade.apply(this.player, this.projectileManager, this.xpGemManager, this.weaponManager);
  }
}
