using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetScenarioDetails
{
    public class Query : IRequest<Scenario?>
    {
        public string Id { get; set; } = null!;
    }
    
    public class Handler(AppDbContext context) : IRequestHandler<Query, Scenario?>
    {
        public async Task<Scenario?> Handle(Query request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(request.Id, out var guid))
                return null;
            
            return await context.Scenarios
                .AsNoTracking()
                .Include(s => s.Questions)
                    .ThenInclude(q => q.AnswerOptions)
                .Include(s => s.Questions)
                    .ThenInclude(q => q.QuestionRoles)
                        .ThenInclude(qr => qr.Role)
                .Include(s => s.Incidents)
                    .ThenInclude(i => i.Responses)
                .FirstOrDefaultAsync(s => s.Id == guid, cancellationToken);
        }
    }
}

