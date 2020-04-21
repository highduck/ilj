export const enum ProgramUniform {

    MVP = "uModelViewProjection",
    DepthMVP = "u_depth_mvp",
    ModelMatrix = "uModel",
    NormalMatrix = "u_normal_matrix",
    ViewPosition = "uViewPos",
    FrameTime = "u_time",
    FrameResolution = "u_resolution",
    Offset2D = "uOffset",
    Image0 = "uImage0",
    ImageShadowMap = "u_image_shadow_map",

    // light props
    LightPosition = "u_light_position",
    LightAmbient = "u_light_ambient",
    LightDiffuse = "u_light_diffuse",
    LightSpecular = "u_light_specular",

    PointLightRadius = "u_point_light_radius",
    PointLightFalloff = "u_point_light_falloff",

    // directional lighting
    Light0Position = "u_light0_position",
    Light0Ambient = "u_light0_ambient",
    Light0Diffuse = "u_light0_diffuse",
    Light0Specular = "u_light0_specular",

    // material uniforms
    MaterialAmbient = "u_material_ambient",
    MaterialDiffuse = "u_material_diffuse",
    MaterialSpecular = "u_material_specular",
    MaterialShininess = "u_material_shininess",
    MaterialEmission = "u_material_emission",

}
