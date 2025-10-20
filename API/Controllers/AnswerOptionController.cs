using Application.Commands;
using Application.Common;
using Application.Queries;

using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class AnswerOptionController : BaseApiController
{


    [HttpGet]
    public async Task<ActionResult<List<AnswerOption>>> GetAnswerOption()
    {
        return await Mediator.Send(new GetAnswerOptionList.Query());
    }


    [HttpGet("{id}")]

    public async Task<ActionResult<Question>> GetAnswerOptionDetails(Guid id)
    {

        var answeroption = await Mediator.Send(new GetAnswerOptionDetails.Query { Id = id });

        if ( answeroption is null)
            return NotFound();

        return Ok(answeroption);
    }
}