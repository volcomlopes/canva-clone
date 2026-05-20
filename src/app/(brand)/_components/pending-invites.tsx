"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MailIcon,
  ClockIcon,
  CopyIcon,
  CheckIcon,
  XIcon,
  StoreIcon,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { cancelInvite } from "../_actions/cancel-invite";

interface PendingInvite {
  id: string;
  email: string;
  role: string;
  dealershipName: string | null;
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

interface PendingInvitesProps {
  invites: PendingInvite[];
}

const formatRole = (role: string): string => {
  const map: Record<string, string> = {
    brand_admin: "Admin da Marca",
    dealership_admin: "Admin da Unidade",
    user: "Vendedor",
  };
  return map[role] || role;
};

const formatRelativeTime = (date: Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `Há ${days} dia${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `Há ${hours} hora${hours !== 1 ? "s" : ""}`;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes > 0) return `Há ${minutes} min`;
  return "Agora";
};

export const PendingInvites = ({ invites }: PendingInvitesProps) => {
  const router = useRouter();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCopy = (token: string, inviteId: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/invite/${token}`;
    navigator.clipboard.writeText(link);
    setCopiedId(inviteId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCancel = async (inviteId: string) => {
    const confirmed = window.confirm("Cancelar este convite? O link enviado não funcionará mais.");
    if (!confirmed) return;

    setCancellingId(inviteId);
    const result = await cancelInvite(inviteId);

    if (result.error) {
      alert(`Erro: ${result.error}`);
      setCancellingId(null);
      return;
    }

    router.refresh();
    setCancellingId(null);
  };

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <ClockIcon className="size-4" />
          Convites Pendentes ({invites.length})
        </h3>
      </div>

      <div className="bg-amber-50/30 border border-amber-200 rounded-lg divide-y divide-amber-100">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="p-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors"
          >
            {/* Esquerda: Info do convite */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
                <MailIcon className="size-5 text-amber-700" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">
                  {invite.email}
                </p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">
                    {formatRole(invite.role)}
                  </Badge>
                  {invite.dealershipName && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <StoreIcon className="size-3" />
                      {invite.dealershipName}
                    </span>
                  )}
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <ClockIcon className="size-3" />
                    {formatRelativeTime(invite.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Direita: Ações */}
            <div className="flex items-center gap-2 ml-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(invite.token, invite.id)}
              >
                {copiedId === invite.id ? (
                  <>
                    <CheckIcon className="size-3.5 mr-1 text-green-600" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <CopyIcon className="size-3.5 mr-1" />
                    Copiar link
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancel(invite.id)}
                disabled={cancellingId === invite.id}
              >
                {cancellingId === invite.id ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <XIcon className="size-3.5" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};