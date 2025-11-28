using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class EditDepartment
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string? Name { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var department = await context.Departments.FindAsync([request.Id], cancellationToken)
                ?? throw new Exception("Department not found");

            if (!string.IsNullOrWhiteSpace(request.Name))
                department.Name = request.Name;

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

