// SmartSass Tech - Booking System
// Handles calendar, time slots, and Apple Calendar (.ics) file generation

let selectedService = null;
let selectedDate = null;
let selectedTime = null;
let currentMonth = new Date();

document.addEventListener('DOMContentLoaded', function () {
    initializeBooking();
});

function initializeBooking() {
    // Service selection
    const serviceItems = document.querySelectorAll('.service-item');
    serviceItems.forEach(item => {
        item.addEventListener('click', () => selectService(item));
    });

    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

    // Initialize calendar
    renderCalendar();

    // Booking form submission
    const bookingForm = document.getElementById('booking-form');
    bookingForm.addEventListener('submit', handleBookingSubmit);
}

function selectService(item) {
    // Remove previous selection
    document.querySelectorAll('.service-item').forEach(el => el.classList.remove('selected'));

    // Add selection
    item.classList.add('selected');

    selectedService = {
        name: item.querySelector('h3').textContent,
        type: item.dataset.service,
        price: item.dataset.price,
        duration: parseInt(item.dataset.duration)
    };

    updateBookingSummary();
}

function changeMonth(direction) {
    currentMonth.setMonth(currentMonth.getMonth() + direction);
    renderCalendar();
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthDisplay = document.getElementById('current-month');

    // Clear calendar
    calendar.innerHTML = '';

    // Update month display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    monthDisplay.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

    // Add day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        calendar.appendChild(header);
    });

    // Get first day of month and number of days
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendar.appendChild(emptyDay);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);

        // Disable past dates
        if (date < today) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(date, dayElement));
        }

        calendar.appendChild(dayElement);
    }
}

function selectDate(date, element) {
    if (!selectedService) {
        alert('Please select a service first.');
        return;
    }

    // Remove previous selection
    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('selected'));

    // Add selection
    element.classList.add('selected');
    selectedDate = date;

    // Show time slots
    renderTimeSlots();
    updateBookingSummary();
}

function renderTimeSlots() {
    const container = document.getElementById('time-slots-container');
    const slotsDiv = document.getElementById('time-slots');

    container.style.display = 'block';
    slotsDiv.innerHTML = '';

    // Generate time slots from 9 AM to 5 PM
    const times = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
    ];

    times.forEach(time => {
        const slot = document.createElement('div');
        slot.className = 'time-slot';
        slot.textContent = time;
        slot.addEventListener('click', () => selectTime(time, slot));
        slotsDiv.appendChild(slot);
    });
}

function selectTime(time, element) {
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('selected'));

    // Add selection
    element.classList.add('selected');
    selectedTime = time;

    // Show booking form
    document.getElementById('booking-form-container').style.display = 'block';
    updateBookingSummary();

    // Scroll to form
    document.getElementById('booking-form-container').scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
    });
}

function updateBookingSummary() {
    const summary = document.getElementById('booking-summary');

    if (!selectedService || !selectedDate || !selectedTime) {
        return;
    }

    const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    summary.innerHTML = `
        <h3 style="margin-bottom: var(--spacing-sm);">Booking Summary</h3>
        <p><strong>Service:</strong> ${selectedService.name}</p>
        <p><strong>Date:</strong> ${dateStr}</p>
        <p><strong>Time:</strong> ${selectedTime}</p>
        <p><strong>Duration:</strong> ${selectedService.duration} minutes</p>
        <p><strong>Price:</strong> $${selectedService.price}</p>
    `;
}

