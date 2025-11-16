// PataBima Admin Enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Add PataBima branding enhancements
    console.log('PataBima Admin Red Theme Loaded');
    
    // Enhance the header with better styling
    const header = document.getElementById('header');
    if (header) {
        header.style.background = 'linear-gradient(135deg, #D5222B 0%, #cc1e26 100%)';
        header.style.boxShadow = '0 2px 8px rgba(213, 34, 43, 0.3)';
    }
    
    // Add hover effects to navigation items
    const navLinks = document.querySelectorAll('#nav-sidebar a');
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', function() {
            this.style.backgroundColor = 'rgba(213, 34, 43, 0.1)';
            this.style.borderLeft = '3px solid #D5222B';
        });
        
        link.addEventListener('mouseleave', function() {
            this.style.backgroundColor = '';
            this.style.borderLeft = '';
        });
    });
    
    // Style action buttons with PataBima theme
    const actionButtons = document.querySelectorAll('.button, input[type="submit"]');
    actionButtons.forEach(button => {
        if (!button.classList.contains('cancel-link')) {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 4px 8px rgba(213, 34, 43, 0.2)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
        }
    });
    
    // Add PataBima footer branding if it doesn't exist
    const footer = document.querySelector('#footer');
    if (footer) {
        footer.style.borderTop = '3px solid #D5222B';
        if (!footer.querySelector('.patabima-footer')) {
            const footerBranding = document.createElement('div');
            footerBranding.className = 'patabima-footer';
            footerBranding.style.textAlign = 'center';
            footerBranding.style.color = '#666';
            footerBranding.style.fontSize = '12px';
            footerBranding.style.marginTop = '10px';
            footerBranding.innerHTML = '© 2025 PataBima Insurance - Administrative Dashboard';
            footer.appendChild(footerBranding);
        }
    }
});

// Add custom CSS for enhanced red theme
const style = document.createElement('style');
style.textContent = `
    /* Enhanced red theme animations */
    .button, input[type="submit"] {
        transition: all 0.2s ease;
    }
    
    .module h2 {
        background: linear-gradient(135deg, #D5222B 0%, #cc1e26 100%) !important;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.2) !important;
    }
    
    .results th a:link, .results th a:visited {
        color: #D5222B !important;
    }
    
    .paginator .this-page {
        background: #D5222B !important;
        border-color: #D5222B !important;
    }
    
    .selector-chosen h2 {
        background: #D5222B !important;
    }
    
    /* Custom PataBima loading animation */
    .loading::after {
        border-top: 3px solid #D5222B !important;
    }
`;
document.head.appendChild(style);