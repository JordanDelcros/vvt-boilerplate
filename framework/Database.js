import Configurator from "./Configurator.js";
import config from "#root/config.js";

let DATABASE = null;
let DEBUG = null;
const CONFIG_STORE = "VVT_CONFIG";
const STORES = new Set([CONFIG_STORE, ...config.database.stores || []]);

export default class Database {
	static async setup(){

		if( Configurator.active ){

			DEBUG = Configurator.addFolder("Database");

			DEBUG.addButton({ title: "flush" }).on("click", () => Database.flush());
			DEBUG.addButton({ title: "re-create" }).on("click", () => {
				Database.delete().then(Database.setup)
			});

		}

		DATABASE = await new Promise(( resolve, reject ) => {

			const request = indexedDB.open(config.database.name, 1);

			request.onupgradeneeded = ( event ) => {

				const database = event.target.result;

				for( const storeName of STORES ){

					if( !database.objectStoreNames.contains(storeName) ){

						database.createObjectStore(storeName);

					}

				}

			};

			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);

		});

		const currentVersionning = await Database.get(CONFIG_STORE, "versionning");
		if( currentVersionning !== __VERSIONNING__ ){

			Database.flush();
			Database.set(CONFIG_STORE, "versionning", __VERSIONNING__);

		}

	}
	static registerStore( storeName ){

		STORES.add(storeName);

	}
	static getStore( storeName ){

		return {
			get: ( key ) => Database.get(storeName, key),
			set: ( key, data ) => Database.set(storeName, key, data)
		};

	}
	static get( storeName, key ){

		return new Promise(( resolve, reject ) => {

			const store = DATABASE.transaction(storeName, "readonly").objectStore(storeName);
			const request = store.get(key);
			
			request.onsuccess = ( event ) => {

				resolve(event.target.result);

			}

			request.onerror = reject;

		});

	}
	static set( storeName, key, data ){

		const store = DATABASE.transaction(storeName, "readwrite").objectStore(storeName);

		store.put(data, key);

	}
	static flush(){

		for( const storeName of DATABASE.objectStoreNames ){

			const transaction = DATABASE.transaction(storeName, "readwrite");
			transaction.objectStore(storeName).clear();

		}

	}
	static async delete(){

		await new Promise(( resolve, reject ) => {

			Database.dispose();

			const request = indexedDB.deleteDatabase(config.database.name);

			request.onsuccess = resolve;
			request.onerror = reject;
			request.onblocked = () => reject("database deletion blocked");

		});

	}
	static dispose(){

		DATABASE.close();
		DEBUG?.dispose();

	}
}
