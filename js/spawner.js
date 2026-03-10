/**
 * Roguelike HTML5 - Entity and Item Spawning
 */

// Procedural generation data
const WEAPON_PREFIXES = [
    ["Rusty", -1, 0.15], ["Worn", -1, 0.15], ["Crude", -1, 0.12],
    ["Sharp", 1, 0.12], ["Fine", 1, 0.10], ["Balanced", 1, 0.08],
    ["Keen", 2, 0.08], ["Hardened", 2, 0.06], ["Superior", 2, 0.05],
    ["Masterwork", 3, 0.04], ["Legendary", 4, 0.02], ["Mythic", 5, 0.01],
];

const ARMOR_PREFIXES = [
    ["Ragged", -1, 0.15], ["Tattered", -1, 0.15], ["Worn", -1, 0.12],
    ["Sturdy", 1, 0.12], ["Reinforced", 1, 0.10], ["Laminated", 1, 0.08],
    ["Tempered", 2, 0.08], ["Plated", 2, 0.06], ["Superior", 2, 0.05],
    ["Masterwork", 3, 0.04], ["Legendary", 4, 0.02], ["Mythic", 5, 0.01],
];

const WEAPON_TYPES = [
    ["Dagger", 1, 3], ["Shortsword", 2, 4], ["Longsword", 3, 5],
    ["Broadsword", 4, 6], ["Greatsword", 5, 7], ["Claymore", 6, 8],
    ["Rapier", 2, 4], ["Scimitar", 3, 5], ["Katana", 4, 6],
    ["Hand Axe", 2, 4], ["Battle Axe", 4, 6], ["Greataxe", 5, 7],
    ["Hatchet", 1, 3], ["War Axe", 3, 5], ["Double Axe", 5, 7],
    ["Mace", 2, 4], ["Morning Star", 3, 5], ["Flail", 3, 5],
    ["War Hammer", 4, 6], ["Maul", 5, 7], ["Club", 1, 3],
    ["Spear", 2, 4], ["Halberd", 4, 6], ["Glaive", 4, 6],
    ["Whip", 1, 3], ["Scourge", 2, 4], ["Trident", 3, 5],
];

const ARMOR_TYPES = [
    ["Cloth", 0, 2], ["Padded", 1, 3], ["Leather", 1, 4],
    ["Studded Leather", 2, 5], ["Hide", 1, 4], ["Scale", 2, 5],
    ["Chain Shirt", 2, 5], ["Chain Mail", 3, 6], ["Splint", 3, 6],
    ["Breastplate", 4, 7], ["Half Plate", 4, 7], ["Full Plate", 5, 8],
    ["Ring Mail", 2, 5], ["Banded", 3, 6], ["Lamellar", 3, 6],
];

const ENEMY_BASE_TYPES = [
    // [name, char, color, baseHp, baseAtk, baseDef, baseXp, minDepth]
    ["Goblin", "g", "GREEN", 6, 2, 0, 8, 1],
    ["Orc", "o", "RED", 10, 3, 1, 15, 1],
    ["Kobold", "k", "MAGENTA", 5, 2, 0, 6, 1],
    ["Skeleton", "S", "WHITE", 8, 3, 0, 10, 1],
    ["Rat", "r", "YELLOW", 4, 2, 0, 4, 1],
    ["Bat", "b", "BLACK", 3, 2, 0, 3, 1],
    ["Spider", "s", "GREEN", 5, 3, 0, 6, 1],
    ["Slime", "j", "CYAN", 8, 1, 0, 5, 1],
    ["Zombie", "Z", "WHITE", 12, 2, 1, 12, 2],
    ["Ghoul", "z", "WHITE", 14, 3, 1, 18, 2],
    ["Wolf", "w", "YELLOW", 8, 3, 0, 10, 2],
    ["Hobgoblin", "h", "GREEN", 12, 3, 1, 14, 2],
    ["Troll", "T", "YELLOW", 16, 4, 2, 25, 3],
    ["Wraith", "W", "WHITE", 14, 4, 1, 30, 3],
    ["Wisp", "v", "CYAN", 6, 2, 2, 15, 3],
    ["Ogre", "O", "RED", 20, 5, 3, 35, 4],
    ["Mimic", "X", "YELLOW", 15, 4, 2, 30, 4],
    ["Beast", "B", "RED", 18, 4, 2, 28, 4],
    ["Horror", "H", "MAGENTA", 20, 4, 2, 35, 5],
    ["Demon", "D", "RED", 25, 5, 3, 50, 6],
    ["Dragon", "d", "RED", 40, 6, 4, 100, 8],
    ["Titan", "t", "YELLOW", 50, 5, 5, 120, 10],
];

