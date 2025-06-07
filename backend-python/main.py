from fastapi import FastAPI

from policies.models import Policy
from claims.models import Claim
from riskpool.models import Deposit, RiskPool

app = FastAPI(title="FreelanceShield Backend API")

# Simple in-memory stores
policies = []
claims = []
riskpool = RiskPool(balance=0.0, deposits=[])

@app.post("/policies")
def create_policy(policy: Policy):
    policies.append(policy)
    return {"message": "Policy created", "policy": policy}

@app.post("/claims")
def file_claim(claim: Claim):
    claims.append(claim)
    return {"message": "Claim filed", "claim": claim}

@app.post("/riskpool/deposit")
def deposit(deposit: Deposit):
    riskpool.balance += deposit.amount
    riskpool.deposits.append(deposit)
    return {"message": "Deposit received", "balance": riskpool.balance}
