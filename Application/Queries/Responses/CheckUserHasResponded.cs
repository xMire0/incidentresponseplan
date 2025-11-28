using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class CheckUserHasResponded
{
    public class Query : IRequest<bool>
    {
        public Guid IncidentId { get; set; }
        public string? UserEmail { get; set; }
        public Guid? UserId { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Query, bool>
    {
        public async Task<bool> Handle(Query request, CancellationToken cancellationToken)
        {
            // Check by UserId first (most reliable)
            if (request.UserId.HasValue && request.UserId.Value != Guid.Empty)
            {
                var hasResponses = await context.Responses
                    .AnyAsync(r => r.IncidentId == request.IncidentId && r.UserId == request.UserId.Value, cancellationToken);
                
                if (hasResponses) return true;
            }

            // Fallback: Check by email if UserId not provided
            if (!string.IsNullOrWhiteSpace(request.UserEmail))
            {
                var user = await context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.UserEmail, cancellationToken);
                
                if (user != null)
                {
                    var hasResponses = await context.Responses
                        .AnyAsync(r => r.IncidentId == request.IncidentId && r.UserId == user.Id, cancellationToken);
                    
                    if (hasResponses) return true;
                }
            }

            return false;
        }
    }
}

