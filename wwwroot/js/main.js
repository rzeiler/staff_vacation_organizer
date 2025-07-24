// Global variables
let connection;
let employees = [];
let vacations = [];
let currentEditingEmployee = null;
let currentEditingVacation = null;

// API Base URL
const API_BASE = "";

// Initialize application
document.addEventListener("DOMContentLoaded", function () {
  initializeSignalR();
  loadEmployees();
  loadVacations();
  loadStatistics();
  populateEmployeeFilter();
});

// SignalR Setup
function initializeSignalR() {
  connection = new signalR.HubConnectionBuilder()
    .withUrl("/vacationHub")
    .withAutomaticReconnect()
    .build();

  connection
    .start()
    .then(function () {
      updateConnectionStatus(true);
      console.log("SignalR Connected");
    })
    .catch(function (err) {
      updateConnectionStatus(false);
      console.error("SignalR Connection Error: ", err);
    });

  connection.onreconnecting(() => {
    updateConnectionStatus(false, "Verbindung wird wiederhergestellt...");
  });

  connection.onreconnected(() => {
    updateConnectionStatus(true);
    showNotification("Verbindung wiederhergestellt", "success");
  });

  connection.onclose(() => {
    updateConnectionStatus(false);
  });

  // Listen for real-time updates
  connection.on("VacationCreated", function (vacation) {
    showNotification("Neuer Urlaubsantrag erstellt", "info");
    loadVacations();
    loadStatistics();
  });

  connection.on("VacationUpdated", function (vacation) {
    showNotification("Urlaubsantrag aktualisiert", "info");
    loadVacations();
    loadStatistics();
  });

  connection.on("VacationDeleted", function (vacationId) {
    showNotification("Urlaubsantrag gelöscht", "info");
    loadVacations();
    loadStatistics();
  });
}

function updateConnectionStatus(connected, message = null) {
  const statusElement = document.getElementById("connectionStatus");
  const dot = statusElement.querySelector(".status-dot");

  if (connected) {
    statusElement.className = "connection-status connected";
    statusElement.innerHTML =
      '<div class="status-dot connected"></div>Verbunden';
  } else {
    statusElement.className = "connection-status disconnected";
    statusElement.innerHTML = `<div class="status-dot disconnected"></div>${
      message || "Getrennt"
    }`;
  }
}

// Tab Management
function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Remove active class from all nav tabs
  document.querySelectorAll(".nav-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  // Show selected tab
  document.getElementById(tabName).classList.add("active");
  event.target.classList.add("active");

  // Load data if needed
  if (tabName === "statistics") {
    loadStatistics();
  }
}

// Employee Management
async function loadEmployees() {
  try {
    const response = await fetch(`${API_BASE}/api/employees`);
    employees = await response.json();
    renderEmployeeTable();
    populateEmployeeSelects();
  } catch (error) {
    console.error("Error loading employees:", error);
    showNotification("Fehler beim Laden der Mitarbeiter", "error");
  }
}

function renderEmployeeTable() {
  const tbody = document.getElementById("employeeList");

  if (employees.length === 0) {
    tbody.innerHTML = `
                    <tr>
                        <td colspan="6">
                            <div class="empty-state">
                                <div class="empty-state-icon">👥</div>
                                <h3>Keine Mitarbeiter vorhanden</h3>
                                <p>Fügen Sie den ersten Mitarbeiter hinzu</p>
                            </div>
                        </td>
                    </tr>
                `;
    return;
  }

  tbody.innerHTML = employees
    .map((employee) => {
      const usedDays =
        employee.vacations
          ?.filter((v) => v.status === 1)
          .reduce((sum, v) => sum + v.days, 0) || 0;
      const remainingDays = employee.vacationDaysPerYear - usedDays;

      return `
                    <tr>
                        <td><strong>${employee.fullName}</strong></td>
                        <td>${employee.email}</td>
                        <td>${employee.vacationDaysPerYear}</td>
                        <td>${usedDays}</td>
                        <td>${remainingDays}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-small" onclick="editEmployee(${employee.id})">
                                    ✏️ Bearbeiten
                                </button>
                                <button class="btn btn-danger btn-small" onclick="deleteEmployee(${employee.id})">
                                    🗑️ Löschen
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
    })
    .join("");
}

function populateEmployeeSelects() {
  const selects = [
    document.getElementById("vacationEmployeeId"),
    document.getElementById("employeeFilter"),
  ];

  selects.forEach((select) => {
    if (select.id === "employeeFilter") {
      select.innerHTML = '<option value="">Alle Mitarbeiter</option>';
    } else {
      select.innerHTML = '<option value="">Mitarbeiter auswählen</option>';
    }

    employees.forEach((employee) => {
      const option = document.createElement("option");
      option.value = employee.id;
      option.textContent = employee.fullName;
      select.appendChild(option);
    });
  });
}

function populateEmployeeFilter() {
  loadEmployees().then(() => {
    populateEmployeeSelects();
  });
}

async function searchEmployees(query) {
  if (!query.trim()) {
    loadEmployees();
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE}/api/employees/search?q=${encodeURIComponent(query)}`
    );
    employees = await response.json();
    renderEmployeeTable();
  } catch (error) {
    console.error("Error searching employees:", error);
    showNotification("Fehler bei der Suche", "error");
  }
}

