// ========== GLOBAL VARIABLES ==========
let calendarCurrentMonth = new Date().getMonth();
let calendarCurrentYear = new Date().getFullYear();
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let currentFilter = {};

// ========== INITIALIZATION ==========

/**
 * Initialize admin dashboard
 */
function initAdminDashboard() {
    // Set current date
    document.getElementById('current-date').textContent = formatDate(new Date().toISOString().split('T')[0]);
    
    // Initialize mobile menu
    initAdminMobileMenu();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize form submission
    initBookingFormAdmin();
    
    // Initialize settings form
    initSettingsForm();
    
    // Initialize filters
    initFilters();
    
    // Initialize charts
    initCharts();
    
    // Load initial data
    refreshAllData();
    
    // Set default filter dates
    setDefaultFilterDates();
    
    // Setup auto-refresh every 30 seconds
    setInterval(() => {
        refreshAllData();
    }, 30000);
    
    // Add event listeners for real-time updates
    setupRealTimeUpdates();
    document.querySelector('.btn-logout').addEventListener('click', function() {
        if (confirm('Yakin ingin logout?')) {
            localStorage.removeItem('session_expiry');
            window.location.href = 'index.html';
        }
    });
}

function logoutAdmin() {
    localStorage.removeItem('session_expiry');
    window.location.href = 'index.html';
}

/**
 * Setup real-time updates from localStorage
 */
function setupRealTimeUpdates() {
    // Listen for storage events (changes from other tabs/windows)
    window.addEventListener('storage', function(e) {
        if (e.key === 'photobox_bookings') {
            showNotification('Data diperbarui dari sumber lain', 'info');
            refreshAllData();
        }
    });
    
    // Check for changes periodically
    let lastDataHash = '';
    setInterval(() => {
        const bookings = getBookingsFromDB();
        const currentHash = JSON.stringify(bookings);
        
        if (currentHash !== lastDataHash) {
            lastDataHash = currentHash;
            refreshAllData();
        }
    }, 1000);
}

/**
 * Initialize admin mobile menu
 */
function initAdminMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;
    
    // Create hamburger menu for mobile
    if (window.innerWidth <= 768) {
        const hamburger = document.createElement('button');
        hamburger.className = 'hamburger-menu';
        hamburger.innerHTML = '<i class="fas fa-bars"></i>';
        hamburger.onclick = () => navMenu.classList.toggle('mobile-active');
        
        document.querySelector('.header').prepend(hamburger);
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !hamburger.contains(e.target)) {
                navMenu.classList.remove('mobile-active');
            }
        });
    }
}

/**
 * Initialize navigation between pages
 */
function initNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Handle external links
            if (this.getAttribute('href') === 'index.html') {
                window.open(this.getAttribute('href'), '_blank');
                return;
            }
            
            // Update active nav
            document.querySelectorAll('.nav-link').forEach(item => {
                item.classList.remove('active');
            });
            this.classList.add('active');
            
            // Show selected page
            const page = this.dataset.page;
            switchPage(page);
        });
    });
}

/**
 * Switch to a different page
 * @param {string} page - Page identifier
 */
function switchPage(page) {
    document.querySelectorAll('.page-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${page}-page`).classList.add('active');
    
    // Update page title
    updatePageTitle(page);
    
    // Refresh data for the page
    refreshPageData(page);
    
    // Close mobile menu if open
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) navMenu.classList.remove('mobile-active');
}

/**
 * Update page title
 * @param {string} page - Page identifier
 */
function updatePageTitle(page) {
    const pageTitles = {
        dashboard: 'Dashboard',
        bookings: 'Semua Booking',
        calendar: 'Kalender Booking',
        reports: 'Laporan',
        settings: 'Pengaturan'
    };
    
    document.getElementById('page-title').textContent = pageTitles[page] || page;
    document.title = `${pageTitles[page]} - Admin Renwar Photobox`;
}

/**
 * Refresh data for specific page
 * @param {string} page - Page identifier
 */
function refreshPageData(page) {
    switch(page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'bookings':
            loadBookingsTable();
            break;
        case 'calendar':
            loadCalendar();
            break;
        case 'reports':
            loadReportData();
            break;
        case 'settings':
            loadSettings();
            break;
    }
}

/**
 * Initialize booking form for admin
 */
function initBookingFormAdmin() {
    const form = document.getElementById('booking-form-admin');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            saveBookingAdmin();
        });
        
        // Add real-time total calculation
        const calculateTotal = () => {
            const packageValue = document.getElementById('edit-package').value;
            const people = parseInt(document.getElementById('edit-people').value) || 1;
            const timeExtra = parseInt(document.getElementById('edit-time-extra').value) || 0;
            const props = document.getElementById('edit-props').value === 'true';
            
            // Use the same pricing as website
            const packagePrices = {
                basic: 150000,
                premium: 250000,
                exclusive: 350000
            };
            
            let total = packagePrices[packageValue] || 0;
            
            // Additional person charge
            if (people > 1) {
                total += (people - 1) * 35000;
            }
            
            // Additional time charge
            if (timeExtra === 30) {
                total += 50000;
            } else if (timeExtra === 60) {
                total += 90000;
            }
            
            // Additional props charge
            if (props) {
                total += 15000;
            }
            
            document.getElementById('edit-total').value = total;
        };
        
        // Add event listeners for total calculation
        document.getElementById('edit-package').addEventListener('change', calculateTotal);
        document.getElementById('edit-people').addEventListener('input', calculateTotal);
        document.getElementById('edit-time-extra').addEventListener('change', calculateTotal);
        document.getElementById('edit-props').addEventListener('change', calculateTotal);
        
        // Calculate initial total
        calculateTotal();
    }
}

/**
 * Initialize settings form
 */
function initSettingsForm() {
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
    
    // Load saved settings
    loadSettings();
}

/**
 * Initialize filters
 */
