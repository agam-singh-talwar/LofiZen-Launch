document
  .getElementById("waitlist-form")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const emailInput = document.getElementById("email");
    const email = emailInput.value;
    const button = this.querySelector("button");

    // Simple email validation
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      alert("Please enter a valid email address.");
      return;
    }

    // Disable button during submission
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = "Submitting...";

    fetch("/api/join-waitlist", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email }),
    })
      .then((response) => {
        // console.log("Response status:", response.status);
        // console.log("Response headers:", response.headers);

        if (!response.ok) {
          // Try to parse error response
          return response.text().then((text) => {
            // console.error("Error response text:", text);
            try {
              return JSON.parse(text);
            } catch (e) {
              throw new Error(`HTTP ${response.status}: ${text}`);
            }
          });
        }

        return response.json();
      })
      .then((data) => {
        // console.log("Response data:", data);

        if (data.success) {
          button.textContent = "Thanks for joining!";
          button.disabled = true;
          emailInput.disabled = true;
        } else {
          alert("Error: " + (data.message || "Something went wrong"));
          button.textContent = originalText;
          button.disabled = false;
        }
      })
      .catch((error) => {
        // console.error("Fetch error:", error);
        alert("Error: " + error.message);
        button.textContent = originalText;
        button.disabled = false;
      });
  });
