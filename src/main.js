import Phaser from "phaser"

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  create() {
    this.score = 0
    this.timeLeft = 30
    this.wave = 1
    this.squareCount = 0
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

    this.ruleText = this.add.text(width / 2, 90, "TAP ALL SQUARES", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5)

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
    this.squareCount = 0

    let totalShapes = 8 + this.wave * 3
    let availableShapes = ["square"]

    if (this.wave >= 2) availableShapes.push("triangle")
    if (this.wave >= 3) availableShapes.push("circle")

    for (let i = 0; i < totalShapes; i++) {
      const type = Phaser.Utils.Array.GetRandom(availableShapes)
      this.spawnShape(type)
    }

    this.wave++
  }

  spawnShape(type) {
    const width = this.scale.width
    const height = this.scale.height

    const size = 26
    const padding = 22
    const maxAttempts = 80

    let x, y
    let valid = false
    let attempts = 0

    while (!valid && attempts < maxAttempts) {
      x = Phaser.Math.Between(50, width - 50)
      y = Phaser.Math.Between(150, height - 50)

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

    const container = this.add.container(x, y)
    const graphic = this.add.graphics()

    if (type === "square") {
      graphic.fillStyle(0x4da6ff)
      graphic.fillRoundedRect(-size/2, -size/2, size, size, 6)
      this.squareCount++
    }

    if (type === "triangle") {
      graphic.fillStyle(0xff6b6b)
      graphic.fillTriangle(0, -size/2, -size/2, size/2, size/2, size/2)
    }

    if (type === "circle") {
      graphic.fillStyle(0x4dffb8)
      graphic.fillCircle(0, 0, size/2)
    }

    container.add(graphic)

    // Generous hitbox
    container.setSize(size + 20, size + 20)
    container.setInteractive()

    container.shapeType = type

    container.on("pointerdown", () => {
      this.handleTap(container)
    })

    // Spawn animation
    container.scale = 0
    this.tweens.add({
      targets: container,
      scale: 1,
      duration: 250,
      ease: "Back.Out"
    })

    this.shapes.push(container)
  }

  handleTap(shape) {
    if (this.gameEnded) return

    if (shape.shapeType === "square") {
      this.score++
      this.scoreText.setText(this.score)

      this.squareCount--

      this.tweens.add({
        targets: shape,
        scale: 0,
        alpha: 0,
        duration: 200,
        onComplete: () => shape.destroy()
      })

      this.shapes = this.shapes.filter(s => s !== shape)

      if (this.squareCount === 0) {
        this.spawnWave()
      }

    } else {
      this.endGame()
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
