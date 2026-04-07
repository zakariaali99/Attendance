# Design System Specification: The Precise Alchemist

This design system is engineered for the **Al-Khawarizmi Attendance System (منظومة الخوارزمي)**. It moves beyond the utilitarian nature of HR software to create an experience that feels like a premium editorial archive—authoritative, mathematically precise, and visually silent.

## 1. Overview & Creative North Star
**Creative North Star: "The Precise Alchemist"**
The system draws inspiration from the heritage of Al-Khawarizmi, the father of algorithms. It balances the "Alchemical" (the warmth of Golden Yellow) with the "Precise" (the analytical weight of Deep Navy). 

To avoid the "generic template" look, we employ **Intentional Asymmetry**. Dashboards should not be a grid of equal boxes; instead, use a dominant focal point (large data visualization) offset by secondary metadata. We treat data as a narrative, using high-contrast typography and overlapping surface layers to guide the user’s eye through complex HR workflows without visual clutter.

## 2. Colors & Tonal Depth
The palette is a dialogue between authority and excellence. We rely on the depth of the navy to provide a sense of stability, while the gold acts as a surgical tool for focus.

### The Palette
*   **Primary (Authority):** `#181534` (Primary) & `#2D2A4A` (Primary Container). Use these for the "Heavy" structural elements and deep-background navigation.
*   **Secondary (Excellence):** `#705d00` (Secondary) & `#fcd400` (Secondary Container). Reserve for high-value actions, status indicators, and mathematical highlights.
*   **Surface Hierarchy:** We utilize `surface_container_lowest` through `highest` to create a "nested" physical reality.

### Visual Rules
*   **The "No-Line" Rule:** 1px solid borders for sectioning are strictly prohibited. You must define boundaries through background color shifts. For example, a card (`surface_container_lowest`) sits on a page section (`surface_container_low`) which sits on the global background (`background`). This creates a sophisticated, seamless flow.
*   **The Glass & Gradient Rule:** For floating modals or "TopAppBar" elements, use Glassmorphism. Apply `surface` color at 80% opacity with a `20px` backdrop blur. 
*   **Signature Textures:** Main CTAs or Hero sections should use a subtle linear gradient: `primary` (#181534) to `primary_container` (#2D2A4A) at a 135-degree angle. This adds "soul" to the data-heavy interface.

## 3. Typography (RTL Modernity)
The system uses **IBM Plex Sans Arabic** for its technical precision or **Tajawal** for an editorial feel. Typography is our primary tool for hierarchy.

*   **Display (Mathematical Scale):** Use `display-lg` (3.5rem) for singular, high-impact numbers (e.g., total employees present). This conveys the "Power of the Algorithm."
*   **Headlines & Titles:** `headline-md` (1.75rem) should be used for section titles in Deep Navy (`on_surface`).
*   **Body & Labels:** `body-md` (0.875rem) is the workhorse. Ensure line-height is increased by 10-15% over standard defaults to accommodate Arabic diacritics and prevent visual "cramping" in RTL layouts.

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering**, not structural lines.

*   **The Layering Principle:** Treat the UI as stacked sheets of fine paper. An inner widget should be one tier higher in the `surface_container` scale than its parent to create a natural, soft lift.
*   **Ambient Shadows:** When an element must float (e.g., a profile dropdown), use a shadow with a `32px` blur and `0px 8px` offset. The color must be a tinted version of `on_surface` at 6% opacity. Never use pure black or grey shadows.
*   **The "Ghost Border" Fallback:** If a border is required for accessibility in input fields, use the `outline_variant` token at **15% opacity**. It should be felt, not seen.

## 5. Components

### TopAppBar
*   **Integration:** The logo (IMAGE_1) must be placed on the **right-hand side** (due to RTL). It sits on a glassmorphic bar (80% `surface` with backdrop blur).
*   **Title:** The system name "منظومة الخوارزمي" should use `title-lg` in `on_primary_fixed_variant` when on light backgrounds.

### Buttons
*   **Primary:** A gradient from `#181534` to `#2D2A4A`. Text (`on_primary`) is centered. No border.
*   **Secondary:** Solid `secondary_container` (`#fcd400`) with `on_secondary_container` text. This is for high-priority HR actions like "Submit Attendance."

### Input Fields & Data Entry
*   **Style:** No bottom lines. Use a `surface_container_high` background with a `md` (0.375rem) corner radius. 
*   **States:** On focus, the background shifts to `surface_container_highest` and a "Ghost Border" of the `primary` color appears at 20% opacity.

### Cards & Lists
*   **Rule:** Forbid the use of divider lines. 
*   **Spacing:** Separate list items using the spacing scale (e.g., 1rem vertical gap). 
*   **Grouping:** Use a subtle background shift (e.g., `surface_container_low`) to group related employee data points.

### Attendance Widgets (Custom)
*   **The "Clock-In" Dial:** Use the circular motif from the logo's clock-fingerprint icon to create a circular progress indicator for daily hours.

## 6. Do's and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** align all text and icons to the right (RTL). | **Don't** use 1px solid black or high-contrast borders. |
| **Do** use `primary_container` for large background areas to provide "weight." | **Don't** use standard drop shadows with high opacity. |
| **Do** use `display-lg` for big data to create an editorial "magazine" feel. | **Don't** use more than two different font families. |
| **Do** use vertical whitespace as a separator. | **Don't** cram data into tight, bordered tables. |
| **Do** use the Golden Yellow (`secondary`) sparingly as a "surgical" accent. | **Don't** make the entire TopAppBar bright yellow; it compromises authority. |

## 7. Roundedness Scale
To maintain a professional, authoritative feel, we avoid overly "bubbly" corners.
*   **Default/MD (0.375rem):** Standard for cards and inputs.
*   **XL (0.75rem):** For major dashboard containers.
*   **Full (9999px):** Strictly for chips and status tags.