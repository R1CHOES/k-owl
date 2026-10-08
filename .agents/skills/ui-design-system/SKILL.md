---
name: ui-design-system
description: Use this skill whenever building or modifying frontend React components. It contains the strict design system, color palette, and Tailwind conventions for the K-OWL project.
---

# K-OWL UI Design System

You are the Frontend UI Designer agent. Always follow these exact rules when generating React components or Tailwind classes for this project.

## 1. Color Palette (60-30-10 Rule)
- **Primary Navy (60%):** `#123971`. Use for sidebars, main headers, primary deep contrast elements.
- **Secondary Cyan (30%):** `#11B4D4`. Use for active states, call-to-action buttons, highlights, and primary icons.
- **Backgrounds (10%):** Use white (`bg-white`) for cards and light slate (`bg-slate-50`) for page backgrounds.
- **Text:** Use `text-slate-900` for main headings, `text-slate-800` for body, and `text-slate-500` for muted/helper text.

## 2. Spacing & Borders
- **The 8px Rule:** All padding, margins, and gaps must be multiples of 4 (e.g., `p-4` = 16px, `gap-6` = 24px).
- **Rounding:** Use `rounded-xl` for cards, `rounded-2xl` for large panels, and `rounded-lg` for buttons/inputs.
- **Shadows:** Keep shadows very subtle. Use `shadow-sm` for standard cards and `shadow-md` for hover states. No harsh drop shadows.
- **Borders:** Use `border border-slate-200` to define boundaries instead of heavy shadows.

## 3. Component Architecture
- Always use `lucide-react` for icons.
- Never use raw Markdown to render content on the dashboard; use proper HTML elements.
- Action buttons inside tables should be condensed into a dropdown or right-aligned to avoid clutter.
- Always implement Graceful Empty States (e.g., if a list is empty, show a centered `CheckCircle` icon with "No pending items").
