# Design System Specification

## 1. Overview & Creative North Star: The Neural Command
This design system is built to transform complex AI-native data into a high-stakes, mission-critical interface. Our Creative North Star is **"The Neural Command"**—an aesthetic that blends the technical precision of a flight deck with the fluid, luminous nature of synthetic intelligence.

We reject the "generic SaaS" look of flat grids and heavy borders. Instead, we embrace **Atmospheric Depth**. By utilizing intentional asymmetry, overlapping glass surfaces, and high-contrast "Volt" accents against a deep oceanic void, we create a sense of focused power. The interface shouldn't feel like a website; it should feel like a sophisticated instrument.

---

## 2. Colors & Atmospheric Tones
The palette is rooted in deep obsidian navies to maximize the luminance of our AI-driven data points.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders are prohibited for sectioning. Boundaries must be defined through background color shifts. For example, a `surface-container-low` component should sit on a `surface` background to create a "carved out" or "elevated" look without a rigid stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. We use a "Nesting" approach:
- **Base Level:** `surface` (#000f21) - The primary canvas.
- **Level 1 (Sections):** `surface-container-low` (#001429) - For large grouped areas.
- **Level 2 (Cards):** `surface-container-high` (#00213e) - For interactive modules.
- **Level 3 (Pop-overs):** `surface-bright` (#002d52) - For temporary high-focus elements.

### The Glass & Glow Principle
To achieve a "Mission Control" feel, use **Glassmorphism** for floating cards. Apply a semi-transparent `surface-variant` with a 20px-40px `backdrop-blur`.
*   **Signature Textures:** Use subtle linear gradients for CTAs, transitioning from `primary` (#f3ffca) to `primary-container` (#cafd00). This provides a "liquid energy" effect that flat colors lack.

---

## 3. Typography: Technical Authority
We pair the geometric precision of **Space Grotesk** for high-level data and headlines with the ultra-legibility of **Inter** for functional reading.

*   **Display (Space Grotesk):** Large, airy, and aggressive. Use `display-lg` (3.5rem) for hero statements with tight letter-spacing (-0.02em).
*   **Headline (Space Grotesk):** Used for "Module Titles" in the mission control interface. These should always be high-contrast using `on-surface`.
*   **Title/Body (Inter):** Used for all functional data. Inter's tall x-height ensures that complex AI logs remain readable at `body-sm` (0.75rem).
*   **Labels:** All `label-md` and `label-sm` should be set in **Uppercase** with +0.05em letter spacing to mimic technical schematics.

---

## 4. Elevation & Depth
In "The Neural Command," depth is light, not shadow.

*   **Tonal Layering:** Achieve "lift" by stacking a `surface-container-highest` card on top of a `surface-container-low` background. This creates a natural tonal progression.
*   **Ambient Shadows:** For floating elements, use a diffused glow rather than a black shadow. Use a 24px blur at 8% opacity using a tinted color derived from `outline`.
*   **The Ghost Border Fallback:** If a container needs more definition (e.g., in high-density data views), use a **Ghost Border**. Apply `outline-variant` at 15% opacity. Never use 100% opaque lines.
*   **Volt Glow:** For critical status indicators, use a `drop-shadow` that matches the `primary` (Electric Lime) color to simulate a neon light emitting from the screen.

---

## 5. Components

### Buttons & Interaction
*   **Primary (The Volt Pulse):** Background `primary-container` (#cafd00), text `on-primary-fixed`. Apply a subtle outer glow on hover.
*   **Secondary (Glass Action):** Semi-transparent `surface-variant` with a Ghost Border.
*   **Tertiary:** Ghost text using `primary-dim`. No background.

### Input Fields & Data Entry
*   **Mission Controls:** Inputs should never have 4-sided boxes. Use a bottom-only "Ghost Border" or a fully recessed `surface-container-lowest` fill.
*   **Focus State:** The bottom border should "energize" into a `primary` (Electric Lime) glow.

### Cards & Mission Modules
*   **Constraint:** Zero dividers. Use 24px or 32px vertical spacing to separate content within cards.
*   **Styling:** Use `xl` (0.75rem) rounded corners. Apply Glassmorphism (backdrop-blur) to any card that overlays a background texture or gradient.

### AI Status Chips
*   Used for system health (e.g., "SYNCING," "ACTIVE"). Use `label-sm` font, uppercase, with a small circular pulse indicator. Use `secondary` (#ece856) for warning and `primary` (#f3ffca) for healthy states.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical layouts. Place a large display heading on the left and a dense data module offset to the right.
*   **Do** use "Volt" (Electric Lime) sparingly. It is a high-energy signal; if everything glows, nothing is important.
*   **Do** utilize `surface-container-lowest` (#000000) for deep "wells" or background troughs to create maximum contrast for data.

### Don't:
*   **Don't** use pure white (#FFFFFF) for body text. Use `on-surface-variant` (#96adcc) to reduce eye strain in the dark environment.
*   **Don't** use standard 1px borders to separate list items. Use 12px of vertical padding and a background hover state instead.
*   **Don't** use standard "Material Design" blue for links. Every interactive element must exist within the Navy/Lime/White ecosystem.