// Vercel Function entry point. Relative imports carry .js: the package is ESM
// and Node resolves them at runtime without a bundler. The logic lives in server/proxy.ts so its spec
// is not deployed as a function (everything under api/ is).
import { proxy } from '../server/proxy.js';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