function initFilters() {
    document.getElementById('filter-date').addEventListener('change', () => {
        currentPage = 1;
        loadBookingsTable();
    });
    
    document.getElementById('filter-status').addEventListener('change', () => {
        currentPage = 1;
        loadBookingsTable();
    });
    
    document.getElementById('filter-package').addEventListener('change', () => {
        currentPage = 1;
        loadBookingsTable();
    });
    
    document.getElementById('report-from').addEventListener('change', loadReportData);
    document.getElementById('report-to').addEventListener('change', loadReportData);
    document.getElementById('report-group').addEventListener('change', loadReportData);
}

/**
 * Initialize charts
 */
function initCharts() {
    // Package chart
    window.packageChart = new Chart(document.getElementById('package-chart'), {
        type: 'pie',
        data: {
            labels: ['Basic', 'Premium', 'Exclusive'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: [
                    '#3498db', // Basic - Blue
                    '#2ecc71', // Premium - Green
                    '#9b59b6'  // Exclusive - Purple
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                },
                title: {
                    display: true,
                    text: 'Distribusi Paket'
                }
            }
        }
    });
    
    // Daily chart
    window.dailyChart = new Chart(document.getElementById('daily-chart'), {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Pendapatan (Rp)',
                data: [],
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: true
                },
                title: {
                    display: true,
                    text: 'Pendapatan Harian'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'Rp ' + value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                        }
                    }
                }
            }
        }
    });
}

/**
 * Set default filter dates
 */
function setDefaultFilterDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('filter-date').value = '';
    
    // Report dates - default to current month
    const firstDay = new Date();
    firstDay.setDate(1);
    document.getElementById('report-from').value = firstDay.toISOString().split('T')[0];
    document.getElementById('report-to').value = today;
}

// ========== DASHBOARD FUNCTIONS ==========

/**
 * Load dashboard data
 */
function loadDashboard() {
    showLoading(true);
    
    const bookings = getBookingsFromDB();
    const today = new Date().toISOString().split('T')[0];
    
    // Filter today's bookings
    const todayBookings = bookings.filter(b => b.date === today);
    const pendingBookings = bookings.filter(b => b.status === 'pending');
    const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
    
    // Update quick stats
    document.getElementById('stat-today').textContent = todayBookings.length;
    
    // Update pending badge
    document.getElementById('pending-badge').textContent = pendingBookings.length;
    
    // Calculate monthly revenue
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyRevenue = bookings
        .filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate.getMonth() === currentMonth && 
                   bookingDate.getFullYear() === currentYear &&
                   (b.status === 'confirmed' || b.status === 'completed');
        })
        .reduce((sum, b) => sum + b.total, 0);
    
    document.getElementById('stat-revenue').textContent = `Rp ${formatNumber(monthlyRevenue)}`;
    document.getElementById('stat-pending').textContent = pendingBookings.length;
    
    // No-show count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const noshowCount = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return b.status === 'no-show' && bookingDate >= thirtyDaysAgo;
    }).length;
    
    document.getElementById('stat-noshow').textContent = noshowCount;
    
    // Load today's bookings
    loadTodayBookings(todayBookings);
    
    // Load recent bookings
    loadRecentBookings(bookings);
    
    showLoading(false);
}

/**
 * Load today's bookings list
 * @param {Array} bookings - Today's bookings
 */
