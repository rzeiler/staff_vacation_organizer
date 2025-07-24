namespace VacationManagement.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using VacationManagement.Services;

    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        private readonly IVacationService _vacationService;

        public StatisticsController(IVacationService vacationService)
        {
            _vacationService = vacationService;
        }

        [HttpGet("vacation-summary")]
        public async Task<ActionResult<object>> GetVacationSummary([FromQuery] int year = 2024)
        {
            return await _vacationService.GetVacationSummaryAsync(year);
        }

        [HttpGet("employee-vacation-usage")]
        public async Task<ActionResult<List<object>>> GetEmployeeVacationUsage()
        {
            return await _vacationService.GetEmployeeVacationUsageAsync();
        }
    }
}