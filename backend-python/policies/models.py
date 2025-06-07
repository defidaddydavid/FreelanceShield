from enum import Enum
from pydantic import BaseModel

class PolicyStatus(str, Enum):
    CREATED = "created"
    ACTIVE = "active"
    EXPIRED = "expired"
    CLAIMED = "claimed"

class Policy(BaseModel):
    id: int
    holder: str
    premium: float
    coverage: float
    status: PolicyStatus = PolicyStatus.CREATED
