from fastapi import FastAPI
from app.routers import auth, cards, sharing, presets

app = FastAPI()

app.include_router(auth.router, tags=["authentication"])
app.include_router(cards.router, tags=["cards"])
app.include_router(sharing.router, tags=["sharing"])
app.include_router(presets.router, tags=["presets"])