export interface GoogleFont {
  name: string;
  category: "sans-serif" | "serif" | "display" | "handwriting" | "monospace";
  weights: string[]; // ex: ["400", "700"]
}

// 100 Google Fonts mais usadas (curadoria + ranking 2024)
export const GOOGLE_FONTS: GoogleFont[] = [
  // SANS-SERIF MODERNAS
  { name: "Inter", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Roboto", category: "sans-serif", weights: ["400", "500", "700"] },
  { name: "Open Sans", category: "sans-serif", weights: ["400", "600", "700"] },
  { name: "Lato", category: "sans-serif", weights: ["400", "700", "900"] },
  { name: "Montserrat", category: "sans-serif", weights: ["400", "600", "700", "900"] },
  { name: "Poppins", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Nunito", category: "sans-serif", weights: ["400", "600", "700", "900"] },
  { name: "Nunito Sans", category: "sans-serif", weights: ["400", "600", "700", "900"] },
  { name: "Raleway", category: "sans-serif", weights: ["400", "500", "700", "900"] },
  { name: "Work Sans", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "DM Sans", category: "sans-serif", weights: ["400", "500", "700"] },
  { name: "Manrope", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Outfit", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Plus Jakarta Sans", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Rubik", category: "sans-serif", weights: ["400", "500", "700", "900"] },
  { name: "Space Grotesk", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Inter Tight", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Mulish", category: "sans-serif", weights: ["400", "600", "700", "900"] },
  { name: "Karla", category: "sans-serif", weights: ["400", "500", "700", "800"] },
  { name: "Quicksand", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Barlow", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "PT Sans", category: "sans-serif", weights: ["400", "700"] },
  { name: "Source Sans 3", category: "sans-serif", weights: ["400", "600", "700", "900"] },
  { name: "Fira Sans", category: "sans-serif", weights: ["400", "500", "700", "900"] },
  { name: "Heebo", category: "sans-serif", weights: ["400", "500", "700", "900"] },
  { name: "Cabin", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Hind", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Mukti", category: "sans-serif", weights: ["400", "700"] },
  { name: "Assistant", category: "sans-serif", weights: ["400", "600", "700", "800"] },
  { name: "Bricolage Grotesque", category: "sans-serif", weights: ["400", "500", "700"] },

  // DISPLAY / IMPACT
  { name: "Bebas Neue", category: "display", weights: ["400"] },
  { name: "Oswald", category: "display", weights: ["400", "500", "600", "700"] },
  { name: "Anton", category: "display", weights: ["400"] },
  { name: "Archivo Black", category: "display", weights: ["400"] },
  { name: "Righteous", category: "display", weights: ["400"] },
  { name: "Black Ops One", category: "display", weights: ["400"] },
  { name: "Bowlby One", category: "display", weights: ["400"] },
  { name: "Bungee", category: "display", weights: ["400"] },
  { name: "Russo One", category: "display", weights: ["400"] },
  { name: "Staatliches", category: "display", weights: ["400"] },
  { name: "Squada One", category: "display", weights: ["400"] },
  { name: "Alfa Slab One", category: "display", weights: ["400"] },
  { name: "Passion One", category: "display", weights: ["400", "700", "900"] },
  { name: "Fjalla One", category: "display", weights: ["400"] },
  { name: "Yanone Kaffeesatz", category: "display", weights: ["400", "500", "700"] },
  { name: "Permanent Marker", category: "handwriting", weights: ["400"] },
  { name: "Russo One", category: "display", weights: ["400"] },
  { name: "Teko", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Saira Condensed", category: "sans-serif", weights: ["400", "600", "700", "900"] },
  { name: "Archivo", category: "sans-serif", weights: ["400", "500", "700", "900"] },

  // SERIFAS ELEGANTES
  { name: "Playfair Display", category: "serif", weights: ["400", "500", "700", "900"] },
  { name: "Merriweather", category: "serif", weights: ["400", "700", "900"] },
  { name: "Lora", category: "serif", weights: ["400", "500", "600", "700"] },
  { name: "PT Serif", category: "serif", weights: ["400", "700"] },
  { name: "Cormorant Garamond", category: "serif", weights: ["400", "500", "600", "700"] },
  { name: "Crimson Text", category: "serif", weights: ["400", "600", "700"] },
  { name: "EB Garamond", category: "serif", weights: ["400", "500", "600", "700"] },
  { name: "Libre Baskerville", category: "serif", weights: ["400", "700"] },
  { name: "Bitter", category: "serif", weights: ["400", "500", "700", "900"] },
  { name: "Source Serif 4", category: "serif", weights: ["400", "600", "700"] },
  { name: "Roboto Slab", category: "serif", weights: ["400", "500", "700", "900"] },
  { name: "Cardo", category: "serif", weights: ["400", "700"] },
  { name: "Spectral", category: "serif", weights: ["400", "500", "600", "700"] },
  { name: "Vollkorn", category: "serif", weights: ["400", "600", "700", "900"] },
  { name: "Domine", category: "serif", weights: ["400", "500", "600", "700"] },
  { name: "Cormorant", category: "serif", weights: ["400", "500", "600", "700"] },
  { name: "Frank Ruhl Libre", category: "serif", weights: ["400", "500", "700", "900"] },
  { name: "Noto Serif", category: "serif", weights: ["400", "700", "900"] },
  { name: "Tinos", category: "serif", weights: ["400", "700"] },
  { name: "Old Standard TT", category: "serif", weights: ["400", "700"] },

  // HANDWRITING / SCRIPT
  { name: "Pacifico", category: "handwriting", weights: ["400"] },
  { name: "Dancing Script", category: "handwriting", weights: ["400", "500", "600", "700"] },
  { name: "Caveat", category: "handwriting", weights: ["400", "500", "600", "700"] },
  { name: "Satisfy", category: "handwriting", weights: ["400"] },
  { name: "Great Vibes", category: "handwriting", weights: ["400"] },
  { name: "Lobster", category: "handwriting", weights: ["400"] },
  { name: "Kaushan Script", category: "handwriting", weights: ["400"] },
  { name: "Shadows Into Light", category: "handwriting", weights: ["400"] },
  { name: "Indie Flower", category: "handwriting", weights: ["400"] },
  { name: "Amatic SC", category: "handwriting", weights: ["400", "700"] },
  { name: "Allura", category: "handwriting", weights: ["400"] },
  { name: "Sacramento", category: "handwriting", weights: ["400"] },
  { name: "Cookie", category: "handwriting", weights: ["400"] },
  { name: "Marck Script", category: "handwriting", weights: ["400"] },
  { name: "Yellowtail", category: "handwriting", weights: ["400"] },
  { name: "Architects Daughter", category: "handwriting", weights: ["400"] },
  { name: "Patrick Hand", category: "handwriting", weights: ["400"] },
  { name: "Homemade Apple", category: "handwriting", weights: ["400"] },
  { name: "Gloria Hallelujah", category: "handwriting", weights: ["400"] },

  // MONOSPACE
  { name: "JetBrains Mono", category: "monospace", weights: ["400", "500", "600", "700"] },
  { name: "Fira Code", category: "monospace", weights: ["400", "500", "600", "700"] },
  { name: "Source Code Pro", category: "monospace", weights: ["400", "500", "700", "900"] },
  { name: "Roboto Mono", category: "monospace", weights: ["400", "500", "700"] },
  { name: "IBM Plex Mono", category: "monospace", weights: ["400", "500", "600", "700"] },
  { name: "Space Mono", category: "monospace", weights: ["400", "700"] },
  { name: "Inconsolata", category: "monospace", weights: ["400", "500", "700", "900"] },
  { name: "Cousine", category: "monospace", weights: ["400", "700"] },

  // EXTRAS POPULARES
  { name: "Josefin Sans", category: "sans-serif", weights: ["400", "500", "600", "700"] },
  { name: "Comfortaa", category: "display", weights: ["400", "500", "600", "700"] },
  { name: "Abril Fatface", category: "display", weights: ["400"] },
  { name: "Titan One", category: "display", weights: ["400"] },
  { name: "Faster One", category: "display", weights: ["400"] },
  { name: "Press Start 2P", category: "display", weights: ["400"] },
  { name: "Special Elite", category: "display", weights: ["400"] },
  { name: "Audiowide", category: "display", weights: ["400"] },
];

// Helper: gera URL do Google Fonts pra carregar uma fonte especifica
export const getGoogleFontUrl = (fontName: string): string => {
  const font = GOOGLE_FONTS.find((f) => f.name === fontName);
  if (!font) return "";

  const weights = font.weights.join(";");
  const family = fontName.replace(/ /g, "+");
  return `https://fonts.googleapis.com/css2?family=${family}:wght@${weights}&display=swap`;
};

// Helper: agrupa fontes por categoria
export const FONT_CATEGORIES: { value: GoogleFont["category"]; label: string }[] = [
  { value: "sans-serif", label: "Sans Serif" },
  { value: "serif", label: "Serif" },
  { value: "display", label: "Display / Impacto" },
  { value: "handwriting", label: "Manuscrita" },
  { value: "monospace", label: "Monospace" },
];