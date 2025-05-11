import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.watsch.app',
	appName: 'Watsch',
	webDir: 'build',
	server: {
		androidScheme: 'file'
	},
	android: {
		buildOptions: {
			keystorePath: undefined,
			keystoreAlias: 'key',
			keystorePassword: '123qwe',
			keystoreKeyPassword: '123qwe'
		}
	}
};

export default config;
