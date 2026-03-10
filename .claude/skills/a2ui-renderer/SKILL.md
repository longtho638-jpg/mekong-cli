# A2UI Terminal Renderer

Mekong-cli's implementation of Google's A2UI protocol for terminal/CLI rendering.
Converts A2UI declarative JSON component trees into Rich terminal widgets.

## Usage

```python
from src.a2ui import A2UIRenderer

renderer = A2UIRenderer()

# Load components via protocol messages
renderer.process_message({
    "surfaceUpdate": {
        "surfaceId": "main",
        "components": [
            {"type": "Text", "text": "Hello A2UI", "variant": "heading"},
            {"type": "Divider"},
            {"type": "Card", "title": "Status", "children": [
                {"type": "Text", "text": "All systems operational", "color": "green"}
            ]},
            {"type": "Button", "label": "Continue", "variant": "primary"},
        ]
    }
})

renderer.process_message({
    "dataModelUpdate": {"username": "Antigravity", "score": 42}
})

renderer.process_message({
    "beginRendering": {"surfaceId": "main"}
})
```

## Component Map

| A2UI Type  | Rich Widget                        | Notes                               |
|------------|------------------------------------|-------------------------------------|
| Text       | rich.text.Text                     | Variants: heading, subheading, body, caption, label |
| Card       | rich.panel.Panel                   | Supports title, subtitle, children  |
| Row        | rich.columns.Columns               | Horizontal layout                   |
| Column     | _Group (vertical)                  | Stacked vertical layout             |
| List       | rich.table.Table (single col)      | Renders items with bullet points    |
| Button     | rich.text.Text (styled)            | Variants: primary, secondary, danger, ghost |
| TextField  | rich.text.Text (⎕ placeholder)     | Shows value or placeholder          |
| CheckBox   | rich.text.Text (☐/☑)              | Toggles with green/white style      |
| Divider    | rich.rule.Rule                     | Optional title                      |
| Image      | rich.text.Text (placeholder)       | Displays alt text + src hint        |
| Icon       | Emoji unicode                      | Maps name to emoji (see ICON_MAP)   |
| Tabs       | rich.table.Table                   | Active tab highlighted cyan         |
| Modal      | rich.panel.Panel (bright_magenta)  | ESC subtitle hint                   |

## Data Binding

Bind component text to the shared data context using `$data.key` notation:

```python
renderer.process_message({"dataModelUpdate": {"name": "World"}})
renderer.load_surface("greet", [
    {"type": "Text", "text": "$data.name", "variant": "heading"}
])
renderer.render_surface("greet")  # prints "World"
```

Nested paths use dot notation: `$data.user.profile.name`

## Protocol Messages

| Message Key       | Payload Fields              | Effect                              |
|-------------------|-----------------------------|-------------------------------------|
| surfaceUpdate     | surfaceId, components[]     | Store/replace component tree        |
| dataModelUpdate   | any key-value pairs         | Merge into shared data context      |
| beginRendering    | surfaceId                   | Render surface to console           |
| deleteSurface     | surfaceId                   | Remove surface from registry        |

## Supported Icon Names

`home`, `search`, `settings`, `user`, `check`, `error`, `warning`, `info`,
`star`, `heart`, `arrow_right`, `arrow_left`, `plus`, `minus`, `edit`,
`delete`, `download`, `upload`, `refresh`, `link`, `lock`, `unlock`,
`mail`, `phone`, `calendar`, `clock`, `folder`, `file`, `chart`, `money`,
`cart`, `bell`

## File Structure

```
src/a2ui/
├── __init__.py      — Public API (A2UIRenderer, COMPONENT_REGISTRY)
├── components.py    — 13 component factories + COMPONENT_REGISTRY dict
└── renderer.py      — A2UIRenderer class (process_message, render_surface)
```

## Dependencies

- `rich` (already in pyproject.toml) — all terminal rendering
- Python stdlib only (no external dependencies)

## References

- https://a2ui.org
- https://github.com/google/A2UI
- Rich docs: https://rich.readthedocs.io
