# PlayCanvas Subsurface Scattering

SSS for PlayCanvas Editor

## Usage

### Editor

Install this via Violentmonkey. 

Enable Dynamic Refractions for materials.

## Features

Light radius affects how SSS is processed
Material attenuation color, scale affects how effect is processed.

You can fiddle with these settings from script.

```glsl
float thicknessDistortion = -0.2;
float thicknessAmbient = 0.0;
float thicknessAttenuation = 1.0;
float thicknessPower = 2.;
float thicknessScale = 1.;
```