import { loadImages, loadSounds, getAssets } from './loader.js';
import {formatTime, stopTimer, resetTimer, startTimer} from './timer.js';
import {update, updateEnemies, checkCoinCollection, updateCoins, checkEnemyCollision, updateProjectiles} from './update.js';
export const variables  = {
    score: 0,
    level: 0,
    lives: 3,
    direction: "+",
    projectiles: [],
    isGameOver: false,
    marioElement: document.getElementById('mario'),
    enemyElements: [],
    coins: [],
    coinElements: [],
    assets: {},
    mario: {
        x: 50,
        y: 470,
        width: 80,
        height: 80,
        dy: 0,
        jumpPower: 17,
        isJumping: false,
        speed: 9,
        movingRight: false
    },
    enemies: [],
    pipes: [],
    blocks: [],
    gameLength: 6000,
    distanceTraveled: 0,
    cameraOffset: mario.x - window.innerWidth / 2 + mario.width / 2
};
export const timerState = {
    isTimerRunning: false,
    timerInterval: null,
    secondsElapsed: 0,
    isPaused: false,
    timerElement: document.getElementById('timer')
};
loadImages(() => {
    variables.assets = getAssets();
    resetGame();
    gameLoop();
});
loadSounds();

///////////////////// Timer Control via Key Press ///////////////////////
document.addEventListener('keydown', (event) => {
    if (!timerState.isTimerRunning) {
        startTimer();
    }
});

/////////////////////////////Block///////////////////////////////////
function generateBlocks() {
    const blockWidth = 200; 
    const blockHeight = 50;
    const totalBlocks = Math.ceil(variables.gameLength / blockWidth);

    for (let i = 0; i <= totalBlocks; i++) {
        variables.blocks.push({ x: i * blockWidth - 400, y: 550, width: blockWidth, height: blockHeight });
    }
}

function addBlock(x, y, width, height) {
    variables.blocks.push({ x, y, width, height });
}

/////////////////////////////Bullet///////////////////////////////////
// Projectile constructor with direction
function Projectile(x, y, d) {
    this.x = x;
    this.y = y;
    this.width = 20; 
    this.height = 20;
    this.speed = 5;
    this.direction = d;
}

// Shooting projectiles in Mario's current direction
document.addEventListener('keydown', (e) => {
    if (timerState.isPaused) return;
    if (e.key === ' ') {
        const projectileY = variables.mario.y + variables.mario.height / 2;
        const newProjectile = new Projectile(variables.mario.x + variables.mario.width / 2, projectileY, variables.direction); // Pass Mario's direction
        variables.projectiles.push(newProjectile);
    }
});

///////////////////////////////////////draw objects that has no html elements//////////////////////////////////////////////
function drawProjectiles() {
    variables.projectiles.forEach((projectile, index) => {
        let projectileElement = document.getElementById(`projectile-${index}`);
        if (!projectileElement) {
            projectileElement = document.createElement('div');
            projectileElement.id = `projectile-${index}`;
            projectileElement.classList.add('projectile');
            projectileElement.style.backgroundImage = "url('assets/images/bullet.png')";
            projectileElement.style.position = 'absolute';
            projectileElement.style.width = projectile.width + 'px';
            projectileElement.style.height = projectile.height + 'px';
            document.body.appendChild(projectileElement);
        }
        projectileElement.style.left = (projectile.x - variables.cameraOffset) + 'px';
        projectileElement.style.top = projectile.y + 'px';
    });
}

function drawPipes() {
    variables.pipes.forEach((pipe, index) => {
        let pipeElement = document.getElementById(`pipe-${index}`);
        if (!pipeElement) {
            pipeElement = document.createElement('div');
            pipeElement.id = `pipe-${index}`;
            pipeElement.classList.add('pipe');

            if (variables.assets.images[pipe.image]) {
                pipeElement.style.backgroundImage = `url('${variables.assets.images[pipe.image].src}')`;
                pipeElement.style.backgroundSize = '100% 100%'; 
                pipeElement.style.backgroundRepeat = 'no-repeat'; 
            } else {
                console.error(`Image not found: ${pipe.image}`);
            }
            pipeElement.style.position = 'absolute';
            pipeElement.style.width = pipe.width + 'px';
            pipeElement.style.height = pipe.height + 'px';
            document.body.appendChild(pipeElement);
        }
        pipeElement.style.left = (pipe.x - variables.cameraOffset) + 'px';
        pipeElement.style.top = pipe.y + 'px';
    });
}

