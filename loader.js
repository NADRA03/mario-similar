const assets = {
    images: {},
    sounds: {}
};
const assetNames = ['block1.png','bullet.png','hero.gif', 'yellowPlane.png','water.png', 'promo2.png', 'promo.png', 'car.png','enemy.gif', 'pipe.png', 'background.png', 'block.png','bus.png', 'gost3.png', 'alion.png', 'alion3.png',];

function loadImages(callback) {
    let loadedCount = 0;
    assetNames.forEach(name => {
        assets.images[name] = new Image();
        assets.images[name].src = `assets/images/${name}`;
        assets.images[name].onload = () => {
            loadedCount++;
            if (loadedCount === assetNames.length) {
                callback();
            }
        };
    });
}

function loadSounds() {
    assets.sounds.jump = new Audio('assets/sounds/jump.mp3');
    assets.sounds.gameOver = new Audio('assets/sounds/game-over.mp3');
}

function getAssets() {
    return assets;
}

// Export functions for use in game.js
export { loadImages, loadSounds, getAssets };
