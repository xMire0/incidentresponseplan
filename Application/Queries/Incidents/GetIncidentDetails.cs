using System.Linq;
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
        public Guid? UserRoleId { get; set; }
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
            var incident = await context.Incidents
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

            // Filter questions based on user role
            if (incident?.Scenario != null)
            {
                if (request.UserRoleId.HasValue)
                {
                    // User has a role: show questions without roles OR questions matching user's role
                    incident.Scenario.Questions = incident.Scenario.Questions
                        .Where(q => q.QuestionRoles.Count == 0 || 
                                   q.QuestionRoles.Any(qr => qr.RoleId == request.UserRoleId.Value))
                        .ToList();
                }
                else
                {
                    // User has no role: only show questions without roles
                    incident.Scenario.Questions = incident.Scenario.Questions
                        .Where(q => q.QuestionRoles.Count == 0)
                        .ToList();
                }
            }

            return incident;
        }
    }
}
