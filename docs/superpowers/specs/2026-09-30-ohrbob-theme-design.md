# Ohrbob Bootstrap Glassmorphism Theme

## Overview
A custom Bootstrap 5 SCSS theme tailored for an audio/radio playing application ("Ohrbob"). The theme implements a "Frosted Neon" aesthetic, utilizing a specific color palette to create glassmorphism effects (transparency and background blur) against a dark background, accented by glowing neon borders and controls.

## Color Palette
Extracted from `colors.md`:
*   **Yellow:** `#fdb404`
*   **Orange Light:** `#fd9e03`
*   **Dark Blue (Base):** `#0b1c5d`
*   **Light Blue:** `#4d48f2`
*   **Strong Orange:** `#fb6002`

## Visual Aesthetic (Frosted Neon Glassmorphism)
*   **Base Background:** The `body` background will be Dark Blue (`#0b1c5d`).
*   **Glass Panels:** Core structural components (Cards, Modals, Navbars, Dropdowns) will have a semi-transparent background (e.g., heavily desaturated/transparent white or a tint of Light Blue) combined with `backdrop-filter: blur(15px)`.
*   **Neon Accents:** Borders on glass components will utilize the yellow and oranges, implementing a subtle `box-shadow` to create a glowing effect.
*   **Typography:** Text defaults to white or very light grays to ensure high contrast against the dark background and glass panels.
*   **Interactive Elements (Buttons/Inputs):** Inputs will be glass-styled (transparent background, blur, thin border). Buttons will feature the strong orange/yellow gradients or solid colors with pronounced glow effects on hover.

## Components & Scope
This is a general UI Kit that styles standard Bootstrap components, with a specific addition for the audio application context:

1.  **Standard Bootstrap Components:** Cards, Buttons, Inputs, Navbars, Dropdowns, and typography customized to the glassmorphism aesthetic.
2.  **Floating Audio Player Widget:** A custom component specific to this theme.
    *   **Position:** Fixed in the bottom corner of the viewport.
    *   **Style:** A glass card (`backdrop-filter`) with neon borders.
    *   **Behavior:** Designed as a Floating Action Widget that can expand to show full playback controls (play, pause, track info) or collapse to a smaller footprint.

## Architecture
*   **Framework:** Bootstrap 5 (via SCSS).
*   **Build System:** Minimal `package.json` utilizing Dart Sass (`sass` npm package) to compile custom SCSS.
*   **Structure:**
    *   `scss/_variables.scss`: Overrides for Bootstrap variables (colors, borders, fonts).
    *   `scss/_glass.scss`: Custom mixins and utility classes for the glassmorphism and neon glow effects.
    *   `scss/_audio-widget.scss`: Styles for the custom floating audio player.
    *   `scss/theme.scss`: Main entry point importing Bootstrap and our custom files.
*   **Output:** A compiled `css/theme.css`.
*   **Showcase:** An `index.html` file demonstrating the styled UI kit components and the audio widget.