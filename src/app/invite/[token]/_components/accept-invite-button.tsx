"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { acceptInvite } from "@/app/_actions/accept-invite";

interface AcceptInviteButtonProps {
  token: string;
}

export const AcceptInviteButton = ({ token }: AcceptInviteButtonProps) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAccept = async () => {
    setError(null);
    setIsLoading(true);

    const result = await acceptInvite(token);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.success) {
      setSuccess(true);
      // Espera 2 segundos e redireciona
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="size-16 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="size-8 text-green-600" />
        </div>
        <p className="text-sm font-medium text-slate-900 mb-1">
          Convite aceito!
        </p>
        <p className="text-xs text-slate-500">
          Redirecionando para o app...
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm mb-4">
          {error}
        </div>
      )}
      <Button
        onClick={handleAccept}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Aceitando...
          </>
        ) : (
          "Aceitar convite e entrar"
        )}
      </Button>
    </>
  );
};