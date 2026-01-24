"""
BizPlan Generator Module

Generates comprehensive business plans using the Agentic Business Plan 2026 framework.
Reads SKILL files from .agencyos/Documents/ and generates markdown output.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field

# Optional AI imports
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


@dataclass
class SkillTemplate:
    """Represents a SKILL template loaded from JSON."""
    id: str
    title: str
    description: str
    type: str
    version: str
    processing_pipeline: List[Dict] = field(default_factory=list)
    output_spec: Dict = field(default_factory=dict)
    input_spec: Dict = field(default_factory=dict)
    constraints: Dict = field(default_factory=dict)

    @classmethod
    def from_json(cls, data: Dict) -> "SkillTemplate":
        """Create SkillTemplate from JSON data."""
        return cls(
            id=data.get("id", ""),
            title=data.get("title", ""),
            description=data.get("description", ""),
            type=data.get("type", "skill"),
            version=data.get("version", "1.0.0"),
            processing_pipeline=data.get("processing_pipeline", []),
            output_spec=data.get("output_spec", {}),
            input_spec=data.get("input_spec", {}),
            constraints=data.get("constraints", {})
        )


@dataclass
class MasterFramework:
    """Represents the MASTER framework structure."""
    title: str
    version: str
    purpose: Dict
    core_principles: Dict
    frame_2026: Dict
    glossary: List[Dict] = field(default_factory=list)

    @classmethod
    def from_json(cls, data: Dict) -> "MasterFramework":
        """Create MasterFramework from JSON data."""
        return cls(
            title=data.get("title", ""),
            version=data.get("version", "1.0.0"),
            purpose=data.get("purpose", {}),
            core_principles=data.get("core_principles", {}),
            frame_2026=data.get("frame_2026", {}),
            glossary=data.get("glossary", [])
        )


class BizPlanGenerator:
    """
    Generates business plans using the Agentic Business Plan 2026 framework.

    This class reads SKILL templates from .agencyos/Documents/ and uses them
    to generate comprehensive markdown business plans following the 9-section
    format defined in the MASTER framework.
    """

    def __init__(self, documents_path: Optional[str] = None):
        """
        Initialize the BizPlan Generator.

        Args:
            documents_path: Path to .agencyos/Documents/ directory.
                          Defaults to .agencyos/Documents/ in current directory.
        """
        if documents_path is None:
            documents_path = os.path.join(os.getcwd(), ".agencyos", "Documents")

        self.documents_path = Path(documents_path)
        self.master_framework: Optional[MasterFramework] = None
        self.skill_templates: Dict[str, SkillTemplate] = {}

        # Load all templates on initialization
        self._load_templates()

    def _load_templates(self) -> None:
        """Load MASTER framework and all SKILL templates from documents directory."""
        if not self.documents_path.exists():
            raise FileNotFoundError(f"Documents path not found: {self.documents_path}")

        # Load MASTER framework
        master_files = [
            "00_MASTER-Agentic-BizPlan-OS.json",
            "00_MASTER-Agentic-BizPlan-OS (1).json"
        ]

        for master_file in master_files:
            master_path = self.documents_path / master_file
            if master_path.exists():
                with open(master_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self.master_framework = MasterFramework.from_json(data)
                break

        if self.master_framework is None:
            raise FileNotFoundError("MASTER framework file not found")

        # Load all SKILL templates
        for json_file in self.documents_path.glob("*.json"):
            if "SKILL" in json_file.name:
                try:
                    with open(json_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        skill = SkillTemplate.from_json(data)
                        self.skill_templates[skill.id] = skill
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Warning: Failed to load {json_file.name}: {e}")

    def generate_bizplan(self, business_idea: str) -> str:
        """
        Generate a business plan from a business idea.

        Args:
            business_idea: Description of the business idea/concept.

        Returns:
            Markdown-formatted business plan following the 9-section structure.
        """
        if not self.master_framework:
            raise RuntimeError("MASTER framework not loaded")

        # Build the markdown output
        sections = []

        # Header
        sections.append(self._generate_header(business_idea))

        # Generate each of the 9 sections from the framework
        if "sections" in self.master_framework.frame_2026:
            for section in self.master_framework.frame_2026["sections"]:
                sections.append(self._generate_section(section, business_idea))

        # Footer with glossary
        sections.append(self._generate_glossary())

        return "\n\n".join(sections)

    def _generate_header(self, business_idea: str) -> str:
        """Generate the markdown header."""
        return f"""# {self.master_framework.title}

**Version:** {self.master_framework.version}

**Business Idea:** {business_idea}

---

## About This Framework

{self.master_framework.purpose.get('long', '')}

### Core Principles

#### Tri-Layer Approach
{self.master_framework.core_principles.get('tri_layer', {}).get('description', '')}

**The Three Layers:**
{self._format_layers()}

#### Stage Model
{self.master_framework.core_principles.get('stage_model', {}).get('description', '')}

**Stages:**
{self._format_stages()}

