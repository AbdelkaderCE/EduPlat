# ScholarStream Design Tokens - Tailwind Quick Reference

## 🎨 Color Palette

### Primary Colors
```tailwind
bg-[#002045]      /* Deep Navy Blue - Headings, primary buttons, hero text */
text-[#002045]    /* Primary Navy - Text on light backgrounds */

bg-[#1a365d]      /* Steel Navy - Card backgrounds, featured sections */
text-[#1a365d]    /* Steel Navy - Alternative primary text */
```

### Secondary Colors
```tailwind
bg-[#006b5f]      /* Deep Ocean Teal - Interactive elements, active links */
text-[#006b5f]    /* Secondary Teal - Clickable text, accent text */

bg-[#62fae3]      /* Fresh Soft Mint - Highlights, badges, success states */
text-[#62fae3]    /* Mint Accent - Text on dark backgrounds */
text-[#007165]    /* Darker Teal - Text on mint backgrounds (high contrast) */
```

### Background Colors
```tailwind
bg-[#f8f9ff]      /* Clean Off-White with Blue Ice tint - Page canvas */
bg-white          /* Pure White - Content cards, forms */
bg-[#eff4ff]      /* Pale Ice Blue - Sidebars, secondary backgrounds */
bg-[#dce9ff]      /* Medium Ice Blue - Hover states, selected interactive */
```

### Text Colors
```tailwind
text-[#0b1c30]    /* Deep Midnight Slate - Body text (core readability) */
text-[#43474e]    /* Charcoal Slate Gray - Labels, support text, descriptions */
text-[#74777f]    /* Mid-Gray - Input boundaries, secondary dividers */
text-[#c4c6cf]    /* Light-Gray - Soft card dividers, thin borders */
```

### Error & Warning
```tailwind
bg-[#ba1a1a]      /* Coral Crimson Red - Error states, danger */
text-[#ba1a1a]    /* Red Text - Error messaging */
bg-[#ffdad6]      /* Soft Blush Pink - Error background containers */
```

---

## ✍️ Typography Scales

### Display Large (Hero Titles)
```tailwind
/* Desktop: 48px */
text-4xl md:text-5xl font-bold text-[#002045] font-title-lg tracking-tight

/* Mobile: 32px */
text-2xl font-bold text-[#002045] font-title-lg
```

### Headline Medium (Section Headings)
```tailwind
/* Desktop: 32px */
text-2xl md:text-3xl font-bold text-[#002045] font-title-lg tracking-tight

/* Mobile: 24px */
text-2xl font-bold text-[#002045] font-title-lg
```

### Title Large (Card/Section Titles)
```tailwind
text-xl font-semibold text-[#002045] font-title-lg
/* 20px line-height 28px weight 600 */
```

### Body Large (Intro Paragraphs)
```tailwind
text-lg leading-relaxed text-[#43474e]
/* 18px line-height 28px weight 400 */
```

### Body Standard (Default Content)
```tailwind
text-base leading-relaxed text-[#0b1c30]
/* 16px line-height 24px weight 400 */
```

### Label Medium (Form Labels, Buttons)
```tailwind
text-sm font-medium tracking-wide text-[#0b1c30]
/* 14px line-height 20px weight 500 letter-spacing 0.01em */
```

### Label Small (Badges, Breadcrumbs, Tags)
```tailwind
text-xs font-semibold uppercase tracking-wider text-[#43474e]
/* 12px line-height 16px weight 600 */
```

---

## 📐 Spacing & Grid Tokens

### Container
```tailwind
max-w-[1280px]    /* Container max width */
mx-auto           /* Center container */
px-12             /* Desktop margin (48px) */
px-4              /* Mobile margin (16px) */
```

### Gaps & Columns
```tailwind
grid-cols-12      /* 12-column grid */
gap-6             /* 24px gap between columns */
```

### Vertical Stacking
```tailwind
space-y-12       /* 48px vertical gap (stack-lg) */
space-y-6        /* 24px vertical gap (stack-md) */
space-y-3        /* 12px vertical gap (stack-sm) */
space-y-2        /* 8px vertical gap (base) */
```

### Padding
```tailwind
p-6              /* 24px padding (standard card) */
p-8              /* 32px padding (large card) */
px-4 py-3        /* Custom padding (forms) */
```

---

## 🔘 Border & Radius Tokens

### Border Radius
```tailwind
rounded-xl       /* 12px - Cards, video embeds, major containers */
rounded-lg       /* 8px - Buttons, form fields, sidebar items */
rounded-full     /* 9999px - Circular elements (avatars, badges) */
```

### Borders
```tailwind
border border-[#c4c6cf]              /* Light gray divider */
border border-[#006b5f]              /* Teal active border */
border-b border-[#c4c6cf]            /* Bottom border only */
```

---

## ✨ Interactive Components

### Primary Button
```tailwind
bg-[#002045] text-white px-6 py-3 rounded-lg 
text-sm font-medium 
hover:bg-[#006b5f] 
transition-all duration-200 
active:scale-[0.98] 
cursor-pointer
```

### Secondary Button (Outline)
```tailwind
border-2 border-[#006b5f] text-[#006b5f] 
px-6 py-3 rounded-lg 
text-sm font-medium 
hover:bg-[#006b5f]/5 
transition-all duration-200 
cursor-pointer
```

