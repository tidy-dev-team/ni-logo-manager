import { EventHandler } from '@create-figma-plugin/utilities'

// Selection info passed between main and UI
export interface SelectionInfo {
  id: string
  name: string
  imageData: Uint8Array // PNG image data
}

// Configuration for creating the component set
export interface LogoConfig {
  productName: string
  backgroundColor: string
  bgVariantSource: 'A' | 'B' | 'C' | 'D'
  lightVariantSource: 'A' | 'B' | 'C' | 'D'
  darkVariantSource: 'A' | 'B' | 'C' | 'D'
  faviconVariantSource: 'A' | 'B' | 'C' | 'D'
  lightModeBlack: boolean
  darkModeWhite: boolean
  selectionAId: string | null
  selectionBId: string | null
  selectionCId: string | null
  selectionDId: string | null
}

// Event Handlers
export interface GrabSelectionHandler extends EventHandler {
  name: 'GRAB_SELECTION'
  handler: (slot: 'A' | 'B' | 'C' | 'D') => void
}

export interface SelectionUpdateHandler extends EventHandler {
  name: 'SELECTION_UPDATE'
  handler: (slot: 'A' | 'B' | 'C' | 'D', info: SelectionInfo | null) => void
}

export interface CreateComponentSetHandler extends EventHandler {
  name: 'CREATE_COMPONENT_SET'
  handler: (config: LogoConfig) => void
}

export interface CloseHandler extends EventHandler {
  name: 'CLOSE'
  handler: () => void
}

// Configuration for creating text-based logo component set
export interface TextLogoConfig {
  productName: string
  logoText: string
  faviconText: string
  backgroundColor: string
  textColor: string
}

export interface CreateTextLogoHandler extends EventHandler {
  name: 'CREATE_TEXT_LOGO'
  handler: (config: TextLogoConfig) => void
}
