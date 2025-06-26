# pip install fastapi uvicorn pydantic
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json, operator, os

class Listing(BaseModel):
    title:str
    detail_url:str
    price:int
    year:int|None=None
    model:str|None=None
    slides:int|None=0
    converter:str|None=None
    featured_image:str|None=None

def load_data():
    """Load data from listings.json, return empty list if file doesn't exist"""
    try:
        with open("listings.json") as f:
            return [Listing(**x) for x in json.load(f)]
    except (FileNotFoundError, json.JSONDecodeError):
        return []

DATA: list[Listing] = load_data()

app = FastAPI(title="CoachRanger API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

def sort_listings(items, key, direction):
    if key not in Listing.model_fields: return items
    reverse = direction=="desc"
    return sorted(items, key=lambda x: getattr(x, key) or 0, reverse=reverse)

@app.get("/listings", response_model=list[Listing])
def listings(sort:str="price", dir:str="desc"):
    return sort_listings(DATA, sort, dir)

@app.get("/search", response_model=list[Listing])
def search(q:str = Query(..., min_length=2), sort:str="price", dir:str="desc"):
    needle = q.lower()
    hits = [l for l in DATA if needle in l.title.lower() or (l.model and needle in l.model.lower())]
    return sort_listings(hits, sort, dir)

@app.get("/reload")
def reload_data():
    """Reload data from listings.json"""
    global DATA
    DATA = load_data()
    return {"message": f"Reloaded {len(DATA)} listings"}

# Run with: uvicorn api:app --reload  # defaults to http://127.0.0.1:8000