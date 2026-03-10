/**
 * Roguelike HTML5 - Main Game Engine
 * With Firebase Public Leaderboard
 */

// Game state
let game = {
    player: null,
    playerName: '',
    gameMap: [],
    entities: [],
    items: [],
    visible: [],
    messages: [],
    dungeonLevel: 1,
    turn: 0,
    biome: 'DUNGEON',
    running: false,
    inventoryOpen: false,
    selectedInventoryIndex: 0,
    currentScreen: 'title',
    nameInput: '',
    cursorVisible: true,
    leaderboardData: [],
    leaderboardError: null
};

// Canvas context
let ctx = null;
let canvas = null;

// Firebase Firestore reference
let db = null;

// Biome names
const BIOME_NAMES = {
    'DUNGEON': 'Dungeon',
    'CAVE': 'Caverns',
    'CRYPT': 'Crypt',
    'FOREST': 'Dark Forest',
    'VOLCANO': 'Volcanic Depths'
};

// Initialize game
function init() {
    try {
        console.log('Initializing game...');
        
        // Initialize Firebase Firestore
        if (typeof firebase !== 'undefined') {
            db = firebase.firestore();
            console.log('Firebase Firestore initialized');
        } else {
            console.warn('Firebase not available - leaderboard will be disabled');
        }
        
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        ctx = canvas.getContext('2d');
        if (!ctx) {
            throw new Error('Could not get canvas context');
        }
        
        // Set up input handling
        document.addEventListener('keydown', handleInput);
        
        // Start cursor blink
        setInterval(() => {
            game.cursorVisible = !game.cursorVisible;
            if (game.currentScreen === 'nameEntry' || game.currentScreen === 'title' || game.currentScreen === 'leaderboard') {
                draw();
            }
        }, 500);
        
        // Show title screen
        showTitleScreen();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        document.body.innerHTML = '<div style="color: red; padding: 20px;">Error: ' + error.message + '</div>';
    }
}

// Title screen
function showTitleScreen() {
    game.currentScreen = 'title';
    drawTitleScreen();
}

function drawTitleScreen() {
    // Clear canvas
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title
    ctx.fillStyle = COLORS.YELLOW;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ROGUELIKE', canvas.width / 2, 150);
    
    // Draw subtitle
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '24px monospace';
    ctx.fillText('A JavaScript ASCII Adventure', canvas.width / 2, 200);
    
    // Draw menu
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = '20px monospace';
    
    let menuY = 300;
    ctx.fillText('[N] New Game', canvas.width / 2, menuY);
    
    menuY += 40;
    ctx.fillText('[L] Leaderboard', canvas.width / 2, menuY);
    
    menuY += 40;
    ctx.fillText('[Q] Quit', canvas.width / 2, menuY);
}

// Name entry screen
function showNameEntry() {
    game.currentScreen = 'nameEntry';
    game.nameInput = '';
    drawNameEntry();
}

function drawNameEntry() {
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = COLORS.YELLOW;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Create Your Character', canvas.width / 2, 150);
    
    // Prompt
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '20px monospace';
    ctx.fillText('Enter your name:', canvas.width / 2, 250);
    
    // Input box
    const inputY = 300;
    ctx.strokeStyle = COLORS.CYAN;
    ctx.lineWidth = 2;
    ctx.strokeRect(canvas.width / 2 - 200, inputY - 30, 400, 50);
    
    // Input text
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = '24px monospace';
    ctx.fillText(game.nameInput, canvas.width / 2, inputY + 5);
    
    // Cursor
    if (game.cursorVisible) {
        const textWidth = ctx.measureText(game.nameInput).width;
        ctx.fillStyle = COLORS.CYAN;
        ctx.fillRect(canvas.width / 2 - textWidth / 2 + textWidth, inputY - 20, 2, 30);
    }
    
    // Instructions
    ctx.fillStyle = COLORS.GRAY;
    ctx.font = '14px monospace';
    ctx.fillText('Press Enter when ready | ESC to go back | Max 20 characters', canvas.width / 2, inputY + 60);
}

// Leaderboard - Fetch from Firebase
function showLeaderboard() {
    game.currentScreen = 'leaderboard';
    game.leaderboardData = [];
    game.leaderboardError = null;
    drawLeaderboard();
    
    // Load from Firebase
    loadLeaderboardFromFirebase();
}

