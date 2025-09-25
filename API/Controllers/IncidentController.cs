using Application.Commands;
using Application.Common;
using Application.Scenarios.Commands;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class IncidentController : BaseApiController
{
    [HttpPost]

    public async Task<ActionResult<string>> CreateIncident(Incident incident)
    {
        return await Mediator.Send(new CreateIncident.Command { Incident = incident });

    }

}