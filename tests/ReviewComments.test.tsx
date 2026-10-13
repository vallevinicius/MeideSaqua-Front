import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ReviewComment } from "@/components/ReviewComments";

vi.mock("next/image", () => ({
  default: ({ alt, src }: { alt: string; src: string }) => <img alt={alt} src={src} />,
}));

const resposta = { avaliacoesId: 2, comentario: "Obrigado!", nota: null, usuario: { usuarioId: 9, nomeCompleto: "Dono" } };
const avaliacao = {
  avaliacoesId: 1,
  comentario: "Muito bom\nvolto sempre",
  nota: 4,
  usuario: { usuarioId: 5, nomeCompleto: "Cliente" },
  respostas: [resposta],
};

const montar = (extra: Partial<React.ComponentProps<typeof ReviewComment>> = {}) => {
  const onReplyClick = vi.fn();
  const onDeleteClick = vi.fn();
  render(
    <ReviewComment
      review={avaliacao}
      onReplyClick={onReplyClick}
      onDeleteClick={onDeleteClick}
      currentUser={null}
      allowReply={true}
      {...extra}
    />,
  );
  return { onReplyClick, onDeleteClick };
};

describe("ReviewComment", () => {
  it("mostra autor, comentário e nota", () => {
    montar();
    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByText(/Muito bom/)).toBeInTheDocument();
    expect(document.querySelectorAll("svg polygon")).toHaveLength(5);
  });

  it("só o autor vê o botão de excluir, e ele usa o id certo", async () => {
    montar();
    expect(screen.queryByLabelText("Excluir seu comentário")).toBeNull();
  });

  it("autor logado exclui o próprio comentário", async () => {
    const { onDeleteClick } = montar({ currentUser: { usuarioId: 5 } });
    await userEvent.click(screen.getByLabelText("Excluir seu comentário"));
    expect(onDeleteClick).toHaveBeenCalledWith(1);
  });

  it("outro usuário logado não vê o botão de excluir", () => {
    montar({ currentUser: { usuarioId: 77 } });
    expect(screen.queryByLabelText("Excluir seu comentário")).toBeNull();
  });

  it("responder chama o callback com o id do comentário", async () => {
    const { onReplyClick } = montar();
    await userEvent.click(screen.getByText("Responder"));
    expect(onReplyClick).toHaveBeenCalledWith(1);
  });

  it("sem permissão de resposta o botão não aparece", () => {
    montar({ allowReply: false });
    expect(screen.queryByText("Responder")).toBeNull();
  });

  it("respostas começam escondidas e abrem/fecham no botão", async () => {
    montar();
    expect(screen.queryByText("Obrigado!")).toBeNull();
    await userEvent.click(screen.getByText(/Ver 1/));
    expect(screen.getByText("Obrigado!")).toBeInTheDocument();
    await userEvent.click(screen.getByText(/Esconder Respostas/));
    expect(screen.queryByText("Obrigado!")).toBeNull();
  });

  it("singular e plural no contador de respostas", () => {
    montar({ review: { ...avaliacao, respostas: [resposta, { ...resposta, avaliacoesId: 3 }] } });
    expect(screen.getByText(/Ver 2\s+Respostas/)).toBeInTheDocument();
  });

  it("resposta não permite responder de novo (só um nível)", async () => {
    montar();
    await userEvent.click(screen.getByText(/Ver 1/));
    expect(screen.getAllByText("Responder")).toHaveLength(1);
  });

  it("sem respostas não mostra o botão de ver respostas e sem nota não mostra estrelas", () => {
    montar({ review: { ...avaliacao, respostas: [], nota: null } });
    expect(screen.queryByText(/Ver \d/)).toBeNull();
    expect(document.querySelectorAll("svg polygon")).toHaveLength(0);
  });
});
