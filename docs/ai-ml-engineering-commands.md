# AI/ML Engineering Commands - Mekong CLI

> **Bộ công cụ AI/ML Engineering** - 12 commands toàn diện cho MLOps workflow.

---

## 📋 Tổng Quan

Bộ AI/ML Engineering commands cung cấp đầy đủ workflow cho việc phát triển, training, evaluation, deployment và vận hành ML models trong production.

| Command | Description | Tech Stack |
|---------|-------------|------------|
| `/model-train` | Train ML model với tracking | PyTorch, MLflow, W&B |
| `/model-evaluate` | Evaluate model performance | Scikit-learn, SHAP |
| `/model-deploy` | Deploy model to serving | FastAPI, Triton, K8s |
| `/model-registry` | Manage model versions | MLflow, S3/GCS |
| `/data-prep` | Prepare training datasets | Pandas, Polars, Parquet |
| `/hyperparam-tune` | Hyperparameter optimization | Optuna, Ray Tune |
| `/inference-api` | Setup inference endpoint | FastAPI, gRPC, vLLM |
| `/ml-pipeline` | Build ML workflow pipeline | Prefect, Airflow |
| `/feature-store` | Feature engineering & serving | Feast, Redis, BigQuery |
| `/model-monitor` | Production monitoring & drift | Evidently, Prometheus |
| `/data-validation` | Data quality checks | Great Expectations |
| `/experiment-tracking` | Experiment management | MLflow, W&B |

---

## 🎯 Quick Start

### Training Pipeline Cơ Bản

```bash
# 1. Prepare data
mekong data-prep raw/train.csv data/train --format parquet

# 2. Train model
mekong model-train resnet50 cifar10 --config configs/resnet50.yaml

# 3. Evaluate
mekong model-evaluate models/best.pth test --all-metrics

# 4. Register
mekong model-registry register resnet50 models/best.pth

# 5. Deploy
mekong model-deploy models/best.pth cloud-run --project gcp
```

---

## 📚 Command Reference

### 1. `/model-train` - Train ML Model

**Purpose:** Training model với tracking đầy đủ.

**Usage:**
```bash
mekong model-train <model_name> <dataset> [options]
```

**Options:**
- `--config` - Custom config file (YAML)
- `--resume` - Resume from checkpoint
- `--gpus` - Number of GPUs (default: 1)
- `--strategy` - Distributed strategy (ddp, deepspeed)
- `--dry-run` - Validate config without training

**Examples:**
```bash
# Train với config default
mekong model-train resnet50 cifar10

# Train với custom config
mekong model-train vit imagenet --config configs/vit.yaml

# Resume training từ checkpoint
mekong model-train bert squad --resume checkpoints/last.ckpt

# Distributed training trên 4 GPUs
mekong model-train llm custom --gpus 4 --strategy ddp

# Dry run để test config
mekong model-train test dummy --dry-run
```

**Output Artifacts:**
```
models/
├── checkpoints/
│   ├── epoch_050.pth
│   ├── epoch_100.pth
│   └── best.pth
├── mlruns/           # MLflow tracking
└── wandb/            # W&B logs
```

**Quality Gates:**
- [ ] Training loss decreases
- [ ] Validation accuracy improves
- [ ] No NaN/Inf in weights
- [ ] Checkpoint saved successfully
- [ ] Metrics logged to MLflow

**Reference:** [`../.claude/commands/model-train.md`](../.claude/commands/model-train.md)

---

### 2. `/model-evaluate` - Evaluate Model Performance

**Purpose:** Evaluate model với metrics toàn diện.

**Usage:**
```bash
mekong model-evaluate <model_path> <dataset> [options]
```

**Options:**
- `--all-metrics` - Compute all available metrics
- `--confusion` - Generate confusion matrix
- `--shap` - Compute SHAP values (feature importance)
- `--export` - Export report to file (JSON)

