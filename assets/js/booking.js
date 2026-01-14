// Di bagian atas booking.js
if (window.location.pathname.includes('admin.html') && 
    !localStorage.getItem('session_expiry')) {
    window.location.href = 'index.html';
}
// ========== GLOBAL VARIABLES ==========
let currentStep = 1;

// ========== INITIALIZATION ==========

/**
 * Initialize booking page
 */
function initBookingPage() {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Initialize date picker
    initDatePicker();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize time slots for default date
    const dateInput = document.getElementById('date');
    if (dateInput && dateInput.value) {
        generateTimeSlotsWithBookedStatus(dateInput.value);
    }
    
    // Initialize package details
    updatePackageDetails();
    updateSummary();
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            nav.classList.toggle('active');
            menuToggle.innerHTML = nav.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!nav.contains(e.target) && !menuToggle.contains(e.target)) {
                nav.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
        
        // Close menu when clicking a link
        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                nav.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
}

/**
 * Initialize date picker
 */
/**
 * Initialize date picker
 */
function initDatePicker() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        // PERBAIKAN: Set default date to TODAY, not tomorrow
        const today = new Date();
        // Gunakan valueAsDate untuk set tanggal
        dateInput.valueAsDate = today;
        
        // Set minimum date to today
        dateInput.min = new Date().toISOString().split('T')[0];
        
        // Set max date to 3 months from today
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        // Add change listener
        dateInput.addEventListener('change', function() {
            generateTimeSlotsWithBookedStatus(this.value);
        });
        
        console.log('Date input set to TODAY:', dateInput.value);
    }
}

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Step navigation
    document.querySelectorAll('.next-step').forEach(button => {
        button.addEventListener('click', function() {
            const nextStep = parseInt(this.dataset.next);
            validateAndGoToStep(nextStep);
        });
    });
    
    document.querySelectorAll('.prev-step').forEach(button => {
        button.addEventListener('click', function() {
            const prevStep = parseInt(this.dataset.prev);
            changeStep(prevStep);
        });
    });
    
    // Package selection
    document.querySelectorAll('input[name="package"]').forEach(radio => {
        radio.addEventListener('change', function() {
            // Enable background selection
            document.querySelectorAll('input[name="background"]').forEach(bgRadio => {
                bgRadio.disabled = false;
            });
            
            updatePackageDetails();
            updateSummary();
        });
    });
    
    // Person counter
    const personCountElement = document.getElementById('person-count');
    const decreasePersonBtn = document.getElementById('decrease-person');
    const increasePersonBtn = document.getElementById('increase-person');
    
    if (decreasePersonBtn && increasePersonBtn) {
        decreasePersonBtn.addEventListener('click', function() {
            let count = parseInt(personCountElement.textContent);
            if (count > 1) {
                count--;
                personCountElement.textContent = count;
                updateSummary();
            }
        });
        
        increasePersonBtn.addEventListener('click', function() {
            let count = parseInt(personCountElement.textContent);
            if (count < 4) {
                count++;
                personCountElement.textContent = count;
                updateSummary();
            }
        });
    }
    
    // Additional time selection
    document.querySelectorAll('input[name="time-extra"]').forEach(radio => {
        radio.addEventListener('change', function() {
            updateSummary();
        });
    });
    
    // Additional props checkbox
    const propsCheckbox = document.getElementById('props');
    if (propsCheckbox) {
        propsCheckbox.addEventListener('change', function() {
            updateSummary();
        });
    }
    
    // Booking confirmation
    const confirmBtn = document.getElementById('confirm-booking');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', handleBookingConfirmation);
    }
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });
}

// ========== STEP MANAGEMENT ==========

/**
 * Validate current step and go to next step
 * @param {number} nextStep - Step number to go to
 */
