// ========== DATABASE FUNCTIONS ==========
const DB_KEY = 'photobox_bookings';

/**
 * Get all bookings from localStorage
 * @returns {Array} Array of booking objects
 */
function getBookingsFromDB() {
    try {
        const bookings = localStorage.getItem(DB_KEY);
        return bookings ? JSON.parse(bookings) : [];
    } catch (error) {
        console.error('Error reading from database:', error);
        return [];
    }
}

/**
 * Save booking to localStorage
 * @param {Object} bookingData - Booking data to save
 * @returns {string} Booking ID
 */
function saveBookingToDB(bookingData) {
    try {
        const bookings = getBookingsFromDB();
        
        // Generate booking ID
        const bookingId = 'BK' + (bookings.length + 1).toString().padStart(3, '0');
        
        // Add metadata
        bookingData.id = bookingId;
        bookingData.createdAt = new Date().toISOString();
        bookingData.updatedAt = new Date().toISOString();
        
        // Validate required data
        if (!bookingData.date || !bookingData.time) {
            throw new Error('Tanggal dan waktu booking diperlukan');
        }
        
        bookings.push(bookingData);
        localStorage.setItem(DB_KEY, JSON.stringify(bookings));
        
        console.log('Booking saved:', bookingData);
        return bookingId;
    } catch (error) {
        console.error('Error saving booking:', error);
        throw error;
    }
}

/**
 * Update booking in localStorage
 * @param {string} bookingId - ID of booking to update
 * @param {Object} updates - Updates to apply
 * @returns {boolean} Success status
 */
function updateBookingInDB(bookingId, updates) {
    try {
        const bookings = getBookingsFromDB();
        const index = bookings.findIndex(b => b.id === bookingId);
        
        if (index >= 0) {
            bookings[index] = {
                ...bookings[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            localStorage.setItem(DB_KEY, JSON.stringify(bookings));
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating booking:', error);
        return false;
    }
}

// ========== TIME SLOT FUNCTIONS ==========

/**
 * Get booked times for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Array} Array of booked time slots
 */
function getBookedTimes(date) {
    const bookings = getBookingsFromDB();
    const bookedTimes = [];
    
    bookings.forEach(booking => {
        if (booking.date === date && booking.status !== 'cancelled') {
            // Add main time
            bookedTimes.push(booking.time);
            
            // Add extra time slots if applicable
            if (booking.timeExtra && booking.timeExtra > 0) {
                const startTime = booking.time;
                const extraSlots = booking.timeExtra / 30;
                
                const [hours, minutes] = startTime.split(':').map(Number);
                let currentHour = hours;
                let currentMinute = minutes;
                
                for (let i = 1; i <= extraSlots; i++) {
                    currentMinute += 30;
                    if (currentMinute >= 60) {
                        currentHour += 1;
                        currentMinute = 0;
                    }
                    
                    const nextTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
                    bookedTimes.push(nextTime);
                }
            }
        }
    });
    
    return [...new Set(bookedTimes)];
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY
 * @param {string} dateString - Date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Get background display name
 * @param {string} bg - Background value
 * @returns {string} Display name
 */
function getBackgroundName(bg) {
    const bgNames = {
        navy: 'Tirai Navy',
        green: 'Tirai Hijau',
        grey: 'Photobox Grey',
        retro: 'Retro Area'
    };
    return bg ? bgNames[bg] || bg : '-';
}

/**
 * Get vehicle display name
 * @param {string} vehicle - Vehicle value
 * @returns {string} Display name
 */
function getVehicleName(vehicle) {
    const vehicleNames = {
        none: 'Tidak Bawa Kendaraan',
        motor: 'Motor',
        mobil: 'Mobil'
    };
    return vehicleNames[vehicle] || vehicle;
}

/**
 * Show modal by ID
 * @param {string} modalId - ID of modal to show
 */
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close modal by ID
 * @param {string} modalId - ID of modal to close
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Show notification message
 * @param {string} message - Message to display
 */
function showNotification(message) {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.textContent = message;
        notification.style.display = 'block';
        
        setTimeout(() => {
            notification.style.display = 'none';
        }, 3000);
    }
}

/**
 * Validate booking data
 * @param {Object} bookingData - Booking data to validate
 * @returns {Array} Array of error messages
 */
function validateBookingData(bookingData) {
    const errors = [];
    
    if (!bookingData.name) errors.push('Nama harus diisi');
    if (!bookingData.phone) errors.push('Nomor WhatsApp harus diisi');
    if (!bookingData.date) errors.push('Tanggal harus dipilih');
    if (!bookingData.time) errors.push('Waktu harus dipilih');
    if (!bookingData.package) errors.push('Paket harus dipilih');
    
    // Validate time not already booked
    const bookedTimes = getBookedTimes(bookingData.date);
    if (bookedTimes.includes(bookingData.time)) {
        errors.push('Waktu yang dipilih sudah dipesan oleh orang lain');
    }
    
    return errors;
}

/**
 * Get status display text
 * @param {string} status - Status value
 * @returns {string} Display text
 */
function getStatusText(status) {
    const statusMap = {
        'confirmed': 'Confirmed',
        'pending': 'Pending',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'no-show': 'No-Show'
    };
    return statusMap[status] || status;
}

/**
 * Get first day of current month
 * @returns {string} Date in YYYY-MM-DD format
 */
function getFirstDayOfMonth() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
}

// ========== EXPORT FUNCTIONS ==========

/**
 * Export bookings data as CSV
 */
function exportData() {
    const bookings = getBookingsFromDB();
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Nama,Telepon,Tanggal,Waktu,Paket,Orang,Total,Status,Catatan\n";
    
    bookings.forEach(booking => {
        const row = [
            booking.id,
            booking.name,
            booking.phone,
            booking.date,
            booking.time,
            booking.package,
            booking.people,
            booking.total,
            booking.status,
            booking.notes || ''
        ].join(",");
        csvContent += row + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "bookings_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Data berhasil diexport!');
}