import {
  emit,
  loadSettingsAsync,
  on,
  once,
  saveSettingsAsync,
  showUI,
} from "@create-figma-plugin/utilities";

import {
  CloseHandler,
  CreateComponentSetHandler,
  CreateTextLogoHandler,
  FrameInfo,
  GrabSelectionHandler,
  LoadSettingsHandler,
  LogoConfig,
  PluginSettings,
  RequestSettingsHandler,
  RequestTopLevelFramesHandler,
  SaveSettingsHandler,
  SelectionInfo,
  SelectionUpdateHandler,
  TextLogoConfig,
  TopLevelFramesHandler,
} from "./types";

// Default settings
const defaultSettings: PluginSettings = {
  bgVariantSource: "A",
  lightVariantSource: "A",
  darkVariantSource: "A",
  faviconVariantSource: "B",
  lightModeBlack: false,
  darkModeWhite: false,
  faviconHasBackground: false,
  faviconBackgroundShape: "square",
};

// Note: Selection IDs are now passed directly in config from UI
// We don't need to store them globally anymore

// Helper: Get top-level frames from current page
function getTopLevelFrames(): FrameInfo[] {
  const frames: FrameInfo[] = [];
  for (const node of figma.currentPage.children) {
    if (node.type === "FRAME") {
      frames.push({ id: node.id, name: node.name });
    }
  }
  return frames;
}

// Helper: Send top-level frames to UI
function sendTopLevelFrames(): void {
  const frames = getTopLevelFrames();
  emit<TopLevelFramesHandler>("TOP_LEVEL_FRAMES", frames);
}

