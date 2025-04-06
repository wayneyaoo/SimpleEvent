import json
import os
from pathlib import Path
from typing import List, Optional
from .models import Timeline

class Storage:
    def __init__(self, base_dir: str = "data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

    def _get_timeline_path(self, timeline_id: str) -> Path:
        return self.base_dir / f"{timeline_id}.json"

    def save_timeline(self, timeline: Timeline) -> None:
        path = self._get_timeline_path(timeline.id)
        with open(path, "w") as f:
            json.dump(timeline.model_dump(), f, indent=2, default=str)

    def load_timeline(self, timeline_id: str) -> Optional[Timeline]:
        path = self._get_timeline_path(timeline_id)
        if not path.exists():
            return None
        with open(path) as f:
            data = json.load(f)
            return Timeline(**data)

    def delete_timeline(self, timeline_id: str) -> bool:
        path = self._get_timeline_path(timeline_id)
        if path.exists():
            path.unlink()
            return True
        return False

    def list_timelines(self) -> List[Timeline]:
        timelines = []
        for path in self.base_dir.glob("*.json"):
            with open(path) as f:
                data = json.load(f)
                timelines.append(Timeline(**data))
        return timelines 