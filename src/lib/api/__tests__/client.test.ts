import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiEnvelope, apiRequest } from "../client";

const fetchMock = vi.fn();

function fakeResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function envelope(data: unknown, errors: unknown[] = []) {
  return { data, metadata: { request_id: "req-1", pagination: null }, errors };
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  document.cookie = "";
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("returns the unwrapped data for a 200 envelope", async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(envelope({ ok: true })));
    const data = await apiRequest<{ ok: boolean }>("/test/");
    expect(data).toEqual({ ok: true });
  });

  it("returns metadata (incl. pagination) via apiEnvelope", async () => {
    fetchMock.mockResolvedValueOnce(
      fakeResponse({
        data: [1, 2],
        metadata: {
          request_id: "req-1",
          pagination: { page: 1, page_size: 25, count: 2 },
        },
        errors: [],
      }),
    );
    const { data, metadata } = await apiEnvelope<number[]>("/instruments/");
    expect(data).toEqual([1, 2]);
    expect(metadata.pagination?.count).toBe(2);
  });

  it("normalizes an error envelope into a thrown error", async () => {
    document.cookie = "csrftoken=token-abc";
    fetchMock.mockResolvedValueOnce(
      fakeResponse(
        {
          data: null,
          metadata: { request_id: "req-1", pagination: null },
          errors: [
            {
              code: "insufficient_funds",
              message: "Not enough funds.",
              fields: { amount: "too large" },
            },
          ],
        },
        400,
      ),
    );
    await expect(apiRequest("/wallets/EGP/withdrawals/", { method: "POST" })).rejects.toMatchObject({
      code: "insufficient_funds",
      status: 400,
      fields: { amount: "too large" },
    });
  });

  it("attaches the CSRF token from the cookie to unsafe methods", async () => {
    document.cookie = "csrftoken=token-abc";
    fetchMock.mockResolvedValueOnce(fakeResponse(envelope({})));
    await apiRequest("/orders/", { method: "POST", body: { instrument_id: "x" } });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["X-CSRFToken"]).toBe("token-abc");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("passes the Idempotency-Key header through", async () => {
    document.cookie = "csrftoken=token-abc";
    fetchMock.mockResolvedValueOnce(fakeResponse(envelope({})));
    await apiRequest("/orders/", {
      method: "POST",
      body: {},
      idempotencyKey: "key-123",
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["Idempotency-Key"]).toBe("key-123");
  });

  it("does not attach CSRF or a body to GET requests", async () => {
    fetchMock.mockResolvedValueOnce(fakeResponse(envelope({})));
    await apiRequest("/health/");
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers["X-CSRFToken"]).toBeUndefined();
    expect(init.body).toBeUndefined();
  });
});
