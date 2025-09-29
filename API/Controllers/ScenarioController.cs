using Application.Commands;
using Application.Common;
using Domain.Entities;
using Application.Queries;

using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ScenariosController : BaseApiController
{

    [HttpGet]

    public async Task<ActionResult<List<Scenario>>> GetScenariosList()
    {
        return await Mediator.Send(new GetScenariosList.Query());
    }
    [HttpPost]

    public async Task<ActionResult<string>> CreateScenario(Scenario scenario)
    {
        return await Mediator.Send(new CreateScenario.Command { Scenario = scenario });

    }

    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteScenario(Guid id)
    {
        await Mediator.Send(new DeleteScenario.Command { Id = id });
        return Ok();
    }

    
    [HttpPut("{id}")]
    public async Task<IActionResult> EditScenario(Guid id, [FromBody] EditScenario.Command command)
    {
        command.Id = id;

        await Mediator.Send(command);
        return NoContent();
    }


}