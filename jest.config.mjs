// NestJS 12 and the generated Prisma client are ESM-only, so Jest runs in native
// ESM mode. The npm scripts pass --experimental-vm-modules for that reason.
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: { '^(\\.{1,2}/.*)\\.js$': '$1' },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true, tsconfig: '<rootDir>/../tsconfig.json' }],
  },
  collectCoverageFrom: ['**/*.ts', '!generated/**', '!main.ts', '!**/*.module.ts'],
  coverageDirectory: '../coverage',
};
