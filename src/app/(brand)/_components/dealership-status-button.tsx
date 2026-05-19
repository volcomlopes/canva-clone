"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockIcon, CheckCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toggleDealershipStatus } from "../_actions/toggle-dealership-status";

interface DealershipStatusButtonProps {
  dealershipId: string;
  dealershipName: string;
  isActive: boolean;
}

export const DealershipStatusButton = ({
  dealershipId,
  dealershipName,
  isActive,
}: DealershipStatusButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    const action = isActive ? "desativar" : "ativar";
    const confirmed = window.confirm(
      `Tem certeza que deseja ${action} a unidade "${dealershipName}"?\n\n` +
      (isActive
        ? "Os usuários dessa unidade poderão continuar acessando, mas a unidade aparecerá como inativa."
        : "A unidade voltará a aparecer como ativa.")
    );

    if (!confirmed) return;

    setIsLoading(true);

    const result = await toggleDealershipStatus({
      id: dealershipId,
      active: !isActive,
    });

    if (result.error) {
      alert(`Erro: ${result.error}`);
      setIsLoading(false);
      return;
    }

    router.refresh();
    setIsLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="size-4 mr-2 animate-spin" />
          Processando...
        </>
      ) : isActive ? (
        <>
          <LockIcon className="size-4 mr-2" />
          Desativar
        </>
      ) : (
        <>
          <CheckCircleIcon className="size-4 mr-2" />
          Ativar
        </>
      )}
    </Button>
  );
};