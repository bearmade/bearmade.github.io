/**
 * Roguelike HTML5 - Item Class
 */

class Item {
    constructor(x, y, char, name, itemType, color, attackBonus = 0, defenseBonus = 0, healAmount = 0, damage = 0, mana = 0, description = "", identified = true, quantity = 1) {
        this.x = x;
        this.y = y;
        this.char = char;
        this.name = name;
        this.itemType = itemType;
        this.color = color;
        this.attackBonus = attackBonus;
        this.defenseBonus = defenseBonus;
        this.healAmount = healAmount;
        this.damage = damage;
        this.mana = mana;
        this.description = description;
        this.identified = identified;
        this.quantity = quantity;
    }
}
