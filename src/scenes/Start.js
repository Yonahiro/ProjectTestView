const FS = { frameWidth: 100, frameHeight: 64 };

export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
    }

    preload() {
        // --- FONDOS PARALLAX ---
        this.load.image('layer10', 'assets/10_Sky.png');
        this.load.image('layer09', 'assets/09_Forest.png');
        this.load.image('layer08', 'assets/08_Forest.png');
        this.load.image('layer07', 'assets/07_Forest.png');
        this.load.image('layer06', 'assets/06_Forest.png');
        this.load.image('layer04', 'assets/04_Forest.png');
        this.load.image('layer02', 'assets/02_Bushes.png');
        this.load.image('layer01', 'assets/01_Mist.png');

        // --- CABALLERO: frameWidth=100, frameHeight=64 ---
        this.load.spritesheet('walk',    'assets/Walking_KG_1.png',   FS);
        this.load.spritesheet('idle',    'assets/Idle_KG_1.png',      FS);
        this.load.spritesheet('jump',    'assets/Jump_KG_1.png',      FS);
        this.load.spritesheet('attack1', 'assets/Attack_KG_1.png',    FS);
        this.load.spritesheet('attack2', 'assets/Attack_KG_2.png',    FS);
        this.load.spritesheet('attack3', 'assets/Attack_KG_3.png',    FS);
        this.load.spritesheet('attack4', 'assets/Attack_KG_4.png',    FS);
        this.load.spritesheet('roll',    'assets/Rolling_KG_1.png',   FS);
        this.load.spritesheet('hurt',    'assets/Hurt_KG_1.png',      FS);
        this.load.spritesheet('dying',   'assets/Dying_KG_1.png',     FS);
        this.load.spritesheet('shield',  'assets/Shield_idle_KG.png', FS);

        // --- OBJETOS Y ENEMIGOS ---
        this.load.image('toro',       'assets/apple.png');
        this.load.image('soldado',    'assets/blue_ball.png');
        this.load.image('bala',       'assets/bullet7.png');
        this.load.image('plataforma', 'assets/platform.png');
        this.load.image('valla',      'assets/gem.png');
        this.load.image('pajaro',     'assets/clown.png');
    }

    create() {
        this.hasFinished   = false;
        this.isDead        = false;
        this.hp            = 3;
        this.isBlocking    = false;
        this.attackCycle   = 0;
        this.distanciaMeta = 5000;

        // --- Estados táctiles (reemplazan las teclas en móvil) ---
        this.touch = {
            atacar:  false,
            defensa: false,
            rodar:   false,
        };

        // 1. PARALLAX
        const { width, height } = this.scale;
        this.bg10 = this.add.tileSprite(0, 0, width, height, 'layer10').setOrigin(0).setScrollFactor(0);
        this.bg09 = this.add.tileSprite(0, 0, width, height, 'layer09').setOrigin(0).setScrollFactor(0);
        this.bg08 = this.add.tileSprite(0, 0, width, height, 'layer08').setOrigin(0).setScrollFactor(0);
        this.bg07 = this.add.tileSprite(0, 0, width, height, 'layer07').setOrigin(0).setScrollFactor(0);
        this.bg06 = this.add.tileSprite(0, 0, width, height, 'layer06').setOrigin(0).setScrollFactor(0);
        this.bg04 = this.add.tileSprite(0, 0, width, height, 'layer04').setOrigin(0).setScrollFactor(0);
        this.bg02 = this.add.tileSprite(0, 0, width, height, 'layer02').setOrigin(0).setScrollFactor(0);
        this.bg01 = this.add.tileSprite(0, 0, width, height, 'layer01').setOrigin(0).setScrollFactor(0).setAlpha(0.5);

        // 2. ANIMACIONES
        const addAnim = (key, texture, frames, frameRate, repeat) => {
            if (!this.anims.exists(key)) {
                this.anims.create({
                    key,
                    frames: this.anims.generateFrameNumbers(texture, { start: 0, end: frames - 1 }),
                    frameRate,
                    repeat
                });
            }
        };

        addAnim('anim_run',     'walk',    7,  10, -1);
        addAnim('anim_idle',    'idle',    4,  6,  -1);
        addAnim('anim_jump',    'jump',    6,  8,   0);
        addAnim('anim_attack1', 'attack1', 6,  12,  0);
        addAnim('anim_attack2', 'attack2', 6,  12,  0);
        addAnim('anim_attack3', 'attack3', 9,  12,  0);
        addAnim('anim_attack4', 'attack4', 5,  12,  0);
        addAnim('anim_roll',    'roll',    10, 14,  0);
        addAnim('anim_hurt',    'hurt',    4,  8,   0);
        addAnim('anim_dying',   'dying',   5,  8,   0);
        addAnim('anim_shield',  'shield',  4,  6,  -1);

        // 3. FÍSICAS
        this.platforms = this.physics.add.staticGroup();
        this.ground = this.add.tileSprite(0, 650, this.distanciaMeta + 2000, 128, 'plataforma')
            .setOrigin(0, 0).setScale(1.5);
        this.physics.add.existing(this.ground, true);
        this.platforms.add(this.ground);

        this.obstacles = this.physics.add.group();
        this.enemies   = this.physics.add.group();
        this.bullets   = this.physics.add.group();

        for (let i = 900; i < this.distanciaMeta; i += 750) {
            let tipo = Phaser.Math.Between(0, 2);
            if (tipo === 0) {
                this.obstacles.create(i, 610, 'valla').setImmovable(true).body.allowGravity = false;
            } else if (tipo === 1) {
                this.obstacles.create(i, 420, 'pajaro').setImmovable(true).body.allowGravity = false;
            } else {
                let e = this.enemies.create(i, 610, 'soldado').setImmovable(true);
                e.body.allowGravity = false;
                e.lastFired = 0;
                e.alturaDisparo = Phaser.Math.RND.pick([610, 530]);
            }
        }

        // 4. JUGADOR
        this.player = this.physics.add.sprite(500, 500, 'idle', 0).setScale(2.5);
        this.player.body.setSize(40, 60);
        this.player.body.setOffset(30, 4);
        this.player.anims.play('anim_idle');

        this.enemy = this.physics.add.sprite(-100, 500, 'toro').setTint(0xff0000).setScale(1.5);

        // 5. CÁMARA
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(-300, 0);
        this.cameras.main.setBounds(0, 0, this.distanciaMeta + 1000, 720);

        // 6. CONTROLES TECLADO
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            atacar:  Phaser.Input.Keyboard.KeyCodes.Z,
            defensa: Phaser.Input.Keyboard.KeyCodes.X,
            rodar:   Phaser.Input.Keyboard.KeyCodes.C
        });

        // 7. COLISIONES
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemy,  this.platforms);
        this.physics.add.overlap(this.player, this.bullets, (p, b) => this.takeDamage(b));
        this.physics.add.overlap(this.player, this.enemies, (p, e) => this.takeDamage(null));
        this.physics.add.overlap(this.player, this.enemy,   ()     => this.takeDamage(null));

        // 8. HUD TEXT
        this.uiText = this.add.text(20, 20, '', {
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
            strokeThickness: 4
        }).setScrollFactor(0).setDepth(10);

        // 9. BOTONES MÓVIL
        this.crearBotonesMobil();
    }

    // ─────────────────────────────────────────────
    //  BOTONES TÁCTILES
    // ─────────────────────────────────────────────
    crearBotonesMobil() {
        const { width, height } = this.scale;

        // Configuración de cada botón
        // Los tres van en la esquina inferior derecha en columna vertical
        const btnSize  = 70;
        const margin   = 18;
        const startX   = width  - btnSize / 2 - margin;
        const startY   = height - btnSize / 2 - margin;

        const botones = [
            // [acción, etiqueta, icono emoji, color de fondo, posición Y desde abajo]
            { key: 'atacar',  label: 'ATK', icon: '⚔️',  color: 0xc0392b, y: startY - (btnSize + margin) * 2 },
            { key: 'defensa', label: 'DEF', icon: '🛡️',  color: 0x2980b9, y: startY - (btnSize + margin) * 1 },
            { key: 'rodar',   label: 'ROL', icon: '💨',  color: 0x27ae60, y: startY },
        ];

        botones.forEach(({ key, label, icon, color, y }) => {
            const x = startX;
            const depth = 20;

            // Fondo circular del botón
            const bg = this.add.graphics().setScrollFactor(0).setDepth(depth);
            const drawBtn = (pressed) => {
                bg.clear();
                // Sombra
                bg.fillStyle(0x000000, 0.35);
                bg.fillCircle(x + 3, y + 4, btnSize / 2);
                // Cuerpo
                bg.fillStyle(pressed ? 0xffffff : color, pressed ? 0.3 : 0.85);
                bg.fillCircle(x, y, btnSize / 2);
                // Borde
                bg.lineStyle(3, pressed ? 0xffffff : 0xffffff, pressed ? 1 : 0.5);
                bg.strokeCircle(x, y, btnSize / 2);
            };
            drawBtn(false);

            // Icono emoji
            const iconText = this.add.text(x, y - 10, icon, {
                fontSize: '26px',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

            // Etiqueta de texto
            const labelText = this.add.text(x, y + 18, label, {
                fontSize: '13px',
                fontFamily: 'monospace',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                fontStyle: 'bold',
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

            // Zona interactiva
            const zone = this.add.zone(x, y, btnSize, btnSize)
                .setScrollFactor(0)
                .setDepth(depth + 2)
                .setInteractive();

            zone.on('pointerdown', () => {
                this.touch[key] = true;
                drawBtn(true);
                iconText.setAlpha(0.7);
            });

            zone.on('pointerup', () => {
                this.touch[key] = false;
                drawBtn(false);
                iconText.setAlpha(1);
            });

            zone.on('pointerout', () => {
                this.touch[key] = false;
                drawBtn(false);
                iconText.setAlpha(1);
            });
        });

        // Indicador de salto (esquina inferior izquierda, semitransparente)
        const jumpHint = this.add.text(margin, height - margin, '↑ Toca pantalla para saltar', {
            fontSize: '14px',
            fontFamily: 'monospace',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            alpha: 0.7,
        }).setOrigin(0, 1).setScrollFactor(0).setDepth(10);
    }

    // ─────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────
    update(time) {
        if (this.hasFinished || this.isDead) return;

        // PARALLAX
        const camX = this.cameras.main.scrollX;
        this.bg10.tilePositionX = camX * 0.05;
        this.bg09.tilePositionX = camX * 0.12;
        this.bg08.tilePositionX = camX * 0.20;
        this.bg07.tilePositionX = camX * 0.30;
        this.bg06.tilePositionX = camX * 0.45;
        this.bg04.tilePositionX = camX * 0.60;
        this.bg02.tilePositionX = camX * 0.75;
        this.bg01.tilePositionX = camX * 0.95;

        // Combinar teclado + táctil
        const doAtacar  = this.keys.atacar.isDown  || this.touch.atacar;
        const doDefensa = this.keys.defensa.isDown  || this.touch.defensa;
        const doRodar   = this.keys.rodar.isDown    || this.touch.rodar;

        let speed = 380;

        if (doDefensa) {
            speed = 150;
            this.isBlocking = true;
            this.player.anims.play('anim_shield', true);

        } else if (doAtacar) {
            this.isBlocking = false;
            const atkKey = `anim_attack${(this.attackCycle % 4) + 1}`;
            if (this.player.anims.currentAnim?.key !== atkKey || !this.player.anims.isPlaying) {
                this.player.anims.play(atkKey);
                this.attackCycle++;
            }

        } else if (doRodar) {
            speed = 550;
            this.isBlocking = false;
            this.player.anims.play('anim_roll', true);

        } else {
            this.isBlocking = false;
            if (this.player.body.touching.down) {
                this.player.anims.play('anim_run', true);
            } else {
                this.player.anims.play('anim_jump', true);
            }
        }

        this.player.setVelocityX(speed);
        this.enemy.setVelocityX(345);

        // SALTO — teclado arriba O toque en cualquier zona que NO sea un botón
        const teclaSalto  = this.cursors.up.isDown;
        const toquePantalla = this.input.activePointer.isDown && this.player.body.touching.down;
        if ((teclaSalto || toquePantalla) && this.player.body.touching.down) {
            this.player.setVelocityY(-650);
        }

        // DISPAROS DE ENEMIGOS
        this.enemies.children.iterate((e) => {
            if (e && e.x - this.player.x < 700 && time > e.lastFired) {
                this.fireBullet(e);
                e.lastFired = time + 2000;
            }
        });

        // HUD
        let m = Math.max(0, Math.floor((this.distanciaMeta - this.player.x) / 10));
        this.uiText.setText(`HP: ${this.hp}  |  Meta: ${m}m`);

        if (this.player.x >= this.distanciaMeta) this.victory();
        if (this.player.y > 720) this.scene.restart();
    }

    takeDamage(bullet) {
        if (this.isBlocking) {
            if (bullet) bullet.destroy();
            return;
        }
        if (bullet) bullet.destroy();

        this.hp--;
        this.cameras.main.shake(200, 0.01);
        this.player.setTint(0xff0000);
        this.time.delayedCall(200, () => this.player.clearTint());

        if (this.hp <= 0) {
            this.isDead = true;
            this.player.anims.play('anim_dying');
            this.player.setVelocity(0);
            this.time.delayedCall(1500, () => this.scene.restart());
        }
    }

    fireBullet(enemy) {
        let b = this.bullets.create(enemy.x, enemy.alturaDisparo, 'bala');
        b.body.allowGravity = false;
        b.setVelocityX(-450);
    }

    victory() {
        this.hasFinished = true;
        this.player.setVelocity(0);
        this.enemy.setVelocity(0);
        this.add.text(640, 360, '¡VICTORIA!', {
            fontSize: '64px',
            fill: '#f1c40f',
            stroke: '#000',
            strokeThickness: 6,
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
        this.time.delayedCall(3000, () => this.scene.start('MainMenu'));
    }
}