function loadTodayBookings(bookings) {
    const container = document.getElementById('today-bookings-list');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>Tidak ada booking hari ini</h3>
                <p>Belum ada booking untuk tanggal hari ini</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    bookings.sort((a, b) => {
        const timeA = parseInt(a.time.replace(':', ''));
        const timeB = parseInt(b.time.replace(':', ''));
        return timeA - timeB;
    }).forEach(booking => {
        const statusClass = booking.status;
        const statusText = getStatusText(booking.status);
        
        html += `
            <div class="booking-item ${statusClass}">
                <div class="booking-info">
                    <h4>${booking.name}</h4>
                    <p>
                        <span class="status-dot ${statusClass}"></span>
                        ${statusText}
                        • ${booking.package}
                        • ${booking.people} orang
                    </p>
                </div>
                <div class="booking-details">
                    <div class="booking-time">${booking.time}</div>
                    <div class="booking-actions">
                        <button class="btn-action edit" onclick="editBooking('${booking.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${booking.status === 'pending' ? `
                            <button class="btn-action complete" onclick="confirmBooking('${booking.id}')" title="Konfirmasi">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : ''}
                        ${booking.status === 'confirmed' ? `
                            <button class="btn-action complete" onclick="markAsCompleted('${booking.id}')" title="Selesai">
                                <i class="fas fa-check-double"></i>
                            </button>
                        ` : ''}
                        <button class="btn-action delete" onclick="showDeleteConfirm('${booking.id}')" title="Hapus">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

/**
 * Load recent bookings
 * @param {Array} bookings - All bookings
 */
function loadRecentBookings(bookings) {
    const container = document.getElementById('recent-bookings');
    if (!container) return;
    
    // Get last 5 bookings
    const recentBookings = [...bookings]
        .sort((a, b) => new Date(b.bookingDate || b.createdAt) - new Date(a.bookingDate || a.createdAt))
        .slice(0, 5);
    
    if (recentBookings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-clock"></i>
                <h3>Belum ada booking</h3>
                <p>Booking terbaru akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    
    recentBookings.forEach(booking => {
        const statusClass = booking.status;
        const statusText = getStatusText(booking.status);
        const bookingDate = formatDate(booking.date);
        
        html += `
            <div class="booking-item ${statusClass}">
                <div class="booking-info">
                    <h4>${booking.name}</h4>
                    <p>
                        <span class="status-dot ${statusClass}"></span>
                        ${statusText}
                        • ${bookingDate} ${booking.time}
                        • Rp ${formatNumber(booking.total)}
                    </p>
                </div>
                <div class="booking-actions">
                    <button class="btn-action edit" onclick="editBooking('${booking.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// ========== BOOKINGS TABLE FUNCTIONS ==========

/**
 * Load all bookings table
 */
function loadBookingsTable() {
    showLoading(true);
    
    const bookings = getBookingsFromDB();
    
    // Apply filters
    const filteredBookings = applyBookingsFilters(bookings);
    
    // Calculate pagination
    totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
    
    // Update pagination UI
    updatePaginationUI();
    
    // Render table
    renderBookingsTable(paginatedBookings);
    
    showLoading(false);
}

/**
 * Apply filters to bookings
 * @param {Array} bookings - All bookings
 * @returns {Array} Filtered bookings
 */
function applyBookingsFilters(bookings) {
    const dateFilter = document.getElementById('filter-date').value;
    const statusFilter = document.getElementById('filter-status').value;
    const packageFilter = document.getElementById('filter-package').value;
    
    let filteredBookings = [...bookings];
    
    // Store current filter
    currentFilter = { dateFilter, statusFilter, packageFilter };
    
    if (dateFilter) {
        filteredBookings = filteredBookings.filter(b => b.date === dateFilter);
    }
    
    if (statusFilter !== 'all') {
        filteredBookings = filteredBookings.filter(b => b.status === statusFilter);
    }
    
    if (packageFilter !== 'all') {
        filteredBookings = filteredBookings.filter(b => b.package === packageFilter);
    }
    
    // Sort by date and time (newest first)
    filteredBookings.sort((a, b) => {
        const dateCompare = new Date(b.date) - new Date(a.date);
        if (dateCompare !== 0) return dateCompare;
        
        const timeA = parseInt(a.time.replace(':', ''));
        const timeB = parseInt(b.time.replace(':', ''));
        return timeA - timeB;
    });
    
    return filteredBookings;
}

/**
 * Render bookings table
 * @param {Array} bookings - Bookings to render
 */
function renderBookingsTable(bookings) {
    const tbody = document.querySelector('#all-bookings-table tbody');
    if (!tbody) return;
    
    if (bookings.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <h3>Tidak ada data</h3>
                        <p>Tidak ditemukan booking dengan filter yang dipilih</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    let html = '';
    
    bookings.forEach(booking => {
        const statusClass = booking.status;
        const statusText = getStatusText(booking.status);
        const bookingDate = formatDate(booking.date);
        
        html += `
            <tr>
                <td><strong>${booking.id}</strong></td>
                <td>
                    <div class="customer-info">
                        <div class="customer-name">${booking.name}</div>
                        <div class="customer-phone">${booking.phone}</div>
                    </div>
                </td>
                <td>${bookingDate}</td>
                <td><span class="booking-time">${booking.time}</span></td>
                <td>${booking.package.charAt(0).toUpperCase() + booking.package.slice(1)}</td>
                <td>${booking.people} orang</td>
                <td><strong>Rp ${formatNumber(booking.total)}</strong></td>
                <td><span class="status-badge ${statusClass}"><i class="fas fa-circle"></i> ${statusText}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-action edit" onclick="editBooking('${booking.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action complete" onclick="showWhatsAppModal('${booking.id}')" title="Kirim WhatsApp">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                        ${booking.status === 'pending' || booking.status === 'confirmed' ? `
                            <button class="btn-action delete" onclick="showStatusChangeModal('${booking.id}')" title="Ubah Status">
                                <i class="fas fa-exchange-alt"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

/**
 * Update pagination UI
 */
function updatePaginationUI() {
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    
    const prevBtn = document.querySelector('.btn-pagination.prev');
    const nextBtn = document.querySelector('.btn-pagination.next');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

/**
 * Go to previous page
 */
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadBookingsTable();
    }
}

/**
 * Go to next page
 */
function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        loadBookingsTable();
    }
}

/**
 * Reset filters
 */
function resetFilters() {
    document.getElementById('filter-date').value = '';
    document.getElementById('filter-status').value = 'all';
    document.getElementById('filter-package').value = 'all';
    currentPage = 1;
    loadBookingsTable();
}

/**
 * Print bookings
 */
function printBookings() {
    window.print();
}

// ========== CALENDAR FUNCTIONS ==========

/**
 * Load calendar view
 */
function loadCalendar() {
    showLoading(true);
    
    const bookings = getBookingsFromDB();
    
    // Update month display
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni",
                       "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    
    document.getElementById('current-month').textContent = 
        `${monthNames[calendarCurrentMonth]} ${calendarCurrentYear}`;
    
    // Generate calendar
    generateCalendar(bookings);
    
    showLoading(false);
}

/**
 * Generate calendar grid
 * @param {Array} bookings - All bookings
 */
function generateCalendar(bookings) {
    const firstDay = new Date(calendarCurrentYear, calendarCurrentMonth, 1);
    const lastDay = new Date(calendarCurrentYear, calendarCurrentMonth + 1, 0);
    const totalDays = lastDay.getDate();
    const firstDayIndex = firstDay.getDay();
    
    const calendarDays = document.getElementById('calendar-days');
    if (!calendarDays) return;
    
    calendarDays.innerHTML = '';
    
    // Empty cells for days before first day
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Days of month
    const today = new Date();
    const isCurrentMonth = today.getMonth() === calendarCurrentMonth && 
                           today.getFullYear() === calendarCurrentYear;
    
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = createCalendarDay(day, isCurrentMonth, bookings);
        calendarDays.appendChild(dayElement);
    }
}

/**
 * Create calendar day element
 * @param {number} day - Day number
 * @param {boolean} isCurrentMonth - Whether it's current month
 * @param {Array} bookings - All bookings
 * @returns {HTMLElement} Calendar day element
 */
function createCalendarDay(day, isCurrentMonth, bookings) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // Format date string
    const currentDateStr = `${calendarCurrentYear}-${(calendarCurrentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    
    // Check if today
    const today = new Date();
    if (isCurrentMonth && day === today.getDate()) {
        dayElement.classList.add('today');
    }
    
    // Add date number
    dayElement.innerHTML = `
        <div class="calendar-date">
            <span class="day-number">${day}</span>
            ${isCurrentMonth && day === today.getDate() ? '<span class="today-badge">Hari Ini</span>' : ''}
        </div>
    `;
    
    // Add bookings for this day
    const dayBookings = bookings.filter(b => b.date === currentDateStr && b.status !== 'cancelled');
    
    if (dayBookings.length > 0) {
        // Sort bookings by time
        dayBookings.sort((a, b) => {
            const timeA = parseInt(a.time.replace(':', ''));
            const timeB = parseInt(b.time.replace(':', ''));
            return timeA - timeB;
        });
        
        // Show up to 3 bookings, add "more" indicator if more
        const maxBookings = 3;
        dayBookings.slice(0, maxBookings).forEach(booking => {
            const bookingElement = createCalendarBookingElement(booking);
            dayElement.appendChild(bookingElement);
        });
        
        if (dayBookings.length > maxBookings) {
            const moreElement = document.createElement('div');
            moreElement.className = 'calendar-booking more';
            moreElement.textContent = `+${dayBookings.length - maxBookings} lagi`;
            moreElement.onclick = () => showDayBookings(currentDateStr, dayBookings);
            dayElement.appendChild(moreElement);
        }
        
        // Add click handler to show details
        dayElement.style.cursor = 'pointer';
        dayElement.onclick = () => showDayBookings(currentDateStr, dayBookings);
    }
    
    return dayElement;
}

/**
 * Create calendar booking element
 * @param {Object} booking - Booking data
 * @returns {HTMLElement} Calendar booking element
 */
function createCalendarBookingElement(booking) {
    const bookingElement = document.createElement('div');
    bookingElement.className = `calendar-booking ${booking.status}`;
    bookingElement.textContent = `${booking.time} - ${booking.name.substring(0, 10)}${booking.name.length > 10 ? '...' : ''}`;
    bookingElement.title = `${booking.name}\n${booking.time} - ${booking.package}\nStatus: ${getStatusText(booking.status)}`;
    bookingElement.onclick = (e) => {
        e.stopPropagation();
        editBooking(booking.id);
    };
    
    return bookingElement;
}

/**
 * Show bookings for a specific day
 * @param {string} date - Date string
 * @param {Array} bookings - Bookings for that day
 */
function showDayBookings(date, bookings) {
    const detailsContainer = document.getElementById('calendar-booking-details');
    const titleContainer = document.getElementById('selected-date-title');
    const detailsCard = document.getElementById('calendar-details');
    
    if (!detailsContainer || !titleContainer || !detailsCard) return;
    
    const formattedDate = formatDate(date);
    titleContainer.textContent = `Booking untuk ${formattedDate}`;
    
    if (bookings.length === 0) {
        detailsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <p>Tidak ada booking untuk tanggal ini</p>
            </div>
        `;
    } else {
        let html = '';
        
        bookings.forEach(booking => {
            const statusClass = booking.status;
            const statusText = getStatusText(booking.status);
            
            html += `
                <div class="booking-item ${statusClass}">
                    <div class="booking-info">
                        <h4>${booking.name}</h4>
                        <p>
                            <span class="status-dot ${statusClass}"></span>
                            ${statusText}
                            • ${booking.time}
                            • ${booking.package}
                            • ${booking.people} orang
                        </p>
                    </div>
                    <div class="booking-actions">
                        <button class="btn-action edit" onclick="editBooking('${booking.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action complete" onclick="showWhatsAppModal('${booking.id}')">
                            <i class="fab fa-whatsapp"></i>
                        </button>
                    </div>
                </div>
            `;
        });
        
        detailsContainer.innerHTML = html;
    }
    
    detailsCard.style.display = 'block';
    detailsCard.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Hide calendar details
 */
function hideCalendarDetails() {
    const detailsCard = document.getElementById('calendar-details');
    if (detailsCard) {
        detailsCard.style.display = 'none';
    }
}

/**
 * Change calendar month
 * @param {number} direction - Direction to change (-1 for previous, 1 for next)
 */
function changeMonth(direction) {
    calendarCurrentMonth += direction;
    
    // Adjust year if month goes beyond bounds
    if (calendarCurrentMonth < 0) {
        calendarCurrentMonth = 11;
        calendarCurrentYear--;
    } else if (calendarCurrentMonth > 11) {
        calendarCurrentMonth = 0;
        calendarCurrentYear++;
    }
    
    loadCalendar();
}

/**
 * Go to today in calendar
 */
function goToToday() {
    const today = new Date();
    calendarCurrentMonth = today.getMonth();
    calendarCurrentYear = today.getFullYear();
    loadCalendar();
}

// ========== REPORTS FUNCTIONS ==========

/**
 * Load report data
 */
function loadReportData() {
    showLoading(true);
    
    const bookings = getBookingsFromDB();
    
    // Apply date filter
    const fromDate = document.getElementById('report-from').value;
    const toDate = document.getElementById('report-to').value;
    
    let filteredBookings = bookings.filter(b => {
        return b.date >= fromDate && b.date <= toDate;
    });
    
    // Calculate report stats
    const reportStats = calculateReportStats(filteredBookings);
    
    // Update UI
    updateReportStats(reportStats);
    updatePackageStats(filteredBookings);
    updateCharts(filteredBookings);
    
    showLoading(false);
}

/**
 * Calculate report statistics
 * @param {Array} bookings - Filtered bookings
 * @returns {Object} Report statistics
 */
function calculateReportStats(bookings) {
    const totalBookings = bookings.length;
    
    // Filter completed and confirmed bookings for revenue
    const revenueBookings = bookings.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
    );
    
    const totalRevenue = revenueBookings.reduce((sum, b) => sum + b.total, 0);
    
    // Calculate unique dates for average visitors
    const uniqueDates = [...new Set(bookings.map(b => b.date))];
    const totalVisitors = bookings.reduce((sum, b) => sum + b.people, 0);
    const avgVisitors = uniqueDates.length > 0 ? 
        totalVisitors / uniqueDates.length : 0;
    
    // Calculate no-show rate
    const noShowCount = bookings.filter(b => b.status === 'no-show').length;
    const noShowRate = totalBookings > 0 ? Math.round((noShowCount / totalBookings) * 100) : 0;
    
    return {
        totalBookings,
        totalRevenue,
        avgVisitors: avgVisitors.toFixed(1),
        noShowRate
    };
}

/**
 * Update report statistics in UI
 * @param {Object} stats - Report statistics
 */
function updateReportStats(stats) {
    document.getElementById('report-total-bookings').textContent = stats.totalBookings;
    document.getElementById('report-total-revenue').textContent = `Rp ${formatNumber(stats.totalRevenue)}`;
    document.getElementById('report-avg-visitors').textContent = stats.avgVisitors;
    document.getElementById('report-noshow-rate').textContent = `${stats.noShowRate}%`;
}

/**
 * Update package statistics
 * @param {Array} bookings - Filtered bookings
 */
function updatePackageStats(bookings) {
    const packageStats = {
        basic: { count: 0, revenue: 0, people: 0 },
        premium: { count: 0, revenue: 0, people: 0 },
        exclusive: { count: 0, revenue: 0, people: 0 }
    };
    
    // Calculate package stats
    bookings.forEach(b => {
        if (packageStats[b.package]) {
            packageStats[b.package].count++;
            packageStats[b.package].people += b.people;
            
            if (b.status === 'confirmed' || b.status === 'completed') {
                packageStats[b.package].revenue += b.total;
            }
        }
    });
    
    // Update table
    const tbody = document.getElementById('package-stats-body');
    if (!tbody) return;
    
    const totalBookings = bookings.length;
    
    let html = '';
    let chartData = [];
    let chartLabels = [];
    
    Object.entries(packageStats).forEach(([pkg, stats]) => {
        const percentage = totalBookings > 0 ? Math.round((stats.count / totalBookings) * 100) : 0;
        const avgPeople = stats.count > 0 ? (stats.people / stats.count).toFixed(1) : 0;
        
        html += `
            <tr>
                <td><strong>${pkg.charAt(0).toUpperCase() + pkg.slice(1)}</strong></td>
                <td>${stats.count}</td>
                <td>Rp ${formatNumber(stats.revenue)}</td>
                <td>${percentage}%</td>
                <td>${avgPeople}</td>
            </tr>
        `;
        
        chartData.push(stats.count);
        chartLabels.push(pkg.charAt(0).toUpperCase() + pkg.slice(1));
    });
    
    tbody.innerHTML = html;
    
    // Update chart
    if (window.packageChart) {
        window.packageChart.data.datasets[0].data = chartData;
        window.packageChart.data.labels = chartLabels;
        window.packageChart.update();
    }
}

/**
 * Update charts with booking data
 * @param {Array} bookings - Filtered bookings
 */
function updateCharts(bookings) {
    // Group by date for daily chart
    const dailyData = {};
    const revenueBookings = bookings.filter(b => 
        b.status === 'confirmed' || b.status === 'completed'
    );
    
    revenueBookings.forEach(booking => {
        if (!dailyData[booking.date]) {
            dailyData[booking.date] = 0;
        }
        dailyData[booking.date] += booking.total;
    });
    
    // Sort dates
    const sortedDates = Object.keys(dailyData).sort();
    const chartLabels = sortedDates.map(date => formatDate(date));
    const chartData = sortedDates.map(date => dailyData[date]);
    
    // Update daily chart
    if (window.dailyChart) {
        window.dailyChart.data.labels = chartLabels;
        window.dailyChart.data.datasets[0].data = chartData;
        window.dailyChart.update();
    }
}

/**
 * Print report
 */
function printReport() {
    window.print();
}

/**
 * Export report to Excel
 */
function exportReport() {
    const bookings = getBookingsFromDB();
    const fromDate = document.getElementById('report-from').value;
    const toDate = document.getElementById('report-to').value;
    
    // Filter bookings
    const filteredBookings = bookings.filter(b => {
        return b.date >= fromDate && b.date <= toDate;
    });
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Laporan Booking Renwar Photobox\n";
    csvContent += `Periode: ${formatDate(fromDate)} - ${formatDate(toDate)}\n\n`;
    csvContent += "ID,Nama,Telepon,Tanggal,Waktu,Paket,Orang,Background,Kendaraan,Tambahan Waktu,Properti,Total,Status,Catatan\n";
    
    filteredBookings.forEach(booking => {
        const row = [
            booking.id,
            `"${booking.name}"`,
            booking.phone,
            booking.date,
            booking.time,
            booking.package,
            booking.people,
            getBackgroundName(booking.background || ''),
            getVehicleName(booking.vehicle || 'none'),
            booking.timeExtra || 0,
            booking.props ? 'Ya' : 'Tidak',
            booking.total,
            getStatusText(booking.status),
            `"${booking.notes || ''}"`
        ].join(",");
        csvContent += row + "\n";
    });
    
    // Add summary
    const stats = calculateReportStats(filteredBookings);
    csvContent += `\n\nSUMMARY\n`;
    csvContent += `Total Booking,${stats.totalBookings}\n`;
    csvContent += `Total Pendapatan,Rp ${formatNumber(stats.totalRevenue)}\n`;
    csvContent += `Rata-rata Pengunjung/Hari,${stats.avgVisitors}\n`;
    csvContent += `No-Show Rate,${stats.noShowRate}%\n`;
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_booking_${fromDate}_${toDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Laporan berhasil diexport!', 'success');
}

/**
 * Generate PDF report (simulated)
 */
function generateReport() {
    showLoading(true);
    
    // Simulate PDF generation
    setTimeout(() => {
        showLoading(false);
        showNotification('Laporan PDF berhasil digenerate! Silakan cek folder download.', 'success');
        
        // In real implementation, this would generate an actual PDF
        // For now, we'll just export as CSV
        exportReport();
    }, 2000);
}

// ========== SETTINGS FUNCTIONS ==========

/**
 * Load settings from localStorage
 */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('photobox_settings')) || {};
    
    // Studio Info
    document.getElementById('studio-name').value = settings.studioName || 'Renwar Photobox';
    document.getElementById('studio-address').value = settings.studioAddress || 'Dauh Umah, Jalan Kenangan';
    document.getElementById('studio-phone').value = settings.studioPhone || '+62 8123456789';
    document.getElementById('studio-email').value = settings.studioEmail || 'info@renwarphotobox.com';
    
    // Operating Hours
    document.getElementById('open-time').value = settings.openTime || '08:00';
    document.getElementById('close-time').value = settings.closeTime || '22:00';
    document.getElementById('slot-duration').value = settings.slotDuration || '30';
    document.getElementById('holidays').value = settings.holidays || '';
    
    // Package Prices
    document.getElementById('price-basic').value = settings.priceBasic || 150000;
    document.getElementById('price-premium').value = settings.pricePremium || 250000;
    document.getElementById('price-exclusive').value = settings.priceExclusive || 350000;
    
    // Additional Charges
    document.getElementById('extra-person').value = settings.extraPerson || 35000;
    document.getElementById('extra-30min').value = settings.extra30min || 50000;
    document.getElementById('extra-60min').value = settings.extra60min || 90000;
    document.getElementById('extra-props').value = settings.extraProps || 15000;
    
    // System Settings
    document.getElementById('whatsapp-notif').checked = settings.whatsappNotif !== false;
    document.getElementById('auto-confirm').checked = settings.autoConfirm || false;
    document.getElementById('reminder-time').value = settings.reminderTime || '1';
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
    const settings = {
        // Studio Info
        studioName: document.getElementById('studio-name').value,
        studioAddress: document.getElementById('studio-address').value,
        studioPhone: document.getElementById('studio-phone').value,
        studioEmail: document.getElementById('studio-email').value,
        
        // Operating Hours
        openTime: document.getElementById('open-time').value,
        closeTime: document.getElementById('close-time').value,
        slotDuration: document.getElementById('slot-duration').value,
        holidays: document.getElementById('holidays').value,
        
        // Package Prices
        priceBasic: parseInt(document.getElementById('price-basic').value) || 150000,
        pricePremium: parseInt(document.getElementById('price-premium').value) || 250000,
        priceExclusive: parseInt(document.getElementById('price-exclusive').value) || 350000,
        
        // Additional Charges
        extraPerson: parseInt(document.getElementById('extra-person').value) || 35000,
        extra30min: parseInt(document.getElementById('extra-30min').value) || 50000,
        extra60min: parseInt(document.getElementById('extra-60min').value) || 90000,
        extraProps: parseInt(document.getElementById('extra-props').value) || 15000,
        
        // System Settings
        whatsappNotif: document.getElementById('whatsapp-notif').checked,
        autoConfirm: document.getElementById('auto-confirm').checked,
        reminderTime: document.getElementById('reminder-time').value
    };
    
    localStorage.setItem('photobox_settings', JSON.stringify(settings));
    showNotification('Pengaturan berhasil disimpan!', 'success');
    
    // Sync with website iframe or refresh
    syncSettingsWithWebsite();
}

