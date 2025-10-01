using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetIncidentDetails
{
    // Query
    public class Query : IRequest<Incident?>
    {
        public string Id { get; set; } = null!;
    }

    // Handler
    public class Handler(AppDbContext context) : IRequestHandler<Query, Incident?>
    {
        public async Task<Incident?> Handle(Query request, CancellationToken cancellationToken)
        {
            // Convert string → Guid safely
            if (!Guid.TryParse(request.Id, out var guid))
                return null; // later you can throw BadRequestException

            // Query Incident + Scenario + Responses (with their Question & Role)
            return await context.Incidents
                .Include(i => i.Scenario)                    // load Scenario
                .Include(i => i.Responses)                   // load Responses
                    .ThenInclude(r => r.Question)            // include Question inside Response
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role)                // include Role inside Response
                .FirstOrDefaultAsync(i => i.Id == guid, cancellationToken);
        }
    }
}
