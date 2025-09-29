using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetResponsesList
{

    public class Query : IRequest<List<Response>> { }
        

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Response>>
    {
        public async Task<List<Response>> Handle(Query request, CancellationToken cancellationToken)
        {

            return await context.Responses.ToListAsync(cancellationToken);
        }

    }



}