export default function () {
  // Handle request for top-level frames
  on<RequestTopLevelFramesHandler>("REQUEST_TOP_LEVEL_FRAMES", function () {
    sendTopLevelFrames();
  });

  // Handle request for settings
  on<RequestSettingsHandler>("REQUEST_SETTINGS", async function () {
    const settings = await loadSettingsAsync(defaultSettings);
    emit<LoadSettingsHandler>("LOAD_SETTINGS", settings);
  });

  // Handle saving settings
  on<SaveSettingsHandler>("SAVE_SETTINGS", async function (settings) {
    await saveSettingsAsync(settings);
  });

  // Handle grabbing selections
  on<GrabSelectionHandler>(
    "GRAB_SELECTION",
    async function (slot: "A" | "B" | "C" | "D") {
      const selection = figma.currentPage.selection;

      if (selection.length === 0) {
        figma.notify("Please select at least one element");
        return;
      }

      // If multiple nodes selected, group them
      let node: SceneNode;
      if (selection.length > 1) {
        node = figma.group(selection, figma.currentPage);
        figma.notify(`Grouped ${selection.length} elements`);
      } else {
        node = selection[0];
      }

      // Export node as PNG for preview
      let imageData: Uint8Array;
      try {
        imageData = await node.exportAsync({
          format: "PNG",
          constraint: { type: "SCALE", value: 2 }, // 2x scale for better quality
        });
      } catch (error) {
        figma.notify("Failed to generate preview image");
        return;
      }

      // Send info back to UI (includes the image data)
      const info: SelectionInfo = {
        id: node.id,
        name: node.name,
        imageData,
      };
      emit<SelectionUpdateHandler>("SELECTION_UPDATE", slot, info);
    }
  );

  // Handle creating component set
  on<CreateComponentSetHandler>(
    "CREATE_COMPONENT_SET",
    async function (config: LogoConfig) {
      try {
        // Validation
        if (!config.productName.trim()) {
          config.productName = "Logo component set";
        }

        if (!hasAnySelection(config)) {
          figma.notify("Please select at least one element");
          return;
        }

        // Validate that required selections exist
        const sourceIds = [
          resolveSelectionId(config.bgVariantSource, config),
          resolveSelectionId(config.lightVariantSource, config),
          resolveSelectionId(config.darkVariantSource, config),
        ];

        if (config.faviconHasBackground === false) {
          // Favicon uses only the background element.
          // We don't require a source selection.
        } else {
          sourceIds.push(
            resolveSelectionId(config.faviconVariantSource, config)
          );
        }

        for (const id of sourceIds) {
          if (!id) {
            figma.notify("Some variants require a selection that is not set");
            return;
          }
        }

        // Create the 4 variants
        const variants: ComponentNode[] = [];

        // 1. 315x140 with background
        const bgVariant = createVariant({
          width: 315,
          height: 140,
          sourceId: resolveSelectionId(config.bgVariantSource, config)!,
          backgroundColor: config.backgroundColor,
          backgroundOpacity: config.backgroundOpacity,
          backgroundShape: "square",
          colorOverride: null,
          variantName: `Product=${config.productName}, Size=315x140-BG`,
          padding: 8,
        });
        variants.push(bgVariant);

        // 2. 300x100 Light mode (no bg)
        const lightVariant = createVariant({
          width: 300,
          height: 100,
          sourceId: resolveSelectionId(config.lightVariantSource, config)!,
          backgroundColor: null,
          colorOverride: config.lightModeBlack ? hexToRgb("#000000") : null,
          variantName: `Product=${config.productName}, Size=300x100-Light-NoBg`,
          padding: 0,
        });
        variants.push(lightVariant);

        // 3. 300x100 Dark mode (no bg)
        const darkVariant = createVariant({
          width: 300,
          height: 100,
          sourceId: resolveSelectionId(config.darkVariantSource, config)!,
          backgroundColor: null,
          colorOverride: config.darkModeWhite ? hexToRgb("#FFFFFF") : null,
          variantName: `Product=${config.productName}, Size=300x100-Dark-NoBg`,
          padding: 0,
        });
        variants.push(darkVariant);

        // 4. 100x100 Favicon
        if (config.faviconHasBackground === true) {
          const faviconVariant = createVariant({
            width: 100,
            height: 100,
            sourceId: resolveSelectionId(config.faviconVariantSource, config)!,
            backgroundColor: config.backgroundColor,
            backgroundOpacity: config.backgroundOpacity,
            backgroundShape: config.faviconBackgroundShape,
            colorOverride: null,
            variantName: `Product=${config.productName}, Size=100x100-Favicon`,
            padding: 20,
          });
          variants.push(faviconVariant);
        } else {
          // Favicon WITHOUT background - just the logo vector
          const faviconVariant = createVariant({
            width: 100,
            height: 100,
            sourceId: resolveSelectionId(config.faviconVariantSource, config)!,
            backgroundColor: null, // No background
            colorOverride: null,
            variantName: `Product=${config.productName}, Size=100x100-Favicon`,
            padding: 20,
          });
          variants.push(faviconVariant);
        }

        // Combine into component set
        const componentSet = figma.combineAsVariants(
          variants,
          figma.currentPage
        );
        componentSet.name = config.productName;
        componentSet.cornerRadius = 0;

        // Apply auto-layout settings
        componentSet.layoutMode = "HORIZONTAL";
        componentSet.primaryAxisSizingMode = "AUTO";
        componentSet.counterAxisSizingMode = "AUTO";
        componentSet.counterAxisAlignItems = "CENTER";
        componentSet.itemSpacing = 22;

        // Place the component set in the target frame or at 0,0
        await placeComponentSetInTarget(
          componentSet,
          config.targetFrameId,
          config.productName
        );

        // Position and zoom
        figma.viewport.scrollAndZoomIntoView([componentSet]);
        figma.notify("Component set created!");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        figma.notify(`Error: ${message}`);
        console.error(error);
      }
    }
  );

  // Handle creating text-based logo component set
  on<CreateTextLogoHandler>(
    "CREATE_TEXT_LOGO",
    async function (config: TextLogoConfig) {
      try {
        // Load Inter Bold font
        await figma.loadFontAsync({ family: "Inter", style: "Bold" });

        // Create the 4 variants
        const variants: ComponentNode[] = [];

        // 1. 315x140 Primary Logo with background
        const primaryVariant = createTextVariant({
          width: 315,
          height: 140,
          text: config.logoText,
          backgroundColor: config.backgroundColor,
          backgroundOpacity: config.backgroundOpacity,
          backgroundShape: "square",
          textColor: hexToRgb(config.textColor),
          variantName: `Product=${config.productName}, Size=315x140-BG`,
          padding: 8,
        });
        variants.push(primaryVariant);

        // 2. 300x100 Light Mode (no bg, black text)
        const lightVariant = createTextVariant({
          width: 300,
          height: 100,
          text: config.logoText,
          backgroundColor: null,
          textColor: hexToRgb(config.textColor),
          variantName: `Product=${config.productName}, Size=300x100-Light-NoBg`,
          padding: 0,
        });
        variants.push(lightVariant);

        // 3. 300x100 Dark Mode (no bg, white text)
        const darkVariant = createTextVariant({
          width: 300,
          height: 100,
          text: config.logoText,
          backgroundColor: null,
          textColor: hexToRgb("#FFFFFF"),
          variantName: `Product=${config.productName}, Size=300x100-Dark-NoBg`,
          padding: 0,
        });
        variants.push(darkVariant);

        // 4. 100x100 Favicon
        const faviconVariant = createTextVariant({
          width: 100,
          height: 100,
          text: config.faviconText,
          backgroundColor: config.faviconHasBackground
            ? config.backgroundColor
            : null,
          backgroundOpacity: config.backgroundOpacity,
          backgroundShape: config.faviconBackgroundShape,
          textColor: hexToRgb(config.textColor),
          variantName: `Product=${config.productName}, Size=100x100-Favicon`,
          padding: 20,
        });
        variants.push(faviconVariant);

        // Combine into component set
        const componentSet = figma.combineAsVariants(
          variants,
          figma.currentPage
        );
        componentSet.name = config.productName;
        componentSet.cornerRadius = 0;

        // Apply auto-layout settings
        componentSet.layoutMode = "HORIZONTAL";
        componentSet.primaryAxisSizingMode = "AUTO";
        componentSet.counterAxisSizingMode = "AUTO";
        componentSet.counterAxisAlignItems = "CENTER";
        componentSet.itemSpacing = 22;

        // Place the component set in the target frame or at 0,0
        await placeComponentSetInTarget(
          componentSet,
          config.targetFrameId,
          config.productName
        );

        // Position and zoom
        figma.viewport.scrollAndZoomIntoView([componentSet]);
        figma.notify("Text logo component set created!");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        figma.notify(`Error: ${message}`);
        console.error(error);
      }
    }
  );

  // Handle close
  once<CloseHandler>("CLOSE", function () {
    figma.closePlugin();
  });

  showUI({
    width: 320,
    height: 600,
  });

  // Send top-level frames after UI is shown
  sendTopLevelFrames();
}

