---
name: ai-drug-discovery-biotech
description: "AI-powered drug discovery — molecular simulation, protein folding, clinical trial optimization, biomarker discovery, ADMET prediction. Activate when building biotech research platforms, computational chemistry pipelines, or clinical data systems."
source: research-driven-2026
license: MIT
version: 1.0.0
---

# AI Drug Discovery & Biotech — Skill

> AI drug discovery market reaches $4B by 2027; AlphaFold 3 (2024) and Isomorphic Labs' first AI-designed clinical candidate mark a generational shift in computational biology.

## When to Activate
- Building molecular property prediction or virtual screening pipelines
- Integrating protein structure prediction (AlphaFold, ESMFold) into workflows
- Designing clinical trial patient matching or recruitment optimization systems
- Implementing ADMET (absorption, distribution, metabolism, excretion, toxicity) prediction
- Creating biomarker discovery dashboards from omics data
- Building de novo molecule generation interfaces
- Aggregating EHR/genomics data for drug target identification

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| Protein Structure | 3D structure prediction, binding pocket analysis | AlphaFold API, ESMFold, RoseTTAFold |
| Molecular Screening | Virtual screening, docking, ADMET prediction | Schrödinger Glide, AutoDock, DeepChem |
| Generative Chemistry | De novo molecule design, scaffold hopping, optimization | Insilico GENTRL, MolMIM, RDKit |
| Clinical Trial AI | Patient cohort matching, protocol optimization, dropout prediction | Veeva Vault, Medidata, TriNetX |
| Omics Analysis | Genomics/proteomics/transcriptomics data pipelines | NCBI APIs, Ensembl REST, BioPython |
| Lab Automation | Electronic lab notebook integration, assay data ingestion | Benchling API, Dotmatics |

## Architecture Patterns
```python
# ADMET prediction + molecular screening pipeline
from rdkit import Chem
from rdkit.Chem import Descriptors

async def screen_molecule_library(smiles_list: list[str], target_pdb: str) -> list[HitCompound]:
    hits = []
    for smiles in smiles_list:
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            continue

        # Compute Lipinski descriptors (drug-likeness filter)
        mw = Descriptors.MolWt(mol)
        logp = Descriptors.MolLogP(mol)
        hbd = Descriptors.NumHDonors(mol)
        hba = Descriptors.NumHAcceptors(mol)
        if not (mw <= 500 and logp <= 5 and hbd <= 5 and hba <= 10):
            continue  # Fails Lipinski Rule of Five

        # ADMET prediction via Schrödinger API
        admet = await schrodinger.predict_admet(smiles)
        if admet.hepatotoxicity_prob > 0.3:
            continue

        # Docking score against target protein
        dock_score = await schrodinger.dock(smiles, target_pdb)
        if dock_score < -7.0:  # kcal/mol threshold
            hits.append(HitCompound(smiles=smiles, dock_score=dock_score, admet=admet))

    return sorted(hits, key=lambda h: h.dock_score)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Schrödinger | Molecular simulation, docking, ADMET suite | Enterprise license |
| Atomwise | AI-based virtual screening service | Per-project |
| Recursion | Phenomics + ML drug discovery platform | Partner |
| Insilico Medicine | Generative chemistry, target ID, clinical design | SaaS + research |
| AlphaFold API (Google DeepMind) | Protein structure prediction | Free research / API |
| Benchling | ELN, molecular biology data management | Per-seat SaaS |

## Related Skills
- `wearable-health-iot` — Clinical trial wearable monitoring, patient adherence tracking
- `ai-ops-mlops` — Model training pipelines for molecular property prediction
- `regtech` — FDA 21 CFR Part 11 compliance, clinical data audit trails
