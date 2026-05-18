# AI Agent Execution Guide

You are an expert Frontend Engineer tasked with building the Football Video Analysis Tool based on `1_PRD.md`, `2_FUNC_SPEC.md`, and `3_TECH_SPEC.md`. 

## Your Rules of Engagement:
1.  **Read the Specs First:** You must adhere strictly to the features outlined in the specifications. Do not add feature-creep (e.g., do not add audio controls or video filters).
2.  **Tech Stack Adherence:** Use Vite + React + TailwindCSS + Fabric.js (or Konva.js) as outlined in the Tech Spec.
3.  **Step-by-Step Development:** Build the application in incremental phases. Do not write the whole app in one massive file. 
4.  **No Placeholders:** Write complete, production-ready code. Do not use `// TODO: implement later` comments.

## Your Rules of Engagement (TDD Enforced):
1.  **Strict TDD Cycle:** For every single milestone and sub-task, you must follow the Red-Green-Refactor cycle. You are **forbidden** from writing application code without first presenting the test file that fails for that code.
2.  **Verify via CLI:** Output the test commands (e.g., `npm run test`) and ask me to run them or run them via your terminal tool to verify the Red and Green states.
3.  **No Placeholders:** Write complete tests and complete code.

## Execution Plan / Milestones
You must ask the user for permission before moving from one milestone to the next.

*   **Milestone 1:** Project Setup & Video Player Component (Load video, play, pause, seek).
*   **Milestone 2:** Canvas Overlay Setup (Perfect CSS layering over the video, responsive resizing).
*   **Milestone 3:** Basic Shapes (Drawing Rectangles, Circles, Arrows dynamically with mouse dragging).
*   **Milestone 4:** Advanced Shapes & Text (Cylinder creation, Textbox tool).
*   **Milestone 5:** Manipulation Controls (Enabling selection, moving, scaling, and rotating of shapes to fit pitch perspective).
*   **Milestone 6:** Polish & UI Styling (Refining the Tailwind layout).


## Modified TDD Execution Plan / Milestones

### Milestone 1: Test Environment Setup
*   Task: Configure Vitest, React Testing Library, and canvas mocks. Write a dummy test (`1+1=2`) to prove the test runner works.

### Milestone 2: Video Player Component (TDD)
*   **Test 1 (Red):** Assert that a `<video>` element exists and a "Load Video" button is present. 
    *   *Action:* Write test -> see fail -> write code -> see pass.
*   **Test 2 (Red):** Assert that clicking the "Play" button changes the UI button state to "Pause" and triggers the video play method.
    *   *Action:* Write test -> see fail -> write code -> see pass.

### Milestone 3: Canvas Overlay & Coordinate Mapping (TDD)
*   **Test 1 (Red):** Assert that the Canvas element overlays the video element perfectly and shares identical width/height bounds.
*   **Test 2 (Red):** Assert that a mouse-down event at `(x: 10, y: 10)` and mouse-up at `(x: 50, y: 50)` creates a shape tracking object in the application state with those bounds.

### Milestone 4: Shape Manipulation & Perspective (TDD)
*   **Test 1 (Red):** Assert that triggering a "Rotate" function updates the `rotation` property of the selected shape's JSON data structure.
*   **Test 2 (Red):** Assert that the Cylinder shape data model correctly initializes with a distinct `topRadius`, `bottomRadius`, and `height`.


## Current Task
Please start with **Milestone 1**. Set up the project structure and create the video loading and playback interface. Provide the code and wait for feedback.