function hasAnySelection(config: LogoConfig): boolean {
  return Boolean(
    config.selectionAId ||
      config.selectionBId ||
      config.selectionCId ||
      config.selectionDId
  );
}

function resolveSelectionId(
  source: "A" | "B" | "C" | "D",
  config: LogoConfig
): string | null {
  if (source === "A") {
    return config.selectionAId;
  }
  if (source === "B") {
    return config.selectionBId;
  }
  if (source === "C") {
    return config.selectionCId;
  }
  if (source === "D") {
    return config.selectionDId;
  }
  return null;
}

function clampOpacity(opacity: unknown): number {
  if (typeof opacity !== "number" || Number.isNaN(opacity)) {
    return 1;
  }
  return Math.max(0, Math.min(1, opacity));
}

function createFaviconBackgroundComponent(options: {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundOpacity: number;
  backgroundShape: "square" | "circle";
  variantName: string;
}): ComponentNode {
  const component = figma.createComponent();
  component.resize(options.width, options.height);
  component.name = options.variantName;
  component.cornerRadius = 0;
  component.fills = [];

  const bg = figma.createRectangle();
  bg.resize(options.width, options.height);
  bg.fills = [
    {
      type: "SOLID",
      color: hexToRgb(options.backgroundColor),
      opacity: clampOpacity(options.backgroundOpacity),
    },
  ];
  bg.name = "Background";
  if (options.backgroundShape === "circle") {
    bg.cornerRadius = Math.min(options.width, options.height) / 2;
  } else {
    bg.cornerRadius = 0;
  }
  bg.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  setScaleConstraintsRecursive(bg);

  component.appendChild(bg);
  return component;
}

