/**
 * Roguelike HTML5 - Room Class
 */

class Room {
    constructor(x, y, w, h, roomType = "normal") {
        this.x1 = x;
        this.y1 = y;
        this.x2 = x + w;
        this.y2 = y + h;
        this.w = w;
        this.h = h;
        this.type = roomType;
        this.features = [];
    }

    center() {
        return [Math.floor((this.x1 + this.x2) / 2), Math.floor((this.y1 + this.y2) / 2)];
    }

    intersects(other) {
        return (this.x1 <= other.x2 && this.x2 >= other.x1 &&
                this.y1 <= other.y2 && this.y2 >= other.y1);
    }

    getRandomPoint() {
        return [
            Math.floor(Math.random() * (this.x2 - this.x1 - 2)) + this.x1 + 1,
            Math.floor(Math.random() * (this.y2 - this.y1 - 2)) + this.y1 + 1
        ];
    }
}
