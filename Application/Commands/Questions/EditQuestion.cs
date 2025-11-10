using System.Linq;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class EditQuestion
{
    public class Command : IRequest
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = null!;
        public Priority Priority { get; set; }
        public List<Guid> RoleIds { get; set; } = new();
    }


    public class Handler(AppDbContext context) : IRequestHandler<Command>
    {
        public async Task Handle(Command request, CancellationToken cancellationToken)

        {
            var question = await context.Questions
                .Include(q => q.QuestionRoles)
                .FirstOrDefaultAsync(q => q.Id == request.Id, cancellationToken)
                ?? throw new Exception("Question is not found");

            question.Priority = request.Priority;
            question.Text = request.Text;

            if (request.RoleIds is { Count: > 0 })
            {
                var desired = await context.Roles
                    .Where(r => request.RoleIds.Contains(r.Id))
                    .Select(r => r.Id)
                    .ToListAsync(cancellationToken);

                var desiredSet = desired.ToHashSet();

                var toRemove = question.QuestionRoles
                    .Where(qr => !desiredSet.Contains(qr.RoleId))
                    .ToList();

                if (toRemove.Count > 0)
                {
                    context.QuestionRoles.RemoveRange(toRemove);
                }

                var existingRoleIds = question.QuestionRoles
                    .Select(qr => qr.RoleId)
                    .ToHashSet();

                var newRoleIds = desiredSet
                    .Where(roleId => !existingRoleIds.Contains(roleId))
                    .ToList();

                foreach (var roleId in newRoleIds)
                {
                    question.QuestionRoles.Add(new QuestionRole
                    {
                        QuestionId = question.Id,
                        RoleId = roleId
                    });
                }
            }
            else
            {
                if (question.QuestionRoles.Count > 0)
                    context.QuestionRoles.RemoveRange(question.QuestionRoles);
            }

            await context.SaveChangesAsync(cancellationToken);

        }
    }
}
