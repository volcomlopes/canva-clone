"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockIcon, CheckCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { toggleBrandStatus } from "../_actions/toggle-brand-status";

interface BrandStatusButtonProps {
  brandId: string;
  brandName: string;
  isActive: boolean;
}

export const BrandStatusButton = ({
  brandId,
  brandName,
  isActive,
}: BrandStatusButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    // Confirmação
    const action = isActive ? "desativar" : "ativar";
    const confirmed = window.confirm(
      `Tem certeza que deseja ${action} a marca "${brandName}"?\n\n` +
      (isActive
        ? "Os usuários dessa marca ainda poderão acessar, mas a marca aparecerá como inativa."
        : "A marca voltará a aparecer como ativa.")
    );

    if (!confirmed) return;

    setIsLoading(true);

    const result = await toggleBrandStatus({
      id: brandId,
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