// Draw Blocks
function drawBlocks() {
    variables.blocks.forEach((block, index) => {
        let blockElement = document.getElementById(`block-${index}`);
        if (!blockElement) {
            blockElement = document.createElement('div');
            blockElement.id = `block-${index}`;
            blockElement.classList.add('block');
            blockElement.style.backgroundImage = `url('${variables.assets.images['block.png'].src}')`;
            blockElement.style.position = 'absolute';
            blockElement.style.width = block.width + 'px';
            blockElement.style.height = block.height + 'px';
            document.body.appendChild(blockElement);
        }
        blockElement.style.left = (block.x - variables.cameraOffset) + 'px';
        blockElement.style.top = block.y + 'px';
    });
}

// Draw Background
function drawBackground() {
    // Background
    const backgroundElement = document.getElementById('background');
    if (backgroundElement) {
        backgroundElement.style.zIndex = 1;
    }

    // Moon
    const moonElement = document.getElementById('moon');
    if (moonElement) {
        moonElement.style.left = '1000px';
        moonElement.style.top = '20px';
        moonElement.style.opacity = 0.5;
    }

    // Bus Stop
    const busStopElement = document.getElementById('busStop');
    if (busStopElement) {
        busStopElement.style.left = `${50 - variables.cameraOffset}px`;
        busStopElement.style.top = '350px';
    }

    // Friend
    const friendElement = document.getElementById('friend');
    if (friendElement) {
        friendElement.style.left = `${variables.gameLength - 600 - variables.cameraOffset}px`;
        friendElement.style.top = '400px';
    }
}

// Render Hearts
function renderHearts() {
    const heartsContainer = document.getElementById('hearts');
    heartsContainer.innerHTML = '';  
    
    for (let i = 0; i < variables.lives; i++) {
        const heartElement = document.createElement('img');
        heartElement.src = 'assets/images/heart.png';
        heartElement.alt = 'Heart';  
        heartElement.classList.add('heart');  
        heartsContainer.appendChild(heartElement);
    }
}

// Add Enemies and Pipes 
function spawnEnemiesAndPipes(speed = 4, enemyX, enemyY, enemyImage, enemyW = 100, enemyH = 100, canMove = true, pipeX, pipeY, pipeImage, pipeW = 100, pipeH = 100) {
    // Add an enemy
    if (enemyX !== undefined && enemyY !== undefined) {
        const newEnemy = { x: enemyX, y: enemyY, width: enemyW, height: enemyH, canMove, s: speed, image: enemyImage }; 
        variables.enemies.push(newEnemy);
        
        const enemyHtmlElement = document.createElement('div');
        enemyHtmlElement.className = 'enemy';
        enemyHtmlElement.style.position = 'absolute';
        enemyHtmlElement.style.width = `${newEnemy.width}px`;
        enemyHtmlElement.style.height = `${newEnemy.height}px`;
        enemyHtmlElement.style.backgroundImage = `url("${enemyImage}")`;  
        enemyHtmlElement.style.backgroundSize = 'contain';
        enemyHtmlElement.style.backgroundRepeat = 'no-repeat';  
        enemyHtmlElement.style.backgroundPosition = 'center'; 
        enemyHtmlElement.style.left = `${newEnemy.x - variables.cameraOffset}px`;
        enemyHtmlElement.style.top = `${newEnemy.y}px`;
        document.body.appendChild(enemyHtmlElement);
        variables.enemyElements.push(enemyHtmlElement);
    }
    // Add a pipe 
    if (pipeX !== undefined && pipeY !== undefined) {
        const newPipe = { x: pipeX, y: pipeY, width: pipeW, height: pipeH, image: pipeImage };
        variables.pipes.push(newPipe);
    }
}

// Reset Game 
export function resetGame() {
    console.log("level "+variables.level)
    variables.mario.movingRight = false;
    variables.mario.movingLeft = false;
    variables.mario.x = 50;
    variables.mario.y = 470;
    variables.mario.isJumping = false;
    variables.enemies = [];
    variables.pipes = [];
    variables.enemyElements.forEach(element => element.remove());
    variables.coins = [];
    variables.coinElements.forEach(element => element.remove());
    variables.coinElements.length = 0;
    variables.enemyElements.length = 0;
    variables.distanceTraveled = 0; 
    variables.blocks.length = 0; 
    loadLevel();
    renderHearts();
    generateBlocks();
    clearInterval(timerState.timerInterval);
    timerState.secondsElapsed = 0;
    timerState.isTimerRunning = false;
    document.getElementById('timer').innerText = "Timer : " + formatTime(timerState.secondsElapsed);
}