/**
 * Sync settings with website
 */
function syncSettingsWithWebsite() {
    // This would sync with the main website
    // For now, just refresh the dashboard
    refreshAllData();
}

// ========== BOOKING MANAGEMENT ==========

/**
 * Show add/edit booking modal
 * @param {string} bookingId - Booking ID (null for new booking)
 */
function showAddBookingModal(bookingId = null) {
    const modal = document.getElementById('editBookingModal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('booking-form-admin');
    
    // Clear previous data
    form.reset();
    
    if (bookingId) {
        // Edit existing booking
        const booking = getBookingById(bookingId);
        if (booking) {
            title.textContent = 'Edit Booking';
            populateBookingForm(booking);
            form.dataset.bookingId = bookingId;
        }
    } else {
        // Add new booking
        title.textContent = 'Tambah Booking Manual';
        
        // Set defaults
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('edit-date').value = today;
        document.getElementById('edit-status').value = 'pending';
        document.getElementById('edit-people').value = 1;
        document.getElementById('edit-package').value = 'basic';
        document.getElementById('edit-background').value = 'navy';
        document.getElementById('edit-vehicle').value = 'none';
        document.getElementById('edit-time-extra').value = '0';
        document.getElementById('edit-props').value = 'false';
        
        // Generate new booking ID
        const bookings = getBookingsFromDB();
        const lastId = bookings.length > 0 ? 
            parseInt(bookings[bookings.length - 1].id.replace('BK', '')) : 0;
        const newId = `BK${(lastId + 1).toString().padStart(3, '0')}`;
        form.dataset.bookingId = newId;
        
        // Set time options
        populateTimeOptions(today);
        
        // Calculate initial total
        setTimeout(() => {
            const event = new Event('change');
            document.getElementById('edit-package').dispatchEvent(event);
        }, 100);
    }
    
    showModal('editBookingModal');
}

/**
 * Get booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Object|null} Booking data or null
 */
function getBookingById(bookingId) {
    const bookings = getBookingsFromDB();
    return bookings.find(b => b.id === bookingId) || null;
}

/**
 * Populate booking form with data
 * @param {Object} booking - Booking data
 */
function populateBookingForm(booking) {
    document.getElementById('edit-name').value = booking.name;
    document.getElementById('edit-phone').value = booking.phone;
    document.getElementById('edit-date').value = booking.date;
    document.getElementById('edit-people').value = booking.people;
    document.getElementById('edit-package').value = booking.package;
    document.getElementById('edit-status').value = booking.status;
    document.getElementById('edit-notes').value = booking.notes || '';
    document.getElementById('edit-background').value = booking.background || 'navy';
    document.getElementById('edit-vehicle').value = booking.vehicle || 'none';
    document.getElementById('edit-time-extra').value = booking.timeExtra || 0;
    document.getElementById('edit-props').value = booking.props ? 'true' : 'false';
    document.getElementById('edit-total').value = booking.total;
    
    // Set time options
    populateTimeOptions(booking.date, booking.time);
}

/**
 * Populate time options dropdown
 * @param {string} date - Selected date
 * @param {string} selectedTime - Selected time (optional)
 */
function populateTimeOptions(date, selectedTime = null) {
    const timeSelect = document.getElementById('edit-time');
    if (!timeSelect) return;
    
    timeSelect.innerHTML = '';
    
    // Get booked times for this date
    const bookedTimes = getBookedTimes(date);
    
    // Generate time options from 08:00 to 22:00 every 30 minutes
    for (let hour = 8; hour <= 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            if (hour === 22 && minute === 30) break;
            
            const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeString;
            option.textContent = timeString;
            
            // Mark as disabled if already booked (unless it's the current booking time)
            if (bookedTimes.includes(timeString) && timeString !== selectedTime) {
                option.disabled = true;
                option.textContent += ' (Sudah dipesan)';
            }
            
            if (selectedTime === timeString) {
                option.selected = true;
            }
            
            timeSelect.appendChild(option);
        }
    }
    
    // Add date change listener
    document.getElementById('edit-date').addEventListener('change', function() {
        populateTimeOptions(this.value);
    });
}

