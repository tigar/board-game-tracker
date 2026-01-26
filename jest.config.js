/** @type {import('jest').Config} */
export default {
	preset: 'ts-jest',
	testEnvironment: 'jsdom',
	extensionsToTreatAsEsm: ['.ts', '.svelte'],
	moduleNameMapper: {
		'^\\$lib/(.*)$': '<rootDir>/src/lib/$1',
		'^\\$app/(.*)$': '<rootDir>/.svelte-kit/runtime/app/$1',
	},
	transform: {
		'^.+\\.ts$': [
			'ts-jest',
			{
				useESM: true,
			},
		],
	},
	testMatch: ['**/*.test.ts', '**/*.spec.ts'],
	collectCoverageFrom: [
		'src/**/*.{ts,svelte}',
		'!src/**/*.d.ts',
		'!src/**/*.test.ts',
		'!src/**/*.spec.ts',
	],
};
