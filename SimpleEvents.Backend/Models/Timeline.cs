using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SimpleEvents.Backend.Models
{
    public class Timeline
    {
        public string Id { get; set; } = string.Empty;

        public string Name { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        [JsonPropertyName("events")]
        public List<Event> Events { get; set; } = new List<Event>();

        [JsonPropertyName("event_types")]
        public List<EventType> EventTypes { get; set; } = new List<EventType>();
    }

    public class Event
    {
        public string Id { get; set; } = string.Empty;
        
        public string Note { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public DateTime Time { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime CreatedAt { get; set; }
    }

    public class EventType
    {
        public string Name { get; set; } = string.Empty;

        public string Color { get; set; } = string.Empty;
    }
} 