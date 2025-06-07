from pydantic import BaseModel
from typing import List

class Deposit(BaseModel):
    id: int
    amount: float
    depositor: str

class RiskPool(BaseModel):
    balance: float = 0.0
    deposits: List[Deposit] = []
