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
  bgVariantSource: 'A' | 'B'
  lightVariantSource: 'A' | 'B'
  darkVariantSource: 'A' | 'B'
  faviconVariantSource: 'A' | 'B'
  lightModeBlack: boolean
  darkModeWhite: boolean
  selectionAId: string
  selectionBId: string | null
}

// Event Handlers
export interface GrabSelectionHandler extends EventHandler {
  name: 'GRAB_SELECTION'
  handler: (slot: 'A' | 'B') => void
}

export interface SelectionUpdateHandler extends EventHandler {
  name: 'SELECTION_UPDATE'
  handler: (slot: 'A' | 'B', info: SelectionInfo | null) => void
}

export interface CreateComponentSetHandler extends EventHandler {
  name: 'CREATE_COMPONENT_SET'
  handler: (config: LogoConfig) => void
}

export interface CloseHandler extends EventHandler {
  name: 'CLOSE'
  handler: () => void
}
