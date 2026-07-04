// ==========================================
// FUNNEL STATE MANAGEMENT
// ==========================================
let currentStep = 1;
const TOTAL_STEPS = 4;

const formData = {
    destination: "",
    startDate: "",
    endDate: "",
    shift: "Morning",
    frequency: "3 Sessions (Standard)",
    dialyzer: "Single-Use Dialyzer",
    hivStatus: "Negative",
    hbvStatus: "Negative",
    hcvStatus: "Negative",
    bloodGroup: "B+",
    reportsAvailable: "Yes - Will share on WhatsApp/Email",
    fullName: "",
    phone: "",
    email: ""
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const stepContents = [
    document.getElementById("step-1-content"),
    document.getElementById("step-2-content"),
    document.getElementById("step-3-content"),
    document.getElementById("step-4-content")
];

const stepperItems = document.querySelectorAll(".step-item");
const progressFill = document.getElementById("progress-fill");

const nextBtn = document.getElementById("next-btn");
const backBtn = document.getElementById("back-btn");
const funnelActionsRow = document.getElementById("funnel-actions-row");
const successScreen = document.getElementById("success-screen");
const resetBtn = document.getElementById("reset-funnel-btn");

// Input Elements
const destInput = document.getElementById("destination");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const shiftCards = document.querySelectorAll(".shift-card");
const freqSelect = document.getElementById("sessions-frequency");
const dialyzerSelect = document.getElementById("dialyzer-preference");
const bloodSelect = document.getElementById("blood-group");
const reportsSelect = document.getElementById("clinical-handover");
const nameInput = document.getElementById("fullName");
const phoneInput = document.getElementById("phoneNumber");
const emailInput = document.getElementById("email");

// Warnings & Summary Elements
const viralWarningBox = document.getElementById("viral-warning");
const summaryDest = document.getElementById("summary-dest");
const summaryDates = document.getElementById("summary-dates");
const summaryRoutine = document.getElementById("summary-routine");
const summaryBlood = document.getElementById("summary-blood");
const summaryViral = document.getElementById("summary-viral");
const successDestText = document.getElementById("success-dest");

// ==========================================
// INITIAL SETUP & DATE BOUNDS
// ==========================================
function init() {
    // Set min date of travel starting tomorrow
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split('T')[0];
    startDateInput.min = tomorrowStr;
    
    // Default dates (travel starting in 7 days, lasting for 7 days)
    const startDefault = new Date();
    startDefault.setDate(startDefault.getDate() + 7);
    startDateInput.value = startDefault.toISOString().split('T')[0];
    
    const endDefault = new Date();
    endDefault.setDate(endDefault.getDate() + 14);
    endDateInput.value = endDefault.toISOString().split('T')[0];
    endDateInput.min = startDateInput.value;

    // Date bounds changes
    startDateInput.addEventListener("change", () => {
        endDateInput.min = startDateInput.value;
        if (endDateInput.value && endDateInput.value < startDateInput.value) {
            endDateInput.value = startDateInput.value;
        }
    });

    // Setup interactive shift cards selection
    shiftCards.forEach(card => {
        card.addEventListener("click", () => {
            shiftCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            formData.shift = card.getAttribute("data-shift");
        });
    });

    // Setup viral toggle button pairs
    setupViralToggle("hiv-toggle-group", (val) => { formData.hivStatus = val; checkViralWarningState(); });
    setupViralToggle("hbv-toggle-group", (val) => { formData.hbvStatus = val; checkViralWarningState(); });
    setupViralToggle("hcv-toggle-group", (val) => { formData.hcvStatus = val; checkViralWarningState(); });

    // Hook validation triggers to clear errors on typing
    setupClearErrorsOnInput();
}

// Helper to configure viral toggle button events
function setupViralToggle(groupId, stateCallback) {
    const group = document.getElementById(groupId);
    const buttons = group.querySelectorAll(".btn-toggle");
    buttons.forEach(btn => {
        btn.addEventListener("click", () => {
            buttons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            stateCallback(btn.getAttribute("data-value"));
        });
    });
}

function checkViralWarningState() {
    if (formData.hivStatus === "Positive" || formData.hbvStatus === "Positive" || formData.hcvStatus === "Positive") {
        viralWarningBox.style.display = "flex";
    } else {
        viralWarningBox.style.display = "none";
    }
}

// Clear error outlines when editing
function setupClearErrorsOnInput() {
    const inputsWithErrors = [
        { elem: destInput, containerId: "dest-error" },
        { elem: startDateInput, containerId: "start-date-error" },
        { elem: endDateInput, containerId: "end-date-error" },
        { elem: nameInput, containerId: "name-error" },
        { elem: phoneInput, containerId: "phone-error" },
        { elem: emailInput, containerId: "email-error" }
    ];

    inputsWithErrors.forEach(item => {
        item.elem.addEventListener("input", () => {
            item.elem.closest(".input-group").classList.remove("invalid");
        });
    });
}

// ==========================================
// FORM VALIDATIONS
// ==========================================
function validateStep(step) {
    let isValid = true;

    if (step === 1) {
        // Destination check
        if (!destInput.value.trim()) {
            showError(destInput, "dest-error");
            isValid = false;
        }

        // Start Date check
        if (!startDateInput.value) {
            showError(startDateInput, "start-date-error");
            isValid = false;
        }

        // End Date check
        if (!endDateInput.value || endDateInput.value < startDateInput.value) {
            showError(endDateInput, "end-date-error");
            isValid = false;
        }
    } 
    else if (step === 4) {
        // Full Name check
        if (!nameInput.value.trim() || nameInput.value.trim().length < 2) {
            showError(nameInput, "name-error");
            isValid = false;
        }

        // Phone check (basic check: digits length 10-15)
        const cleanPhone = phoneInput.value.replace(/[^0-9+]/g, '');
        if (!cleanPhone || cleanPhone.length < 8) {
            showError(phoneInput, "phone-error");
            isValid = false;
        }

        // Email check (optional but regex validation if filled)
        if (emailInput.value.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(emailInput.value.trim())) {
                showError(emailInput, "email-error");
                isValid = false;
            }
        }
    }

    return isValid;
}

