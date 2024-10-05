import { loadImages, loadSounds, getAssets } from './loader.js';
let score = 0;
let level = 0; /////////////////////////////////////choose level to code///////////////////////////////////////
let lives = 3; 
let direction = "+";
let projectiles = [];
// const canvas = document.getElementById('gameCanvas');
// const ctx = canvas.getContext('2d');
// let cameraOffset = 0;
let isPaused = false;
let isGameOver = false;
let secondsElapsed = 0;
let isTimerRunning = false; // To track if the timer has started
const timerElement = document.getElementById('timer');
let timerInterval;


// ensure that the game take the whole width
// function resizeCanvas() {
//     canvas.width = window.innerWidth;
//     canvas.height = window.innerHeight;
// }

// resizeCanvas();

const marioElement = document.getElementById('mario');
const enemyElements = [];
let coins = [];
const coinElements = [];
let assets = {};
const mario = {
    x: 50,
    y: 470,
    width: 80,
    height: 80,
    dy: 0,
    jumpPower: 17,
    isJumping: false,
    speed: 9,
    movingRight: false,
};
let enemies = [];
let pipes = [];
const blocks = [];
let gameLength =  6000; 
let distanceTraveled = 0; 
let cameraOffset = mario.x - window.innerWidth / 2 + mario.width / 2;

loadImages(() => {
    assets = getAssets();
    resetGame();
    gameLoop();
});
loadSounds();




//////////////////////////////Timer////////////////////////////////////
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

