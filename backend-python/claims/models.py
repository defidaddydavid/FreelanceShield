from enum import Enum
from pydantic import BaseModel

class ClaimStatus(str, Enum):
    FILED = "filed"
    APPROVED = "approved"
    REJECTED = "rejected"
    PAID = "paid"

class Claim(BaseModel):
    id: int
    policy_id: int
    amount: float
    status: ClaimStatus = ClaimStatus.FILED
