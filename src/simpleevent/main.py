from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
import json
import os
import uuid
from datetime import datetime
from typing import List, Optional
from pathlib import Path

app = FastAPI()

# Enable CORS with explicit methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Get the root directory (where run.py is)
ROOT_DIR = Path(__file__).parent.parent.parent

# Mount static files
app.mount("/static", StaticFiles(directory=str(ROOT_DIR / "static")), name="static")

# Error handler for method not allowed
@app.exception_handler(405)
async def method_not_allowed_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=405,
        content={"detail": f"Method {request.method} not allowed for {request.url.path}"}
    )

# Helper functions
def get_timeline(timeline_id: str):
    try:
        with open(f"{ROOT_DIR}/data/{timeline_id}.json", "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return None

def save_timeline(timeline):
    os.makedirs(f"{ROOT_DIR}/data", exist_ok=True)
    with open(f"{ROOT_DIR}/data/{timeline['id']}.json", "w") as f:
        json.dump(timeline, f, indent=2)

@app.get("/")
async def read_root():
    return FileResponse(str(ROOT_DIR / "static/index.html"))

@app.get("/api/timelines")
async def get_timelines():
    timelines = []
    if os.path.exists(f"{ROOT_DIR}/data"):
        for filename in os.listdir(f"{ROOT_DIR}/data"):
            if filename.endswith(".json"):
                with open(f"{ROOT_DIR}/data/{filename}", "r") as f:
                    timelines.append(json.load(f))
    return timelines

@app.post("/api/timelines")
async def create_timeline(timeline: dict):
    timeline_id = str(uuid.uuid4())
    timeline["id"] = timeline_id
    timeline["created_at"] = datetime.now().isoformat()
    timeline["events"] = []
    timeline["event_types"] = []
    save_timeline(timeline)
    return timeline

@app.put("/api/timelines/{timeline_id}")
async def update_timeline(timeline_id: str, timeline: dict):
    existing_timeline = get_timeline(timeline_id)
    if not existing_timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    existing_timeline.update(timeline)
    save_timeline(existing_timeline)
    return existing_timeline

@app.delete("/api/timelines/{timeline_id}")
async def delete_timeline(timeline_id: str):
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    os.remove(f"{ROOT_DIR}/data/{timeline_id}.json")
    return {"message": "Timeline deleted successfully"}

@app.post("/api/timelines/{timeline_id}/events")
async def create_event(timeline_id: str, event: dict):
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    event_id = str(uuid.uuid4())
    event["id"] = event_id
    event["created_at"] = datetime.now().isoformat()
    timeline["events"].append(event)
    save_timeline(timeline)
    return event

@app.put("/api/timelines/{timeline_id}/events/{event_id}")
async def update_event(timeline_id: str, event_id: str, event: dict):
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    event_index = next((i for i, e in enumerate(timeline["events"]) if e["id"] == event_id), None)
    if event_index is None:
        raise HTTPException(status_code=404, detail="Event not found")
    
    timeline["events"][event_index].update(event)
    save_timeline(timeline)
    return timeline["events"][event_index]

@app.delete("/api/timelines/{timeline_id}/events/{event_id}")
async def delete_event(timeline_id: str, event_id: str):
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    timeline["events"] = [e for e in timeline["events"] if e["id"] != event_id]
    save_timeline(timeline)
    return {"message": "Event deleted successfully"}

@app.post("/api/timelines/{timeline_id}/event-types")
async def create_event_type(timeline_id: str, event_type: dict):
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    # Validate event type name
    if not event_type.get("name") or not event_type["name"].strip():
        raise HTTPException(status_code=400, detail="Event type name cannot be empty")
    
    # Check if event type already exists
    if any(et["name"] == event_type["name"] for et in timeline["event_types"]):
        raise HTTPException(status_code=400, detail="Event type already exists")
    
    # Add the new event type
    timeline["event_types"].append(event_type)
    save_timeline(timeline)
    return event_type

@app.put("/api/timelines/{timeline_id}/event-types/{type_name}")
async def update_event_type(timeline_id: str, type_name: str, event_type: dict):
    """Update an event type in the timeline."""
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    # Find the event type by its old name (from URL path)
    event_type_obj = next((et for et in timeline["event_types"] if et["name"] == type_name), None)
    if not event_type_obj:
        raise HTTPException(status_code=404, detail=f"Event type '{type_name}' not found")
    
    # If the name is being changed, check if the new name already exists
    if event_type["name"] != type_name:
        if any(et["name"] == event_type["name"] for et in timeline["event_types"]):
            raise HTTPException(status_code=400, detail=f"Event type '{event_type['name']}' already exists")
    
    # Update all events that reference this type
    for event in timeline["events"]:
        if event["type"] == type_name:
            event["type"] = event_type["name"]
    
    # Update the event type itself
    event_type_obj["name"] = event_type["name"]
    event_type_obj["color"] = event_type["color"]
    
    save_timeline(timeline)
    return event_type_obj

@app.delete("/api/timelines/{timeline_id}/event-types/{type_name}")
async def delete_event_type(timeline_id: str, type_name: str):
    timeline = get_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    # Check if event type exists
    event_type = next((et for et in timeline["event_types"] if et["name"] == type_name), None)
    if not event_type:
        raise HTTPException(status_code=404, detail="Event type not found")
    
    # Check if event type is in use
    if any(event["type"] == type_name for event in timeline["events"]):
        raise HTTPException(status_code=400, detail="Cannot delete event type that is in use")
    
    # Remove the event type
    timeline["event_types"] = [et for et in timeline["event_types"] if et["name"] != type_name]
    save_timeline(timeline)
    return {"message": "Event type deleted successfully"} 