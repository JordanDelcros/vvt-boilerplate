export default class Mapping {
	static clamp( value, min, max ){

		return Math.max(min, Math.min(max, value));

	}
	static map( value, inMin, inMax, outMin, outMax ){

		return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;

	}
	static mapClamped( value, inMin, inMax, outMin, outMax ){

		return Mapping.clamp(Mapping.map(value, inMin, inMax, outMin, outMax), outMin, outMax);

	}
	static lerp( current, target, factor = 0.5 ){

		return current + (target - current) * factor;

	}
}