const ENEMY_ADJECTIVES = [
    ["Weak", 0.8, 0.9, 0.7, 0.12], ["Frail", 0.7, 0.8, 0.6, 0.10],
    ["Sickly", 0.7, 0.9, 0.7, 0.08], ["Young", 0.9, 1.0, 0.8, 0.10],
    ["Feral", 1.1, 1.1, 0.9, 0.12], ["Vicious", 1.2, 1.3, 1.0, 0.10],
    ["Savage", 1.3, 1.2, 1.0, 0.08], ["Fierce", 1.2, 1.2, 1.1, 0.08],
    ["Bloodthirsty", 1.3, 1.3, 1.2, 0.06], ["Rabid", 1.1, 1.4, 0.8, 0.06],
    ["Plague", 1.0, 1.1, 1.2, 0.06], ["Corrupted", 1.2, 1.1, 1.3, 0.06],
    ["Shadow", 1.1, 1.2, 1.2, 0.05], ["Dark", 1.2, 1.2, 1.3, 0.05],
    ["Elite", 1.5, 1.4, 1.5, 0.04], ["Champion", 1.6, 1.5, 1.6, 0.03],
    ["Ancient", 1.4, 1.3, 1.4, 0.04], ["Elder", 1.5, 1.4, 1.5, 0.03],
];

// Place entities and items in dungeon
function placeEntities(rooms, depth) {
    const numMonsters = Math.floor(Math.random() * 3) + Math.min(depth + 2, 8);
    
    for (let i = 0; i < numMonsters; i++) {
        if (rooms.length === 0) continue;
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const [x, y] = room.getRandomPoint();
        
        // Check if position is free
        if (!getEntityAt(x, y) && game.gameMap[y][x].tileType === TileType.FLOOR) {
            const enemy = generateEnemy(depth, x, y);
            game.entities.push(enemy);
        }
    }
    
    // Place items
    const numItems = Math.floor(Math.random() * 3) + Math.min(depth + 1, 6);
    for (let i = 0; i < numItems; i++) {
        if (rooms.length === 0) continue;
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const [x, y] = room.getRandomPoint();
        
        if (!getItemAt(x, y) && game.gameMap[y][x].tileType === TileType.FLOOR) {
            const itemType = getRandomItemType();
            const item = generateItem(x, y, depth, itemType);
            game.items.push(item);
        }
    }
    
    // Place gold
    const numGold = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numGold; i++) {
        if (rooms.length === 0) continue;
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        const [x, y] = room.getRandomPoint();
        
        if (!getItemAt(x, y) && game.gameMap[y][x].tileType === TileType.FLOOR) {
            const amount = Math.floor(Math.random() * depth * 10) + 5;
            const item = new Item(x, y, "$", `${amount} Gold`, "GOLD", "YELLOW", 0, 0, 0, 0, 0, `${amount} gold pieces`, true);
            game.items.push(item);
        }
    }
}

