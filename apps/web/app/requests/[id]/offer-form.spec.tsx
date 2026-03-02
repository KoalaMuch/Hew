import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OfferForm } from "./offer-form";

const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/api", () => ({
  createOffer: vi.fn(),
}));

describe("OfferForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product price, shipping fee, and notes fields", () => {
    render(<OfferForm itemRequestId="req-1" />);

    expect(screen.getByLabelText("ราคาสินค้า (฿)")).toBeInTheDocument();
    expect(screen.getByLabelText("ค่าส่ง (฿)")).toBeInTheDocument();
    expect(screen.getByLabelText("หมายเหตุ (ไม่บังคับ)")).toBeInTheDocument();
  });

  it("renders submit button", () => {
    render(<OfferForm itemRequestId="req-1" />);

    expect(screen.getByText("ส่งข้อเสนอ")).toBeInTheDocument();
  });

  it("submits the form with correct data", async () => {
    const { createOffer } = await import("@/lib/api");
    (createOffer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "offer-1" });

    const user = userEvent.setup();
    render(<OfferForm itemRequestId="req-1" />);

    await user.type(screen.getByLabelText("ราคาสินค้า (฿)"), "5000");
    await user.type(screen.getByLabelText("ค่าส่ง (฿)"), "200");
    await user.type(screen.getByLabelText("หมายเหตุ (ไม่บังคับ)"), "From Shibuya");

    await user.click(screen.getByText("ส่งข้อเสนอ"));

    expect(createOffer).toHaveBeenCalledWith({
      itemRequestId: "req-1",
      productPrice: 5000,
      shippingFee: 200,
      notes: "From Shibuya",
    });
  });

  it("shows error message on submission failure", async () => {
    const { createOffer } = await import("@/lib/api");
    (createOffer as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Price too low"),
    );

    const user = userEvent.setup();
    render(<OfferForm itemRequestId="req-1" />);

    await user.type(screen.getByLabelText("ราคาสินค้า (฿)"), "1");
    await user.type(screen.getByLabelText("ค่าส่ง (฿)"), "0");

    await user.click(screen.getByText("ส่งข้อเสนอ"));

    expect(await screen.findByText("Price too low")).toBeInTheDocument();
  });

  it("resets form after successful submission", async () => {
    const { createOffer } = await import("@/lib/api");
    (createOffer as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "offer-2" });

    const user = userEvent.setup();
    render(<OfferForm itemRequestId="req-1" />);

    await user.type(screen.getByLabelText("ราคาสินค้า (฿)"), "3000");
    await user.type(screen.getByLabelText("ค่าส่ง (฿)"), "100");

    await user.click(screen.getByText("ส่งข้อเสนอ"));

    // Wait for async submission
    await vi.waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
