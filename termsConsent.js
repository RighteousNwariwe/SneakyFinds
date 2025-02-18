document.addEventListener('DOMContentLoaded', function () {
  const termsConsent = document.getElementById('termsConsent');
  const acceptButton = document.getElementById('acceptTerms') || document.getElementById('acceptTsAndCs');
  
  // Check if terms have been accepted globally
  if (localStorage.getItem('termsAccepted') === 'true') {
    if (termsConsent) {
      termsConsent.style.display = 'none';
    }
    return; // Exit early if terms are already accepted
  }

  // Show terms if not accepted
  if (termsConsent) {
    termsConsent.style.display = 'block';
  }

  if (acceptButton) {
    acceptButton.addEventListener('click', function () {
      // Save the acceptance data with timestamp and details
      const acceptanceData = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        page: window.location.pathname
      };
      
      // Save detailed acceptance data
      localStorage.setItem('termsAcceptanceDetails', JSON.stringify(acceptanceData));
      // Set global acceptance flag
      localStorage.setItem('termsAccepted', 'true');
      
      if (termsConsent) {
        termsConsent.style.display = 'none';
      }
    });
  }
});

// Helper function to check if terms are accepted
function hasAcceptedTerms() {
  return localStorage.getItem('termsAccepted') === 'true';
}

// Function to get acceptance details if needed
function getAcceptanceDetails() {
  const details = localStorage.getItem('termsAcceptanceDetails');
  return details ? JSON.parse(details) : null;
}

// Function to check and display terms acceptance status
function checkTermsAcceptance() {
  const accepted = hasAcceptedTerms();
  const details = getAcceptanceDetails();
  
  if (accepted && details) {
    const acceptanceDate = new Date(details.timestamp);
    const formattedDate = acceptanceDate.toLocaleString();
    
    console.log('Terms and Conditions Status:');
    console.log('Accepted:', accepted);
    console.log('Acceptance Date:', formattedDate);
    console.log('Accepted on Page:', details.page);
    
    return {
      accepted: true,
      date: formattedDate,
      page: details.page,
      details: details
    };
  } else {
    console.log('Terms and Conditions have not been accepted yet.');
    return {
      accepted: false,
      details: null
    };
  }
}

// Function to clear terms acceptance (for testing or admin purposes)
function clearTermsAcceptance() {
  localStorage.removeItem('termsAccepted');
  localStorage.removeItem('termsAcceptanceDetails');
  console.log('Terms acceptance has been cleared.');
  
  // Refresh the page to show terms again
  window.location.reload();
}

/* Uncomment and implement if you want to send data to server
function sendAcceptanceToServer(acceptanceData) {
  fetch('/api/terms-acceptance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(acceptanceData)
  })
  .then(response => response.json())
  .then(data => console.log('Success:', data))
  .catch(error => console.error('Error:', error));
}
*/
