"use client";

import { useState, useTransition } from "react";
import { SaveIcon, Loader2Icon, LayersIcon } from "lucide-react";
import { toast } from "sonner";

import { updateBrandSettings } from "@/app/(brand)/_actions/update-brand-settings";

import { Button } from "@/components/ui/button";

interface BrandSettingsFormProps {
  initialSettings: {
    showTemplateControls: boolean;
  };
}

export function BrandSettingsForm(props: BrandSettingsFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showTemplateControls, setShowTemplateControls] = useState(
    props.initialSettings.showTemplateControls
  );

  const handleSave = function () {
    startTransition(async function () {
      const result = await updateBrandSettings({
        showTemplateControls: showTemplateControls,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Configurações salvas!");
    });
  };

  return (
    <div className="space-y-6">
      {/* Secao: Editor */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <LayersIcon className="size-4 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Editor de Arte
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Toggle: Controles de template */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <label
                htmlFor="show-template-controls"
                className="text-sm font-medium text-slate-900 cursor-pointer"
              >
                Mostrar controles de template no editor
              </label>
              <p className="text-xs text-slate-500 mt-1">
                Quando ativado, os admins da marca verão botões para marcar
                elementos como editáveis ou bloqueados em qualquer projeto.
                Útil para quem cria templates com frequência.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={showTemplateControls}
              id="show-template-controls"
              onClick={function () {
                setShowTemplateControls(!showTemplateControls);
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showTemplateControls ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  showTemplateControls ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Botao Salvar */}
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
              Salvar configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}