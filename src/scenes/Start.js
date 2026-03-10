// ─────────────────────────────────────────────────────────────────
//  INSTRUCCIONES DE ASSETS
//  Copia el archivo oak_woods_tileset.png a assets/oak_woods_tileset.png
//  El código extrae las tiles directamente del tileset en preload().
//  Tile size: 24x24px  (escaladas x3 = 72x72 en juego)
// ─────────────────────────────────────────────────────────────────

const FS         = { frameWidth: 100, frameHeight: 64 };
const TILE_SIZE  = 24;   // tamaño real en el PNG
const TILE_SCALE = 3;    // escala en juego → 72px por tile
const TS         = TILE_SIZE * TILE_SCALE; // 72px

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

        // --- TILESET (una sola imagen, cortamos en create) ---
        this.load.image('tileset', 'assets/oak_woods_tileset.png');

        // --- CABALLERO ---
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

        // --- ESQUELETO ENEMIGO (frameWidth varía por animación, frameHeight=64) ---
        this.load.spritesheet('sk_idle',    'assets/Skeleton_01_White_Idle.png',    { frameWidth: 64, frameHeight: 64 }); // 12 frames
        this.load.spritesheet('sk_walk',    'assets/Skeleton_01_White_Walk.png',    { frameWidth: 64, frameHeight: 64 }); // 15 frames
        this.load.spritesheet('sk_attack1', 'assets/Skeleton_01_White_Attack1.png', { frameWidth: 64, frameHeight: 64 }); // 15 frames
        this.load.spritesheet('sk_attack2', 'assets/Skeleton_01_White_Attack2.png', { frameWidth: 72, frameHeight: 64 }); // 12 frames
        this.load.spritesheet('sk_hurt',    'assets/Skeleton_01_White_Hurt.png',    { frameWidth: 60, frameHeight: 64 }); //  8 frames
        this.load.spritesheet('sk_die',     'assets/Skeleton_01_White_Die.png',     { frameWidth: 78, frameHeight: 64 }); // 16 frames

        // --- OBJETOS ---
        this.load.image('toro',   'assets/apple.png');
        this.load.image('bala',   'assets/bullet7.png');
        this.load.image('valla',  'assets/gem.png');
        this.load.image('pajaro', 'assets/clown.png');
    }

    // ─────────────────────────────────────────────
    //  HELPER: recortar una tile del tileset
    // ─────────────────────────────────────────────
    addTileTexture(key, col, row) {
        if (this.textures.exists(key)) return;
        const src    = this.textures.get('tileset').getSourceImage();
        const canvas = document.createElement('canvas');
        canvas.width  = TILE_SIZE;
        canvas.height = TILE_SIZE;
        canvas.getContext('2d').drawImage(
            src,
            col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE,
            0, 0, TILE_SIZE, TILE_SIZE
        );
        this.textures.addCanvas(key, canvas);
    }

    create() {
        this.hasFinished   = false;
        this.isDead        = false;
        this.hp            = 3;
        this.isBlocking    = false;
        this.attackCycle   = 0;
        this.distanciaMeta = 6000;

        this.touch            = { atacar: false, defensa: false, rodar: false };
        this.lastAttackTime   = -1000;  // cooldown de ataque
        this.ATTACK_COOLDOWN  = 500;    // ms mínimos entre ataques
        this.isAttacking      = false;  // bandera para golpear enemigos una sola vez por swing

        // ── Extraer tiles del tileset ──────────────────────────────
        // Plataforma flotante gris (row 7, cols 5-7) → para plataformas en el aire
        this.addTileTexture('t_plat_L', 5, 7);
        this.addTileTexture('t_plat_C', 6, 7);
        this.addTileTexture('t_plat_R', 7, 7);

        // Suelo grueso (rows 3-5, zona gris cols 5-7)
        this.addTileTexture('t_gnd_TL', 5, 3);  // top-left
        this.addTileTexture('t_gnd_TC', 6, 3);  // top-center  (negro en tileset → usar col 10 r3)
        this.addTileTexture('t_gnd_TR', 7, 3);  // top-right
        this.addTileTexture('t_gnd_ML', 5, 4);  // mid-left    (usa col 9 row 3 como alternativa)
        this.addTileTexture('t_gnd_MC', 6, 4);  // mid-center
        this.addTileTexture('t_gnd_MR', 7, 4);  // mid-right

        // Tiles piedra zona cols 9-11
        this.addTileTexture('t_sto_L',  9,  3);
        this.addTileTexture('t_sto_C',  10, 4);
        this.addTileTexture('t_sto_R',  11, 3);

        // Tile oscura cols 12-13 row 10
        this.addTileTexture('t_drk_L',  12, 10);
        this.addTileTexture('t_drk_R',  13, 10);

        // ── PARALLAX ──────────────────────────────────────────────
        const { width, height } = this.scale;
        this.bg10 = this.add.tileSprite(0, 0, width, height, 'layer10').setOrigin(0).setScrollFactor(0);
        this.bg09 = this.add.tileSprite(0, 0, width, height, 'layer09').setOrigin(0).setScrollFactor(0);
        this.bg08 = this.add.tileSprite(0, 0, width, height, 'layer08').setOrigin(0).setScrollFactor(0);
        this.bg07 = this.add.tileSprite(0, 0, width, height, 'layer07').setOrigin(0).setScrollFactor(0);
        this.bg06 = this.add.tileSprite(0, 0, width, height, 'layer06').setOrigin(0).setScrollFactor(0);
        this.bg04 = this.add.tileSprite(0, 0, width, height, 'layer04').setOrigin(0).setScrollFactor(0);
        this.bg02 = this.add.tileSprite(0, 0, width, height, 'layer02').setOrigin(0).setScrollFactor(0);
        this.bg01 = this.add.tileSprite(0, 0, width, height, 'layer01').setOrigin(0).setScrollFactor(0).setAlpha(0.5);

        // ── ANIMACIONES ───────────────────────────────────────────
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

        // ── Animaciones del esqueleto ──────────────────────────────
        addAnim('sk_anim_idle',    'sk_idle',    12, 8,  -1);
        addAnim('sk_anim_walk',    'sk_walk',    15, 10, -1);
        addAnim('sk_anim_attack1', 'sk_attack1', 15, 14,  0);
        addAnim('sk_anim_attack2', 'sk_attack2', 12, 14,  0);
        addAnim('sk_anim_hurt',    'sk_hurt',     8, 12,  0);
        addAnim('sk_anim_die',     'sk_die',     16, 10,  0);

        // ── FÍSICA ────────────────────────────────────────────────
        this.platforms  = this.physics.add.staticGroup();
        this.obstacles  = this.physics.add.group();
        this.enemies    = this.physics.add.group();
        this.bullets    = this.physics.add.group();

        // ── GENERAR TERRENO ───────────────────────────────────────
        this.generarTerreno();

        // ── JUGADOR ───────────────────────────────────────────────
        this.player = this.physics.add.sprite(200, 400, 'idle', 0).setScale(2.5);
        this.player.body.setSize(40, 60);
        this.player.body.setOffset(30, 4);
        this.player.anims.play('anim_idle');

        this.enemy = this.physics.add.sprite(-100, 400, 'toro').setTint(0xff0000).setScale(1.5);

        // ── CÁMARA ────────────────────────────────────────────────
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setFollowOffset(-300, 0);
        this.cameras.main.setBounds(0, 0, this.distanciaMeta + 1000, 720);

        // ── CONTROLES ─────────────────────────────────────────────
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            atacar:  Phaser.Input.Keyboard.KeyCodes.Z,
            defensa: Phaser.Input.Keyboard.KeyCodes.X,
            rodar:   Phaser.Input.Keyboard.KeyCodes.C
        });

        // ── COLISIONES ────────────────────────────────────────────
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.enemy,  this.platforms);
        this.physics.add.overlap(this.player, this.bullets, (p, b) => this.takeDamage(b));
        this.physics.add.overlap(this.player, this.enemies, (p, e) => this.takeDamage(null));
        this.physics.add.overlap(this.player, this.enemy,   ()     => this.takeDamage(null));

        // ── HUD ───────────────────────────────────────────────────
        this.uiText = this.add.text(20, 20, '', {
            fontSize: '20px', fill: '#fff',
            stroke: '#000', strokeThickness: 4
        }).setScrollFactor(0).setDepth(10);

        // ── BOTONES MÓVIL ─────────────────────────────────────────
        this.crearBotonesMobil();
    }

    // ─────────────────────────────────────────────────────────────
    //  GENERACIÓN DE TERRENO CON TILES
    // ─────────────────────────────────────────────────────────────
    generarTerreno() {
        const groundY    = 600;   // Y del suelo (top del tile superior)
        const groundRows = 3;     // capas de suelo hacia abajo
        const mapWidth   = this.distanciaMeta + 800;

        // ── SUELO PRINCIPAL ──────────────────────────────────────
        // Dibuja el suelo como fila de tiles, alterna entre sets grises
        const groundTilesPerRow = Math.ceil(mapWidth / TS) + 2;

        for (let row = 0; row < groundRows; row++) {
            const y = groundY + row * TS;
            for (let col = 0; col < groundTilesPerRow; col++) {
                const x = col * TS;
                let key;

                if (row === 0) {
                    // Fila superior: usa tops de piedra gris
                    if      (col === 0)                        key = 't_gnd_TL';
                    else if (col === groundTilesPerRow - 1)    key = 't_gnd_TR';
                    else                                       key = col % 2 === 0 ? 't_sto_L' : 't_sto_R';
                } else {
                    // Relleno: alterna tiles oscuros y grises
                    key = (col + row) % 3 === 0 ? 't_drk_L'
                        : (col + row) % 3 === 1 ? 't_gnd_MC'
                        :                          't_sto_C';
                }

                this.colocarTile(key, x, y, true);  // true = colisión
            }
        }

        // ── PLATAFORMAS FLOTANTES PROCEDURALES ───────────────────
        // Genera plataformas a lo largo del nivel con variedad de altura y largo
        const platConfigs = [
            // [xStart, yPos, numTiles, conEnemigo]
        ];

        // Generar aleatoriamente pero con seed determinista para reproducibilidad
        const rng = new Phaser.Math.RandomDataGenerator(['nivel1']);

        let x = 700;
        while (x < this.distanciaMeta - 400) {
            const largo   = rng.between(2, 6);          // 2 a 6 tiles de ancho
            const yOffset = rng.pick([-220, -310, -400, -290]); // más altas → espacio para rodar por debajo
            const y       = groundY + yOffset;

            platConfigs.push({ x, y, largo });

            // Colocar plataforma
            this.colocarPlataforma(x, y, largo);

            // Generar obstáculo o enemigo sobre la plataforma (50% chance)
            const midX = x + Math.floor(largo / 2) * TS + TS / 2;
            const roll  = rng.between(0, 3);
            if (roll === 0) {
                // Enemigo soldado sobre la plataforma
                let e = this.enemies.create(midX, y - 48, 'sk_idle', 0).setScale(2).setFlipX(true).setImmovable(true);
                e.body.allowGravity = false;
                e.body.setSize(30, 54);
                e.body.setOffset(17, 8);
                e.hp          = 3;
                e.lastFired   = 0;
                e.alturaDisparo = y - 48;
                e.isDying     = false;
                e.anims.play('sk_anim_walk');
            } else if (roll === 1) {
                // Valla sobre la plataforma
                this.obstacles.create(midX, y - 30, 'valla').setImmovable(true).body.allowGravity = false;
            }

            // Avanzar x con un gap variable
            x += (largo * TS) + rng.between(250, 500);
        }

        // ── PLATAFORMAS FIJAS AL NIVEL DEL SUELO (obstáculos bajos) ──
        for (let px = 900; px < this.distanciaMeta; px += rng.between(600, 900)) {
            const roll = rng.between(0, 2);
            if (roll === 0) {
                // Pajaro volando
                this.obstacles.create(px, groundY - 200, 'pajaro').setImmovable(true).body.allowGravity = false;
            } else if (roll === 1) {
                // Enemigo a nivel de suelo
                let e = this.enemies.create(px, groundY - 48, 'sk_idle', 0).setScale(2).setFlipX(true).setImmovable(true);
                e.body.allowGravity = false;
                e.body.setSize(30, 54);
                e.body.setOffset(17, 8);
                e.hp          = 3;
                e.lastFired   = 0;
                e.alturaDisparo = groundY - 48;
                e.isDying     = false;
                e.anims.play('sk_anim_walk');
            }
        }
    }

    // Coloca una plataforma flotante de `largo` tiles en (x, y)
    colocarPlataforma(x, y, largo) {
        for (let i = 0; i < largo; i++) {
            let key;
            if      (largo === 1) key = 't_plat_C';
            else if (i === 0)     key = 't_plat_L';
            else if (i === largo - 1) key = 't_plat_R';
            else                  key = 't_plat_C';

            this.colocarTile(key, x + i * TS, y, true);
        }
    }

    // Coloca un tile visual + cuerpo físico opcional
    colocarTile(key, x, y, colision = false) {
        const img = this.add.image(x, y, key)
            .setOrigin(0, 0)
            .setScale(TILE_SCALE)
            .setDepth(1);

        if (colision) {
            // Añadir cuerpo estático manualmente
            const body = this.physics.add.staticImage(x + (TS / 2), y + (TS / 2), key)
                .setScale(TILE_SCALE)
                .setVisible(false);  // invisible → el visual de arriba ya se ve
            body.refreshBody();
            this.platforms.add(body);
        }

        return img;
    }

    // ─────────────────────────────────────────────
    //  BOTONES TÁCTILES
    // ─────────────────────────────────────────────
    crearBotonesMobil() {
        const { width, height } = this.scale;
        const btnSize = 70;
        const margin  = 18;
        const startX  = width  - btnSize / 2 - margin;
        const startY  = height - btnSize / 2 - margin;

        const botones = [
            { key: 'atacar',  label: 'ATK', icon: '⚔️', color: 0xc0392b, y: startY - (btnSize + margin) * 2 },
            { key: 'defensa', label: 'DEF', icon: '🛡️', color: 0x2980b9, y: startY - (btnSize + margin) * 1 },
            { key: 'rodar',   label: 'ROL', icon: '💨', color: 0x27ae60, y: startY },
        ];

        botones.forEach(({ key, label, icon, color, y }) => {
            const x = startX;
            const depth = 20;
            const bg = this.add.graphics().setScrollFactor(0).setDepth(depth);

            const drawBtn = (pressed) => {
                bg.clear();
                bg.fillStyle(0x000000, 0.35);
                bg.fillCircle(x + 3, y + 4, btnSize / 2);
                bg.fillStyle(pressed ? 0xffffff : color, pressed ? 0.3 : 0.85);
                bg.fillCircle(x, y, btnSize / 2);
                bg.lineStyle(3, 0xffffff, pressed ? 1 : 0.5);
                bg.strokeCircle(x, y, btnSize / 2);
            };
            drawBtn(false);

            const iconText = this.add.text(x, y - 10, icon, { fontSize: '26px' })
                .setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);
            this.add.text(x, y + 18, label, {
                fontSize: '13px', fontFamily: 'monospace',
                fill: '#ffffff', stroke: '#000000', strokeThickness: 3, fontStyle: 'bold'
            }).setOrigin(0.5).setScrollFactor(0).setDepth(depth + 1);

            const zone = this.add.zone(x, y, btnSize, btnSize)
                .setScrollFactor(0).setDepth(depth + 2).setInteractive();

            zone.on('pointerdown', () => { this.touch[key] = true;  drawBtn(true);  iconText.setAlpha(0.7); });
            zone.on('pointerup',   () => { this.touch[key] = false; drawBtn(false); iconText.setAlpha(1);   });
            zone.on('pointerout',  () => { this.touch[key] = false; drawBtn(false); iconText.setAlpha(1);   });
        });

        this.add.text(margin, height - margin, '↑ Toca pantalla para saltar', {
            fontSize: '14px', fontFamily: 'monospace',
            fill: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0, 1).setScrollFactor(0).setDepth(10).setAlpha(0.7);
    }

    // ─────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────
    update(time) {
        if (this.hasFinished || this.isDead) return;

        const camX = this.cameras.main.scrollX;
        this.bg10.tilePositionX = camX * 0.05;
        this.bg09.tilePositionX = camX * 0.12;
        this.bg08.tilePositionX = camX * 0.20;
        this.bg07.tilePositionX = camX * 0.30;
        this.bg06.tilePositionX = camX * 0.45;
        this.bg04.tilePositionX = camX * 0.60;
        this.bg02.tilePositionX = camX * 0.75;
        this.bg01.tilePositionX = camX * 0.95;

        const doAtacar  = this.keys.atacar.isDown  || this.touch.atacar;
        const doDefensa = this.keys.defensa.isDown || this.touch.defensa;
        const doRodar   = this.keys.rodar.isDown   || this.touch.rodar;

        let speed = 380;

        if (doDefensa) {
            speed = 150;
            this.isBlocking = true;
            this.isAttacking = false;
            this.player.anims.play('anim_shield', true);

        } else if (this.isAttacking) {
            // ── Animación de ataque en curso: no interrumpir ─────
            // No hacer nada — dejar que la animación termine sola
            // El hitbox activo sigue revisando enemigos cada frame
            const hitRange = 220;
            this.enemies.children.iterate((e) => {
                if (!e || !e.active || e.isDying) return;
                const dist = e.x - this.player.x;
                if (dist > -30 && dist < hitRange && !e.hitThisSwing) {
                    e.hitThisSwing = true;
                    this.dañarEnemigo(e);
                }
            });

        } else if (doAtacar && (time - this.lastAttackTime >= this.ATTACK_COOLDOWN)) {
            // ── INICIAR ATAQUE ───────────────────────────────────
            this.isBlocking     = false;
            this.isAttacking    = true;
            this.lastAttackTime = time;

            const atkKey = `anim_attack${(this.attackCycle % 4) + 1}`;
            this.attackCycle++;
            this.player.anims.play(atkKey);

            // Limpiar flag de "ya golpeado este swing" en todos los enemigos
            this.enemies.children.iterate((e) => {
                if (e) e.hitThisSwing = false;
            });

            // Al terminar la animación, liberar el estado de ataque
            this.player.once('animationcomplete', () => {
                this.isAttacking = false;
            });

        } else if (doRodar) {
            speed = 550;
            this.isBlocking = false;
            this.player.anims.play('anim_roll', true);
            // Hitbox pequeña al rodar: altura 28px y offset ajustado para que los pies queden en el suelo
            if (this.player.body.height !== 28) {
                this.player.body.setSize(50, 28);
                this.player.body.setOffset(25, 36); // offset Y alto → personaje "agachado"
            }
        } else {
            this.isBlocking = false;
            // Restaurar hitbox normal si estaba rodando
            if (this.player.body.height === 28) {
                this.player.body.setSize(40, 60);
                this.player.body.setOffset(30, 4);
            }
            if (this.player.body.touching.down) {
                this.player.anims.play('anim_run', true);
            } else {
                this.player.anims.play('anim_jump', true);
            }
        }

        this.player.setVelocityX(speed);
        this.enemy.setVelocityX(345);

        if ((this.cursors.up.isDown || this.input.activePointer.isDown) && this.player.body.touching.down) {
            this.player.setVelocityY(-650);
        }

        this.enemies.children.iterate((e) => {
            if (!e || !e.active || e.isDying) return;
            // Esqueletos solo caminan — sin atacar
            if (!e.anims.isPlaying || e.anims.currentAnim?.key !== 'sk_anim_walk') {
                e.anims.play('sk_anim_walk', true);
            }
        });

        let m = Math.max(0, Math.floor((this.distanciaMeta - this.player.x) / 10));
        this.uiText.setText(`HP: ${this.hp}  |  Meta: ${m}m`);

        if (this.player.x >= this.distanciaMeta) this.victory();
        if (this.player.y > 720) this.scene.restart();
    }

    takeDamage(bullet) {
        // El escudo bloquea SIEMPRE las balas, y también el contacto con enemigos
        if (this.isBlocking) {
            if (bullet) {
                bullet.destroy();
                // Feedback visual de bloqueo
                this.cameras.main.flash(80, 255, 255, 255, false);
            }
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

    dañarEnemigo(enemigo) {
        if (!enemigo || !enemigo.active || enemigo.isDying) return;

        if (enemigo.hp === undefined) enemigo.hp = 3;
        enemigo.hp--;

        if (enemigo.hp <= 0) {
            // ── Muerte ──────────────────────────────────────────
            enemigo.isDying = true;
            enemigo.setImmovable(false);
            enemigo.body.allowGravity = false;
            enemigo.anims.play('sk_anim_die');
            this.cameras.main.flash(100, 255, 140, 50, false);
            enemigo.once('animationcomplete', () => {
                if (enemigo && enemigo.active) enemigo.destroy();
            });
        } else {
            // ── Daño ────────────────────────────────────────────
            enemigo.anims.play('sk_anim_hurt', true);
            enemigo.setTint(0xff6666);
            // Knockback
            enemigo.body.setImmovable(false);
            enemigo.setVelocityX(280);
            this.time.delayedCall(180, () => {
                if (enemigo && enemigo.active && !enemigo.isDying) {
                    enemigo.clearTint();
                    enemigo.setVelocityX(0);
                    enemigo.body.setImmovable(true);
                    enemigo.anims.play('sk_anim_walk', true);
                }
            });
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
            fontSize: '64px', fill: '#f1c40f',
            stroke: '#000', strokeThickness: 6
        }).setOrigin(0.5).setScrollFactor(0).setDepth(30);
        this.time.delayedCall(3000, () => this.scene.start('MainMenu'));
    }
}