---
name: pharma-biotech
description: Clinical trials CTMS, AI drug discovery, FHIR interoperability, pharmacovigilance, LIMS, regulatory submissions. Use for pharma platforms, biotech R&D, life sciences compliance.
license: MIT
version: 1.0.0
---

# Pharma & Biotech Technology Skill

Build clinical trial management, drug discovery pipelines, regulatory compliance systems, and life sciences platforms with healthcare interoperability.

## When to Use

- Clinical Trial Management Systems (CTMS/EDC)
- AI-driven drug discovery and molecule design
- FHIR-based healthcare data interoperability
- Pharmacovigilance and safety case processing
- Lab Information Management (LIMS)
- Regulatory submission automation (FDA, EMA)
- Supply chain serialization (DSCSA compliance)
- Telemedicine and patient engagement platforms
- Biobank and sample tracking
- Real-World Evidence (RWE) analytics

## Tool Selection

| Need | Choose |
|------|--------|
| CTMS/EDC (enterprise) | Medidata Rave (gold standard), Veeva Vault EDC |
| CTMS (modern) | Castor EDC (cloud-native), Oracle Siebel CTMS |
| AI drug discovery | Recursion OS, Insilico Medicine, Schrödinger |
| FHIR integration | HAPI FHIR (Java, open-source), Google Cloud Healthcare API |
| Pharmacovigilance | Veeva Vault Safety, Oracle Argus Safety |
| LIMS | LabWare, Benchling (biotech), Sapio Sciences |
| Regulatory submissions | Veeva Vault RIM, NNIT Regulatory |
| Serialization (DSCSA) | TraceLink, SAP ATTP, Antares Vision |
| Telemedicine | Twilio Video + Health API, Doxy.me |
| EHR integration | Epic (FHIR R4), Cerner/Oracle Health |

## Clinical Trial Architecture

```
Study Design & Protocol
    ↓
┌────────────────────────────────────────────┐
│  Clinical Trial Platform (CTMS + EDC)       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Protocol │  │ Site     │  │ Patient  │ │
│  │ Design   │  │ Mgmt     │  │ Enroll   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ EDC Data │  │ eTMF     │  │ Safety   │ │
│  │ Capture  │  │ Docs     │  │ (ICSR)   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────┬──────────────────────┘
                      ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ SDTM     │  │ Real-    │  │ FDA/EMA  │
│ Datasets │  │ World    │  │ Submis-  │
│          │  │ Evidence │  │ sion     │
└──────────┘  └──────────┘  └──────────┘
```

## FHIR Integration Pattern

```python
from fhirclient import client
from fhirclient.models.patient import Patient

# Connect to FHIR R4 server
settings = {
    "app_id": "pharma_app",
    "api_base": "https://fhir.hospital.org/r4"
}
smart = client.FHIRClient(settings=settings)

# Search patients by condition
search = Patient.where(struct={
    "identifier": "MRN|12345",
    "_include": "Patient:general-practitioner"
})
patients = search.perform_resources(smart.server)

# Create Observation (lab result)
from fhirclient.models.observation import Observation
obs = Observation({
    "status": "final",
    "code": {"coding": [{"system": "http://loinc.org", "code": "2093-3"}]},
    "valueQuantity": {"value": 5.2, "unit": "mmol/L"}
})
obs.create(smart.server)
```

## AI Drug Discovery Pipeline

```
1. Target Identification
   → Knowledge graphs (BenevolentAI) + omics data
2. Molecule Generation
   → Generative models (VAE, Transformer, Diffusion)
   → Graph Neural Networks for property prediction
3. Virtual Screening
   → Physics-ML hybrid (Schrödinger) + docking
4. Lead Optimization
   → SAR optimization + ADMET prediction
5. Preclinical Validation
   → Phenomics screening (Recursion OS)
6. Clinical Trial Design
   → AI-powered trial simulation (Medidata)
```

## Key Metrics

| Metric | Value | Context |
|--------|-------|---------|
| FDA Approval Rate | ~14.3% | From IND to approval |
| Phase 1→Approval | ~12% | Historical average |
| R&D Cost per Drug | $985M-$2B | Median estimate |
| FDA App Fee | $4.3M | With clinical data |
| CTMS Market | Growing | Veeva, Medidata, Oracle lead |
| LIMS Market | $2.7B (2026) | → $3.8B by 2029 |
| Pharmacovigilance | $8.91B (2025) | → $24.69B by 2035 |
| FHIR Adoption | 60% reduction | Integration time vs legacy HL7 |
| Telemedicine | $85.5B (2025) | → $180B by 2031 |

## Regulatory Standards

| Standard | Domain | Version |
|----------|--------|---------|
| ICH GCP (E6 R3) | Clinical trial conduct | 2026 update |
| SDTM | Study data tabulation | v2.0 |
| ADaM | Analysis datasets | v2.1 |
| HL7 FHIR | Healthcare interop | R4 (production), R6 (emerging) |
| DSCSA | Drug serialization | Final deadline Nov 2025 |
| 21 CFR Part 11 | Electronic records | FDA requirement |
| EU MDR/IVDR | Medical devices | Active |
| HIPAA | Patient data privacy | US requirement |

## References

- Medidata: https://www.medidata.com
- Veeva: https://www.veeva.com
- HAPI FHIR: https://hapifhir.io
- Recursion: https://www.recursion.com
- Insilico Medicine: https://insilico.com
- Schrödinger: https://www.schrodinger.com
- Benchling: https://www.benchling.com
- TraceLink: https://www.tracelink.com
- HL7 FHIR: https://www.hl7.org/fhir
