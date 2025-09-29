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
                Title = "Phising",
                Description = "test-description",
                CreatedAt = DateTime.Now,
                Risk = Domain.Enum.Risk.High
            },
            new (){
                Title = "DDOS",
                Description = "TCP Attack, synflood",
                CreatedAt = DateTime.Now,
                Risk = Domain.Enum.Risk.High

            }
        };
        context.Scenarios.AddRange(scenarios);
        await context.SaveChangesAsync();
    }

}
