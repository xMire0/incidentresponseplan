using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Queries;

public class GetQuestionDetails
{
    // Query
    public class Query : IRequest<Question?>
    {
        public string Id { get; set; } = null!;
    }

    // Handler
    public class Handler(AppDbContext context) : IRequestHandler<Query, Question?>
    {
        public async Task<Question?> Handle(Query request, CancellationToken cancellationToken)
        {
            if (!Guid.TryParse(request.Id, out var guid))
                return null; // or throw new BadRequestException

            return await context.Questions
                .Include(q => q.QuestionRoles)          // eager load roles
                .ThenInclude(qr => qr.Role)             // if you have Role entity
                .FirstOrDefaultAsync(q => q.Id == guid, cancellationToken);
        }
    }
}
