import Phaser from 'phaser';
import { DEPTH, PROJECTILE_SPEED } from '../config/Constants';
import { Enemy } from '../entities/Enemy';
import { Player } from '../entities/Player';

/**
 * Weapon types available in the game
 */
export enum WeaponType {
  WAND = 'wand',       // Default: fires straight at nearest enemy
  AXE = 'axe',         // Thrown in arc, high damage, short range
  DAGGER = 'dagger',   // Thrown behind player for rear protection
  ORB = 'orb',         // Circles the player as defensive zone
}

/**
 * Weapon configuration
 */
export interface WeaponConfig {
  type: WeaponType;
  name: string;
  damage: number;
  cooldown: number;      // ms between shots
  projectileSpeed: number;
  projectileCount: number;
  piercing: boolean;     // Can hit multiple enemies?
  level: number;         // Weapon level (affects stats)
}

/**
 * Base weapon defaults
 */
const WEAPON_DEFAULTS: Record<WeaponType, Omit<WeaponConfig, 'level'>> = {
  [WeaponType.WAND]: {
    type: WeaponType.WAND,
    name: 'Magic Wand',
    damage: 10,
    cooldown: 300,
    projectileSpeed: PROJECTILE_SPEED,
    projectileCount: 1,
    piercing: false,
  },
  [WeaponType.AXE]: {
    type: WeaponType.AXE,
    name: 'Throwing Axe',
    damage: 25,
    cooldown: 800,
    projectileSpeed: 250,
    projectileCount: 1,
    piercing: true,
  },
  [WeaponType.DAGGER]: {
    type: WeaponType.DAGGER,
    name: 'Rear Dagger',
    damage: 15,
    cooldown: 400,
    projectileSpeed: 350,
    projectileCount: 1,
    piercing: false,
  },
  [WeaponType.ORB]: {
    type: WeaponType.ORB,
    name: 'Orbiting Orb',
    damage: 8,
    cooldown: 100, // Damage tick rate
    projectileSpeed: 0, // Orbits, doesn't travel
    projectileCount: 1,
    piercing: true,
  },
};

/**
 * Axe projectile that travels in an arc and returns
 */
class AxeProjectile extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 25;
  private lifespan: number = 0;
  private maxLifespan: number = 1500;
  private startX: number = 0;
  private startY: number = 0;
  private fireAngle: number = 0;
  private travelDistance: number = 0;
  private maxDistance: number = 200;
  private returning: boolean = false;
  private hitEnemies: Set<Enemy> = new Set();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile_2'); // Use second projectile sprite
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.PROJECTILES);
    this.setActive(false);
    this.setVisible(false);
    this.setScale(1.2);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setCircle(12);
      body.setOffset(this.width / 2 - 12, this.height / 2 - 12);
    }
  }

  public fire(x: number, y: number, dirX: number, dirY: number, damage: number): void {
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length === 0) return;
    
    this.startX = x;
    this.startY = y;
    this.fireAngle = Math.atan2(dirY, dirX);
    this.damage = damage;
    this.lifespan = 0;
    this.travelDistance = 0;
    this.returning = false;
    this.hitEnemies.clear();
    
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = true;
    
    const speed = 250;
    this.setVelocity(Math.cos(this.fireAngle) * speed, Math.sin(this.fireAngle) * speed);
  }

  public update(delta: number): void {
    if (!this.active) return;

    this.lifespan += delta;
    
    // Rotate the axe
    this.rotation += 0.3;
    
    // Calculate distance traveled
    this.travelDistance = Phaser.Math.Distance.Between(
      this.startX, this.startY, this.x, this.y
    );
    
    // Start returning after max distance
    if (!this.returning && this.travelDistance >= this.maxDistance) {
      this.returning = true;
      this.hitEnemies.clear(); // Can hit again on return
    }
    
    // Return to start position
    if (this.returning) {
      const angleToStart = Math.atan2(this.startY - this.y, this.startX - this.x);
      const speed = 300;
      this.setVelocity(Math.cos(angleToStart) * speed, Math.sin(angleToStart) * speed);
      
      // Deactivate when close to start
      const distToStart = Phaser.Math.Distance.Between(this.x, this.y, this.startX, this.startY);
      if (distToStart < 30) {
        this.deactivate();
      }
    }
    
    if (this.lifespan >= this.maxLifespan) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
  }

  public getDamage(): number {
    return this.damage;
  }

  public canHitEnemy(enemy: Enemy): boolean {
    if (this.hitEnemies.has(enemy)) return false;
    this.hitEnemies.add(enemy);
    return true;
  }
}

