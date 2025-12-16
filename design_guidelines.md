# Cloud Storage Platform - Design Guidelines

## Design Approach
**Reference-Based Design**: Inspired by Google Drive's proven UX patterns combined with modern shadcn/ui aesthetics for a professional, enterprise-ready cloud storage platform.

## Layout Architecture

### Primary Structure
```
┌─────────────────────────────────────────────────────────┐
│ Fixed Header: Logo | Search | Upgrade CTA | User Menu   │
├──────────┬──────────────────────────────────────────────┤
│ Sidebar  │ Main Content Area                            │
│ 240px    │ - Breadcrumb navigation                      │
│          │ - Action toolbar (New, Upload, Sort, View)   │
│          │ - File grid/list with selection checkboxes   │
│          │ - Right-click context menus                  │
│          │ - Quick preview pane (optional toggle)       │
└──────────┴──────────────────────────────────────────────┘
```

### Sidebar Navigation
- Quick Access section (pinned items)
- My Drive
- Shared with me
- Recent files
- Starred
- Trash
- Storage meter (visual progress bar)
- Billing/Upgrade (for Free users)

## Spacing System
Use Tailwind spacing units consistently:
- **Micro spacing**: 2 units (p-2, gap-2) for tight elements
- **Standard spacing**: 4 units (p-4, gap-4) for cards, buttons
- **Section spacing**: 6-8 units (py-6, py-8) for major divisions
- **Page margins**: 6-8 units desktop, 4 units mobile

## Typography Hierarchy

### Font System
- **Primary**: Inter or DM Sans (modern, clean sans-serif)
- **Monospace**: JetBrains Mono for file names and code

### Type Scale
- **Display**: 2xl-3xl font size, font-semibold - Page titles
- **Heading**: xl-2xl font size, font-semibold - Section headers
- **Subheading**: lg font size, font-medium - Card titles
- **Body**: base font size, font-normal - General text
- **Caption**: sm font size, font-normal - File metadata, timestamps
- **Label**: xs-sm font size, font-medium - Form labels, badges

## Component Design Patterns

### File Cards (Grid View)
- Square/portrait aspect ratio with rounded corners (rounded-lg)
- Large file type icon or thumbnail preview
- File name (truncated with ellipsis)
- File metadata (size, modified date) in muted text
- Hover state: subtle elevation with shadow
- Checkbox appears on hover/selection
- Star icon in top-right corner

### File List (Table View)
- Alternating row backgrounds for readability
- Icon | Name | Owner | Modified | Size columns
- Sortable column headers
- Row hover state with subtle background change
- Multi-select with shift+click support

### Upload Zone
- Large dashed border area when empty
- Upload cloud icon centered
- "Drag files here or click to browse" text
- Active drop state: highlighted border with accent color
- Progress bars for multiple uploads with file names

### Action Toolbar
- Primary actions: New Folder, Upload buttons (filled)
- Secondary actions: Sort, View toggle (outline/ghost)
- Search integrated or separate
- All icons from Lucide React

### Storage Meter
- Horizontal progress bar showing used/total
- Color coding: green (healthy), yellow (warning 80%+), red (critical 95%+)
- Text: "X GB of Y GB used"
- Upgrade CTA button below for Free users

### Pricing Cards (4 Plans)
- Card layout with distinct visual hierarchy per plan
- Plan name with color-coded badge (Free: gray, Pro: violet, Business: emerald, Enterprise: blue)
- Large price display (IDR format)
- Storage amount prominent
- Feature list with checkmarks
- "Current Plan" or "Upgrade" button
- Recommended badge on Pro plan

## File Type Visual System

### Color-Coded Icons
- Folders: Orange (#fb923c)
- Documents (.docx, .txt): Blue (#3b82f6)
- Images (.jpg, .png): Pink (#ec4899)
- PDFs: Red (#ef4444)
- Videos (.mp4, .mov): Purple (#8b5cf6)
- Audio (.mp3, .wav): Green (#10b981)
- Code files: Gray with syntax icon

## Modal & Dialog Patterns

### Preview Modal
- Full-screen or large centered modal
- Close button (X) top-right
- File name and actions in header
- Preview content (image, PDF viewer, document)
- Download, Share, More actions in footer

### Share Dialog
- Two-column layout: Settings | Link/Users
- Permission dropdown (View, Comment, Edit)
- Toggle switches for download restrictions, expiry
- Copy link button with success feedback
- User search/invite field

### Context Menus
- Right-click triggered
- Clean white background with subtle shadow
- Icons aligned left with action labels
- Destructive actions (Delete) in red at bottom
- Dividers between action groups

## Dashboard Design

### Storage Statistics Card
- Donut chart showing storage breakdown by file type
- Legend with percentages
- Quick actions below chart

### Recent Activity Feed
- Timeline-style list
- Avatar + action description + timestamp
- "View all" link at bottom

### Quick Actions Grid
- 2x2 or 3-column grid of action cards
- Icon + label for each action
- Hover lift effect

## Responsive Behavior

### Desktop (1024px+)
- Full sidebar visible
- Grid view 4-5 columns
- Preview pane available

### Tablet (768px-1023px)
- Collapsible sidebar (hamburger menu)
- Grid view 2-3 columns
- No preview pane

### Mobile (< 768px)
- Bottom navigation bar
- List view only
- Simplified action menus
- Full-screen modals

## Visual Treatment

### Elevation & Shadows
- Cards: subtle shadow (shadow-sm)
- Hover states: increased shadow (shadow-md)
- Modals: strong shadow (shadow-xl)
- Dropdowns/menus: medium shadow (shadow-lg)

### Border Radius
- Small elements (badges, tags): rounded-md
- Cards, inputs: rounded-lg
- Modals: rounded-xl
- Avatars: rounded-full

### Interactive States
- Hover: subtle background color change + shadow increase
- Active/Selected: accent color background with light opacity
- Focus: visible outline ring in accent color
- Disabled: reduced opacity (opacity-50) + cursor-not-allowed

## Accessibility Essentials
- All interactive elements keyboard accessible
- Focus indicators visible and clear
- Alt text for all file thumbnails/icons
- ARIA labels for icon-only buttons
- Color contrast ratio 4.5:1 minimum

## Images & Assets

**No hero images needed** - This is a utility application focused on functionality.

**Icons**: Lucide React library for all UI icons, custom SVG file type icons with consistent 24x24px size.

**Empty States**: Illustration-style graphics for:
- Empty drive folder
- No search results
- Trash is empty
- No shared files

Keep illustrations minimal and on-brand with primary color accents.