using Microsoft.AspNetCore.Mvc;
using SimpleEvents.Backend.Models;
using SimpleEvents.Backend.Services;

namespace SimpleEvents.Backend.Controllers;

[ApiController]
[Route("api/")]
public class TimelineController : ControllerBase
{
    private readonly ITimelineService timelineService;

    public TimelineController(ITimelineService timelineService)
    {
        this.timelineService = timelineService;
    }

    [HttpGet("timelines")]
    public ActionResult<List<Timeline>> GetTimelines()
    {
        return timelineService.GetAllTimelines();
    }
    
    [HttpGet("timeline/{id}")]
    public ActionResult<Timeline> GetTimeline(string id)
    {
        var timeline = timelineService.GetTimeline(id);
        if (timeline == null)
        {
            return NotFound();
        }

        return timeline;
    }

    [HttpPost("timeline")]
    public ActionResult<Timeline> CreateTimeline(Timeline timeline)
    {
        return timelineService.CreateTimeline(timeline);
    }

    [HttpPut("timeline/{id}")]
    public ActionResult<Timeline> UpdateTimeline(string id, Timeline timeline)
    {
        try
        {
            return timelineService.UpdateTimeline(id, timeline);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("timeline/{id}")]
    public IActionResult DeleteTimeline(string id)
    {
        try
        {
            timelineService.DeleteTimeline(id);
            return Ok(new { message = "Timeline deleted successfully" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("timeline/{timelineId}/events")]
    public ActionResult<Event> CreateEvent(string timelineId, Event @event)
    {
        try
        {
            return timelineService.CreateEvent(timelineId, @event);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("timeline/{timelineId}/events/{eventId}")]
    public ActionResult<Event> UpdateEvent(string timelineId, string eventId, Event @event)
    {
        try
        {
            return timelineService.UpdateEvent(timelineId, eventId, @event);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("timeline/{timelineId}/events/{eventId}")]
    public IActionResult DeleteEvent(string timelineId, string eventId)
    {
        try
        {
            timelineService.DeleteEvent(timelineId, eventId);
            return Ok(new { message = "Event deleted successfully" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("timeline/{timelineId}/event-types")]
    public ActionResult<EventType> CreateEventType(string timelineId, EventType eventType)
    {
        try
        {
            return timelineService.CreateEventType(timelineId, eventType);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpPut("timeline/{timelineId}/event-types/{typeName}")]
    public ActionResult<EventType> UpdateEventType(string timelineId, string typeName, EventType eventType)
    {
        try
        {
            return timelineService.UpdateEventType(timelineId, typeName, eventType);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }

    [HttpDelete("timeline/{timelineId}/event-types/{typeName}")]
    public IActionResult DeleteEventType(string timelineId, string typeName)
    {
        try
        {
            timelineService.DeleteEventType(timelineId, typeName);
            return Ok(new { message = "Event type deleted successfully" });
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { detail = ex.Message });
        }
    }
}