async function loadLeaderboardFromFirebase() {
    if (!db) {
        game.leaderboardError = 'Leaderboard unavailable';
        drawLeaderboard();
        return;
    }
    
    try {
        const snapshot = await db.collection('leaderboard')
            .orderBy('dungeonLevel', 'desc')
            .orderBy('level', 'desc')
            .orderBy('gold', 'desc')
            .limit(20)
            .get();
        
        game.leaderboardData = [];
        snapshot.forEach(doc => {
            game.leaderboardData.push(doc.data());
        });
        
        drawLeaderboard();
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        game.leaderboardError = 'Failed to load leaderboard';
        drawLeaderboard();
    }
}

async function saveToLeaderboard(name, level, dungeonLevel, gold) {
    if (!db) {
        console.warn('Firebase not available - score not saved');
        return;
    }
    
    try {
        await db.collection('leaderboard').add({
            name: name.substring(0, 20),
            level: parseInt(level) || 1,
            dungeonLevel: parseInt(dungeonLevel) || 1,
            gold: parseInt(gold) || 0,
            date: new Date().toISOString()
        });
        console.log('Score saved to leaderboard');
    } catch (error) {
        console.error('Error saving to leaderboard:', error);
    }
}

function drawLeaderboard() {
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = COLORS.YELLOW;
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Hall of Fame', canvas.width / 2, 60);
    
    // Loading or error message
    if (game.leaderboardData.length === 0 && !game.leaderboardError) {
        ctx.fillStyle = COLORS.GRAY;
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Loading...', canvas.width / 2, 200);
    } else if (game.leaderboardError) {
        ctx.fillStyle = COLORS.RED;
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(game.leaderboardError, canvas.width / 2, 200);
    }
    
    // Header
    const startY = 120;
    const rowHeight = 25;
    const colX = [50, 250, 400, 550, 700];
    
    ctx.fillStyle = COLORS.CYAN;
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Rank', colX[0], startY);
    ctx.fillText('Name', colX[1], startY);
    ctx.fillText('Level', colX[2], startY);
    ctx.fillText('Dungeon', colX[3], startY);
    ctx.fillText('Gold', colX[4], startY);
    
    // Line
    ctx.strokeStyle = COLORS.CYAN;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, startY + 10);
    ctx.lineTo(760, startY + 10);
    ctx.stroke();
    
    // Entries
    if (game.leaderboardData.length === 0 && !game.leaderboardError) {
        ctx.fillStyle = COLORS.GRAY;
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No entries yet. Be the first!', canvas.width / 2, startY + 60);
    } else {
        for (let i = 0; i < game.leaderboardData.length; i++) {
            const entry = game.leaderboardData[i];
            const y = startY + 40 + i * rowHeight;
            
            // Rank colors for top 3
            if (i === 0) ctx.fillStyle = COLORS.YELLOW;
            else if (i === 1) ctx.fillStyle = '#C0C0C0';
            else if (i === 2) ctx.fillStyle = '#CD7F32';
            else ctx.fillStyle = COLORS.WHITE;
            
            ctx.font = '16px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`${i + 1}.`, colX[0], y);
            ctx.fillText((entry.name || 'Unknown').substring(0, 15), colX[1], y);
            ctx.fillText((entry.level || 1).toString(), colX[2], y);
            ctx.fillText((entry.dungeonLevel || 1).toString(), colX[3], y);
            ctx.fillText((entry.gold || 0).toString(), colX[4], y);
        }
    }
    
    // Instructions
    ctx.fillStyle = COLORS.GRAY;
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Press ESC to return to title', canvas.width / 2, canvas.height - 30);
}

// Start new game
function startNewGame() {
    game.dungeonLevel = 1;
    game.turn = 0;
    game.messages = [`Welcome, ${game.playerName}!`, "Use arrow keys or hjkl to move."];
    game.currentScreen = 'game';
    
    // Generate first dungeon
    generateDungeon(1);
    
    // Create player
    const startRoom = game.rooms[0];
    const [px, py] = startRoom.center();
    game.player = new Entity(px, py, '@', 'YELLOW', game.playerName, 25, 25, 10, 10, 3, 1);
    game.player.level = 1;
    game.player.xp = 0;
    game.player.xpToNext = 10;
    game.player.gold = 0;
    game.player.hunger = 100;
    game.player.maxHunger = 100;
    game.player.strength = 12;
    game.player.dexterity = 12;
    game.player.intelligence = 10;
    game.player.inventory = [];
    
    // Starting equipment
    game.player.equippedWeapon = generateItem(0, 0, 1, 'weapon');
    game.player.equippedWeapon.name = "Rusty Dagger";
    game.player.equippedWeapon.attackBonus = 1;
    
    // Starting items
    for (let i = 0; i < 2; i++) {
        const potion = generateItem(0, 0, 1, 'potion');
        potion.name = "Health Potion";
        potion.itemType = 'HEALTH_POTION';
        potion.healAmount = 10;
        game.player.inventory.push(potion);
    }
    
    const food = generateItem(0, 0, 1, 'food');
    food.name = "Ration";
    food.itemType = 'FOOD';
    food.healAmount = 25;
    game.player.inventory.push(food);
    
    // Add player to entities
    game.entities.unshift(game.player);
    
    // Compute initial FOV
    computeFOV();
    
    game.running = true;
    draw();
}

