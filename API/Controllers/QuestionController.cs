using Application.Commands;
using Application.Commands;
using Application.Queries;
using Application.Common;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class QuestionController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<Question>>> GetQuestions()
    {
        return await Mediator.Send(new GetQuestionList.Query());
    }


    [HttpPost]

    public async Task<ActionResult<string>> CreateQuestion(Question question)
    {
        return await Mediator.Send(new CreateQuestion.Command { Question = question });

    }

    [HttpDelete("{id}")]

    public async Task<IActionResult> DeleteQuestion(Guid id)
    {
        await Mediator.Send(new DeleteQuestion.Command { Id = id });
        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditQuestion(Guid id, [FromBody] EditQuestion.Command command)
    {
        command.Id = id;

        await Mediator.Send(command);
        return NoContent();
    }


}