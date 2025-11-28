namespace Domain.Entities;

public class Department
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public required string Name { get; set; }
    
    // Relation: one department can have many users
    public ICollection<User> Users { get; set; } = new List<User>();
}