// Drawing
function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.BLACK;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (game.currentScreen === 'title') {
        drawTitleScreen();
    } else if (game.currentScreen === 'nameEntry') {
        drawNameEntry();
    } else if (game.currentScreen === 'leaderboard') {
        drawLeaderboard();
    } else if (game.currentScreen === 'game') {
        drawGame();
        drawUI();
    } else if (game.currentScreen === 'inventory') {
        drawGame();
        drawInventoryOverlay();
    } else if (game.currentScreen === 'gameover') {
        drawGameOver();
    }
}

function drawGame() {
    // Draw map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = game.gameMap[y][x];
            const isVisible = game.visible[y][x];
            const px = x * TILE_SIZE;
            const py = y * TILE_SIZE;
            
            if (isVisible) {
                drawTile(tile, px, py, false);
            } else if (tile.explored) {
                drawTile(tile, px, py, true);
            }
        }
    }
    
    // Draw items
    for (const item of game.items) {
        if (game.visible[item.y][item.x]) {
            const px = item.x * TILE_SIZE + TILE_SIZE / 2;
            const py = item.y * TILE_SIZE + TILE_SIZE / 2 + 4;
            ctx.fillStyle = COLORS[item.color] || COLORS.WHITE;
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(item.char, px, py);
        }
    }
    
    // Draw entities
    for (const entity of game.entities) {
        if (!entity.dead && game.visible[entity.y][entity.x]) {
            const px = entity.x * TILE_SIZE + TILE_SIZE / 2;
            const py = entity.y * TILE_SIZE + TILE_SIZE / 2 + 4;
            ctx.fillStyle = COLORS[entity.color] || COLORS.WHITE;
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(entity.char, px, py);
        }
    }
}

function drawTile(tile, px, py, dim) {
    const char = getTileChar(tile);
    const color = dim ? COLORS.DARK_GRAY : getTileColor(tile);
    
    ctx.fillStyle = color;
    ctx.font = dim ? '14px monospace' : 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(char, px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 4);
}

function getTileChar(tile) {
    const chars = {
        'WALL': '#',
        'FLOOR': '.',
        'DOOR_CLOSED': '+',
        'DOOR_OPEN': '/',
        'STAIRS_DOWN': '>',
        'STAIRS_UP': '<',
        'WATER': '~',
        'LAVA': '~',
        'GRASS': '.',
        'TREE': 'T',
        'ALTAR': '_',
        'CHEST': '='
    };
    
    if (tile.decoration && (tile.tileType === 'FLOOR' || tile.tileType === 'GRASS')) {
        return tile.decoration;
    }
    
    return chars[tile.tileType] || '?';
}

function getTileColor(tile) {
    const colors = {
        'WALL': COLORS.WHITE,
        'FLOOR': COLORS.GRAY,
        'DOOR_CLOSED': COLORS.YELLOW,
        'DOOR_OPEN': COLORS.YELLOW,
        'STAIRS_DOWN': COLORS.YELLOW,
        'STAIRS_UP': COLORS.CYAN,
        'WATER': COLORS.BLUE,
        'LAVA': COLORS.RED,
        'GRASS': COLORS.GREEN,
        'TREE': COLORS.DARK_GREEN,
        'ALTAR': COLORS.MAGENTA,
        'CHEST': COLORS.YELLOW
    };
    
    return colors[tile.tileType] || COLORS.WHITE;
}

