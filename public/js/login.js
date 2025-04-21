document.addEventListener('DOMContentLoaded', function() {
  // Validation and Error Modal Script
  document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    let valid = true;

    // Reset error messages
    document.getElementById('usernameError').classList.add('hidden');
    document.getElementById('passwordError').classList.add('hidden');

    // Check for empty fields
    if (!username) {
      document.getElementById('usernameError').classList.remove('hidden');
      valid = false;
    }
    if (!password) {
      document.getElementById('passwordError').classList.remove('hidden');
      valid = false;
    }

    if (!valid) {
      showErrorModal('Please fill out all required fields.');
    } else {
      // Proceed with form submission (e.g., via AJAX or standard form submission)
      this.submit();
    }
  });

  function showErrorModal(message) {
    document.getElementById('errorMessage').innerText = message;
    document.getElementById('errorModal').classList.remove('hidden');
  }

  function closeErrorModal() {
    document.getElementById('errorModal').classList.add('hidden');
  }

  // Expose closeErrorModal to the global scope
  window.closeErrorModal = closeErrorModal;
});
