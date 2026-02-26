export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('toro', 'https://labs.phaser.io/assets/sprites/apple.png');
        this.load.image('plataforma', 'https://labs.phaser.io/assets/sprites/platform.png');
        this.load.image('valla', 'https://labs.phaser.io/assets/sprites/gem.png');
        this.load.image('meta', 'https://labs.phaser.io/assets/sprites/fuji.png');
    }

    create() {
        this.hasFinished = false;
        this.distanciaMeta = 5000;

        // 1. Suelo
        this.platforms = this.physics.add.staticGroup();
        let numPlats = Math.ceil(this.distanciaMeta / 400) + 10;
        for (let i = 0; i < numPlats; i++) {
            this.platforms.create(i * 400, 650, 'plataforma').setScale(1.5).refreshBody();
        }

        // 2. Jugador y Enemigo
        this.player = this.physics.add.sprite(400, 500, 'player');
        this.enemy = this.physics.add.sprite(100, 500, 'toro').setTint(0xff0000);
        
        // 3. Meta
        this.finishLine = this.physics.add.sprite(this.distanciaMeta, 500, 'meta').setScale(2.5);
        this.physics.add.collider(this.finishLine, this.platforms);

        // 4. Obstáculos
        this.obstacles = this.physics.add.group();
        for (let i = 1; i < 10; i++) {
            let valla = this.obstacles.create(i * 700 + 800, 600, 'valla');
            valla.setImmovable(true);
            valla.body.allowGravity = false;
        }

        // 5. Colisiones
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemy, this.platforms);
        this.physics.add.collider(this.player, this.obstacles, (p) => { p.setVelocityX(0); });
        
        this.physics.add.overlap(this.player, this.finishLine, () => {
            if(!this.hasFinished) this.victory();
        });

        // 6. Cámara
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(-300, 0);
        this.cameras.main.setBounds(0, 0, this.distanciaMeta + 1000, 720);

        // 7. Controles e Interfaz
        this.cursors = this.input.keyboard.createCursorKeys();
        this.distanciaText = this.add.text(20, 20, '', { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
    }

    update() {
        if (this.hasFinished) return;
        if (this.player.y > 720) this.scene.restart();

        const vel = 350;
        this.player.setVelocityX(this.player.body.touching.right ? 0 : vel);
        this.enemy.setVelocityX(vel - 35);

        // Salto (Teclado + Toque en pantalla)
        const saltar = this.cursors.up.isDown || this.input.activePointer.isDown;
        if (saltar && this.player.body.touching.down) {
            this.player.setVelocityY(-650);
        }

        let m = Math.max(0, Math.floor((this.distanciaMeta - this.player.x) / 10));
        this.distanciaText.setText('Meta en: ' + m + 'm');

        if (this.physics.overlap(this.player, this.enemy)) {
            this.scene.restart();
        }
    }

    victory() {
        this.hasFinished = true;
        this.player.setVelocity(0, 0);
        this.enemy.setVelocity(0, 0);
        this.add.text(640, 360, '¡VICTORIA!', { 
            fontSize: '64px', fill: '#fff', backgroundColor: '#2ecc71', padding: { x: 20, y: 10 } 
        }).setOrigin(0.5).setScrollFactor(0);
        this.time.delayedCall(3000, () => { this.scene.restart(); });
    }
}