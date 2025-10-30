import type { AsepriteJSON } from "../AsespriteExport";
import type { Animation, CurrentAnimation, GameObject, Image, Position, Size } from "../GameObjects";
import { loadImageBitmap } from "../helpers/getBitmapImage";
import { gameWorld } from "../main";

export class Fighter implements GameObject {
    public id: string
    public assetPath: string
    public x: number = 0
    public y: number = 0

    public get pos(): Position {
        return {
            x: this.x,
            y: gameWorld.height - this.size.h - this.y,
            z: 0,
        }
    }
    public size: Size
    public image?: Image
    public animations: Record<string, Animation>
    public curAnimation: CurrentAnimation
    private curTime = 0
    private loopTime = 0
    private animationNames: string[] = []

    public constructor(id: string, assetPath = "/ground_monk") {
        this.id = id

        this.size = {
            w: 240,
            h: 240,
        }

        this.assetPath = assetPath
        this.animations = {}
        this.curAnimation = {
            name: "",
            nameIndex: 0,
            currentFrame: 0,
        }
    }

    public async init() {
        const [bitMap, animationData] = await Promise.all([
            loadImageBitmap(`${this.assetPath}.png`),
            fetch(`${this.assetPath}.json`).then(r => r.json() as Promise<AsepriteJSON>),
        ])
        this.image = {
            url: `${this.assetPath}.png`,
            width: bitMap.width,
            height: bitMap.height,
            bitMap: bitMap,
        }

        const animationTypes = Object.keys(animationData["frames"]).map(
            (frame) => frame.replace(/(-[0-9]+)$/g, ""))
        const frameNums: Record<string, number> = {}
        for (const animationType of animationTypes) {
            if (!(animationType in frameNums)) {
                frameNums[animationType] = 0
            }
            frameNums[animationType] += 1
        }

        for (const name in frameNums) {
            const framesData: Animation = {
                frames: [],
                duration: 100 / 1000,
            }

            for (let i = 0; i < frameNums[name]; i++) {
                const frame = animationData["frames"][`${name}-${i}`]
                framesData.frames.push({
                    x: frame['frame'].x,
                    y: frame['frame'].y,
                    w: frame['frame'].w,
                    h: frame['frame'].h,
                })
            }

            this.animations[name] = framesData
        }

        this.animationNames = Object.keys(this.animations)
        this.curAnimation.name = this.animationNames[this.curAnimation.nameIndex]
    }

    public update(dt: number) {
        this.curTime += dt
        if (this.curTime > this.animations[this.curAnimation.name].duration) {
            this.curTime = 0
            this.curAnimation.currentFrame += 1
            if (this.curAnimation.currentFrame >= this.animations[this.curAnimation.name].frames.length) {
                this.curAnimation.currentFrame = 0
                this.loopTime += 1
            }
        }

        if (this.loopTime > 5) {
            this.curAnimation.nameIndex = (this.curAnimation.nameIndex + 1) % this.animationNames.length
            this.loopTime = 0
            this.curAnimation.name = this.animationNames[this.curAnimation.nameIndex]
            this.curAnimation.currentFrame = 0
        }
    }
}