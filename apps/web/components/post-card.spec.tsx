import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PostCard } from "./post-card";

vi.mock("next/image", () => ({
  // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img {...props} />,
}));

const baseProps = {
  id: "post-1",
  type: "RUBHEW" as const,
  content: "Test post content",
  hashtags: ["#test"],
  imageUrls: [],
  viewCount: 42,
  createdAt: new Date().toISOString(),
  session: { displayName: "Alice", avatarSeed: "alice" },
};

describe("PostCard", () => {
  it("does not render delete button when onDelete is not provided", () => {
    render(<PostCard {...baseProps} />);

    expect(screen.queryByLabelText("ลบโพสต์")).not.toBeInTheDocument();
  });

  it("renders delete button when onDelete is provided", () => {
    render(<PostCard {...baseProps} onDelete={vi.fn()} />);

    expect(screen.getByLabelText("ลบโพสต์")).toBeInTheDocument();
  });

  it("calls onDelete with post id when delete button is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(<PostCard {...baseProps} onDelete={onDelete} />);

    await user.click(screen.getByLabelText("ลบโพสต์"));

    expect(onDelete).toHaveBeenCalledWith("post-1");
  });

  it("renders post content and author", () => {
    render(<PostCard {...baseProps} />);

    expect(screen.getByText("Test post content")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });
});