**Examples:**
```bash
# Evaluate với accuracy
mekong model-evaluate models/best.pth val_set

# Full metrics report
mekong model-evaluate models/best.pth test --all-metrics

# Generate confusion matrix
mekong model-evaluate models/best.pth test --confusion

# Feature importance với SHAP
mekong model-evaluate models/best.pth test --shap

# Compare 2 models
mekong model-evaluate compare model1.pth model2.pth

# Export report to JSON
mekong model-evaluate models/best.pth test --export report.json
```

**Output Report:**
```json
{
  "model": "resnet50",
  "dataset": "test",
  "metrics": {
    "accuracy": 0.923,
    "precision": 0.918,
    "recall": 0.901,
    "f1": 0.909,
    "roc_auc": 0.956
  },
  "per_class": {
    "class_0": {"precision": 0.92, "recall": 0.89},
    "class_1": {"precision": 0.91, "recall": 0.92}
  },
  "confusion_matrix": [[890, 23], [45, 892]],
  "timestamp": "2026-03-04T10:30:00Z"
}
```

**Metrics Categories:**
- **Classification:** Accuracy, Precision, Recall, F1, ROC-AUC
- **Regression:** MAE, MSE, RMSE, R²
- **Ranking:** NDCG, MAP, Hit Rate, MRR

**Reference:** [`../.claude/commands/model-evaluate.md`](../.claude/commands/model-evaluate.md)

---

### 3. `/model-deploy` - Deploy Model to Serving

**Purpose:** Deploy model to production serving endpoints.

**Usage:**
```bash
mekong model-deploy <model_path> <platform> [options]
```

**Platforms:**
- `local` - Local development server
- `cloud-run` - Google Cloud Run
- `triton` - NVIDIA Triton Inference Server
- `k8s` - Kubernetes deployment

**Options:**
- `--gpu` - Enable GPU acceleration
- `--replicas` - Number of replicas (default: 1)
- `--canary` - Canary rollout percentage
- `--ab-test` - A/B test with traffic split

**Examples:**
```bash
# Local dev server
mekong model-deploy models/best.pth local

# Deploy to Cloud Run
mekong model-deploy models/best.pth cloud-run --project gcp

# Deploy với Triton (GPU)
mekong model-deploy models/best.pth triton --gpu

# A/B test deployment
mekong model-deploy models/v1.pth v2.pth --ab-test 90/10

# Canary rollout 10%
mekong model-deploy models/new.pth --canary 10%

# Health check
mekong model-deploy status endpoint-name
```

**Deployment Workflow:**
1. Validate model format + dependencies
2. Build Docker container
3. Configure serving (batch size, timeout, scaling)
4. Deploy to platform
5. Health check
6. Smoke test

**API Contract:**
```python
# Request
POST /v1/predict
{
  "instances": [
    {"data": [0.1, 0.2, 0.3, ...]},
    {"data": [0.4, 0.5, 0.6, ...]}
  ]
}

# Response
{
  "predictions": [
    {"label": "class_1", "score": 0.95},
    {"label": "class_0", "score": 0.87}
  ],
  "latency_ms": 45,
  "model_version": "v1.2.3"
}
```

**Quality Gates:**
- [ ] Container builds successfully
- [ ] Health check passes
- [ ] Latency < 100ms (p95)
- [ ] Throughput meets target
- [ ] Auto-scaling configured
- [ ] Monitoring enabled

**Reference:** [`../.claude/commands/model-deploy.md`](../.claude/commands/model-deploy.md)

---

### 4. `/model-registry` - Manage Model Versions

**Purpose:** Quản lý model versions và lifecycle.

**Usage:**
```bash
mekong model-registry <operation> [model_name] [version] [options]
```

**Operations:**
- `list` - List all models
- `register` - Register new model
- `get` - Get version details
- `compare` - Compare versions
- `promote` - Promote to stage
- `archive` - Archive version
- `delete` - Delete version

