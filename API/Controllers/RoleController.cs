using Application.Commands;
using Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/role")]
[ApiController]
public class RoleController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<GetRolesList.RoleDto>>> GetRoles()
    {
        return await Mediator.Send(new GetRolesList.Query());
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateRole([FromBody] CreateRole.Command command)
    {
        var roleId = await Mediator.Send(command);
        return Ok(roleId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditRole(Guid id, [FromBody] EditRole.Command command)
    {
        command.Id = id;
        await Mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRole(Guid id)
    {
        await Mediator.Send(new DeleteRole.Command { Id = id });
        return Ok();
    }
}

