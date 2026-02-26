import { Start } from './scenes/Start.js';

const config = {
    type: Phaser.AUTO,
    title: 'Power Pamplona Clone',
    parent: 'game-container',
    width: 1280,
    height: 720,
    backgroundColor: '#87CEEB', 
    pixelArt: false,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false 
        }
    },
    scene: [Start],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
}

new Phaser.Game(config);