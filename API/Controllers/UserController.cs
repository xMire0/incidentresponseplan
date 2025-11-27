using Application.Commands;
using Application.Common;
using Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

public class UserController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<GetUsersList.UserDto>>> GetUsers()
    {
        return await Mediator.Send(new GetUsersList.Query());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<GetUserDetails.UserDetailsDto>> GetUserDetails(string id)
    {
        if (!Guid.TryParse(id, out var guid))
            return BadRequest("Invalid user ID");

        var user = await Mediator.Send(new GetUserDetails.Query { Id = guid });
        if (user == null)
            return NotFound();

        return Ok(user);
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateUser([FromBody] CreateUser.Command command)
    {
        var userId = await Mediator.Send(command);
        return Ok(userId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditUser(Guid id, [FromBody] EditUser.Command command)
    {
        command.Id = id;
        await Mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        await Mediator.Send(new DeleteUser.Command { Id = id });
        return Ok();
    }
}

