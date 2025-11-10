using System;
using System.Linq;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class CreateQuestion
{
    public class Command : IRequest<string>
    {
        public Guid ScenarioId { get; set; }
        public string Text { get; set; } = null!;
        public Priority Priority { get; set; }
        public List<Guid> RoleIds { get; set; } = new();
    }


    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            var scenarioExists = await context.Scenarios.AnyAsync(s => s.Id == request.ScenarioId, cancellationToken);
            if (!scenarioExists)
                throw new InvalidOperationException("Scenario not found");

            var question = new Question
            {
                ScenarioId = request.ScenarioId,
                Text = request.Text,
                Priority = request.Priority,
            };

            if (request.RoleIds.Count > 0)
            {
                var validRoleIds = await context.Roles
                    .Where(r => request.RoleIds.Contains(r.Id))
                    .Select(r => r.Id)
                    .ToListAsync(cancellationToken);

                question.QuestionRoles = validRoleIds
                    .Distinct()
                    .Select(roleId => new QuestionRole
                    {
                        RoleId = roleId,
                        Question = question
                    })
                    .ToList();
            }

            context.Questions.Add(question);
            await context.SaveChangesAsync(cancellationToken);

            return question.Id.ToString();
        }
    }
}
