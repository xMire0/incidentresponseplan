using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetEvaluationList
{

    public class Query : IRequest<List<Evaluation>> { }
        

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Evaluation>>
    {
        public async Task<List<Evaluation>> Handle(Query request, CancellationToken cancellationToken)
        {

            return await context.Evaluations.ToListAsync(cancellationToken);
        }

    }



}
