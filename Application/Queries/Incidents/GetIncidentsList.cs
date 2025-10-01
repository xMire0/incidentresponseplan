using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetIncidentsList
{
    public class Query : IRequest<List<Incident>> { }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Incident>>
    {
        public async Task<List<Incident>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Incidents
                .Include(i => i.Scenario)                  // load related Scenario
                .Include(i => i.Responses)                 // load related Responses
                    .ThenInclude(r => r.Question)          // load Question for each Response
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role)              // load Role for each Response
                .ToListAsync(cancellationToken);
        }
    }
}
