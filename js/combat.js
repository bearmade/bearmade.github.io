/**
 * Roguelike HTML5 - Combat System
 */

const ATTACK_VERBS = [
    "strike", "hit", "slash", "cut", "pierce", "stab", "bash", "smash",
    "crush", "slam", "pummel", "clobber", "thwack", "whack", "batter",
    "lunge at", "swing at", "thrust at", "charge", "assault", "maul",
    "tear into", "rend", "gouge", "impale", "cleave", "hack", "sunder",
];

const CRIT_VERBS = [
    "devastate", "annihilate", "obliterate", "decimate", "ravage",
    "massacre", "eviscerate", "dismember", "cripple", "demolish",
    "shatter", "destroy", "wreck", "lay waste to",
];

const HIT_DESCRIPTORS = [
    "solidly", "hard", "squarely", "viciously", "brutally", "savagely",
    "ferociously", "mercilessly", "relentlessly", "fiercely", "wildly",
    "with precision", "expertly", "skillfully", "deftly", "cleanly",
];

const MISS_MESSAGES = [
    "swings wildly and misses",
    "lunges but {defender} dodges",
    "strikes at empty air",
    "misses by a hair",
    "can't connect",
    "is too slow",
    "stumbles and misses",
    "overextends and misses",
    "attacks but {defender} evades",
    "can't find an opening",
    "swings too high",
    "swings too low",
];

function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function combat(attacker, defender) {
    const baseDamage = attacker.getTotalAttack();
    const defense = defender.getTotalDefense();
    
    // Damage variance
    const variance = Math.floor(Math.random() * 4) - 1; // -1 to 2
    let damage = Math.max(1, baseDamage + variance - defense);
    
    // Critical hit chance (based on dexterity)
    const critChance = 0.05 + (attacker.dexterity - 10) * 0.01;
    const isCrit = Math.random() < critChance;
    
    if (isCrit) {
        damage = Math.floor(damage * 1.5);
    }
    
    defender.takeDamage(damage);
    
    // Generate message
    const msg = generateAttackMessage(attacker, defender, damage, isCrit, defender.dead);
    return [msg, defender.dead];
}

function generateAttackMessage(attacker, defender, damage, isCrit, killed) {
    if (isCrit) {
        const verb = CRIT_VERBS[Math.floor(Math.random() * CRIT_VERBS.length)];
        if (killed) {
            return `${attacker.name} ${verb}s ${defender.name} for ${damage} damage, killing them instantly!`;
        }
        return `${attacker.name} ${verb}s ${defender.name} for ${damage} CRITICAL damage!`;
    }
    
    const verb = ATTACK_VERBS[Math.floor(Math.random() * ATTACK_VERBS.length)];
    const desc = HIT_DESCRIPTORS[Math.floor(Math.random() * HIT_DESCRIPTORS.length)];
    
    if (killed) {
        const endings = [
            "killing them!",
            "dealing a death blow!",
            `slaying ${defender.name}!`,
            "finishing them off!",
            `ending ${defender.name}!`,
        ];
        return `${attacker.name} ${verb}s ${defender.name} ${desc} for ${damage} damage, ${endings[Math.floor(Math.random() * endings.length)]}`;
    }
    
    // Add flavor for high damage
    if (damage >= 8) {
        return `${attacker.name} ${verb}s ${defender.name} ${desc} for ${damage} massive damage!`;
    } else if (damage >= 5) {
        return `${attacker.name} ${verb}s ${defender.name} ${desc} for ${damage} damage!`;
    } else {
        return `${attacker.name} ${verb}s ${defender.name} for ${damage} damage.`;
    }
}

function generateMissMessage(attacker, defender) {
    const msg = MISS_MESSAGES[Math.floor(Math.random() * MISS_MESSAGES.length)];
    return `${attacker.name} ${msg.replace('{defender}', defender.name)}!`;
}

function getEntityAt(x, y) {
    for (const entity of game.entities) {
        if (entity.x === x && entity.y === y && !entity.dead) {
            return entity;
        }
    }
    return null;
}

function getItemAt(x, y) {
    for (const item of game.items) {
        if (item.x === x && item.y === y) {
            return item;
        }
    }
    return null;
}

function runMonsterAI() {
    const player = game.player;
    
    for (const entity of game.entities) {
        if (entity === player || entity.dead) continue;
        
        const dist = distance(entity.x, entity.y, player.x, player.y);
        
        // Attack if adjacent
        if (dist < 1.5) {
            const [msg, killed] = combat(entity, player);
            addMessage(msg);
        } 
        // Move toward player if in range
        else if (dist < 8 && game.visible[entity.y][entity.x]) {
            // Simple pathfinding - try to move toward player
            let moved = false;
            
            // Try horizontal first
            if (entity.x < player.x) {
                if (!game.gameMap[entity.y][entity.x + 1].blocked && !getEntityAt(entity.x + 1, entity.y)) {
                    entity.x++;
                    moved = true;
                }
            } else if (entity.x > player.x) {
                if (!game.gameMap[entity.y][entity.x - 1].blocked && !getEntityAt(entity.x - 1, entity.y)) {
                    entity.x--;
                    moved = true;
                }
            }
            
            // Then vertical
            if (!moved) {
                if (entity.y < player.y) {
                    if (!game.gameMap[entity.y + 1][entity.x].blocked && !getEntityAt(entity.x, entity.y + 1)) {
                        entity.y++;
                        moved = true;
                    }
                } else if (entity.y > player.y) {
                    if (!game.gameMap[entity.y - 1][entity.x].blocked && !getEntityAt(entity.x, entity.y - 1)) {
                        entity.y--;
                        moved = true;
                    }
                }
            }
        }
    }
}

function computeFOV() {
    // Initialize visibility grid
    game.visible = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            row.push(false);
        }
        game.visible.push(row);
    }
    
    const player = game.player;
    const radius = FOV_RADIUS;
    
    // Simple circular FOV
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const dist = distance(x, y, player.x, player.y);
            if (dist <= radius) {
                game.visible[y][x] = true;
                game.gameMap[y][x].explored = true;
            }
        }
    }
}
