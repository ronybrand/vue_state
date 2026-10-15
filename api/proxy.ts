// Vercel Function entry point. The logic lives in server/proxy.ts so its spec
// is not deployed as a function (everything under api/ is).
import { proxy } from '../server/proxy';

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const DELETE = proxy;
