# Contact Form Design Document

**Date:** 2025-11-25
**Feature:** Contact Form with Tag Selection
**Status:** Approved for Implementation

## Overview

A contact form for Cool Studio's landing page that allows users to submit inquiries with name, email, message, and two categories of tag selections (service interest and project vibe).

## Requirements

### Functional Requirements
- Text input fields: Name, Email, Message (textarea)
- Two tag selection groups:
  - **Services:** Marketing, Music, Video, Website
  - **Vibes:** Cool, Amazing, Creative, Bold
- User can select one tag from each group
- Selecting a new tag replaces the previous selection in that group
- Form validation (required fields)
- Submit button with form data collection

### Design Requirements
- White borders on all form elements
- Poppins typography (project standard)
- Submit button color: `$pastile-purple (#7c4aa8)`
- Clickable tag pill UI pattern
- Responsive layout
- Matches retro/gaming aesthetic of the site

## Architecture

### Approach: Pure CSS + Vanilla JS (Minimal)

Following the project's existing patterns with no new dependencies.

**Components:**
1. HTML form structure in `src/index.html`
2. Styles in `src/assets/styles/contact-us.scss`
3. JavaScript logic added to `src/assets/js/app.js`

## HTML Structure

```html
<section id="contact-us">
  <div id="contact-us__wrapper">
    <div class="contact-us__container content-container">
      <h2 class="contact-us__title">Get In Touch</h2>

      <form class="contact-form" id="contactForm">
        <!-- Text Inputs -->
        <div class="form-group">
          <input type="text" id="name" name="name" placeholder="Your Name" required>
        </div>

        <div class="form-group">
          <input type="email" id="email" name="email" placeholder="Your Email" required>
        </div>

        <div class="form-group">
          <textarea id="message" name="message" rows="5" placeholder="Your Message" required></textarea>
        </div>

        <!-- Tag Selection: Services -->
        <div class="tag-group">
          <label class="tag-group__label">What service interests you?</label>
          <div class="tag-pills">
            <button type="button" class="tag-pill" data-group="service" data-value="marketing">Marketing</button>
            <button type="button" class="tag-pill" data-group="service" data-value="music">Music</button>
            <button type="button" class="tag-pill" data-group="service" data-value="video">Video</button>
            <button type="button" class="tag-pill" data-group="service" data-value="website">Website</button>
          </div>
          <input type="hidden" name="service" id="serviceInput">
        </div>

        <!-- Tag Selection: Adjectives -->
        <div class="tag-group">
          <label class="tag-group__label">Describe your project vibe:</label>
          <div class="tag-pills">
            <button type="button" class="tag-pill" data-group="vibe" data-value="cool">Cool</button>
            <button type="button" class="tag-pill" data-group="vibe" data-value="amazing">Amazing</button>
            <button type="button" class="tag-pill" data-group="vibe" data-value="creative">Creative</button>
            <button type="button" class="tag-pill" data-group="vibe" data-value="bold">Bold</button>
          </div>
          <input type="hidden" name="vibe" id="vibeInput">
        </div>

        <button type="submit" class="contact-form__submit">Send Message</button>
      </form>
    </div>
  </div>
</section>
```

### Key HTML Decisions
- `data-group` attribute distinguishes between tag groups
- `data-value` stores the tag value
- Hidden inputs (`serviceInput`, `vibeInput`) store selected values for form submission
- `type="button"` on tag pills prevents accidental form submission
- Semantic HTML with proper form structure and labels

## Styling (SCSS)

### Color Palette
- Primary background: `$retro-orange (#e56e2e)` (already set on wrapper)
- Borders: White (`#fff`)
- Text: White for labels/placeholders, dark for filled inputs
- Submit button: `$pastile-purple (#7c4aa8)`
- Active tag: White background with dark text

### Form Elements

**Text Inputs & Textarea:**
```scss
.form-group {
  input, textarea {
    width: 100%;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.3);
    border: 2px solid #fff;
    color: #fff;
    font-family: 'Poppins', sans-serif;
    border-radius: 8px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    &:focus {
      outline: none;
      border-width: 3px;
    }
  }
}
```