**Examples:**
```bash
# List all models
mekong model-registry list

# Register new model
mekong model-registry register resnet50 models/best.pth

# Get version details
mekong model-registry get resnet50 v1.2.0

# Compare versions
mekong model-registry compare resnet50 v1.0 v2.0

# Promote to production
mekong model-registry promote resnet50 v1.2.0 production

# Archive deprecated version
mekong model-registry archive resnet50 v0.9.0

# Delete version
mekong model-registry delete resnet50 v0.5.0 --force
```

**Model Stages:**
```
development → staging → production
     ↓           ↓           ↓
    WIP      Testing      Live
     ↓
  archived (deprecated)
```

**Version Metadata:**
```yaml
model: resnet50
version: v1.2.3
stage: production

# Training provenance
trained_at: 2026-03-01T10:30:00Z
dataset: imagenet-v4
commit: abc123f

# Performance
metrics:
  accuracy: 0.923
  val_loss: 0.234

# Artifacts
files:
  - model.pth (256MB)
  - config.yaml
  - preprocessor.pkl
```

**Storage Structure:**
```
models/
├── registry.json           # Registry index
├── resnet50/
│   ├── v1.0.0/
│   │   ├── model.pth
│   │   ├── config.yaml
│   │   └── metadata.json
│   ├── v1.1.0/
│   └── v1.2.0/
└── vit/
    └── v2.0.0/
```

**Quality Gates:**
- [ ] Version follows semver
- [ ] Metrics recorded
- [ ] Artifacts checksummed
- [ ] Model card included
- [ ] Dependencies documented

**Reference:** [`../.claude/commands/model-registry.md`](../.claude/commands/model-registry.md)

---

### 5. `/data-prep` - Prepare Training Datasets

**Purpose:** ETL pipeline cho data preparation.

**Usage:**
```bash
mekong data-prep <source> <output> [transforms] [options]
```

**Options:**
- `--type` - Data type (tabular/image/text/audio)
- `--format` - Output format (parquet/tfrecord/webdataset)
- `--split` - Train/val/test ratios (e.g., 80/10/10)
- `--validate` - Run validation checks
- `--upload` - Upload to cloud storage

**Examples:**
```bash
# ETL từ CSV to Parquet
mekong data-prep raw/train.csv data/train --format parquet

# Image dataset preparation
mekong data-prep images/ data/images --type image --resize 224

# Text dataset với tokenizer
mekong data-prep corpus/ data/text --type text --tokenizer bert

# Split dataset 80/10/10
mekong data-prep data/full --split 80/10/10

# Validate data quality
mekong data-prep data/train --validate

# Upload to GCS
mekong data-prep data/train --upload gs://bucket/datasets/
```

**Transform Pipelines:**

**Tabular Data:**
```python
transforms = [
    "drop_duplicates",
    "handle_missing:mean",
    "encode_categorical:onehot",
    "scale_features:standard",
    "balance_classes:smote",
]
```

**Image Data:**
```python
transforms = [
    "resize:224x224",
    "normalize:imagenet_stats",
    "augment:random_flip",
    "augment:color_jitter",
    "augment:random_rotation",
]
```

**Text Data:**
```python
transforms = [
    "clean:text",
    "normalize:unicode",
    "tokenize:bert",
    "pad:max_len_512",
    "create_attention_mask",
]
```

**Output Formats:**
- **Parquet** - Tabular data (Snappy compression)
- **TFRecord** - TensorFlow format
- **WebDataset** - PyTorch TAR archives

**Dataset Statistics:**
```json
{
  "name": "imagenet-clean",
  "created_at": "2026-03-04",
  "splits": {
    "train": {"samples": 1280000, "size_gb": 142},
    "val": {"samples": 50000, "size_gb": 5.5},
    "test": {"samples": 50000, "size_gb": 5.5}
  },
  "classes": 1000,
  "format": "webdataset",
  "checksum": "sha256:abc123..."
}
```

