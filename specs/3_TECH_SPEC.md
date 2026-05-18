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