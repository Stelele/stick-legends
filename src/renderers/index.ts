import type { GameObject } from "../GameObjects";
import { WebGLRenderer } from "./webgl";
import { WebGPURenderer } from "./webgpu/webgpu";

export interface Renderer {
    init: (canvas: HTMLCanvasElement) => Promise<void>;
    render: (dt: number, gameObjects: GameObject[]) => void;
}

export class RendererManager {
    private renderer: Renderer | null = null
    private isInitialized: boolean = false

    public async init(canvas: HTMLCanvasElement) {
        this.renderer = await this.getWebGPURenderer()
        if (!this.renderer) {
            // this.renderer = await this.getWebGLRenderer()
            alert('WebGPU not supported, falling back to WebGL is currently disabled.')
            throw new Error('WebGPU not supported')
        }

        try {
            await this.renderer.init(canvas)
        } catch {
            // this.renderer = await this.getWebGLRenderer()
            // await this.renderer.init(canvas)
            alert('WebGPU not supported, falling back to WebGL is currently disabled.')
            throw new Error('WebGPU not supported')
        }

        this.isInitialized = true
    }

    public render(dt: number, gameObjects: GameObject[]) {
        if (!this.isInitialized || !this.renderer) return
        for (const gameObject of gameObjects) {
            gameObject.update(dt)
        }
        this.renderer.render(dt, gameObjects)
    }

    private async getWebGLRenderer(): Promise<Renderer> {
        return new WebGLRenderer()
    }

    private async getWebGPURenderer(): Promise<Renderer | null> {
        if (!navigator.gpu) {
            return null
        }

        const adapter = await navigator.gpu.requestAdapter()
        if (!adapter) {
            return null
        }
        const device = await adapter.requestDevice()
        if (!device) {
            return null
        }

        return new WebGPURenderer(device)
    }
}