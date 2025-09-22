using System;
using Domain.Enum;

namespace Domain.Entities;

public class Scenario
{
    public required Guid Id { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public required DateTime CreatedAt { get; set; }
    public required Risk Risk { get; set; }

    // Relation: Scenario ↔ Questions (M:N eller 1:N afhængigt af jeres design)
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}