**Tag Pills:**
```scss
.tag-pill {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: 2px solid #fff;
  border-radius: 25px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
  }

  &.active {
    background: #fff;
    color: $font-dark;
  }
}
```

**Submit Button:**
```scss
.contact-form__submit {
  background: $pastile-purple;
  color: #fff;
  border: 2px solid #fff;
  padding: 1rem 3rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1.125rem;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(124, 74, 168, 0.4);
  }
}
```

### Responsive Layout
- **Mobile (<768px):** Single column, full-width inputs, stacked tag pills
- **Tablet+ (≥768px):** Tag pills in flexible row layout (wrapping)
- **Desktop (≥1024px):** Contained form with max-width, centered

## JavaScript Logic

Added to `src/assets/js/app.js`:

```javascript
// Contact Form Tag Selection
document.addEventListener('DOMContentLoaded', () => {
  const tagPills = document.querySelectorAll('.tag-pill');

  tagPills.forEach(pill => {
    pill.addEventListener('click', function() {
      const group = this.getAttribute('data-group');
      const value = this.getAttribute('data-value');

      // Remove active class from all pills in same group
      document.querySelectorAll(`.tag-pill[data-group="${group}"]`)
        .forEach(p => p.classList.remove('active'));

      // Add active class to clicked pill
      this.classList.add('active');

      // Update hidden input value
      document.getElementById(`${group}Input`).value = value;
    });
  });

  // Form submission handler
  document.getElementById('contactForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      message: document.getElementById('message').value,
      service: document.getElementById('serviceInput').value,
      vibe: document.getElementById('vibeInput').value
    };

    console.log('Form submitted:', formData);
    // TODO: Add actual form submission logic (API call, email service, etc.)
    alert('Form submitted! Check console for data.');
  });
});
```

### Logic Flow
1. **Tag Selection:**
   - User clicks tag pill
   - Get `data-group` and `data-value` from clicked element
   - Find all pills in same group via selector
   - Remove `active` class from all pills in group
   - Add `active` class to clicked pill
   - Update corresponding hidden input value

2. **Form Submission:**
   - Prevent default form submission
   - Collect values from all inputs (text + hidden)
   - Log to console (placeholder for backend integration)
   - Show confirmation alert

### Pattern Consistency
This follows the same event-driven pattern used in player selection (`injector.js:78-110`):
- Click event listeners
- Data attributes for identification
- Class toggling for active states
- DOM querying and manipulation

## Implementation Notes

### Files to Modify
1. `src/index.html` - Replace existing contact-us section (lines 576-583)
2. `src/assets/styles/contact-us.scss` - Add complete form styles
3. `src/assets/js/app.js` - Add tag selection and form submission logic

### Tag Lists (Configurable)
Current placeholder lists:
- **Services:** Marketing, Music, Video, Website
- **Vibes:** Cool, Amazing, Creative, Bold

To modify: Update HTML button elements in both `.tag-pills` containers.

### Future Enhancements
- Backend integration (email API, database storage)
- Real-time validation feedback
- Success/error state animations
- Additional tag categories
- File upload capability
- ReCAPTCHA integration

## Testing Checklist
- [ ] Form renders correctly on mobile, tablet, desktop
- [ ] All inputs have white borders
- [ ] Poppins font applies to all form elements
- [ ] Tag pills toggle active state on click
- [ ] Only one tag per group can be selected at a time
- [ ] Selecting new tag replaces previous selection
- [ ] Hidden inputs update with tag values
- [ ] Form submission collects all data correctly
- [ ] Submit button uses pastile-purple color
- [ ] Required field validation works
- [ ] Hover states work on all interactive elements

## Accessibility Considerations
- Semantic HTML form structure
- Proper label associations
- Keyboard navigation support (tab order)
- Focus states on all interactive elements
- ARIA attributes for tag selection groups (future enhancement)
- Color contrast meets WCAG AA standards

## Design System Integration
- Uses existing color variables from `base.scss`
- Follows BEM naming convention (`.contact-form__submit`)
- Responsive breakpoints match site patterns
- Typography uses project standard (Poppins)
- Matches retro/gaming aesthetic with bold borders and vibrant colors
