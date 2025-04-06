from fastapi import APIRouter, HTTPException
from .models import Timeline, Event, EventType
from .storage import Storage

router = APIRouter()
storage = Storage()

@router.post("/timelines", response_model=Timeline)
async def create_timeline(timeline: Timeline):
    storage.save_timeline(timeline)
    return timeline

@router.get("/timelines", response_model=list[Timeline])
async def list_timelines():
    return storage.list_timelines()

@router.get("/timelines/{timeline_id}", response_model=Timeline)
async def get_timeline(timeline_id: str):
    timeline = storage.load_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    return timeline

@router.put("/timelines/{timeline_id}", response_model=Timeline)
async def update_timeline(timeline_id: str, timeline: Timeline):
    if timeline_id != timeline.id:
        raise HTTPException(status_code=400, detail="Timeline ID mismatch")
    storage.save_timeline(timeline)
    return timeline

@router.delete("/timelines/{timeline_id}")
async def delete_timeline(timeline_id: str):
    if not storage.delete_timeline(timeline_id):
        raise HTTPException(status_code=404, detail="Timeline not found")
    return {"message": "Timeline deleted"}

@router.post("/timelines/{timeline_id}/events", response_model=Event)
async def create_event(timeline_id: str, event: Event):
    timeline = storage.load_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    timeline.events.append(event)
    storage.save_timeline(timeline)
    return event

@router.put("/timelines/{timeline_id}/events/{event_id}", response_model=Event)
async def update_event(timeline_id: str, event_id: str, event: Event):
    timeline = storage.load_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    for i, e in enumerate(timeline.events):
        if e.id == event_id:
            timeline.events[i] = event
            storage.save_timeline(timeline)
            return event
    
    raise HTTPException(status_code=404, detail="Event not found")

@router.delete("/timelines/{timeline_id}/events/{event_id}")
async def delete_event(timeline_id: str, event_id: str):
    timeline = storage.load_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    timeline.events = [e for e in timeline.events if e.id != event_id]
    storage.save_timeline(timeline)
    return {"message": "Event deleted"}

@router.post("/timelines/{timeline_id}/event-types", response_model=EventType)
async def create_event_type(timeline_id: str, event_type: EventType):
    timeline = storage.load_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    timeline.event_types.append(event_type)
    storage.save_timeline(timeline)
    return event_type

@router.put("/timelines/{timeline_id}/event-types/{type_name}", response_model=EventType)
async def update_event_type(timeline_id: str, type_name: str, event_type: EventType):
    timeline = storage.load_timeline(timeline_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found")
    
    for i, et in enumerate(timeline.event_types):
        if et.name == type_name:
            # Update all events using this type
            for event in timeline.events:
                if event.type == type_name:
                    event.type = event_type.name
            timeline.event_types[i] = event_type
            storage.save_timeline(timeline)
            return event_type
    
    raise HTTPException(status_code=404, detail="Event type not found") 