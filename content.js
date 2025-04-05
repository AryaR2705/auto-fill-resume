// Main content script for the extension

// Handle file input elements
async function handleFileInput(element, context) {
  // Check if this is a photo/profile picture upload
  const isPhotoUpload = isPhotoField(context);
  const isResumeUpload = isResumeField(context);
  
  // Skip if we don't recognize the type
  if (!isPhotoUpload && !isResumeUpload) {
    console.log("Unrecognized file upload field:", context);
    return false;
  }
  
  // Get the appropriate file path
  const filePath = isPhotoUpload ? FILE_PATHS.photo : FILE_PATHS.resume;
  
  // Create a small notification near the file input
  const notification = document.createElement('div');
  notification.textContent = `📂 Please select ${filePath} for this field`;
  notification.style.backgroundColor = '#FFF3CD';
  notification.style.color = '#856404';
  notification.style.padding = '5px 10px';
  notification.style.borderRadius = '4px';
  notification.style.marginTop = '5px';
  notification.style.marginBottom = '5px';
  notification.style.fontWeight = 'bold';
  notification.style.border = '1px solid #FFEEBA';
  notification.style.fontSize = '12px';
  
  // Insert notification after the element
  element.parentNode.insertBefore(notification, element.nextSibling);
  
  // Highlight the file input
  const originalStyle = element.style.cssText;
  element.style.border = '2px solid #FF9800';
  element.style.boxShadow = '0 0 5px rgba(255, 152, 0, 0.5)';
  
  // Remove notification after some time
  setTimeout(() => {
    notification.remove();
    element.style.cssText = originalStyle;
  }, 10000); // 10 seconds
  
  return true;
}

// Fill a form element with the provided value
function fillElement(element, value) {
  const tagName = element.tagName.toLowerCase();
  const type = element.type ? element.type.toLowerCase() : '';
  
  // For text, email, number, etc. inputs and textareas
  if ((tagName === 'input' && ['text', 'email', 'tel', 'number', 'password', 'search', 'url'].includes(type)) || 
      tagName === 'textarea') {
    element.value = value;
    triggerEvent(element, 'input');
    triggerEvent(element, 'change');
    triggerEvent(element, 'blur');
  }
  // For select elements
  else if (tagName === 'select') {
    // Try to find an option that matches the value
    let matched = false;
    for (let i = 0; i < element.options.length; i++) {
      const option = element.options[i];
      if (option.text.toLowerCase().includes(value.toLowerCase()) || 
          option.value.toLowerCase().includes(value.toLowerCase())) {
        element.selectedIndex = i;
        matched = true;
        break;
      }
    }
    
    // If no match, try to select the most appropriate option
    if (!matched && element.options.length > 0) {
      // Skip the first option if it's a placeholder
      const startIndex = element.options[0].text.includes('Select') || 
                         element.options[0].text.includes('Choose') || 
                         element.options[0].value === '' ? 1 : 0;
      
      if (startIndex < element.options.length) {
        element.selectedIndex = startIndex;
      }
    }
    
    triggerEvent(element, 'change');
    triggerEvent(element, 'blur');
  }
  // For checkboxes and radio buttons
  else if (tagName === 'input' && (type === 'checkbox' || type === 'radio')) {
    const shouldCheck = value.toLowerCase().includes('check') || 
                       value.toLowerCase() === 'yes' || 
                       value.toLowerCase() === 'true';
    
    element.checked = shouldCheck;
    triggerEvent(element, 'click');
    triggerEvent(element, 'change');
  }
  // For date inputs
  else if (tagName === 'input' && type === 'date') {
    // Try to convert value to a date format
    try {
      // Check if value is already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        element.value = value;
      } else {
        // Try to parse the date
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          // Format as YYYY-MM-DD for input[type="date"]
          const yyyy = date.getFullYear();
          const mm = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          element.value = `${yyyy}-${mm}-${dd}`;
        }
      }
      triggerEvent(element, 'input');
      triggerEvent(element, 'change');
      triggerEvent(element, 'blur');
    } catch (e) {
      console.error("Error setting date value:", e);
    }
  }
}

// Fill form elements using Gemini API
async function fillFormWithGemini() {
  const elements = getFormElements();
  let filled = 0;
  
  // First, scrape all form options to get context for dropdowns and selectors
  const formOptions = scrapeFormOptions();
  console.log("Scraped form options:", formOptions);
  
  // Add a small delay between API calls to avoid rate limiting
  for (const element of elements) {
    try {
      // Skip elements that are already filled or are hidden
      if ((element.value && element.type !== 'checkbox' && element.type !== 'radio' && element.type !== 'file') || 
          element.style.display === 'none' || 
          element.style.visibility === 'hidden' ||
          !isElementVisible(element)) {
        continue;
      }
      
      const context = getElementContext(element);
      
      // Handle file inputs separately
      if (element.type === 'file') {
        const fileSuccess = await handleFileInput(element, context);
        if (fileSuccess) {
          filled++;
        }
        continue;
      }
      
      const value = await getValueFromGemini(context);
      
      if (value) {
        fillElement(element, value);
        filled++;
      }
      
      // Add a small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error filling element:', error);
    }
  }
  
  // Show a notification
  showNotification(`Successfully filled ${filled} form fields`);
  
  return filled;
}

// Initialize extension
function initialize() {
  // Add the floating button
  addFloatingButton(fillFormWithGemini);
  
  // Listen for messages from the popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'fillForm') {
      fillFormWithGemini()
        .then(filledCount => {
          sendResponse({ success: true, message: `Filled ${filledCount} elements` });
        })
        .catch(error => {
          sendResponse({ success: false, message: error.message });
        });
      return true; // Keep the messaging channel open for the async response
    }
  });
}

// Initialize when the page loads
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initialize();
} else {
  window.addEventListener('load', initialize);
}