function startTimer() {
    if (!isTimerRunning) {
        isTimerRunning = true;
        timerInterval = setInterval(() => {
            if (!isPaused) {
                secondsElapsed++; // Increment by 1 second
                timerElement.innerText = "Timer: " + formatTime(secondsElapsed);
            }
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;
}

function resetTimer() {
    clearInterval(timerInterval);
    secondsElapsed = 0;
    timerElement.innerText = "Timer: " + formatTime(secondsElapsed);
    isTimerRunning = false;
}

///////////////////// Timer Control via Key Press ///////////////////////
document.addEventListener('keydown', (event) => {
    if (!isTimerRunning) {
        startTimer();
    }
});

/////////////////////////////Block///////////////////////////////////
function generateBlocks() {
    const blockWidth = 200; 
    const blockHeight = 50;
    const totalBlocks = Math.ceil(gameLength / blockWidth);

    for (let i = 0; i <= totalBlocks; i++) {
        blocks.push({ x: i * blockWidth - 400, y: 550, width: blockWidth, height: blockHeight });
    }
}

function addBlock(x, y, width, height) {
    blocks.push({ x: x, y: y, width: width, height: height });
}



/////////////////////////////Bullet///////////////////////////////////

// Projectile constructor with direction
function projectile(x, y, d) {
    this.x = x;
    this.y = y;
    this.width = 20; 
    this.height = 20;
    this.speed = 5;
    this.direction = d;
}

// Shooting projectiles in Mario's current direction
document.addEventListener('keydown', (e) => {
    if (isPaused) return;
    if (e.key === ' ') { // Spacebar to shoot
        const projectileY = mario.y + mario.height / 2; // Start projectile at Mario's height
        const newProjectile = new projectile(mario.x + mario.width / 2, projectileY, direction); // Pass Mario's direction
        projectiles.push(newProjectile);
        assets.sounds.shoot.play();
    }
});

// bullet movement
function updateProjectiles() {

    projectiles.forEach((projectile, index) => {
        // Move bullet in the direction it's fired
        if (projectile.direction === "+") {
            projectile.x += projectile.speed; // Move right
        } else if (projectile.direction === "-") {
            projectile.x -= projectile.speed; // Move left
        }

        // Check for collisions with enemies
        enemies.forEach((enemy, enemyIndex) => {
            if (projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y) {
                // Collision detected with enemy
                if (enemy.image !== "assets/images/fire.gif") { // Only remove if not a fire enemy
                    const enemyElement = enemyElements[enemyIndex];
                    enemies.splice(enemyIndex, 1); // Remove enemy from array
                    enemyElement.remove(); // Remove enemy from DOM
                    enemyElements.splice(enemyIndex, 1); // Remove element from reference array
                }
                projectiles.splice(index, 1); // Remove projectile on hit
                return; 
            }
        });

         // bullet cant pass block or pipe
        blocks.forEach((block, blockIndex) => {
            if (projectile.x < block.x + block.width &&
                projectile.x + projectile.width > block.x &&
                projectile.y < block.y + block.height &&
                projectile.y + projectile.height > block.y) {
                projectiles.splice(index, 1); // Remove projectile on block hit
                return; 
            }
        });

        pipes.forEach((pipe, pipeIndex) => {
            if (projectile.x < pipe.x + pipe.width &&
                projectile.x + projectile.width > pipe.x &&
                projectile.y < pipe.y + pipe.height &&
                projectile.y + projectile.height > pipe.y) {
                projectiles.splice(index, 1); // Remove projectile on pipe hit
                return; 
            }
        });

        // Remove projectile if it goes off the screen
        // projectiles.forEach((projectile, index) => {
        //     projectile.x += projectile.speed; 
        //     if (projectile.x > gameLength) { 
        //         projectiles.splice(index, 1); 
        //     }
        // });
        if (projectile.x > gameLength || projectile.x < 0) {
            projectiles.splice(index, 1); // Remove projectile
        }
    });
}





///////////////////////////////////////draw objects that has no html elements//////////////////////////////////////////////
// function drawProjectiles() {
//     ctx.globalAlpha = 1; 
//     projectiles.forEach(projectile => {
//         ctx.drawImage(assets.images['bullet.png'], projectile.x - cameraOffset, projectile.y, projectile.width, projectile.height);
//     });

// }

function drawProjectiles() {
    projectiles.forEach((projectile, index) => {
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

        // Update projectile position
        projectileElement.style.left = (projectile.x - cameraOffset) + 'px';
        projectileElement.style.top = projectile.y + 'px';
    });
}


// function drawPipes() {
//     pipes.forEach(pipe => {
//         ctx.globalAlpha = 1;
//         ctx.drawImage(assets.images[`${pipe.image}`], pipe.x - cameraOffset, pipe.y, pipe.width, pipe.height);
//     });
// }

function drawPipes() {
    pipes.forEach((pipe, index) => {
        let pipeElement = document.getElementById(`pipe-${index}`);

        if (!pipeElement) {
            pipeElement = document.createElement('div');
            pipeElement.id = `pipe-${index}`;
            pipeElement.classList.add('pipe');

            // Use the loaded pipe image from assets
            if (assets.images[pipe.image]) {
                pipeElement.style.backgroundImage = `url('${assets.images[pipe.image].src}')`;
                pipeElement.style.backgroundSize = '100% 100%'; // Ensure the image covers the full div
                pipeElement.style.backgroundRepeat = 'no-repeat'; // Prevent image repetition
            } else {
                console.error(`Image not found: ${pipe.image}`);
            }

            pipeElement.style.position = 'absolute';
            pipeElement.style.width = pipe.width + 'px';
            pipeElement.style.height = pipe.height + 'px';
            document.body.appendChild(pipeElement);
        }

        // Update pipe position
        pipeElement.style.left = (pipe.x - cameraOffset) + 'px';
        pipeElement.style.top = pipe.y + 'px';
    });
}




// function drawBlocks() {
//     blocks.forEach(block => {
//         ctx.globalAlpha = 1;
//         // if (level !== 2) {
//         ctx.drawImage(assets.images['block.png'], block.x - cameraOffset, block.y, block.width, block.height);
//         // } else {
//         //     ctx.drawImage(assets.images['block1.png'], block.x - cameraOffset, block.y, block.width, block.height);    
//         // }
//     });
// }

function drawBlocks() {
    blocks.forEach((block, index) => {
        let blockElement = document.getElementById(`block-${index}`);

        if (!blockElement) {
            blockElement = document.createElement('div');
            blockElement.id = `block-${index}`;
            blockElement.classList.add('block');
            blockElement.style.backgroundImage = `url('${assets.images['block.png'].src}')`;
            blockElement.style.position = 'absolute';
            blockElement.style.width = block.width + 'px';
            blockElement.style.height = block.height + 'px';
            document.body.appendChild(blockElement);
        }

        // Update block position
        blockElement.style.left = (block.x - cameraOffset) + 'px';
        blockElement.style.top = block.y + 'px';
    });
}


//objects can't move
// function drawBackground() {
//     ctx.drawImage(assets.images['background.png'], 0, 0, canvas.width, canvas.height);
//     const moonImage = new Image();
//     moonImage.src = "assets/images/moon.png"; 
//     ctx.globalAlpha = 0.5; //transparency
//     ctx.drawImage(moonImage, 600, 20, 150, 150);
//     ctx.globalAlpha = 1;
//     const busStopImage = new Image();
//     busStopImage.src = "assets/images/busStop.png";
//     ctx.drawImage(busStopImage, 50 - cameraOffset, 350, 300, 200); 
//     const friendImage = new Image();
//     friendImage.src = "assets/images/friend1.png";
//     ctx.drawImage(friendImage, gameLength - 600 - cameraOffset, 400, 80, 150); 
// }

function drawBackground() {
    // Background
    const backgroundElement = document.getElementById('background');
    if (backgroundElement) {
        // backgroundElement.style.backgroundImage = `url('${assets.images['background.png'].src}')`;
        backgroundElement.style.zIndex = 1;
    }

    // Moon
    const moonElement = document.getElementById('moon');
    if (moonElement) {
        moonElement.style.left = '600px';
        moonElement.style.top = '20px';
        moonElement.style.opacity = 0.5;
    }

    // Bus Stop
    const busStopElement = document.getElementById('busStop');
    if (busStopElement) {
        busStopElement.style.left = `${50 - cameraOffset}px`;
        busStopElement.style.top = '350px';
    }

    // Friend
    const friendElement = document.getElementById('friend');
    if (friendElement) {
        friendElement.style.left = `${gameLength - 600 - cameraOffset}px`;
        friendElement.style.top = '400px';
    }
}




//Render Hearts
function renderHearts() {
    const heartsContainer = document.getElementById('hearts');
    heartsContainer.innerHTML = '';  
    
    for (let i = 0; i < lives; i++) {
        const heartElement = document.createElement('img');
        heartElement.src = 'assets/images/heart.png';
        heartElement.alt = 'Heart';  
        heartElement.classList.add('heart');  
        heartsContainer.appendChild(heartElement);
    }
}





///////////////////////////////////////update//////////////////////////////////////////////
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        if (enemy.x >= cameraOffset && enemy.x <= cameraOffset + window.innerWidth + 200) {
            if (enemy.image !== 'assets/images/fire.gif' && enemy.image !== 'assets/images/plane.png' && enemy.image !== 'assets/images/alion3.png') {
                enemy.verticalOffset = Math.sin(Date.now() / 300) * 1; // Moves up and down 
                enemy.y += enemy.verticalOffset;
            }
            if (enemy.canMove) {
                let originalX = enemy.x;
                // Update enemy position based on Mario's position
                if (enemy.x < mario.x) {
                    enemy.x += enemy.s; // Move right
                } else {
                    enemy.x -= enemy.s; // Move left
                }

                // Check for collision with blocks and pipes
                blocks.forEach(block => {
                    if (enemy.x + enemy.width > block.x &&
                        enemy.x < block.x + block.width &&
                        enemy.y + enemy.height > block.y &&
                        enemy.y < block.y + block.height) {
                        if (originalX < block.x) {
                            enemy.x = block.x - enemy.width; // Move enemy to the left of the block
                        } else {
                            enemy.x = block.x + block.width; // Move enemy to the right of the block
                        }
                    }
                });
                pipes.forEach(pipe => {
                    if (enemy.x + enemy.width > pipe.x &&
                        enemy.x < pipe.x + pipe.width &&
                        enemy.y + enemy.height > pipe.y &&
                        enemy.y < pipe.y + pipe.height) {
                        if (originalX < pipe.x) {
                            enemy.x = pipe.x - enemy.width; // Move enemy to the left of the pipe
                        } else {
                            enemy.x = pipe.x + pipe.width; // Move enemy to the right of the pipe
                        }
                    }
                });
            }
        }




        // Update enemy position in the DOM
        if (enemyElements[index]) {
            enemyElements[index].style.left = `${enemy.x - cameraOffset}px`;
            enemyElements[index].style.top = `${enemy.y}px`;
            if (enemy.x >= cameraOffset && enemy.x <= cameraOffset + window.innerWidth) {
                enemyElements[index].style.display = 'block';
            } else {
                enemyElements[index].style.display = 'none';
            }
        }
    });
}



