import { readFileSync, existsSync } from "fs";

// Check if SSL certificates exist and create server accordingly
export default function SSLServerIfAvailablePlugin(){
	
	const keyPath = `${ process.env.HOME }/Sites/.certificates/localhost-key.pem`;
	const certPath = `${ process.env.HOME }/Sites/.certificates/localhost.pem`;

	const server = {
		watch: {
			ignored: ["**/public/.generated/**"]
		}
	};

	if( existsSync(keyPath) && existsSync(certPath) ){

		server.https = {
			key: readFileSync(keyPath),
			cert: readFileSync(certPath)
		};

	}

	return server;

};