/**
 * Dagger projectile that fires behind the player
 */
class DaggerProjectile extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 15;
  private lifespan: number = 0;
  private maxLifespan: number = 800;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'projectile_3'); // Use third projectile sprite
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.PROJECTILES);
    this.setActive(false);
    this.setVisible(false);
    this.setScale(0.9);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setCircle(6);
      body.setOffset(this.width / 2 - 6, this.height / 2 - 6);
    }
  }

  public fire(x: number, y: number, dirX: number, dirY: number, damage: number): void {
    const length = Math.sqrt(dirX * dirX + dirY * dirY);
    if (length === 0) return;
    
    const normalX = dirX / length;
    const normalY = dirY / length;
    
    // Spawn slightly behind player
    const spawnX = x - normalX * 20;
    const spawnY = y - normalY * 20;
    
    this.setPosition(spawnX, spawnY);
    this.setActive(true);
    this.setVisible(true);
    this.damage = damage;
    this.lifespan = 0;
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = true;
    
    // Fire in opposite direction (behind)
    const speed = 350;
    this.setVelocity(-normalX * speed, -normalY * speed);
    this.setRotation(Math.atan2(-normalY, -normalX));
  }

  public update(delta: number): void {
    if (!this.active) return;
    this.lifespan += delta;
    if (this.lifespan >= this.maxLifespan) {
      this.deactivate();
    }
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.setVelocity(0, 0);
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
  }

  public getDamage(): number {
    return this.damage;
  }
}

/**
 * Orbiting orb that circles the player
 */
class OrbProjectile extends Phaser.Physics.Arcade.Sprite {
  private damage: number = 8;
  private orbitAngle: number = 0;
  private orbitRadius: number = 60;
  private orbitSpeed: number = 3;
  private playerRef?: Player;
  private damageCooldowns: Map<Enemy, number> = new Map();

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'effect_1'); // Use effect sprite for orb
    
    scene.add.existing(this);
    scene.physics.add.existing(this);
    
    this.setDepth(DEPTH.PROJECTILES);
    this.setActive(false);
    this.setVisible(false);
    this.setScale(0.6);
    this.setTint(0x00ffff); // Cyan color
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.enable = false;
      body.setCircle(10);
      body.setOffset(this.width / 2 - 10, this.height / 2 - 10);
    }
  }

  public activate(player: Player, startAngle: number, damage: number): void {
    this.playerRef = player;
    this.orbitAngle = startAngle;
    this.damage = damage;
    this.damageCooldowns.clear();
    
    this.setActive(true);
    this.setVisible(true);
    
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = true;
    
    this.updatePosition();
  }

  public update(delta: number): void {
    if (!this.active || !this.playerRef) return;
    
    // Update orbit angle
    this.orbitAngle += this.orbitSpeed * (delta / 1000) * Math.PI * 2;
    this.updatePosition();
    
    // Pulse effect
    const pulse = 0.5 + Math.sin(this.orbitAngle * 2) * 0.1;
    this.setScale(pulse);
    
    // Update damage cooldowns
    for (const [enemy, cooldown] of this.damageCooldowns) {
      if (cooldown <= delta) {
        this.damageCooldowns.delete(enemy);
      } else {
        this.damageCooldowns.set(enemy, cooldown - delta);
      }
    }
  }

  private updatePosition(): void {
    if (!this.playerRef) return;
    
    const x = this.playerRef.x + Math.cos(this.orbitAngle) * this.orbitRadius;
    const y = this.playerRef.y + Math.sin(this.orbitAngle) * this.orbitRadius;
    this.setPosition(x, y);
  }

  public deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this.playerRef = undefined;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) body.enable = false;
  }

  public getDamage(): number {
    return this.damage;
  }

  public canDamageEnemy(enemy: Enemy): boolean {
    if (this.damageCooldowns.has(enemy)) return false;
    this.damageCooldowns.set(enemy, 500); // 500ms cooldown per enemy
    return true;
  }

  public setOrbitRadius(radius: number): void {
    this.orbitRadius = radius;
  }

  public setOrbitSpeed(speed: number): void {
    this.orbitSpeed = speed;
  }
}

/**
 * WeaponManager - Manages all player weapons
 */