function showEmployeeModal(employeeId = null) {
  currentEditingEmployee = employeeId;
  const modal = document.getElementById("employeeModal");
  const title = document.getElementById("employeeModalTitle");

  if (employeeId) {
    title.textContent = "Mitarbeiter bearbeiten";
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      document.getElementById("employeeId").value = employee.id;
      document.getElementById("firstName").value = employee.firstName;
      document.getElementById("lastName").value = employee.lastName;
      document.getElementById("email").value = employee.email;
      document.getElementById("vacationDaysPerYear").value =
        employee.vacationDaysPerYear;
    }
  } else {
    title.textContent = "Neuer Mitarbeiter";
    document.getElementById("employeeForm").reset();
    document.getElementById("employeeId").value = "";
  }

  const myModal = new bootstrap.Modal(modal, {});
  myModal.show();
}

function editEmployee(id) {
  showEmployeeModal(id);
}

async function saveEmployee(event) {
  event.preventDefault();

  const employeeData = {
    firstName: document.getElementById("firstName").value,
    lastName: document.getElementById("lastName").value,
    email: document.getElementById("email").value,
    vacationDaysPerYear: parseInt(
      document.getElementById("vacationDaysPerYear").value
    ),
  };

  try {
    let response;
    if (currentEditingEmployee) {
      response = await fetch(
        `${API_BASE}/api/employees/${currentEditingEmployee}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(employeeData),
        }
      );
    } else {
      response = await fetch(`${API_BASE}/api/employees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(employeeData),
      });
    }

    if (response.ok) {
      closeModal("employeeModal");
      loadEmployees();
      showNotification(
        currentEditingEmployee
          ? "Mitarbeiter aktualisiert"
          : "Mitarbeiter erstellt",
        "success"
      );
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    console.error("Error saving employee:", error);
    showNotification("Fehler beim Speichern", "error");
  }
}

async function deleteEmployee(id) {
  if (!confirm("Mitarbeiter wirklich löschen?")) return;

  try {
    const response = await fetch(`${API_BASE}/api/employees/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadEmployees();
      showNotification("Mitarbeiter gelöscht", "success");
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    console.error("Error deleting employee:", error);
    showNotification("Fehler beim Löschen", "error");
  }
}

// Vacation Management
async function loadVacations() {
  try {
    const year = document.getElementById("yearFilter")?.value || "2025";
    const employeeId = document.getElementById("employeeFilter")?.value || "";

    let url = `${API_BASE}/api/vacations?year=${year}`;
    if (employeeId) url += `&employeeId=${employeeId}`;

    const response = await fetch(url);
    vacations = await response.json();
    renderVacationTable();
  } catch (error) {
    console.error("Error loading vacations:", error);
    showNotification("Fehler beim Laden der Urlaube", "error");
  }
}

function renderVacationTable() {
  const tbody = document.getElementById("vacationList");

  if (vacations.length === 0) {
    tbody.innerHTML = `
                    <tr>
                        <td colspan="7">
                            <div class="empty-state">
                                <div class="empty-state-icon">🏖️</div>
                                <h3>Keine Urlaubsanträge vorhanden</h3>
                                <p>Erstellen Sie den ersten Urlaubsantrag</p>
                            </div>
                        </td>
                    </tr>
                `;
    return;
  }

  tbody.innerHTML = vacations
    .map((vacation) => {
      const statusText = ["Ausstehend", "Genehmigt", "Abgelehnt"][
        vacation.status
      ];
      const statusClass = [
        "status-pending",
        "status-approved",
        "status-rejected",
      ][vacation.status];

      return `
                    <tr>
                        <td><strong>${
                          vacation.employee?.fullName || "Unbekannt"
                        }</strong></td>
                        <td>${formatDate(vacation.startDate)}</td>
                        <td>${formatDate(vacation.endDate)}</td>
                        <td>${vacation.days}</td>
                        <td>${vacation.description || "-"}</td>
                        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary btn-small" onclick="editVacation(${
                                  vacation.id
                                })">
                                    ✏️ Bearbeiten
                                </button>
                                <button class="btn btn-danger btn-small" onclick="deleteVacation(${
                                  vacation.id
                                })">
                                    🗑️ Löschen
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
    })
    .join("");
}

