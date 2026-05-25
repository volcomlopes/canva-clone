"use client";

import { useState } from "react";

import { BrandKitColors } from "@/app/(brand)/_components/brand-kit-colors";
import { BrandKitLogos } from "@/app/(brand)/_components/brand-kit-logos";
import { BrandKitFonts } from "@/app/(brand)/_components/brand-kit-fonts";

import { cn } from "@/lib/utils";

interface ExtraColor {
  name: string;
  hex: string;
}

interface BrandKitTabsProps {
  colors: {
    colorPrimary: string;
    colorSecondary: string;
    colorText: string;
    colorBackground: string;
    colorAccent: string;
    colorsExtra: ExtraColor[];
  };
  logos: {
    logoPrimary: string | null;
    logoMonoWhite: string | null;
    logoMonoBlack: string | null;
    logoHorizontal: string | null;
    logoVertical: string | null;
    favicon: string | null;
  };
  fonts: {
    fontHeading: string | null;
    fontSubheading: string | null;
    fontBody: string | null;
    fontHighlight: string | null;
  };
}

type Tab = "cores" | "logos" | "fontes";

const TABS: { value: Tab; label: string }[] = [
  { value: "cores", label: "Cores" },
  { value: "logos", label: "Logos" },
  { value: "fontes", label: "Fontes" },
];

export function BrandKitTabs({ colors, logos, fonts }: BrandKitTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("cores");

  return (
    <div>
      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
                activeTab === tab.value
                  ? "text-slate-900 border-blue-600"
                  : "text-slate-600 hover:text-slate-900 border-transparent"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conteudo */}
      {activeTab === "cores" && <BrandKitColors initialColors={colors} />}
      {activeTab === "logos" && <BrandKitLogos initialLogos={logos} />}
      {activeTab === "fontes" && <BrandKitFonts initialFonts={fonts} />}
    </div>
  );
}