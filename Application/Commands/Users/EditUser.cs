using Application.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class EditUser
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public Guid? RoleId { get; set; }
        public Guid? DepartmentId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)
        {
            var user = await context.Users.FindAsync([request.Id], cancellationToken)
                ?? throw new Exception("User not found");

            if (!string.IsNullOrWhiteSpace(request.Username))
                user.Username = request.Username;

            if (request.Email != null)
                user.Email = request.Email;

            if (!string.IsNullOrWhiteSpace(request.Password))
                user.PasswordHash = PasswordHasher.HashPassword(request.Password);

            if (request.RoleId.HasValue)
                user.RoleId = request.RoleId.Value;

            if (request.DepartmentId.HasValue)
                user.DepartmentId = request.DepartmentId.Value;
            else if (request.DepartmentId == Guid.Empty)
                user.DepartmentId = null; // Allow clearing department

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}

