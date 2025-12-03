# Game Loop Design

## Overview
The game follows a standard "Run-based" Roguelike loop. Each run is independent.

## Flow
1.  **Main Menu**
    -   Title Screen.
    -   "Start Run" button.
    -   "Options" (Volume, Controls).

2.  **Preparation (Hidden)**
    -   Generate Dungeon Level (Layout, Spawn Points, Exit Portal).
    -   Initialize Player Stats (Level 1, Basic Weapon).

3.  **Gameplay Phase (The Run)**
    -   **State**: Active.
    -   **Player Action**:
        -   Move (WASD) to avoid enemies and navigate the map.
        -   Aim (Mouse) to direct fire (or Auto-aim nearest).
    -   **System Action**:
        -   Spawn Enemies continuously or in waves.
        -   Update Enemy AI (Pathfinding towards player).
        -   Handle Collisions (Projectiles <-> Enemies, Enemies <-> Player).
    -   **Progression**:
        -   Enemies drop XP Gems.
        -   Player collects Gems -> XP Bar fills.
        -   **Level Up Event**:
            -   Game Pauses.
            -   Show 3 Random Upgrades (e.g., "Attack Speed +10%", "New Weapon: Axe", "Movement Speed +5%").
            -   Player selects one -> Game Resumes.

4.  **Objective**
    -   Survive for a set time OR Find and Activate the Portal.
    -   **Portal Mechanic**:
        -   Portal is located randomly in the dungeon.
        -   Requires a "Key" or "Kill Count" to open?
        -   *Decision*: **Survival Timer**. Survive 5 minutes to open the Portal. Once open, reach it to "Win" (or go to next level/infinite mode).

5.  **Game Over**
    -   **Condition**: Player HP <= 0.
    -   **Screen**: "You Died". Stats (Enemies Killed, Time Survived, Level Reached).
    -   **Action**: "Restart" or "Menu".

6.  **Victory**
    -   **Condition**: Enter Portal.
    -   **Screen**: "Stage Cleared".
    -   **Action**: "Next Stage" (increases difficulty) or "Main Menu".
