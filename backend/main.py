import os
import shutil
from typing import List, Optional

import uvicorn
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, database

# Create database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# CORS Middleware
# Adjust origins as needed for your frontend development server
origins = [
    "http://localhost:3000", # Default for Create React App
    "http://localhost:3001", # Common alternative
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

UPLOAD_DIRECTORY = "./uploads"
if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/assets/upload", response_model=models.AssetResponse)
async def upload_asset(
    name: str = Form(...),
    asset_type: models.AssetType = Form(...),
    x: Optional[float] = Form(None),
    y: Optional[float] = Form(None),
    z: Optional[float] = Form(None),
    rotation_x: Optional[float] = Form(None),
    rotation_y: Optional[float] = Form(None),
    rotation_z: Optional[float] = Form(None),
    scale_x: Optional[float] = Form(1.0),
    scale_y: Optional[float] = Form(1.0),
    scale_z: Optional[float] = Form(1.0),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)

    # Ensure the filename is unique to prevent overwrites, or handle as needed
    if os.path.exists(file_path):
        # Simple way to make it unique for now: append a counter or timestamp
        base, ext = os.path.splitext(file.filename)
        counter = 1
        while os.path.exists(file_path):
            file_path = os.path.join(UPLOAD_DIRECTORY, f"{base}_{counter}{ext}")
            counter += 1
            if counter > 100: # Safety break
                raise HTTPException(status_code=500, detail="Could not generate unique filename.")

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    finally:
        file.file.close()

    db_asset = models.Asset(
        name=name,
        asset_type=asset_type,
        file_path=file_path,
        x=x, y=y, z=z,
        rotation_x=rotation_x, rotation_y=rotation_y, rotation_z=rotation_z,
        scale_x=scale_x, scale_y=scale_y, scale_z=scale_z
    )
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.get("/assets", response_model=List[models.AssetResponse])
async def get_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    assets = db.query(models.Asset).offset(skip).limit(limit).all()
    return assets

@app.get("/assets/{asset_id}", response_model=models.AssetResponse)
async def get_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

@app.put("/assets/{asset_id}", response_model=models.AssetResponse)
async def update_asset(
    asset_id: int,
    asset_update: models.AssetUpdate,
    db: Session = Depends(get_db)
):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    update_data = asset_update.dict(exclude_unset=True) # For Pydantic v1
    # For Pydantic v2, use: asset_update.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        setattr(db_asset, key, value)

    db.commit()
    db.refresh(db_asset)
    return db_asset

@app.delete("/assets/{asset_id}", response_model=models.AssetResponse)
async def delete_asset(asset_id: int, db: Session = Depends(get_db)):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")

    # Delete the actual file
    if db_asset.file_path and os.path.exists(db_asset.file_path):
        try:
            os.remove(db_asset.file_path)
        except Exception as e:
            # Log this error, but proceed to delete DB record
            print(f"Error deleting file {db_asset.file_path}: {e}")
            # Depending on policy, you might want to prevent DB deletion if file deletion fails

    db.delete(db_asset)
    db.commit()
    return db_asset

# To run the server (from the 'backend' directory):
# uvicorn main:app --reload
# Or from the root directory:
# cd backend && uvicorn main:app --reload
# (Adjust host and port as needed, e.g., uvicorn main:app --host 0.0.0.0 --port 8000 --reload)

if __name__ == "__main__":
    # This is for running directly with python main.py for simplicity in some environments
    # Production should use Uvicorn directly as per FastAPI docs.
    uvicorn.run(app, host="0.0.0.0", port=8000)
