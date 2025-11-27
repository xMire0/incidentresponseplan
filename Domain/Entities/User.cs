using System;

namespace Domain.Entities;

public class User
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public required string Username { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; } // For storing hashed passwords

    // Relation: one user can submit many responses
    public ICollection<Response> Responses { get; set; } = new List<Response>();

    // If each user has one role:
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}