function filterVacations() {
  loadVacations();
}

function showVacationModal(vacationId = null) {
  currentEditingVacation = vacationId;
  const modal = document.getElementById("vacationModal");
  const title = document.getElementById("vacationModalTitle");

  console.log(vacations);

  if (vacationId) {
    title.textContent = "Urlaubsantrag bearbeiten";
    const vacation = vacations.find((v) => v.id === vacationId);
    if (vacation) {
      document.getElementById("vacationId").value = vacation.id;
      document.getElementById("vacationEmployeeId").value = vacation.employeeId;
      document.getElementById("startDate").value =
        vacation.startDate.split("T")[0];
      document.getElementById("endDate").value = vacation.endDate.split("T")[0];
      document.getElementById("description").value = vacation.description || "";
      document.getElementById("status").value = vacation.status;
    }
  } else {
    title.textContent = "Neuer Urlaubsantrag";
    document.getElementById("vacationForm").reset();
    document.getElementById("vacationId").value = "";
    document.getElementById("status").value = "0";
  }

  // modal.style.display = 'block';
  window.modal = new bootstrap.Modal(modal, {});
  window.modal.show();
}

function editVacation(id) {
  showVacationModal(id);
}

async function validateVacation() {
  const vacationData = getVacationFormData();

  try {
    const response = await fetch(`${API_BASE}/api/vacations/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vacationData),
    });

    const result = await response.json();
    const messageDiv = document.getElementById("validationMessage");

    if (result.errors != undefined) {
      // errors
      console.error(result);
    }

    messageDiv.style.display = "block";
    messageDiv.textContent = result.message;
    messageDiv.style.background = result.isValid ? "#d4edda" : "#f8d7da";
    messageDiv.style.color = result.isValid ? "#155724" : "#721c24";
  } catch (error) {
    console.error("Error validating vacation:", error);
    showNotification("Fehler bei der Validierung", "error");
  }
}

function getVacationFormData() {
  return {
    id: parseInt(document.getElementById("vacationId").value) || 0,
    employeeId: parseInt(document.getElementById("vacationEmployeeId").value),
    startDate: document.getElementById("startDate").value,
    endDate: document.getElementById("endDate").value,
    description: document.getElementById("description").value,
    status: parseInt(document.getElementById("status").value),
  };
}

async function saveVacation(event) {
  event.preventDefault();

  const vacationData = getVacationFormData();

  try {
    let response;
    if (currentEditingVacation) {
      response = await fetch(
        `${API_BASE}/api/vacations/${currentEditingVacation}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(vacationData),
        }
      );
    } else {
      response = await fetch(`${API_BASE}/api/vacations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vacationData),
      });
    }

    if (response.ok) {
      closeModal();
      loadVacations();
      loadStatistics();
      showNotification(
        currentEditingVacation
          ? "Urlaubsantrag aktualisiert"
          : "Urlaubsantrag erstellt",
        "success"
      );
    } else {
      const result = await response.json();
      console.log("Errors",result.errors);

      throw new Error("Fehler");
    }
  } catch (error) {
    showNotification("Fehler beim Speichern", "error");
  }
}

async function deleteVacation(id) {
  if (!confirm("Urlaubsantrag wirklich löschen?")) return;

  try {
    const response = await fetch(`${API_BASE}/api/vacations/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadVacations();
      loadStatistics();
      showNotification("Urlaubsantrag gelöscht", "success");
    } else {
      throw new Error("Server error");
    }
  } catch (error) {
    console.error("Error deleting vacation:", error);
    showNotification("Fehler beim Löschen", "error");
  }
}

// Statistics
async function loadStatistics() {
  try {
    const [summaryResponse, usageResponse] = await Promise.all([
      fetch(`${API_BASE}/api/statistics/vacation-summary?year=2024`),
      fetch(`${API_BASE}/api/statistics/employee-vacation-usage`),
    ]);

    const summary = await summaryResponse.json();
    const usage = await usageResponse.json();

    renderStatistics(summary, usage);
  } catch (error) {
    console.error("Error loading statistics:", error);
    showNotification("Fehler beim Laden der Statistiken", "error");
  }
}

