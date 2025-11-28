using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetUsersList
{
    public class Query : IRequest<List<UserDto>>
    {
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<UserDto>>
    {
        public async Task<List<UserDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Users
                .Include(u => u.Role)
                .Include(u => u.Department)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    RoleId = u.RoleId,
                    RoleName = u.Role.Name,
                    DepartmentId = u.DepartmentId,
                    DepartmentName = u.Department != null ? u.Department.Name : null
                })
                .ToListAsync(cancellationToken);
        }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? Email { get; set; }
        public Guid RoleId { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
    }
}

