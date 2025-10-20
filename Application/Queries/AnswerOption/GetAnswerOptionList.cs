using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetAnswerOptionList
{

    public class Query : IRequest<List<AnswerOption>> { }
        

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<AnswerOption>>
    {
        public async Task<List<AnswerOption>> Handle(Query request, CancellationToken cancellationToken)
        {

            return await context.AnswerOptions.ToListAsync(cancellationToken);
            
        }

    }



}
