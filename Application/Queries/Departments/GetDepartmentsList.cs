using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetDepartmentsList
{
    public class Query : IRequest<List<DepartmentDto>> { }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<DepartmentDto>>
    {
        public async Task<List<DepartmentDto>> Handle(Query request, CancellationToken cancellationToken)
        {
            var departments = await context.Departments
                .Include(d => d.Users)
                .OrderBy(d => d.Name)
                .ToListAsync(cancellationToken);

            return departments.Select(d => new DepartmentDto
            {
                Id = d.Id,
                Name = d.Name,
                UserCount = d.Users.Count
            }).ToList();
        }
    }

    public class DepartmentDto
    {
        public Guid Id { get; set; }
        public required string Name { get; set; }
        public int UserCount { get; set; }
    }
}

