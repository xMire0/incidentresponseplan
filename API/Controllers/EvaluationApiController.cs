using Application.Commands;
using Application.Common;
using Application.Queries;

using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
public class EvaluationController : BaseApiController
{

    [HttpGet]
    
    public async Task<ActionResult<List<Evaluation>>> GetQuestions()
    {
        return await Mediator.Send(new GetEvaluationList.Query());
    }

    [HttpGet("incident/{incidentId}")]
    public async Task<ActionResult<List<Evaluation>>> GetEvaluationsByIncident(Guid incidentId)
    {
        return await Mediator.Send(new GetEvaluationsByIncident.Query { IncidentId = incidentId });
    }
   
}