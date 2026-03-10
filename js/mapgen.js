/**
 * Roguelike HTML5 - Map Generation
 */

function generateBiome(depth) {
    if (depth <= 3) {
        return Biome.DUNGEON;
    } else if (depth <= 6) {
        return Math.random() < 0.5 ? Biome.CAVE : Biome.CRYPT;
    } else if (depth <= 10) {
        const biomes = [Biome.CAVE, Biome.FOREST, Biome.CRYPT];
        return biomes[Math.floor(Math.random() * biomes.length)];
    } else {
        const biomes = [Biome.VOLCANO, Biome.CRYPT];
        return biomes[Math.floor(Math.random() * biomes.length)];
    }
}

function createRoom(gameMap, room) {
    for (let y = room.y1; y < Math.min(room.y2, MAP_HEIGHT); y++) {
        for (let x = room.x1; x < Math.min(room.x2, MAP_WIDTH); x++) {
            gameMap[y][x] = Tile.floor();
        }
    }
}

function createHTunnel(gameMap, x1, x2, y) {
    for (let x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) {
        gameMap[y][x] = Tile.floor();
    }
}

function createVTunnel(gameMap, y1, y2, x) {
    for (let y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) {
        gameMap[y][x] = Tile.floor();
    }
}

function connectRooms(gameMap, room1, room2) {
    const [cx1, cy1] = room1.center();
    const [cx2, cy2] = room2.center();
    
    if (Math.random() < 0.5) {
        createHTunnel(gameMap, cx1, cx2, cy1);
        createVTunnel(gameMap, cy1, cy2, cx2);
    } else {
        createVTunnel(gameMap, cy1, cy2, cx1);
        createHTunnel(gameMap, cx1, cx2, cy2);
    }
}

function generateDungeon(depth) {
    const biome = generateBiome(depth);
    game.biome = biome;
    
    // Initialize map with walls
    game.gameMap = [];
    for (let y = 0; y < MAP_HEIGHT; y++) {
        const row = [];
        for (let x = 0; x < MAP_WIDTH; x++) {
            row.push(Tile.wall());
        }
        game.gameMap.push(row);
    }
    
    game.items = [];
    game.entities = [];
    
    const generators = {
        [Biome.DUNGEON]: generateStandardDungeon,
        [Biome.CAVE]: generateCave,
        [Biome.CRYPT]: generateCrypt,
        [Biome.FOREST]: generateForest,
        [Biome.VOLCANO]: generateVolcano
    };
    
    const generator = generators[biome] || generateStandardDungeon;
    generator(game.gameMap, depth);
}

function generateStandardDungeon(gameMap, depth) {
    game.rooms = [];
    const maxRooms = Math.floor(Math.random() * 8) + 8; // 8-15 rooms
    
    for (let i = 0; i < maxRooms; i++) {
        const w = Math.floor(Math.random() * 7) + 4; // 4-10
        const h = Math.floor(Math.random() * 5) + 4; // 4-8
        const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
        
        const newRoom = new Room(x, y, w, h);
        
        let valid = true;
        for (const other of game.rooms) {
            if (newRoom.intersects(other)) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            createRoom(gameMap, newRoom);
            if (game.rooms.length > 0 && Math.random() < 0.3) {
                placeDoor(gameMap, newRoom);
            }
            if (game.rooms.length > 0) {
                connectRooms(gameMap, game.rooms[game.rooms.length - 1], newRoom);
            }
            game.rooms.push(newRoom);
        }
    }
    
    // Place stairs in last room
    if (game.rooms.length > 0) {
        const [cx, cy] = game.rooms[game.rooms.length - 1].center();
        if (cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT) {
            gameMap[cy][cx] = Tile.stairsDown();
        }
    }
    
    addDecorations(gameMap, game.rooms, Biome.DUNGEON);
}

