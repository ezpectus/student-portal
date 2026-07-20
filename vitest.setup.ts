import '@testing-library/jest-dom/vitest';

process.env.API_BASE_URL ??= 'https://api.example.com';
process.env.JWT_SECRET ??= 'test-secret-key-for-vitest-at-least-16-chars';
