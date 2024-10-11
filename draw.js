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
        moonElement.style.left = '1000px';
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