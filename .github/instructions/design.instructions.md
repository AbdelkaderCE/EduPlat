# ScholarStream Design Specification Handbook

This document serves as a complete design and user interface specification for **ScholarStream**, a premium, high-contrast, modern corporate educational platform. Use this handbook as a comprehensive guide to replicate the exact typography, color palette, component structure, spatial rules, and interaction patterns in other applications.

---

## 🎨 1. Visual Theme & Color Palette

ScholarStream utilizes a sophisticated **"Corporate Slate & Ocean Teal"** color scheme. It blends rich, high-contrast navy blues with pristine slate-gray surfaces and vibrant, elegant teal accents.

### Core Theme Tokens (Material Design / Tailwind configuration)

| Token Name | Tailwind Hex Code | Visual Role / Purpose |
| :--- | :--- | :--- |
| **`primary`** | `#002045` | Deep Navy Blue — High-impact headings, primary buttons, hero text, and header brand mark. |
| **`primary-container`** | `#1a365d` | Steel Navy Blue — Card backgrounds for featured sections or banners (e.g., payment alerts). |
| **`secondary`** | `#006b5f` | Deep Ocean Teal — Interactive states, active links, accent badges, and secondary markers. |
| **`secondary-container`** | `#62fae3` | Fresh Soft Mint/Teal — Highlights, visual banners, pill tags (e.g., "Active" or "In Progress" states). |
| **`on-primary`** | `#ffffff` | Absolute White — Text/icons nested on primary backgrounds. |
| **`on-secondary`** | `#ffffff` | Absolute White — Text on deep secondary teal buttons. |
| **`on-secondary-container`**| `#007165` | Darker Teal — Readable high-contrast text on soft mint/teal backgrounds. |
| **`background`** | `#f8f9ff` | Clean Off-White with Blue Ice tint — Primary canvas and app-wide background. |
| **`surface`** | `#f8f9ff` | Match-background surface — Navbar headers and page regions. |
| **`surface-container-lowest`**| `#ffffff` | Pure White — Main content cards, lesson view containers, and white form boxes. |
| **`surface-container-low`** | `#eff4ff` | Pale Ice Blue — Sidebars, search bars, and secondary backgrounds. |
| **`surface-container-high`** | `#dce9ff` | Medium Ice Blue — Hover backgrounds, button borders, and selected interactive states. |
| **`on-surface`** | `#0b1c30` | Deep Midnight Slate — Core readability body text. |
| **`on-surface-variant`** | `#43474e` | Charcoal Slate Gray — Labels, support info, descriptions, and breadcrumbs. |
| **`outline`** | `#74777f` | Mid-gray — Input boundaries and secondary visual separators. |
| **`outline-variant`** | `#c4c6cf` | Light-gray — Soft card dividers and thin border-lines. |
| **`error`** | `#ba1a1a` | Coral Crimson Red — Warning states, account deletions, and danger items. |
| **`error-container`** | `#ffdad6` | Soft Blush Pink — Background container for warnings. |

---

## ✍️ 2. Typography & Font Families

The brand uses a specific typography pairing: **Hanken Grotesk** for clean, bold displays and structural headings, and **Inter** for absolute legibility in body copy, labels, and forms.

### Typography Hierarchy

1. **Display Font family:** `"Hanken Grotesk"`, ui-sans-serif, system-ui, sans-serif
2. **Body/UI Font family:** `"Inter"`, ui-sans-serif, system-ui, sans-serif

### Font Scale Configuration (`fontSize` and `lineHeight`)

*   **`display-lg` (Hero Titles):**
    *   **Desktop:** `48px` (Line height: `56px`, Letter spacing: `-0.02em`, Weight: `700`)
    *   **Mobile:** `32px` (Line height: `40px`, Letter spacing: `-0.02em`, Weight: `700`)
    *   *Tailwind utility:* `font-title-lg text-4xl md:text-5xl font-bold tracking-tight text-primary`
