# Quantum Computing — Skill

> Quantum circuit design, hybrid classical-quantum workflows, and quantum-safe cryptography engineering.

## When to Activate
- User needs quantum circuit design, gate composition, or QASM/OpenQASM integration
- Building hybrid classical-quantum ML pipelines (VQE, QAOA, QNN)
- Implementing quantum-safe cryptography (post-quantum TLS, key encapsulation)
- Optimizing combinatorial problems using quantum annealing or variational algorithms

## Core Capabilities

| Area | Description |
|------|-------------|
| Circuit Design | Gate-level circuit composition, noise modeling, transpilation to hardware topology |
| Hybrid Workflows | Classical optimizer ↔ quantum backend integration (PennyLane, Qiskit Runtime) |
| Quantum-Safe Crypto | NIST PQC standards — CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, SPHINCS+ |
| Quantum ML | Variational quantum classifiers, quantum kernel methods, quantum GANs |
| Simulation | Statevector/density matrix simulation for circuit validation before hardware runs |

## Architecture Patterns

- **Hybrid VQE Loop:** Classical BFGS/ADAM optimizer → parameter-shift gradient → quantum backend → energy expectation value → converge
- **Quantum-Classical Pipeline:** Feature encoding (angle/amplitude embedding) → variational layer → measurement → classical postprocessing
- **Post-Quantum TLS Handshake:** Client KEM encapsulation (Kyber-768) → server decapsulation → shared secret → symmetric AES-256-GCM session
- **Error Mitigation Stack:** Zero-noise extrapolation (ZNE) + probabilistic error cancellation (PEC) applied before readout

## Key Technologies

- **SDKs:** Qiskit (IBM), PennyLane (Xanadu), Cirq (Google), Amazon Braket, Azure Quantum
- **Languages:** OpenQASM 3.0, Quil, Q# for Microsoft stack
- **Post-Quantum Libs:** liboqs (Open Quantum Safe), PQClean, BouncyCastle PQC, oqs-provider for OpenSSL
- **Simulators:** Qiskit Aer, cuQuantum (GPU-accelerated), QuEST, qsim
- **Hardware Access:** IBM Quantum Network, IonQ, Rigetti, Quantinuum H-Series

## Implementation Checklist

- [ ] Define problem formulation — verify quantum advantage over classical baseline exists
- [ ] Select qubit encoding strategy (basis, amplitude, angle, IQP) matching data type
- [ ] Build and validate circuit with simulator before hardware submission
- [ ] Apply transpilation to target hardware's native gate set and connectivity map
- [ ] Implement error mitigation (ZNE or measurement error mitigation via M3)
- [ ] Wrap quantum backend calls with retry + fallback to simulation on queue timeout
- [ ] For PQC: audit all RSA/ECC key usages; replace with NIST PQC equivalents
- [ ] Benchmark circuit depth vs fidelity tradeoff on target hardware

## Best Practices

- Always prototype on statevector simulator — catch logical bugs before burning QPU credits
- Use parameter-shift rule for gradients, not finite difference — exact and hardware-compatible
- Design circuits with shallow depth first; NISQ devices have coherence time limits (~100μs)
- Cache quantum job results with job IDs — IBM/Braket charge per shot, retries are expensive
- For crypto migration: implement crypto-agility — abstract algorithm behind interface so swap is seamless

## Anti-Patterns

- Do not claim quantum speedup without benchmarking classical baseline on same problem size
- Avoid deep circuits (>50 two-qubit gates) on current NISQ hardware — noise dominates signal
- Never use quantum random number generators as sole entropy source without certification
- Do not mix quantum and post-quantum terminology — "quantum-safe" ≠ "quantum computing"
- Avoid vendor lock-in: abstract hardware backends behind a provider interface from the start