function drawUI() {
    const uiY = MAP_HEIGHT * TILE_SIZE + 10;
    
    // HP bar
    const hpPct = game.player.hp / game.player.maxHp;
    let hpColor = COLORS.GREEN;
    if (hpPct <= 0.4) hpColor = COLORS.RED;
    else if (hpPct <= 0.7) hpColor = COLORS.YELLOW;
    
    ctx.fillStyle = hpColor;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP:${game.player.hp}/${game.player.maxHp}`, 10, uiY);
    
    // Stats
    ctx.fillStyle = COLORS.WHITE;
    const stats = ` | ATK:${game.player.getTotalAttack()} DEF:${game.player.getTotalDefense()} STR:${game.player.strength} DEX:${game.player.dexterity}`;
    ctx.fillText(stats, 120, uiY);
    
    // Level/Gold/Hunger
    ctx.fillStyle = COLORS.CYAN;
    const info = `LVL:${game.player.level} XP:${game.player.xp}/${game.player.xpToNext} | GOLD:${game.player.gold} | HUN:${game.player.hunger}%`;
    ctx.fillText(info, 10, uiY + 20);
    
    // Location
    ctx.fillStyle = COLORS.MAGENTA;
    ctx.fillText(` | ${BIOME_NAMES[game.biome] || 'Dungeon'} LVL ${game.dungeonLevel}`, 350, uiY + 20);
    
    // Equipment
    ctx.fillStyle = COLORS.YELLOW;
    const weapon = game.player.equippedWeapon ? game.player.equippedWeapon.name.substring(0, 12) : 'None';
    const armor = game.player.equippedArmor ? game.player.equippedArmor.name.substring(0, 12) : 'None';
    ctx.fillText(`W:${weapon} A:${armor}`, 10, uiY + 40);
    
    // Messages
    let msgY = uiY + 70;
    const recentMessages = game.messages.slice(-5);
    for (let i = 0; i < recentMessages.length; i++) {
        const msg = recentMessages[i];
        let color = COLORS.WHITE;
        
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('kill') || lowerMsg.includes('defeat')) {
            color = COLORS.GREEN;
        } else if (lowerMsg.includes('hit') || lowerMsg.includes('damage')) {
            color = COLORS.RED;
        } else if (lowerMsg.includes('heal') || lowerMsg.includes('health')) {
            color = COLORS.GREEN;
        } else if (lowerMsg.includes('level up')) {
            color = COLORS.YELLOW;
        } else if (lowerMsg.includes('gold')) {
            color = COLORS.YELLOW;
        }
        
        ctx.fillStyle = color;
        ctx.fillText(msg.substring(0, 80), 10, msgY + i * 20);
    }
    
    // Controls
    ctx.fillStyle = COLORS.DARK_GRAY;
    ctx.font = '12px monospace';
    ctx.fillText('Move: arrows/hjkl | i:inv | g:get | q:drink | >:stairs | S:save', 10, canvas.height - 10);
}

function drawInventoryOverlay() {
    // Semi-transparent overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Box
    const boxW = 400;
    const boxH = 400;
    const startX = (canvas.width - boxW) / 2;
    const startY = (canvas.height - boxH) / 2;
    
    ctx.strokeStyle = COLORS.WHITE;
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, boxW, boxH);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(startX, startY, boxW, boxH);
    
    // Title
    ctx.fillStyle = COLORS.YELLOW;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Inventory', canvas.width / 2, startY + 30);
    
    // Items
    ctx.font = '14px monospace';
    ctx.textAlign = 'left';
    
    if (game.player.inventory.length === 0) {
        ctx.fillStyle = COLORS.GRAY;
        ctx.fillText('(Your pack is empty)', startX + 20, startY + 80);
    } else {
        for (let i = 0; i < game.player.inventory.length; i++) {
            const item = game.player.inventory[i];
            const y = startY + 60 + i * 25;
            
            const marker = i === game.selectedInventoryIndex ? '>' : ' ';
            const letter = String.fromCharCode(97 + i);
            
            let eq = '';
            if (game.player.equippedWeapon === item) eq = ' [W]';
            else if (game.player.equippedArmor === item) eq = ' [A]';
            else if (game.player.equippedRing === item) eq = ' [R]';
            else if (game.player.equippedAmulet === item) eq = ' [N]';
            
            const text = `${marker} ${letter}) ${item.char} ${item.name}${eq}`;
            
            if (i === game.selectedInventoryIndex) {
                ctx.fillStyle = COLORS.YELLOW;
                ctx.fillRect(startX + 15, y - 15, boxW - 30, 20);
                ctx.fillStyle = COLORS.BLACK;
            } else {
                ctx.fillStyle = COLORS.WHITE;
            }
            
            ctx.fillText(text, startX + 20, y);
        }
    }
    
    // Instructions
    ctx.fillStyle = COLORS.GRAY;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Enter:use | e:equip | d:drop | ESC:close', canvas.width / 2, startY + boxH - 20);
}

function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = COLORS.RED;
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${game.playerName} DIED`, canvas.width / 2, canvas.height / 2 - 50);
    
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '24px monospace';
    ctx.fillText(`Level: ${game.player.level}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillText(`Dungeon: ${game.dungeonLevel}`, canvas.width / 2, canvas.height / 2 + 50);
    ctx.fillText(`Gold: ${game.player.gold}`, canvas.width / 2, canvas.height / 2 + 80);
    
    // Show saving status
    if (db) {
        ctx.fillStyle = COLORS.GREEN;
        ctx.font = '16px monospace';
        ctx.fillText('Score saved to leaderboard!', canvas.width / 2, canvas.height / 2 + 110);
    }
    
    ctx.fillStyle = COLORS.GRAY;
    ctx.font = '18px monospace';
    ctx.fillText('Press F5 to restart', canvas.width / 2, canvas.height / 2 + 150);
}

// Input handling
function handleInput(event) {
    if (game.currentScreen === 'title') {
        handleTitleInput(event);
    } else if (game.currentScreen === 'nameEntry') {
        handleNameEntryInput(event);
    } else if (game.currentScreen === 'leaderboard') {
        handleLeaderboardInput(event);
    } else if (game.currentScreen === 'game') {
        handleGameInput(event);
    } else if (game.currentScreen === 'inventory') {
        handleInventoryInput(event);
    } else if (game.currentScreen === 'gameover') {
        // Game over screen - F5 to restart is handled by browser
    }
}

function handleTitleInput(event) {
    const key = event.key.toLowerCase();
    
    if (key === 'n') {
        showNameEntry();
    } else if (key === 'l') {
        showLeaderboard();
    } else if (key === 'q') {
        window.location.reload();
    }
}

function handleNameEntryInput(event) {
    const key = event.key;
    
    if (key === 'Enter') {
        if (game.nameInput.trim().length > 0) {
            game.playerName = game.nameInput.trim().substring(0, 20);
            startNewGame();
        }
    } else if (key === 'Escape') {
        showTitleScreen();
    } else if (key === 'Backspace') {
        game.nameInput = game.nameInput.slice(0, -1);
    } else if (key.length === 1 && game.nameInput.length < 20) {
        // Only allow letters, numbers, and some symbols
        if (/^[a-zA-Z0-9 _-]$/.test(key)) {
            game.nameInput += key;
        }
    }
    draw();
}

function handleLeaderboardInput(event) {
    if (event.key === 'Escape') {
        showTitleScreen();
    }
}

function handleGameInput(event) {
    const key = event.key;
    let turnTaken = false;
    
    // Quick drink
    if (key === 'q') {
        const potions = game.player.inventory.filter(item => item.itemType === 'HEALTH_POTION');
        if (potions.length > 0) {
            turnTaken = useItem(game.player, potions[0]);
        } else {
            addMessage(`${game.playerName} has no potions to drink!`);
        }
    }
    // Inventory
    else if (key === 'i') {
        openInventory();
        return;
    }
    // Get item
    else if (key === 'g') {
        turnTaken = pickupItem();
    }
    // Descend stairs
    else if (key === '>') {
        turnTaken = descendStairs();
    }
    // Movement
    else if (key === 'ArrowLeft' || key === 'h') {
        turnTaken = tryMove(-1, 0);
    } else if (key === 'ArrowDown' || key === 'j') {
        turnTaken = tryMove(0, 1);
    } else if (key === 'ArrowUp' || key === 'k') {
        turnTaken = tryMove(0, -1);
    } else if (key === 'ArrowRight' || key === 'l') {
        turnTaken = tryMove(1, 0);
    }
    
    if (turnTaken) {
        game.turn++;
        
        // Hunger
        if (game.turn % 40 === 0) {
            game.player.hunger = Math.max(0, game.player.hunger - 1);
            if (game.player.hunger === 20) {
                addMessage(`${game.playerName} is hungry...`);
            } else if (game.player.hunger === 10) {
                addMessage(`${game.playerName} is starving!`);
            } else if (game.player.hunger === 0) {
                game.player.takeDamage(1);
                addMessage(`Starvation weakens ${game.playerName}!`);
            }
        }
        
        // Monster AI
        runMonsterAI();
        
        // Update FOV
        computeFOV();
    }
    
    // Check death
    if (game.player.dead) {
        gameOver();
        return;
    }
    
    draw();
}

function handleInventoryInput(event) {
    const key = event.key;
    
    if (key === 'Escape') {
        closeInventory();
        return;
    } else if (key === 'Enter') {
        const item = game.player.inventory[game.selectedInventoryIndex];
        if (item) {
            useItem(game.player, item);
            closeInventory();
        }
    } else if (key === 'e') {
        const item = game.player.inventory[game.selectedInventoryIndex];
        if (item) {
            equipItem(game.player, item);
            closeInventory();
        }
    } else if (key === 'd') {
        const item = game.player.inventory[game.selectedInventoryIndex];
        if (item) {
            dropItem(game.player, item);
            closeInventory();
        }
    } else if (key === 'ArrowUp' || key === 'k') {
        game.selectedInventoryIndex = Math.max(0, game.selectedInventoryIndex - 1);
    } else if (key === 'ArrowDown' || key === 'j') {
        game.selectedInventoryIndex = Math.min(game.player.inventory.length - 1, game.selectedInventoryIndex);
    }
    
    draw();
}

// Game actions
function tryMove(dx, dy) {
    const newX = game.player.x + dx;
    const newY = game.player.y + dy;
    
    // Check for entities
    const target = getEntityAt(newX, newY);
    if (target && !target.dead) {
        const [msg, killed] = combat(game.player, target);
        addMessage(msg);
        if (killed) {
            if (game.player.gainXp(target.xp)) {
                addMessage(`*** ${game.playerName} leveled up! Now level ${game.player.level}! ***`);
            }
        }
        return true;
    }
    
    // Try to move
    if (game.player.move(dx, dy, game.gameMap)) {
        const tile = game.gameMap[game.player.y][game.player.x];
        if (tile.tileType === 'LAVA') {
            const dmg = game.player.takeDamage(5);
            addMessage(`The lava burns ${game.playerName} for ${dmg} damage!`);
        }
        return true;
    }
    
    return false;
}

function pickupItem() {
    const item = getItemAt(game.player.x, game.player.y);
    if (item) {
        if (item.itemType === 'GOLD') {
            const match = item.description.match(/(\d+)/);
            const amount = match ? parseInt(match[1]) : 10;
            game.player.gold += amount;
            game.items.splice(game.items.indexOf(item), 1);
            addMessage(`${game.playerName} picks up ${amount} gold pieces!`);
            return true;
        } else if (game.player.inventory.length < 26) {
            game.items.splice(game.items.indexOf(item), 1);
            game.player.inventory.push(item);
            addMessage(`${game.playerName} picks up the ${item.name}.`);
            return true;
        } else {
            addMessage(`${game.playerName}'s pack is full!`);
        }
    } else {
        addMessage("Nothing to pick up here.");
    }
    return false;
}

