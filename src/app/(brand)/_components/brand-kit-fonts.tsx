"use client";

import { useState, useTransition, useEffect } from "react";
import { SaveIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { updateBrandFonts } from "@/app/(brand)/_actions/update-brand-fonts";
import { FontPickerField } from "@/app/(brand)/_components/font-picker-field";
import { GOOGLE_FONTS, getGoogleFontUrl } from "@/features/brand-kit/google-fonts";

import { Button } from "@/components/ui/button";

interface BrandKitFontsProps {
  initialFonts: {
    fontHeading: string | null;
    fontSubheading: string | null;
    fontBody: string | null;
    fontHighlight: string | null;
  };
}

const FONT_SLOTS = [
  {
    key: "fontHeading" as const,
    label: "Titulo",
    description: "Fonte principal para titulos e chamadas",
    sampleText: "Headline da Marca",
    sampleSize: "32px",
    sampleWeight: "700",
  },
  {
    key: "fontSubheading" as const,
    label: "Subtitulo",
    description: "Fonte secundaria para subtitulos",
    sampleText: "Subtitulo de Apoio",
    sampleSize: "20px",
    sampleWeight: "600",
  },
  {
    key: "fontBody" as const,
    label: "Corpo",
    description: "Fonte padrao para textos longos",
    sampleText: "Texto de corpo para leitura confortavel.",
    sampleSize: "16px",
    sampleWeight: "400",
  },
  {
    key: "fontHighlight" as const,
    label: "Destaque",
    description: "Fonte especial para frases de impacto",
    sampleText: "DESTAQUE",
    sampleSize: "28px",
    sampleWeight: "700",
  },
];

export function BrandKitFonts({ initialFonts }: BrandKitFontsProps) {
  const [isPending, startTransition] = useTransition();

  const [fonts, setFonts] = useState({
    fontHeading: initialFonts.fontHeading,
    fontSubheading: initialFonts.fontSubheading,
    fontBody: initialFonts.fontBody,
    fontHighlight: initialFonts.fontHighlight,
  });

  // Carrega TODAS as fontes do Google na pagina pra preview
  useEffect(() => {
    const head = document.head;
    const loaded = new Set<string>();

    GOOGLE_FONTS.forEach((font) => {
      if (loaded.has(font.name)) return;
      loaded.add(font.name);

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = getGoogleFontUrl(font.name);
      link.setAttribute("data-brand-kit-font", font.name);
      head.appendChild(link);
    });

    // Cleanup ao desmontar
    return () => {
      document
        .querySelectorAll("link[data-brand-kit-font]")
        .forEach((el) => el.remove());
    };
  }, []);

  const updateFont = (key: keyof typeof fonts, value: string | null) => {
    setFonts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateBrandFonts(fonts);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Fontes salvas com sucesso!");
    });
  };

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Fontes da marca
        </h3>
        <p className="text-sm text-slate-500">
          Configure 4 estilos tipograficos da sua marca. As fontes vem do Google Fonts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {FONT_SLOTS.map((slot) => (
          <FontPickerField
            key={slot.key}
            label={slot.label}
            description={slot.description}
            sampleText={slot.sampleText}
            sampleSize={slot.sampleSize}
            sampleWeight={slot.sampleWeight}
            value={fonts[slot.key]}
            onChange={(font) => updateFont(slot.key, font)}
          />
        ))}
      </div>

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
                Salvar fontes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}