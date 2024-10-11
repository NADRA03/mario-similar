import { variables, resetGame } from './game.js';
import {formatTime, stopTimer, resetTimer, startTimer} from './timer.js';

export function update() {
    const { mario, blocks, pipes, gameLength, distanceTraveled, level, marioElement } = variables; // Destructure from variables

    //////////jumping collision check
    if (mario.isJumping) {
        mario.dy += 0.7; // Apply gravity
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
        if (canMoveRight) {
            if (mario.x >= gameLength - mario.width - 500) {
                variables.level++; // Increment level from variables
                // assets.sounds.win.play(); // Uncomment if needed
                resetGame();
            }
            marioElement.style.backgroundImage = "url('../assets/images/hero.gif')";
            if (mario.x < gameLength - mario.width) { 
                mario.x += mario.speed; 
                variables.distanceTraveled += mario.speed; // Update distanceTraveled from variables
                console.log(variables.distanceTraveled);
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
            marioElement.style.backgroundImage = "url('../assets/images/hero-left.gif')";
            if (mario.x > 0) {
                mario.x -= mario.speed; 
                variables.distanceTraveled -= mario.speed; 
            }
        }
    }

    // Update camera position
    variables.cameraOffset = mario.x - window.innerWidth / 2 + mario.width / 2;
    marioElement.style.left = `${mario.x - variables.cameraOffset}px`;
    marioElement.style.top = `${mario.y}px`;
    
    // Update enemy positions
    updateEnemies();

    // Update score and level display
    document.getElementById('score').innerText = `Score: ${variables.score}`;
    document.getElementById('level').innerText = `Level: ${variables.level + 1}`; 
}

export function checkEnemyCollision() {
    variables.enemies.forEach(enemy => {
        if (variables.mario.x + variables.mario.width - 15 > enemy.x + 15  &&
            variables.mario.x + 15 < enemy.x + enemy.width - 15  &&
            variables.mario.y + variables.mario.height - 15 > enemy.y + 15 &&
            variables.mario.y + 15 < enemy.y + enemy.height - 15) {
            // assets.sounds.gameOver.play();
            // Reduce lives 
            variables.lives--;
            // Game over
            // setTimeout(() => {
            if (variables.lives <= 0) {
                variables.level = 0;
                variables.lives = 3;
                variables.score = 0;
                variables.isGameOver = true;
                resetTimer();
                resetGame();

                window.location.href = "/";
            } else {
                variables.mario.movingRight = false;
                variables.mario.movingLeft = false;
                variables.mario.isJumping = false;
                
                variables.mario.x = 50;
                variables.mario.y = 470;
                variables.distanceTraveled = 0;
                resetTimer();
            }
        } 
    });
}

export function updateEnemies() {
    variables.enemies.forEach((enemy, index) => {
        if (enemy.x >= variables.cameraOffset && enemy.x <= variables.cameraOffset + window.innerWidth + 200) {
            // Move the enemy up and down if it's not a specific image
            if (!['assets/images/fire.gif', 'assets/images/plane.png', 'assets/images/alion3.png'].includes(enemy.image)) {
                enemy.verticalOffset = Math.sin(Date.now() / 300) * 1; // Moves up and down 
                enemy.y += enemy.verticalOffset;
            }
            if (enemy.canMove) {
                let originalX = enemy.x;
                // Update enemy position based on Mario's position
                if (enemy.x < variables.mario.x) {
                    enemy.x += enemy.s; // Move right
                } else {
                    enemy.x -= enemy.s; // Move left
                }

                // Check for collision with blocks and pipes
                variables.blocks.forEach(block => {
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
                variables.pipes.forEach(pipe => {
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
        if (variables.enemyElements[index]) {
            variables.enemyElements[index].style.left = `${enemy.x - variables.cameraOffset}px`;
            variables.enemyElements[index].style.top = `${enemy.y}px`;
            if (enemy.x >= variables.cameraOffset && enemy.x <= variables.cameraOffset + window.innerWidth) {
                variables.enemyElements[index].style.display = 'block';
            } else {
                variables.enemyElements[index].style.display = 'none';
            }
        }
    });
}

export function checkCoinCollection() {
    variables.coins.forEach((coin, index) => {
        if (
            variables.mario.x + variables.mario.width > coin.x &&
            variables.mario.x < coin.x + coin.width &&
            variables.mario.y + variables.mario.height > coin.y &&
            variables.mario.y < coin.y + coin.height
        ) {
            // assets.sounds.coin.play(); // Uncomment to play sound
            variables.score++;
            variables.coins.splice(index, 1); 
            variables.coinElements[index].remove(); // Remove coin element from the DOM
            variables.coinElements.splice(index, 1);
            console.log(`Score: ${variables.score}`); // Update the score display
        }
    });
}

export function updateCoins() {
    variables.coins.forEach((coin, index) => {
        if (variables.coinElements[index]) {
            variables.coinElements[index].style.left = `${coin.x - variables.cameraOffset}px`;
            variables.coinElements[index].style.top = `${coin.y}px`;

            // Check if the coin is within the viewable area
            variables.coinElements[index].style.display = 
                (coin.x >= variables.cameraOffset && coin.x <= variables.cameraOffset + window.innerWidth) ? 'block' : 'none';
        }
    });
    console.log("coin updated")
}

export function updateProjectiles() {
    variables.projectiles.forEach((projectile, index) => {
        if (projectile.direction === "+") {
            projectile.x += projectile.speed; 
        } else if (projectile.direction === "-") {
            projectile.x -= projectile.speed; 
        }
        variables.enemies.forEach((enemy, enemyIndex) => {
            if (
                projectile.x < enemy.x + enemy.width &&
                projectile.x + projectile.width > enemy.x &&
                projectile.y < enemy.y + enemy.height &&
                projectile.y + projectile.height > enemy.y
            ) {
                if (enemy.image !== "assets/images/fire.gif") { 
                    const enemyElement = variables.enemyElements[enemyIndex];
                    variables.enemies.splice(enemyIndex, 1);
                    enemyElement.remove(); 
                    variables.enemyElements.splice(enemyIndex, 1); 
                }
                variables.projectiles.splice(index, 1); 
                return; 
            }
        });
        variables.blocks.forEach((block) => {
            if (
                projectile.x < block.x + block.width &&
                projectile.x + projectile.width > block.x &&
                projectile.y < block.y + block.height &&
                projectile.y + projectile.height > block.y
            ) {
                variables.projectiles.splice(index, 1); 
                return; 
            }
        });
        variables.pipes.forEach((pipe) => {
            if (
                projectile.x < pipe.x + pipe.width &&
                projectile.x + projectile.width > pipe.x &&
                projectile.y < pipe.y + pipe.height &&
                projectile.y + projectile.height > pipe.y
            ) {
                variables.projectiles.splice(index, 1); 
                return; 
            }
        });
        if (projectile.x > variables.gameLength || projectile.x < 0) {
            variables.projectiles.splice(index, 1); 
        }
    });
}



