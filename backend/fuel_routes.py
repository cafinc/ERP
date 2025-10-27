"""
Fuel tracking routes for managing fuel entries and consumption
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from server import db

router = APIRouter()

# Pydantic models
class FuelEntry(BaseModel):
    vehicle_id: str
    driver_name: str
    fuel_type: str = "Diesel"
    quantity: float
    cost: float
    odometer: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    date: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

class FuelEntryResponse(FuelEntry):
    id: str
    created_at: str
    updated_at: Optional[str] = None

    class Config:
        populate_by_name = True

# Helper function to serialize MongoDB document
def serialize_fuel_entry(entry):
    """Convert MongoDB document to dictionary with string ID"""
    if entry:
        entry['id'] = str(entry.pop('_id'))
        return entry
    return None

@router.get("/fuel")
async def get_fuel_entries(current_user: dict = Depends(get_current_user)):
    """Get all fuel entries"""
    try:
        entries = list(db.fuel_entries.find().sort("date", -1))
        return [serialize_fuel_entry(entry) for entry in entries]
    except Exception as e:
        print(f"Error fetching fuel entries: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fuel/{entry_id}")
async def get_fuel_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific fuel entry"""
    try:
        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")
        
        entry = db.fuel_entries.find_one({"_id": ObjectId(entry_id)})
        if not entry:
            raise HTTPException(status_code=404, detail="Fuel entry not found")
        
        return serialize_fuel_entry(entry)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching fuel entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fuel")
async def create_fuel_entry(entry: FuelEntry, current_user: dict = Depends(get_current_user)):
    """Create a new fuel entry"""
    try:
        entry_dict = entry.dict()
        entry_dict['created_at'] = datetime.utcnow().isoformat()
        entry_dict['created_by'] = current_user.get('email', 'unknown')
        
        result = db.fuel_entries.insert_one(entry_dict)
        
        created_entry = db.fuel_entries.find_one({"_id": result.inserted_id})
        return serialize_fuel_entry(created_entry)
    except Exception as e:
        print(f"Error creating fuel entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/fuel/{entry_id}")
async def update_fuel_entry(
    entry_id: str,
    entry: FuelEntry,
    current_user: dict = Depends(get_current_user)
):
    """Update a fuel entry"""
    try:
        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")
        
        entry_dict = entry.dict()
        entry_dict['updated_at'] = datetime.utcnow().isoformat()
        entry_dict['updated_by'] = current_user.get('email', 'unknown')
        
        result = db.fuel_entries.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": entry_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Fuel entry not found")
        
        updated_entry = db.fuel_entries.find_one({"_id": ObjectId(entry_id)})
        return serialize_fuel_entry(updated_entry)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating fuel entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/fuel/{entry_id}")
async def delete_fuel_entry(entry_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a fuel entry"""
    try:
        if not ObjectId.is_valid(entry_id):
            raise HTTPException(status_code=400, detail="Invalid entry ID")
        
        result = db.fuel_entries.delete_one({"_id": ObjectId(entry_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Fuel entry not found")
        
        return {"message": "Fuel entry deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting fuel entry: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fuel/stats/summary")
async def get_fuel_stats(current_user: dict = Depends(get_current_user)):
    """Get fuel consumption statistics"""
    try:
        # Aggregate statistics
        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "total_quantity": {"$sum": "$quantity"},
                    "total_cost": {"$sum": "$cost"},
                    "avg_cost_per_gallon": {"$avg": {"$divide": ["$cost", "$quantity"]}},
                    "entry_count": {"$sum": 1}
                }
            }
        ]
        
        result = list(db.fuel_entries.aggregate(pipeline))
        
        if result:
            stats = result[0]
            return {
                "total_quantity": round(stats.get("total_quantity", 0), 2),
                "total_cost": round(stats.get("total_cost", 0), 2),
                "avg_cost_per_gallon": round(stats.get("avg_cost_per_gallon", 0), 2),
                "entry_count": stats.get("entry_count", 0)
            }
        
        return {
            "total_quantity": 0,
            "total_cost": 0,
            "avg_cost_per_gallon": 0,
            "entry_count": 0
        }
    except Exception as e:
        print(f"Error fetching fuel stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/fuel/vehicles")
async def get_vehicles_for_fuel(current_user: dict = Depends(get_current_user)):
    """Get all vehicles for fuel entry dropdown"""
    try:
        # Get unique vehicle IDs from fuel entries
        vehicles_from_fuel = db.fuel_entries.distinct("vehicle_id")
        
        # Get vehicles from equipment/vehicles collection if it exists
        vehicles = []
        if db.equipment.count_documents({}) > 0:
            equipment = list(db.equipment.find({"type": {"$in": ["vehicle", "truck", "trailer"]}}))
            vehicles.extend([{
                "id": str(eq.get("_id")),
                "name": eq.get("name", "Unknown"),
                "type": eq.get("type", "vehicle")
            } for eq in equipment])
        
        # Add vehicles from fuel entries that might not be in equipment
        for vehicle_id in vehicles_from_fuel:
            if not any(v["id"] == vehicle_id for v in vehicles):
                vehicles.append({
                    "id": vehicle_id,
                    "name": vehicle_id,
                    "type": "vehicle"
                })
        
        return vehicles
    except Exception as e:
        print(f"Error fetching vehicles: {e}")
        # Return empty list instead of error to allow page to load
        return []
