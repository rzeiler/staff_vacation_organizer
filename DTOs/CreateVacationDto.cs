using VacationManagement.Models;

namespace VacationManagement.DTOs
{
    public class CreateVacationDto
    {
        public int EmployeeId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string? Description { get; set; }
        public VacationStatus Status { get; set; } = VacationStatus.Pending;
    }
}