using Application.Commands;
using Application.Common;
using Domain.Entities;
using Application.Queries;

using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ResponseController : BaseApiController
{

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

}