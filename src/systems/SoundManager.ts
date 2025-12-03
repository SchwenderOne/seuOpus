import Phaser from 'phaser';

/**
 * Sound effect types used in the game
 */
export enum SoundEffect {
  WEAPON_FIRE = 'weapon_fire',
  WEAPON_AXE = 'weapon_axe',
  WEAPON_DAGGER = 'weapon_dagger',
  WEAPON_ORB = 'weapon_orb',
  ENEMY_HIT = 'enemy_hit',
  ENEMY_DEATH = 'enemy_death',
  PLAYER_HIT = 'player_hit',
  PLAYER_DEATH = 'player_death',
  LEVEL_UP = 'level_up',
  XP_PICKUP = 'xp_pickup',
  BOSS_SPAWN = 'boss_spawn',
  BOSS_DEATH = 'boss_death',
  EVOLUTION = 'evolution',
  PORTAL_SPAWN = 'portal_spawn',
  UI_CLICK = 'ui_click',
  UI_HOVER = 'ui_hover',
}

/**
 * SoundManager - Centralized audio management with volume control
 * Uses Web Audio API for procedural placeholder sounds until real audio assets are added
 */
export class SoundManager {
  private masterVolume: number = 0.5;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.5;
  private muted: boolean = false;
  
  // Sound cooldowns to prevent audio spam
  private soundCooldowns: Map<SoundEffect, number> = new Map();
  private cooldownDuration: number = 50; // ms between same sound
  
  // Audio context for procedural sounds
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  constructor(_scene: Phaser.Scene) {
    this.initAudioContext();
  }

  /**
   * Initialize Web Audio API context for procedural sounds
   */
  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.updateGain();
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }

  /**
   * Update master gain based on volume settings
   */
  private updateGain(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this.muted ? 0 : this.masterVolume * this.sfxVolume;
    }
  }

  /**
   * Play a sound effect
   */
  play(effect: SoundEffect, options?: { volume?: number; rate?: number }): void {
    if (this.muted || !this.audioContext || !this.gainNode) return;
    
    // Check cooldown
    const now = Date.now();
    const lastPlayed = this.soundCooldowns.get(effect) || 0;
    if (now - lastPlayed < this.cooldownDuration) return;
    this.soundCooldowns.set(effect, now);

    // Resume audio context if suspended (browser autoplay policy)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const volume = (options?.volume ?? 1) * this.masterVolume * this.sfxVolume;
    const rate = options?.rate ?? 1;

    // Generate procedural sound based on effect type
    this.playProceduralSound(effect, volume, rate);
  }

  /**
   * Generate procedural placeholder sounds using Web Audio API
   */
  private playProceduralSound(effect: SoundEffect, volume: number, rate: number): void {
    if (!this.audioContext || !this.gainNode) return;

    const ctx = this.audioContext;
    const now = ctx.currentTime;

    // Create a gain node for this specific sound
    const soundGain = ctx.createGain();
    soundGain.connect(this.gainNode);
    soundGain.gain.value = volume;

    switch (effect) {
      case SoundEffect.WEAPON_FIRE:
        this.createShootSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.WEAPON_AXE:
        this.createWhooshSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.WEAPON_DAGGER:
        this.createSharpSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.WEAPON_ORB:
        this.createHumSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.ENEMY_HIT:
        this.createHitSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.ENEMY_DEATH:
        this.createDeathSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.PLAYER_HIT:
        this.createPlayerHitSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.PLAYER_DEATH:
        this.createPlayerDeathSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.LEVEL_UP:
        this.createLevelUpSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.XP_PICKUP:
        this.createPickupSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.BOSS_SPAWN:
        this.createBossSpawnSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.BOSS_DEATH:
        this.createBossDeathSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.EVOLUTION:
        this.createEvolutionSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.PORTAL_SPAWN:
        this.createPortalSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.UI_CLICK:
        this.createClickSound(ctx, soundGain, now, rate);
        break;
      case SoundEffect.UI_HOVER:
        this.createHoverSound(ctx, soundGain, now, rate);
        break;
    }
  }

  // === Procedural Sound Generators ===

  private createShootSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  private createWhooshSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Noise-based whoosh for axe
    const bufferSize = ctx.sampleRate * 0.2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.sin(t * Math.PI) * 0.5;
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.playbackRate.value = rate;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 600;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
  }

  private createSharpSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.05);
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  private createHumSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150 * rate, now);
    
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 8;
    
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 20;
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.15);
    lfo.stop(now + 0.15);
  }

  private createHitSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(300 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
    
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  private createDeathSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  private createPlayerHitSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Lower, more impactful hit
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.15);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  private createPlayerDeathSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Dramatic descending tone
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.8);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.8);
  }

  private createLevelUpSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Ascending arpeggio
    const notes = [440, 554, 659, 880];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * rate;
      
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, now + i * 0.08);
      noteGain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
      
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }

  private createPickupSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Quick ascending blip
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.06);
    
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  private createBossSpawnSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Deep, ominous warning
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80 * rate, now);
    
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 4;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 10;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
    
    osc.connect(gain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 1.0);
    lfo.stop(now + 1.0);
  }

  private createBossDeathSound(ctx: AudioContext, gain: GainNode, now: number, _rate: number): void {
    // Explosive death
    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      const t = i / bufferSize;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, 2);
    }
    
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.5);
    
    gain.gain.setValueAtTime(0.5, now);
    
    noise.connect(filter);
    filter.connect(gain);
    noise.start(now);
  }

  private createEvolutionSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Dramatic ascending chord
    const notes = [261, 329, 392, 523, 659, 784];
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq * rate;
      
      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, now);
      noteGain.gain.linearRampToValueAtTime(0.15, now + 0.1);
      noteGain.gain.setValueAtTime(0.15, now + 0.5);
      noteGain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
      
      osc.connect(noteGain);
      noteGain.connect(gain);
      osc.start(now);
      osc.stop(now + 1.0);
    });
  }

  private createPortalSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    // Mystical ascending tone
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 * rate, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.5);
    
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 50;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    osc.connect(gain);
    osc.start(now);
    lfo.start(now);
    osc.stop(now + 0.5);
    lfo.stop(now + 0.5);
  }

  private createClickSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1000 * rate;
    
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.03);
  }

  private createHoverSound(ctx: AudioContext, gain: GainNode, now: number, rate: number): void {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 600 * rate;
    
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.02);
    
    osc.connect(gain);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  // === Volume Controls ===

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateGain();
  }

  setSFXVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateGain();
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  getSFXVolume(): number {
    return this.sfxVolume;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    this.updateGain();
    return this.muted;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.updateGain();
  }

  isMuted(): boolean {
    return this.muted;
  }

  /**
   * Clean up audio resources
   */
  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.soundCooldowns.clear();
  }
}
