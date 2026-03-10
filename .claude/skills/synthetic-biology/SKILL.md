# Synthetic Biology — Skill

> Build biotech software platforms: DNA design tools, lab automation (LIMS), bioprocess optimization, bioinformatics pipelines, and regulatory submission automation.

## When to Activate
- Designing or integrating Laboratory Information Management Systems (LIMS)
- Building DNA/RNA sequence design, annotation, or assembly tools
- Automating bioprocess monitoring, fermentation control, or upstream/downstream workflows
- Generating or validating regulatory submission packages (FDA IND, EMA IMPD, EPA TSCA)

## Core Capabilities
| Area | Description |
|------|-------------|
| Sequence Design | In-silico DNA/protein design, codon optimization, part registry integration |
| LIMS Integration | Sample tracking, protocol execution, instrument data ingestion |
| Bioprocess Optimization | Real-time fermentation parameter control, fed-batch scheduling |
| Bioinformatics Pipeline | NGS QC → alignment → variant calling → annotation workflows |
| Regulatory Automation | Structured data capture mapped to CTD/eCTD submission modules |
| Lab Automation | Liquid handler scripting (Hamilton, Tecan), plate reader data parsing |

## Architecture Patterns
- **ELN + LIMS Separation**: Electronic Lab Notebook captures unstructured observations; LIMS owns structured sample/assay records — keep APIs clean between them
- **Instrument Adapter Layer**: each instrument (plate reader, sequencer, bioreactor) exposes data via a normalized adapter (JSON output) — isolates hardware churn from core pipeline
- **Pipeline-as-Code**: define bioinformatics workflows in Snakemake or Nextflow — version-controlled, reproducible, HPC/cloud portable
- **Event-Sourced Batch Records**: append-only event log for every batch operation — satisfies 21 CFR Part 11 audit trail requirement without retrofitting
- **Ontology-Driven Metadata**: annotate all biological entities with standard ontologies (GO, ChEBI, OBI, SBO) — enables cross-study querying and regulatory acceptance

## Key Technologies
- Sequence: BioPython, Benchling API, SBOL3, Snapgene SDK, NCBI Entrez API
- Bioinformatics: Snakemake / Nextflow, BWA, GATK, MultiQC, FastQC, DESeq2 (R)
- LIMS/ELN: Benchling, Labguru, or custom FastAPI + PostgreSQL stack
- Bioprocess: SCADA integration (OPC-UA), InfluxDB for time-series sensor data, Grafana dashboards
- Regulatory: CDISC ODM-XML, HL7 SPL, FDA ESG submission APIs, eCTD packaging tools
- Lab Automation: PyHamilton, Tecan FluentControl scripting, Opentrons Python API

## Implementation Checklist
- [ ] Model core domain entities: sample, experiment, protocol, instrument, result, batch
- [ ] Implement 21 CFR Part 11 audit trail: immutable event log, e-signature capture, access controls
- [ ] Build instrument adapter for each hardware type in scope; normalize output to common schema
- [ ] Define bioinformatics pipeline DAG in Snakemake/Nextflow with container (Docker) per step
- [ ] Integrate sequence part registry (Benchling or iGEM) for standardized biological parts
- [ ] Add bioprocess real-time dashboard: pH, DO, temperature, OD600 with alert thresholds
- [ ] Map experimental metadata to relevant regulatory submission module (CTD Module 3 / TSCA PMN)
- [ ] Validate data integrity with checksums on all raw instrument files at ingest

## Best Practices
- Always preserve raw instrument output files unchanged — store processed derivatives separately
- Use controlled vocabularies (ontologies) for all biological entity annotations from day one — retrofitting is painful
- Design protocols as versioned, executable templates — scientists should run, not rewrite, protocols
- Separate data capture (ELN) from QC/release decisions (LIMS) — blending them causes GMP compliance risk
- Automate unit conversion and normalization at ingest — concentration units vary wildly across instruments

## Anti-Patterns
- Storing experiment data in spreadsheets passed by email — no audit trail, no searchability, regulatory nightmare
- Building sequence tools without SBOL3 export — interoperability with Benchling, iGEM, and design tools breaks
- Hardcoding regulatory mapping rules in code — regulations update; externalize them to a versioned rule config
- Running bioinformatics pipelines without container pinning — software version drift invalidates reproducibility claims
- Skipping instrument validation (IQ/OQ/PQ) documentation generation — required for GMP environments
