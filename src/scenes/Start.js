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
        // Definimos la meta a 5000 píxeles para que no sea eterno
        this.distanciaMeta = 5000; 

        // 1. SUELO CORREGIDO
        this.platforms = this.physics.add.staticGroup();
        
        // Calculamos cuántas plataformas necesitamos para cubrir toda la distancia
        // Si cada plataforma mide 400px, dividimos la distancia meta entre 400
        let cantidadPlataformas = Math.ceil(this.distanciaMeta / 400) + 5; 

        for (let i = 0; i < cantidadPlataformas; i++) {
            // Creamos suelo continuo
            this.platforms.create(i * 400, 650, 'plataforma').setScale(1.5).refreshBody();
        }

        // 2. META (Justo al final del suelo)
        this.finishLine = this.physics.add.sprite(this.distanciaMeta, 500, 'meta').setScale(2.5);
        this.physics.add.collider(this.finishLine, this.platforms);

        // 3. OBSTÁCULOS
        this.obstacles = this.physics.add.group();
        for (let i = 1; i < 8; i++) {
            let valla = this.obstacles.create(i * 600 + 800, 600, 'valla');
            valla.setImmovable(true);
            valla.body.allowGravity = false;
        }

        // 4. JUGADOR
        this.player = this.physics.add.sprite(400, 500, 'player');
        // Impedimos que el jugador se salga por la izquierda, pero que avance a la derecha
        this.player.setCollideWorldBounds(false); 

        // 5. ENEMIGO
        this.enemy = this.physics.add.sprite(100, 500, 'toro').setTint(0xff0000);

        // 6. FÍSICAS
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemy, this.platforms);
        this.physics.add.collider(this.player, this.obstacles, (p) => { p.setVelocityX(0); });

        // Detección de meta
        this.physics.add.overlap(this.player, this.finishLine, () => { 
            if(!this.hasFinished) this.victory(); 
        });

        // 7. CÁMARA
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(-300, 0);
        // Evitamos que la cámara vea debajo del suelo
        this.cameras.main.setBounds(0, 0, this.distanciaMeta + 1000, 720);

        this.distanciaText = this.add.text(20, 20, 'Distancia: 0m', { fontSize: '24px', fill: '#000' }).setScrollFactor(0);
        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.hasFinished) return;

        // Si el monito cae por error fuera del suelo, reiniciamos
        if (this.player.y > 720) {
            this.scene.restart();
        }

        this.player.setVelocityX(this.player.body.touching.right ? 0 : 350);
        this.enemy.setVelocityX(320);

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-650);
        }
        
        this.distanciaText.setText('Meta a: ' + Math.floor((this.distanciaMeta - this.player.x) / 10) + 'm');
        
        if (this.physics.overlap(this.player, this.enemy)) {
            this.scene.restart();
        }
    }

    victory() {
        this.hasFinished = true;
        this.player.setVelocity(0, 0);
        this.enemy.setVelocity(0, 0);
        this.add.text(640, 360, '¡LLEGASTE A LA META!', { 
            fontSize: '64px', 
            fill: '#fff', 
            backgroundColor: '#2ecc71',
            padding: { x: 20, y: 10 }
        }).setOrigin(0.5).setScrollFactor(0);
        
        this.time.delayedCall(3000, () => { this.scene.restart(); });
    }
}