export default class Randomness {
	static random( min = 0, max = 1 ){

		return Math.random() * (max - min) + min;

	}
	static randomInt( min = 0, max = 2 ){

		return Math.floor(Randomness.random(min, max));

	}
	static randomBool(){

		return Math.random() > 0.5 ? true : false;

	}
	static randomArrayIndex( array ){

		return Randomness.randomInt(0, array.length);

	}
	static randomArrayValue( array ){

		return array[Randomness.randomArrayIndex(array)];

	}
	static choose( optionA, optionB ){

		return Math.random() > 0.5 ? optionA : optionB;

	}
	static shuffleArray( array ){

		let currentIndex = array.length;
		while( currentIndex != 0 ){

			let randomIndex = Math.floor(Math.random() * currentIndex);

			currentIndex--;

			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];

		}

		return array;

	}
}
