using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands.Responses;

public class DeleteResponse
{
    public class Command : IRequest
    {
        public required string Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {

            var response = await context.Responses.FindAsync([request.Id], cancellationToken) ?? throw new Exception("Response not found");

            context.Remove(response);

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
