"use client";

import { LogoSlotCard } from "@/app/(brand)/_components/logo-slot-card";

interface BrandKitLogosProps {
  initialLogos: {
    logoPrimary: string | null;
    logoMonoWhite: string | null;
    logoMonoBlack: string | null;
    logoHorizontal: string | null;
    logoVertical: string | null;
    favicon: string | null;
  };
}

const LOGO_SLOTS = [
  {
    key: "logoPrimary" as const,
    label: "Logo Principal",
    description: "Versao colorida oficial da marca",
    background: "light",
  },
  {
    key: "logoHorizontal" as const,
    label: "Logo Horizontal",
    description: "Versao deitada (proporcao maior na largura)",
    background: "light",
  },
  {
    key: "logoVertical" as const,
    label: "Logo Vertical / Quadrado",
    description: "Versao em pe (proporcao quadrada ou alta)",
    background: "light",
  },
  {
    key: "logoMonoWhite" as const,
    label: "Mono Branco",
    description: "Versao monocromatica branca (para fundos escuros)",
    background: "dark",
  },
  {
    key: "logoMonoBlack" as const,
    label: "Mono Preto",
    description: "Versao monocromatica preta (para fundos claros)",
    background: "light",
  },
  {
    key: "favicon" as const,
    label: "Favicon / Icone",
    description: "Versao reduzida para uso em pequeno tamanho",
    background: "transparent",
  },
];

export function BrandKitLogos({ initialLogos }: BrandKitLogosProps) {
  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-base font-semibold text-slate-900 mb-1">
          Logos da marca
        </h3>
        <p className="text-sm text-slate-500">
          Suba diferentes versoes do logo para usar em contextos variados.
          Aceita PNG, JPG e SVG (max 4MB).
        </p>
      </div>

      <div className="space-y-3">
        {LOGO_SLOTS.map((slot) => (
          <LogoSlotCard
            key={slot.key}
            logoType={slot.key}
            label={slot.label}
            description={slot.description}
            background={slot.background as "light" | "dark" | "transparent"}
            currentUrl={initialLogos[slot.key]}
          />
        ))}
      </div>
    </div>
  );
}