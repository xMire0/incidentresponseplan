using Application.Commands.Scenarios;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace Api.Controllers;

public class ScenarioController : ControllerBase
{

    [HttpPost]

    public async Task<ActionResult<string>> CreateScenario(Scenario scenario)
    {
        return await Mediator.Send(new CreateScenarioCommand {Title, Risk = scenario.Risk, Description = scenario.Description });
     
    }

}
