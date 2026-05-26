/* ===== THEME TOGGLE ===== */

const themeToggle = document.querySelector('.theme-toggle');
const htmlElement = document.documentElement;

// Initialize theme from localStorage or system preference
function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme) {
    htmlElement.setAttribute('data-theme', savedTheme);
  } else if (prefersDark) {
    htmlElement.setAttribute('data-theme', 'dark');
  } else {
    htmlElement.setAttribute('data-theme', 'light');
  }
}

// Toggle theme
function toggleTheme() {
  const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  htmlElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  
  // Update icon
  updateThemeIcon();
}

// Update theme icon
function updateThemeIcon() {
  const currentTheme = htmlElement.getAttribute('data-theme') || 'light';
  const icon = themeToggle.querySelector('svg');
  
  if (currentTheme === 'dark') {
    // Show sun icon for dark mode
    icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
  } else {
    // Show moon icon for light mode
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
  }
}

// Event listener for theme toggle
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// Initialize theme on page load
initializeTheme();
updateThemeIcon();

/* ===== MOBILE MENU TOGGLE ===== */

const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navbarCenter = document.querySelector('.navbar-center');

if (mobileMenuToggle) {
  mobileMenuToggle.addEventListener('click', () => {
    navbarCenter.classList.toggle('active');
  });
}

// Close mobile menu when a link is clicked
const navLinks = document.querySelectorAll('.navbar-nav a');
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navbarCenter.classList.remove('active');
  });
});

/* ===== STICKY HEADER ===== */

const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

/* ===== SCROLL ANIMATIONS ===== */

const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-up');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

// Observe all sections and cards
document.querySelectorAll('section, .card, .feature-item, .testimonial-card').forEach(el => {
  observer.observe(el);
});

/* ===== ACCORDION ===== */

const accordionHeaders = document.querySelectorAll('.accordion-header');

accordionHeaders.forEach(header => {
  header.addEventListener('click', () => {
    const item = header.closest('.accordion-item');
    const body = item.querySelector('.accordion-body');
    const isActive = header.classList.contains('active');
    
    // Close all other accordion items
    document.querySelectorAll('.accordion-item').forEach(otherItem => {
      if (otherItem !== item) {
        const otherHeader = otherItem.querySelector('.accordion-header');
        const otherBody = otherItem.querySelector('.accordion-body');
        otherHeader.classList.remove('active');
        otherBody.classList.remove('active');
      }
    });
    
    // Toggle current item
    header.classList.toggle('active');
    body.classList.toggle('active');
  });
});

/* ===== FORM HANDLING ===== */

const forms = document.querySelectorAll('form');

forms.forEach(form => {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Show a message that the form is not yet functional
    const message = document.createElement('div');
    message.className = 'alert alert-info';
    message.innerHTML = '<div class="alert-icon">ℹ️</div><div class="alert-content"><p>This form is not yet connected to a backend. Please contact us directly for inquiries.</p></div>';
    
    form.insertAdjacentElement('beforebegin', message);
    
    // Remove message after 5 seconds
    setTimeout(() => {
      message.remove();
    }, 5000);
  });
});

/* ===== SMOOTH SCROLL ===== */

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

/* ===== LAZY LOAD IMAGES ===== */

if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });
}

/* ===== UTILITY FUNCTIONS ===== */

// Format phone number
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

// Add active class to current nav link
function updateActiveNavLink() {
  const currentLocation = location.pathname;
  const navLinks = document.querySelectorAll('.navbar-nav a');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentLocation.includes(href) || 
        (currentLocation === '/' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

updateActiveNavLink();

/* ===== ACCESSIBILITY ===== */

// Ensure keyboard navigation works properly
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    navbarCenter.classList.remove('active');
  }
});

// Announce dynamic content changes to screen readers
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    announcement.remove();
  }, 1000);
}

/* ===== INITIALIZATION ===== */

document.addEventListener('DOMContentLoaded', () => {
  // All initialization code above runs when DOM is ready
  console.log('Kunokhanya Training Academy website loaded');
});
