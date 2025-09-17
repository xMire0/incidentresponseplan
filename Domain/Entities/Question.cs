using System;

namespace Domain;

public class Question
{
    public Guid Id { get; set; }
    public Guid ScenarioId { get; set; }
    public string Role { get; set; }
    public string Text { get; set; }
    public string AcceptedAnswer { get; set; }
}
