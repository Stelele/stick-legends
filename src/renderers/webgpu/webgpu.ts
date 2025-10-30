import type { Renderer } from ".."
import type { GameObject } from "../../GameObjects"
import { WGSLShaderCode } from "./shaders"
import { gameWorld } from "../../main"

export class WebGPURenderer implements Renderer {
    private device: GPUDevice
    private context!: GPUCanvasContext | null
    private bindGroupLayout!: GPUBindGroupLayout
    private pipeline!: GPURenderPipeline
    private module!: GPUShaderModule
    private sampler!: GPUSampler
    private initialized: boolean
    private textures: Record<string, GPUTexture> = {}

    constructor(device: GPUDevice) {
        this.device = device
        this.initialized = false
    }

    public async init(canvas: HTMLCanvasElement) {
        this.context = canvas.getContext('webgpu')
        if (!this.context) {
            throw new Error('WebGPU context not available')
        }

        const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
        this.context.configure({
            device: this.device,
            format: presentationFormat,
        })

        this.module = this.device.createShaderModule({
            label: 'wgsl shaders',
            code: WGSLShaderCode,
        })

        this.sampler = this.device.createSampler({
            addressModeU: 'repeat',
            addressModeV: 'repeat',
            magFilter: 'nearest',
            minFilter: 'nearest',
        })

        this.bindGroupLayout = this.device.createBindGroupLayout({
            label: 'bind group layout',
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: { type: 'non-filtering', },
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: { sampleType: 'float' },
                },
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT | GPUShaderStage.VERTEX,
                    buffer: { type: 'uniform' },
                }
            ],
        })

        const pipelineLayout = this.device.createPipelineLayout({
            label: 'pipeline layout',
            bindGroupLayouts: [this.bindGroupLayout],
        })

        this.pipeline = this.device.createRenderPipeline({
            label: 'render pipeline',
            layout: pipelineLayout,
            vertex: {
                entryPoint: 'vs',
                module: this.module,
                buffers: [
                    {
                        arrayStride: 5 * 4,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: 'float32x3',
                            },
                            {
                                shaderLocation: 1,
                                offset: 3 * 4,
                                format: 'float32x2',
                            },
                        ],
                    }
                ]
            },
            fragment: {
                entryPoint: 'fs',
                module: this.module,
                targets: [{ format: presentationFormat }],
            },
        })

        this.initialized = true
    }

    public render(dt: number, gameObjects: GameObject[]) {
        if (!this.initialized) return
        if (!this.context) return

        const renderPassDescriptor: GPURenderPassDescriptor = {
            label: 'render pass descriptor',
            colorAttachments: [
                {
                    view: this.context.getCurrentTexture().createView(),
                    clearValue: [0, 0, 0, 1],
                    loadOp: 'clear',
                    storeOp: 'store',
                }
            ],
        }

        const encoder = this.device.createCommandEncoder({ label: 'command encoder' })

        const pass = encoder.beginRenderPass(renderPassDescriptor)
        pass.setPipeline(this.pipeline)

        for (const gameObject of gameObjects) {
            if (!gameObject.image) continue
            if (!(gameObject.image.url in this.textures)) {
                const texture = this.device.createTexture({
                    label: gameObject.image.url,
                    format: 'rgba8unorm',
                    size: [gameObject.image.width, gameObject.image.height],
                    usage: GPUTextureUsage.TEXTURE_BINDING |
                        GPUTextureUsage.COPY_DST |
                        GPUTextureUsage.RENDER_ATTACHMENT,
                })

                this.device.queue.copyExternalImageToTexture(
                    { source: gameObject.image.bitMap, flipY: false },
                    { texture },
                    { width: gameObject.image.width, height: gameObject.image.height },
                )

                this.textures[gameObject.image.url] = texture
            }

            const x = gameObject.pos.x
            const y = gameObject.pos.y
            const z = gameObject.pos.z
            const w = gameObject.size.w
            const h = gameObject.size.h


            const curAnimation = gameObject.animations[gameObject.curAnimation.name]
            const curFrame = gameObject.curAnimation.currentFrame
            const frame = curAnimation.frames[curFrame]
            const iu = frame.x / gameObject.image.width
            const iv = frame.y / gameObject.image.height
            const iw = frame.w / gameObject.image.width
            const ih = frame.h / gameObject.image.height

            const vertexData = new Float32Array([
                //x, y, z, u, v
                x, y, z, iu, iv + ih,
                x + w, y, z, iu + iw, iv + ih,
                x, y + h, z, iu, iv,

                x, y + h, z, iu, iv,
                x + w, y, z, iu + iw, iv + ih,
                x + w, y + h, z, iu + iw, iv,
            ])
            const vertexBuffer = this.device.createBuffer({
                label: `vertex buffer vertices: `,
                size: 6 * 5 * 4,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            })
            this.device.queue.writeBuffer(vertexBuffer, 0, vertexData)

            const dimensionsBuffer = this.device.createBuffer({
                label: `dimensions buffer`,
                size: 2 * 4 * 4,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
            })
            this.device.queue.writeBuffer(dimensionsBuffer, 0, new Float32Array([
                gameWorld.width, gameWorld.height,
                this.context.canvas.width, this.context.canvas.height,
            ]))

            const bindGroup = this.device.createBindGroup({
                layout: this.bindGroupLayout,
                entries: [
                    { binding: 0, resource: this.sampler },
                    { binding: 1, resource: this.textures[gameObject.image.url].createView() },
                    { binding: 2, resource: { buffer: dimensionsBuffer } },
                ],
            })

            pass.setVertexBuffer(0, vertexBuffer)
            pass.setBindGroup(0, bindGroup)
            pass.draw(6)

        }
        pass.end()

        const commandBuffer = encoder.finish()
        this.device.queue.submit([commandBuffer])
    }
}