function update() {
    //////////jumping collision check
    if (mario.isJumping) {
        mario.dy += 0.7; //Apply gravity
        mario.y += mario.dy;
        let landed = false;

        // Check collisions with blocks
        blocks.forEach(block => {
            if (mario.x + mario.width > block.x &&
                mario.x < block.x + block.width &&
                mario.y + mario.height >= block.y &&
                mario.y + mario.height <= block.y + block.height) {
                // Land on the block
                mario.y = block.y - mario.height;
                mario.isJumping = false;
                mario.dy = 0;
                landed = true;
            }
        });
        // Check collisions with pipes
        pipes.forEach(pipe => {
            if (mario.x + mario.width > pipe.x &&
                mario.x < pipe.x + pipe.width &&
                mario.y + mario.height >= pipe.y &&
                mario.y + mario.height <= pipe.y + pipe.height) {
                // Land on the pipe
                mario.y = pipe.y - mario.height;
                mario.isJumping = false;
                mario.dy = 0;
                landed = true;
            }
        });
        // If Mario didn't land, check if he's above any block/pipe
        if (!landed) {
            mario.isJumping = true; 
        }
    } else {
        mario.dy += 0.7; // Apply gravity
        mario.y += mario.dy; 

        // Check for collision with blocks or pipes again
        blocks.forEach(block => {
            if (mario.x + mario.width > block.x &&
                mario.x < block.x + block.width &&
                mario.y + mario.height >= block.y &&
                mario.y + mario.height <= block.y + block.height) {
                // Land on the block
                mario.y = block.y - mario.height;
                mario.isJumping = false;
                mario.dy = 0;
            }
        });
        pipes.forEach(pipe => {
            if (mario.x + mario.width > pipe.x &&
                mario.x < pipe.x + pipe.width &&
                mario.y + mario.height >= pipe.y &&
                mario.y + mario.height <= pipe.y + pipe.height) {
                // Land on the pipe
                mario.y = pipe.y - mario.height;
                mario.isJumping = false;
                mario.dy = 0;
            }
        });
    }






    ////////////did it hit object "block or pipe" from right???
    if (mario.movingRight) {
        let canMoveRight = true;
        // Check for collision with blocks and pipes from the right
        blocks.forEach(block => {
            if (mario.x + mario.width + mario.speed > block.x &&
                mario.x + mario.width <= block.x + block.width &&
                mario.y + mario.height > block.y &&
                mario.y < block.y + block.height) {
                canMoveRight = false; 
            }
        });
        pipes.forEach(pipe => {
            if (mario.x + mario.width + mario.speed > pipe.x &&
                mario.x + mario.width <= pipe.x + pipe.width &&
                mario.y + mario.height > pipe.y &&
                mario.y < pipe.y + pipe.height) {
                canMoveRight = false; 
            }
        });
        // Move right if not blocked
        if (canMoveRight ) {
            if (mario.x >= gameLength - mario.width - 500) {
                level++;
                assets.sounds.win.play();
                resetGame();
            }
            document.getElementById('mario').style.backgroundImage = "url('../assets/images/hero.gif')";
            if (mario.x < gameLength - mario.width) { 
                mario.x += mario.speed; 
                distanceTraveled += mario.speed; 
                console.log(distanceTraveled)
            }
        }
    }
    





    ////////////did it hit object "block or pipe" from left???
    if (mario.movingLeft) {
        let canMoveLeft = true;
        // Check for collision with blocks and pipes from the left
        blocks.forEach(block => {
            if (mario.x - mario.speed < block.x + block.width &&
                mario.x >= block.x &&
                mario.y + mario.height > block.y &&
                mario.y < block.y + block.height) {
                canMoveLeft = false; 
            }
        });
        pipes.forEach(pipe => {
            if (mario.x - mario.speed < pipe.x + pipe.width &&
                mario.x >= pipe.x &&
                mario.y + mario.height > pipe.y &&
                mario.y < pipe.y + pipe.height) {
                canMoveLeft = false; 
            }
        });
        // Move left if not blocked
        if (canMoveLeft) {
            document.getElementById('mario').style.backgroundImage = "url('../assets/images/hero-left.gif')";
            if (mario.x > 0) {
                mario.x -= mario.speed; 
                distanceTraveled -= mario.speed; 
            }
        }
    }




    cameraOffset = mario.x - window.innerWidth / 2 + mario.width / 2;
    marioElement.style.left = `${mario.x - cameraOffset}px`;
    marioElement.style.top = `${mario.y}px`;
    updateEnemies();
    document.getElementById('score').innerText = `Score: ${score}`;
    document.getElementById('level').innerText = `Level: ${level+1}`; 
    console.log(`Level: ${level}`)
}