function generateEnemy(depth, x, y) {
    // Filter by depth
    const available = ENEMY_BASE_TYPES.filter(e => e[7] <= depth);
    const base = available.length > 0 ? available : ENEMY_BASE_TYPES.slice(0, 5);
    const enemyData = base[Math.floor(Math.random() * base.length)];
    
    let [name, char, color, hp, atk, def, xp] = enemyData;
    
    // Apply depth scaling
    hp = Math.floor(hp * (1 + (depth - 1) * 0.15));
    atk = Math.floor(atk * (1 + (depth - 1) * 0.1));
    def = Math.floor(def * (1 + (depth - 1) * 0.05));
    xp = Math.floor(xp * (1 + (depth - 1) * 0.1));
    
    // Maybe add adjective
    if (Math.random() < 0.4) {
        const adj = ENEMY_ADJECTIVES[Math.floor(Math.random() * ENEMY_ADJECTIVES.length)];
        const [adjName, hpMult, atkMult, xpMult] = adj;
        name = `${adjName} ${name}`;
        hp = Math.floor(hp * hpMult);
        atk = Math.floor(atk * atkMult);
        xp = Math.floor(xp * xpMult);
    }
    
    const entity = new Entity(x, y, char, color, name, hp, hp, 0, 0, atk, def);
    entity.xp = xp;
    return entity;
}

function getRandomItemType() {
    const roll = Math.random();
    if (roll < 0.25) return "potion";
    if (roll < 0.35) return "weapon";
    if (roll < 0.45) return "armor";
    if (roll < 0.50) return "ring";
    if (roll < 0.55) return "amulet";
    if (roll < 0.65) return "scroll";
    if (roll < 0.75) return "food";
    return "gold";
}

function generateItem(x, y, depth, itemType) {
    switch (itemType) {
        case "weapon":
            return generateWeapon(x, y, depth);
        case "armor":
            return generateArmor(x, y, depth);
        case "potion":
            return generatePotion(x, y, depth);
        case "ring":
            return generateRing(x, y, depth);
        case "amulet":
            return generateAmulet(x, y, depth);
        case "scroll":
            return generateScroll(x, y, depth);
        case "food":
            return generateFood(x, y, depth);
        default:
            const amount = Math.floor(Math.random() * depth * 10) + 5;
            return new Item(x, y, "$", `${amount} Gold`, "GOLD", "YELLOW", 0, 0, 0, 0, 0, `${amount} gold pieces`, true);
    }
}

function generateWeapon(x, y, depth) {
    // Get random prefix
    const prefixRoll = Math.random();
    let prefix = null;
    let prefixBonus = 0;
    
    let totalWeight = WEAPON_PREFIXES.reduce((sum, [, , w]) => sum + w, 0);
    let r = Math.random() * totalWeight;
    let cum = 0;
    
    for (const [p, bonus, weight] of WEAPON_PREFIXES) {
        cum += weight;
        if (r <= cum) {
            prefix = p;
            prefixBonus = bonus;
            break;
        }
    }
    
    // Weight weapon type by depth
    const available = WEAPON_TYPES.filter(w => w[2] <= depth + 3);
    const weaponPool = available.length > 0 ? available : WEAPON_TYPES.slice(0, 3);
    const [baseName, baseDmg, minDepth] = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    
    // Scale with depth
    const depthBonus = Math.floor((depth - 1) / 3);
    const totalAttack = Math.max(1, baseDmg + prefixBonus + depthBonus);
    
    const name = prefix ? `${prefix} ${baseName}` : baseName;
    
    return new Item(x, y, "/", name, "SWORD", "WHITE", totalAttack, 0, 0, 0, 0, `A ${baseName.toLowerCase()}. Attack +${totalAttack}`, true);
}

