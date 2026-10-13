"use client";

import { useAuth } from "@/context/AuthContext";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; // Certifique-se de que este componente existe
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Store, Plus, AlertCircle, Pencil } from "lucide-react";
import {
  updateUserProfile,
  changeUserPassword,
  deleteUserAccount,
  getMyEstablishments,
  updateMyEstablishment,
  excluirEstabelecimento,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { contemPalavrao } from "@/lib/profanityFilter";
import { removeEmojis, isValidEmail } from "@/lib/utils";

export default function PerfilPage() {
  const { user, logout, isLoading, updateUser: updateUserContext } = useAuth();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Novos estados para os Estabelecimentos do Usuário
  const [myMeis, setMyMeis] = useState<any[]>([]);
  const [isLoadingMeis, setIsLoadingMeis] = useState(true);
  const [isMeiDialogOpen, setIsMeiDialogOpen] = useState(false);
  const [isUpdatingMei, setIsUpdatingMei] = useState(false);
  const [isDeletingMei, setIsDeletingMei] = useState(false);
  const [selectedMei, setSelectedMei] = useState<any | null>(null);
  const [editMeiData, setEditMeiData] = useState({
    nomeFantasia: "",
    emailEstabelecimento: "",
    contatoEstabelecimento: "",
    categoria: "",
    descricaoDiferencial: "",
    endereco: "",
    instagram: "",
    website: "",
  });
  const [deleteReason, setDeleteReason] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const fetchMeis = useCallback(async () => {
    if (!user?.token) return;
    try {
      setIsLoadingMeis(true);
      const data = await getMyEstablishments(user.token);
      setMyMeis(data || []);
    } catch (error: any) {
      console.error("Erro ao buscar estabelecimentos do perfil:", error);
      toast.error(
        error?.message || "Não foi possível carregar seus estabelecimentos.",
      );
    } finally {
      setIsLoadingMeis(false);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchMeis();
  }, [fetchMeis]);

  const openEditMeiDialog = (mei: any) => {
    setSelectedMei(mei);
    setEditMeiData({
      nomeFantasia: mei.nomeFantasia || "",
      emailEstabelecimento: mei.emailEstabelecimento || "",
      contatoEstabelecimento: mei.contatoEstabelecimento || "",
      categoria: mei.categoria || "",
      descricaoDiferencial: mei.descricaoDiferencial || "",
      endereco: mei.endereco || "",
      instagram: mei.instagram || "",
      website: mei.website || "",
    });
    setDeleteReason("");
    setIsMeiDialogOpen(true);
  };

  const handleMeiFieldChange = (field: string, value: string) => {
    setEditMeiData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUpdateMei = async () => {
    if (!user?.token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    if (!selectedMei?.estabelecimentoId) {
      toast.error("Estabelecimento inválido para atualização.");
      return;
    }

    const payload: Record<string, string> = {};

    Object.entries(editMeiData).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim() !== "") {
        payload[key] = value.trim();
      }
    });

    if (Object.keys(payload).length === 0) {
      toast.info("Nenhum campo preenchido para atualização.");
      return;
    }

    if (
      payload.emailEstabelecimento &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.emailEstabelecimento)
    ) {
      toast.error("Informe um e-mail válido para o estabelecimento.");
      return;
    }

    setIsUpdatingMei(true);
    try {
      await updateMyEstablishment(
        selectedMei.estabelecimentoId,
        payload,
        user.token,
      );
      toast.success("Solicitação de atualização enviada com sucesso!");
      setIsMeiDialogOpen(false);
      setSelectedMei(null);
      await fetchMeis();
    } catch (error: any) {
      toast.error(error?.message || "Erro ao atualizar estabelecimento.");
    } finally {
      setIsUpdatingMei(false);
    }
  };

  const handleRequestDeleteMei = async () => {
    if (!user?.token) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    if (!selectedMei?.estabelecimentoId) {
      toast.error("Estabelecimento inválido para exclusão.");
      return;
    }

    setIsDeletingMei(true);
    try {
      const formData = new FormData();
      formData.append(
        "nome_responsavel",
        selectedMei?.nomeResponsavel || selectedMei?.nome_responsavel || "",
      );
      formData.append(
        "cpf_responsavel",
        selectedMei?.cpfResponsavel || selectedMei?.cpf_responsavel || "",
      );
      formData.append("cnpj", selectedMei?.cnpj || "");
      formData.append(
        "emailEstabelecimento",
        selectedMei?.emailEstabelecimento || "",
      );
      formData.append(
        "motivo",
        deleteReason.trim() || "Solicitação de exclusão pelo perfil do usuário.",
      );

      if (selectedMei?.estabelecimentoId) {
        formData.append(
          "estabelecimentoId",
          String(selectedMei.estabelecimentoId),
        );
      }

      await excluirEstabelecimento(formData, user.token);

      toast.success("Solicitação de exclusão enviada para análise.");
      setIsMeiDialogOpen(false);
      setSelectedMei(null);
      setDeleteReason("");
      await fetchMeis();
    } catch (error: any) {
      toast.error(
        error?.message || "Não foi possível solicitar a exclusão agora.",
      );
    } finally {
      setIsDeletingMei(false);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valueComEmoji = e.target.value;
    const valueSemEmoji = removeEmojis(valueComEmoji);

    if (valueComEmoji !== valueSemEmoji) {
      toast.error("Não é possível adicionar emojis", {
        id: "emoji-profile-toast",
      });
    }

    setEditUsername(valueSemEmoji);
  };

  const handleProfileDialogOpenChange = (open: boolean) => {
    setIsProfileDialogOpen(open);
    if (open && user) {
      setEditUsername(user.username || "");
      setEditEmail(user.email || "");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Carregando perfil...</p>
      </div>
    );
  }

  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  const handleProfileUpdate = async () => {
    if (contemPalavrao(username)) {
      toast.error("Você utilizou palavras inapropriadas no nome de usuário.");
      return;
    }
    if (
      editEmail.toLowerCase() !== user.email.toLowerCase() &&
      !isValidEmail(editEmail)
    ) {
      toast.error("Por favor, insira um e-mail válido.");
      return;
    }
    if (!user?.token) {
      toast.error("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    const profileData = {
      username: editUsername !== user.username ? editUsername : undefined,
      email:
        editEmail.toLowerCase() !== user.email.toLowerCase()
          ? editEmail
          : undefined,
    };

    if (!profileData.username && !profileData.email) {
      toast.info("Nenhuma alteração foi feita.");
      setIsProfileDialogOpen(false);
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = await updateUserProfile(profileData, user.token);
      updateUserContext(updatedUser);

      if (profileData.email) {
        toast.success(
          "Dados atualizados! Um e-mail de confirmação foi enviado para o seu novo endereço.",
        );
      } else {
        toast.success("Nome de usuário atualizado com sucesso!");
      }
      setIsProfileDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !currentPassword) {
      toast.error("Preencha todos os campos de senha.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As novas senhas não coincidem.");
      return;
    }
    if (!user?.token) {
      toast.error("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeUserPassword({ currentPassword, newPassword }, user.token);
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsPasswordDialogOpen(false);
    } catch (error: any) {
      toast.error(`Erro ao alterar senha: ${error.message}`);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.token) {
      toast.error("Erro de autenticação. Por favor, faça login novamente.");
      return;
    }

    try {
      await deleteUserAccount(user.token);
      toast.success("Conta excluída com sucesso. Você será desconectado.");
      setTimeout(() => {
        logout();
      }, 2000);
    } catch (error: any) {
      toast.error(`Erro ao excluir a conta: ${error.message}`);
    }
  };

  // Função utilitária para cores do Badge
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ativo":
        return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
      case "pendente_aprovacao":
      case "pendente_atualizacao":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
      case "inativo":
        return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Meu Perfil</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card className="rounded-xl shadow-md">
              <CardHeader className="text-center flex flex-col items-center">
                <Image
                  src="/avatars/default-avatar.png"
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full mx-auto mb-4 border-2 border-blue-500 object-cover"
                />
                <CardTitle>{user.nomeCompleto}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Button
                  onClick={logout}
                  variant="destructive"
                  className="w-full rounded-xl transition-all transform hover:scale-105 active:scale-95 border-2 border-transparent hover:border-red-700"
                >
                  Sair
                </Button>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-8">
            {/* Card de Configurações da Conta */}
            <Card className="rounded-xl shadow-md">
              <CardHeader>
                <CardTitle>Configurações da Conta</CardTitle>
                <CardDescription>
                  Altere seu nome de usuário e e-mail.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentUsername">Nome de Usuário</Label>
                  <Input
                    id="currentUsername"
                    value={username}
                    readOnly
                    disabled
                    className="mt-1 bg-gray-100 cursor-not-allowed"
                  />
                </div>
                <div>
                  <Label htmlFor="currentEmail">Email</Label>
                  <Input
                    id="currentEmail"
                    value={email}
                    readOnly
                    disabled
                    className="mt-1 bg-gray-100 cursor-not-allowed"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Dialog
                  open={isProfileDialogOpen}
                  onOpenChange={handleProfileDialogOpenChange}
                >
                  <DialogTrigger asChild>
                    <Button className="w-fit rounded-full bg-gray-800 text-white transition-all transform hover:scale-105 hover:bg-gray-700 active:scale-95">
                      Alterar Dados
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                      <DialogDescription>
                        Faça alterações no seu perfil aqui. Clique em salvar
                        quando terminar.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="usernameEdit">Nome de Usuário</Label>
                        <Input
                          id="usernameEdit"
                          value={editUsername}
                          onChange={handleUsernameChange}
                          className="mt-1 w-full py-2 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="emailEdit">E-mail</Label>
                        <Input
                          id="emailEdit"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="mt-1 w-full py-2 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          className="rounded-full transition-all transform hover:scale-105"
                          disabled={isUpdatingProfile}
                        >
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handleProfileUpdate}
                        className="w-fit rounded-full transition-all transform hover:scale-105 hover:bg-green-500 active:scale-95 border-2 border-transparent hover:border-green-700"
                        disabled={isUpdatingProfile}
                      >
                        {isUpdatingProfile && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isUpdatingProfile
                          ? "Salvando..."
                          : "Salvar Alterações"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>

            <Card className="rounded-xl shadow-md border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-900">
                  <Store className="w-5 h-5 text-blue-600" />
                  Meus Estabelecimentos
                </CardTitle>
                <CardDescription>
                  Gerencie os MEIs que você possui cadastrados na plataforma.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingMeis ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                  </div>
                ) : myMeis.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">
                      Você ainda não possui nenhum MEI vinculado à sua conta.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myMeis.map((mei) => (
                      <div
                        key={mei.estabelecimentoId}
                        className="flex justify-between items-center p-4 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 transition-all bg-white"
                      >
                        <div className="flex items-center gap-4">
                          {/* NOVO: Bloco da Logo do MEI com Fallback */}
                          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 bg-white flex items-center justify-center p-1 shadow-sm">
                            <img
                              src={
                                mei.logoUrl
                                  ? `${process.env.NEXT_PUBLIC_API_URL}/${mei.logoUrl.replace(/^\/+/, "")}`
                                  : "/LogoMeideSaqua.png" // Fallback caso não tenha logo
                              }
                              alt={`Logo ${mei.nomeFantasia}`}
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                // Fallback de segurança caso a URL da imagem exista mas a imagem esteja quebrada no servidor
                                (e.target as HTMLImageElement).src =
                                  "/LogoMeideSaqua.png";
                              }}
                            />
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {mei.nomeFantasia}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              CNPJ: {mei.cnpj} <span className="mx-1">•</span>{" "}
                              {mei.categoria}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            className={`ml-2 text-[10px] uppercase tracking-wider ${getStatusColor(mei.status)}`}
                          >
                            {mei.status.replace(/_/g, " ")}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditMeiDialog(mei)}
                            className="rounded-full"
                          >
                            <Pencil className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-xl border-dashed border-2 hover:border-blue-500 hover:text-blue-600 transition-colors bg-blue-50/30"
                >
                  <Link href="/cadastro-mei">
                    <Plus className="w-4 h-4 mr-2" />
                    Cadastrar Novo MEI
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            <Dialog open={isMeiDialogOpen} onOpenChange={setIsMeiDialogOpen}>
              <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                  <DialogTitle>Editar Estabelecimento</DialogTitle>
                  <DialogDescription>
                    Atualize os dados do seu MEI. Isso enviará a solicitação para
                    análise.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                  <div className="md:col-span-2">
                    <Label htmlFor="meiNomeFantasia">Nome Fantasia</Label>
                    <Input
                      id="meiNomeFantasia"
                      value={editMeiData.nomeFantasia}
                      onChange={(e) =>
                        handleMeiFieldChange("nomeFantasia", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="meiEmail">E-mail do Estabelecimento</Label>
                    <Input
                      id="meiEmail"
                      value={editMeiData.emailEstabelecimento}
                      onChange={(e) =>
                        handleMeiFieldChange(
                          "emailEstabelecimento",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="meiContato">Contato</Label>
                    <Input
                      id="meiContato"
                      value={editMeiData.contatoEstabelecimento}
                      onChange={(e) =>
                        handleMeiFieldChange(
                          "contatoEstabelecimento",
                          e.target.value,
                        )
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="meiCategoria">Categoria</Label>
                    <Input
                      id="meiCategoria"
                      value={editMeiData.categoria}
                      onChange={(e) =>
                        handleMeiFieldChange("categoria", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="meiEndereco">Endereço</Label>
                    <Input
                      id="meiEndereco"
                      value={editMeiData.endereco}
                      onChange={(e) =>
                        handleMeiFieldChange("endereco", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="meiInstagram">Instagram</Label>
                    <Input
                      id="meiInstagram"
                      value={editMeiData.instagram}
                      onChange={(e) =>
                        handleMeiFieldChange("instagram", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="meiWebsite">Website</Label>
                    <Input
                      id="meiWebsite"
                      value={editMeiData.website}
                      onChange={(e) =>
                        handleMeiFieldChange("website", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="meiDiferencial">Diferencial</Label>
                    <Input
                      id="meiDiferencial"
                      value={editMeiData.descricaoDiferencial}
                      onChange={(e) =>
                        handleMeiFieldChange(
                          "descricaoDiferencial",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>

                <DialogFooter>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        disabled={
                          isUpdatingMei ||
                          isDeletingMei ||
                          selectedMei?.status === "pendente_exclusao"
                        }
                      >
                        {selectedMei?.status === "pendente_exclusao"
                          ? "Exclusão já solicitada"
                          : "Solicitar Exclusão"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Solicitar exclusão deste estabelecimento?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa solicitação será enviada para análise da equipe
                          admin. Você pode informar um motivo opcional abaixo.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <div className="py-2">
                        <Label htmlFor="motivoExclusao">Motivo (opcional)</Label>
                        <Input
                          id="motivoExclusao"
                          value={deleteReason}
                          onChange={(e) => setDeleteReason(e.target.value)}
                          placeholder="Ex.: encerramento das atividades"
                          disabled={isDeletingMei}
                        />
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeletingMei}>
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.preventDefault();
                            handleRequestDeleteMei();
                          }}
                          disabled={isDeletingMei}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeletingMei ? "Enviando..." : "Confirmar Solicitação"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <DialogClose asChild>
                    <Button
                      variant="outline"
                      disabled={isUpdatingMei || isDeletingMei}
                    >
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button
                    onClick={handleUpdateMei}
                    disabled={isUpdatingMei || isDeletingMei}
                  >
                    {isUpdatingMei && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isUpdatingMei ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Card de Alteração de Senha */}
            <Card className="rounded-xl shadow-md">
              <CardHeader>
                <CardTitle>Alterar Senha</CardTitle>
                <CardDescription>
                  Para sua segurança, recomendamos o uso de senhas fortes.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <Dialog
                  open={isPasswordDialogOpen}
                  onOpenChange={setIsPasswordDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      className="w-fit rounded-full bg-gray-800 text-white transition-all transform hover:scale-105 hover:bg-gray-700 active:scale-95"
                    >
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Alterar sua senha</DialogTitle>
                      <DialogDescription>
                        Preencha os campos abaixo para definir uma nova senha.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          placeholder="Sua senha atual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="mt-1 w-full py-2 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Digite a nova senha"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="mt-1 w-full py-2 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">
                          Confirmar Nova Senha
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Digite novamente sua nova senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="mt-1 w-full py-2 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:border-[#22c362]/70 transition-all duration-300 placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          className="rounded-full transition-all transform hover:scale-105"
                          disabled={isChangingPassword}
                        >
                          Cancelar
                        </Button>
                      </DialogClose>
                      <Button
                        onClick={handlePasswordChange}
                        className="w-fit rounded-full transition-all transform hover:scale-105 hover:bg-green-500 active:scale-95 border-2 border-transparent hover:border-green-700"
                        disabled={isChangingPassword}
                      >
                        {isChangingPassword && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isChangingPassword
                          ? "Alterando..."
                          : "Salvar Nova Senha"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Card da Zona de Perigo */}
            <Card className="border-red-500 rounded-xl shadow-md">
              <CardHeader>
                <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
                <CardDescription>
                  A exclusão da sua conta é uma ação irreversível.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-fit rounded-full transition-all transform hover:scale-105 hover:bg-red-500 active:scale-95 border-2 border-transparent hover:border-red-700"
                    >
                      Excluir conta
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Você tem certeza absoluta?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá
                        permanentemente sua conta e removerá seus dados de
                        nossos servidores.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="w-fit rounded-full transform hover:scale-105 bg-green-500 active:scale-95 border-2 border-transparent hover:border-green-700">
                        Cancelar
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className={cn(
                          buttonVariants({ variant: "destructive" }) +
                            " w-fit rounded-full transition-all transform hover:scale-105 hover:bg-red-500 active:scale-95 border-2 border-transparent hover:border-red-700",
                        )}
                      >
                        Continuar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
