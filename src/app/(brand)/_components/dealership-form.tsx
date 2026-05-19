"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createDealership } from "../_actions/create-dealership";
import { updateDealership } from "../_actions/update-dealership";

interface DealershipData {
  id: string;
  name: string;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  address: string | null;
  phone: string | null;
}

interface DealershipFormProps {
  dealership?: DealershipData; // se passar, é modo edição
}

const formatCNPJ = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 14);
  return numbers
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 11);
  if (numbers.length <= 10) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return numbers
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

export const DealershipForm = ({ dealership }: DealershipFormProps) => {
  const router = useRouter();
  const isEditMode = !!dealership;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(dealership?.name || "");
  const [cnpj, setCnpj] = useState(formatCNPJ(dealership?.cnpj || ""));
  const [city, setCity] = useState(dealership?.city || "");
  const [state, setState] = useState(dealership?.state || "");
  const [address, setAddress] = useState(dealership?.address || "");
  const [phone, setPhone] = useState(formatPhone(dealership?.phone || ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    let result;

    if (isEditMode && dealership) {
      result = await updateDealership({
        id: dealership.id,
        name,
        cnpj: cnpj.replace(/\D/g, "") || undefined,
        city,
        state,
        address,
        phone: phone.replace(/\D/g, "") || undefined,
      });
    } else {
      result = await createDealership({
        name,
        cnpj: cnpj.replace(/\D/g, "") || undefined,
        city,
        state,
        address,
        phone: phone.replace(/\D/g, "") || undefined,
      });
    }

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if (isEditMode && dealership) {
      router.push(`/brand/dealerships/${dealership.id}`);
    } else {
      router.push("/brand/dealerships");
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Nome da Unidade *</Label>
        <Input
          id="name"
          placeholder="Ex: Auto Brasil Paulista"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cnpj">
          CNPJ <span className="text-xs text-slate-500 font-normal ml-2">(opcional)</span>
        </Label>
        <Input
          id="cnpj"
          placeholder="00.000.000/0000-00"
          value={cnpj}
          onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
          disabled={isLoading}
          className="font-mono"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2 col-span-2">
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            placeholder="São Paulo"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">Estado</Label>
          <select
            id="state"
            value={state}
            onChange={(e) => setState(e.target.value)}
            disabled={isLoading}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">--</option>
            {ESTADOS.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Av. Paulista, 1000"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input
          id="phone"
          placeholder="(11) 99999-9999"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (isEditMode && dealership) {
              router.push(`/brand/dealerships/${dealership.id}`);
            } else {
              router.push("/brand/dealerships");
            }
          }}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="size-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            isEditMode ? "Salvar alterações" : "Criar Unidade"
          )}
        </Button>
      </div>
    </form>
  );
};