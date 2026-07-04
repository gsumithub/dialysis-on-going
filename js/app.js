// ==========================================
// FUNNEL STATE MANAGEMENT
// ==========================================
let activeFlow = "patient"; // "patient" or "clinic"
let patientStep = 1;
let clinicStep = 1;
const TOTAL_STEPS = 4;

const patientData = {
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

const clinicData = {
    name: "",
    city: "",
    address: "",
    totalMachines: "",
    hivMachines: 0,
    hbvMachines: 0,
    hcvMachines: 0,
    dialyzerPolicy: "Single-Use Only",
    badge: "NABH",
    manager: "",
    phone: "",
    email: ""
};

// Stepper Configuration
const STEPPER_CONFIG = {
    patient: {
        labels: ["Destination", "Care Details", "Clinical Info", "Confirm"],
        icons: ["ph-bold ph-map-pin", "ph-bold ph-calendar-plus", "ph-bold ph-shield-check", "ph-bold ph-user-check"]
    },
    clinic: {
        labels: ["Profile", "Capacity", "Accreditation", "Confirm"],
        icons: ["ph-bold ph-hospital", "ph-bold ph-activity", "ph-bold ph-certificate", "ph-bold ph-storefront"]
    }
};

// ==========================================
// DOM ELEMENTS
// ==========================================
const landingContainer = document.getElementById("landing-container");
const wizardContainer = document.getElementById("wizard-container");

const flowPatientBtn = document.getElementById("flow-patient-btn");
const flowClinicBtn = document.getElementById("flow-clinic-btn");
const patientSections = document.querySelector(".patient-flow-sections");
const clinicSections = document.querySelector(".clinic-flow-sections");

const progressFill = document.getElementById("progress-fill");
const nextBtn = document.getElementById("next-btn");
const backBtn = document.getElementById("back-btn");
const funnelActionsRow = document.getElementById("funnel-actions-row");

// Stepper nodes
const stepCircles = [
    document.getElementById("step-circle-1"),
    document.getElementById("step-circle-2"),
    document.getElementById("step-circle-3"),
    document.getElementById("step-circle-4")
];
const stepLabels = [
    document.getElementById("step-label-1"),
    document.getElementById("step-label-2"),
    document.getElementById("step-label-3"),
    document.getElementById("step-label-4")
];

// Patient Input Elements
const destInput = document.getElementById("destination");
const startDateInput = document.getElementById("start-date");
const endDateInput = document.getElementById("end-date");
const shiftCards = document.querySelectorAll(".shift-card[data-shift]");
const freqSelect = document.getElementById("sessions-frequency");
const dialyzerSelect = document.getElementById("dialyzer-preference");
const bloodSelect = document.getElementById("blood-group");
const reportsSelect = document.getElementById("clinical-handover");
const pNameInput = document.getElementById("fullName");
const pPhoneInput = document.getElementById("phoneNumber");
const pEmailInput = document.getElementById("email");
const viralWarningBox = document.getElementById("viral-warning");

// Clinic Input Elements
const cNameInput = document.getElementById("clinic-name");
const cCityInput = document.getElementById("clinic-city");
const cAddrInput = document.getElementById("clinic-address");
const cTotalInput = document.getElementById("clinic-total-machines");
const cIhivInput = document.getElementById("clinic-hiv-machines");
const cIhbvInput = document.getElementById("clinic-hbv-machines");
const cIhcvInput = document.getElementById("clinic-hcv-machines");
const cPolicySelect = document.getElementById("clinic-dialyzer-policy");
const cBadgeCards = document.querySelectorAll(".shift-card[data-badge]");
const cManagerInput = document.getElementById("clinic-manager");
const cPhoneInput = document.getElementById("clinic-phone");
const cEmailInput = document.getElementById("clinic-email");

// Summary & Success Outputs
const summaryDest = document.getElementById("summary-dest");
const summaryDates = document.getElementById("summary-dates");
const summaryRoutine = document.getElementById("summary-routine");
const summaryBlood = document.getElementById("summary-blood");
const summaryViral = document.getElementById("summary-viral");
const successDestText = document.getElementById("success-dest");
const pSuccessScreen = document.getElementById("p-success-screen");

const summaryCName = document.getElementById("summary-c-name");
const summaryCLoc = document.getElementById("summary-c-loc");
const summaryCMachines = document.getElementById("summary-c-machines");
const summaryCBadge = document.getElementById("summary-c-badge");
const successClinicTitle = document.getElementById("success-clinic-title");
const cSuccessScreen = document.getElementById("c-success-screen");

// ==========================================
// INITIAL SETUP
// ==========================================
function init() {
    // 1. Patient dates config
    const today = new Date();
    today.setDate(today.getDate() + 1);
    const tomorrowStr = today.toISOString().split('T')[0];
    startDateInput.min = tomorrowStr;
    
    const startDefault = new Date();
    startDefault.setDate(startDefault.getDate() + 7);
    startDateInput.value = startDefault.toISOString().split('T')[0];
    
    const endDefault = new Date();
    endDefault.setDate(endDefault.getDate() + 14);
    endDateInput.value = endDefault.toISOString().split('T')[0];
    endDateInput.min = startDateInput.value;

    startDateInput.addEventListener("change", () => {
        endDateInput.min = startDateInput.value;
        if (endDateInput.value && endDateInput.value < startDateInput.value) {
            endDateInput.value = startDateInput.value;
        }
    });

    // 2. Patient Shifts selector
    shiftCards.forEach(card => {
        card.addEventListener("click", () => {
            shiftCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            patientData.shift = card.getAttribute("data-shift");
        });
    });

    // 3. Patient Viral toggles
    setupViralToggle("hiv-toggle-group", (val) => { patientData.hivStatus = val; checkViralWarningState(); });
    setupViralToggle("hbv-toggle-group", (val) => { patientData.hbvStatus = val; checkViralWarningState(); });
    setupViralToggle("hcv-toggle-group", (val) => { patientData.hcvStatus = val; checkViralWarningState(); });

    // 4. Clinic badges selector
    cBadgeCards.forEach(card => {
        card.addEventListener("click", () => {
            cBadgeCards.forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            clinicData.badge = card.getAttribute("data-badge");
        });
    });

    // 5. Flow switching listeners
    flowPatientBtn.addEventListener("click", () => switchFlow("patient"));
    flowClinicBtn.addEventListener("click", () => switchFlow("clinic"));

    // 6. Reset listeners
    document.querySelectorAll(".reset-flow-btn").forEach(btn => {
        btn.addEventListener("click", resetFunnel);
    });

    // 7. Landing CTA listeners
    document.getElementById("landing-start-patient-btn").addEventListener("click", () => {
        startWizardFromLanding("patient");
    });
    document.getElementById("landing-start-clinic-btn").addEventListener("click", () => {
        startWizardFromLanding("clinic");
    });

    // Back to Home
    document.getElementById("wizard-back-home-btn").addEventListener("click", returnToLanding);
    document.getElementById("brand-logo-btn").addEventListener("click", returnToLanding);

    // 8. Clear error outlines on input
    setupClearErrorsOnInput();
}

function startWizardFromLanding(flow) {
    landingContainer.style.display = "none";
    wizardContainer.style.display = "block";
    switchFlow(flow);
    document.querySelector("main").scrollIntoView({ behavior: 'smooth' });
}

function returnToLanding() {
    landingContainer.style.display = "block";
    wizardContainer.style.display = "none";
    resetFunnel();
    document.querySelector("main").scrollIntoView({ behavior: 'smooth' });
}

function setupViralToggle(groupId, stateCallback) {
    const group = document.getElementById(groupId);
    if (!group) return;
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
    if (patientData.hivStatus === "Positive" || patientData.hbvStatus === "Positive" || patientData.hcvStatus === "Positive") {
        viralWarningBox.style.display = "flex";
    } else {
        viralWarningBox.style.display = "none";
    }
}

function setupClearErrorsOnInput() {
    const inputsWithErrors = [
        destInput, startDateInput, endDateInput, pNameInput, pPhoneInput, pEmailInput,
        cNameInput, cCityInput, cAddrInput, cTotalInput, cManagerInput, cPhoneInput, cEmailInput
    ];
    inputsWithErrors.forEach(input => {
        if (input) {
            input.addEventListener("input", () => {
                input.closest(".input-group").classList.remove("invalid");
            });
        }
    });
}

// ==========================================
// FLOW SWITCHING
// ==========================================
function switchFlow(flow) {
    activeFlow = flow;

    if (flow === "patient") {
        flowPatientBtn.classList.add("active");
        flowClinicBtn.classList.remove("active");
        patientSections.style.display = "block";
        clinicSections.style.display = "none";
    } else {
        flowPatientBtn.classList.remove("active");
        flowClinicBtn.classList.add("active");
        patientSections.style.display = "none";
        clinicSections.style.display = "block";
    }

    updateStepperLayout();
    updateStepUI();
}

function updateStepperLayout() {
    const config = STEPPER_CONFIG[activeFlow];
    stepCircles.forEach((circle, index) => {
        circle.className = `step-icon-circle`;
        circle.innerHTML = `<i class="${config.icons[index]}"></i>`;
    });
    stepLabels.forEach((label, index) => {
        label.textContent = config.labels[index];
    });
}

// ==========================================
// VALIDATIONS
// ==========================================
function validateCurrentStep() {
    let isValid = true;
    const step = activeFlow === "patient" ? patientStep : clinicStep;

    if (activeFlow === "patient") {
        if (step === 1) {
            if (!destInput.value.trim()) { showError(destInput); isValid = false; }
            if (!startDateInput.value) { showError(startDateInput); isValid = false; }
            if (!endDateInput.value || endDateInput.value < startDateInput.value) { showError(endDateInput); isValid = false; }
        } 
        else if (step === 4) {
            if (!pNameInput.value.trim() || pNameInput.value.trim().length < 2) { showError(pNameInput); isValid = false; }
            const cleanPhone = pPhoneInput.value.replace(/[^0-9+]/g, '');
            if (!cleanPhone || cleanPhone.length < 8) { showError(pPhoneInput); isValid = false; }
            if (pEmailInput.value.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(pEmailInput.value.trim())) { showError(pEmailInput); isValid = false; }
            }
        }
    } 
    else { // Clinic Flow Validation
        if (step === 1) {
            if (!cNameInput.value.trim()) { showError(cNameInput); isValid = false; }
            if (!cCityInput.value.trim()) { showError(cCityInput); isValid = false; }
            if (!cAddrInput.value.trim()) { showError(cAddrInput); isValid = false; }
        } 
        else if (step === 2) {
            if (!cTotalInput.value || parseInt(cTotalInput.value) < 1) { showError(cTotalInput); isValid = false; }
        }
        else if (step === 4) {
            if (!cManagerInput.value.trim()) { showError(cManagerInput); isValid = false; }
            const cleanPhone = cPhoneInput.value.replace(/[^0-9+]/g, '');
            if (!cleanPhone || cleanPhone.length < 8) { showError(cPhoneInput); isValid = false; }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!cEmailInput.value.trim() || !emailRegex.test(cEmailInput.value.trim())) { showError(cEmailInput); isValid = false; }
        }
    }

    return isValid;
}