//add enemies and pipes 
function spawnEnemiesAndPipes(speed = 4, enemyX, enemyY,enemyImage,enemyW = 100, enemyH = 100, canMove = true, pipeX, pipeY, pipeImage, pipeW = 100, pipeH = 100) {
    // Add an enemy
    if (enemyX !== undefined && enemyY !== undefined) {
        const newEnemy = { x: enemyX, y: enemyY, width: enemyW, height: enemyH, canMove, s:  speed, image: enemyImage }; 
        enemies.push(newEnemy);
        
        const enemyHtmlElement = document.createElement('div');
        enemyHtmlElement.className = 'enemy';
        enemyHtmlElement.style.position = 'absolute';
        enemyHtmlElement.style.width = `${newEnemy.width}px`;
        enemyHtmlElement.style.height = `${newEnemy.height}px`;
        enemyHtmlElement.style.backgroundImage = `url("${enemyImage}")`;  
        enemyHtmlElement.style.backgroundSize = 'contain';
        enemyHtmlElement.style.backgroundRepeat = 'no-repeat';  
        enemyHtmlElement.style.backgroundPosition = 'center'; 
        enemyHtmlElement.style.left = `${newEnemy.x - cameraOffset}px`;
        enemyHtmlElement.style.top = `${newEnemy.y}px`;
        document.body.appendChild(enemyHtmlElement);
        enemyElements.push(enemyHtmlElement);
    }
    // Add a pipe 
    if (pipeX !== undefined && pipeY !== undefined) {
        const newPipe = { x: pipeX, y: pipeY, width: pipeW, height: pipeH, image: pipeImage };
        pipes.push(newPipe);
    }
}