async function handleBookingSubmit(e) {
    e.preventDefault();

    if (!selectedService || !selectedDate || !selectedTime) {
        alert('Please select a service, date, and time.');
        return;
    }

    const name = document.getElementById('customer-name').value;
    const email = document.getElementById('customer-email').value;
    const phone = document.getElementById('customer-phone').value;
    const notes = document.getElementById('customer-notes').value;

    const dateStr = selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Show final confirmation/review section
    const formContainer = document.getElementById('booking-form-container');
    const originalContent = formContainer.innerHTML;

    formContainer.innerHTML = `
        <div class="booking-review-summary" style="background: #fff; padding: 20px; border: 2px solid var(--color-primary); border-radius: 8px; margin-bottom: 20px;">
            <h3 style="color: var(--color-primary); margin-bottom: 15px;">Review Your Booking</h3>
            <div style="display: grid; gap: 10px; margin-bottom: 20px;">
                <p><strong>Service:</strong> ${selectedService.name}</p>
                <p><strong>Date:</strong> ${dateStr}</p>
                <p><strong>Time:</strong> ${selectedTime}</p>
                <p><strong>Total Price:</strong> $${selectedService.price}</p>
                <hr style="border: none; border-top: 1px solid #eee;">
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Phone:</strong> ${phone}</p>
                ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button id="cancel-review" class="btn btn-secondary" style="flex: 1;">Edit Details</button>
                <button id="finalize-booking" class="btn btn-primary" style="flex: 2;">Confirm & Book Now</button>
            </div>
        </div>
    `;

    document.getElementById('cancel-review').onclick = () => {
        formContainer.innerHTML = originalContent;
        // Re-attach listener and populate values
        document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
        document.getElementById('customer-name').value = name;
        document.getElementById('customer-email').value = email;
        document.getElementById('customer-phone').value = phone;
        document.getElementById('customer-notes').value = notes;
        updateBookingSummary();
    };

    document.getElementById('finalize-booking').onclick = async () => {
        const finalizeBtn = document.getElementById('finalize-booking');
        finalizeBtn.disabled = true;
        finalizeBtn.textContent = 'Processing...';

        try {
            // Send notification to owner via Supabase Edge Function
            await fetch('https://zwfsvjvpocpflmkmptji.supabase.co/functions/v1/send-notification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'booking',
                    name,
                    email,
                    phone,
                    notes,
                    service: selectedService.name,
                    date: dateStr,
                    time: selectedTime,
                    duration: selectedService.duration,
                    price: `$${selectedService.price}`
                })
            });

            // Show confirmation with "Add to Calendar" options
            showConfirmation(name, email, phone, notes);
        } catch (error) {
            console.error('Booking error:', error);
            alert('There was an error processing your booking. Please try again or call us at (585) 210-9758.');
            finalizeBtn.disabled = false;
            finalizeBtn.textContent = 'Confirm & Book Now';
        }
    };
}

function generateGoogleCalendarUrl(name, notes) {
    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/);
    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const meridiem = timeParts[3];

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + selectedService.duration);

    const formatGDate = (date) => date.toISOString().replace(/-|:|\.\d+/g, '');

    const details = `${notes ? notes + '\n\n' : ''}Service: ${selectedService.name}\nDuration: ${selectedService.duration} minutes\nSmartSass Tech\n(585) 210-9758`;

    const url = new URL('https://www.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', `${selectedService.name} - SmartSass Tech`);
    url.searchParams.append('dates', `${formatGDate(startDate)}/${formatGDate(endDate)}`);
    url.searchParams.append('details', details);
    url.searchParams.append('location', 'Rochester, NY');

    return url.toString();
}

