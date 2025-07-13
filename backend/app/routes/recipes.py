from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_recipes():
    return {"message": "Get user recipes"}

@router.post("/")
async def create_recipe():
    return {"message": "Create new recipe"}

@router.get("/{recipe_id}")
async def get_recipe(recipe_id: str):
    return {"message": f"Get recipe {recipe_id}"}

@router.put("/{recipe_id}")
async def update_recipe(recipe_id: str):
    return {"message": f"Update recipe {recipe_id}"}

@router.delete("/{recipe_id}")
async def delete_recipe(recipe_id: str):
    return {"message": f"Delete recipe {recipe_id}"}