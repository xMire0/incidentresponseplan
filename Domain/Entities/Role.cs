using System;

namespace Domain.Entities;

public class Role
{
    public Guid Id { get; set; }
    public required string Name { get; set; } // Developer, Security, Manager osv.
}