---
"""

    def _format_layers(self) -> str:
        """Format the tri-layer structure."""
        layers = self.master_framework.core_principles.get('tri_layer', {}).get('layers', [])
        output = []
        for layer in layers:
            output.append(f"- **{layer.get('label', '')}**: {layer.get('focus', '')}")
        return "\n".join(output)

    def _format_stages(self) -> str:
        """Format the stage model."""
        stages = self.master_framework.core_principles.get('stage_model', {}).get('stages', [])
        output = []
        for stage in stages:
            output.append(f"- **{stage.get('name', '')}**: {stage.get('typical_signals', [''])[0]}")
        return "\n".join(output)

    def _generate_section(self, section: Dict, business_idea: str) -> str:
        """
        Generate a single section of the business plan.

        Args:
            section: Section definition from the framework.
            business_idea: The business idea to contextualize the section.

        Returns:
            Markdown-formatted section.
        """
        section_id = section.get("id", "")
        title = section.get("title", "")
        tags = section.get("tags", [])
        content_spec = section.get("content_spec", {})

        output = [f"## {title}"]
        output.append(f"**Tags:** {', '.join(tags)}")
        output.append("")

        # Add content specifications for each layer
        for layer in ["business", "agentic", "governance"]:
            if layer in content_spec:
                layer_label = layer.capitalize()
                output.append(f"### [{layer_label}]")
                output.append("")

                for item in content_spec[layer]:
                    output.append(f"- {item}")

                output.append("")

        # Add placeholder for actual content
        output.append(f"**📝 TODO:** Fill in details for {title} based on: {business_idea[:100]}...")
        output.append("")

        return "\n".join(output)

    def _generate_glossary(self) -> str:
        """Generate the glossary section."""
        output = ["## Glossary", ""]

        for term in self.master_framework.glossary:
            term_name = term.get("term", "")
            definition = term.get("definition", "")
            output.append(f"**{term_name}**")
            output.append(f": {definition}")
            output.append("")

        return "\n".join(output)

    def list_available_skills(self) -> List[str]:
        """
        List all available SKILL templates.

        Returns:
            List of skill IDs.
        """
        return list(self.skill_templates.keys())

    def get_skill_info(self, skill_id: str) -> Optional[SkillTemplate]:
        """
        Get information about a specific SKILL template.

        Args:
            skill_id: ID of the skill template.

        Returns:
            SkillTemplate if found, None otherwise.
        """
        return self.skill_templates.get(skill_id)

    def generate_with_ai(
        self,
        business_idea: str,
        model: str = "gemini",
        api_key: Optional[str] = None
    ) -> str:
        """
        Generate a business plan using AI to fill in content based on SKILL templates.

        This method uses Google's Gemini API to intelligently generate business plan
        sections based on the business idea and SKILL template requirements.

        Args:
            business_idea: Description of the business idea/concept.
            model: AI model to use ('gemini' supported). Defaults to 'gemini'.
            api_key: Google API key. If None, reads from GOOGLE_API_KEY env var.

        Returns:
            Markdown-formatted business plan with AI-generated content.

        Raises:
            RuntimeError: If AI model is not available or API key is missing.
            ValueError: If unsupported model is specified.
        """
        if model != "gemini":
            raise ValueError(f"Unsupported model: {model}. Only 'gemini' is supported.")

        if not GEMINI_AVAILABLE:
            raise RuntimeError(
                "Google Generative AI library not available. "
                "Install with: pip install google-generativeai"
            )

        if not self.master_framework:
            raise RuntimeError("MASTER framework not loaded")

        # Get API key from parameter or environment
        if api_key is None:
            api_key = os.getenv("GOOGLE_API_KEY")

        if not api_key:
            raise RuntimeError(
                "Google API key not found. Set GOOGLE_API_KEY environment variable "
                "or pass api_key parameter."
            )

        # Configure Gemini
        genai.configure(api_key=api_key)
        gemini_model = genai.GenerativeModel("gemini-1.5-flash")

        # Build the markdown output
        sections = []

        # Header (static)
        sections.append(self._generate_header(business_idea))

        # Generate each section using AI
        if "sections" in self.master_framework.frame_2026:
            for section in self.master_framework.frame_2026["sections"]:
                sections.append(
                    self._generate_section_with_ai(
                        section,
                        business_idea,
                        gemini_model
                    )
                )

        # Footer with glossary (static)
        sections.append(self._generate_glossary())

        return "\n\n".join(sections)

    def _generate_section_with_ai(
        self,
        section: Dict,
        business_idea: str,
        model
    ) -> str:
        """
        Generate a single section using AI.

        Args:
            section: Section definition from the framework.
            business_idea: The business idea to contextualize the section.
            model: Configured Gemini model instance.

        Returns:
            Markdown-formatted section with AI-generated content.
        """
        section_id = section.get("id", "")
        title = section.get("title", "")
        tags = section.get("tags", [])
        content_spec = section.get("content_spec", {})

        output = [f"## {title}"]
        output.append(f"**Tags:** {', '.join(tags)}")
        output.append("")

        # Build AI prompt for this section
        prompt_parts = [
            f"Generate detailed business plan content for the '{title}' section.",
            f"Business Idea: {business_idea}",
            "",
            "Requirements by layer:",
        ]

        for layer in ["business", "agentic", "governance"]:
            if layer in content_spec:
                prompt_parts.append(f"\n[{layer.upper()} LAYER]:")
                for item in content_spec[layer]:
                    prompt_parts.append(f"- {item}")

        prompt_parts.extend([
            "",
            "Generate comprehensive, professional content that addresses all requirements.",
            "Use bullet points, subheadings, and clear structure.",
            "Be specific and actionable. Avoid generic advice.",
            "Output should be in markdown format, ready to insert into the plan."
        ])

        prompt = "\n".join(prompt_parts)

        # Generate content using AI
        try:
            response = model.generate_content(prompt)
            ai_content = response.text.strip()
        except Exception as e:
            ai_content = f"**⚠️ AI Generation Failed:** {str(e)}\n\n" \
                        f"**📝 TODO:** Manually fill in {title} section."

        # Add layer headers for structure
        for layer in ["business", "agentic", "governance"]:
            if layer in content_spec:
                layer_label = layer.capitalize()
                output.append(f"### [{layer_label}]")
                output.append("")

        # Add AI-generated content
        output.append(ai_content)
        output.append("")

        return "\n".join(output)
