import { useEffect } from "react";

import { useGetBrandKit } from "@/features/brand-kit/api/use-get-brand-kit";
import { getGoogleFontUrl, GOOGLE_FONTS } from "@/features/brand-kit/google-fonts";

/**
 * Carrega as fontes da marca dinamicamente no head do documento.
 * Quando o brand kit muda, atualiza os <link> tags do Google Fonts.
 */
export const useLoadBrandFonts = () => {
  const { data: kit } = useGetBrandKit();

  useEffect(() => {
    if (!kit) return;

    const slots = [
      kit.fontHeading,
      kit.fontSubheading,
      kit.fontBody,
      kit.fontHighlight,
    ];

    // Filtra fontes validas (existem no catalogo)
    const fontsToLoad = slots.filter(function (font) {
      if (!font) return false;
      return GOOGLE_FONTS.some(function (f) {
        return f.name === font;
      });
    }) as string[];

    // Remove tags antigas
    document
      .querySelectorAll("link[data-editor-brand-font]")
      .forEach(function (el) {
        el.remove();
      });

    // Adiciona uma tag para cada fonte
    fontsToLoad.forEach(function (fontName) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = getGoogleFontUrl(fontName);
      link.setAttribute("data-editor-brand-font", fontName);
      document.head.appendChild(link);
    });

    return function () {
      document
        .querySelectorAll("link[data-editor-brand-font]")
        .forEach(function (el) {
          el.remove();
        });
    };
  }, [kit]);
};