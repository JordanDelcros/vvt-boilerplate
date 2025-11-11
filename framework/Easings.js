// Source: https://easings.net/
const Easings = {
	linear( progress ){
		return progress;
	},
	// Sine
	inSine( progress ){
		 return 1 - Math.cos((progress * Math.PI) / 2);
	},
	outSine( progress ){
		return Math.sin((progress * Math.PI) / 2);
	},
	inOutSine( progress ){
		return -(Math.cos(Math.PI * progress) - 1) / 2;
	},
	// Cubic
	inCubic( progress ){
		return progress * progress * progress;
	},
	outCubic( progress ){
		return 1 - Math.pow(1 - progress, 3);
	},
	inOutCubic( progress ){
		return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
	},
	// Circ
	inCirc( progress ){
		return 1 - Math.sqrt(1 - Math.pow(progress, 2));
	},
	outCirc( progress ){
		return Math.sqrt(1 - Math.pow(progress - 1, 2));
	},
	inOutCirc( progress ){
		return progress < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * progress, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * progress + 2, 2)) + 1) / 2;
	},
	// Quad
	inQuad( progress ){
		return progress * progress;
	},
	outQuad( progress ){
		return 1 - (1 - progress) * (1 - progress);
	},
	inOutQuad( progress ){
		return progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
	},
	// Quint
	inQuint( progress ){
		return progress * progress * progress * progress * progress;
	},
	outQuint( progress ){
		return 1 - Math.pow(1 - progress, 5);
	},
	inOutQuin( progress ){
		return progress < 0.5 ? 16 * progress * progress * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 5) / 2;
	},
	// Quart
	inQuart( progress ){
		return progress * progress * progress * progress;
	},
	outQuart( progress ){
		return 1 - Math.pow(1 - progress, 4);
	},
	inOutQuart( progress ){
		return progress < 0.5 ? 8 * progress * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 4) / 2;
	},
	// Expo
	inExpo( progress ){
		return progress === 0 ? 0 : Math.pow(2, 10 * progress - 10);
	},
	outExpo( progress ){
		return progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
	},
	inOutExpo( progress ){
		return progress === 0 ? 0 : progress === 1 ? 1 : progress < 0.5 ? Math.pow(2, 20 * progress - 10) / 2 : (2 - Math.pow(2, -20 * progress + 10)) / 2;
	},
	// Back
	inBack( progress ){
		const acceleration = 0.6;
		const adjustment = acceleration + 1;
		return adjustment * progress * progress * progress - acceleration * progress * progress;
	},
	outBack( progress ){
		const acceleration = 0.6;
		const adjustment = acceleration + 1;
		return 1 + adjustment * Math.pow(progress - 1, 3) + acceleration * Math.pow(progress - 1, 2);
	},
	inOutBack( progress ){
		const acceleration = 0.6;
		const adjustment = acceleration * 1.525;
		return progress < 0.5 ? (Math.pow(2 * progress, 2) * ((adjustment + 1) * 2 * progress - adjustment)) / 2 : (Math.pow(2 * progress - 2, 2) * ((adjustment + 1) * (progress * 2 - 2) + adjustment) + 2) / 2;
	},
	// Elastic
	inElastic( progress ){
		const factor = (2 * Math.PI) / 3;
		return progress === 0 ? 0 : progress === 1 ? 1 : -Math.pow(2, 10 * progress - 10) * Math.sin((progress * 10 - 10.75) * factor);
	},
	outElastic( progress ){
		const factor = (2 * Math.PI) / 3;
		return progress === 0 ? 0 : progress === 1 ? 1 : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * factor) + 1;
	},
	inOutElastic( progress ){
		const factor = (2 * Math.PI) / 4.5;
		return progress === 0 ? 0 : progress === 1 ? 1 : progress < 0.5 ? -(Math.pow(2, 20 * progress - 10) * Math.sin((20 * progress - 11.125) * factor)) / 2 : (Math.pow(2, -20 * progress + 10) * Math.sin((20 * progress - 11.125) * factor)) / 2 + 1;
	},
	// Bounce
	inBounce( progress ){
		return 1 - Easings.outBounce(1 - progress);
	},
	outBounce( progress ){
		const scale = 7.5625;
		const treshold = 2.75;

		if( progress < 1 / treshold ) return scale * progress * progress;
		else if( progress < 2 / treshold ) return scale * (progress -= 1.5 / treshold) * progress + 0.75;
		else if( progress < 2.5 / treshold ) return scale * (progress -= 2.25 / treshold) * progress + 0.9375;
		else return scale * (progress -= 2.625 / treshold) * progress + 0.984375;
	},
	inOutBounce( progress ){
		return progress < 0.5 ? (1 - Easings.outbounce(1 - 2 * progress)) / 2 : (1 + Easings.outbounce(2 * progress - 1)) / 2;
	},
	combine( easingA, easingB ){
		return ( progress ) => easingB(easingA(progress));
	}
};

export default Easings;