function showError(inputElement, errorId) {
    inputElement.closest(".input-group").classList.add("invalid");
}

// ==========================================
// NAVIGATION HANDLERS
// ==========================================
function updateStepUI() {
    // Show/Hide steps
    stepContents.forEach((content, index) => {
        if (index + 1 === currentStep) {
            content.classList.add("active");
        } else {
            content.classList.remove("active");
        }
    });

    // Update Stepper badges and progress bar
    stepperItems.forEach((item, index) => {
        const itemStep = index + 1;
        if (itemStep === currentStep) {
            item.className = "step-item active";
        } else if (itemStep < currentStep) {
            item.className = "step-item completed";
        } else {
            item.className = "step-item";
        }
    });

    const percent = ((currentStep - 1) / (TOTAL_STEPS - 1)) * 100;
    progressFill.style.width = `${percent}%`;

    // Action button state modifications
    backBtn.disabled = currentStep === 1;

    if (currentStep === TOTAL_STEPS) {
        nextBtn.innerHTML = `Confirm &amp; Submit <i class="ph-bold ph-paper-plane"></i>`;
        populateSummaryReceipt();
    } else {
        nextBtn.innerHTML = `Next Step <i class="ph-bold ph-arrow-right"></i>`;
    }
}

// Compile inputs into state and render receipt
function populateSummaryReceipt() {
    formData.destination = destInput.value.trim();
    formData.startDate = startDateInput.value;
    formData.endDate = endDateInput.value;
    formData.frequency = freqSelect.value;
    formData.dialyzer = dialyzerSelect.value;
    formData.bloodGroup = bloodSelect.value;
    formData.reportsAvailable = reportsSelect.value;
    formData.fullName = nameInput.value.trim();
    formData.phone = phoneInput.value.trim();
    formData.email = emailInput.value.trim();

    // Set text contents
    summaryDest.textContent = formData.destination;
    
    // Dates formatting
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const sDate = new Date(formData.startDate).toLocaleDateString('en-US', options);
    const eDate = new Date(formData.endDate).toLocaleDateString('en-US', options);
    summaryDates.textContent = `${sDate} - ${eDate}`;

    summaryRoutine.textContent = `${formData.frequency} (${formData.shift})`;
    summaryBlood.textContent = `${formData.bloodGroup}`;

    // Viral Status compile
    const positives = [];
    if (formData.hivStatus === "Positive") positives.push("HIV");
    if (formData.hbvStatus === "Positive") positives.push("HBV");
    if (formData.hcvStatus === "Positive") positives.push("HCV");

    if (positives.length > 0) {
        summaryViral.textContent = `Positive (${positives.join(", ")})`;
        summaryViral.className = "value text-alert";
        summaryViral.style.color = "var(--primary)";
    } else {
        summaryViral.textContent = "Negative (All)";
        summaryViral.className = "value";
        summaryViral.style.color = "var(--success)";
    }
}

