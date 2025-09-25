using System.Data.Common;
using Domain;
using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Scenarios.Commands;

public class CreateScenario
{
    public class Command : IRequest<string>
    {

        public required Scenario Scenario { get; set; }

    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            context.Scenarios.Add(request.Scenario);

            await context.SaveChangesAsync(cancellationToken);
            return request.Scenario.Id.ToString();

        }
    }
}
