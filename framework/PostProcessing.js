import { Renderer, Timer } from "#framework";
import { OrthographicCamera, BufferGeometry, BufferAttribute, Scene, WebGLRenderTarget, Mesh, PlaneGeometry, RawShaderMaterial } from "three";

const CAMERA = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
const TRIANGLE = new BufferGeometry()
	.setAttribute("position", new BufferAttribute(new Float32Array([-2, 0, 0, 0, -2, 0, 2, 2, 0]), 3));

export default class PostProcessing {
	constructor({ width, height, map, uniforms, fragmentShader, renderToScreen = false }){

		this.scene = new Scene();

		if( !renderToScreen ){

			this.renderTarget = new WebGLRenderTarget(width, height);

			Renderer.hook("resize", ( width, height ) => {
				console.log(width, height)
				this.renderTarget.setSize(width, height);
			});

		}
		
		this.material = new RawShaderMaterial({
			uniforms: {
				...uniforms,
				map: { value: map },
				width: { value: width },
				height: { value: height },
				time: { value: 0 }
			},
			vertexShader: `
				precision highp float;
				attribute vec2 position;
				varying vec2 vUv;

				void main(){
					vUv = position;
					gl_Position = vec4(2.0 * position - 1.0, 0.0, 1.0);
				}
			`,
			fragmentShader: `
				precision highp float;

				uniform sampler2D map;
				uniform float width;
				uniform float height;
				uniform float time;
				varying vec2 vUv;

				${ fragmentShader }
			`,
			depthTest: false,
			depthWrite: false
		});

		this.mesh = new Mesh(TRIANGLE, this.material);
		this.scene.add(this.mesh);

	}
	dispose(){

		this.mesh.geometry.dispose();
		this.mesh.material.dispose();

	}
	render(){

		if( this.renderTarget ) Renderer.instance.setRenderTarget(this.renderTarget);

		this.material.uniforms.time.value = Timer.currentTime;

		Renderer.instance.render(this.scene, CAMERA);

		Renderer.instance.setRenderTarget(null);

	}
}