// Helper: Create a single variant component
function createVariant(options: {
  width: number;
  height: number;
  sourceId: string;
  backgroundColor: string | null;
  backgroundOpacity?: number; // 0..1
  backgroundShape?: "square" | "circle";
  colorOverride: RGB | null;
  variantName: string;
  padding?: number;
}): ComponentNode {
  // Get source node
  const sourceNode = figma.getNodeById(options.sourceId);
  if (!sourceNode || !("clone" in sourceNode)) {
    console.error(
      `[createVariant] Source node not found for ID: ${options.sourceId}`
    );
    throw new Error("Source node not found or cannot be cloned");
  }

  console.log(
    `[createVariant] Found source node: ${sourceNode.name}, type: ${sourceNode.type}`
  );

  // Create component
  const component = figma.createComponent();
  component.resize(options.width, options.height);
  component.name = options.variantName;
  component.cornerRadius = 0;
  component.fills = [];
  // Ensure variant itself scales and keeps aspect ratio within the component set
  component.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  if ("constrainProportions" in component) {
    (component as any).constrainProportions = true;
  }

  // Add background if specified
  if (options.backgroundColor) {
    const bg = figma.createRectangle();
    bg.resize(options.width, options.height);
    bg.fills = [
      {
        type: "SOLID",
        color: hexToRgb(options.backgroundColor),
        opacity: clampOpacity(options.backgroundOpacity),
      },
    ];
    bg.name = "Background";
    if (options.backgroundShape === "circle") {
      bg.cornerRadius = Math.min(options.width, options.height) / 2;
    } else {
      bg.cornerRadius = 0;
    }
    // Set constraints to scale for background
    bg.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    setScaleConstraintsRecursive(bg);
    logNodeState("bg-variant-bg", bg);
    component.appendChild(bg);
  }

  // Clone source and add to component
  const clone = sourceNode.clone();
  console.log(
    `[createVariant] Cloned node: ${clone.name}, type: ${clone.type}, width: ${
      "width" in clone ? clone.width : "N/A"
    }, height: ${"height" in clone ? clone.height : "N/A"}`
  );

  // Log original fills before any modifications
  if ("fills" in clone && clone.fills !== figma.mixed) {
    console.log(
      `[createVariant] Clone fills before processing:`,
      JSON.stringify(clone.fills)
    );
  }

  // If the cloned node is a FRAME or GROUP, remove its background fill
  // so only the actual content (vectors) is visible
  if ("fills" in clone && clone.type === "FRAME") {
    clone.fills = [];
    console.log(`[createVariant] Removed background fill from ${clone.type}`);
  }

  // Scale to fit with padding
  const padding = options.padding ?? 16;
  scaleToFit(clone, options.width, options.height, padding);
  console.log(
    `[createVariant] After scaleToFit: width: ${
      "width" in clone ? clone.width : "N/A"
    }, height: ${"height" in clone ? clone.height : "N/A"}`
  );

  // Center in parent
  centerInParent(clone, options.width, options.height);
  console.log(
    `[createVariant] After centerInParent: x: ${
      "x" in clone ? clone.x : "N/A"
    }, y: ${"y" in clone ? clone.y : "N/A"}`
  );

  // Apply color override if specified
  if (options.colorOverride) {
    console.log(
      `[createVariant] Applying color override:`,
      options.colorOverride
    );
    applyColorToAllFills(clone, options.colorOverride);
  }

  // Set constraints to scale and lock aspect ratio for all children
  setScaleConstraintsRecursive(clone);

  // Remove hidden default fills (Figma adds #FFFFFF by default)
  removeHiddenFills(clone);

  // Log fills after processing
  if ("fills" in clone && clone.fills !== figma.mixed) {
    console.log(
      `[createVariant] Clone fills after processing:`,
      JSON.stringify(clone.fills)
    );
  }

  // Debug: confirm constraints and fills applied
  logNodeState("bg-variant-clone", clone);

  // Append to component (type assertion since we know it's a scene node)
  if ("type" in clone && clone.type !== "PAGE") {
    component.appendChild(clone as SceneNode);
    console.log(
      `[createVariant] Appended clone to component. Component children count: ${component.children.length}`
    );
  } else {
    console.error(`[createVariant] Could not append clone - invalid type`);
  }

  return component;
}

// Helper: Convert hex to RGB (0-1 range)
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error("Invalid hex color");
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

