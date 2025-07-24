namespace VacationManagement.Controllers
{
    using Microsoft.AspNetCore.Mvc;
    using VacationManagement.Models;
    using VacationManagement.Services;

    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<ActionResult<List<Employee>>> GetAll()
        {
            return await _employeeService.GetAllAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Employee>> GetById(int id)
        {
            var employee = await _employeeService.GetByIdAsync(id);
            return employee == null ? NotFound() : employee;
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<Employee>>> Search([FromQuery] string q)
        {
            return await _employeeService.SearchAsync(q ?? "");
        }

        [HttpPost]
        public async Task<ActionResult<Employee>> Create(Employee employee)
        {
            var created = await _employeeService.CreateAsync(employee);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<Employee>> Update(int id, Employee employee)
        {
            var updated = await _employeeService.UpdateAsync(id, employee);
            return updated == null ? NotFound() : updated;
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _employeeService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
    }
}