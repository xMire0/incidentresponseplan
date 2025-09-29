using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class CreateIncident
{
    public class Command : IRequest<string>
    {
        public required Incident Incident { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            context.Incidents.Add(request.Incident);

            await context.SaveChangesAsync(cancellationToken);
            return request.Incident.Id.ToString();

        }
    }
}
