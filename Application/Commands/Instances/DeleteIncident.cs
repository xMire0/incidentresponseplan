using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class DeleteIncident
{
    public class Command : IRequest
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {

        public async Task Handle(Command request, CancellationToken cancellationToken)
        {

            var incident = await context.Incidents.FindAsync([request.Id], cancellationToken) ?? throw new Exception("Incident not found");

            context.Remove(incident);

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
