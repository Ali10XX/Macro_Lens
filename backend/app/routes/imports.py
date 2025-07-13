from fastapi import APIRouter

router = APIRouter()

@router.post("/social-media")
async def import_from_social_media():
    return {"message": "Import recipe from social media post"}

@router.post("/url")
async def import_from_url():
    return {"message": "Import recipe from URL"}

@router.get("/jobs")
async def get_import_jobs():
    return {"message": "Get user import jobs"}

@router.get("/jobs/{job_id}")
async def get_import_job(job_id: str):
    return {"message": f"Get import job {job_id}"}