**Quality Gates:**
- [ ] No missing values (or handled)
- [ ] Class distribution balanced
- [ ] No data leakage between splits
- [ ] Schema validated
- [ ] Checksum computed
- [ ] Documentation updated

**Reference:** [`../.claude/commands/data-prep.md`](../.claude/commands/data-prep.md)

---

### 6. `/hyperparam-tune` - Hyperparameter Optimization

**Purpose:** Hyperparameter tuning với nhiều strategies.

**Usage:**
```bash
mekong hyperparam-tune <model> <dataset> [search_space] [options]
```

**Options:**
- `--strategy` - grid/bayesian/random/asha
- `--trials` - Number of trials (default: 20)
- `--budget` - Total training budget (for ASHA)
- `--pruner` - Early stopping pruner type
- `--parallel` - Number of parallel trials

**Examples:**
```bash
# Grid search (exhaustive)
mekong hyperparam-tune resnet50 cifar10 --strategy grid

# Bayesian optimization (smart)
mekong hyperparam-tune vit imagenet --strategy bayesian --trials 50

# Random search
mekong hyperparam-tune bert squad --strategy random --trials 20

# Multi-fidelity ASHA
mekong hyperparam-tune llm custom --strategy asha --budget 100

# Resume tuning
mekong hyperparam-tune resume study_id_123

# Get best trials
mekong hyperparam-tune best study_id_123 --top-k 5
```

**Search Strategies:**

**Grid Search:**
```yaml
search_space:
  learning_rate: [0.001, 0.01, 0.1]
  batch_size: [16, 32, 64]
  weight_decay: [0.0001, 0.001, 0.01]
# Total: 3 × 3 × 3 = 27 trials
```

**Bayesian Optimization:**
```yaml
search_space:
  learning_rate:
    type: log_uniform
    low: 1e-5
    high: 1e-1
  batch_size:
    type: categorical
    choices: [16, 32, 64, 128]
  num_layers:
    type: int_uniform
    low: 4
    high: 24
```

**ASHA (Multi-fidelity):**
```yaml
strategy: asha
max_epochs: 100
reduction_factor: 3
min_epochs: 3
```

**Results Dashboard:**
```
Study: resnet50-cifar10-tuning
Trials: 50 complete | 3 pruned
Best value: 0.9234 (trial #37)

Top 5 Trials:
┌───────┬────────────┬──────────┬────────────┐
│ Trial │ Validation │ LR       │ Batch Size │
├───────┼────────────┼──────────┼────────────┤
│ 37    │ 0.9234     │ 0.0032   │ 64         │
│ 42    │ 0.9221     │ 0.0028   │ 64         │
│ 29    │ 0.9198     │ 0.0041   │ 32         │
│ 15    │ 0.9187     │ 0.0035   │ 128        │
│ 48    │ 0.9175     │ 0.0029   │ 64         │
└───────┴────────────┴──────────┴────────────┘
```

**Output Artifacts:**
```
tuning/
├── study_123/
│   ├── study.pkl          # Optuna study object
│   ├── trials.json        # All trial results
│   ├── best_params.yaml   # Best configuration
│   └── plots/
│       ├── optimization.png
│       ├── parallel_coord.png
│       └── contour.png
```

**Quality Gates:**
- [ ] Search space covers reasonable ranges
- [ ] Enough trials for convergence
- [ ] Early stopping configured
- [ ] Results reproducible (seed)
- [ ] Best params validated

**Reference:** [`../.claude/commands/hyperparam-tune.md`](../.claude/commands/hyperparam-tune.md)

---

### 7. `/inference-api` - Setup Inference Endpoint

**Purpose:** Setup inference API với tối ưu latency.

**Usage:**
```bash
mekong inference-api <model_path> <mode> [config] [options]
```

