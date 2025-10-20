using System;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class AnswerOption
{
    public Guid Id { get; private set; } = Guid.NewGuid();

    public Guid QuestionId { get; set; }

    public Question Question { get; set; } = null!;

    public required string Text { get; set; }
    public int Weight { get; set; }   // e.g. 0, 2, 5, 10 points
    public bool IsCorrect { get; set; }  // optional, for quick checks

}