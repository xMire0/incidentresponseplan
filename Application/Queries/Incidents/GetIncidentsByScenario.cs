using System;
using System.Linq;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetIncidentsByScenario
{
    public class Query : IRequest<List<Incident>>
    {
        public string ScenarioId { get; set; } = null!;
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Incident>>
    {
        public async Task<List<Incident>> Handle(Query request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(request.ScenarioId, out var scenarioGuid))
                return new List<Incident>();

            return await context.Incidents
                .AsNoTracking()
                .Where(i => i.ScenarioId == scenarioGuid)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Question)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role)
                .OrderByDescending(i => i.StartedAt ?? i.CompletedAt ?? DateTime.MinValue)
                .ToListAsync(cancellationToken);
        }
    }
}

