import Phaser from "phaser"

const shapes = ["circle", "square", "triangle"]

class GameScene extends Phaser.Scene {
  constructor() {
    super("GameScene")
  }

  create() {
    this.lives = 3
    this.score = 0
    this.combo = 0
    this.multiplier = 1
    this.spawnDelay = 1000
    this.waveDuration = 10000
    this.startTime = this.time.now
    this.fallBaseSpeed = 180

    this.scoreText = this.add.text(20, 20, "Score: 0", {
      fontSize: "22px",
      color: "#ffffff"
    })

    this.comboText = this.add.text(20, 50, "Combo: x1", {
      fontSize: "22px",
      color: "#00ffcc"
    })

    this.livesText = this.add.text(650, 20, "Lives: ♥♥♥", {
      fontSize: "22px",
      color: "#ffffff"
    })

    this.targetLabel = this.add.text(400, 60, "Tap This Shape:", {
      fontSize: "24px",
      color: "#ffffff"
    }).setOrigin(0.5)

    this.targetShape = Phaser.Utils.Array.GetRandom(shapes)
    this.drawTargetIcon(true)

    this.fallingShapes = []

    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this.spawnShape,
      callbackScope: this,
      loop: true
    })

    this.waveTimer = this.time.addEvent({
      delay: this.waveDuration,
      callback: this.changeWave,
      callbackScope: this,
      loop: true
    })
  }

  update(time, delta) {
    const elapsed = this.time.now - this.startTime

    if (elapsed > 15000) this.spawnTimer.delay = 800
    if (elapsed > 30000) this.spawnTimer.delay = 600
    if (elapsed > 45000) this.spawnTimer.delay = 450

    for (let i = this.fallingShapes.length - 1; i >= 0; i--) {
      const obj = this.fallingShapes[i]

      obj.speed += 20 * (delta / 1000)
      obj.y += obj.speed * (delta / 1000)

      if (obj.y > 650) {
        if (obj.shapeType === this.targetShape) {
          this.resetCombo()
          this.loseLife()
        }
        obj.destroy()
        this.fallingShapes.splice(i, 1)
      }
    }
  }

  spawnShape() {
    const shapeType = Phaser.Utils.Array.GetRandom(shapes)
    const x = Phaser.Math.Between(100, 700)

    const graphics = this.add.graphics()
    graphics.fillStyle(Phaser.Display.Color.RandomRGB().color)

    if (shapeType === "circle") graphics.fillCircle(0, 0, 30)
    if (shapeType === "square") graphics.fillRect(-30, -30, 60, 60)
    if (shapeType === "triangle") graphics.fillTriangle(0, -35, -35, 35, 35, 35)

    const container = this.add.container(x, -50, [graphics])
    container.shapeType = shapeType
    container.speed = this.fallBaseSpeed

    container.setSize(70, 70)
    container.setInteractive(
      new Phaser.Geom.Rectangle(-35, -35, 70, 70),
      Phaser.Geom.Rectangle.Contains
    )

    container.on("pointerdown", () => {
      this.handleTap(container)
    })

    this.fallingShapes.push(container)
  }

  handleTap(shape) {
    if (shape.shapeType === this.targetShape) {
      this.combo++
      if (this.combo % 5 === 0) {
        this.multiplier += 0.5
        this.showPerfect()
      }

      this.score += 1 * this.multiplier
    } else {
      this.resetCombo()
      this.loseLife()
    }

    shape.destroy()
    this.fallingShapes = this.fallingShapes.filter(s => s !== shape)

    this.updateUI()
  }

  resetCombo() {
    this.combo = 0
    this.multiplier = 1
  }

  changeWave() {
    this.targetShape = Phaser.Utils.Array.GetRandom(shapes)

    // Slow motion effect
    this.time.timeScale = 0.5

    this.time.delayedCall(600, () => {
      this.time.timeScale = 1
    })

    this.drawTargetIcon(true)
  }

  drawTargetIcon(flash = false) {
    if (this.targetGraphic) this.targetGraphic.destroy()

    this.targetGraphic = this.add.graphics()
    this.targetGraphic.fillStyle(0xffff00)

    const x = 400
    const y = 120

    if (this.targetShape === "circle")
      this.targetGraphic.fillCircle(x, y, 30)

    if (this.targetShape === "square")
      this.targetGraphic.fillRect(x - 30, y - 30, 60, 60)

    if (this.targetShape === "triangle")
      this.targetGraphic.fillTriangle(x, y - 35, x - 35, y + 35, x + 35, y + 35)

    if (flash) {
      this.tweens.add({
        targets: this.targetGraphic,
        alpha: 0,
        duration: 150,
        yoyo: true,
        repeat: 3
      })
    }
  }

  showPerfect() {
    const text = this.add.text(400, 300, "PERFECT!", {
      fontSize: "42px",
      color: "#00ffcc",
      fontStyle: "bold"
    }).setOrigin(0.5)

    this.tweens.add({
      targets: text,
      y: 250,
      alpha: 0,
      duration: 800,
      onComplete: () => text.destroy()
    })
  }

  loseLife() {
    this.lives--
    this.updateUI()

    if (this.lives <= 0) {
      this.gameOver()
    }
  }

  gameOver() {
    this.spawnTimer.remove(false)
    this.waveTimer.remove(false)

    this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8)

    this.add.text(400, 250, "GAME OVER", {
      fontSize: "48px",
      color: "#ff4444",
      fontStyle: "bold"
    }).setOrigin(0.5)

    this.add.text(400, 320, "Final Score: " + Math.floor(this.score), {
      fontSize: "28px",
      color: "#ffffff"
    }).setOrigin(0.5)

    this.add.text(400, 380, "Click to Restart", {
      fontSize: "22px",
      color: "#00ffcc"
    }).setOrigin(0.5)

    this.input.once("pointerdown", () => {
      this.scene.restart()
    })
  }

  updateUI() {
    this.scoreText.setText("Score: " + Math.floor(this.score))
    this.comboText.setText("Combo: x" + this.multiplier)
    this.livesText.setText("Lives: " + "♥".repeat(this.lives))
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: "#1a1a1a",
  scene: GameScene
}

new Phaser.Game(config)
