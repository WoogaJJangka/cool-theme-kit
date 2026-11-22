// 한글 주석
#define MAX_LIGHTS 4

cbuffer PerFrame : register(b0)
{
    float4x4 viewProjection;
    float time;
};

Texture2D albedo : register(t0);
SamplerState linearSampler;

struct VSOutput
{
    float4 position : SV_Position;
    float2 uv : TEXCOORD0;
};

float4 main(VSOutput input) : SV_Target
{
    float4 color = albedo.Sample(linearSampler, input.uv);
    return saturate(color * 0.5f + float4(1.0, 0, 0, 1));
}
