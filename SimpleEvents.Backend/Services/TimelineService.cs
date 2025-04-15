using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using SimpleEvents.Backend.Models;
using Microsoft.AspNetCore.Hosting;

namespace SimpleEvents.Backend.Services
{
    public interface ITimelineService
    {
        List<Timeline> GetAllTimelines();
        Timeline? GetTimeline(string id);
        Timeline CreateTimeline(Timeline timeline);
        Timeline UpdateTimeline(string id, Timeline timeline);
        void DeleteTimeline(string id);
        Event CreateEvent(string timelineId, Event @event);
        Event UpdateEvent(string timelineId, string eventId, Event @event);
        void DeleteEvent(string timelineId, string eventId);
        EventType CreateEventType(string timelineId, EventType eventType);
        EventType UpdateEventType(string timelineId, string typeName, EventType eventType);
        void DeleteEventType(string timelineId, string typeName);
    }

    public class TimelineService : ITimelineService
    {
        private readonly string dataDirectory;

        public TimelineService(IWebHostEnvironment env)
        {
            dataDirectory = Path.Combine(env.ContentRootPath, "data");
            Directory.CreateDirectory(dataDirectory);
        }

        private string GetTimelinePath(string id) => Path.Combine(dataDirectory, $"{id}.json");

        public List<Timeline> GetAllTimelines()
        {
            var timelines = new List<Timeline>();
            foreach (var file in Directory.GetFiles(dataDirectory, "*.json"))
            {
                var json = File.ReadAllText(file);
                var timeline = JsonSerializer.Deserialize<Timeline>(json);
                if (timeline != null)
                {
                    timelines.Add(timeline);
                }
            }
            return timelines;
        }

        public Timeline? GetTimeline(string id)
        {
            var path = GetTimelinePath(id);
            if (!File.Exists(path))
            {
                return null;
            }

            var json = File.ReadAllText(path);
            return JsonSerializer.Deserialize<Timeline>(json);
        }

        public Timeline CreateTimeline(Timeline timeline)
        {
            timeline.Id = Guid.NewGuid().ToString();
            timeline.CreatedAt = timeline.CreatedAt == default ? DateTime.UtcNow : timeline.CreatedAt;
            timeline.Events = timeline.Events == null || timeline.Events.Count == 0 ? new List<Event>() : timeline.Events;
            timeline.EventTypes = timeline.EventTypes == null || timeline.EventTypes.Count == 0 ? new List<EventType>() : timeline.EventTypes;

            var path = GetTimelinePath(timeline.Id);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);

            return timeline;
        }

        public Timeline UpdateTimeline(string id, Timeline timeline)
        {
            var existingTimeline = GetTimeline(id);
            if (existingTimeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {id} not found");
            }

            timeline.Id = id;
            timeline.CreatedAt = existingTimeline.CreatedAt;
            timeline.Events = existingTimeline.Events;
            timeline.EventTypes = existingTimeline.EventTypes;

            var path = GetTimelinePath(id);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);

            return timeline;
        }

        public void DeleteTimeline(string id)
        {
            var path = GetTimelinePath(id);
            if (File.Exists(path))
            {
                File.Delete(path);
            }
        }

        public Event CreateEvent(string timelineId, Event @event)
        {
            var timeline = GetTimeline(timelineId);
            if (timeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {timelineId} not found");
            }

            @event.Id = Guid.NewGuid().ToString();
            @event.CreatedAt = DateTime.UtcNow;
            timeline.Events.Add(@event);

            var path = GetTimelinePath(timelineId);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);

            return @event;
        }

        public Event UpdateEvent(string timelineId, string eventId, Event @event)
        {
            var timeline = GetTimeline(timelineId);
            if (timeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {timelineId} not found");
            }

            var existingEvent = timeline.Events.FirstOrDefault(e => e.Id == eventId);
            if (existingEvent == null)
            {
                throw new KeyNotFoundException($"Event with id {eventId} not found");
            }

            @event.Id = eventId;
            @event.CreatedAt = existingEvent.CreatedAt;
            timeline.Events[timeline.Events.IndexOf(existingEvent)] = @event;

            var path = GetTimelinePath(timelineId);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);

            return @event;
        }

        public void DeleteEvent(string timelineId, string eventId)
        {
            var timeline = GetTimeline(timelineId);
            if (timeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {timelineId} not found");
            }

            var eventToRemove = timeline.Events.FirstOrDefault(e => e.Id == eventId);
            if (eventToRemove == null)
            {
                throw new KeyNotFoundException($"Event with id {eventId} not found");
            }

            timeline.Events.Remove(eventToRemove);

            var path = GetTimelinePath(timelineId);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);
        }

        public EventType CreateEventType(string timelineId, EventType eventType)
        {
            var timeline = GetTimeline(timelineId);
            if (timeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {timelineId} not found");
            }

            if (string.IsNullOrWhiteSpace(eventType.Name))
            {
                throw new ArgumentException("Event type name cannot be empty");
            }

            if (timeline.EventTypes.Any(et => et.Name == eventType.Name))
            {
                throw new ArgumentException($"Event type '{eventType.Name}' already exists");
            }

            timeline.EventTypes.Add(eventType);

            var path = GetTimelinePath(timelineId);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);

            return eventType;
        }

        public EventType UpdateEventType(string timelineId, string typeName, EventType eventType)
        {
            var timeline = GetTimeline(timelineId);
            if (timeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {timelineId} not found");
            }

            var existingType = timeline.EventTypes.FirstOrDefault(et => et.Name == typeName);
            if (existingType == null)
            {
                throw new KeyNotFoundException($"Event type '{typeName}' not found");
            }

            if (eventType.Name != typeName && timeline.EventTypes.Any(et => et.Name == eventType.Name))
            {
                throw new ArgumentException($"Event type '{eventType.Name}' already exists");
            }

            // Update all events that reference this type
            foreach (var @event in timeline.Events.Where(e => e.Type == typeName))
            {
                @event.Type = eventType.Name;
            }

            existingType.Name = eventType.Name;
            existingType.Color = eventType.Color;

            var path = GetTimelinePath(timelineId);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);

            return existingType;
        }

        public void DeleteEventType(string timelineId, string typeName)
        {
            var timeline = GetTimeline(timelineId);
            if (timeline == null)
            {
                throw new KeyNotFoundException($"Timeline with id {timelineId} not found");
            }

            var eventType = timeline.EventTypes.FirstOrDefault(et => et.Name == typeName);
            if (eventType == null)
            {
                throw new KeyNotFoundException($"Event type '{typeName}' not found");
            }

            if (timeline.Events.Any(e => e.Type == typeName))
            {
                throw new InvalidOperationException("Cannot delete event type that is in use");
            }

            timeline.EventTypes.Remove(eventType);

            var path = GetTimelinePath(timelineId);
            var json = JsonSerializer.Serialize(timeline, new JsonSerializerOptions { WriteIndented = true });
            File.WriteAllText(path, json);
        }
    }
} 