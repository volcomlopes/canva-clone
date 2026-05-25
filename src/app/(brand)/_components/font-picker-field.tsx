"use client";

import { useState, useMemo } from "react";
import { TypeIcon, XIcon, SearchIcon, CheckIcon } from "lucide-react";

import {
  GOOGLE_FONTS,
  FONT_CATEGORIES,
} from "@/features/brand-kit/google-fonts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type CategoryFilter = "all" | "sans-serif" | "serif" | "display" | "handwriting" | "monospace";

interface FontPickerFieldProps {
  label: string;
  description: string;
  sampleText: string;
  sampleSize: string;
  sampleWeight: string;
  value: string | null;
  onChange: (font: string | null) => void;
}

export function FontPickerField(props: FontPickerFieldProps) {
  const label = props.label;
  const description = props.description;
  const sampleText = props.sampleText;
  const sampleSize = props.sampleSize;
  const sampleWeight = props.sampleWeight;
  const value = props.value;
  const onChange = props.onChange;

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all" as CategoryFilter);

  const filteredFonts = useMemo(function () {
    return GOOGLE_FONTS.filter(function (font) {
      const matchesSearch =
        search.length === 0 ||
        font.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "all" || font.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  const handleSelect = function (fontName: string) {
    onChange(fontName);
    setOpen(false);
  };

  const handleClear = function (e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="mb-3">
        <h4 className="font-semibold text-sm text-slate-900">{label}</h4>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>

      <div
        className="bg-slate-50 border border-slate-200 rounded-md p-4 mb-3 min-h-[80px] flex items-center justify-center"
        style={{
          fontFamily: value ? `"${value}", sans-serif` : "system-ui",
          fontSize: sampleSize,
          fontWeight: sampleWeight as any,
          color: value ? "#0F172A" : "#94A3B8",
        }}
      >
        {value ? sampleText : "Nenhuma fonte selecionada"}
      </div>

      <div className="flex items-center gap-2">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="flex-1">
              <TypeIcon className="size-4 mr-2" />
              {value || "Escolher fonte"}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Escolha uma fonte para {label}</DialogTitle>
            </DialogHeader>

            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Buscar fonte..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={cn(
                  "px-3 py-1 text-xs rounded-md border transition-colors",
                  activeCategory === "all"
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                Todas ({GOOGLE_FONTS.length})
              </button>
              {FONT_CATEGORIES.map(function (cat) {
                const count = GOOGLE_FONTS.filter(function (f) {
                  return f.category === cat.value;
                }).length;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setActiveCategory(cat.value)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md border transition-colors",
                      activeCategory === cat.value
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-2">
                {filteredFonts.map(function (font) {
                  return (
                    <button
                      key={font.name}
                      type="button"
                      onClick={() => handleSelect(font.name)}
                      className={cn(
                        "relative bg-white border rounded-md p-4 hover:border-blue-400 hover:shadow-md transition-all text-left",
                        value === font.name
                          ? "border-blue-600 ring-2 ring-blue-100"
                          : "border-slate-200"
                      )}
                    >
                      {value === font.name && (
                        <div className="absolute top-2 right-2 size-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <CheckIcon className="size-3 text-white" />
                        </div>
                      )}

                      <div
                        className="text-4xl mb-2"
                        style={{
                          fontFamily: `"${font.name}", sans-serif`,
                          fontWeight: font.weights.includes("700") ? 700 : 400,
                        }}
                      >
                        Aa
                      </div>
                      <div className="text-xs text-slate-700 font-medium truncate">
                        {font.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 capitalize">
                        {font.category}
                      </div>
                    </button>
                  );
                })}
              </div>

              {filteredFonts.length === 0 && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-500">
                    Nenhuma fonte encontrada para a busca
                  </p>
                </div>
              )}
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
            title="Limpar fonte"
          >
            <XIcon className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}