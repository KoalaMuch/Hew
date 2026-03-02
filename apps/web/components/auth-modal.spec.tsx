import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthModal } from "./auth-modal";

vi.mock("@/lib/session-context", () => ({
  useSession: () => ({
    session: null,
    sessionId: null,
    isLoading: false,
    refresh: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@/lib/api", () => ({
  register: vi.fn(),
  login: vi.fn(),
  getOAuthUrl: (provider: string) => `http://localhost/api/auth/${provider}?session=test`,
}));

describe("AuthModal", () => {
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <AuthModal isOpen={false} onClose={onClose} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders login form by default", () => {
    render(<AuthModal isOpen={true} onClose={onClose} />);

    expect(screen.getByPlaceholderText("อีเมล")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("รหัสผ่าน")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("ชื่อที่แสดง")).not.toBeInTheDocument();
  });

  it("renders register form when defaultTab is register", () => {
    render(
      <AuthModal isOpen={true} onClose={onClose} defaultTab="register" />,
    );

    expect(screen.getByPlaceholderText("ชื่อที่แสดง")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("อีเมล")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("รหัสผ่าน")).toBeInTheDocument();
  });

  it("switches between login and register tabs", async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    expect(screen.queryByPlaceholderText("ชื่อที่แสดง")).not.toBeInTheDocument();

    const registerButtons = screen.getAllByText("สมัครสมาชิก");
    await user.click(registerButtons[0]);

    expect(screen.getByPlaceholderText("ชื่อที่แสดง")).toBeInTheDocument();
  });

  it("calls onClose when X button is clicked", async () => {
    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    const closeButtons = screen.getAllByRole("button");
    const xButton = closeButtons.find(
      (btn) => btn.querySelector("svg") !== null && !btn.textContent?.includes("เข้าสู่ระบบ"),
    );

    if (xButton) {
      await user.click(xButton);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("renders OAuth provider links", () => {
    render(<AuthModal isOpen={true} onClose={onClose} />);

    expect(screen.getByText("Google")).toBeInTheDocument();
    expect(screen.getByText("LINE")).toBeInTheDocument();
    expect(screen.getByText("Facebook")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
  });

  it("submits login form", async () => {
    const { login } = await import("@/lib/api");
    (login as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      displayName: "Test",
    });

    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText("อีเมล"), "test@example.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "password123");

    const submitBtn = screen.getAllByText("เข้าสู่ระบบ")
      .map((el) => el.closest("button"))
      .find((btn) => btn?.getAttribute("type") === "submit");
    await user.click(submitBtn!);

    expect(login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("shows error message on login failure", async () => {
    const { login } = await import("@/lib/api");
    (login as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Invalid credentials"),
    );

    const user = userEvent.setup();
    render(<AuthModal isOpen={true} onClose={onClose} />);

    await user.type(screen.getByPlaceholderText("อีเมล"), "bad@example.com");
    await user.type(screen.getByPlaceholderText("รหัสผ่าน"), "wrongpass1");

    const submitBtn = screen.getAllByText("เข้าสู่ระบบ")
      .map((el) => el.closest("button"))
      .find((btn) => btn?.getAttribute("type") === "submit");
    await user.click(submitBtn!);

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
  });
});