*   **`headline-md` (Core Section Headings):**
    *   **Desktop:** `32px` (Line height: `40px`, Letter spacing: `-0.01em`, Weight: `600`)
    *   **Mobile:** `24px` (Line height: `32px`, Letter spacing: `-0.01em`, Weight: `600`)
    *   *Tailwind utility:* `font-title-lg text-2xl md:text-3xl font-bold text-primary`
*   **`title-lg` (Card / Section Headings):**
    *   `20px` (Line height: `28px`, Weight: `600`)
    *   *Tailwind utility:* `text-xl font-semibold text-primary font-title-lg`
*   **`body-lg` (Leading Intro Paragraphs):**
    *   `18px` (Line height: `28px`, Weight: `400`)
    *   *Tailwind utility:* `text-lg leading-relaxed text-on-surface-variant font-sans`
*   **`body-md` (Standard Content / Body / Text):**
    *   `16px` (Line height: `24px`, Weight: `400`)
    *   *Tailwind utility:* `text-base leading-relaxed text-on-surface-variant font-sans`
*   **`label-md` (Sidebar labels, buttons, fields):**
    *   `14px` (Line height: `20px`, Letter spacing: `0.01em`, Weight: `500`)
    *   *Tailwind utility:* `text-sm font-medium tracking-wide font-sans`
*   **`label-sm` (Badges, breadcrumbs, tags):**
    *   `12px` (Line height: `16px`, Weight: `600`)
    *   *Tailwind utility:* `text-xs font-semibold uppercase tracking-wider font-sans`

---

## 📐 3. Grid, Spacing & Borders

A highly disciplined grid layout keeps components cleanly segregated. Margin variables are adjusted explicitly for device type.

*   **`container-max`:** Maximum layouts are restricted to `1280px` (`max-w-7xl` or `max-w-[1280px]`) centered via `mx-auto`.
*   **Gaps & Vertical Stacks:**
    *   **`gutter`:** `24px` (`gap-6`) standard between grid blocks.
    *   **`stack-lg`:** `48px` (`space-y-12`) for wide sections.
    *   **`stack-md`:** `24px` (`space-y-6`) between related blocks.
    *   **`stack-sm`:** `12px` (`space-y-3`) for small internal elements inside cards.
    *   **`base`:** `8px` (`space-y-2` or `p-2`) spacing for tiny items.
*   **Padding Margins:**
    *   **`margin-desktop`:** `48px` (`px-12`) edge margin.
    *   **`margin-mobile`:** `16px` (`px-4`) side margin on phones.
*   **Border Radius:**
    *   **Cards & Video Embeds:** `12px` (`rounded-xl` / `rounded-12`)
    *   **Buttons / Sidebar Items:** `8px` (`rounded-lg` / `rounded-8`)
    *   **Profile Images / Rounded Badges:** `9999px` (`rounded-full`)

---

## ⚙️ 4. Global Shell Components

Every ScholarStream screen inherits a standard Header and Footer layer:

### A. Top Navigation Bar (Header)
*   **Height:** Fixed `h-16` (`64px`)
*   **Position:** `fixed top-0 w-full z-50` with a clean underneath border line (`border-b border-outline-variant`).
*   **Visual Mix:**
    *   Background: Pure White / Glass effect -> `bg-white/95 backdrop-blur-md`
    *   Border: `#c4c6cf` (`border-outline-variant`)
    *   Shadow: `shadow-sm`
    *   **Left Section:** Bold display logotype ("ScholarStream") in `#002045` (`text-primary`), flanked by desktop horizontal primary navigations.
    *   **Center Section (Optional Search):** Oval input pill using `bg-surface-container-low` with a glass design.
    *   **Right Section:** Global tools: Notification bells, Shopping CART icons, and a circular `w-10 h-10` user avatar framed with a soft border.

