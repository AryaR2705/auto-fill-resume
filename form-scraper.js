// Form scraping functions

// Function to get all form elements on the page
function getFormElements() {
  // Get all input elements that can be filled
  const inputSelectors = [
    'input[type="text"]',
    'input[type="email"]',
    'input[type="tel"]',
    'input[type="number"]',
    'input[type="password"]',
    'input[type="file"]',
    'textarea',
    'select',
    'input[type="radio"]',
    'input[type="checkbox"]'
  ];
  
  return Array.from(document.querySelectorAll(inputSelectors.join(',')));
}

// Get context information for a form element
function getElementContext(element) {
  let context = {
    type: element.tagName.toLowerCase(),
    inputType: element.type || '',
    id: element.id || '',
    name: element.name || '',
    className: element.className || '',
    placeholder: element.placeholder || '',
    value: element.value || '',
    accept: element.accept || '',
    label: '',
    required: element.required || false,
    options: []
  };
  
  // Get associated label
  let label = null;
  
  // Try to find label by for attribute
  if (element.id) {
    label = document.querySelector(`label[for="${element.id}"]`);
  }
  
  // Try to find parent label
  if (!label) {
    let parent = element.parentElement;
    while (parent && parent.tagName !== 'FORM') {
      if (parent.tagName === 'LABEL') {
        label = parent;
        break;
      }
      parent = parent.parentElement;
    }
  }
  
  // Get label text
  if (label) {
    context.label = label.textContent.trim();
  }
  
  // Get nearby text nodes for additional context
  context.surroundingText = getSurroundingText(element);
  
  // Get all attributes
  context.attributes = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    context.attributes[attr.name] = attr.value;
  }
  
  // For select elements, get options
  if (element.tagName.toLowerCase() === 'select') {
    context.options = Array.from(element.options).map(option => ({
      value: option.value,
      text: option.text
    }));
  }
  
  // For radio buttons and checkboxes, get related elements in the same group
  if ((element.type === 'radio' || element.type === 'checkbox') && element.name) {
    const relatedElements = document.querySelectorAll(`input[type="${element.type}"][name="${element.name}"]`);
    context.options = Array.from(relatedElements).map(el => {
      const relatedLabel = document.querySelector(`label[for="${el.id}"]`) || 
                          el.parentElement.tagName === 'LABEL' ? el.parentElement : null;
      return {
        value: el.value,
        text: relatedLabel ? relatedLabel.textContent.trim() : ''
      };
    });
  }
  
  // Add dropdown & date picker scraping
  const formOptions = scrapeFormOptions();
  
  // Try to match this element with scraped dropdown or date picker options
  if (element.id || element.name) {
    const elementIdentifier = element.id || element.name;
    const matchingOption = formOptions.find(option => 
      option.field.toLowerCase().includes(elementIdentifier.toLowerCase()) ||
      elementIdentifier.toLowerCase().includes(option.field.toLowerCase())
    );
    
    if (matchingOption && matchingOption.options) {
      context.scrapedOptions = matchingOption.options;
    }
  }
  
  return context;
}

// Get text surrounding an element for better context
function getSurroundingText(element) {
  const parent = element.parentElement;
  if (!parent) return '';
  
  // Clone parent to avoid modifying the actual DOM
  const clone = parent.cloneNode(true);
  
  // Remove all inputs, selects, and textareas from the clone
  const inputElements = clone.querySelectorAll('input, select, textarea, button, script, style');
  inputElements.forEach(el => el.remove());
  
  // Get the text content
  return clone.textContent.trim().replace(/\s+/g, ' ').substring(0, 200);
}

// Check if an element is for photo upload
function isPhotoField(context) {
  const lowerLabel = (context.label || '').toLowerCase();
  const lowerName = (context.name || '').toLowerCase();
  const lowerId = (context.id || '').toLowerCase();
  const lowerClass = (context.className || '').toLowerCase();
  const lowerPlaceholder = (context.placeholder || '').toLowerCase();
  const lowerSurrounding = (context.surroundingText || '').toLowerCase();
  
  const photoKeywords = [
    'photo', 'picture', 'profile pic', 'profile image', 'avatar', 
    'profile photo', 'user image', 'user photo', 'portrait', 
    'display picture', 'dp', 'image', 'profile picture', 'headshot'
  ];
  
  // Check if the accept attribute includes image types
  const acceptsImages = (context.accept || '').includes('image');
  
  // Check if any of the relevant text fields contain photo-related keywords
  const containsPhotoKeyword = photoKeywords.some(keyword => 
    lowerLabel.includes(keyword) || 
    lowerName.includes(keyword) || 
    lowerId.includes(keyword) || 
    lowerClass.includes(keyword) || 
    lowerPlaceholder.includes(keyword) || 
    lowerSurrounding.includes(keyword)
  );
  
  return (acceptsImages && containsPhotoKeyword) || 
         (containsPhotoKeyword && context.inputType === 'file');
}

