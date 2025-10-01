using Application.Commands;
using Application.Common;
using Application.Queries;

using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class EvaluationController : BaseApiController
{

    [HttpGet]
    
    public async Task<ActionResult<List<Evaluation>>> GetQuestions()
    {
        return await Mediator.Send(new GetEvaluationList.Query());
    }
   
}