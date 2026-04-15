# Design System: The Ethereal Professional

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Hyper-Lucid Gallery."** 

This system moves beyond standard "clean" design into a realm of high-end editorial clarity. We are not building a generic interface; we are curating a digital space that feels like a high-end physical showroom—quiet, expensive, and intentional. We break the "template" look by utilizing significant negative space, intentional asymmetry, and a sophisticated layering of glass-like surfaces. The interface should feel as though it is floating in a pressurized, light-filled environment.

## 2. Colors & Surface Philosophy

### The Tonal Palette
The palette is anchored in high-chroma neutrals and a singular "Electric Lime" disruptor.

*   **Primary (`#506600`):** Used for functional states and deep contrast.
*   **Primary Container (`#CCFF00`):** The "Disruptor." Use this sparingly for high-intent actions or critical highlights.
*   **Surface / Background (`#F7F9FC`):** A cool, expansive base that provides more depth than pure white.
*   **On-Surface (`#191C1E`):** Our "Deep Slate." Used for maximum legibility and an authoritative editorial voice.

### The "No-Line" Rule
To maintain a premium feel, **1px solid borders are prohibited for sectioning.** We do not "box in" content. Instead, boundaries must be defined through:
1.  **Tonal Transitions:** Moving from `surface` to `surface-container-low`.
2.  **Glassmorphism:** Using `rgba(255, 255, 255, 0.7)` with a `20px` backdrop-blur to create a physical sense of presence.
3.  **Negative Space:** Using the spacing scale to create "invisible containers."

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, semi-translucent sheets. 
*   **Base:** `surface` (`#F7F9FC`)
*   **Sectioning:** `surface-container-low` (`#F2F4F7`)
*   **Interactive Cards:** `surface-container-lowest` (`#FFFFFF`) with 70% opacity and blur.
*   **Floating Elements:** `surface-bright` for components that need to "pop" against the glass layers.

---

## 3. Typography: Editorial Authority
We use **Inter** not as a utility font, but as a brand signature. 

*   **The Signature Kerning:** All `display` and `headline` tiers must use `letter-spacing: -0.02em`. This "tight" setting creates a custom, high-fashion editorial look.
*   **Display Tiers (`3.5rem` - `2.25rem`):** Reserved for hero moments. Use `surface-tint` or `on-surface` to create a bold, confident hierarchy.
*   **Body Tiers (`1rem` - `0.875rem`):** Set with generous line-height (1.6) to ensure the "breathable" feel of the system remains intact.
*   **Label Tiers (`0.75rem`):** Always uppercase with `+0.05em` tracking to differentiate from body text and provide a "technical" luxury feel.

---

## 4. Elevation & Depth: Tonal Layering

### The Layering Principle
Avoid "drop shadows" in the traditional sense. Depth is achieved by "stacking."
*   Place a `surface-container-lowest` card on a `surface-container-low` background. 
*   This creates a soft, natural lift that feels like fine paper or frosted glass rather than a digital effect.

### Ambient Shadows
If an element must "float" (e.g., a primary modal or dropdown):
*   **Shadow:** 0px 20px 40px `rgba(25, 28, 30, 0.04)`. 
*   The shadow color is derived from `on-surface`, ensuring the shadow looks like natural ambient light occlusion rather than a grey smudge.

### The "Ghost Border" Fallback
Where accessibility requires a container edge, use the **Ghost Border**:
*   `outline-variant` (`#C4C9AC`) at **15% opacity**. 
*   This creates a "suggestion" of a container without breaking the ethereal, light-filled aesthetic.

---

## 5. Components

### Primary Actions (The Disruptor)
*   **Buttons:** Use `primary-container` (`#CCFF00`) with `on-primary-container` (`#5B7300`) text. 
*   **Shape:** `9999px` (Full Roundness) for buttons to contrast against the `24px` (xl) card radius.
*   **State:** On hover, apply a subtle inner glow rather than a dark overlay.

### Luxury Cards
*   **Background:** `rgba(255, 255, 255, 0.7)`
*   **Backdrop Filter:** `blur(20px)`
*   **Corner Radius:** `2rem` (`xl` scale).
*   **Interaction:** On hover, the opacity shifts to `0.9` and the "Ghost Border" increases to 30% opacity.

### Navigation & Lists
*   **Divider Prohibition:** Never use a horizontal line to separate list items. Use 16px of vertical padding and a subtle background shift (`surface-container`) on hover.
*   **Iconography:** Thin line (1.5px stroke) Lucide-style icons. Icons should be `on-surface-variant` to keep the focus on text.

### Selection & Inputs
*   **Input Fields:** `surface-container-highest` background with a `bottom-only` ghost border. This mimics high-end stationery.
*   **Chips:** High-contrast selection. Unselected: `surface-container`. Selected: `primary` with `on-primary` text.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace Asymmetry:** Align headings to the far left while placing action buttons in non-traditional "floating" positions.
*   **Use Tonal Shifts:** Define sections by changing the background color slightly (e.g., from `surface` to `surface-container-low`) rather than adding lines.
*   **Respect the "Lime":** Only use the Electric Lime for one or two focal points per screen. It is a "surgical" highlight.

### Don’t:
*   **Don't use 100% Opaque Borders:** This immediately kills the "Luxe" feel and makes the UI look like a standard dashboard.
*   **Don't use "Standard" Shadows:** Avoid the CSS default `box-shadow: 0 2px 4px`. It is too heavy for this light-mode system.
*   **Don't Crowd the Glass:** Give every glass card at least 32px of "breathing room" (margin) to allow the backdrop blur to be visible and effective.