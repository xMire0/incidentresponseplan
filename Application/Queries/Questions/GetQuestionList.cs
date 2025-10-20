using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetQuestionList
{

    public class Query : IRequest<List<Question>> { }
        

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Question>>
    {
        public async Task<List<Question>> Handle(Query request, CancellationToken cancellationToken)
        {

            return await context.Questions.ToListAsync(cancellationToken);
            
        }

    }



}