// Helper: Scale node to fit within bounds (contained)
function scaleToFit(
  node: BaseNode,
  maxWidth: number,
  maxHeight: number,
  padding: number
): void {
  if (!("width" in node) || !("height" in node)) {
    return;
  }

  const availableWidth = maxWidth - padding * 2;
  const availableHeight = maxHeight - padding * 2;

  const scaleX = availableWidth / node.width;
  const scaleY = availableHeight / node.height;
  const scale = Math.min(scaleX, scaleY);

  if (scale === 1) {
    return;
  }

  // Prefer `rescale()` since it scales strokes too.
  if ("rescale" in node && typeof (node as any).rescale === "function") {
    (node as any).rescale(scale);
    return;
  }

  // Fallback: `resize()` does not scale strokes.
  if ("resize" in node && typeof (node as any).resize === "function") {
    (node as any).resize(node.width * scale, node.height * scale);
  }
}

// Helper: Center node within parent dimensions
function centerInParent(
  node: BaseNode,
  parentWidth: number,
  parentHeight: number
): void {
  if (
    !("width" in node) ||
    !("height" in node) ||
    !("x" in node) ||
    !("y" in node)
  )
    return;

  node.x = (parentWidth - node.width) / 2;
  node.y = (parentHeight - node.height) / 2;
}

// Helper: Recursively apply color to all fills
function applyColorToAllFills(node: BaseNode, color: RGB): void {
  if ("fills" in node && node.fills !== figma.mixed) {
    const fills = node.fills as Paint[];
    node.fills = fills.map((fill) => {
      if (fill.type === "SOLID") {
        return { ...fill, color };
      }
      return fill;
    });
  }

  if ("children" in node) {
    for (const child of node.children) {
      applyColorToAllFills(child, color);
    }
  }
}

// Helper: Create a text-based variant component
function createTextVariant(options: {
  width: number;
  height: number;
  text: string;
  backgroundColor: string | null;
  backgroundOpacity?: number; // 0..1
  backgroundShape?: "square" | "circle";
  textColor: RGB;
  variantName: string;
  padding: number;
}): ComponentNode {
  // Create component
  const component = figma.createComponent();
  component.resize(options.width, options.height);
  component.name = options.variantName;
  component.cornerRadius = 0;
  component.fills = [];
  // Ensure variant itself scales and keeps aspect ratio within the component set
  component.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  if ("constrainProportions" in component) {
    (component as any).constrainProportions = true;
  }

  // Add background if specified
  if (options.backgroundColor) {
    const bg = figma.createRectangle();
    bg.resize(options.width, options.height);
    bg.fills = [
      {
        type: "SOLID",
        color: hexToRgb(options.backgroundColor),
        opacity: clampOpacity(options.backgroundOpacity),
      },
    ];
    bg.name = "Background";
    if (options.backgroundShape === "circle") {
      bg.cornerRadius = Math.min(options.width, options.height) / 2;
    } else {
      bg.cornerRadius = 0;
    }
    // Set constraints to scale for background
    bg.constraints = { horizontal: "SCALE", vertical: "SCALE" };
    setScaleConstraintsRecursive(bg);
    logNodeState("text-variant-bg", bg);
    component.appendChild(bg);
  }

  // Create text node
  const textNode = figma.createText();
  textNode.fontName = { family: "Inter", style: "Bold" };
  textNode.characters = options.text;
  textNode.fills = [{ type: "SOLID", color: options.textColor }];
  textNode.name = "Logo Text";
  // Set constraints to scale for text
  textNode.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  setScaleConstraintsRecursive(textNode);
  logNodeState("text-variant-text", textNode);

  // Scale text to fit using contain principle
  const availableWidth = options.width - options.padding * 2;
  const availableHeight = options.height - options.padding * 2;

  // Start with a large font size and scale down to fit
  const initialFontSize = 200;
  textNode.fontSize = initialFontSize;

  // Calculate scale factor based on text bounds
  const scaleX = availableWidth / textNode.width;
  const scaleY = availableHeight / textNode.height;
  const scale = Math.min(scaleX, scaleY);

  // Apply the calculated font size
  const finalFontSize = Math.floor(initialFontSize * scale);
  textNode.fontSize = finalFontSize;

  // Center text in component
  textNode.x = (options.width - textNode.width) / 2;
  textNode.y = (options.height - textNode.height) / 2;

  component.appendChild(textNode);

  // Clean up any hidden default fills added by Figma
  removeHiddenFills(component);
  logNodeState("text-variant-component", component);

  return component;
}

