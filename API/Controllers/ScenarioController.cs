using Application.Common;
using Application.Scenarios.Commands;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ScenariosController : BaseApiController
{
    [HttpPost]

    public async Task<ActionResult<string>> CreateScenario(Scenario scenario)
    {
        return await Mediator.Send(new CreateScenario.Command { Scenario = scenario });

    }

}