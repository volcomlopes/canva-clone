"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { createBrand } from "../_actions/create-brand";

// Helper: gera slug a partir do nome
const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
};

export const BrandForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#3B82F6");
  const [secondaryColor, setSecondaryColor] = useState("#1E293B");

  // Atualiza slug automaticamente quando muda o nome
  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManual) {
      setSlug(generateSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await createBrand({
      name,
      slug,
      primaryColor,
      secondaryColor,
    });

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    // ✅ Sucesso! Redireciona para a lista de marcas
    router.push("/admin/brands");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {/* Erro */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
          {error}
        </div>
      )}

      {/* Preview Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3 font-medium">
          Preview
        </p>
        <div className="flex items-center gap-3">
          <div
            className="size-14 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-sm"
            style={{ backgroundColor: primaryColor }}
          >
            {name.charAt(0).toUpperCase() || "?"}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {name || "Nome da marca"}
            </h3>
            <p className="text-xs text-slate-500">{slug || "slug-da-marca"}</p>
          </div>
        </div>
      </div>

      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="name">Nome da marca *</Label>
        <Input
          id="name"
          placeholder="Ex: BMW Brasil"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <Label htmlFor="slug">
          Slug *
          <span className="text-xs text-slate-500 font-normal ml-2">
            (usado em URLs, gerado automaticamente)
          </span>
        </Label>
        <Input
          id="slug"
          placeholder="bmw-brasil"
          value={slug}
          onChange={(e) => {
            setSlug(generateSlug(e.target.value));
            setSlugManual(true);
          }}
          disabled={isLoading}
          required
        />
      </div>

      {/* Cores */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Cor primária</Label>
          <div className="flex gap-2">
            <input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={isLoading}
              className="h-10 w-14 rounded-md border border-slate-200 cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="secondaryColor">Cor secundária</Label>
          <div className="flex gap-2">
            <input
              id="secondaryColor"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              disabled={isLoading}
              className="h-10 w-14 rounded-md border border-slate-200 cursor-pointer"
            />
            <Input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/brands")}
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
            "Criar Marca"
          )}
        </Button>
      </div>
    </form>
  );
};