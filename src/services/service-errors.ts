/**
 * Typed domain errors. Routes map these to HTTP status codes with
 * `instanceof` — matching on `error.message` strings is fragile (a reworded
 * message silently turns a 401 into a 500).
 */

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials');
    this.name = 'InvalidCredentialsError';
  }
}

export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Email already registered');
    this.name = 'EmailAlreadyRegisteredError';
  }
}