function validateAndGoToStep(nextStep) {
    let isValid = true;
    let errorMessage = '';
    
    if (currentStep === 1) {
        const name = document.getElementById('name').value;
        const phone = document.getElementById('phone').value;
        
        if (!name || !phone) {
            isValid = false;
            errorMessage = 'Harap isi nama dan nomor WhatsApp terlebih dahulu.';
        }
    }
    
    if (currentStep === 2) {
        const selectedPackage = document.querySelector('input[name="package"]:checked');
        const selectedTime = document.querySelector('.time-slot.selected');
        
        if (!selectedPackage) {
            isValid = false;
            errorMessage = 'Harap pilih paket terlebih dahulu.';
        } else if (!selectedTime) {
            isValid = false;
            errorMessage = 'Harap pilih waktu booking terlebih dahulu.';
        }
    }
    
    if (!isValid) {
        alert(errorMessage);
        return;
    }
    
    changeStep(nextStep);
}

/**
 * Change current step
 * @param {number} step - Step number to change to
 */
function changeStep(step) {
    // Hide current step
    const currentFormStep = document.getElementById(`form-step${currentStep}`);
    const currentStepIndicator = document.getElementById(`step${currentStep}`);
    
    if (currentFormStep) {
        currentFormStep.classList.remove('active');
        currentFormStep.scrollTop = 0;
    }
    if (currentStepIndicator) currentStepIndicator.classList.remove('active');
    
    // Show new step
    const newFormStep = document.getElementById(`form-step${step}`);
    const newStepIndicator = document.getElementById(`step${step}`);
    
    if (newFormStep) {
        newFormStep.classList.add('active');
        // Scroll to top on mobile
        if (window.innerWidth < 768) {
            newFormStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    if (newStepIndicator) newStepIndicator.classList.add('active');
    
    // Update step completion status
    updateStepCompletion(step);
    
    currentStep = step;
    
    // Update confirmation if on step 4
    if (step === 4) {
        updateConfirmationDetails();
    }
}

/**
 * Update step completion indicators
 * @param {number} currentStep - Current step number
 */
function updateStepCompletion(currentStep) {
    // Mark previous steps as completed
    for (let i = 1; i < currentStep; i++) {
        const stepIndicator = document.getElementById(`step${i}`);
        if (stepIndicator) stepIndicator.classList.add('completed');
    }
    
    // Unmark steps after current step
    for (let i = currentStep + 1; i <= 4; i++) {
        const stepIndicator = document.getElementById(`step${i}`);
        if (stepIndicator) stepIndicator.classList.remove('completed');
    }
}

// ========== TIME SLOT MANAGEMENT ==========

/**
 * Generate time slots for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 */
function generateTimeSlotsWithBookedStatus(date) {
    const timeSlotsContainer = document.getElementById('time-slots');
    if (!timeSlotsContainer) return;
    
    const bookedTimes = getBookedTimes(date);
    const startHour = 8;
    const endHour = 22;
    
    // Clear existing slots
    timeSlotsContainer.innerHTML = '';
    
    let availableSlots = 0;
    
    // Generate time slots from 08:00 to 22:00 every 30 minutes
    for (let hour = startHour; hour <= endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === endHour && minute === 30) break;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const timeSlot = createTimeSlotElement(timeString, bookedTimes.includes(timeString));
            
            if (!bookedTimes.includes(timeString)) {
                availableSlots++;
            }
            
            timeSlotsContainer.appendChild(timeSlot);
        }
    }
    
    // Show message if no slots available
    if (availableSlots === 0) {
        showNoSlotsMessage(timeSlotsContainer);
    }
}

/**
 * Create a time slot element
 * @param {string} timeString - Time in HH:MM format
 * @param {boolean} isBooked - Whether the time is already booked
 * @returns {HTMLElement} Time slot element
 */
function createTimeSlotElement(timeString, isBooked) {
    const timeSlot = document.createElement('div');
    timeSlot.className = 'time-slot';
    timeSlot.textContent = timeString;
    timeSlot.dataset.time = timeString;
    
    if (isBooked) {
        timeSlot.classList.add('booked');
        timeSlot.title = 'Waktu sudah dipesan';
        timeSlot.style.cursor = 'not-allowed';
        timeSlot.style.opacity = '0.5';
        timeSlot.style.backgroundColor = '#f8d7da';
        timeSlot.style.color = '#721c24';
        timeSlot.style.textDecoration = 'line-through';
        
        // Add ban icon
        const icon = document.createElement('i');
        icon.className = 'fas fa-ban';
        icon.style.marginLeft = '5px';
        timeSlot.appendChild(icon);
    } else {
        timeSlot.title = 'Klik untuk memilih waktu ini';
        
        timeSlot.addEventListener('click', function() {
            selectTimeSlot(this);
        });
        
        // Add hover effects
        timeSlot.addEventListener('mouseenter', function() {
            if (!this.classList.contains('selected')) {
                this.style.backgroundColor = '#e0e0e0';
            }
        });
        
        timeSlot.addEventListener('mouseleave', function() {
            if (!this.classList.contains('selected')) {
                this.style.backgroundColor = '#f5f5f5';
            }
        });
    }
    
    return timeSlot;
}

