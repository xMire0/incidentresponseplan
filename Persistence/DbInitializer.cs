using System;
using Domain.Entities;

namespace Persistence;

public class DbInitializer
{

    public static async Task SeedData(AppDbContext context)
    {
        if (context.Scenarios.Any()) return;

        var scenarios = new List<Scenario>
        {
            new (){
                Id = Guid.NewGuid(),
                Title = "test",
                Description = "test-description",
                CreatedAt = DateTime.Now,
                Risk = Domain.Enum.Risk.Medium
            }
        };
        context.Scenarios.AddRange(scenarios);
        await context.SaveChangesAsync();
    }

}