function renderStatistics(summary, usage) {
  // Render summary cards
  const summaryGrid = document.getElementById("statisticsGrid");
  summaryGrid.innerHTML = `
                <div class="stat-card">
                    <h3>${summary.totalVacations}</h3>
                    <p>Gesamte Anträge</p>
                </div>
                <div class="stat-card">
                    <h3>${summary.approvedVacations}</h3>
                    <p>Genehmigte Anträge</p>
                </div>
                <div class="stat-card">
                    <h3>${summary.pendingVacations}</h3>
                    <p>Ausstehende Anträge</p>
                </div>
                <div class="stat-card">
                    <h3>${summary.totalDays}</h3>
                    <p>Gesamte Urlaubstage</p>
                </div>
            `;

  // Render usage statistics
  const usageList = document.getElementById("usageStatsList");
  usageList.innerHTML = usage
    .map((emp) => {
      const percentage =
        emp.vacationDaysPerYear > 0
          ? Math.round((emp.usedDays / emp.vacationDaysPerYear) * 100)
          : 0;

      return `
                    <tr>
                        <td><strong>${emp.employeeName}</strong></td>
                        <td>${emp.vacationDaysPerYear}</td>
                        <td>${emp.usedDays}</td>
                        <td>${emp.remainingDays}</td>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="flex: 1; background: #f0f0f0; border-radius: 10px; height: 20px; overflow: hidden;">
                                    <div style="width: ${percentage}%; background: linear-gradient(135deg, #667eea, #764ba2); height: 100%; border-radius: 10px; transition: width 0.3s ease;"></div>
                                </div>
                                <span style="font-weight: 600; color: ${
                                  percentage > 80
                                    ? "#e74c3c"
                                    : percentage > 60
                                    ? "#f39c12"
                                    : "#27ae60"
                                };">
                                    ${percentage}%
                                </span>
                            </div>
                        </td>
                    </tr>
                `;
    })
    .join("");
}

// Utility Functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function closeModal() {
  window.modal.hide();
  // document.getElementById(modalId).style.display = "none";

  // Clear validation message if present
  const validationMsg = document.getElementById("validationMessage");
  if (validationMsg) {
    validationMsg.style.display = "none";
  }
}

function showNotification(message, type = "info") {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll(".notification");
  existingNotifications.forEach((notification) => notification.remove());

  // Create new notification
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;

  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 100);

  // Hide notification after 4 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 4000);
}

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  // Escape key to close modals
  if (event.key === "Escape") {
    const visibleModal = document.querySelector('.modal[style*="block"]');
    if (visibleModal) {
      visibleModal.style.display = "none";
    }
  }

  // Ctrl/Cmd + N for new employee
  if ((event.ctrlKey || event.metaKey) && event.key === "n") {
    event.preventDefault();
    const activeTab = document.querySelector(".tab-content.active");
    if (activeTab.id === "employees") {
      showEmployeeModal();
    } else if (activeTab.id === "vacations") {
      showVacationModal();
    }
  }
});

// Auto-update date inputs to prevent past dates
document.addEventListener("DOMContentLoaded", function () {
  const today = new Date().toISOString().split("T")[0];
  const startDateInput = document.getElementById("startDate");
  const endDateInput = document.getElementById("endDate");

  if (startDateInput) {
    startDateInput.min = today;
    startDateInput.addEventListener("change", function () {
      if (endDateInput) {
        endDateInput.min = this.value;
        if (endDateInput.value && endDateInput.value < this.value) {
          endDateInput.value = this.value;
        }
      }
    });
  }

  if (endDateInput) {
    endDateInput.min = today;
  }
});

// Form validation enhancement
function enhanceFormValidation() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input[required], select[required]");
    inputs.forEach((input) => {
      input.addEventListener("invalid", function () {
        this.style.borderColor = "#e74c3c";
        this.style.boxShadow = "0 0 0 3px rgba(231, 76, 60, 0.1)";
      });

      input.addEventListener("input", function () {
        if (this.validity.valid) {
          this.style.borderColor = "#27ae60";
          this.style.boxShadow = "0 0 0 3px rgba(39, 174, 96, 0.1)";
        }
      });
    });
  });
}

// Initialize form validation
document.addEventListener("DOMContentLoaded", enhanceFormValidation);

