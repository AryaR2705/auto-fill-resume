// Utility functions for the extension

// Check if an element is visible on the page
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  // Check if element has zero size
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }
  
  return true;
}

// Show a notification
function showNotification(message) {
  const notification = document.createElement('div');
  notification.innerText = message;
  notification.style.position = 'fixed';
  notification.style.top = '20px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.padding = '10px 20px';
  notification.style.backgroundColor = '#4285f4';
  notification.style.color = 'white';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '10001';
  notification.style.fontFamily = 'Arial, sans-serif';
  notification.style.fontWeight = 'bold';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    setTimeout(() => {
      notification.remove();
    }, 500);
  }, 3000);
}

// Trigger an event on an element
function triggerEvent(element, eventType) {
  const event = new Event(eventType, { bubbles: true });
  element.dispatchEvent(event);
}

// Add a floating button to the page
function addFloatingButton(clickHandler) {
  // Check if button already exists
  if (document.getElementById('smart-autofill-btn')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'smart-autofill-btn';
  button.innerText = 'Auto-Fill Form';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '10000';
  button.style.padding = '10px 15px';
  button.style.backgroundColor = '#4285f4';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.fontWeight = 'bold';
  button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  button.addEventListener('click', clickHandler);
  
  document.body.appendChild(button);
}

// File paths for uploads (simplified)
const FILE_PATHS = {
  photo: "/path/to/photo.png",
  resume: "/path/to/resume.pdf"
};