function showError(element) {
    element.closest(".input-group").classList.add("invalid");
}

// ==========================================
// STEPS NAVIGATION & RENDER
// ==========================================
function updateStepUI() {
    const step = activeFlow === "patient" ? patientStep : clinicStep;

    // Toggle active content divs
    const selectorPrefix = activeFlow === "patient" ? "p-step-" : "c-step-";
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const section = document.getElementById(`${selectorPrefix}${i}`);
        if (section) {
            if (i === step) {
                section.classList.add("active");
            } else {
                section.classList.remove("active");
            }
        }
    }

    // Update stepper badges
    stepperItemsActive(step);

    // Update progress fill
    const percent = ((step - 1) / (TOTAL_STEPS - 1)) * 100;
    progressFill.style.width = `${percent}%`;

    // Configure nav buttons disabled states
    backBtn.disabled = step === 1;

    if (step === TOTAL_STEPS) {
        nextBtn.innerHTML = `Confirm &amp; Submit <i class="ph-bold ph-paper-plane"></i>`;
        populateSummaryReceipt();
    } else {
        nextBtn.innerHTML = `Next Step <i class="ph-bold ph-arrow-right"></i>`;
    }
}

function stepperItemsActive(activeStep) {
    stepperItems = document.querySelectorAll(".step-item");
    stepperItems.forEach((item, index) => {
        const itemStep = index + 1;
        if (itemStep === activeStep) {
            item.className = "step-item active";
        } else if (itemStep < activeStep) {
            item.className = "step-item completed";
        } else {
            item.className = "step-item";
        }
    });
}