/**
 * Select a time slot
 * @param {HTMLElement} selectedSlot - The selected time slot element
 */
function selectTimeSlot(selectedSlot) {
    if (selectedSlot.classList.contains('booked')) {
        return;
    }
    
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
        if (!slot.classList.contains('booked')) {
            slot.style.backgroundColor = '#f5f5f5';
        }
    });
    
    selectedSlot.classList.add('selected');
    selectedSlot.style.backgroundColor = '#3498db';
    selectedSlot.style.color = 'white';
    
    updateSummary();
}

/**
 * Show no slots available message
 * @param {HTMLElement} container - Container to add message to
 */
function showNoSlotsMessage(container) {
    const message = document.createElement('div');
    message.className = 'no-slots-message';
    message.style.gridColumn = '1 / -1';
    message.innerHTML = '<i class="fas fa-calendar-times"></i> Semua waktu untuk tanggal ini sudah dipesan. Silakan pilih tanggal lain.';
    container.appendChild(message);
}

// ========== PACKAGE & SUMMARY ==========

/**
 * Update package details based on selection
 */
function updatePackageDetails() {
    const selectedPackage = document.querySelector('input[name="package"]:checked');
    
    const packageDetails = {
        basic: {
            duration: '30 Menit Durasi Foto',
            people: 'Berlaku 1 - 4 orang',
            print: '2 Print Ukuran 4R',
            softcopy: 'All Softcopy File',
            costume: 'Free Costume & Accessories (terbatas)'
        },
        premium: {
            duration: '60 Menit Durasi Foto',
            people: 'Berlaku 1 - 4 orang',
            print: '4 Print Ukuran 4R',
            softcopy: 'All Softcopy File + 5 edit profesional',
            costume: 'Free Costume & Accessories'
        },
        exclusive: {
            duration: '90 Menit Durasi Foto',
            people: 'Berlaku 1 - 6 orang',
            print: '8 Print Ukuran 4R',
            softcopy: 'All Softcopy File + 10 edit profesional',
            costume: 'Free Costume & Accessories + Properti Eksklusif'
        }
    };
    
    if (selectedPackage && packageDetails[selectedPackage.value]) {
        const details = packageDetails[selectedPackage.value];
        
        document.getElementById('detail-duration').textContent = details.duration;
        document.getElementById('detail-people').textContent = details.people;
        document.getElementById('detail-print').textContent = details.print;
        document.getElementById('detail-softcopy').textContent = details.softcopy;
        document.getElementById('detail-costume').textContent = details.costume;
        
        const sessionInfo = document.getElementById('session-info');
        if (sessionInfo) {
            sessionInfo.textContent = `${selectedPackage.value.charAt(0).toUpperCase() + selectedPackage.value.slice(1)} Package`;
        }
    }
}

/**
 * Update booking summary and total price
 */
function updateSummary() {
    let total = 0;
    
    // Package price
    const selectedPackage = document.querySelector('input[name="package"]:checked');
    const packagePrices = {
        basic: 150000,
        premium: 250000,
        exclusive: 350000
    };
    
    if (selectedPackage) {
        total += packagePrices[selectedPackage.value] || 0;
    }
    
    // Additional person
    const personCount = document.getElementById('person-count');
    if (personCount) {
        const people = parseInt(personCount.textContent);
        if (people > 1) {
            total += (people - 1) * 35000;
        }
    }
    
    // Additional time
    const selectedTimeExtra = document.querySelector('input[name="time-extra"]:checked');
    if (selectedTimeExtra) {
        const timeExtra = parseInt(selectedTimeExtra.value);
        if (timeExtra === 30) {
            total += 50000;
        } else if (timeExtra === 60) {
            total += 90000;
        }
    }
    
    // Additional props
    const propsCheckbox = document.getElementById('props');
    if (propsCheckbox && propsCheckbox.checked) {
        total += 15000;
    }
    
    // Update total price display
    const totalPriceElement = document.getElementById('total-price');
    if (totalPriceElement) {
        totalPriceElement.textContent = `Rp ${formatNumber(total)}`;
    }
}