**Modes:**
- `rest` - REST API (FastAPI)
- `grpc` - gRPC service
- `stream` - Streaming for LLMs
- `batch` - Batch inference
- `export-onnx` - Export to ONNX
- `tensorrt` - TensorRT optimization

**Options:**
- `--port` - Server port
- `--backend` - Inference backend (pytorch/vllm/tensorrt/onnx)
- `--precision` - Model precision (fp32/fp16/int8)
- `--batch-size` - Max batch size
- `--streaming` - Enable streaming for LLMs

**Examples:**
```bash
# REST API dev server
mekong inference-api models/best.pth rest --port 8000

# gRPC service
mekong inference-api models/best.pth grpc --port 50051

# Streaming LLM với vLLM
mekong inference-api models/llm.pth stream --backend vllm

# Batch inference
mekong inference-api models/batch.pth batch --size 32

# Export to ONNX
mekong inference-api models/best.pth export-onnx --opset 17

# TensorRT optimization (FP16)
mekong inference-api models/best.pth tensorrt --precision fp16
```

**REST API Endpoints:**
```python
# POST /v1/predict - Single prediction
@app.post("/v1/predict")
async def predict(request: PredictionRequest):
    result = await model.predict(request.instances)
    return PredictionResponse(predictions=result)

# POST /v1/predict/batch - Batch prediction
@app.post("/v1/predict/batch")
async def predict_batch(request: BatchRequest):
    result = await model.batch_predict(request.instances)
    return BatchResponse(predictions=result)

# GET /health - Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "model": model.version}

# GET /metrics - Performance metrics
@app.get("/metrics")
async def metrics():
    return {
        "requests_total": counter,
        "latency_p50": p50,
        "latency_p99": p99,
    }
```

**Optimization Strategies:**

**ONNX Export:**
```python
torch.onnx.export(
    model,
    dummy_input,
    "model.onnx",
    opset_version=17,
    dynamic_axes={
        "input": {0: "batch_size"},
        "output": {0: "batch_size"}
    }
)
```

**TensorRT Optimization:**
```python
config.set_flag(trt.BuilderFlag.FP16)
config.set_memory_pool_limit(trt.MemoryPoolType.WORKSPACE, 1<<30)
engine = builder.build_serialized_network(network, config)
```

**vLLM (LLM Serving):**
```python
llm = LLM(
    model="models/llm.pth",
    tensor_parallel_size=1,
    gpu_memory_utilization=0.9,
    max_num_batched_tokens=4096,
)
```

**Performance Benchmarks:**
```
Model: resnet50 | Backend: pytorch | Precision: fp32
┌─────────────┬───────────┬────────────┬──────────┐
│ Batch Size  │ Latency   │ Throughput │ GPU Mem  │
├─────────────┼───────────┼────────────┼──────────┤
│ 1           │ 15ms      │ 67 img/s   │ 2.1 GB   │
│ 32          │ 142ms     │ 225 img/s  │ 5.2 GB   │
└─────────────┴───────────┴────────────┴──────────┘

Optimized (TensorRT FP16):
┌─────────────┬───────────┬────────────┬──────────┐
│ 1           │ 8ms       │ 125 img/s  │ 1.8 GB   │
│ 32          │ 85ms      │ 376 img/s  │ 3.1 GB   │
└─────────────┴───────────┴────────────┴──────────┘
```

**Quality Gates:**
- [ ] p99 latency < 100ms
- [ ] Throughput meets target
- [ ] Memory within limits
- [ ] Error handling complete
- [ ] Metrics exposed
- [ ] CORS configured

**Reference:** [`../.claude/commands/inference-api.md`](../.claude/commands/inference-api.md)

---

### 8. `/ml-pipeline` - Build ML Pipeline

**Purpose:** Pipeline orchestration cho ML workflows.

**Usage:**
```bash
mekong ml-pipeline <operation> [pipeline_name] [options]
```

