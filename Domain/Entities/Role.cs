using System;

namespace Domain.Entities;


public class Role
{
    public required Guid Id { get; set; }
    public required string Name { get; set; }

    // Relation: Role ↔ Questions (M:N via QuestionRole)
    public ICollection<QuestionRole> QuestionRoles { get; set; } = new List<QuestionRole>();
}