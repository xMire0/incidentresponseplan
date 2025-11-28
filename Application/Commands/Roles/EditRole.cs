using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class EditRole
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
        public SecurityClearence? SecurityClearence { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var role = await context.Roles.FindAsync([request.Id], cancellationToken)
                ?? throw new Exception("Role not found");

            if (!string.IsNullOrWhiteSpace(request.Name))
                role.Name = request.Name;

            if (request.SecurityClearence.HasValue)
                role.SecurityClearence = request.SecurityClearence.Value;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

