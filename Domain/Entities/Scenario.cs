using System;

namespace Domain;

public class Scenario
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}