export class WeaponManager {
  private scene: Phaser.Scene;
  private player: Player;
  private enemyGroup?: Phaser.GameObjects.Group;
  
  // Weapon pools
  private axes: Phaser.GameObjects.Group;
  private daggers: Phaser.GameObjects.Group;
  private orbs: Phaser.GameObjects.Group;
  
  // Weapon configs
  private axeConfig: WeaponConfig;
  private daggerConfig: WeaponConfig;
  private orbConfig: WeaponConfig;
  
  // Active weapons
  private hasAxe: boolean = false;
  private hasDagger: boolean = false;
  private hasOrb: boolean = false;
  
  // Evolved weapons
  private axeEvolved: boolean = false;
  private daggerEvolved: boolean = false;
  private orbEvolved: boolean = false;
  
  // Timers
  private axeTimer: number = 0;
  private daggerTimer: number = 0;
  
  // Attack check callback
  private canAttackCallback?: () => boolean;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    
    // Initialize weapon configs
    this.axeConfig = { ...WEAPON_DEFAULTS[WeaponType.AXE], level: 1 };
    this.daggerConfig = { ...WEAPON_DEFAULTS[WeaponType.DAGGER], level: 1 };
    this.orbConfig = { ...WEAPON_DEFAULTS[WeaponType.ORB], level: 1 };
    
    // Create weapon pools
    this.axes = scene.add.group({ classType: AxeProjectile, runChildUpdate: false });
    this.daggers = scene.add.group({ classType: DaggerProjectile, runChildUpdate: false });
    this.orbs = scene.add.group({ classType: OrbProjectile, runChildUpdate: false });
    
