namespace VacationManagement.Models
{
    using System.ComponentModel.DataAnnotations;

    public class Employee
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string FirstName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(100)]
        public string LastName { get; set; } = string.Empty;
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Range(0, 50)]
        public int VacationDaysPerYear { get; set; } = 30;
        
        public List<Vacation> Vacations { get; set; } = new(0);
        
        public string FullName => $"{FirstName} {LastName}";
    }
}