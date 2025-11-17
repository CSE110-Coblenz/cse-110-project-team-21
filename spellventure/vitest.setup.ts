import { vi } from "vitest";

// Mock Konva DOM classes so tests don't crash
vi.mock("konva", () => ({
  default: {
    Group: vi.fn(),
    Rect: vi.fn(),
    Text: vi.fn(),
    Layer: vi.fn(),
    Stage: vi.fn(),
  }
}));