    // Pre-create projectiles
    for (let i = 0; i < 5; i++) {
      this.axes.add(new AxeProjectile(scene, 0, 0));
      this.daggers.add(new DaggerProjectile(scene, 0, 0));
    }
    for (let i = 0; i < 3; i++) {
      this.orbs.add(new OrbProjectile(scene, 0, 0));
    }
  }

  public setEnemyGroup(group: Phaser.GameObjects.Group): void {
    this.enemyGroup = group;
  }

  /**
   * Unlock a weapon
   */
  public unlockWeapon(type: WeaponType): void {
    switch (type) {
      case WeaponType.AXE:
        if (!this.hasAxe) {
          this.hasAxe = true;
          this.showWeaponUnlockNotification('Throwing Axe');
        }
        break;
      case WeaponType.DAGGER:
        if (!this.hasDagger) {
          this.hasDagger = true;
          this.showWeaponUnlockNotification('Rear Dagger');
        }
        break;
      case WeaponType.ORB:
        if (!this.hasOrb) {
          this.hasOrb = true;
          this.activateOrbs();
          this.showWeaponUnlockNotification('Orbiting Orb');
        }
        break;
    }
  }

  /**
   * Upgrade a weapon
   */
  public upgradeWeapon(type: WeaponType): void {
    switch (type) {
      case WeaponType.AXE:
        this.axeConfig.level++;
        this.axeConfig.damage = Math.floor(this.axeConfig.damage * 1.2);
        this.axeConfig.cooldown = Math.max(400, this.axeConfig.cooldown - 50);
        break;
      case WeaponType.DAGGER:
        this.daggerConfig.level++;
        this.daggerConfig.damage = Math.floor(this.daggerConfig.damage * 1.2);
        this.daggerConfig.projectileCount = Math.min(3, this.daggerConfig.projectileCount + 1);
        break;
      case WeaponType.ORB:
        this.orbConfig.level++;
        this.orbConfig.damage = Math.floor(this.orbConfig.damage * 1.15);
        // Add more orbs on upgrade
        if (this.orbConfig.level <= 3) {
          this.activateOrbs();
        }
        break;
    }
  }

  private showWeaponUnlockNotification(weaponName: string): void {
    const centerX = this.scene.cameras.main.width / 2;
    const notification = this.scene.add.text(
      centerX,
      100,
      `🗡️ NEW WEAPON: ${weaponName} 🗡️`,
      {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 4,
      }
    )
      .setOrigin(0.5)
      .setDepth(DEPTH.UI + 5)
      .setScrollFactor(0);

    this.scene.tweens.add({
      targets: notification,
      y: 80,
      alpha: { from: 1, to: 0 },
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notification.destroy()
    });
  }

  private activateOrbs(): void {
    // Count active orbs
    let activeOrbs = 0;
    this.orbs.getChildren().forEach(obj => {
      if ((obj as OrbProjectile).active) activeOrbs++;
    });
    
    // Add one more orb
    const orb = this.orbs.getFirstDead(false) as OrbProjectile | null;
    if (orb) {
      const angle = activeOrbs * (Math.PI * 2 / 3); // Evenly space orbs
      orb.activate(this.player, angle, this.orbConfig.damage);
    }
  }

  /**
   * Find nearest enemy for auto-aim
   */
  private findNearestEnemy(): Enemy | null {
    if (!this.enemyGroup) return null;

    let nearestEnemy: Enemy | null = null;
    let nearestDistance = 300; // Attack range

    this.enemyGroup.getChildren().forEach((obj) => {
      const enemy = obj as Enemy;
      if (!enemy.active || !enemy.alive) return;

      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        enemy.x, enemy.y
      );

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestEnemy = enemy;
      }
    });

    return nearestEnemy;
  }

  /**
   * Get player's last movement direction for dagger
   */
  private getPlayerFacingDirection(): { x: number; y: number } {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body && (body.velocity.x !== 0 || body.velocity.y !== 0)) {
      const len = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
      return { x: body.velocity.x / len, y: body.velocity.y / len };
    }
    // Default: facing down
    return { x: 0, y: 1 };
  }

  public update(delta: number): void {
    // Update all active projectiles
    this.axes.getChildren().forEach(obj => (obj as AxeProjectile).update(delta));
    this.daggers.getChildren().forEach(obj => (obj as DaggerProjectile).update(delta));
    this.orbs.getChildren().forEach(obj => (obj as OrbProjectile).update(delta));

    // Check if attacking is allowed (not in safe zone)
    const canAttack = this.canAttackCallback ? this.canAttackCallback() : true;
    if (!canAttack) return;

    const nearestEnemy = this.findNearestEnemy();

    // Fire axe at nearest enemy
    if (this.hasAxe && nearestEnemy) {
      this.axeTimer += delta;
      if (this.axeTimer >= this.axeConfig.cooldown) {
        this.fireAxe(nearestEnemy);
        this.axeTimer = 0;
      }
    }

    // Fire dagger behind player
    if (this.hasDagger) {
      this.daggerTimer += delta;
      if (this.daggerTimer >= this.daggerConfig.cooldown) {
        this.fireDagger();
        this.daggerTimer = 0;
      }
    }
  }

  /**
   * Set callback to check if player can attack
   */
  public setCanAttackCallback(callback: () => boolean): void {
    this.canAttackCallback = callback;
  }

  private fireAxe(target: Enemy): void {
    const axe = this.axes.getFirstDead(false) as AxeProjectile | null;
    if (axe) {
      const dirX = target.x - this.player.x;
      const dirY = target.y - this.player.y;
      axe.fire(this.player.x, this.player.y, dirX, dirY, this.axeConfig.damage);
    }
  }

  private fireDagger(): void {
    const facing = this.getPlayerFacingDirection();
    
    for (let i = 0; i < this.daggerConfig.projectileCount; i++) {
      const dagger = this.daggers.getFirstDead(false) as DaggerProjectile | null;
      if (dagger) {
        // Spread daggers slightly
        const spreadAngle = (i - (this.daggerConfig.projectileCount - 1) / 2) * 0.3;
        const cos = Math.cos(spreadAngle);
        const sin = Math.sin(spreadAngle);
        const dirX = facing.x * cos - facing.y * sin;
        const dirY = facing.x * sin + facing.y * cos;
        
        dagger.fire(this.player.x, this.player.y, dirX, dirY, this.daggerConfig.damage);
      }
    }
  }

  // Getters for collision groups
  public getAxes(): Phaser.GameObjects.Group {
    return this.axes;
  }

  public getDaggers(): Phaser.GameObjects.Group {
    return this.daggers;
  }

  public getOrbs(): Phaser.GameObjects.Group {
    return this.orbs;
  }

  // Check if weapons are unlocked
  public hasWeapon(type: WeaponType): boolean {
    switch (type) {
      case WeaponType.AXE: return this.hasAxe;
      case WeaponType.DAGGER: return this.hasDagger;
      case WeaponType.ORB: return this.hasOrb;
      default: return false;
    }
  }

  public getWeaponLevel(type: WeaponType): number {
    switch (type) {
      case WeaponType.AXE: return this.axeConfig.level;
      case WeaponType.DAGGER: return this.daggerConfig.level;
      case WeaponType.ORB: return this.orbConfig.level;
      default: return 0;
    }
  }

  /**
   * Get all active weapons with their configs for menu display
   */
  public getActiveWeapons(): { type: WeaponType; name: string; level: number; damage: number }[] {
    const weapons: { type: WeaponType; name: string; level: number; damage: number }[] = [];
    
    if (this.hasAxe) {
      weapons.push({
        type: WeaponType.AXE,
        name: 'Throwing Axe',
        level: this.axeConfig.level,
        damage: this.axeConfig.damage,
      });
    }
    if (this.hasDagger) {
      weapons.push({
        type: WeaponType.DAGGER,
        name: 'Rear Dagger',
        level: this.daggerConfig.level,
        damage: this.daggerConfig.damage,
      });
    }
    if (this.hasOrb) {
      weapons.push({
        type: WeaponType.ORB,
        name: 'Orbiting Orb',
        level: this.orbConfig.level,
        damage: this.orbConfig.damage,
      });
    }
    
    return weapons;
  }

  /**
   * Get weapon config for evolution checking
   */
  public getWeaponConfig(type: WeaponType): WeaponConfig | null {
    switch (type) {
      case WeaponType.AXE: return this.hasAxe ? this.axeConfig : null;
      case WeaponType.DAGGER: return this.hasDagger ? this.daggerConfig : null;
      case WeaponType.ORB: return this.hasOrb ? this.orbConfig : null;
      default: return null;
    }
  }

  /**
   * Check if a weapon has been evolved
   */
  public isWeaponEvolved(type: WeaponType): boolean {
    switch (type) {
      case WeaponType.AXE: return this.axeEvolved;
      case WeaponType.DAGGER: return this.daggerEvolved;
      case WeaponType.ORB: return this.orbEvolved;
      default: return false;
    }
  }

  /**
   * Evolve a weapon to its ultimate form
   */
  public evolveWeapon(type: WeaponType): void {
    switch (type) {
      case WeaponType.AXE:
        if (!this.axeEvolved && this.hasAxe) {
          this.axeEvolved = true;
          this.axeConfig.damage *= 3;
          this.axeConfig.cooldown = 300;
          this.showEvolutionNotification('🌀 Death Spiral', 'Axe creates devastating vortex!');
        }
        break;
      case WeaponType.DAGGER:
        if (!this.daggerEvolved && this.hasDagger) {
          this.daggerEvolved = true;
          this.daggerConfig.damage *= 2;
          this.daggerConfig.projectileCount = 8; // Fire in all directions
          this.daggerConfig.cooldown = 200;
          this.showEvolutionNotification('⚔️ Blade Storm', 'Daggers fire everywhere!');
        }
        break;
      case WeaponType.ORB:
        if (!this.orbEvolved && this.hasOrb) {
          this.orbEvolved = true;
          this.orbConfig.damage *= 4;
          // Add more orbs for evolved state
          this.activateOrbs();
          this.activateOrbs();
          this.showEvolutionNotification('💠 Nova Shield', 'Orbs deal massive damage!');
        }
        break;
    }
  }

  private showEvolutionNotification(name: string, desc: string): void {
    const centerX = this.scene.cameras.main.width / 2;
    
    // Create a more dramatic notification for evolutions
    const bg = this.scene.add.rectangle(
      centerX,
      120,
      400,
      80,
      0x4400aa,
      0.95
    )
      .setStrokeStyle(3, 0xffaa00)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 10);

    const titleText = this.scene.add.text(
      centerX,
      100,
      `✨ EVOLUTION! ✨`,
      {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#ffff00',
        stroke: '#000000',
        strokeThickness: 3,
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 11);

    const nameText = this.scene.add.text(
      centerX,
      122,
      name,
      {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 11);

    const descText = this.scene.add.text(
      centerX,
      145,
      desc,
      {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#aaaaff',
      }
    )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.UI + 11);

    // Screen shake for evolution
    this.scene.cameras.main.shake(300, 0.015);

    // Animate and fade
    this.scene.tweens.add({
      targets: [bg, titleText, nameText, descText],
      alpha: { from: 1, to: 0 },
      y: '-=30',
      duration: 3000,
      delay: 1500,
      ease: 'Power2',
      onComplete: () => {
        bg.destroy();
        titleText.destroy();
        nameText.destroy();
        descText.destroy();
      }
    });
  }
}
