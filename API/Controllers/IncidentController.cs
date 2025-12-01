using Application.Commands;
using Application.Common;
using Application.Queries;

using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[Authorize]
public class IncidentController : BaseApiController
{

    [HttpGet]
    
    public async Task<ActionResult<List<Incident>>> GetQuestions()
    {
        // Extract RoleId from JWT claims
        var roleIdClaim = User.FindFirst("RoleId")?.Value;
        Guid? userRoleId = null;
        if (!string.IsNullOrEmpty(roleIdClaim) && Guid.TryParse(roleIdClaim, out var roleId))
        {
            userRoleId = roleId;
        }

        return await Mediator.Send(new GetIncidentsList.Query 
        { 
            UserRoleId = userRoleId
        });
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Incident>> GetIncidentDetails(string id)
    {
        // Extract RoleId from JWT claims
        var roleIdClaim = User.FindFirst("RoleId")?.Value;
        Guid? userRoleId = null;
        if (!string.IsNullOrEmpty(roleIdClaim) && Guid.TryParse(roleIdClaim, out var roleId))
        {
            userRoleId = roleId;
        }

        var incident = await Mediator.Send(new GetIncidentDetails.Query 
        { 
            Id = id,
            UserRoleId = userRoleId
        });

        if (incident is null)
            return NotFound();

        return Ok(incident);
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateIncident([FromBody] CreateIncident.Command command)
    {
        var incidentId = await Mediator.Send(command);
        return Ok(incidentId); 
    }

    [HttpGet("results")]
    public async Task<ActionResult<List<GetIncidentResults.IncidentResultDto>>> GetIncidentResults()
    {
        return await Mediator.Send(new GetIncidentResults.Query());
    }

    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteIncident(Guid id)
    {
        await Mediator.Send(new DeleteIncident.Command { Id = id });
        return Ok();
    }

    

    [HttpPut("{id}")]
    public async Task<IActionResult> EditIncident(Guid id, [FromBody] EditIncident.Command command)
    {
        command.Id = id;

        await Mediator.Send(command);
        return NoContent();
    }
}