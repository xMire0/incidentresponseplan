using Application.Commands;
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

    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteScenario(string id)
    {
        await Mediator.Send(new DeleteScenario.Command { Id = id });
        return Ok();
    }


}