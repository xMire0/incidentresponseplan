using Application.Commands;
using Application.Common;
using Application.Queries;

using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class IncidentController : BaseApiController
{

    [HttpGet]
    
    public async Task<ActionResult<List<Incident>>> GetQuestions()
    {
        return await Mediator.Send(new GetIncidentsList.Query());
    }
    [HttpPost]

    public async Task<ActionResult<string>> CreateIncident(Incident incident)
    {
        return await Mediator.Send(new CreateIncident.Command { Incident = incident });

    }

    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteIncident(string id)
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