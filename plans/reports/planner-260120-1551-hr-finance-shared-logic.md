# Report: HR & Finance Shared Utilities Mapping

**Context**: Many modules in `core/hr` and `core/finance` follow a similar pattern for entity management, stats aggregation, and dashboard rendering.

## Shared Patterns Identified

### 1. Entity Management
Modules like `career_development.py` and `investor_relations.py` use:
- `uuid.uuid4().hex[:6].upper()` for ID generation.
- Dataclasses for models (`Skill`, `Training`, `Investor`, `Interaction`).
- Dictionaries for local storage (`self.career_paths`, `self.investors`).

### 2. Status/Level Enums
- Multiple files define their own Enums (`SkillLevel`, `CareerLevel`, `InvestorType`, `PipelineStage`).
- These often share validation logic or display icons.

### 3. Dashboard Rendering
- `format_dashboard()` methods use the same box-drawing characters (ASCII art).
- Shared logic for progress bars (`█` and `░`).
- Shared logic for "hot" list truncation and formatting.

## Proposed Extraction: `core/utils/vibe_ui.py`
Extract box-drawing and progress bar utilities into a central UI helper:
- `render_box_header(title, width)`
- `render_progress_bar(percentage, width)`
- `format_currency(value)` (shared between finance modules)

## Proposed Extraction: `core/utils/naming.py`
- `generate_short_id(prefix)`: Centralize the UUID hex logic.

## Proposed Extraction: `core/base/entity_manager.py`
- A base class for modules that manage a collection of entities, providing common `get_stats`, `add_entity`, and `log_interaction` patterns.

## Benefits
- **DRY**: Reduces the LOC in each specific module by ~50-100 lines.
- **Consistency**: All dashboards will look and behave the same.
- **Maintainability**: Changing the "VIBE" UI style only requires editing one file.
