using System;
using System.Dynamic;
using Domain.Entities;
using Domain.Enum;

namespace Domain.Entities;



public class Question
{
    public required Guid Id { get; set; }
    public required string Text { get; set; }
    public required Priority Priority { get; set; }

    // Relation: Question ↔ Roles (M:N)
    public ICollection<QuestionRole> QuestionRoles { get; set; } = new List<QuestionRole>();
}