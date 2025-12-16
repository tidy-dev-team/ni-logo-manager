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
  Textbox,
  TextboxColor,
  VerticalSpace
} from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useState } from 'preact/hooks'

import {
  CreateComponentSetHandler,
  GrabSelectionHandler,
  LogoConfig,
  SelectionInfo,
  SelectionUpdateHandler
} from './types'

function Plugin() {
  // Tab state
  const [activeTab, setActiveTab] = useState<string>('select-vectors')

  // Selection state
  const [selectionA, setSelectionA] = useState<SelectionInfo | null>(null)
  const [selectionB, setSelectionB] = useState<SelectionInfo | null>(null)
  
  // Preview image URLs
  const [previewA, setPreviewA] = useState<string | null>(null)
  const [previewB, setPreviewB] = useState<string | null>(null)

  // Logo configuration state
  const defaultProductName = 'Logo component set'
  const [productName, setProductName] = useState<string>('')
  const [backgroundColor, setBackgroundColor] = useState<string>('#FFFFFF')
  const [bgVariantSource, setBgVariantSource] = useState<'A' | 'B'>('A')
  const [lightVariantSource, setLightVariantSource] = useState<'A' | 'B'>('A')
  const [darkVariantSource, setDarkVariantSource] = useState<'A' | 'B'>('A')
  const [faviconVariantSource, setFaviconVariantSource] = useState<'A' | 'B'>('B')
  const [lightModeBlack, setLightModeBlack] = useState<boolean>(false)
  const [darkModeWhite, setDarkModeWhite] = useState<boolean>(false)

  // Create Logotype tab state (placeholder)
  const [input1, setInput1] = useState<string>('')
  const [input2, setInput2] = useState<string>('')

  // Listen for selection updates from main
  on<SelectionUpdateHandler>('SELECTION_UPDATE', function (slot, info) {
    if (info && info.imageData) {
      // Convert Uint8Array to base64 data URL
      let binary = ''
      const bytes = new Uint8Array(info.imageData)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      const base64 = btoa(binary)
      const dataUrl = `data:image/png;base64,${base64}`
      
      if (slot === 'A') {
        setSelectionA(info)
        setPreviewA(dataUrl)
      } else {
        setSelectionB(info)
        setPreviewB(dataUrl)
      }
    }
  })

  // Grab selection handlers
  const handleGrabSelectionA = useCallback(function () {
    emit<GrabSelectionHandler>('GRAB_SELECTION', 'A')
  }, [])

  const handleGrabSelectionB = useCallback(function () {
    emit<GrabSelectionHandler>('GRAB_SELECTION', 'B')
  }, [])

  // Clear selection handlers
  const handleClearSelectionA = useCallback(function () {
    setSelectionA(null)
    setPreviewA(null)
  }, [])

  const handleClearSelectionB = useCallback(function () {
    setSelectionB(null)
    setPreviewB(null)
  }, [])

  // Create component set handler
  const handleCreateComponentSet = useCallback(
    function () {
      // Validation
      if (!productName.trim() && !defaultProductName) {
        return // Main will show error notification
      }

      if (!selectionA) {
        return // Main will show error notification
      }

      // Build config
      const config: LogoConfig = {
        productName: productName.trim() || defaultProductName,
        backgroundColor,
        bgVariantSource,
        lightVariantSource,
        darkVariantSource,
        faviconVariantSource,
        lightModeBlack,
        darkModeWhite,
        selectionAId: selectionA.id,
        selectionBId: selectionB?.id || null
      }

      emit<CreateComponentSetHandler>('CREATE_COMPONENT_SET', config)
    },
    [
      productName,
      backgroundColor,
      bgVariantSource,
      lightVariantSource,
      darkVariantSource,
      faviconVariantSource,
      lightModeBlack,
      darkModeWhite,
      selectionA,
      selectionB
    ]
  )

  // Create Logotype tab handler (placeholder)
  const handleLogToConsole = useCallback(
    function () {
      console.log('Input 1:', input1)
      console.log('Input 2:', input2)
    },
    [input1, input2]
  )



  // Dropdown options for variant sources
  const sourceOptions: Array<DropdownOption> = [
    { value: 'A', text: 'Selection A' },
    { value: 'B', text: 'Selection B' }
  ]

  const tabsOptions: Array<TabsOption> = [
    { value: 'select-vectors', children: 'Select Vectors' },
    { value: 'create-logotype', children: 'Create Logotype' }
  ]

  return (
    <Container space="medium">
      <VerticalSpace space="medium" />
      <Tabs
        options={tabsOptions}
        value={activeTab}
        onValueChange={setActiveTab}
      />
      <VerticalSpace space="medium" />

      {activeTab === 'select-vectors' && (
        <div>
          {/* Selection A */}
          <Text>
            <Bold>Selection A</Bold>
          </Text>
          <VerticalSpace space="small" />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              {previewA ? (
                <img 
                  src={previewA} 
                  alt={selectionA?.name || 'Selection A'} 
                  style={{ 
                    maxWidth: '100px', 
                    maxHeight: '60px', 
                    objectFit: 'contain',
                    border: '1px solid var(--figma-color-border)',
                    borderRadius: '2px',
                    padding: '4px',
                    backgroundColor: 'var(--figma-color-bg)'
                  }} 
                />
              ) : (
                <Text>
                  <Muted>None selected</Muted>
                </Text>
              )}
            </div>
            <div style={{ width: '120px' }}>
              <Button
                onClick={selectionA ? handleClearSelectionA : handleGrabSelectionA}
                secondary
                fullWidth
              >
                {selectionA ? 'Clear Selection' : 'Grab Selection'}
              </Button>
            </div>
          </div>
          <VerticalSpace space="medium" />

          {/* Selection B */}
          <Text>
            <Bold>Selection B</Bold>
          </Text>
          <VerticalSpace space="small" />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
              {previewB ? (
                <img 
                  src={previewB} 
                  alt={selectionB?.name || 'Selection B'} 
                  style={{ 
                    maxWidth: '100px', 
                    maxHeight: '60px', 
                    objectFit: 'contain',
                    border: '1px solid var(--figma-color-border)',
                    borderRadius: '2px',
                    padding: '4px',
                    backgroundColor: 'var(--figma-color-bg)'
                  }} 
                />
              ) : (
                <Text>
                  <Muted>None selected</Muted>
                </Text>
              )}
            </div>
            <div style={{ width: '120px' }}>
              <Button
                onClick={selectionB ? handleClearSelectionB : handleGrabSelectionB}
                secondary
                fullWidth
              >
                {selectionB ? 'Clear Selection' : 'Grab Selection'}
              </Button>
            </div>
          </div>
          <VerticalSpace space="large" />
 
          {/* Product Name */}
          <Text>
            <Muted>Product Name</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox
            onValueInput={setProductName}
            value={productName}
          />
          <VerticalSpace space="large" />

          {/* Variant Configurations */}
          <Text>
            <Bold>Variant Configuration</Bold>
          </Text>
          <VerticalSpace space="medium" />

          {/* 315x140 with Background */}
          <Text>315×140 with Background</Text>
          <VerticalSpace space="small" />
          <Text>
            <Muted>Source</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Dropdown
            options={sourceOptions}
            value={bgVariantSource}
            onChange={(value) => setBgVariantSource(value.currentTarget.value as 'A' | 'B')}
            disabled={!selectionA && !selectionB}
          />
          <VerticalSpace space="small" />
          <Text>
            <Muted>Background Color</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <TextboxColor
            onHexColorValueInput={setBackgroundColor}
            hexColor={backgroundColor}
            opacity="100"
          />
          <VerticalSpace space="medium" />

          {/* 300x100 Light Mode */}
          <Text>300×100 Light Mode (no background)</Text>
          <VerticalSpace space="small" />
          <Text>
            <Muted>Source</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Dropdown
            options={sourceOptions}
            value={lightVariantSource}
            onChange={(value) =>
              setLightVariantSource(value.currentTarget.value as 'A' | 'B')
            }
            disabled={!selectionA && !selectionB}
          />
          <VerticalSpace space="small" />
          <Checkbox
            value={lightModeBlack}
            onValueChange={setLightModeBlack}
          >
            <Text>Make logo black</Text>
          </Checkbox>
          <VerticalSpace space="medium" />

          {/* 300x100 Dark Mode */}
          <Text>300×100 Dark Mode (no background)</Text>
          <VerticalSpace space="small" />
          <Text>
            <Muted>Source</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Dropdown
            options={sourceOptions}
            value={darkVariantSource}
            onChange={(value) => setDarkVariantSource(value.currentTarget.value as 'A' | 'B')}
            disabled={!selectionA && !selectionB}
          />
          <VerticalSpace space="small" />
          <Checkbox value={darkModeWhite} onValueChange={setDarkModeWhite}>
            <Text>Make logo white</Text>
          </Checkbox>
          <VerticalSpace space="medium" />

          {/* 100x100 Favicon */}
          <Text>100×100 Favicon</Text>
          <VerticalSpace space="small" />
          <Text>
            <Muted>Source</Muted>
          </Text>
          <VerticalSpace space="extraSmall" />
          <Dropdown
            options={sourceOptions}
            value={faviconVariantSource}
            onChange={(value) =>
              setFaviconVariantSource(value.currentTarget.value as 'A' | 'B')
            }
            disabled={!selectionA && !selectionB}
          />
          <VerticalSpace space="large" />

          {/* Create Button */}
          <Button fullWidth onClick={handleCreateComponentSet}>
            Create component set
          </Button>
          <VerticalSpace space="small" />
        </div>
      )}

      {activeTab === 'create-logotype' && (
        <div>
          <Text>
            <Muted>Input 1</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox onValueInput={setInput1} value={input1} />
          <VerticalSpace space="medium" />

          <Text>
            <Muted>Input 2</Muted>
          </Text>
          <VerticalSpace space="small" />
          <Textbox onValueInput={setInput2} value={input2} />
          <VerticalSpace space="large" />

          <Button fullWidth onClick={handleLogToConsole}>
            Log to Console
          </Button>
          <VerticalSpace space="small" />
        </div>
      )}
    </Container>
  )
}

export default render(Plugin)