**Options:**
- `--steps` - Comma-separated step names
- `--cron` - Cron expression for scheduling
- `--config` - Pipeline config file
- `--backfill` - Historical backfill date range
- `--dry-run` - Validate pipeline without execution

**Examples:**
```bash
# Create pipeline với steps
mekong ml-pipeline train-pipeline --steps data,train,eval

# Run pipeline
mekong ml-pipeline run train-pipeline

# Schedule với cron
mekong ml-pipeline schedule train-pipeline --cron "0 2 * * *"

# View DAG visualization
mekong ml-pipeline visualize train-pipeline

# Backfill historical data
mekong ml-pipeline backfill train-pipeline --start 2026-01-01

# Compare runs
mekong ml-pipeline compare train-pipeline run1 run2
```

**Pipeline DAG Example:**
```yaml
# pipelines/train-pipeline.yaml
name: train-pipeline
description: End-to-end ML training pipeline

steps:
  - name: validate_data
    task: data.validate
    depends_on: []
    retry: 2

  - name: preprocess
    task: data.preprocess
    depends_on: [validate_data]
    resources:
      memory: 4Gi

  - name: split_data
    task: data.split
    depends_on: [preprocess]

  - name: train_model
    task: model.train
    depends_on: [split_data]
    resources:
      gpu: true
      memory: 8Gi

  - name: evaluate
    task: model.evaluate
    depends_on: [train_model]

  - name: register
    task: model.register
    depends_on: [evaluate]
    condition: "metrics.accuracy > 0.90"
```

**DAG Visualization:**
```
┌─────────────────────────────────────────────────────────┐
│  train-pipeline DAG                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌──────────────┐                                     │
│   │ validate_data│                                     │
│   └──────┬───────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌──────────────┐                                     │
│   │  preprocess  │                                     │
│   └──────┬───────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌──────────────┐                                     │
│   │  split_data  │                                     │
│   └──────┬───────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌──────────────┐                                     │
│   │  train_model │                                     │
│   └──────┬───────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌──────────────┐                                     │
│   │   evaluate   │                                     │
│   └──────┬───────┘                                     │
│          │                                              │
│          ▼                                              │
│   ┌──────────────┐                                     │
│   │   register   │                                     │
│   └──────────────┘                                     │
└─────────────────────────────────────────────────────────┘
```

**Scheduling Options:**

**Cron Schedule:**
```yaml
schedule:
  type: cron
  expression: "0 2 * * *"  # Daily at 2 AM
  timezone: UTC
```

**Event Trigger:**
```yaml
schedule:
  type: event
  trigger: new_data_arrived
  source: gcs://bucket/training-data/
```

**Manual Only:**
```yaml
schedule:
  type: manual  # Run on-demand only
```

**Run History:**
```
Pipeline: train-pipeline
┌─────────┬────────────┬─────────┬───────────┬──────────────┐
│ Run ID  │ Started    │ Status  │ Duration  │ Accuracy     │
├─────────┼────────────┼─────────┼───────────┼──────────────┤
│ run_045 │ 03-04 02:00│ Success │ 45m 23s   │ 0.9234       │
│ run_044 │ 03-03 02:00│ Success │ 44m 12s   │ 0.9221       │
│ run_043 │ 03-02 02:00│ Failed  │ 12m 45s   │ -            │
│ run_042 │ 03-01 02:00│ Success │ 46m 01s   │ 0.9198       │
└─────────┴────────────┴─────────┴───────────┴──────────────┘
```

**Quality Gates:**
- [ ] DAG is acyclic
- [ ] All dependencies resolved
- [ ] Resources within limits
- [ ] Error handling configured
- [ ] Artifacts tracked
- [ ] Notifications working

**Reference:** [`../.claude/commands/ml-pipeline.md`](../.claude/commands/ml-pipeline.md)

---

## 🔗 MLOps Workflow End-to-End

### Full Pipeline Example