/**
 * Save booking (create or update)
 */
function saveBookingAdmin() {
    const form = document.getElementById('booking-form-admin');
    const bookingId = form.dataset.bookingId;
    
    const bookingData = collectAdminBookingData(bookingId);
    
    // Validate required fields
    if (!bookingData.name || !bookingData.phone || !bookingData.date || !bookingData.time) {
        showNotification('Harap isi semua field yang diperlukan!', 'error');
        return;
    }
    
    // Check if time is available
    const bookedTimes = getBookedTimes(bookingData.date);
    if (bookedTimes.includes(bookingData.time)) {
        // Check if it's the same booking (editing)
        const existingBooking = getBookingById(bookingId);
        if (!existingBooking || existingBooking.time !== bookingData.time) {
            showNotification('Waktu yang dipilih sudah dipesan!', 'error');
            return;
        }
    }
    
    // Save to database
    const bookings = getBookingsFromDB();
    const existingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (existingIndex >= 0) {
        // Update existing
        bookings[existingIndex] = {
            ...bookings[existingIndex],
            ...bookingData,
            updatedAt: new Date().toISOString()
        };
    } else {
        // Add new
        bookingData.createdAt = new Date().toISOString();
        bookingData.updatedAt = new Date().toISOString();
        bookings.push(bookingData);
    }
    
    localStorage.setItem('photobox_bookings', JSON.stringify(bookings));
    
    // Close modal and refresh
    closeModal('editBookingModal');
    showNotification('Booking berhasil disimpan!', 'success');
    
    // Send WhatsApp notification if confirmed
    if (bookingData.status === 'confirmed') {
        setTimeout(() => {
            showWhatsAppModal(bookingId);
        }, 500);
    }
    
    // Refresh all data
    refreshAllData();
}

