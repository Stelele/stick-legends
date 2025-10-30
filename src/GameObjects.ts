export interface GameObject {
    id: string
    assetPath: string
    pos: Position
    size: Size
    image?: Image
    animations: Record<string, Animation>
    curAnimation: CurrentAnimation
    init: () => Promise<void>
    update: (dt: number) => void
}

export interface Position {
    x: number
    y: number
    z: number
}

export interface Size {
    w: number
    h: number
}

export interface Image {
    url: string
    width: number
    height: number
    bitMap: ImageBitmap
}

export interface CurrentAnimation {
    name: string
    nameIndex: number
    currentFrame: number
}

export interface Animation {
    frames: {
        x: number
        y: number
        w: number
        h: number
    }[]
    duration: number
}

export interface GameWorld {
    width: number
    height: number
    depth: number
}