```bash
# Step 1: Data Preparation
mekong data-prep raw/images/ data/images \
  --type image \
  --resize 224 \
  --split 80/10/10 \
  --validate

# Step 2: Hyperparameter Tuning
mekong hyperparam-tune resnet50 data/images \
  --strategy bayesian \
  --trials 30 \
  --parallel 4

# Step 3: Train Final Model
mekong model-train resnet50 data/images \
  --config configs/best_params.yaml \
  --gpus 2 \
  --mlflow-uri http://localhost:5000

# Step 4: Evaluate
mekong model-evaluate models/best.pth test \
  --all-metrics \
  --confusion \
  --export reports/evaluation.json

# Step 5: Register Model
mekong model-registry register resnet50 models/best.pth \
  --metadata '{"accuracy": 0.923, "dataset": "images-v2"}'

# Step 6: Create Inference API
mekong inference-api models/best.pth rest \
  --port 8000 \
  --backend pytorch \
  --batch-size 32

# Step 7: Deploy to Production
mekong model-deploy models/best.pth cloud-run \
  --project my-gcp-project \
  --replicas 3 \
  --gpu

# Step 8: Create Pipeline for Retraining
mekong ml-pipeline create retrain-pipeline \
  --steps data,train,eval,register \
  --cron "0 2 * * 0"  # Weekly on Sunday
```

---

## 📊 Tech Stack Summary

| Category | Technologies |
|----------|-------------|
| **Training** | PyTorch, Lightning, DeepSpeed |
| **Tracking** | MLflow, Weights & Biases |
| **Data** | Pandas, Polars, Apache Beam |
| **Storage** | Parquet, TFRecord, WebDataset |
| **Serving** | FastAPI, gRPC, TorchServe, Triton |
| **Optimization** | ONNX, TensorRT, vLLM |
| **Orchestration** | Prefect, Airflow, Kedro |
| **HPO** | Optuna, Ray Tune, ASHA |
| **Deployment** | Docker, Kubernetes, Cloud Run |
| **Registry** | MLflow Model Registry, S3/GCS |

---

## 🚀 Best Practices

### 1. Experiment Tracking
- Log tất cả experiments với MLflow/W&B
- Track hyperparameters, metrics, artifacts
- Version control cho datasets và models

### 2. Model Versioning
- Semantic versioning (v1.2.3)
- Stage promotion (dev → staging → production)
- Checksum verification

### 3. Quality Gates
- Tự động hóa quality checks
- Fail fast nếu không đạt criteria
- Rollback tự động khi production issues

### 4. Monitoring
- Track latency, throughput, error rates
- Model drift detection
- Auto-retraining triggers

### 5. Security
- No secrets in code
- Input validation
- CORS và authentication

---

## 📁 File Structure

```
apps/analytics/
├── configs/
│   ├── default.yaml
│   ├── resnet50.yaml
│   └── vit.yaml
├── data/
│   ├── raw/
│   ├── processed/
│   └── splits/
├── models/
│   ├── checkpoints/
│   ├── registry.json
│   └── <model_name>/
│       └── v1.0.0/
├── pipelines/
│   ├── train-pipeline.yaml
│   └── retrain-pipeline.yaml
├── reports/
│   ├── evaluation.json
│   └── tuning/
└── src/
    ├── data/
    ├── models/
    ├── training/
    └── inference/
```

---

## 🔧 Advanced Commands (Batch 1)

### 9. `/feature-store` - Feature Store Management

**Use Case:** Quản lý features cho ML - offline storage, online serving, lineage tracking.

```bash
# Tạo feature group
mekong feature-store create user-features --source bigquery

# Register feature
mekong feature-store register user-features features/user_age.py

# Ingest features
mekong feature-store ingest user-features --source raw_data

# Get training data
mekong feature-store get-training-data user-features --output train.parquet

# Serve online (Redis)
mekong feature-store serve user-features --backend redis

# Get features for entities
mekong feature-store get user-features --entities user_123,user_456

# Monitor feature quality
mekong feature-store monitor user-features --threshold 0.95
```

