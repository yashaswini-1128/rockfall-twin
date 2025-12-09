from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import router as api_router 

app = FastAPI(title="Rockfall Twin Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten for prod
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# mount all /api/* routes
app.include_router(api_router)