/**
 * Collect booking data from admin form
 * @param {string} bookingId - Booking ID
 * @returns {Object} Booking data
 */
function collectAdminBookingData(bookingId) {
    return {
        id: bookingId,
        name: document.getElementById('edit-name').value.trim(),
        phone: document.getElementById('edit-phone').value.trim(),
        email: '', // Not captured in admin form
        date: document.getElementById('edit-date').value,
        time: document.getElementById('edit-time').value,
        package: document.getElementById('edit-package').value,
        background: document.getElementById('edit-background').value,
        people: parseInt(document.getElementById('edit-people').value) || 1,
        vehicle: document.getElementById('edit-vehicle').value,
        timeExtra: parseInt(document.getElementById('edit-time-extra').value) || 0,
        props: document.getElementById('edit-props').value === 'true',
        status: document.getElementById('edit-status').value,
        notes: document.getElementById('edit-notes').value.trim(),
        total: parseInt(document.getElementById('edit-total').value) || 0,
        bookingDate: new Date().toISOString()
    };
}

/**
 * Edit booking
 * @param {string} bookingId - Booking ID
 */
function editBooking(bookingId) {
    showAddBookingModal(bookingId);
}

/**
 * Show delete confirmation
 * @param {string} bookingId - Booking ID
 */
function showDeleteConfirm(bookingId) {
    const booking = getBookingById(bookingId);
    if (!booking) return;
    
    document.getElementById('confirm-message').textContent = 
        `Apakah Anda yakin ingin menghapus booking dari ${booking.name} (${booking.date} ${booking.time})?`;
    
    document.getElementById('confirm-action').onclick = () => deleteBooking(bookingId);
    
    showModal('confirmModal');
}

