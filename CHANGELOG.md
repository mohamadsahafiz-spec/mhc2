# FSOS CHANGELOG

## v3.6.1 — FSOS Beam Profile Animated Gallery & Muted Identity (2026-09-23)

### Beam Profile Animated Accordion Image Preview
- **Interactive React Bits AccordionGallery**:
  - Integrated the open-source React Bits `<AccordionGallery />` component with GSAP-powered smooth perspective expansion.
  - Clicking any checkpoint thumbnail on Laser 1 or Laser 2 opens a high-resolution modal displaying all 8 checkpoints for that laser head (`6A`, `6B`, `6C` masks for Laser 1; `7A`, `7B`, `7C` masks for Laser 2).
  - Preserved each checkpoint's stage label, measured diameter, specification limit, and PASS/FAIL verdict with instant focus on the selected station.
- **Engaging Inspection & Ergonomics**:
  - Rendered inactive panels with restrained grayscale/dimming while the active panel expands to full clear color with parallax drift.
  - Provided full keyboard controls (Left/Right arrows, Home, End, Esc) and quick laser head switcher inside the popup.
  - Built-in `prefers-reduced-motion` compliance and backdrop dismissal.

### Muted FSOS Logo Identity Adoption
- **Authentic Muted Logo Identity (Dark UI)**:
  - Adopted the Founder-selected **Muted** brand mark variant combining the machine health monitoring waveform and precision engineering gear.
  - Implemented crisp SVG vector asset (`FsosMutedLogo.tsx`) with restrained industrial matte steel and cool titanium gradients on a subtle dark squircle badge.
  - Avoided loud cyan/blue glowing halos in strict alignment with FSOS calm industrial design principles.
- **Consistent Application-Wide Deployment**:
  - Integrated the new Muted FSOS mark across the main navigation Sidebar header, Login page hero display, and Settings "About FSOS" platform overview.
  - Preserved existing typographic hierarchy, version badge formatting, and sidebar/header layout geometry.

## v3.6.0 — FSOS Official MHC PDF Download Loader (2026-09-23)

### React Bits LatticeLoader for Official MHC PDF Download
- **Polished Interactive LatticeLoader**:
  - Replaced the basic progress text animation inside the "Download Official MHC PDF" button with the React Bits `LatticeLoader` component.
  - Rendered a compact 3x3 orbiting lattice grid in emerald/slate ink matching the authenticated FSOS theme styling.
  - Displayed the active working label **"Downloading"** alongside a live high-precision stopwatch timer (0.0s → final elapsed time).
- **Smooth Lifecycle Transitions & Accessibility**:
  - Automatically restored the standard button state upon PDF generation completion or error.
  - Maintained accessible screen reader announcements and graceful `prefers-reduced-motion` fallbacks.
- **Preserved Invariants**:
  - Kept jsPDF / html2canvas-pro multi-page rendering engine, DOM coordinate math, ImageStore hydration, error handlers, and report data generation completely unchanged.

## v3.5.10 — FSOS Profile Photo Full-Image Presentation (2026-09-23)

### Full-Image Portrait Presentation & Aspect Ratio Preservation
- **Uncropped Full Portrait Presentation**:
  - Removed constrained square card geometry in `ProfilePhotoCardModal` and transitioned to an uncropped, contain-fitted portrait presentation (`object-contain max-h-[82vh]`).
  - Preserved the authentic aspect ratio of uploaded portrait photos without cropping hair, chin, or side boundaries.
- **Expanded Presentation Scale (30–50% Increase)**:
  - Sized the interactive card frame up to `w-[320px] sm:w-[420px] md:w-[480px] lg:w-[520px] max-w-[92vw] max-h-[82vh]`, delivering an enlarged, crystal-clear presentation of facial details while staying safely bounded within the viewport.
- **Preserved Sliding Corner Actions & Invariants**:
  - Retained the Uiverse-inspired bottom-left sliding controls (**Change Photo**, **Restore Default Initials**, and **Remove Photo**) and bottom-right engineer identity badge.
  - Preserved modal dismissal (backdrop click, Escape, X button) and all underlying profile data/upload logic.

## v3.5.9 — FSOS Expandable Profile Photo Card (2026-09-23)

### Expandable Profile Photo Card & Corner Actions
- **Interactive Enlarged Profile Photo Card**:
  - Replaced the compact popover on the Profile page with an expandable high-resolution photo card modal (`ProfilePhotoCardModal`).
  - Clicking the engineer's avatar opens a prominent centered card (`w-72 h-72 sm:w-88 sm:h-88 md:w-96 md:h-96`) with high-resolution image rendering or stylized initial typography.
  - Placed engineer identity metadata (Name, Employee ID, Role, Status) in a bottom-right frosted glass plaque.
- **Uiverse-Inspired Corner Sliding Actions**:
  - Adapted sliding corner controls to the bottom-left corner of the photo card, revealing seamless management options on hover/focus.
  - Implemented full action workflow: **Change Photo** (upload file), **Restore Default Initials**, and **Remove Photo**.
  - Retained natural dismissibility via outer backdrop click, escape key, or top-right close control.
- **Preserved Core Invariants**:
  - Preserved existing avatar upload limits (JPG, PNG, WEBP up to 5MB), persistence lifecycle, and user profile data schema.
  - Left Sidebar, Header, theme system, and Hamster Sync completely untouched.

## v3.5.8 — FSOS Workspace Scroll & Full-Viewport Autopilot (2026-09-23)

### Full Workspace Scroll & Viewport-Level Autopilot Overlay
- **Full Workspace Scroll Container**:
  - Re-architected `<main>` as a full-width viewport scroll container (`flex-1 overflow-y-auto w-full min-w-0`) spanning 100% of the area to the right of the Sidebar.
  - Decoupled `max-w-7xl mx-auto` to an inner content wrapper, eliminating dead mouse-wheel scroll zones on outer gutters.
  - Moved the vertical scrollbar to the far-right edge of the viewport, eliminating the 1280px vertical dividing line through the workspace.
- **Full-Viewport MHC Autopilot Presentation**:
  - Rendered `MhcAutopilot` via a React Portal (`createPortal(content, document.body)`) to escape workspace stacking context and motion transform constraints.
  - Restored full-viewport backdrop darkening and backdrop-blur covering the Sidebar, Header, and full screen seamlessly.
- **Preserved Invariants**:
  - Maintained full-height sticky Sidebar and pinned bottom Hamster Sync indicator.
  - Preserved standalone 64px hamster wheel, real-state dynamic animations, and unclipped 224px popover geometry.

## v3.5.7 — FSOS Sticky Sidebar Viewport & Shell Geometry (2026-09-23)

### Sticky Sidebar Viewport & Independent Shell Scrolling
- **App Shell Viewport Geometry**:
  - Replaced the window-level scroll model on the root container (`min-h-screen overflow-x-hidden`) with a strict viewport shell (`h-screen overflow-hidden`).
  - Restored full viewport height pinning (`h-screen sticky top-0`) to the Navigation Sidebar, ensuring it spans 100% of the viewport height across all themes and modules.
  - Pinned the bottom Hamster Sync indicator at the bottom of the viewport at all times.
- **Independent Main-Content Scrolling**:
  - Encapsulated header and main view within an independent viewport container (`h-screen overflow-hidden`) where `<main>` scrolls smoothly on its own.
  - Eliminated document-level scrolling leaks when browsing long modules (e.g. Release History / MHC Autopilot).
  - Preserved approved v3.5.6 standalone Hamster presentation and unclipped popover geometry.

## v3.5.6 — FSOS Standalone Cloud Sync Hamster & Popover Geometry (2026-09-23)

### Standalone Hamster Presentation & Popover Viewport Fix
- **Standalone Hamster Visual**:
  - Removed the surrounding square border, background box, and padding container from around the hamster wheel.
  - Sized up the hamster wheel diameter to 64px for a bold, crisp, natural standalone presentation in the sidebar footer.
  - Maintained full clickability with smooth micro-interaction feedback (`hover:scale-105 active:scale-95`).
  - Preserved authentic real-state reactions: green static rest for synced/idle, orange dynamic running animation for active sync.
- **Unclipped Sync Popover Geometry**:
  - Center-aligned the popover directly above the hamster with exact 224px width bounds.
  - Eliminated any sidebar clipping or horizontal overflow, providing clean 8px lateral clearance on both sides of the 240px navigation rail.
  - Full visibility preserved for Current Device, Switch Device Presets, Last Cloud Sync, Pending Queue, Cloud D1 Replica, and Sync Now actions.

## v3.5.5 — FSOS Cloud Sync Compact Hamster UI (2026-09-22)

### Compact Cloud Sync Presentation & Hamster Wheel Indicator
- **Compact Hamster Visual Indicator**:
  - Replaced the large bottom sync button and redundant "Cloud Sync / Synced" and "FSOS Core • Ready" text with a sleek, compact hamster wheel indicator.
  - **Synced/Idle State**: Hamster renders in crisp emerald-green palette in static rest mode.
  - **Active Syncing State**: Hamster seamlessly transitions to orange coat and dynamically runs inside the revolving wheel/spoke mechanism using the authoritative CSS animation spec.
  - **Real State Driven**: Bound directly to live sync engine status (`synced`, `syncing`, `pending`, `offline`).
- **Full Sync Information Popover**:
  - Clicking the hamster reveals the compact, sidebar-constrained control popover.
  - Seamlessly maintains all existing critical sync data: Current Device (with inline edit), Switch Device View presets (HOME-PC, STM-LAPTOP), Last Cloud Sync timestamp, Pending Queue count, Cloud D1 Replica count, and the manual "Sync Now" trigger.
  - Guaranteed zero sidebar expansion, zero horizontal clipping, and no obstruction of navigation items.
- **Theme & Motion Harmony**:
  - Precision, Lumen, and Aero theme compatible with full `prefers-reduced-motion` instantaneous fallback.

## v3.5.4 — FSOS Autopilot Live Kinetic Progress Path & Theme Identity (2026-09-22)

### Autopilot Schedule Live Progress Path & Distinct Theme Visuals
- **Live Continuous Progress Path**:
  - Transformed the vertical schedule connector into an authentic live progression track.
  - As Autopilot advances through activities, the progress line visibly fills along the vertical path and an animated kinetic energy beacon travels along the track to the target step.
  - Reverse navigation smoothly retracts and travels upward along the track in natural reverse.
- **Step Activation & Settlement**:
  - Target steps activate with a pulsing diode beacon and theme-specific high-contrast typographic focus upon progress arrival.
  - Departed steps settle smoothly into their completed state (`✓`) with an organic settlement transition.
  - Removed whole-row beam overlays to return focus to the actual traveling progress path.
- **Theme-Specific Visual Identities**:
  - **Precision**: Technical amber laser energy beam, warm graphite typography (`#F3F4F6` / `#F59E0B`), crisp diode pulse beacon, and precision border styling.
  - **Lumen**: Atmospheric deep obsidian with luminous cyan neon energy path (`#38BDF8`), radiant starlight beacon, and glowing text contrast.
  - **Aero**: Crisp daylight airy aesthetic with sky-blue energy stream (`#0284C7`), vivid azure badges, and high-readability daylight typography.
- **Strict Scope & Motion Standards**:
  - 100% preservation of all step numbers, hierarchy, schedule content, and full `prefers-reduced-motion` instantaneous fallback.

## v3.5.3 — FSOS Autopilot Live Kinetic Progress Rail (2026-09-22)

### Autopilot Schedule Rail Animated Progression
- **Kinetic Active Progression Capsule**:
  - Implemented shared `layoutId="mhcAutopilotActiveHighlighter"` physical glide motion that visually travels along the schedule index when Autopilot moves between steps.
  - Added directional traveling energy beam tracers that sweep downward during forward progression and upward during reverse navigation.
- **Theme-Adaptive Energetic Aura**:
  - **Precision**: Amber technical laser aura (`rgba(245, 158, 11, 0.7)`), calibrated diode beacon, and glowing active borders.
  - **Lumen**: Deep sky/cyan neon luminous beam (`rgba(56, 189, 248, 0.8)`), starlight horizon ripple, and luminous glowing beacon.
  - **Aero**: Radiant daylight sky azure stream (`rgba(14, 165, 233, 0.7)`), soft atmospheric depth, and daylight specular ripple.
- **Hierarchical Conduit & Step Settlement**:
  - Active branch tree spines illuminate with an energetic conduit trace when a child sub-item is active.
  - Arriving steps smoothly pulse into life with a living radar beacon, while departed steps settle crisply into their completed state (`✓`).
- **Strict Scope Preservation & Reduced Motion**:
  - 100% preservation of all existing step numbers, wording, hierarchy, schedule data, and Autopilot state engine. Full `prefers-reduced-motion` instantaneous fallback.

## v3.5.2 — FSOS Sidebar Sync Relocation & Header Declutter (2026-09-22)

### Sync Status Indicator Relocation
- **Relocated Sync Indicator from Header to Sidebar Footer**:
  - Moved the `SyncStatusIndicator` out of the Top Bar / Header to eliminate unnecessary header clutter and streamline the top bar navigation experience.
  - Positioned the Sync status cleanly at the bottom of the Sidebar above system status, providing continuous visibility of Cloud Replica Sync state.
- **Enhanced Popover Placement Flexibility**:
  - Added `placement="top-left"` and `fullWidth` support to `SyncStatusIndicator` ensuring the sync control popover opens smoothly upwards above the sidebar footer without screen clipping.
  - Preserved 100% of the underlying `SyncEngine` state, real-time subscriptions, manual sync trigger, device switching, and D1 server replica metrics.

## v3.5.1 — FSOS Full-Bleed Theme Presentation & Switch Control (2026-09-22)

### Theme Selector Visual Composition & Positioning Correction
- **Resolved Container Positioning Bug**: Corrected conflicting `absolute ... relative` positioning declarations in `ThemeThumbnail.tsx`, allowing Precision, Lumen, and Aero artworks to expand to 100% full-bleed height and width without clipping.
- **Settings Full-Bleed Food-Card Presentation**:
  - Transformed Settings theme cards into full-bleed visual canvases showcasing the entire atmospheric depth of Precision, Lumen, and Aero.
  - Positioned category chips at top-left with frosted translucent blur and clean glass bottom info panels displaying bold theme names and glowing Active/Select buttons.
- **Header 3-Theme Switch Control**:
  - Replaced thumbnail-style switcher with a dedicated compact 3-theme pill switch (`HeaderThemeSwitch.tsx`).
  - Implemented smooth sliding active pill indicator with rich depth shadows, ambient glow, and distinct miniature atmospheric glyphs for Precision, Lumen, and Aero.
- **Strict Logic & Workflow Continuity**:
  - 100% preservation of `ThemeContext`, `ThemeMode`, active theme state, localStorage persistence, and backend/frontend workflows.

## v3.5.0 — FSOS Visual-First Theme Identity Refresh (2026-09-22)

### Theme Selector Visual-First Identity Refresh
- **Consistent Visual-First 3-Theme Treatment**: Replaced text-heavy cards and generic page thumbnails across both Header and Settings with a unified, visual-first identity representation:
  - **Precision**: Deep industrial graphite canvas (`#111315`), fine technical grid markings, calibrated reticle crosshairs, and glowing amber laser focal diode (`#F59E0B`).
  - **Lumen**: Deep obsidian night canvas (`#07080A`), volumetric radial dusk horizon, crisp multi-point star sparkles, and luminous cyan crescent/horizon arc with cyan drop glow (`#38BDF8`).
  - **Aero**: Radiant daylight sky gradient, organic multi-layered puffy cumulus clouds with atmospheric blue shadow underbellies, and glowing golden sun disc (`#FBBF24` / `#FEF08A`) with daylight specular reflections.
- **Settings Theme & Visual Identity Card Refresh**:
  - Removed dense descriptive text paragraphs from the Settings theme selector cards.
  - Rendered widescreen atmospheric preview capsules for each theme alongside clean theme names and active status indicators.
- **Header Pilot Switcher Visual Refresh**:
  - Updated Header theme switcher with atmospheric theme pills featuring rich atmospheric elements (amber laser reticle, starry cyan horizon, sunlit clouds).
- **Strict Scope & Logic Preservation**:
  - 100% preservation of `ThemeContext`, `ThemeMode`, `activeTheme`, `setTheme`, localStorage persistence, and shader rendering pipelines. Zero regressions across domain workflows.

## v3.4.10 — FSOS Aero Procedural Cloud Atmosphere (2026-09-22)

### Aero Procedural Animated Daylight Cloud Atmosphere
- **Living Daylight Sky & Procedural Cloud Formations**: Replaced the subtle air-current shader with a rich, single-pass procedural cloud atmosphere in `CanvasShaderBackground.tsx`.
- **Multi-Layer Atmospheric Depth & Parallax**:
  - **Volumetric Cumulus Masses**: Lower-altitude, billowy cloud formations driven by 4-octave rotational FBM and dual-domain warping, generating natural continuous deformation and slow drift ($V_1 = (0.013, 0.0025)$).
  - **High-Altitude Cirrus Wisps**: Parallax-drifting wispy cirrus layer ($V_2 = (0.022, -0.004)$) elongated along prevailing upper-atmosphere wind vectors.
- **Sunlit Volumetric Shading**: Directional solar lighting with soft tropospheric blue ambient shadows (`#A8D5F7`), dense vapor white centers (`#F0F9FF`), and radiant sunlit highlights (`#FFFFFF`) against a daytime azure sky (`#2E8AE0` / `#60B8F2` / `#C2E3FA`).
- **Pristine Foreground UI Legibility**: Cloud density and lighting calibrated to provide an unmistakable visual identity in open canvas areas while preserving 100% readability of dark text, tables, telemetry, and frosted glass cards.
- **Strict Scope Isolation**: Precision and Lumen shaders, theme logic, LoginBackground, Header, Sidebar, and domain services remain completely unchanged.

## v3.4.9 — FSOS Living Procedural Atmospheric Shaders (2026-09-22)

### Authenticated Application Canvas Procedural WebGL Shaders
- **Genuinely Animated Procedural WebGL Background**: Integrated a lightweight, single-pass GPU fragment shader behind the authenticated application workspace that delivers living, continuous atmospheric motion tailored to each theme identity.
- **Three Distinct Theme Shader Identities**:
  - **Precision**: Coherent quantum lattice and anisotropic phase topography in deep slate-graphite (`#111315`), with orthogonal phase contours, micro-geometric interference harmonics, and 3% amber coherence highlights.
  - **Lumen**: Volumetric horizon cyan dusk wave drift over deep obsidian canvas (`#07080A`), featuring smooth sinusoidal horizon breathing, rolling curved dusk wave fronts, and ethereal sky-cyan twilight gradients.
  - **Aero**: Stratospheric daylight air mass streamlines over luminous tropospheric azure sky (`#E0F4FD` / `#BAE6FD` / `#7DD3FC`), featuring continuous multi-frequency air currents, prismatic sunlight dispersion, and specular daylight ripples.
- **Visual Subordination & Readability**: Engineered low-contrast relative luminance curves ensuring foreground tables, telemetry, forms, navigation chrome, and technical cards maintain pristine 100% readability.
- **Field-Hardware Performance & Battery Efficiency**:
  - Single fullscreen quad pass using analytical GLSL math.
  - Automatic render throttling/pausing when the document or tab is hidden (`document.hidden`).
  - Device pixel ratio capped at 1.25 for optimal mobile and field-service laptop GPU efficiency.
  - Full respect for reduced-motion preferences (`prefersReducedMotion`), transitioning into a tranquil slow baseline drift.
- **Strict Scope Isolation**: Zero modifications to LoginBackground, Header, Sidebar, theme switcher logic, PDF generation pipeline, machine health algorithms, or application data persistence.

## v3.4.8 — FSOS Theme Switcher Thumbnail Redesign (2026-09-22)

### Header Theme Switcher Visual Thumbnail Redesign
- **Visual Theme Previews**: Replaced plain text switcher labels ("Precision", "Lumen", "Aero") in the Header with authentic, pixel-perfect miniature UI thumbnails depicting the visual language of each theme before reading any text.
- **Equal-Width RubberSegment Physics**: Implemented `equalSlots` geometry on `RubberSegment`, ensuring Precision, Lumen, and Aero slots share identical dimensions and aspect ratios with animated rubber sliding thumbs and reduced-motion support.
- **Authentic Theme Identity Previews**:
  - **Precision Thumbnail**: Dark industrial graphite canvas (`#111315`), technical grid lines, amber laser focal crosshair, and cool slate metadata.
  - **Lumen Thumbnail**: Deep obsidian dusk canvas (`#07080A`) with luminous cyan radial horizon illumination (`#38BDF8`), edge hairlines, and glowing glass accents.
  - **Frutiger Aero Thumbnail**: Luminous azure daylight sky gradient, organic translucent glass surfaces, specular reflection highlights, and vibrant sky blue accents.
- **Full Accessibility & Semantic Retention**: Maintained semantic `aria-label` names ("Precision Theme", "Lumen Theme", "Frutiger Aero Theme"), radio group roles, and `aria-checked` states for screen readers and keyboard navigation (Arrow keys, Home, End).
- **Domain Logic & Persistence Isolation**: 100% preservation of ThemeContext persistence (`fso_theme_mode`), theme definitions, semiconductor algorithms, and PDF generation pipelines.

## v3.4.7 — FSOS Core Chrome Theme Identity (2026-09-22)

### Core Chrome & Surface Visual Differentiation
- **Interactive Chrome Visual Identity**: Unmistakably differentiated the four highest-frequency interactive surfaces (Main Sidebar, MHC Autopilot Navigator, Main Header, and Login Experience) across Precision, Lumen, and Aero themes while strictly preserving layout geometry, navigation structures, and domain logic.
- **Login Experience Multi-Theme Support**: Completely eliminated binary `isDark` branching in `LoginPage` and `LoginBackground`. Precision renders the disciplined dark engineering grid with amber beam; Lumen renders deep dusk graphite glass with cyan horizon illumination and atmospheric radial glows; Aero renders translucent daylight sky glass, organic specular reflections, and sky blue accents.
- **Main Sidebar Expression**: Lumen sidebar features dusk graphite radial horizon illumination, specular borders, and luminous cyan active indicators; Aero sidebar features translucent daylight sky glass with blur/saturation depth, crisp border contours, and glossy active pills; Precision remains the authoritative dark engineering console.
- **Main Header & Popovers**: Styled header bars and popover menus with theme-specific materials — Lumen dusk horizon edge light line (`::after`) with specular button highlights; Aero translucent sky glass with organic border styling.
- **MHC Autopilot Navigator**: Enhanced schedule index and activity progress trees with dusk engineered-glass depth in Lumen and glossy daylight capsules in Aero.
- **Strict Logic & PDF Pipeline Isolation**: 100% preservation of all semiconductor inspection algorithms, laser calculations, AGC/stage calibrations, machine passport records, and official PDF rendering stationery.

## v3.4.6 — FSOS Lumen Official Report Toolbar (2026-09-22)

### Lumen Official MHC PDF Report Toolbar & Controls
- **Engineered Glass Horizon Surface**: Implemented the signature Lumen dusk graphite radial surface (`radial-gradient(130% 120% at 50% 100%, rgba(38, 52, 75, 0.70) 0%, rgba(14, 19, 28, 0.96) 65%)`) with luminous horizon highlight line (`::after`), deep shadow depth, and top specular hairline.
- **Lumen Typography & Icon Luma**: Restored high-clarity dusk white headings (`#F8FAFC`), muted cyan-slate metadata (`#94A3B8`), and luminous cyan icon badge highlights (`#38BDF8`).
- **Engineered Secondary Controls**: Restyled Edit Metadata, Zoom, Hide Empty, Print, and Back controls using translucent dusk graphite gradient fills, specular hairline highlights, and amber/cyan active illumination.
- **Luminous Emerald PDF Action**: Preserved the green color identity of the "Download Official MHC PDF" button with Lumen specular edge lighting, emerald-to-mint gradient depth, and tactile click response.
- **Strict Theme & PDF Pipeline Isolation**: Precision, Aero, and other themes remain completely untouched and distinct. Zero alterations made to PDF generation coordinates, telemetry, or report layout.

## v3.4.5 — FSOS Frutiger Aero Official Report Toolbar (2026-09-22)

### Frutiger Aero Official MHC PDF Report Toolbar & Controls
- **Toolbar Surface Normalization**: Transformed the Official MHC PDF Report toolbar in Frutiger Aero mode to the authentic Aero light/glass surface (`linear-gradient(180deg, rgba(255, 255, 255, 0.88) 0%, rgba(230, 246, 255, 0.75) 100%)`) with frosted blur, specular highlights, and pure organic border contours.
- **Deep Navy Text Hierarchy**: Restored high-contrast dark-blue text hierarchy (`#0F2942` for document title and `#2C5270` for report metadata and machine serial details) on the Aero surface.
- **Icon & Badge Contrast Refinement**: Updated the document icon container and FSOS official report badge with luminous sky-blue backgrounds (`#E0F2FE`), sharp cyan borders, and deep blue typography (`#0284C7`, `#0369A1`).
- **Aero Controls & Interactive State System**: Adapted Edit Metadata, Zoom (+ / - / percentage), Hide Empty/Showing All, Print, and Back controls to the glossy Aero secondary control treatment with tactile hover/press states and dedicated amber/cyan active indicators.
- **Glossy Emerald PDF Action**: Preserved the green color identity of the primary "Download Official MHC PDF" button with high-contrast specular lighting, vibrant gradient layering (`#4ADE80` to `#15803D`), and crisp white typography.
- **Strict Theme & PDF Engine Isolation**: Dark themes (Precision, Lumen, Aether, Prism, Forge, Cairn) remain 100% untouched and pixel-identical. Original PDF generation stationery, coordinates, dynamic field mapping, and telemetry logic remain strictly unchanged.

## v3.4.4 — FSOS MHC Autopilot Aero Visual Consistency (2026-09-22)

### MHC Autopilot Aero Consistency Across Activities 01–10
- **Activity Internal Surface Normalization**: Converted all legacy dark/gray and ternary-hardcoded surfaces across Activities 01 through 10 (`MhcLaserHoursActivity`, `MhcLaserPowerActivity`, `MhcBeamProfileActivity`, `MhcProductProcessActivity`, `MhcStageCalibrationActivity`, `MhcAgcActivity`, `MhcReadinessReviewActivity`, `MhcOpticalMechanicalActivity`, `MhcFocusOptimizationActivity`, `MhcTemperatureEvidenceActivity`, `MhcRecommendationsSparePartsActivity`, and `MhcWorkstationSetupFlow`) to the unified semantic theme system (`bg-[var(--surface-surface)]`, `bg-[var(--surface-raised)]`, `bg-[var(--surface-workspace)]`, `border-[var(--border-default)]`, `border-[var(--border-subtle)]`, `text-[var(--text-primary)]`, `text-[var(--text-secondary)]`, and `text-[var(--text-muted)]`).
- **Complete Elimination of FSOS Dark Islanding**: Removed all legacy `bg-slate-900`, `bg-slate-950`, and `border-slate-800` hardcoded blocks within measurement cards, disposition controls, baseline spec summaries, and calculation panels.
- **Glass Specular & Atmospheric Transmission**: In Frutiger Aero mode, all internal activity panels now inherit the atmospheric background, soft frosted translucency, crisp top specular highlights, and clean typography matching the Settings Theme preview.
- **Strict Logic & PDF Pipeline Isolation**: 100% preservation of all semiconductor physics equations, laser telemetry calculators, Stage/AGC verification logic, inspection milestones, Machine Passport data, and official PDF rendering stationery.

## v3.4.3 — FSOS Frutiger Aero Autopilot Visual System Propagation (2026-09-22)

### Frutiger Aero Autopilot Propagation
- **MHC Autopilot Shell & Workstation Normalization**: Normalized `MhcAutopilot` workstation container, outer backdrop, and review/discard modals to semantic theme classes (`bg-surface`, `bg-raised`, `bg-workspace`, `border-theme-default`, `border-theme-strong`, `rounded-card`, `shadow-theme-modal`), completely eliminating hardcoded light branches.
- **Activity Host Container & Component Alignment**: Refactored `MhcWorkstationActivityHost` main inspection container, progress tracker, step navigation bar, activity 10 final buyoff container, and fallback inspection wrappers to semantic surface tokens.
- **Aero Glass CSS Propagation**: Extended Frutiger Aero CSS definitions in `src/index.css` to cover arbitrary surface variable classes (`bg-[var(--surface-surface)]`, `bg-[var(--surface-raised)]`, `bg-[var(--surface-workspace)]`), border tokens, and the Autopilot workstation backdrop with authentic translucent frosted glass and specular highlights.
- **Strict Domain Logic & PDF Isolation**: Maintained 100% preservation of all semiconductor inspection workflows, laser calculations, AGC/stage calibrations, machine passport data structures, and official PDF generation pipelines.

## v3.4.2 — FSOS Frutiger Aero Visual System & Readability Correction (2026-09-21)

### Frutiger Aero Visual System & Readability Correction
- **Machine Passport Shell Cleanup**: Removed JSON Import and Export controls from the Machine Passport shell header while preserving all laser lifecycle domain calculation engines and fleet navigation capabilities.
- **MHC Autopilot & Machine Selector Theme Refinement**: Refactored `MhcMachineSelector` and Autopilot activity modules from hardcoded dark slate backgrounds to semantic theme tokens (`bg-surface`, `bg-canvas`, `border-theme-default`, `text-theme-primary`, `text-theme-secondary`, `text-theme-muted`), ensuring seamless translucent glass aesthetic in Frutiger Aero mode.
- **Form Select & Input Legibility**: Standardized native `<select>` and `<option>` styling across MHC History, MHC Autopilot, and Machine Passport with solid white option backgrounds (`#FFFFFF`) and dark slate text (`#0F2942`) for WCAG AA compliance.
- **Translucent Glass Surface Depth**: Aligned all cards, modals, and toolbars to the Frutiger Aero visual language featuring sky-blue daylight gradients, organic border radiuses, and crisp specular highlights.
- **Strict Logic & PDF Pipeline Isolation**: Fully preserved all semiconductor inspection metrics, laser engine computations, Stage/AGC calibration algorithms, and official PDF generation routines.

## v3.4.0 — FSOS Frutiger Aero Theme System (2026-09-21)

### Frutiger Aero Visual Theme Implementation
- **First-Class Atmospheric Sky Canvas**: Implemented the signature Frutiger Aero fixed daylight sky atmospheric gradient (`radial-gradient(130% 90% at 50% -10%, #FFFFFF 0%, #E3F5FD 30%, #A2D8F6 65%, #6EB9E5 100%)`) with clean ambient lighting and organic depth.
- **Translucent Aero Glass Surfaces**: Created high-clarity translucent glass panels, header, sidebar, cards, and modal dialogs with specular top highlights (`inset 0 1px 0 0 rgba(255, 255, 255, 0.95)`), backdrop blur (`blur(16px)`), and organic soft rounded geometry (`rounded-card`, `rounded-modal`).
- **Glossy Skeuomorphic Buttons**: Designed high-gloss specular primary buttons featuring Aqua/Azure gradients, crisp inset highlights, and tactile `active:scale-95` press micro-interactions.
- **Form & Input Aero Refinement**: Added glassy input, select, and textarea styling with subtle inset drop-shadows and luminous aqua focus rings.
- **Unified Luminous Bar Integration**: Added dedicated Frutiger Aero styling to the unified `ProgressBar` system with translucent tracks and 3D specular capsule gradient fills.
- **Theme Registration & Management**: Fully registered `aero` (`Frutiger Aero`) in `NamedTheme`, `themePalettes`, `ThemeContext`, and the Settings Theme Selector.
- **Strict Logic & Domain UX Preservation**: Guaranteed 100% preservation of all semiconductor inspection algorithms, laser physics models, MHC Autopilot workflows, Machine Passport data, and official PDF generation pipelines.

## v3.3.5 — FSOS Lumen Accent Cleanup & Unified Luminous Bar System (2026-09-21)

### Lumen Accent Cleanup & Unified Luminous Bar System
- **Release History Accent Cleanup**: Replaced all decorative green accents in Release History (`ChangelogModule.tsx`) with the authoritative Lumen cool cyan/ice brand palette (`text-cyan-400`, `bg-cyan-500/15`, cyan border highlights, and specular search focus). Preserved semantic status distinction where green strictly represents operational success.
- **Unified Luminous Bar System (`ProgressBar.tsx`)**: Created a standardized, theme-aware progress bar component with recessed dark-groove tracks, subtle inset bevels, and luminous gradient fills across all semantic variants (`primary` cyan, `success` emerald, `warning` amber, `danger` rose, `neutral` slate).
- **Comprehensive Bar System Migration**:
  - **HealthGauge**: Standardized gauge bar track and fill to use the unified `ProgressBar` component.
  - **Start Page**: Refactored Daily Work focus card operational readiness progress bar to use the unified luminous bar.
  - **Machine Passport**: Converted both the primary laser rated-life consumed bar and secondary laser head life margin bars to the unified luminous bar system with full status-aware threshold coloring.
  - **Machine Passport Table View**: Upgraded operating hours life remaining bar to the unified component.
  - **Customer Contracts**: Standardized SLA MHC service-day consumption progress bar.
  - **Two-Year Service Planner**: Unified mini capacity SLA utilization bars.
  - **Operational Analytics**: Upgraded both the multi-segment verdict breakdown bar and monthly activity session timeline bars to use the unified luminous bar architecture.
