export const WGSLShaderCode = /* wgsl */ `
    struct VertexOutput {
        @builtin(position) position: vec4f,
        @location(0) texCord: vec2f,
    };
    
    struct VertextInput {
        @location(0) position: vec3f,
        @location(1) texCord: vec2f,
    };

    struct Dimensions {
        world: vec2f,
        screen: vec2f,
    }

    @group(0) @binding(0) var ourSampler: sampler;
    @group(0) @binding(1) var ourTexture: texture_2d<f32>;
    @group(0) @binding(2) var<uniform> dims: Dimensions;

    @vertex fn vs(
        input: VertextInput
    ) -> VertexOutput {
        var position = input.position;
        var temp = 2 * (position.xy / dims.world) - 1;
        position.x = temp.x;
        position.y = temp.y;

        let texCord = input.texCord;

        var vsOut: VertexOutput;
        vsOut.position = vec4f(position, 1.0);
        vsOut.texCord = texCord;

        return vsOut;
    
    }

    @fragment fn fs(input: VertexOutput) -> @location(0) vec4f {
        // return vec4f(1.0, 0.0, 0.0, 1.0);
        return textureSample(ourTexture, ourSampler, input.texCord);
    }
`