/**
 * Update confirmation details for step 4
 */
function updateConfirmationDetails() {
    const name = document.getElementById('name').value || '-';
    const phone = document.getElementById('phone').value || '-';
    const email = document.getElementById('email').value || '-';
    const date = document.getElementById('date').value || '-';
    const selectedPackage = document.querySelector('input[name="package"]:checked');
    const selectedTime = document.querySelector('.time-slot.selected');
    const selectedBackground = document.querySelector('input[name="background"]:checked');
    const personCount = document.getElementById('person-count') ? document.getElementById('person-count').textContent : '1';
    const selectedTimeExtra = document.querySelector('input[name="time-extra"]:checked');
    const selectedVehicle = document.querySelector('input[name="vehicle"]:checked');
    const propsChecked = document.getElementById('props') ? document.getElementById('props').checked : false;
    
    const confirmationHTML = `
        <li><span>Nama</span><span>${name}</span></li>
        <li><span>WhatsApp</span><span>${phone}</span></li>
        <li><span>Email</span><span>${email}</span></li>
        <li><span>Tanggal</span><span>${formatDate(date)}</span></li>
        <li><span>Waktu</span><span>${selectedTime ? selectedTime.dataset.time : '-'}</span></li>
        <li><span>Paket</span><span>${selectedPackage ? selectedPackage.value.charAt(0).toUpperCase() + selectedPackage.value.slice(1) : '-'}</span></li>
        <li><span>Background</span><span>${getBackgroundName(selectedBackground ? selectedBackground.value : '')}</span></li>
        <li><span>Jumlah Orang</span><span>${personCount}</span></li>
        <li><span>Tambahan Waktu</span><span>${selectedTimeExtra ? selectedTimeExtra.value + ' menit' : 'Tidak'}</span></li>
        <li><span>Kendaraan</span><span>${getVehicleName(selectedVehicle ? selectedVehicle.value : 'none')}</span></li>
        <li><span>Properti Tambahan</span><span>${propsChecked ? 'Ya' : 'Tidak'}</span></li>
    `;
    
    const bookingSummaryDetails = document.getElementById('booking-summary-details');
    if (bookingSummaryDetails) {
        bookingSummaryDetails.innerHTML = confirmationHTML;
    }
    
    // Scroll to top on mobile
    if (window.innerWidth < 768) {
        const formStep4 = document.getElementById('form-step4');
        if (formStep4) {
            setTimeout(() => {
                formStep4.scrollTop = 0;
            }, 100);
        }
    }
}

// ========== BOOKING CONFIRMATION ==========

/**
 * Handle booking confirmation
 */
function handleBookingConfirmation() {
    // Validate step 4 is active
    if (currentStep !== 4) {
        alert('Silakan lengkapi semua langkah booking terlebih dahulu');
        return;
    }
    
    // Collect booking data
    const bookingData = collectBookingData();
    
    // Validate data
    const validationErrors = validateBookingData(bookingData);
    if (validationErrors.length > 0) {
        alert('Harap perbaiki kesalahan berikut:\n' + validationErrors.join('\n'));
        return;
    }
    
    // Check if time is still available
    const bookedTimes = getBookedTimes(bookingData.date);
    if (bookedTimes.includes(bookingData.time)) {
        alert('Maaf, waktu ' + bookingData.time + ' sudah dipesan oleh orang lain. Silakan pilih waktu lain.');
        generateTimeSlotsWithBookedStatus(bookingData.date);
        return;
    }
    
    try {
        // Save booking
        const bookingId = saveBookingToDB(bookingData);
        
        // Show WhatsApp confirmation
        showWhatsAppConfirmation(bookingData, bookingId);
        
        // Refresh time slots
        setTimeout(() => {
            generateTimeSlotsWithBookedStatus(bookingData.date);
        }, 1000);
        
    } catch (error) {
        alert('Gagal menyimpan booking: ' + error.message);
    }
}