function generateCave(gameMap, depth) {
    const floorTiles = new Set();
    
    // Random walk
    let cx = Math.floor(MAP_WIDTH / 2);
    let cy = Math.floor(MAP_HEIGHT / 2);
    for (let i = 0; i < 400; i++) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        cx = Math.max(2, Math.min(MAP_WIDTH - 3, cx + dx));
        cy = Math.max(2, Math.min(MAP_HEIGHT - 3, cy + dy));
        floorTiles.add(`${cx},${cy}`);
    }
    
    // Smooth
    for (let s = 0; s < 4; s++) {
        const newTiles = new Set();
        for (let y = 1; y < MAP_HEIGHT - 1; y++) {
            for (let x = 1; x < MAP_WIDTH - 1; x++) {
                let neighbors = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx !== 0 || dy !== 0) {
                            if (floorTiles.has(`${x + dx},${y + dy}`)) {
                                neighbors++;
                            }
                        }
                    }
                }
                const key = `${x},${y}`;
                if (floorTiles.has(key) && neighbors >= 4) {
                    newTiles.add(key);
                } else if (!floorTiles.has(key) && neighbors >= 5) {
                    newTiles.add(key);
                }
            }
        }
        floorTiles.clear();
        newTiles.forEach(t => floorTiles.add(t));
    }
    
    // Apply to map
    floorTiles.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        gameMap[y][x] = Tile.floor();
    });
    
    // Water pools
    const poolCount = Math.floor(Math.random() * 4) + 2;
    for (let p = 0; p < poolCount; p++) {
        if (floorTiles.size === 0) break;
        const tiles = Array.from(floorTiles);
        const [wx, wy] = tiles[Math.floor(Math.random() * tiles.length)].split(',').map(Number);
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                if (Math.random() < 0.6 && floorTiles.has(`${wx + dx},${wy + dy}`)) {
                    gameMap[wy + dy][wx + dx] = Tile.water();
                }
            }
        }
    }
    
    // Find regions and connect
    const regions = findRegions(gameMap);
    for (let i = 0; i < regions.length - 1; i++) {
        if (regions[i].length > 0 && regions[i + 1].length > 0) {
            const [x1, y1] = regions[i][0];
            const [x2, y2] = regions[i + 1][0];
            carveTunnel(gameMap, x1, y1, x2, y2);
        }
    }
    
    // Create pseudo-rooms for spawning
    game.rooms = [];
    for (let i = 0; i < 5; i++) {
        if (floorTiles.size > 0) {
            const tiles = Array.from(floorTiles);
            const [x, y] = tiles[Math.floor(Math.random() * tiles.length)].split(',').map(Number);
            game.rooms.push(new Room(x - 3, y - 3, 6, 6, "cave_chamber"));
        }
    }
    
    // Place stairs
    if (floorTiles.size > 0) {
        const tiles = Array.from(floorTiles);
        const [sx, sy] = tiles[Math.floor(Math.random() * tiles.length)].split(',').map(Number);
        gameMap[sy][sx] = Tile.stairsDown();
    }
}

function generateCrypt(gameMap, depth) {
    game.rooms = [];
    const maxRooms = Math.floor(Math.random() * 5) + 8; // 8-12 rooms
    
    for (let i = 0; i < maxRooms; i++) {
        const w = Math.floor(Math.random() * 4) + 4; // 4-7 (narrower)
        const h = Math.floor(Math.random() * 5) + 5; // 5-9 (taller)
        const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;
        
        const newRoom = new Room(x, y, w, h, "burial_chamber");
        
        let valid = true;
        for (const other of game.rooms) {
            if (newRoom.intersects(other)) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            createRoom(gameMap, newRoom);
            
            // Sometimes add an altar in the center
            const [cx, cy] = newRoom.center();
            if (Math.random() < 0.3 && cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT) {
                gameMap[cy][cx] = Tile.altar();
            }
            
            if (game.rooms.length > 0) {
                connectRooms(gameMap, game.rooms[game.rooms.length - 1], newRoom);
            }
            game.rooms.push(newRoom);
        }
    }
    
    // Place stairs
    if (game.rooms.length > 1) {
        const stairsRoom = game.rooms[Math.floor(Math.random() * (game.rooms.length - 1)) + 1];
        const [cx, cy] = stairsRoom.center();
        if (cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT) {
            gameMap[cy][cx] = Tile.stairsDown();
        }
    } else if (game.rooms.length > 0) {
        const [cx, cy] = game.rooms[0].center();
        if (cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT) {
            gameMap[cy][cx] = Tile.stairsDown();
        }
    }
}

