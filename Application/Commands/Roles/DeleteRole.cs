using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class DeleteRole
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var role = await context.Roles
                .Include(r => r.QuestionRoles)
                .Include(r => r.Users)
                .FirstOrDefaultAsync(r => r.Id == request.Id, cancellationToken);

            if (role == null)
                throw new Exception("Role not found");

            // Check if role has users or question associations
            if (role.Users.Any())
                throw new InvalidOperationException("Cannot delete role that has users assigned. Please reassign users first.");

            if (role.QuestionRoles.Any())
                throw new InvalidOperationException("Cannot delete role that is associated with questions. Please remove associations first.");

            context.Roles.Remove(role);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

