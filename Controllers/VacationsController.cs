namespace VacationManagement.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.AspNetCore.SignalR;
    using VacationManagement.Models;
    using VacationManagement.Services;
    using VacationManagement.Hubs;
    using VacationManagement.DTOs;

    [ApiController]
    [Route("api/[controller]")]
    public class VacationsController : ControllerBase
    {
        private readonly IVacationService _vacationService;
        private readonly IHubContext<VacationHub> _hubContext;

        public VacationsController(IVacationService vacationService, IHubContext<VacationHub> hubContext)
        {
            _vacationService = vacationService;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<ActionResult<List<VacationDto>>> GetVacations([FromQuery] int? year, [FromQuery] int? employeeId)
        {
            return await _vacationService.GetVacationsAsync(year, employeeId);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Vacation>> GetById(int id)
        {
            var vacation = await _vacationService.GetByIdAsync(id);
            return vacation == null ? NotFound() : vacation;
        }

        [HttpPost]
        public async Task<ActionResult<Vacation>> Create(CreateVacationDto dto)
        {
            var vacation = new Vacation
            {
                EmployeeId = dto.EmployeeId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description,
                Status = dto.Status
            };

            var created = await _vacationService.CreateAsync(vacation);
            await _hubContext.Clients.All.SendAsync("VacationCreated", created);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<VacationDto>> Update(int id, CreateVacationDto dto)
        {
            var vacation = new Vacation
            {
                EmployeeId = dto.EmployeeId,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Description = dto.Description,
                Status = dto.Status
            };

            var updated = await _vacationService.UpdateAsync(id, vacation);
            if (updated == null) return NotFound();

            await _hubContext.Clients.All.SendAsync("VacationUpdated", updated);

            return updated;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _vacationService.DeleteAsync(id);
            if (!deleted) return NotFound();
            
            await _hubContext.Clients.All.SendAsync("VacationDeleted", id);
            return NoContent();
        }

        [HttpPost("validate")]
        public async Task<ActionResult<object>> Validate(Vacation vacation)
        {
            var (isValid, message) = await _vacationService.ValidateVacationAsync(vacation);
            return new { IsValid = isValid, Message = message };
        }
    }
}