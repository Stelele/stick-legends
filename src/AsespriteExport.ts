/** Top-level shape of an Aseprite JSON export */
export interface AsepriteJSON {
    frames: Record<string, AsepriteFrame>
    meta: AsepriteMeta
}

/** A single frame entry inside `frames` */
export interface AsepriteFrame {
    frame: AsepriteRect
    rotated: boolean
    trimmed: boolean
    spriteSourceSize: AsepriteRect
    sourceSize: AsepriteSize
    duration: number // milliseconds
}

/** Rectangle with position and size */
export interface AsepriteRect {
    x: number
    y: number
    w: number
    h: number
}

/** Size-only structure */
export interface AsepriteSize {
    w: number
    h: number
}

/** Metadata block */
export interface AsepriteMeta {
    app: string                 // e.g. "https://www.aseprite.org/"
    version: string             // e.g. "1.3.15.2-x64"
    image: string               // e.g. "ground_monk_FREE_1.3.1.png"
    format: string              // e.g. "RGBA8888"
    size: AsepriteSize          // spritesheet size
    scale: string               // typically "1"
    frameTags: AsepriteFrameTag[]
    layers: AsepriteLayer[]
    slices: AsepriteSlice[]     // often empty
}

/** Tag ranges that define animation clips */
export interface AsepriteFrameTag {
    name: string                // e.g. "idle", "run", ...
    from: number                // starting frame index (inclusive)
    to: number                  // ending frame index (inclusive)
    direction: AsepriteDirection
    color?: string              // hex RGBA, e.g. "#000000ff"
}

/** Standard Aseprite tag directions */
export type AsepriteDirection = "forward" | "reverse" | "pingpong"

/** Layer info `blendMode` varies by doc/settings so keep string */
export interface AsepriteLayer {
    name: string
    opacity: number             // 0..255
    blendMode: string           // e.g. "normal"
}

/** Optional slices (named regions) present but empty in your JSON */
export interface AsepriteSlice {
    name: string
    color?: string
    keys: AsepriteSliceKey[]
}

/** Slice keyframes (Aseprite supports per-key bounds & center) */
export interface AsepriteSliceKey {
    frame: number
    bounds: AsepriteRect
    center?: AsepriteRect
    pivot?: { x: number; y: number }
}
