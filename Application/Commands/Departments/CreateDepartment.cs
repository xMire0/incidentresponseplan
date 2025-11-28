using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class CreateDepartment
{
    public class Command : IRequest<string>
    {
        public required string Name { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var department = new Department
            {
                Name = request.Name
            };

            context.Departments.Add(department);
            await context.SaveChangesAsync(cancellationToken);

            return department.Id.ToString();
        }
    }
}

