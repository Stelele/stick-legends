import { Fighter } from "./assets/Fighter"
import type { GameObject, GameWorld } from "./GameObjects"
import { RendererManager } from "./renderers"

const appDiv = document.querySelector<HTMLDivElement>('#app')
const canvas = document.createElement('canvas')
export const gameWorld: GameWorld = {
  width: 1280,
  height: 720,
  depth: 10,
}

function resizeCanvas() {
  const scale = Math.min(window.innerWidth / 16, window.innerHeight / 9)
  canvas.width = 16 * scale
  canvas.height = 9 * scale

  const widthSpace = window.innerWidth - canvas.width
  const heightSpace = window.innerHeight - canvas.height
  canvas.style.marginLeft = `${widthSpace / 2}px`
  canvas.style.marginTop = `${heightSpace / 2}px`
}
window.addEventListener('resize', resizeCanvas)
resizeCanvas()

appDiv?.appendChild(canvas)

const renderer = new RendererManager()
await renderer.init(canvas)

const fighter = new Fighter("monk")
await fighter.init()
const gameObjects: GameObject[] = [fighter]
let prevTime = 0

function gameLoop(time: number) {
  const dt = (time - prevTime) / 1000
  prevTime = time

  renderer.render(dt, gameObjects)
  requestAnimationFrame(gameLoop)
}

gameLoop(0)
