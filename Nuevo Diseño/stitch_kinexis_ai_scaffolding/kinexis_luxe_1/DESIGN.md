# Design System Specification: The Kinetic Luminescence

## 1. Overview & Creative North Star: "The Digital Obsidian"
This design system is engineered to feel less like a software interface and more like a high-end physical artifact—a piece of precision-milled dark glass illuminated by a singular, coherent light source. We move beyond "Dark Mode" into a philosophy of **The Digital Obsidian**: a world of deep, infinite blacks, tactile glass textures, and high-energy focal points.

### Creative North Star: "Precision Ether"
To break the "template" look, we reject the rigid, boxy grid in favor of **intentional asymmetry** and **breathable editorial layouts**. We prioritize negative space as a functional element, allowing the vibrant Electric Lime to act as a laser-focused guide for the user’s eye. The goal is a "Quiet Luxury" aesthetic where the interface recedes, and the content is elevated through sophisticated tonal layering.

---

## 2. Colors & Surface Philosophy
The palette is a high-contrast dialogue between the void and the spark. We utilize a Material-based token system to manage these sophisticated shifts.

### The "No-Line" Rule
Traditional 1px solid borders for sectioning are strictly prohibited. We define boundaries through **tonal transitions**. A section shift is achieved by moving from `surface` (#040f1b) to `surface-container-low` (#061422). This creates a "molded" look rather than a "sketched" look.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers stacked in space.
- **Base Layer:** `surface` (#040f1b).
- **Secondary Content:** `surface-container` (#0b1b2a).
- **Interactive Elevated Elements:** `surface-container-highest` (#152739).
- **Nesting Logic:** An inner card should always be one "tier" higher or lower than its parent container to create natural depth without shadows.

### The Glass & Gradient Rule
To achieve the "Apple-Grade" finish, floating elements (modals, navigation bars, dropdowns) must use **Glassmorphism**:
- **Background:** `rgba(255, 255, 255, 0.03)` 
- **Backdrop-filter:** `blur(12px)`
- **Texture:** Use a subtle linear gradient on primary CTAs moving from `primary` (#f3ffca) to `primary-container` (#cafd00) at a 135° angle to give the "Electric Lime" a liquid, three-dimensional soul.

---

## 3. Typography: Editorial Authority
We utilize **Inter** (or System SF Pro) with a hyper-disciplined approach to weight and tracking.

- **The Title Signature:** All titles (`display` and `headline` scales) must use a letter-spacing of **-0.02em**. This "tight" tracking creates a premium, editorial density that feels intentional and high-end.
- **Hierarchy of Scale:** We use extreme contrast between `display-lg` (3.5rem) for hero moments and `body-sm` (0.75rem) for secondary metadata. This wide delta creates a sense of luxury and "breathable" sophistication.
- **Labeling:** Use `label-md` in all-caps with +0.05em tracking for category tags to contrast against the tight tracking of titles.

---

## 4. Elevation & Depth
We convey importance through **Tonal Layering** rather than structural scaffolding.

- **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` background to create a "recessed" effect. Conversely, use `surface-container-highest` to "lift" an element.
- **Ambient Shadows:** Shadows are rare. When used for high-level modals, they must be "Ambient": `color: rgba(0, 8, 20, 0.4)`, `blur: 60px`, `y-offset: 20px`. The shadow is a darker tint of the background, not a neutral grey.
- **The "Ghost Border" Fallback:** If a container requires a border for accessibility, use the **Ghost Border**: `outline-variant` (#3d4957) at 20% opacity. 
- **Corner Radii:** Our signature is the `lg` (2rem / 32px) and `md` (1.5rem / 24px) radius. This ultra-roundness softens the high-contrast color palette, making the tech feel organic and approachable.

---

## 5. Components

### Buttons (The Kinetic Triggers)
- **Primary:** Background `primary-container` (#cafd00), Text `on-primary-container` (#4a5e00). Rounded `full`. No shadow.
- **Secondary (Glass):** Background `rgba(255, 255, 255, 0.05)`, Blur `10px`, Border `1px solid rgba(255, 255, 255, 0.1)`.
- **Tertiary:** No background. Text `primary`. `0.02em` tracking.

### Cards & Lists
- **Rule:** Absolute prohibition of divider lines.
- **Separation:** Use `48px` of vertical white space (Spacing XL) or a subtle shift to `surface-container-low`.
- **Interactions:** On hover, a card should shift from `surface-container` to `surface-bright` (#1b2d41) with a smooth 300ms transition.

### Input Fields
- **Base State:** Background `surface-container-lowest`. Border `1px solid transparent`.
- **Focus State:** Border `1px solid` using `primary` (#f3ffca) at 40% opacity. Inner glow using `primary` at 5% opacity.
- **Corner Radius:** `sm` (0.5rem) to differentiate data-entry from layout containers.

### Ultra-Thin Iconography
- **Weight:** Use 1px or 1.5px stroke weights only. 
- **Scaling:** Icons should be framed in a `40x40px` soft-glass circle (`rgba(255, 255, 255, 0.03)`) to give them "breathing room."

---

## 6. Do’s and Don’ts

### Do:
- **Use "Asymmetric Breathing":** Offset your text columns. Let a headline sit 20% further left than the body text to create a custom, high-end editorial feel.
- **Embrace the Dark:** Allow large areas of `#000814` to exist without any content. Space is a luxury.
- **Layer Glass:** Place glass cards over subtle, blurred background gradients (Electric Lime at 5% opacity) to create "Vibrant Depth."

### Don't:
- **Never use Pure White (#FFFFFF):** For text, use `on-surface` (#dde9fb). It reduces eye strain and feels more integrated into the navy atmosphere.
- **No 100% Opaque Borders:** This shatters the "Digital Obsidian" illusion.
- **No Tight Padding:** If you think a container has enough padding, add 16px more. Luxury is defined by excess space.
- **No Standard Grids:** Avoid 12-column layouts that feel like a bootstrap template. Use "broken" grids where elements overlap their container boundaries slightly.