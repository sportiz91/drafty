// Runs before module imports (setupFiles) — config.ts validates env at
// import time, so test values must exist first.
process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.JWT_ACCESS_TOKEN_EXPIRY = '15m';
process.env.DATABASE_PATH = './data/test.db';