// Helper: Recursively set scale constraints and lock aspect ratio
function setScaleConstraintsRecursive(node: BaseNode): void {
  // Set constraints to SCALE for nodes that support it
  if ("constraints" in node) {
    node.constraints = { horizontal: "SCALE", vertical: "SCALE" };
  }

  // Lock aspect ratio for nodes that support it
  if ("constrainProportions" in node) {
    node.constrainProportions = true;
  }

  // Recurse into children
  if ("children" in node) {
    for (const child of node.children) {
      setScaleConstraintsRecursive(child);
    }
  }
}

// Helper: Remove hidden fills (Figma adds #FFFFFF by default)
function removeHiddenFills(node: BaseNode): void {
  if ("fills" in node && node.fills !== figma.mixed) {
    const fills = node.fills as Paint[];
    // Filter out hidden fills
    const visibleFills = fills.filter((fill) => fill.visible !== false);
    node.fills = visibleFills;
  }

  // Recurse into children
  if ("children" in node) {
    for (const child of node.children) {
      removeHiddenFills(child);
    }
  }
}

// Helper: Debug constraints and fills
function logNodeState(label: string, node: BaseNode): void {
  if ("constraints" in node) {
    console.log(
      `[${label}] constraints`,
      (node as ConstraintMixin).constraints
    );
  }
  if ("constrainProportions" in node) {
    const maybeConstrain = (node as any).constrainProportions;
    if (typeof maybeConstrain === "boolean") {
      console.log(`[${label}] constrainProportions`, maybeConstrain);
    }
  }
  if ("fills" in node && node.fills !== figma.mixed) {
    console.log(`[${label}] fills`, (node as GeometryMixin).fills);
  }
}

// Helper: Get the first letter of a product name (uppercase)
function getVariantGroupLetter(productName: string): string {
  const trimmed = productName.trim();
  if (!trimmed) return "A";
  return trimmed.charAt(0).toUpperCase();
}

// Helper: Find variant group by letter in content frame
function findVariantGroup(
  contentFrame: FrameNode,
  letter: string
): FrameNode | null {
  for (const child of contentFrame.children) {
    if (child.type === "FRAME" && child.name.toUpperCase() === letter) {
      return child;
    }
  }
  return null;
}

// Helper: Get all variant groups (single letter frames) from content frame
function getVariantGroups(contentFrame: FrameNode): FrameNode[] {
  const groups: FrameNode[] = [];
  for (const child of contentFrame.children) {
    // A variant group is a frame with a single uppercase letter name
    if (child.type === "FRAME" && /^[A-Z]$/i.test(child.name.trim())) {
      groups.push(child);
    }
  }
  return groups;
}

// Helper: Find or create the "content" frame inside the target frame
function findOrCreateContentFrame(targetFrame: FrameNode): FrameNode {
  // Look for existing "content" frame
  for (const child of targetFrame.children) {
    if (child.type === "FRAME" && child.name.toLowerCase() === "content") {
      return child;
    }
  }

  // Create new content frame if not found
  const contentFrame = figma.createFrame();
  contentFrame.name = "content";
  contentFrame.fills = []; // Transparent

  // Set up auto-layout (horizontal for variant groups)
  contentFrame.layoutMode = "HORIZONTAL";
  contentFrame.primaryAxisSizingMode = "AUTO";
  contentFrame.counterAxisSizingMode = "AUTO";
  contentFrame.itemSpacing = 120;

  targetFrame.appendChild(contentFrame);
  return contentFrame;
}

// Helper: Create a variant group frame with label
async function createVariantGroup(letter: string): Promise<FrameNode> {
  // Load font for the label
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const group = figma.createFrame();
  group.name = letter;
  group.fills = [
    { type: "SOLID", color: { r: 0.725, g: 0.725, b: 0.725 }, opacity: 1 },
  ]; // #B9B9B9 gray default
  group.cornerRadius = 40;

  // Set up auto-layout (vertical)
  group.layoutMode = "VERTICAL";
  group.primaryAxisSizingMode = "AUTO";
  group.counterAxisSizingMode = "AUTO";
  group.paddingTop = 32;
  group.paddingBottom = 32;
  group.paddingLeft = 32;
  group.paddingRight = 32;
  group.itemSpacing = 32;

  // Create label text
  const label = figma.createText();
  label.fontName = { family: "Inter", style: "Bold" };
  label.fontSize = 180;
  label.characters = letter;
  label.fills = [{ type: "SOLID", color: { r: 0, g: 0, b: 0 } }];
  label.name = letter;

  group.appendChild(label);

  return group;
}

