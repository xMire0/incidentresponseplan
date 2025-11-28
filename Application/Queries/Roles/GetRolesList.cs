using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetRolesList
{
    public class Query : IRequest<List<RoleDto>> { }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<RoleDto>>
    {
        public async Task<List<RoleDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var roles = await context.Roles
                .Include(r => r.Users)
                .OrderBy(r => r.Name)
                .ToListAsync(cancellationToken);

            return roles.Select(r => new RoleDto
            {
                Id = r.Id,
                Name = r.Name,
                SecurityClearence = r.SecurityClearence,
                UserCount = r.Users.Count
            }).ToList();
        }
    }

    public class RoleDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public Domain.Enum.SecurityClearence SecurityClearence { get; set; }
        public int UserCount { get; set; }
    }
}
