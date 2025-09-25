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

}