### B. Standard Footer (Standard Page Ending)
*   Background: Deep Primary Navy (`bg-primary` -> `#002045`)
*   Text Color: `text-on-primary` (`#ffffff`) or custom high-contrast grey variables.
*   **Left:** Elegant, stacked logotype ("ScholarStream") with the copyright string styled below at diminished opacity (`opacity-80`).
*   **Middle/Right:** Quick Link inline list (About Us, Terms of Service, Privacy Policy, Contact Support, Instructor Portal).
*   **Far Right:** Smooth custom circular buttons with simple outline borders (`border-white/20`) for social/language/shares.

---

## 🎛️ 5. Modular View Blueprint Designs

### Layout 1: Course Player & Learning View (Sidebar Layout)
*   **Structure:** Split screen with fixed `w-80` left-aligned Sidebar and fluid `flex-1` scrolling Main Content.
*   **Sidebar Design (`bg-surface-container-low`):**
    *   Header detailing "Course Content" and a muted course series name.
    *   **Playlist-style Navigation Queue:** Core list of chapter links.
        *   **Standard Uncompleted State:** `#43474e` (`text-on-surface-variant`), showing a simple empty play circle indicator.
        *   **Completed State:** Shows checkbox with filled green/teal background.
        *   **Active Module Highlight Card:** Fully custom styled in `#62fae3` (`bg-secondary-container`), showcasing the current chapter.
    *   Bottom: Solid Dark Accent button to download resources instantly.
*   **Video Platform Card:** Clean `aspect-video` high-definition layout block styled with curved corners (`rounded-xl`).
    *   Features a play overlay showing a custom teal icon button (`bg-secondary` wrapper) which expands effortlessly on cursor hover (`hover:scale-110`).
*   **Task Navigation panel:** Bottom action tray featuring a styled secondary "Mark as Complete" button (Teal-bordered outlines) and a primary dark blue "Next Lesson" button with an expanding micro-arrow utility transition.

### Layout 2: Student Dashboard (Bento Layout)
*   **Layout Structure:** Adaptive grid split into standard desktop columns (`lg:grid-cols-12`). Left side contains standard courses, right side maps stats and quick indexes.
*   **My Courses Cards:** Rounded layout boxes with image overlays.
    *   An structural tracking bar (e.g. `65%` complete) using a sleek two-stage indicator bar: Background `bg-surface-container-high`, foreground colored explicitly in `bg-secondary` (`#006b5f`).
*   **Recently Viewed Bento blocks:**
    *   **Featured Horizontal Card (`bg-secondary-container`):** Multi-column layout with bold visual accents showcasing the last used lesson.
    *   **Square Article/Link Card (`bg-surface-container`):** Rounded visual blocks tracking supplementary text articles.
*   **Learning Progress Stat Box:** High contrast calendar board showing a clean bar chart with alternating opacities (Teal `#006b5f` active indicators alongside navy `#002045` background bars).

### Layout 3: Profile Settings (Two Column Layout)
*   **Layout Structure:** Left column navigations (Profile Settings, Purchased Content, Security, Sign Out), Right column details structural fields.
*   **Sidebar Cards:** Rounded navigation groups with active highlight tags using `bg-secondary-container` for select sections.
*   **Profile Details form:** Flat surfaces with minimal styling. Form fields use `bg-surface-container` with light borders `border-outline-variant`, turning border bounds into teal elements upon interaction.

---

## 🧩 6. Reusable Tailwind CSS Classes

Copy-paste these utility templates to match ScholarStream visuals instantly:

### Structural Containers
```html
<!-- Primary Frame Wrapper -->
<div class="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans">
  
  <!-- Outer Content Frame -->
  <div class="max-w-[1280px] mx-auto px-4 md:px-12 py-8"></div>
  
</div>
```

### Cards & Panels
```html
<!-- Pure White Content Card -->
<div class="bg-white border border-[#c4c6cf] rounded-xl p-6 shadow-sm"></div>

<!-- Deep Navy Interactive Card -->
<div class="bg-[#002045] text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
  <!-- Subtle back glow accent -->
  <div class="absolute -bottom-10 -right-10 w-40 h-40 bg-[#006b5f]/20 rounded-full blur-3xl"></div>
</div>

<!-- Ice Blue Decorative Side Block -->
<div class="bg-[#eff4ff] border border-[#c4c6cf] p-6 rounded-xl"></div>
```

