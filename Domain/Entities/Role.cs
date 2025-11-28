using System;
using Domain.Enum;

namespace Domain.Entities;


public class Role
{
    public Guid Id { get; private set; } = Guid.NewGuid();    
    public required string Name { get; set; }

    public required SecurityClearence SecurityClearence { get; set; }

    // Relation: Role ↔ Questions (M:N via QuestionRole)
    public ICollection<QuestionRole> QuestionRoles { get; set; } = new List<QuestionRole>();
    
    // Relation: Role ↔ Users (1:N)
    public ICollection<User> Users { get; set; } = new List<User>();
}