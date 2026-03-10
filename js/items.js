/**
 * Roguelike HTML5 - Item Usage and Management
 */

function useItem(player, item) {
    if (item.itemType === "HEALTH_POTION" || item.itemType === "MANA_POTION") {
        if (item.itemType === "HEALTH_POTION") {
            const healed = player.heal(item.healAmount);
            addMessage(`You drink the ${item.name} and heal ${healed} HP!`);
        } else {
            player.mana = Math.min(player.maxMana, player.mana + item.mana);
            addMessage(`You drink the ${item.name} and restore mana!`);
        }
        player.inventory.splice(player.inventory.indexOf(item), 1);
        return true;
    }
    
    else if (item.itemType === "FOOD") {
        player.hunger = Math.min(player.maxHunger, player.hunger + item.healAmount);
        addMessage(`You eat the ${item.name}. Delicious!`);
        player.inventory.splice(player.inventory.indexOf(item), 1);
        return true;
    }
    
    else if (item.itemType === "SCROLL_FIREBALL") {
        addMessage("You read the Scroll of Fireball!");
        const damage = item.damage;
        for (const entity of game.entities) {
            if (entity !== player && !entity.dead) {
                const dist = distance(entity.x, entity.y, player.x, player.y);
                if (dist <= 2) {
                    entity.takeDamage(damage);
                    if (entity.dead) {
                        addMessage(`${entity.name} is incinerated!`);
                        if (player.gainXp(entity.xp)) {
                            addMessage(`*** LEVEL UP! You are now level ${player.level}! ***`);
                        }
                    }
                }
            }
        }
        player.inventory.splice(player.inventory.indexOf(item), 1);
        return true;
    }
    
    else if (item.itemType === "SCROLL_LIGHTNING") {
        addMessage("You read the Scroll of Lightning!");
        let closest = null;
        let closestDist = Infinity;
        
        for (const entity of game.entities) {
            if (entity !== player && !entity.dead) {
                const dist = distance(entity.x, entity.y, player.x, player.y);
                if (dist < closestDist) {
                    closestDist = dist;
                    closest = entity;
                }
            }
        }
        
        if (closest && closestDist <= 10) {
            closest.takeDamage(item.damage);
            addMessage(`Lightning strikes ${closest.name} for ${item.damage} damage!`);
            if (closest.dead) {
                addMessage(`${closest.name} is fried!`);
                if (player.gainXp(closest.xp)) {
                    addMessage(`*** LEVEL UP! You are now level ${player.level}! ***`);
                }
            }
        }
        player.inventory.splice(player.inventory.indexOf(item), 1);
        return true;
    }
    
    else if (item.itemType === "SCROLL_TELEPORT") {
        addMessage("You read the Scroll of Teleport!");
        for (let i = 0; i < 100; i++) {
            const tx = Math.floor(Math.random() * (MAP_WIDTH - 2)) + 1;
            const ty = Math.floor(Math.random() * (MAP_HEIGHT - 2)) + 1;
            if (!game.gameMap[ty][tx].blocked) {
                player.x = tx;
                player.y = ty;
                addMessage("You teleport to a new location!");
                player.inventory.splice(player.inventory.indexOf(item), 1);
                computeFOV();
                return true;
            }
        }
    }
    
    else if (item.itemType === "GOLD" || item.itemType === "GEM") {
        addMessage(`You admire your ${item.name}.`);
        return false;
    }
    
    else {
        addMessage(`You can't figure out how to use the ${item.name}.`);
        return false;
    }
}

function equipItem(player, item) {
    const weaponTypes = ["SWORD", "AXE", "MACE"];
    
    if (weaponTypes.includes(item.itemType)) {
        if (player.equippedWeapon) {
            player.inventory.push(player.equippedWeapon);
        }
        player.equippedWeapon = item;
        player.inventory.splice(player.inventory.indexOf(item), 1);
        addMessage(`You wield the ${item.name}.`);
        return true;
    }
    
    else if (item.itemType === "ARMOR") {
        if (player.equippedArmor) {
            player.inventory.push(player.equippedArmor);
        }
        player.equippedArmor = item;
        player.inventory.splice(player.inventory.indexOf(item), 1);
        addMessage(`You put on the ${item.name}.`);
        return true;
    }
    
    else if (item.itemType === "SHIELD") {
        if (player.equippedArmor) {
            const current = player.equippedArmor;
            if (current.defenseBonus >= item.defenseBonus) {
                addMessage("Your current armor is better.");
                return false;
            }
            player.inventory.push(current);
        }
        player.equippedArmor = item;
        player.inventory.splice(player.inventory.indexOf(item), 1);
        addMessage(`You equip the ${item.name}.`);
        return true;
    }
    
    else if (item.itemType === "RING") {
        if (player.equippedRing) {
            player.inventory.push(player.equippedRing);
        }
        player.equippedRing = item;
        player.inventory.splice(player.inventory.indexOf(item), 1);
        addMessage(`You slip on the ${item.name}.`);
        return true;
    }
    
    else if (item.itemType === "AMULET") {
        if (player.equippedAmulet) {
            player.inventory.push(player.equippedAmulet);
        }
        player.equippedAmulet = item;
        player.inventory.splice(player.inventory.indexOf(item), 1);
        addMessage(`You clasp the ${item.name} around your neck.`);
        return true;
    }
    
    addMessage("You can't equip that.");
    return false;
}

function dropItem(player, item) {
    // Unequip if equipped
    if (player.equippedWeapon === item) {
        player.equippedWeapon = null;
    }
    if (player.equippedArmor === item) {
        player.equippedArmor = null;
    }
    if (player.equippedRing === item) {
        player.equippedRing = null;
    }
    if (player.equippedAmulet === item) {
        player.equippedAmulet = null;
    }
    
    // Remove from inventory and place on ground
    player.inventory.splice(player.inventory.indexOf(item), 1);
    item.x = player.x;
    item.y = player.y;
    game.items.push(item);
    addMessage(`You drop the ${item.name}.`);
}
