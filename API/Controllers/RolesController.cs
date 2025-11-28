using System.Collections.Generic;
using Application.Queries;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize]
public class RolesController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<Role>>> GetRoles()
    {
        var roles = await Mediator.Send(new GetRolesList.Query());
        return Ok(roles);
    }
}

