namespace VacationManagement.Services
{
    using Microsoft.EntityFrameworkCore;
    using VacationManagement.Data;
    using VacationManagement.Models;

    public class EmployeeService : IEmployeeService
    {
        private readonly ApplicationDbContext _context;

        public EmployeeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<List<Employee>> GetAllAsync()
        {
            return await _context.Employees.ToListAsync();
                // .Include(e => e.Vacations)
        }

        public async Task<Employee?> GetByIdAsync(int id)
        {
            return await _context.Employees
                .Include(e => e.Vacations)
                .FirstOrDefaultAsync(e => e.Id == id);
        }

        public async Task<List<Employee>> SearchAsync(string query)
        {
            return await _context.Employees
                .Where(e => e.FirstName.ToLower().Contains(query.ToLower()) || 
                           e.LastName.ToLower().Contains(query.ToLower()) || 
                           e.Email.ToLower().Contains(query.ToLower()))
                .Include(e => e.Vacations)
                .ToListAsync();
        }

        public async Task<Employee> CreateAsync(Employee employee)
        {
            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();
            return employee;
        }

        public async Task<Employee?> UpdateAsync(int id, Employee employee)
        {
            var existingEmployee = await _context.Employees.FindAsync(id);
            if (existingEmployee == null) return null;

            existingEmployee.FirstName = employee.FirstName;
            existingEmployee.LastName = employee.LastName;
            existingEmployee.Email = employee.Email;
            existingEmployee.VacationDaysPerYear = employee.VacationDaysPerYear;

            await _context.SaveChangesAsync();
            return existingEmployee;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var employee = await _context.Employees.FindAsync(id);
            if (employee == null) return false;

            _context.Employees.Remove(employee);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}