function generateForest(gameMap, depth) {
    // Fill with grass
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            gameMap[y][x] = Tile.grass();
        }
    }
    
    game.rooms = [];
    const numClearings = Math.floor(Math.random() * 6) + 5;
    
    for (let i = 0; i < numClearings; i++) {
        const w = Math.floor(Math.random() * 6) + 5; // 5-10
        const h = Math.floor(Math.random() * 6) + 5;
        const x = Math.floor(Math.random() * (MAP_WIDTH - w - 4)) + 2;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 4)) + 2;
        
        const clearing = new Room(x, y, w, h, "forest_clearing");
        
        let valid = true;
        for (const other of game.rooms) {
            if (clearing.intersects(other)) {
                valid = false;
                break;
            }
        }
        
        if (valid) {
            for (let cy = y; cy < y + h; cy++) {
                for (let cx = x; cx < x + w; cx++) {
                    gameMap[cy][cx] = Tile.floor();
                    if (Math.random() < 0.1) {
                        const decors = ['"', "'", '.', ','];
                        gameMap[cy][cx].decoration = decors[Math.floor(Math.random() * decors.length)];
                    }
                }
            }
            game.rooms.push(clearing);
        }
    }
    
    // Add trees
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameMap[y][x].tileType === TileType.GRASS && Math.random() < 0.3) {
                gameMap[y][x] = Tile.tree();
            }
        }
    }
    
    // Connect clearings
    if (game.rooms.length > 1) {
        for (let i = 0; i < game.rooms.length - 1; i++) {
            const [x1, y1] = game.rooms[i].center();
            const [x2, y2] = game.rooms[i + 1].center();
            carvePath(gameMap, x1, y1, x2, y2);
        }
    }
    
    // Place stairs
    if (game.rooms.length > 0) {
        const [cx, cy] = game.rooms[game.rooms.length - 1].center();
        if (cx >= 0 && cx < MAP_WIDTH && cy >= 0 && cy < MAP_HEIGHT) {
            gameMap[cy][cx] = Tile.stairsDown();
        }
    }
}

function generateVolcano(gameMap, depth) {
    const floorTiles = new Set();
    let cx = Math.floor(MAP_WIDTH / 2);
    let cy = Math.floor(MAP_HEIGHT / 2);
    
    for (let i = 0; i < 300; i++) {
        const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
        const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
        cx = Math.max(2, Math.min(MAP_WIDTH - 3, cx + dx));
        cy = Math.max(2, Math.min(MAP_HEIGHT - 3, cy + dy));
        floorTiles.add(`${cx},${cy}`);
        gameMap[cy][cx] = Tile.floor();
    }
    
    // Add lava rivers
    const lavaCount = Math.floor(Math.random() * 4) + 3;
    for (let l = 0; l < lavaCount; l++) {
        let lx = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
        let ly = Math.floor(Math.random() * (MAP_HEIGHT - 6)) + 3;
        const length = Math.floor(Math.random() * 11) + 10;
        for (let i = 0; i < length; i++) {
            if (floorTiles.has(`${lx},${ly}`)) {
                gameMap[ly][lx] = Tile.lava();
            }
            const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
            const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
            lx = Math.max(2, Math.min(MAP_WIDTH - 3, lx + dx));
            ly = Math.max(2, Math.min(MAP_HEIGHT - 3, ly + dy));
        }
    }
    
    // Safe zones (rooms)
    game.rooms = [];
    for (let i = 0; i < 4; i++) {
        const x = Math.floor(Math.random() * (MAP_WIDTH - 10)) + 5;
        const y = Math.floor(Math.random() * (MAP_HEIGHT - 10)) + 5;
        const w = Math.floor(Math.random() * 3) + 4; // 4-6
        const h = Math.floor(Math.random() * 3) + 4;
        const room = new Room(x, y, w, h, "safe_zone");
        createRoom(gameMap, room);
        game.rooms.push(room);
    }
    
    // Place stairs
    if (floorTiles.size > 0) {
        const tiles = Array.from(floorTiles);
        const [sx, sy] = tiles[Math.floor(Math.random() * tiles.length)].split(',').map(Number);
        gameMap[sy][sx] = Tile.stairsDown();
    }
}

