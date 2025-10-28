export default class Tools {
	static deepClone( source ){

		const clone = new Object();

		for( const key in source ){

			const value = source[key];

			if( value instanceof Array ){

				clone[key] = [...value];

			}
			else if( value instanceof Object ){

				clone[key] = Tools.deepClone(value);

			}
			else {

				clone[key] = value;

			}

		}

		return clone;

	}
	static deepEqual( a, b ){

		if( typeof a !== "object" || a === null || typeof b !== "object" || b === null ) return false;

		const keysA = Object.keys(a);
		const keysB = Object.keys(b);

		if( keysA.length !== keysB.length ) return false;

		for( const key of keysA ){

			if( !keysB.includes(key) || a[key] !== b[key] ) return false;
			else if( a[key] instanceof Object && Tools.deepEqual(a[key], b[key])) return false;

		}

		return true;

	}
};
