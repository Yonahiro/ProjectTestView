import { MainMenu } from './scenes/MainMenu.js';
import { Start }    from './scenes/Start.js';

const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width:  1280,
    height: 720,
    scene: [MainMenu, Start],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scale: {
        mode:       Phaser.Scale.FIT,        // escala manteniendo aspecto 16:9
        autoCenter: Phaser.Scale.CENTER_BOTH, // centrado horizontal y vertical
        parent:     'game-container',
        width:      1280,
        height:     720,
        // En móvil fuerza landscape y llena la pantalla
        expandParent: true,
    },
    // Evita el delay de 300ms en taps en móvil
    input: {
        activePointers: 4, // soporte multitáctil (hasta 4 dedos simultáneos)
    },
    backgroundColor: '#000000',
};

new Phaser.Game(config);