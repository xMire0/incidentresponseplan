using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

    public class GetScenariosList
    {

        public class Query : IRequest<List<Scenario>> { }
        

        public class Handler(AppDbContext context) : IRequestHandler<Query, List<Scenario>>
        {
        public async Task<List<Scenario>> Handle(Query request, CancellationToken cancellationToken)
        {
            return await context.Scenarios
                .AsNoTracking()
                .Include(s => s.Questions)
                    .ThenInclude(q => q.AnswerOptions)
                .Include(s => s.Questions)
                    .ThenInclude(q => q.QuestionRoles)
                        .ThenInclude(qr => qr.Role)
                .Include(s => s.Incidents)
                .ToListAsync(cancellationToken);
        }

        }



    }