/**
 * Delete booking
 * @param {string} bookingId - Booking ID
 */
function deleteBooking(bookingId) {
    const bookings = getBookingsFromDB();
    const updatedBookings = bookings.filter(b => b.id !== bookingId);
    localStorage.setItem('photobox_bookings', JSON.stringify(updatedBookings));
    
    closeModal('confirmModal');
    showNotification('Booking berhasil dihapus!', 'success');
    refreshAllData();
}

/**
 * Confirm a pending booking
 * @param {string} bookingId - Booking ID
 */
function confirmBooking(bookingId) {
    updateBookingStatus(bookingId, 'confirmed', 'Booking dikonfirmasi!');
}

/**
 * Mark booking as completed
 * @param {string} bookingId - Booking ID
 */
function markAsCompleted(bookingId) {
    updateBookingStatus(bookingId, 'completed', 'Booking ditandai sebagai selesai!');
}

/**
 * Show status change modal
 * @param {string} bookingId - Booking ID
 */
function showStatusChangeModal(bookingId) {
    const booking = getBookingById(bookingId);
    if (!booking) return;
    
    document.getElementById('confirm-message').innerHTML = `
        <p>Ubah status booking dari <strong>${booking.name}</strong>:</p>
        <select id="new-status" class="form-control" style="margin: 10px 0;">
            <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>Pending</option>
            <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
            <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no-show">No-Show</option>
        </select>
    `;
    
    document.getElementById('confirm-action').onclick = () => {
        const newStatus = document.getElementById('new-status').value;
        updateBookingStatus(bookingId, newStatus, `Status diubah menjadi ${getStatusText(newStatus)}!`);
    };
    
    showModal('confirmModal');
}

