import { emit, on, once, showUI } from '@create-figma-plugin/utilities'

import {
  CloseHandler,
  CreateComponentSetHandler,
  GrabSelectionHandler,
  LogoConfig,
  SelectionInfo,
  SelectionUpdateHandler
} from './types'

// Note: Selection IDs are now passed directly in config from UI
// We don't need to store them globally anymore

export default function () {
  // Handle grabbing selections
  on<GrabSelectionHandler>('GRAB_SELECTION', async function (slot: 'A' | 'B') {
    const selection = figma.currentPage.selection

    if (selection.length === 0) {
      figma.notify('Please select at least one element')
      return
    }

    // If multiple nodes selected, group them
    let node: SceneNode
    if (selection.length > 1) {
      node = figma.group(selection, figma.currentPage)
      figma.notify(`Grouped ${selection.length} elements`)
    } else {
      node = selection[0]
    }

    // Export node as PNG for preview
    let imageData: Uint8Array
    try {
      imageData = await node.exportAsync({
        format: 'PNG',
        constraint: { type: 'SCALE', value: 2 } // 2x scale for better quality
      })
    } catch (error) {
      figma.notify('Failed to generate preview image')
      return
    }

    // Send info back to UI (includes the image data)
    const info: SelectionInfo = {
      id: node.id,
      name: node.name,
      imageData
    }
    emit<SelectionUpdateHandler>('SELECTION_UPDATE', slot, info)
  })

  // Handle creating component set
  on<CreateComponentSetHandler>(
    'CREATE_COMPONENT_SET',
    function (config: LogoConfig) {
      try {
        // Validation
        if (!config.productName.trim()) {
          figma.notify('Please enter a product name')
          return
        }

        if (!config.selectionAId) {
          figma.notify('Please select at least one element')
          return
        }

        // Validate that required selections exist
        const sourceIds = [
          config.bgVariantSource === 'A'
            ? config.selectionAId
            : config.selectionBId,
          config.lightVariantSource === 'A'
            ? config.selectionAId
            : config.selectionBId,
          config.darkVariantSource === 'A'
            ? config.selectionAId
            : config.selectionBId,
          config.faviconVariantSource === 'A'
            ? config.selectionAId
            : config.selectionBId
        ]

        for (const id of sourceIds) {
          if (!id) {
            figma.notify(
              'Some variants require Selection B, but it is not set'
            )
            return
          }
        }

        // Create the 4 variants
        const variants: ComponentNode[] = []

        // 1. 315x140 with background
        const bgVariant = createVariant({
          width: 315,
          height: 140,
          sourceId:
            config.bgVariantSource === 'A'
              ? config.selectionAId
              : config.selectionBId!,
          backgroundColor: config.backgroundColor,
          colorOverride: null,
          variantName: `Product=${config.productName}, Size=315x140-BG`
        })
        variants.push(bgVariant)

        // 2. 300x100 Light mode (no bg)
        const lightVariant = createVariant({
          width: 300,
          height: 100,
          sourceId:
            config.lightVariantSource === 'A'
              ? config.selectionAId
              : config.selectionBId!,
          backgroundColor: null,
          colorOverride: config.lightModeBlack ? hexToRgb('#000000') : null,
          variantName: `Product=${config.productName}, Size=300x100-Light-NoBg`
        })
        variants.push(lightVariant)

        // 3. 300x100 Dark mode (no bg)
        const darkVariant = createVariant({
          width: 300,
          height: 100,
          sourceId:
            config.darkVariantSource === 'A'
              ? config.selectionAId
              : config.selectionBId!,
          backgroundColor: null,
          colorOverride: config.darkModeWhite ? hexToRgb('#FFFFFF') : null,
          variantName: `Product=${config.productName}, Size=300x100-Dark-NoBg`
        })
        variants.push(darkVariant)

        // 4. 100x100 Favicon
        const faviconVariant = createVariant({
          width: 100,
          height: 100,
          sourceId:
            config.faviconVariantSource === 'A'
              ? config.selectionAId
              : config.selectionBId!,
          backgroundColor: null,
          colorOverride: null,
          variantName: `Product=${config.productName}, Size=100x100-Favicon`
        })
        variants.push(faviconVariant)

        // Combine into component set
        const componentSet = figma.combineAsVariants(
          variants,
          figma.currentPage
        )
        componentSet.name = config.productName

        // Position and zoom
        figma.viewport.scrollAndZoomIntoView([componentSet])
        figma.notify('Component set created!')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        figma.notify(`Error: ${message}`)
        console.error(error)
      }
    }
  )

  // Handle close
  once<CloseHandler>('CLOSE', function () {
    figma.closePlugin()
  })

  showUI({
    width: 320,
    height: 600
  })
}

// Helper: Create a single variant component
function createVariant(options: {
  width: number
  height: number
  sourceId: string
  backgroundColor: string | null
  colorOverride: RGB | null
  variantName: string
}): ComponentNode {
  // Get source node
  const sourceNode = figma.getNodeById(options.sourceId)
  if (!sourceNode || !('clone' in sourceNode)) {
    throw new Error('Source node not found or cannot be cloned')
  }

  // Create component
  const component = figma.createComponent()
  component.resize(options.width, options.height)
  component.name = options.variantName

  // Add background if specified
  if (options.backgroundColor) {
    const bg = figma.createRectangle()
    bg.resize(options.width, options.height)
    bg.fills = [{ type: 'SOLID', color: hexToRgb(options.backgroundColor) }]
    bg.name = 'Background'
    component.appendChild(bg)
  }

  // Clone source and add to component
  const clone = sourceNode.clone()
  
  // Scale to fit with padding
  scaleToFit(clone, options.width, options.height, 16)
  
  // Center in parent
  centerInParent(clone, options.width, options.height)
  
  // Apply color override if specified
  if (options.colorOverride) {
    applyColorToAllFills(clone, options.colorOverride)
  }
  
  // Append to component (type assertion since we know it's a scene node)
  if ('type' in clone && clone.type !== 'PAGE') {
    component.appendChild(clone as SceneNode)
  }
  
  return component
}

// Helper: Convert hex to RGB (0-1 range)
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    throw new Error('Invalid hex color')
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  }
}

// Helper: Scale node to fit within bounds (contained)
function scaleToFit(
  node: BaseNode,
  maxWidth: number,
  maxHeight: number,
  padding: number
): void {
  if (!('resize' in node) || !('width' in node) || !('height' in node)) return

  const availableWidth = maxWidth - padding * 2
  const availableHeight = maxHeight - padding * 2

  const scaleX = availableWidth / node.width
  const scaleY = availableHeight / node.height
  const scale = Math.min(scaleX, scaleY)

  node.resize(node.width * scale, node.height * scale)
}

// Helper: Center node within parent dimensions
function centerInParent(
  node: BaseNode,
  parentWidth: number,
  parentHeight: number
): void {
  if (!('width' in node) || !('height' in node) || !('x' in node) || !('y' in node)) return
  
  node.x = (parentWidth - node.width) / 2
  node.y = (parentHeight - node.height) / 2
}

// Helper: Recursively apply color to all fills
function applyColorToAllFills(node: BaseNode, color: RGB): void {
  if ('fills' in node && node.fills !== figma.mixed) {
    const fills = node.fills as Paint[]
    node.fills = fills.map((fill) => {
      if (fill.type === 'SOLID') {
        return { ...fill, color }
      }
      return fill
    })
  }

  if ('children' in node) {
    for (const child of node.children) {
      applyColorToAllFills(child, color)
    }
  }
}
