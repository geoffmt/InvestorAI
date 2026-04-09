from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import schemas
from database import get_db
from analysis import compute_allocation

router = APIRouter()


@router.get("/proposal", response_model=schemas.AllocationProposal)
def get_allocation_proposal(db: Session = Depends(get_db)):
    result = compute_allocation(db)
    return schemas.AllocationProposal(**result)