- **CSS Architecture**: Added global `.lumen-bar-track` and `.lumen-bar-fill-*` utility classes in `src/index.css` with dedicated Lumen dusk theme styling.
- **Strict Logic & Calculation Preservation**: Zero modifications made to laser physics models, Recharts chart geometry, PDF rendering pipeline, MHC Autopilot engines, or database structures.

## v3.3.4 — FSOS MHC History & Reports Lumen Coverage Pass (2026-09-21)

### MHC History & Reports Lumen Alignment
- **MHC History Visual Coverage**: Brought MHC History & Reports and all inspection detail sub-tabs into the established Lumen "Engineered Glass at Dusk" visual language.
- **Deep Obsidian Surfaces & Hairlines**: Refactored session list cards, search/filter toolbars, header controls, telemetry chips, and detail sub-tabs to use semantic theme tokens (`bg-surface`, `bg-canvas`, `border-theme-default`, `shadow-theme-card`).
- **Sub-Tab Visual System Consistency**:
  - **Overview Tab**: Restyled execution matrix, lifecycle metadata cards, laser hours telemetry tiles, and machine passport link chips with specular hairlines and high-contrast typography.
  - **Findings Tab**: Updated head inspection cards, condition tags, action recommendation badges, stage calibration metrics, AGC dynamic index alignment cards, and photo zoom modals to Lumen material specs.
  - **Evidence Tab**: Aligned media attachment cards, thumbnail hover states, and enlarged modal viewports to deep graphite obsidian depth.
  - **Recommendations Tab**: Upgraded engineer observations panel, customer feedback callouts, next inspection date banner, and spare parts inventory data table.
  - **Report & Buyoff Tabs**: Maintained full PDF rendering engine isolation while styling surrounding document action bars, buyoff status ribbons, and signature audit panels.
- **Strict Architecture & Data Preservation**: No changes made to MHC calculation logic, filtering/sorting routines, session selection, PDF generation, or Autopilot workflows.

## v3.3.3 — FSOS Lumen Visual Coverage Alignment Pass (2026-09-21)

### FSOS Lumen Visual Coverage Alignment Pass
- **Closed Remaining Lumen Visual Coverage Gaps**: Audited and closed remaining visual discrepancies in Machine Passport, Customers & Plants, My Profile, Settings (Regional, Application, Backup & Restore, Workspace Maintenance, About FSOS), and customer hierarchy views.
- **Machine Passport & Flip Cards**: Integrated theme semantic tokens and luminous specular borders across all 7 inspection cards, machine identity headers, and engineering inspection sub-views in Lumen mode.
- **Customers & Plants Hierarchy**: Refactored customer master-detail lists, site hierarchy panels, plant and line cards, and asset transfer flows to fully inherit the deep graphite obsidian glass aesthetics with cyan indicators.
- **My Profile & Service Coverage**: Upgraded operator identity banner, contact details cards, cleanroom certifications, and interactive service coverage plant pins to utilize Lumen specular depth and luminous accents.
- **Settings Sub-Panels Restyled**: Aligned Regional standards, Application modes, Backup & Restore dropzones, and Workspace Maintenance diagnostics to native Lumen glass surfaces and semantic border tokens.
- **Protected Engineering Architecture**: Kept all MHC calculation algorithms, laser power records, beam profile mathematics, temperature telemetry, PDF generation engines, and customer fleet data logic strictly intact.

## v3.3.2 — FSOS Lumen Application-Wide Coverage Pass (2026-09-21)

### FSOS Lumen Application-Wide Coverage Pass
- **Application-Wide Lumen Consistency**: Audited and confirmed unified "Engineered Glass at Dusk" visual language across all 11 FSOS sidebar destinations (Daily Work, MHC Autopilot, MHC History & Reports, Machine Passport, Customers & Plants, Contracts, Operational Analytics, My Profile, Engineers Directory, Settings, Release History).
- **Top Header & Sync Status Refinement**: Transformed SyncStatusIndicator and top status bar controls into cohesive obsidian/graphite glass components with refined luminous badges, cyan connection telemetry, and seamless popover depth.
- **Engineers Directory & Profile Modules**: Upgraded table structures, filter rows, search inputs, operator telemetry chips, and profile editor cards with Lumen radial surfaces, hairline borders, and luminous focus outlines.
- **Operational Analytics & Fleet Workspaces**: Unified analytics segmented mode selectors, trajectory charts, customer hierarchy panels, and SLA contract milestone cards under consistent Lumen surface and hairline geometry.
- **Comprehensive CSS Fallback Mappings**: Expanded `[data-theme="lumen"]` style overrides in `src/index.css` to comprehensively capture legacy dark classes across all shared components, modals, dropdowns, tables, and form inputs.
- **Protected Engineering Logic Intact**: Strict preservation of all engineering calculation engines, PDF generation (`MhcFullPdfRenderer.tsx`), Machine Passport 3D flip-card mechanics, and MHC Autopilot workflows.

## v3.3.1 — FSOS Theme Visual Palettes & Lumen Visual Transformation (2026-09-20)

### FSOS Theme Visual Palettes & Lumen Transformation
- **Lumen Corrective Visual Transformation**: Transformed Lumen into a distinctly recognizable "engineered glass at dusk" material aesthetic with deep graphite obsidian canvas (`#070A0F`), atmospheric top dusk radial spotlight and bottom-lit horizon glow.
- **Luminous Material Hierarchy**:
  - **Atmospheric Canvas**: Fixed environmental background depth with dusk radial gradients and luminous sky-cyan horizon reflection.
  - **Sidebar Surface**: Deep engineered graphite glass (`linear-gradient(180deg, rgba(13, 19, 29, 0.96) 0%, rgba(8, 12, 18, 0.98) 100%)`) with luminous right hairline border and illuminated active navigation pills (`rgba(56, 189, 248, 0.16)` inset gradient, glowing cyan indicator).
  - **Header & Modals**: Layered dusk graphite surfaces with specular top and bottom rim highlights and elevated backdrop blur.
  - **Card Geometry & Specular Rim**: Layered raised graphite card surfaces with specular top edge highlight (`inset 0 1px 0 0 rgba(186, 230, 253, 0.22)`), deep obsidian ambient drop shadow, and reactive edge lift on interaction.
  - **Form Controls & Tabular Depth**: Translucent obsidian inputs with cyan focus auras, dark gradient `thead` with luminous hairline dividers, and interactive row hover illumination.
- **Six Distinct Visual Identities**: Full theme token specifications and CSS custom variables for Precision, Lumen, Aether, Prism, Forge, and Cairn.
- **Header Switcher & Multi-Theme Architecture**: Seamless instant switching between Precision and Lumen via header RubberSegment and settings picker.
- **Protected Systems Intact**: Left authoritative MHC PDF generator (`MhcFullPdfRenderer.tsx`), Machine Passport, Telemetry charts, and MHC Autopilot completely untouched.

## v3.3.0 — FSOS Multi-Theme Foundation (2026-09-20)

### FSOS Multi-Theme Foundation
- **Named Multi-Theme Model**: Refactored `ThemeContext` and design tokens to support 6 named visual identities (`precision`, `lumen`, `aether`, `prism`, `forge`, `cairn`) alongside OS-adaptive `system` sync.
- **Authoritative Root Data Attribute**: Configured global synchronization via single authoritative `data-theme` attribute on `document.documentElement` (`data-theme="precision"`, etc.).
- **Semantic Token Architecture**: Extended `src/theme/tokens.ts` with `themePalettes` providing canvas, workspace, surface, elevated raised, overlay, borders, typography, accent, focus, and operational status tokens for all named themes.
- **Scoped CSS Custom Variables**: Defined comprehensive semantic CSS custom variables for `[data-theme="precision"]`, `[data-theme="lumen"]`, `[data-theme="aether"]`, `[data-theme="prism"]`, `[data-theme="forge"]`, and `[data-theme="cairn"]` in `src/index.css`.
- **Backward Compatibility Preserved**: Maintained `effectiveTheme` (`'dark' | 'light'`), `isDark` boolean state, and root `.dark`/`.light` classes for seamless compatibility across existing modules.
- **Settings Selection Integration**: Integrated clean theme picker in `SettingsModule` enabling instant switching across all named visual themes with `localStorage` persistence.
- **Protected Systems Intact**: Left MHC PDF generator (`MhcFullPdfRenderer.tsx`), Machine Passport visual system, Temperature telemetry, and MHC Autopilot completely untouched.

## v3.2.4 — Machine Passport Laser Power Hero Correction (2026-09-20)

### Machine Passport Laser Power Hero Correction
- **Laser Power Visual Semantics Corrected**: Replaced the laser-hour counter hero on the Laser Power flip-card back with a dedicated optical laser power visualization in Watts (W).
- **Dual Head Optical Power & Pulse Waveform Display**: Prominently highlights measured power in Watts (`HEAD A`, `HEAD B`) paired with high-frequency 50kHz optical pulse train waveforms, calibrated target power reference (`15.0 W NOM`), and calibration status.
- **Authoritative Data Binding**: Directly bound to actual `machine.laserPowerRecords` and `machine.mhcSpecs.laserPower` data sources without synthetic data generation.
- **Preserved System Architecture**: Retained the approved card back layout, bottom-anchored "→ Open" button, all other 6 card heroes, front faces, and workspace routing without changes.

## v3.2.3 — Machine Passport Flip Card Final UI Polish (2026-09-20)

### Machine Passport Flip Card Final UI Polish
- **Anchored All Open Buttons to Exact Bottom Position**: Structured card back layout with strict flex column distribution (`flex-shrink-0` header, `flex-1` centered hero visual area, `flex-shrink-0` fixed action bottom) ensuring all 7 card Open buttons align to the identical vertical position across both grid rows.
- **Shortened Action Label to Concise Universal Treatment**: Standardized action button on all 7 cards to "→ Open" with primary styling and monospaced typography, removing verbose subject-specific titles.
- **Cleaned Back-Face Header & Text**: Removed "WORKSPACE PREVIEW" and redundant "Return to Overview" link, using clean direct subject identities in the header for optimal spatial clarity.
- **Preserved Approved Hero Visuals**: Retained all approved visual hero previews, front faces, Machine Table layout, and subsystem workspace routing without regressions.

## v3.2.2 — Machine Passport Flip Card Hero Previews (2026-09-20)

### Machine Passport Flip Card Hero Previews
- **Transformed Card Backs into Bold Visual Heroes**: Replaced multi-metric "mini-dashboard" layouts across all 7 Machine Passport card backs with clean, high-contrast subsystem hero visuals.
- **Lifecycle & Health Circular Arc**: Centered high-contrast radial gauge arc visual with primary health percentage and minimal LMS runtime laser hour metadata.
- **Temperature Thermal Waveform**: Dedicated 60-minute cooling loop telemetry waveform graph dominating the card back with target reference guides and current readout.
- **Laser Power & Head Hours**: High-impact dual digital hour meters (`HEAD A`, `HEAD B`) paired with optical power calibration and 50kHz emission verification.
- **Beam Profile Viewport**: Large CCD camera sensor viewport displaying the high-resolution beam profile capture with optical reticle crosshair overlay and spatial mode verification.
- **Focus Optimization Rayleigh Curve**: Parabolic optical focal waist beam envelope visualization highlighting the calibrated optimal focal plane (`Pos 0`).
- **Product & Process Micro-Via SEM**: Substrate cross-section diagram showing laser-machined trapezoidal micro-via geometry with top/bottom diameter callouts.
- **Recommended Parts Blueprint**: Circular optical window CAD schematic with integrated wear meter and remaining service days.
- **Strict Visual Discipline**: Minimalist typography, restrained contrast, zero rainbow palettes, and no artificial cards or synthetic dashboards.

## v3.2.1 — Machine Passport Flip Card Workspace Preview Enhancement (2026-09-20)

### Machine Passport Flip Card Workspace Preview Enhancement
- **Replaced Text-Heavy Back Faces with Compact Workspace Previews**: Upgraded the back faces of all 7 Machine Passport cards from static specification text into authentic, compact visual/data previews ("glimpses inside") derived strictly from authoritative machine records and telemetry models.
- **Lifecycle & Health Preview**: Displays overall operating health score alongside multi-head running hours vs. rated life metrics (`hoursUsed / ratedHours`) and compact lifecycle bars with last MHC inspection verification.
- **Temperature Thermal Telemetry Preview**: Displays target/cooling specifications (`targetTempCelsius ± tempToleranceCelsius`), multi-channel stability status, and a crisp miniature SVG trend sparkline with Min/Avg/Max temperature readouts.
- **Laser Power & Hours Preview**: Directly displays multi-head laser running hours (`HEAD A: 642 h`, `HEAD B: 642 h`) paired with external power meter readings (`15.2 W`, `15.0 W @ 50kHz`), target tolerances, and calibration pass verdicts.
- **Beam Profile Evidence Preview**: Renders paired beam capture thumbnails (Source vs. Flat Top) with measured beam diameters (`Ø 3.50 mm`, `Ø 4.15 mm`) utilizing resolved images and authoritative spatial mode verification.
- **Focus Optimization Sweep Preview**: Visualizes the 7-step focal depth sweep array (`[-3] to [+3]`) with the active calibrated optimal focus position (`Pos 0`) highlighted alongside stage and galvo tolerances.
- **Product & Process Preview**: Shows active production recipe and lot parameters (`RCP-VIA-50UM-V2`), phase 1 laser drilling parameters (`2.2W / 50kHz / 2 shots`), and substrate via hole geometry verification (Top/Bottom via µm) with PASS verdicts.
- **Recommended Items Preview**: Shows tracked machine consumable items (e.g. Optical Protection Glass, Deionizer Filter) with real wear percentages, remaining service days, and BMD family catalog readiness.
- **Founder-Approved Restrained Aesthetics**: Enforced neutral dark/light FSOS surfaces, restrained typography, and purposeful semantic accents only (no rainbow colors, extraneous cards, or synthetic mock dashboards).

## v3.2.0 — Machine Passport 3D Flip Card Enhancement (2026-09-20)

### Machine Passport 3D Flip Card Enhancement
- **Precision 3D FlipCard Component**: Implemented a modular, accessible `FlipCard` component utilizing `motion/react` with restrained Y-axis 3D rotation (`axis="y"`), subtle interactive mouse tilt (~3.5°), restrained hover scale (1.01), soft shadows, and clean border radii matching FSOS Calm Industrial specifications without glare, neon, or extraneous gradients.
- **Machine Passport Table Grid Integration**: Upgraded the 7 spatial engineering cards in `MachinePassportTableView` (`Lifecycle & Health`, `Temperature`, `Laser Power`, `Beam Profile`, `Focus Optimization`, `Product & Process`, `Recommended Items`) with physical 3D card-flip interaction while preserving the layout, data flow, and responsive grid.
- **Clear Flip vs. Navigation Affordances**: Separated card flip interaction (clicking card body or flip rotate button) from explicit workspace entry (`Open` action button), preventing ambiguous interaction states.
- **Accessibility & Reduced Motion**: Enforced complete keyboard accessibility (Space/Enter toggle on card container, Tab navigation to inner interactive elements) and instant zero-duration fallbacks for `prefers-reduced-motion` settings.
- **Preserved Core Subsystems**: Preserved all 7 subject workspaces, Temperature analysis view, MHC Autopilot, Full PDF generation, and laser calculation engines.

## v3.1.9 — MHC Autopilot & Report Temperature Engineering UX Alignment (2026-09-20)

### MHC Autopilot & Report Temperature Engineering UX Alignment
- **MHC Autopilot Temperature Engineering Table**: Applied the Founder-approved 5-column engineering table (`CH | MIN | MAX | AVG | RANGE`) with subdued proportional cell-background fills (MIN: Blue, MAX: Red, AVG: Green, RANGE: Purple), removing the legacy 6-column layout and the redundant POINTS column while preserving crisp numeric typography.
- **MHC Autopilot Graph Inspection Cleanliness**: Removed Y-axis editing controls from the Autopilot telemetry chart to establish a dedicated inspection view, and enabled the visual USL/ASL specification band derived from authoritative MHC Cooling specs (`session.mhcSpecs?.temperatureCooling` / `machine.mhcSpecs?.temperatureCooling`).
- **MHC Full PDF Section 11 Engineering Matrix**: Replaced the Section 11 telemetry table with the approved 5-column engineering table featuring subdued proportional cell fills (`CH | MIN | MAX | AVG | RANGE`), removed POINTS and STATUS columns, preserved Markbox 1/2/3 subsystem assignments (`MB1`/`MB2`/`MB3`), and enabled the visual USL/ASL spec tolerance band on the report graph within strict Page 8 A4 budget.
- **Preserved Core Data & Workflow Authority**: Maintained all underlying data models, TemperatureEngine calculations, TempRawStore raw telemetry persistence, session sync, and Activity 06 completion logic.

## v3.1.8 — Temperature Final Cleanup and Release Correction (2026-09-20)

### Temperature Final Cleanup and Release Correction
- **Completely Removed Manual Spot Readings**: Removed the obsolete "Manual Spot Readings" user-facing presentation section, empty-state container, and handlers from the Temperature workspace while strictly preserving all automated telemetry, imported logs, saved records, and MHC reporting.
- **Subdued & Softened Engineering Table Color Intensity**: Refined the proportional cell-background fill visualization in the Per-Channel Engineering Summary table (MIN: Blue, MAX: Red, AVG: Green, RANGE: Purple) with subdued, technical wash layers and subtle vertical trailing indicators, ensuring numeric measurements remain high contrast, crisp, and dominant.
- **Interactive Engineering Table Sorting**: Added table-only sorting across CH, MIN, MAX, AVG, and RANGE columns with directional indicators without modifying graph channel selections, chart order, or underlying telemetry data.
- **Removed Points Column**: Removed the redundant POINTS column from the engineering summary table for a streamlined 5-column inspection view.
- **Zero-Channel Hook Stability**: Resolved React hook lifecycle ordering to ensure the chart renders the "NO CHANNELS SELECTED" guidance state gracefully without application blanking when all channels are deselected.

## v3.1.7 — Temperature Final Engineering Table & Channel State Correction (2026-09-20)

### Temperature Final Engineering Table & Channel State Correction
- **Restored Approved Channel Selector UI**: Restored the channel filter row to the previously approved visual presentation, retaining channel-specific colors, active/inactive states, and average temperature sub-labels while leaving the engineering summary table independently styled.
- **Proportional Cell-Background Fill Engineering Matrix**: Implemented the Founder-approved measurement matrix visualization where proportional magnitude fills (MIN: Blue, MAX: Red, AVG: Green, RANGE: Purple) are rendered directly as integrated cell backgrounds with high-contrast typography displayed cleanly on top, eliminating separate progress bar tracks.
- **Fixed Zero-Selected-Channel Empty State**: Fixed the blank-screen bug when all channels are deselected from the chart. The workspace now remains fully rendered with surrounding UI, settings, and table intact, while the chart display renders a clear "NO CHANNELS SELECTED" empty-state guide that recovers immediately upon channel selection.
- **Uncompromised Mathematical Precision**: Strictly preserved all Min/Max/Avg/Range calculations, point aggregations, MHC specifications, downsampling, and persistence models.

## v3.1.6 — Temperature Final Analysis Viewer & Engineering Table Correction (2026-09-20)

### Temperature Final Analysis Viewer & Engineering Table Correction
- **Removed Duplicate Settings Toolbar from Analysis Viewer**: Removed the partial Y-axis editing toolbar (Auto/Manual bounds, custom min/max inputs, day lines checkbox, MHC spec band checkbox) from the opened Temperature Analysis Viewer modal. The viewer now functions purely as an analytics viewer, leaving all telemetry configuration exclusively in the primary workspace's Unified Engineering Display Settings & Telemetry Controls.
- **Approved Engineering Table Visual Model**: Redesigned the Per-Channel Engineering Summary with a restrained, dark neutral technical surface, subtle row separators, and clean typography, eliminating decorative channel pill styling.
- **Subordinate Proportional Magnitude Bars**: Retained four semantic measurement dimensions with data-encoding colors (MIN: Blue, MAX: Red, AVG: Green, RANGE: Purple) displayed as proportional horizontal magnitude bars beneath high-contrast numeric values.
- **Uncompromised Mathematical Precision**: Strictly preserved all Min, Max, Avg, Range calculations, point aggregations, MHC specifications, resampling, and persistence models.

## v3.1.5 — Temperature Analysis Workspace UX Correction (2026-09-20)

### Temperature Analysis Workspace UX Correction
- **Expansive Analysis Canvas**: Expanded the analysis workspace and saved inspection modal width to utilize full screen real estate (`maxWidth="7xl"` and responsive fluid flex) for engineering inspection.
- **Workflow-Optimized Settings Placement**: Moved Unified Engineering Display Settings & Telemetry Controls directly above the trend graph and summary table, enabling effortless adjustment of Y-axis scaling, X-axis density, and MHC specification bands.
- **Professional Restrained Data Table**: Restyled the Per-Channel Engineering Summary and channel filter buttons with clean industrial surfaces, neutral typography, and compact color indicators while maintaining clear magnitude comparison bars.
- **Unified Horizontal Navigation**: Restored the horizontal subject navigation strip in the subject workspace header for quick subsystem switching alongside the direct return to Machine Table.

## v3.1.4 — Machine Passport Table Interaction & Visual Refinement (2026-09-20)

### Machine Passport Visual & Interaction Refinement
- **Restrained Industrial Color System**: Replaced multicolored rainbow accents across subject cards with calm, neutral dark surfaces, monochrome icons, neutral badges for counts/records, and high-contrast neutral data typography while strictly preserving semantic status indicators (SAFE, WARNING, ALARM, Established, Verified, PASS).
- **Removed Duplicate Horizontal Navigation**: Removed duplicate horizontal subject-navigation pills from the subject workspace header, strictly adhering to the linear `Machine Table → Select Card → Subject Workspace → Back to Machine Table` model.
- **Deterministic Bidirectional Flip Interaction**: Added explicit flip toggle controls and a dedicated return action to the technical inspection back-face, ensuring reliable `FRONT ↔ BACK` card reversibility.
- **Clarified Interaction Hierarchy**: Separated the technical card flip action from the workspace inspection action (`Open workspace →`) to eliminate competing or ambiguous navigation behaviors.

## v3.1.3 — Machine Passport Table View (2026-09-20)

### Machine Passport Table View
- **LOOK → UNDERSTAND → DRILL DOWN Spatial Layout**: Replaced the secondary nested sidebar navigation with an engineering inspection table view featuring physical engineering subject cards for all seven subsystems.
- **Dedicated Physical Subject Cards**: Implemented responsive, high-precision inspection cards for Lifecycle & Health, Temperature, Laser Power, Beam Profile, Focus Optimization, Product & Process, and Recommended Items with live telemetry badges, specification thresholds, and flip-card hardware spec references.
- **Seamless Subject Drilldown & Return**: Added one-click drilldown into full subsystem workspaces with a calm top workbench return strip and flat subject switcher pills.
- **Uncompromised Core Logic & Modals**: Retained all machine identity headers, customer/fleet filters, machine CRUD modals, and inline Lifecycle architecture without mock data or synthetic placeholders.

## v3.1.2 — Temperature UX Restructure (2026-09-19)

### Temperature UX Restructure
- **LOOK → UNDERSTAND → DRILL DOWN Hierarchy**: Restructured the temperature analysis workflow so the visual trend graph and key engineering metrics dominate the initial view, moving detailed configurations to clean, compact secondary sections.
- **Visual Magnitude Comparison Table**: Upgraded the per-channel summary (`CH | MIN | MAX | AVG | RANGE | POINTS`) with instant cross-channel magnitude indicator bars (MIN: Blue scale, MAX: Red scale, AVG: Green scale, RANGE: Purple scale) while keeping numeric measurements clearly legible.
- **Dominant Trend Visualization**: Elevated the multi-channel temperature graph to a generous 440px canvas with integrated day boundaries, target spec lines, and channel color differentiation.
- **Main Workspace Organization**: Enhanced the outer temperature workspace with rich saved-record identity cards, mini-telemetry strips, and direct drilldown into full engineering analysis.
- **Segregated Advanced Controls**: Grouped display bounds, Y-major steps, X-tick density, parsing filters, and raw point previews into organized collapsible tabs.

## v3.1.1 — Temperature Engineering Visualization (2026-09-19)

### Temperature Engineering Visualization
- **Day-Boundary Visual Reference Lines**: Rendered vertical dashed day boundaries across multi-day temperature telemetry datasets for instant temporal orientation.
- **Visual Threshold Spec Line**: Added configurable visual target spec line with live engineering guidance.
- **Y-Axis Major Step & Scale Controls**: Implemented explicit Y-axis step controls (1°C, 2°C, 5°C, Auto) alongside flexible manual min/max overrides.
- **X-Axis Tick Density Management**: Added selectable X-tick density controls (Auto, Dense, Sparse) for dense telemetry inspection.
- **Per-Channel Engineering Summary Table**: Integrated visual channel summary (`CH | MIN | MAX | AVG | RANGE | POINTS`) with relative spread magnitude indicators.

## v3.1.0 — LMS v2 Laser Lifecycle Visual Structure Refinement (2026-09-19)

### LMS v2 Laser Lifecycle Visual Structure Refinement
- **LMS v2 Information Hierarchy**: Refactored Laser Lifecycle presentation into a streamlined, high-clarity surface matching LMS v2 architecture.
- **Concise Multi-Head Lifecycle Margins**: Displayed operating runtime vs rated capacity with percentage consumption and estimated EOL dates on clean progress bars without redundant telemetry.
- **Streamlined Key Parameter Strip**: Compacted physical baseline, remaining margin, and verification freshness into a clean 3-metric parameter bar per laser head.
- **Contextual Action Callouts**: Surfaced prominent action alerts for required physical meter baselines or threshold alerts with zero visual noise.

## v3.0.0 — Machine Passport v2 Identity-First UI Correction (2026-09-19)

