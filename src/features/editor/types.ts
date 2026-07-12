import { fabric } from "fabric";
import { ITextboxOptions } from "fabric/fabric-impl";
import * as material from "material-colors";
import type React from "react";

export const JSON_KEYS = [
  "name",
  "gradientAngle",
  "selectable",
  "hasControls",
  "linkData",
  "editable",
  "extensionType",
  "extension",
  "isEditable"
];

export const filters = [
  "none",
  "polaroid",
  "sepia",
  "kodachrome",
  "contrast",
  "brightness",
  "greyscale",
  "brownie",
  "vintage",
  "technicolor",
  "pixelate",
  "invert",
  "blur",
  "sharpen",
  "emboss",
  "removecolor",
  "blacknwhite",
  "vibrance",
  "blendcolor",
  "huerotate",
  "resize",
  "saturation",
  "gamma",
];

export const fonts = [
  "Arial",
  "Arial Black",
  "Verdana",
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Courier New",
  "Brush Script MT",
  "Palatino",
  "Bookman",
  "Comic Sans MS",
  "Impact",
  "Lucida Sans Unicode",
  "Geneva",
  "Lucida Console",
];

export const selectionDependentTools = [
  "fill",
  "font",
  "filter",
  "opacity",
  "remove-bg",
  "stroke-color",
  "stroke-width",
];

export const colors = [
  material.red["500"],
  material.pink["500"],
  material.purple["500"],
  material.deepPurple["500"],
  material.indigo["500"],
  material.blue["500"],
  material.lightBlue["500"],
  material.cyan["500"],
  material.teal["500"],
  material.green["500"],
  material.lightGreen["500"],
  material.lime["500"],
  material.yellow["500"],
  material.amber["500"],
  material.orange["500"],
  material.deepOrange["500"],
  material.brown["500"],
  material.blueGrey["500"],
  "transparent",
];

export type ActiveTool =
  | "select"
  | "layers"
  | "shadow"
  | "font-spacing"
  | "corner-radius"
  | "shapes"
  | "text"
  | "images"
  | "draw"
  | "fill"
  | "stroke-color"
  | "stroke-width"
  | "font"
  | "opacity"
  | "filter"
  | "settings"
  | "ai"
  | "remove-bg"
  | "templates"
  | "brand-assets"
  | "crop";

export const FILL_COLOR = "rgba(0,0,0,1)";
export const STROKE_COLOR = "rgba(0,0,0,1)";
export const STROKE_WIDTH = 2;
export const STROKE_DASH_ARRAY = [];
export const FONT_FAMILY = "Arial";
export const FONT_SIZE = 32;
export const FONT_WEIGHT = 400;

export const CIRCLE_OPTIONS = {
  radius: 225,
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
};

export const RECTANGLE_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 400,
  height: 400,
  angle: 0,
};

export const DIAMOND_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 600,
  height: 600,
  angle: 0,
};

export const STAR_OPTIONS = {
  left: 100,
  top: 100,
  width: 200,
  height: 200,
};

export const ARROW_OPTIONS = {
  left: 100,
  top: 100,
  width: 250,
  height: 200,
};

export const LINE_OPTIONS = {
  left: 100,
  top: 100,
};

export const TRIANGLE_OPTIONS = {
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  stroke: STROKE_COLOR,
  strokeWidth: STROKE_WIDTH,
  width: 400,
  height: 400,
  angle: 0,
};

export const TEXT_OPTIONS = {
  type: "textbox",
  left: 100,
  top: 100,
  fill: FILL_COLOR,
  fontSize: FONT_SIZE,
  fontFamily: FONT_FAMILY,
};

export interface EditorHookProps {
  defaultState?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  clearSelectionCallback?: () => void;
  saveCallback?: (values: {
    json: string;
    height: number;
    width: number;
  }) => void;
};

export type BuildEditorProps = {
  undo: () => void;
  redo: () => void;
  save: (skip?: boolean) => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  autoZoom: () => void;
  copy: () => void;
  paste: () => void;
  canvas: fabric.Canvas;
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  selectedObjects: fabric.Object[];
  strokeDashArray: number[];
  fontFamily: string;
  setStrokeDashArray: (value: number[]) => void;
  setFillColor: (value: string) => void;
  setStrokeColor: (value: string) => void;
  setStrokeWidth: (value: number) => void;
  setFontFamily: (value: string) => void;
  // Multipagina (Slides 2)
  documentRef: React.MutableRefObject<any>;
  activePageIdRef: React.MutableRefObject<string>;
  setPages: React.Dispatch<React.SetStateAction<{ id: string }[]>>;
  setActivePageId: React.Dispatch<React.SetStateAction<string>>;
  pageThumbsRef: React.MutableRefObject<Record<string, string>>;
  setThumbsVersion: React.Dispatch<React.SetStateAction<number>>;
  isExportingRef: React.MutableRefObject<boolean>;
};

