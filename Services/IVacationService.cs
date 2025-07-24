namespace VacationManagement.Services
{
    using VacationManagement.DTOs;
    using VacationManagement.Models;

    public interface IVacationService
    {
        Task<List<VacationDto>> GetVacationsAsync(int? year = null, int? employeeId = null);
        Task<Vacation?> GetByIdAsync(int id);
        Task<Vacation> CreateAsync(Vacation vacation);
        Task<VacationDto?> UpdateAsync(int id, Vacation vacation);
        Task<bool> DeleteAsync(int id);
        Task<(bool IsValid, string Message)> ValidateVacationAsync(Vacation vacation);
        Task<object> GetVacationSummaryAsync(int year);
        Task<List<object>> GetEmployeeVacationUsageAsync();
    }
}