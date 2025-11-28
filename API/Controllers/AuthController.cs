using Application.Commands;
using Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace API.Controllers;

[Route("api/auth")]
[ApiController]
public class AuthController : BaseApiController
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<Login.LoginResponseDto>> Login([FromBody] Login.Command command)
    {
        try
        {
            var result = await Mediator.Send(command);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new { message = ex.Message });
        }
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<GetCurrentUser.UserDto>> GetCurrentUser()
    {
        var user = await Mediator.Send(new GetCurrentUser.Query { User = User });
        
        if (user == null)
            return Unauthorized(new { message = "User not found" });

        return Ok(user);
    }
}