### Machine Passport v2 Identity-First UI Correction
- **Identity-First Information Hierarchy**: Refactored Machine Passport to prioritize machine identity (Machine #, Model, Serial #, Customer, Plant, Production Line, Zone) cleanly at the top of the workspace.
- **Concise Laser Lifecycle Surface**: Replaced telemetry-heavy dashboard noise with clean, calm per-head lifecycle cards displaying real operating hours, rated life, remaining percentage, and physical meter baseline freshness.
- **Lifecycle & Calibration History**: Added a dedicated historical record view capturing initial commissioning baselines, physical meter verifications, and routine service events without dummy placeholders.
- **Segregated Machine Engineering Health**: Structured MHC Baseline Engineering Specifications (Laser Power, Beam Profile, Stage Calibration, AGC Galvo, Cooling Temperature) alongside recent MHC audit logs and overall scores in a clear, segregated domain.

## v2.10.10 — Machine Passport v2 & LMS Lifecycle Integration (2026-09-19)

### Machine Passport v2 & LMS Lifecycle Integration
- **Identity-First Information Hierarchy**: Upgraded Machine Passport with the clean LMS v2 information hierarchy, highlighting machine number, model, serial number, customer account, plant site, and production line without visual noise or excessive telemetry walls.
- **LMS Lifecycle & Health Source of Truth**: Connected Machine Passport lifecycle presentation directly to existing `LaserEngine` deterministic runtime calculations, displaying operating hours, remaining lifecycle percentage, EOL prognosis, and physical meter calibration freshness per laser head.
- **Truthful LMS Synchronization State**: Embedded a concise LMS integration status and timestamp indicator directly within the lifecycle surface, showing real last updated timestamps and unrecorded states without fabricating sync data.
- **Separation of Concerns**: Strictly segregated FSOS MHC engineering baseline specifications (target power, beam profile mode, stage tolerance, AGC scanner tolerance, cooling temperature) from LMS physical laser-hour lifecycle baselines.
- **Robust Machine & Laser Matching**: Reused the authoritative matching engine in `LaserEngine.parseAndMapLaserMonitorJson` (matching by machine ID, machine number, serial number, and physical laser serials) and merged calibration histories without duplicating records.

## v2.10.9 — MHC Autopilot Verification & Routing Reliability (2026-09-19)

### MHC Autopilot Verification & Routing Fixes
- **AGC Autopilot Advance Correction**: Resolved duplicate advancement sequence in `MhcAgcActivity` where completing AGC 1 & AGC 2 previously triggered double-advancement past Activity 06; completing AGC now reliably lands engineers directly in Activity 06 Temperature & Evidence.
- **Product & Process Overall Verdict Integrity**: Corrected aggregate calculation in `ProductProcessEngine.evaluateRecord` so overall verdict accurately evaluates to `PASS` when both Laser Head 1 and Laser Head 2 pass inspection, avoiding stale truthy fallback.
- **Authoritative Machine Passport Seeding**: Enhanced `MhcProductProcessActivity` to sort and inherit from the latest authoritative Machine Passport records (`productName`, `recipeName`, power offsets) without hardcoded dummy placeholders.
- **PDF Confirmation Modal Viewport & Backdrop**: Fixed confirmation modal viewport alignment and double-backdrop opacity in `MhcAutopilot` to ensure crisp centering, zero layout shift, and proper keyboard dismissal handling.

## v2.10.8 — MHC Autopilot Activity Routing & Gate Wiring Fix (2026-09-19)

### MHC Autopilot Activity Routing Fix
- **Product & Process Activity Routing**: Mapped authoritative activity code `06_via` to `MhcProductProcessActivity` in `MhcWorkstationActivityHost`, ensuring Activity 07 correctly displays the dedicated Product/Recipe parameter verification and synthetic SEM via quality inspection UI.
- **Recommendations & Spare Parts Routing**: Corrected activity code condition in `MhcWorkstationActivityHost` so authoritative code `07` renders `MhcRecommendationsSparePartsActivity` instead of falling through or colliding with Product & Process.
- **Readiness Review Gate Callback Alignment**: Aligned callback prop names (`onProceedToReportGeneration` and `onNavigateToActivity`) between `MhcWorkstationActivityHost` and `MhcReadinessReviewActivity`, unblocking the "Unlock & Proceed to Report Generation" transition to Activity 10.
- **Surrounding Navigation Continuity**: Restored bidirectional navigation links in `MhcRecommendationsSparePartsActivity` (`06_via` ← `07` → `08`) and clarified completion notification indicators in `MhcTemperatureEvidenceActivity`.

## v2.10.7 — M6 Experimental Engineering (2026-09-19)

### M6 Experimental Engineering Implementation
- **Inspection Context Alignment Sweep**: Integrated a single-shot calibrated datum sweep in `MhcWorkstationActivityHost` upon activity transitions, providing visual indexing and context lock for sequential engineering audits.
- **Machine Identity Reticle Settling**: Implemented a calibrated engineering datum settling line on the Machine Identity surface in `MachinePassportModule` upon machine selection.
- **Evidence Verification Lock**: Added a locked verification state transition in `ViaQualityInspectionCard` when micro-inspection evidence is captured and resolved.
- **Tolerance Gate & Verdict Settling**: Introduced responsive settling transitions for live Taper Ratio calculations and Head Pass/Fail verdict gates in `ViaQualityInspectionCard`.
- **Absolute Reduced Motion Compliance**: Ensured all experimental engineering motion moments strictly respect `prefers-reduced-motion`, disabling spatial sweeps and translations with zero disruption to functional feedback.

## v2.10.6 — M5 Micro-Interactions (2026-09-18)

### M5 Micro-Interactions Implementation
- **Universal Button Primitives**: Integrated restrained mechanical press interactions (`mechanicalPressConfig.tap` and `mechanicalPressConfig.subtleTap`) into the reusable `Button` component with automatic `prefers-reduced-motion` compliance.
- **Interactive Card Elements**: Upgraded `Card` with interactive motion awareness, delivering subtle elevation and scale responses for actionable cards and cleanroom list items.
- **Modal Dialog Emergence**: Unified modal backdrops and surface transitions across `Modal` and `FounderBrandingModal` using `AnimatePresence` and `createScaleFadeVariants`.
- **Navigation Controls & Section Tabs**: Applied tactile feedback to secondary navigation tabs, category switchers, and filter pills in `SettingsModule`, `CustomersPlantsModule`, and `ChangelogModule`.
- **Fluid Expandable Containers**: Enhanced accordion details and release notes cards in `ChangelogModule` with smooth height and opacity transitions (`AnimatePresence`) and rotating state indicators.
- **Universal Reduced Motion Compliance**: Verified all micro-interactions rigorously respect `prefers-reduced-motion`, disabling spatial scaling and transforms without breaking interactivity.

## v2.10.5 — M4 MHC Autopilot Motion (2026-09-18)

### M4 MHC Autopilot Motion Implementation
- **Activity Progression Flow**: Applied seamless, mechanical activity-to-activity transitions (`AnimatePresence mode="wait"`) across Activities 01 through 10 in `MhcWorkstationActivityHost`, giving the sequential engineering audit a fluid, physical progression.
- **tactile Workstation Controls**: Implemented responsive tactile feedback (`mechanicalPressConfig.tap` & `mechanicalPressConfig.subtleTap`) across Mark Complete, Flag for Review, Discard Draft Session, Activity Jump buttons, and Session Completion triggers.
- **Navigator Sub-rail Motion**: Added subtle mechanical press responses across the 4-Day schedule tree and sub-activities in `MhcWorkstationNavigator`.
- **Review & Discard Modal Emergence**: Integrated smooth backdrop and modal dialog scaling/fading (`AnimatePresence` with `createScaleFadeVariants` and `motionTimings.quick`) for session completion reviews and discard confirmation dialogs.
- **Autopilot Toast Emergence**: Added fluid entry/exit states for action notifications using calibrated fade-slide tokens.
- **Universal Reduced Motion Support**: Fully honored `prefers-reduced-motion` across all MHC Autopilot workstation motion elements, ensuring zero disorienting spatial movement when reduced motion is preferred.

## v2.10.4 — M3 Machine Passport Motion (2026-09-18)

### M3 Machine Passport Motion Implementation
- **Living Instrument Identity Surface**: Added responsive mechanical transitions (`AnimatePresence mode="wait"`) when switching machines or updating customer allocation, providing seamless machine context updates without page reflows.
- **Physical Subsystem Indicator**: Integrated high-precision sliding active indicator transitions across technical subsystems (Lifecycle, Temperature, Laser Power, Beam Profile, Focus Optimization, Product & Process, Recommended Items) powered by Motion `layoutId="passportSubsystemActiveIndicator"` and `slidingIndicatorTransition`.
- **Subsystem Workspace Switching**: Implemented clean, smooth content transitions between active engineering subsystem workspaces using directional fade-slide motion (`motionTimings.standard` 250ms with `motionEasings.responsive`).
- **Tactile Fleet & Subsystem Controls**: Provided tactile mechanical feedback (`mechanicalPressConfig.subtleTap` & `mechanicalPressConfig.tap`) across customer account buttons, fleet machine pills, and subsystem navigator items.
- **Alert & Toast Emergence**: Added fluid entry and exit states for system status alerts and notifications using calibrated fade-down transitions.
- **Universal Reduced Motion Support**: Fully respected `prefers-reduced-motion` across all Machine Passport motion elements, collapsing spatial movements into clean, instantaneous or fade-only feedback.

## v2.10.3 — M2 Daily Work Motion (2026-09-18)

### M2 Daily Work Motion Implementation
- **Polished Workspace Arrival**: Structured Daily Work entry with a calibrated stagger container and section-level fade-slide transitions, presenting today's operational workspace in a unified, professional flow.
- **Dynamic Focus Card Transitions**: Implemented seamless `AnimatePresence mode="wait"` state changes across ongoing health checks, zero-progress drafts, scheduled items, and truthful empty states.
- **Genuine Readiness Progress Animation**: Added a smooth, deterministic progress bar transition for active health check readiness score without synthetic counters or fake progression.
- **Tactile Action & Schedule Interactions**: Provided responsive mechanical press and hover feedback (`mechanicalPressConfig.hover` / `tap` / `subtleTap`) across primary CTA buttons, attention alerts, and schedule cards.
- **Truthful Calm Empty States**: Preserved authentic empty state behavior with gentle, calm arrivals without manufactured placeholder data.
- **Universal Reduced Motion Support**: Fully honored `prefers-reduced-motion` across all Daily Work motion elements, ensuring zero layout shifts or distracting spatial displacement when reduced motion is preferred.

## v2.10.2 — M1 Application Shell Motion (2026-09-18)

### M1 Application Shell Motion Implementation
- **Smooth Sidebar Open/Close Mechanics**: Integrated smooth entry and exit transitions for the true-hidden sidebar using `motion.aside` and `AnimatePresence` with calibrated `motionTimings.standard` (250ms) and `motionEasings.responsive`, eliminating jarring layout reflows while preserving full screen real estate when collapsed.
- **Dynamic Navigation Indicator**: Implemented physical sliding active tab indicators using Motion `layoutId="sidebarActiveIndicator"` and `slidingIndicatorTransition`, providing fluid spatial connection across navigation changes without distracting decorations.
- **Context & Top Bar Transitions**: Added subtle, high-performance page title and context transitions using `AnimatePresence mode="wait"` with `motionTimings.quick` (150ms), paired with an animated emergence transition for the Top Bar restore button.
- **Tactile Shell Interactions**: Added mechanical tactile press feedback (`mechanicalPressConfig.subtleTap` & `mechanicalPressConfig.tap`) across sidebar navigation items, profile trigger, and header controls.
- **Workspace View Transitions**: Enhanced primary module transitions in the main viewport with responsive fade-and-slide motion, preventing content popping while maintaining instantaneous response for field engineers.
- **Universal Reduced Motion Support**: Fully honored `prefers-reduced-motion` across all shell transitions, gracefully collapsing spatial displacement into clean, instant or fade-only feedback.

## v2.10.1 — Motion Foundation & Animated Login Experience (2026-09-18)

### M0 Motion System Foundation
- **Standardized Timing System (`motionTimings`)**: Established calibrated, field-service-safe duration levels (`instant`: 80ms, `quick`: 150ms, `standard`: 250ms, `deliberate`: 400ms, `scan`: 3.0s) avoiding arbitrary scattered magic numbers.
- **Restrained Easing Vocabulary (`motionEasings`)**: Defined mechanical + smooth easing curves (`responsive`, `smooth`, `deliberate`, `linear`) delivering fast tactile feedback with smooth, controlled deceleration.
- **Purposeful Motion Distances & Scales**: Standardized micro-displacement tokens (`micro`: 2px, `subtle`: 4px, `component`: 8px, `section`: 16px, `page`: 24px) and subtle tactile scales (`press`: 0.98, `subtlePress`: 0.99, `hover`: 1.015, `dialogEntry`: 0.97) without cartoonish bounce.
- **Universal Reduced Motion Architecture**: Standardized `prefers-reduced-motion` helpers and variant builders (`getFSOSReducedTransition`, `buildFSOSVariant`) collapsing spatial motion into clean, instantaneous or fade-only transitions without hiding content.
- **Motion Primitives & Presets**: Created typed reusable motion primitives (`fadeSlideIn`, `fadeInOut`, `scaleFade`, `staggerContainer`, `mechanicalPressConfig`, `slidingIndicatorTransition`) ready for M1–M6 implementation.
- **Developer Motion Guidance**: Added comprehensive `src/theme/MOTION_GUIDE.md` detailing when to animate, when NOT to animate, and performance constraints.

### Animated Login Experience & Brand Mark Finalization
- **FSOS Brand Mark Presence**: Removed the cramped button-like container and elevated the wafer mark to a prominent, unclipped 64px centerpiece framed with a precision optical alignment reticle and mechanical entry alignment sweep.
- **Animated Precision Environment**: Introduced an interactive background environment with a fine technical coordinate grid, smooth mechanical laser scan beam, cursor-responsive ambient spotlight, and viewport registration crosshairs.
- **Dynamic Workspace Mode Switching**: Added a physical sliding indicator transition between MHC Mode and Founder Mode powered by Motion `layoutId`, providing tactile operational feedback.
- **Polished Session Handshake**: Implemented a multi-stage primary action response (`idle` → `authenticating` → `success confirmed`) transitioning seamlessly into the FSOS workspace.
- **Motion & Reduced Motion Compliance**: All animations adhere to the Mechanical + Smooth motion language and gracefully deactivate continuous sweeps/translations when `prefers-reduced-motion` is active.

## v2.10.0 — Login UI/UX & Motion Finalization (2026-09-18)

### Login Experience & Mechanical Motion Finalization
- **Calm Industrial Login Experience**: Redesigned the FSOS login interface to evoke precision engineering operations with clean typography, balanced spacing, and subtle grid background geometry.
- **Restrained Workspace Selection**: Simplified MHC Mode and Founder Mode selection into cohesive, high-contrast industrial surfaces without decorative glowing gradients or purple accent clutter.
- **Mechanical + Smooth Transitions**: Integrated purposeful arrival and interaction animations via Motion, with complete support for `prefers-reduced-motion` to eliminate non-essential animations when requested.
- **Authentic Local Session Integrity**: Preserved local authentication semantics, account switching, credential handling, and session state generation without introducing third-party dependencies or mock backends.

## v2.9.1 — Duplicate Sidebar Toggle Removal (2026-09-18)

### Sidebar Toggle Consolidation
- **Single Authoritative Toggle**: Removed the duplicate collapse button from beside the page title in the Top Bar, ensuring the sole sidebar hide/collapse control resides directly at the Sidebar/Header boundary.
- **Clean Restorative Trigger**: Maintained the unobtrusive Menu restore trigger in the Top Bar strictly when the sidebar is in its true-hidden state, preventing redundant side-by-side buttons when expanded.

## v2.9.0 — Top Bar Minimal Cleanup (2026-09-18)

### Top Bar Minimal Cleanup
- **Focused Top Bar Surface**: Removed the redundant `+ New MHC` global shortcut from the header bar, centralizing MHC workflow initiation to its dedicated operational workspaces (Daily Work & MHC Autopilot) without competing entry points.
- **Unused Notification Bell Removal**: Removed the placeholder notification bell and modal popover from the global header, eliminating inactive UI elements and leaving the header minimal, calm, and distraction-free.
- **Essential Operational Context**: Kept only genuine system context (current page title, real-time sync status indicator, and engineer account/profile menu) within a clean, high-contrast industrial header bar.

## v2.8.0 — Application Shell UI/UX Final Refinement (2026-09-18)

### Final Application Shell Refinement
- **Pure Typography Navigation Hierarchy**: Stripped excessive and decorative icon walls from sidebar menu items, letting crisp typography, clean grouping, and a single definitive active state provide clear visual navigation.
- **True Sidebar Hide/Collapse Architecture**: When hidden, the navigation surface collapses completely rather than leaving an icon-only miniature column, enabling the main engineering workspace to naturally expand into the freed screen real estate.
- **Accessible Sidebar Show Control**: Added a clear, accessible menu restore trigger in the global header with clear keyboard support and label state.
- **Streamlined Calm Top Bar**: Removed redundant top-bar shortcuts (theme toggle, global search field, and workspace mode switcher) which are already canonically configured inside Settings, leaving a unified and calm operational header bar.
- **Global Context Simplification**: Removed non-contextual operational directives from global headers, keeping the top bar focused on page context, real-time sync status, quick MHC creation, notifications, and account settings.

## v2.7.0 — Application Shell UI/UX Refinement (2026-09-18)

### Application Shell Refinement
- **Calm Expanded Sidebar**: Streamlined navigation hierarchy by eliminating stacked multi-state active indicators, reducing border clutter, removing redundant dot decorators, and establishing a single, high-contrast active signal.
- **Precision Collapsed Rail State**: Engineered an intentional, accessible collapsed rail layout with perfectly aligned icon triggers, keyboard-accessible expand/collapse actions, native tooltips, and seamless main content responsive adaptation.
- **Harmonized Top Bar Architecture**: Consolidated fragmented top-bar widget capsules into a coherent, balanced header bar, establishing clear visual hierarchy between page title, quick search, primary actions (`+ New MHC`), and unified system controls.
- **Contextual Directive Isolation**: Restricted the operational maintenance directive context exclusively to the Daily Work workspace, preventing redundant global header clutter on analytical and system screens.
- **Settings Terminology Harmonization**: Formally aligned all shell and header references to "Settings" across all application contexts.

## v2.6.0 — Settings & Backup UX Reorganization (2026-09-18)

### Settings & Backup UX Reorganization (R12-C)
- **Calm Industrial Settings Architecture**: Reorganized Settings into six purpose-built domains: Appearance, Regional, Application, Backup & Restore, Workspace Maintenance, and About FSOS.
- **Dedicated Changelog Page**: Extracted the full release history from Settings into an independent, top-level navigation destination with instant search, release milestone filtering, and collapsible change logs.
- **Portable Backup & Safe Restore Experience**: Elevated Portable Backup (`.fsosbackup`) as the primary path with clear plain-language explanation of archive sizing (driven by image evidence) and subordinate legacy JSON restore support.
- **Workspace Maintenance & Guarded Reset**: Integrated plain-language explanation of factory reset impacts with a strict two-stage confirmation modal, alongside a collapsible Advanced Storage Diagnostics & Optimization panel housing forensic media audit and deduplication tools.
- **Pure Operational Realism**: Strict zero-fabrication guarantees across all preferences, storage telemetry, and backup validation stats.

## v2.5.5 — Engineering Analysis Workspace Redesign (2026-09-17)

### Engineering Analysis Workspace Redesign
- **Interactive Workspace Architecture**: Replaced the static multi-card dashboard with a dedicated Engineering Analysis Workspace (`SELECT ANALYSIS → SELECT SCOPE → INVESTIGATE DATA → DRILL INTO SOURCE RECORD`).
- **Single Active Analysis Isolation**: Only one analysis occupies the main workspace at a time (Laser Power, Subsystem Results, Findings, MHC Activity, or Machine Comparison).
- **Dynamic Context & Scope Isolation**: The scope filter bar dynamically renders only controls relevant to the active analysis (e.g. Machine/Metric selector for Laser Power, Subsystem/Customer selector for Subsystems).
- **Dominant Laser Power Investigation**: Precision trajectory visualization with inline verified measurement count, first/latest readings, delta calculations, interactive node tooltips, and source MHC drilldown.
- **Dedicated Subsystem & Findings Deep-Dives**: Subsystem verdict distribution with clickable deviation logs; recurring findings ranking with instance details and MHC session links.
- **Data Integrity & Gating**: Clean compact states for missing data, zero fabricated values, and strict gating for Machine Comparison when fewer than 2 units have verified records.

## v2.5.4 — Analytics Screen UI/UX Redesign & Baseline Removal (2026-09-17)

### Analytics UI/UX Redesign
- **Eliminated Rated Baseline**: Completely removed the "Rated Baseline" concept, cards, spec lines, and baseline metrics from the Analytics UI (no N/A placeholders, no nominal target lines).
- **Hero Laser Power Trend**: Restructured the visual hierarchy to make Laser Power Trend the dominant hero engineering visual with lightweight inline metrics (`First`, `Latest`, `Δ`) instead of nested cards.
- **Card-Heavy Layout Overhaul**: Replaced dense card-inside-card designs with flat, clean, precision operations layout using generous whitespace, calm graphite foundation, and high typographic contrast.
- **Intentional Sparse Data Handling**: Single measurements render as a clean `1 verified measurement` banner, zero measurements as compact `No Data`, and multi-measurements as crisp trendlines with attached dark precision tooltips.
- **Secondary & Tertiary Information Flow**: Rebalanced Subsystem Results, Recurring Findings, MHC Activity, and added real-data Machine Comparison across fleet units.

## v2.5.3 — Laser Power Telemetry & Data Integrity Fix (2026-09-17)

### Laser Power Telemetry & Data Integrity
- **Removed Fabricated Defaults**: Removed hardcoded `250 W` fallback and synthetic measurement defaults (`15.0`, `14.8`, `99.2`) from MHC Autopilot Laser Power Activity (`MhcLaserPowerActivity.tsx`).
- **Machine Creation Purity**: Stripped arbitrary `250 W` rated power default from new machine passport initialization; machines created without recorded rated power retain undefined/empty values.
- **Analytics Factual State Handling**: In Analytics Module trajectory charts, if rated power is missing, displays factual `N/A` / `No Data` instead of guessing or injecting baseline values. Real recorded measurements and genuine rated baselines are strictly preserved.

## v2.5.2 — R11-G Analytics Visual Refinement (2026-09-16)

### Analytics Workstation Visual Refinement (R11-G)
- **Hierarchy & Visual Weight**: Reorganized Analytics into a dedicated 3-tier engineering workstation hierarchy: Primary (Physical Parameter Longitudinal Trajectory), Secondary (Subsystem Verdict Distributions & Recurring Findings), Supporting (Service Activity, Customer Distributions, & Contract Coverage).
- **Data-Density Aware Trajectory**: Implemented adaptive state rendering for physical parameters:
  - *0 measurements*: Compact factual notice without oversized empty visual containers.
  - *1 measurement*: Inline verified baseline notice clarifying that longitudinal trends require 2+ measurements.
  - *2+ measurements*: Prominent high-precision SVG scatter-connected chart with first reading, latest reading, overall delta ($\Delta$), rated spec line, and interactive inspection drill-down.
- **Strict Neutral Industrial Styling**: Stripped non-essential semantic accents; enforced pure slate/graphite neutral layout with color strictly reserved for true evaluated states (Pass/Emerald, Warn/Amber, Fail/Rose).
- **Subsystem & Findings Streamlining**: Flattened layout density, enhanced defect frequency bars, and made zero-record states clean and low-profile.
- **Supporting Telemetry Row**: Positioned Service Activity sparklines, Client account distributions, and Contract protection ratios into a quiet, high-signal supporting row.


## v2.5.1 — R11-F Analytics Visual Workspace (2026-09-16)

### Analytics Visual Workspace (R11-F)
- **MHC Activity & Volume Trend**: Implemented time-series monthly activity chart mapping completed MHC sessions, distinct machines inspected, and documented findings over time with date-range filtering (`All`, `30D`, `90D`, `365D`).
- **Subsystem Verdict Distribution**: Implemented fleet-wide Pass / Warn / Fail distribution bars for Laser Output, Optics & Alignment, Chiller & Cooling, Product Quality, Motion Stage, and AGC with click-to-filter drilldown.
- **Recurring Findings & Defect Frequency**: Ranked component finding frequency across completed inspections, distinguishing repeated vs single occurrences with expandable inspection drill-down drawers.
- **Machine / Parameter Trajectory**: Interactive scatter-connected engineering graph plotting multi-session physical parameters (Laser Power in Watts, Stage Deviation in µm, AGC Error in µm) with strict longitudinal rules (minimum 2 points for trendline, single-point baseline notices, zero-point truthful empty states, delta $\Delta$, and rated spec references).
- **Secondary Analytics**: Added Customer/Site service activity distribution and Contract fleet protection gap analysis with direct navigation.
- **Global Filter Bar**: Unified Date Range, Customer scope, and Subsystem selectors.
- **Calm Industrial Workstation Aesthetics**: Restrained slate/gray palette, thin 1px structural borders, responsive SVG graphics, and zero artificial AI slop.


## v2.5.0 — R11-D Simplified Operational Analytics UI (2026-09-16)

### Operational Analytics UI Simplification (R11-D)
- **Calm Glanceable Engineering Overview**: Redesigned Analytics into a flat, single-screen overview with instant operational status rather than a dense, scrolling multi-panel report.
- **Top Glance Telemetry Row**: Unified fleet health, MHC currency, laser power verification, and contract coverage into high-signal summary blocks with clear numbers and visual progress segments.
- **Prominent Operational Attention Section**: Consolidated flagged equipment (out-of-service/maintenance/calibration), low consumables (life ≤ 20% or ≤ 15d), and uninspected/uncovered machinery into a unified high-priority action block with one-click navigation to Machine Passport.
- **Elimination of Redundant Fleet Dumps**: Removed duplicate equipment lists and filter selectors across panels, prioritizing summary metrics and displaying machine specifics only where attention is required.
- **Concise Inspection & Coverage Breakdown**: Streamlined inspection currency age brackets and service contract mapping into compact structured blocks with concise status lists.
- **Calm Industrial Aesthetics**: Preserved typography-first precision styling with restrained semantic coloring, zero gradients, zero glow, and no invented metrics.


## v2.4.9 — R11-C Truthful Operational Analytics (2026-09-16)

### Truthful Operational Analytics (R11-C)
- **Elimination of Fabricated Metrics**: Completely removed hardcoded `mtbfData` ("Mean Time Between Failures Growth" / "Fleet Reliability Index") and arbitrary consumable fallback calculations (`currentLifePercent * 1.8`).
- **Fleet Operational Status Distribution**: Integrated authoritative `Machine.status` aggregation displaying precise counts, percentage of fleet, segment bar visualization, and interactive status-filtered equipment micro-lists.
- **Factual MHC Inspection Coverage**: Implemented inspection age classification based on real completed `MHCSession` and `MHCRecord` timestamps (`<30d Recent`, `30–90d Quarterly`, `>90d Prior Quarter`, `No Recorded MHC`) without speculative overdue assumptions.
- **Latest Laser Power Verification**: Surfaced verified laser output wattage readings and status disposition per laser head sourced from authoritative stage03 records.
- **Targeted Consumables Attention Filter**: Replaced speculative forecasting with a high-precision attention filter surfacing only consumables in genuine need of attention (`life <= 20%` or `estimated days remaining <= 15`).
- **Contract Fleet Coverage Analysis**: Cross-mapped active service contracts against registered machinery to report covered equipment, uncovered equipment, and percentage coverage.
- **Calm Industrial Workstation Aesthetics**: Designed quiet telemetry headers, typography-first metrics, and restrained status accents adhering to FSOS design tokens.
- **Automated Verification**: Added comprehensive unit test coverage in `AnalyticsModule.test.ts` verifying complete removal of synthetic calculations and validation of real aggregation logic.


## v2.4.8 — R10-E Engineers Directory UX Redesign (2026-09-16)

### Engineers Directory UX Redesign (R10-E)
- **Calm Industrial Master/Detail Architecture**: Restructured the Engineers Directory workspace into a responsive 60/40 master-detail layout adhering to FSOS R1 design tokens without redundant visual cards or saturated SaaS elements.
- **Compact Inline Directory Summary**: Replaced the 4 oversized KPI boxes with a refined inline metadata strip displaying total count, online count, on-field count, and the active session operator.
- **Directory List & Row Clarity**: Refined directory table rows around clear engineer identity (avatar, full name, monospace employee ID, email), role & department tags, status pill, and direct contextual actions.
- **Selected Engineer Inspector**: Flattened the right inspector pane to provide instant access to operational information, contact metadata, account status, timezone, specialty notes, and profile editing.
- **Session Operator vs Directory Distinction**: Clearly distinguishes the current active session operator from directory records with distinct badges, enabling quick operator switching or direct navigation to My Profile.
- **Protected Administrative Operations**: Enforced safe deletion guards with double-confirmation dialogs while ensuring the active session operator is protected from accidental deletion.
- **State Behavior & Multi-Query Support**: Implemented intentional states for 0-user, single-user (current real state with Sahafiz), and multi-user directories with real-time search, role filtering, and status filtering.
- **Automated Verification**: Added comprehensive unit test coverage in `UsersModule.test.ts` for directory queries, role/status filtering, active user protection, and multi-user persistence.


## v2.4.7 — R10-C Restore Real Active User as First Directory User (2026-09-16)

### Restore Real Active User as First Directory User (R10-C)
- **Real Active Operator Persistence**: Initialized and persisted the existing real active operator identity (`Sahafiz`, `EMP-EO-8801`, `EO Technics`, `Service Operations`, `Field Service Engineer`) into `SystemUser` directory storage (`fso_v073_users`) when the directory contains no genuine users.
- **Single-Source Directory Representation**: Ensured fresh applications immediately display 1 Registered User in the Engineers Directory as a standard directory row matching the active signed-in session.
- **Active Session & Profile Synchronization**: Synchronized `activeUser`, `profile` (`EngineerProfile`), and persisted `SystemUser` directory records through `handleSaveProfile` and `handleUpdateUser` in `App.tsx`.
- **Non-Duplication & Genuine User Preservation**: Maintained duplicate prevention logic so existing genuine user records are never overwritten or duplicated with fallback identities.
- **Legacy Ghost Migration Alignment**: Updated `purgePersistedGhostUsers` to restore the real active operator identity if all remaining entries were legacy fabricated ghost users (`usr-101`..`usr-107`).
- **Automated Verification**: Updated `UsersModule.test.ts` to verify empty directory initialization, reload persistence, non-duplication of existing genuine users, and profile synchronization.


## v2.4.6 — R10-C Align Active User With Engineers Directory (2026-09-16)

### Align Active User With Engineers Directory (R10-C)
- **Truthful Directory & Session Presentation**: Aligned `UsersModule.tsx` to clearly distinguish between persistent registered directory records (`fso_v073_users`) and the current in-session operator identity (`activeUser`), resolving the apparent visual contradiction.
- **Accurate Quick Stats Metrics**: Replaced generic "TOTAL USERS" with "REGISTERED USERS" (`users.length`), "DIRECTORY ONLINE", and "DIRECTORY ON FIELD", alongside a dedicated "SIGNED-IN OPERATOR" status indicator.
- **Context-Aware Directory Empty State**: When directory registration is 0, renders a clear notice explaining the empty directory state and showing the current in-session operator with a direct action to register the first directory user.
- **Profile Detail Registration Badging**: Explicitly indicates whether a viewed profile is a persisted "Directory Record" or a "Current In-Session Operator" (local session identity).
- **Separation & Non-Duplication Integrity**: Preserves complete architectural separation between in-session active operator state and persistent multi-user directory storage without injecting synthetic records.
- **Automated Verification**: Added R10-C test suite in `UsersModule.test.ts` verifying honest 0-directory user presentation, non-duplication, and seamless user registration.


## v2.4.5 — R10-B2 Purge Persisted Ghost Users (2026-09-16)

### Purge Persisted Ghost Users (R10-B2)
- **Purge of Persisted Fabricated Seed Records**: Implemented `purgePersistedGhostUsers` migration in `StorageService` (`persistence.ts`) targeting the verified fabricated seed record IDs (`usr-101` through `usr-107`) originating from legacy `INITIAL_USERS`.
- **Targeted Deletion with Genuine Record Preservation**: Selectively removes only verified ghost identities from `fso_v073_users` storage, preserving all genuine user-created operational accounts.
- **Defensive Retrieval Sanitization**: Updated `StorageService.getUsers()` and `StorageService.saveUsers()` with active filtering to prevent ghost records from contaminating memory or disk.
- **Automated Verification**: Added test coverage in `UsersModule.test.ts` verifying one-time migration execution, full cleanup of ghost user arrays, and selective preservation of genuine users.


## v2.4.4 — R10-B Remove Ghost User Initialization (2026-09-16)

### Remove Ghost User Initialization (R10-B)
- **Elimination of Fabricated Initial Users**: Purged the 7 hardcoded mock/ghost `SystemUser` records (`usr-101` through `usr-107`) from `INITIAL_USERS` in `mockData.ts`, setting default user storage initialization to an empty array (`[]`).
- **Safe Zero-State Handling**: Confirmed `StorageService.getUsers()`, `LoginPage.tsx`, `App.tsx`, and `UsersModule.tsx` safely accommodate empty user states without runtime crashes or unexpected state mutations.
- **Genuine Persistence Integrity**: Preserved genuinely persisted and added user records in `STORAGE_KEYS.USERS ('fso_v073_users')`, ensuring real operational accounts created by engineers or administrators remain intact.
- **Automated Verification**: Added unit test suite `UsersModule.test.ts` verifying empty storage initialization and non-contamination with ghost users.


## v2.4.3 — R9-F My Profile Coverage Setting & Map Synchronization (2026-09-16)

### Service Coverage Selection & Map Synchronization (R9-F)
- **Manage Coverage Modal Workflow**: Added a dedicated "Manage Coverage" action and modal in `ProfileModule.tsx` allowing engineers and authorized administrators to select from canonical customer/plant records with multi-site search, select all / clear all options, and live selection counters.
- **Canonical Site & Line Auto-Reconciliation**: Implemented `StorageService.reconcilePlantsAndLines` in `persistence.ts` and startup reconciliation in `App.tsx` ensuring existing semiconductor sites (`Plant` and `ProductionLine` records) are dynamically resolved from authoritative machines, preventing 0-location states.
- **Immediate Interactive Map Synchronization**: Directly connected `assignedServiceLocations` IDs to `ServiceCoverageMap.tsx`, instantly updating the focused dispatch cluster, active coverage badges, and operational service radius upon save.
- **Distinguished Coverage States**: Markers and overlay lists explicitly differentiate active covered customer facilities from general semiconductor hub sites, while preserving map visibility even when no locations are assigned.
- **Reference Integrity & Authority Enforcement**: Strictly stores string plant ID references (`assignedServiceLocations: string[]`) without duplicating records, respecting role-based authority rules.
- **Verification**: Added test coverage in `ProfileModule.test.ts` for batch selection updates, reference integrity, plant reconciliation, and map synchronization.


## v2.4.2 — R9-E Service Coverage Assignment & Map Foundation (2026-09-15)

### Service Coverage Assignment & Map Foundation (R9-E)
- **Canonical Service Location Assignment**: Linked engineer profiles (`SystemUser`) directly to canonical `Plant` records via `assignedServiceLocations: string[]` without creating duplicate entity tables or fragmented location stores.
- **Configurable Service Coverage in My Profile**: Implemented an intuitive assignment workflow in `ProfileModule.tsx`. Authorized administrators/founders can search existing customer sites/plants, assign locations, or remove assignments with immediate feedback.
- **Calm Industrial Coverage Cards**: Display assigned customer plants with clear customer affiliation, plant name, physical facility location, and timezone badge. Standard engineers view assigned sites in read-only mode with an honest empty state when unassigned.
- **Strict Map Geographic Honesty**: Maintained data truth by displaying an explicit note stating map GIS telemetry is unconfigured rather than rendering fake GPS pins, synthetic coordinates, or unauthorized third-party map tiles.
- **Comprehensive Unit Testing**: Added tests for administrator assignment rights, standard engineer protection against unauthorized assignment mutation, and plant resolution filtering.


## v2.4.1 — R9-D My Profile Usability & Field Coverage (2026-09-15)

### My Profile Usability & Field Coverage (R9-D)
- **Role-Gated Identity Field Editability**: Integrated the existing permission model (`currentUserRole === 'Administrator'` or `workspaceMode === 'FOUNDER_MODE'`) into `ProfileModule.tsx`. Authorized administrators and founders can edit Employee ID and assign System Security Roles, while standard field service engineers remain strictly read-only to prevent self-elevation.
- **Canonical Timezone Selection Control**: Replaced the free-text Regional Timezone field with a keyboard-accessible `<select>` control backed by canonical timezone options (`CANONICAL_TIMEZONES`), ensuring semiconductor hub alignment (Malaysia/Singapore, Taiwan Foundry, Korea EO HQ, Japan Optics, Europe, US) while cleanly preserving any existing stored custom timezone strings.
- **Authoritative Service Coverage Section**: Investigated application models (`Customer`, `Plant`, `Machine`, `Contract`, `SystemUser`) for geographic coverage data. Because no authoritative coordinates, dispatch polygons, or GPS boundary models exist, an honest Calm Industrial empty state ("Service coverage not configured") is rendered without synthetic/mock coordinates or fabricated map widgets.
- **Verification & Identity Synchronization**: Added unit tests covering administrative privilege boundaries, non-admin role protection, and timezone option integrity.


## v2.4.0 — R9-C My Profile Redesign & Identity Integrity (2026-09-15)

### My Profile Redesign (R9-C)
- **Calm Industrial Interface Overhaul**: Replaced the legacy indigo/purple gradients and glowing visual treatment in `ProfileModule.tsx` with the approved Calm Industrial aesthetic, utilizing semantic surface tokens, restrained borders, and clear hierarchy.
- **5-Section Structured Workspace**:
  - **1. Engineer Identity**: High-contrast identity header presenting avatar, verified role chip, real-time availability badge, organization unit, employee ID, and contact details.
  - **2. Personal Information**: Form controls for Full Name, Corporate Email, Phone, Company, and Department with explicit `<label htmlFor>` / `id` accessibility pairings.
  - **3. Operational Profile**: Service assignment details featuring a read-only managed System Security Role field, operational availability selector, and regional cleanroom timezone.
  - **4. Technical Qualifications & Field Bio**: Specialized qualifications and technical domain field notes.
  - **5. Save State & Action Footer**: Synchronized update dispatch with persistent feedback indicator.
- **Role Security & Immutability**: Enforced role authorization rules preventing users from self-elevating their system security role in My Profile. The `role` and `employeeId` fields are strictly managed and protected from client-side tamper during the profile update lifecycle.
- **Avatar Menu & Lifecycle Harmonization**: Enhanced profile photo upload/remove workflow with keyboard accessible popover menu, file validation (JPG/PNG/WEBP, ≤5MB limit), and seamless integration into the application profile lifecycle.
- **Unified Identity Compatibility**: Maintained dual-type compatibility ensuring updates through `onUpdateUser` seamlessly preserve synchronization between `SystemUser` and legacy `EngineerProfile` consumers without data loss across headers, sidebars, and MHC reports.

## v2.3.9 — R8-E5 Service Planner Dynamic Contract Period Integrity (2026-09-15)

### Service Planner & Contract Period Integrity (R8-E5)
- **Dynamic Contract Horizon Generation**: Derived the Service Planner's month slot generator, quarter group aggregations, and continuous fleet timeline purely from the selected contract's actual `startDate` and `endDate`. Contracts spanning 36 months (e.g. 2026-01-01 → 2028-12-31) now accurately generate all 36 month columns and 12 quarterly intervals without hardcoded 24-month horizon caps.
- **Dynamic Workspace Labels**: Replaced static "2-Year Service Planner" and "24-Month Continuous Fleet Timeline" header text with dynamic contract-period labels displaying exact month/quarter counts and duration ranges across all views.
- **Contract Horizon Consistency Across Views**: Unified the Fleet Matrix, Quarterly Calendar, and Chronological Flow views to strictly operate over the identical contract boundary and actual MHC event timestamps.
- **Multi-Year Duration Formatting**: Extended `formatContractDuration` unit testing to verify precise formatting for 2-year, 3-year, and custom fractional durations.

## v2.3.8 — R8 Customers & Plants + Contract Operations (2026-09-15)

### Customers & Plants Workspace (R8)
- **4-Level Cleanroom Hierarchy**: Transformed Customers & Plants into an operations workspace structured as Customer → Sites/Buildings → Production Lines → Machines with real machine allocations and clear grouping headers.
- **In-Module Customer CRUD**: Enabled full customer account registration and updating with deletion guards preventing removal of accounts with active assigned machines.
- **Machine Transfer with History Invariant**: Implemented machine transfer between existing or new cleanroom facilities and lines, preserving machine canonical identity and ensuring historical MHC records remain untouched with their original inspection facility context.
- **Removed Ghost & Synthetic Data**: Purged hardcoded ghost defaults (`Lead Operations Engineer`, `ops@cleanroom.com`, `+1 (555) 019-2831`, `plant-1`, `Primary Cleanroom Plant`) from customer reconciliation and machine creation workflows. Missing contact fields now display honest "No contact recorded" states.

### Service Contracts & SLA Timeline (R8)
- **Authoritative Contract Engine**: Built `contractEngine.ts` providing date-based working-day calculation (`startDate` to `completedDate` inclusive), machine coverage validation, and SLA utilization metrics.
- **2-Year Service Execution Timeline**: Implemented visual calendar and chronological timeline mapping real MHC session events by actual dates with working-day consumption indicators and direct session navigation.
- **Machine Coverage & Day Consumption Gauge**: Integrated visual utilization meters (allocated, consumed, remaining days) and multi-machine coverage tagging with instant event filtering.

## v2.3.7 — R7 MHC History Redesign (2026-09-14)

### MHC History Workspace (R7)
- **Calm Industrial Record Redesign**: Re-architected `MhcHistoryView` from a generic card list into the approved engineering service log workspace with restrained surfaces, deliberate whitespace, and strict data truth.
- **Prominent Machine Identity Header**: Integrated an authoritative machine header (`MhcHistoryHeader`) displaying equipment model, serial number, unit identifier, customer facility/line/zone, equipment operational status chip, and direct linkage to Machine Passport.
- **Quiet Search & Filter Toolbar**: Built a responsive search and filter toolbar (`MhcHistoryToolbar`) supporting free-text search across session ID/machine/customer/engineer, status filters (All, Completed, In Progress), and chronological sort toggles (Newest/Oldest first).
- **Inspection Chronology & Record Hierarchy**: Implemented chronological service session presentation (`MhcHistorySessionList`) with clear hierarchy, monospace canonical IDs, timestamps, and real metrics (findings count, spare parts count, readiness score).
- **Selected Inspection Detail Area**: Implemented a responsive 6-tab inspection detail workspace (`MhcHistoryDetailView`):
  - **Overview**: Machine specifications snapshot, lifecycle timing, and complete 10-activity protocol execution audit matrix.
  - **Findings**: Optical path defect observations and laser head inspection findings, X/Y stage calibration deviations, and AGC alignment results with honest empty states.
  - **Evidence**: Harvested photo attachments and engineering test sheets with interactive high-resolution inspection modal.
  - **Recommendations**: Spare parts inventory recommendations with wear condition tags, and lead engineer technical remarks & maintenance intervals.
  - **Report**: Embedded authoritative multi-page ISO report preview powered by `MhcFullPdfRenderer` with official PDF generation workflow.
  - **Buyoff**: Field engineer and customer acceptance audit trail, sign-off status, and handover remarks.
- **Preserved Core Engine & Architecture**: Full backward compatibility maintained for all existing MHC sessions, Machine Passport linkage, and persistence pipelines with zero artificial or manufactured values.

## v2.3.6 — R5 MHC Autopilot (2026-09-13)

### MHC Autopilot Workstation (R5)
- **Full-Width Preparation Workstation**: Re-engineered MHC pre-flight configuration into a dedicated preparation desk with clear sequential readiness validation.
- **4-Step Preparation Tracker**:
  - **Initializer**: Step 1 protocol initialization and baseline validation.
  - **Customer Binding**: Step 2 cleanroom customer account selection and verification.
  - **Equipment Asset**: Step 3 covered machine identification and optical specification binding.
  - **State Verification**: Step 4 pre-flight operational state check and session startup authorization.
- **Truthful Data Only**: Connected preparation solely to real saved customer accounts and registered machine fleet with zero synthetic defaults.
- **Resumable Session Safeguards**: Implemented session boundary protection and non-destructive draft discard workflows.

## v2.3.5 — R4 Machine Passport (2026-09-12)

### Machine Passport Engineering Workspace (R4)
- **Calm Engineering Workspace**: Transformed Machine Passport from static modals into an engineering workspace with high-density technical layouts.
- **Fleet Navigator**: Implemented cleanroom machine navigation with status filtering and customer line grouping.
- **Machine Identity**: Authoritative machine specification panel presenting model, serial number, cleanroom location, optics package, and operational state.
- **Current State Telemetry**: Real-time operational readiness, maintenance intervals, and recent service records.
- **Technical Subsystem Navigator**: Dedicated engineering workspaces for Laser Power Progression, Beam Profile Analysis, Focus Optimization, Product Process Parameters, and Temperature Telemetry.

## v2.3.4 — R3 Daily Work (2026-09-11)

### Daily Work Personal Workspace (R3)
- **Calm Personal Desk**: Redesigned Daily Work home module into a focused engineering workspace prioritizing immediate field execution.
- **Current Focus & Active Jobs**: Implemented real-time detection of in-progress MHC inspections with meaningful progress criteria (`hasMeaningfulMhcProgress`) to isolate active missions from empty drafts.
- **Needs Attention Feed**: Integrated actionable alerts for critical inspection findings, calibration anomalies, and contract expiry horizons.
- **Real Scheduled Agenda**: Built schedule timeline derived strictly from confirmed customer contracts and scheduled cleanroom maintenance dates.
- **Purged Synthetic Elements**: Removed fake mission toggles, artificial badges, placeholder metrics, and fallback facilities in favor of real database records.

## v2.3.3 — R2 Application Shell (2026-09-11)

### Application Shell & Navigation (R2)
- **Application Shell Structure**: Unified global navigation shell with high-contrast header, module breadcrumbs, and real-time connectivity status.
- **Sidebar & Destinations**: Streamlined navigation contracts across all primary FSOS modules with persistent active indicators and keyboard accessibility.
- **WorkspaceModeSelector**: Work-adaptive mode switching for Field Service Execution, Equipment Diagnostics, and Operations Administration.

## v2.3.2 — R1 Visual Foundation (2026-09-10)

### Visual Foundation & Design Tokens (R1)
- **Semantic Design Tokens**: Built authoritative Calm Industrial design token architecture in `/src/theme/tokens.ts`.
- **Surfaces & Text Hierarchy**: Defined light and dark theme surfaces (`canvas`, `workspace`, `surface`, `raised`, `overlay`) and high-contrast typography roles.
- **Borders, Radii & Spacing**: Standardized mathematical corner radii (`compact`, `standard`, `relaxed`, `pill`), subtle borders, and rhythmic container padding.
- **Typography & Motion**: Paired high-contrast monospace technical labels with refined UI typography and balanced micro-transition curves.

## v2.3.1 — FSOS Major Audit Release Closure (2026-09-10)

### Audit & Architecture
- **Report Overflow & Continuation Pagination**: Implemented deterministic overflow page budgeting for Sections 13–15 in `mhcReportEngine.ts` and dynamic container mapping in `MhcFullPdfRenderer.tsx`. Preserved standard 10-page layout while safely supporting continuation pages up to 13+ pages for high-volume findings, spare parts, and extended remarks without data clipping.
- **Section 15 Inviolable Grouping**: Enforced atomic co-location of disposition verdict, next scheduled MHC cycle, Field Service Engineer signoff, Customer Representative signoff, and customer remarks on the final report page.
- **MHC Active Session Indicator**: Corrected session progress evaluation in `mhcActiveSessionIndicator.ts` so newly initialized cleanroom sessions without meaningful progress do not falsely trigger Active Job status indicators.
- **Remote D1 Orphan Media Cleanup**: Preserved reference-aware orphan cleanup with strict 24-hour grace periods and alias-promotion draft deletion protection.
- **Version Authority Consolidation**: Centralized authoritative version declaration in `src/constants/version.ts` across client and server runtimes.

### FSOS Major Audit Scope

| Step | Audit Area | Owner | Type | Goal |
|---|---|---|---|---|
| 1 | Version Authority | Mikasa + Atlas | 🔍 Read-only | Reduce version locations to the minimum truly required |
| 2 | Persistence & Data Integrity | Mikasa + Atlas | 🔍 Read-only | Find proven risks, legacy traps, and unsafe coupling |
| 3 | Machine Passport ↔ Autopilot | Mikasa + Atlas | 🔍 Read-only | Verify sibling boundaries, shared data, identity, sessions |
| 4 | Large File / Responsibility | Mikasa + Atlas | 🔍 Read-only | Find genuinely mixed responsibilities/duplication—not split by size |
| 5 | D1 Migration History | Mikasa + Atlas | 🔍 Read-only | Verify migration consistency; never rewrite blindly |
| 6 | test_artifacts/ Hygiene | Mikasa + Atlas | 🔍 Read-only | Separate fixtures/reference evidence from disposable generated clutter |
| 7 | Engineering OS | Founder + Atlas | 🧠 Discussion | Make it smaller, clearer, and harder to misunderstand |
| 8 | Consolidation | Atlas + Founder | 📋 Review | One master list: fix / remove / keep / investigate |
| 9 | Approved Fixes | Mikasa | 🔧 Implementation | Small verified batches only |
| 10 | Final Verification & Release | All | ✅ Verification | Regression checks → changelog → correct version bump |

### Major Audit Outcome Summary
- **Version Authority**: Consolidated to the approved minimum in `src/constants/version.ts`.
- **Repository Hygiene**: Reviewed generated artifacts; removed disposable test artifacts with prevention rules in place.
- **D1 Migrations & Schema**: Audited historical migrations (`0000_init.sql`–`0002_fix_sync_history.sql`) and schema; deliberately preserved without blind rewriting.
- **Persistence & Storage**: Audited data integrity; preserved canonical `idb:` extraction and storage safeguards.
- **Remote Media Ownership**: Reviewed remote media references; preserved reference-aware orphan cleanup with a 24-hour grace period and draft alias protection.
- **Lifecycle Boundaries**: Audited MHC Session, Autopilot, and Machine Passport lifecycle boundaries; corrected false Active Session indication for empty new sessions.
- **Draft & Media Safety**: Verified draft discard media safety through existing alias-promotion protection.
- **Report Architecture & Continuation Pagination**: Audited report rendering; implemented deterministic continuation pagination for extreme content. Standard reports remain 10 pages; overflow reports dynamically expand to preserve all content without clipping.
- **Atomic §15 Inviolability**: Maintained atomic co-location of disposition verdict, scheduling, signatures, and customer remarks on the final page.
- **Code & UI Boundaries**: Maintained UI/UX and architectural stability without unauthorized redesigns. Note: Engineering OS Step 7 was handled via separate architectural discussions.
- **TypeScript Standardization**: Corrected test fixture type discrepancies in `mhcReportPagination.test.ts`.

### Verification & Quality
- Added unit tests for dynamic report pagination and section budgeting (`mhcReportPagination.test.ts`).
- Standardized test fixtures with full TypeScript type compliance.
- **Final Regression Verification Baseline**:
  - Vitest: 30/30 test files passed (209/209 unit tests passed).
  - TypeScript: `tsc --noEmit` passed with 0 errors.
  - Production Build: Passed (`vite build` + `esbuild` server bundle).
  - Release Version: `v2.3.1` (`CFW-20260910-1055`).

## v2.3.0 — Version History Standardization (2026-09-09)

### Engineering
- Standardized all 154 historical FSOS milestone releases to the strict vMAJOR.MINOR.PATCH format.
- Established v1.0.0 as the historical baseline.
- Enforced PATCH .0–.10 and MINOR 0–10 rollover rules.
- Removed non-standard historical version formats, including quad-part and phase-string versions.
- Preserved all release order, dates, titles, and release content.
- Synchronized version metadata and changelog parsing with the standardized history.

### Verification
- 154 milestone releases preserved.
- Standardized history verified from v1.0.0 through v2.2.10.
- 195 tests passed.
- TypeScript check passed.
- Production build passed.

## v2.2.10 — HYDRATED IMAGE PERSISTENCE BOUNDARY & MEDIA PURGE PRESERVATION FIX (2026-09-09)

### Hydrated Image Persistence Boundary
- **Canonical IDB Reference Preservation on Save**:
  - Enforced `ImageStore.extractAndStoreImagesSync()` across all persistence save paths (`saveMhcSessions`, `saveMachines`, `saveMhcRecords`, `saveReports`, `saveDrafts`, `saveTemplates`, `saveInvestigations`, `saveBranding`, `saveProfile`, `saveMhcReportDrafts`, `saveMhcWorkspaceTemplates`, `saveMhcWorkspaceDrafts`) in `persistence.ts`.
  - Guaranteed that in-memory hydrated `data:image/...` strings are converted back to canonical `idb:` pointer keys before writing to `localStorage`.
- **Reachability Scanner Preservation**:
  - Ensured structured `localStorage` records retain canonical `idb:` references, allowing `collectIdbKeys()` to discover active media references and preventing valid images from being purged by `purgeUnseenMedia()`.
- **Non-Destructive Local Storage Sanitization & Remote Updates**:
  - Updated `sanitizeLocalStorageGhostMedia()` and `SyncEngine.registerRemoteUpdateCallback()` to pass records through `extractAndStoreImagesSync()`, ensuring neither cleanup passes nor remote cloud sync writes raw base64 payloads to structured storage.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.8.1`.

## v2.2.9 — STARTUP MEDIA RECONCILIATION & REACHABILITY SCANNING FIX (2026-09-09)

### Startup Media Reconciliation & Reachability
- **Identity & Session Reconciliation Pre-Purge**:
  - Reordered the startup lifecycle sequence in `App.tsx` so machine and MHC session identity reconciliation completes before `purgeUnseenMedia()` executes.
  - Ensured all active parent records are linked and valid references are recognized prior to reachability evaluation.
- **Authoritative Reachability Key Inclusion**:
  - Updated `purgeUnseenMedia()` in `imageStore.ts` to scan all active Core Data records (machines, MHC sessions, reports, drafts, templates, branding, and profile) into the authoritative `reachableKeys` set.
  - Eliminated faulty ghost-filter exclusions on reachable keys so valid media referenced by active records is never classified as unseen or deleted.
- **Non-Destructive Local Storage Sanitization**:
  - Preserved valid media keys in `persistence.ts` during startup localStorage sanitization, preventing unintended property stripping.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.8.0`.

## v2.2.8 — IMAGE HYDRATION & REAL MEDIA GHOST CLASSIFICATION FIX (2026-09-09)

### Image Hydration & Ghost Classification Refinement
- **Reactive ImageStore Hydration in Machine Beam Profile Workspace**:
  - Added an `ImageStore.subscribe()` reactive listener to `MachineBeamProfileWorkspace.tsx` to automatically trigger component re-render when IndexedDB asynchronous image hydration completes on cold reload, resolving the 16 preserved Beam Profile images.
- **Real Media Ghost Classification Rule Refinement**:
  - Removed the hardcoded `wd-44367 + beamProfileRecords` ghost media exclusion in `imageStore.ts`.
  - Enforced the architectural rule that media owned by an active valid Beam Profile record is safe and never classified as ghost based solely on machine ID, naming pattern, or `.bin` extension.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.7.9`.

## v2.2.7 — BEAM PROFILE IMAGE RENDERING REGRESSION FIX (2026-09-09)

### Beam Profile Media Resolution & Render Hydration
- **IDB Reference Resolution in DOM Image Elements**:
  - Wrapped beam profile `<img src>` elements with `ImageStore.resolveImage(url)` across `BeamProfileCheckpointCard.tsx`, `MachineBeamProfileWorkspace.tsx`, and `MhcFullPdfRenderer.tsx` to prevent passing unresolved `idb:` scheme strings directly to the browser DOM.
- **Reactive ImageStore Hydration in Autopilot**:
  - Added an `ImageStore.subscribe()` lifecycle listener to `MhcLaserBeamActivity.tsx` to trigger reactive re-renders when asynchronous IndexedDB image hydration completes on cold reload.
- **Machine Beam Profile Record Preservation**:
  - Stopped `sanitizeMachine()` in `persistence.ts` from stripping valid `beamProfileRecords` `imageDataUrl` values so machine-level beam profile records retain their media references.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.7.8`.

## v2.2.6 — REMOVE REMAINING GHOST MEDIA & TRACE SOURCE (2026-09-09)

### Remaining Unseen Media Purge & Source Path Elimination
- **Source Path Root Cause Identification & Interception**:
  - Identified source paths where non-Founder-visible evidence images (from `MhcAgcActivity`, `MhcLaserInspectionActivity`, `MhcStageCalibrationActivity`, and machine `beamProfileRecords`) were passed to `extractAndStoreImagesSync()` during machine and session saves.
  - Hardened `ImageStore.extractAndStoreImagesSync()` to evaluate `isGhostMediaKey()` and immediately reject storage of non-Founder-visible ghost media keys.
- **Targeted Ghost Media Deletion Engine (`imageStore.ts`)**:
  - Expanded `isGhostMediaKey()` to comprehensively classify and delete the 6 remaining unseen media entries:
    - `MHC-SESS-1786717133921__agcData_agc1_evidenceImage`
    - `MHC-SESS-1786717133921__agcData_agc2_evidenceImage`
    - `MHC-SESS-1786717133921__inspectionFindings_lh2_findings_0_evidenceImage`
    - `MHC-SESS-1786879186339__agcData_agc1_evidenceImage`
    - `MHC-SESS-1786879186339__agcData_agc2_evidenceImage`
    - `WD-44367__beamProfileRecords_0_readings_6B_imageDataUrl`
  - Preserved strictly the 16 legitimate Founder-visible Stage 02 Beam Profile images.
- **LocalStorage & Core Data Ghost Reference Stripping (`persistence.ts`)**:
  - Enhanced `stripGhostMediaFromObject()` and added `stripBeamProfileRecordImages()` to remove `agcData.evidenceImage`, `inspectionFindings.*.findings[].evidenceImage`, `laserInspection` evidence, and machine `beamProfileRecords.*.imageDataUrl` references from persisted data and backups.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.7.7`.

## v2.2.5 — DELETE UNSEEN GHOST MEDIA (2026-09-08)

### Unseen Ghost Media Elimination & Persistent Storage Stripping
- **Targeted Ghost Media Detection & Deletion Engine (`imageStore.ts`)**:
  - Implemented `isFounderVisibleBeamProfileKey()` and `isGhostMediaKey()` to explicitly classify media entries into legitimate Founder-visible images vs unseen ghost media.
  - Preserves strictly the 16 legitimate Founder-visible Stage 02 Beam Profile images (`MHC-SESS-*__stage02_laserProfile_beamProfileRecord_readings_*`).
  - Permanently purges unseen ghost media entries including `focusOptimizationRecord_*`, `productProcessRecord_*`, `stageCalibrationData_*`, `agcCalibration`, `temperatureEvidence`, and `laserInspection` from IndexedDB and all runtime memory caches.
- **LocalStorage & Data Structure Ghost Reference Sanitization (`persistence.ts`)**:
  - Implemented `stripGhostMediaFromObject()`, `stripFocusOptimizationRecordImages()`, and `stripProductProcessRecordImages()` to recursively strip ghost media URL references from MHC sessions, machines, drafts, reports, and templates.
  - Added `StorageService.sanitizeLocalStorageGhostMedia()` to clean all persistent localStorage keys on application startup and during data ingestion.
- **Automated Restore & Export Ghost Media Cleansing (`backupEngine.ts`)**:
  - Updated `createPortableBackupZip()`, `restorePortableBackup()`, and `restoreCompleteBackup()` to filter out ghost media references and binaries.
  - Existing backups restored into FSOS are automatically cleaned so ghost media cannot survive or recreate in storage.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.7.6`.

## v2.2.4 — FIX BACKUP SIZE REGRESSION (2026-09-08)

### Media Alias Preservation & Deduplicated Portable Backup Architecture
- **Restored Canonical Alias Preservation in Media Purge (`imageStore.ts`)**:
  - Corrected `ImageStore.purgeUnseenMedia()` to preserve surviving `ref:...` alias pointers in IndexedDB rather than expanding them into duplicate full binary payloads.
  - Ensured alias promotion to canonical payload only occurs if the referenced target key is actively being deleted.
- **Single-Pass Deduplicated Binary Export in Portable Backup (`backupEngine.ts`)**:
  - Updated `createPortableBackupZip()` with an active payload-to-canonical deduplication map during backup serialization.
  - Guaranteed that each unique image binary payload is written exactly once to the `media/` folder inside the `.fsosbackup` ZIP archive.
  - Recorded all secondary keys with matching payloads as lightweight `alias` references in `manifest.json` and `data/media_index.json`, preventing ZIP archive bloat.
- **Strict Data and MHC Logic Isolation**:
  - Maintained complete integrity of existing Founder-visible images, machine passports, and MHC session stages with zero data or localStorage mutation.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.7.5`.

## v2.2.3 — DELETE UNSEEN MEDIA FROM EXISTING INDEXEDDB (2026-09-08)

### Existing IndexedDB Media Store Cleanup & Active Image Preservation
- **Live IndexedDB Unseen Media Purge Engine (`imageStore.ts`)**:
  - Implemented `ImageStore.purgeUnseenMedia()` to execute direct batch deletion against existing live IndexedDB media storage.
  - Enforces the Founder directive: *"If I can't see it, delete it."*
  - Re-evaluates authoritative reachable keys across all active FSOS Core Data structures (active machine passports, MHC sessions, reports, templates, drafts, profiles, branding, and signatures).
  - Deletes all unseen, orphaned, and ghost media entries from physical IndexedDB storage and clears runtime memory caches.
  - Resolves any remaining referenced alias pointers (`ref:...`) to canonical payloads before deleting targets to guarantee zero broken references.
- **Automated Startup & Audit Storage Cleansing (`App.tsx`, `mediaEvidenceAudit.ts`)**:
  - Wired automated `purgeUnseenMedia()` execution on application startup and targeted state hydration in `App.tsx`.
  - Updated `cleanupOrphanedMedia()` and `auditMediaEvidence()` to scan both raw storage entries and resolved images, purging ghost records and reflecting exact physical storage state.
- **Strict 16 Founder-Visible Image Preservation**:
  - Guaranteed zero mutation or loss for all 16 legitimate Founder-visible images across Machine Passports and MHC Session Stages.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, `SettingsModule.tsx`, and `CHANGELOG.md` to `v1.7.4`.

## v2.2.2 — REMOVE UNNECESSARY MEDIA REFERENCES (2026-09-08)

### Media Evidence Source Investigation & Unnecessary Reference Elimination
- **Investigation of Duplicate & Redundant Media References**:
  - Traced the origin of reported duplicate/alias relationships across IndexedDB media records down to root data creation paths.
  - Identified and eliminated unintended duplicate schema arrays on `MHCSession`:
    - `session.focusOptimizationRecords` (plural array) was an unintended duplicate mirror of `session.focusOptimizationRecord` (singular), which generated 14 redundant physical wafer drill image keys per session.
    - `session.productProcessRecords` (plural array) was an unintended duplicate mirror of `session.productProcessRecord` (singular), which generated redundant synthetic micro-via cross-section image keys per session.
  - Identified and optimized Machine Passport vs MHC Stage 02 synchronization:
    - Updated `MhcLaserBeamActivity.tsx` to pass the session's canonical media references when saving evaluated beam profile records to `machine.beamProfileRecords`, eliminating redundant binary extraction passes.
- **Structural Schema Cleansing & Ingestion Sanitization (`types/index.ts`, `persistence.ts`)**:
  - Removed redundant `focusOptimizationRecords` and `productProcessRecords` plural fields from the `MHCSession` interface.
  - Implemented `sanitizeMhcSession` in `persistence.ts` to migrate legacy sessions, cleanly removing redundant plural records while preserving single authoritative records and all Founder-visible data.
  - Updated `MhcFocusOptimizationActivity.tsx`, `MhcProductProcessActivity.tsx`, `MhcAutopilot.tsx`, `mhcAutopilotBrain.ts`, and `mhcReportEngine.ts` to operate strictly on the single authoritative record paths.
- **Automated Orphaned Media Reconciliation**:
  - Unreferenced legacy media keys resulting from the eliminated redundant schema properties are safely identified and cleaned up by `cleanupOrphanedMedia()`.
  - All legitimate operational data, historical machine timeline records, and Founder-visible beam profile, wafer drill, and micro-via images remain fully preserved.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `package.json`, `metadata.json`, and `CHANGELOG.md` to `v1.7.3`.

## v2.2.1 — MEDIA DEDUPLICATION & CANONICAL CONSOLIDATION (2026-09-08)

### Media Evidence Forensic Investigation & Physical Storage Consolidation
- **Forensic Investigation of Duplicate Payload Groups**:
  - Investigated the 32 duplicate payload groups reported by Media Evidence Diagnostics across 73 IndexedDB records and 41 unique payloads.
  - Resolved physical duplication causes:
    1. Sample dataset initial seeding wrote identical test images under discrete record keys prior to canonical pointer architecture.
    2. Cold memory caches during multi-session workflows previously skipped canonical mapping lookups.
- **Physical vs. Logical Storage Separation (`mediaEvidenceAudit.ts`, `mediaAudit.ts`)**:
  - Updated forensic audit engine to differentiate physical IndexedDB storage footprint (evaluating raw stored `ref:<canonicalKey>` pointers vs. full payloads) from logical hydrated runtime volume.
  - Calculated exact duplicate overhead, consolidated alias counts, and actual reclaimed storage.
- **Deduplication Hardening Across Ingestion & Restore (`imageStore.ts`)**:
  - Hardened `saveImage` to inspect raw IndexedDB storage directly for existing canonical hashes even when runtime memory cache is cold.
  - Hardened `restoreImages` to deduplicate incoming payloads during full backup restoration, converting identical payloads into lightweight `ref:<canonicalKey>` pointers.
  - Provided idempotent, safe `consolidateDuplicatePayloads()` operation to convert all legacy physical duplicate records into canonical references with 100% logical reference preservation.
- **Settings & Media Evidence Diagnostics UI Enhancement (`SettingsModule.tsx`)**:
  - Added dedicated "Consolidate Duplicate Payloads" action with real-time feedback banner detailing consolidated groups, entries, and reclaimed storage.
  - Enhanced Duplicate Payload Analysis tab with clear badges for `[Canonical Master]`, `[Alias Pointer (ref:...)]`, and `[Physical Copy]`.
  - Added live indicators of physical storage volume vs. hydrated volume in the Media Store Summary.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version declarations across `src/constants/version.ts`, `src/version.ts`, `package.json`, `metadata.json`, and `CHANGELOG.md` to `v1.7.2`.

## v2.2.0 — PORTABLE COMPLETE BACKUP V1 (.FSOSBACKUP) (2026-09-08)

### Portable Complete Backup (.fsosbackup) Architecture
- **Single-File Portable Archive Container (`exportPortableBackup`, `restorePortableBackup`, `backupEngine.ts`)**:
  - Implemented standard ZIP archive packaging using browser-native, streaming-capable `fflate` engine.
  - Archive file format structure:
    - `manifest.json`: Top-level archive envelope metadata, format version, domain counts, and media summary metrics.
    - `data/core.json`: Full FSOS structured JSON operational data (Machines, MHC Sessions, Reports, Templates, Profile).
    - `data/media_index.json`: Complete logical media catalog preserving category metadata, format, canonical vs. alias classification, and canonical key mappings.
    - `media/<canonicalKey>.<ext>`: Raw binary image files without Base64 encoding overhead (zero Base64 bloat).
- **Canonical Deduplication & Reference Preservation**:
  - Preserved the existing `ImageStore` canonical/reference model: duplicate image payloads are written as physical raw binaries *only once* under their canonical key.
  - Logical reference keys (`ref:<canonicalKey>`) are cataloged as lightweight metadata entries in `data/media_index.json` without allocating duplicate binary payloads in the archive.
- **Pre-Restoration Non-Destructive Validation (`validatePortableBackupArchive`)**:
  - Validates ZIP archive integrity, manifest schema, domain records, and media index before applying any state mutations.
  - Checks for required archive entries and confirms binary media presence for all canonical references.
  - Automatically executes an automatic pre-restore safety snapshot of the current local state prior to mutation.
- **Progressive, Memory-Safe Restoration Flow**:
  - Restores Core Data state into `localStorage`.
  - Restores physical canonical binary images into `ImageStore` IndexedDB (`evidence_images`) first, followed by alias mapping references (`ref:<canonicalKey>`).
  - Resets sync telemetry state (`lastSyncTime = null`) to prevent cross-device sequence collisions.
  - Automatically re-evaluates and reconciles active engineer identity and triggers clean application restart.
- **Backup UI Separation & Export Simplification (`SettingsModule.tsx`)**:
  - Separated Backup & Storage from Changelog using dedicated sub-navigation tabs; Changelog returns to dedicated version/history display.
  - Simplified export UI: presents one clear primary action (`Export Portable Backup (.fsosbackup)`) without competing legacy JSON export choices.
  - Maintained full legacy JSON restore compatibility alongside `.fsosbackup` portable archives in the unified restore flow.
- **Exhaustive Unit & Integration Test Suite (`portableBackup.test.ts`)**:
  - Verified: (1) Archive structure and manifest, (2) Raw binary media extraction, (3) Alias reference mapping without binary bloat, (4) Round-trip export and restore fidelity, (5) Corrupt archive rejection, (6) Pre-restore snapshot generation.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `src/version.ts`, `package.json`, `metadata.json`, and `CHANGELOG.md` to `v1.7.1`.

## v2.1.10 — SAFE ORPHANED MEDIA RECONCILIATION & CLEANUP (2026-09-07)

### Safe Orphaned Media Reconciliation & Storage Reclaim
- **Deterministic Orphan Detection & Read-Only Preview (`previewOrphanedMediaCleanup`, `mediaEvidenceAudit.ts`)**:
  - Implemented mathematical set reconciliation comparing physical IndexedDB `evidence_images` against authoritative active Core Data references (`ImageStore.collectIdbKeys()`).
  - Strict orphan classification: An IndexedDB image is marked as an orphan candidate *if and only if* its `idb:` key exists in IndexedDB and is NOT referenced in active Core Data (Machines, MHC Sessions, Reports, Templates, or Engineer Profiles).
  - Provided deterministic, zero-mutation preview detailing total stored entries, active referenced entries, candidate orphan counts, reclaimable byte sizes, and category breakdown.
- **Safe Explicit Cleanup Execution (`cleanupOrphanedMedia`, `ImageStore.deleteImageKeys`)**:
  - Engineered safe, batch-oriented IndexedDB deletion (`ImageStore.deleteImageKeys`) executing selective key deletes (`store.delete(key)`) without ever calling `clear()` or wiping the store.
  - Dynamically re-evaluates active Core Data references at execution time, preventing stale audit results from deleting newly attached evidence.
  - Strictly preserves all active media references across machine passports, beam profiles, focus optimizations, and completed historical MHC sessions.
  - Strictly prohibits deletion based on duplicate payload detection (duplicate payloads under active keys remain 100% untouched).
  - Automatically evicts deleted keys from runtime memory caches (`imageMemoryCache`, `persistedInIdbKeys`, `pendingIdbWrites`, `inFlightReads`) and updates listeners.
- **Interactive Settings Module Reconciliation Dashboard (`SettingsModule.tsx`)**:
  - Integrated "Safe Orphaned Media Reconciliation & Cleanup" controls directly into the Media Evidence Diagnostics view with explicit Founder confirmation prompts.
  - Displayed real-time post-cleanup success metrics showing removed records, reclaimed UTF-8 storage, remaining stored entries, and remaining orphan counts.
- **Comprehensive 10-Scenario Test Suite (`orphanedMediaReconciliation.test.ts`)**:
  - Verified: (1) Referenced key retention, (2) Orphan detection, (3) Missing key safety (no delete), (4) Duplicate referenced payloads preservation, (5) Shared duplicate orphan deletion safety, (6) Completed historical session preservation, (7) Empty IndexedDB safety, (8) Empty Core references handling, (9) Dynamic execution-time reference re-evaluation, and (10) Store wipe prevention.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `src/version.ts`, `package.json`, `metadata.json`, and `CHANGELOG.md` to `v1.7.0`.

## v2.1.9 — GHOST AUTOPILOT BOUNDARY ISOLATION (2026-09-07)

### Ghost Autopilot Session Boundary & Recovery Isolation
- **Strict Autopilot Recovery Boundary (`mhcAutopilotBrain.ts`, `MhcAutopilot.tsx`, `MachineHealthCheckModule.tsx`)**:
  - Eliminated the faulty fallback pattern (`|| mhcSessions.find(s => s.machineId === machineId)`) that previously latched onto historical `COMPLETED` sessions when zero active/incomplete drafts existed.
  - Implemented `resolveEffectiveAutopilotSession` pure helper strictly guaranteeing that only incomplete sessions (`completionStatus !== 'COMPLETED'`) can ever be resolved as the effective active session.
  - When no active/incomplete draft exists for a selected machine, Autopilot now starts completely clean (0% Readiness, clean default progression, zero checked activities).
- **Preserved Historical Records & MHC History View (`MhcHistoryView.tsx`)**:
  - Maintained 100% data integrity for all completed historical MHC records, ensuring full availability in MHC History, executive reports, and baseline comparison models without mutation or deletion.
- **Exhaustive 7-Scenario Regression Test Suite (`mhcAutopilotSessionBoundary.test.ts`)**:
  - Added full test coverage for: (1) No sessions, (2) Only COMPLETED sessions, (3) Single incomplete session, (4) Mixed COMPLETED + incomplete sessions, (5) Completed session for other machine, (6) Zero active fleet drafts, and (7) MHC History preservation.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `src/version.ts`, `package.json`, `metadata.json`, and `CHANGELOG.md` to `v1.6.0`.

## v2.1.8 — MEDIA EVIDENCE SIZE & PROVENANCE AUDIT (2026-09-07)

### Media Evidence Size & Provenance Audit
- **Strict Read-Only Forensic Analysis (`mediaEvidenceAudit.ts`, `mediaAudit.ts`)**:
  - Implemented 100% read-only forensic analysis of IndexedDB `evidence_images` with zero data mutation, deletion, deduplication, compression, or migration.
  - Calculated exact UTF-8 byte volumes using browser-native `TextEncoder` and string character lengths for every media evidence entry.
- **Deterministic Category Classification (`classifyMediaCategory`)**:
  - Classified media entries into 10 deterministic engineering categories without guesswork: Beam Profile, MHC Session, Focus Optimization, Product & Process, Laser Power, Machine Passport, Signatures, Findings / Evidence, Reports / Drafts / Templates, and Other / Unknown.
  - Extracted source provenance and payload formats (`data:image/png`, `data:image/jpeg`, `data:image/webp`, `data:image/svg+xml`, `raw SVG`, `other data URL`, `unknown string`).
- **Active vs. Orphaned Reference Verification (`collectAllReachableCoreIdbKeys`)**:
  - Scanned active Core Data structures across Machines, MHC Sessions, Reports, Templates, and Engineer Profiles to map all reachable `idb:` references.
  - Identified active referenced entries versus orphaned IndexedDB records, and detected missing referenced keys (where Core Data references an `idb:` key not present in IndexedDB).
- **Duplicate Payload Grouping & Storage Savings Analysis**:
  - Grouped entries with identical visual payloads to calculate unique payload count, duplicate entry count, and exact duplicate storage overhead / potential deduplication savings.
- **Settings Module Forensic Dashboard & Top Consumers Inventory (`SettingsModule.tsx`)**:
  - Integrated 5-tab forensic audit interface inside "Media Evidence Diagnostics & Storage Guard":
    - **Media Store Summary**: High-level KPIs (Total Records, Total Storage Bytes, Active vs. Orphaned, Unique vs. Duplicate Payloads, Overhead).
    - **Category Storage Breakdown**: Visual distribution bars, entry counts, total bytes, and percentage breakdown.
    - **Active vs. Orphaned Reference Analysis**: Active reference mappings and missing key detection alerts.
    - **Duplicate Payload Analysis**: Duplicate group telemetry, single vs. total size, and referencing key lists.
    - **Top Storage Consumers & Inventory**: Interactive ranked table with search, category filtering, status filtering, and copyable keys.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `CHANGELOG.md` to `v1.5.11`.

## v2.1.7 — REACT FIBER IMAGE CONTAMINATION GUARD & SAFE INDEXEDDB CLEANUP (2026-09-07)

### React Fiber Image Contamination Guard & Safe IndexedDB Cleanup
- **Defensive Traversal Boundaries at Ingestion (`ImageStore.extractAndStoreImagesSync`)**:
  - Implemented strict runtime type and duck-typing guards (`isBlockedDomOrEventObject`) against browser DOM elements (`Node`, `Element`, `HTMLElement`, `Document`, `Window`), standard DOM events, React SyntheticEvents, and internal React Fiber tree representations (`stateNode`, `memoizedProps`, `memoizedState`, `return`, `child`).
  - Added property-level recursion filters (`isBlockedTraversalKey`) blocking traversal into `__reactFiber*`, `__reactProps*`, `__reactEvents*`, `_react*`, `nativeEvent`, `target`, and `currentTarget`.
  - Preserved 100% of legitimate nested engineering payloads, Base64 data URLs, SVG drawings, active ancestor cycle prevention, and structural object references.
- **Deterministic Malformed Key Classifier (`ImageStore.isMalformedReactDerivedImageKey`)**:
  - Implemented exact pattern matching isolating confirmed React/DOM-derived keys (e.g. `idb:<recordId>__target___reactFiber$*`, `_return_`, `_child_`, `_memoizedProps_`).
  - Guaranteed zero false positives across all legitimate FSOS engineering keys (`beamProfileRecords`, `focusOptimizationRecords`, `productProcessRecords`, `laserPowerRecords`, MHC stage evidence, and engineer signatures).
- **Non-Destructive Forensic Audit & Safe Cleanup (`ImageStore.auditMalformedImages`, `ImageStore.cleanupMalformedReactDerivedImages`)**:
  - Added non-destructive, read-only audit scanning IndexedDB `evidence_images` and runtime memory caches to classify legitimate versus contaminated entries.
  - Added surgical, non-automatic cleanup purging confirmed React-derived internal artifacts from IndexedDB, LRU memory caches, and pending write queues while strictly preserving 100% of authentic engineering images.
- **Settings Module Media Diagnostics & Storage Guard (`SettingsModule.tsx`)**:
  - Integrated interactive "Media Evidence Diagnostics & Storage Guard" providing manual audit triggers, legitimate vs. artifact telemetry breakdowns, and confirmation-guarded purge execution.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.10`.

## v2.1.6 — COMPLETE ARCHIVE: MEDIA EVIDENCE BACKUP & RESTORE (2026-09-07)

### Complete Archive (Core + Media Evidence Backup & Restore)
- **Paired Core + Media JSON Backup Architecture (`backupEngine.ts`, `backup.ts`)**:
  - Implemented Complete Archive export generating two synchronized, discrete JSON files: `fsos-core-backup-<timestamp>.json` and `fsos-media-backup-<timestamp>.json`.
  - Linked files using a shared, immutable `backupId` in both manifests (`FSOSBackupManifest` and `FSOSMediaBackupManifest`), with `includesImages: true` and explicit `imageCount` validation.
  - Zero external dependencies: no ZIP or compression libraries added, preserving pure browser-native memory safety.
- **Image Evidence Export & Exact `idb:` Key Preservation (`imageStore.ts`)**:
  - Exported all evidence images (`getAllImages()`) across IndexedDB with byte-for-byte fidelity.
  - Preserved original key structure: `Original IndexedDB Key → Media Backup Key → Restored IndexedDB Key` remains 100% identical with no ID regeneration, key normalization, or pointer rewriting.
- **Non-Destructive Image Restore & Cache Invalidation (`ImageStore.restoreImages`)**:
  - Applied batched IndexedDB upsert (`IDBObjectStore.put`) to restore image evidence without clearing `fsos_evidence_db`, deleting existing photos, or dropping non-conflicting media.
  - Flushed runtime memory caches (`invalidateRuntimeCaches()`) and notified reactive UI listeners so restored media resolves immediately upon application reload.
- **Defensive Dual-File Validation & Flexible Restore Support**:
  - Structured validator (`validateCompleteBackup`, `validateMediaBackup`) verifying manifest schema, matching `backupId` pairs, and image dictionary counts prior to mutation.
  - Core-only restore remains fully supported if media is omitted or unselected.
- **Settings Module Dual Export & Dual Restore Interface (`SettingsModule.tsx`)**:
  - Added dedicated "Export Complete Archive" button triggering coordinated dual file downloads.
  - Added dual-file selector supporting Core JSON and optional Media JSON with comprehensive pre-restore validation summary, image count badge, and safety snapshot download.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.9`.

## v2.1.5 — FULL CORE DATA BACKUP & SAFE RESTORE (2026-09-07)

### Full Core Data Backup & Safe Restore
- **Full Core Data Backup Engine (`backupEngine.ts`)**:
  - Implemented versioned, envelope-wrapped (`FSOSFullBackupEnvelope`) export covering 100% of core operational FSOS domains (Machines and embedded engineering records, Customers, Plants, Lines, Contracts, Schedules, MHC Sessions, Reports, Audit Records, Tasks, Alerts, Baselines, Investigations, Templates, Drafts, Recommended Parts, Branding, and Profile).
  - Explicit manifest metadata tracking (`backupVersion: "1.0.0"`, `appVersion`, UTC `createdAt`, unique `backupId`, domain counts) with strict non-inclusion of binary image blobs and raw high-frequency temperature tables.
- **Defensive Pre-Restore Validation & Live Domain Preview**:
  - Structured validator (`validateBackup`) inspecting envelope schema, version compatibility (v1.x), primary key integrity, and dynamic domain record counts with zero storage mutation.
  - Interactive preview and confirmation modal in Settings with domain metrics breakdown, core-data-only notices, and non-fatal warning diagnostics.
- **Atomic Snapshot Replace with Pre-Restore Safety Guard**:
  - Integrated automatic pre-restore safety snapshot generation (`fsos-pre-restore-safety-snapshot-*.json`) directly downloading current state prior to any storage mutation.
  - Direct atomic write to storage keys bypassing normal sync enqueue wrappers, followed by clean sync engine queue/cache reset (`SyncEngine.resetLocalSyncState()`) and deterministic relational identity reconciliation (`reconcileCustomerIdentities`, `reconcileMhcSessionIdentities`).
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.8`.

## v2.1.4 — DATA SAFETY: PREVENT DESTRUCTIVE PARTIAL JSON IMPORT (2026-09-07)

### Data Safety: Prevent Destructive Partial JSON Import
- **Defensive Partial Backup Merging (`LaserEngine.parseAndMapLaserMonitorJson`)**:
  - Prevented data loss by updating only matching active machines with supported Laser Monitor backup fields (identity, model, serial, laser lifecycle, and calibration history) while strictly preserving 100% of existing embedded engineering records (`focusOptimizationRecords`, `laserPowerRecords`, `beamProfileRecords`, `manualTemperatureReadings`, `temperatureRecords`, `productProcessRecords`, `maintenanceHistory`, `consumables`, `photos`).
- **Safe Rejection of Unmatched Partial Records**:
  - Prohibited partial Laser Lifecycle JSON files from creating new active Machine Passport records, preventing stripped or incomplete machine objects from entering local storage, SyncEngine queues, or D1 cloud replicas.
  - Automatically skip unmatched records with explicit validation warnings and diagnostic summaries in the import workflow.
- **Import Preview and Result Modal Safety Telemetry**:
  - Updated `MachinePassportModule` import modals to display matched vs. skipped metrics with clear data-safety authority badges.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.7`.

## v2.1.3 — RESTORE MHC SESSION MACHINE IDENTITY LINKS (2026-09-06)

### Restore MHC Session Machine Identity Links
- **Deterministic Machine Identity Reconciliation (`mhcIdentityReconciler`)**:
  - Implemented multi-tier deterministic matching algorithm (`SERIAL_NUMBER_MATCH`, `MACHINE_ID_NORMALIZED_MATCH`, `MACHINE_NAME_MATCH`, `COMPOSITE_MODEL_CUSTOMER_MATCH`) to re-link orphaned `MHCSession.machineId` values to active machine fleet identities following Laser Monitor JSON backup import.
  - Preserved session payloads, session IDs, activity progress, findings, timestamps, and `idb:<imageId>` evidence references 100% byte-for-byte and logically intact.
- **Defensive Idempotent Reconciliation Hooks**:
  - Integrated `StorageService.reconcileMhcSessions()` into core lifecycle hooks (`App.tsx` startup/IDB hydration, batch machine imports, and `MachineHealthCheckModule` machine state listener).
  - Ensured idempotency: already-linked sessions remain untouched, no duplicate sessions are created, and ambiguous mappings are halted safely with structured diagnostics.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.6`.

## v2.1.2 — RESET STALE CONFIRMED CLOUD IMAGE STATE (2026-09-06)

### Reset Stale Confirmed Cloud Image State on Empty D1 Replica
- **Invalidate Stale `confirmedCloudImages` on `serverRecordCount === 0`**:
  - Resolved root cause where source PC client's persisted `fsos_confirmed_cloud_images_v2` caused `uploadPendingImages()` to skip chunk upload when D1 `image_chunks` was wiped/empty.
  - Automatically clear in-memory `confirmedCloudImages` and purge `fsos_confirmed_cloud_images_v2` from persistent storage when `serverRecordCount === 0` is detected in `reconcileLocalData()` and `pullCloudChanges()`.
  - Enables `uploadPendingImages()` to naturally re-upload local image chunks to D1 so target devices can fetch `/api/images/:imageId/info` (HTTP 200) and assemble binary image payloads.
- **Preserved Idempotency & Zero-Redundancy on Active Servers (`serverRecordCount > 0`)**:
  - Preserved confirmed image caching when server contains records (`serverRecordCount > 0`), preventing redundant full image re-uploads.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.5`.

## v2.1.1 — RESTORE MISSING PARENT RECORD RECONCILIATION (2026-09-06)

### Stale Bootstrap State Invalidation on Empty D1 Records
- **Automatic Recovery on `serverRecordCount === 0`**:
  - Detected proven root cause where PC client's persisted `fsos_synced_keys_v1` suppressed local record reconciliation while D1 `records` was empty.
  - Invalidate and purge stale `bootstrappedKeys` when `serverRecordCount === 0` in both `reconcileLocalData()` and `pullCloudChanges()`.
  - Enables local authoritative records containing `idb:<imageId>` references to be queued and POSTed via the standard `/api/sync` pipeline.
- **Preserved Idempotency & Zero-Redundancy on Active Servers (`serverRecordCount > 0`)**:
  - Maintained full bootstrap caching when the server contains records (`serverRecordCount > 0`), preventing redundant sync traffic.
- **Fail-Safe Recovery Semantics**:
  - Reconcile or sync failures retain queue items without falsely marking recovery complete, ensuring reliable retry.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.4`.

## v2.1.0 — INSTRUMENT D1 IMAGE CHUNK 503 FAILURE (2026-09-06)

### Structured Diagnostic Instrumentation for Chunk Uploads
- **Cloudflare Worker Diagnostic Headers & Error Payload (`POST /api/images/chunk`)**:
  - Implemented precise stage tracking (`INIT`, `PARSE_HEADERS`, `READ_BODY`, `D1_CONNECT`, `D1_CLEANUP_ORPHANS`, `D1_UPSERT`) across chunk processing.
  - Added request execution timing (`durationMs`, `d1DurationMs`) and unique `reqId` generation (`crypto.randomUUID()`).
  - Standardized structured error responses with HTTP diagnostic headers (`X-Request-Id`, `X-Stage`, `X-Duration-Ms`, `X-D1-Duration-Ms`) and JSON diagnostic bodies.
- **Local Dev Server Parity (`server.ts`)**:
  - Instrumented local development Express server with identical stage tracking, timing, and response headers for seamless test parity.
- **Client-Side Diagnostic Capture & Telemetry (`SyncEngine`)**:
  - Enhanced `SyncEngine` with `lastImageUploadDiagnostic` and detailed per-ref failure telemetry (`FailedImageUploadInfo`).
  - Added diagnostic getters (`getLastImageUploadDiagnostic()`, `getFailedImageUploads()`) and unified upload failure logging to isolate 503 causes.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, and `metadata.json` to `v1.5.3`.

## v2.0.10 — FIX STALE IMAGE SYNC STATE (2026-09-06)

### Stale Tracker Invalidation & Authoritative Cloud Image Confirmation
- **Invalidation of Legacy Unverified Image Tracker (`fsos_synced_images_v1`)**:
  - Automatically invalidates and purges the legacy `fsos_synced_images_v1` tracker on `SyncEngine.init()`.
  - Replaced blind local assumption with `confirmedCloudImages` (`fsos_confirmed_cloud_images_v2`), which is ONLY populated upon verified completion of all binary chunks upload or successful client-side download from D1.
- **Unblocking Stalled Source PC Image Uploads (`uploadPendingImages`)**:
  - Source PC with local `idb:<imageId>` images is no longer permanently skipped due to stale local markers.
  - Verifies cloud persistence and re-uploads binary chunks to D1 with exponential backoff on retry.
- **Unblocking Target Device Image Replication (`downloadMissingImages` & `processDownloadQueue`)**:
  - Target device (e.g. Work Laptop) is no longer blocked from downloading missing cloud images by legacy local markers.
  - Missing images are queued sequentially, downloaded via `/api/images/:imageId/info` and raw chunk streams, client-reassembled, and saved to IndexedDB before marking confirmed.
- **Controlled Concurrency & Request Protection**:
  - Retains single-image in-flight download queue processing and exponential backoff retry logic, preventing 404 polling storms or concurrent thrashing.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.5.2`.

## v2.0.9 — COMPLETE D1 CROSS-DEVICE IMAGE SYNC (2026-09-06)

### Symmetric Raw Binary Image Download & SQL-Optimized Sync
- **Symmetric Chunk Download Architecture (`GET /api/images/:imageId/info` & `/chunk/:index`)**:
  - Implemented metadata info endpoint returning total chunks, MIME type, and byte size.
  - Implemented single raw binary chunk retrieval (`application/octet-stream`), completely eliminating monolithic full-image reassembly and Base64 conversion inside Cloudflare Workers.
- **Client-Side Progressive Image Reassembly (`SyncEngine.processDownloadQueue`)**:
  - Orchestrates sequential chunk downloads on the client with single-image concurrency limits.
  - Prevents duplicate in-flight requests and avoids request storms using exponential retry backoff (`missingRemoteImages`).
  - Saves reassembled images directly into IndexedDB via `ImageStore.saveImage`.
- **SQL-Side Bounded Changes Querying (`GET /api/changes`)**:
  - Replaced unconstrained table retrieval with direct SQL filtering (`WHERE updated_at > ? AND device_id != ? ORDER BY updated_at ASC LIMIT 500`).
  - Added device exclusion on initial sync (`WHERE device_id != ? AND is_deleted = 0`) to minimize Worker D1 CPU load and memory usage.
- **Truthful Sync State Reporting**:
  - Refined `SyncEngine.getState()` to accurately track pending and downloading image replication.
  - Ensures sync badge displays truthful "Pending" status when image synchronization or retry backoff is in progress.
- **Authoritative Version Synchronization**:
  - Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.5.1`.

## v2.0.8 — CLIENT-SIDE BINARY CHUNKING FOR D1 IMAGE TRANSPORT (2026-09-06)

### High-Performance Binary Chunked Transport Architecture
- **Client-Side Chunk Decomposition (`SyncEngine.uploadPendingImages`)**: Slices binary image payloads into ≤ 512 KB raw binary chunks on the client before transmission, bypassing monolithic Base64 JSON payloads and eliminating Cloudflare Worker CPU timeouts (HTTP 503).
- **Dedicated Binary Transport Endpoint (`POST /api/images/chunk`)**: Implemented raw `application/octet-stream` transport passing chunk metadata via headers (`X-Image-Id`, `X-Chunk-Index`, `X-Total-Chunks`, `X-Mime-Type`, `X-Byte-Size`, `X-Device-Id`).
- **Single-Chunk Parameterized D1 Upsert**: Cloudflare Worker and Node dev servers handle one chunk per request with isolated, sub-50ms single-row upserts (`ON CONFLICT(image_id, chunk_index) DO UPDATE`), eliminating the 32MB D1 RPC batch limit constraint.
- **Interrupted Recovery & Idempotent Cleanup**: Chunk 0 upload resets any stale higher-index chunks from prior versions while preserving atomicity. Incomplete uploads fail fast with exponential backoff and are never marked synced until all chunks succeed.
- **Backward Compatibility & Retrieval Integrity**: Preserved existing `idb:<imageId>` reference contract, local IndexedDB persistence, and `GET /api/images/:imageId` reassembly.
- **Authoritative Version Synchronization**: Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.9`.

## v2.0.7 — DURABLE D1 CROSS-DEVICE IMAGE SYNCHRONIZATION (2026-09-05)

### Durable D1 Persistent Image Architecture
- **Dedicated D1 Binary Storage (`image_chunks`)**: Added `/migrations/0002_add_image_chunks.sql` defining persistent BLOB storage with adaptive chunking (single binary payload for ≤ 1.5 MB, 1.0 MB chunking for larger images) directly within the existing `fsos-d1` database, fully eliminating ephemeral in-memory map loss upon Cloudflare Workers recycle/deployment.
- **Worker Binary Endpoints (`POST & GET /api/images`)**: Implemented binary dataUrl decomposition (`parseDataUrl`) and chunk persistence on upload, plus ordered chunk assembly and binary base64 reassembly (`binaryToDataUrl`) upon retrieval.
- **Bi-Directional Image Sync Pipeline in SyncEngine**:
  - **Reliable Local-to-Cloud Upload**: `SyncEngine.uploadPendingImages()` scans all local entity records and sync queues for `idb:<imageId>` references, uploading binary data with exponential retry backoff and tracking synced status in `fsos_synced_images_v1`.
  - **Target Device Cloud Download & Hydration**: `SyncEngine.pullCloudChanges()` extracts newly received remote `idb:` references and triggers background downloads (`downloadMissingImages`).
  - **On-Demand Remote Hydration Hook**: Hooked `ImageStore.setRemoteFetcher()` to `SyncEngine.fetchImageOnDemand()`, ensuring that any machine/report record loaded on another device automatically hydrates missing images from D1 on-demand and caches them into IndexedDB.
- **Telemetry & Sync Status Badge Integration**: Expanded `SyncState` with `pendingImageCount` and `downloadingImageCount` telemetry and integrated live image transfer counters into `SyncStatusIndicator`.
- **Authoritative Version Synchronization**: Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.8`.

## v2.0.6 — MACHINE PASSPORT UI/UX PRO MAX REDESIGN (2026-09-05)

### Machine Passport UI/UX Redesign & Visual Hierarchy
- **Primary Machine Identity Prominence**: Redesigned the machine passport fleet selection cards to make the machine number/ID (`WLVIA#1`, `WLVIA#2`, `WLVIA#002`, `WLVIA#3`, `WLVIA#4`, `WLVIA#5`) the dominant primary visual identifier in bold monospace display typography.
- **HUD & Industrial Control Selection UX**: Added a subtle active left-edge accent indicator, selected status tag, clean dark/light mode surface contrasts, and refined keyboard accessibility (`Enter`/`Space` navigation).
- **Secondary Identity & Hardware Specifications**: Structured the secondary row to display the machine model (`BMD250WM` / `BMD302W`), serial number (`SN`), and laser count with clean divider bullets, preventing model dominance over machine identity.
- **Footer & Location Alignment**: Standardized plant and line info (`P3 Cleanroom`) with inline map pin indicators and high-contrast semantic health status badges (`PASS`).
- **Cockpit Header Alignment**: Synchronized the selected machine cockpit header to emphasize the machine number as the primary H1 title with model, client, plant, and line details neatly organized in the subtitle metadata strip.
- **Authoritative Version Synchronization**: Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.7`.

## v2.0.5 — MACHINE NUMBER EDIT SYNC PERSISTENCE (2026-09-05)

### Machine Number Edit & Storage Persistence Fix
- **Bidirectional Field Synchronization**: Synchronized `machineNumber` and `machineNo` updates when editing machine specifications in `MachinePassportModule`, preventing legacy field overrides during storage normalization and sync bootstrap.
- **Storage and D1 Sync Resilience**: Ensured `LaserEngine.normalizeMachine()` prioritizes explicit user-provided machine numbers while maintaining backwards compatibility across offline storage and cloud synchronization pipelines.

## v2.0.4 — MACHINE CARD DISPLAY HIERARCHY (2026-09-05)

### Machine Passport UI & Presentation Hierarchy
- **Visual Identifier Hierarchy Alignment**: Swapped the visual hierarchy of the machine card in Machine Passport so that the canonical machine number/ID (`WLVIA#1`, `WLVIA#2`, `WLVIA#002`, `WLVIA#3`, `WLVIA#4`, `WLVIA#5`) serves as the primary visual identifier in prominent bold typography at the top left.
- **Secondary Model Subtext**: Positioned the machine model (`BMD250WM` / `BMD302W`) as secondary subtext immediately below the primary machine number.
- **Operational Status & Plant Health Retention**: Maintained continuous visibility of the machine status badge (`OPERATIONAL`) alongside the top-level machine number, and preserved plant location (`P3`) and health status (`PASS`) in their respective footer positions.
- **Authoritative Version Synchronization**: Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.5`.

## v2.0.3 — UPPER MACHINE CARD IDENTITY NORMALIZATION & SYNCHRONIZATION (2026-09-05)

### Machine Identity & Normalization Integrity
- **Canonical Machine Property Synchronization**: Resolved the upper machine-card identity mismatch root cause by ensuring `LaserEngine.normalizeMachine()` strictly synchronizes `machineNumber: machineNo`, `serialNumber: serialNo`, and `laserHeads: lasers`. Previously, `normalizeMachine` omitted `machineNumber`, allowing stale or un-synchronized `machineNumber` properties (e.g. `WLVIA#RND`) to pass through `{ ...m }` un-updated into UI components.
- **Deterministic Machine Sorting**: Enhanced `LaserEngine.normalizeMachines()` with a secondary deterministic ID tie-breaker so sorting behaves predictably without swapping machine positions.
- **Resilient UI Identity Fallbacks**: Updated `MachinePassportModule` upper cards and header badges to evaluate fallback expressions `{m.machineNumber || m.machineNo || m.id}` and `{m.serialNumber || m.serialNo}`, preventing undefined or stale identity states.
- **Authoritative Version Synchronization**: Synchronized all FSOS version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.4`.

## v2.0.2 — PROMPT ENHANCEMENT GOVERNANCE CONSOLIDATION (2026-09-05)

### Canonical Prompt Standard Unification
- **Single Canonical Standard**: Consolidated all governance principles from standalone `Engineering-OS/00-Core/Prompt Enhancement Principle 01.md` into `Engineering-OS/00-Core/Prompt-Standard.md`, establishing a single authoritative document for prompt engineering.
- **7-Level Enhancement Hierarchy Integrated**: Formalized the progressive prompt enhancement tiers (Level 1: Objective, Level 2: Requirements, Level 3: Constraints, Level 4: Observable Acceptance Criteria, Level 5: Failure Conditions, Level 6: Verification Steps, Level 7: Expected Reply Format).
- **Core Predictability & Quality Principles Preserved**:
  - Enforced "Never Write the Minimum Prompt" philosophy (engineering predictable execution over superficial brevity).
  - Enforced the Golden Rule (reducing interpretation, defining what to do / what NOT to do, observable success criteria, failure detection, evidence proof).
  - Embedded failure-prevention review questions and the Atlas enhancement gate directly into the prompt workflow.
- **Authoritative Version Synchronization**: Synchronized all version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.3`.

## v2.0.1 — ENGINEERING-OS DOCUMENTATION CLEANUP (2026-09-05)

### Engineering-OS Tree Hygiene & Canonical Alignment
- **Obsolete Duplicate Removal**: Deleted stale copy `Engineering-OS/00-Core/FSOS-Current-State.md` (historical v1.0.37 snapshot), eliminating duplicate confusion with project-specific state documentation.
- **Canonical Structure Verified**: Confirmed retention and integrity of:
  - `Engineering-OS/00-Core/Prompt Enhancement Principle 01.md` (Core governance principle).
  - `Engineering-OS/02-Projects/FSOS/FSOS-Current-State.md` (Active canonical project state).
  - `Engineering-OS/04-Archive/FSOS/FSOS-Current-State.md` (Archived historical state).
- **Comprehensive Audit**: Inspected all 45 markdown files across `Engineering-OS/`, classifying active canonical, required project, and archive documentation with zero unverified deletions.
- **Authoritative Version Synchronization**: Synchronized all version surfaces across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.2`.

## v2.0.0 — ENGINEERING-OS STEWARDSHIP ROLE UPDATE (2026-09-05)

### Engineering-OS Governance & Implementation Role Alignment
- **Governance vs. Implementation Role Clarification**: Updated Engineering-OS governance (`Atlas-Constitution.md`, `Engineering-OS/README.md`, `Engineering-Lessons-EL-005.md`) to explicitly reflect the repository workflow:
  - **Atlas**: Functions as the exclusive Engineering-OS governance authority (reviews evidence, determines governance specifications, prepares/approves changes, and protects constitutional integrity).
  - **Mikasa**: Functions as the implementation owner (applies approved Engineering-OS changes inside the repository under `Engineering-OS/`, verifies changes, and reports what was changed).
  - **Founder**: Retains absolute authority and approval for material governance decisions.
- **Authoritative Version Synchronization**: Synchronized all version configurations across `src/constants/version.ts`, `package.json`, `metadata.json`, and `wrangler.toml` to `v1.4.1`.

## v1.10.10 — ENGINEERING-OS INTO FSOS REPOSITORY (2026-09-05)

### Repository Consolidation & Governance Integration
- **Engineering-OS System Integration**: Consolidated the entire Engineering-OS governance framework directly into the canonical FSOS repository under `Engineering-OS/`, eliminating the requirement for a separate Engineering-OS repository for standard FSOS development and governance.
- **Canonical Structure Preservation**: Fully migrated all 49 active Engineering-OS files and directories intact:
  - `00-Core/`: Constitutional governance (`Atlas-Constitution.md`), CTO checklists, prompt standards, and decision frameworks.
  - `01-Templates/`: Standard engineering templates for sprints, architecture reviews, refactoring, migrations, and releases.
  - `02-Projects/`: Project-specific architectures, roadmap, and state records (`FSOS/`).
  - `03-Knowledge/`: Comprehensive technical knowledge base cards (Cloudflare Workers, D1, KV, SQLite, React, Electron, Tauri).
  - `04-Archive/`: Complete historical sprint archives, amendment records, and retrospective logs.
- **Root Conflict Resolution & Non-Destructive Separation**: Preserved existing FSOS application code, build assets, and release documentation in the repository root while cleanly anchoring Engineering-OS governance under `/Engineering-OS/` with its dedicated README, CHANGELOG, and metadata.
- **Authoritative Version Synchronization**: Synchronized all version configurations across `src/constants/version.ts`, `package.json`, `metadata.json`, `wrangler.toml`, and root `README.md` to `v1.4.0`.

## v1.10.9 — CHANGELOG PARITY NORMALIZATION (2026-09-05)

### Changelog Representation & Parity Normalization
- **Authoritative Changelog Parity**: Synchronized and normalized the representation across all 120 historical releases between the root `CHANGELOG.md` and the in-app Changelog parser (`src/utils/changelogParser.ts`), ensuring 100% exact parity with zero data loss or missing releases.
- **Harmonized Historical Formatting**: Normalized representation for releases `v1.2.7`, `v1.2.6`, `v1.2.3`, `v1.2.2`, `v1.2.1`, `v1.1.21`, `v1.1.20`, `v1.1.19`, `v1.1.18`, `v1.1.17`, `v1.1.12`, `v1.0.15`, `v1.0.14`, `v1.0.1`, `v1.0.0`, and `v0.9.1` using authoritative Markdown headings and rich structured bullet points.
- **Automated Parity Verification**: Expanded test suite in `src/utils/changelogParser.test.ts` to assert presence and structure across all 120 versions, guaranteeing zero duplicate releases and complete chronological ordering.

## v1.10.8 — IN-APP CHANGELOG SYNCHRONIZATION (2026-09-05)

### In-App Changelog Single Source of Truth
- **Direct Authoritative Markdown Integration**: Replaced the static, hardcoded, and divergent in-app changelog dataset in `SettingsModule.tsx` with dynamic parsing of the root `CHANGELOG.md` (`src/utils/changelogParser.ts`), establishing `CHANGELOG.md` as the single authoritative source of truth across both documentation and in-app display.
- **Full Historical & Milestone Coverage**: Rendered all 40+ engineering milestone entries from `v1.3.1` down to initial foundation releases (`v0.9.0` / `v0.1.0`), guaranteeing exact version, date, title, subsection, and wording fidelity without duplication or manual divergence.
- **Theme-Aware Hierarchical Rendering**: Preserved existing card UI and dark/light mode aesthetics while adding clean styling for subsection categories (`### `), bold prefix highlights, and indented sub-bullet points.
- **Automated Verification**: Added unit test coverage (`src/utils/changelogParser.test.ts`) validating authoritative parsing, section structure, and historical version coverage.

## v1.10.7 — FSOS / GITHUB RECONCILIATION & CONTINUITY (2026-09-05)

### Repository & Version State Synchronization
- **Full FSOS ↔ GitHub State Reconciliation**: Reconciled all file structures, version definitions (`v1.3.0`), and change history between FSOS and GitHub main (`mohamadsahafiz-spec/mhc2`). Verified exact SHA/content parity across all tracked repository files.
- **Evidence-Based Historical Gap Resolution**: Formally resolved the apparent `v1.2.11` gap from verified Git history (commit `d13d238`), documenting the Laser Power check form UX optimization and modal cleanup completed on 2026-09-03.
- **Authoritative Version Unification**: Synchronized all authoritative application version sources (`src/constants/version.ts`, `package.json`, `metadata.json`, `wrangler.toml`) to `v1.3.0` (`CFW-20260905-1530`).

### Autopilot Progression & Stability Enhancements
- **Activity Display Codes & Navigation**: Added standardized `displayCode` definitions to workflow schemas for clean identification in autopilot progression and process notifications.
- **Fail Disposition Flow**: Allowed completion of optical activities with failing measurements by tagging them as `NEEDS_REVIEW` instead of halting the diagnostic workflow.
- **State & Record Integrity**: Synchronized machine state with customer selection, excluded active session records from baseline lookups to avoid self-referencing, and preserved original timestamps during updates.
- **Robust ImageStore Hydration**: Debounced ImageStore hydration to prevent re-render thrashing and stabilized IndexedDB pointer resolution across application startup.
- **Recommendation & Spare Parts Flexibility**: Added source selection toggle (`Existing Passport Item` vs `Custom Item`) for recommended spare parts with optional part numbers for custom field items, fully integrated into report data pipelines and verified with automated test suites.

## v1.10.6 — BATCH B: Improve Information Hierarchy (Temperature, Laser Power, Beam Profile) (2026-09-03)

### Information Hierarchy & Readability Improvements
- **Temperature History**: Reorganized temperature history record rows into four distinct, scannable zones:
  - *Primary Identity*: Prominent title and point count badge.
  - *Subordinated Metadata*: Date, timestamp, sampling interval, and truncated secondary source file names styled with subtle contrast so they no longer visually compete with core results.
  - *Core Engineering Statistics*: High-contrast numeric badges for MIN, MAX, AVG, and RANGE metrics with thematic color accents and dark/light mode balance.
  - *Dedicated Action Zone*: Partitioned "View Graph" button and delete action separated by subtle visual boundary.
- **Laser Power**:
  - *Head 1 / Head 2 Contrast*: Redesigned measurement cells with prominent numeric readings, distinct head identity labels (`HEAD 1 (A)` / `HEAD 2 (B)`), and immediate PASS/FAIL badges with high-contrast background and border styling for both dark and light themes.
  - *Distinct Overall Power Health*: Framed the Overall Power Health card as a dedicated health overview panel with a prominent verdict display and subordinate inspection metadata.
- **Beam Profile**:
  - *Telemetry Measurements Hierarchy*: Restructured checkpoint summary cards with clear laser head labels, high-visibility measured diameter values (`mm`), instant PASS/FAIL status indicators, and subtle specification targets.
  - *Subordinated Latest Record Info*: Styled the record info card as a compact secondary metadata reference that no longer competes with primary optical telemetry data.
- **Verification & Integrity**: All underlying data schemas, calculations, interactions, and report structures remain 100% preserved.

## v1.10.5 — FOCUS OPTIMIZATION: Presentation Cleanup & Thumbnail Flicker Resolution (2026-09-03)

### Focus Optimization Presentation & Stability Refinement
- **Removed Presentation-Only µm Values**: Removed the redundant µm measurement values displayed beneath each wafer drill image in `MachineFocusOptimizationWorkspace.tsx` across both Laser 1 and Laser 2 grids, as well as in the detailed inspection modal. Position labels (+3, +2, +1, 0, -1, -2, -3) and BEST indicators remain fully intact.
- **Resolved Intermittent Thumbnail Flicker**: Traced the root cause to background SyncEngine polls triggering reference changes on `machine.focusOptimizationRecords`, which caused `useEffect` to clobber `hydratedRecords` with sync-unhydrated IDB pointers and evict cached entries from the small 32-item memory LRU cache. Implemented `mergeHydratedRecords` to preserve already-hydrated images across updates and expanded `MAX_MEMORY_CACHE_ITEMS` in `ImageStore` to 128, ensuring completely stable rendering with zero flickering.

## v1.10.4 — BATCH A: Standardize Machine Passport History Ordering (Newest → Oldest) (2026-09-03)

### History Ordering Standardization
- **Universal Newest → Oldest Presentation**: Standardized history lists across all 5 Machine Passport diagnostic modules so that the newest record is consistently presented first at the top of history tables and record lists:
  - **Temperature Workspace**: Sorted `savedRecords` by `createdAt` descending and `manualReadings` by timestamp/createdAt descending; preserved IDB telemetry linkages and raw data caching.
  - **Laser Power Workspace**: Sorted `laserPowerRecords` by `date` descending both in reactive `useMemo` display and on record save.
  - **Beam Profile Workspace**: Sorted `beamProfileRecords` by `date` descending in reactive `useMemo` display and on record save, resolving the issue where older records displayed above newer ones.
  - **Focus Optimization Workspace**: Sorted `focusOptimizationRecords` by `date` descending in reactive `useMemo` display and on record save. Preserved internal engineering focus-position sequences (`+0.300 mm` → `+0.200 mm` → `+0.100 mm` → `0.000 mm` → `-0.100 mm` → `-0.200 mm` → `-0.300 mm`) completely intact.
  - **Product & Process Workspace**: Sorted `productProcessRecords` by `date` descending in reactive `useMemo` display and on record save.
- **Automated Verification**: Added comprehensive unit test suite (`src/utils/historyOrdering.test.ts`) validating newest-first ordering across all five record types and verifying unchanged internal engineering sequences.

## v1.10.3 — BEAM PROFILE CHECKPOINT UI: Redundant Image Remove Button Removal (2026-09-03)

### Beam Profile Checkpoint UI Refinement
- **Removed Redundant Remove Button**: Eliminated the redundant `×` button and its associated absolute positioning and styling from `BeamProfileCheckpointCard.tsx`, completely removing the clipped red/pink corner overlay artifact.
- **Preserved Direct Replace Flow**: Kept the direct click-to-replace behavior on the thumbnail (`onClick` opening the native file picker), hover overlay indicator (`RefreshCw`), preview rendering, and upload storage handling 100% intact.
- **Zero Regression**: Retained full compatibility with all checkpoint card states, specifications, and parent modal / workspace integrations.

## v1.10.2 — MACHINE PASSPORT NAVIGATION UX: Integrated Subsystem Sidebar & Responsive Command Navigation (2026-09-03)

### Machine Passport Navigation UX Redesign
- **Integrated Master-Detail Layout**: Replaced the isolated, floating horizontal sub-category pill bar with an integrated, sticky left-hand subsystem navigation panel positioned alongside the active workspace content (`xl:sticky xl:top-4 w-full xl:w-64 2xl:w-72 self-start`).
- **Eliminated Dead Space & Awkward Composition**: Resolved the ~50% empty horizontal void of the previous bar. On desktop (>=1280px), navigation sits alongside the workspace, grounding the content and remaining accessible on scroll. On tablet and mobile (<1280px), navigation seamlessly transforms into a balanced 3-column banner card (`grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1`).
- **Crystal-Clear Structural Hierarchy**: Unmistakably separated non-interactive category headers (`Health & Lifecycle`, `Optics & Laser`, `Operations & Parts` with subsystem color indicators) from interactive, full-width selectable diagnostic items with active highlights, indicators, and live telemetry record count badges.
- **100% Functional Continuity**: Preserved all 7 destinations, icons, active state handlers, telemetry badge calculations, and underlying engineering logic without modifying any child workspace implementations.

## v1.10.1 — MHC SUMMARY CARDS UX: Compact Self-Fitting Health & Record Summary Layout (2026-09-03)

### MHC Summary Cards UX Optimization
- **Eliminated Vertical Stretching**: Fixed shared summary-card layout behavior across "Overall Power Health" in `MachineLaserPowerWorkspace` and "Latest Record Info" in `MachineBeamProfileWorkspace` by applying `self-start h-fit` to fit their content naturally instead of stretching to match the height of adjacent multi-item telemetry cards.
- **Removed Artificial Vertical Gaps**: Replaced `flex flex-col justify-between h-full` with comfortable `space-y-2.5` rhythmic row spacing and a refined divider line, preventing verdict badges from drifting to the bottom with empty dead space.
- **Visual Alignment & Theme Polish**: Maintained top-edge grid alignment with neighboring measurement cards across desktop and responsive single-column layouts while ensuring dark and light mode contrast parity for labels, values, and status badges.
- **100% Engineering Logic & Data Unchanged**: Kept all dates, frequencies, checkpoint counts, pass/fail indicators, calculations, and underlying records completely untouched.

## v1.10.0 — PRODUCT / PROCESS / VIA CHECK FORM UX: Compact Inspection & Micro-Drilling Modal (2026-09-03)

### Product / Process / Via Entry Modal UX Optimization
- **Compact Field-Service Layout**: Streamlined the Product, Process & Via Check entry modal in `MhcEnterProductProcessModal` with clamped modal sizing and scannable visual hierarchy.
- **Two-Column Process & Offset Matrix**: Compacted Phase 1/Phase 2 parameters and Laser Head 1/Laser Head 2 power offsets into side-by-side comparative inspection cards.
- **Interactive Via Quality Inspection**: Built integrated micro-inspection entry cards with real-time pass/fail evaluation and visual tolerance indicators against authoritative via acceptance specifications.
- **100% Data Integrity Preserved**: Fully preserved all calculations, validation gates, persistence routines, and report exports.

## v1.9.10 — BEAM PROFILE CHECK FORM UX: Compact Field-Service Data Entry Optimization (2026-09-03)

### Beam Profile Check Form UX Optimization
- **Compact Field-Service Layout**: Redesigned the "New Beam Profile Check" and "Edit Beam Profile Check" entry modal across `MhcEnterBeamProfileModal` and `MachineBeamProfileWorkspace` to eliminate full-screen stretching and excessive visual padding. Clamped container width cleanly to standard 4XL dialog bounds.
- **High-Density Checkpoint Cards**: Replaced oversized 160px checkpoint cards with compact ~72px `BeamProfileCheckpointCard` components featuring inline code pills, stage titles, high-contrast monospace specs, and instant real-time PASS/FAIL badges.
- **Optimized Select/Upload → Enter → Verify Flow**: Integrated square 40px image evidence boxes with single-click file selection, replace hover action, and one-click removal alongside comfortable numeric diameter inputs with inline `mm` suffix and smooth tab navigation.
- **Laser Head 1 & 2 Separation & Filtering**: Maintained clear amber (Laser 1 / Head A) and cyan (Laser 2 / Head B) separation with stage groupings (6A/7A Source, 6B/7B Flat Top, 6C/7C Working Zone Masks), live per-head pass counters, and an intuitive quick-filter tab bar (`All Checkpoints`, `Laser 1`, `Laser 2`) for zero-scroll single-head entry.
- **Secondary Remarks & Obvious Verdict Action**: Streamlined Engineer Remarks into a secondary single-line input and anchored a high-contrast footer verdict bar with clear overall result and prominent save action.
- **100% Engineering Logic & Data Integrity Preserved**: Kept all 14 checkpoints, specifications, calculation formulas, validation logic, image storage mechanisms, persistence routines, and report exports completely intact.

## v1.9.9 — LASER POWER CHECK FORM UX: Compact Field-Service Data Entry Optimization & Modal Cleanup (2026-09-03)

### Laser Power Check Form UX Optimization
- **Compact Field-Service Layout**: Streamlined the Laser Power check modal in `MachineLaserPowerWorkspace.tsx` and `SmartMhcWorkspace.tsx` (`MhcEnterLaserPowerModal`) with clamped modal bounds (`maxWidth="xl"`), eliminating excessive viewport stretching.
- **Theme-Aware High-Density Forms**: Refactored measurement input grids for Laser Head 1 and Laser Head 2 with theme-aware background cards, clear numeric badges, and responsive tab indexing.
- **Modal Lifecycle Stability**: Removed redundant and competing `AnimatePresence` wrappers across `MhcAutopilot.tsx` and laser power dialogs to prevent DOM thrashing and ensure clean modal mount/unmount transitions.
- **Preserved Engineering Calculations**: Retained all tolerance rules (15.0W ± 10%), baseline variation calculations, pass/fail thresholds, and IDB persistence pathways intact.

## v1.9.8 — LASER LIFECYCLE: Authoritative Recommendation Engine & Status Alignment (2026-09-02)

### Laser Lifecycle Recommendation & Status Alignment
- **Authoritative Recommendation Derivation**: Introduced `LaserEngine.calculateLaserLifecycleRecommendation()` as the single authoritative source of truth for customer-facing laser lifecycle advisories across the system, report engines, and Full PDF renders.
- **Strict Status & Verdict Consistency**: Resolved semantic contradiction where lasers in WARNING status (e.g. 22,375.7 h > 20,000 h warning limit) displayed "Approaching warning threshold".
  - **SAFE**: Describes operation below warning threshold and prescribes appropriate monitoring / routine scheduled MHC cycles based on remaining life capacity.
  - **WARNING**: Explicitly states warning threshold reached/exceeded, approaching rated EOL, and prescribes replacement source procurement prior to projected EOL date.
  - **ALARM**: Explicitly states rated operating lifespan reached/exceeded and recommends immediate laser source refurbishment or swap.
- **Unified Architecture**: Replaced duplicated recommendation string logic across `mhcReportEngine.ts` and `MhcFullPdfRenderer.tsx` with the unified `LaserEngine` derivation path.
- **Preserved Engineering Telemetry**: 100% preserved dynamic laser hour calculations, domain limits, runtime status badges, EOL projections, and all document layouts.

## v1.9.7 — FULL PDF: Production Scale 2.00 & JPEG 0.90 High-Fidelity Rendering (2026-09-02)

### Production PDF Quality Optimization
- **High-Fidelity Raster Scale 2.00**: Upgraded production Full PDF html2canvas-pro rendering engine from 1.20x (~115 DPI) to approved 2.00x scale (~192 DPI), delivering crisp, razor-sharp typography on 7–9pt labels, precise 1px table borders, and blur-free Recharts analytical charts.
- **Calibrated 0.90 JPEG Quality Encoding**: Set production JPEG compression to 0.90, matching the optical clarity of 0.95 reference rendering while achieving a ~21% reduction in PDF output file size (~2.4 MB for full 10-page document).
- **Preserved Per-Page Memory Reclamation**: Enforced immediate per-page canvas buffer disposal (`canvas.width = 0; canvas.height = 0`) and micro-yield garbage collection pauses, preventing GPU memory bloat and maintaining fast, consistent ~1.3s/page export speed.
- **Strict Page Geometry & Data Integrity**: Maintained 100% of standard ISO 216 A4 dimensions (`210 × 297 mm` / `595.28 × 841.89 pt` MediaBox), exact 10-page pagination, engineering datasets, and sign-off workflows with zero layout breakage or clipping.

## v1.9.6 — FULL PDF: Customer-Facing Readability & Contrast Enhancements (2026-09-02)

### Full PDF Readability & Typography Enhancements
- **Enhanced Document Readability & Visual Hierarchy**: Audited all 10 pages of the customer-facing Full PDF report and refined typography, table contrast, label hierarchy, and spacing.
- **Improved Contrast on Critical Field Labels**: Replaced washed-out light gray labels (`text-slate-400` / `text-slate-300`) with high-contrast, readable slate tones (`text-slate-500` / `text-slate-600` / `font-bold`) across metadata headers, inspection passport blocks, table column headers, and telemetry summaries.
- **Optimized Data Point Typography**: Upgraded microscopic data text (`text-[8px]` / `text-[9px]`) to clean `text-[10px]` / `text-[10.5px]` / `text-[11px]` across diagnostic tables (Laser Power, Optical Alignment, Beam Profile, Focus Optimization, Stage & AGC Calibration, Multi-Channel Thermal Telemetry, Product Process Parameters, Via Quality, Findings, and Spare Parts).
- **Hardened Table Legibility & Alignment**: Elevated table headers across all sections to bold, discernible typography with shaded column backgrounds for effortless scanning at 100% A4 viewing and physical printing.
- **Preserved Exact Content & Logic**: Maintained 100% of authoritative measurements, calculations, section numbers (§01–§15), 10-page structure, and sign-off blocks with zero data loss or layout breakage.

## v1.9.5 — FULL PDF: Clarified Focus Optimization Date Context (2026-09-02)

### Focus Optimization Date Disambiguation
- **Contextual Date Clarification**: Clarified the customer-facing label and context in §08 Focus Optimization to clearly denote the Focus Adjustment Date as a distinct follow-up/adjustment activity rather than the general MHC inspection date.
- **Authoritative Data Integrity**: Preserved the original recorded date value and all focus measurement telemetry.

## v1.9.4 — FULL PDF: Standardized Via Terminology (2026-09-02)

### Terminology Standardization
- **Standardized "Via" Terminology**: Standardized customer-facing terminology in the Full PDF from "Microvia" to "Via" across relevant measured/inspected via feature sections while preserving all underlying data structures, calculations, and specifications.

## v1.9.3 — Laser Terminology Standardization & Physical Head Identifier Alignment (2026-08-24)

### Highlights
- STANDARDIZED LASER TERMINOLOGY: Unified physical laser head references to "Laser Head 1" / "Laser Head 2" (and compact "LH1" / "LH2") across all sections and summaries.
- MACHINE VS LASER IDENTITY SEPARATION: Removed misleading machine serial number suffix patterns (MC230038-LH01/LH02) in favor of genuine laser serial numbers.
- SYSTEM TERMINOLOGY INTEGRITY: Preserved "Laser" for subsystem contexts and unified Executive Summary inspection table to "Laser Power (Laser Head 1 & 2)".

## v1.9.2 — Full PDF Section Metadata Consistency & Running Header Synchronization (2026-08-24)

### Highlights
- AUTHORITATIVE RUNNING HEADERS: Derived all Full PDF running headers from authoritative indexEntries section metadata via getPageRunningHeader.
- STALE HEADER ELIMINATION: Fixed Page 8 running header from stale Section 12 to authoritative Section 11 (Temperature & Thermal Telemetry).
- UNIFIED METADATA ALIGNMENT: Guaranteed perfect alignment across running headers, section headings, Table of Contents, and continuous numbering sequence.

## v1.9.1 — FSOS SYNC: Safe Local→D1 Reconciliation & Cross-Device Bootstrap (2026-08-24)

### Safe Local→D1 Reconciliation & Cross-Device Sync Bootstrap
- **Idempotent Local Data Provider**: Integrated `StorageService.getAllLocalData` provider into `SyncEngine`, allowing existing operational data stored in local storage to be discovered and registered without destructive resets or fixture injections.
- **Pre-Queue Reconciliation Pipeline**: Added `reconcileLocalData()` to discover valid local operational records (customers, machines, MHC sessions, passports, analytics, etc.) that have never entered the queue and enqueue them for upload.
- **Tracked Synchronized Keys Registry**: Introduced `fsos_synced_keys_v1` persistent key registry (`table:id`) ensuring local records are queued and reconciled once without duplicate queue insertions on successive sync cycles.
- **Cross-Device Clean Pull**: Enabled new or secondary client devices (e.g. work laptop) to pull all authoritative bootstrapped records from D1 without re-uploading them back to the server.
- **Full Offline Resilience & Environment Portability**: Guarded all storage operations with safe environment checks, preventing any runtime crashes during Node.js/Vitest test runs or restricted sandbox contexts.

## v1.9.0 — SPRINT 01 ITEM #1 MICRO-FIX: Autopilot Exit Button Label (2026-08-23)

### Autopilot Exit Button Label Micro-Fix
- **Updated Exit Control Label**: Changed the Autopilot bottom-left navigation button label from `EXIT` to **`EXIT AUTOPILOT`** for optimal semantic clarity while preserving instant return to Canvas/Workspace and full session state retention.

## v1.8.10 — SPRINT 01 ITEM #1: MHC Autopilot Clear Exit Control (2026-08-23)

### MHC Autopilot Clear Exit Control
- **Dedicated Exit Control**: Replaced the ambiguous bottom-left "Canvas / Workspace" escape hatch in the Autopilot wizard sidebar with an unmistakable, high-visibility **EXIT** action button featuring a `LogOut` icon.
- **Immediate Return to MHC Workspace**: Clicking the EXIT button cleanly dismisses the Autopilot overlay and restores the standard FSOS / MHC Smart Workspace without advancing to subsequent Autopilot activities.
- **Authoritative Session & Data Preservation**: Autopilot session data, step progression, and active machine/customer context are strictly preserved during exit, ensuring zero data loss or session reset.

## v1.8.9 — SPRINT 01 BATCH F: §06 Laser Power Comparison Presentation (2026-08-23)

### §06 Laser Power Comparison Redesign
- **Intuitive Baseline vs Measurement Mental Model**: Redesigned §06 on Page 5 with an unmistakable layout:
  - **LEFT**: Historical Baseline (Previous) with attached baseline date.
  - **VS**: Visual comparison connector badge.
  - **RIGHT**: Present Measurement (Current) with active MHC verification date.
  - **VARIATION**: Resulting variance calculation ($\Delta = \text{Current} - \text{Previous}$ in Watts and percentage shift $\Delta\%$).
- **Working Zone Mask Comparison Matrix**: Implemented explicit table columns across both Laser Head 1 and Laser Head 2:
  `Mask Size | Previous (date) | Current (date) | Δ Power | Δ % | Status`
- **Optical Path Comparison**: Added side-by-side historical vs present tracking for Laser Source (Raw) and Optics Top Hat.
- **Authoritative Data Integrity**: Maintained all authoritative power readings, tolerance thresholds, and PASS/FAIL verdict logic with zero fabrication or changes to other PDF sections.

## v1.8.8 — SPRINT 01 RE-RUN BATCH D: Renumber Buyoff Section to §18 (2026-08-23)

### Continuous Section Numbering & Renumbering of Buyoff to §18
- **Renumbered Buyoff Section to §18**: Renumbered the remaining Buyoff & Sign-off section from §19 to **§18**, establishing a continuous, gapless sequence: **§17 → §18**.
- **Synchronized Report Engine Identifiers**: Updated `types/mhcReportDocument.ts` (`MhcReportSectionCode`, `MhcReportSectionMap`) and `utils/mhcReportEngine.ts` (`buyoffSection.code = '18'`, `displayOrder = 18`, `sectionsMap['18']`, `getSectionPageNumber`, `getSectionCategory`).
- **Harmonized PDF & Table of Contents**: Updated `MhcFullPdfRenderer.tsx` with section headers (`SECTION 15–18 — FINDINGS, RECOMMENDATIONS & BUYOFF`, `18 BUYOFF & OFFICIAL APPROVALS`), TOC subtitle (`18 Standard Subsystem Diagnostics & Certification Modules (§01–§18)`), and Table of Contents entries matching section code `18` mapped to Page 10.
- **Continuous 18-Section Document Sequence**: Validated complete sequence of active sections (§01 through §18) across 10 pages with zero content changes to §17 or the Buyoff section, and verified the old §18 evidence section remains cleanly removed.

## v1.8.7 — SPRINT 01 REPAIR BATCH D: §17 Spare Parts & §19 Buyoff Numbering/Layout Integrity (2026-08-23)

### §17 Spare Parts & §19 Buyoff Integrity & Section 18 Removal
- **Seamless §17 → §19 Document Flow**: Permanently excised Section 18 from the report flow and index entries. After §17 (Spare Parts / Recommendations), the document flow and Table of Contents proceed directly and intentionally to §19 (Buyoff & Certification).
- **Accurate §17 Spare Parts & Recommendations Rendering**: Verified and hardened §17 rendering to cleanly display consumed/replaced parts alongside proactive recommended parts from session findings (`stage07_spareParts`, `consumedParts`, and `recommendedParts`), with clean empty state handling when no spare parts are required.
- **TOC & Index Pagination Integrity**: Updated `mhcReportEngine.ts` index generator (`indexEntries`, `orderedSectionsList`, `allOrderedSections`, and `getSectionPageNumber`) to reflect 18 active report sections (§01–§17, §19) mapped across 10 pages, ensuring §17 and §19 are indexed on Page 10 without gaps or broken section anchors.
- **Dedicated Page 10 Final Wrap-up Layout**: Preserved pristine Page 10 layout containing §15 (Optical Findings), §16 (Corrective Actions), §17 (Spare Parts & Recommendations), and §19 (Official Buyoff & Customer Sign-off) with dual sign-off blocks, zero footer collision, and zero blank page insertions.
- **Full Backward Compatibility & Test Suite Verification**: All 27 tests in the FSOS test suite passing, with new dedicated assertions validating §17 → §19 sequencing and total active section counts.

## v1.8.6 — SPRINT 01 REPAIR BATCH C: §13 & §14 MHC PDF Restoration (2026-08-23)

### §13 Laser / Product Profile & §14 Product Via Quality Restoration
- **End-to-End Authoritative Pipeline Integration**: Traced and restored data pipeline for §13 (Laser / Product Profile) and §14 (Product Via Quality) connecting `MHCSession` (`stage02_laserProfile`, `stage06_productQuality`, `stage02_findings`), `MachinePassport`, and `ProductProcessRecord` through `buildMhcReportDocument` directly to `MhcFullPdfRenderer`.
- **Dynamic Recipe Phase Resolution**: Section 13 accurately resolves substrate name, recipe program, lot/panel identifier, laser head allocation (LH1, LH2, or Dual Head), and Phase 1 (Rough Cut) / Phase 2 (Bottom Polish) process parameters (Power, Frequency, Shot Count, Mask Size, Defocus) from session records without hardcoding or synthetic defaults.
- **Microvia Drilling Geometry & Dual-Laser Evaluation**: Section 14 evaluates microvia top/bottom aperture widths, taper percentage, concentricity offset, shape uniformity, and copper landing pad recast against IPC-6012 tolerances via `ProductProcessEngine.evaluateRecord` / `ProductProcessEngine.evaluateVia`.
- **Dedicated Page 9 Product & Process Diagnostics Layout**: Formatted a clean 10-page document structure with §13 and §14 housed on dedicated Page 9, featuring vector cross-section via profile SVG diagrams, dual-head tolerance tables, and process buyoff remarks.
- **Report Index & Pagination Harmonization**: Updated Table of Contents, page numbers, and footers across the 10-page MHC PDF document (`Page X of 10`) ensuring zero clipping, zero overlap, and seamless pagination boundaries.

## v1.8.5 — MHC PDF Section §12 Temperature & Thermal Telemetry Repair (2026-08-23)

### §12 Temperature MHC PDF Restoration & Architecture
- **Multi-Source Authoritative Telemetry Resolution**: Traced and restored the §12 data pipeline across `MHCSession` (`temperatureData`, `temperatureEvidenceData`) and `MachinePassport` (`temperatureRecords`). Telemetry points, 6-channel sensor statistics, global Min/Max/Avg temperatures, and chiller status are accurately resolved without synthetic default fabrication.
- **Dynamic Subsystem Status Assessment**: Section 12 status is dynamically evaluated (`COMPLETE`, `NEEDS_REVIEW`, or `NOT_COLLECTED`) based on measured operating parameters against industrial specifications (20.0°C–24.0°C temperature envelope and chiller loop flow verdict).
- **Dedicated Page 8 Thermal Telemetry Layout**: Expanded MHC PDF report architecture to a dedicated 9-page layout, separating Motion & Scanner Calibration (§10, §11 on Page 7) from Continuous Thermal Telemetry (§12 on Page 8) and Findings/Buyoff (§15, §16, §17, §19 on Page 9) to eliminate layout crowding, page clipping, and footer overlap.
- **Multi-Channel Vector SVG Telemetry Profile**: Rendered high-fidelity vector time-series thermal profile chart with tolerance band visualization, dynamic station error bars, and channel sensor matrix table.
- **TOC & Index Synchronization**: Synchronized Table of Contents page index entries across all 19 subsystem modules to reflect the 9-page report layout.

## v1.8.4 — MHC Autopilot Multi-Head Inspection Unified Routing & State Preservation (2026-08-16)

### Highlights
- UNIFIED ACTIVITY CODE ROUTING: Consolidated multi-head laser inspection workflow into a single unified 02_findings activity, eliminating dead-end routing through nonexistent 03_findings.
- MULTI-HEAD COMPLETION RULE: Implemented strict dual-head verification requiring both Laser Head 1 and Laser Head 2 to be evaluated before advancing to Day 2 (04_stage1), with automatic NEEDS_REVIEW propagation.
- PERSISTENT HEAD STATE & DISCOVERY: Replaced destructive activeCode tab resets with unaddressed-first head discovery and robust alphanumeric head matching (6A/7B, lh1/lh2).
- INDEPENDENT FINDINGS & RESILIENT EVIDENCE: Ensured independent finding and draft isolation per head and seamless resolution of idb: image pointers upon session rehydration.

## v1.8.3 — MHC Autopilot Activity Completion Event Injection & OOM Elimination (2026-08-16)

### Highlights
- EVENT-ARGUMENT STRIPPING: Wrapped Autopilot and Activity 01 completion callbacks in zero-argument handlers to prevent React click MouseEvents from leaking into the session pipeline.
- DEFENSIVE SESSION VALIDATION: Hardened handleCompleteCurrentActivity and advanceAutopilotActivity to strictly validate session shape and require valid string IDs before updating or advancing.
- CORRUPTION PURGING IN PERSISTENCE: Filtered malformed/DOM-contaminated session entries from getMhcSessions and saveMhcSessions to ensure clean, isolated session storage.

## v1.8.2 — MHC Autopilot Activity Completion Out-of-Memory Freeze Resolution (2026-08-16)

### Highlights
- BATCHED INDEXEDDB WRITE QUEUE: Replaced individual unawaited transaction spawns with a single batched write queue, eliminating transaction queue buildup and IndexedDB out-of-memory lock exhaustion during session state updates.
- REDUNDANT PERSISTENCE FILTERING: Introduced a persisted key registry to skip redundant writes for already stored images, drastically cutting transaction volume and storage thread pressure.
- STRUCTURAL SHARING EXTRACTION & HYDRATION: Refactored ImageStore.extractAndStoreImagesSync and hydrateImagesSync with structural sharing, returning untouched object references when no images are modified and eliminating unnecessary deep object cloning across unchanged session branches.
- ZERO-LATENCY ACTIVITY ADVANCE: Enabled smooth, instantaneous Journey Rail completion and navigation transitions on Activity 01 (Laser Hours) and all downstream Autopilot stages.

## v1.8.1 — MHC Autopilot Multi-Machine Session Detection & Resume UX (2026-08-16)

### Multi-Machine Session Detection & Continuation
- **De-coupled Machine Selection Sequence**: Refactored the Autopilot setup flow into a clear 4-step wizard (`Welcome` → `Customer Passport` → `Machine Passport` → `Session Detection & Recovery`), preventing eager default detection on the first machine (MC#1) before the engineer selects the intended target asset.
- **Accurate Machine-Scoped Session Detection**: Session detection and resumption (`handleContinueExisting`) now reliably match and resume the session belonging strictly to the selected machine.
- **Active Job Indicators**: Added visible "Active Job" badges in Customer selection and "Active Session" pulses in Machine selection to instantly show assets with ongoing incomplete inspections.
- **Quick Machine Switch**: Added a "Switch Machine" action directly in the active Autopilot session header for rapid multi-machine navigation without losing progress.
- **Parent State Alignment**: Fixed `activeSession` calculation in `MachineHealthCheckModule` to strictly filter by `selectedMachineId` without fallback pollution.

## v1.8.0 — MHC Autopilot Temperature Workspace & Scroll Architecture (2026-08-16)

### Highlights
- TEMPERATURE TELEMETRY VISUALIZATION: Integrated the authoritative multi-channel TemperatureGraph directly inside the MHC Autopilot Temperature activity (06), displaying real multi-station thermal data without fake or duplicated values.
- REMOVAL OF MISPLACED EVIDENCE BLOCK: Cleaned up Activity 06 by removing the misplaced generic evidence collection form, keeping the activity strictly focused on machine thermal telemetry log integration.
- NATURAL VIEWPORT SCROLLING: Removed unnecessary nested and internal vertical scroll containers across Autopilot activities, allowing workflow content to expand naturally downward with smooth viewport-level scrolling.
- SEAMLESS THERMAL METRIC DISPATCH: Preserved channelData and thermal statistics across session persistence and autopilot progression pipeline.

## v1.7.10 — MHC Autopilot Laser Workflow Unification & Beam Profile Persistence (2026-08-16)

### Highlights
- UNIFIED LASER WORKSPACE & SCHEDULE: Consolidated Laser 1 & Laser 2 into unified side-by-side matrix workspaces for Laser Power (02_power), Beam Profile (02_beam), and Optical Inspection (02_findings), eliminating duplicate workflow schedule entries.
- CUSTOMER-FACING NOMENCLATURE: Standardized on "Laser 1" and "Laser 2" naming across all workspaces, stage labels, and journey rails, eliminating legacy Head A / Head B terminology.
- BEAM PROFILE PERSISTENCE INTEGRITY: Sealed state persistence for Beam Profile & Mode inspection data, ensuring all 16 measurement points, image references, and evaluation verdicts survive navigation roundtrips to Report Generation and browser reloads with 100% fidelity.
- AUTHORITATIVE SESSION ROUNDTRIP: Connected child activity state dispatches directly into the parent Autopilot progression pipeline to prevent state clobbering and stale React prop re-initialization.

## v1.7.9 — MHC Autopilot Mechanics, Progression & Unified Workspace Architecture (2026-08-16)

### Highlights
- UNIFIED INSPECTION DECISION & PROGRESSION: Streamlined inspection mechanics into a single authoritative flow where both "No Issue Found" (COMPLETED) and "Issue / Recommendation Found" (NEEDS REVIEW) reliably advance the Journey Rail without trapping the engineer.
- CYCLE-SAFE PERSISTENCE HARDENING: Replaced naive global WeakSet tracking with an active ancestor recursion stack in ImageStore and StorageService serialization, ensuring shared non-circular objects and findings survive browser reloads intact.
- UNIFIED LASER POWER WORKSPACE: Standardized Laser 1 and Laser 2 side-by-side matrix terminology, removing legacy Head A/B references and unifying the power measurement experience.
- AUTHORITATIVE SESSION DISPATCH: Ensured completion triggers pass the newly updated session state directly to journey advancement handlers, preventing stale React state race conditions.

## v1.7.8 — MHC Inspection Journey Progression & Image Persistence Engine (2026-08-15)

### Highlights
- SEAMLESS AUTOPILOT ADVANCEMENT: Updated advanceAutopilotActivity to advance the Journey Rail on both COMPLETED and NEEDS_REVIEW finalizations, allowing findings with replacement recommendations to smoothly advance to the next laser head/stage without trapping the engineer.
- MHC SESSION IMAGE OFFLOADING: Integrated ImageStore IndexedDB offloading into saveMhcSessions and getMhcSessions, preventing localStorage QuotaExceededError and preserving all findings/evidence photos across reload.
- CYCLE-SAFE SERIALIZATION & TRAVERSAL: Added WeakSet circular-reference guards to ImageStore image extraction/hydration and unified safe serialization across SyncEngine and Persistence.
- SINGLE AUTHORITATIVE INSPECTION FLOW: Streamlined inspection decision and finding recording into a single, cohesive workflow with direct Save & Complete feedback.

## v1.7.7 — MHC Inspection Workflow, Report Audit & Persistence Hardening (2026-08-15)

### Highlights
- UNBLOCKED FINDINGS PROGRESSION: Completed inspections with issues/recommendations or replacement requirements now advance the Journey Rail smoothly without trapping the engineer on the inspection activity.
- REPORT READINESS INTEGRITY: Findings requiring review or replacement remain fully preserved for engineering and official PDF reporting while unblocking Day 4 Report readiness audits once physical inspection is complete.
- PERSISTENCE CYCLE-SAFE HARDENING: Implemented cycle-safe JSON stringification and WeakSet tracking across StorageService and SyncEngine, eliminating cyclic-object and recursive-traversal exceptions.
- UNIFIED DECISION UX: Eliminated redundant intermediate confirmation banners and synchronized head inspection state transitions directly with the completion gate.

## v1.7.6 — Full MHC PDF — Phase 2 Quality & Laser Lifecycle Fixes (2026-08-15)

### Highlights
- LASER LIFECYCLE PRECISION: Integrated LaserEngine calculations for EACH laser head in the Full PDF report, displaying authoritative current hours, Warning and Error/EOL limits, life remaining percentage, visual life bar, remaining operating hours and days, and estimated EOL dates.
- MACHINE IDENTITY & DATA-DRIVEN METADATA: Added authoritative machine number/source (e.g. WLVIA#3) and fully data-driven/editable Engineer Name, Company, Inspection Date, and System Release Verdict.
- PAGE STRUCTURE REFACTORING: Separated Table of Contents (02) into a dedicated page, giving Machine Information & Configuration (03) a clean dedicated new page.

## v1.7.5 — 🏆 Official MHC PDF Export — Breakthrough (2026-08-15)

### Highlights
- Four PDF export approaches failed before the fifth approach succeeded. Replacing legacy html2canvas 1.4.1 with html2canvas-pro restored reliable Official MHC PDF generation while preserving the existing MHC report architecture, Tailwind v4 styling, OKLCH colors, telemetry charts, and evidence rendering.
- Founder reminder: Do not give up because the first four approaches fail. Investigate, adapt, and keep going.

## v1.7.4 — Laser Power Data Integrity & AGC Signed Telemetry Release (2026-08-14)

### Highlights
- LASER POWER PERSISTENCE INTEGRITY: Eliminated redundant completion dispatch clobbering in MhcLaserPowerActivity, ensuring all 16 Laser Head 1 & Laser Head 2 engineering measurements, out-of-spec findings, and review states persist authoritatively across workspace navigation and reloads.
- AGC SIGNED TELEMETRY EXPANSION: Extended MHCAgcResult and MhcAgcActivity to calculate, persist, and display signed xMinUm, xMaxUm, yMinUm, and yMaxUm alongside max absolute deviations across Indices 0–5.
- REPORT & DASHBOARD INTEGRATION: Integrated AGC signed range telemetry into real-time activity dashboards, executive PDF summary tables, and authoritative cleanroom session storage.

## v1.7.3 — Autopilot Laser Power Progression & Review State Fix (2026-08-14)

### Highlights
- LASER POWER PROGRESSION UNBLOCKED: Updated progression gate to require completeness (all 16 measurement points entered) rather than all-pass, allowing real out-of-spec/degraded findings to be recorded in MHC cleanroom audits.
- NEEDS_REVIEW INTEGRITY: Maintained strict pass: false and overallResult: FAIL for out-of-spec points with complete diagnostic evidence while advancing the activity state as NEEDS_REVIEW.
- JOURNEY RAIL ADVANCEMENT: Enabled seamless progression to downstream activities (Beam Profile, Findings) with explicit out-of-spec diagnostic summaries retained in completion gates.

## v1.7.2 — MHC Autopilot Workflow Blockers Resolution (2026-08-14)

### Highlights
- BLOCKER 1 — LASER POWER INPUT & VALIDATION STABILITY: Modernized numeric input handling with decimal string decoupling to eliminate truncation of fractional entries (e.g. 14.8W, 0.45W), integrated granular engineering failure explanations per measurement point, provided comprehensive out-of-spec feedback lists in completion gates, and implemented bidirectional completion gating across Laser Head 1 and Laser Head 2.
- BLOCKER 2 — AUTOPILOT SPLIT SCROLLING ARCHITECTURE: Resolved long report layout breakage by enforcing a fixed-viewport split layout with a permanently pinned, independently scrollable Journey Rail sidebar and smooth full-height multi-page report preview container.
- VERSION INTEGRITY: Seamlessly bumped authoritative FSOS application version to v1.1.2 while preserving independent subsystem and engine revisions.

## v1.7.1 — Streamlined Single-Version UI Presentation (2026-08-14)

### Highlights
- SINGLE VISIBLE FSOS VERSION: Maintained one authoritative application version badge (v1.1.1) in the primary header/sidebar, eliminating UI clutter.
- REMOVED REDUNDANT VERSION DISPLAYS: Purged duplicate version indicators from the bottom-left sidebar footer, System Settings operational banner, and About System card.
- PROTECTED INDEPENDENT COMPONENT ARCHITECTURES: Preserved internal subsystem engine versioning (Machine Health Check Report Engine, Cloudflare Worker bindings, D1 sync protocols) untouched.
- CONTINUOUS REGRESSION COMPLIANCE: Verified clean builds, full Vitest suite passing, and persistent data integrity across all cleanroom workspaces.

## v1.7.0 — Authoritative FSOS Application Version Consolidation (2026-08-14)

### Highlights
- SINGLE AUTHORITATIVE VERSION ARCHITECTURE: Consolidated all user-facing FSOS application version displays (Sidebar header badge, system footer, Start Page banner, and System Settings) to authoritative v1.1.0.
- ELIMINATED STALE APPLICATION VERSION BADGES: Cleaned up legacy/stale application-level version references (v0.9.x, v1.0.20) across UI cards, headers, and Cloudflare Worker endpoints.
- PRESERVED INDEPENDENT SUBSYSTEM VERSIONS: Retained legitimate independent component versions (Machine Health Check Report Engine v1.0.31.4, schema versions, zero-state migration keys) intact without artificial renaming.
- APPLICATION VERSION PROGRESSION RULE: Established formal MAJOR.MINOR.PATCH versioning rule with patch cap at 10 advancing cleanly to v1.1.0.

## v1.6.10 — In-App Delete Confirmation Modal & Authoritative Persistence Sync (2026-08-14)

### Highlights
- IN-APP CONFIRMATION DIALOG: Replaced native window.confirm() with an FSOS in-app confirmation modal, eliminating sandboxed iframe suppression in AI Studio live preview while preserving production behavior.
- SYNCHRONOUS STORAGE PERSISTENCE: Bound StorageService.saveMachines directly to Temperature Workspace record deletion and creation handlers, guaranteeing immediate disk & cloud sync.
- ISOLATED RECORD PURGING: Deleting a temperature inspection record cleanly purges cached raw telemetry in IndexedDB and updates machine passport history without affecting sibling records.
- PERMANENT RELOAD RETENTION: Verified deleted records remain permanently removed across page reloads and browser restarts with zero data regression.
- PROTECTED ARCHITECTURAL BOUNDARY: Preserved all temperature graphing, downsampling, MHC computations, and customer identity architectures untouched.

## v1.6.9 — Saved Temperature Record Delete Action (2026-08-14)

### Highlights
- SAVED RECORD DELETION: Enabled seamless deletion of selected saved temperature records directly from both the inspection history list and the detail graph modal view.
- PERSISTENCE SYNCHRONIZATION: Removing a temperature inspection record immediately updates machine passport state and purges associated telemetry from persistent storage.
- RELOAD RESILIENCY: Verified deleted temperature records remain permanently deleted across application reloads while preserving remaining inspection records and fleet data.
- PROTECTED ARCHITECTURE: Retained exact temperature parsing, aggregation, downsampling, graph rendering, and multi-channel integrity without modification.

## v1.6.8 — Saved Temperature Inspection Graph NaN Fix (2026-08-14)

### Highlights
- TIMESTAMP REHYDRATION ENGINE: Resolved graph rendering defect where persisted temperature inspection records produced NaN timestamps and collapsed time-series.
- FULL-CYCLE DATE SERIALIZATION: Rehydrates ISO strings, epoch milliseconds, and space-separated datetime formats into valid Date timestamps across save, persistence, and reload cycles.
- ROBUST GRAPH COORDINATES: TemperatureGraph accurately converts all serialized channel timestamps into clean HH:mm:ss X-axis labels and tooltips.
- STATISTICAL & CHANNEL INTEGRITY: Preserved exact MIN, MAX, AVG, and RANGE metrics and multi-channel downsampled profiles without data loss.
- BACKWARD COMPATIBILITY: Fix immediately restores both existing persisted records and newly saved temperature inspections.

## v1.6.7 — Recommended Parts Interactive Column Sorting (2026-08-14)

### Highlights
- COLUMN SORTING ENGINE: Enabled multi-field interactive sorting across all columns (Machine Family, Part Number, Part Name, Quantity, Price, Life Span, Lead Time, and Criticality).
- BI-DIRECTIONAL TOGGLES: Clicking any column header toggles between ascending and descending sort orders with distinct directional indicators.
- DEFAULT SORT ORDER: Standardized initial table view to Part Number natural alphanumeric sorting (A→Z).
- COMPOSABLE FILTERING: Sorting operates seamlessly alongside real-time search queries, category filters, and BMD302W/BMD250WM machine family segregation.
- PRESERVED INTEGRITY: Retained 100% of CRUD operations, structured CSV/JSON import, duplicate detection, and zero-state data compliance.

## v1.6.6 — Recommended Parts Structured Import (2026-08-14)

### Highlights
- STRUCTURED IMPORT ENGINE: Added safe CSV and JSON import workflow for Recommended Parts Master catalog.
- MACHINE FAMILY INTEGRITY: Enforced strict machine family segregation (BMD302W and BMD250WM) with non-destructive duplicate matching and resolution strategies.
- VALIDATION & PREVIEW: Real-time import preview displaying total records, new records, existing matches, and field-level validation errors before confirmation.
- EXPLICIT USER CONFIRMATION: Prevents silent overwrites or unsolicited persistence; records are only committed via StorageService upon explicit user confirmation.
- TEMPLATE DOWNLOADS: Integrated engineering sample CSV schemas for BMD302W and BMD250WM parts with required specification fields.
- ZERO-STATE PRESERVED: Retained zero-state architecture with zero fixture records, maintaining full CRUD and search/filter compatibility.

## v1.6.5 — Recommended Parts Master (2026-08-14)

### Highlights
- RECOMMENDED PARTS MASTER: Established authoritative Recommended Parts catalog separated by machine family (BMD302W, BMD250WM, and Other).
- MACHINE PASSPORT INTEGRATION: Added Recommended Items management entry point with Family/Criticality filtering, search, and full CRUD support.
- PERSISTENT STORAGE: Integrated master parts persistence into authoritative StorageService and SyncEngine without duplicate authorities.
- STABLE REFERENCE RESOLUTION: Formulated PartsEngine resolver for MHC maintenance recommendations and Report Studio lookup by stable part UUIDs.
- ZERO-STATE INTEGRITY: Preserved strict zero-state architecture with zero ghost/fixture records until explicitly created by the user.

## v1.6.4 — Start Page Data-Driven Cleanup & Residual Hardcoded Data Removal (2026-08-13)

### Highlights
- DATA-DRIVEN START PAGE: Connected all StartPageModule operational cards directly to authoritative schedule, machines, and tasks props.
- HARDCODED DATA REMOVAL: Fully removed all static operational identities (ASM Eagle XP-01/02/03/04/05, STMicroelectronics Muar) from JSX markup.
- DYNAMIC MISSIONS & SCHEDULE: Today's Schedule, Upcoming Work, and Today's Primary Mission derive strictly from authoritative runtime data.
- ZERO-STATE EMPTY STATES: Start Page renders clean intentional empty states when no machines or scheduled tasks are present without seeding fallback records.
- PROTECTED ARCHITECTURE UNTOUCHED: StorageService, SyncEngine, D1, Customer/Machine Passport, MHC, Canvas, and engineering engines strictly preserved.

## v1.6.3 — Complete Operational Data Reset (2026-08-13)

### Highlights
- COMPLETE OPERATIONAL DATA RESET: Fully cleared all runtime operational data (Customers, Machines, MHC Sessions, Reports, Contracts, Schedules, Tasks, Investigations, Plants, Lines, Evidence).
- CLEAN EMPTY STATE: Application starts with zero customer and machine records, ensuring no ghost/fixture data (TSMC, Hyundai, ASML) is ever hydration-seeded.
- ONE-TIME AUTOMATIC PURGE: Executed one-time localStorage and sync queue purge for v1.0.31.4 upgrade, resetting persistent state completely.
- MANUAL ENTRY MANDATE: Customer Passport and Machine Passport render clean empty state prompting explicit manual equipment entry.
- ENGINEERING ENGINES PRESERVED: Temperature Engine, Laser Power Engine, Beam Profile Engine, Calibration, Autopilot, Report Renderer, and calculations fully preserved.

## v1.6.2 — Customer Storage Authority Repair (2026-08-13)

### Highlights
- SINGLE AUTHORITATIVE CUSTOMER PERSISTENCE: StorageService is now the single authoritative storage path for Customer data across FSOS.
- REMOVED DUAL STORAGE AUTHORITY: Eliminated MachinePassportModule independent fsos_customer_list state and legacy storage key.
- REMOVED RUNTIME FIXTURE FALLBACK: Discontinued INITIAL_CUSTOMERS runtime fallback; empty Customer store remains empty without generating ghost records.
- SYNC ENGINE TOMBSTONE PROTECTION: Prevented stale fixture lists from enqueuing delete tombstones against legitimate Customer records.
- SAFE DATA MIGRATION: Seamlessly migrated and merged any legitimate records from legacy fsos_customer_list before key removal.

## v1.6.1 — MHC Autopilot Render Loop Fix (2026-08-13)

### Highlights
- MHC AUTOPILOT RENDER LOOP FIX: Resolved React infinite update loop caused by object reference dependency on progress.activityNotes in useEffect.
- PRIMITIVE DEPENDENCY STABILIZATION: Updated useEffect dependency to primitive progress.activityNotes?.[currentCode] string.
- FULL SYSTEM STABILITY: Verified startup, normal render, activity note persistence, and Customer/Machine Passport rendering without recursion.

## v1.6.0 — Phase 7 — MHC Readiness Review (Day 4) (2026-08-12)

### Highlights
- MHC AUTHORITATIVE SESSION AUDIT: Performs comprehensive live readiness audit across all Day 1–3 engineering activities (01 through 06) without modifying or duplicating underlying session data.
- DERIVED AUDIT MATRIX: Dynamically evaluates Laser Hours, Head 1 & 2 Power, Beam Profile, Optical Inspections & Findings, Stage 1 & 2 Calibration, AGC 1 & 2, and Temperature Telemetry.
- READINESS STATE CATEGORIZATION: Clearly classifies session status into 🟢 READY FOR REPORT or 🟠 ATTENTION REQUIRED with explicit blocker counts and next actionable steps.
- INTERACTIVE DIRECT NAVIGATION: Every audit row and blocker item is clickable, allowing instant jump navigation back to the relevant activity to resolve issues.
- REPORT GATE ENFORCEMENT: Locks Activity 08 Report Generation until all required engineering activities pass without blockers; automatically unlocks Activity 08 when readiness criteria are satisfied.
- NON-BLOCKING OPTIONAL EVIDENCE: Correctly treats optional attachments as non-blocking items, ensuring engineers are never stuck on optional evidence.

## v1.5.10 — Phase 6 — Temperature & Evidence Integration (Day 3) (2026-08-12)

### Highlights
- PROTECTED TEMPERATURE ENGINE INTEGRATION: Directly connects the proven TemperatureEngine log parser and analysis pipeline into Autopilot without rewriting or duplicating code.
- AUTOMATIC LOG ANALYSIS & PASSPORT RECORDING: Parses raw .log/.txt telemetry files or attaches saved Machine Passport records into the active MHC session.
- AUTHORITATIVE SUMMARY DASHBOARD: Displays concise global thermal statistics (Min, Max, Avg, Delta) and Station 1–6 channel breakdowns inside Autopilot.
- CANVAS JUMP ACTION: Provides direct "Open Interactive Temperature Canvas" action button for deep chart analysis.
- LIGHTWEIGHT AUTHORITATIVE EVIDENCE COLLECTION: Supports attaching and linking inspection images, calibration documents, and temperature evidence to the session.
- DAY 3 COMPLETION & DAY 4 READINESS UNLOCK: Completing Activity 06 automatically unlocks Day 4 MHC Readiness Review (07) while keeping Report Generation locked.

## v1.5.9 — Phase 5 — AGC Autopilot (Day 3) (2026-08-12)

### Highlights
- INDEPENDENT AGC 1 & AGC 2 WORKSPACES: Dedicated final-result entry workspaces for AGC 1 and AGC 2 scanners/laser heads with independent tracking.
- FULL INDEX 0–5 RECORDING: Captures final X and Y deviation results in µm for all 6 indices (Index 0 through 5).
- REAL-TIME ±3.0 µm SPECIFICATION ENGINE: Computes Max Abs X, Max Abs Y, and Overall Max Deviation against the ±3.0 µm tolerance limit.
- POKA-YOKE SPEC ENFORCEMENT: Values outside ±3.0 µm trigger OUT OF SPEC state, block PASS completion, and flag stage as NEEDS_REVIEW.
- SCANNER CONDITION WARNING: Out-of-spec readings flag "Scanner calibration outside specification — scanner condition requires engineering attention" with 2-year planning datum advisory.
- RE-RUN REVISION & OPTIONAL EVIDENCE: Allows re-entry for physical re-run verifications and optional external AGC report image attachment.
- DAY 3 ADVANCEMENT: Dual PASS on AGC 1 & AGC 2 automatically marks 05 AGC COMPLETED and unlocks Day 3 Temperature & Evidence (06).

## v1.5.8 — Phase 4 — Stage Calibration Autopilot (Day 2) (2026-08-12)

### Highlights
- INDEPENDENT STAGE 1 & STAGE 2 WORKSPACES: Authoritative final-result calibration entry workspaces for Stage 1 and Stage 2 with independent status tracking and tab switching.
- X/Y MIN & MAX DEVIATION RECORDING: Captures X Min, X Max, Y Min, and Y Max deviation readings in µm per stage.
- REAL-TIME SPECIFICATION ASSESSMENT (±2.0 µm): Automatically calculates Max Abs X, Max Abs Y, and Overall Max Deviation against the ±2.0 µm tolerance benchmark.
- POKA-YOKE SPEC ENFORCEMENT: Exceeding ±2.0 µm triggers OUT OF SPEC state, marks stage NEEDS_REVIEW, and prevents granting PASS status.
- RE-RUN CORRECTION & OPTIONAL EVIDENCE: Supports physical re-run entry revisions and optional external calibration report image attachment.
- AUTOPILOT DAY 3 ADVANCEMENT: Unlocks Day 3 AGC upon completing both Stage 1 and Stage 2 calibration with PASS.

## v1.5.7 — Day 1 Autopilot Integration + Poka-Yoke Hardening (2026-08-12)

### Highlights
- SESSION RESUME & HYDRATION: Verified seamless session progress, measurements, findings, and Journey Rail state restoration upon reload/reopen.
- HEAD INDEPENDENCE: Strictly decoupled Laser Head 1 and Laser Head 2 inspection findings and completion status; Day 1 requires both heads to satisfy requirements before advancing.
- NEEDS REVIEW PROPAGATION: Reopening or editing earlier completed activities flags downstream dependent steps as NEEDS_REVIEW until re-verified.
- POKA-YOKE HARDENING: Enforced strict validation across required fields, out-of-spec power/beam handling, and material engineering constraints without introducing artificial blockers.
- DAY 1 COMPLETION & DAY 2 TRANSITION: Seamless transition to Day 2 actionable state upon completing all Day 1 activities while keeping Stage Calibration locked until Day 2.

## v1.5.6 — Phase 3D — Optical / Mechanical Inspection + Findings (2026-08-12)

### Highlights
- INDEPENDENT LASER HEAD INSPECTIONS: Allows recording optical/mechanical inspection findings independently for Laser Head 1 and Laser Head 2 with dedicated completion tracking.
- FAST NO-ISSUE PATH & PROGRESSIVE FOLLOW-UPS: Directly completes clean laser heads with one-click "No issue found", or activates progressive component damage follow-ups when an issue is reported.
- RELEVANT OPTICAL COMPONENTS & DAMAGE SELECTION: Supports cameras, TC lens, scanner lenses, transmitting optics, and custom components paired with multi-select damage conditions and action recommendations.
- ENGINEERING RULE ENFORCEMENT: Enforces known constraint that burned transmitting optics cannot be restored by cleaning and require replacement.
- AI FINDING ASSISTANCE: Provides controlled "Generate Finding Wording" assistance to convert facts into editable report-ready summaries without blocking offline execution.

## v1.5.5 — Phase 3C — Beam Profile / Mode Autopilot (2026-08-12)

### Highlights
- SIDE-BY-SIDE BEAM WORKSPACE: Interactive measurement workspace displaying Laser Head 1 and Laser Head 2 side-by-side across 8 measurement stations (Laser Source, After Optics, Index Masks 0–5).
- DATA CAPTURE & HISTORICAL BASELINE: Captures current beam diameters, computes PASS/FAIL against BeamProfileEngine specifications, and calculates Delta mm and Delta % against historical machine records.
- OPTIONAL EVIDENCE IMAGE ATTACHMENT: Preserves real uploaded beam profile evidence images without forcing evidence upload (missing image does not block completion).
- POKA-YOKE & OUT-OF-SPEC VALIDATION: Enforces complete, valid numeric beam diameter measurements for all 16 stations and flags out-of-spec values before allowing Journey Rail advancement.
- AUTHORITATIVE PERSISTENCE: Saves evaluated BeamProfileCheckRecord directly to the active MHC session model and Machine Passport record.

## v1.5.4 — Phase 3B — Laser Power Autopilot (2026-08-12)

### Highlights
- SIDE-BY-SIDE POWER WORKSPACE: Replaced manual report entry with a fast engineering measurement workspace displaying Laser Head 1 and Laser Head 2 side-by-side.
- 8 MEASUREMENT POINTS PER HEAD: Measures Laser Source, After Optics, and Index Masks 0 through 5 using native LaserPowerEngine and MASK_SPECS constants.
- PREVIOUS VS CURRENT BASELINE COMPARISON: Automatically retrieves the most relevant historical MHC record for the machine and displays previous values, Delta W, and Delta %.
- POKA-YOKE & OUT-OF-SPEC VALIDATION: Instantly evaluates entered values, flags out-of-spec or invalid measurements, and enforces complete resolution before marking Activity 02 Power COMPLETED.
- AUTHORITATIVE SESSION PERSISTENCE: Saves validated power check records into the MHC session model and Machine Passport while updating the Journey Rail status.

## v1.5.3 — Phase 3A — Day 1 Laser Hours Autopilot (2026-08-12)

### Highlights
- DAY 1 LASER HOURS INTEGRATION: Connected Machine Passport data and native LaserEngine to Autopilot so Laser Hours becomes the first real engineering activity.
- DUAL LASER HEAD DISCOVERY: Automatically retrieves and displays operating hours, baseline records, operating deltas, and lifecycle health for Laser Head 1 and Laser Head 2.
- ENGINEER VERIFICATION & RECALIBRATION: Allows engineers to confirm retrieved readings or record recalibrated/adjusted operating hours for offline runtime without destroying original source info.
- COMPLETION GATE & JOURNEY RAIL: Requires verification of both laser heads before marking Activity 01 COMPLETED, automatically advancing Autopilot progress and unlocking downstream activities.

## v1.5.2 — MHC Autopilot Session Brain Sprint (2026-08-12)

### Highlights
- SESSION BRAIN ENGINE: Built persistent session/progress layer tracking Customer, Machine, MHC Session ID, Start Date, Current Day, Active Activity, and Readiness Score across Days 1–4.
- ACTIVITY STATE ARCHITECTURE: Tracks atomic status per activity (✓ COMPLETED, ◉ CURRENT / IN PROGRESS, ⚠ NEEDS REVIEW, ○ UPCOMING, 🔒 LOCKED).
- JOURNEY RAIL BRAIN: Interactive Journey Rail displays real-time status tree indicators and supports direct jump navigation to any unlocked or completed activity.
- READINESS MODEL: Lightweight readiness calculator computes completed count, incomplete count, needs review items, next actionable activity, and core engineering report readiness.
- READ-ONLY REVIEW MODE: "Review Progress" allows inspection of session state and readiness without mutating session data.
- SESSION RECOVERY & START NEW: Start New creates genuinely new sessions without overwriting existing sessions, while Continue Existing restores exact progress.

## v1.5.1 — MHC Journey Rail Correction Sprint (2026-08-12)

### Highlights
- JOURNEY RAIL STRUCTURE: Corrected MHC Autopilot Journey Rail labels and hierarchy to reflect the actual multi-day MHC workflow.
- DAY 1: 01 Laser Hours, 02 Laser Head 1 (Power, Beam Profile / Mode, Inspection / Findings), 03 Laser Head 2 (Power, Beam Profile / Mode, Inspection / Findings).
- DAY 2: 04 Stage Calibration (Stage 1, Stage 2).
- DAY 3: 05 AGC (AGC 1, AGC 2), 06 Temperature & Evidence.
- DAY 4: 07 MHC Readiness Review, 08 Report Generation, 09 Buyoff / Complete.
- PLANNED / LOCKED ACTIVITIES: Activities are visually planned/locked on the Journey Rail without adding measurement logic yet, preserving setup flows and canvas engines intact.

## v1.5.0 — MHC Autopilot Foundation Sprint (2026-08-12)

### Highlights
- MHC AUTOPILOT ENTRY: Introduced MHC Autopilot as the primary Machine Health Check experience asking ONE focused question at a time.
- MHC JOURNEY RAIL: Introduced the Journey Rail status model (completed, current, needs review, upcoming) supporting setup and planned activities.
- SESSION RECOVERY & DETECTION: Auto-detects existing incomplete sessions with options to Continue Existing, Start New, or Review Progress without data loss.
- CANVAS INTEGRATION: Retained full Smart MHC Workspace canvas accessibility under "Canvas / Workspace" without modifying existing engines.

## v1.4.10 — Client-Side Storage Quota Fix & Raw Telemetry IndexedDB Offloading (2026-08-09)

### Quota Optimization & Local Storage Fix
- **LocalStorage Quota Fix**: Stripped heavy `records` raw telemetry array from `SavedTemperatureRecord` inside `localStorage` and D1 sync payload, reducing per-record JSON footprint from ~60–100MB to ~150KB.
- **IndexedDB Offloading**: Full raw temperature points offloaded to browser IndexedDB (`fsos_temperature_db`), preserving zero-data-loss auditability locally without consuming `localStorage` quota or incurring cloud storage costs.
- **Automatic Machine Sanitization**: Integrated `sanitizeMachine` in `StorageService.getMachines()` and `StorageService.saveMachines()`, automatically downsampling time-series channels exceeding 1500 points and stripping legacy bloated records.

## v1.4.9 — Version Harmonization & Cloudflare Runtime Identity (2026-08-09)

### Version Harmonization & Identity
- **Version Harmonization**: Updated `package.json`, `metadata.json`, and all UI in-app version badges (`Sidebar`, `StartPageModule`, `SettingsModule`) to `v1.0.14`.
- **Cloudflare Runtime Version Identity**: Configured `CF_VERSION_METADATA` binding and `APP_VERSION` variable in `wrangler.toml` and exposed version, `cfVersionId`, `cfVersionTag`, and `cfVersionTimestamp` via `/api/sync/status` and `/api/health`.

## v1.4.8 — D1 Performance Index Migration (2026-08-09)

### D1 Database Indexes
- **Versioned Migration `0001_add_indexes.sql`**: Created idempotent migration script adding `idx_records_updated_at` on `updated_at` and `idx_records_table_name` on `table_name` without altering existing table structures or data.
- **Production Query Optimization**: Accelerates `/api/changes` delta sync queries and `/api/sync` lookups.

## v1.4.7 — Cross-Device Deletion Synchronization (2026-08-09)

### Cross-Device Deletion Sync
- **Deletion Tombstone Generation**: `syncEnqueueList` compares previous local storage state against updated collections to automatically detect deleted items and enqueue `action: "delete"` tombstones.
- **Authoritative D1 Marking**: Cloudflare Worker `/api/sync` persists tombstones to D1 with `is_deleted = 1` and `data = null`.
- **Tombstone Propagation**: `/api/changes` delivers deletion tombstones during both incremental and full synchronization (`since=0`), ensuring deleted records do not resurrect.
- **Offline Deletion Queueing**: Deletions performed offline are queued locally and synchronized to D1 upon network reconnection.

## v1.4.6 — Authoritative D1 Persistence (2026-08-09)

### Production Source of Truth
- **Authoritative D1 Persistence**: Make D1 the authoritative server-side source of truth for FSOS records across `/api/sync`, `/api/changes`, and `/api/record`.
- **Error Handling**: Guaranteed D1 failures or connection outages return HTTP 500 error responses rather than false success.
- **D1 Schema Migration**: Added version-controlled `migrations/0000_init.sql` for D1 `records` table initialization.

## v1.4.5 — Cloudflare Dependency Sync Audit (2026-08-08)

### Audited & Fixed
- **Dependency Classification**: Moved `@tailwindcss/vite` and `@vitejs/plugin-react` from `dependencies` to `devDependencies` to prevent production build tree mismatches.
- **Lockfile Synchronization**: Re-synced `package-lock.json` lockfileVersion 3 and verified `npm ci` and `NODE_ENV=production npm ci` pass with 100% success.

## v1.4.4 — Atlas Lockfile Verification (2026-08-08)

### Verified & Synchronized
- **Lockfile Clean Regeneration**: Deleted `node_modules` and `package-lock.json`, regenerated via `npm install`.
- **Clean Install Verification**: Executed `npm ci` locally with 100% success and 0 errors, guaranteeing lockfile parity for Cloudflare Git builds.

## v1.4.3 — Lockfile Synchronization (2026-08-08)

### Synchronized & Verified
- **Lockfile Regeneration**: Regenerated `package-lock.json` via `npm install`. Verified `vite` is strictly listed under `devDependencies`.

## v1.4.2 — Cloudflare Git Build Audit (2026-08-08)

### Audited & Resolved
- **Duplicate Dependency Clean-up**: Removed duplicate `vite` declaration present in both `dependencies` and `devDependencies` in `package.json`.
- **Lockfile & Build Verification**: Audit confirmed `.gitignore` preserves `package-lock.json` and root path configuration is correct for Cloudflare Git Build.

## v1.4.1 — Git Lockfile Verification (2026-08-08)

### Verified & Verified
- **Local Lockfile Validation**: Executed `npm ci` successfully with zero lockfile mismatches or errors.
- **Git Synchronization**: Verified `package.json` and `package-lock.json` are in complete sync for Cloudflare Workers CI/CD.

## v1.4.0 — Build Lockfile Sync (2026-08-08)

### Synchronized & Fixed
- **Lockfile Synchronization**: Synchronized package-lock.json with package.json for seamless Cloudflare Workers automated builds.

## v1.3.10 — Workers Build Finalization (2026-08-08)

### Finalized & Production Ready
- **Primary Runtime**: Set Cloudflare Workers (`src/worker.ts`) as primary production runtime.
- **Package Scripts**: Added `build:worker` and `deploy` scripts in `package.json`.
- **D1 Production Binding**: Bound production D1 UUID `5121135f-9336-46a6-88cc-9a2c85caae0b` in `wrangler.toml`.
- **Direct GitHub Deploy**: Repository verified ready for direct Cloudflare Workers deployment.

## v1.3.9 — Cloudflare Workers Migration Finalization & Version Harmonization (2026-08-08)

### Highlights
- CTO STRATEGIC DIRECTIVE: Finalized full migration from legacy Cloud Run container runtime to serverless Cloudflare Workers native edge infrastructure (src/worker.ts) with Cloudflare D1 sqlite database persistence (env.DB) and edge asset delivery (env.ASSETS).
- PRODUCT EVOLUTION FOUNDATION: Native D1 database transactions for background sync and image metadata, eliminating heavy server container dependencies while serving React SPA static assets globally via Cloudflare Edge.
- SYSTEM VERSION HARMONIZATION: Synchronized all in-app version badges, Operational Build Status (CFW-20260808-102), Wrangler deployment configuration (wrangler.toml), and documentation across FSOS.

## v1.3.8 — Cloudflare Deployment & Validation (2026-08-08)

### Verified & Documented
- **Wrangler & D1 Binding Verification**: Confirmed `wrangler.toml` assets (`./dist`) and D1 database binding (`DB`).
- **Cloud Run Decoupling**: Application runtime entirely independent of Cloud Run container dependencies.
- **Deployment Documentation**: Complete step-by-step Wrangler deploy instructions provided in `README.md`.

## v1.3.7 — Cloudflare Workers Foundation (2026-08-08)

### Migrated & Architecture
- **Cloudflare Workers Runtime Integration (`src/worker.ts` & `wrangler.toml`)**:
  - Full migration of application runtime and server endpoints to Cloudflare Workers native fetch standard.
  - Native route handling for `/api/health`, `/api/sync`, `/api/changes`, `/api/images`, `/api/record`, and `/api/sync/status`.
  - Configured Cloudflare D1 database binding (`env.DB`) and static asset binding (`env.ASSETS`).
- **Unified Static Asset & API Serving**:
  - Serves compiled React SPA assets directly from `dist` via `env.ASSETS` while routing API queries to native worker handlers.
- **Data Integrity & Robust Machine Lookup**:
  - Hardened Machine Passport and workspace modules against null machine access.

## v1.3.6 — Data Integrity Hotfix (2026-08-07)

### Fixed & Enhanced
- **Time Semantics**: Updated baseline default dates and saved/displayed timestamps to browser-local time (`getLocalDateString`).
- **Laser Power History**: Added `[+ New Current Check]` and `[+ Add Historical Record]` workflows. Records strictly sorted by measurement date; latest = Current, immediately preceding = Previous, "No previous record" rendered when no prior check exists.
- **IndexedDB Image Persistence**: Eliminated `localStorage` quota warnings and silent image payload pruning. Image and blob evidence are stored in IndexedDB (`ImageStore`) with lightweight references in `localStorage`.
- **Product / Process / Via Null-Safety**: Fixed `TypeError: can't access property "phase1", prev is null` across all comparison widgets with optional chaining and fallback empty state.
- **Beam Profile Record Management**: Added reliable record deletion with automatic cleanup of associated IndexedDB blob evidence.
- **Save Transaction Safety**: Atomic save flow ensures state updates occur only after successful persistence. On storage failure, form data is retained with actionable error feedback.

## v1.3.5 — Laser Lifecycle Engine Migration (2026-08-06)

### Added & Migrated
- **Native TypeScript Laser Lifecycle Engine (`src/utils/laserEngine.ts`)**:
  - Full deterministic lifecycle calculation formulas: continuous 24h dynamic runtime estimation, remaining operating hours, remaining days, and percentage calculations.
  - Multi-laser domain architecture: `MachineDomain` -> `LaserHeadDomain` -> lifecycle state, calibration history, and worst-state status aggregation (`ALARM` > `BASELINE_REQUIRED` > `WARNING` > `SAFE`).
  - Baseline management: `BASELINE_REQUIRED` status fallback when physical meter reading is missing.
  - Recalibration transaction logic: comparison between calculated estimated hour vs physical meter reading, deviation calculation, accuracy rating scale, and 10-entry calibration history auditing.
  - Evaluation time semantics (`getCurrentEvalTime`).
- **Persistence Adaptation (`src/utils/persistence.ts`)**:
  - Integrated `LaserEngine.normalizeMachines` into `StorageService.getMachines` to ensure multi-laser data schemas are seamlessly restored and normalized.
- **Type Definitions (`src/types/index.ts`)**:
  - Extended `LaserHead` and `Machine` interfaces with multi-laser engine domain properties and exported domain types.
- **Parity Validation Test Suite (`src/utils/laserEngine.test.ts`)**:
  - Verified 100% mathematical and behavioral parity against the source-of-truth Laser Hour Monitor.

## v1.3.4 — Phase 1.3: Smart MHC Refine & Release (ECO-20260806-038) (2026-08-06)

### Highlights
- CRITICAL WORKSPACE CORRECTION: Expanded Smart MHC across full viewport width while preserving exact A4 210:297 portrait aspect ratio and centering canvas.
- NEW: Canvas View Controls — integrated Zoom -, 100%, Zoom +, and Fit Page auto-scaling to fit A4 document perfectly inside viewport.
- NEW: DOM-Measured A4 Capacity Engine — real-time calculation of rendered document height against standard A4 printable height with visual fill meter.
- NEW: Automated Quality Check & Over-Capacity Guard — blocks PDF export when report height exceeds 1 page and alerts engineer to adjust widget layout.
- NEW: ISO 13374-4 Inspired Condition Monitoring Intelligence — automated Current Condition, Degradation Trend, Health Score, Prognosis Life, and Recommended Actions.
- NEW: Isolated A4 Print & PDF Export Engine — full-screen print preview modal generating clean 1-page A4 PDF output with zero UI chrome.
- NEW: Automatic Previous MHC Historical Comparison — automatically identifies and compares power, beam spot size, and thermal loop against previous machine session.
- NEW: Single Source of Truth Synchronization — inline data edits in Smart MHC sync instantly to active session data and data tray.
- NEW: Strict Separation of Templates & Drafts — Templates store structure/layout only; Drafts store full session measurements, custom fields, and canvas state.

## v1.3.3 — Phase 1.2: Smart MHC Core Build (ECO-20260806-037) (2026-08-06)

### Highlights
- NEW: Smart MHC Engine Single Source of Truth — direct bind to Machine Passport static identity, active MHCSession readings, and previous MHC historical data.
- NEW: Functional Data Tray availability engine — real-time AVAILABLE / MISSING / N/A status badges based on machine and session data state.
- NEW: [+ Add Custom Data] — create reusable, bindable MHC fields/measurements with text, number/unit, date/time, status, note, image, or measurement field types.
- NEW: Data-Connected Canvas Widgets — Laser Life, Laser Temp/Thermal Loop, Laser Power Calibration, Beam Comparison, Optics Condition, Process Parameters, Spare Parts, and Recommendations.
- NEW: Inline Missing Data Edit & Sync — fill missing readings directly inside Smart MHC without redirecting to Stage 01–08 forms; changes sync instantly across widgets and session.
- NEW: [+ Create Custom Widget] — build user-defined widgets binding existing or custom Data Tray fields with customizable display types (Cards, Tables, Callouts, Images).
- NEW: Interactive A4 Portrait Canvas — full drag/reorder controls (Move Up/Down, Duplicate, Remove), 1/1, 1/2, 1/3 column layouts, and A4 page fill capacity indicator.
- NEW: ISO 13374-4 Inspired Condition-Monitoring Intelligence — automated Current Condition, Degradation Trend, Overall Health Score, Prognosis Remaining Life, and Recommended Actions.
- NEW: Automatic Previous MHC Historical Comparison — compares current wattage, beam spot size, and thermal loop against previous completed MHC session without manual re-entry.
- NEW: Strict Separation of Templates & Drafts — Templates store structure/layout only (Save/Load/Duplicate); Drafts store actual machine session work, measurements, evidence, and canvas state.

## v1.3.2 — MHC CRUD & Machine Passport UX Refinement (ECO-20260803-035) (2026-08-03)

### Highlights
- FIXED: Machine Passport Customer deletion logic — customer deletion is strictly blocked when machines are assigned.
- FIXED: Machine Passport Machine deletion — deleting the last machine deletes ONLY that machine; customer account remains intact.
- FIXED: Removed duplicate "Machine Actions" dropdown from the Machine Detail panel; retained 3-dot card menu as primary CRUD control.
- NEW: Stage 01 (Current Laser Hour) CRUD controls — added "+ Add Laser" and per-laser "Delete Laser" actions with customizable identifiers.
- NEW: Stage 01 Remaining Hours indicator — calculated dynamic remaining hours with prominent alert badge when ≤500 hrs remaining.
- NEW: Stage 03 (Laser Output & Power) CRUD controls — added "+ Add Power Head" and per-head "Delete Laser Head" actions with customizable identifiers.
- NEW: Stage 03 Evidence Photo Management — added photo upload and thumbnail deletion for each laser power head.
- NEW: Photo evidence upload & instant thumbnail removal for Stages 02, 04, 05, and 06.
- COMPLETED: Version bump to v0.8.1 with complete system documentation harmonization.

## v1.3.1 — MHC Operations Workspace Release (ECO-20260803-034) (2026-08-03)

### Highlights
- NEW: Machine Health Check (MHC) operational workspace promoted to first-class primary category.
- NEW: Saved Report Draft Management featuring Load Draft, Duplicate Draft, and Delete Draft with confirmation.
- NEW: Real CSV Parsing & Data Hydration supporting field mapping with SUCCESS, PARTIAL, and ERROR feedback.
- NEW: Multi-Section CSV Data Export containing complete structured engineering data from Stages 01 through 08.
- NEW: Stage 01 Laser Hour auto-calculation model: Recorded Laser Hour + Reading Date + Reading Time + Elapsed Runtime = Calculated Current Laser Hour.
- NEW: Dynamic Engineer Identity integration removing all remaining hardcoded engineer names across MHC workflows.
- IMPROVED: Live Customer MHC Report Builder preview, document canvas, and executive sign-off blocks.
- COMPLETED: Full Definition of Done for v0.8.0 MHC Operations Workspace.

## v1.3.0 — Machine Passport Stability Sprint (ECO-20260803-032) (2026-08-03)

### Highlights
- NEW: Adopted Engineering Rule #004 (Empty State Recovery) across FSOS.
- IMPROVED: Machine Passport empty-state workflow and recovery.
- IMPROVED: Add Machine creation flow and form state initialization.
- IMPROVED: Machine management usability and layout consistency.
- FIXED: Empty-state Add Machine button not responding when all machines are deleted.
- FIXED: Duplicate "+" button in Add Machine interface.
- KNOWN ISSUES: Machine Health Check workflow improvements scheduled for future sprint.
- KNOWN ISSUES: Workflow Navigator UX refinement deferred.
- KNOWN ISSUES: Google AI Studio Git synchronization may intermittently fail.

## v1.2.10 — Machine Health Check Workflow Sprint (ECO-20260803-031) (2026-08-03)

### Highlights
- NEW: Machine Health Check (MHC) operational workflow overhaul.
- NEW: Active Inspection Target Machine selection grid with real-time status and health score filters.
- NEW: Laser Hour Monitoring & Lifecycle Threshold management (Recorded Hours, Current Reading, Runtime Delta, Warning/Critical Thresholds).
- NEW: Dynamic Laser Output & Power Calibration Check supporting multi-laser configurations (Add/Edit/Delete laser heads).
- NEW: Dynamic Editable Inspection Sections (Optics Cleanliness, Chiller Thermal Loop, Executive Release Verdict).
- NEW: 1-Click Customer MHC Report Generation reusing shared Executive Report engine.
- NEW: Standalone Customer-Ready MHC Report Document View with print, PDF export, sign-off blocks, and Before/After photos.
- FIXED: Customer account deletion following Engineering Rule #001 CRUD consistency with confirmation dialog.
- FIXED: Machine addition workflow keeps engineer inside active customer fleet workspace.
- NEW: Machine Card 3-Dot Action Menu (Edit Specifications, Rename Asset, Duplicate Machine, Delete Machine).
- NEW: Machine Photo Management (Upload, Change, and Remove image support for JPG, PNG, WEBP).

## v1.2.9 — Premium Light Experience (ECO-20260803-030) (2026-08-03)

### Highlights
- NEW: Premium Light Theme refinement milestone.
- NEW: UI polishing phase officially introduced across all system views.
- IMPROVED: Overall visual consistency, typography hierarchy, and enterprise presentation quality.
- IMPROVED: Increased text contrast across headings, body text, and labels for WCAG compliance.
- IMPROVED: Introduced depth between layout layers (off-white bg-slate-50 canvas vs pure white cards).
- IMPROVED: Distinct sidebar surface separation and refined subtle borders.
- IMPROVED: Card hierarchy with consistent spacing, subtle elevation, and stronger hero emphasis.
- FIXED: Visual refinement issues addressed during the Premium Light Experience sprint.
- KNOWN ISSUES: Workflow Navigator UX refinement deferred to a future sprint.
- KNOWN ISSUES: Cloudflare deployment currently requires platform-aware Vite base path configuration.
- KNOWN ISSUES: Google AI Studio Git synchronization may intermittently fail.

## v1.2.8 — Identity Experience Refinement (ECO-20260802-029) (2026-08-03)

### Highlights
- UX REFINEMENT: Centralized Engineer Profile management into dedicated My Profile workspace.
- CLEANUP: Completely removed duplicate profile fields (photo, name, role, email, phone, company, department) from Settings.
- DESKTOP ERGONOMICS: Re-architected My Profile into balanced 2-column layout (Personal Info vs Account Context & Certifications).
- HEADER POLISH: Compacted top header account menu trigger to [Avatar ▼], removing redundant text clutter.
- NAVIGATION HARMONIZATION: Direct profile access links from Sidebar Engineer Card, Header Account Menu, Users Directory, and Profile Panel.
- USERS DIRECTORY REDESIGN: Simplified Users table to 5 core columns with zero horizontal scrolling.
- OVERLAY STANDARDIZATION: Unified outside click, ESC key dismissal, and navigation auto-close across Notification Center and Account Dropdowns.
- FSOS DISCIPLINE: Synchronized system version v0.7.5 across all headers, sidebar, settings, and release documentation.

## v1.2.7 — Engineer Profile Photos & Identity System (ECO-20260802-028) (2026-08-03)

### Highlights
- NEW: Individual Engineer Profile Photos for multi-engineer system readiness.
- NEW: Photo Upload, Change Photo, Remove Photo, and Restore Default Avatar controls in My Profile.
- NEW: Instant photo preview with 5MB file size validation and JPG/JPEG/PNG/WEBP format checks.
- NEW: Automatic system-wide photo propagation across Sidebar, Header Account Menu, Users Directory, Profile Drawer, Activity Log, and Report Studio.
- NEW: Clean Initials Avatar generator fallback (e.g. Sahafiz -> SA) ensuring zero broken image icons.
- NEW: Users Table now begins every engineer row with [Avatar] | Full Name | Role | Company | Department | Status.
- NEW: Report Studio includes engineer avatars beside Prepared By, Approved By, and Reviewed By signatures.
- NEW: Activity Log renders [Avatar] Sahafiz updated Machine Passport for high-fidelity accountability.
- FSOS RULE #001: Enforced CRUD consistency & version synchronization to v0.7.4 across all workspaces.

## v1.2.6 — Identity & User Management (ECO-20260802-027) (2026-08-03)

### Highlights
- NEW: First-class "Users" module positioned in main sidebar above Settings for comprehensive team & identity governance.
- NEW: System Users directory table displaying Avatar, Full Name, Employee ID, Company, Department, Role, Status, and Last Login.
- NEW: Multi-Role hierarchy support with custom styled badges: Administrator, Field Service Engineer, Senior Engineer, Supervisor, Manager, and Viewer.
- NEW: Dynamic Real-time User Status tracking: Online, Offline, On Leave, Busy, and Inactive.
- NEW: Detailed User Profile drawer & editor with contact details, regional timezone/language settings, bio, and identity metadata.
- NEW: Top-right Header User Account menu with avatar, quick identity switch, notifications, appearance, and settings shortcuts.
- NEW: Multi-Engineer foundation enabling seamless active signed-in user switching with zero hardcoded engineer names remaining.
- SYSTEM HARMONIZATION: Version updated to v0.7.3 across Sidebar, Settings, About System, Release Notes, and Product Evolution Log.

## v1.2.5 — Founder Identity & Notification Center (ECO-20260802-026) (2026-08-03)

### Highlights
- NEW: Founder Identity dynamic engineer profile greeting (e.g. "Good Morning, Sahafiz").
- NEW: Functional Notification Center bell with real-time operational notifications, unread badge counter, category tags, and click-to-navigate capabilities.
- NEW: Notification management controls including "Mark as Read", "Mark All as Read", and "Clear All".
- NEW: Configurable Engineer Profile source in System Settings allowing instant customization of Name, Company, Role, and Department.
- IMPROVED: Removed all remaining placeholder/demo engineer names ("Alex") across Machine Health Check, Execution Planner, Quality Investigation, Machine Passport, and Today's Activity Log.
- IMPROVED: Operational realism and user identity continuity across all FSOS workspaces.
- FIXED: Version and system build documentation synchronized to v0.7.2 across Sidebar, Settings, About System, and Report Studio.
- KNOWN ISSUES: Workflow Navigator UX refinement deferred to a future sprint.

## v1.2.4 — Daily Work Orchestration (ECO-20260802-025) (2026-08-02)

### Highlights
- NEW: Daily Work operational entry point serving as the engineer's primary operational home upon opening FSOS.
- NEW: Mission orchestration providing unified visibility into customer (STMicroelectronics Muar), machine status (ASM Eagle XP-01), mission progress, and priority actions.
- NEW: Start Mission workflow for seamless execution initialization on new field service assignments.
- NEW: Continue Mission workflow enabling instant one-click resumption of active on-site work orders.
- NEW: Integrated Today's Schedule timeline and 3-day Upcoming Work outlook directly into the operational home page.
- NEW: Status KPI row tracking Machines Scheduled (2), Contract Days Remaining (68), Reports Pending (1), and Overdue Tasks (0).
- IMPROVED: Quick Access shortcuts providing direct 1-click navigation to Machine Passport, Workflow Guide, Planner, and Report Studio.
- IMPROVED: Navigation flow between existing modules, eliminating manual module searching and cognitive friction.

## v1.2.3 — Daily Work Operational Entry Point (ECO-20260802-025) (2026-08-02)

### Highlights
- NEW: Daily Work operational entry point serving as the engineer's primary operational home upon opening FSOS.
- NEW: Mission orchestration providing unified visibility into customer, machine status, mission progress, and priority actions.
- NEW: Continue Mission workflow enabling instant one-click resumption of active on-site work orders.
- NEW: Start Mission workflow for seamless execution initialization on new field service assignments.
- IMPROVED: Navigation flow between existing modules (Dashboard, Machine Passport, Workflow Guide, Planner, Report Studio).
- IMPROVED: Engineer workflow continuity, eliminating manual module searching and cognitive friction.

## v1.2.2 — Mission Companion Floating Guide Rail Refactor (ECO-20260802-023B) (2026-08-02)

### Highlights
- Floating Scroll-Sync Companion: Refactored Mission Companion container with responsive sticky positioning (`top-3 sm:top-4 z-20`) so the guide rail seamlessly floats along with the screen as engineers scroll down SOP steps.
- Elevated Backdrop Blur Styling: Enhanced Mission Companion container with backdrop blur filter, subtle shadow, and border rings so it visually floats alongside the SOP timeline content stream.
- Cross-Device Scroll Tracking: Ensured mobile, tablet, and desktop viewports all maintain active step scroll syncing and instant jump navigation.
- Cleanroom Operational Ergonomics: Optimized layout for single-column and two-column cleanroom tablet display ergonomics.
- System Version Harmonization: Synchronized v0.6.8 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.

## v1.2.1 — Mission Companion Behaviour Fix (ECO-20260802-023A) (2026-08-02)

### Highlights
- Founder Intent UX Alignment: Corrected Mission Companion behaviour to function as a quiet, ambient guide rail naturally embedded in the Workflow Guide.
- Zero Sidebar Chrome Perception: Removed heavy card borders and floating box aesthetics so engineers perceive guidance as part of the SOP document flow.
- Frameless Ambient Guide Rail: Blended step progress indicators and scroll tracking quietly into the page margin without intrusive visual popups or drawer chrome.
- Continuous Shift Ergonomics: Preserved smooth step jumping, active step scroll sync, and percentage progress indicators for 8-hour cleanroom shifts.
- System Version Harmonization: Synchronized v0.6.7 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.

## v1.2.0 — Mission Companion Integration (ECO-20260802-023) (2026-08-02)

### Highlights
- Product Vision Standard: Officially integrated Mission Companion as an ambient, quiet, and predictable guide rail within the Workflow Guide.
- Zero Visual Friction Execution: Removed explicit sidebar chrome perceptions, letting the Mission Companion visually blend directly into the SOP document flow.
- Continuous Shift Ergonomics: Designed for cleanroom Field Service Engineers operating for 8-hour shifts without cognitive overhead or manual scroll-backs.
- Real-time SOP Synchronization: Preserved precision scroll observer, instant step jumping, progress percentage tracking, and active step highlighting.
- PWA Cross-Platform Packaging: Strengthened Web App Manifest, standalone display mode, and icon support across Windows, macOS, Android, and iOS.

## v1.1.10 — Workflow Companion UX Alignment (ECO-20260801-022E) (2026-08-01)

### Highlights
- Product Engineering UX Analysis: Formulated invisible, ambient Workflow Companion paradigm focusing on cleanroom operational ergonomic flow.
- Zero Visual Friction Principle: Shifted design criteria away from explicit "sticky sidebar" perception toward seamless ambient progress HUD.
- Continuous Operational Sync: Preserved real-time scroll observer, instant step jump, and step status tracking without intrusive UI chrome.
- PWA Foundation Enhancements: Enhanced web app manifest, stand-alone display tags, iOS web app capabilities, and cross-platform mobile icon paths.
- System Version Harmonization: Synchronized v0.6.5 across Sidebar, Settings, About System, Report Studio, and Internal Changelog.

## v1.1.9 — Workflow Navigator Behaviour Correction (ECO-20260801-022D) (2026-08-01)

### Highlights
- Founder Intent UX Alignment: Configured Workflow Navigator as a persistent left-hand working companion (`sticky top-4`) during SOP scrolling.
- Zero-Scroll Jump Navigation: Guaranteed engineers always see Current Step, Completed Steps, Next Steps, and can jump instantly without scrolling back to top.
- Preserved SOP Aesthetics: Maintained clean 2-column SOP timeline flow without redesigning layout or creating unrequested secondary chromes.
- Automatic Step Observer: Real-time scroll detection keeps active step status, completion badges, and progress bar in continuous sync.
- Full PWA Foundation Established: Web App Manifest, standalone display mode, theme settings, and cross-platform mobile icons (Windows, macOS, Android, iOS).

## v1.1.8 — Unified Workflow Layout (ECO-20260801-022C) (2026-08-01)

### Highlights
- Founder Layout Refactor: Completely eliminated the separate Workflow Navigator column, merging navigation and SOP into one continuous engineering document.
- Integrated Inline SOP Sequence Ribbon: Embedded quick-nav roadmap directly inside document flow, eliminating independent floating sidebar perception.
- Maximized Engineering Content Space: Removed left workspace column so SOP section cards expand naturally across full container width.
- Unified Scroll Architecture: Document content and embedded navigation scroll together naturally as a single operational manual.
- PWA Architecture Foundation: Established PWA manifest, theme colors, display standards, and mobile icon configurations.

## v1.1.7 — Workflow Navigator Follow Behaviour (ECO-20260801-022B) (2026-08-01)

### Highlights
- Founder UX Correction: Configured Workflow Navigator to naturally follow the engineer while reading through long SOP sections.
- SOP Working Companion: Styled navigator as a document guide rail (`sticky top-4`) attached to the SOP timeline left margin.
- Eliminated Floating Sidebar Feeling: Preserved lightweight, calm document-rail visual identity without creating a secondary application chrome.
- Unbroken Navigation Access: Guaranteed engineers never need to scroll back to the top to jump between SOP phases.
- Maintained Real-Time Sync: Full support for active step scroll detection, step-jump smooth scrolling, and dark/light themes.

## v1.1.6 — Workflow Navigator Polish & Integration (ECO-20260801-022A) (2026-08-01)

### Highlights
- Established FSOS Workflow Presentation Principle: Every workflow feels like one continuous operational document.
- Refined Workflow Navigator into a sleek, integrated SOP Guide Rail that attaches seamlessly to the timeline content stream.
- Eliminated duplicate navigation headers and redundant step labels to establish single-source visual clarity.
- Subordinated Navigator container styling with lighter footprints, left border indicator pills, and refined typography.
- Optimized desktop spatial grid spacing and responsive mobile guide rail alignment.
- Concluded Workflow Navigator milestone in full preparation for Daily Work Orchestration.

## v1.1.5 — Service Execution Foundation — SOP Navigation Enhancement (ECO-20260801-022) (2026-08-01)

### Highlights
- Established FSOS Workflow Navigation Principle: Exists once, remains visible, reflects progress.
- Replaced top horizontal Mission Progression bar with persistent sticky vertical Workflow Navigator.
- Implemented automatic scroll-position synchronization with real-time active step detection.
- Added visual step indicators for completed (✓), active (►), and upcoming (○) SOP stages.
- Integrated smooth-scroll click jumping across all 6 SOP phases (Mission, Passport, MHC, Planner, Report, Complete).
- Extracted WorkflowNavigator as a reusable component for future execution modules (Calibration, Quality, Reports).

## v1.1.4 — Machine Passport Production Ready (ECO-20260731-021) (2026-07-31)

### Highlights
- Declared Machine Passport feature-complete for Founder Release v0.5.3.
- Validated two-tier workspace interaction standard: Workspace Management vs Selected Object Management.
- Refined Customer & Machine Workspace card visual consistency, dashed creation tiles, and hover states.
- Verified zero modal clipping issues on Machine Hero Cockpit dropdowns across Light and Dark themes.
- Established Machine Passport as the gold-standard reference implementation for upcoming Service Execution and Report Studio milestones.

## v1.1.3 — Workspace Interaction Standardization (ECO-20260731-019) (2026-07-31)

### Highlights
- Established FSOS permanent Workspace Interaction Principle: Creation is a Workspace Action, Management is an Object Action.
- Extracted "Add Machine" from Machine Actions dropdown and implemented dedicated "+ Add Machine" card tile in Machine Workspace grid.
- Maintained strict visual consistency between Customer Workspace cards and Machine Workspace cards (proportions, border-radius, hover transitions, dashed creation tiles).
- Enhanced Managed Laser Fleet header with rich customer account site, asset count, and operational availability status indicators.
- Kept Machine Actions dropdown strictly contextual to the selected machine (Edit, Rename, Duplicate, Archive, Delete).
- Updated version discipline across system sidebar, settings, report studio, and CTO notes.

## v1.1.2 — Customer Workspace Management (ECO-20260731-018) (2026-07-31)

### Highlights
- Resolved MP-001 Machine Hero Cockpit dropdown menu clipping issue by eliminating parent overflow constraints.
- Completed full Customer CRUD suite (Add, Edit Details, Quick Rename, Delete Account) with persistent state.
- Integrated overflow dropdown menu (⋮) on all Layer 1 Customer Cards for inline account management.
- Added Add Customer card to Layer 1 grid for streamlined account creation.
- Enforced full version alignment to v0.5.1 across system sidebar, settings, and release notes.

## v1.1.1 — Customer Workspace Foundation (ECO-20260731-017) (2026-07-31)

### Highlights
- Architected Layer 1 Customer Workspace with high-precision account cards displaying machine counts, average health, PM due, and critical alert badges.
- Architected Layer 2 Machine Workspace displaying filtered laser asset cards for the active customer account.
- Seamlessly bound Layer 3 Machine Hero Cockpit to selected machine cards for unified 3-tier navigation: Customer → Machine → Workspace.
- Preserved all existing CRUD features (Add, Edit, Rename, Duplicate, Archive, Delete) and 8-Point MHC execution workflows.
- Scaled navigation architecture for multi-customer, multi-site, and 100+ machine expansion.
- Updated system version discipline to v0.5.0 across all application modules.

## v1.1.0 — Machine Passport UX Enhancement (ECO-20260730-016) (2026-07-30)

### Highlights
- Redesigned Machine Passport top section into a high-precision industrial hero cockpit.
- Created Fleet Navigator strip with Previous/Next machine controls and active status counts.
- Promoted selected machine to prominent Hero Card displaying core identity, health gauge, and location.
- Grouped all management functions (Add, Edit, Rename, Duplicate, Archive, Delete) into a sleek Machine Actions dropdown.
- Streamlined primary workflow actions (Execute 8-Point MHC, View Reports) for immediate engineer clarity.
- Maintained complete backward compatibility and system version discipline at v0.4.2.

## v1.0.10 — Machine Passport Management (ECO-20260730-015) (2026-07-30)

### Highlights
- Integrated complete Machine Passport Management suite inside MachinePassportModule.
- Added Add Machine feature with complete telemetry baseline, laser heads, and consumable defaults.
- Added Edit Machine feature for updating machine specifications, customer allocations, and health scores.
- Added Rename Machine feature for fast inline re-designation of machine models and IDs.
- Added Delete Machine feature with confirmation dialog and automatic fleet re-selection.
- Positioned high-visibility management toolbar for <5-second discovery in Machine Passport.
- Updated system version discipline to v0.4.1 across sidebar, settings, and release notes.

## v1.0.9 — Theme Consistency (ECO-20260730-013) (2026-07-30)

### Highlights
- Completed system-wide Light Theme compliance audit across all 15 operational modules.
- Standardized shared theme tokens across reusable UI primitives (Card, Button, Badge, Modal, Tables).
- Eliminated hardcoded theme color overrides to ensure automatic theme inheritance.
- Improved readability, font weights, and surface elevation contrast for bright site operations.
- Unified Dark Mode and Light Mode visual fidelity and component behavior.
- Engineering Metrics: 28 Files Reviewed, 14 Files Modified, 112 Hardcoded Theme Colors Converted, 0 Remaining Violations.

## v1.0.8 — Premium Light Experience (ECO-20260730-012) (2026-07-30)

### Highlights
- Rebuilt Light Theme Design System for enhanced clarity, accessibility, and professional polish.
- Elevated text contrast hierarchy across headings, body text, and labels for comfortable reading.
- Improved surface elevation and border separation for clean card visibility across all system views.
- Refined sticky workflow navigation, badges, timeline connectors, and buttons for light mode operations.
- Enhanced sidebar readability with distinct section group titles and active item indicators.
- Dark theme token values strictly preserved and verified.

## v1.0.7 — Information Architecture (ECO-20260730-011) (2026-07-30)

### Highlights
- Sidebar reorganized into workflow-based groups (DAILY WORK, SERVICE EXECUTION, OPERATIONS, SMART TOOLS, SYSTEM).
- Added collapsible navigation sections with auto-expansion for the active workflow tab.
- Reduced navigation complexity and cognitive load for field service engineers.
- Improved engineer workflow discovery following operational journey instead of flat/alphabetical lists.
- Preserved existing module functionality and routing architecture across all 15 system modules.

## v1.0.6 — Guided Navigation (ECO-20260730-010) (2026-07-30)

### Highlights
- Added sticky Mission Progression navigation bar for effortless orientation during field operations.
- Added smooth scroll workflow navigation with stable section anchors (#mission, #passport, #mhc, #planner, #report, #complete).
- Active workflow step now tracks scrolling automatically via IntersectionObserver without layout flashing.
- Improved Workflow Guide usability for new field service engineers entering cleanroom sites.
- Existing workflow architecture, 6-phase SOP journey, and direct quick-action buttons preserved.

## v1.0.5 — Workflow Guide (ECO-20260730-009) (2026-07-30)

### Highlights
- Introduced new Workflow Guide module providing 6-phase Standard Operating Procedure (SOP).
- Standardized step structure: Purpose, What To Do (max 4 bullets), Expected Outcome, Quick Action Buttons.
- Added visual progress indicator bar and end-of-workflow completion badge.

## v1.0.4 — Mission Control Signature Design (ECO-20260730-003) (2026-07-30)

### Highlights
- Transformed Mission Control into an engineer's Operational Desk with signature visual identity.
- Implemented full pastel color language (#111315, #1A1D21, #20252B, #2B323A, #8B9DFF, #7FD4A6, #8ECDF7, #EFCB7A, #E98A8A).
- Implemented complete Theme Engine supporting Dark, Light, and System modes with smooth 250ms transitions.
- Refined Hero Section answering the 5 core operational questions in under 5 seconds.
- Added dedicated compact Machine Snapshot panel (Health, Heads, Cooling, Runtime, Remaining Service Life, SLA Progress).
- Reduced visual noise, softened borders, increased whitespace and mathematical typographic hierarchy.

## v1.0.3 — Mission Control Re-Architecture (ECO-20260729-004) (2026-07-29)

### Highlights
- Re-architected Mission Control from a generic dashboard into a true operational workspace (like opening today's work order).
- Starts immediately with today's operation: Customer, Machine, Purpose, Inspection Stage, and Next Action.
- Split Mission Control into modular components: ActiveWorkOrderHeader, InspectionStageStepper, WorkOrderChecklist, OperationalPrerequisites, TodayActivityLog.
- Removed quick-action buttons grid and statistics charts from Mission Control in favor of sequence-based action flow.
- Embedded contextual AI guidance directly inside active inspection stages.

## v1.0.2 — CTO Design Revision (2026-07-29)

### Highlights
- Shifted interface to calm, quiet, industrial operations workspace for field engineers.
- Implemented intentional Light & Dark theme transition between dark operational workspace and bright customer documents.
- Redesigned Executive Reports & Knowledge Base into crisp, document-oriented light theme.
- Removed artificial stats blocks and glowing visual noise in favor of mission-first hierarchy.
- Enforced strict version discipline across all footers, settings, and documentation.

## v1.0.1 — Core System Expansion (2026-07-15)

### Highlights
- Added 2-Year Execution Planner for long-term contract SLA maintenance scheduling.
- Integrated 8-Point Machine Health Check (MHC) automated score calculator.
- Added Laser Optics Beam Profiler & Galvo Scanner Calibration module.

## v1.0.0 — Initial Platform Release (2026-06-01)

### Highlights
- Initial release of Field Service Operations System with Machine Passport & Contract Tracking.
