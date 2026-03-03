import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Avatar } from "./avatar";

vi.mock("next/image", () => ({
  default: (props: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={props.src} alt={props.alt} />
  ),
}));

describe("Avatar", () => {
  it("renders image when src is provided", () => {
    const { container } = render(
      <Avatar
        src="https://example.com/avatar.jpg"
        displayName="Alice"
        avatarSeed="seed"
      />
    );
    const img = container.querySelector('img[src="https://example.com/avatar.jpg"]');
    expect(img).toBeInTheDocument();
  });

  it("renders initial when no src", () => {
    render(<Avatar displayName="Alice" avatarSeed="seed" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("renders avatarSeed initial for Anonymous", () => {
    render(<Avatar displayName="Anonymous" avatarSeed="xyz" />);
    expect(screen.getByText("X")).toBeInTheDocument();
  });

  it("renders avatarSeed initial when displayName is empty", () => {
    render(<Avatar displayName="" avatarSeed="abc" />);
    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("applies size class", () => {
    const { container } = render(
      <Avatar displayName="B" avatarSeed="x" size="sm" />
    );
    const el = container.firstChild;
    expect(el).toHaveClass("h-8");

    const { container: c2 } = render(
      <Avatar displayName="B" avatarSeed="x" size="lg" />
    );
    expect(c2.firstChild).toHaveClass("h-14");
  });
});
