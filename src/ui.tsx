import {
  Bold,
  Button,
  Checkbox,
  Container,
  Dropdown,
  DropdownOption,
  Muted,
  render,
  Tabs,
  TabsOption,
  Text,
  SegmentedControl,
  SegmentedControlOption,
  Textbox,
  TextboxColor,
  VerticalSpace,
} from "@create-figma-plugin/ui";
import { emit, on } from "@create-figma-plugin/utilities";
import { h } from "preact";
import { useCallback, useState, useEffect } from "preact/hooks";
import "!./styles.css";

import {
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
  VariantSlot,
} from "./types";

function Plugin() {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("Vector Logo");

  // Top-level frames state
  const [topLevelFrames, setTopLevelFrames] = useState<FrameInfo[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("");

  // Validation state
  const [productNameError, setProductNameError] = useState<boolean>(false);
  const [textProductNameError, setTextProductNameError] =
    useState<boolean>(false);

  // Selection state - one per variant
  const [bgSelection, setBgSelection] = useState<SelectionInfo | null>(null);
  const [lightSelection, setLightSelection] =
    useState<SelectionInfo | null>(null);
  const [darkSelection, setDarkSelection] =
    useState<SelectionInfo | null>(null);
  const [faviconSelection, setFaviconSelection] =
    useState<SelectionInfo | null>(null);

  // Preview image URLs - one per variant
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [lightPreview, setLightPreview] = useState<string | null>(null);
  const [darkPreview, setDarkPreview] = useState<string | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);

  // Logo configuration state
  const defaultProductName = "Logo component set";
  const [productName, setProductName] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("FFFFFF");
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(1);
  const [faviconHasBackground, setFaviconHasBackground] =
    useState<boolean>(false);
  const [faviconBackgroundShape, setFaviconBackgroundShape] =
    useState<"square" | "circle">("square");
  const [lightModeBlack, setLightModeBlack] = useState<boolean>(false);
  const [darkModeWhite, setDarkModeWhite] = useState<boolean>(false);

  // Create Logotype tab state
  const [textProductName, setTextProductName] = useState<string>("");
  const [logoText, setLogoText] = useState<string>("");
  const [faviconText, setFaviconText] = useState<string>("");
  const [textBackgroundColor, setTextBackgroundColor] =
    useState<string>("EEEEEE");
  const [textBackgroundOpacity, setTextBackgroundOpacity] = useState<number>(1);
  const [textFaviconHasBackground, setTextFaviconHasBackground] =
    useState<boolean>(true);
  const [textFaviconBackgroundShape, setTextFaviconBackgroundShape] =
    useState<"square" | "circle">("square");
  const [textTextColor, setTextTextColor] = useState<string>("000000");

  // Listen for selection updates from main
  on<SelectionUpdateHandler>(
    "SELECTION_UPDATE",
    function (slot: VariantSlot, info) {
      if (info && info.imageData) {
        let binary = "";
        const bytes = new Uint8Array(info.imageData);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:image/png;base64,${base64}`;

        if (slot === "bg") {
          setBgSelection(info);
          setBgPreview(dataUrl);
        } else if (slot === "light") {
          setLightSelection(info);
          setLightPreview(dataUrl);
        } else if (slot === "dark") {
          setDarkSelection(info);
          setDarkPreview(dataUrl);
        } else if (slot === "favicon") {
          setFaviconSelection(info);
          setFaviconPreview(dataUrl);
        }
      }
    }
  );

  // Listen for top-level frames from main
  on<TopLevelFramesHandler>("TOP_LEVEL_FRAMES", function (frames) {
    setTopLevelFrames(frames);
  });

  // Listen for settings from main
  on<LoadSettingsHandler>("LOAD_SETTINGS", function (settings) {
    setLightModeBlack(settings.lightModeBlack);
    setDarkModeWhite(settings.darkModeWhite);
    setFaviconHasBackground(settings.faviconHasBackground);
    setFaviconBackgroundShape(settings.faviconBackgroundShape);
  });

  // Request top-level frames and settings on mount
  useEffect(() => {
    emit<RequestTopLevelFramesHandler>("REQUEST_TOP_LEVEL_FRAMES");
    emit<RequestSettingsHandler>("REQUEST_SETTINGS");
  }, []);

  // Save settings when variant configuration changes
  const saveSettings = useCallback(
    function () {
      const settings: PluginSettings = {
        lightModeBlack,
        darkModeWhite,
        faviconHasBackground,
        faviconBackgroundShape,
      };
      emit<SaveSettingsHandler>("SAVE_SETTINGS", settings);
    },
    [
      lightModeBlack,
      darkModeWhite,
      faviconHasBackground,
      faviconBackgroundShape,
    ]
  );

  // Save settings whenever they change
  useEffect(() => {
    saveSettings();
  }, [saveSettings]);

  // Grab selection handlers - one per variant
  const handleGrabSelection = useCallback(function (slot: VariantSlot) {
    emit<GrabSelectionHandler>("GRAB_SELECTION", slot);
  }, []);

  // Clear selection handlers - one per variant
  const handleClearBg = useCallback(function () {
    setBgSelection(null);
    setBgPreview(null);
  }, []);

  const handleClearLight = useCallback(function () {
    setLightSelection(null);
    setLightPreview(null);
  }, []);

  const handleClearDark = useCallback(function () {
    setDarkSelection(null);
    setDarkPreview(null);
  }, []);

  const handleClearFavicon = useCallback(function () {
    setFaviconSelection(null);
    setFaviconPreview(null);
  }, []);

  // Create component set handler
  const handleCreateComponentSet = useCallback(
    function () {
      // Validate required product name
      if (!productName.trim()) {
        setProductNameError(true);
        return;
      }

      if (
        !bgSelection &&
        !lightSelection &&
        !darkSelection &&
        !faviconSelection
      ) {
        return;
      }

      const config: LogoConfig = {
        productName: productName.trim(),
        backgroundColor,
        backgroundOpacity,
        faviconHasBackground,
        faviconBackgroundShape,
        lightModeBlack,
        darkModeWhite,
        bgSelectionId: bgSelection?.id || null,
        lightSelectionId: lightSelection?.id || null,
        darkSelectionId: darkSelection?.id || null,
        faviconSelectionId: faviconSelection?.id || null,
        targetFrameId: selectedFrameId || null,
      };

      emit<CreateComponentSetHandler>("CREATE_COMPONENT_SET", config);
    },
    [
      productName,
      backgroundColor,
      backgroundOpacity,
      faviconHasBackground,
      faviconBackgroundShape,
      lightModeBlack,
      darkModeWhite,
      bgSelection,
      lightSelection,
      darkSelection,
      faviconSelection,
      selectedFrameId,
    ]
  );

  // Create Text Logo handler
  const handleCreateTextLogo = useCallback(
    function () {
      // Validate required product name
      if (!textProductName.trim()) {
        setTextProductNameError(true);
        return;
      }

      const config: TextLogoConfig = {
        productName: textProductName.trim(),
        logoText: logoText.trim() || "Text logo",
        faviconText: faviconText.trim() || "T",
        backgroundColor: textBackgroundColor,
        backgroundOpacity: textBackgroundOpacity,
        faviconHasBackground: textFaviconHasBackground,
        faviconBackgroundShape: textFaviconBackgroundShape,
        textColor: textTextColor,
        targetFrameId: selectedFrameId || null,
      };
      emit<CreateTextLogoHandler>("CREATE_TEXT_LOGO", config);
    },
    [
      textProductName,
      logoText,
      faviconText,
      textBackgroundColor,
      textBackgroundOpacity,
      textFaviconHasBackground,
      textFaviconBackgroundShape,
      textTextColor,
      selectedFrameId,
    ]
  );

  const faviconShapeOptions: Array<SegmentedControlOption> = [
    { value: "square", children: "Square" },
    { value: "circle", children: "Circle" },
  ];

  const hasAllVectorSelections = Boolean(
    bgSelection && lightSelection && darkSelection && faviconSelection
  );

  const tabsOptions: Array<TabsOption> = [
    { value: "Vector Logo", children: <h2>Vector Logo</h2> },
    { value: "Create Logotype", children: <h2>Create Logotype</h2> },
  ];

  // Target frame options for dropdown
  const targetFrameOptions: Array<DropdownOption> = [
    { value: "", text: "Current page (0,0)" },
    ...topLevelFrames.map((frame) => ({
      value: frame.id,
      text: frame.name,
    })),
  ];

  // Reusable selection picker component
  const SelectionPicker = ({
    slot,
    selection,
    preview,
    onClear,
  }: {
    slot: VariantSlot;
    selection: SelectionInfo | null;
    preview: string | null;
    onClear: () => void;
  }) => (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <div
        className="inner-card"
        style={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          minHeight: "48px",
        }}
      >
        {preview ? (
          <div
            className="has-img"
            style={{
              backgroundImage: `url('${preview}')`,
              width: "100%",
              height: "48px",
            }}
          ></div>
        ) : (
          <Text style={{ padding: "8px" }}>
            <Muted>No graphic selected</Muted>
          </Text>
        )}
      </div>
      <Button
        onClick={selection ? onClear : () => handleGrabSelection(slot)}
        secondary={selection ? true : false}
        style={{ whiteSpace: "nowrap" }}
      >
        {selection ? "Clear" : "Grab Selection"}
      </Button>
    </div>
  );

  return (
    <Container space="medium">
      <VerticalSpace space="medium" />
      <Tabs
        options={tabsOptions}
        value={activeTab}
        onValueChange={setActiveTab}
      />
      <VerticalSpace space="medium" />

      {activeTab === "Vector Logo" && (
        <div>
          <Text>
            <Muted>Component set name (required)</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox
            onValueInput={(value) => {
              setProductName(value);
              if (value.trim()) {
                setProductNameError(false);
              }
            }}
            value={productName}
            placeholder="Enter component set name"
            style={productNameError ? { border: "1px solid #f24822" } : {}}
          />
          {productNameError && (
            <Text
              style={{ color: "#f24822", fontSize: "11px", marginTop: "4px" }}
            >
              Component set name is required
            </Text>
          )}
          <VerticalSpace space="medium" />

          <Text>
            <Muted>Target location</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Dropdown
            options={targetFrameOptions}
            value={selectedFrameId}
            onChange={(e) => setSelectedFrameId(e.currentTarget.value)}
          />
          <VerticalSpace space="large" />

          {/* Variant 1: 315x140 with Background */}
          <div className="card">
            <h3>315x140 with Background</h3>
            <VerticalSpace space="small" />
            <SelectionPicker
              slot="bg"
              selection={bgSelection}
              preview={bgPreview}
              onClear={handleClearBg}
            />
            <VerticalSpace space="small" />
            <Text>
              <Muted>Background Color</Muted>
            </Text>
            <VerticalSpace space="extraSmall" />
            <TextboxColor
              hexColor={backgroundColor}
              onHexColorValueInput={setBackgroundColor}
              opacity={String(Math.round(backgroundOpacity * 100))}
              onOpacityNumericValueInput={(value) => {
                if (typeof value === "number") {
                  setBackgroundOpacity(value);
                }
              }}
            />
          </div>

          {/* Variant 2: 300x100 Light Mode */}
          <div className="card">
            <h3>300x100 Light Mode (no background)</h3>
            <VerticalSpace space="small" />
            <SelectionPicker
              slot="light"
              selection={lightSelection}
              preview={lightPreview}
              onClear={handleClearLight}
            />
            <VerticalSpace space="small" />
            <Checkbox value={lightModeBlack} onValueChange={setLightModeBlack}>
              <Text>Make logo black</Text>
            </Checkbox>
          </div>

          {/* Variant 3: 300x100 Dark Mode */}
          <div className="card">
            <h3>300x100 Dark Mode (no background)</h3>
            <VerticalSpace space="small" />
            <SelectionPicker
              slot="dark"
              selection={darkSelection}
              preview={darkPreview}
              onClear={handleClearDark}
            />
            <VerticalSpace space="small" />
            <Checkbox value={darkModeWhite} onValueChange={setDarkModeWhite}>
              <Text>Make logo white</Text>
            </Checkbox>
          </div>

          {/* Variant 4: 100x100 Favicon */}
          <div className="card">
            <h3>100x100 Favicon</h3>
            <VerticalSpace space="small" />
            <SelectionPicker
              slot="favicon"
              selection={faviconSelection}
              preview={faviconPreview}
              onClear={handleClearFavicon}
            />
            <VerticalSpace space="small" />
            <Checkbox
              value={faviconHasBackground}
              onValueChange={setFaviconHasBackground}
            >
              <Text>Favicon has background</Text>
            </Checkbox>
            <VerticalSpace space="small" />
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  flexGrow: "1",
                }}
              >
                <Muted>Background shape</Muted>
              </Text>
              <SegmentedControl
                disabled={!faviconHasBackground}
                options={faviconShapeOptions}
                value={faviconBackgroundShape}
                onValueChange={(value) =>
                  setFaviconBackgroundShape(value as "square" | "circle")
                }
              />
            </div>
          </div>

          <Button
            style={{
              height: "32px",
            }}
            className={"primary-btn"}
            fullWidth
            onClick={() => {
              handleCreateComponentSet();
              window.scrollTo(0, 0);
            }}
            disabled={!hasAllVectorSelections}
          >
            Create component set
          </Button>
          <VerticalSpace space="small" />
        </div>
      )}

      {activeTab === "Create Logotype" && (
        <div>
          <Text>
            <Muted>Component set name (required)</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox
            onValueInput={(value) => {
              setTextProductName(value);
              if (value.trim()) {
                setTextProductNameError(false);
              }
            }}
            value={textProductName}
            placeholder="Enter component set name"
            style={textProductNameError ? { border: "1px solid #f24822" } : {}}
          />
          {textProductNameError && (
            <Text
              style={{ color: "#f24822", fontSize: "11px", marginTop: "4px" }}
            >
              Component set name is required
            </Text>
          )}
          <VerticalSpace space="medium" />

          <Text>
            <Muted>Target location</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Dropdown
            options={targetFrameOptions}
            value={selectedFrameId}
            onChange={(e) => setSelectedFrameId(e.currentTarget.value)}
          />
          <VerticalSpace space="large" />

          <Text>
            <Muted>Logo text</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox
            onValueInput={setLogoText}
            value={logoText}
            placeholder="Text logo"
          />
          <VerticalSpace space="medium" />

          <Text>
            <Muted>Favicon text</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox
            onValueInput={setFaviconText}
            value={faviconText}
            placeholder="T"
          />
          <VerticalSpace space="large" />

          <div className="flex-me">
            <div className="flex-me column">
              <Text>
                <Muted>Text color</Muted>
              </Text>
              <VerticalSpace space="small" />
              <TextboxColor
                hexColor={textTextColor}
                onHexColorValueInput={setTextTextColor}
                opacity="100"
                className="hide-opacity"
              />
            </div>

            <VerticalSpace space="medium" />

            <div className="flex-me column z-9">
              <Text>
                <Muted>Background color</Muted>
              </Text>
              <VerticalSpace space="small" />
              <TextboxColor
                hexColor={textBackgroundColor}
                onHexColorValueInput={setTextBackgroundColor}
                opacity={String(Math.round(textBackgroundOpacity * 100))}
                onOpacityNumericValueInput={(value) => {
                  if (typeof value === "number") {
                    setTextBackgroundOpacity(value);
                  }
                }}
              />
            </div>
          </div>
          <VerticalSpace space="large" />
          <VerticalSpace space="large" />
          <Checkbox
            value={textFaviconHasBackground}
            onValueChange={setTextFaviconHasBackground}
          >
            <Text>Favicon has background</Text>
          </Checkbox>
          <VerticalSpace space="small" />
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                flexGrow: "1",
              }}
            >
              <Muted>Background shape</Muted>
            </Text>
            <SegmentedControl
              disabled={!textFaviconHasBackground}
              options={faviconShapeOptions}
              value={textFaviconBackgroundShape}
              onValueChange={(value) =>
                setTextFaviconBackgroundShape(value as "square" | "circle")
              }
            />
          </div>

          <Button
            style={{
              height: "32px",
            }}
            fullWidth
            onClick={handleCreateTextLogo}
          >
            Create component set
          </Button>
          <VerticalSpace space="small" />
        </div>
      )}
    </Container>
  );
}

export default render(Plugin);
