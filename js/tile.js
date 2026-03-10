/**
 * Roguelike HTML5 - Tile Class
 */

class Tile {
    constructor(tileType, blocked, blockSight, decoration = null) {
        this.tileType = tileType;
        this.blocked = blocked;
        this.blockSight = blockSight;
        this.explored = false;
        this.decoration = decoration;
    }

    static wall(decoration = null) {
        return new Tile(TileType.WALL, true, true, decoration);
    }

    static floor(decoration = null) {
        return new Tile(TileType.FLOOR, false, false, decoration);
    }

    static stairsDown() {
        return new Tile(TileType.STAIRS_DOWN, false, false);
    }

    static stairsUp() {
        return new Tile(TileType.STAIRS_UP, false, false);
    }

    static door(closed = true) {
        if (closed) {
            return new Tile(TileType.DOOR_CLOSED, true, true);
        }
        return new Tile(TileType.DOOR_OPEN, false, false);
    }

    static water() {
        return new Tile(TileType.WATER, true, false);
    }

    static lava() {
        return new Tile(TileType.LAVA, false, false);
    }

    static grass() {
        return new Tile(TileType.GRASS, false, false);
    }

    static tree() {
        return new Tile(TileType.TREE, true, true);
    }

    static altar() {
        return new Tile(TileType.ALTAR, false, false, '_');
    }

    static chest() {
        return new Tile(TileType.CHEST, true, true, '=');
    }
}
