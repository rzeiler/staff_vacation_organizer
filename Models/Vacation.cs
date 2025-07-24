namespace VacationManagement.Models
{
    using System.ComponentModel.DataAnnotations;

    public class Vacation
    {
        public int Id { get; set; }
        
        [Required]
        public int EmployeeId { get; set; }
        
        [Required]
        public DateTime StartDate { get; set; }
        
        [Required]
        public DateTime EndDate { get; set; }
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        public VacationStatus Status { get; set; } = VacationStatus.Pending;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public Employee Employee { get; set; } = null!;
        
        public int Days => (EndDate - StartDate).Days + 1;
    }

    public enum VacationStatus
    {
        Pending,
        Approved,
        Rejected
    }
}