// Helper: Insert variant group at correct alphabetical position
function insertVariantGroupAlphabetically(
  targetFrame: FrameNode,
  newGroup: FrameNode,
  letter: string
): void {
  const existingGroups = getVariantGroups(targetFrame);

  // Find the correct insertion index
  let insertIndex = 0;
  for (let i = 0; i < existingGroups.length; i++) {
    const existingLetter = existingGroups[i].name.toUpperCase();
    if (letter.toUpperCase() < existingLetter) {
      break;
    }
    insertIndex = i + 1;
  }

  // Find the actual child index in the parent
  if (insertIndex === 0) {
    // Insert at the beginning (after any non-group children like titles)
    // Find first variant group and insert before it
    const firstGroup = existingGroups[0];
    if (firstGroup) {
      const firstGroupIndex = targetFrame.children.indexOf(firstGroup);
      targetFrame.insertChild(firstGroupIndex, newGroup);
    } else {
      targetFrame.appendChild(newGroup);
    }
  } else if (insertIndex >= existingGroups.length) {
    // Insert at the end
    targetFrame.appendChild(newGroup);
  } else {
    // Insert before the group at insertIndex
    const groupAtIndex = existingGroups[insertIndex];
    const childIndex = targetFrame.children.indexOf(groupAtIndex);
    targetFrame.insertChild(childIndex, newGroup);
  }
}

// Helper: Insert component set at correct alphabetical position within variant group
function insertComponentSetAlphabetically(
  variantGroup: FrameNode,
  componentSet: ComponentSetNode,
  productName: string
): void {
  // Get existing component sets (skip the label text)
  const existingSets: SceneNode[] = [];
  for (const child of variantGroup.children) {
    if (child.type === "COMPONENT_SET") {
      existingSets.push(child);
    }
  }

  // Find the correct insertion index
  let insertIndex = 0;
  for (let i = 0; i < existingSets.length; i++) {
    if (productName.toLowerCase() < existingSets[i].name.toLowerCase()) {
      break;
    }
    insertIndex = i + 1;
  }

  // Move component set to variant group first
  variantGroup.appendChild(componentSet);

  // Now reorder within the group
  // The label should be first, then component sets in alphabetical order
  if (insertIndex < existingSets.length) {
    // Find the position of the set we want to insert before
    const targetSet = existingSets[insertIndex];
    const targetIndex = variantGroup.children.indexOf(targetSet);
    // Move our new set to that position
    variantGroup.insertChild(targetIndex, componentSet);
  }
  // If insertIndex >= existingSets.length, it's already appended at the end
}

// Helper: Place component set in target frame with proper organization
async function placeComponentSetInTarget(
  componentSet: ComponentSetNode,
  targetFrameId: string | null,
  productName: string
): Promise<void> {
  // If no target frame, place at 0,0 on current page
  if (!targetFrameId) {
    componentSet.x = 0;
    componentSet.y = 0;
    return;
  }

  // Get target frame
  const targetNode = figma.getNodeById(targetFrameId);
  if (!targetNode || targetNode.type !== "FRAME") {
    componentSet.x = 0;
    componentSet.y = 0;
    figma.notify("Target frame not found, placing at origin");
    return;
  }

  const targetFrame = targetNode as FrameNode;
  const letter = getVariantGroupLetter(productName);

  // Find or create the "content" frame inside the target
  const contentFrame = findOrCreateContentFrame(targetFrame);

  // Find or create variant group inside the content frame
  let variantGroup = findVariantGroup(contentFrame, letter);

  if (!variantGroup) {
    // Create new variant group
    variantGroup = await createVariantGroup(letter);

    // Insert at correct alphabetical position inside content frame
    insertVariantGroupAlphabetically(contentFrame, variantGroup, letter);
  }

  // Insert component set alphabetically within the variant group
  insertComponentSetAlphabetically(variantGroup, componentSet, productName);
}
