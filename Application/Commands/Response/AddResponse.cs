using Domain.Entities;
using MediatR;
using Persistence;


namespace Application.Commands;

public class AddResponse
{
    public class Command : IRequest<string>
    {
        public required Response Response { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            context.Responses.Add(request.Response);

            await context.SaveChangesAsync(cancellationToken);
            return request.Response.Id.ToString();

        }
    }
}
