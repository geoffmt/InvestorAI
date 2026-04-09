import httpx
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import crud
import schemas
from database import get_db

router = APIRouter()


@router.get("", response_model=schemas.AppSettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return schemas.AppSettingsOut.model_validate(crud.get_settings(db))


@router.put("", response_model=schemas.AppSettingsOut)
def update_settings(data: schemas.AppSettingsUpdate, db: Session = Depends(get_db)):
    updated = crud.update_settings(db, data)
    return schemas.AppSettingsOut.model_validate(updated)


@router.post("/test-connection", response_model=schemas.OllamaTestResult)
async def test_connection(db: Session = Depends(get_db)):
    settings = crud.get_settings(db)
    url = settings.ollama_url.rstrip("/") + "/api/tags"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()
            models_list = [m.get("name", "") for m in data.get("models", [])]
            return schemas.OllamaTestResult(connected=True, models=models_list)
    except Exception as exc:
        return schemas.OllamaTestResult(connected=False, error=str(exc))
