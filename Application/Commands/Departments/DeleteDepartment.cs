using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class DeleteDepartment
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var department = await context.Departments
                .Include(d => d.Users)
                .FirstOrDefaultAsync(d => d.Id == request.Id, cancellationToken);

            if (department == null)
                throw new Exception("Department not found");

            // Check if department has users
            if (department.Users.Any())
                throw new InvalidOperationException("Cannot delete department that has users assigned. Please reassign users first.");

            context.Departments.Remove(department);
            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

