using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;
using System.Security.Claims;

namespace Application.Queries;

public class GetCurrentUser
{
    public class Query : IRequest<UserDto?>
    {
        public ClaimsPrincipal? User { get; set; }
    }

    public class Handler : IRequestHandler<Query, UserDto?>
    {
        private readonly AppDbContext _context;

        public Handler(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserDto?> Handle(Query request, CancellationToken cancellationToken)
        {
            if (request.User == null)
                return null;

            var userIdClaim = request.User.FindFirst("UserId")?.Value 
                ?? request.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                return null;

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null)
                return null;

            return new UserDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                Username = user.Username,
                Role = user.Role.Name,
                RoleId = user.RoleId
            };
        }
    }

    public class UserDto
    {
        public Guid Id { get; set; }
        public required string Email { get; set; }
        public required string Username { get; set; }
        public required string Role { get; set; }
        public Guid RoleId { get; set; }
    }
}