function generateArmor(x, y, depth) {
    // Get random prefix
    let totalWeight = ARMOR_PREFIXES.reduce((sum, [, , w]) => sum + w, 0);
    let r = Math.random() * totalWeight;
    let cum = 0;
    let prefix = null;
    let prefixBonus = 0;
    
    for (const [p, bonus, weight] of ARMOR_PREFIXES) {
        cum += weight;
        if (r <= cum) {
            prefix = p;
            prefixBonus = bonus;
            break;
        }
    }
    
    // Weight by depth
    const available = ARMOR_TYPES.filter(a => a[2] <= depth + 2);
    const armorPool = available.length > 0 ? available : ARMOR_TYPES.slice(0, 3);
    const [baseName, baseDef] = armorPool[Math.floor(Math.random() * armorPool.length)];
    
    const depthBonus = Math.floor((depth - 1) / 4);
    const totalDefense = Math.max(0, baseDef + prefixBonus + depthBonus);
    
    const name = prefix ? `${prefix} ${baseName}` : baseName;
    
    return new Item(x, y, "[", name, "ARMOR", "WHITE", 0, totalDefense, 0, 0, 0, `${baseName} armor. Defense +${totalDefense}`, true);
}

function generatePotion(x, y, depth) {
    const healAmount = 5 + depth * 2 + Math.floor(Math.random() * 5);
    const potionType = Math.random() < 0.8 ? "Health" : "Mana";
    const color = potionType === "Health" ? "RED" : "BLUE";
    const itemType = potionType === "Health" ? "HEALTH_POTION" : "MANA_POTION";
    
    return new Item(x, y, "!", `${potionType} Potion`, itemType, color, 0, 0, healAmount, 0, healAmount, `Restores ${healAmount} ${potionType.toLowerCase()}`, true);
}

function generateRing(x, y, depth) {
    const RING_TYPES = ["Protection", "Power", "Strength", "Dexterity", "Vitality", "Energy", "Accuracy", "Evasion"];
    const type = RING_TYPES[Math.floor(Math.random() * RING_TYPES.length)];
    const bonus = Math.floor(Math.random() * 3) + 1 + Math.floor(depth / 4);
    
    const name = `Ring of ${type}`;
    return new Item(x, y, "=", name, "RING", "CYAN", bonus, bonus, 0, 0, 0, `A magical ring. +${bonus} stats`, true);
}

function generateAmulet(x, y, depth) {
    const AMULET_TYPES = ["Health", "Mana", "Protection", "Life", "Energy", "Warding", "Spirit"];
    const type = AMULET_TYPES[Math.floor(Math.random() * AMULET_TYPES.length)];
    const bonus = Math.floor(Math.random() * 3) + 1 + Math.floor(depth / 4);
    
    const name = `Amulet of ${type}`;
    return new Item(x, y, "\"", name, "AMULET", "MAGENTA", bonus, bonus, 0, 0, 0, `A magical amulet. +${bonus} stats`, true);
}

function generateScroll(x, y, depth) {
    const SCROLL_TYPES = ["Fireball", "Lightning", "Teleport", "Identify"];
    const type = SCROLL_TYPES[Math.floor(Math.random() * SCROLL_TYPES.length)];
    const damage = 8 + depth * 2;
    
    let itemType;
    switch (type) {
        case "Fireball": itemType = "SCROLL_FIREBALL"; break;
        case "Lightning": itemType = "SCROLL_LIGHTNING"; break;
        case "Teleport": itemType = "SCROLL_TELEPORT"; break;
        default: itemType = "SCROLL_IDENTIFY";
    }
    
    const name = `Scroll of ${type}`;
    return new Item(x, y, "?", name, itemType, "WHITE", 0, 0, 0, damage, 0, `A magical scroll`, true);
}

function generateFood(x, y, depth) {
    const FOOD_TYPES = ["Ration", "Bread", "Meat", "Fruit", "Cheese"];
    const type = FOOD_TYPES[Math.floor(Math.random() * FOOD_TYPES.length)];
    const healAmount = 20 + Math.floor(Math.random() * 15);
    
    return new Item(x, y, "%", type, "FOOD", "BROWN", 0, 0, healAmount, 0, 0, `Restores ${healAmount} hunger`, true);
}
