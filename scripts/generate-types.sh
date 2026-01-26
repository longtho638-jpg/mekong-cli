#!/bin/bash
pip install pydantic-to-typescript
pydantic2ts --module backend.models --output apps/dashboard/types/generated.ts
