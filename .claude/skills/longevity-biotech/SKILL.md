# Longevity Biotech & Anti-Aging

AI-powered drug discovery tools, clinical trial management, biomarker tracking, longevity clinic ops.

## When to Use
- Biomarker panel tracking and trend analysis
- AI-assisted molecular compound screening
- Clinical trial participant management and data collection
- Longevity protocol personalization engine
- Research literature synthesis and hypothesis generation

## Key Patterns
- **Data**: FHIR R4, HL7, CDISC/SDTM for clinical data
- **ML**: AlphaFold integration, molecular docking, QSAR models
- **Biomarkers**: blood panels, epigenetic clocks, telomere length, metabolomics
- **Regulatory**: FDA IND/NDA pipeline, IRB submissions

## Architecture
```
Patient Portal → Biomarker Tracker → Trend Analytics
      ↓                ↓                    ↓
Clinical Trial    Protocol Engine     Literature AI
Manager          (personalized)       (PubMed/bioRxiv)
      ↓
Regulatory Pipeline → FDA Submission Docs
```

## SDK
`@agencyos/vibe-longevity` — biomarker tracking, clinical trial management, protocol personalization hooks
