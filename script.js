document.getElementById('waitlist-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const email = emailInput.value;
    const button = this.querySelector('button');

    // Simple email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    fetch('/join-waitlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            button.textContent = 'Thanks for joining!';
            button.disabled = true;
            emailInput.disabled = true;
        } else {
            alert('Something went wrong. Please try again.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Something went wrong. Please try again.');
    });
});
