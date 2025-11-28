using Application.Commands;
using Application.Common;
using Domain.Entities;
using Application.Queries;

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[Authorize]
public class ResponseController : BaseApiController
{
    private Guid? GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst("UserId")?.Value 
            ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            return null;
        
        return userId;
    }

    [HttpGet]

    public async Task<ActionResult<List<Response>>> GetResponsesList()
    {
        return await Mediator.Send(new GetResponsesList.Query());
    }
    [HttpPost]

    public async Task<ActionResult<string>> CreateResponse(Response response)
    {
        return await Mediator.Send(new CreateResponse.Command { Response = response });

    }

    [HttpPost("bulk")]
    public async Task<ActionResult<int>> CreateResponsesBulk([FromBody] CreateResponsesBulk.Command command)
    {
        // Set UserId from JWT claims if not provided
        var currentUserId = GetCurrentUserId();
        if (currentUserId.HasValue)
        {
            foreach (var response in command.Responses)
            {
                if (!response.UserId.HasValue || response.UserId.Value == Guid.Empty)
                {
                    response.UserId = currentUserId.Value;
                }
            }
        }
        
        var count = await Mediator.Send(command);
        return Ok(new { createdCount = count });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResponse(Guid id)
    {
        await Mediator.Send(new DeleteResponse.Command { Id = id });
        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditResponse(Guid id, [FromBody] Response response)
    {
        var command = new EditResponse.Command 
        { 
            Id = id, 
            Response = response 
        };
        await Mediator.Send(command);
        return NoContent();
    }

    [HttpGet("check/{incidentId}")]
    public async Task<ActionResult<bool>> CheckUserHasResponded(
        Guid incidentId, 
        [FromQuery] string? userEmail, 
        [FromQuery] Guid? userId)
    {
        // Prioritize UserId from JWT claims
        var currentUserId = GetCurrentUserId();
        var userIdToUse = currentUserId ?? userId;
        
        var hasResponded = await Mediator.Send(new CheckUserHasResponded.Query
        {
            IncidentId = incidentId,
            UserEmail = userEmail,
            UserId = userIdToUse
        });
        return Ok(hasResponded);
    }

}