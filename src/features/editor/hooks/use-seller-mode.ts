import { useEffect } from "react";
import { fabric } from "fabric";

import { useGetBrandSettings } from "@/features/brand-settings/api/use-get-brand-settings";

/**
 * Modo Vendedor: aplica travas em elementos NAO editaveis quando o usuario
 * e role "user" ou "dealership_admin" e o canvas tem elementos com isEditable
 * definido (ou seja, foi carregado de um template).
 *
 * Elementos travados: nao podem ser selecionados/movidos/redimensionados.
 * Elementos editaveis: vendedor pode editar conteudo, mover, redimensionar e girar.
 *                      Mas nao pode mudar cor/fonte/tamanho (controlado pela toolbar).
 */
export const useSellerMode = (canvas: fabric.Canvas | null) => {
  const { data: brandSettings } = useGetBrandSettings();

  useEffect(() => {
    if (!canvas) return;
    if (!brandSettings) return;

    const role = brandSettings.userRole;
    const isSeller = role === "user" || role === "dealership_admin";

    if (!isSeller) return; // admin nao tem restricoes

    const applyLocks = function () {
      const objects = canvas.getObjects();

      // Detecta se o canvas tem elementos com isEditable definido
      // (significa que foi carregado de um template)
      const hasTemplateElements = objects.some(function (obj) {
        // @ts-ignore - propriedade custom
        return obj.get && typeof obj.get("isEditable") === "boolean";
      });

      if (!hasTemplateElements) return; // canvas vazio ou projeto normal

      objects.forEach(function (obj) {
        // Pula o workspace (fundo branco)
        if (obj.name === "clip") return;

        // @ts-ignore - propriedade custom
        const isEditable = obj.get && obj.get("isEditable");

        if (isEditable === true) {
          // Elemento EDITAVEL: vendedor pode mover, escalar e girar livremente
          // - Pode mover (X e Y)
          // - Pode redimensionar (largura/altura)
          // - Pode rotacionar
          // - Pode editar conteudo (duplo clique no texto)
          // - Cor/fonte/tamanho de fonte sao bloqueados na toolbar
          obj.set({
            lockMovementX: false,
            lockMovementY: false,
            lockScalingX: false,
            lockScalingY: false,
            lockRotation: false,
            hasControls: true,
            hoverCursor: "move",
            selectable: true,
            evented: true,
          });
        } else {
          // Elemento TRAVADO: vendedor nao pode interagir
          obj.set({
            selectable: false,
            evented: false,
            hoverCursor: "default",
          });
        }
      });

      canvas.requestRenderAll();
    };

    // Aplica travas quando objetos sao adicionados
    const handleObjectAdded = function () {
      applyLocks();
    };

    // Aplica travas quando JSON e carregado (template selecionado)
    canvas.on("object:added", handleObjectAdded);

    // Aplica logo de cara (caso ja tenha objetos carregados)
    applyLocks();

    return function () {
      canvas.off("object:added", handleObjectAdded);
    };
  }, [canvas, brandSettings]);
};