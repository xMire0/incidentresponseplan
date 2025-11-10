using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Linq;

namespace Application.Queries;

public class GetQuestionList
{

    public class Query : IRequest<List<Question>>
    {
        public string? Search { get; set; }
    }
        

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Question>>
    {
        public async Task<List<Question>> Handle(Query request, CancellationToken cancellationToken)
        {

            IQueryable<Question> queryable = context.Questions
                .AsNoTracking()
                .Include(q => q.AnswerOptions)
                .Include(q => q.QuestionRoles)
                    .ThenInclude(qr => qr.Role);

            if (!string.IsNullOrWhiteSpace(request.Search))
            {
                var term = request.Search.Trim().ToLower();
                queryable = queryable.Where(q => q.Text.ToLower().Contains(term));
            }

            return await queryable
                .OrderBy(q => q.Text)
                .ToListAsync(cancellationToken);
            
        }

    }



}
