from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
import uuid

class EventType(BaseModel):
    name: str
    color: Optional[str] = None

class Event(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str
    time: Optional[datetime] = None
    note: Optional[str] = None

class Timeline(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    event_types: List[EventType] = Field(default_factory=list)
    events: List[Event] = Field(default_factory=list)

    class Config:
        json_schema_extra = {
            "example": {
                "name": "Project Timeline",
                "description": "Tracking project milestones",
                "event_types": [
                    {"name": "Milestone", "color": "#FF0000"},
                    {"name": "Meeting", "color": "#00FF00"}
                ],
                "events": [
                    {
                        "type": "Milestone",
                        "time": "2024-04-06T10:00:00",
                        "note": "Project kickoff"
                    }
                ]
            }
        } 