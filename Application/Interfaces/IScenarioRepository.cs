using Domain.Entities;

namespace Application.Interfaces;

public interface IScenarioRepository
{
    Task<Scenario?> GetByIdAsync(Guid id);
    Task AddAsync(Scenario scenario);
    Task UpdateAsync(Scenario scenario);
    Task DeleteAsync(Guid id);
}
