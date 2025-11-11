using System;
using System.Linq;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetIncidentsList
{
    public class Query : IRequest<List<Incident>>
    {
        public string? Status { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Incident>>
    {
        public async Task<List<Incident>> Handle(Query request, CancellationToken cancellationToken)
        {
            IQueryable<Incident> queryable = context.Incidents
                .Include(i => i.Scenario)                  // load related Scenario
                    .ThenInclude(s => s.Questions)
                        .ThenInclude(q => q.AnswerOptions)
                .Include(i => i.Scenario)
                    .ThenInclude(s => s.Questions)
                        .ThenInclude(q => q.QuestionRoles)
                            .ThenInclude(qr => qr.Role)
                .Include(i => i.Responses)                 // load related Responses
                    .ThenInclude(r => r.Question)          // load Question for each Response
                .Include(i => i.Responses)
                    .ThenInclude(r => r.Role);              // load Role for each Response

            if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<IncidentStatus>(request.Status, true, out var status))
            {
                queryable = queryable.Where(i => i.Status == status);
            }

            return await queryable.ToListAsync(cancellationToken);
        }
    }
}