function carveTunnel(gameMap, x1, y1, x2, y2) {
    let cx = x1;
    let cy = y1;
    while (cx !== x2 || cy !== y2) {
        gameMap[cy][cx] = Tile.floor();
        if (cx !== x2) {
            cx += cx < x2 ? 1 : -1;
        } else if (cy !== y2) {
            cy += cy < y2 ? 1 : -1;
        }
    }
    gameMap[cy][cx] = Tile.floor();
}

function carvePath(gameMap, x1, y1, x2, y2) {
    let x = x1;
    let y = y1;
    while (x !== x2 || y !== y2) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const nx = x + dx;
                const ny = y + dy;
                if (nx > 0 && nx < MAP_WIDTH - 1 && ny > 0 && ny < MAP_HEIGHT - 1) {
                    const tile = gameMap[ny][nx];
                    if (tile.tileType === TileType.GRASS || tile.tileType === TileType.TREE) {
                        gameMap[ny][nx] = Tile.floor();
                        const decors = ['"', "'", '.', ','];
                        gameMap[ny][nx].decoration = decors[Math.floor(Math.random() * decors.length)];
                    }
                }
            }
        }
        if (x !== x2) {
            x += x < x2 ? 1 : -1;
        } else if (y !== y2) {
            y += y < y2 ? 1 : -1;
        }
    }
}

function findRegions(gameMap) {
    const visited = new Set();
    const regions = [];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameMap[y][x].tileType === TileType.FLOOR && !visited.has(`${x},${y}`)) {
                const region = [];
                const stack = [[x, y]];
                while (stack.length > 0) {
                    const [cx, cy] = stack.pop();
                    const key = `${cx},${cy}`;
                    if (!visited.has(key)) {
                        visited.add(key);
                        region.push([cx, cy]);
                        const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
                        for (const [dx, dy] of dirs) {
                            const nx = cx + dx;
                            const ny = cy + dy;
                            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
                                if (gameMap[ny][nx].tileType === TileType.FLOOR && !visited.has(`${nx},${ny}`)) {
                                    stack.push([nx, ny]);
                                }
                            }
                        }
                    }
                }
                regions.push(region);
            }
        }
    }
    
    return regions;
}

function placeDoor(gameMap, room) {
    const [cx, cy] = room.center();
    const doorX = cx < MAP_WIDTH / 2 ? room.x1 : room.x2 - 1;
    if (doorX > 0 && doorX < MAP_WIDTH - 1 && cy > 0 && cy < MAP_HEIGHT - 1) {
        gameMap[cy][doorX] = Tile.door();
    }
}

function addDecorations(gameMap, rooms, biome) {
    const decorations = {
        [Biome.DUNGEON]: [[',', 0.05], ['`', 0.03], ['"', 0.02], ['_', 0.02], ['=', 0.01]],
        [Biome.CRYPT]: [['=', 0.08], ['+', 0.05], ['~', 0.03]],
        [Biome.CAVE]: [['^', 0.06], ['~', 0.04], ['`', 0.05]],
        [Biome.FOREST]: [['"', 0.1], ["'", 0.08], ['*', 0.03]],
        [Biome.VOLCANO]: [['^', 0.08], ['~', 0.05], ['=', 0.03]]
    };
    
    const decorList = decorations[biome] || decorations[Biome.DUNGEON];
    
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            if (gameMap[y][x].tileType === TileType.FLOOR) {
                for (const [char, chance] of decorList) {
                    if (Math.random() < chance) {
                        gameMap[y][x].decoration = char;
                        break;
                    }
                }
            }
        }
    }
}
