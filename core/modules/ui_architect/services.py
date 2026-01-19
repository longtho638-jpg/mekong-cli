"""
UI Architect Module - Service Logic
"""

import logging
from typing import Dict

logger = logging.getLogger(__name__)


class UIArchitectService:
    """
    Translates user vibes into Google Material Design 3 specifications.
    """

    def generate_component_prompt(self, component_name: str, vibe: str) -> str:
        """
        Generates a System Prompt for the Code Agent to build an MD3 Component.
        """
        return f"""
ACT AS A GOOGLE MATERIAL DESIGN 3 EXPERT.
BUILD A REACT COMPONENT: {component_name}
VIBE: {vibe}

RULES (STRICT):
1.  **NO HTML TAGS**: Use `MD3Card`, `MD3Button` from `@/components/md3`.
2.  **NO MAGIC COLORS**: Use `var(--md-sys-color-*)`.
3.  **NO MAGIC SPACING**: Use `gap-4`, `p-4` (Tailwind matches MD3 spacing).
4.  **TYPOGRAPHY**: Use classes `m3-display-large`, `m3-headline-large`.

EXAMPLE:
```tsx
<MD3Card variant="elevated">
  <h2 className="m3-headline-medium text-[var(--md-sys-color-primary)]">Title</h2>
  <MD3Button variant="filled" icon={{<Icon />}}>Action</MD3Button>
</MD3Card>
```
"""

    def get_md3_tokens(self) -> Dict[str, str]:
        """
        Returns key M3 tokens for reference.
        """
        return {
            "primary": "var(--md-sys-color-primary)",
            "surface": "var(--md-sys-color-surface)",
            "shape-m": "var(--md-sys-shape-corner-medium)",
        }
