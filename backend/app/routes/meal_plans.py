from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_meal_plans():
    return {"message": "Get user meal plans"}

@router.post("/")
async def create_meal_plan():
    return {"message": "Create new meal plan"}

@router.get("/{plan_id}")
async def get_meal_plan(plan_id: str):
    return {"message": f"Get meal plan {plan_id}"}

@router.put("/{plan_id}")
async def update_meal_plan(plan_id: str):
    return {"message": f"Update meal plan {plan_id}"}

@router.delete("/{plan_id}")
async def delete_meal_plan(plan_id: str):
    return {"message": f"Delete meal plan {plan_id}"}