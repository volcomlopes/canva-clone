"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  PlusIcon,
  CopyIcon,
  CheckIcon,
  MailIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createInvite } from "@/app/(brand)/_actions/create-invite";

interface Dealership {
  id: string;
  name: string;
}

interface InviteUserModalProps {
  dealerships: Dealership[];
}

export const InviteUserModal = ({ dealerships }: InviteUserModalProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"brand_admin" | "dealership_admin" | "user">("user");
  const [dealershipId, setDealershipId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createInvite({
      email,
      role,
      dealershipId: dealershipId || undefined,
    });

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.success && result.token) {
      const baseUrl = window.location.origin;
      const link = baseUrl + "/invite/" + result.token;
      setGeneratedLink(link);
      router.refresh();
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setEmail("");
      setRole("user");
      setDealershipId("");
      setError(null);
      setGeneratedLink(null);
      setCopied(false);
    }, 200);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);
    } else {
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="size-4 mr-2" />
          Convidar Usuario
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {!generatedLink ? (
          <>
            <DialogHeader>
              <DialogTitle>Convidar Novo Usuario</DialogTitle>
              <DialogDescription>
                Apos criar o convite, voce recebera um link magico para enviar manualmente a pessoa.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="pessoa@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Permissao</Label>
                <Select
                  value={role}
                  onValueChange={(v: any) => setRole(v)}
                  disabled={isLoading}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Escolha a permissao" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brand_admin">
                      Admin da Marca (acesso total)
                    </SelectItem>
                    <SelectItem value="dealership_admin">
                      Admin da Unidade
                    </SelectItem>
                    <SelectItem value="user">
                      Vendedor (cria artes)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(role === "dealership_admin" || role === "user") && (
                <div className="space-y-2">
                  <Label htmlFor="dealership">Unidade (opcional)</Label>
                  <Select
                    value={dealershipId}
                    onValueChange={setDealershipId}
                    disabled={isLoading}
                  >
                    <SelectTrigger id="dealership">
                      <SelectValue placeholder="Escolha a unidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealerships.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    "Criar Convite"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckIcon className="size-5 text-green-600" />
                Convite criado!
              </DialogTitle>
              <DialogDescription>
                Copie o link abaixo e envie para {email}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-2">
                  Link magico (valido por 7 dias)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={generatedLink}
                    readOnly
                    className="flex-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-mono text-slate-700 outline-none"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="size-3.5 mr-1 text-green-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <CopyIcon className="size-3.5 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-slate-700">
                <p className="font-medium mb-1 flex items-center gap-1.5">
                  <MailIcon className="size-3.5" />
                  Proximos passos:
                </p>
                <ol className="space-y-1 text-xs ml-5 list-decimal">
                  <li>Copie o link acima</li>
                  <li>Envie para {email} (WhatsApp, email)</li>
                  <li>A pessoa clica no link e faz login com Google</li>
                  <li>Aparece automaticamente na lista de usuarios</li>
                </ol>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Fechar</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};