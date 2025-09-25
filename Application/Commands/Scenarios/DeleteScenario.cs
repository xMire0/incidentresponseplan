using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class DeleteScenario
{
    public class Command : IRequest
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {

            var scenario = await context.Scenarios.FindAsync([request.Id], cancellationToken) ?? throw new Exception("Scenario not found");

            context.Remove(scenario);

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