### Interactive Buttons
```html
<!-- Primary Deep Navy Button -->
<button class="bg-[#002045] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#006b5f] transition-all duration-200 active:scale-[0.98] cursor-pointer">
  Explore Catalog
</button>

<!-- Outline Secondary Button -->
<button class="border-2 border-[#006b5f] text-[#006b5f] px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#006b5f]/5 transition-all duration-200 cursor-pointer">
  Mark as Complete
</button>

<!-- Save / Mini-utility Badge tag Button -->
<button class="bg-[#eff4ff] hover:bg-[#dce9ff] text-[#002045] px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-2">
  Save Lesson
</button>
```

### Visual Labels & Indicator Tags
```html
<!-- Mint Active Badge -->
<span class="px-2 py-1 bg-[#62fae3] text-[#007165] rounded text-xs font-bold uppercase tracking-wider">
  In Progress
</span>

<!-- Dark Accent Indicator -->
<span class="px-3 py-1 bg-[#006b5f] text-white rounded-full text-xs font-semibold">
  Active Course
</span>
```

---

## 🔣 7. Lucide Icon Mapping Table

ScholarStream utilizes Google Material Outlined symbols. In modern React frameworks, replace them with these standard equivalent imports from **`lucide-react`**:

| Material Icon Identifier | Lucide React Icon Component | Context Applied |
| :--- | :--- | :--- |
| `notifications` | `<Bell size={20} />` | Top Header Notifications |
| `shopping_cart` | `<ShoppingCart size={20} />` | Checkout Basket / Cart |
| `play_circle` | `<PlayCircle size={18} />` | Video indexes / links |
| `menu_book` | `<BookOpen size={18} />` | Layout / reading items |
| `architecture` | `<Compass size={18} />` | Technical / design subjects |
| `assignment_turned_in`| `<CheckSquare size={18} />` | Project phases / modules finished |
| `school` | `<GraduationCap size={18} />` | Assessments / Certificates |
| `chevron_right` | `<ChevronRight size={16} />` | Breadcrumbs indicators |
| `play_arrow` | `<Play size={24} />` | Main play hover circles |
| `schedule` | `<Clock size={16} />` | Duration meters |
| `trending_up` | `<BarChart2 size={16} />` | Experience difficulty indicators |
| `bookmark` | `<Bookmark size={18} />` | Save buttons |
| `description` | `<FileText size={18} />` | Support documents download |
| `link` | `<Link2 size={18} />` | Supplementary URLs links |
| `payments` | `<CreditCard size={20} />` | Direct Checkout alerts |
| `verified_user` | `<ShieldCheck size={20} />` | Verification assurances |
| `logout` | `<LogOut size={18} />` | User logging out actions |
| `vpn_key` | `<Key size={24} />` | Institutional codes |
| `person` | `<User size={18} />` | Primary settings indexes |

---

## ✨ 8. Interactive State & Animation Principles

Configure these micro-interactions to preserve the premium feel:

1.  **Dynamic Item Hovers (`transition-all duration-300`):**
    Course cards, navigation rows, and profile fields should glide softly into focus. Avoid rapid snapping. Pair cards with a slight translation delta (`hover:-translate-y-1 hover:shadow-lg`).
2.  **Spring Action Button Scaling (`active:scale-[0.98]`):**
    All interactive buttons should animate smoothly on clicks, mirroring physical surfaces.
3.  **Proportional Progress Transitions:**
    Render course progress meters (`bg-[#006b5f]`) with an elegant CSS entrance animation (`transition-all duration-1000 ease-out`).
4.  **Breadcrumb Fading:**
    Maintain structural breadcrumbs at moderate opacity (`opacity-60`), brightening to maximum visibility upon direct focus.
