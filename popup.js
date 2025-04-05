document.getElementById('fill-form-btn').addEventListener('click', function() {
  const status = document.getElementById('status');
  status.textContent = 'Filling form...';
  
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {action: 'fillForm'}, function(response) {
      if (response && response.success) {
        status.textContent = response.message;
      } else {
        status.textContent = 'Error: ' + (response ? response.message : 'Unknown error occurred');
      }
    });
  });
});