// Gather summary choices
function populateSummaryReceipt() {
    if (activeFlow === "patient") {
        patientData.destination = destInput.value.trim();
        patientData.startDate = startDateInput.value;
        patientData.endDate = endDateInput.value;
        patientData.frequency = freqSelect.value;
        patientData.dialyzer = dialyzerSelect.value;
        patientData.bloodGroup = bloodSelect.value;
        patientData.reportsAvailable = reportsSelect.value;
        patientData.fullName = pNameInput.value.trim();
        patientData.phone = pPhoneInput.value.trim();
        patientData.email = pEmailInput.value.trim();

        summaryDest.textContent = patientData.destination;
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        const sDate = new Date(patientData.startDate).toLocaleDateString('en-US', options);
        const eDate = new Date(patientData.endDate).toLocaleDateString('en-US', options);
        summaryDates.textContent = `${sDate} - ${eDate}`;
        summaryRoutine.textContent = `${patientData.frequency} (${patientData.shift})`;
        summaryBlood.textContent = patientData.bloodGroup;

        const positives = [];
        if (patientData.hivStatus === "Positive") positives.push("HIV");
        if (patientData.hbvStatus === "Positive") positives.push("HBV");
        if (patientData.hcvStatus === "Positive") positives.push("HCV");

        if (positives.length > 0) {
            summaryViral.textContent = `Positive (${positives.join(", ")})`;
            summaryViral.style.color = "var(--primary)";
        } else {
            summaryViral.textContent = "Negative (All)";
            summaryViral.style.color = "var(--success)";
        }
    } 
    else { // Clinic Flow
        clinicData.name = cNameInput.value.trim();
        clinicData.city = cCityInput.value.trim();
        clinicData.address = cAddrInput.value.trim();
        clinicData.totalMachines = cTotalInput.value;
        clinicData.hivMachines = cIhivInput.value;
        clinicData.hbvMachines = cIhbvInput.value;
        clinicData.hcvMachines = cIhcvInput.value;
        clinicData.dialyzerPolicy = cPolicySelect.value;
        clinicData.manager = cManagerInput.value.trim();
        clinicData.phone = cPhoneInput.value.trim();
        clinicData.email = cEmailInput.value.trim();

        summaryCName.textContent = clinicData.name;
        summaryCLoc.textContent = `${clinicData.city}, Address: ${clinicData.address}`;
        summaryCMachines.textContent = `${clinicData.totalMachines} Machines (HIV: ${clinicData.hivMachines}, HBV: ${clinicData.hbvMachines}, HCV: ${clinicData.hcvMachines})`;
        summaryCBadge.textContent = `${clinicData.badge} (${clinicData.dialyzerPolicy})`;
    }
}

