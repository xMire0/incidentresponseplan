using Application.Commands;
using Application.Queries;
using Application.Common;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class QuestionController : BaseApiController
{

    //List of questions

    [HttpGet]
    public async Task<ActionResult<List<Question>>> GetQuestions([FromQuery] string? search)
    {
        return await Mediator.Send(new GetQuestionList.Query { Search = search });
    }

    //Specific question

    [HttpGet("{id}")]

    public async Task<ActionResult<Question>> GetQuestionDetails(string id)
    {

        var question = await Mediator.Send(new GetQuestionDetails.Query { Id = id });

        if (question is null)
            return NotFound();

        return Ok(question);
    }



    [HttpPost]
    public async Task<ActionResult<string>> CreateQuestion([FromBody] CreateQuestion.Command command)
    {
        var questionId = await Mediator.Send(command);
        return Ok(questionId); 
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