function descendStairs() {
    const tile = game.gameMap[game.player.y][game.player.x];
    if (tile.tileType === 'STAIRS_DOWN') {
        game.dungeonLevel++;
        generateDungeon(game.dungeonLevel);
        
        const startRoom = game.rooms[0];
        const [px, py] = startRoom.center();
        game.player.x = px;
        game.player.y = py;
        game.entities = [game.player];
        
        placeEntities(game.rooms, game.dungeonLevel);
        
        addMessage(`${game.playerName} descends to level ${game.dungeonLevel}!`);
        computeFOV();
        return true;
    } else {
        addMessage("No stairs here.");
    }
    return false;
}

function openInventory() {
    game.inventoryOpen = true;
    game.currentScreen = 'inventory';
    game.selectedInventoryIndex = 0;
    draw();
}

function closeInventory() {
    game.inventoryOpen = false;
    game.currentScreen = 'game';
    draw();
}

function addMessage(msg) {
    game.messages.push(msg);
    if (game.messages.length > 100) {
        game.messages.shift();
    }
}

// FIXED: Game over - async save with error handling
async function gameOver() {
    game.currentScreen = 'gameover';
    game.running = false;
    
    // Save to Firebase leaderboard (async, non-blocking)
    try {
        await saveToLeaderboard(game.playerName, game.player.level, game.dungeonLevel, game.player.gold);
    } catch (error) {
        console.error('Failed to save score:', error);
    }
    
    // Draw game over screen
    draw();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
