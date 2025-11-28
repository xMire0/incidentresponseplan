using Application.Commands;
using Application.Common;
using Application.Queries;

using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
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

    [HttpPost]
    public async Task<ActionResult<string>> CreateAnswerOption([FromBody] CreateAnswerOption.Command command)
    {
        var id = await Mediator.Send(command);
        return Ok(id);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditAnswerOption(Guid id, [FromBody] EditAnswerOption.Command command)
    {
        command.Id = id;
        await Mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteAnswerOption(Guid id)
    {
        await Mediator.Send(new DeleteAnswerOption.Command { Id = id });
        return NoContent();
    }
}