//hit an enemy? 
function checkEnemyCollision() {
    enemies.forEach(enemy => {
        if (mario.x + mario.width - 15 > enemy.x + 15  &&
            mario.x + 15 < enemy.x + enemy.width - 15  &&
            mario.y + mario.height - 15 > enemy.y + 15 &&
            mario.y + 15 < enemy.y + enemy.height - 15) {
            assets.sounds.gameOver.play();
            //reduce lives 
            lives--;
            alert(`You hit an enemy! Lives left: ${lives}`);
            //game over
            if (lives <= 0) {
                alert("Game Over! Returning to level 1.");
                level = 0;
                lives = 3;
                score = 0;
                isGameOver = true;
                resetTimer();
                resetGame();
            } else {
                mario.movingRight = false;
                mario.movingLeft = false;
                mario.isJumping = false;
                
                mario.x = 50;
                mario.y = 470;
                distanceTraveled = 0;
                resetTimer();
            }
        }
    });
}

//reset
function resetGame() {
    mario.movingRight = false;
    mario.movingLeft = false;
    mario.x = 50;
    mario.y = 470;
    mario.isJumping = false;
    //clear coins, enemies, pipes, distance traveled and blocks 
    enemies = [];
    pipes = [];
    enemyElements.forEach(element => element.remove());
    coins = [];
    coinElements.forEach(element => element.remove());
    coinElements.length = 0;
    enemyElements.length = 0;
    distanceTraveled = 0;
    blocks.length = 0; 
    loadLevel();
    renderHearts();
    generateBlocks();
    clearInterval(timerInterval);
    secondsElapsed = 0;
    isTimerRunning = false;
    timerElement.innerText = "Timer: " + formatTime(secondsElapsed);
}

//loop
// function gameLoop() {
    
//     if (isPaused) return;

//     ctx.clearRect(0, 0, canvas.width, canvas.height)
//     drawBackground();
//     drawBlocks();
//     drawPipes();
//     updateProjectiles(); 
//     drawProjectiles(); 
//     renderHearts();
//     updateCoins(); 
//     checkCoinCollection(); 
//     update();
//     checkEnemyCollision();
//     requestAnimationFrame(gameLoop);
// }

function gameLoop() {
    if (isPaused) return;

    // Clear existing elements (replace clearRect logic)
    // Optionally remove and recreate elements from previous frames
    const existingProjectiles = document.querySelectorAll('.projectile');
    existingProjectiles.forEach(projectile => projectile.remove());

    const existingBlocks = document.querySelectorAll('.block');
    existingBlocks.forEach(block => block.remove());

    const existingPipes = document.querySelectorAll('.pipe');
    existingPipes.forEach(pipe => pipe.remove());

    // Redraw background, blocks, pipes, and projectiles
    drawBackground();  // Handles background using 'div'
    drawBlocks();      // Handles blocks using 'div'
    drawPipes();       // Handles pipes using 'div'
    updateProjectiles(); // Update projectiles (positions, etc.)
    drawProjectiles();   // Draw projectiles using 'div'

    renderHearts();  // Update hearts
    updateCoins();   // Update coins
    checkCoinCollection(); // Check if coins are collected

    // Update character and enemies positions
    update();
    checkEnemyCollision();

    // Request next frame
    requestAnimationFrame(gameLoop);
}