// Check if an element is for resume upload
function isResumeField(context) {
  const lowerLabel = (context.label || '').toLowerCase();
  const lowerName = (context.name || '').toLowerCase();
  const lowerId = (context.id || '').toLowerCase();
  const lowerClass = (context.className || '').toLowerCase();
  const lowerPlaceholder = (context.placeholder || '').toLowerCase();
  const lowerSurrounding = (context.surroundingText || '').toLowerCase();
  
  const resumeKeywords = [
    'resume', 'cv', 'curriculum vitae', 'resume/cv', 'cv/resume',
    'attach resume', 'upload resume', 'upload cv', 'document', 
    'cover letter', 'job application', 'application'
  ];
  
  // Check if the accept attribute includes PDF types
  const acceptsPdf = (context.accept || '').includes('pdf') || 
                     (context.accept || '').includes('application');
  
  // Check if any of the relevant text fields contain resume-related keywords
  const containsResumeKeyword = resumeKeywords.some(keyword => 
    lowerLabel.includes(keyword) || 
    lowerName.includes(keyword) || 
    lowerId.includes(keyword) || 
    lowerClass.includes(keyword) || 
    lowerPlaceholder.includes(keyword) || 
    lowerSurrounding.includes(keyword)
  );
  
  return (acceptsPdf && containsResumeKeyword) || 
         (containsResumeKeyword && context.inputType === 'file');
}

// Scrape all dropdown and date selection options from the page
function scrapeFormOptions() {
  const formOptions = [];

  // 1. Native <select> dropdowns
  const nativeDropdowns = document.querySelectorAll('select');
  nativeDropdowns.forEach(select => {
    const label =
      document.querySelector(`label[for="${select.id}"]`)?.innerText ||
      select.name ||
      select.id ||
      'Unnamed Select';

    const options = Array.from(select.options)
      .map(opt => opt.textContent.trim())
      .filter(opt => opt.length > 0);

    formOptions.push({ field: label, options });
  });

  // 2. Custom dropdowns (with role="listbox" or class selectors)
  const customDropdowns = document.querySelectorAll('[role="listbox"], .custom-dropdown, .dropdown');
  customDropdowns.forEach(dropdown => {
    const label =
      dropdown.getAttribute('aria-label') ||
      dropdown.getAttribute('data-label') ||
      'Custom Dropdown';

    const items = dropdown.querySelectorAll('[role="option"], .dropdown-item, li');
    const options = Array.from(items)
      .map(item => item.textContent.trim())
      .filter(opt => opt.length > 0);

    if (options.length > 0) {
      formOptions.push({ field: label, options });
    }
  });

  // 3. Date of Birth Fields (Day / Month / Year dropdowns or date inputs)
  const dob = {
    day: Array.from(document.querySelectorAll('select[name*="day"], select[id*="day"]')).map(s =>
      Array.from(s.options).map(o => o.textContent.trim())
    ).flat(),
    month: Array.from(document.querySelectorAll('select[name*="month"], select[id*="month"]')).map(s =>
      Array.from(s.options).map(o => o.textContent.trim())
    ).flat(),
    year: Array.from(document.querySelectorAll('select[name*="year"], select[id*="year"]')).map(s =>
      Array.from(s.options).map(o => o.textContent.trim())
    ).flat()
  };

  if (dob.day.length || dob.month.length || dob.year.length) {
    formOptions.push({
      field: 'Date of Birth',
      options: {
        day: [...new Set(dob.day)],
        month: [...new Set(dob.month)],
        year: [...new Set(dob.year)],
      }
    });
  }

  // 4. <input type="date"> or calendar popup
  const dateInputs = document.querySelectorAll('input[type="date"], input[name*="dob"], input[id*="dob"]');
  dateInputs.forEach(input => {
    const label =
      document.querySelector(`label[for="${input.id}"]`)?.innerText ||
      input.name ||
      input.id ||
      'Date Picker';

    formOptions.push({ field: label, type: 'date' });
  });

  return formOptions;
}