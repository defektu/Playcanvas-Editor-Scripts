// ==UserScript==
// @name        Playcanvas - SSS
// @namespace   defektu
// @match       https://playcanvas.com/editor/*
// @exclude-match https://playcanvas.com/editor/code/*
// @grant       none
// @version     0.2
// @author      @defektu
// @description Adds Subsurface Scattering in editor
// ==/UserScript==

function replaceLast(input, search, replace) {
  var a = input.split("");
  var length = search.length;
  if (input.lastIndexOf(search) != -1) {
    for (
      var i = input.lastIndexOf(search);
      i < input.lastIndexOf(search) + length;
      i++
    ) {
      if (i == input.lastIndexOf(search)) {
        a[i] = replace;
      } else {
        delete a[i];
      }
    }
  }

  return a.join("");
}

(function () {
  "use strict";
  const logCssStyle = "color: white; background-color: #2ecc71";
  const onEngineLoaded = function () {
    console.log("%c SSS loaded ", logCssStyle);

    // falloffLinearPS changes

    pc.shaderChunks.falloffLinearPS = pc.shaderChunks.falloffLinearPS.replace(
      "float getFalloffLinear",
      `
            #define LIGHTS_AVAILABLE

            int pointLightCount = 0;
            vec3 lightPointsPos[255];
            float lightPointsRad[255];

            float getFalloffLinear
            `,
    );

    pc.shaderChunks.falloffLinearPS = pc.shaderChunks.falloffLinearPS.replace(
      "return",
      `
      lightPointsRad[pointLightCount] = lightRadius;
      pointLightCount = pointLightCount + 1;

      return
      `,
    );

    // lightDirPointPS changes

    pc.shaderChunks.lightDirPointPS = pc.shaderChunks.lightDirPointPS.replace(
      "}",
      `
          lightPointsPos[pointLightCount] = dLightPosW;
      }
      `,
    );

    var sssPS = `
              float thicknessDistortion = -0.2;
              float thicknessAmbient = 0.0;
              float thicknessAttenuation = 1.0;
              float thicknessPower = 2.;
              float thicknessScale = 1.;

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
              `;
    pc.shaderChunks.refractionDynamicPS = replaceLast(
      pc.shaderChunks.refractionDynamicPS,
      "}",
      `
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
      `,
    );

    pc.shaderChunks.refractionDynamicPS =
      pc.shaderChunks.refractionDynamicPS.replace(
        "void addRefraction",
        sssPS + "void addRefraction",
      );
  };

  const intervalId = setInterval(function () {
    if (pc.Application.getApplication()) {
      onEngineLoaded();
      clearInterval(intervalId);
    }
  }, 200);
})();