//event listener
// Handle keyboard input
document.addEventListener('keydown', (e) => {
    if (isPaused) return;
    if ((e.key === 'ArrowUp' || e.key === 'w') && !mario.isJumping ) {
        mario.dy = -mario.jumpPower;
        mario.isJumping = true;
        assets.sounds.jump.play();
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        mario.movingRight = true; 
        direction = "+";
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        mario.movingLeft = true; 
        direction = "-";
    }
});

// Handle keyup
document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight'|| e.key === 'd') {
        mario.movingRight = false; 
    }

    if (e.key === 'ArrowLeft' || e.key === 'a') {
        mario.movingLeft = false; 
    }
});


//Handle Restart Btn
document.getElementById('restartButton').addEventListener('click', () => {
    resetGame();
});

document.getElementById('pauseButton').addEventListener('click', () => {
    isPaused = !isPaused;
    if (isPaused) {
        document.getElementById('pause').style.display = 'block';
        document.getElementById('resume').style.display = 'none';
        stopTimer(); // Pause the timer
    } else {
        document.getElementById('pause').style.display = 'none';
        document.getElementById('resume').style.display = 'block';
        gameLoop();
        startTimer();
    }
});


///////////////////////coins/////////////////////////
//add Coin 
function addCoin(x, y) {
    coins.push({ x: x, y: y, width: 30, height: 30 }); 
    const coinElement = document.createElement('div');
    coinElement.className = 'coin';
    coinElement.style.position = 'absolute';
    coinElement.style.width = '30px';
    coinElement.style.height = '30px';
    coinElement.style.backgroundImage = 'url("assets/images/coin.gif")';
    coinElement.style.backgroundSize = 'cover';
    coinElement.style.left = `${x - cameraOffset}px`;
    coinElement.style.top = `${y}px`;
    document.body.appendChild(coinElement);
    coinElements.push(coinElement);
}

// Coin collected
function checkCoinCollection() {
    coins.forEach((coin, index) => {
        if (mario.x + mario.width > coin.x &&
            mario.x < coin.x + coin.width &&
            mario.y + mario.height > coin.y &&
            mario.y < coin.y + coin.height) {
            assets.sounds.coin.play();
            score++;
            coins.splice(index, 1); 
            coinElements[index].remove(); // Remove coin element from the DOM
            coinElements.splice(index, 1);
            console.log(`Score: ${score}`); // Update the score display
        }
    });
}


//Coin view
// function updateCoins() {
//     coins.forEach((coin, index) => {
//         if (coinElements[index]) {
//             coinElements[index].style.left = `${coin.x - cameraOffset}px`;
//             coinElements[index].style.top = `${coin.y}px`;
//             coinElements[index].style.display = 
//                 (coin.x >= cameraOffset && coin.x <= cameraOffset + canvas.width) ? 'block' : 'none';
//         }
//     });
// }

function updateCoins() {
    coins.forEach((coin, index) => {
        if (coinElements[index]) {
            coinElements[index].style.left = `${coin.x - cameraOffset}px`;
            coinElements[index].style.top = `${coin.y}px`;

            // Check if the coin is within the viewable area, replace canvas.width with window.innerWidth
            coinElements[index].style.display = 
                (coin.x >= cameraOffset && coin.x <= cameraOffset + window.innerWidth) ? 'block' : 'none';
        }
    });
}





///////////////////////level designing/////////////////////////
function loadLevel() {
    if (level === 0) {
        gameLength = 8000;
    
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

        spawnEnemiesAndPipes(undefined,undefined, undefined, undefined, undefined, undefined, undefined, 6700, 250, 'bus.png', 300, 300);

    } else if (level === 1) {
        gameLength =  6000; 
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
        
    } else if (level === 2) {
        gameLength =  9000; 


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

    } else if (level === 3){
        gameLength = 9000;

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
    }else if (level === 4) {
        gameLength = 9000;
    
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
    ``
        spawnEnemiesAndPipes(10, 7900, 350, 'assets/images/friend.png', 150, 150, true, undefined, undefined, undefined, undefined, undefined);
    }

}