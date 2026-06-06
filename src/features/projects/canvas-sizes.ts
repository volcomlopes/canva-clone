export interface CanvasSize {
  id: string;
  name: string;
  width: number;
  height: number;
  category: string;
}

export const CANVAS_SIZES: CanvasSize[] = [
  // REDES SOCIAIS
  { id: "ig-post", name: "Instagram Post", width: 1080, height: 1080, category: "social" },
  { id: "ig-story", name: "Instagram Story", width: 1080, height: 1920, category: "social" },
  { id: "ig-reels", name: "Instagram Reels", width: 1080, height: 1920, category: "social" },
  { id: "fb-post", name: "Facebook Post", width: 1200, height: 630, category: "social" },
  { id: "fb-cover", name: "Facebook Capa", width: 820, height: 312, category: "social" },
  { id: "tiktok", name: "TikTok", width: 1080, height: 1920, category: "social" },
  { id: "linkedin", name: "LinkedIn Post", width: 1200, height: 627, category: "social" },

  // IMPRESSAO
  { id: "a4-v", name: "A4 Vertical", width: 2480, height: 3508, category: "print" },
  { id: "a4-h", name: "A4 Horizontal", width: 3508, height: 2480, category: "print" },
  { id: "card", name: "Cartao de Visita", width: 1050, height: 600, category: "print" },
  { id: "flyer", name: "Flyer", width: 2480, height: 3508, category: "print" },
  { id: "banner-print", name: "Banner 60x27cm", width: 2362, height: 1063, category: "print" },

  // WEB
  { id: "slide", name: "Apresentacao", width: 1920, height: 1080, category: "web" },
  { id: "banner-web", name: "Banner Site", width: 1920, height: 600, category: "web" },
  { id: "email", name: "Email Header", width: 600, height: 200, category: "web" },
  { id: "yt-thumb", name: "YouTube Thumbnail", width: 1280, height: 720, category: "web" },
];

export const CATEGORIES = [
  { id: "social", name: "Redes Sociais", icon: "📱" },
  { id: "print", name: "Impressao", icon: "📄" },
  { id: "web", name: "Web", icon: "🌐" },
];

export const DEFAULT_SIZE = CANVAS_SIZES[0]; // Instagram Post como default