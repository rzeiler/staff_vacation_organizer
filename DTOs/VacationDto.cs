using VacationManagement.Models;

namespace VacationManagement.DTOs
{
    public class VacationDto
    {
        public int Id { get; set; }
        public EmployeeDto Employee { get; set; } = null!;
        public int EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Description { get; set; }
        public VacationStatus Status { get; set; } = VacationStatus.Pending;
        public int Days => (EndDate - StartDate).Days + 1;
    }
}