using MediatR;
using Persistence;

namespace Application.Commands;

public class DeleteUser
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await context.Users.FindAsync([request.Id], cancellationToken)
                ?? throw new Exception("User not found");

            context.Users.Remove(user);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

