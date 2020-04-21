export class VertexDecl {
    constructor(public size: number,
                public positionComps: number,
                public normals: boolean) {
    }
}

// struct vertex_minimal_2d {
//     float2 position;
//     float2 uv;
//     premultiplied_abgr32_t cm;
// };
export const VERTEX_2D_MINIMAL: VertexDecl = new VertexDecl(8 + 8 + 4, 2, false);

// struct vertex_2d {
//     float2 position;
//     float2 uv;
//     premultiplied_abgr32_t cm;
//     abgr32_t co;
// };
export const VERTEX_2D: VertexDecl = new VertexDecl(8 + 8 + 4 + 4, 2, false);

// struct vertex_3d {
//     float3 position;
//     float3 normal;
//     float2 uv;
//     premultiplied_abgr32_t color;
//     abgr32_t color2;
// };
export const VERTEX_3D: VertexDecl = new VertexDecl(12 + 12 + 8 + 4 + 4, 3, true);
