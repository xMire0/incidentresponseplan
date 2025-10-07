using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetQuestionDetails
{
    // Query
    public class Query : IRequest<Scenario?>
    {
        public string Id { get; set; } = null!;
    }

    // Handler
    public class Handler(AppDbContext context) : IRequestHandler<Query, Scenario?>
    {
        public async Task<Scenario?> Handle(Query request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(request.Id, out var guid))
                return null; // or throw new BadRequestException

            return await context.Scenarios
                .FirstOrDefaultAsync(q => q.Id == guid, cancellationToken);
        }
    }
}