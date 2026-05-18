# Functional Specification

## 1. User Interface (UI) Layout
The application consists of a single-screen dashboard:
*   **Top Bar:** "Load Video" button.
*   **Central Area:** Video Player with a transparent Canvas layered directly on top of it.
*   **Bottom Bar:** Playback Controls (Play/Pause toggle, Skip Forward 5s, Skip Backward 5s, Time scrubber).
*   **Left/Right Sidebar:** Drawing Toolbar containing:
    *   Select/Move Tool
    *   Circle Tool
    *   Rectangle Tool
    *   Arrow Tool
    *   Cylinder Tool (Draws a 3D-looking cylinder base)
    *   Text Tool
    *   Clear Canvas Button

## 2. Detailed Feature Behavior

### 2.1 Video Control Behavior
*   Clicking "Load Video" opens the native OS file picker.
*   When a video is playing, drawings remain static on the screen (the user usually pauses the video *before* drawing).

### 2.2 Drawing & Interaction Behavior
*   **Creation:** Clicking a tool (e.g., Arrow) and dragging on the canvas draws the shape dynamically from mouse-down to mouse-up.
*   **Manipulation (Crucial for Pitch Perspective):**
    *   When the "Select/Move" tool is active, clicking a shape highlights it with bounding box handles.
    *   Dragging the center moves the shape.
    *   Dragging the handles allows resizing and **rotating/skewing** so the user can flatten a circle into an ellipse to match the stadium camera angle.
*   **Text Tool:** Clicking the canvas opens a small inline text input. Pressing `Enter` or clicking outside bakes the text onto the canvas.