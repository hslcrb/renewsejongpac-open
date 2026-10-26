import { vi } from 'vitest'

// Mock canvas for tests that need it
global.HTMLCanvasElement = class HTMLCanvasElement {
  width = 1920
  height = 1080
  getContext() {
    return {
      clearRect: vi.fn(),
      fillRect: vi.fn()
    }
  }
} as any
