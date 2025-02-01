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