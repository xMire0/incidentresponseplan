using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetEvaluationsByIncident
{
    public class Query : IRequest<List<Evaluation>>
    {
        public Guid IncidentId { get; set; }
    }
    
    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Evaluation>>
    {
        public async Task<List<Evaluation>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Evaluations
                .Include(e => e.Incident)
                    .ThenInclude(i => i.Scenario)
                .Where(e => e.IncidentId == request.IncidentId)
                .ToListAsync(cancellationToken);
        }
    }
}

