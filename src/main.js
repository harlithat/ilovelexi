import Phaser from "phaser"

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  preload() {
    this.load.spritesheet("heart", "/assets/heart.png", {
      frameWidth: 40,
      frameHeight: 40
    })

    this.load.spritesheet("banana", "/assets/banana.png", {
      frameWidth: 55,
      frameHeight: 123
    })

    this.load.audio("pop", "/assets/bubblepop.mp3")
  }

  init(data) {
    this.started = data.started || false
  }

  create() {
    if (!this.started) {
      this.showIntroScreen()
      return
    }

    this.score = 0
    this.timeLeft = 30
    this.wave = 1
    this.heartCount = 0
    this.shapes = []
    this.gameEnded = false
    this.banana = null

    this.createBackground()

    const width = this.scale.width

    this.scoreText = this.add.text(20, 20, "0", {
      fontSize: "32px",
      color: "#ffffff",
      fontFamily: "Arial"
    })

    this.timerText = this.add.text(width - 20, 20, "30", {
      fontSize: "32px",
      color: "#ffffff",
      fontFamily: "Arial"
    }).setOrigin(1, 0)

    this.ruleText = this.add.text(width / 2, 90, "TAP ALL HEARTS", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5)

    this.popSound = this.sound.add("pop")

    this.anims.create({
      key: "heartPulse",
      frames: this.anims.generateFrameNumbers("heart", {
        start: 0,
        end: 15
      }),
      frameRate: 20,
      repeat: 0
    })

    this.anims.create({
      key: "bananaFlash",
      frames: this.anims.generateFrameNumbers("banana", {
        start: 0,
        end: 1
      }),
      frameRate: 6,
      repeat: -1
    })

    this.startCountdown()
    this.spawnWave()
    this.scheduleNextBanana()
  }

  showIntroScreen() {
    const width = this.scale.width
    const height = this.scale.height

    this.createBackground()

    const introText = `B”H

To my gorgeous Lexi,

In honor of our 15th Anniversary, I built you a game.

See how many hearts you can tap. My record is 56.

With endless love from your adoring and nerdy (but cool) husband`

    this.add.text(width / 2, height / 2 - 40, introText, {
      fontSize: "18px",
      color: "#ffffff",
      fontFamily: "Arial",
      align: "center",
      wordWrap: { width: width - 60 }
    }).setOrigin(0.5)

    const startText = this.add.text(width / 2, height - 120, "Tap to Begin ❤️", {
      fontSize: "22px",
      color: "#ff8080",
      fontStyle: "bold"
    }).setOrigin(0.5)

    this.tweens.add({
      targets: startText,
      scale: 1.08,
      yoyo: true,
      repeat: -1,
      duration: 800,
      ease: "Sine.easeInOut"
    })

    this.input.once("pointerdown", () => {
      this.startGame()
    })
  }

  startGame() {
    this.scene.restart({ started: true })
  }

  createBackground() {
    const width = this.scale.width
    const height = this.scale.height

    const bg = this.add.graphics()
    bg.fillGradientStyle(0x1e1e2f, 0x1e1e2f, 0x121220, 0x121220, 1)
    bg.fillRect(0, 0, width, height)
  }

  startCountdown() {
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameEnded) return

        this.timeLeft--
        this.timerText.setText(this.timeLeft)

        if (this.timeLeft <= 0) {
          this.endGame()
        }
      }
    })
  }

  spawnWave() {
    this.clearShapes()
    this.heartCount = 0

    const totalHearts = 8 + this.wave * 3

    for (let i = 0; i < totalHearts; i++) {
      this.spawnHeart()
    }

    this.wave++
  }

  spawnHeart() {
    const width = this.scale.width
    const height = this.scale.height
    const padding = 80
    const maxAttempts = 80

    let x, y
    let valid = false
    let attempts = 0

    while (!valid && attempts < maxAttempts) {
      x = Phaser.Math.Between(60, width - 60)
      y = Phaser.Math.Between(150, height - 60)

      valid = true

      for (let existing of this.shapes) {
        const dist = Phaser.Math.Distance.Between(x, y, existing.x, existing.y)
        if (dist < padding) {
          valid = false
          break
        }
      }

      attempts++
    }

    const heart = this.add.sprite(x, y, "heart", 0)
    heart.setScale(2.2)
    heart.setOrigin(0.5)

    heart.setInteractive({ useHandCursor: true })
    heart.on("pointerdown", () => this.handleTap(heart))

    heart.scale = 0
    this.tweens.add({
      targets: heart,
      scale: 2.2,
      duration: 250,
      ease: "Back.Out"
    })

    this.shapes.push(heart)
    this.heartCount++
  }

  handleTap(heart) {
    if (this.gameEnded) return

    this.popSound.setRate(Phaser.Math.FloatBetween(0.92, 1.12))
    this.popSound.play()

    heart.disableInteractive()

    this.score++
    this.scoreText.setText(this.score)

    this.heartCount--

    heart.play("heartPulse")

    heart.once("animationcomplete", () => {
      this.tweens.add({
        targets: heart,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => heart.destroy()
      })
    })

    this.shapes = this.shapes.filter(s => s !== heart)

    if (this.heartCount === 0) {
      this.spawnWave()
    }
  }

  // =========================
  // BANANA POWER-UP
  // =========================

  scheduleNextBanana() {
    const delayOptions = [6000, 12000, 18000]
    const delay = Phaser.Utils.Array.GetRandom(delayOptions)

    this.time.delayedCall(delay, () => {
      if (!this.gameEnded) {
        this.spawnBanana()
      }
    })
  }

  spawnBanana() {
    const width = this.scale.width
    const height = this.scale.height
    const padding = 100
    const maxAttempts = 80

    let x, y
    let valid = false
    let attempts = 0

    while (!valid && attempts < maxAttempts) {
      x = Phaser.Math.Between(60, width - 60)
      y = Phaser.Math.Between(150, height - 60)

      valid = true

      for (let heart of this.shapes) {
        const dist = Phaser.Math.Distance.Between(x, y, heart.x, heart.y)
        if (dist < padding) {
          valid = false
          break
        }
      }

      attempts++
    }

    if (!valid) {
      this.scheduleNextBanana()
      return
    }

    this.banana = this.add.sprite(x, y, "banana", 0)
    this.banana.setScale(2)
    this.banana.play("bananaFlash")

    this.banana.setInteractive({ useHandCursor: true })
    this.banana.on("pointerdown", () => this.handleBananaTap())

    this.time.delayedCall(2000, () => {
      if (this.banana) {
        this.banana.destroy()
        this.banana = null
        this.scheduleNextBanana()
      }
    })
  }

  handleBananaTap() {
    if (!this.banana || this.gameEnded) return

    this.score += 3
    this.scoreText.setText(this.score)

    this.banana.destroy()
    this.banana = null

    this.scheduleNextBanana()
  }

  clearShapes() {
    for (let shape of this.shapes) {
      shape.destroy()
    }
    this.shapes = []
  }

  endGame() {
    if (this.gameEnded) return
    this.gameEnded = true

    this.timerEvent.remove(false)
    this.clearShapes()

    if (this.banana) {
      this.banana.destroy()
      this.banana = null
    }

    const width = this.scale.width
    const height = this.scale.height

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.85)

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "38px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 10, `Score: ${this.score}`, {
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 60, "Tap to Play Again", {
      fontSize: "20px",
      color: "#aaaaaa"
    }).setOrigin(0.5)

    overlay.setInteractive()
    overlay.once("pointerdown", () => {
      this.scene.restart()
    })
  }
}

const config = {
  type: Phaser.AUTO,
  backgroundColor: "#000000",
  pixelArt: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844
  },
  scene: GameScene
}

new Phaser.Game(config)
