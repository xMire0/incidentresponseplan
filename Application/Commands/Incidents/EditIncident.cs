using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;


namespace Application.Commands;

public class EditIncident
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public IncidentStatus Status { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var incident = await context.Incidents.FindAsync([request.Id], cancellationToken)
                           ?? throw new Exception("Incident not found");

            incident.Status = request.Status;
            incident.CompletedAt = request.CompletedAt;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
