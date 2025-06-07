# FreelanceShield Python Backend

This directory contains a lightweight FastAPI service mirroring the core smart contract modules.

## Getting Started

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the development server:

```bash
uvicorn main:app --reload
```

The server exposes basic placeholder endpoints for creating policies, filing claims, and depositing capital into the risk pool. It is intended for local prototyping alongside the Solana programs.
