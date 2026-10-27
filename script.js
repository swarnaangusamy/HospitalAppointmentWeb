const testButton = document.getElementById("test-api-button");
const apiStatus = document.getElementById("api-status");

// Test the backend by submitting a sample appointment
testButton.addEventListener("click", testAppointmentAPI);

async function testAppointmentAPI() {
  testButton.disabled = true;
  apiStatus.textContent = "Connecting to backend...";

  try {
    const response = await fetch("http://localhost:3000/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        patientName: "Website Test Patient",
        department: "Cardiology",
        appointmentDate: "2026-10-25",
        appointmentTime: "10:00 AM"
      })
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || "Backend request failed.");
    }

    apiStatus.textContent =
      "Success! The backend received the test appointment. " +
      "Appointment ID: " + (result.appointment?.id ?? "not returned");

    console.log("Backend response:", result);
  } catch (error) {
    apiStatus.textContent =
      "Could not connect: " + error.message +
      ". Check that the backend is running on port 3000.";

    console.error("API request failed:", error);
  } finally {
    testButton.disabled = false;
  }
}

// Listen for Dialogflow Messenger events
window.addEventListener("df-messenger-loaded", () => {
  const messenger = document.querySelector("df-messenger");

  if (!messenger) {
    console.error("Dialogflow Messenger element was not found.");
    return;
  }

  // Log messages typed by the user
  messenger.addEventListener("df-user-input-entered", (event) => {
    console.log("Dialogflow user input:", event.detail);
  });

  // Log Dialogflow's response
  messenger.addEventListener("df-response-received", (event) => {
    console.log("Dialogflow response:", event.detail);
  });

  // Log Messenger errors
  messenger.addEventListener("df-messenger-error", (event) => {
    console.error("Dialogflow Messenger error:", event.detail);
  });

  console.log("Dialogflow Messenger loaded.");
});