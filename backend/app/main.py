from fastapi import FastAPI

from app.routers import api_router

app = FastAPI()

app.include_router(api_router, prefix="/api/v1")

@app.get("/")
def test() :
    return "L'application fonctionne correctement"
