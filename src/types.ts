import { EventHandler } from "@create-figma-plugin/utilities";

// Selection info passed between main and UI
export interface SelectionInfo {
  id: string;
  name: string;
  imageData: Uint8Array; // PNG image data
}

// Top-level frame info for target selection
export interface FrameInfo {
  id: string;
  name: string;
}

// Configuration for creating the component set
export interface LogoConfig {
  productName: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0..1
  bgVariantSource: "A" | "B" | "C" | "D";
  lightVariantSource: "A" | "B" | "C" | "D";
  darkVariantSource: "A" | "B" | "C" | "D";
  faviconVariantSource: "A" | "B" | "C" | "D";
  faviconHasBackground: boolean;
  faviconBackgroundShape: "square" | "circle";
  lightModeBlack: boolean;
  darkModeWhite: boolean;
  selectionAId: string | null;
  selectionBId: string | null;
  selectionCId: string | null;
  selectionDId: string | null;
  targetFrameId: string | null; // Target frame for placement
}

// Event Handlers
export interface GrabSelectionHandler extends EventHandler {
  name: "GRAB_SELECTION";
  handler: (slot: "A" | "B" | "C" | "D") => void;
}

export interface SelectionUpdateHandler extends EventHandler {
  name: "SELECTION_UPDATE";
  handler: (slot: "A" | "B" | "C" | "D", info: SelectionInfo | null) => void;
}

export interface CreateComponentSetHandler extends EventHandler {
  name: "CREATE_COMPONENT_SET";
  handler: (config: LogoConfig) => void;
}

export interface CloseHandler extends EventHandler {
  name: "CLOSE";
  handler: () => void;
}

// Configuration for creating text-based logo component set
export interface TextLogoConfig {
  productName: string;
  logoText: string;
  faviconText: string;
  backgroundColor: string;
  backgroundOpacity: number; // 0..1
  faviconHasBackground: boolean;
  faviconBackgroundShape: "square" | "circle";
  textColor: string;
  targetFrameId: string | null; // Target frame for placement
}

export interface CreateTextLogoHandler extends EventHandler {
  name: "CREATE_TEXT_LOGO";
  handler: (config: TextLogoConfig) => void;
}

// Event handler for requesting top-level frames
export interface RequestTopLevelFramesHandler extends EventHandler {
  name: "REQUEST_TOP_LEVEL_FRAMES";
  handler: () => void;
}

// Event handler for sending top-level frames to UI
export interface TopLevelFramesHandler extends EventHandler {
  name: "TOP_LEVEL_FRAMES";
  handler: (frames: FrameInfo[]) => void;
}

// Settings to persist between sessions
export interface PluginSettings {
  bgVariantSource: "A" | "B" | "C" | "D";
  lightVariantSource: "A" | "B" | "C" | "D";
  darkVariantSource: "A" | "B" | "C" | "D";
  faviconVariantSource: "A" | "B" | "C" | "D";
  lightModeBlack: boolean;
  darkModeWhite: boolean;
  faviconHasBackground: boolean;
  faviconBackgroundShape: "square" | "circle";
}

// Event handler for loading settings
export interface LoadSettingsHandler extends EventHandler {
  name: "LOAD_SETTINGS";
  handler: (settings: PluginSettings) => void;
}

// Event handler for saving settings
export interface SaveSettingsHandler extends EventHandler {
  name: "SAVE_SETTINGS";
  handler: (settings: PluginSettings) => void;
}

// Event handler for requesting settings
export interface RequestSettingsHandler extends EventHandler {
  name: "REQUEST_SETTINGS";
  handler: () => void;
}
