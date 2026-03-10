export class MainMenu extends Phaser.Scene {
    constructor() {
        super('MainMenu');
    }

    preload() {
        // Asegúrate de tener esta imagen en tu carpeta assets
        this.load.image('menu_bg', 'assets/sky.png'); 
    }

    create() {
        // Fondo con un tono algo más mágico
        this.add.image(640, 360, 'menu_bg').setAlpha(0.6).setTint(0x9b59b6);

        // Título del juego: FANTASY RUN
        const title = this.add.text(640, 250, 'FANTASY RUN', {
            fontSize: '100px',
            fill: '#f1c40f', // Dorado
            align: 'center',
            fontStyle: 'bold',
            stroke: '#4a235a', // Púrpura oscuro
            strokeThickness: 12
        }).setOrigin(0.5);

        // Efecto de flotación para el título
        this.tweens.add({
            targets: title,
            y: 270,
            duration: 2000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            loop: -1
        });

        // Botón Jugar
        const playButton = this.add.text(640, 480, ' INICIAR AVENTURA ', {
            fontSize: '40px',
            fill: '#fff',
            backgroundColor: '#8e44ad',
            padding: { x: 30, y: 15 }
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

        // Interacción del botón
        playButton.on('pointerover', () => {
            playButton.setStyle({ fill: '#f1c40f', backgroundColor: '#9b59b6' });
            playButton.setScale(1.1);
        });

        playButton.on('pointerout', () => {
            playButton.setStyle({ fill: '#fff', backgroundColor: '#8e44ad' });
            playButton.setScale(1);
        });
        
        playButton.on('pointerdown', () => {
            this.scene.start('Start'); 
        });

        // Footer / Instrucciones
        this.add.text(640, 650, 'Esquiva los peligros y llega a la meta', {
            fontSize: '20px',
            fill: '#ddd',
            fontStyle: 'italic'
        }).setOrigin(0.5);
    }
}