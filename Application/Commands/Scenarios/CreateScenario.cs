using System;
using System.Collections.Generic;
using System.Linq;
using Domain.Entities;
using Domain.Enum;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Persistence;

namespace Application.Commands;

public class CreateScenario
{
    public class Command : IRequest<string>
    {
        public required string Title { get; set; }
        public required string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public Risk Risk { get; set; }
        public List<QuestionDto> Questions { get; set; } = new();
    }

    public class QuestionDto
    {
        public required string Text { get; set; }
        public Priority Priority { get; set; }
        public List<AnswerOptionDto> AnswerOptions { get; set; } = new();
        public List<Guid> RoleIds { get; set; } = new();
    }

    public class AnswerOptionDto
    {
        public required string Text { get; set; }
        public int Weight { get; set; }
        public bool IsCorrect { get; set; }
    }

    public class Handler(AppDbContext context) : IRequestHandler<Command, string>
    {
        public async Task<string> Handle(Command request, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                throw new ArgumentException("Scenario title is required", nameof(request.Title));

            var scenario = new Scenario
            {
                Title = request.Title.Trim(),
                Description = request.Description?.Trim() ?? string.Empty,
                CreatedAt = request.CreatedAt == default ? DateTime.UtcNow : request.CreatedAt,
                Risk = request.Risk,
            };

            foreach (var questionDto in request.Questions)
            {
                if (string.IsNullOrWhiteSpace(questionDto.Text))
                    continue;

                var question = new Question
                {
                    Scenario = scenario,
                    ScenarioId = scenario.Id,
                    Text = questionDto.Text.Trim(),
                    Priority = questionDto.Priority,
                };

                if (questionDto.AnswerOptions.Count == 0)
                    throw new ArgumentException("Each question must contain at least one answer option");

                foreach (var optionDto in questionDto.AnswerOptions)
                {
                    if (string.IsNullOrWhiteSpace(optionDto.Text))
                        continue;

                    // Automatisk Weight logik
                    int weight = optionDto.Weight;
                    if (optionDto.IsCorrect && weight == 0)
                    {
                        weight = 10; // Default for correct answers
                    }
                    else if (!optionDto.IsCorrect && weight == 0)
                    {
                        weight = 0; // Default for incorrect answers
                    }

                    question.AnswerOptions.Add(new AnswerOption
                    {
                        Question = question,
                        QuestionId = question.Id,
                        Text = optionDto.Text.Trim(),
                        Weight = weight,
                        IsCorrect = optionDto.IsCorrect,
                    });
                }

                if (question.AnswerOptions.Count == 0)
                    throw new ArgumentException("Answer options must contain text");

                if (!question.AnswerOptions.Any(o => o.IsCorrect))
                    throw new ArgumentException("Each question must have at least one correct option");

                // Beregn og sæt MaxPoints (summen af alle korrekte optioners Weight)
                question.MaxPoints = question.AnswerOptions
                    .Where(o => o.IsCorrect)
                    .Sum(o => o.Weight);

                if (questionDto.RoleIds.Count > 0)
                {
                    var distinctRoleIds = await context.Roles
                        .Where(r => questionDto.RoleIds.Contains(r.Id))
                        .Select(r => r.Id)
                        .ToListAsync(cancellationToken);

                    foreach (var roleId in distinctRoleIds)
                    {
                        question.QuestionRoles.Add(new QuestionRole
                        {
                            Question = question,
                            QuestionId = question.Id,
                            RoleId = roleId,
                        });
                    }
                }

                scenario.Questions.Add(question);
            }

            context.Scenarios.Add(scenario);
            await context.SaveChangesAsync(cancellationToken);

            return scenario.Id.ToString();
        }
    }
}
