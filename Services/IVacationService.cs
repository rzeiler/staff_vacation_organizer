namespace VacationManagement.Services
{
    using VacationManagement.Models;

    public interface IVacationService
    {
        Task<List<Vacation>> GetVacationsAsync(int? year = null, int? employeeId = null);
        Task<Vacation?> GetByIdAsync(int id);
        Task<Vacation> CreateAsync(Vacation vacation);
        Task<Vacation?> UpdateAsync(int id, Vacation vacation);
        Task<bool> DeleteAsync(int id);
        Task<(bool IsValid, string Message)> ValidateVacationAsync(Vacation vacation);
        Task<object> GetVacationSummaryAsync(int year);
        Task<List<object>> GetEmployeeVacationUsageAsync();
    }
}