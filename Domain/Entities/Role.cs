using System;

namespace Domain.Entities;


public class Role
{
    public Guid Id { get; private set; } = Guid.NewGuid();    
    public required string Name { get; set; }

    // Relation: Role ↔ Questions (M:N via QuestionRole)
    public ICollection<QuestionRole> QuestionRoles { get; set; } = new List<QuestionRole>();
}