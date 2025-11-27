using System;
using System.Dynamic;
using Domain.Entities;
using Domain.Enum;

namespace Domain.Entities;


public class Question
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    // Link to Scenario
    public Guid ScenarioId { get; set; }
    public Scenario Scenario { get; set; } = null!;
    public required string Text { get; set; }
    public required Priority Priority { get; set; } //okay edited
    public int MaxPoints { get; set; } = 0; // Summen af alle korrekte svar-optioners point

    // Many-to-many with roles
    public ICollection<QuestionRole> QuestionRoles { get; set; } = new List<QuestionRole>();
    public ICollection<AnswerOption> AnswerOptions { get; set; } = new List<AnswerOption>();

}