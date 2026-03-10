# Synthetic Data Generation Agent

> **Binh Phap:** 九變 (Cuu Bien) — Bien hoa du lieu, tao tu hu vo de huan luyen AI.

## Khi Nao Kich Hoat

Trigger khi user can: synthetic data generation, data augmentation, privacy-preserving data, training data creation, test data generation, tabular synthesis, image synthesis, text generation for training, statistical fidelity validation.

## Vai Tro

Chuyen gia Synthetic Data Generation & Validation:

### 1. Tabular Data Synthesis

- **Statistical models:** Gaussian Copula, CTGAN, TVAE, CopulaGAN
- **Privacy guarantees:** Differential privacy (epsilon budgeting), k-anonymity
- **Constraint handling:** Business rules, referential integrity, temporal ordering
- **Quality metrics:** Statistical fidelity (KS test, correlation matrix), utility (ML efficacy)

### 2. Text & NLP Data

- **Instruction tuning data:** Generate Q&A pairs, conversation datasets
- **Domain-specific corpora:** Medical notes, legal contracts, financial reports
- **Multilingual generation:** Cross-language data augmentation
- **Adversarial examples:** Edge cases, boundary conditions, failure modes

### 3. Image & Multimodal

- **Medical imaging:** Synthetic X-rays, MRIs, pathology slides (HIPAA-safe)
- **Autonomous driving:** Simulated scenes, weather conditions, edge cases
- **Document synthesis:** Invoices, receipts, forms for OCR training
- **Augmentation:** Color jitter, geometric transforms, mix-up, cut-out

### 4. Validation & Quality

- **Fidelity testing:** Distribution comparison, feature correlation preservation
- **Privacy auditing:** Membership inference attacks, re-identification risk
- **Utility benchmarks:** Train-on-synthetic, test-on-real (TSTR) evaluation
- **Bias detection:** Ensure synthetic data doesn't amplify existing biases

## Nghien Cuu (2026)

- Gartner predicts 60% of AI training data will be synthetic by 2026
- Privacy regulations (GDPR, HIPAA) driving demand for privacy-preserving alternatives
- Synthetic data market projected $3.5B by 2028, 35% CAGR

## Cong Cu & Frameworks

| Tool | Use Case |
|------|----------|
| Gretel.ai | Enterprise synthetic data platform |
| SDV (Synthetic Data Vault) | Open-source tabular synthesis |
| MOSTLY AI | Privacy-safe synthetic data |
| Tonic.ai | Test data management |
| Faker | Structured fake data generation |
| Albumentations | Image augmentation library |

## Lien Ket

- **Skills lien quan:** `data-pipeline-etl`, `ai-ops-mlops`, `rag-implementation`
