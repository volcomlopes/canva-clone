"use client";

import { Loader, Palette } from "lucide-react";

import { useGetBrandKit } from "@/features/brand-kit/api/use-get-brand-kit";

interface BrandColorsPaletteProps {
  value: string;
  onChange: (value: string) => void;
}

const SLOT_LABELS: Record<string, string> = {
  colorPrimary: "Primaria",
  colorSecondary: "Secundaria",
  colorText: "Texto",
  colorBackground: "Background",
  colorAccent: "Destaque",
};

export const BrandColorsPalette = ({
  value,
  onChange,
}: BrandColorsPaletteProps) => {
  const { data, isLoading } = useGetBrandKit();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader className="size-4 text-muted-foreground animate-spin" />
      </div>
    );
  }

  if (!data) {
    return null; // sem brand kit, nao mostra nada
  }

  // Monta lista de cores: 5 slots fixos + extras
  const fixedSlots = [
    { key: "colorPrimary", color: data.colorPrimary },
    { key: "colorSecondary", color: data.colorSecondary },
    { key: "colorText", color: data.colorText },
    { key: "colorBackground", color: data.colorBackground },
    { key: "colorAccent", color: data.colorAccent },
  ].filter((slot) => slot.color);

  const extras = data.colorsExtra || [];

  // Se nao tem nenhuma cor configurada, esconde
  if (fixedSlots.length === 0 && extras.length === 0) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Palette className="size-3.5 text-slate-500" />
        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
          Cores da Marca
        </h4>
      </div>

      <div className="grid grid-cols-8 gap-2">
        {fixedSlots.map((slot) => (
          <button
            key={slot.key}
            type="button"
            onClick={() => onChange(slot.color!)}
            className="size-8 rounded-md border border-slate-200 shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: slot.color! }}
            title={`${SLOT_LABELS[slot.key]} ${slot.color}`}
          />
        ))}

        {extras.map((extra, index) => (
          <button
            key={`extra-${index}`}
            type="button"
            onClick={() => onChange(extra.hex)}
            className="size-8 rounded-md border border-slate-200 shadow-sm hover:scale-110 transition-transform"
            style={{ backgroundColor: extra.hex }}
            title={`${extra.name} ${extra.hex}`}
          />
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Mais opcoes de cor abaixo
        </p>
      </div>
    </div>
  );
};