function generateCalendarEvent(name, email, phone, notes) {
    // Parse the selected time
    const timeParts = selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/);
    let hours = parseInt(timeParts[1]);
    const minutes = parseInt(timeParts[2]);
    const meridiem = timeParts[3];

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    // Create start and end times
    const startDate = new Date(selectedDate);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + selectedService.duration);

    // Format dates for .ics (YYYYMMDDTHHmmss)
    function formatICSDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hour = String(date.getHours()).padStart(2, '0');
        const minute = String(date.getMinutes()).padStart(2, '0');
        return `${year}${month}${day}T${hour}${minute}00`;
    }

    const now = new Date();
    const dtstamp = formatICSDate(now);
    const dtstart = formatICSDate(startDate);
    const dtend = formatICSDate(endDate);

    // Create .ics file content
    const description = notes ? `Issue/Request: ${notes}\\n\\n` : '';
    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SmartSass Tech//Booking//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `DTSTAMP:${dtstamp}`,
        `UID:${Date.now()}@smartsasstech.com`,
        `SUMMARY:${selectedService.name} - SmartSass Tech`,
        `DESCRIPTION:${description}Service: ${selectedService.name}\\nDuration: ${selectedService.duration} minutes\\nPrice: $${selectedService.price}\\n\\nCustomer: ${name}\\nEmail: ${email}\\nPhone: ${phone}\\n\\nSmartSass Tech\\n(585) 210-9758\\nsmartsasstech@gmail.com`,
        'LOCATION:Rochester, NY',
        'STATUS:CONFIRMED',
        'SEQUENCE:0',
        'BEGIN:VALARM',
        'TRIGGER:-PT1H',
        'DESCRIPTION:Reminder: Tech support session in 1 hour',
        'ACTION:DISPLAY',
        'END:VALARM',
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\\r\\n');

    // Create and download .ics file
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `smartsass-tech-booking-${Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showConfirmation(name, email, phone, notes) {
    const container = document.querySelector('.booking-container');
    const googleUrl = generateGoogleCalendarUrl(name, notes);

    container.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-xxl); background: var(--color-white); border-radius: var(--radius-lg); max-width: 700px; margin: 0 auto;">
            <h1 style="color: var(--color-primary); margin-bottom: var(--spacing-lg);">🎉 Booking Confirmed!</h1>
            
            <p style="font-size: var(--font-size-large); margin-bottom: var(--spacing-lg);">
                Thank you, <strong>${name}</strong>! Your tech support session has been scheduled.
            </p>
            
            <div style="background-color: var(--color-bg-light); padding: var(--spacing-lg); border-radius: var(--radius-md); margin-bottom: var(--spacing-lg); text-align: left;">
                <h3 style="margin-bottom: var(--spacing-md);">📅 Your Appointment Details</h3>
                <p><strong>Service:</strong> ${selectedService.name}</p>
                <p><strong>Date:</strong> ${selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}</p>
                <p><strong>Time:</strong> ${selectedTime}</p>
                <p><strong>Duration:</strong> ${selectedService.duration} minutes</p>
                <p><strong>Price:</strong> $${selectedService.price}</p>
            </div>
            
            <!-- Add to Calendar Section -->
            <div class="calendar-options">
                <h3 style="margin-bottom: var(--spacing-xs);">Add to your calendar</h3>
                <p style="margin-bottom: var(--spacing-md); color: #666; font-size: 0.9em;">Save this appointment so you don't miss it!</p>
                <div class="calendar-btn-group">
                    <a href="${googleUrl}" target="_blank" class="btn btn-google">
                        Google Calendar
                    </a>
                    <button onclick="generateCalendarEvent('${name}', '${email}', '${phone}', '${notes}')" class="btn btn-apple">
                        Apple / Outlook
                    </button>
                </div>
            </div>
            
            <div style="margin-top: var(--spacing-xl);">
                <h3 style="margin-bottom: var(--spacing-md);">What's Next?</h3>
                <p style="margin-bottom: var(--spacing-sm);">
                    1. Check your email for a confirmation message<br>
                    2. We'll call you at the scheduled time<br>
                    3. Have your device ready and any questions prepared
                </p>
                
                <p style="margin-top: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
                    If you need to reschedule or have questions, please call us at:<br>
                    <strong style="font-size: var(--font-size-xlarge);">(585) 210-9758</strong>
                </p>
                
                <div style="display: flex; gap: var(--spacing-md); justify-content: center; flex-wrap: wrap;">
                    <a href="index.html" class="btn btn-primary">Return Home</a>
                    <a href="booking.html" class="btn btn-secondary" style="color: var(--color-primary);">Book Another Session</a>
                </div>
            </div>
        </div>
    `;
}
