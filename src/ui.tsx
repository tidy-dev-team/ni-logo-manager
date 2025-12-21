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
import { useCallback, useState } from "preact/hooks";
import "./styles.css";

import {
  CreateComponentSetHandler,
  CreateTextLogoHandler,
  GrabSelectionHandler,
  LogoConfig,
  SelectionInfo,
  SelectionUpdateHandler,
  TextLogoConfig,
} from "./types";

function Plugin() {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("Select Vectors");

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
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(1);
  const [faviconHasBackground, setFaviconHasBackground] =
    useState<boolean>(false);
  const [faviconBackgroundShape, setFaviconBackgroundShape] = useState<
    "square" | "circle"
  >("square");
  const [bgVariantSource, setBgVariantSource] =
    useState<"A" | "B" | "C" | "D">("A");
  const [lightVariantSource, setLightVariantSource] =
    useState<"A" | "B" | "C" | "D">("A");
  const [darkVariantSource, setDarkVariantSource] =
    useState<"A" | "B" | "C" | "D">("A");
  const [faviconVariantSource, setFaviconVariantSource] =
    useState<"A" | "B" | "C" | "D">("B");
  const [lightModeBlack, setLightModeBlack] = useState<boolean>(false);
  const [darkModeWhite, setDarkModeWhite] = useState<boolean>(false);

  // Create Logotype tab state
  const [textProductName, setTextProductName] = useState<string>("");
  const [logoText, setLogoText] = useState<string>("");
  const [faviconText, setFaviconText] = useState<string>("");
  const [textBackgroundColor, setTextBackgroundColor] =
    useState<string>("#EEEEEE");
  const [textBackgroundOpacity, setTextBackgroundOpacity] = useState<number>(1);
  const [textFaviconHasBackground, setTextFaviconHasBackground] =
    useState<boolean>(true);
  const [textFaviconBackgroundShape, setTextFaviconBackgroundShape] = useState<
    "square" | "circle"
  >("square");
  const [textTextColor, setTextTextColor] = useState<string>("#000000");

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
      if (!productName.trim() && !defaultProductName) {
        return;
      }

      if (!selectionA && !selectionB && !selectionC && !selectionD) {
        return;
      }

      const config: LogoConfig = {
        productName: productName.trim() || defaultProductName,
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
    ]
  );

  // Create Text Logo handler
  const handleCreateTextLogo = useCallback(
    function () {
      const config: TextLogoConfig = {
        productName: textProductName.trim() || "Logo component set",
        logoText: logoText.trim() || "Text logo",
        faviconText: faviconText.trim() || "T",
        backgroundColor: textBackgroundColor,
        backgroundOpacity: textBackgroundOpacity,
        faviconHasBackground: textFaviconHasBackground,
        faviconBackgroundShape: textFaviconBackgroundShape,
        textColor: textTextColor,
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
    ]
  );

  const sourceOptions: Array<DropdownOption> = [
    { value: "A", text: "Selection A" },
    { value: "B", text: "Selection B" },
    { value: "C", text: "Selection C" },
    { value: "D", text: "Selection D" },
  ];

  const faviconShapeOptions: Array<SegmentedControlOption> = [
    { value: "square", children: "Square" },
    { value: "circle", children: "Circle" },
  ];

  const hasAnyVectorSelection = Boolean(
    selectionA || selectionB || selectionC || selectionD
  );

  const tabsOptions: Array<TabsOption> = [
    { value: "Select Vectors", children: "Select Vectors" },
    { value: "Create Logotype", children: "Create Logotype" },
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
          {selectionRows.map((row) => {
            const preview = row.preview;
            const selection = row.selection;
            return (
              <div key={row.key}>
                <Text>
                  <Bold>{row.label}</Bold>
                </Text>
                <VerticalSpace space="small" />
                <div
                  style={{ display: "flex", gap: "8px", alignItems: "center" }}
                >
                  <div
                    style={{ flex: 1, display: "flex", alignItems: "center" }}
                  >
                    {preview ? (
                      <img
                        src={preview || undefined}
                        alt={selection?.name || row.label}
                        style={{
                          maxWidth: "100px",
                          maxHeight: "60px",
                          objectFit: "contain",
                          border: "1px solid var(--figma-color-border)",
                          borderRadius: "2px",
                          padding: "4px",
                          backgroundColor: "var(--figma-color-bg)",
                        }}
                      />
                    ) : (
                      <Text>
                        <Muted>None selected</Muted>
                      </Text>
                    )}
                  </div>
                  <div style={{ width: "120px" }}>
                    <Button
                      onClick={selection ? row.handleClear : row.handleGrab}
                      secondary
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

          <Textbox
            onValueInput={setProductName}
            value={productName}
            placeholder="Logo component set"
          />
          <VerticalSpace space="large" />

          <Text>
            <Bold>Variant Configuration</Bold>
          </Text>
          <VerticalSpace space="medium" />

          <Text>315×140 with Background</Text>
          <VerticalSpace space="small" />
          <Text>
            <Muted>Source</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Dropdown
            options={sourceOptions}
            value={bgVariantSource}
            onChange={(e) =>
              setBgVariantSource(e.currentTarget.value as "A" | "B" | "C" | "D")
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
          <VerticalSpace space="medium" />

          <Text>300×100 Light Mode (no background)</Text>
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
          <VerticalSpace space="medium" />

          <Text>300×100 Dark Mode (no background)</Text>
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
          <VerticalSpace space="medium" />

          <Text>100×100 Favicon</Text>
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
          <Text>
            <Muted>Background shape</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <SegmentedControl
            disabled={!faviconHasBackground}
            options={faviconShapeOptions}
            value={faviconBackgroundShape}
            onValueChange={(value) =>
              setFaviconBackgroundShape(value as "square" | "circle")
            }
          />
          <VerticalSpace space="large" />

          <Button fullWidth onClick={handleCreateComponentSet}>
            Create component set
          </Button>
          <VerticalSpace space="small" />
        </div>
      )}

      {activeTab === "Create Logotype" && (
        <div>
          <Text>
            <Muted>Component set name</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox
            onValueInput={setTextProductName}
            value={textProductName}
            placeholder="Logo component set"
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

          <Text>
            <Muted>Text color</Muted>
          </Text>
          <VerticalSpace space="small" />
          <TextboxColor
            hexColor={textTextColor}
            onHexColorValueInput={setTextTextColor}
            opacity="100"
          />

          <VerticalSpace space="medium" />

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
          <VerticalSpace space="small" />
          <Checkbox
            value={textFaviconHasBackground}
            onValueChange={setTextFaviconHasBackground}
          >
            <Text>Favicon has background</Text>
          </Checkbox>
          <VerticalSpace space="small" />
          <Text>
            <Muted>Favicon background shape</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <SegmentedControl
            disabled={!textFaviconHasBackground}
            options={faviconShapeOptions}
            value={textFaviconBackgroundShape}
            onValueChange={(value) =>
              setTextFaviconBackgroundShape(value as "square" | "circle")
            }
          />
          <VerticalSpace space="large" />

          <Button fullWidth onClick={handleCreateTextLogo}>
            Create component set
          </Button>
          <VerticalSpace space="small" />
        </div>
      )}
    </Container>
  );
}

export default render(Plugin);
