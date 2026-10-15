// @vitest-environment node
import { BACKEND_TIMEOUT_MS, MAX_BODY_BYTES, proxy } from './proxy';

const UUID = '123e4567-e89b-12d3-a456-426614174000';

function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
}

function call(path: string, init: RequestInit & { headers?: Record<string, string> } = {}) {
  return proxy(new Request(`https://app.test/api/${path}`, init));
}

describe('api proxy', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset().mockResolvedValue(json({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    vi.stubEnv('BACKEND_API_URL', 'https://backend.test');
    vi.stubEnv('BACKEND_PROXY_SECRET', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  describe('routing', () => {
    it.each([
      'estado',
      'estado/',
      'estado/paginado',
      'estado/12',
      'auth/login',
      'actuator/info',
    ])('forwards %s', async (path) => {
      const response = await call(path);
      expect(response.status).toBe(200);
      expect(fetchMock).toHaveBeenCalledOnce();
    });

    it.each([
      'actuator/heapdump',
      'actuator/env',
      'swagger-ui/index.html',
      'estado/abc',
      'estado/1/extra',
      '..',
      'estado/../actuator/env',
      '',
    ])('answers 404 for %s without calling the backend', async (path) => {
      const response = await call(path);
      expect(response.status).toBe(404);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('keeps the query string', async () => {
      await call('estado/paginado?size=100&busca=rio');
      expect(fetchMock.mock.calls[0][0]).toBe(
        'https://backend.test/estado/paginado?size=100&busca=rio',
      );
    });

    it('keeps the method', async () => {
      await call('estado/3', { method: 'DELETE' });
      expect(fetchMock.mock.calls[0][1].method).toBe('DELETE');
    });
  });

  describe('configuration', () => {
    it('fails loudly in production when BACKEND_API_URL is missing', async () => {
      vi.stubEnv('BACKEND_API_URL', '');
      vi.stubEnv('NODE_ENV', 'production');
      delete process.env.BACKEND_API_URL;
      const response = await call('estado');
      expect(response.status).toBe(500);
      expect(await response.json()).toEqual({ message: 'BACKEND_API_URL is not configured' });
    });

    it('falls back to localhost:8080 outside production', async () => {
      delete process.env.BACKEND_API_URL;
      await call('estado');
      expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:8080/estado');
    });
  });

  describe('request headers', () => {
    it('forwards Authorization and Content-Type, and nothing else', async () => {
      await call('estado/', {
        method: 'POST',
        body: '{}',
        headers: {
          Authorization: 'Bearer t',
          'Content-Type': 'application/json',
          Cookie: 'secret=1',
          'X-Forwarded-Host': 'evil.test',
        },
      });
      expect(fetchMock.mock.calls[0][1].headers).toEqual({
        Authorization: 'Bearer t',
        'Content-Type': 'application/json',
      });
    });

    it('forwards a UUID X-Request-Id', async () => {
      await call('estado', { headers: { 'X-Request-Id': UUID } });
      expect(fetchMock.mock.calls[0][1].headers['X-Request-Id']).toBe(UUID);
    });

    it('drops an X-Request-Id that is not a UUID (log injection)', async () => {
      await call('estado', { headers: { 'X-Request-Id': 'abc\nINJECT' } });
      expect(fetchMock.mock.calls[0][1].headers['X-Request-Id']).toBeUndefined();
    });

    it('sends the real client IP with the shared secret when both are available', async () => {
      vi.stubEnv('BACKEND_PROXY_SECRET', 's3cret');
      await call('estado', { headers: { 'x-vercel-forwarded-for': '203.0.113.9' } });
      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-Client-IP']).toBe('203.0.113.9');
      expect(headers['X-Proxy-Secret']).toBe('s3cret');
    });

    it('never forwards a client-supplied X-Client-IP or secret', async () => {
      await call('estado', {
        headers: { 'X-Client-IP': '1.2.3.4', 'X-Proxy-Secret': 'guess' },
      });
      const headers = fetchMock.mock.calls[0][1].headers;
      expect(headers['X-Client-IP']).toBeUndefined();
      expect(headers['X-Proxy-Secret']).toBeUndefined();
    });

    it('omits the IP headers when the secret is not configured', async () => {
      await call('estado', { headers: { 'x-vercel-forwarded-for': '203.0.113.9' } });
      expect(fetchMock.mock.calls[0][1].headers['X-Client-IP']).toBeUndefined();
    });

    it('omits the IP headers when the forwarded value is not an IP', async () => {
      vi.stubEnv('BACKEND_PROXY_SECRET', 's3cret');
      await call('estado', { headers: { 'x-vercel-forwarded-for': 'not-an-ip' } });
      expect(fetchMock.mock.calls[0][1].headers['X-Client-IP']).toBeUndefined();
    });
  });

  describe('request body', () => {
    it('forwards the body of a write', async () => {
      await call('estado/', { method: 'POST', body: '{"nome":"X"}' });
      expect(fetchMock.mock.calls[0][1].body).toBe('{"nome":"X"}');
    });

    it('sends no body for GET', async () => {
      await call('estado');
      expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
    });

    it('rejects an oversized body with 413 (Content-Length)', async () => {
      const response = await call('estado/', {
        method: 'POST',
        body: 'x',
        headers: { 'content-length': String(MAX_BODY_BYTES + 1) },
      });
      expect(response.status).toBe(413);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('rejects an oversized streamed body with 413 (no Content-Length)', async () => {
      const chunk = new Uint8Array(MAX_BODY_BYTES);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(chunk);
          controller.enqueue(chunk);
          controller.close();
        },
      });
      const request = new Request('https://app.test/api/estado/', {
        method: 'POST',
        body: stream,
        duplex: 'half',
      } as RequestInit);
      const response = await proxy(request);
      expect(response.status).toBe(413);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('response', () => {
    it('passes status and JSON body through, locked down by a restrictive CSP', async () => {
      fetchMock.mockResolvedValue(json({ id: 1 }, { status: 201 }));
      const response = await call('estado/', { method: 'POST', body: '{}' });
      expect(response.status).toBe(201);
      expect(await response.json()).toEqual({ id: 1 });
      expect(response.headers.get('Content-Security-Policy')).toBe(
        "default-src 'none'; frame-ancestors 'none'; sandbox",
      );
    });

    it('passes an empty body (204) through', async () => {
      fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
      const response = await call('estado/3', { method: 'DELETE' });
      expect(response.status).toBe(204);
    });

    it('echoes a UUID request id and drops anything else', async () => {
      fetchMock.mockResolvedValueOnce(json({}, { headers: { 'Content-Type': 'application/json', 'X-Request-Id': UUID } }));
      expect((await call('estado')).headers.get('X-Request-Id')).toBe(UUID);

      fetchMock.mockResolvedValueOnce(json({}, { headers: { 'Content-Type': 'application/json', 'X-Request-Id': 'nope' } }));
      expect((await call('estado')).headers.get('X-Request-Id')).toBeNull();
    });

    it('refuses to relay a non-JSON body (answers 502)', async () => {
      fetchMock.mockResolvedValue(
        new Response('<script>alert(1)</script>', { headers: { 'Content-Type': 'text/html' } }),
      );
      const response = await call('estado');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ message: 'Unexpected backend response' });
    });

    it('accepts vendor +json content types', async () => {
      fetchMock.mockResolvedValue(
        new Response('{}', { headers: { 'Content-Type': 'application/problem+json; charset=utf-8' } }),
      );
      expect((await call('estado')).status).toBe(200);
    });

    it('answers 504 when the backend times out', async () => {
      fetchMock.mockRejectedValue(new DOMException('timed out', 'TimeoutError'));
      const response = await call('estado');
      expect(response.status).toBe(504);
      expect(await response.json()).toEqual({ message: 'Backend timed out' });
    });

    it('answers 502 when the backend is unreachable', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));
      const response = await call('estado');
      expect(response.status).toBe(502);
      expect(await response.json()).toEqual({ message: 'Failed to reach backend' });
    });

    it('gives up before the browser client does (10s < its 15s timeout)', () => {
      expect(BACKEND_TIMEOUT_MS).toBeLessThan(15_000);
    });
  });
});