// Submit data
function submitBooking() {
    // Show spinner in submit button
    nextBtn.disabled = true;
    nextBtn.innerHTML = `<i class="ph-bold ph-circle-notch fa-spin"></i> Submitting Request...`;

    // Simulate API delay
    setTimeout(() => {
        // Set success texts
        successDestText.textContent = formData.destination;

        // Hide form and action controls
        stepContents.forEach(c => c.style.display = "none");
        funnelActionsRow.style.display = "none";
        
        // Mark stepper final state
        stepperItems.forEach(item => item.className = "step-item completed");
        progressFill.style.width = "100%";

        // Show success screen
        successScreen.style.display = "block";
        
        // Scroll smoothly to success header
        successScreen.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
}

// Reset funnel
function resetFunnel() {
    currentStep = 1;
    
    // Reset form elements
    destInput.value = "";
    nameInput.value = "";
    phoneInput.value = "";
    emailInput.value = "";
    
    // Reset validation classes
    document.querySelectorAll(".input-group").forEach(g => g.classList.remove("invalid"));

    // Reset default select drop-downs
    freqSelect.selectedIndex = 0;
    dialyzerSelect.selectedIndex = 0;
    bloodSelect.selectedIndex = 2; // B+
    reportsSelect.selectedIndex = 0;

    // Reset active shifts
    shiftCards.forEach((c, idx) => {
        if (idx === 0) c.classList.add("active");
        else c.classList.remove("active");
    });

    // Reset toggles to negative
    document.querySelectorAll(".btn-toggle").forEach(btn => {
        if (btn.getAttribute("data-value") === "Negative") btn.classList.add("active");
        else btn.classList.remove("active");
    });

    formData.hivStatus = "Negative";
    formData.hbvStatus = "Negative";
    formData.hcvStatus = "Negative";
    viralWarningBox.style.display = "none";

    // Restore step contents and buttons view
    stepContents.forEach(c => c.style.display = "");
    funnelActionsRow.style.display = "";
    successScreen.style.display = "none";

    init();
    updateStepUI();
}

// ==========================================
// EVENT LISTENERS
// ==========================================
nextBtn.addEventListener("click", () => {
    if (validateStep(currentStep)) {
        if (currentStep < TOTAL_STEPS) {
            currentStep++;
            updateStepUI();
            document.querySelector("main").scrollIntoView({ behavior: 'smooth' });
        } else {
            submitBooking();
        }
    }
});

backBtn.addEventListener("click", () => {
    if (currentStep > 1) {
        currentStep--;
        updateStepUI();
        document.querySelector("main").scrollIntoView({ behavior: 'smooth' });
    }
});

resetBtn.addEventListener("click", resetFunnel);

// Keyboard accessibility (press enter to progress step)
document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && e.target.id !== "reset-funnel-btn") {
        e.preventDefault();
        nextBtn.click();
    }
});

// Run Setup
init();
updateStepUI();
