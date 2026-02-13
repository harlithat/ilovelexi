import Phaser from "phaser"

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  preload() {
    // 🔥 LOAD HEART SPRITE SHEET
    this.load.spritesheet("heart", "/assets/heart.png", {
      frameWidth: 200,
      frameHeight: 200
    })
  }

  create() {
    this.score = 0
    this.timeLeft = 30
    this.wave = 1
    this.heartCount = 0
    this.shapes = []
    this.gameEnded = false

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
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5)

    // 🎬 CREATE HEART ANIMATION
    this.anims.create({
      key: "heartPulse",
      frames: this.anims.generateFrameNumbers("heart", {
        start: 0,
        end: 19
      }),
      frameRate: 24,
      repeat: 0
    })

    this.startCountdown()
    this.spawnWave()
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

    let totalShapes = 8 + this.wave * 3

    for (let i = 0; i < totalShapes; i++) {
      this.spawnHeart()
    }

    this.wave++
  }

  spawnHeart() {
    const width = this.scale.width
    const height = this.scale.height

    const size = 70
    const padding = 60
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
        if (dist < size + padding) {
          valid = false
          break
        }
      }

      attempts++
    }

    const heart = this.add.sprite(x, y, "heart", 0)
    heart.setScale(0.35)

    heart.setInteractive()
    heart.shapeType = "heart"

    heart.on("pointerdown", () => {
      this.handleTap(heart)
    })

    // Spawn pop animation
    heart.scale = 0
    this.tweens.add({
      targets: heart,
      scale: 0.35,
      duration: 250,
      ease: "Back.Out"
    })

    this.shapes.push(heart)
    this.heartCount++
  }

  handleTap(heart) {
    if (this.gameEnded) return

    this.score++
    this.scoreText.setText(this.score)

    this.heartCount--

    // ▶️ Play sprite sheet animation
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

    const width = this.scale.width
    const height = this.scale.height

    const overlay = this.add.rectangle(
      width / 2,
      height / 2,
      width,
      height,
      0x000000,
      0.85
    )

    this.add.text(width / 2, height / 2 - 40, "GAME OVER", {
      fontSize: "38px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 10, `Score: ${this.score}`, {
      fontSize: "26px",
      color: "#ffffff"
    }).setOrigin(0.5)

    this.add.text(width / 2, height / 2 + 60, "Tap to Restart", {
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
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 390,
    height: 844
  },
  scene: GameScene
}

new Phaser.Game(config)