// Game Loop 
function gameLoop() {
    if (timerState.isPaused) return;
    const existingProjectiles = document.querySelectorAll('.projectile');
    existingProjectiles.forEach(projectile => projectile.remove());
    const existingBlocks = document.querySelectorAll('.block');
    existingBlocks.forEach(block => block.remove());
    const existingPipes = document.querySelectorAll('.pipe');
    existingPipes.forEach(pipe => pipe.remove());
    drawBackground(); 
    drawBlocks();  
    drawPipes();   
    updateProjectiles();
    drawProjectiles();  
    renderHearts();  
    updateCoins();   
    checkCoinCollection(); 
    update();
    checkEnemyCollision();
    requestAnimationFrame(gameLoop);
}
document.addEventListener('keydown', (e) => {
    if (timerState.isPaused) return;
    if ((e.key === 'ArrowUp' || e.key === 'w') && !variables.mario.isJumping ) {
        variables.mario.dy = -variables.mario.jumpPower;
        variables.mario.isJumping = true;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        variables.mario.movingRight = true; 
        variables.direction = "+";
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        variables.mario.movingLeft = true; 
        variables.direction = "-";
    }
});

// Handle Keyup
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') {
        variables.mario.movingRight = false; 
    }

    if (e.key === 'ArrowLeft' || e.key === 'a') {
        variables.mario.movingLeft = false; 
    }
});

// Handle Restart Button
document.getElementById('restartButton').addEventListener('click', () => {
    if (timerState.isPaused){
        timerState.isPaused = false;
        document.getElementById('pause').style.display = 'none';
        document.getElementById('resume').style.display = 'block';
        gameLoop();
    }
    resetGame();
});


// Pause/Resume Game
document.getElementById('pauseButton').addEventListener('click', () => {
    timerState.isPaused = !timerState.isPaused;  // Toggle pause state
    if (timerState.isPaused) {
        document.getElementById('pause').style.display = 'block';
        document.getElementById('resume').style.display = 'none';
        stopTimer(); // Pause the timer
    } else {
        document.getElementById('pause').style.display = 'none';
        document.getElementById('resume').style.display = 'block';
        gameLoop(); // Resume game loop
        startTimer(); // Start timer
    }
});

// Add Coin Function
function addCoin(x, y) {
    variables.coins.push({ x: x, y: y, width: 30, height: 30 }); // Add coin to the coins array
    const coinElement = document.createElement('div');
    coinElement.className = 'coin';
    coinElement.style.position = 'absolute';
    coinElement.style.width = '30px';
    coinElement.style.height = '30px';
    coinElement.style.backgroundImage = 'url("assets/images/coin.gif")';
    coinElement.style.backgroundSize = 'cover';
    coinElement.style.left = `${x - variables.cameraOffset}px`;
    coinElement.style.top = `${y}px`;
    document.body.appendChild(coinElement);
    variables.coinElements.push(coinElement); 
    console.log("coin added");
}

