document.addEventListener('DOMContentLoaded', function() {
  const termsConsent = document.getElementById('termsConsent');
  const acceptButton = document.getElementById('acceptTsAndCs');

  // Check if the user has already accepted the terms and conditions
  if (localStorage.getItem('termsAccepted') === 'true') {
    termsConsent.style.display = 'none';
  }

  // Handle the accept button click event
  acceptButton.addEventListener('click', function() {
    localStorage.setItem('termsAccepted', 'true');
    termsConsent.style.display = 'none';
  });
});

// Example function to check if a user has accepted the terms
function hasUserAcceptedTerms(userId) {
  return localStorage.getItem('termsAccepted_' + userId) === 'true';
}

// Usage
var userId = 'user123'; // Replace with actual user ID
if (hasUserAcceptedTerms(userId)) {
  console.log('User has accepted the terms and conditions.');
} else {
  console.log('User has not accepted the terms and conditions.');
}