// End-to-end check of the API against the running server (start `npm run dev` first).
// Covers every API row of D03 / D12. Run: npm test
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { inArray } from 'drizzle-orm';
import { db } from '../src/db.ts';
import { urls } from '../src/schema.ts';

const BASE = 'http://localhost:3000';
const created: string[] = []; // codes this test made, so cleanup only touches them

function shorten(body: string) {
    return fetch(`${BASE}/api/urls`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
}

after(async () => {
    if (created.length) await db.delete(urls).where(inArray(urls.code, created)); // never wipe real links
    await db.$client.end(); // close the pool so the test process can exit
});

test('health: server and database are up', async () => {
    const res = await fetch(`${BASE}/health`);
    assert.equal(res.status, 200);
});

test('create a short link, then follow it', async () => {
    const res = await shorten(JSON.stringify({ longUrl: 'https://example.com/e2e' }));
    assert.equal(res.status, 201);

    const { shortUrl } = await res.json();
    const code = new URL(shortUrl).pathname.slice(1);
    created.push(code);
    assert.match(code, /^[A-Za-z0-9_-]{7}$/); // D06: 7 URL-safe chars

    const redirect = await fetch(shortUrl, { redirect: 'manual' }); // don't follow, inspect the 302 itself
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('location'), 'https://example.com/e2e');
});

const badBodies = [
    ['not a URL', '{"longUrl":"hello"}'],
    ['ftp link', '{"longUrl":"ftp://files.example.com"}'],
    ['javascript link', '{"longUrl":"javascript:alert(1)"}'],
    ['number', '{"longUrl":123}'],
    ['missing field', '{}'],
    ['invalid JSON', '{longUrl:1}'],
];
for (const [name, body] of badBodies) {
    test(`400 with { error }: ${name}`, async () => {
        const res = await shorten(body);
        assert.equal(res.status, 400);
        assert.equal(typeof (await res.json()).error, 'string'); // D12: one error shape
    });
}

test('404: unknown short code', async () => {
    const res = await fetch(`${BASE}/zzzzzzz`, { redirect: 'manual' });
    assert.equal(res.status, 404);
    assert.equal(await res.text(), 'Short link not found'); // D09
});
