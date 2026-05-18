# Product Requirements Document (PRD): Football Video Analysis Tool

## 1. Purpose & Vision
The goal is to build a lightweight, MVP web application for football (soccer) video analysis. Coaches and analysts need to load match footage, pause it, and draw dynamic shapes (arrows, circles, etc.) overlaid on the video to explain tactics, player positioning, and movement.

## 2. Core User Persona
*   **Football Analyst/Coach:** Needs a quick, no-fuss way to open a video file, skip to a specific frame, draw perspective-aligned shapes, and use them to instruct players.

## 3. Scope of MVP
### In-Scope (Must Have)
*   Local video file loading (MP4/WebM).
*   Standard playback controls (Play, Pause, Forward, Backward).
*   An overlay canvas for drawing shapes dynamically via mouse.
*   Toolbar with 5 specific tools: Circle, Rectangle, Arrow, Cylinder (to represent player zones), and Textfield.
*   Ability to select, move, and reshape/resize drawn elements to match the field's perspective.

### Out-of-Scope (Future Phases)
*   Saving/Exporting the video with drawings burnt-in.
*   Tracking players automatically (AI tracking).
*   Cloud storage or user accounts.

## 4. Success Criteria
*   The video playback must remain perfectly synchronized with the drawing canvas.
*   Drawings must look crisp and allow perspective skewing/rotation to match pitch angles.