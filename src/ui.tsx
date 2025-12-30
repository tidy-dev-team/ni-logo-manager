import {
  Bold,
  Button,
  Checkbox,
  Columns,
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
} from "./types";

function Plugin() {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("Select Vectors");

  // Top-level frames state
  const [topLevelFrames, setTopLevelFrames] = useState<FrameInfo[]>([]);
  const [selectedFrameId, setSelectedFrameId] = useState<string>("");

  // Validation state
  const [productNameError, setProductNameError] = useState<boolean>(false);
  const [textProductNameError, setTextProductNameError] =
    useState<boolean>(false);

  // Selection state
  const [selectionA, setSelectionA] = useState<SelectionInfo | null>(null);
  const [selectionB, setSelectionB] = useState<SelectionInfo | null>(null);
  const [selectionC, setSelectionC] = useState<SelectionInfo | null>(null);
  const [selectionD, setSelectionD] = useState<SelectionInfo | null>(null);

  // Preview image URLs
  const [previewA, setPreviewA] = useState<string | null>(null);
  const [previewB, setPreviewB] = useState<string | null>(null);
  const [previewC, setPreviewC] = useState<string | null>(null);
  const [previewD, setPreviewD] = useState<string | null>(null);

  // Logo configuration state
  const defaultProductName = "Logo component set";
  const [productName, setProductName] = useState<string>("");
  const [backgroundColor, setBackgroundColor] = useState<string>("FFFFFF");
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(1);
  const [faviconHasBackground, setFaviconHasBackground] =
    useState<boolean>(false);
  const [faviconBackgroundShape, setFaviconBackgroundShape] = useState<
    "square" | "circle"
  >("square");
  const [bgVariantSource, setBgVariantSource] = useState<"A" | "B" | "C" | "D">(
    "A"
  );
  const [lightVariantSource, setLightVariantSource] = useState<
    "A" | "B" | "C" | "D"
  >("A");
  const [darkVariantSource, setDarkVariantSource] = useState<
    "A" | "B" | "C" | "D"
  >("A");
  const [faviconVariantSource, setFaviconVariantSource] = useState<
    "A" | "B" | "C" | "D"
  >("B");
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
  const [textFaviconBackgroundShape, setTextFaviconBackgroundShape] = useState<
    "square" | "circle"
  >("square");
  const [textTextColor, setTextTextColor] = useState<string>("000000");

  // Listen for selection updates from main
  on<SelectionUpdateHandler>("SELECTION_UPDATE", function (slot, info) {
    if (info && info.imageData) {
      let binary = "";
      const bytes = new Uint8Array(info.imageData);
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      const dataUrl = `data:image/png;base64,${base64}`;

      if (slot === "A") {
        setSelectionA(info);
        setPreviewA(dataUrl);
      } else if (slot === "B") {
        setSelectionB(info);
        setPreviewB(dataUrl);
      } else if (slot === "C") {
        setSelectionC(info);
        setPreviewC(dataUrl);
      } else if (slot === "D") {
        setSelectionD(info);
        setPreviewD(dataUrl);
      }
    }
  });

  // Listen for top-level frames from main
  on<TopLevelFramesHandler>("TOP_LEVEL_FRAMES", function (frames) {
    setTopLevelFrames(frames);
  });

  // Listen for settings from main
  on<LoadSettingsHandler>("LOAD_SETTINGS", function (settings) {
    setBgVariantSource(settings.bgVariantSource);
    setLightVariantSource(settings.lightVariantSource);
    setDarkVariantSource(settings.darkVariantSource);
    setFaviconVariantSource(settings.faviconVariantSource);
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
        bgVariantSource,
        lightVariantSource,
        darkVariantSource,
        faviconVariantSource,
        lightModeBlack,
        darkModeWhite,
        faviconHasBackground,
        faviconBackgroundShape,
      };
      emit<SaveSettingsHandler>("SAVE_SETTINGS", settings);
    },
    [
      bgVariantSource,
      lightVariantSource,
      darkVariantSource,
      faviconVariantSource,
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

  // Grab selection handlers
  const handleGrabSelectionA = useCallback(function () {
    emit<GrabSelectionHandler>("GRAB_SELECTION", "A");
  }, []);

  const handleGrabSelectionB = useCallback(function () {
    emit<GrabSelectionHandler>("GRAB_SELECTION", "B");
  }, []);

  const handleGrabSelectionC = useCallback(function () {
    emit<GrabSelectionHandler>("GRAB_SELECTION", "C");
  }, []);

  const handleGrabSelectionD = useCallback(function () {
    emit<GrabSelectionHandler>("GRAB_SELECTION", "D");
  }, []);

  // Clear selection handlers
  const handleClearSelectionA = useCallback(function () {
    setSelectionA(null);
    setPreviewA(null);
  }, []);

  const handleClearSelectionB = useCallback(function () {
    setSelectionB(null);
    setPreviewB(null);
  }, []);

  const handleClearSelectionC = useCallback(function () {
    setSelectionC(null);
    setPreviewC(null);
  }, []);

  const handleClearSelectionD = useCallback(function () {
    setSelectionD(null);
    setPreviewD(null);
  }, []);

  // Create component set handler
  const handleCreateComponentSet = useCallback(
    function () {
      // Validate required product name
      if (!productName.trim()) {
        setProductNameError(true);
        return;
      }

      if (!selectionA && !selectionB && !selectionC && !selectionD) {
        return;
      }

      const config: LogoConfig = {
        productName: productName.trim(),
        backgroundColor,
        backgroundOpacity,
        bgVariantSource,
        lightVariantSource,
        darkVariantSource,
        faviconVariantSource,
        faviconHasBackground,
        faviconBackgroundShape,
        lightModeBlack,
        darkModeWhite,
        selectionAId: selectionA?.id || null,
        selectionBId: selectionB?.id || null,
        selectionCId: selectionC?.id || null,
        selectionDId: selectionD?.id || null,
        targetFrameId: selectedFrameId || null,
      };

      emit<CreateComponentSetHandler>("CREATE_COMPONENT_SET", config);
    },
    [
      productName,
      backgroundColor,
      backgroundOpacity,
      bgVariantSource,
      lightVariantSource,
      darkVariantSource,
      faviconVariantSource,
      faviconHasBackground,
      faviconBackgroundShape,
      lightModeBlack,
      darkModeWhite,
      selectionA,
      selectionB,
      selectionC,
      selectionD,
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

  const sourceOptions: Array<DropdownOption> = [
    { value: "A", text: "Selection A" },
    { value: "B", text: "Selection B" },
    { value: "C", text: "Selection C" },
    { value: "D", text: "Selection D" },
  ];

  // Target frame options for dropdown
  const targetFrameOptions: Array<DropdownOption> = [
    { value: "", text: "Current page (0,0)" },
    ...topLevelFrames.map((frame) => ({
      value: frame.id,
      text: frame.name,
    })),
  ];

  const faviconShapeOptions: Array<SegmentedControlOption> = [
    { value: "square", children: "Square" },
    { value: "circle", children: "Circle" },
  ];

  const hasAnyVectorSelection = Boolean(
    selectionA || selectionB || selectionC || selectionD
  );

  const tabsOptions: Array<TabsOption> = [
    { value: "Select Vectors", children: <h2>Select Vectors</h2> },
    { value: "Create Logotype", children: <h2>Create Logotype</h2> },
  ];

  const selectionRows = [
    {
      key: "A",
      label: "Selection A",
      selection: selectionA,
      preview: previewA,
      handleGrab: handleGrabSelectionA,
      handleClear: handleClearSelectionA,
    },
    {
      key: "B",
      label: "Selection B",
      selection: selectionB,
      preview: previewB,
      handleGrab: handleGrabSelectionB,
      handleClear: handleClearSelectionB,
    },
    {
      key: "C",
      label: "Selection C",
      selection: selectionC,
      preview: previewC,
      handleGrab: handleGrabSelectionC,
      handleClear: handleClearSelectionC,
    },
    {
      key: "D",
      label: "Selection D",
      selection: selectionD,
      preview: previewD,
      handleGrab: handleGrabSelectionD,
      handleClear: handleClearSelectionD,
    },
  ];

  return (
    <Container space="medium">
      <VerticalSpace space="medium" />
      <Tabs
        options={tabsOptions}
        value={activeTab}
        onValueChange={setActiveTab}
      />
      <VerticalSpace space="medium" />

      {activeTab === "Select Vectors" && (
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

          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            {selectionRows.map((row) => {
              const preview = row.preview;
              const selection = row.selection;
              return (
                <div key={row.key} style={{ flexGrow: 1 }}>
                  <Text>
                    <Bold>{row.label}</Bold>
                  </Text>
                  <VerticalSpace space="small" />
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      alignItems: "center",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      className={"inner-card"}
                      style={{
                        flexGrow: 1,
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {preview ? (
                        <div
                          className={"has-img card-width"}
                          style={{
                            backgroundImage: `url('${preview}')`,
                          }}
                        ></div>
                      ) : (
                        <Text className={"card-width"}>
                          <Muted className={"no-img"}>None selected</Muted>
                        </Text>
                      )}
                    </div>
                    <div className={"card-width"}>
                      <Button
                        onClick={selection ? row.handleClear : row.handleGrab}
                        secondary={selection ? true : false}
                        fullWidth
                      >
                        {selection ? "Clear Selection" : "Grab Selection"}
                      </Button>
                    </div>
                  </div>
                  <VerticalSpace space="medium" />
                </div>
              );
            })}
          </div>

          <Text>
            <h2>Variant Configuration</h2>
          </Text>
          <VerticalSpace space="medium" />

          <div className="card">
            <h3>315x140 with Background</h3>
            <VerticalSpace space="small" />
            <Text>
              <Muted>Source</Muted>
            </Text>
            <VerticalSpace space="extraSmall" />
            <Dropdown
              options={sourceOptions}
              value={bgVariantSource}
              onChange={(e) =>
                setBgVariantSource(
                  e.currentTarget.value as "A" | "B" | "C" | "D"
                )
              }
              disabled={!hasAnyVectorSelection}
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

          <div className="card">
            <h3>300x100 Light Mode (no background)</h3>
            <VerticalSpace space="small" />
            <Text>
              <Muted>Source</Muted>
            </Text>
            <VerticalSpace space="extraSmall" />
            <Dropdown
              options={sourceOptions}
              value={lightVariantSource}
              onChange={(e) =>
                setLightVariantSource(
                  e.currentTarget.value as "A" | "B" | "C" | "D"
                )
              }
              disabled={!hasAnyVectorSelection}
            />
            <VerticalSpace space="small" />
            <Checkbox value={lightModeBlack} onValueChange={setLightModeBlack}>
              <Text>Make logo black</Text>
            </Checkbox>
          </div>

          <div className="card">
            <h3>300x100 Dark Mode (no background)</h3>
            <VerticalSpace space="small" />
            <Text>
              <Muted>Source</Muted>
            </Text>
            <VerticalSpace space="extraSmall" />
            <Dropdown
              options={sourceOptions}
              value={darkVariantSource}
              onChange={(e) =>
                setDarkVariantSource(
                  e.currentTarget.value as "A" | "B" | "C" | "D"
                )
              }
              disabled={!hasAnyVectorSelection}
            />
            <VerticalSpace space="small" />
            <Checkbox value={darkModeWhite} onValueChange={setDarkModeWhite}>
              <Text>Make logo white</Text>
            </Checkbox>
          </div>

          <div className="card">
            <h3>100x100 Favicon</h3>
            <VerticalSpace space="small" />
            <Text>
              <Muted>Source</Muted>
            </Text>
            <VerticalSpace space="extraSmall" />
            <Dropdown
              options={sourceOptions}
              value={faviconVariantSource}
              onChange={(e) =>
                setFaviconVariantSource(
                  e.currentTarget.value as "A" | "B" | "C" | "D"
                )
              }
              disabled={!hasAnyVectorSelection}
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
