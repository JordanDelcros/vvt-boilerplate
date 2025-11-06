import { Configurator } from "#framework";

let DATABASE = null;
let DEBUG = null;
const DATABASE_NAME = "VVT_FILES_CACHE";
const STORE_NAME = "VVT_FILES";

export default class Database {
	static async setup(){

		if( Configurator.active ){

			DEBUG = Configurator.addFolder("Database");

			DEBUG.addButton({
				title: "flush"
			})
			.on("click", () => Database.flush());

		}

		DATABASE = await new Promise(( resolve, reject ) => {

			const request = indexedDB.open(DATABASE_NAME, 1);

			request.onupgradeneeded = ( event ) => {

				const database = event.target.result;

				if( !database.objectStoreNames.contains(STORE_NAME) ){

					database.createObjectStore(STORE_NAME);

				}

			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);

		});

		const currentVersionning = await Database.get("versionning");
		if( currentVersionning !== __VERSIONNING__ ){

			Database.flush();
			Database.set("versionning", __VERSIONNING__);

		}

	}
	static get( key ){

		return new Promise(( resolve, reject ) => {

			const store = DATABASE.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME);
			const request = store.get(key);
			
			request.onsuccess = ( event ) => {

				resolve(event.target.result);

			}

			request.onerror = reject;

		});

	}
	static set( key, data ){

		const store = DATABASE.transaction(STORE_NAME, "readwrite").objectStore(STORE_NAME);

		store.put(data, key);

	}
	static flush(){

		const store = DATABASE.transaction(STORE_NAME, "readwrite");

		for( const storeName of DATABASE.objectStoreNames ){

			store.objectStore(storeName).clear();

		}

	}
	static dispose(){

		// DEBUG?.dispose();

	}
}