///////////////////////level designing/////////////////////////
function loadLevel() {
    if (variables.level === 0) {
        variables.gameLength = 8000;
    
        const startX = 1000;
        const startY = 500;
        const blockWidth = 170;
        const blockHeight = 50;
        const stepHeight = 40;
        const numberOfSteps = 5;
         
        let highestY;
        
        // Up Stair with coins
        for (let i = 0; i < numberOfSteps; i++) {
            const x = startX + (i * 60);
            const y = startY - (i * stepHeight);
            addBlock(x, y, blockWidth-i, blockHeight);
            
            // Track the highest point (last Y position)
            highestY = y; 
            
            if (i === numberOfSteps - 1) {
                addCoin(x + 10, y - 30);
                addCoin(x + 40, y - 30);
                addCoin(x + 70, y - 30);
                addCoin(x + 100, y - 30);
            } else {
                addCoin(x + 10, y - 30);
            }
        }
        
        // Down stair without coins
        const startX2 = 1350;
        const startY2 = highestY;
        
        for (let i = 0; i < numberOfSteps; i++) {
            const x = startX2 + (i * 60);
            const y = startY2 + (i * stepHeight);
            addBlock(x, y, blockWidth-i, blockHeight);
        
            // add coins on the top block
            if (i === 0) {
                addCoin(x + 20, y -30);
                addCoin(x + 50, y - 30);
                addCoin(x + 80, y - 30);
                addCoin(x + 110, y - 30);
            }
        }
        
        //                     speed     x    y          image                w   h   move?   x    y      image        w          h
        spawnEnemiesAndPipes(undefined,1680, 50, 'assets/images/plane.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        for (let x = 2100; x <= 2250; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        for (let x = 2550; x <= 2750; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        for (let x = 3150; x <= 3350; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 3700, 450, 'water.png', 100, 100);

        for (let x = 4000; x <= 4150; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        for (let x = 4550; x <= 4750; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 5000, 450, 'water.png', 100, 100);

        spawnEnemiesAndPipes(6,5250, 400, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);

        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 5400, 450, 'water.png', 100, 100);

        addBlock(5700, 290, 150, 50);
        addCoin(5720, 260);
        addCoin(5800, 260);
        addBlock(5900, 360, 150, 50); 
        addBlock(6100, 290, 150, 50);
        addCoin(6120, 260);
        addCoin(6200, 260);
        addBlock(6300, 420, 150, 50);

        for (let x = 5550; x <= 6600; x += 50) {
             spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 6700, 400, 'bus.png', 300, 150);

    } else if (variables.level === 1) {
        variables.gameLength =  6000; 
        ///////////////////////add coins/////////////////////////
        for (let x = 1500; x <= 1950; x += 50) {
            //      x    y
            addCoin(x, 150);
        }
        for (let x = 1200; x <= 1650; x += 50) {
            addCoin(x, 300);
        }
        for (let x = 1000; x <= 1400; x += 50) {
            addCoin(x, 455);
        }
        for (let x = 1450; x <= 1650; x += 50) {
            addCoin(x, 455);
        }
        for (let x = 1700; x <= 2100; x += 50) {
            addCoin(x, 455);
        }
        for (let x = 2300; x <= 2500; x += 50) {
            addCoin(x, 455);
        }
        for (let x = 2650; x <= 5000; x += 50) {
            addCoin(x, 400);
        }
        //////////////////add block///////////////////
        //        x      y    w   h
        addBlock(1000, 500, 200, 50);
        addBlock(1200, 500, 200, 50); 
        addBlock(1900, 500, 200, 50); 
        addBlock(2350, 500, 200, 50);
        addBlock(4600, 500, 200, 50);
        addBlock(4800, 500, 200, 50);
        addBlock(4800, 450, 200, 50);
        addBlock(1200, 350, 200, 50);
        addBlock(1400, 350, 200, 50); 
        addBlock(1600, 350, 200, 50);
        addBlock(1400, 200, 200, 50);
        addBlock(1900, 200, 200, 50);
        addBlock(3400, 80, 200, 50);
        //////////////////add enemies and pipes///////////////////

    //                     speed     x    y          image                w   h   move?   x    y      image        w          h
    spawnEnemiesAndPipes(undefined,1400, 430, 'assets/images/plane.png', 120, 120, true, 500, 450, 'pipe.png', undefined, undefined);
    spawnEnemiesAndPipes(undefined,870, 430, 'assets/images/plane.png', 120, 120, true, 400, 450, 'pipe.png', undefined, undefined);
    spawnEnemiesAndPipes(undefined,3000, 50, 'assets/images/plane.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,2150, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,2200, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 2650, 450, 'car.png', 200, undefined);
    spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 3300, 450, 'car.png', 200, undefined);
    spawnEnemiesAndPipes(undefined,2850, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,2900, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,2950, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,2950, 440, 'assets/images/plane.png', undefined, undefined, true, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,4400, 440, 'assets/images/plane.png', undefined, undefined, true, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,3700, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,4000, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
    spawnEnemiesAndPipes(undefined,4300, 450, 'assets/images/fire.gif', undefined, undefined, false, undefined, undefined, undefined, undefined, undefined);
        
    } else if (variables.level === 2) {
        variables.gameLength =  9000; 


        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 450, 450, 'car.png', 200, undefined);
        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 800, 330, 'promo.png', 120, 220);
        addBlock(1000, 500, 150, 50); 
        addBlock(1400, 360, 150, 50); 
        addBlock(1600, 290, 150, 50); 
        addBlock(1900, 290, 150, 50); 
        addBlock(2000, 150, 150, 50); 
        addBlock(2800, 500, 150, 50); 
        addBlock(2950, 450, 150, 50); 
        addBlock(3100, 400, 150, 50); 
        addBlock(3600, 300, 150, 50); 
        for (let x = 1150; x <= 2200; x += 50) {
        spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }
        for (let x = 2850; x <= 5400; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }
        spawnEnemiesAndPipes(undefined,1475, 280, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined,2075, 70, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(4,2300, 200, 'assets/images/plane.png', 220, 220, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(6,2200, 400, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined,3800, 200, 'assets/images/alion2.png', 220, 220, false, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined,3950, 300, 'assets/images/alion2.png', 120, 120, false, undefined, undefined, undefined, undefined, undefined);
        addBlock(4100, 270, 150, 50); 
        addBlock(4500, 370, 150, 50); 
        addBlock(4800, 370, 150, 50);
        addBlock(4950, 370, 150, 50);
        addBlock(5200, 200, 150, 50);  
        spawnEnemiesAndPipes(6,4500, 220, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(6,6700, 30, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(6,6300, 380, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(3,7200, 440, 'assets/images/plane.png', undefined, undefined, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(3,7700, 440, 'assets/images/plane.png', undefined, undefined, true, undefined, undefined, undefined, undefined, undefined);
        addBlock(5800, 330, 150, 50);
        addBlock(5900, 500, 150, 50);
        addBlock(6100, 320, 150, 50);
        addBlock(6300, 170, 150, 50);

    } else if (variables.level === 3){
        variables.gameLength = 9000;

        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 600, 450, 'water.png', 100, 100);
        spawnEnemiesAndPipes(6,1600, 210, 'assets/images/plane.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(6,1500, 420, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 1600, 450, 'water.png', 100, 100);
        spawnEnemiesAndPipes(6,1700, 420, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);

        for (let x = 1800; x <= 2000; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        const startX = 2200;
        const startY = 500;
        const blockWidth = 170;
        const blockHeight = 50;
        const stepHeight = 40;
        const numberOfSteps = 5;
         
        let highestY;
        
        // Up Stair with coins
        for (let i = 0; i < numberOfSteps; i++) {
            const x = startX + (i * 60);
            const y = startY - (i * stepHeight);
            addBlock(x, y, blockWidth-i, blockHeight);
            
            // Track the highest point (last Y position)
            highestY = y; 
            
            if (i === numberOfSteps - 1) {
                addCoin(x + 10, y - 30);
                addCoin(x + 40, y - 30);
                addCoin(x + 70, y - 30);
                addCoin(x + 100, y - 30);
            } else {
                addCoin(x + 10, y - 30);
            }
        }
        
        // Down stair without coins
        const startX2 = 2500;
        const startY2 = highestY;
        
        for (let i = 0; i < numberOfSteps; i++) {
            const x = startX2 + (i * 60);
            const y = startY2 + (i * stepHeight);
            addBlock(x, y, blockWidth-i, blockHeight);
        
            // add an enemy on the top block
            if (i === 0) {
                spawnEnemiesAndPipes(4,2500, highestY, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
            } else if (i === 4) {
                spawnEnemiesAndPipes(4,2700, highestY, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
            }
        }

        spawnEnemiesAndPipes(6,2500, 180, 'assets/images/plane.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);

        for (let x = 3000; x <= 4000; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

        addBlock(2800, 290, 150, 50);
        addCoin(2820, 260);
        addCoin(2900, 260);
        addBlock(3150, 360, 150, 50); 
        addBlock(3500, 290, 150, 50);
        addCoin(3520, 260);
        addCoin(3600, 260);
        addBlock(3750, 420, 150, 50);

        spawnEnemiesAndPipes(6,4550, 350, 'assets/images/gost3.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 4590, 450, 'water.png', 100, 100);
        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 4700, 350, 'car.png', 200, 200);

        spawnEnemiesAndPipes(6,4900, 350, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);

        let startX3 = 5000;
        let blockWidth3 = 150;
        let numberOfSteps3 = 6;
                 
        // Up Stair with coins
        for (let i = 0; i < numberOfSteps3; i++) {
            const x = startX3 + (i * 60);
            const y = startY - (i * stepHeight);
            addBlock(x, y, blockWidth3-i, blockHeight);
            
            if (i === numberOfSteps3 - 1) {
                addCoin(x + 10, y - 30);
                addCoin(x + 40, y - 30);
                addCoin(x + 70, y - 30);
                addCoin(x + 100, y - 30);
            } else {
                addCoin(x + 10, y - 30);
            }
        }

        spawnEnemiesAndPipes(6,5800, 220, 'assets/images/alion2.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);

        spawnEnemiesAndPipes(6,6100, 430, 'assets/images/alion3.png', 120, 120, false, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(6,6450, 430, 'assets/images/alion3.png', 120, 120, false, undefined, undefined, undefined, undefined, undefined);


        for (let x = 6700; x <= 6900; x += 50) {
            spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }

       for (let x = 7200; x <= 7400; x += 50) {
           spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
       }

       for (let x = 7700; x <= 7800; x += 50) {
           spawnEnemiesAndPipes(undefined,x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
       }
    }else if (variables.level === 4) {
        variables.gameLength = 9000;
    
        spawnEnemiesAndPipes(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 600, 450, 'water.png', 100, 100);
        spawnEnemiesAndPipes(8, 1600, 210, 'assets/images/plane.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(8, 1500, 420, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1600, 450, 'water.png', 100, 100);
        spawnEnemiesAndPipes(8, 1700, 420, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
    
        for (let x = 1800; x <= 2000; x += 50) {
            spawnEnemiesAndPipes(undefined, x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }
    
        const startX = 2200;
        const startY = 500;
        const blockWidth = 170;
        const blockHeight = 50;
        const stepHeight = 40;
        const numberOfSteps = 6; 
    
        let highestY;
    

        for (let i = 0; i < numberOfSteps; i++) {
            const x = startX + (i * 60);
            const y = startY - (i * stepHeight);
            addBlock(x, y, blockWidth - i, blockHeight);
    
            highestY = y;
    
            if (i === numberOfSteps - 1) {
                addCoin(x + 10, y - 30);
                addCoin(x + 40, y - 30);
                addCoin(x + 70, y - 30);
                addCoin(x + 100, y - 30);
            } else {
                addCoin(x + 10, y - 30);
            }
        }
    
        const startX2 = 2500;
        const startY2 = highestY;
    
        for (let i = 0; i < numberOfSteps; i++) {
            const x = startX2 + (i * 60);
            const y = startY2 + (i * stepHeight);
            addBlock(x, y, blockWidth - i, blockHeight);
    
            spawnEnemiesAndPipes(5, x + 20, y - 50, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        }
    
        for (let x = 3000; x <= 4000; x += 50) {
            spawnEnemiesAndPipes(undefined, x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }
    
        addBlock(2800, 290, 150, 50);
        addCoin(2820, 260);
        addCoin(2900, 260);
        addBlock(3150, 360, 150, 50);
        addBlock(3500, 290, 150, 50);
        addCoin(3520, 260);
        addCoin(3600, 260);
        addBlock(3750, 420, 150, 50);
    
        spawnEnemiesAndPipes(8, 4550, 350, 'assets/images/gost3.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 4590, 450, 'water.png', 100, 100);
        spawnEnemiesAndPipes(undefined, undefined, undefined, undefined, undefined, undefined, undefined, 4700, 350, 'car.png', 200, 200);
    
        spawnEnemiesAndPipes(8, 4900, 350, 'assets/images/alion.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
    
        let startX3 = 5000;
        let blockWidth3 = 150;
        let numberOfSteps3 = 6;
    
        for (let i = 0; i < numberOfSteps3; i++) {
            const x = startX3 + (i * 60);
            const y = startY - (i * stepHeight);
            addBlock(x, y, blockWidth3 - i, blockHeight);
    
            if (i === numberOfSteps3 - 1) {
                addCoin(x + 10, y - 30);
                addCoin(x + 40, y - 30);
                addCoin(x + 70, y - 30);
                addCoin(x + 100, y - 30);
            } else {
                addCoin(x + 10, y - 30);
            }
        }
    
        spawnEnemiesAndPipes(8, 5800, 220, 'assets/images/alion2.png', 120, 120, true, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(8, 6100, 430, 'assets/images/alion3.png', 120, 120, false, undefined, undefined, undefined, undefined, undefined);
        spawnEnemiesAndPipes(8, 6450, 430, 'assets/images/alion3.png', 120, 120, false, undefined, undefined, undefined, undefined, undefined);
    
        for (let x = 6700; x <= 6900; x += 30) {
            spawnEnemiesAndPipes(undefined, x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }
    
        for (let x = 7200; x <= 7400; x += 30) {
            spawnEnemiesAndPipes(undefined, x, 470, 'assets/images/fire.gif', 80, 80, false, undefined, undefined, undefined, undefined, undefined);
        }
    }

}