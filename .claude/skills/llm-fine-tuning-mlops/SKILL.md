---
name: llm-fine-tuning-mlops
description: "LLM fine-tuning (LoRA/QLoRA), RLHF, dataset curation, model evaluation, deployment — activate when customizing foundation models for domain-specific tasks, building PEFT pipelines, or operationalizing LLM training workflows"
source: research-driven-2026
license: MIT
version: 1.0.0
---

# LLM Fine-Tuning & MLOps — Skill

> Parameter-efficient fine-tuning (LoRA/QLoRA) democratized LLM customization in 2025; DPO replaced RLHF as the preferred alignment technique for most teams due to training stability.

## When to Activate
- Fine-tuning a foundation model (Llama, Mistral, Qwen) on domain data
- Implementing LoRA/QLoRA for memory-efficient training on consumer GPUs
- Building RLHF or DPO preference optimization pipelines
- Curating and validating training datasets for instruction tuning
- Setting up model evaluation harnesses (MMLU, task-specific benchmarks)
- Deploying fine-tuned models to inference endpoints (vLLM, TGI)
- Building continuous training pipelines with experiment tracking

## Core Capabilities
| Area | Description | Key APIs/Tools |
|------|-------------|----------------|
| PEFT Methods | LoRA, QLoRA, DoRA, IA3 — reduce trainable params 99%+ | HuggingFace PEFT, bitsandbytes |
| Preference Alignment | DPO, RLHF, PPO, ORPO for instruction following | TRL library, OpenRLHF |
| Dataset Curation | Deduplication, quality filtering, format conversion (ShareGPT, Alpaca) | Argilla, LabelStudio, Distilabel |
| Experiment Tracking | Hyperparameter logging, loss curves, checkpoint management | W&B, MLflow, Comet |
| Model Evaluation | Perplexity, task benchmarks, LLM-as-judge, human eval | EleutherAI lm-eval-harness, RAGAS |
| Inference Serving | Quantized model deployment, batching, streaming | vLLM, TGI, llama.cpp, Ollama |

## Architecture Patterns
```
[Base Model] (e.g., Llama-3.1-8B-Instruct)
      │ QLoRA: 4-bit quantize base, train adapters
      ▼
[Training] — LoRA rank=64, alpha=128, target: q_proj, v_proj
      │ gradient checkpointing + flash attention 2
      ▼
[Evaluation] → benchmark suite + held-out task eval
      │
      ▼
[Merge Adapters] → full-weight model OR keep LoRA separate
      │
      ▼
[vLLM / TGI serving] → OpenAI-compatible /v1/chat/completions
```

```python
from peft import LoraConfig, get_peft_model
from transformers import BitsAndBytesConfig

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.bfloat16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
)
lora_config = LoraConfig(
    r=64, lora_alpha=128,
    target_modules=["q_proj", "v_proj", "k_proj", "o_proj"],
    lora_dropout=0.05, bias="none", task_type="CAUSAL_LM",
)
model = get_peft_model(base_model, lora_config)
```

## Key Providers & APIs
| Provider | Use Case | Pricing Model |
|----------|----------|---------------|
| Hugging Face | Model hub, AutoTrain, Inference Endpoints | Free hub; endpoints from $0.06/hr |
| Anyscale | Managed fine-tuning + serving on Ray cluster | Usage-based GPU compute |
| Modal | Serverless GPU training jobs, fast cold start | $0.00306/GPU-sec (A100) |
| Together AI | Fine-tuning API, fast open-model inference | Per-token training + inference |
| Fireworks AI | Low-latency fine-tuned model serving | Per-token inference pricing |

## Related Skills
- `vector-database-engineering` — RAG pipelines with fine-tuned embedding models
- `ai-safety-alignment-governance` — Alignment and bias evaluation post-training
- `backend-development` — Serving fine-tuned models via FastAPI/vLLM
