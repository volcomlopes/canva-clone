"use client";

import { useState } from "react";
import { ChromePicker } from "react-color";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerFieldProps {
  label?: string;
  description?: string;
  value: string;
  onChange: (hex: string) => void;
  compact?: boolean;
}

export function ColorPickerField({
  label,
  description,
  value,
  onChange,
  compact = false,
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false);

  const handleHexInput = (input: string) => {
    let hex = input.trim();
    if (!hex.startsWith("#")) hex = "#" + hex;
    onChange(hex.toUpperCase());
  };

  // Versao compacta (usada na paleta extra)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="size-10 rounded-md border border-slate-200 shadow-sm hover:scale-105 transition-transform"
              style={{ backgroundColor: value }}
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <ChromePicker
              color={value}
              onChange={(c) => onChange(c.hex.toUpperCase())}
              disableAlpha
            />
          </PopoverContent>
        </Popover>
        <Input
          value={value}
          onChange={(e) => handleHexInput(e.target.value)}
          className="w-28 font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
    );
  }

  // Versao completa (slots fixos)
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {label && (
        <div className="mb-3">
          <h4 className="font-semibold text-sm text-slate-900">{label}</h4>
          {description && (
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="size-12 rounded-md border border-slate-200 shadow-sm hover:scale-105 transition-transform flex-shrink-0"
              style={{ backgroundColor: value }}
              title="Clique para abrir o color picker"
            />
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <ChromePicker
              color={value}
              onChange={(c) => onChange(c.hex.toUpperCase())}
              disableAlpha
            />
          </PopoverContent>
        </Popover>

        <Input
          value={value}
          onChange={(e) => handleHexInput(e.target.value)}
          className="flex-1 font-mono text-sm uppercase"
          maxLength={7}
        />
      </div>
    </div>
  );
}