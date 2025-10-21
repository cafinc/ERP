"""
HR Module API Routes
Handles all HR-related endpoints including:
- Employee Management
- Time & Attendance
- PTO Management
- Training & Certifications
- Performance Reviews
- Payroll Settings
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

from models import (
    Employee, EmployeeCreate, EmployeeUpdate,
    TimeEntry, TimeEntryCreate, TimeEntryUpdate,
    PTORequest, PTORequestCreate, PTORequestUpdate, PTOBalance,
    Training, TrainingCreate, EmployeeTraining, EmployeeTrainingCreate, EmployeeTrainingUpdate,
    PerformanceReview, PerformanceReviewCreate, PerformanceReviewUpdate,
    PayrollSettings, EmploymentStatus, TimeEntryStatus, PTOStatus, TrainingStatus, ReviewStatus
)

# Initialize Async MongoDB client
mongo_url = os.getenv("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client["snow_removal_db"]

# Collections
employees_collection = db["employees"]
time_entries_collection = db["time_entries"]
pto_requests_collection = db["pto_requests"]
pto_balances_collection = db["pto_balances"]
trainings_collection = db["trainings"]
employee_trainings_collection = db["employee_trainings"]
performance_reviews_collection = db["performance_reviews"]
payroll_settings_collection = db["payroll_settings"]

router = APIRouter(prefix="/hr", tags=["HR Module"])

# ==================== EMPLOYEE MANAGEMENT ====================

@router.post("/employees", response_model=dict)
async def create_employee(employee: EmployeeCreate):
    """Create a new employee"""
    try:
        # Generate unique employee number
        count = await employees_collection.count_documents({})
        employee_number = f"EMP{str(count + 1).zfill(5)}"
        
        employee_dict = employee.dict()
        employee_dict["employee_number"] = employee_number
        employee_dict["employment_status"] = EmploymentStatus.ACTIVE
        employee_dict["created_at"] = datetime.utcnow()
        employee_dict["updated_at"] = datetime.utcnow()
        
        result = await employees_collection.insert_one(employee_dict)
        employee_dict["id"] = str(result.inserted_id)
        
        # Initialize PTO balance for the employee
        current_year = datetime.utcnow().year
        pto_balance = {
            "employee_id": employee_dict["id"],
            "year": current_year,
            "vacation_balance": 0.0,
            "sick_balance": 0.0,
            "personal_balance": 0.0,
            "vacation_accrued": 0.0,
            "sick_accrued": 0.0,
            "personal_accrued": 0.0,
            "updated_at": datetime.utcnow()
        }
        await pto_balances_collection.insert_one(pto_balance)
        
        return {"success": True, "employee": employee_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/employees", response_model=dict)
async def get_employees(
    status: Optional[str] = None,
    department: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get all employees with optional filters"""
    try:
        query = {}
        if status:
            query["employment_status"] = status
        if department:
            query["department"] = department
        
        employees = list(employees_collection.find(query).skip(skip).limit(limit))
        for emp in employees:
            emp["id"] = str(emp["_id"])
            del emp["_id"]
        
        total = await employees_collection.count_documents(query)
        
        return {"success": True, "employees": employees, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/employees/{employee_id}", response_model=dict)
async def get_employee(employee_id: str):
    """Get employee by ID"""
    try:
        employee = await employees_collection.find_one({"_id": ObjectId(employee_id)})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        employee["id"] = str(employee["_id"])
        del employee["_id"]
        
        return {"success": True, "employee": employee}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/employees/{employee_id}", response_model=dict)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate):
    """Update employee information"""
    try:
        update_data = {k: v for k, v in employee_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await employees_collection.update_one(
            {"_id": ObjectId(employee_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        updated_employee = await employees_collection.find_one({"_id": ObjectId(employee_id)})
        updated_employee["id"] = str(updated_employee["_id"])
        del updated_employee["_id"]
        
        return {"success": True, "employee": updated_employee}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/employees/{employee_id}", response_model=dict)
async def delete_employee(employee_id: str):
    """Delete employee (soft delete - set status to terminated)"""
    try:
        result = await employees_collection.update_one(
            {"_id": ObjectId(employee_id)},
            {"$set": {"employment_status": EmploymentStatus.TERMINATED, "termination_date": datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        return {"success": True, "message": "Employee terminated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TIME & ATTENDANCE ====================

@router.post("/time-entries", response_model=dict)
async def create_time_entry(time_entry: TimeEntryCreate):
    """Clock in - create new time entry"""
    try:
        # Get employee name
        employee = await employees_collection.find_one({"_id": ObjectId(time_entry.employee_id)})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        time_entry_dict = time_entry.dict()
        time_entry_dict["employee_name"] = f"{employee['first_name']} {employee['last_name']}"
        time_entry_dict["status"] = TimeEntryStatus.PENDING
        time_entry_dict["created_at"] = datetime.utcnow()
        time_entry_dict["updated_at"] = datetime.utcnow()
        
        result = await time_entries_collection.insert_one(time_entry_dict)
        time_entry_dict["id"] = str(result.inserted_id)
        
        return {"success": True, "time_entry": time_entry_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/time-entries/{entry_id}/clock-out", response_model=dict)
async def clock_out(entry_id: str, clock_out_time: Optional[datetime] = None):
    """Clock out - update time entry with clock out time"""
    try:
        entry = await time_entries_collection.find_one({"_id": ObjectId(entry_id)})
        if not entry:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        if entry.get("clock_out"):
            raise HTTPException(status_code=400, detail="Already clocked out")
        
        clock_out = clock_out_time or datetime.utcnow()
        clock_in = entry["clock_in"]
        
        # Calculate total hours
        duration = clock_out - clock_in
        total_hours = duration.total_seconds() / 3600
        break_minutes = entry.get("break_duration_minutes", 0)
        total_hours -= break_minutes / 60
        
        result = await time_entries_collection.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": {
                "clock_out": clock_out,
                "total_hours": round(total_hours, 2),
                "updated_at": datetime.utcnow()
            }}
        )
        
        updated_entry = await time_entries_collection.find_one({"_id": ObjectId(entry_id)})
        updated_entry["id"] = str(updated_entry["_id"])
        del updated_entry["_id"]
        
        return {"success": True, "time_entry": updated_entry}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/time-entries", response_model=dict)
async def get_time_entries(
    employee_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get time entries with optional filters"""
    try:
        query = {}
        if employee_id:
            query["employee_id"] = employee_id
        if status:
            query["status"] = status
        if start_date and end_date:
            query["clock_in"] = {
                "$gte": datetime.fromisoformat(start_date),
                "$lte": datetime.fromisoformat(end_date)
            }
        
        entries = list(time_entries_collection.find(query).sort("clock_in", -1).skip(skip).limit(limit))
        for entry in entries:
            entry["id"] = str(entry["_id"])
            del entry["_id"]
        
        total = await time_entries_collection.count_documents(query)
        
        return {"success": True, "time_entries": entries, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/time-entries/{entry_id}/approve", response_model=dict)
async def approve_time_entry(entry_id: str, approved_by: str):
    """Approve a time entry"""
    try:
        result = await time_entries_collection.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": {
                "status": TimeEntryStatus.APPROVED,
                "approved_by": approved_by,
                "approved_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        return {"success": True, "message": "Time entry approved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/time-entries/{entry_id}/reject", response_model=dict)
async def reject_time_entry(entry_id: str, approved_by: str):
    """Reject a time entry"""
    try:
        result = await time_entries_collection.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": {
                "status": TimeEntryStatus.REJECTED,
                "approved_by": approved_by,
                "approved_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Time entry not found")
        
        return {"success": True, "message": "Time entry rejected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PTO MANAGEMENT ====================

@router.post("/pto-requests", response_model=dict)
async def create_pto_request(pto_request: PTORequestCreate):
    """Create a new PTO request"""
    try:
        # Get employee name
        employee = await employees_collection.find_one({"_id": ObjectId(pto_request.employee_id)})
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
        
        pto_dict = pto_request.dict()
        pto_dict["employee_name"] = f"{employee['first_name']} {employee['last_name']}"
        pto_dict["status"] = PTOStatus.PENDING
        pto_dict["created_at"] = datetime.utcnow()
        pto_dict["updated_at"] = datetime.utcnow()
        
        result = await pto_requests_collection.insert_one(pto_dict)
        pto_dict["id"] = str(result.inserted_id)
        
        return {"success": True, "pto_request": pto_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pto-requests", response_model=dict)
async def get_pto_requests(
    employee_id: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """Get PTO requests with optional filters"""
    try:
        query = {}
        if employee_id:
            query["employee_id"] = employee_id
        if status:
            query["status"] = status
        
        requests = list(pto_requests_collection.find(query).sort("created_at", -1).skip(skip).limit(limit))
        for req in requests:
            req["id"] = str(req["_id"])
            del req["_id"]
        
        total = await pto_requests_collection.count_documents(query)
        
        return {"success": True, "pto_requests": requests, "total": total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/pto-requests/{request_id}/approve", response_model=dict)
async def approve_pto_request(request_id: str, reviewed_by: str, review_notes: Optional[str] = None):
    """Approve a PTO request"""
    try:
        pto_request = await pto_requests_collection.find_one({"_id": ObjectId(request_id)})
        if not pto_request:
            raise HTTPException(status_code=404, detail="PTO request not found")
        
        # Deduct from PTO balance
        pto_balance = await pto_balances_collection.find_one({
            "employee_id": pto_request["employee_id"],
            "year": datetime.utcnow().year
        })
        
        if pto_balance:
            pto_type = pto_request["pto_type"]
            days_requested = pto_request["total_days"]
            
            if pto_type == "vacation":
                new_balance = pto_balance.get("vacation_balance", 0) - days_requested
                await pto_balances_collection.update_one(
                    {"_id": pto_balance["_id"]},
                    {"$set": {"vacation_balance": new_balance, "updated_at": datetime.utcnow()}}
                )
            elif pto_type == "sick":
                new_balance = pto_balance.get("sick_balance", 0) - days_requested
                await pto_balances_collection.update_one(
                    {"_id": pto_balance["_id"]},
                    {"$set": {"sick_balance": new_balance, "updated_at": datetime.utcnow()}}
                )
            elif pto_type == "personal":
                new_balance = pto_balance.get("personal_balance", 0) - days_requested
                await pto_balances_collection.update_one(
                    {"_id": pto_balance["_id"]},
                    {"$set": {"personal_balance": new_balance, "updated_at": datetime.utcnow()}}
                )
        
        result = await pto_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {
                "status": PTOStatus.APPROVED,
                "reviewed_by": reviewed_by,
                "reviewed_at": datetime.utcnow(),
                "review_notes": review_notes,
                "updated_at": datetime.utcnow()
            }}
        )
        
        return {"success": True, "message": "PTO request approved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/pto-requests/{request_id}/deny", response_model=dict)
async def deny_pto_request(request_id: str, reviewed_by: str, review_notes: Optional[str] = None):
    """Deny a PTO request"""
    try:
        result = await pto_requests_collection.update_one(
            {"_id": ObjectId(request_id)},
            {"$set": {
                "status": PTOStatus.DENIED,
                "reviewed_by": reviewed_by,
                "reviewed_at": datetime.utcnow(),
                "review_notes": review_notes,
                "updated_at": datetime.utcnow()
            }}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="PTO request not found")
        
        return {"success": True, "message": "PTO request denied"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pto-balance/{employee_id}", response_model=dict)
async def get_pto_balance(employee_id: str, year: Optional[int] = None):
    """Get PTO balance for an employee"""
    try:
        current_year = year or datetime.utcnow().year
        balance = await pto_balances_collection.find_one({
            "employee_id": employee_id,
            "year": current_year
        })
        
        if not balance:
            # Create initial balance
            balance = {
                "employee_id": employee_id,
                "year": current_year,
                "vacation_balance": 0.0,
                "sick_balance": 0.0,
                "personal_balance": 0.0,
                "vacation_accrued": 0.0,
                "sick_accrued": 0.0,
                "personal_accrued": 0.0,
                "updated_at": datetime.utcnow()
            }
            result = await pto_balances_collection.insert_one(balance)
            balance["id"] = str(result.inserted_id)
        else:
            balance["id"] = str(balance["_id"])
            del balance["_id"]
        
        return {"success": True, "pto_balance": balance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TRAINING & CERTIFICATIONS ====================

@router.post("/trainings", response_model=dict)
async def create_training(training: TrainingCreate):
    """Create a new training program"""
    try:
        training_dict = training.dict()
        training_dict["created_at"] = datetime.utcnow()
        
        result = await trainings_collection.insert_one(training_dict)
        training_dict["id"] = str(result.inserted_id)
        
        return {"success": True, "training": training_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/trainings", response_model=dict)
async def get_trainings():
    """Get all training programs"""
    try:
        trainings = list(trainings_collection.find())
        for training in trainings:
            training["id"] = str(training["_id"])
            del training["_id"]
        
        return {"success": True, "trainings": trainings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/employee-trainings", response_model=dict)
async def assign_training(employee_training: EmployeeTrainingCreate):
    """Assign training to an employee"""
    try:
        # Get employee and training details
        employee = await employees_collection.find_one({"_id": ObjectId(employee_training.employee_id)})
        training = await trainings_collection.find_one({"_id": ObjectId(employee_training.training_id)})
        
        if not employee or not training:
            raise HTTPException(status_code=404, detail="Employee or training not found")
        
        emp_training_dict = employee_training.dict()
        emp_training_dict["employee_name"] = f"{employee['first_name']} {employee['last_name']}"
        emp_training_dict["training_name"] = training["name"]
        emp_training_dict["status"] = TrainingStatus.SCHEDULED
        emp_training_dict["assigned_date"] = emp_training_dict.get("assigned_date") or datetime.utcnow()
        emp_training_dict["created_at"] = datetime.utcnow()
        
        result = await employee_trainings_collection.insert_one(emp_training_dict)
        emp_training_dict["id"] = str(result.inserted_id)
        
        return {"success": True, "employee_training": emp_training_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/employee-trainings", response_model=dict)
async def get_employee_trainings(employee_id: Optional[str] = None, status: Optional[str] = None):
    """Get employee training assignments"""
    try:
        query = {}
        if employee_id:
            query["employee_id"] = employee_id
        if status:
            query["status"] = status
        
        trainings = list(employee_trainings_collection.find(query).sort("assigned_date", -1))
        for training in trainings:
            training["id"] = str(training["_id"])
            del training["_id"]
        
        return {"success": True, "employee_trainings": trainings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/employee-trainings/{training_id}", response_model=dict)
async def update_employee_training(training_id: str, training_update: EmployeeTrainingUpdate):
    """Update employee training status"""
    try:
        update_data = {k: v for k, v in training_update.dict().items() if v is not None}
        
        # Calculate expiration if completed
        if update_data.get("status") == TrainingStatus.COMPLETED and update_data.get("completion_date"):
            emp_training = await employee_trainings_collection.find_one({"_id": ObjectId(training_id)})
            if emp_training:
                training = await trainings_collection.find_one({"_id": ObjectId(emp_training["training_id"])})
                if training and training.get("expiration_months"):
                    completion = update_data["completion_date"]
                    expiration = completion + timedelta(days=training["expiration_months"] * 30)
                    update_data["expiration_date"] = expiration
        
        result = await employee_trainings_collection.update_one(
            {"_id": ObjectId(training_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Employee training not found")
        
        return {"success": True, "message": "Training updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PERFORMANCE MANAGEMENT ====================

@router.post("/performance-reviews", response_model=dict)
async def create_performance_review(review: PerformanceReviewCreate):
    """Create a performance review"""
    try:
        # Get employee and reviewer names
        employee = await employees_collection.find_one({"_id": ObjectId(review.employee_id)})
        reviewer = await employees_collection.find_one({"_id": ObjectId(review.reviewer_id)})
        
        if not employee or not reviewer:
            raise HTTPException(status_code=404, detail="Employee or reviewer not found")
        
        review_dict = review.dict()
        review_dict["employee_name"] = f"{employee['first_name']} {employee['last_name']}"
        review_dict["reviewer_name"] = f"{reviewer['first_name']} {reviewer['last_name']}"
        review_dict["status"] = ReviewStatus.SCHEDULED
        review_dict["created_at"] = datetime.utcnow()
        review_dict["updated_at"] = datetime.utcnow()
        
        result = await performance_reviews_collection.insert_one(review_dict)
        review_dict["id"] = str(result.inserted_id)
        
        return {"success": True, "review": review_dict}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/performance-reviews", response_model=dict)
async def get_performance_reviews(
    employee_id: Optional[str] = None,
    reviewer_id: Optional[str] = None,
    status: Optional[str] = None
):
    """Get performance reviews"""
    try:
        query = {}
        if employee_id:
            query["employee_id"] = employee_id
        if reviewer_id:
            query["reviewer_id"] = reviewer_id
        if status:
            query["status"] = status
        
        reviews = list(performance_reviews_collection.find(query).sort("scheduled_date", -1))
        for review in reviews:
            review["id"] = str(review["_id"])
            del review["_id"]
        
        return {"success": True, "reviews": reviews}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/performance-reviews/{review_id}", response_model=dict)
async def update_performance_review(review_id: str, review_update: PerformanceReviewUpdate):
    """Update performance review"""
    try:
        update_data = {k: v for k, v in review_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await performance_reviews_collection.update_one(
            {"_id": ObjectId(review_id)},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Performance review not found")
        
        return {"success": True, "message": "Review updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== PAYROLL SETTINGS ====================

@router.get("/payroll-settings", response_model=dict)
async def get_payroll_settings():
    """Get payroll settings"""
    try:
        settings = await payroll_settings_collection.find_one()
        if not settings:
            # Create default settings
            settings = {
                "company_name": "Snow Removal Company",
                "pay_frequency": "bi_weekly",
                "overtime_threshold_hours": 40.0,
                "overtime_multiplier": 1.5,
                "double_time_multiplier": 2.0,
                "updated_at": datetime.utcnow()
            }
            result = await payroll_settings_collection.insert_one(settings)
            settings["id"] = str(result.inserted_id)
        else:
            settings["id"] = str(settings["_id"])
            del settings["_id"]
        
        return {"success": True, "settings": settings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/payroll-settings", response_model=dict)
async def update_payroll_settings(settings: PayrollSettings):
    """Update payroll settings"""
    try:
        settings_dict = settings.dict()
        settings_dict["updated_at"] = datetime.utcnow()
        
        existing = await payroll_settings_collection.find_one()
        if existing:
            result = await payroll_settings_collection.update_one(
                {"_id": existing["_id"]},
                {"$set": settings_dict}
            )
        else:
            result = await payroll_settings_collection.insert_one(settings_dict)
        
        return {"success": True, "message": "Payroll settings updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
