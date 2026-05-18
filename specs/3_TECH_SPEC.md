# Technical Specification

## 1. Tech Stack (MVP Recommendations)
*   **Frontend Framework:** React or Vanilla HTML5/TypeScript (React + Vite is preferred for rapid UI state management).
*   **Rendering Canvas:** HTML5 `<canvas>` via **Fabric.js** or **Konva.js**. 
    *   *Decision:* Use **Konva.js** or **Fabric.js** because they natively support object selection, moving, scaling, rotation, and custom shape grouping out-of-the-box.
*   **Styling:** TailwindCSS (for quick, clean UI layout).

## 2. Architecture & Layering
The UI must perfectly stack the Canvas over the Video element.

```text
+-----------------------------------+
|        Canvas Layer (Top)         |  <- Captures pointer events for drawing
+-----------------------------------+
|        Video Layer (Bottom)       |  <- Displays MP4/WebM stream
+-----------------------------------+
```

Critical Implementation Rules:
The Canvas aspect ratio must match the video's intrinsic aspect ratio dynamically to prevent drawing drift.

pointer-events CSS property must toggle:

When a drawing tool is selected, Canvas has pointer-events: auto.

When the user wants to click the video controls, Canvas allows click-throughs if needed, or controls are placed outside the canvas bounds.

## 3. Data Structures (Internal Shape State)
Shapes should be stored as an array of JSON objects (managed by the canvas library) for easy manipulation:

JSON
{
  "type": "arrow",
  "x": 120,
  "y": 250,
  "scaleX": 1.2,
  "scaleY": 0.8,
  "rotation": 45,
  "stroke": "#FF0000"
}
.

## 4. Testing Strategy (TDD)
*   **Testing Framework:** Vitest (fast, native Vite integration).
*   **Component & DOM Testing:** React Testing Library + Happy DOM / JSDOM.
*   **Canvas Mocking:** Since HTML5 canvas operations can be tricky in a headless test environment, use `jest-canvas-mock` or Vitest equivalent to mock canvas context methods (`getContext`, `lineTo`, etc.).
*   **TDD Workflow Rule:** For every feature or component block:
    1. Write a unit/integration test that specifies the expected behavior (e.g., "should play video when play button is clicked").
    2. Run the test to ensure it **FAILS**.
    3. Write the minimal implementation code to make the test **PASS**.
    4. Refactor while keeping the test **GREEN**.