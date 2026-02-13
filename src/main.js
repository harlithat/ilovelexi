import Phaser from "phaser"

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  preload() {
    // Load the heart sheet as a single image (NOT a spritesheet grid)
    this.load.image("heartSheet", "/assets/heart.png")
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

    // Build frames from the PNG (manually cropped rectangles)
    this.defineHeartFrames()

    // Create animation from those frames
    this.anims.create({
      key: "heartPulse",
      frames: Array.from({ length: 18 }, (_, i) => ({ key: "heartSheet", frame: `heart_${i}` })),
      frameRate: 24,
      repeat: 0
    })

    this.startCountdown()
    this.spawnWave()
  }

  defineHeartFrames() {
    const tex = this.textures.get("heartSheet")

    // IMPORTANT:
    // These rectangles match YOUR uploaded PNG layout (1024x1024) which is NOT a uniform grid.
    // Format: [x, y, w, h]
    const frames = [
      // Row 1 (5 hearts, left -> right)
      [43, 102, 113, 96],
      [181, 93, 136, 115],
      [338, 75, 173, 147],
      [528, 62, 205, 170],
      [764, 51, 222, 188],

      // Row 2 (4 hearts, left -> right)
      [19, 306, 223, 192],
      [264, 299, 281, 229],
      [571, 304, 251, 209],
      [815, 303, 209, 186],

      // Row 3 (4 hearts, left -> right)
      [29, 541, 264, 233],
      [329, 548, 265, 223],
      [612, 548, 265, 221],
      [827, 548, 213, 205],

      // Row 4 (5 hearts, left -> right)
      [75, 868, 99, 88],
      [295, 865, 109, 95],
      [495, 865, 109, 96],
      [675, 865, 107, 96],
      [843, 865, 109, 97]
    ]

    for (let i = 0; i < frames.length; i++) {
      const [x, y, w, h] = frames[i]
      tex.add(`heart_${i}`, 0, x, y, w, h)
    }
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

    // Use bigger spacing because hearts can animate larger
    const size = 60
    const padding = 70
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

    const heart = this.add.sprite(x, y, "heartSheet", "heart_0")
    heart.setOrigin(0.5)

    // scale to suit your game; tweak if needed
    heart.setScale(0.55)

    // generous hit area (independent of frame crop)
    heart.setInteractive(new Phaser.Geom.Circle(0, 0, 60), Phaser.Geom.Circle.Contains)

    heart.shapeType = "heart"

    heart.on("pointerdown", () => this.handleTap(heart))

    // Spawn pop
    heart.scale = 0
    this.tweens.add({
      targets: heart,
      scale: 0.55,
      duration: 250,
      ease: "Back.Out"
    })

    this.shapes.push(heart)
    this.heartCount++
  }

  handleTap(heart) {
    if (this.gameEnded) return

    // prevent double taps while animating
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
