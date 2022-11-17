require('dotenv').config();

const { GTM_ID, BASE_URL, NODE_ENV } = process.env;

const nextConfig = {
	webpack: (config, options) => {
		// add src directory to modules resolution so we can use absolute imports
		config.resolve.modules = [...config.resolve.modules, './src'];

		return config;
	},
	publicRuntimeConfig: {
		// add any public environment variables here
		GTM_ID: GTM_ID,
		BASE_URL: BASE_URL,
		NODE_ENV: NODE_ENV,
	},
	images: {
		domains: ['storage.googleapis.com', 'localhost'],
	},
	rewrites: async () => [
		{
			source: '/',
			destination: '/home',
		},
	],
};

module.exports = nextConfig;
