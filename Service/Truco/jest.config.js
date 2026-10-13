import process from 'process';

/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: 'node',
  transform: {
    '^.+.tsx?$': ['ts-jest', {}],
  },
  verbose: true,
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/tests/common/$1',
    '^@usecase/(.*)$': '<rootDir>/src/usecase/$1',
  },
  testPathIgnorePatterns: [
    "<rootDir>/dist/",
  ],
};

// Setting required envs for test
process.env.FIXSTR = 'test-jest-truco';
process.env.PREAUTH_VALIDATE_DEVICE = true;
process.env.TOK_SECRET = 'xxt';

// Main repository (none or typeorm-sqlite or dynamo-aws)
process.env.MAIN_PERSISTENCE = 'none';

// Special users passwords
process.env.SP_USER_XT_ADMIN = 'u1';
process.env.SP_USER_XPCUSRCREATOR = 'u2';
process.env.SP_USER_CPU_LIZA = 'u3';
process.env.SP_USER_CPU_ROQUE = 'u4';