import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CreatePostForm } from "./create-post-form";
import { SessionProvider } from "@/lib/session-context";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/api", () => ({
  createPost: vi.fn(),
  createSession: vi.fn().mockResolvedValue({ id: "test-session" }),
  getSession: vi.fn().mockResolvedValue({
    id: "test-session",
    displayName: "Test User",
    avatarSeed: "seed",
  }),
  setSessionToken: vi.fn(),
}));

function renderWithSession(ui: React.ReactElement) {
  return render(
    <SessionProvider>
      {ui}
    </SessionProvider>,
  );
}

describe("CreatePostForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with RUBHEW type selected by default", () => {
    renderWithSession(<CreatePostForm />);

    const rubhewBtn = screen.getByText("รับหิ้ว", { selector: "button" });
    expect(rubhewBtn.className).toContain("border-blue-500");
  });

  it("switches to HAKHONG type", async () => {
    const user = userEvent.setup();
    renderWithSession(<CreatePostForm />);

    await user.click(screen.getByText("หาของ", { selector: "button" }));

    const hakhongBtn = screen.getByText("หาของ", { selector: "button" });
    expect(hakhongBtn.className).toContain("border-amber-500");
  });

  it("disables submit when content is empty", () => {
    renderWithSession(<CreatePostForm />);

    const submitButton = screen.getByText("โพสต์", { selector: "button" });
    expect(submitButton).toBeDisabled();
  });

  it("enables submit when content is entered", async () => {
    const user = userEvent.setup();
    renderWithSession(<CreatePostForm />);

    const textarea = screen.getAllByRole("textbox")[0];
    await user.type(textarea, "Going to Japan!");

    const submitButton = screen.getByText("โพสต์", { selector: "button" });
    expect(submitButton).not.toBeDisabled();
  });

  it("submits the form and redirects on success", async () => {
    const { createPost } = await import("@/lib/api");
    (createPost as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "post-1" });

    const user = userEvent.setup();
    renderWithSession(<CreatePostForm />);

    const textarea = screen.getAllByRole("textbox")[0];
    await user.type(textarea, "Going to Japan!");
    await user.click(screen.getByText("เพิ่มรายละเอียด"));
    await user.type(screen.getByPlaceholderText("ประเทศ"), "Japan");

    const submitButton = screen.getByText("โพสต์", { selector: "button" });
    await user.click(submitButton);

    expect(createPost).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "RUBHEW",
        content: "Going to Japan!",
        country: "Japan",
      }),
    );
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("shows error message on submission failure", async () => {
    const { createPost } = await import("@/lib/api");
    (createPost as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Server error"),
    );

    const user = userEvent.setup();
    renderWithSession(<CreatePostForm />);

    const textarea = screen.getAllByRole("textbox")[0];
    await user.type(textarea, "Test content");

    const submitButton = screen.getByText("โพสต์", { selector: "button" });
    await user.click(submitButton);

    expect(await screen.findByText("Server error")).toBeInTheDocument();
  });

  it("shows character count", async () => {
    const user = userEvent.setup();
    renderWithSession(<CreatePostForm />);

    expect(screen.getByText("0/5000")).toBeInTheDocument();

    const textarea = screen.getAllByRole("textbox")[0];
    await user.type(textarea, "Hello");

    expect(screen.getByText("5/5000")).toBeInTheDocument();
  });
});
