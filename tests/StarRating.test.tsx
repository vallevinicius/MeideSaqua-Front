import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StarRating } from "@/components/StarRating";

const offsets = (container: HTMLElement) =>
  [...container.querySelectorAll("linearGradient")].map((g) => g.querySelectorAll("stop")[1].getAttribute("offset"));

describe("StarRating", () => {
  it("sempre desenha 5 estrelas", () => {
    const { container } = render(<StarRating rating={3} />);
    expect(container.querySelectorAll("svg")).toHaveLength(5);
  });

  it.each([
    [0, ["0%", "0%", "0%", "0%", "0%"]],
    [3, ["100%", "100%", "100%", "0%", "0%"]],
    [5, ["100%", "100%", "100%", "100%", "100%"]],
    [4.5, ["100%", "100%", "100%", "100%", "50%"]],
    [2.5, ["100%", "100%", "50%", "0%", "0%"]],
  ])("nota %s preenche as estrelas certas", (nota, esperado) => {
    const { container } = render(<StarRating rating={nota} />);
    expect(offsets(container)).toEqual(esperado);
  });
});