/**
 * Update booking status
 * @param {string} bookingId - Booking ID
 * @param {string} status - New status
 * @param {string} message - Success message
 */
function updateBookingStatus(bookingId, status, message) {
    const bookings = getBookingsFromDB();
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex >= 0) {
        bookings[bookingIndex].status = status;
        bookings[bookingIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('photobox_bookings', JSON.stringify(bookings));
        
        closeModal('confirmModal');
        showNotification(message, 'success');
        refreshAllData();
        
        // Send WhatsApp notification if confirmed
        if (status === 'confirmed') {
            setTimeout(() => {
                showWhatsAppModal(bookingId);
            }, 500);
        }
    }
}

// ========== WHATSAPP FUNCTIONS ==========

/**
 * Show WhatsApp modal
 * @param {string} bookingId - Booking ID
 */
function showWhatsAppModal(bookingId) {
    const booking = getBookingById(bookingId);
    if (!booking) return;
    
    // Create WhatsApp message
    const message = createWhatsAppMessage(booking);
    
    // Show preview
    document.getElementById('whatsapp-preview-content').textContent = message;
    
    // Store booking ID for sending
    document.getElementById('whatsappPreviewModal').dataset.bookingId = bookingId;
    
    showModal('whatsappPreviewModal');
}

/**
 * Create WhatsApp message
 * @param {Object} booking - Booking data
 * @returns {string} WhatsApp message
 */
function createWhatsAppMessage(booking) {
    const formattedDate = formatDate(booking.date);
    const statusText = getStatusText(booking.status);
    
    return `Halo ${booking.name},

Booking Anda di Renwar Photobox telah dikonfirmasi!

📋 DETAIL BOOKING:
• ID: ${booking.id}
• Tanggal: ${formattedDate}
• Waktu: ${booking.time}
• Paket: ${booking.package.toUpperCase()}
• Jumlah Orang: ${booking.people}
• Background: ${getBackgroundName(booking.background)}
• Status: ${statusText}
• Total: Rp ${formatNumber(booking.total)}

📍 LOKASI:
Renwar Photobox
Dauh Umah, Jalan Kenangan

📞 KONTAK:
+62 8123456789

Mohon datang 15 menit sebelum waktu booking.
Terima kasih! 🙏`;
}

/**
 * Send WhatsApp message
 */
function sendWhatsAppMessage() {
    const bookingId = document.getElementById('whatsappPreviewModal').dataset.bookingId;
    const booking = getBookingById(bookingId);
    
    if (!booking) {
        showNotification('Booking tidak ditemukan!', 'error');
        return;
    }
    
    // Format phone number
    let phone = booking.phone.replace(/\D/g, '');
    
    if (phone.startsWith('0')) {
        phone = '62' + phone.substring(1);
    } else if (phone.startsWith('+62')) {
        phone = phone.substring(1);
    } else if (!phone.startsWith('62')) {
        phone = '62' + phone;
    }
    
    // Create message
    const message = createWhatsAppMessage(booking);
    const encodedMessage = encodeURIComponent(message);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    
    // Open in new tab
    window.open(whatsappUrl, '_blank');
    
    // Close modal
    closeModal('whatsappPreviewModal');
    
    // Show success message
    showNotification('WhatsApp dibuka di tab baru!', 'success');
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Show loading overlay
 * @param {boolean} show - Whether to show or hide
 */
function showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Refresh all data
 */
function refreshAllData() {
    loadDashboard();
    loadBookingsTable();
    loadCalendar();
    loadReportData();
}

/**
 * Show notification
 * @param {string} message - Message to show
 * @param {string} type - Type of notification (success, error, warning, info)
 */
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const messageElement = document.getElementById('notification-message');
    
    if (!notification || !messageElement) return;
    
    // Update message and type
    messageElement.textContent = message;
    notification.className = 'notification ' + type;
    
    // Show notification
    notification.style.display = 'flex';
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// ========== DOM READY ==========

/**
 * Initialize admin dashboard when DOM is ready
 */
document.addEventListener('DOMContentLoaded', function() {
    initAdminDashboard();
    
    // Add real-time sync with website
    setupRealTimeUpdates();
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl + R to refresh
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            refreshAllData();
        }
        
        // Ctrl + N for new booking
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            showAddBookingModal();
        }
        
        // Escape to close modals
        if (e.key === 'Escape') {
            closeModal('editBookingModal');
            closeModal('confirmModal');
            closeModal('whatsappPreviewModal');
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        // Re-init mobile menu if needed
        if (window.innerWidth <= 768) {
            initAdminMobileMenu();
        }
    });
});