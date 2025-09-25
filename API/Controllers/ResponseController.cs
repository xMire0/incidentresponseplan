using Application.Commands;
using Application.Common;
using Application.Scenarios.Commands;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class ResponseController : BaseApiController
{
    [HttpPost]

    public async Task<ActionResult<string>> CreateResponse(Response response)
    {
        return await Mediator.Send(new CreateResponse.Command { Response = response });

    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteResponse(string id)
    {
        await Mediator.Send(new DeleteResponse.Command { Id = id });
        return Ok();
    }


}