// Responsive table handling
function makeTablesResponsive() {
  const tables = document.querySelectorAll(".data-table");
  tables.forEach((table) => {
    if (window.innerWidth <= 768) {
      table.style.fontSize = "0.85rem";
    } else {
      table.style.fontSize = "1rem";
    }
  });
}

window.addEventListener("resize", makeTablesResponsive);
document.addEventListener("DOMContentLoaded", makeTablesResponsive);

// Export functionality (bonus feature)
function exportToCSV(data, filename) {
  const csv = data
    .map((row) =>
      Object.values(row)
        .map((value) =>
          typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value
        )
        .join(",")
    )
    .join("\n");

  const header = Object.keys(data[0]).join(",");
  const csvContent = header + "\n" + csv;

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Add export buttons (you can uncomment this to add export functionality)
/*
        function addExportButtons() {
            const employeeTab = document.getElementById('employees');
            const vacationTab = document.getElementById('vacations');
            
            // Add export button for employees
            const employeeHeader = employeeTab.querySelector('div[style*="justify-content: space-between"]');
            const employeeExportBtn = document.createElement('button');
            employeeExportBtn.className = 'btn btn-secondary';
            employeeExportBtn.innerHTML = '📤 Export CSV';
            employeeExportBtn.onclick = () => exportToCSV(employees, 'mitarbeiter.csv');
            employeeHeader.appendChild(employeeExportBtn);
            
            // Add export button for vacations
            const vacationHeader = vacationTab.querySelector('div[style*="justify-content: space-between"]');
            const vacationExportBtn = document.createElement('button');
            vacationExportBtn.className = 'btn btn-secondary';
            vacationExportBtn.innerHTML = '📤 Export CSV';
            vacationExportBtn.onclick = () => exportToCSV(vacations, 'urlaube.csv');
            vacationHeader.appendChild(vacationExportBtn);
        }
        
        document.addEventListener('DOMContentLoaded', addExportButtons);
        */

// Performance optimization: Debounced search
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Apply debounce to search
const debouncedSearch = debounce(searchEmployees, 300);
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("employeeSearch");
  if (searchInput) {
    searchInput.oninput = (e) => debouncedSearch(e.target.value);
  }
});

// Loading states
function showLoading(elementId) {
  const element = document.getElementById(elementId);
  const originalContent = element.innerHTML;
  element.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; padding: 40px;">
                    <div class="loading"></div>
                    <span style="margin-left: 10px;">Lädt...</span>
                </div>
            `;
  return originalContent;
}

function hideLoading(elementId, originalContent) {
  document.getElementById(elementId).innerHTML = originalContent;
}

// Enhanced error handling
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled promise rejection:", event.reason);
  showNotification("Ein unerwarteter Fehler ist aufgetreten", "error");
});

// Service Worker registration for offline functionality (optional)
/*
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                        console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                        console.log('ServiceWorker registration failed');
                    });
            });
        }
        */

// Print functionality
function printReport() {
  const printWindow = window.open("", "_blank");
  const printContent = document.querySelector(".tab-content.active").innerHTML;

  printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Urlaubsverwaltung - Bericht</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 20px; }
                        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        .no-print { display: none; }
                        @media print {
                            .btn, button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <h1>Urlaubsverwaltung - Bericht</h1>
                    <p>Erstellt am: ${new Date().toLocaleDateString(
                      "de-DE"
                    )}</p>
                    ${printContent}
                </body>
                </html>
            `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
}

// Accessibility improvements
function improveAccessibility() {
  // Add ARIA labels
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    if (!button.getAttribute("aria-label") && button.textContent) {
      button.setAttribute("aria-label", button.textContent.trim());
    }
  });

  // Add focus management for modals
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", improveAccessibility);

// Auto-save form data (draft functionality)
function setupAutoSave() {
  const forms = document.querySelectorAll("form");
  forms.forEach((form) => {
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach((input) => {
      // Load saved draft
      const savedValue = localStorage.getItem(`draft_${input.id}`);
      if (savedValue && !input.value) {
        input.value = savedValue;
      }

      // Save draft on input
      input.addEventListener(
        "input",
        debounce(() => {
          if (input.value) {
            localStorage.setItem(`draft_${input.id}`, input.value);
          }
        }, 1000)
      );
    });

    // Clear draft on successful submit
    form.addEventListener("submit", () => {
      inputs.forEach((input) => {
        localStorage.removeItem(`draft_${input.id}`);
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", setupAutoSave);

console.log("🏖️ Urlaubsverwaltung geladen und bereit!");
