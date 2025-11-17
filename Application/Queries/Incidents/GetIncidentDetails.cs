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
                    .ThenInclude(s => s.Questions)
                        .ThenInclude(q => q.AnswerOptions)
                .Include(i => i.Scenario)
                    .ThenInclude(s => s.Questions)
                        .ThenInclude(q => q.QuestionRoles)
                            .ThenInclude(qr => qr.Role)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Question)
                        .ThenInclude(q => q.AnswerOptions)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.AnswerOption)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.User)
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role)
                .FirstOrDefaultAsync(i => i.Id == guid, cancellationToken);
        }
    }
}
