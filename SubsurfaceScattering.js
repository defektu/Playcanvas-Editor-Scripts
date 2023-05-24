// ==UserScript==
// @name        Playcanvas - SSS
// @namespace   defektu
// @match       https://playcanvas.com/editor/*
// @exclude-match https://playcanvas.com/editor/code/*
// @grant       none
// @version     0.1
// @author      @defektu
// @description Adds Subsurface Scattering in editor
// ==/UserScript==

(function () {
  "use strict";
  const logCssStyle = "color: white; background-color: #2ecc71";
  const onEngineLoaded = function () {
    console.log("%c SSS loaded ", logCssStyle);

    var falloffLinearPS = `
#define LIGHTS_AVAILABLE

int pointLightCount = 0;
vec3 lightPointsPos[255];
float lightPointsRad[255];

float getFalloffLinear(float lightRadius, vec3 lightDir) {
    float d = length(lightDir);

    lightPointsRad[pointLightCount] = lightRadius;
    pointLightCount = pointLightCount + 1;

    return max(((lightRadius - d) / lightRadius), 0.0);
}
`;

    var lightDirPointPS = `
void getLightDirPoint(vec3 lightPosW) {

    dLightDirW = vPositionW - lightPosW;
    dLightDirNormW = normalize(dLightDirW);
    dLightPosW = lightPosW;

    lightPointsPos[pointLightCount] = dLightPosW;
}
`;
    var refractionDynamicPS = `
float thicknessDistortion = -0.2;
float thicknessAmbient = 0.0;
float thicknessAttenuation = 1.0;
float thicknessPower = 2.;
float thicknessScale = 1.;


// Refraction PS


uniform float material_refractionIndex;
uniform float material_invAttenuationDistance;
uniform vec3 material_attenuation;

#if undefined(LIGHTS_AVAILABLE)
    // int pointLightCount = 0;
#else
    int pointLightCount = -1;
#endif

vec3 addSSS(
    vec3 worldNormal,
    vec3 viewDir,
    float thickness,
    float gloss,
    vec3 specularity,
    vec3 albedo,
    float transmission
    #if defined(LIT_IRIDESCENCE)
        , vec3 iridescenceFresnel,
        IridescenceArgs iridescence
    #endif
) {
        float thicknessFalloff = thicknessPower;

        float attenuation;
        for (int i = 0; i < pointLightCount; i++)
        {
            float lightScale;
            lightScale = lightPointsRad[i] * thicknessScale;

            vec3 geometryNormal = dNormalW.xyz;
            vec3 geometryViewDir = dViewDirW;
            float SSS = pow(saturate(lightScale / distance(lightPointsPos[i].xyz + (geometryNormal * thicknessDistortion), vPositionW.xyz)), (thicknessFalloff * thicknessFalloff));

            SSS *= thicknessAttenuation;
            attenuation += SSS;
        };

        vec3 thicknessCalc = vec3(material_attenuation.rgb * thickness);

        vec4 finalCol;

        finalCol.rgb += thicknessCalc * (attenuation + thicknessAmbient) ;

        return finalCol.rgb;

}

vec3 refract2(vec3 viewVec, vec3 normal, float IOR) {
    float vn = dot(viewVec, normal);
    float k = 1.0 - IOR * IOR * (1.0 - vn * vn);
    vec3 refrVec = IOR * viewVec - (IOR * vn + sqrt(k)) * normal;
    return refrVec;
}

void addRefraction(
    vec3 worldNormal,
    vec3 viewDir,
    float thickness,
    float gloss,
    vec3 specularity,
    vec3 albedo,
    float transmission
#if defined(LIT_IRIDESCENCE)
    , vec3 iridescenceFresnel,
    IridescenceArgs iridescence
#endif
) {
    vec3 modelScale;
    modelScale.x = length(vec3(matrix_model[0].xyz));
    modelScale.y = length(vec3(matrix_model[1].xyz));
    modelScale.z = length(vec3(matrix_model[2].xyz));
    vec3 refractionVector = normalize(refract(-viewDir, worldNormal, material_refractionIndex)) * thickness * modelScale;
    vec4 pointOfRefraction = vec4(vPositionW + refractionVector, 1.0);
    vec4 projectionPoint = matrix_viewProjection * pointOfRefraction;
    vec2 uv = getGrabScreenPos(projectionPoint);
    float iorToRoughness = (1.0 - gloss) * clamp((1.0 / material_refractionIndex) * 2.0 - 2.0, 0.0, 1.0);
    float refractionLod = log2(uScreenSize.x) * iorToRoughness;
    vec3 refraction = texture2DLodEXT(uSceneColorMap, uv, refractionLod).rgb;
    vec3 transmittance;
    if (material_invAttenuationDistance != 0.0) {
        vec3 attenuation = -log(material_attenuation) * material_invAttenuationDistance;
        transmittance = exp(-attenuation * length(refractionVector));
    }
    else {
        transmittance = refraction;
    }

    vec3 fresnel = vec3(1.0) - getFresnel(dot(viewDir, worldNormal), gloss, specularity);
    dDiffuseLight = mix(dDiffuseLight, refraction * transmittance * fresnel, transmission);


    #if undefined(LIGHTS_AVAILABLE)
        dDiffuseLight += addSSS(
            worldNormal,
            viewDir,
            thickness,
            gloss,
            specularity,
            albedo,
            transmission
            #if defined(LIT_IRIDESCENCE)
                , iridescenceFresnel,
                IridescenceArgs iridescence
            #endif
        );
    #endif
}
`;

    console.log(pc.shaderChunks);

    pc.shaderChunks.falloffLinearPS = falloffLinearPS;

    pc.shaderChunks.lightDirPointPS = lightDirPointPS;

    pc.shaderChunks.refractionDynamicPS = refractionDynamicPS;
  };

  // Wait for the PlayCanvas application to be loaded
  const intervalId = setInterval(function () {
    if (pc.Application.getApplication()) {
      onEngineLoaded();
      clearInterval(intervalId);
    }
  }, 500);
})();
