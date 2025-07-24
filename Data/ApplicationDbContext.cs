namespace VacationManagement.Data
{
    using Microsoft.EntityFrameworkCore;
    using VacationManagement.Models;

    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

        public DbSet<Employee> Employees { get; set; }
        public DbSet<Vacation> Vacations { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Employee>()
                .HasMany(e => e.Vacations)
                .WithOne(v => v.Employee)
                .HasForeignKey(v => v.EmployeeId);

            // Seed data
            modelBuilder.Entity<Employee>().HasData(
                new Employee { Id = 1, FirstName = "Max", LastName = "Mustermann", Email = "max@company.com", VacationDaysPerYear = 30 },
                new Employee { Id = 2, FirstName = "Anna", LastName = "Schmidt", Email = "anna@company.com", VacationDaysPerYear = 30 },
                new Employee { Id = 3, FirstName = "Peter", LastName = "Weber", Email = "peter@company.com", VacationDaysPerYear = 30 }
            );
        }
    }
}