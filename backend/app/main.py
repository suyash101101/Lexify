from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.cases.routes import router as cases_router
from app.websockets.routes import router as websocket_router
from app.api.hai.routes import router as hai_router
from app.api.consultancy.routes import router as consultancy_router

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(cases_router, prefix="/cases", tags=["cases"])
app.include_router(websocket_router, tags=["websocket"])
app.include_router(hai_router, prefix="/api/hai", tags=["hai"])
app.include_router(consultancy_router, prefix="/consultancy", tags=["consultancy"])