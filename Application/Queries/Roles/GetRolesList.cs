using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetRolesList
{
    public class Query : IRequest<List<Role>>
    {
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Role>>
    {
        public async Task<List<Role>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Roles
                .AsNoTracking()
                .OrderBy(r => r.Name)
                .ToListAsync(cancellationToken);
        }
    }
}

