using Application.Common;
using Application.Queries;
using Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace API.Controllers;

[Authorize]
public class RoleController : BaseApiController
{
    private readonly AppDbContext _context;

    public RoleController(IMediator mediator, AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Role>>> GetRoles()
    {
        var roles = await _context.Roles.ToListAsync();
        return Ok(roles);
    }
}

