using Domain.Entities;
using Domain.Enum;
using MediatR;
using Persistence;

namespace Application.Commands;

public class CreateRole
{
    public class Command : IRequest<string>
    {
        public required string Name { get; set; }
        public SecurityClearence SecurityClearence { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var role = new Role
            {
                Name = request.Name,
                SecurityClearence = request.SecurityClearence
            };

            context.Roles.Add(role);
            await context.SaveChangesAsync(cancellationToken);

            return role.Id.ToString();
        }
    }
}

