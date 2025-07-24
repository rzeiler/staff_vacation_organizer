namespace VacationManagement.Services
{
    using Microsoft.EntityFrameworkCore;
    using VacationManagement.Data;
    using VacationManagement.Models;

    public class VacationService : IVacationService
    {
        private readonly ApplicationDbContext _context;

        public VacationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Vacation>> GetVacationsAsync(int? year = null, int? employeeId = null)
        {
            var query = _context.Vacations.Include(v => v.Employee).AsQueryable();

            if (year.HasValue)
                query = query.Where(v => v.StartDate.Year == year || v.EndDate.Year == year);

            if (employeeId.HasValue)
                query = query.Where(v => v.EmployeeId == employeeId);

            return await query.OrderBy(v => v.StartDate).ToListAsync();
        }

        public async Task<Vacation?> GetByIdAsync(int id)
        {
            return await _context.Vacations
                .Include(v => v.Employee)
                .FirstOrDefaultAsync(v => v.Id == id);
        }

        public async Task<Vacation> CreateAsync(Vacation vacation)
        {
            _context.Vacations.Add(vacation);
            await _context.SaveChangesAsync();
            return await GetByIdAsync(vacation.Id) ?? vacation;
        }

        public async Task<Vacation?> UpdateAsync(int id, Vacation vacation)
        {
            var existingVacation = await _context.Vacations.FindAsync(id);
            if (existingVacation == null) return null;

            existingVacation.StartDate = vacation.StartDate;
            existingVacation.EndDate = vacation.EndDate;
            existingVacation.Description = vacation.Description;
            existingVacation.Status = vacation.Status;

            await _context.SaveChangesAsync();
            return await GetByIdAsync(id);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var vacation = await _context.Vacations.FindAsync(id);
            if (vacation == null) return false;

            _context.Vacations.Remove(vacation);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsValid, string Message)> ValidateVacationAsync(Vacation vacation)
        {
            // Check if max 2 employees on vacation at the same time
            var overlappingVacations = await _context.Vacations
                .Where(v => v.Id != vacation.Id && 
                           v.Status == VacationStatus.Approved &&
                           v.StartDate <= vacation.EndDate && 
                           v.EndDate >= vacation.StartDate)
                .CountAsync();

            if (overlappingVacations >= 2)
                return (false, "Maximal 2 Mitarbeiter können gleichzeitig Urlaub haben.");

            // Check vacation days limit
            var employee = await _context.Employees.FindAsync(vacation.EmployeeId);
            if (employee == null)
                return (false, "Mitarbeiter nicht gefunden.");

            var usedDays = await _context.Vacations
                .Where(v => v.EmployeeId == vacation.EmployeeId && 
                           v.Id != vacation.Id &&
                           v.Status == VacationStatus.Approved &&
                           v.StartDate.Year == vacation.StartDate.Year)
                .SumAsync(v => v.Days);

            if (usedDays + vacation.Days > employee.VacationDaysPerYear)
                return (false, $"Nicht genügend Urlaubstage verfügbar. Verfügbar: {employee.VacationDaysPerYear - usedDays}");

            return (true, "Urlaub kann genehmigt werden.");
        }

        public async Task<object> GetVacationSummaryAsync(int year)
        {
            var vacations = await _context.Vacations
                .Include(v => v.Employee)
                .Where(v => v.StartDate.Year == year)
                .ToListAsync();

            return new
            {
                Year = year,
                TotalVacations = vacations.Count,
                ApprovedVacations = vacations.Count(v => v.Status == VacationStatus.Approved),
                PendingVacations = vacations.Count(v => v.Status == VacationStatus.Pending),
                TotalDays = vacations.Where(v => v.Status == VacationStatus.Approved).Sum(v => v.Days)
            };
        }

        public async Task<List<object>> GetEmployeeVacationUsageAsync()
        {
            var employees = await _context.Employees
                .Include(e => e.Vacations)
                .ToListAsync();

            return employees.Select(e => new
            {
                EmployeeId = e.Id,
                EmployeeName = e.FullName,
                VacationDaysPerYear = e.VacationDaysPerYear,
                UsedDays = e.Vacations.Where(v => v.Status == VacationStatus.Approved).Sum(v => v.Days),
                RemainingDays = e.VacationDaysPerYear - e.Vacations.Where(v => v.Status == VacationStatus.Approved).Sum(v => v.Days)
            }).ToList<object>();
        }
    }
}