/**
 * Collect booking data from form
 * @returns {Object} Booking data object
 */
function collectBookingData() {
    const selectedPackage = document.querySelector('input[name="package"]:checked');
    const selectedBackground = document.querySelector('input[name="background"]:checked');
    const selectedTime = document.querySelector('.time-slot.selected');
    const selectedVehicle = document.querySelector('input[name="vehicle"]:checked');
    const selectedTimeExtra = document.querySelector('input[name="time-extra"]:checked');
    
    // Calculate total price
    let total = 0;
    const packagePrices = { basic: 150000, premium: 250000, exclusive: 350000 };
    
    if (selectedPackage) total += packagePrices[selectedPackage.value] || 0;
    
    const personCount = parseInt(document.getElementById('person-count').textContent);
    if (personCount > 1) total += (personCount - 1) * 35000;
    
    if (selectedTimeExtra) {
        const timeExtra = parseInt(selectedTimeExtra.value);
        if (timeExtra === 30) total += 50000;
        else if (timeExtra === 60) total += 90000;
    }
    
    const propsChecked = document.getElementById('props').checked;
    if (propsChecked) total += 15000;
    
    return {
        name: document.getElementById('name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        email: document.getElementById('email').value.trim(),
        date: document.getElementById('date').value,
        time: selectedTime ? selectedTime.dataset.time : '',
        package: selectedPackage ? selectedPackage.value : '',
        background: selectedBackground ? selectedBackground.value : '',
        people: personCount,
        vehicle: selectedVehicle ? selectedVehicle.value : 'none',
        timeExtra: selectedTimeExtra ? parseInt(selectedTimeExtra.value) : 0,
        props: propsChecked,
        total: total,
        status: 'pending',
        bookingDate: new Date().toISOString()
    };
}

/**
 * Show WhatsApp confirmation modal
 * @param {Object} bookingData - Booking data
 * @param {string} bookingId - Booking ID
 */
function showWhatsAppConfirmation(bookingData, bookingId) {
    // NOMOR ADMIN - TETAP KE NOMOR ANDA
    const adminPhone = "081529830329"; // Ganti dengan nomor admin Anda
    
    // Format nomor admin untuk WhatsApp
    let cleanPhone = adminPhone.replace(/\D/g, '');
    
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    } else if (cleanPhone.startsWith('+62')) {
        cleanPhone = cleanPhone.substring(1);
    } else if (!cleanPhone.startsWith('62')) {
        cleanPhone = '62' + cleanPhone;
    }
    
    // Create WhatsApp message untuk ADMIN
    const messageLines = [
        `📋 *NEW BOOKING - RENWAR PHOTOBOX*`,
        '',
        `📅 *Tanggal:* ${formatDate(bookingData.date)}`,
        `⏰ *Waktu:* ${bookingData.time}`,
        `👤 *Nama:* ${bookingData.name}`,
        `📞 *WhatsApp:* ${bookingData.phone}`,
        `📧 *Email:* ${bookingData.email || '-'}`,
        `🎯 *Paket:* ${bookingData.package.toUpperCase()}`,
        `👥 *Jumlah Orang:* ${bookingData.people} orang`,
        `🎨 *Background:* ${getBackgroundName(bookingData.background)}`,
        `🚗 *Kendaraan:* ${getVehicleName(bookingData.vehicle)}`,
        `⏱️ *Tambahan Waktu:* ${bookingData.timeExtra || 0} menit`,
        `🎁 *Properti Tambahan:* ${bookingData.props ? 'Ya' : 'Tidak'}`,
        `💰 *Total:* Rp ${formatNumber(bookingData.total)}`,
        `🆔 *ID Booking:* ${bookingId}`,
        `📊 *Status:* Pending`,
        '',
        `📍 *Lokasi:* Renwar Photobox, Jln Bypass Ngurah Rai`,
        '',
    ];
    
    const message = encodeURIComponent(messageLines.join('\n'));
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${message}`;
    
    // Update modal content untuk PELANGGAN
    document.getElementById('whatsapp-number').textContent = bookingData.phone;
    const whatsappBtn = document.getElementById('whatsapp-link');
    whatsappBtn.href = whatsappLink;
    
    // Show modal
    showModal('whatsapp-modal');
    
    // Add click handler for WhatsApp button
    whatsappBtn.onclick = function(e) {
        window.open(whatsappLink, '_blank');
        
        // Juga kirim notifikasi ke pelanggan (opsional)
        sendCustomerNotification(bookingData, bookingId);
        
        setTimeout(() => {
            closeModal('whatsapp-modal');
            resetBookingForm();
        }, 2000);
    };
}

/**
 * Reset booking form after successful booking
 */
function resetBookingForm() {
    // Reset to step 1
    changeStep(1);
    
    // Clear form fields
    document.getElementById('name').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('email').value = '';
    
    // Reset selections
    document.querySelectorAll('input[name="package"]').forEach(radio => {
        radio.checked = false;
    });
    
    document.querySelectorAll('input[name="background"]').forEach(radio => {
        radio.checked = false;
        radio.disabled = true;
    });
    
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    document.getElementById('person-count').textContent = '1';
    document.querySelectorAll('input[name="time-extra"]')[0].checked = true;
    document.querySelectorAll('input[name="vehicle"]')[0].checked = true;
    document.getElementById('props').checked = false;
    
    // Update summary
    updateSummary();
    updatePackageDetails();
    
    // Set date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.valueAsDate = tomorrow;
        generateTimeSlotsWithBookedStatus(dateInput.value);
    }
}

// ========== RESPONSIVE HANDLING ==========

/**
 * Handle responsive layout updates
 */
function handleResponsive() {
    updateTimeSlotsLayout();
    updateStepIndicatorForMobile();
}

/**
 * Update time slots layout for different screen sizes
 */
function updateTimeSlotsLayout() {
    const timeSlotsContainer = document.getElementById('time-slots');
    if (!timeSlotsContainer) return;
    
    const timeSlots = timeSlotsContainer.querySelectorAll('.time-slot');
    const screenWidth = window.innerWidth;
    
    timeSlots.forEach(slot => {
        if (screenWidth < 480) {
            slot.style.fontSize = '11px';
            slot.style.padding = '8px 4px';
            slot.style.minHeight = '35px';
        } else if (screenWidth < 768) {
            slot.style.fontSize = '12px';
            slot.style.padding = '10px 5px';
            slot.style.minHeight = '40px';
        } else {
            slot.style.fontSize = '';
            slot.style.padding = '';
            slot.style.minHeight = '';
        }
    });
}

/**
 * Update step indicator for mobile
 */
function updateStepIndicatorForMobile() {
    const stepIndicator = document.querySelector('.step-indicator');
    if (!stepIndicator) return;
    
    const screenWidth = window.innerWidth;
    const steps = stepIndicator.querySelectorAll('.step');
    
    if (screenWidth < 576) {
        steps.forEach(step => {
            const label = step.querySelector('.step-label');
            if (label) {
                const originalText = label.textContent;
                if (originalText.includes('Data')) label.textContent = 'Data';
                if (originalText.includes('Waktu')) label.textContent = 'Waktu';
                if (originalText.includes('Tambahan')) label.textContent = 'Tambahan';
                if (originalText.includes('Konfirmasi')) label.textContent = 'Konfirmasi';
            }
        });
    }
}

// ========== DOM READY ==========

/**
 * Initialize when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    initBookingPage();
    handleResponsive();
    
    // Add resize listener
    window.addEventListener('resize', handleResponsive);
    
    // Add orientation change listener
    window.addEventListener('orientationchange', function() {
        setTimeout(() => {
            handleResponsive();
            const dateInput = document.getElementById('date');
            if (dateInput && dateInput.value) {
                setTimeout(() => {
                    generateTimeSlotsWithBookedStatus(dateInput.value);
                }, 200);
            }
        }, 100);
    });
    
    // Mobile optimizations
    if (window.innerWidth < 768) {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function(event) {
            const now = (new Date()).getTime();
            if (now - lastTouchEnd <= 300) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, false);
        
        // Scroll to input on focus for iOS
        document.addEventListener('focusin', function(e) {
            setTimeout(() => {
                e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    }
});