**Tech Stack:** Feast, Redis, BigQuery, Snowflake

---

### 10. `/model-monitor` - Production Model Monitoring

**Use Case:** Giám sát model production - drift detection, performance tracking, alerts.

```bash
# Setup monitoring
mekong model-monitor churn-model setup --metrics accuracy,drift

# Check data drift
mekong model-monitor churn-model drift --reference baseline.parquet

# Check predictions (24h window)
mekong model-monitor churn-model predictions --window 24h

# Generate report
mekong model-monitor churn-model report --output report.pdf

# Setup alerts
mekong model-monitor churn-model alert --metric accuracy --threshold 0.85

# Start dashboard
mekong model-monitor churn-model dashboard --port 8080
```

**Tech Stack:** Evidently AI, Prometheus, Grafana, WhyLabs

---

### 11. `/data-validation` - Data Quality Validation

**Use Case:** Validate data quality với Great Expectations - schema validation, data tests.

```bash
# Init Great Expectations
mekong data-validation init --datasource bigquery

# Create expectations
mekong data-validation create-expectations train.parquet

# Validate dataset
mekong data-validation validate train.parquet --suite default

# Build data docs
mekong data-validation build-docs --open

# Run checkpoint
mekong data-validation checkpoint run --suite default

# Schema validation
mekong data-validation schema validate.json --data input.csv
```

**Tech Stack:** Great Expectations, Pydantic, Pandera

---

### 12. `/experiment-tracking` - Experiment Management

**Use Case:** Track experiments với MLflow/W&B - logging, comparison, model registry.

```bash
# Create experiment
mekong experiment-tracking create churn-v2 --base-model resnet50

# Log run
mekong experiment-tracking log churn-v2 \
  --metrics accuracy:0.92,loss:0.23 \
  --params lr:0.001,batch_size:32

# Compare runs
mekong experiment-tracking compare run1,run2,run3 --metrics accuracy,loss

# Search runs
mekong experiment-tracking search --filter "accuracy > 0.90" --order accuracy DESC

# Register model
mekong experiment-tracking register run-abc123 --name churn-model --stage staging

# Visualize (MLflow UI)
mekong experiment-tracking viz churn-v2 --port 5000
```

**Tech Stack:** MLflow, Weights & Biases, Neptune, TensorBoard

---

## 🧪 Testing Commands

```bash
# Test data preparation
mekong data-prep data/test --validate

# Test training config
mekong model-train test dummy --dry-run

# Test inference
curl -X POST http://localhost:8000/v1/predict \
  -H "Content-Type: application/json" \
  -d '{"instances": [{"data": [0.1, 0.2, 0.3]}]}'

# Test deployment health
curl http://localhost:8000/health
```

---

## 🆘 Troubleshooting

### Training Issues
- **OOM Error:** Giảm batch size hoặc dùng gradient accumulation
- **NaN Loss:** Check learning rate, gradient clipping
- **Slow Training:** Enable mixed precision (AMP), multi-GPU

### Deployment Issues
- **High Latency:** Enable batching, TensorRT optimization
- **Cold Start:** Use provisioned concurrency
- **Memory Issues:** Model quantization (FP16/INT8)

### Pipeline Issues
- **Step Failed:** Check retry policy, error logs
- **Dependency Issues:** Validate DAG acyclic
- **Schedule Not Running:** Check cron expression, timezone

---

## 📚 Related Documentation

- [Model Training Guide](./model-training-guide.md)
- [Deployment Playbook](./deployment-playbook.md)
- [MLOps Best Practices](./mlops-best-practices.md)
- [Infrastructure Setup](./infrastructure-setup.md)

---

_Tài liệu được tạo: 2026-03-04_
_Mekong CLI v0.2.0_
