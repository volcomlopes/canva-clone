"use client";

import { useState, useTransition } from "react";
import { SaveIcon, PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { upsertBrandKit } from "@/app/(brand)/_actions/upsert-brand-kit";
import { ColorPickerField } from "@/app/(brand)/_components/color-picker-field";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ExtraColor {
  name: string;
  hex: string;
}

interface BrandKitColorsProps {
  initialColors: {
    colorPrimary: string;
    colorSecondary: string;
    colorText: string;
    colorBackground: string;
    colorAccent: string;
    colorsExtra: ExtraColor[];
  };
}

const FIXED_SLOTS = [
  {
    key: "colorPrimary" as const,
    label: "Primaria",
    description: "Cor principal da marca",
  },
  {
    key: "colorSecondary" as const,
    label: "Secundaria",
    description: "Cor de apoio",
  },
  {
    key: "colorText" as const,
    label: "Texto",
    description: "Cor padrao para textos",
  },
  {
    key: "colorBackground" as const,
    label: "Background",
    description: "Cor de fundo",
  },
  {
    key: "colorAccent" as const,
    label: "Destaque",
    description: "Cor para chamar atencao",
  },
];

export function BrandKitColors({ initialColors }: BrandKitColorsProps) {
  const [isPending, startTransition] = useTransition();

  const [colors, setColors] = useState({
    colorPrimary: initialColors.colorPrimary,
    colorSecondary: initialColors.colorSecondary,
    colorText: initialColors.colorText,
    colorBackground: initialColors.colorBackground,
    colorAccent: initialColors.colorAccent,
  });

  const [extraColors, setExtraColors] = useState<ExtraColor[]>(
    initialColors.colorsExtra
  );

  const updateFixedColor = (key: keyof typeof colors, hex: string) => {
    setColors((prev) => ({ ...prev, [key]: hex }));
  };

  const addExtraColor = () => {
    setExtraColors((prev) => [
      ...prev,
      { name: `Cor ${prev.length + 1}`, hex: "#000000" },
    ]);
  };

  const updateExtraColor = (
    index: number,
    field: "name" | "hex",
    value: string
  ) => {
    setExtraColors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const removeExtraColor = (index: number) => {
    setExtraColors((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertBrandKit({
        ...colors,
        colorsExtra: extraColors,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Brand Kit salvo com sucesso!");
    });
  };

  return (
    <div className="space-y-8">
      {/* Slots Fixos */}
      <section>
        <div className="mb-4">
          <h3 className="text-base font-semibold text-slate-900 mb-1">
            Cores principais
          </h3>
          <p className="text-sm text-slate-500">
            Cinco cores essenciais da identidade da marca
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FIXED_SLOTS.map((slot) => (
            <ColorPickerField
              key={slot.key}
              label={slot.label}
              description={slot.description}
              value={colors[slot.key]}
              onChange={(hex) => updateFixedColor(slot.key, hex)}
            />
          ))}
        </div>
      </section>

      {/* Paleta Extra */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Paleta extra
            </h3>
            <p className="text-sm text-slate-500">
              Cores adicionais especificas da marca
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addExtraColor}
          >
            <PlusIcon className="size-4 mr-2" />
            Adicionar cor
          </Button>
        </div>

        {extraColors.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-lg p-8 text-center">
            <p className="text-sm text-slate-500">
              Nenhuma cor extra adicionada ainda
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Use o botao acima para adicionar cores alem das 5 principais
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {extraColors.map((color, index) => (
              <div
                key={index}
                className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3"
              >
                <ColorPickerField
                  compact
                  value={color.hex}
                  onChange={(hex) => updateExtraColor(index, "hex", hex)}
                />
                <Input
                  value={color.name}
                  onChange={(e) =>
                    updateExtraColor(index, "name", e.target.value)
                  }
                  placeholder="Nome da cor"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeExtraColor(index)}
                  className="text-red-600 hover:bg-red-50"
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Botao Salvar */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4">
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2Icon className="size-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <SaveIcon className="size-4 mr-2" />
                Salvar alteracoes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}