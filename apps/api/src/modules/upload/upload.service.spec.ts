import { describe, it, expect, vi, beforeEach } from "vitest";
import { Writable } from "node:stream";
import { BadGatewayException } from "@nestjs/common";
import { UploadService } from "./upload.service";

const mockConfig = {
  get: vi.fn(),
};

const mockUploadStream = vi.hoisted(() => vi.fn());
vi.mock("cloudinary", () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      get upload_stream() {
        return mockUploadStream;
      },
    },
  },
}));

describe("UploadService", () => {
  let service: UploadService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig.get.mockImplementation((key: string) => {
      if (key === "CLOUDINARY_CLOUD_NAME") return "test-cloud";
      if (key === "CLOUDINARY_API_KEY") return "test-key";
      if (key === "CLOUDINARY_API_SECRET") return "test-secret";
      return undefined;
    });
    service = new UploadService(mockConfig as any);
  });

  it("throws BadGatewayException when Cloudinary is not configured", async () => {
    mockConfig.get.mockReturnValue(undefined);
    service = new UploadService(mockConfig as any);

    await expect(
      service.upload(Buffer.from("x"), "image/jpeg"),
    ).rejects.toThrow(BadGatewayException);
  });

  it("throws BadGatewayException for invalid mimetype", async () => {
    await expect(
      service.upload(Buffer.from("x"), "image/gif"),
    ).rejects.toThrow(BadGatewayException);
  });

  it("uploads successfully and returns url", async () => {
    mockUploadStream.mockImplementation((_opts: unknown, cb: (err: null, result: { secure_url: string }) => void) => {
      const stream = new Writable({
        write(_chunk, _enc, done) {
          done();
        },
      });
      setTimeout(() => cb(null, { secure_url: "https://example.com/image.jpg" }), 0);
      return stream;
    });

    const result = await service.upload(Buffer.from("x"), "image/jpeg", "avatars");

    expect(result).toEqual({ url: "https://example.com/image.jpg" });
  });

  it("uses posts folder when folder is invalid", async () => {
    mockUploadStream.mockImplementation((opts: { folder?: string }, cb: (err: null, result: { secure_url: string }) => void) => {
      expect(opts.folder).toBe("posts");
      const stream = new Writable({
        write(_chunk, _enc, done) {
          done();
        },
      });
      setTimeout(() => cb(null, { secure_url: "https://example.com/img.jpg" }), 0);
      return stream;
    });

    await service.upload(Buffer.from("x"), "image/png", "invalid");
  });
});
