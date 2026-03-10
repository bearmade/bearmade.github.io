/**
 * Roguelike HTML5 - Entity Class
 */

class Entity {
    constructor(x, y, char, color, name, hp = 10, maxHp = 10, mana = 10, maxMana = 10, attack = 2, defense = 0) {
        this.x = x;
        this.y = y;
        this.char = char;
        this.color = color;
        this.name = name;
        this.hp = hp;
        this.maxHp = maxHp;
        this.mana = mana;
        this.maxMana = maxMana;
        this.attack = attack;
        this.defense = defense;
        this.dead = false;
        this.inventory = [];
        this.equippedWeapon = null;
        this.equippedArmor = null;
        this.equippedRing = null;
        this.equippedAmulet = null;
        this.level = 1;
        this.xp = 0;
        this.xpToNext = 10;
        this.gold = 0;
        this.hunger = 100;
        this.maxHunger = 100;
        this.strength = 10;
        this.dexterity = 10;
        this.intelligence = 10;
        this.statusEffects = [];
    }

    getTotalAttack() {
        let bonus = 0;
        if (this.equippedWeapon) {
            bonus += this.equippedWeapon.attackBonus;
        }
        if (this.equippedRing) {
            bonus += this.equippedRing.attackBonus;
        }
        return this.attack + Math.floor((this.strength - 10) / 2) + bonus;
    }

    getTotalDefense() {
        let bonus = 0;
        if (this.equippedWeapon) {
            bonus += this.equippedWeapon.defenseBonus;
        }
        if (this.equippedArmor) {
            bonus += this.equippedArmor.defenseBonus;
        }
        if (this.equippedRing) {
            bonus += this.equippedRing.defenseBonus;
        }
        if (this.equippedAmulet) {
            bonus += this.equippedAmulet.defenseBonus;
        }
        return this.defense + Math.floor((this.dexterity - 10) / 2) + bonus;
    }

    move(dx, dy, gameMap) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        
        if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
            const tile = gameMap[newY][newX];
            if (!tile.blocked) {
                this.x = newX;
                this.y = newY;
                return true;
            } else if (tile.tileType === TileType.DOOR_CLOSED) {
                gameMap[newY][newX] = Tile.door(false);
                return true;
            }
        }
        return false;
    }

    takeDamage(damage) {
        const actual = Math.max(0, damage - this.getTotalDefense());
        this.hp -= actual;
        if (this.hp <= 0) {
            this.dead = true;
            this.hp = 0;
        }
        return actual;
    }

    heal(amount) {
        const oldHp = this.hp;
        this.hp = Math.min(this.maxHp, this.hp + amount);
        return this.hp - oldHp;
    }

    gainXp(amount) {
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.levelUp();
            return true;
        }
        return false;
    }

    levelUp() {
        this.level++;
        this.xp -= this.xpToNext;
        this.xpToNext = Math.floor(this.xpToNext * 1.5);
        this.maxHp += 5 + Math.floor((this.strength - 10) / 2);
        this.hp = this.maxHp;
        this.attack += 1;
    }
}
