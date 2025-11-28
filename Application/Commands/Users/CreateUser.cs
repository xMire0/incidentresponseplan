using Application.Common;
using Domain.Entities;
using MediatR;
using Persistence;

namespace Application.Commands;

public class CreateUser
{
    public class Command : IRequest<string>
    {
        public required string Username { get; set; }
        public string? Email { get; set; }
        public string? Password { get; set; }
        public Guid RoleId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var passwordHash = !string.IsNullOrWhiteSpace(request.Password)
                ? PasswordHasher.HashPassword(request.Password)
                : null;

            var user = new User
            {
                Username = request.Username,
                Email = request.Email,
                PasswordHash = passwordHash,
                RoleId = request.RoleId
            };

            context.Users.Add(user);
            await context.SaveChangesAsync(cancellationToken);

            return user.Id.ToString();
        }
    }
}

