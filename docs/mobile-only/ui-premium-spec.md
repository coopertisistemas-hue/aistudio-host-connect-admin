# Host Connect — Mobile-only (UI.0 Premium Parity)

Visual specification to align Host Connect (/m) with the **Delivery Connect** premium standard.

---

## 1. Technical Implementation (Tokens)
All visual variables must be consumed via CSS variables defined in [tokens.css](../../src/styles/tokens.css).

### 1.1 Semantic Color Tokens
| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--ui-surface-bg` | `#F8FAF9` | App-wide background |
| `--ui-surface-card` | `#FFFFFF` | Main card background |
| `--ui-surface-neutral`| `#F1F3F2` | Secondary surfaces / Icon bg |
| `--ui-color-text-main`| `#1A1C1E` | Primary titles and body |
| `--ui-color-text-muted`| `#71717A` | Labels, placeholders, captions |
| `--ui-color-border` | `rgba(0,0,0,0.05)` | Subtle card/divider borders |
| `--ui-color-primary` | `hsl(186, 100%, 18%)` | Action items |

---

## 2. Typography Scale
| Role | Size | weight | tracking | line-height | rule |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **H1 (Headers)** | 20px (1.25rem) | Bold | -0.02em | 1.2 | Used for Page Titles |
| **H2 (Labels)** | 14px (0.875rem) | Bold | 0.1em | 1.4 | **Uppercase required** |
| **Body Bold** | 15px (0.9375rem) | Bold | Normal | 1.5 | Main info weight |
| **Body Medium** | 13px (0.8125rem) | Medium | Normal | 1.5 | Secondary descriptors |
| **Labels / Tags** | 11px (0.6875rem) | Bold | 0.05em | 1.1 | Meta info / Small stats |

---

## 3. Visual Standard (Radius & Shadows)
- **Standard Card Radius**: 22px (`--ui-radius-card`).
- **Standard Button Radius**: 16px (`--ui-radius-button`).
- **Input / Action Radius**: 12px (`--ui-radius-input`).
- **Shadow (Soft Premium)**: `0 4px 12px -2px rgba(0, 0, 0, 0.02)` (`--ui-shadow-soft`).

---

## 4. Interactive States & Feedback
- **Pressed/Active**: Scale `0.98` + subtle opacity drop.
- **Disabled**: Grayscale filter or `opacity-40` + `pointer-events-none`.
- **Skeleton**: Background `neutral-200` with `animate-pulse` and `rounded-xl`.
- **Empty/Error**: Central alignment, human-friendly message, primary action below.

---

## 5. Component Patterns

### 5.1 StatCard (KPI)
- Large bold value.
- Small uppercase label top-left.
- Faded opacity icon top-right (30%).

### 5.2 ListRow (Navigation)
- Icon on the left (neutral-bg container).
- Title + Subtitle stack.
- Chevron or Badge on the right.

### 5.3 Buttons
- **Primary**: Variable hue, shadow-lg with hue-offset, 16px radius.
- **Ghost**: No background/border, text-primary, active scale effect.

---

## 6. Mapped Locations (Codebase)
- **Styles Root**: [tokens.css](../../src/styles/tokens.css).
- **Global Config**: [index.css](../../src/index.css).
- **Root Layout**: [MobileShell.tsx](../../src/components/mobile/MobileShell.tsx).
- **Core Components**: [MobileUI.tsx](../../src/components/mobile/MobileUI.tsx).
- **Main Shell Groups**: [App.tsx](../../src/App.tsx).
