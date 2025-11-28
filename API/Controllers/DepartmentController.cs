using Application.Commands;
using Application.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace API.Controllers;

[Authorize(Roles = "Admin")]
[Route("api/department")]
[ApiController]
public class DepartmentController : BaseApiController
{
    [HttpGet]
    public async Task<ActionResult<List<GetDepartmentsList.DepartmentDto>>> GetDepartments()
    {
        return await Mediator.Send(new GetDepartmentsList.Query());
    }

    [HttpPost]
    public async Task<ActionResult<string>> CreateDepartment([FromBody] CreateDepartment.Command command)
    {
        var departmentId = await Mediator.Send(command);
        return Ok(departmentId);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditDepartment(Guid id, [FromBody] EditDepartment.Command command)
    {
        command.Id = id;
        await Mediator.Send(command);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(Guid id)
    {
        await Mediator.Send(new DeleteDepartment.Command { Id = id });
        return Ok();
    }
}