// Submit action
function submitForm() {
    nextBtn.disabled = true;
    nextBtn.innerHTML = `<i class="ph-bold ph-circle-notch fa-spin"></i> Submitting...`;

    setTimeout(() => {
        // Mark all steps complete
        document.querySelectorAll(".step-item").forEach(item => item.className = "step-item completed");
        progressFill.style.width = "100%";

        // Hide form panels & actions
        if (activeFlow === "patient") {
            document.getElementById("p-step-4").classList.remove("active");
            pSuccessScreen.style.display = "block";
            successDestText.textContent = patientData.destination;
            pSuccessScreen.scrollIntoView({ behavior: 'smooth' });
        } else {
            document.getElementById("c-step-4").classList.remove("active");
            cSuccessScreen.style.display = "block";
            successClinicTitle.textContent = clinicData.name;
            cSuccessScreen.scrollIntoView({ behavior: 'smooth' });
        }
        
        funnelActionsRow.style.display = "none";
    }, 1500);
}

// Reset view states
function resetFunnel() {
    // Clear lists
    destInput.value = "";
    pNameInput.value = "";
    pPhoneInput.value = "";
    pEmailInput.value = "";

    cNameInput.value = "";
    cCityInput.value = "";
    cAddrInput.value = "";
    cTotalInput.value = "";
    cIhivInput.value = 0;
    cIhbvInput.value = 0;
    cIhcvInput.value = 0;
    cManagerInput.value = "";
    cPhoneInput.value = "";
    cEmailInput.value = "";

    document.querySelectorAll(".input-group").forEach(g => g.classList.remove("invalid"));

    // Reset selectors
    freqSelect.selectedIndex = 0;
    dialyzerSelect.selectedIndex = 0;
    bloodSelect.selectedIndex = 2; // B+
    reportsSelect.selectedIndex = 0;
    cPolicySelect.selectedIndex = 0;

    // Reset active shifts
    shiftCards.forEach((c, idx) => {
        if (idx === 0) c.classList.add("active");
        else c.classList.remove("active");
    });
    cBadgeCards.forEach((c, idx) => {
        if (idx === 0) c.classList.add("active");
        else c.classList.remove("active");
    });

    // Reset viral toggles
    document.querySelectorAll(".btn-toggle").forEach(btn => {
        if (btn.getAttribute("data-value") === "Negative") btn.classList.add("active");
        else btn.classList.remove("active");
    });

    patientData.hivStatus = "Negative";
    patientData.hbvStatus = "Negative";
    patientData.hcvStatus = "Negative";
    clinicData.badge = "NABH";
    viralWarningBox.style.display = "none";

    // Restore forms
    patientStep = 1;
    clinicStep = 1;
    if (pSuccessScreen) pSuccessScreen.style.display = "none";
    if (cSuccessScreen) cSuccessScreen.style.display = "none";
    funnelActionsRow.style.display = "";

    init();
    updateStepUI();
}

// ==========================================
// EVENT LISTENERS
// ==========================================
nextBtn.addEventListener("click", () => {
    if (validateCurrentStep()) {
        const step = activeFlow === "patient" ? patientStep : clinicStep;
        if (step < TOTAL_STEPS) {
            if (activeFlow === "patient") patientStep++;
            else clinicStep++;
            updateStepUI();
            document.querySelector("main").scrollIntoView({ behavior: 'smooth' });
        } else {
            submitForm();
        }
    }
});

backBtn.addEventListener("click", () => {
    const step = activeFlow === "patient" ? patientStep : clinicStep;
    if (step > 1) {
        if (activeFlow === "patient") patientStep--;
        else clinicStep--;
        updateStepUI();
        document.querySelector("main").scrollIntoView({ behavior: 'smooth' });
    }
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName !== "TEXTAREA" && !e.target.classList.contains("reset-flow-btn")) {
        e.preventDefault();
        nextBtn.click();
    }
});

// Run
init();
updateStepperLayout();
updateStepUI();