### Ghost Button (Text Only)
```tailwind
bg-transparent text-[#006b5f] 
px-4 py-2 rounded-lg 
text-sm font-medium 
hover:bg-[#eff4ff] 
transition-all duration-200
```

### Badge / Pill Tag
```tailwind
px-3 py-1 bg-[#62fae3] text-[#007165] 
rounded-full text-xs font-semibold 
uppercase tracking-wider
```

---

## 🎬 Motion & Animations

### Standard Transition (Cards, Hover Effects)
```tailwind
transition-all duration-300    /* Smooth 300ms transition */
hover:-translate-y-1           /* Subtle upward movement on hover */
hover:shadow-lg                /* Enhanced shadow on hover */
```

### Button Interactions
```tailwind
active:scale-[0.98]            /* Slight scale down on click */
```

### Loading Spinner
```tailwind
animate-spin                   /* Continuous rotation */
w-12 h-12 border-4 rounded-full
border-[#006b5f] 
border-t-[#62fae3]             /* Two-tone spinner effect */
```

### Progress Bar
```tailwind
transition-all duration-1000   /* Smooth progress animation */
ease-out                       /* Easing function */
```

### Stagger Entrance (Lists)
```tailwind
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ 
  duration: 0.5, 
  delay: 0.1 + idx * 0.05      /* Stagger each item */
}}
```

---

## 🎯 Common Component Patterns

### Card Container (White Background)
```html
<div class="bg-white border border-[#c4c6cf] rounded-xl p-6 shadow-sm">
  <!-- Content -->
</div>
```

### Section Header
```html
<h2 class="text-2xl font-bold text-[#002045] font-title-lg">
  Section Title
</h2>
```

### Progress Bar Container
```html
<div class="h-2 bg-[#c4c6cf] rounded-full overflow-hidden">
  <div class="h-full w-[65%] bg-[#006b5f]"></div>
</div>
```

### Form Input Field
```html
<input 
  class="w-full px-4 py-3 border border-[#c4c6cf] rounded-lg 
         text-[#0b1c30] 
         focus:outline-none focus:border-[#006b5f] 
         focus:ring-2 focus:ring-[#62fae3]/20 
         transition-colors"
  placeholder="Enter text..."
/>
```

### Alert Box (Error)
```html
<div class="bg-[#ffdad6] border border-[#ba1a1a] rounded-lg p-4 flex items-center gap-3">
  <AlertCircle size={20} class="text-[#ba1a1a] flex-shrink-0" />
  <p class="text-sm text-[#ba1a1a]">Error message here</p>
</div>
```

### Sidebar Navigation
```html
<button 
  class="w-full text-left px-4 py-3 
         hover:bg-[#eff4ff] 
         text-[#0b1c30] 
         hover:text-[#006b5f] 
         transition-colors"
>
  Navigation Item
</button>
```

### Feature Card (Secondary)
```html
<div class="bg-[#eff4ff] border border-[#c4c6cf] rounded-xl p-6">
  <h3 class="text-lg font-semibold text-[#002045] font-title-lg">
    Feature Title
  </h3>
  <p class="text-sm text-[#43474e] mt-2">Description</p>
</div>
```

---

## 📱 Responsive Breakpoints

```tailwind
/* Mobile-first approach */
text-sm                    /* Mobile: small text */
md:text-base              /* Tablet (768px+): standard text */
lg:text-lg                /* Desktop (1024px+): large text */
md:px-12                  /* Desktop margins */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
```

---

## 🎨 Complete Page Layout Template

```html
<div class="min-h-screen bg-[#f8f9ff]">
  <!-- Header -->
  <header class="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#c4c6cf] shadow-sm">
    <div class="max-w-[1280px] mx-auto px-12 py-4">
      <!-- Header Content -->
    </div>
  </header>

  <!-- Main Content -->
  <main class="pt-16">
    <div class="max-w-[1280px] mx-auto px-12 py-8 space-y-6">
      
      <!-- Page Title -->
      <h1 class="text-4xl font-bold text-[#002045] font-title-lg">
        Page Title
      </h1>

      <!-- 12-Column Grid -->
      <div class="grid grid-cols-12 gap-6">
        
        <!-- Left Content (8 cols) -->
        <section class="col-span-8 space-y-6">
          <!-- Content blocks -->
        </section>

        <!-- Right Sidebar (4 cols) -->
        <aside class="col-span-4 space-y-6">
          <!-- Sidebar content -->
        </aside>

      </div>

    </div>
  </main>

  <!-- Footer -->
  <footer class="bg-[#002045] text-white py-12">
    <div class="max-w-[1280px] mx-auto px-12">
      <!-- Footer content -->
    </div>
  </footer>
</div>
```

---

## 🔍 Verification Checklist

When building components, verify:

- [ ] Colors use exact hex codes from this reference
- [ ] Typography matches scale (font size, weight, line-height)
- [ ] Spacing uses grid tokens (gap-6, px-12, space-y-6)
- [ ] Border radius follows rules (12px cards, 8px buttons)
- [ ] Transitions are smooth (300-500ms duration)
- [ ] Hover states translate elements (-translate-y-1)
- [ ] Mobile responsive (px-4 → px-12, stacked → grid)
- [ ] Lucide icons are correct size (16-24px)
- [ ] Contrast ratios pass accessibility (WCAG AA)
- [ ] No hard-coded colors (use tokens)

---

**ScholarStream Design Tokens v1.0**  
**Last Updated:** May 28, 2026
