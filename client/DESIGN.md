# TrustChain Design System

## Overview
A modern, clean document verification platform inspired by Vercel's precision and Stripe's clarity. Built for trust, security, and professionalism.

## Color Palette

### Primary Colors
- **Background**: `#0a0a0a` (void black)
- **Surface**: `#111111` (elevated black)
- **Surface Hover**: `#1a1a1a` (subtle lift)
- **Border**: `#2a2a2a` (subtle separation)
- **Border Hover**: `#3a3a3a` (active separation)

### Accent Colors
- **Primary**: `#0070f3` (Vercel blue)
- **Primary Hover**: `#005cc5` (deeper blue)
- **Success**: `#10b981` (emerald green)
- **Success Background**: `rgba(16, 185, 129, 0.1)`
- **Error**: `#ef4444` (red)
- **Error Background**: `rgba(239, 68, 68, 0.1)`
- **Warning**: `#f59e0b` (amber)

### Text Colors
- **Primary Text**: `#ffffff` (white)
- **Secondary Text**: `#a1a1aa` (muted gray)
- **Tertiary Text**: `#71717a` (subtle gray)
- **Disabled**: `#52525b` (disabled gray)

## Typography

### Font Family
- **Primary**: `Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Mono**: `Geist Mono, 'SF Mono', Monaco, 'Cascadia Code', monospace`

### Scale
- **H1**: 48px / 1.1 / -0.02em / weight 700
- **H2**: 32px / 1.2 / -0.02em / weight 600
- **H3**: 24px / 1.3 / -0.01em / weight 600
- **Body**: 16px / 1.6 / 0 / weight 400
- **Small**: 14px / 1.5 / 0 / weight 400
- **Caption**: 12px / 1.4 / 0.01em / weight 500
- **Button**: 14px / 1 / 0 / weight 500

## Spacing Scale
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px
- **3xl**: 64px
- **4xl**: 96px

## Border Radius
- **Small**: 6px (inputs, small buttons)
- **Medium**: 8px (cards, buttons)
- **Large**: 12px (modals, large cards)
- **Full**: 9999px (pills, avatars)

## Shadows
- **Card**: `0 0 0 1px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)`
- **Card Hover**: `0 0 0 1px rgba(255,255,255,0.1), 0 4px 16px rgba(0,0,0,0.4)`
- **Elevated**: `0 0 0 1px rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.5)`

## Components

### Navigation
- Horizontal tabs with underline indicator
- Active tab: white text, 2px bottom border in primary color
- Inactive: secondary text, no border
- Hover: primary text color
- Transition: 200ms ease

### Cards
- Background: surface color
- Border: 1px solid border color
- Border radius: large (12px)
- Padding: lg (24px)
- Shadow: card shadow
- Hover: card hover shadow

### Buttons
- **Primary**: Primary background, white text, medium radius
  - Padding: 12px 24px
  - Hover: primary hover background, subtle lift
  - Active: scale(0.98)
  - Transition: 150ms ease

- **Secondary**: Transparent background, border color border, primary text
  - Padding: 12px 24px
  - Hover: surface hover background

- **Ghost**: Transparent, no border, secondary text
  - Hover: surface hover background

### Inputs
- Background: surface color
- Border: 1px solid border color
- Border radius: small (6px)
- Padding: 12px 16px
- Focus: primary color border, subtle glow
- Placeholder: tertiary text color
- Transition: 150ms ease

### Drop Zone
- Dashed border: 2px dashed border color
- Background: surface color with subtle pattern
- Hover: dashed border in primary color, surface hover background
- Active/dragging: primary color border, primary background at 5% opacity
- Border radius: large (12px)
- Padding: 2xl (48px)

### Tables
- Header: tertiary text, small size, uppercase, letter-spacing
- Row: border bottom 1px solid border color
- Row hover: surface hover background
- Cell padding: 16px

### Status Badges
- **Success**: Success background, success text, small radius, px-2 py-1
- **Error**: Error background, error text
- **Pending**: Warning background, warning text

## Layout Patterns

### Page Structure
- Max width: 1200px
- Centered with auto margins
- Padding: 24px horizontal on mobile, 48px on desktop
- Vertical spacing between sections: 3xl (64px)

### Grid
- 12-column grid
- Gap: md (16px) default
- Responsive: 1 column mobile, 2 tablet, 3+ desktop

### Forms
- Label above input, mb-1 (4px)
- Input full width
- Error message below input, error color, small text
- Submit button full width or right-aligned

## Animations

### Transitions
- **Default**: 200ms ease
- **Fast**: 150ms ease
- **Slow**: 300ms ease

### Hover Effects
- Cards: shadow elevation increase
- Buttons: background color change, subtle lift
- Links: color change, underline

### Loading States
- Skeleton: animated gradient from surface to surface hover
- Spinner: primary color, 1rem size, rotate animation
- Button loading: opacity 0.7, cursor not-allowed

## Responsive Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px
- **Wide**: > 1280px

## Dark Mode
- This design system is dark-first
- All colors optimized for dark backgrounds
- No separate dark mode needed
