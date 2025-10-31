import { Assets, Audio, Configurator, Input, Renderer, Timer } from "#framework";
import MainScene from "#webgl/components/main-scene";
import { ACESFilmicToneMapping } from "three";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

export default class WebGL {
	constructor( canvas ){

		Renderer.setup(canvas);
		Renderer.instance.setClearColor(0x000000, 1);

		Audio.setup();
		Input.setup();
		Timer.setup();

		if( Configurator.active ){

			// Add some top-level confs here

		}

	}
	run(){

		this.scene = new MainScene();

		Renderer.setScene(this.scene);

		Renderer.addPass({
			name: "bloom",
			defines: {},
			uniforms: {
				veloute: { value: 0.05 },
				ssaoThreshold: { value: 0.5 }
			},
			preprogram: `
				vec3 jodieRobo2(const vec3 d){
					float c=dot(d,vec3(.2126,.7152,.0722));
					vec4 e=vec4(d,c)*inversesqrt(c*c+1.);
					vec3 a=e.rgb;
					float b=e.a;
					float f=max(max(max(e.r,e.g),e.b),1.);
					return (b*a-a-(f*b-b))/(b-f);
				}
			`,
			program: `
				vec3 unpackedNormal = unpackRGBToNormal(normal.rgb);

				vec4 blur = texture(tBlurColor, vUv);
				vec3 bluredNormal = unpackRGBToNormal(texture(tBlurNormal, vUv).rgb);

				vec4 outputColor = vec4(1.0);

				// bloom
				outputColor.rgb = 1.0 - (1.0 - color.rgb) * (1.0 - blur.rgb * veloute);

				// ssao
				float normalDelta = distance(unpackedNormal, bluredNormal);
				float aoMask = 1.0 - smoothstep(0.0, ssaoThreshold, normalDelta);

				// outputColor = vec4(vec3(normalDistance), 1.0);

				outColor = outputColor;
				outNormal = normal;
			`
		});

		Renderer.setToneMapping(ACESFilmicToneMapping);

		Timer.add(this.update.bind(this));

	}
	update( currentTime, deltaTime ){

		Renderer.update(currentTime, deltaTime);

	}
	dispose(){

		Configurator.dispose();
		Renderer.dispose();
		Input.dispose();
		Timer.dispose();
		Assets.dispose();

	}
}