export interface Editor {
  getPages: () => { id: string }[];
  getActivePageId: () => string;
  syncActivePage: () => void;
  goToPage: (pageId: string) => void;
  addPage: () => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  movePage: (pageId: string, direction: "left" | "right") => void;
  getPageThumb: (pageId: string) => string | null;
  generateCoverThumbnail: () => Promise<string | undefined>;
  savePng: () => void;
  saveJpg: () => void;
  saveSvg: () => void;
  saveJson: () => void;
  savePdf: (dpi?: "screen" | "print") => void;
  generateThumbnail: () => string;
  loadJson: (json: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  autoZoom: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getWorkspace: () => fabric.Object | undefined;
  changeBackground: (value: string) => void;
  changeSize: (value: { width: number; height: number }) => void;
  enableDrawingMode: () => void;
  disableDrawingMode: () => void;
  onCopy: () => void;
  onPaste: () => void;
  changeImageFilter: (value: string) => void;
  addImage: (value: string) => void;
  startCrop: (onEnd?: () => void) => void;
  applyCrop: () => void;
  cancelCrop: () => void;
  isCropping: () => boolean;
  delete: () => void;
  changeFillRadius: (value: number) => void;
  getActiveFillRadius: () => number;
  changeFontSize: (value: number) => void;
  getActiveFontSize: () => number;
  changeFontLineHeight: (value: number) => void;
  getActiveFontLineHeight: () => number;
  changeFontCharSpacing: (value: number) => void;
  getActiveFontCharSpacing: () => number;
  changeTextAlign: (value: string) => void;
  getActiveTextAlign: () => string;
  changeFontUnderline: (value: boolean) => void;
  getActiveFontUnderline: () => boolean;
  changeFontLinethrough: (value: boolean) => void;
  getActiveFontLinethrough: () => boolean;
  changeFontStyle: (value: string) => void;
  getActiveFontStyle: () => string;
  changeFontWeight: (value: number) => void;
  getActiveFontWeight: () => number;
  getActiveFontFamily: () => string;
  changeFontFamily: (value: string) => void;
  changeShadow: (shadow: ShadowOptions | null) => void;
  getActiveShadow: () => ShadowOptions | null;
  addText: (value: string, options?: ITextboxOptions) => void;
  getActiveOpacity: () => number;
  changeOpacity: (value: number) => void;
  bringForward: () => void;
  sendBackwards: () => void;
  alignLeft: () => void;
  alignCenterX: () => void;
  alignRight: () => void;
  alignTop: () => void;
  alignCenterY: () => void;
  alignBottom: () => void;
  changeStrokeWidth: (value: number) => void;
  changeFillColor: (value: string) => void;
  changeStrokeColor: (value: string) => void;
  changeStrokeDashArray: (value: number[]) => void;
  changeFillGradient: (gradient: GradientOptions | null) => void;
  getActiveFillGradient: () => GradientOptions | null;
  addCircle: () => void;
  addSoftRectangle: () => void;
  addRectangle: () => void;
  addTriangle: () => void;
  addInverseTriangle: () => void;
  addDiamond: () => void;
  addStar: () => void;
  addArrow: () => void;
  addLine: () => void;
  canvas: fabric.Canvas;
  getActiveFillColor: () => string;
  getActiveStrokeColor: () => string;
  getActiveStrokeWidth: () => number;
  getActiveStrokeDashArray: () => number[];
  toggleEditable: () => void;
  getActiveEditable: () => boolean;
  selectedObjects: fabric.Object[];

  
};

export interface ShadowOptions {
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

export const SHADOW_PRESETS: Record<string, ShadowOptions | null> = {
  none: null,
  soft: { color: "rgba(0,0,0,0.2)", blur: 10, offsetX: 0, offsetY: 4 },
  medium: { color: "rgba(0,0,0,0.4)", blur: 15, offsetX: 0, offsetY: 8 },
  strong: { color: "rgba(0,0,0,0.6)", blur: 25, offsetX: 0, offsetY: 12 },
  glow: { color: "rgba(99,102,241,0.7)", blur: 30, offsetX: 0, offsetY: 0 },
};

export type GradientType = "linear" | "radial";

export interface GradientColorStop {
  offset: number; // 0 a 1
  color: string;  // hex ou rgba
}

export interface GradientOptions {
  type: GradientType;
  angle: number;          // 0-360 (so usado em linear)
  colorStops: GradientColorStop[];
}

export const DEFAULT_GRADIENT: GradientOptions = {
  type: "linear",
  angle: 90,
  colorStops: [
    { offset: 0, color: "#3b82f6" },
    { offset: 1, color: "#a855f7" },
  ],
};

export const GRADIENT_PRESETS: Record<string, GradientOptions> = {
  sunset: {
    type: "linear",
    angle: 90,
    colorStops: [
      { offset: 0, color: "#ff6b6b" },
      { offset: 1, color: "#feca57" },
    ],
  },
  ocean: {
    type: "linear",
    angle: 90,
    colorStops: [
      { offset: 0, color: "#3b82f6" },
      { offset: 1, color: "#06b6d4" },
    ],
  },
  forest: {
    type: "linear",
    angle: 90,
    colorStops: [
      { offset: 0, color: "#10b981" },
      { offset: 1, color: "#84cc16" },
    ],
  },
  purple: {
    type: "linear",
    angle: 90,
    colorStops: [
      { offset: 0, color: "#a855f7" },
      { offset: 1, color: "#ec4899" },
    ],
  },
  dark: {
    type: "linear",
    angle: 90,
    colorStops: [
      { offset: 0, color: "#1e293b" },
      { offset: 1, color: "#475569" },
    ],
  },
  fire: {
    type: "radial",
    angle: 0,
    colorStops: [
      { offset: 0, color: "#fbbf24" },
      { offset: 0.5, color: "#f97316" },
      { offset: 1, color: "#dc2626" },
    ],
  },
};