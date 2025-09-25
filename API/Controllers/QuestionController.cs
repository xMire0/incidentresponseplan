using Application.Commands;
using Application.Common;
using Application.Scenarios.Commands;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class QuestionController : BaseApiController
{
    [HttpPost]

    public async Task<ActionResult<string>> CreateQuestion(Question question)
    {
        return await Mediator.Send(new CreateQuestion.Command { Question = question });

    }

}