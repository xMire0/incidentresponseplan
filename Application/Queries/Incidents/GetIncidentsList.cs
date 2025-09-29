using System;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetIncidentsList
{

    public class Query : IRequest<List<Incident>> { }
        

    public class Handler(AppDbContext context) : IRequestHandler<Query, List<Incident>>
    {
        public async Task<List<Incident>> Handle(Query request, CancellationToken cancellationToken)
        {

            return await context.Incidents.ToListAsync(cancellationToken);
        }

    }



}
